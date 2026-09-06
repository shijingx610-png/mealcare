// Vercel Serverless Function — 写真から出品情報を作る（サーバー側でAIキーを持つ）
//
// このアプリを他の人に渡すための入口。利用者はキーを用意しなくてよく、
// 設置した人が用意した1つのキーを共有して使う。
//
// 環境変数:
//   GEMINI_API_KEY   必須。Google AI Studio の無料キー。
//   APP_PASSWORD     任意。設定すると、この合言葉を知っている人だけが使える。
//   DAILY_LIMIT      任意。1日あたりの生成回数の上限（既定 200）。
//   PER_MINUTE_LIMIT 任意。同じ回線からの1分あたりの上限（既定 8）。
//   GEMINI_BASE_URL  任意。テスト用に接続先を差し替える。

export const config = {
  api: {
    bodyParser: { sizeLimit: '10mb' }
  }
};

var MODEL = 'gemini-2.5-flash';
var MAX_IMAGES = 6;
var MAX_TOTAL_BASE64 = 4 * 1024 * 1024;
var MAX_MEMO = 500;
var WINDOW_MS = 60 * 1000;
var PER_IP_PER_MINUTE = Number(process.env.PER_MINUTE_LIMIT || 8);

// サーバーレスは入れ替わるため、これは「気休め」の抑制。
// 完全な制限が要るときは、外部のKVなどに置き換えること。
var hits = new Map();
var day = { key: '', count: 0 };

function clientIp(req) {
  var fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown';
}

function rateLimited(ip) {
  var now = Date.now();
  var rec = hits.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
  } else {
    rec.count += 1;
    if (rec.count > PER_IP_PER_MINUTE) return true;
  }
  if (hits.size > 500) hits.clear();
  return false;
}

function dailyExceeded() {
  var limit = Number(process.env.DAILY_LIMIT || 200);
  var today = new Date().toISOString().slice(0, 10);
  if (day.key !== today) day = { key: today, count: 0 };
  day.count += 1;
  return day.count > limit;
}

function passwordOk(given) {
  var expected = process.env.APP_PASSWORD || '';
  if (!expected) return true;
  var a = String(given || '');
  if (a.length !== expected.length) return false;
  var diff = 0;
  for (var i = 0; i < expected.length; i++) diff |= a.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

var SEARCH_PROMPT = [
  '添付した写真の商品を、Google検索を使って特定してください。フリマアプリに出品するための下調べです。',
  '',
  '調べること:',
  '1. 商品名・ブランド・型番（写真のロゴ、タグ、刻印、形状を手がかりに検索する）',
  '2. 新品の定価と発売時期',
  '3. メルカリやラクマでの中古の売れている価格帯（状態別に分かれば状態も）',
  '4. サイズや素材など、出品説明に書ける仕様',
  '5. その商品ならではの注意点（人気の色、偽物が多い、付属品の有無で価格が変わる等）',
  '',
  '特定できない場合は「特定できず」と書き、写真から読み取れる特徴だけを挙げてください。推測を事実のように書かないでください。',
  '日本語の箇条書きで、400文字以内にまとめてください。'
].join('\n');

var SHIPPING_IDS = [
  'nekopos', 'yu_packet', 'yu_packet_post', 'compact', 'yu_packet_plus',
  'takkyubin60', 'yu_pack60', 'takkyubin80', 'yu_pack80', 'takkyubin100', 'yu_pack100', 'large'
];

var LISTING_PROMPT = [
  'あなたは日本のフリマアプリ「メルカリ」で数千件の販売実績があるプロの出品代行です。',
  '添付の商品写真から、出品に必要な情報をJSONだけで返してください（前置き・説明・コードブロック記号は不要）。',
  '',
  '# ルール',
  '1. 写真に写っている売る対象の商品を特定する。背景や小物は無視する。',
  '2. titleは40文字以内。検索される語（ブランド・商品名・型番・サイズ・色）を前半に置く。煽り文句は入れない。',
  '3. ブランド・型番・サイズは写真や検索結果から確認できる場合のみ書く。分からない場合は空文字にし、questionsに確認事項として入れる。推測で断定しない。',
  '4. conditionは次の6つから選ぶ: 新品、未使用 / 未使用に近い / 目立った傷や汚れなし / やや傷や汚れあり / 傷や汚れあり / 全体的に状態が悪い',
  '5. 価格は日本のメルカリの実際の売れ筋相場を基準に。販売手数料10%と送料が引かれること、値下げ交渉の余地200〜500円を織り込む。最低300円。',
  '6. 出品が禁止・制限されている可能性がある物ならpolicyWarningに理由を書く。問題なければ空文字。',
  '',
  '# descriptionの書き方（最重要・この型を必ず守る）',
  'そのままメルカリの「商品の説明」に貼れる本文を1つにまとめて書く。',
  '見出しは【商品】【状態】【カラー】【サイズ】【素材】【発送について】の6つ。この順番と表記を必ず守る。',
  '',
  '【商品】',
  '1行目にブランド名（不明ならカタカナや型番などの呼び名）。',
  '2行目以降に特徴を1行ずつ3〜8行。丈・シルエット・機能・素材の見どころ・付属品・金具の色など、写真と検索結果から言えることを並べる。文章にせず短い語で改行する。',
  '',
  '【状態】',
  '写真から見える傷・汚れ・毛玉・スレ・日焼け・使用感を具体的に書く。場所と程度を書き、隠さない。',
  '良い点も1〜2文添える。見当たらない場合も、中古品である旨は必ず書く。',
  '',
  '【カラー】',
  '英語と日本語の両方を書く（例: ブラック 黒）。',
  '',
  '【サイズ】',
  '1行目に「表記」＋タグ等で確認できたサイズ。読み取れない場合は「表記」とだけ書く。',
  '2行目以降は採寸の項目名だけを並べ、数値は書かない（出品者が実測して記入するため）。',
  '項目は商品の種類に合わせる。衣類なら 肩幅 / 身幅 / 着丈 / 袖丈、パンツなら ウエスト / 股上 / 股下 / わたり、',
  '靴なら 表記サイズ / 全長 / ソール幅、バッグなら 縦 / 横 / マチ / 持ち手、家電や雑貨なら 本体サイズ / 重さ。',
  '最後の行に「※多少の誤差ご容赦ください。」を入れる。',
  '',
  '【素材】',
  '洗濯表示や品質表示が読み取れる場合はその内容（表地/裏地/中綿/毛皮 など）。',
  '読み取れない場合は項目名だけを残す（例: 表地： 裏地：）。推測で素材名を断定しない。',
  '',
  '【発送について】',
  '梱包方法と注意を2〜4行。衣類なら「コンパクトに折り畳み圧縮する場合があります。畳じわご了承ください。」のように書く。',
  '',
  'その他のルール:',
  '・冒頭の【コメントなし即購入OK!】【匿名配送】と、末尾の※注意書きはアプリ側が付けるので絶対に書かない。',
  '・絵文字は✨や♪を各見出しに1つまで。多用しない。',
  '・誇大表現、写真から確認できないこと（購入時期・正規品保証・未使用など）は書かない。',
  '・数値を推測で埋めない。分からない箇所は項目名だけを残し、questionsに確認事項として入れる。',
  '・全体で900文字以内。',
  '# 返すJSONの形',
  '{',
  '  "itemName": "商品の正式名称",',
  '  "title": "メルカリのタイトル（40文字以内）",',
  '  "brand": "ブランド名（不明なら空文字）",',
  '  "categoryPath": "メンズ > 靴 > スニーカー のような階層",',
  '  "size": "", "color": "",',
  '  "condition": "6段階のいずれか",',
  '  "conditionReason": "そう判断した写真上の根拠",',
  '  "description": "そのまま貼れる商品説明の全文",',
  '  "priceMin": 0, "priceMax": 0, "priceRecommended": 0,',
  '  "priceReason": "価格の根拠を1〜2文で",',
  '  "shippingId": "' + SHIPPING_IDS.join(' / ') + '",',
  '  "estimatedSize": "梱包後のおおよそのサイズと重さ",',
  '  "photoAdvice": ["追加で撮ると売れやすい写真"],',
  '  "questions": ["写真だけでは分からず出品者に確認したいこと"],',
  '  "policyWarning": "",',
  '  "confidence": "high / medium / low"',
  '}'
].join('\n');

function geminiUrl() {
  var base = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
  return base + '/v1beta/models/' + MODEL + ':generateContent';
}

async function callGemini(apiKey, body) {
  var res = await fetch(geminiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body)
  });
  var data = await res.json().catch(function () { return {}; });
  return { ok: res.ok, status: res.status, data: data };
}

function textOf(result) {
  var out = '';
  try {
    (result.data.candidates[0].content.parts || []).forEach(function (part) { out += part.text || ''; });
  } catch (parseError) {
    console.warn('[generate] no text in response', parseError.message);
    out = '';
  }
  return out;
}

function sourcesOf(result) {
  var list = [];
  try {
    var meta = result.data.candidates[0].groundingMetadata || {};
    (meta.webSearchQueries || []).forEach(function (q) { list.push('検索したことば: ' + q); });
    (meta.groundingChunks || []).forEach(function (chunk) {
      if (chunk.web && chunk.web.title) list.push(chunk.web.title);
    });
  } catch (metaError) {
    console.warn('[generate] no grounding metadata', metaError.message);
    return list;
  }
  return list.slice(0, 6);
}

function parseJson(text) {
  var raw = String(text || '').trim();
  var start = raw.indexOf('{');
  var end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch (jsonError) {
    console.warn('[generate] JSON parse failed', jsonError.message);
    return null;
  }
}

export default async function handler(req, res) {
  // 画面側が「サーバーで使えるか」を確かめるための問い合わせ
  if (req.method === 'GET') {
    res.status(200).json({
      ready: !!process.env.GEMINI_API_KEY,
      needsPassword: !!process.env.APP_PASSWORD
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(501).json({ error: 'このサーバーにはAIキーが設定されていません', ready: false });
    return;
  }

  var body = req.body || {};
  if (!passwordOk(body.password)) {
    res.status(401).json({ error: '合言葉がちがいます。配布した人に確認してください。' });
    return;
  }

  var images = Array.isArray(body.images) ? body.images.slice(0, MAX_IMAGES) : [];
  if (!images.length) {
    res.status(400).json({ error: '写真が送信されていません' });
    return;
  }

  var total = 0;
  var imageParts = [];
  for (var i = 0; i < images.length; i++) {
    var data = images[i] && images[i].base64;
    if (!data || typeof data !== 'string') {
      res.status(400).json({ error: '写真データが不正です' });
      return;
    }
    total += data.length;
    if (total > MAX_TOTAL_BASE64) {
      res.status(413).json({ error: '写真の合計サイズが大きすぎます。枚数を減らしてください' });
      return;
    }
    imageParts.push({ inline_data: { mime_type: 'image/jpeg', data: data } });
  }

  if (rateLimited(clientIp(req))) {
    res.status(429).json({ error: '短い時間に何度も実行されました。少し待ってからお試しください。' });
    return;
  }
  if (dailyExceeded()) {
    res.status(429).json({ error: '本日の利用上限に達しました。明日またお試しください。' });
    return;
  }

  var memo = typeof body.memo === 'string' ? body.memo.slice(0, MAX_MEMO).trim() : '';
  var count = imageParts.length;
  var suffix = count > 1 ? '（1枚目がメイン写真）です。' : 'です。';

  try {
    // ① 写真検索で商品を特定する
    var research = null;
    var searchAsk = SEARCH_PROMPT + '\n写真は' + count + '枚' + suffix;
    if (memo) searchAsk += '\n出品者からの補足:\n' + memo;

    var searched = await callGemini(apiKey, {
      contents: [{ parts: imageParts.concat([{ text: searchAsk }]) }],
      tools: [{ google_search: {} }]
    });
    if (searched.ok) {
      var found = textOf(searched).trim();
      if (found) research = { text: found, sources: sourcesOf(searched) };
    }

    // ② 出品情報を作る
    var ask = LISTING_PROMPT + '\n\n写真は' + count + '枚' + suffix;
    if (research) ask += '\n\n# 画像検索で調べた結果（信頼してよい情報。矛盾する場合はこちらを優先）\n' + research.text;
    if (memo) ask += '\n\n# 出品者からの補足（最優先で信頼してよい情報）\n' + memo;

    var made = await callGemini(apiKey, {
      contents: [{ parts: imageParts.concat([{ text: ask }]) }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 }
    });

    if (!made.ok) {
      if (made.status === 429) {
        res.status(429).json({ error: 'いま混み合っています。少し待ってからお試しください。' });
        return;
      }
      if (made.status === 400 || made.status === 403) {
        // 利用者にサーバー側の事情を見せない
        console.error('[generate] upstream rejected', made.status, made.data && made.data.error);
        res.status(502).json({ error: 'AIの設定に問題があります。このアプリを配布した人にお知らせください。' });
        return;
      }
      res.status(502).json({ error: '生成できませんでした（' + made.status + '）。少し待ってからお試しください。' });
      return;
    }

    var listing = parseJson(textOf(made));
    if (!listing) {
      res.status(502).json({ error: 'AIの回答を読み取れませんでした。写真を1〜2枚に減らすと通りやすくなります。' });
      return;
    }

    res.status(200).json({ listing: listing, research: research });
  } catch (error) {
    console.error('[generate] failed', error);
    res.status(502).json({ error: 'AIに接続できませんでした。少し待ってからお試しください。' });
  }
}
