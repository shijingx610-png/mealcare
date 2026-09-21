// GET /api/audio?id=YYYY-MM-DD — 生成済みの音声を返す
//
// ポッドキャストアプリは途中から再生するために範囲リクエストを投げてくる。
// これに 200 で全部返すと、シークや再生位置の復元がうまく動かない。
import { promises as fs } from 'node:fs';
import { statAudio } from '../server/audio/store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const id = String(req.query?.id || new URL(req.url, 'http://x').searchParams.get('id') || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(id)) {
    res.status(400).json({ error: 'id は YYYY-MM-DD 形式で指定してください' });
    return;
  }

  let info;
  try {
    info = await statAudio(id);
  } catch {
    info = null;
  }
  if (!info) {
    res.status(404).json({ error: 'この日の音声はまだ作られていません' });
    return;
  }

  res.setHeader('Content-Type', info.contentType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  if (req.method === 'HEAD') {
    res.setHeader('Content-Length', String(info.size));
    res.status(200).end();
    return;
  }

  const range = req.headers?.range;
  const match = range && /^bytes=(\d*)-(\d*)$/.exec(String(range).trim());

  if (match) {
    const size = info.size;
    let start = match[1] === '' ? null : Number(match[1]);
    let end = match[2] === '' ? null : Number(match[2]);

    if (start === null && end !== null) {
      // 末尾から N バイト
      start = Math.max(0, size - end);
      end = size - 1;
    } else {
      if (start === null) start = 0;
      if (end === null || end >= size) end = size - 1;
    }

    if (start >= size || start > end) {
      res.setHeader('Content-Range', `bytes */${size}`);
      res.status(416).end();
      return;
    }

    const handle = await fs.open(info.file, 'r');
    try {
      const length = end - start + 1;
      const buffer = Buffer.alloc(length);
      await handle.read(buffer, 0, length, start);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      res.setHeader('Content-Length', String(length));
      res.status(206).end(buffer);
    } finally {
      await handle.close();
    }
    return;
  }

  const buffer = await fs.readFile(info.file);
  res.setHeader('Content-Length', String(buffer.length));
  res.status(200).end(buffer);
}
