import React, { useState } from 'react';

export default function SourcesView({ catalog, enabledSourceIds, onChange, postJson }) {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);
  const [checkError, setCheckError] = useState(null);

  if (!catalog) {
    return (
      <section className="empty">
        <div className="spinner" aria-hidden="true" />
        <p>情報源を読み込んでいます…</p>
      </section>
    );
  }

  const enabled = new Set(enabledSourceIds);
  const resultById = new Map((results?.results || []).map((r) => [r.sourceId, r]));

  function toggle(id) {
    const next = new Set(enabled);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  async function runHealthCheck() {
    setChecking(true);
    setCheckError(null);
    try {
      const data = await postJson('/api/health', { sourceIds: catalog.sources.map((s) => s.id) });
      setResults(data);
    } catch (err) {
      setCheckError(err.message);
    } finally {
      setChecking(false);
    }
  }

  const groups = [
    { id: 'ja', label: '日本語', sources: catalog.sources.filter((s) => s.lang === 'ja') },
    { id: 'en', label: '英語', sources: catalog.sources.filter((s) => s.lang === 'en') }
  ];

  return (
    <section className="sources">
      <h2>情報源</h2>
      <p className="sources-hint">
        チェックを入れた情報源だけが毎朝読み込まれます。多すぎると生成が遅くなり、
        少なすぎると視点が偏ります。まずは既定のまま使い、物足りなければ足すのがおすすめです。
      </p>

      <div className="health-bar">
        <button type="button" className="primary" onClick={runHealthCheck} disabled={checking}>
          {checking ? '確認中…' : '全情報源のヘルスチェック'}
        </button>
        {results && (
          <span className="health-summary">
            {results.results.filter((r) => r.ok).length} / {results.results.length} 件が正常
          </span>
        )}
      </div>

      <p className="sources-note">
        フィードの URL は移転や停止が起きます。うまく取得できないものが出たら、
        ここで確認して外すか、URL を直してください。
      </p>

      {checkError && <div className="banner banner-error">{checkError}</div>}

      {groups.map((group) => (
        <div key={group.id} className="source-group">
          <h3>{group.label}</h3>
          <ul className="source-list">
            {group.sources.map((source) => {
              const result = resultById.get(source.id);
              return (
                <li key={source.id} className="source-row">
                  <label className="source-main">
                    <input
                      type="checkbox"
                      checked={enabled.has(source.id)}
                      onChange={() => toggle(source.id)}
                    />
                    <span className="source-name">
                      {source.name}
                      {source.tier === 'core' && <span className="badge">既定</span>}
                    </span>
                  </label>
                  <p className="source-note">{source.note}</p>
                  <p className="source-url">{source.url}</p>
                  {result && (
                    <p className={result.ok ? 'source-status ok' : 'source-status ng'}>
                      {result.ok
                        ? `正常・${result.itemCount}件取得・${result.elapsedMs}ms`
                        : `取得できません：${result.error}`}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </section>
  );
}
