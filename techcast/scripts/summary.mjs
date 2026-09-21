#!/usr/bin/env node
// 直近の生成結果を Markdown で出す
// ---------------------------------------------------------------------------
// 自動実行は、失敗しても黙っていると気づけない。
// GitHub Actions の実行ページに、その朝何が起きたかを残す。
//
//   node scripts/summary.mjs >> $GITHUB_STEP_SUMMARY

import { listEpisodes } from '../server/audio/store.js';
import { loadEnvFile } from '../server/load-env.js';

loadEnvFile('.env');

const [latest] = await listEpisodes(undefined, 1);

if (!latest) {
  console.log('## TechCast\n\n番組が 1 本もありません。');
  process.exit(0);
}

const mb = (n) => (n / 1024 / 1024).toFixed(1);
const audio = latest.audio;

console.log(`## ${latest.title}`);
console.log('');
console.log('| 項目 | 値 |');
console.log('| --- | --- |');
console.log(`| 日付 | ${latest.dateLabel} |`);
console.log(`| 台本 | ${latest.generator === 'claude' ? 'Claude' : 'テンプレート'} |`);
console.log(
  `| 音声 | ${audio ? `${mb(audio.bytes)}MB / ${Math.round((audio.durationSec || 0) / 60)}分` : 'なし'} |`
);
console.log(`| 記事 | 深掘り ${latest.items?.deepDive?.length ?? 0} 本 / 一言 ${latest.items?.roundup?.length ?? 0} 本 |`);
console.log(`| 用語 | ${(latest.terms || []).map((t) => t.term).join('、') || 'なし'} |`);
console.log('');

if (latest.fallbackReason) {
  console.log(`> ⚠️ ${latest.fallbackReason}`);
  console.log('');
}

const health = latest.health || [];
const failed = health.filter((h) => !h.ok);
const moved = health.filter((h) => h.ok && h.movedFrom);

if (health.length > 0) {
  console.log(`情報源 ${health.filter((h) => h.ok).length} / ${health.length} 件が読み込めました。`);
  console.log('');
}

if (moved.length > 0) {
  console.log('### フィードが移転していました');
  console.log('');
  for (const h of moved) {
    console.log(`- \`${h.sourceId}\` → ${h.resolvedUrl}${h.discovered ? '（自動検出）' : ''}`);
  }
  console.log('');
  console.log('`techcast/server/sources.js` の URL を書き換えておくと、毎回の探索が減ります。');
  console.log('');
}

if (failed.length > 0) {
  console.log('### 読み込めなかった情報源');
  console.log('');
  console.log('| 情報源 | 理由 |');
  console.log('| --- | --- |');
  for (const h of failed) {
    console.log(`| ${h.sourceId} | ${String(h.error).replace(/\|/g, '\\|')} |`);
  }
  console.log('');
  console.log('続くようなら `techcast/server/sources.js` を見直してください。');
}

if (failed.length === 0 && !latest.fallbackReason) {
  console.log('問題なく作れました。');
}
