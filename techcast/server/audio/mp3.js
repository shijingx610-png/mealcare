// WAV を MP3 にする
// ---------------------------------------------------------------------------
// VOICEVOX が返すのは WAV。10分の番組で 30MB 近くになり、そのままでは
// 毎日配るには重すぎる。MP3 にすると 1/10 以下に収まる。
//
// ffmpeg を呼ぶ手もあるが、外部コマンドに依存すると動く環境が限られるうえ、
// 手元で検証できなくなる。純 JS のエンコーダを使って、どこでも同じ結果にする。

import { Mp3Encoder } from '@breezystack/lamejs';

/**
 * WAV のヘッダを読む。VOICEVOX が返すのは 16bit PCM だが、
 * 他のプロバイダに差し替えたときのために一通り見る。
 */
export function readWavHeader(buffer) {
  if (!buffer || buffer.length < 44) throw new Error('WAV として短すぎます');
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('WAV ではありません');
  }

  // fmt と data のチャンクを探す。間に別のチャンクが挟まることがある。
  let offset = 12;
  let fmt = null;
  let dataOffset = null;
  let dataLength = 0;

  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const body = offset + 8;

    if (id === 'fmt ') {
      fmt = {
        format: buffer.readUInt16LE(body),
        channels: buffer.readUInt16LE(body + 2),
        sampleRate: buffer.readUInt32LE(body + 4),
        byteRate: buffer.readUInt32LE(body + 8),
        blockAlign: buffer.readUInt16LE(body + 12),
        bitsPerSample: buffer.readUInt16LE(body + 14)
      };
    } else if (id === 'data') {
      dataOffset = body;
      // 壊れたサイズ宣言に備えて、実体を超えないようにする
      dataLength = Math.min(size, buffer.length - body);
      break;
    }
    // チャンクは偶数バイト境界に並ぶ
    offset = body + size + (size % 2);
  }

  if (!fmt) throw new Error('WAV の fmt チャンクが見つかりません');
  if (dataOffset === null) throw new Error('WAV の data チャンクが見つかりません');

  return { ...fmt, dataOffset, dataLength };
}

/**
 * WAV の再生時間（秒）。チャプターの時刻計算に使う。
 */
export function wavDurationSeconds(buffer) {
  const h = readWavHeader(buffer);
  const bytesPerSample = (h.bitsPerSample / 8) * h.channels;
  if (!bytesPerSample) return 0;
  return h.dataLength / bytesPerSample / h.sampleRate;
}

/**
 * 16bit PCM の WAV を MP3 にする。
 * @param {Buffer} wav
 * @param {{bitrate?:number}} [options] ビットレート。音声だけなら 64kbps で十分きれい。
 */
export function wavToMp3(wav, options = {}) {
  const h = readWavHeader(wav);
  if (h.bitsPerSample !== 16) {
    throw new Error(`16bit の WAV にのみ対応しています（受け取ったのは ${h.bitsPerSample}bit）`);
  }

  const bitrate = options.bitrate ?? 64;
  const channels = h.channels === 2 ? 2 : 1;
  const encoder = new Mp3Encoder(channels, h.sampleRate, bitrate);

  const samples = Math.floor(h.dataLength / 2);
  const pcm = new Int16Array(samples);
  for (let i = 0; i < samples; i += 1) {
    pcm[i] = wav.readInt16LE(h.dataOffset + i * 2);
  }

  const parts = [];
  // 1152 サンプル単位がMP3のフレーム。その倍数で渡すのが行儀がよい。
  const blockSize = 1152 * channels;

  for (let i = 0; i < pcm.length; i += blockSize) {
    const slice = pcm.subarray(i, Math.min(i + blockSize, pcm.length));
    let encoded;
    if (channels === 2) {
      // インターリーブされているので左右に分ける
      const left = new Int16Array(slice.length / 2);
      const right = new Int16Array(slice.length / 2);
      for (let j = 0; j < slice.length; j += 2) {
        left[j / 2] = slice[j];
        right[j / 2] = slice[j + 1];
      }
      encoded = encoder.encodeBuffer(left, right);
    } else {
      encoded = encoder.encodeBuffer(slice);
    }
    if (encoded.length > 0) parts.push(Buffer.from(encoded));
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) parts.push(Buffer.from(flushed));

  return Buffer.concat(parts);
}
