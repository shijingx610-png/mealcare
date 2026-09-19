// スマホで「ポッドキャストらしく」聞くための補助
// ---------------------------------------------------------------------------
// ブラウザの読み上げ（speechSynthesis）は、OS からは「音声再生」と見なされない。
// そのため、そのままではロック画面に再生コントロールが出ず、
// 画面を消すと止まってしまう。ここで 3 つの手を打っている。
//
//  1. 無音に近い音声をループ再生して、ページを「メディア再生中」にする
//     → MediaSession が有効になり、ロック画面やイヤホンのボタンが効く
//  2. MediaSession に番組情報と操作ハンドラを登録する
//     → ロック画面に番組名が出て、再生・停止・スキップができる
//  3. Screen Wake Lock で画面を消さない選択肢を用意する
//     → iOS は 1 と 2 だけでは画面ロックで止まるため、現実的にはこれが要る
//
// 正直に書いておくと、iOS Safari は画面を消すと読み上げが止まる。
// これはブラウザの制約で、回避策がない。恒久的に解くには音声ファイル化が要る。

// 8kHz・8bit・モノラルの WAV を組み立てる。中身はほぼ無音。
// 音源ファイルを持ちたくないので、その場で作ってデータURLにする。
function buildNearSilentWav(seconds = 1) {
  const sampleRate = 8000;
  const samples = sampleRate * seconds;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);

  const writeAscii = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt チャンクの長さ
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // モノラル
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // バイト毎秒
  view.setUint16(32, 1, true); // ブロックサイズ
  view.setUint16(34, 8, true); // ビット深度
  writeAscii(36, 'data');
  view.setUint32(40, samples, true);

  // 8bit PCM の無音は 128。完全な無音だと「音が鳴っていない」と判定される
  // ブラウザがあるので、聞こえない範囲でわずかに振らせる。
  for (let i = 0; i < samples; i += 1) {
    bytes[44 + i] = 128 + (i % 2);
  }

  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

let silentUrl = null;
function getSilentUrl() {
  if (!silentUrl) silentUrl = buildNearSilentWav(1);
  return silentUrl;
}

export class BackgroundAudio {
  constructor() {
    this.audio = null;
  }

  ensure() {
    if (this.audio) return this.audio;
    if (typeof Audio === 'undefined') return null;
    const audio = new Audio(getSilentUrl());
    audio.loop = true;
    audio.volume = 0.001;
    audio.preload = 'auto';
    // iOS で「無音だから」と再生対象から外されないように明示しておく
    audio.setAttribute('playsinline', '');
    this.audio = audio;
    return audio;
  }

  // 必ずユーザー操作の延長で呼ぶこと。そうでないと自動再生が拒否される。
  async start() {
    const audio = this.ensure();
    if (!audio) return false;
    try {
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }

  stop() {
    if (this.audio) this.audio.pause();
  }
}

export function isMediaSessionSupported() {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

/**
 * ロック画面に出す情報と、そこから来る操作を登録する。
 */
export function setMediaSession({ title, artist, album, handlers = {} }) {
  if (!isMediaSessionSupported()) return;
  const ms = navigator.mediaSession;

  try {
    ms.metadata = new window.MediaMetadata({
      title: title || 'TechCast',
      artist: artist || 'IT・SaaS業界の朝',
      album: album || 'TechCast'
    });
  } catch {
    // MediaMetadata が無い環境は、操作ハンドラだけ登録する
  }

  const actions = {
    play: handlers.onPlay,
    pause: handlers.onPause,
    stop: handlers.onStop,
    nexttrack: handlers.onNext,
    previoustrack: handlers.onPrev
  };

  for (const [action, handler] of Object.entries(actions)) {
    try {
      ms.setActionHandler(action, handler || null);
    } catch {
      // 対応していない操作は黙って飛ばす
    }
  }
}

export function setMediaSessionState(state) {
  if (!isMediaSessionSupported()) return;
  try {
    navigator.mediaSession.playbackState = state;
  } catch {
    // 未対応なら何もしない
  }
}

/**
 * 再生中に画面を消させない。iOS で最後まで聞き切るには実質これが要る。
 * 対応していない環境では静かに何もしない。
 */
export class ScreenWakeLock {
  constructor() {
    this.sentinel = null;
    this.wanted = false;
    this.onVisibility = this.onVisibility.bind(this);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibility);
    }
  }

  static isSupported() {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  async request() {
    this.wanted = true;
    if (!ScreenWakeLock.isSupported()) return false;
    if (this.sentinel) return true;
    try {
      this.sentinel = await navigator.wakeLock.request('screen');
      this.sentinel.addEventListener('release', () => {
        this.sentinel = null;
      });
      return true;
    } catch {
      return false;
    }
  }

  async release() {
    this.wanted = false;
    if (!this.sentinel) return;
    try {
      await this.sentinel.release();
    } catch {
      // すでに解放済み
    }
    this.sentinel = null;
  }

  // タブに戻ったときロックは失われている。望まれていれば取り直す。
  onVisibility() {
    if (this.wanted && document.visibilityState === 'visible' && !this.sentinel) {
      this.request();
    }
  }

  dispose() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibility);
    }
    this.release();
  }
}
