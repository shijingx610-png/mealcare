// 音声ファイルを再生するプレイヤー
// ---------------------------------------------------------------------------
// ブラウザの読み上げ（EpisodePlayer）と同じ操作で使えるようにしてある。
// 画面側はどちらが動いているかを意識しなくていい。
//
// 読み上げに対してこちらが優れている点。
//   - 画面を消しても止まらない
//   - シークできる。聞き直しが楽
//   - 声が安定する。端末ごとの当たり外れが無い
//
// チャプター（コーナーごとの開始・終了秒）を持たせているので、
// 音声ファイルでもコーナー単位の頭出しができる。

export class AudioFilePlayer {
  constructor() {
    this.audio = null;
    this.chapters = [];
    this.segments = [];
    this.rate = 1;
    this.state = 'idle';
    this.listeners = new Set();
    this.onTimeUpdate = this.onTimeUpdate.bind(this);
    this.onEnded = this.onEnded.bind(this);
    this.onError = this.onError.bind(this);
    this.onLoaded = this.onLoaded.bind(this);
  }

  static isSupported() {
    return typeof Audio !== 'undefined';
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    const duration = this.audio?.duration;
    const currentTime = this.audio?.currentTime ?? 0;
    const snapshot = {
      state: this.state,
      kind: 'audio',
      index: this.segmentIndexAt(currentTime),
      total: this.segments.length,
      segmentIndex: this.segmentIndexAt(currentTime),
      segmentId: this.chapters[this.segmentIndexAt(currentTime)]?.segmentId ?? null,
      currentTime,
      duration: Number.isFinite(duration) ? duration : 0,
      text: ''
    };
    for (const l of this.listeners) l(snapshot);
  }

  /**
   * @param {Array} segments エピソードのセグメント
   * @param {{url:string, chapters?:Array}} audioInfo
   */
  load(segments, audioInfo) {
    this.detach();
    this.segments = segments || [];

    // チャプターが無い音声でも、せめて全体を1本として扱えるようにする
    this.chapters =
      audioInfo?.chapters?.length === this.segments.length
        ? audioInfo.chapters
        : this.segments.map((s, i) => ({ segmentId: s.id, startSec: i, endSec: i + 1 }));

    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = audioInfo.url;
    audio.playbackRate = this.rate;
    audio.setAttribute('playsinline', '');
    audio.addEventListener('timeupdate', this.onTimeUpdate);
    audio.addEventListener('ended', this.onEnded);
    audio.addEventListener('error', this.onError);
    audio.addEventListener('loadedmetadata', this.onLoaded);
    this.audio = audio;
    this.state = 'idle';
    this.emit();
  }

  detach() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.removeEventListener('timeupdate', this.onTimeUpdate);
    this.audio.removeEventListener('ended', this.onEnded);
    this.audio.removeEventListener('error', this.onError);
    this.audio.removeEventListener('loadedmetadata', this.onLoaded);
    this.audio.src = '';
    this.audio = null;
  }

  onTimeUpdate() {
    if (this.state === 'playing') this.emit();
  }

  onLoaded() {
    this.emit();
  }

  onEnded() {
    this.state = 'ended';
    this.emit();
  }

  onError() {
    this.state = 'error';
    this.emit();
  }

  segmentIndexAt(seconds) {
    if (this.chapters.length === 0) return 0;
    for (let i = this.chapters.length - 1; i >= 0; i -= 1) {
      if (seconds >= this.chapters[i].startSec) return i;
    }
    return 0;
  }

  play() {
    if (!this.audio) return;
    if (this.state === 'ended') this.audio.currentTime = 0;
    this.audio.playbackRate = this.rate;
    const started = this.audio.play();
    this.state = 'playing';
    this.emit();
    if (started?.catch) {
      started.catch(() => {
        // 自動再生の拒否など。押し直せるように止まった状態に戻す。
        this.state = 'paused';
        this.emit();
      });
    }
  }

  pause() {
    if (!this.audio) return;
    this.audio.pause();
    this.state = 'paused';
    this.emit();
  }

  toggle() {
    if (this.state === 'playing') this.pause();
    else this.play();
  }

  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.state = 'idle';
    this.emit();
  }

  seek(seconds) {
    if (!this.audio) return;
    const duration = Number.isFinite(this.audio.duration) ? this.audio.duration : null;
    const target = Math.max(0, duration ? Math.min(seconds, duration - 0.25) : seconds);
    this.audio.currentTime = target;
    this.emit();
  }

  jumpToSegment(segmentIndex) {
    const chapter = this.chapters[segmentIndex];
    if (!chapter) return;
    this.seek(chapter.startSec);
  }

  skipSegment(direction) {
    const current = this.segmentIndexAt(this.audio?.currentTime ?? 0);
    const target = current + direction;
    if (target < 0) {
      this.seek(0);
      return;
    }
    if (target >= this.chapters.length) return;
    this.jumpToSegment(target);
  }

  setRate(rate) {
    this.rate = rate;
    if (this.audio) this.audio.playbackRate = rate;
  }

  // 読み上げ側と同じ形にしておく。画面側で分岐しなくて済む。
  setVoice() {}

  dispose() {
    this.detach();
    this.listeners.clear();
  }
}
