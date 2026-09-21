// 毎朝の生成そのもの
// ---------------------------------------------------------------------------
// HTTP から叩かれる場合（api/cron.js）と、サーバー内蔵のスケジューラから
// 呼ばれる場合の両方で使う。処理が 2 か所に分かれると必ずズレるので 1 本にした。

import { formatDuration } from './episode-shape.js';
import { generateEpisode } from './pipeline.js';
import { createTtsProvider, synthesizeEpisodeWithChapters } from './audio/tts.js';
import { saveEpisode, getEpisode, listEpisodes } from './audio/store.js';

export function todayId(date = new Date(), timeZone = process.env.DAILY_TIMEZONE) {
  if (timeZone) {
    // サーバーの時計が UTC でも、日本時間の「今日」で番組を作りたい
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(date);
      const get = (type) => parts.find((p) => p.type === type)?.value;
      return `${get('year')}-${get('month')}-${get('day')}`;
    } catch {
      // 不正なタイムゾーン名ならサーバー時刻にそのまま落ちる
    }
  }
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/**
 * 今日の番組を作って保存する。
 * すでにある日は作り直さない（force を渡したときだけ上書きする）。
 */
export async function runDailyJob({
  force = false,
  reason = 'manual',
  options = {},
  log = () => {}
} = {}) {
  const id = todayId();

  const existing = await getEpisode(id);
  if (existing && !force) {
    log(`[daily] ${id} はすでにあります（${reason}）`);
    return {
      status: 'skipped',
      reason: 'この日の番組はすでに作られています',
      episodeId: id,
      hasAudio: Boolean(existing.audio)
    };
  }

  log(`[daily] ${id} の番組を作ります（${reason}）`);

  // 直近 2 週間で扱った記事は候補から外す。同じ話を翌朝も聞かされないように。
  const past = await listEpisodes(undefined, 14);
  const excludeLinks = past.flatMap((ep) =>
    [...(ep.items?.deepDive || []), ...(ep.items?.roundup || [])].map((r) => r.url).filter(Boolean)
  );

  const episode = await generateEpisode({
    durationMin: Number(options.durationMin) || Number(process.env.EPISODE_MINUTES) || 10,
    sourceIds: options.sourceIds,
    interestWeights: options.interestWeights,
    maxAgeHours: Number(options.maxAgeHours) || 36,
    excludeLinks,
    useClaude: options.useClaude !== false
  });

  log(
    `[daily] 台本ができました: ${episode.title}（${episode.generator}、約${episode.estimatedMinutes}分）`
  );

  const provider = createTtsProvider();
  let audio = null;
  let chapters = null;
  let durationSec = null;
  let ttsError = null;

  if (provider) {
    // VOICEVOX を同じマシンで一緒に立ち上げていると、こちらが先に動き出して
    // まだエンジンが起きていないことがある。一度きりで諦めると、その日の音声が丸ごと無くなる。
    const attempts = Number(process.env.TTS_RETRIES ?? 3);
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const startedAt = Date.now();
        const result = await synthesizeEpisodeWithChapters(provider, episode);
        audio = result.audio;
        chapters = result.chapters;
        durationSec = result.durationSec;
        ttsError = null;
        log(
          `[daily] 音声ができました: ${(audio.length / 1024 / 1024).toFixed(1)}MB / ` +
            `${formatDuration(durationSec)}` +
            `（${provider.name}、${Math.round((Date.now() - startedAt) / 1000)}秒で合成）`
        );
        break;
      } catch (err) {
        ttsError = String(err?.message || err);
        if (attempt < attempts) {
          const waitMs = attempt * 15_000;
          log(`[daily] 音声の生成に失敗（${attempt}/${attempts}）: ${ttsError}`);
          log(`[daily] ${waitMs / 1000}秒待って試し直します`);
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        } else {
          // 音声が作れなくても台本は残す。アプリ内では読み上げで聞けるし、
          // 原因を直したあとに force で作り直せる。
          log(`[daily] 音声の生成を諦めました: ${ttsError}`);
        }
      }
    }
  }

  const saved = await saveEpisode(episode, {
    audio,
    extension: provider?.extension,
    contentType: provider?.contentType,
    chapters,
    durationSec
  });

  return {
    status: 'created',
    episodeId: saved.id,
    title: saved.title,
    segments: saved.segments.length,
    generator: saved.generator,
    estimatedMinutes: saved.estimatedMinutes,
    fallbackReason: saved.fallbackReason || null,
    tts: provider ? provider.name : null,
    audioBytes: audio ? audio.length : 0,
    durationSec,
    ttsError
  };
}
