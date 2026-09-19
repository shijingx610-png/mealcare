#!/usr/bin/env node
// 単体で動くサーバー
// ---------------------------------------------------------------------------
// VOICEVOX を使うなら、どこかに常駐する環境が要る。Vercel の使い捨ての
// ファイルシステムでは音声が残らず、ポッドキャスト配信が成立しないからだ。
//
// このファイルは Vercel なしで全部を動かすための入口。
//   - ビルド済みのフロントを配る
//   - api/ のハンドラをそのまま呼ぶ（Vercel と同じコードが動く）
//   - 毎朝の生成を自分でスケジュールする（cron を別に用意しなくていい）
//
// 使い方:  npm run build && npm start

import { createServer } from 'node:http';
import { promises as fs, createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadEnvFile } from './server/load-env.js';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// 手順書どおり .env に書いた設定を、ここで環境変数に載せる。
loadEnvFile(path.join(rootDir, '.env'));
const distDir = path.join(rootDir, 'dist');
const apiDir = path.join(rootDir, 'api');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8'
};

function log(...args) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

// --- Vercel 互換のリクエスト / レスポンス ---------------------------------

function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 2 * 1024 * 1024) {
        reject(new Error('リクエストボディが大きすぎます'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });
    req.on('error', reject);
  });
}

function wrapResponse(res) {
  return {
    status(code) {
      res.statusCode = code;
      return this;
    },
    setHeader(key, value) {
      res.setHeader(key, value);
      return this;
    },
    json(payload) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(payload));
      return this;
    },
    send(payload) {
      res.end(
        typeof payload === 'string' || Buffer.isBuffer(payload)
          ? payload
          : JSON.stringify(payload)
      );
      return this;
    },
    end(payload) {
      res.end(payload);
      return this;
    }
  };
}

const handlerCache = new Map();

async function loadHandler(name) {
  if (handlerCache.has(name)) return handlerCache.get(name);
  const file = path.join(apiDir, `${name}.js`);
  try {
    await fs.access(file);
  } catch {
    handlerCache.set(name, null);
    return null;
  }
  const mod = await import(pathToFileURL(file).href);
  const handler = typeof mod.default === 'function' ? mod.default : null;
  handlerCache.set(name, handler);
  return handler;
}

// --- 静的ファイル ----------------------------------------------------------

async function serveStatic(req, res, pathname) {
  // dist の外に出さない
  const safe = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(distDir, safe);
  if (!file.startsWith(distDir)) {
    res.statusCode = 403;
    res.end('forbidden');
    return true;
  }

  let stat;
  try {
    stat = await fs.stat(file);
    if (stat.isDirectory()) {
      file = path.join(file, 'index.html');
      stat = await fs.stat(file);
    }
  } catch {
    return false;
  }

  const ext = path.extname(file).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  res.setHeader('Content-Length', String(stat.size));
  // 画面のHTMLだけは毎回取りにいかせる。中身の更新が届かなくなると困る。
  res.setHeader(
    'Cache-Control',
    ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
  );
  if (req.method === 'HEAD') {
    res.end();
    return true;
  }
  createReadStream(file).pipe(res);
  return true;
}

// --- リクエストの振り分け --------------------------------------------------

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (pathname.startsWith('/api/')) {
      const name = pathname.slice('/api/'.length).replace(/\/+$/, '');
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        res.statusCode = 404;
        res.end('not found');
        return;
      }
      const handler = await loadHandler(name);
      if (!handler) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: `api/${name} は存在しません` }));
        return;
      }
      const body = await readBody(req);
      const query = Object.fromEntries(url.searchParams.entries());
      await handler(
        { headers: req.headers, method: req.method, url: req.url, query, body },
        wrapResponse(res)
      );
      return;
    }

    if (await serveStatic(req, res, pathname)) return;

    // 画面側のルーティングに任せる
    if (await serveStatic(req, res, '/index.html')) return;

    res.statusCode = 404;
    res.end('not found');
  } catch (err) {
    log('リクエスト処理でエラー:', err?.stack || err);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'サーバー内部エラー', message: String(err?.message || err) }));
    }
  }
});

// --- 毎朝の生成スケジュール ------------------------------------------------
// 別の cron を用意しなくても、このプロセスだけで毎日走るようにする。
// ノートPCのように途中で止まる環境でも困らないよう、起動時に取りこぼしを拾う。

const { scheduleDaily } = await import('./server/schedule.js');

const schedule = scheduleDaily({
  enabled: process.env.DAILY_ENABLED !== 'false',
  hour: Number(process.env.DAILY_HOUR ?? 4),
  minute: Number(process.env.DAILY_MINUTE ?? 30),
  timeZone: process.env.DAILY_TIMEZONE || 'Asia/Tokyo',
  catchUp: process.env.DAILY_CATCH_UP !== 'false',
  catchUpDelayMs: Number(process.env.DAILY_CATCH_UP_DELAY_MS ?? 10_000),
  log,
  run: async (reason) => {
    const { runDailyJob } = await import('./server/daily-job.js');
    return runDailyJob({ reason, log });
  }
});

server.listen(PORT, HOST, () => {
  log(`TechCast を起動しました  http://localhost:${PORT}`);
  log(`音声合成: ${process.env.VOICEVOX_URL ? `VOICEVOX (${process.env.VOICEVOX_URL})` : process.env.GOOGLE_TTS_API_KEY ? 'Google Cloud TTS' : '未設定（アプリ内読み上げのみ）'}`);
  log(`台本: ${process.env.ANTHROPIC_API_KEY ? 'Claude' : 'テンプレート（ANTHROPIC_API_KEY 未設定）'}`);
  if (schedule.enabled) {
    log(`毎朝の生成: ${schedule.describe()}`);
  } else {
    log('毎朝の生成: 無効（DAILY_ENABLED=false）');
  }
});

function shutdown(signal) {
  log(`${signal} を受け取りました。終了します。`);
  schedule.stop();
  server.close(() => process.exit(0));
  // 接続が残っていても、いつまでも待たない
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
