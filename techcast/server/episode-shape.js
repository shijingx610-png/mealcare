// エピソードの共通フォーマット
// ---------------------------------------------------------------------------
// Claude で書く場合もテンプレートで書く場合も、最終的にこの形に揃える。
// プレイヤー側はどちらで作られたかを気にせず再生できる。

export const SEGMENT_KINDS = {
  opening: { label: 'オープニング', order: 0 },
  deepDive: { label: '深掘り', order: 1 },
  glossary: { label: '今日の用語', order: 2 },
  career: { label: '転職メモ', order: 3 },
  roundup: { label: '早耳ラウンドアップ', order: 4 },
  closing: { label: 'クロージング', order: 5 }
};

export function formatDateLabel(date) {
  const d = date instanceof Date ? date : new Date(date);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
}

export function episodeId(date) {
  const d = date instanceof Date ? date : new Date(date);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function toRef(item) {
  return {
    title: item.title,
    url: item.link,
    sourceName: item.sourceName,
    publishedAt: item.publishedAt || null,
    alsoReportedBy: item.alsoReportedBy || []
  };
}

/**
 * 秒を「4分43秒」の形にする。
 *
 * 分に Math.round を使うと 283 秒が「5分43秒」になる。
 * 秒の側で 43 を出しているのに分を切り上げてしまうため、合計が合わなくなる。
 * 分は切り捨てでないといけない。
 */
export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}分${s}秒`;
}

/**
 * ざっくり「約5分」と出すとき用。一覧やバッジなど、細かさが要らない場所で使う。
 */
export function roughMinutes(seconds) {
  return Math.max(1, Math.round((seconds || 0) / 60));
}

/**
 * 読み上げ時間の概算。日本語は 1 分あたり 320 文字前後で読まれる想定。
 */
export function estimateMinutes(segments) {
  const chars = segments.reduce((sum, s) => sum + (s.body ? s.body.length : 0), 0);
  return Math.max(1, Math.round((chars / 320) * 10) / 10);
}

export function buildEpisode({
  date,
  durationMin,
  generator,
  title,
  segments,
  deepDive,
  roundup,
  terms,
  health,
  stats
}) {
  const normalized = segments
    .filter((s) => s && s.body && s.body.trim())
    .map((s, index) => ({
      id: `${s.kind}-${index}`,
      kind: s.kind,
      heading: s.heading || SEGMENT_KINDS[s.kind]?.label || '',
      body: s.body.trim(),
      refs: s.refs || []
    }));

  return {
    id: episodeId(date),
    createdAt: new Date().toISOString(),
    dateLabel: formatDateLabel(date),
    durationMin,
    estimatedMinutes: estimateMinutes(normalized),
    generator,
    title,
    segments: normalized,
    items: {
      deepDive: (deepDive || []).map(toRef),
      roundup: (roundup || []).map(toRef)
    },
    terms: (terms || []).map((t) => ({
      id: t.id,
      term: t.term,
      reading: t.reading,
      category: t.category,
      level: t.level,
      definition: t.definition,
      interview: t.interview
    })),
    health: health || [],
    stats: stats || {}
  };
}
