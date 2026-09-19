import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * 本番では Vercel が api/ 配下を関数として動かす。
 * ローカルでも同じハンドラをそのまま呼べるように、開発サーバーに薄い橋を架ける。
 * これで「ローカルでは動くのに本番で動かない」というズレが起きにくくなる。
 */
function apiDevMiddleware(env) {
  return {
    name: 'techcast-api-dev',
    configureServer(server) {
      // ハンドラは process.env を見るので、.env の中身をそこに移しておく
      for (const [key, value] of Object.entries(env)) {
        if (!key.startsWith('VITE_') && process.env[key] === undefined) {
          process.env[key] = value;
        }
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();

        const pathname = new URL(req.url, 'http://localhost').pathname;
        const name = pathname.slice('/api/'.length).replace(/\/+$/, '');
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) return next();

        const handlerPath = path.join(rootDir, 'api', `${name}.js`);
        if (!existsSync(handlerPath)) return next();

        try {
          const body = await readJsonBody(req);
          const mod = await server.ssrLoadModule(`/api/${name}.js`);
          const handler = mod.default;
          if (typeof handler !== 'function') return next();

          // Vercel のハンドラが見るのは headers / query / body / method。
          // IncomingMessage をそのまま展開しても headers は写らないので明示的に渡す。
          const url = new URL(req.url, 'http://localhost');
          const query = Object.fromEntries(url.searchParams.entries());
          await handler(
            { headers: req.headers, method: req.method, url: req.url, query, body },
            createResponse(res)
          );
        } catch (err) {
          server.config.logger.error(`[api/${name}] ${err.stack || err.message}`);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'ハンドラ内でエラーが発生しました', message: String(err?.message || err) }));
          }
        }
      });
    }
  };
}

function readJsonBody(req) {
  if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
    return Promise.resolve(undefined);
  }
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

// Vercel の res インターフェース（status / json / send）をローカルで再現する
function createResponse(res) {
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
    // 音声は Buffer のまま返す。文字列化すると壊れる。
    end(payload) {
      res.end(payload);
      return this;
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');
  return {
    plugins: [react(), apiDevMiddleware(env)],
    server: { port: 5174 }
  };
});
