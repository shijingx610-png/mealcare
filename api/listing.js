// Vercel Serverless Function — メルカリ出品情報の自動生成
// 商品写真（複数枚可）を Claude に渡し、タイトル / 説明文 / カテゴリ / 状態 /
// 相場価格 / 配送方法 を構造化 JSON で返す。
// 必要な環境変数: ANTHROPIC_API_KEY

import Anthropic from '@anthropic-ai/sdk';

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' }
  }
};

var MAX_IMAGES = 6;
var MAX_TOTAL_BASE64 = 3.5 * 1024 * 1024; // Vercel のリクエスト上限に余裕を持たせる
var ALLOWED_MEDIA = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export var CONDITIONS = [
  '新品、未使用',
  '未使用に近い',
  '目立った傷や汚れなし',
  'やや傷や汚れあり',
  '傷や汚れあり',
  '全体的に状態が悪い'
];

// src/mercari/shipping.js の ID と対応させること
export var SHIPPING_IDS = [
  'nekopos',
  'yu_packet',
  'yu_packet_post',
  'compact',
  'yu_packet_plus',
  'takkyubin60',
  'takkyubin80',
  'takkyubin100',
  'yu_pack60',
  'yu_pack80',
  'yu_pack100',
  'large'
];

var LISTING_SCHEMA = {
  type: 'object',
  properties: {
    itemName: { type: 'string', description: '商品の一般名称（例: ナイキ エアフォース1 ロー）' },
    title: { type: 'string', description: 'メルカリの商品名欄にそのまま入れる文字列。40文字以内。' },
    brand: { type: 'string', description: '判別できない場合は空文字' },
    categoryPath: { type: 'string', description: 'メルカリのカテゴリ階層を > 区切りで' },
    size: { type: 'string', description: '不明なら空文字' },
    color: { type: 'string' },
    condition: { type: 'string', enum: CONDITIONS },
    conditionReason: { type: 'string', description: 'その状態と判断した写真上の根拠' },
    features: { type: 'array', items: { type: 'string' }, description: 'アピールポイント 2〜4個' },
    flaws: { type: 'array', items: { type: 'string' }, description: '写真から読み取れる傷・汚れ・使用感。無ければ空配列' },
    descriptionBody: { type: 'string', description: '商品説明の本文。2〜4文。見出しや箇条書き記号は入れない。' },
    hashtags: { type: 'array', items: { type: 'string' }, description: '#付きの検索用タグ 3〜6個' },
    priceMin: { type: 'integer', description: '相場の下限（円）。300以上。' },
    priceMax: { type: 'integer', description: '相場の上限（円）' },
    priceRecommended: { type: 'integer', description: '最初に付ける推奨価格（円）' },
    priceReason: { type: 'string', description: '価格の根拠を1〜2文で' },
    shippingId: { type: 'string', enum: SHIPPING_IDS },
    estimatedSize: { type: 'string', description: '梱包後のおおよそのサイズ・重さ' },
    photoAdvice: { type: 'array', items: { type: 'string' }, description: '追加で撮ると売れやすくなる写真 1〜3個' },
    questions: { type: 'array', items: { type: 'string' }, description: '写真だけでは分からず出品者に確認したいこと 0〜3個' },
    policyWarning: { type: 'string', description: 'メルカリの禁止出品物・規約に触れる可能性がある場合のみ理由を書く。問題なければ空文字。' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
  },
  required: [
    'itemName', 'title', 'brand', 'categoryPath', 'size', 'color',
    'condition', 'conditionReason', 'features', 'flaws', 'descriptionBody',
    'hashtags', 'priceMin', 'priceMax', 'priceRecommended', 'priceReason',
    'shippingId', 'estimatedSize', 'photoAdvice', 'questions',
    'policyWarning', 'confidence'
  ],
  additionalProperties: false
};

var SYSTEM_PROMPT = [
  'あなたは日本のフリマアプリ「メルカリ」で数千件の販売実績を持つ出品代行のプロです。',
  '商品写真から、そのまま出品できる商品情報一式を作成します。',
  '',
  '# ルール',
  '1. 写真に写っている「売る対象の商品」を特定する。背景や小物は無視する。',
  '2. タイトルは40文字以内。検索されやすい語（ブランド・商品名・型番・サイズ・色・キーワード）を前半に置く。記号の羅列や「即購入OK」などの煽り文句は入れない。',
  '3. ブランド名・型番・サイズは、写真のロゴやタグから読み取れる場合のみ記入する。読み取れない場合は空文字にし、questions に確認事項として入れる。推測で書かない。',
  '4. 状態は指定の6段階から選び、そう判断した写真上の根拠を conditionReason に書く。写真で見える傷・汚れ・毛玉・日焼け・スレは flaws に必ず正直に書く（隠すとトラブルになる）。',
  '5. 価格は日本のメルカリでの実際の売れ筋相場を基準にする。販売手数料10%と送料が引かれることを前提に、値下げ交渉の余地を200〜500円ほど含んだ現実的な金額にする。最低価格は300円。',
  '6. descriptionBody は敬体で2〜4文。誇大表現・断定できない情報（購入時期、正規品保証、未使用など）は書かない。',
  '7. 配送方法は商品の大きさと重さから、送料が最も安く済むものを選ぶ。',
  '8. メルカリで出品が禁止・制限されている可能性がある物（現金類、医薬品、たばこ、酒類、偽ブランドの疑い、チケットの一部など）の場合は policyWarning に理由を書く。',
  '9. 写真が不鮮明で商品を特定しきれない場合も、最も可能性が高い推定で全項目を埋め、confidence を low にして questions に確認事項を入れる。',
  '',
  '出力は指定されたJSONスキーマに厳密に従うこと。'
].join('\n');

function badRequest(res, message) {
  res.status(400).json({ error: message });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'サーバーにAPIキーが設定されていません（ANTHROPIC_API_KEY）' });
    return;
  }

  var body = req.body || {};
  var images = Array.isArray(body.images) ? body.images : [];
  var note = typeof body.note === 'string' ? body.note.slice(0, 500) : '';

  if (images.length === 0) return badRequest(res, '写真が送信されていません');
  if (images.length > MAX_IMAGES) return badRequest(res, '写真は' + MAX_IMAGES + '枚までです');

  var total = 0;
  var content = [];
  for (var i = 0; i < images.length; i++) {
    var img = images[i] || {};
    var mediaType = ALLOWED_MEDIA.indexOf(img.mediaType) >= 0 ? img.mediaType : 'image/jpeg';
    if (!img.base64 || typeof img.base64 !== 'string') return badRequest(res, '写真データが不正です');
    total += img.base64.length;
    if (total > MAX_TOTAL_BASE64) return badRequest(res, '写真の合計サイズが大きすぎます。枚数を減らしてください');
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: img.base64 }
    });
  }

  var userText = 'この商品をメルカリに出品します。写真は' + images.length + '枚';
  userText += images.length > 1 ? '（1枚目がメイン写真）です。' : 'です。';
  if (note) {
    userText += '\n\n出品者からの補足情報（写真より優先して信頼してよい情報です）:\n' + note;
  }
  userText += '\n\n出品に必要な情報一式を作成してください。';
  content.push({ type: 'text', text: userText });

  var client = new Anthropic({ apiKey: apiKey });

  try {
    var response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: content }],
      output_config: {
        format: { type: 'json_schema', schema: LISTING_SCHEMA }
      }
    });

    if (response.stop_reason === 'refusal') {
      res.status(422).json({ error: 'この写真の内容は解析できませんでした。別の商品写真をお試しください。' });
      return;
    }

    var text = '';
    for (var b = 0; b < response.content.length; b++) {
      if (response.content[b].type === 'text') text += response.content[b].text;
    }

    var listing;
    try {
      listing = JSON.parse(text);
    } catch (parseError) {
      console.error('[listing] JSON parse failed', parseError);
      res.status(502).json({ error: 'AIの応答を読み取れませんでした。もう一度お試しください。' });
      return;
    }

    res.status(200).json({ listing: listing });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      res.status(500).json({ error: 'APIキーが無効です。環境変数を確認してください。' });
      return;
    }
    if (error instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: '混み合っています。少し時間をおいてお試しください。' });
      return;
    }
    if (error instanceof Anthropic.BadRequestError) {
      res.status(400).json({ error: 'リクエストが不正です: ' + error.message });
      return;
    }
    if (error instanceof Anthropic.APIError) {
      res.status(502).json({ error: 'AIサービスでエラーが発生しました（' + error.status + '）' });
      return;
    }
    res.status(500).json({ error: '解析に失敗しました: ' + String(error && error.message ? error.message : error) });
  }
}
