import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// 開発サーバーでも api/*.js（Vercel Serverless Function）を動かすための簡易ルーター。
// 本番では Vercel が同じファイルをそのまま実行する。
function apiDevServer() {
  return {
    name: 'api-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api', function (req, res, next) {
        var name = (req.url || '').split('?')[0].replace(/^\//, '')
        if (!/^[a-z0-9_-]+$/.test(name)) return next()

        var chunks = []
        req.on('data', function (c) { chunks.push(c) })
        req.on('end', function () {
          var raw = Buffer.concat(chunks).toString('utf8')
          try {
            req.body = raw ? JSON.parse(raw) : {}
          } catch {
            req.body = {}
          }
          res.status = function (code) { res.statusCode = code; return res }
          res.json = function (payload) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(payload))
            return res
          }
          server.ssrLoadModule('/api/' + name + '.js')
            .then(function (mod) { return mod.default(req, res) })
            .catch(function (err) {
              server.config.logger.error('[api-dev] ' + name + ': ' + err.message)
              res.status(500).json({ error: String(err.message || err) })
            })
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiDevServer()],
  build: {
    rollupOptions: {
      input: {
        // 既存の mealcare アプリ
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // メルカリ出品AI（/mercari.html）
        mercari: fileURLToPath(new URL('./mercari.html', import.meta.url)),
      },
    },
  },
})
