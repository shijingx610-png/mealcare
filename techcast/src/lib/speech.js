// Web Speech API を「ポッドキャストらしく」使うための層
// ---------------------------------------------------------------------------
// ブラウザの読み上げには、そのまま使うと必ずぶつかる癖がいくつかある。
//
//  1. Chrome は 1 回の発話が 15 秒ほどを超えると勝手に止まる。
//     → 台本を短いチャンクに割り、さらに pause/resume を定期的に叩いて回避する。
//  2. getVoices() は初回に空配列を返すことがある（音声リストの読み込みが非同期）。
//     → voiceschanged を待つ。
//  3. iOS Safari は、ユーザー操作から始まっていない speak() を無視する。
//     → 最初の再生は必ずボタン押下から始める（UI 側の責務）。
//  4. 画面ロック中は読み上げが止まる。これは回避できない。
//     → README に明記し、実音声ファイル化（フェーズ2）の動機として扱う。

const CHUNK_TARGET_CHARS = 90;
const RESUME_WATCHDOG_MS = 9000;

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * 読み上げ単位に切る。文の途中で切れると聞きづらいので、句点を優先する。
 */
export function chunkText(text) {
  if (!text) return [];
  const sentences = text
    .replace(/\r/g, '')
    .split(/(?<=[。！？!?])\s*|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks = [];
  let buffer = '';
  for (const sentence of sentences) {
    if (buffer && buffer.length + sentence.length > CHUNK_TARGET_CHARS) {
      chunks.push(buffer);
      buffer = sentence;
    } else {
      buffer += sentence;
    }
    // 1 文だけで長すぎる場合は読点で割る
    while (buffer.length > CHUNK_TARGET_CHARS * 2) {
      const cut = buffer.lastIndexOf('、', CHUNK_TARGET_CHARS);
      const at = cut > CHUNK_TARGET_CHARS * 0.4 ? cut + 1 : CHUNK_TARGET_CHARS;
      chunks.push(buffer.slice(0, at));
      buffer = buffer.slice(at);
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks;
}

/**
 * セグメント配列を、再生キュー（チャンクの一次元配列）に変換する。
 */
export function buildQueue(segments) {
  const queue = [];
  segments.forEach((segment, segmentIndex) => {
    chunkText(segment.body).forEach((text) => {
      queue.push({ text, segmentIndex, segmentId: segment.id });
    });
  });
  return queue;
}

export async function loadVoices(timeoutMs = 2000) {
  if (!isSpeechSupported()) return [];
  const synth = window.speechSynthesis;

  const immediate = synth.getVoices();
  if (immediate.length > 0) return immediate;

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      synth.removeEventListener('voiceschanged', finish);
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', finish);
    setTimeout(finish, timeoutMs);
  });
}

export function pickDefaultVoice(voices) {
  if (!voices || voices.length === 0) return null;
  const japanese = voices.filter((v) => (v.lang || '').toLowerCase().startsWith('ja'));
  if (japanese.length === 0) return null;
  // ローカル合成のほうが途切れにくいので優先する
  return japanese.find((v) => v.localService) || japanese[0];
}

export class EpisodePlayer {
  // backgroundAudio を渡すと、再生中だけ無音に近い音声を鳴らし続ける。
  // これがないと OS が「音声再生中」と認識せず、ロック画面の操作が出ない。
  constructor(options = {}) {
    this.backgroundAudio = options.backgroundAudio || null;
    this.queue = [];
    this.index = 0;
    this.rate = 1.15;
    this.voice = null;
    this.state = 'idle'; // idle | playing | paused | ended
    this.watchdog = null;
    this.listeners = new Set();
    this.currentUtterance = null;
    this.stopping = false;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    const snapshot = {
      state: this.state,
      index: this.index,
      total: this.queue.length,
      segmentIndex: this.queue[this.index]?.segmentIndex ?? 0,
      segmentId: this.queue[this.index]?.segmentId ?? null,
      text: this.queue[this.index]?.text ?? ''
    };
    for (const l of this.listeners) l(snapshot);
  }

  load(segments) {
    this.stop();
    this.queue = buildQueue(segments);
    this.index = 0;
    this.state = 'idle';
    this.emit();
  }

  setRate(rate) {
    this.rate = rate;
    // 再生中に速度を変えるには、現在のチャンクを読み直すしかない
    if (this.state === 'playing') {
      this.restartCurrentChunk();
    }
  }

  setVoice(voice) {
    this.voice = voice;
    if (this.state === 'playing') {
      this.restartCurrentChunk();
    }
  }

  restartCurrentChunk() {
    const at = this.index;
    this.cancelSpeech();
    this.index = at;
    this.speakCurrent();
  }

  play() {
    if (!isSpeechSupported() || this.queue.length === 0) return;
    // ユーザー操作の延長で呼ばれている前提。ここを外すと自動再生が拒否される。
    if (this.backgroundAudio) this.backgroundAudio.start();

    if (this.state === 'paused') {
      window.speechSynthesis.resume();
      this.state = 'playing';
      this.startWatchdog();
      this.emit();
      return;
    }
    if (this.state === 'ended') this.index = 0;
    this.state = 'playing';
    this.speakCurrent();
    this.startWatchdog();
    this.emit();
  }

  pause() {
    if (!isSpeechSupported()) return;
    this.stopWatchdog();
    window.speechSynthesis.pause();
    if (this.backgroundAudio) this.backgroundAudio.stop();
    this.state = 'paused';
    this.emit();
  }

  toggle() {
    if (this.state === 'playing') this.pause();
    else this.play();
  }

  stop() {
    this.stopWatchdog();
    this.cancelSpeech();
    if (this.backgroundAudio) this.backgroundAudio.stop();
    this.index = 0;
    this.state = 'idle';
    this.emit();
  }

  cancelSpeech() {
    if (!isSpeechSupported()) return;
    // cancel() は onend を発火させるので、飛ばし処理が二重に走らないよう印をつける
    this.stopping = true;
    window.speechSynthesis.cancel();
    this.stopping = false;
    this.currentUtterance = null;
  }

  jumpToSegment(segmentIndex) {
    const at = this.queue.findIndex((c) => c.segmentIndex === segmentIndex);
    if (at < 0) return;
    const wasPlaying = this.state === 'playing';
    this.cancelSpeech();
    this.index = at;
    if (wasPlaying) {
      this.speakCurrent();
    } else {
      this.state = 'paused';
    }
    this.emit();
  }

  skipSegment(direction) {
    const current = this.queue[this.index]?.segmentIndex ?? 0;
    const target = current + direction;
    if (target < 0) {
      this.jumpToSegment(current);
      return;
    }
    const exists = this.queue.some((c) => c.segmentIndex === target);
    if (!exists) return;
    this.jumpToSegment(target);
  }

  speakCurrent() {
    if (!isSpeechSupported()) return;
    const chunk = this.queue[this.index];
    if (!chunk) {
      this.state = 'ended';
      this.stopWatchdog();
      this.emit();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunk.text);
    utterance.rate = this.rate;
    utterance.lang = 'ja-JP';
    if (this.voice) utterance.voice = this.voice;

    utterance.onend = () => {
      if (this.stopping || this.state !== 'playing') return;
      this.index += 1;
      if (this.index >= this.queue.length) {
        this.state = 'ended';
        this.stopWatchdog();
        if (this.backgroundAudio) this.backgroundAudio.stop();
        this.emit();
        return;
      }
      this.emit();
      this.speakCurrent();
    };

    utterance.onerror = (event) => {
      // interrupted / canceled は自分で止めたときにも飛んでくるので無視する
      if (this.stopping || event.error === 'interrupted' || event.error === 'canceled') return;
      this.state = 'paused';
      this.stopWatchdog();
      if (this.backgroundAudio) this.backgroundAudio.stop();
      this.emit();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  // Chrome の「長い発話が勝手に止まる」問題への定番の回避策。
  // 再生中に pause() → resume() を短い間隔で叩き続けると、タイマーがリセットされる。
  startWatchdog() {
    this.stopWatchdog();
    this.watchdog = setInterval(() => {
      if (!isSpeechSupported()) return;
      const synth = window.speechSynthesis;
      if (this.state === 'playing' && synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, RESUME_WATCHDOG_MS);
  }

  stopWatchdog() {
    if (this.watchdog) {
      clearInterval(this.watchdog);
      this.watchdog = null;
    }
  }

  dispose() {
    this.stop();
    this.listeners.clear();
  }
}
