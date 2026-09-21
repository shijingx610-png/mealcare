#!/usr/bin/env node
// 古いエピソードを消す
// ---------------------------------------------------------------------------
// 音声は1本あたり数MBある。放っておくと置き場所が際限なく太る。
// 毎日の生成のあとにこれを走らせて、新しいぶんだけ残す。
//
//   node scripts/prune-episodes.mjs --keep 30

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { dataDir } from '../server/audio/store.js';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const keep = Math.max(1, Number(arg('keep', process.env.SITE_KEEP_EPISODES || 30)));
const root = path.join(dataDir(), 'episodes');

let ids;
try {
  ids = await fs.readdir(root);
} catch {
  console.log('エピソードの保存先がまだありません。何もしません。');
  process.exit(0);
}

const valid = ids.filter((id) => /^\d{4}-\d{2}-\d{2}$/.test(id)).sort().reverse();
const remove = valid.slice(keep);

if (remove.length === 0) {
  console.log(`${valid.length} 本。上限 ${keep} 本以内なので何もしません。`);
  process.exit(0);
}

let freed = 0;
for (const id of remove) {
  const dir = path.join(root, id);
  try {
    for (const f of await fs.readdir(dir)) {
      const s = await fs.stat(path.join(dir, f));
      freed += s.size;
    }
  } catch {
    // 集計できなくても削除は進める
  }
  await fs.rm(dir, { recursive: true, force: true });
}

console.log(
  `${remove.length} 本を削除しました（${remove.join(', ')}）。` +
    ` 約 ${(freed / 1024 / 1024).toFixed(1)}MB を解放。残り ${valid.length - remove.length} 本。`
);
