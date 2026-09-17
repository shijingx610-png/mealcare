import React from 'react';

const KIND_LABEL = {
  opening: 'オープニング',
  deepDive: '深掘り',
  glossary: '今日の用語',
  career: '転職メモ',
  roundup: 'ラウンドアップ',
  closing: 'クロージング'
};

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function PlayerBar({ episode, playback, player, speechSupported }) {
  const { state, index, total, segmentIndex } = playback;
  const percent = total > 0 ? Math.round((index / total) * 100) : 0;
  const currentSegment = episode.segments[segmentIndex];

  return (
    <div className="player">
      <div className="player-controls">
        <button
          type="button"
          className="player-skip"
          onClick={() => player.skipSegment(-1)}
          disabled={!speechSupported}
          aria-label="前のコーナーへ"
        >
          ⏮
        </button>
        <button
          type="button"
          className="player-play"
          onClick={() => player.toggle()}
          disabled={!speechSupported}
          aria-label={state === 'playing' ? '一時停止' : '再生'}
        >
          {state === 'playing' ? '❚❚' : '▶'}
        </button>
        <button
          type="button"
          className="player-skip"
          onClick={() => player.skipSegment(1)}
          disabled={!speechSupported}
          aria-label="次のコーナーへ"
        >
          ⏭
        </button>
        <div className="player-now">
          <span className="player-kind">
            {currentSegment ? KIND_LABEL[currentSegment.kind] : '—'}
          </span>
          <span className="player-heading">{currentSegment?.heading || ''}</span>
        </div>
      </div>
      <div className="player-progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="player-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="player-meta">
        {state === 'ended' ? '再生が終わりました' : `${index + 1} / ${total} ブロック`}
        {state === 'paused' && '・一時停止中'}
      </p>
    </div>
  );
}

function SegmentCard({ segment, active, onJump }) {
  return (
    <article className={active ? 'segment segment-active' : 'segment'}>
      <header className="segment-head">
        <button type="button" className="segment-jump" onClick={onJump}>
          <span className="segment-kind">{KIND_LABEL[segment.kind] || segment.kind}</span>
          <h3>{segment.heading}</h3>
        </button>
      </header>
      <div className="segment-body">
        {segment.body.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {segment.refs.length > 0 && (
        <footer className="segment-refs">
          {segment.refs.map((ref) => (
            <a key={ref.url} href={ref.url} target="_blank" rel="noreferrer noopener">
              <span className="ref-source">{ref.sourceName}</span>
              <span className="ref-title">{ref.title}</span>
              {ref.alsoReportedBy?.length > 0 && (
                <span className="ref-also">＋{ref.alsoReportedBy.join('・')}</span>
              )}
            </a>
          ))}
        </footer>
      )}
    </article>
  );
}

function TermCard({ term, learned, onToggle }) {
  return (
    <article className={learned ? 'term term-learned' : 'term'}>
      <header>
        <h4>
          {term.term}
          <span className="term-reading">{term.reading}</span>
        </h4>
        <span className="term-category">{term.category}</span>
      </header>
      <p className="term-definition">{term.definition}</p>
      <p className="term-interview">{term.interview}</p>
      <button type="button" className="term-toggle" onClick={() => onToggle(term.id)}>
        {learned ? '覚えた ✓（もう出さない）' : 'この用語は覚えた'}
      </button>
    </article>
  );
}

export default function TodayView({
  episode,
  playback,
  player,
  generating,
  speechSupported,
  learnedTerms,
  onGenerate,
  onToggleLearned
}) {
  if (generating) {
    return (
      <section className="empty">
        <div className="spinner" aria-hidden="true" />
        <h2>今朝の番組を作っています</h2>
        <p>
          情報源を並列で読み込み、重複を除いて、台本を書いています。
          <br />
          初回は 30 秒ほどかかることがあります。
        </p>
      </section>
    );
  }

  if (!episode) {
    return (
      <section className="empty">
        <h2>まだ今朝の番組がありません</h2>
        <p>情報源から記事を集めて、聞ける形の台本にします。</p>
        <button type="button" className="primary" onClick={() => onGenerate()}>
          今朝の番組を作る
        </button>
      </section>
    );
  }

  const failedSources = (episode.health || []).filter((h) => !h.ok);
  const learnedSet = new Set(learnedTerms);

  return (
    <section className="today">
      <div className="episode-head">
        <p className="episode-date">{episode.dateLabel}</p>
        <h2>{episode.title}</h2>
        <div className="episode-meta">
          <span className={episode.generator === 'claude' ? 'chip chip-claude' : 'chip'}>
            {episode.generator === 'claude' ? 'Claude 生成' : 'テンプレート生成'}
          </span>
          <span className="chip">約 {episode.estimatedMinutes} 分</span>
          <span className="chip">
            深掘り {episode.items.deepDive.length} / 一言 {episode.items.roundup.length}
          </span>
          {episode.createdAt && <span className="chip">{formatTime(episode.createdAt)} 作成</span>}
        </div>
      </div>

      {episode.fallbackReason && (
        <div className="banner banner-warn">{episode.fallbackReason}</div>
      )}

      {failedSources.length > 0 && (
        <div className="banner banner-warn">
          {failedSources.length} 件の情報源が読み込めませんでした（
          {failedSources.map((f) => f.sourceId).join('、')}）。「情報源」タブでヘルスチェックを実行してください。
        </div>
      )}

      <PlayerBar
        episode={episode}
        playback={playback}
        player={player}
        speechSupported={speechSupported}
      />

      <div className="segments">
        {episode.segments.map((segment, index) => (
          <SegmentCard
            key={segment.id}
            segment={segment}
            active={playback.segmentIndex === index && playback.state !== 'idle'}
            onJump={() => player.jumpToSegment(index)}
          />
        ))}
      </div>

      {episode.terms.length > 0 && (
        <section className="terms">
          <h3>用語メモ</h3>
          <p className="terms-hint">
            番組で触れた用語をここに残しています。覚えた用語に印をつけると、次回以降は別の用語が選ばれます。
          </p>
          <div className="term-grid">
            {episode.terms.map((term) => (
              <TermCard
                key={term.id}
                term={term}
                learned={learnedSet.has(term.id)}
                onToggle={onToggleLearned}
              />
            ))}
          </div>
        </section>
      )}

      <div className="regenerate">
        <button type="button" onClick={() => onGenerate()} disabled={generating}>
          作り直す
        </button>
        <button type="button" onClick={() => onGenerate({ includeSeen: true })} disabled={generating}>
          既出も含めて作り直す
        </button>
      </div>
    </section>
  );
}
