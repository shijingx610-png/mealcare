#!/usr/bin/env node
// 共有リンク（Artifact）用にビルド結果を整える
// ---------------------------------------------------------------------------
// Artifact はページを <!doctype html><head>…</head><body> で包んでから配る。
// Vite が吐く index.html はその 4 つのタグを自分で持っているので、
// そのまま渡すと入れ子になる。中身だけを取り出して渡す。
//
// あわせて、共有リンクでは意味が無いもの（PWA マニフェスト、アイコン）を外す。
// 404 を出さないためと、ここで配るのはデモであってインストール対象ではないため。

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const dir = path.resolve('dist-artifact');
const raw = readFileSync(path.join(dir, 'index.html'), 'utf8');

const head = raw.slice(raw.indexOf('<head>') + 6, raw.indexOf('</head>'));
const body = raw.slice(raw.indexOf('<body>') + 6, raw.indexOf('</body>'));

const keep = [];
for (const tag of head.match(/<(link|script|style)\b[^>]*>(?:[\s\S]*?<\/\1>)?/g) || []) {
  // PWA まわりと favicon は共有リンクでは不要。参照先が無く 404 になるだけ。
  if (/rel="(manifest|apple-touch-icon|icon)"/.test(tag)) continue;
  // 同一オリジンの資産に crossorigin は不要。付いていると環境によっては読み込みに失敗する。
  keep.push(tag.replace(/\s+crossorigin/g, '').replace(/(src|href)="\.\//g, '$1="'));
}

const page = `<title>TechCast デモ</title>
${keep.join('\n')}
${body.replace(/(src|href)="\.\//g, '$1="').trim()}
`;

const outFile = path.join(dir, 'artifact.html');
writeFileSync(outFile, page, 'utf8');

const assets = readdirSync(path.join(dir, 'assets'));
console.log('共有リンク用ページを書き出しました:', path.relative(process.cwd(), outFile));
console.log('  サイズ:', page.length, 'バイト');
console.log('  同梱する資産:', assets.join(', '));
console.log('');
console.log('--- 中身 ---');
console.log(page);
