#!/usr/bin/env node
// デモ用のサンプル番組を、実際のパイプラインで組み立てる。
// 手書きすると構造がズレるので、本番と同じ関数を通す。
import { writeFileSync } from 'node:fs';
import { buildTemplateEpisode } from '../server/script-template.js';
import { GLOSSARY_BY_ID } from '../server/glossary.js';
import { SOURCES, PRESETS } from '../server/sources.js';
import { TAGS } from '../server/taxonomy.js';

const hoursAgo = (h) => new Date(Date.now() - h * 3600_000).toISOString();

// すべて example.com を指す「例」であることが分かる作り。
// 実在の記事に見せかけないのが条件。
const mk = (title, source, summary, tags, h) => ({
  title, link: 'https://example.com/sample/' + encodeURIComponent(title.slice(0, 12)),
  summary, publishedAt: hoursAgo(h), sourceName: source, sourceId: 'demo', lang: 'ja',
  tags: tags.map((t) => ({ tagId: t, strength: 2 })), corroboration: 0, alsoReportedBy: []
});

const deepDive = [
  mk('【サンプル】大手AI企業が企業向けエージェント基盤を発表', 'サンプル媒体A',
     'これはデモ用の例です。実在の記事ではありません。社内の業務フローに沿って複数の作業を自動で進めるAIエージェントの基盤が発表された、という想定の記事です。',
     ['ai', 'product'], 3),
  mk('【サンプル】国内SaaS企業がシリーズDで100億円を調達', 'サンプル媒体B',
     'これはデモ用の例です。実在の記事ではありません。人事労務SaaSが大型調達を実施し、海外展開と採用に充てる、という想定の記事です。',
     ['funding', 'saas', 'japan'], 6),
  mk('【サンプル】日本語に強いオープンソースモデルが公開', 'サンプル媒体C',
     'これはデモ用の例です。実在の記事ではありません。商用利用可能なライセンスで日本語特化のモデルが公開された、という想定の記事です。',
     ['ai', 'devtool'], 9)
];

const roundup = [
  mk('【サンプル】クラウド大手が東京リージョンに新サービス', 'サンプル媒体A', '', ['cloud'], 5),
  mk('【サンプル】業務チャットツールがAI要約機能を追加', 'サンプル媒体B', '', ['saas', 'product'], 7),
  mk('【サンプル】開発者調査、AI支援ツールの利用率が上昇', 'サンプル媒体C', '', ['devtool'], 11),
  mk('【サンプル】セキュリティ認証の取得がSaaS選定の条件に', 'サンプル媒体A', '', ['security'], 13),
  mk('【サンプル】IT人材の採用、未経験枠が前年より増加', 'サンプル媒体B', '', ['career', 'japan'], 15),
  mk('【サンプル】大手テック企業が組織再編を発表', 'サンプル媒体C', '', ['bigtech'], 17)
];

const terms = ['ai-agent', 'arr'].map((id) => GLOSSARY_BY_ID[id]);

const episode = buildTemplateEpisode({
  date: new Date(), durationMin: 10, deepDive, roundup, terms, health: [], stats: {}
});

// 冒頭で「デモである」ことを必ず言わせる。聞いた人が誤解しないように。
episode.id = 'demo';
episode.title = '【デモ】TechCast サンプル番組';
episode.segments[0].body =
  'これは TechCast のデモ番組です。ここで読み上げているニュースはすべて説明用の例で、実際の記事ではありません。' +
  '本物のニュースを聞くには、自分のパソコンでアプリを起動する必要があります。' +
  'それでは、実際の番組がどんな形で届くのかを聞いてみてください。' +
  episode.segments[0].body.replace(/^おはようございます。[^。]+。/, '');

const payload = {
  catalog: {
    sources: SOURCES, tags: TAGS, presets: PRESETS, glossarySize: 42,
    claudeConfigured: false,
    podcast: { ttsProvider: null, feedUrl: '（自分のPCで起動すると表示されます）', episodesWithAudio: 0 }
  },
  episode
};

writeFileSync(
  new URL('../src/lib/demo-data.js', import.meta.url),
  `// デモモード用のデータ（自動生成。編集しないこと）
// ---------------------------------------------------------------------------
// API に届かない場所でアプリを開いたときに、画面の中身を見せるためのサンプル。
// ニュースはすべて説明用の例で、実在の記事ではない。リンクは example.com を指す。
// 生成元: scripts/build-demo-data.mjs

export const DEMO_DATA = ${JSON.stringify(payload, null, 2)};
`,
  'utf8'
);

console.log('デモデータを書き出しました');
console.log('  セグメント:', episode.segments.length);
console.log('  用語:', episode.terms.map((t) => t.term).join('、'));
console.log('  記事:', episode.items.deepDive.length + episode.items.roundup.length, '件');
console.log('  冒頭:', episode.segments[0].body.slice(0, 80) + '…');
