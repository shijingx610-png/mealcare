// 毎朝決まった時刻に走らせる
// ---------------------------------------------------------------------------
// cron を別に用意しなくても、サーバープロセスだけで完結させる。
// 外部の仕組みに依存しないぶん、「動いているはずなのに動いていない」が起きにくい。
//
// 気をつけたこと。
//   - サーバーの時計が UTC でも、指定したタイムゾーンの時刻で走らせる
//   - setTimeout は長時間だとずれるので、1 回走るたびに次回を計算し直す
//   - ノートPCのように止まる環境を想定し、起動時に取りこぼしを拾う

const MAX_TIMEOUT_MS = 2 ** 31 - 1; // setTimeout の上限（約24.8日）

/**
 * 指定タイムゾーンでの現在時刻を「その日の 0 時からの秒数」で返す。
 */
export function secondsIntoDay(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).formatToParts(date);
    const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    // 24:00:00 と表記する環境があるので丸めておく
    const hour = get('hour') % 24;
    return hour * 3600 + get('minute') * 60 + get('second');
  } catch {
    return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  }
}

/**
 * 次に hour:minute が来るまでのミリ秒。
 */
export function msUntilNext(hour, minute, timeZone, now = new Date()) {
  const target = hour * 3600 + minute * 60;
  const current = secondsIntoDay(now, timeZone);
  let delta = target - current;
  if (delta <= 0) delta += 24 * 3600;
  return delta * 1000;
}

/**
 * 今日の予定時刻をすでに過ぎているか。起動時の取りこぼし判定に使う。
 */
export function isPastToday(hour, minute, timeZone, now = new Date()) {
  return secondsIntoDay(now, timeZone) >= hour * 3600 + minute * 60;
}

export function scheduleDaily({
  enabled = true,
  hour = 4,
  minute = 30,
  timeZone = 'Asia/Tokyo',
  catchUp = true,
  // 同じマシンで VOICEVOX を一緒に立ち上げている場合、起動直後はまだ
  // エンジンが応答しない。少し待ってから取りこぼしを拾う。
  catchUpDelayMs = 10_000,
  run,
  log = () => {}
}) {
  const safeHour = Number.isFinite(hour) ? Math.min(23, Math.max(0, Math.trunc(hour))) : 4;
  const safeMinute = Number.isFinite(minute) ? Math.min(59, Math.max(0, Math.trunc(minute))) : 30;

  let timer = null;
  let stopped = false;
  let running = false;

  function describe() {
    const hh = String(safeHour).padStart(2, '0');
    const mm = String(safeMinute).padStart(2, '0');
    return `毎日 ${hh}:${mm}（${timeZone}）`;
  }

  async function execute(reason) {
    if (running) {
      log('[schedule] 前回の生成がまだ動いているので見送ります');
      return;
    }
    running = true;
    try {
      const result = await run(reason);
      if (result?.status === 'created') {
        log(`[schedule] 完了: ${result.title}`);
      }
    } catch (err) {
      // ここで落とすとスケジュールごと止まる。次回に賭ける。
      log('[schedule] 生成に失敗しました:', err?.stack || err);
    } finally {
      running = false;
    }
  }

  function scheduleNext() {
    if (stopped) return;
    const delay = Math.min(msUntilNext(safeHour, safeMinute, timeZone), MAX_TIMEOUT_MS);
    timer = setTimeout(async () => {
      // 上限で刻んだ場合はまだ時刻ではないので、もう一度測り直す
      if (msUntilNext(safeHour, safeMinute, timeZone) > 60_000) {
        scheduleNext();
        return;
      }
      await execute('scheduled');
      scheduleNext();
    }, delay);
    if (typeof timer.unref === 'function') timer.unref();
  }

  if (enabled) {
    // 起動時の取りこぼし。今日の予定時刻を過ぎているのに番組が無ければ、すぐ作る。
    // 朝 5 時にPCを開いたら、もうできている状態にしたい。
    if (catchUp && isPastToday(safeHour, safeMinute, timeZone)) {
      const t = setTimeout(() => execute('catch-up'), catchUpDelayMs);
      if (typeof t.unref === 'function') t.unref();
    }
    scheduleNext();
  }

  return {
    enabled,
    describe,
    runNow: () => execute('manual'),
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = null;
    }
  };
}
