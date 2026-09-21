#!/usr/bin/env node
// 静的サイトを組み立てる
// ---------------------------------------------------------------------------
// GitHub Pages のような「置いておくだけ」の場所で、ポッドキャストとして
// 成立する形にまとめる。サーバーが要らないので、自分のPCを起動しなくていい。
//
//   site/
//     index.html, assets/      アプリ本体（静的モードで動く）
//     feed.xml                 ポッドキャストアプリに登録する購読用フィード
//     data/index.json          エピソード一覧
//     data/<日付>.json         台本・用語・チャプター
//     audio/<日付>.mp3         音声
//
//   node scripts/build-site.mjs --base-url https://example.github.io/mealcare

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { listEpisodes, statAudio } from '../server/audio/store.js';
import { buildPodcastFeed } from '../server/audio/podcast-feed.js';
import { wavToMp3, wavDurationSeconds } from '../server/audio/mp3.js';
import { loadEnvFile } from '../server/load-env.js';

loadEnvFile('.env');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const outDir = path.resolve(arg('out', 'site'));
const appDir = path.resolve(arg('app', 'dist-static'));
const keep = Number(arg('keep', process.env.SITE_KEEP_EPISODES || 30));
const baseUrl = (arg('base-url', process.env.PUBLIC_BASE_URL) || '').replace(/\/+$/, '');

if (!baseUrl) {
  console.error('購読用フィードに書く URL が必要です。');
  console.error('  node scripts/build-site.mjs --base-url https://ユーザー名.github.io/mealcare');
  process.exit(1);
}

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) await copyDir(src, dst);
    else await fs.copyFile(src, dst);
  }
}

async function main() {
  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(path.join(outDir, 'data'), { recursive: true });
  await fs.mkdir(path.join(outDir, 'audio'), { recursive: true });

  // --- アプリ本体 ---
  try {
    await copyDir(appDir, outDir);
    console.log(`アプリを配置しました（${path.relative(process.cwd(), appDir)}）`);
  } catch {
    console.warn(`アプリのビルドが見つかりません: ${appDir}`);
    console.warn('先に npm run build:static を実行してください。フィードだけ作ります。');
  }

  // --- エピソード ---
  const all = await listEpisodes(undefined, 500);
  const episodes = all.slice(0, keep);
  if (all.length > keep) {
    console.log(`保存は ${all.length} 本ありますが、新しい ${keep} 本だけを配ります`);
  }

  const published = [];

  for (const episode of episodes) {
    const info = await statAudio(episode.id);
    let audioMeta = null;

    if (info) {
      const raw = await fs.readFile(info.file);
      let mp3;
      let durationSec = episode.audio?.durationSec ?? null;

      if (info.contentType === 'audio/wav' || path.extname(info.file) === '.wav') {
        // WAV のままだと 10 分で 30MB 近い。毎日配るには重すぎるので MP3 にする。
        if (durationSec === null) {
          try {
            durationSec = Number(wavDurationSeconds(raw).toFixed(2));
          } catch {
            durationSec = null;
          }
        }
        mp3 = wavToMp3(raw, { bitrate: Number(process.env.MP3_BITRATE || 64) });
      } else {
        mp3 = raw;
      }

      const file = `audio/${episode.id}.mp3`;
      await fs.writeFile(path.join(outDir, file), mp3);
      audioMeta = {
        file,
        contentType: 'audio/mpeg',
        bytes: mp3.length,
        durationSec
      };
      console.log(
        `  ${episode.id}  ${(mp3.length / 1024 / 1024).toFixed(1)}MB` +
          (durationSec ? `  ${Math.round(durationSec / 60)}分` : '')
      );
    } else {
      console.log(`  ${episode.id}  音声なし（台本のみ）`);
    }

    const full = { ...episode, audio: audioMeta };
    await fs.writeFile(
      path.join(outDir, 'data', `${episode.id}.json`),
      JSON.stringify(full),
      'utf8'
    );
    published.push(full);
  }

  // --- 一覧 ---
  // アプリは最初にこれだけを読む。全台本を持つと重くなるので、概要だけにする。
  const index = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    feedUrl: `${baseUrl}/feed.xml`,
    episodes: published.map((e) => ({
      id: e.id,
      title: e.title,
      dateLabel: e.dateLabel,
      createdAt: e.createdAt,
      generator: e.generator,
      estimatedMinutes: e.estimatedMinutes,
      audio: e.audio,
      termCount: e.terms?.length ?? 0,
      itemCount: (e.items?.deepDive?.length ?? 0) + (e.items?.roundup?.length ?? 0),
      data: `data/${e.id}.json`
    }))
  };
  await fs.writeFile(path.join(outDir, 'data', 'index.json'), JSON.stringify(index, null, 2), 'utf8');

  // --- 購読用フィード ---
  const xml = buildPodcastFeed({
    episodes: published,
    baseUrl,
    title: process.env.PODCAST_TITLE,
    author: process.env.PODCAST_AUTHOR,
    audioUrlFor: (e) => `${baseUrl}/${e.audio.file}`,
    episodeUrlFor: (e) => `${baseUrl}/?episode=${e.id}`
  });
  await fs.writeFile(path.join(outDir, 'feed.xml'), xml, 'utf8');

  // 検索避け。個人用なので検索結果に出したくない。
  await fs.writeFile(
    path.join(outDir, 'robots.txt'),
    'User-agent: *\nDisallow: /\n',
    'utf8'
  );

  const withAudio = published.filter((e) => e.audio).length;
  console.log('');
  console.log(`サイトを書き出しました: ${path.relative(process.cwd(), outDir)}`);
  console.log(`  エピソード ${published.length} 本（うち音声つき ${withAudio} 本）`);
  console.log(`  アプリ       ${baseUrl}/`);
  console.log(`  購読用フィード ${baseUrl}/feed.xml`);
}

main().catch((err) => {
  console.error('失敗しました:', err?.stack || err);
  process.exit(1);
});
