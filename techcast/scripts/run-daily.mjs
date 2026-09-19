#!/usr/bin/env node
// 今日の番組を手動で作る
// ---------------------------------------------------------------------------
// スケジュールを待たずに試したいとき、設定を変えて作り直したいときに使う。
//
//   npm run daily:now          すでにある日は何もしない
//   npm run daily:now -- --force   作り直す

import { loadEnvFile } from '../server/load-env.js';

loadEnvFile('.env');

const { runDailyJob } = await import('../server/daily-job.js');

const force = process.argv.includes('--force');
const log = (...args) => console.log(...args);

try {
  const result = await runDailyJob({ force, reason: 'cli', log });
  console.log('\n結果:');
  console.log(JSON.stringify(result, null, 2));
  if (result.status === 'skipped') {
    console.log('\n作り直すには --force を付けてください。');
  }
  if (result.ttsError) {
    console.log('\n音声だけ失敗しています。VOICEVOX が動いているか確認してください:');
    console.log('  npm run voices');
  }
} catch (err) {
  console.error('失敗しました:', err?.stack || err);
  process.exit(1);
}
