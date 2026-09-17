import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EpisodePlayer,
  isSpeechSupported,
  loadVoices,
  pickDefaultVoice
} from './lib/speech.js';
import {
  deleteEpisode,
  exportAll,
  importAll,
  loadEpisodes,
  loadLearnedTerms,
  loadSettings,
  recentlyCoveredLinks,
  saveEpisode,
  saveSettings,
  toggleLearnedTerm
} from './lib/store.js';
import TodayView from './views/TodayView.jsx';
import LibraryView from './views/LibraryView.jsx';
import SourcesView from './views/SourcesView.jsx';
import SettingsView from './views/SettingsView.jsx';

const TABS = [
  { id: 'today', label: '今朝' },
  { id: 'library', label: 'ライブラリ' },
  { id: 'sources', label: '情報源' },
  { id: 'settings', label: '設定' }
];

function todayId(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `リクエストに失敗しました（${res.status}）`);
  }
  return data;
}

export default function App() {
  // localStorage からの読み込みは同期処理なので、effect ではなく初期値で済ませる。
  // effect で setState すると、初回に無駄な再レンダリングが一往復増える。
  const [tab, setTab] = useState('today');
  const [settings, setSettings] = useState(loadSettings);
  const [episodes, setEpisodes] = useState(loadEpisodes);
  const [currentEpisode, setCurrentEpisode] = useState(
    () => loadEpisodes().find((e) => e.id === todayId()) || null
  );
  const [catalog, setCatalog] = useState(null);
  const [learnedTerms, setLearnedTerms] = useState(loadLearnedTerms);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [voices, setVoices] = useState([]);
  const [playback, setPlayback] = useState({
    state: 'idle',
    index: 0,
    total: 0,
    segmentIndex: 0,
    segmentId: null
  });

  const playerRef = useRef(null);
  if (playerRef.current === null) playerRef.current = new EpisodePlayer();
  const player = playerRef.current;

  const autoRunRef = useRef(false);
  const generateRef = useRef(null);

  // --- 初期化 --------------------------------------------------------------

  useEffect(() => player.subscribe(setPlayback), [player]);

  useEffect(() => () => player.dispose(), [player]);

  useEffect(() => {
    let cancelled = false;
    loadVoices().then((list) => {
      if (cancelled) return;
      setVoices(list);
      if (!settings.voiceURI) {
        const preferred = pickDefaultVoice(list);
        if (preferred) {
          player.setVoice(preferred);
          updateSettings({ voiceURI: preferred.voiceURI });
        }
      } else {
        const match = list.find((v) => v.voiceURI === settings.voiceURI);
        if (match) player.setVoice(match);
      }
    });
    return () => {
      cancelled = true;
    };
    // 初回のみ。音声リストは起動後に増えないものとして扱う。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    player.setRate(settings.rate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.rate]);

  useEffect(() => {
    if (currentEpisode) player.load(currentEpisode.segments);
  }, [currentEpisode, player]);

  // --- エピソード生成 ------------------------------------------------------

  const generate = useCallback(
    async (options = {}) => {
      setGenerating(true);
      setError(null);
      try {
        const stored = loadEpisodes();
        const { episode } = await postJson('/api/episode', {
          durationMin: settings.durationMin,
          maxAgeHours: settings.maxAgeHours,
          sourceIds: settings.enabledSourceIds,
          interestWeights: settings.interestWeights,
          useClaude: options.useClaude ?? settings.useClaude,
          excludeLinks: options.includeSeen ? [] : recentlyCoveredLinks(stored),
          learnedTermIds: loadLearnedTerms()
        });
        const next = saveEpisode(episode);
        setEpisodes(next);
        setCurrentEpisode(episode);
        setTab('today');
      } catch (err) {
        setError(err.message);
      } finally {
        setGenerating(false);
      }
    },
    [settings]
  );

  useEffect(() => {
    generateRef.current = generate;
  }, [generate]);

  // 情報源カタログの取得と、朝いちばんの自動生成。
  // 自動生成をここに置いているのは、「カタログが返ってきた」という外部イベントに
  // ぶら下げたいから。別の effect にすると、状態の変化を追いかける形になって複雑になる。
  useEffect(() => {
    let cancelled = false;
    fetch('/api/sources')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setCatalog(data);

        if (autoRunRef.current) return;
        if (!loadSettings().autoGenerateOnOpen) return;
        if (loadEpisodes().some((e) => e.id === todayId())) return;
        autoRunRef.current = true;
        generateRef.current?.();
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            '情報源の一覧を取得できませんでした。開発サーバーが起動しているか確認してください。'
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // --- 設定 ----------------------------------------------------------------

  function updateSettings(patch) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }

  function handleVoiceChange(voiceURI) {
    updateSettings({ voiceURI });
    const match = voices.find((v) => v.voiceURI === voiceURI);
    player.setVoice(match || null);
  }

  function handleToggleLearned(termId) {
    setLearnedTerms(toggleLearnedTerm(termId));
  }

  function handleSelectEpisode(episode) {
    setCurrentEpisode(episode);
    setTab('today');
  }

  function handleDeleteEpisode(id) {
    const next = deleteEpisode(id);
    setEpisodes(next);
    if (currentEpisode?.id === id) {
      setCurrentEpisode(next[0] || null);
      player.stop();
    }
  }

  const enabledSourceIds = useMemo(() => {
    if (settings.enabledSourceIds) return settings.enabledSourceIds;
    if (!catalog) return [];
    return catalog.sources.filter((s) => s.tier === 'core').map((s) => s.id);
  }, [settings.enabledSourceIds, catalog]);

  const speechSupported = isSpeechSupported();

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <h1>TechCast</h1>
            <p className="brand-sub">IT・SaaS業界の朝を、耳から。</p>
          </div>
        </div>
        <nav className="tabs" aria-label="画面の切り替え">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'tab tab-active' : 'tab'}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <div className="banner banner-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="閉じる">
            ×
          </button>
        </div>
      )}

      {!speechSupported && (
        <div className="banner banner-warn">
          このブラウザは音声読み上げに対応していません。台本は読めますが、再生はできません。
          Chrome、Edge、Safari のいずれかをお試しください。
        </div>
      )}

      <main className="app-main">
        {tab === 'today' && (
          <TodayView
            episode={currentEpisode}
            playback={playback}
            player={player}
            generating={generating}
            speechSupported={speechSupported}
            learnedTerms={learnedTerms}
            onGenerate={generate}
            onToggleLearned={handleToggleLearned}
          />
        )}
        {tab === 'library' && (
          <LibraryView
            episodes={episodes}
            currentId={currentEpisode?.id}
            onSelect={handleSelectEpisode}
            onDelete={handleDeleteEpisode}
          />
        )}
        {tab === 'sources' && (
          <SourcesView
            catalog={catalog}
            enabledSourceIds={enabledSourceIds}
            onChange={(ids) => updateSettings({ enabledSourceIds: ids })}
            postJson={postJson}
          />
        )}
        {tab === 'settings' && (
          <SettingsView
            settings={settings}
            catalog={catalog}
            voices={voices}
            learnedTerms={learnedTerms}
            onChange={updateSettings}
            onVoiceChange={handleVoiceChange}
            onExport={exportAll}
            onImport={(payload) => {
              importAll(payload);
              setSettings(loadSettings());
              setEpisodes(loadEpisodes());
              setLearnedTerms(loadLearnedTerms());
            }}
          />
        )}
      </main>
    </div>
  );
}
