import React from 'react';

export default function LibraryView({ episodes, currentId, onSelect, onDelete }) {
  if (episodes.length === 0) {
    return (
      <section className="empty">
        <h2>まだ保存された番組がありません</h2>
        <p>作った番組はこの端末に最大30本まで残ります。</p>
      </section>
    );
  }

  return (
    <section className="library">
      <h2>ライブラリ</h2>
      <p className="library-hint">
        過去の番組はこの端末のブラウザにだけ保存されています。別の端末には引き継がれません。
      </p>
      <ul className="episode-list">
        {episodes.map((ep) => (
          <li key={ep.id} className={ep.id === currentId ? 'episode-row episode-row-current' : 'episode-row'}>
            <button type="button" className="episode-open" onClick={() => onSelect(ep)}>
              <span className="episode-row-date">{ep.dateLabel}</span>
              <span className="episode-row-title">{ep.title}</span>
              <span className="episode-row-meta">
                約{ep.estimatedMinutes}分・
                {ep.generator === 'claude' ? 'Claude' : 'テンプレート'}・
                記事{ep.items.deepDive.length + ep.items.roundup.length}本
              </span>
            </button>
            <button
              type="button"
              className="episode-delete"
              onClick={() => onDelete(ep.id)}
              aria-label={`${ep.dateLabel}の番組を削除`}
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
