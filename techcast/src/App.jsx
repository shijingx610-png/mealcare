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
import { AudioFilePlayer } from './lib/audio-player.js';
import { loadStaticIndex, loadStaticEpisode } from './lib/static-source.js';
import { DEMO_DATA } from './lib/demo-data.js';
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

  // 動き方は3通りある。起動時に上から順に試す。
  //   'api'    自分のサーバーがある。記事を集めて台本を書ける
  //   'static' 置いてあるだけの場所（GitHub Pages など）。
  //            生成は別のところで済んでいて、ここでは聞くだけ
  //   'demo'   どちらも無い。何のアプリか分かるサンプルを見せる
  const [mode, setMode] = useState('api');
  const [staticIndex, setStaticIndex] = useState(null);
  const demoMode = mode === 'demo';
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

  // 読み上げと音声ファイルの2種類を持ち、エピソードに音声があるほうを使う。
  // 操作の口は同じにしてあるので、画面側はどちらかを意識しない。
  const speechPlayerRef = useRef(null);
  if (speechPlayerRef.current === null) {
    speechPlayerRef.current = new EpisodePlayer({ backgroundAudio: new BackgroundAudio() });
  }
  const audioPlayerRef = useRef(null);
  if (audioPlayerRef.current === null) audioPlayerRef.current = new AudioFilePlayer();

  const audioUrl = currentEpisode?.audio?.file
    ? currentEpisode.audio.url || currentEpisode.audio.file
    : null;
  const usesAudioFile = Boolean(audioUrl) && AudioFilePlayer.isSupported();
  const player = usesAudioFile ? audioPlayerRef.current : speechPlayerRef.current;

  const wakeLockRef = useRef(null);
  if (wakeLockRef.current === null) wakeLockRef.current = new ScreenWakeLock();

  const autoRunRef = useRef(false);
  const generateRef = useRef(null);
  const lastRunDayRef = useRef(null);

  // --- 初期化 --------------------------------------------------------------

  useEffect(() => player.subscribe(setPlayback), [player]);

  useEffect(() => {
    const speech = speechPlayerRef.current;
    const audio = audioPlayerRef.current;
    const wakeLock = wakeLockRef.current;
    return () => {
      speech.dispose();
      audio.dispose();
      wakeLock.dispose();
    };
  }, []);

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
    speechPlayerRef.current.setRate(settings.rate);
    audioPlayerRef.current.setRate(settings.rate);
  }, [settings.rate]);

  useEffect(() => {
    if (!currentEpisode) return;
    // 片方に切り替えるときは、もう片方を確実に止める。
    // 止め忘れると読み上げと音声が二重に鳴る。
    if (usesAudioFile) {
      speechPlayerRef.current.stop();
      audioPlayerRef.current.load(currentEpisode.segments, {
        url: audioUrl,
        chapters: currentEpisode.chapters
      });
    } else {
      audioPlayerRef.current.stop();
      speechPlayerRef.current.load(currentEpisode.segments);
    }
  }, [currentEpisode, usesAudioFile, audioUrl]);

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
        setError(
          demoMode
            ? 'これはデモです。実際のニュースを集めるには、自分のパソコンでアプリを起動してください。'
            : err.message
        );
      } finally {
        setGenerating(false);
      }
    },
    [settings, demoMode]
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

  // 起動時に、どの動き方ができるかを上から順に試す。
  //   1. 自分のサーバー（記事を集めて台本を書ける）
  //   2. 置いてあるだけの配信（生成済みを聞く）
  //   3. デモ（何のアプリか分かるサンプル）
  // 自動生成をここに置いているのは、「サーバーが居ると分かった」という
  // 外部イベントにぶら下げたいから。別の effect にすると状態を追いかける形になる。
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const res = await fetch('/api/sources');
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (cancelled) return;

        setMode('api');
        setCatalog(data);

        if (autoRunRef.current) return;
        if (!loadSettings().autoGenerateOnOpen) return;
        if (loadEpisodes().some((e) => e.id === todayId())) return;
        autoRunRef.current = true;
        lastRunDayRef.current = todayId();
        generateRef.current?.();
        return;
      } catch {
        // サーバーが居ない。次を試す。
      }

      try {
        const index = await loadStaticIndex();
        if (cancelled) return;
        if (index.episodes.length === 0) throw new Error('配信されている番組がありません');

        const latest = index.episodes[0];
        const episode = await loadStaticEpisode(latest);
        if (cancelled) return;

        setMode('static');
        setStaticIndex(index);
        setCatalog({
          ...DEMO_DATA.catalog,
          podcast: {
            ttsProvider: 'static',
            feedUrl: index.feedUrl,
            episodesWithAudio: index.episodes.filter((e) => e.audio).length
          }
        });
        setCurrentEpisode(episode);
        return;
      } catch {
        // 静的配信でもない。
      }

      if (cancelled) return;
      setMode('demo');
      setCatalog(DEMO_DATA.catalog);
      setCurrentEpisode(DEMO_DATA.episode);
    }

    boot();
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

  async function handleSelectEpisode(episode) {
    // 静的配信では一覧に概要しか無いので、開くときに台本を取りにいく。
    if (mode === 'static' && !episode.segments) {
      try {
        setCurrentEpisode(await loadStaticEpisode(episode));
      } catch (err) {
        setError(`この回を読み込めませんでした：${err.message}`);
        return;
      }
    } else {
      setCurrentEpisode(episode);
    }
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

      {demoMode && (
        <div className="banner banner-demo">
          <div>
            <strong>これはデモです。</strong>
            <br />
            読み上げているニュースはすべて説明用の例で、実際の記事ではありません。
            画面の作りと聞こえ方を確かめるためのものです。
          </div>
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
            mode={mode}
            onGenerate={generate}
            onSeek={(seconds) => player.seek?.(seconds)}
            onToggleLearned={handleToggleLearned}
          />
        )}
        {tab === 'library' && (
          <LibraryView
            episodes={mode === 'static' ? staticIndex?.episodes || [] : episodes}
            readOnly={mode !== 'api'}
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
