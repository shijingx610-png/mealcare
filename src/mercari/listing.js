// 出品データの型・初期値・説明文テンプレート

export var CONDITIONS = [
  '新品、未使用',
  '未使用に近い',
  '目立った傷や汚れなし',
  'やや傷や汚れあり',
  '傷や汚れあり',
  '全体的に状態が悪い'
];

export function emptyListing() {
  return {
    itemName: '',
    title: '',
    brand: '',
    categoryPath: '',
    size: '',
    color: '',
    condition: CONDITIONS[2],
    conditionReason: '',
    features: [],
    flaws: [],
    descriptionBody: '',
    hashtags: [],
    priceMin: 300,
    priceMax: 1000,
    priceRecommended: 500,
    priceReason: '',
    shippingId: 'nekopos',
    estimatedSize: '',
    photoAdvice: [],
    questions: [],
    policyWarning: '',
    confidence: 'medium'
  };
}

// メルカリの商品説明欄にそのまま貼れる本文を組み立てる
export function buildDescription(listing, opts, shippingLabel) {
  var o = opts || {};
  var lines = [];

  lines.push('ご覧いただきありがとうございます。');
  lines.push('');

  if (listing.brand) lines.push('【ブランド】' + listing.brand);
  if (listing.itemName) lines.push('【商品名】' + listing.itemName);
  if (listing.size) lines.push('【サイズ】' + listing.size);
  if (listing.color) lines.push('【カラー】' + listing.color);
  if (listing.condition) lines.push('【状態】' + listing.condition);
  lines.push('');

  if (listing.descriptionBody) {
    lines.push('■商品説明');
    lines.push(listing.descriptionBody);
    lines.push('');
  }

  if (listing.features && listing.features.length > 0) {
    lines.push('■おすすめポイント');
    listing.features.forEach(function (f) { lines.push('・' + f); });
    lines.push('');
  }

  lines.push('■キズ・汚れについて');
  if (listing.flaws && listing.flaws.length > 0) {
    listing.flaws.forEach(function (f) { lines.push('・' + f); });
    lines.push('・上記以外に目立った不具合は見当たりませんが、中古品のため神経質な方はご購入をお控えください。');
  } else {
    lines.push('・目立ったキズや汚れは見当たりません。');
    lines.push('・中古品のため、細かな使用感はご了承ください。');
  }
  lines.push('');

  lines.push('■発送について');
  lines.push('・' + (shippingLabel || 'メルカリ便') + 'で発送予定です。');
  lines.push('・ご購入後、1〜2日以内に発送いたします（土日祝を除く）。');
  lines.push('・簡易包装でのお届けとなります。');
  lines.push('');

  var footer = [];
  if (o.instant) footer.push('即購入OKです。');
  if (o.negotiable) footer.push('お値下げのご相談もお気軽にコメントください。');
  if (o.smoker) footer.push('ペットは飼っておらず、喫煙者もおりません。');
  if (footer.length > 0) {
    footer.forEach(function (f) { lines.push(f); });
    lines.push('');
  }

  if (listing.hashtags && listing.hashtags.length > 0) {
    lines.push(listing.hashtags.map(function (t) {
      return t.charAt(0) === '#' ? t : '#' + t;
    }).join(' '));
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// APIキーなしでも画面の流れを確認できるサンプル
export var SAMPLE_LISTING = {
  itemName: 'ナイキ エアフォース1 ロー 白 27cm',
  title: 'ナイキ エアフォース1 07 ロー ホワイト 27cm スニーカー 箱付き',
  brand: 'NIKE',
  categoryPath: 'メンズ > 靴 > スニーカー',
  size: '27cm',
  color: 'ホワイト',
  condition: 'やや傷や汚れあり',
  conditionReason: 'ソール側面に黄ばみ、つま先に薄い汚れが見えるため',
  features: [
    '定番のオールホワイトで合わせやすい一足です',
    '純正の箱が付属します',
    'ソールの摩耗は少なく、まだまだ履いていただけます'
  ],
  flaws: [
    'ソール側面に経年による薄い黄ばみがあります',
    '右足つま先に小さな擦れがあります'
  ],
  descriptionBody: 'ナイキ エアフォース1 07 ローカットの27cmです。数回着用しましたが、目立った型崩れはありません。自宅保管品のため、細かな使用感はご了承ください。',
  hashtags: ['#ナイキ', '#エアフォース1', '#スニーカー', '#27cm'],
  priceMin: 5500,
  priceMax: 9000,
  priceRecommended: 7800,
  priceReason: '同モデル同サイズの中古品は6,000〜9,000円台で売れています。箱付きのため、やや高めの設定が可能です。',
  shippingId: 'takkyubin80',
  estimatedSize: '靴箱込みで80サイズ・約1.5kg',
  photoAdvice: [
    'ソールの裏側（摩耗の程度が分かる写真）',
    'インソールのサイズ表記',
    '箱のラベル部分'
  ],
  questions: [
    '購入時期と着用回数を教えてください',
    '購入店舗（正規店・通販など）は分かりますか'
  ],
  policyWarning: '',
  confidence: 'medium'
};
