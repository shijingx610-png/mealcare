import React from 'react';

function itemCount(ep) {
  if (typeof ep.itemCount === 'number') return ep.itemCount;
  return (ep.items?.deepDive?.length ?? 0) + (ep.items?.roundup?.length ?? 0);
}

function minutesLabel(ep) {
  const seconds = ep.audio?.durationSec;
  if (!seconds) return `約${ep.estimatedMinutes}分`;
  // 分を四捨五入すると 4分43秒 が「5分」になって実体と合わない
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LibraryView({ episodes, currentId, readOnly, onSelect, onDelete }) {
  if (episodes.length === 0) {
    return (
      <section className="empty">
        <h2>まだ番組がありません</h2>
        <p>
          {readOnly
            ? '配信された番組がまだありません。'
            : '作った番組はこの端末に最大30本まで残ります。'}
        </p>
      </section>
    );
  }

  return (
    <section className="library">
      <h2>ライブラリ</h2>
      <p className="library-hint">
        {readOnly
          ? '配信されている番組の一覧です。開くと台本と音声を読み込みます。'
          : '過去の番組はこの端末のブラウザにだけ保存されています。別の端末には引き継がれません。'}
      </p>
      <ul className="episode-list">
        {episodes.map((ep) => (
          <li
            key={ep.id}
            className={ep.id === currentId ? 'episode-row episode-row-current' : 'episode-row'}
          >
            <button type="button" className="episode-open" onClick={() => onSelect(ep)}>
              <span className="episode-row-date">{ep.dateLabel}</span>
              <span className="episode-row-title">{ep.title}</span>
              <span className="episode-row-meta">
                {minutesLabel(ep)}・
                {ep.generator === 'claude' ? 'Claude' : 'テンプレート'}・記事{itemCount(ep)}本
                {ep.audio ? '・音声あり' : ''}
              </span>
            </button>
            {!readOnly && (
              <button
                type="button"
                className="episode-delete"
                onClick={() => onDelete(ep.id)}
                aria-label={`${ep.dateLabel}の番組を削除`}
              >
                削除
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
