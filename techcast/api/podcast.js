// GET /api/podcast — ポッドキャストアプリ用の RSS
//
// この URL を Apple Podcasts や Pocket Casts に登録すると、
// 毎朝の番組が普段使いのアプリに届く。ロック画面もオフラインも、そちらの機能で手に入る。
import { listEpisodes } from '../server/audio/store.js';
import { buildPodcastFeed } from '../server/audio/podcast-feed.js';
import { resolveBaseUrl } from '../server/audio/base-url.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const episodes = await listEpisodes(undefined, 100);
    const xml = buildPodcastFeed({
      episodes,
      baseUrl: resolveBaseUrl(req),
      title: process.env.PODCAST_TITLE,
      author: process.env.PODCAST_AUTHOR
    });

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    // ポッドキャストアプリは数十分おきに取りにくる。短めのキャッシュで十分。
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.status(200).end(xml);
  } catch (err) {
    res.status(500).json({ error: 'フィードを生成できませんでした', message: String(err?.message || err) });
  }
}
