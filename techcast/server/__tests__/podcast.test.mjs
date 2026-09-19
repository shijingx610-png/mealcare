// 音声生成とポッドキャスト配信のテスト
// ---------------------------------------------------------------------------
// 実サービスに繋がずに、通しで確かめられるところまでを固定する。
// VOICEVOX は HTTP API なので、同じ形で応答するサーバーを立てれば代用できる。

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  createTtsProvider,
  splitForSynthesis,
  concatWav,
  synthesizeEpisode
} from '../audio/tts.js';
import { saveEpisode, getEpisode, listEpisodes, statAudio } from '../audio/store.js';
import { buildPodcastFeed } from '../audio/podcast-feed.js';
import { resolveBaseUrl } from '../audio/base-url.js';
import audioHandler from '../../api/audio.js';
import podcastHandler from '../../api/podcast.js';

// --- 小道具 ----------------------------------------------------------------

function makeWav(dataBytes, fill = 128) {
  const buf = Buffer.alloc(44 + dataBytes, fill);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(24000, 24);
  buf.writeUInt32LE(24000, 28);
  buf.writeUInt16LE(1, 32);
  buf.writeUInt16LE(8, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataBytes, 40);
  return buf;
}

function mockRes() {
  const state = { status: 200, headers: {}, body: null, ended: false };
  const res = {
    status(code) {
      state.status = code;
      return res;
    },
    setHeader(k, v) {
      state.headers[k.toLowerCase()] = v;
      return res;
    },
    json(payload) {
      state.body = payload;
      state.ended = true;
      return res;
    },
    send(payload) {
      state.body = payload;
      state.ended = true;
      return res;
    },
    end(payload) {
      if (payload !== undefined) state.body = payload;
      state.ended = true;
      return res;
    }
  };
  return { res, state };
}

const sampleEpisode = {
  id: '2026-09-19',
  createdAt: '2026-09-19T21:30:00.000Z',
  dateLabel: '9月19日（土）',
  title: 'AI各社の新モデル & 調達',
  durationMin: 10,
  estimatedMinutes: 9.5,
  generator: 'template',
  segments: [
    { id: 'opening-0', kind: 'opening', heading: 'オープニング', body: 'おはようございます。', refs: [] },
    { id: 'deepDive-1', kind: 'deepDive', heading: '本編', body: '本日の話題です。'.repeat(40), refs: [] }
  ],
  items: {
    deepDive: [{ title: 'A & B の提携', url: 'https://x.test/1?a=1&b=2', sourceName: '媒体A' }],
    roundup: []
  },
  terms: [{ id: 'arr', term: 'ARR' }],
  health: [],
  stats: {}
};

// --- 音声合成 --------------------------------------------------------------

describe('音声合成プロバイダ', () => {
  test('設定がなければ null を返す', () => {
    assert.equal(createTtsProvider({}), null);
  });

  test('環境変数でプロバイダが決まる', () => {
    assert.equal(createTtsProvider({ VOICEVOX_URL: 'http://localhost:50021' }).name, 'voicevox');
    assert.equal(createTtsProvider({ GOOGLE_TTS_API_KEY: 'k' }).name, 'google');
  });

  test('長い台本を上限以内に割る', () => {
    const parts = splitForSynthesis('あ。'.repeat(2000), 100);
    assert.ok(parts.length > 1);
    assert.ok(Math.max(...parts.map((p) => p.length)) <= 100);
    assert.equal(parts.join('').length, 4000, '分割で文字が落ちている');
  });

  test('WAVを結合してもヘッダの長さが合う', () => {
    const merged = concatWav([makeWav(100), makeWav(200), makeWav(50)]);
    assert.equal(merged.readUInt32LE(40), 350, 'data チャンク長が合っていない');
    assert.equal(merged.readUInt32LE(4), merged.length - 8, 'RIFF チャンク長が合っていない');
    assert.equal(merged.subarray(0, 4).toString('ascii'), 'RIFF');
  });

  test('空や壊れた断片を混ぜても落ちない', () => {
    assert.equal(concatWav([]).length, 0);
    assert.equal(concatWav([Buffer.alloc(10)]).length, 0, '44バイト未満は捨てるべき');
  });
});

describe('VOICEVOX 互換サーバーへの合成', () => {
  let server;
  let baseUrl;
  const received = [];

  before(async () => {
    server = createServer((req, res) => {
      const url = new URL(req.url, 'http://x');
      if (url.pathname === '/audio_query') {
        received.push(url.searchParams.get('text'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ accent_phrases: [], speedScale: 1.0 }));
        return;
      }
      if (url.pathname === '/synthesis') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          const params = JSON.parse(body);
          // speedScale が引き継がれているかを、返す長さに反映して確かめる
          const size = params.speedScale === 1.4 ? 200 : 100;
          res.writeHead(200, { 'Content-Type': 'audio/wav' });
          res.end(makeWav(size));
        });
        return;
      }
      res.writeHead(404);
      res.end();
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((r) => server.close(r));
  });

  test('台本を1本の音声にまとめる', async () => {
    received.length = 0;
    const provider = createTtsProvider({ VOICEVOX_URL: baseUrl, TTS_SPEED: '1.4' });
    const audio = await synthesizeEpisode(provider, sampleEpisode);

    assert.ok(received.length >= 1, '合成リクエストが飛んでいない');
    assert.equal(audio.subarray(0, 4).toString('ascii'), 'RIFF', '結合結果が WAV になっていない');
    assert.equal(audio.readUInt32LE(4), audio.length - 8, 'ヘッダの長さが実体と合っていない');
    assert.equal(
      audio.readUInt32LE(40),
      received.length * 200,
      '読み上げ速度の指定が合成側に渡っていない'
    );
  });

  test('エンジンが落ちていれば理由の分かる例外にする', async () => {
    const provider = createTtsProvider({ VOICEVOX_URL: 'http://127.0.0.1:1' });
    await assert.rejects(
      () => synthesizeEpisode(provider, sampleEpisode),
      (err) => err.name === 'TtsError' && /接続できません/.test(err.message)
    );
  });
});

// --- 保存と配信 ------------------------------------------------------------

describe('エピソードの保存と配信', () => {
  let dir;
  let previousDataDir;

  before(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'techcast-test-'));
    previousDataDir = process.env.TECHCAST_DATA_DIR;
    process.env.TECHCAST_DATA_DIR = dir;
  });

  after(async () => {
    if (previousDataDir === undefined) delete process.env.TECHCAST_DATA_DIR;
    else process.env.TECHCAST_DATA_DIR = previousDataDir;
    await fs.rm(dir, { recursive: true, force: true });
  });

  test('保存して読み戻せる', async () => {
    const audio = makeWav(500, 200);
    const saved = await saveEpisode(sampleEpisode, {
      audio,
      extension: 'wav',
      contentType: 'audio/wav'
    });
    assert.equal(saved.audio.bytes, audio.length);

    const loaded = await getEpisode('2026-09-19');
    assert.equal(loaded.title, sampleEpisode.title);
    assert.equal(loaded.audio.file, 'audio.wav');

    const stat = await statAudio('2026-09-19');
    assert.equal(stat.size, audio.length);
    assert.equal(stat.contentType, 'audio/wav');
  });

  test('新しい順に並ぶ', async () => {
    await saveEpisode({ ...sampleEpisode, id: '2026-09-17', title: '一昨日' }, {});
    await saveEpisode({ ...sampleEpisode, id: '2026-09-18', title: '昨日' }, {});
    const list = await listEpisodes();
    assert.deepEqual(list.map((e) => e.id), ['2026-09-19', '2026-09-18', '2026-09-17']);
  });

  test('IDに変な値を渡しても外に出ない', async () => {
    await assert.rejects(() => saveEpisode({ ...sampleEpisode, id: '../../etc' }, {}));
    assert.equal(await getEpisode('../../etc'), null);
  });

  test('音声エンドポイントが全体を返す', async () => {
    const { res, state } = mockRes();
    await audioHandler({ method: 'GET', url: '/api/audio?id=2026-09-19', query: { id: '2026-09-19' }, headers: {} }, res);
    assert.equal(state.status, 200);
    assert.equal(state.headers['content-type'], 'audio/wav');
    assert.equal(state.headers['accept-ranges'], 'bytes');
    assert.ok(Buffer.isBuffer(state.body));
    assert.equal(state.body.length, 544);
  });

  test('範囲リクエストに 206 で答える', async () => {
    const { res, state } = mockRes();
    await audioHandler(
      { method: 'GET', url: '/api/audio?id=2026-09-19', query: { id: '2026-09-19' }, headers: { range: 'bytes=100-199' } },
      res
    );
    assert.equal(state.status, 206);
    assert.equal(state.headers['content-range'], 'bytes 100-199/544');
    assert.equal(state.body.length, 100);
  });

  test('末尾からの範囲指定も扱える', async () => {
    const { res, state } = mockRes();
    await audioHandler(
      { method: 'GET', url: '/api/audio?id=2026-09-19', query: { id: '2026-09-19' }, headers: { range: 'bytes=-50' } },
      res
    );
    assert.equal(state.status, 206);
    assert.equal(state.headers['content-range'], 'bytes 494-543/544');
    assert.equal(state.body.length, 50);
  });

  test('範囲外は 416 を返す', async () => {
    const { res, state } = mockRes();
    await audioHandler(
      { method: 'GET', url: '/api/audio?id=2026-09-19', query: { id: '2026-09-19' }, headers: { range: 'bytes=99999-' } },
      res
    );
    assert.equal(state.status, 416);
  });

  test('音声が無い日は 404', async () => {
    const { res, state } = mockRes();
    await audioHandler({ method: 'GET', url: '/api/audio?id=2026-09-18', query: { id: '2026-09-18' }, headers: {} }, res);
    assert.equal(state.status, 404);
  });

  test('フィードには音声のある回だけが並ぶ', async () => {
    const { res, state } = mockRes();
    await podcastHandler({ method: 'GET', url: '/api/podcast', headers: { host: 'techcast.test', 'x-forwarded-proto': 'https' } }, res);

    assert.equal(state.status, 200);
    assert.match(state.headers['content-type'], /application\/rss\+xml/);

    const xml = state.body;
    assert.match(xml, /<enclosure url="https:\/\/techcast\.test\/api\/audio\?id=2026-09-19" length="544" type="audio\/wav"/);
    assert.ok(!xml.includes('<title>昨日</title>'), '音声の無い回が混ざっている');
    assert.match(xml, /xmlns:itunes=/);
    assert.match(xml, /<guid isPermaLink="false">techcast-2026-09-19<\/guid>/);
    assert.ok(xml.includes('a=1&amp;b=2'), '記事URLがエスケープされていない');
    assert.ok(!/&(?!(amp|lt|gt|quot|apos);)/.test(xml), '未エスケープの & が残っている');
  });
});

describe('配信URLの決定', () => {
  test('環境変数を最優先する', () => {
    assert.equal(
      resolveBaseUrl({ headers: { host: 'x.test' } }, { PUBLIC_BASE_URL: 'https://my.test/' }),
      'https://my.test'
    );
  });

  test('ヘッダから組み立てる', () => {
    assert.equal(
      resolveBaseUrl({ headers: { host: 'a.test', 'x-forwarded-proto': 'https' } }, {}),
      'https://a.test'
    );
    assert.equal(resolveBaseUrl({ headers: { host: 'localhost:5174' } }, {}), 'http://localhost:5174');
  });
});
