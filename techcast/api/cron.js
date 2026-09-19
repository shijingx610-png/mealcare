// GET|POST /api/cron — 毎朝の番組を自動で用意する
//
// アプリを開かなくても番組ができている状態にするための入口。
// Vercel Cron、GitHub Actions、cron、タスクスケジューラのどれから叩いてもいい。
// 音声合成が設定されていれば音声まで作り、ポッドキャストのフィードに載る。
import { generateEpisode } from '../server/pipeline.js';
import { createTtsProvider, synthesizeEpisode } from '../server/audio/tts.js';
import { saveEpisode, getEpisode, listEpisodes } from '../server/audio/store.js';

export const config = { maxDuration: 300 };

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // 未設定なら開けておく。公開環境では必ず設定すること。
  const header = req.headers?.authorization || '';
  if (header === `Bearer ${secret}`) return true;
  const fromQuery = req.query?.secret || new URL(req.url, 'http://x').searchParams.get('secret');
  return fromQuery === secret;
}

function todayId(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export default async function handler(req, res) {
  if (!authorized(req)) {
    res.status(401).json({ error: '認証されていません' });
    return;
  }

  const body = req.body || {};
  const force = body.force === true || req.query?.force === '1';
  const id = todayId();

  try {
    const existing = await getEpisode(id);
    if (existing && !force) {
      res.status(200).json({
        status: 'skipped',
        reason: 'この日の番組はすでに作られています',
        episodeId: id,
        hasAudio: Boolean(existing.audio)
      });
      return;
    }

    // すでに扱った記事を外すため、保存済みエピソードから URL を集める
    const past = await listEpisodes(undefined, 14);
    const excludeLinks = past.flatMap((ep) =>
      [...(ep.items?.deepDive || []), ...(ep.items?.roundup || [])].map((r) => r.url).filter(Boolean)
    );

    const episode = await generateEpisode({
      durationMin: Number(body.durationMin) || Number(process.env.EPISODE_MINUTES) || 10,
      sourceIds: body.sourceIds,
      interestWeights: body.interestWeights,
      maxAgeHours: Number(body.maxAgeHours) || 36,
      excludeLinks,
      useClaude: body.useClaude !== false
    });

    const provider = createTtsProvider();
    let audio = null;
    let ttsError = null;

    if (provider) {
      try {
        audio = await synthesizeEpisode(provider, episode);
      } catch (err) {
        // 音声が作れなくても台本は残す。翌日の手がかりになる。
        ttsError = String(err?.message || err);
      }
    }

    const saved = await saveEpisode(episode, {
      audio,
      extension: provider?.extension,
      contentType: provider?.contentType
    });

    res.status(200).json({
      status: 'created',
      episodeId: saved.id,
      title: saved.title,
      segments: saved.segments.length,
      generator: saved.generator,
      fallbackReason: saved.fallbackReason || null,
      tts: provider ? provider.name : null,
      audioBytes: audio ? audio.length : 0,
      ttsError
    });
  } catch (err) {
    res.status(500).json({ error: '番組を作れませんでした', message: String(err?.message || err) });
  }
}
