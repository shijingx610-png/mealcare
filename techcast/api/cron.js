// GET|POST /api/cron — 毎朝の番組を用意する
//
// 単体サーバー（server.js）で動かす場合はスケジューラが内蔵されているので、
// これを外から叩く必要はない。Vercel Cron や外部の cron から使うための入口。
import { runDailyJob } from '../server/daily-job.js';

export const config = { maxDuration: 300 };

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // 未設定なら開けておく。公開環境では必ず設定すること。
  if (req.headers?.authorization === `Bearer ${secret}`) return true;
  const fromQuery =
    req.query?.secret || new URL(req.url, 'http://x').searchParams.get('secret');
  return fromQuery === secret;
}

export default async function handler(req, res) {
  if (!authorized(req)) {
    res.status(401).json({ error: '認証されていません' });
    return;
  }

  const body = req.body || {};
  const force = body.force === true || req.query?.force === '1';

  try {
    const result = await runDailyJob({
      force,
      reason: 'http',
      options: body,
      log: (...args) => console.log(...args)
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: '番組を作れませんでした', message: String(err?.message || err) });
  }
}
