// 記事にタグを推定してつけるための辞書
// ---------------------------------------------------------------------------
// 完全な分類器を作るのが目的ではない。「今日の自分にとって重要か」を
// 並べ替えられる程度の粗さで十分で、外したときに辞書を直せることが大事。

import { containsTerm } from './match.js';

export const TAGS = [
  { id: 'saas', label: 'SaaS・業務ソフト', defaultWeight: 1.6 },
  { id: 'ai', label: 'AI・機械学習', defaultWeight: 1.4 },
  { id: 'startup', label: 'スタートアップ', defaultWeight: 1.3 },
  { id: 'funding', label: '資金調達・M&A', defaultWeight: 1.3 },
  { id: 'business', label: 'ビジネスモデル・戦略', defaultWeight: 1.2 },
  { id: 'metrics', label: '経営指標・KPI', defaultWeight: 1.2 },
  { id: 'product', label: 'プロダクト・新機能', defaultWeight: 1.0 },
  { id: 'devtool', label: '開発者ツール・技術', defaultWeight: 0.9 },
  { id: 'cloud', label: 'クラウド基盤', defaultWeight: 1.0 },
  { id: 'security', label: 'セキュリティ', defaultWeight: 0.8 },
  { id: 'bigtech', label: '大手テック企業', defaultWeight: 1.0 },
  { id: 'enterprise', label: 'エンタープライズIT・DX', defaultWeight: 1.1 },
  { id: 'career', label: '働き方・採用・組織', defaultWeight: 1.4 },
  { id: 'internet', label: 'ネットサービス全般', defaultWeight: 0.7 },
  { id: 'community', label: 'コミュニティ話題', defaultWeight: 0.8 },
  { id: 'japan', label: '国内動向', defaultWeight: 1.1 }
];

export const TAG_BY_ID = Object.fromEntries(TAGS.map((t) => [t.id, t]));

// タグ推定用キーワード。日本語・英語を混ぜている。
// 小文字化した「タイトル + 要約 + カテゴリ」に対して部分一致で判定する。
const TAG_KEYWORDS = {
  saas: [
    'saas', 'サース', 'サブスク', 'subscription', 'マルチテナント', 'multi-tenant',
    '業務システム', '業務ソフト', 'crm', 'erp', 'maツール', 'sfa', 'グループウェア',
    'salesforce', 'セールスフォース', 'hubspot', 'slack', 'notion', 'freee',
    'マネーフォワード', 'サイボウズ', 'kintone', 'smarthr', 'zoom', 'workday',
    'servicenow', 'atlassian', 'shopify', 'stripe', 'datadog', 'snowflake'
  ],
  ai: [
    'ai', '人工知能', '生成ai', 'generative', 'llm', '大規模言語モデル', 'gpt',
    'claude', 'gemini', 'openai', 'anthropic', '機械学習', 'machine learning',
    'ディープラーニング', 'deep learning', 'rag', 'エージェント', 'agent',
    'コパイロット', 'copilot', '推論', 'inference', 'ファインチューニング', 'transformer'
  ],
  startup: [
    'スタートアップ', 'startup', 'ベンチャー', 'venture', '創業', 'founder',
    '起業', 'シード', 'seed', 'アクセラレータ', 'y combinator', 'ycombinator',
    'ユニコーン', 'unicorn', 'ピッチ', 'pitch'
  ],
  funding: [
    '資金調達', 'funding', 'raise', 'シリーズa', 'シリーズb', 'シリーズc',
    'series a', 'series b', 'series c', '出資', '投資', 'investment',
    'バリュエーション', 'valuation', '買収', 'acquisition', 'acquire', 'm&a',
    'ipo', '上場', '調達額', 'vc', 'ベンチャーキャピタル'
  ],
  business: [
    '戦略', 'strategy', 'ビジネスモデル', 'business model', '収益化', 'monetize',
    '価格', 'pricing', '値上げ', '市場', 'market', 'シェア', '競合', 'competitor',
    '提携', 'partnership', '決算', 'earnings', '売上', 'revenue', '黒字', '赤字'
  ],
  metrics: [
    'arr', 'mrr', 'churn', 'チャーン', '解約率', 'ltv', 'cac', 'nrr',
    'ユニットエコノミクス', 'unit economics', 'rule of 40', 'バーンレート',
    'burn rate', 'ランウェイ', 'runway', 'arpu', 'kpi', 'okr', '継続率', 'リテンション'
  ],
  product: [
    '新機能', 'リリース', 'release', 'ローンチ', 'launch', '発表', 'announce',
    'アップデート', 'update', 'ベータ', 'beta', '正式提供', '一般提供', 'ga',
    'プレビュー', 'preview', '提供開始', 'リニューアル'
  ],
  devtool: [
    'github', 'gitlab', 'api', 'sdk', 'oss', 'オープンソース', 'open source',
    'フレームワーク', 'framework', 'typescript', 'javascript', 'python', 'rust',
    'go言語', 'react', 'next.js', 'node.js', 'docker', 'kubernetes', 'k8s',
    'ci/cd', 'devops', 'sre', 'ライブラリ', 'library', 'ide', 'エディタ', 'テスト自動化'
  ],
  cloud: [
    'クラウド', 'cloud', 'aws', 'azure', 'gcp', 'google cloud', 'データセンター',
    'data center', 'サーバーレス', 'serverless', 'インフラ', 'infrastructure',
    'ホスティング', 'cdn', 'エッジ', 'edge'
  ],
  security: [
    'セキュリティ', 'security', '脆弱性', 'vulnerability', 'cve', '不正アクセス',
    '情報漏えい', '情報漏洩', 'breach', 'ランサムウェア', 'ransomware',
    'フィッシング', 'phishing', 'ゼロトラスト', 'zero trust', '認証', 'auth',
    'soc 2', 'soc2', 'isms', '個人情報', 'gdpr', 'プライバシー', 'privacy'
  ],
  bigtech: [
    'google', 'グーグル', 'apple', 'アップル', 'microsoft', 'マイクロソフト',
    'amazon', 'アマゾン', 'meta', 'メタ', 'facebook', 'nvidia', 'エヌビディア',
    'tesla', 'x（旧twitter）', 'twitter', 'netflix', 'ibm', 'oracle', 'intel',
    'サムスン', 'samsung', 'tiktok', 'bytedance'
  ],
  enterprise: [
    'dx', 'デジタル変革', 'デジタルトランスフォーメーション', '基幹システム',
    '情報システム部', '情シス', '内製化', 'sier', '受託', 'システム統合',
    'レガシー', 'legacy', 'マイグレーション', 'migration', '業務効率化',
    '導入事例', 'case study', 'エンタープライズ', 'enterprise'
  ],
  career: [
    '採用', 'hiring', '求人', '転職', '人材', '人事', 'エンジニア不足',
    'レイオフ', 'layoff', '解雇', '給与', '年収', 'salary', 'リモートワーク',
    'remote work', '在宅', '働き方', '組織', 'culture', 'カルチャー',
    'マネジメント', 'management', '副業', 'フリーランス', 'リスキリング'
  ],
  internet: [
    'sns', 'ec', 'eコマース', 'e-commerce', '決済', 'payment', '広告', 'ad',
    'アプリ', 'app', 'ウェブ', 'web', '検索', 'search', '動画配信', 'ストリーミング',
    'ゲーム', 'game', 'メタバース', 'web3', 'ブロックチェーン'
  ],
  community: [
    'はてな', 'reddit', 'hacker news', '話題', 'バズ', '議論', 'discussion',
    'ポエム', '感想', 'ブログ', 'blog'
  ],
  japan: [
    '日本', '国内', '東京', '経産省', '総務省', 'デジタル庁', '円', '兆円',
    '億円', '万円', '株式会社', '合同会社', '日経', 'jr', 'ntt', 'kddi',
    'ソフトバンク', '楽天', 'リクルート', 'サイバーエージェント', 'dena',
    'メルカリ', 'ヤフー', 'line', 'zホールディングス'
  ]
};

/**
 * 1 記事にタグを推定してつける。
 * 情報源そのものが持つタグも弱い証拠として足す。
 */
export function inferTags(item) {
  const haystack = [
    item.title || '',
    item.summary || '',
    (item.categories || []).join(' ')
  ]
    .join(' ')
    .toLowerCase();

  const hits = new Map();

  for (const [tagId, keywords] of Object.entries(TAG_KEYWORDS)) {
    let matched = 0;
    for (const kw of keywords) {
      if (containsTerm(haystack, kw)) matched += 1;
    }
    if (matched > 0) hits.set(tagId, matched);
  }

  // 情報源の性格も 0.5 ヒット相当で加える（本文に語が出ていなくても効く）
  for (const tagId of item.sourceTags || []) {
    hits.set(tagId, (hits.get(tagId) || 0) + 0.5);
  }

  return [...hits.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tagId, strength]) => ({ tagId, strength }));
}

export function defaultInterestWeights() {
  return Object.fromEntries(TAGS.map((t) => [t.id, t.defaultWeight]));
}
