// POST /api/episode — 今朝のエピソードを生成する
import { generateEpisode } from '../server/pipeline.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const durationMin = [5, 10, 15].includes(Number(body.durationMin))
    ? Number(body.durationMin)
    : 10;

  try {
    const episode = await generateEpisode({
      date: body.date ? new Date(body.date) : new Date(),
      durationMin,
      sourceIds: body.sourceIds,
      interestWeights: body.interestWeights,
      maxAgeHours: Number(body.maxAgeHours) > 0 ? Number(body.maxAgeHours) : 36,
      excludeLinks: Array.isArray(body.excludeLinks) ? body.excludeLinks.slice(0, 500) : [],
      learnedTermIds: Array.isArray(body.learnedTermIds) ? body.learnedTermIds : [],
      urlOverrides:
        body.urlOverrides && typeof body.urlOverrides === 'object' ? body.urlOverrides : {},
      useClaude: body.useClaude !== false
    });
    res.status(200).json({ episode });
  } catch (err) {
    res.status(500).json({
      error: 'エピソードの生成に失敗しました',
      message: String(err?.message || err)
    });
  }
}
