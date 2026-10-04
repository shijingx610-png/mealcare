// オフライン台本生成（Claude を使わない経路）
// ---------------------------------------------------------------------------
// APIキーが無い／API が落ちている／通信が細い朝でも、番組が0にならないようにする。
// AI に書かせた原稿ほどの滑らかさは出ないが、「今日何が起きたか」と
// 「なぜ自分に関係するか」は、決め打ちの型でもかなりの部分まで届けられる。

import { buildEpisode, formatDateLabel, toRef } from './episode-shape.js';
import { scriptBudget } from './script-budget.js';

// タグごとの「なぜ気になるか」の切り口。順番に使い回して単調さを減らす。
const ANGLE_BY_TAG = {
  saas: [
    'SaaSの話は、機能そのものより「誰の、どの業務を、いくらで置き換えるのか」で見ると輪郭がはっきりします。',
    'この手のニュースは、導入する側の稟議がどう通るかを想像しながら聞くと、営業側の論点が見えてきます。'
  ],
  ai: [
    'AI関連は発表の数が多いぶん、「実験段階なのか、もう業務で使われているのか」を見分けるのが大事です。',
    'AIの話題は、できるようになったことより「これまで人が何時間かけていたか」に注目すると価値が測れます。'
  ],
  funding: [
    '資金調達のニュースは、その会社が次の1、2年で採用を増やすサインでもあります。転職先候補として覚えておく価値があります。',
    '調達額そのものより、何に使うと言っているかを聞くと、その会社がいま何に困っているかが分かります。'
  ],
  startup: [
    'スタートアップの動きは、業界がこれから向かう方向の先行指標になります。',
    '小さい会社の挑戦は、数年後に大手が追随することが多い領域です。'
  ],
  business: [
    '事業の話は、数字の背景にある意思決定を想像すると理解が深まります。',
    'ビジネスモデルの変化は、そこで働く人の職種構成の変化とほぼ同義です。'
  ],
  metrics: [
    '指標が出てくるニュースは、業界の共通言語を覚える絶好の機会です。',
    '数字が語られるときは、その数字が良いのか悪いのかの基準まで一緒に覚えておくと使えます。'
  ],
  product: [
    '新機能のニュースは、競合がどこを脅威だと思っているかの裏返しでもあります。',
    'プロダクトの変化は、ユーザーの不満がどこにあったかを教えてくれます。'
  ],
  devtool: [
    '開発者向けの話題は、技術職以外でも「現場が何を楽に感じるか」を知る手がかりになります。',
    'エンジニアが盛り上がる話題を知っておくと、社内で話が通じやすくなります。'
  ],
  cloud: [
    'クラウド基盤の話は、その上で動くサービス全部に影響します。地味ですが土台の話です。',
    'インフラのニュースは、コスト構造の変化として効いてくることが多い領域です。'
  ],
  security: [
    'セキュリティの話題は、企業がSaaSを選ぶときの判断基準に直結します。',
    '事故のニュースは、裏返すと「何を備えていれば防げたか」の教材になります。'
  ],
  bigtech: [
    '大手の動きは、業界全体のルールが変わる合図になることがあります。',
    '巨大企業の判断は、取引先や下流のサービスにそのまま波及します。'
  ],
  enterprise: [
    '国内の企業IT案件は数が多く、未経験から入る間口も比較的広い領域です。',
    'DX文脈のニュースは、実際に何がどう変わったかまで聞くと解像度が上がります。'
  ],
  career: [
    '採用や働き方のニュースは、そのまま自分の選択肢の話です。',
    '業界の人の動きは、どのスキルが今いくらで買われているかを教えてくれます。'
  ],
  japan: [
    '国内の動きは、実際に面接で話題に出しやすいという実用的な利点があります。',
    '日本市場特有の事情は、海外事例をそのまま持ち込めない理由として語られがちです。'
  ],
  internet: ['身近なサービスの変化は、ユーザー目線の実感を持って語れる貴重な題材です。'],
  community: ['現場の人が何に反応したかは、公式発表からは読み取れない温度感を含んでいます。']
};

const CAREER_NOTES = [
  'カジュアル面談では、今日のニュースを一つ持っていくだけで会話が動きます。「これ見たんですが、御社ではどう捉えていますか」は、準備している人にしか出せない質問です。',
  '未経験からの転職で効くのは、知識の量より「業界の話題に自分の言葉で反応できること」です。毎朝5分の積み重ねが、そのまま面接の地力になります。',
  '求人票を見るときは、事業フェーズを先に確認してみてください。資金調達直後なのか、黒字化を目指している段階なのかで、求められる動き方がまるで違います。',
  '志望動機は「業界が伸びているから」だけだと弱くなります。どのニュースを見て何を面白いと思ったのか、具体的な一本があると説得力が変わります。',
  '知らない用語が出てきたら、その場で調べるより一度メモして夜にまとめて潰すほうが続きます。完璧に理解しようとしないことが、続けるコツです。',
  '職務経歴書は、前職の業務をそのまま書くより「どの課題を、どう測って、どう改善したか」に翻訳すると、業界が違っても伝わります。'
];

// 記事のタグから「なぜ気になるか」を拾う。タグ違いで最大 count 本まで。
// 同じタグから2本取ると論点が重なるので、1タグ1本に絞る。
function pickAngles(tags, seed, count = 1) {
  const out = [];
  for (const { tagId } of tags || []) {
    if (out.length >= count) break;
    const angles = ANGLE_BY_TAG[tagId];
    if (angles && angles.length) out.push(angles[seed % angles.length]);
  }
  if (out.length === 0) out.push('業界の地図に一つ点を置くつもりで、覚えておくだけで十分です。');
  return out;
}

// 「SaaS / PaaS / IaaS」のような見出し用の表記は、読み上げるとスラッシュが邪魔になる。
// 画面にはそのまま出し、音声用だけ読める形に直す。
function speakableTerm(term) {
  return (term || '').replace(/\s*[/／]\s*/g, '、').replace(/[（(]/g, '、').replace(/[）)]/g, '');
}

function sentence(text) {
  const t = (text || '').trim();
  if (!t) return '';
  return /[。！？.!?]$/.test(t) ? t : `${t}。`;
}

function summarize(item, maxChars = 180) {
  const raw = (item.summary || '').trim();
  if (!raw) return '';
  if (raw.length <= maxChars) return sentence(raw);
  // 句点で切れる位置を探して、途中で文が切れないようにする
  const cut = raw.slice(0, maxChars);
  const lastStop = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('. '));
  return lastStop > maxChars * 0.5 ? cut.slice(0, lastStop + 1) : `${cut}…`;
}

// ラウンドアップは一言だけ添えたい。途中で切れた文を読み上げると耳障りなので、
// 丸ごと収まる最初の一文だけを使い、収まらなければ見出しだけにする。
function firstSentence(text, maxChars) {
  const raw = (text || '').trim();
  if (!raw || maxChars <= 0) return '';
  const matched = raw.match(/^.*?[。！？]/);
  const head = (matched ? matched[0] : raw).trim();
  return head.length <= maxChars ? sentence(head) : '';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function buildTemplateEpisode({
  date = new Date(),
  durationMin = 10,
  deepDive = [],
  roundup = [],
  terms = [],
  health = [],
  stats = {}
}) {
  const dateLabel = formatDateLabel(date);
  const segments = [];

  // 尺から逆算した持ち時間。Claude 経路と同じ配分表を使う。
  // 実際に選べた本数で計算するので、記事が少ない朝は1本あたりを厚くする。
  const budget = scriptBudget(durationMin, {
    deepDive: Math.max(1, deepDive.length),
    roundup: roundup.length,
    glossary: terms.length
  });
  // 深掘り1本の持ち時間から、見出し・補足・切り口のぶんを引いた残りを要約に充てる。
  const summaryCap = clamp(budget.deepDiveEach - 180, 180, 480);
  const roundupCap = clamp(budget.roundupEach - 45, 0, 110);

  // --- オープニング ---
  const headlines = deepDive.map((i) => i.title).filter(Boolean);
  const openingLines = headlines.length
    ? [
        `おはようございます。${dateLabel}のテックニュースをお届けします。`,
        `今日の見出しは${headlines.length}本です。${headlines
          .map((h, idx) => `${idx + 1}つ目、${h}`)
          .join('。')}。`,
        'それでは順番に見ていきます。'
      ]
    : [
        `おはようございます。${dateLabel}のテックニュースをお届けします。`,
        '今日は、条件に合う新しい記事が集まりませんでした。情報源の設定か、記事の鮮度の条件を見直してみてください。',
        '代わりに、用語を一つ持って帰ってもらえればと思います。'
      ];
  segments.push({ kind: 'opening', heading: 'オープニング', body: openingLines.join(''), refs: [] });

  // --- 深掘り ---
  deepDive.forEach((item, index) => {
    // 英語記事の原文要約をそのまま読み上げると、日本語の音声では聞き取れない。
    // 翻訳できるのは Claude 経路だけなので、こちらでは要約を落として位置づけだけ伝える。
    const isEnglish = item.lang === 'en';
    const angles = pickAngles(item.tags, index, 2);
    const parts = [
      `${index + 1}本目。${item.sourceName}から、${sentence(item.title)}`,
      isEnglish ? '' : summarize(item, summaryCap),
      item.corroboration > 0
        ? `このニュースは${item.alsoReportedBy.slice(0, 2).join('と')}でも同時に取り上げられています。それだけ注目度が高い話題です。`
        : '',
      angles[0]
    ].filter(Boolean);

    // 要約が短くて持ち時間に届かないときだけ、別のタグの切り口をもう一つ足す。
    if (angles[1] && parts.join('').length < budget.deepDiveEach * 0.75) {
      parts.push(angles[1]);
    }
    if (isEnglish) {
      parts.push(
        '英語の記事です。見出しだけ先に押さえておいて、日本語の続報が出たら詳しく確認するのがおすすめです。'
      );
    }

    segments.push({
      kind: 'deepDive',
      heading: item.title,
      body: parts.join(''),
      refs: [toRef(item)]
    });
  });

  // --- 用語コーナー ---
  if (terms.length) {
    const body = [
      '続いて、今日の用語です。',
      ...terms.map((t, i) => {
        const connector = i === 0 ? '' : i === terms.length - 1 ? '最後に、' : '次に、';
        return `${connector}${speakableTerm(t.term)}、読み方は${t.reading}。${sentence(
          t.definition
        )}${sentence(t.interview)}`;
      }),
      '一度で覚えなくて大丈夫です。何度か出てくるうちに馴染んできます。'
    ].join('');
    segments.push({ kind: 'glossary', heading: '今日の用語', body, refs: [] });
  }

  // --- 転職メモ ---
  const dayIndex = Math.floor(new Date(date).getTime() / 86_400_000);
  segments.push({
    kind: 'career',
    heading: '転職メモ',
    body: `ここで転職メモを一つ。${CAREER_NOTES[dayIndex % CAREER_NOTES.length]}`,
    refs: []
  });

  // --- ラウンドアップ ---
  if (roundup.length) {
    const body = [
      '最後に、その他の気になったニュースを短く並べます。',
      ...roundup.map((item) => {
        const head = `${item.sourceName}から、${sentence(item.title)}`;
        // 英語記事は見出しだけ。原文を読み上げても日本語音声では伝わらない。
        if (item.lang === 'en') return head;
        return `${head}${firstSentence(item.summary, roundupCap)}`;
      }),
      '以上です。'
    ].join('');
    segments.push({
      kind: 'roundup',
      heading: '早耳ラウンドアップ',
      body,
      refs: roundup.map(toRef)
    });
  }

  // --- クロージング ---
  segments.push({
    kind: 'closing',
    heading: 'クロージング',
    body:
      '今日は以上です。全部覚えようとしなくて大丈夫です。一つでも引っかかった話があれば、あとで記事を開いてみてください。それではまた明日。',
    refs: []
  });

  return buildEpisode({
    date,
    durationMin,
    generator: 'template',
    title: headlines.length ? `${dateLabel} ${headlines[0]} ほか` : `${dateLabel} テックニュース`,
    segments,
    deepDive,
    roundup,
    terms,
    health,
    stats
  });
}
