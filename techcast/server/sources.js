// 情報源カタログ
// ---------------------------------------------------------------------------
// weight: 1.0 を基準にした情報源の信頼度・シグナル強度。高いほど選ばれやすい。
// tags:   その情報源が主に扱う領域。記事側のタグ推定が弱いときの補助に使う。
// tier:   'core'   = 既定でON（毎朝これだけで番組が成立する量）
//         'extra'  = 既定でOFF（設定画面から追加できる）
//
// URL は各媒体の公開フィードだが、フィードは予告なく移転・停止する。
// アプリの「情報源」タブにヘルスチェックがあるので、初回に一度実行して
// 赤くなったものは OFF にするか URL を直してほしい。

export const SOURCES = [
  // ── 日本語 / 総合IT ────────────────────────────────────────────────
  {
    id: 'itmedia-news',
    name: 'ITmedia NEWS',
    url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml',
    lang: 'ja',
    tier: 'core',
    weight: 1.0,
    tags: ['bigtech', 'product', 'japan'],
    note: '国内IT全般の速報。量が多いので一次スクリーニング向き。'
  },
  {
    id: 'itmedia-ai',
    name: 'ITmedia AI+',
    url: 'https://rss.itmedia.co.jp/rss/2.0/aiplus.xml',
    lang: 'ja',
    tier: 'core',
    weight: 1.1,
    tags: ['ai', 'japan'],
    note: 'AI領域の国内報道。'
  },
  {
    id: 'itmedia-enterprise',
    name: 'ITmedia エンタープライズ',
    url: 'https://rss.itmedia.co.jp/rss/2.0/enterprise.xml',
    lang: 'ja',
    tier: 'extra',
    weight: 1.0,
    tags: ['saas', 'enterprise', 'security', 'japan'],
    note: '企業システム・情シス視点。SaaS導入事例が拾える。'
  },
  {
    id: 'publickey',
    name: 'Publickey',
    url: 'https://www.publickey1.jp/atom.xml',
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
    lang: 'ja',
    tier: 'core',
    weight: 1.0,
    tags: ['business', 'startup', 'japan'],
    note: 'ビジネス寄りのIT報道。'
  },
  {
    id: 'zdnet-japan',
    name: 'ZDNET Japan',
    url: 'https://feeds.japan.zdnet.com/rss/zdnet/all.rdf',
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
    lang: 'en',
    tier: 'core',
    weight: 1.2,
    tags: ['startup', 'funding', 'saas', 'ai'],
    note: '資金調達とプロダクトローンチの本丸。日本語圏に来る前に読める。'
  },
  {
    id: 'theverge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
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
    lang: 'en',
    tier: 'extra',
    weight: 1.0,
    tags: ['bigtech', 'security', 'devtool'],
    note: '技術的に踏み込んだ解説。'
  },
  {
    id: 'hackernews',
    name: 'Hacker News フロントページ',
    url: 'https://hnrss.org/frontpage',
    lang: 'en',
    tier: 'core',
    weight: 1.1,
    tags: ['community', 'devtool', 'startup'],
    note: '世界のエンジニアの関心ランキング。一次情報への最短経路。'
  },
  {
    id: 'saastr',
    name: 'SaaStr',
    url: 'https://www.saastr.com/feed/',
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
