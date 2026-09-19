import React, { useState } from 'react';

function PresetRow({ presets, activeId, onApply }) {
  if (!presets?.length) return null;
  return (
    <div className="presets">
      <h3>プリセット</h3>
      <p className="hint">
        情報源と興味の重みをまとめて切り替えます。この 2 つはセットで効くので、片方だけ変えても番組は変わりません。
      </p>
      <div className="preset-row">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={activeId === preset.id ? 'preset preset-active' : 'preset'}
            onClick={() => onApply(preset)}
          >
            <strong>{preset.name}</strong>
            <span>{preset.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SourceRow({ source, enabled, override, result, onToggle, onSaveUrl, onClearUrl }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(override || source.url);

  const activeUrl = override || source.url;
  const moved = result?.ok && result.resolvedUrl && result.resolvedUrl !== activeUrl;

  return (
    <li className="source-row">
      <label className="source-main">
        <input type="checkbox" checked={enabled} onChange={() => onToggle(source.id)} />
        <span className="source-name">
          {source.name}
          {source.tier === 'core' && <span className="badge">既定</span>}
          {override && <span className="badge badge-fixed">URL修正済み</span>}
        </span>
      </label>

      <p className="source-note">{source.note}</p>
      <p className="source-url">{activeUrl}</p>

      {result && (
        <div className={result.ok ? 'source-status ok' : 'source-status ng'}>
          {result.ok
            ? `読み込めました・${result.itemCount}件・${result.elapsedMs}ms`
            : `読み込めません：${result.error}`}
        </div>
      )}

      {moved && (
        <div className="source-fix">
          <p>
            {result.discovered
              ? 'サイト本体から新しいフィードの場所を見つけました。'
              : '代替の場所で読み込めました。'}
          </p>
          <code>{result.resolvedUrl}</code>
          <button type="button" onClick={() => onSaveUrl(source.id, result.resolvedUrl)}>
            この URL に切り替える
          </button>
        </div>
      )}

      {result && !result.ok && result.tried?.length > 0 && (
        <details className="source-tried">
          <summary>試した URL（{result.tried.length}）</summary>
          <ul>
            {result.tried.map((t, i) => (
              <li key={`${t.url}-${i}`}>
                <code>{t.url}</code>
                <span>{t.error}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="source-actions">
        {editing ? (
          <>
            <input
              type="url"
              className="source-input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://example.com/feed"
              aria-label={`${source.name} のフィードURL`}
            />
            <button
              type="button"
              onClick={() => {
                onSaveUrl(source.id, draft.trim());
                setEditing(false);
              }}
            >
              保存
            </button>
            <button type="button" onClick={() => setEditing(false)}>
              取消
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setDraft(activeUrl);
                setEditing(true);
              }}
            >
              URL を直す
            </button>
            {override && (
              <button type="button" onClick={() => onClearUrl(source.id)}>
                既定に戻す
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}

export default function SourcesView({
  catalog,
  enabledSourceIds,
  urlOverrides,
  presetId,
  onChange,
  onApplyPreset,
  onSaveUrl,
  onClearUrl,
  postJson
}) {
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

  async function runHealthCheck(scope) {
    setChecking(true);
    setCheckError(null);
    try {
      const ids =
        scope === 'enabled' ? [...enabled] : catalog.sources.map((s) => s.id);
      const data = await postJson('/api/health', { sourceIds: ids, urlOverrides });
      setResults(data);
    } catch (err) {
      setCheckError(err.message);
    } finally {
      setChecking(false);
    }
  }

  const checked = results?.results || [];
  const okCount = checked.filter((r) => r.ok).length;
  const movable = checked.filter(
    (r) => r.ok && r.resolvedUrl && r.resolvedUrl !== (urlOverrides[r.sourceId] || r.catalogUrl)
  );

  const groups = [
    { id: 'ja', label: '日本語', sources: catalog.sources.filter((s) => s.lang === 'ja') },
    { id: 'en', label: '英語', sources: catalog.sources.filter((s) => s.lang === 'en') }
  ];

  return (
    <section className="sources">
      <h2>情報源</h2>

      <PresetRow presets={catalog.presets} activeId={presetId} onApply={onApplyPreset} />

      <p className="sources-hint">
        チェックを入れた情報源だけが毎朝読み込まれます。多すぎると生成が遅くなり、
        少なすぎると視点が偏ります。
      </p>

      <div className="health-bar">
        <button type="button" className="primary" onClick={() => runHealthCheck('enabled')} disabled={checking}>
          {checking ? '確認中…' : '使用中の情報源を確認'}
        </button>
        <button type="button" onClick={() => runHealthCheck('all')} disabled={checking}>
          全部を確認
        </button>
        {results && (
          <span className="health-summary">
            {okCount} / {checked.length} 件が読み込めました
          </span>
        )}
      </div>

      {movable.length > 0 && (
        <div className="banner banner-warn">
          <div>
            {movable.length} 件のフィードが移転していました。各項目の「この URL に切り替える」で直せます。
            <button
              type="button"
              className="link-button"
              onClick={() => movable.forEach((r) => onSaveUrl(r.sourceId, r.resolvedUrl))}
            >
              まとめて切り替える
            </button>
          </div>
        </div>
      )}

      <p className="sources-note">
        フィードの URL は移転も停止もします。読み込めないものがあっても、
        代替の場所とサイト本体を自動で当たって復帰を試みます。それでもだめなら
        「URL を直す」で手入力できます。直した URL はこの端末に保存されます。
      </p>

      {checkError && <div className="banner banner-error">{checkError}</div>}

      {groups.map((group) => (
        <div key={group.id} className="source-group">
          <h3>{group.label}</h3>
          <ul className="source-list">
            {group.sources.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                enabled={enabled.has(source.id)}
                override={urlOverrides[source.id]}
                result={resultById.get(source.id)}
                onToggle={toggle}
                onSaveUrl={onSaveUrl}
                onClearUrl={onClearUrl}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
