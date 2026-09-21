// 音声合成プロバイダ
// ---------------------------------------------------------------------------
// ブラウザの読み上げは手軽だが、音声ファイルを作れない。
// ファイルにできないと、ポッドキャストアプリで購読できない。
// ここは「台本テキスト → 音声ファイル」だけを担当し、どのサービスを使うかは環境変数で決める。
//
// 対応しているのは次の 2 つ。
//   VOICEVOX     ... 自分で立てる。鍵が要らず、日本語の品質が高い。自宅サーバーやPCで動かす想定。
//   Google Cloud ... APIキーが要る。立ち上げの手間はない。
//
// どちらも未設定なら null を返す。その場合アプリはブラウザ読み上げのまま動く。

import { wavDurationSeconds } from './mp3.js';

const VOICEVOX_DEFAULT_SPEAKER = 3;

class TtsError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'TtsError';
    this.cause = cause;
  }
}

/**
 * VOICEVOX エンジンの HTTP API を叩く。
 * audio_query で読み方を作り、synthesis で WAV にする、という 2 段構え。
 */
class VoicevoxProvider {
  constructor({ baseUrl, speaker, speedScale = 1.0 }) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.speaker = speaker ?? VOICEVOX_DEFAULT_SPEAKER;
    this.speedScale = speedScale;
    this.name = 'voicevox';
    this.contentType = 'audio/wav';
    this.extension = 'wav';
  }

  async synthesize(text, { timeoutMs = 120_000 } = {}) {
    const query = await this.request(
      `/audio_query?speaker=${this.speaker}&text=${encodeURIComponent(text)}`,
      { method: 'POST' },
      timeoutMs
    );
    const params = await query.json();
    params.speedScale = this.speedScale;

    const audio = await this.request(
      `/synthesis?speaker=${this.speaker}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'audio/wav' },
        body: JSON.stringify(params)
      },
      timeoutMs
    );
    return Buffer.from(await audio.arrayBuffer());
  }

  async request(path, init, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(this.baseUrl + path, { ...init, signal: controller.signal });
      if (!res.ok) {
        throw new TtsError(`VOICEVOX が ${res.status} を返しました (${path.split('?')[0]})`);
      }
      return res;
    } catch (err) {
      if (err instanceof TtsError) throw err;
      throw new TtsError(`VOICEVOX に接続できません (${this.baseUrl})`, err);
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Google Cloud Text-to-Speech。
 * 1 リクエストあたりの文字数に上限があるので、呼び出し側で分割して渡すこと。
 */
class GoogleTtsProvider {
  constructor({ apiKey, voiceName, speakingRate = 1.0 }) {
    this.apiKey = apiKey;
    this.voiceName = voiceName || 'ja-JP-Neural2-B';
    this.speakingRate = speakingRate;
    this.name = 'google';
    this.contentType = 'audio/mpeg';
    this.extension = 'mp3';
  }

  async synthesize(text, { timeoutMs = 120_000 } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(this.apiKey)}`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text },
            voice: { languageCode: 'ja-JP', name: this.voiceName },
            audioConfig: { audioEncoding: 'MP3', speakingRate: this.speakingRate }
          })
        }
      );
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new TtsError(`Google TTS が ${res.status} を返しました: ${detail.slice(0, 200)}`);
      }
      const data = await res.json();
      if (!data.audioContent) throw new TtsError('Google TTS の応答に音声が含まれていません');
      return Buffer.from(data.audioContent, 'base64');
    } catch (err) {
      if (err instanceof TtsError) throw err;
      throw new TtsError('Google TTS に接続できません', err);
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * 環境変数から使えるプロバイダを選ぶ。未設定なら null。
 */
export function createTtsProvider(env = process.env) {
  if (env.VOICEVOX_URL) {
    return new VoicevoxProvider({
      baseUrl: env.VOICEVOX_URL,
      speaker: env.VOICEVOX_SPEAKER ? Number(env.VOICEVOX_SPEAKER) : undefined,
      speedScale: env.TTS_SPEED ? Number(env.TTS_SPEED) : 1.0
    });
  }
  if (env.GOOGLE_TTS_API_KEY) {
    return new GoogleTtsProvider({
      apiKey: env.GOOGLE_TTS_API_KEY,
      voiceName: env.GOOGLE_TTS_VOICE,
      speakingRate: env.TTS_SPEED ? Number(env.TTS_SPEED) : 1.0
    });
  }
  return null;
}

// 合成 API には 1 回あたりの文字数上限がある。段落の切れ目で割る。
const MAX_CHARS_PER_REQUEST = 1200;

export function splitForSynthesis(text, maxChars = MAX_CHARS_PER_REQUEST) {
  const sentences = (text || '')
    .split(/(?<=[。！？!?])\s*|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks = [];
  let buffer = '';
  for (const sentence of sentences) {
    if (buffer && buffer.length + sentence.length > maxChars) {
      chunks.push(buffer);
      buffer = sentence;
    } else {
      buffer += sentence;
    }
    while (buffer.length > maxChars) {
      chunks.push(buffer.slice(0, maxChars));
      buffer = buffer.slice(maxChars);
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks;
}

/**
 * エピソードの台本をひとつながりの音声にする。
 * WAV の場合はヘッダを書き直して結合し、MP3 はそのまま連結する。
 */
export async function synthesizeEpisode(provider, episode, options = {}) {
  const { audio } = await synthesizeEpisodeWithChapters(provider, episode, options);
  return audio;
}

// 日本語の読み上げは 1 秒あたり 5〜6 文字前後。
// WAV 以外で長さをバイト数から割り出せないときの当て推量に使う。
const CHARS_PER_SECOND = 5.4;

/**
 * セグメントごとに合成して、1 本につないだ音声とチャプターを返す。
 *
 * まとめて合成したほうが呼び出し回数は減るが、それだと
 * 「どのコーナーが何秒から始まるか」が分からなくなる。
 * コーナー単位で頭出しできることのほうが、聞く側には効く。
 */
export async function synthesizeEpisodeWithChapters(provider, episode, options = {}) {
  const parts = [];
  const chapters = [];
  let elapsed = 0;

  for (const segment of episode.segments) {
    const chunks = splitForSynthesis(segment.body);
    const pieces = [];
    for (const chunk of chunks) {
      pieces.push(await provider.synthesize(chunk, options));
    }

    const merged =
      provider.extension === 'wav' ? concatWav(pieces) : Buffer.concat(pieces);

    let seconds;
    if (provider.extension === 'wav') {
      try {
        seconds = wavDurationSeconds(merged);
      } catch {
        seconds = segment.body.length / CHARS_PER_SECOND;
      }
    } else {
      seconds = segment.body.length / CHARS_PER_SECOND;
    }

    chapters.push({
      segmentId: segment.id,
      kind: segment.kind,
      heading: segment.heading,
      startSec: Number(elapsed.toFixed(2)),
      endSec: Number((elapsed + seconds).toFixed(2))
    });

    elapsed += seconds;
    parts.push(merged);
  }

  const audio = provider.extension === 'wav' ? concatWav(parts) : Buffer.concat(parts);
  return { audio, chapters, durationSec: Number(elapsed.toFixed(2)) };
}

/**
 * 複数の WAV を 1 本にする。
 * 単純に連結するとヘッダが途中に挟まって壊れるので、
 * 先頭のヘッダを使い回し、長さだけ書き直す。
 */
export function concatWav(buffers) {
  const valid = buffers.filter((b) => b && b.length > 44);
  if (valid.length === 0) return Buffer.alloc(0);
  if (valid.length === 1) return valid[0];

  const header = Buffer.from(valid[0].subarray(0, 44));
  const bodies = valid.map((b) => b.subarray(44));
  const totalData = bodies.reduce((sum, b) => sum + b.length, 0);

  header.writeUInt32LE(36 + totalData, 4); // RIFF チャンクサイズ
  header.writeUInt32LE(totalData, 40); // data チャンクサイズ

  return Buffer.concat([header, ...bodies]);
}
