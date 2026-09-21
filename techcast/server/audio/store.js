// 生成済みエピソードと音声ファイルの置き場
// ---------------------------------------------------------------------------
// ポッドキャストアプリから購読するには、音声が「変わらない URL」で取れる必要がある。
// つまり、毎朝つくった音声をどこかに残しておかないといけない。
//
// ここはファイルシステムに置く実装。自宅サーバー、VPS、Docker、ローカルPCで動く。
// Vercel のような使い捨てのファイルシステムでは残らないので、
// その場合は永続ディスクか外部ストレージが要る（README に書いた）。

import { promises as fs } from 'node:fs';
import path from 'node:path';

const DEFAULT_DIR = '.techcast-data';

export function dataDir(env = process.env) {
  return path.resolve(env.TECHCAST_DATA_DIR || DEFAULT_DIR);
}

function episodeDir(baseDir, id) {
  // id は YYYY-MM-DD 形式のみ。パス操作の混入を防ぐ。
  if (!/^\d{4}-\d{2}-\d{2}$/.test(id)) throw new Error(`不正なエピソードIDです: ${id}`);
  return path.join(baseDir, 'episodes', id);
}

export async function saveEpisode(
  episode,
  { audio, extension, contentType, chapters, durationSec, baseDir } = {}
) {
  const dir = episodeDir(baseDir || dataDir(), episode.id);
  await fs.mkdir(dir, { recursive: true });

  const meta = {
    ...episode,
    // チャプターは音声が無くても持っておく。
    // 台本だけ先に出来て音声が後から付く場合があるため。
    chapters: chapters || episode.chapters || null,
    audio: audio
      ? {
          file: `audio.${extension}`,
          contentType,
          bytes: audio.length,
          durationSec: durationSec ?? null
        }
      : null
  };

  if (audio) {
    await fs.writeFile(path.join(dir, `audio.${extension}`), audio);
  }
  await fs.writeFile(path.join(dir, 'episode.json'), JSON.stringify(meta, null, 2), 'utf8');
  return meta;
}

export async function getEpisode(id, baseDir) {
  try {
    const raw = await fs.readFile(path.join(episodeDir(baseDir || dataDir(), id), 'episode.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function listEpisodes(baseDir, limit = 50) {
  const root = path.join(baseDir || dataDir(), 'episodes');
  let ids;
  try {
    ids = await fs.readdir(root);
  } catch {
    return [];
  }

  const valid = ids.filter((id) => /^\d{4}-\d{2}-\d{2}$/.test(id)).sort().reverse().slice(0, limit);
  const episodes = [];
  for (const id of valid) {
    const ep = await getEpisode(id, baseDir);
    if (ep) episodes.push(ep);
  }
  return episodes;
}

/**
 * 音声ファイルの実体を開く。範囲リクエストに答えるためサイズも返す。
 */
export async function statAudio(id, baseDir) {
  const ep = await getEpisode(id, baseDir);
  if (!ep?.audio?.file) return null;
  const file = path.join(episodeDir(baseDir || dataDir(), id), ep.audio.file);
  try {
    const stat = await fs.stat(file);
    return { file, size: stat.size, contentType: ep.audio.contentType || 'audio/mpeg' };
  } catch {
    return null;
  }
}
