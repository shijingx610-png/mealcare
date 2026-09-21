// 毎朝の生成スケジュールのテスト
// ---------------------------------------------------------------------------
// ここが狂うと「毎朝できているはず」が静かに崩れる。しかも気づきにくい。
// サーバーの時計が UTC でも、日本時間の朝に走ることを固定しておく。

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { secondsIntoDay, msUntilNext, isPastToday, scheduleDaily } from '../schedule.js';
import { todayId } from '../daily-job.js';

const hours = (ms) => ms / 3_600_000;
const minutes = (ms) => ms / 60_000;

describe('タイムゾーンの扱い', () => {
  test('サーバーがUTCでも日本時間で数える', () => {
    // UTC 19:00 は日本時間の翌日 4:00
    assert.equal(secondsIntoDay(new Date('2026-09-19T19:00:00Z'), 'Asia/Tokyo'), 4 * 3600);
    assert.equal(secondsIntoDay(new Date('2026-09-19T19:00:00Z'), 'UTC'), 19 * 3600);
  });

  test('日付をまたぐ時刻でも0時に戻る', () => {
    // UTC 15:00 は日本時間 0:00
    assert.equal(secondsIntoDay(new Date('2026-09-19T15:00:00Z'), 'Asia/Tokyo'), 0);
  });

  test('不正なタイムゾーン名でも落ちない', () => {
    const v = secondsIntoDay(new Date(), 'Not/AZone');
    assert.ok(Number.isFinite(v));
  });
});

describe('次の実行までの時間', () => {
  test('同じ日のこれからの時刻を指す', () => {
    // 日本時間 4:00 の時点から 4:30 までは 30 分
    const ms = msUntilNext(4, 30, 'Asia/Tokyo', new Date('2026-09-19T19:00:00Z'));
    assert.equal(minutes(ms), 30);
  });

  test('過ぎていたら翌日に回す', () => {
    // 日本時間 5:00 の時点なら、次の 4:30 は 23.5 時間後
    const ms = msUntilNext(4, 30, 'Asia/Tokyo', new Date('2026-09-19T20:00:00Z'));
    assert.equal(hours(ms), 23.5);
  });

  test('ちょうど同時刻なら翌日にする（二重実行を避ける）', () => {
    const ms = msUntilNext(4, 30, 'Asia/Tokyo', new Date('2026-09-19T19:30:00Z'));
    assert.equal(hours(ms), 24);
  });

  test('深夜でも正しく出る', () => {
    // 日本時間 0:30 から 4:30 までは 4 時間
    const ms = msUntilNext(4, 30, 'Asia/Tokyo', new Date('2026-09-19T15:30:00Z'));
    assert.equal(hours(ms), 4);
  });
});

describe('取りこぼしの判定', () => {
  test('予定時刻を過ぎているかを日本時間で見る', () => {
    // 日本時間 10:00
    assert.equal(isPastToday(4, 30, 'Asia/Tokyo', new Date('2026-09-19T01:00:00Z')), true);
    // 日本時間 3:00
    assert.equal(isPastToday(4, 30, 'Asia/Tokyo', new Date('2026-09-18T18:00:00Z')), false);
  });
});

describe('エピソードIDの日付', () => {
  test('タイムゾーン指定があればその日付になる', () => {
    // UTC では 9/19 の 23:00、日本時間では 9/20 の 8:00
    assert.equal(todayId(new Date('2026-09-19T23:00:00Z'), 'Asia/Tokyo'), '2026-09-20');
    assert.equal(todayId(new Date('2026-09-19T23:00:00Z'), 'UTC'), '2026-09-19');
  });

  test('不正なタイムゾーン名でも日付を返す', () => {
    assert.match(todayId(new Date(), 'Not/AZone'), /^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('スケジューラの挙動', () => {
  // スケジューラは「時刻」しか見ない。いまが 22:45 のときに 2 時間後を
  // 指定すると 0:45 になり、その日のうちではもう過ぎた時刻になってしまう。
  // 実時計に頼ると、回す時刻によって結果が変わる。時計を固定して確かめる。
  //
  // 日本時間 2026年9月21日 10:00 に実行したことにする。
  const at10am = () => new Date('2026-09-21T01:00:00Z');

  test('予定時刻を過ぎていれば起動直後に拾いにいく', async () => {
    const runs = [];
    const schedule = scheduleDaily({
      hour: 4,
      minute: 30, // 10:00 時点ではもう過ぎている
      timeZone: 'Asia/Tokyo',
      now: at10am,
      catchUp: true,
      catchUpDelayMs: 5,
      run: async (reason) => {
        runs.push(reason);
        return { status: 'created', title: 'テスト' };
      }
    });
    await new Promise((r) => setTimeout(r, 60));
    schedule.stop();
    assert.deepEqual(runs, ['catch-up']);
  });

  test('まだ予定時刻が来ていなければ走らない', async () => {
    const runs = [];
    // 固定の時刻を書くと、実行時刻によってはすでに過ぎていて落ちる。
    // 「いまから2時間後」にすれば、いつ回しても必ず未来になる。
    const schedule = scheduleDaily({
      hour: 20,
      minute: 0, // 10:00 時点ではまだ来ていない
      timeZone: 'Asia/Tokyo',
      now: at10am,
      catchUp: true,
      catchUpDelayMs: 5,
      run: async (reason) => {
        runs.push(reason);
        return {};
      }
    });
    await new Promise((r) => setTimeout(r, 60));
    schedule.stop();
    assert.equal(runs.length, 0, '予定時刻より前なのに走っている');
  });

  test('無効にすれば一切走らない', async () => {
    const runs = [];
    const schedule = scheduleDaily({
      enabled: false,
      hour: 4,
      minute: 30,
      now: at10am,
      catchUp: true,
      catchUpDelayMs: 5,
      run: async () => {
        runs.push('x');
      }
    });
    await new Promise((r) => setTimeout(r, 40));
    schedule.stop();
    assert.equal(runs.length, 0);
  });

  test('生成が失敗してもスケジュールごと止まらない', async () => {
    const logs = [];
    const schedule = scheduleDaily({
      hour: 4,
      minute: 30,
      timeZone: 'Asia/Tokyo',
      now: at10am,
      catchUp: true,
      catchUpDelayMs: 5,
      log: (...args) => logs.push(args.join(' ')),
      run: async () => {
        throw new Error('わざと失敗');
      }
    });
    await new Promise((r) => setTimeout(r, 60));
    // 例外が外に漏れていなければ、ここまで到達できる
    await schedule.runNow();
    schedule.stop();
    assert.ok(logs.some((l) => l.includes('生成に失敗')));
  });

  test('前の生成が終わる前に次が来ても重ならない', async () => {
    let active = 0;
    let maxActive = 0;
    const schedule = scheduleDaily({
      hour: 20,
      minute: 0,
      timeZone: 'Asia/Tokyo',
      now: at10am,
      catchUp: false,
      run: async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 30));
        active -= 1;
        return {};
      }
    });
    await Promise.all([schedule.runNow(), schedule.runNow(), schedule.runNow()]);
    schedule.stop();
    assert.equal(maxActive, 1, '生成が同時に走っている');
  });

  test('設定した時刻を説明できる', () => {
    const schedule = scheduleDaily({
      hour: 4,
      minute: 30,
      timeZone: 'Asia/Tokyo',
      catchUp: false,
      run: async () => ({})
    });
    assert.equal(schedule.describe(), '毎日 04:30（Asia/Tokyo）');
    schedule.stop();
  });

  test('範囲外の時刻を渡しても壊れない', () => {
    const schedule = scheduleDaily({
      hour: 99,
      minute: -5,
      timeZone: 'Asia/Tokyo',
      catchUp: false,
      run: async () => ({})
    });
    assert.equal(schedule.describe(), '毎日 23:00（Asia/Tokyo）');
    schedule.stop();
  });
});
