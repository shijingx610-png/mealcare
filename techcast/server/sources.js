// 情報源カタログ
// ---------------------------------------------------------------------------
// weight:   1.0 を基準にした情報源の信頼度・シグナル強度。高いほど選ばれやすい。
// tags:     その情報源が主に扱う領域。記事側のタグ推定が弱いときの補助に使う。
// tier:     'core'  = 既定でON / 'extra' = 設定画面から追加
// url:      いちばん確からしいフィードの場所
// altUrls:  url が死んでいたときに順に試す候補
// homepage: 全滅したときにフィードの場所を聞きにいく先
//
// フィードの URL は予告なく移転する。だから「正しい URL を最初から知っていること」
// には期待せず、順に試す → サイト本体から自動検出する → それでもだめなら
// 画面から手で直せる、という三段構えにしてある。
// カタログの URL が古くなっても、アプリ側が勝手に追いつく。

export const SOURCES = [
  // ── AI（この番組の主軸）────────────────────────────────────────────
  {
    id: 'itmedia-ai',
    name: 'ITmedia AI+',
    url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml',
    altUrls: ['https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml'],
    homepage: 'https://www.itmedia.co.jp/aiplus/',
    lang: 'ja',
    tier: 'core',
    weight: 1.3,
    tags: ['ai', 'japan'],
    note: 'AI領域の国内報道。日本語で最初に押さえるならここ。'
  },
  {
    id: 'openai-news',
    name: 'OpenAI News',
    url: 'https://openai.com/news/rss.xml',
    altUrls: ['https://openai.com/blog/rss.xml'],
    homepage: 'https://openai.com/news/',
    lang: 'en',
    tier: 'core',
    weight: 1.4,
    tags: ['ai', 'product'],
    note: '一次情報。業界の話題はここ発のものが多い。'
  },
  {
    id: 'google-ai-blog',
    name: 'Google AI ブログ',
    url: 'https://blog.google/technology/ai/rss/',
    altUrls: ['https://blog.google/rss/'],
    homepage: 'https://blog.google/technology/ai/',
    lang: 'en',
    tier: 'core',
    weight: 1.2,
    tags: ['ai', 'bigtech', 'product'],
    note: 'Google のAI発表。一次情報。'
  },
  {
    id: 'anthropic-news',
    name: 'Anthropic News',
    url: 'https://www.anthropic.com/news/rss.xml',
    altUrls: ['https://www.anthropic.com/rss.xml'],
    homepage: 'https://www.anthropic.com/news',
    lang: 'en',
    tier: 'extra',
    weight: 1.2,
    tags: ['ai', 'product'],
    note: 'Claude の提供元。フィードが無い時期もあるので自動検出に任せている。'
  },
  {
    id: 'venturebeat-ai',
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    altUrls: ['https://venturebeat.com/feed/'],
    homepage: 'https://venturebeat.com/category/ai/',
    lang: 'en',
    tier: 'core',
    weight: 1.1,
    tags: ['ai', 'business', 'enterprise'],
    note: 'AIの企業導入とビジネス面。SaaS文脈の話題が多い。'
  },
  {
    id: 'mit-tech-review-ai',
    name: 'MIT Technology Review（AI）',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
    altUrls: ['https://www.technologyreview.com/feed/'],
    homepage: 'https://www.technologyreview.com/topic/artificial-intelligence/',
    lang: 'en',
    tier: 'extra',
    weight: 1.2,
    tags: ['ai', 'business'],
    note: '速報より、意味を考える記事。週末にまとめて聞くのに向く。'
  },
  {
    id: 'huggingface-blog',
    name: 'Hugging Face ブログ',
    url: 'https://huggingface.co/blog/feed.xml',
    altUrls: [],
    homepage: 'https://huggingface.co/blog',
    lang: 'en',
    tier: 'extra',
    weight: 1.0,
    tags: ['ai', 'devtool', 'community'],
    note: 'オープンなAIモデルの動向。技術寄り。'
  },

  // ── 日本語 / 総合IT ────────────────────────────────────────────────
  {
    id: 'itmedia-news',
    name: 'ITmedia NEWS',
    url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml',
    altUrls: ['https://rss.itmedia.co.jp/rss/2.0/topstory.xml'],
    homepage: 'https://www.itmedia.co.jp/news/',
    lang: 'ja',
    tier: 'core',
    weight: 1.0,
    tags: ['bigtech', 'product', 'japan'],
    note: '国内IT全般の速報。量が多いので一次スクリーニング向き。'
  },
  {
    id: 'publickey',
    name: 'Publickey',
    url: 'https://www.publickey1.jp/atom.xml',
    altUrls: ['https://www.publickey1.jp/index.rdf', 'https://www.publickey1.jp/rss.xml'],
    homepage: 'https://www.publickey1.jp/',
    lang: 'ja',
    tier: 'core',
    weight: 1.3,
    tags: ['devtool', 'cloud', 'saas'],
    note: '一次情報に忠実で解説が厚い。技術の意味を掴むのに最適。'
  },
  {
    id: 'cnet-japan',
    name: 'CNET Japan',
    url: 'https://feeds.japan.cnet.com/rss/cnet/all.rdf',
    altUrls: ['https://japan.cnet.com/rss/index.rdf'],
    homepage: 'https://japan.cnet.com/',
    lang: 'ja',
    tier: 'core',
    weight: 1.0,
    tags: ['business', 'startup', 'japan'],
    note: 'ビジネス寄りのIT報道。'
  },
  {
    id: 'itmedia-enterprise',
    name: 'ITmedia エンタープライズ',
    url: 'https://rss.itmedia.co.jp/rss/2.0/enterprise.xml',
    altUrls: [],
    homepage: 'https://www.itmedia.co.jp/enterprise/',
    lang: 'ja',
    tier: 'extra',
    weight: 1.0,
    tags: ['saas', 'enterprise', 'security', 'japan'],
    note: '企業システム・情シス視点。SaaS導入事例が拾える。'
  },
  {
    id: 'zdnet-japan',
    name: 'ZDNET Japan',
    url: 'https://feeds.japan.zdnet.com/rss/zdnet/all.rdf',
    altUrls: ['https://japan.zdnet.com/rss/index.rdf'],
    homepage: 'https://japan.zdnet.com/',
    lang: 'ja',
    tier: 'extra',
    weight: 1.0,
    tags: ['enterprise', 'saas', 'security'],
    note: 'エンタープライズIT・調査データが多い。'
  },
  {
    id: 'cloud-watch',
    name: 'クラウド Watch',
    url: 'https://cloud.watch.impress.co.jp/data/rss/1.0/clw/feed.rdf',
    altUrls: ['https://cloud.watch.impress.co.jp/rss/'],
    homepage: 'https://cloud.watch.impress.co.jp/',
    lang: 'ja',
    tier: 'extra',
    weight: 1.0,
    tags: ['cloud', 'saas', 'enterprise'],
    note: 'クラウド／SaaSの製品発表を丁寧に拾う。'
  },
  {
    id: 'internet-watch',
    name: 'INTERNET Watch',
    url: 'https://internet.watch.impress.co.jp/data/rss/1.0/iw/feed.rdf',
    altUrls: [],
    homepage: 'https://internet.watch.impress.co.jp/',
    lang: 'ja',
    tier: 'extra',
    weight: 0.9,
    tags: ['internet', 'japan'],
    note: 'ネットサービス全般。'
  },
  {
    id: 'nikkei-xtech-it',
    name: '日経クロステック IT',
    url: 'https://xtech.nikkei.com/rss/xtech-it.rdf',
    altUrls: ['https://xtech.nikkei.com/rss/index.rdf'],
    homepage: 'https://xtech.nikkei.com/',
    lang: 'ja',
    tier: 'extra',
    weight: 1.1,
    tags: ['enterprise', 'business', 'japan'],
    note: '有料記事が混ざるが、見出しだけでも業界の空気が読める。'
  },
  {
    id: 'thebridge',
    name: 'THE BRIDGE',
    url: 'https://thebridge.jp/feed',
    altUrls: ['https://thebridge.jp/rss'],
    homepage: 'https://thebridge.jp/',
    lang: 'ja',
    tier: 'core',
    weight: 1.1,
    tags: ['startup', 'funding', 'japan'],
    note: '国内スタートアップの資金調達・事業動向。転職先探しの一次情報。'
  },
  {
    id: 'gigazine',
    name: 'GIGAZINE',
    url: 'https://gigazine.net/news/rss_2.0/',
    altUrls: [],
    homepage: 'https://gigazine.net/',
    lang: 'ja',
    tier: 'extra',
    weight: 0.7,
    tags: ['internet', 'product'],
    note: '話題性は高いが業界ニュース密度は低め。'
  },

  // ── 日本語 / コミュニティ・シグナル ──────────────────────────────
  {
    id: 'hatena-it',
    name: 'はてなブックマーク テクノロジー',
    url: 'https://b.hatena.ne.jp/hotentry/it.rss',
    altUrls: ['https://b.hatena.ne.jp/hotentry/it/rss'],
    homepage: 'https://b.hatena.ne.jp/hotentry/it',
    lang: 'ja',
    tier: 'core',
    weight: 1.2,
    tags: ['community', 'devtool', 'japan'],
    note: '「国内のエンジニアが今日何を読んだか」が分かる。空気感の把握に効く。'
  },
  {
    id: 'zenn',
    name: 'Zenn トレンド',
    url: 'https://zenn.dev/feed',
    altUrls: [],
    homepage: 'https://zenn.dev/',
    lang: 'ja',
    tier: 'extra',
    weight: 0.9,
    tags: ['devtool', 'community', 'japan'],
    note: '実務者の技術記事。用語の生きた使われ方が分かる。'
  },
  {
    id: 'qiita',
    name: 'Qiita 人気記事',
    url: 'https://qiita.com/popular-items/feed',
    altUrls: ['https://qiita.com/popular-items/feed.atom'],
    homepage: 'https://qiita.com/',
    lang: 'ja',
    tier: 'extra',
    weight: 0.8,
    tags: ['devtool', 'community', 'japan'],
    note: '同上。初学者向けの解説が多い。'
  },

  // ── 英語 / 業界の震源地 ──────────────────────────────────────────
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    altUrls: ['https://techcrunch.com/rss/'],
    homepage: 'https://techcrunch.com/',
    lang: 'en',
    tier: 'core',
    weight: 1.2,
    tags: ['startup', 'funding', 'saas', 'ai'],
    note: '資金調達とプロダクトローンチの本丸。日本語圏に来る前に読める。'
  },
  {
    id: 'hackernews',
    name: 'Hacker News フロントページ',
    url: 'https://hnrss.org/frontpage',
    altUrls: ['https://news.ycombinator.com/rss'],
    homepage: 'https://news.ycombinator.com/',
    lang: 'en',
    tier: 'core',
    weight: 1.1,
    tags: ['community', 'devtool', 'startup'],
    note: '世界のエンジニアの関心ランキング。一次情報への最短経路。'
  },
  {
    id: 'theverge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    altUrls: ['https://www.theverge.com/rss/full.xml'],
    homepage: 'https://www.theverge.com/',
    lang: 'en',
    tier: 'extra',
    weight: 1.0,
    tags: ['bigtech', 'product', 'internet'],
    note: '大手テック企業の動きとカルチャー。'
  },
  {
    id: 'arstechnica',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    altUrls: ['https://arstechnica.com/feed/'],
    homepage: 'https://arstechnica.com/',
    lang: 'en',
    tier: 'extra',
    weight: 1.0,
    tags: ['bigtech', 'security', 'devtool'],
    note: '技術的に踏み込んだ解説。'
  },
  {
    id: 'saastr',
    name: 'SaaStr',
    url: 'https://www.saastr.com/feed/',
    altUrls: [],
    homepage: 'https://www.saastr.com/',
    lang: 'en',
    tier: 'core',
    weight: 1.3,
    tags: ['saas', 'business', 'metrics'],
    note: 'SaaSの経営指標（ARR・チャーン・CAC）を語彙ごと身につけられる。'
  },
  {
    id: 'a16z',
    name: 'Andreessen Horowitz',
    url: 'https://a16z.com/feed/',
    altUrls: [],
    homepage: 'https://a16z.com/',
    lang: 'en',
    tier: 'extra',
    weight: 1.1,
    tags: ['saas', 'startup', 'ai', 'business'],
    note: '投資家視点の構造分析。「なぜこの市場が伸びるか」の型が手に入る。'
  },
  {
    id: 'stratechery',
    name: 'Stratechery',
    url: 'https://stratechery.com/feed/',
    altUrls: [],
    homepage: 'https://stratechery.com/',
    lang: 'en',
    tier: 'extra',
    weight: 1.2,
    tags: ['business', 'bigtech', 'saas'],
    note: '戦略の構造分析。無料記事は一部だが、見出しだけでも論点が拾える。'
  }
];

export const SOURCE_BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s]));

export function defaultEnabledSourceIds() {
  return SOURCES.filter((s) => s.tier === 'core').map((s) => s.id);
}

// ── プリセット ─────────────────────────────────────────────────────
// 「今日から何を聞きたいか」をワンタップで切り替えるための束。
// 情報源と興味の重みはセットで効くので、一緒に切り替えないと効果が出ない。

export const PRESETS = [
  {
    id: 'ai',
    name: 'AI中心',
    description:
      'AIの一次情報を主軸にする。モデルの発表、企業導入、業界の再編まで。AI関連の転職を狙うならこれ。',
    sourceIds: [
      'itmedia-ai',
      'openai-news',
      'google-ai-blog',
      'anthropic-news',
      'venturebeat-ai',
      'techcrunch',
      'hackernews',
      'hatena-it'
    ],
    weights: {
      ai: 3,
      product: 1.4,
      startup: 1.2,
      funding: 1.2,
      business: 1.2,
      devtool: 1.1,
      bigtech: 1.2,
      saas: 1.0,
      enterprise: 0.9,
      metrics: 0.8,
      career: 1.0,
      cloud: 0.8,
      security: 0.5,
      internet: 0.5,
      community: 0.8,
      japan: 1.0
    }
  },
  {
    id: 'saas',
    name: 'SaaS・事業中心',
    description:
      'SaaSのビジネス面を主軸にする。経営指標、資金調達、売り方。事業側の職種を狙うならこれ。',
    sourceIds: [
      'saastr',
      'thebridge',
      'cnet-japan',
      'itmedia-enterprise',
      'techcrunch',
      'a16z',
      'publickey',
      'hatena-it'
    ],
    weights: {
      saas: 3,
      metrics: 2,
      business: 1.8,
      funding: 1.6,
      startup: 1.4,
      enterprise: 1.3,
      career: 1.3,
      japan: 1.2,
      product: 1.0,
      ai: 1.0,
      bigtech: 0.8,
      devtool: 0.6,
      cloud: 0.7,
      security: 0.5,
      internet: 0.5,
      community: 0.7
    }
  },
  {
    id: 'balanced',
    name: 'バランス',
    description: '業界全体を広く。まずはここから始めて、偏らせたくなったら切り替える。',
    sourceIds: defaultEnabledSourceIds(),
    weights: null // タグごとの既定値を使う
  }
];

export const PRESET_BY_ID = Object.fromEntries(PRESETS.map((p) => [p.id, p]));
