// POST /api/health — 選んだ情報源が実際に取得できるかを確かめる
// フィードは移転も停止もする。壊れたときに「どれが壊れたか」がすぐ分かることが大事。
import { SOURCE_BY_ID, SOURCES } from '../server/sources.js';
import { fetchSource } from '../server/rss.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const ids = Array.isArray(body.sourceIds) && body.sourceIds.length
    ? body.sourceIds
    : SOURCES.map((s) => s.id);

  const targets = ids.map((id) => SOURCE_BY_ID[id]).filter(Boolean);
  if (targets.length === 0) {
    res.status(400).json({ error: '有効な情報源IDが含まれていません' });
    return;
  }

  try {
    const results = await Promise.all(
      targets.map(async (source) => {
        const r = await fetchSource(source, { timeoutMs: 10000, maxItems: 5 });
        return {
          sourceId: source.id,
          name: source.name,
          url: source.url,
          ok: r.ok,
          error: r.error,
          elapsedMs: r.elapsedMs,
          itemCount: r.items.length,
          sample: r.items.slice(0, 2).map((i) => ({ title: i.title, publishedAt: i.publishedAt }))
        };
      })
    );
    res.status(200).json({ checkedAt: new Date().toISOString(), results });
  } catch (err) {
    res.status(500).json({ error: 'ヘルスチェックに失敗しました', message: String(err?.message || err) });
  }
}
