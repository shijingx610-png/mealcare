# TechCast 本体
# ---------------------------------------------------------------------------
# VOICEVOX を使うなら常駐環境が要る。これはそのための最小構成。
# ビルドと実行を分けて、実行側には開発用の依存を持ち込まない。

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- 実行 ---
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV TECHCAST_DATA_DIR=/data

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY server.js ./
COPY server ./server
COPY api ./api
COPY scripts ./scripts

RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3000

# 生成物が残っているかどうかではなく、サーバーが応答するかだけを見る
HEALTHCHECK --interval=60s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/sources').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
