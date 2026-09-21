// 尺の配分・音声変換・静的配信のテスト
// ---------------------------------------------------------------------------
// 毎朝自動で回る部分なので、壊れても誰も見ていない。
// 気づけるように、ここで固定しておく。

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { scriptBudget, CHARS_PER_MINUTE } from '../script-budget.js';
import { planFor } from '../rank.js';
import { readWavHeader, wavDurationSeconds, wavToMp3 } from '../audio/mp3.js';
import { synthesizeEpisodeWithChapters } from '../audio/tts.js';
import { buildPodcastFeed } from '../audio/podcast-feed.js';

function makeWav(seconds, { rate = 24000, tone = true } = {}) {
  const n = Math.max(1, Math.round(rate * seconds));
  const data = n * 2;
  const b = Buffer.alloc(44 + data);
  b.write('RIFF', 0, 'ascii');
  b.writeUInt32LE(36 + data, 4);
  b.write('WAVE', 8, 'ascii');
  b.write('fmt ', 12, 'ascii');
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36, 'ascii');
  b.writeUInt32LE(data, 40);
  if (tone) {
    for (let i = 0; i < n; i += 1) {
      b.writeInt16LE(Math.round(6000 * Math.sin((2 * Math.PI * 440 * i) / rate)), 44 + i * 2);
    }
  }
  return b;
}

// --- 尺の配分 --------------------------------------------------------------

describe('台本の文字数配分', () => {
  for (const minutes of [5, 10, 15]) {
    test(`${minutes}分の指示が実際に${minutes}分になる`, () => {
      const budget = scriptBudget(minutes, planFor(minutes));
      const actualMinutes = budget.plannedTotal / CHARS_PER_MINUTE;
      // 丸めのぶんだけ許容する
      assert.ok(
        Math.abs(actualMinutes - minutes) < 0.1,
        `${minutes}分の指示なのに ${actualMinutes.toFixed(2)}分ぶんしかない`
      );
    });
  }

  test('尺が伸びると深掘りが厚くなる', () => {
    const a = scriptBudget(5, planFor(5)).deepDiveEach;
    const b = scriptBudget(10, planFor(10)).deepDiveEach;
    const c = scriptBudget(15, planFor(15)).deepDiveEach;
    assert.ok(a < b && b < c, '尺を伸ばしても1本あたりが厚くなっていない');
  });

  test('挨拶は尺に比例して長くならない', () => {
    const short = scriptBudget(5, planFor(5));
    const long = scriptBudget(15, planFor(15));
    assert.ok(long.opening < short.opening * 2, '長い番組で挨拶が伸びすぎている');
  });
});

// --- 音声 ------------------------------------------------------------------

describe('WAVの読み取りとMP3化', () => {
  test('ヘッダを読む', () => {
    const h = readWavHeader(makeWav(1));
    assert.equal(h.channels, 1);
    assert.equal(h.sampleRate, 24000);
    assert.equal(h.bitsPerSample, 16);
  });

  test('長さを秒で出す', () => {
    assert.equal(Number(wavDurationSeconds(makeWav(3)).toFixed(2)), 3);
    assert.equal(Number(wavDurationSeconds(makeWav(0.5)).toFixed(2)), 0.5);
  });

  test('WAVでないものは断る', () => {
    assert.throws(() => readWavHeader(Buffer.alloc(100)), /WAV ではありません/);
    assert.throws(() => readWavHeader(Buffer.alloc(10)), /短すぎます/);
  });

  test('MP3にすると十分に小さくなる', () => {
    const wav = makeWav(5);
    const mp3 = wavToMp3(wav);
    assert.ok(mp3.length > 0, 'MP3 が空');
    assert.ok(
      mp3.length < wav.length / 3,
      `圧縮できていない（WAV ${wav.length} → MP3 ${mp3.length}）`
    );
    // MP3 のフレーム同期ワードで始まる
    assert.equal(mp3[0], 0xff, 'MP3 のフレームで始まっていない');
    assert.ok((mp3[1] & 0xe0) === 0xe0, 'MP3 の同期ワードが壊れている');
  });

  test('16bit以外は理由を言って断る', () => {
    const wav = makeWav(1);
    wav.writeUInt16LE(8, 34); // 8bit に書き換える
    assert.throws(() => wavToMp3(wav), /16bit/);
  });
});

describe('チャプター', () => {
  const provider = {
    name: 'fake',
    extension: 'wav',
    contentType: 'audio/wav',
    // 文字数に比例した長さを返す
    synthesize: async (text) => makeWav(text.length / 20)
  };

  const episode = {
    segments: [
      { id: 'opening-0', kind: 'opening', heading: 'オープニング', body: 'あ'.repeat(200) },
      { id: 'deepDive-1', kind: 'deepDive', heading: '1本目', body: 'い'.repeat(400) },
      { id: 'closing-2', kind: 'closing', heading: 'クロージング', body: 'う'.repeat(100) }
    ]
  };

  test('セグメントごとの開始と終了が連続する', async () => {
    const { chapters, durationSec, audio } = await synthesizeEpisodeWithChapters(provider, episode);

    assert.equal(chapters.length, episode.segments.length);
    assert.equal(chapters[0].startSec, 0);
    for (let i = 1; i < chapters.length; i += 1) {
      assert.equal(chapters[i].startSec, chapters[i - 1].endSec, '章の切れ目に隙間がある');
    }
    assert.equal(chapters[chapters.length - 1].endSec, durationSec);

    // 実際の音声の長さと帳尻が合っていること
    assert.ok(
      Math.abs(wavDurationSeconds(audio) - durationSec) < 0.05,
      '宣言した長さと音声の実体が合っていない'
    );
  });

  test('見出しと種別を持ち回る', async () => {
    const { chapters } = await synthesizeEpisodeWithChapters(provider, episode);
    assert.equal(chapters[1].heading, '1本目');
    assert.equal(chapters[1].kind, 'deepDive');
    assert.equal(chapters[1].segmentId, 'deepDive-1');
  });
});

// --- 静的配信のフィード ----------------------------------------------------

describe('静的配信のフィード', () => {
  const episodes = [
    {
      id: '2026-09-21',
      title: 'テスト回',
      createdAt: '2026-09-21T19:30:00.000Z',
      estimatedMinutes: 10,
      terms: [{ term: 'ARR' }],
      items: { deepDive: [{ title: 'A & B', url: 'https://x.test/1?a=1&b=2', sourceName: '媒体' }], roundup: [] },
      audio: { file: 'audio/2026-09-21.mp3', contentType: 'audio/mpeg', bytes: 4321, durationSec: 612 }
    }
  ];

  test('音声のURLを差し替えられる', () => {
    const xml = buildPodcastFeed({
      episodes,
      baseUrl: 'https://me.github.io/repo',
      audioUrlFor: (e) => `https://me.github.io/repo/${e.audio.file}`
    });
    assert.match(
      xml,
      /<enclosure url="https:\/\/me\.github\.io\/repo\/audio\/2026-09-21\.mp3" length="4321" type="audio\/mpeg"/
    );
  });

  test('実測の長さを尺として書く', () => {
    const xml = buildPodcastFeed({
      episodes,
      baseUrl: 'https://me.github.io/repo',
      audioUrlFor: (e) => `https://me.github.io/repo/${e.audio.file}`
    });
    // 612秒 = 10:12。推定の10分ではなく実測を使う
    assert.match(xml, /<itunes:duration>10:12<\/itunes:duration>/);
  });

  test('XMLとして壊れない', () => {
    const xml = buildPodcastFeed({
      episodes,
      baseUrl: 'https://me.github.io/repo',
      audioUrlFor: (e) => `https://me.github.io/repo/${e.audio.file}`
    });
    assert.ok(!/&(?!(amp|lt|gt|quot|apos);)/.test(xml), '未エスケープの & が残っている');
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });
});

// --- 時間の表記 ------------------------------------------------------------
// 初回の自動実行のログで「4分43秒」が「5分43秒」と出ていた。
// 分を四捨五入したせいで、秒の側と足して実体を超えていた。

describe('時間の表記', () => {
  test('分を切り上げない', async () => {
    const { formatDuration } = await import('../episode-shape.js');
    assert.equal(formatDuration(283.37), '4分43秒', '分が切り上がっている');
    assert.equal(formatDuration(59), '0分59秒');
    assert.equal(formatDuration(60), '1分0秒');
    assert.equal(formatDuration(3599), '59分59秒');
  });

  test('分と秒を足すと元の秒数に戻る', async () => {
    const { formatDuration } = await import('../episode-shape.js');
    for (const seconds of [1, 59, 60, 61, 283.37, 599.6, 1234]) {
      const [, m, s] = /^(\d+)分(\d+)秒$/.exec(formatDuration(seconds));
      assert.equal(
        Number(m) * 60 + Number(s),
        Math.round(seconds),
        `${seconds}秒 の表記が実体と合わない`
      );
    }
  });

  test('ざっくり表示は1分を下回らない', async () => {
    const { roughMinutes } = await import('../episode-shape.js');
    assert.equal(roughMinutes(0), 1);
    assert.equal(roughMinutes(10), 1);
    assert.equal(roughMinutes(600), 10);
  });
});
