// 配信 URL の決定
// ---------------------------------------------------------------------------
// ポッドキャストの RSS には絶対 URL を書く必要がある。
// 環境変数があればそれを使い、なければリクエストのヘッダから組み立てる。

export function resolveBaseUrl(req, env = process.env) {
  if (env.PUBLIC_BASE_URL) return env.PUBLIC_BASE_URL.replace(/\/+$/, '');
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;

  const headers = req?.headers || {};
  const host = headers['x-forwarded-host'] || headers.host;
  if (!host) return 'http://localhost:5174';

  const proto =
    headers['x-forwarded-proto'] || (String(host).startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
