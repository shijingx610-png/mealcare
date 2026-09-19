// POST /api/health — 情報源が実際に取得できるかを確かめる
//
// 単に ok / ng を返すだけでは「どう直せばいいか」が分からない。
// 実際に読めた URL、カタログから移転していたかどうか、試して落ちた URL まで返す。
// 画面側はこれを見て「この URL に直す」ボタンを出せる。
import { SOURCE_BY_ID, SOURCES } from '../server/sources.js';
import { fetchSource } from '../server/rss.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const overrides = body.urlOverrides && typeof body.urlOverrides === 'object' ? body.urlOverrides : {};
  const ids =
    Array.isArray(body.sourceIds) && body.sourceIds.length
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
        const r = await fetchSource(source, {
          timeoutMs: 10000,
          maxItems: 5,
          overrideUrl: overrides[source.id]
        });
        return {
          sourceId: source.id,
          name: source.name,
          catalogUrl: source.url,
          resolvedUrl: r.resolvedUrl,
          movedFrom: r.movedFrom,
          discovered: r.discovered,
          ok: r.ok,
          error: r.error,
          tried: r.tried,
          elapsedMs: r.elapsedMs,
          itemCount: r.items.length,
          sample: r.items.slice(0, 2).map((i) => ({ title: i.title, publishedAt: i.publishedAt }))
        };
      })
    );
    res.status(200).json({ checkedAt: new Date().toISOString(), results });
  } catch (err) {
    res
      .status(500)
      .json({ error: 'ヘルスチェックに失敗しました', message: String(err?.message || err) });
  }
}
