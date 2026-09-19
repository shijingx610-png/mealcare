import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EpisodePlayer,
  isSpeechSupported,
  loadVoices,
  pickDefaultVoice
} from './lib/speech.js';
import {
  BackgroundAudio,
  ScreenWakeLock,
  isMediaSessionSupported,
  setMediaSession,
  setMediaSessionState
} from './lib/media-session.js';
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
  if (playerRef.current === null) {
    playerRef.current = new EpisodePlayer({ backgroundAudio: new BackgroundAudio() });
  }
  const player = playerRef.current;

  const wakeLockRef = useRef(null);
  if (wakeLockRef.current === null) wakeLockRef.current = new ScreenWakeLock();

  const autoRunRef = useRef(false);
  const generateRef = useRef(null);
  const lastRunDayRef = useRef(null);

  // --- 初期化 --------------------------------------------------------------

  useEffect(() => player.subscribe(setPlayback), [player]);

  useEffect(() => {
    const wakeLock = wakeLockRef.current;
    return () => {
      player.dispose();
      wakeLock.dispose();
    };
  }, [player]);

  // ロック画面とイヤホンのボタンから操作できるようにする。
  // 番組が変わるたびに登録し直さないと、表示が前の番組のままになる。
  useEffect(() => {
    if (!currentEpisode) return;
    setMediaSession({
      title: currentEpisode.title,
      artist: 'TechCast',
      album: currentEpisode.dateLabel,
      handlers: {
        onPlay: () => player.play(),
        onPause: () => player.pause(),
        onStop: () => player.stop(),
        onNext: () => player.skipSegment(1),
        onPrev: () => player.skipSegment(-1)
      }
    });
  }, [currentEpisode, player]);

  useEffect(() => {
    if (playback.state === 'playing') setMediaSessionState('playing');
    else if (playback.state === 'paused') setMediaSessionState('paused');
    else setMediaSessionState('none');
  }, [playback.state]);

  // 画面が消えると読み上げが止まる端末があるので、再生中だけ点けておく。
  useEffect(() => {
    const wakeLock = wakeLockRef.current;
    if (settings.keepScreenAwake && playback.state === 'playing') wakeLock.request();
    else wakeLock.release();
  }, [settings.keepScreenAwake, playback.state]);

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
          learnedTermIds: loadLearnedTerms(),
          urlOverrides: settings.sourceUrlOverrides || {}
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

  // 毎朝の更新。アプリを開きっぱなしにしていても、日付が変わって戻ってきたら作り直す。
  // 「毎日新しいニュースに入れ替わっている」が運用の前提なので、
  // ユーザーが更新を意識しなくて済むようにしておく。
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible') return;
      if (!loadSettings().autoGenerateOnOpen) return;
      if (loadEpisodes().some((e) => e.id === todayId())) return;
      if (autoRunRef.current && lastRunDayRef.current === todayId()) return;
      lastRunDayRef.current = todayId();
      generateRef.current?.();
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

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
        lastRunDayRef.current = todayId();
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

  function handleSaveSourceUrl(sourceId, url) {
    if (!url) return;
    updateSettings({
      sourceUrlOverrides: { ...(settings.sourceUrlOverrides || {}), [sourceId]: url }
    });
  }

  function handleClearSourceUrl(sourceId) {
    const next = { ...(settings.sourceUrlOverrides || {}) };
    delete next[sourceId];
    updateSettings({ sourceUrlOverrides: next });
  }

  // プリセットは情報源と興味の重みをまとめて差し替える。
  // 片方だけ変えても番組の中身は変わらないので、必ずセットで適用する。
  function handleApplyPreset(preset) {
    updateSettings({
      presetId: preset.id,
      enabledSourceIds: preset.sourceIds,
      interestWeights: preset.weights || null
    });
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
            urlOverrides={settings.sourceUrlOverrides || {}}
            presetId={settings.presetId}
            onChange={(ids) => updateSettings({ enabledSourceIds: ids, presetId: null })}
            onApplyPreset={handleApplyPreset}
            onSaveUrl={handleSaveSourceUrl}
            onClearUrl={handleClearSourceUrl}
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
            mediaSessionSupported={isMediaSessionSupported()}
            wakeLockSupported={ScreenWakeLock.isSupported()}
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
