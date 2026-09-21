// 重複排除 → スコアリング → 番組尺に合わせた選定
// ---------------------------------------------------------------------------
// 「毎朝ちょうどいい量」を作るのがこの層の仕事。多すぎると聞き切れず、
// 少なすぎると偏る。さらに、同じニュースを別媒体で3回聞かされるのが一番つらい。

import { inferTags } from './taxonomy.js';

// --- URL 正規化 ------------------------------------------------------------

const TRACKING_PARAMS = /^(utm_|fbclid|gclid|mc_|ref|ref_src|source|cmpid|_ga)/i;

export function canonicalUrl(raw) {
  if (!raw) return '';
  try {
    const u = new URL(raw);
    u.hash = '';
    const keep = [...u.searchParams.entries()].filter(([k]) => !TRACKING_PARAMS.test(k));
    u.search = '';
    for (const [k, v] of keep) u.searchParams.append(k, v);
    let s = `${u.origin}${u.pathname}`;
    if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
    const qs = u.searchParams.toString();
    return (qs ? `${s}?${qs}` : s).toLowerCase();
  } catch {
    return raw.trim().toLowerCase();
  }
}

// --- タイトルの近似一致 ----------------------------------------------------

function normalizeTitle(title) {
  return (title || '')
    .toLowerCase()
    .replace(/[【】\[\]「」『』（）()《》<>|｜・,.、。:：;；!！?？"'’”“\-—–_/\\]/g, '')
    .replace(/\s+/g, '');
}

// 2-gram の Dice 係数。日本語には形態素解析が要らないので相性がよい。
function bigrams(s) {
  const out = new Set();
  for (let i = 0; i < s.length - 1; i += 1) out.add(s.slice(i, i + 2));
  return out;
}

function bigramStats(a, b) {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na || !nb) return { dice: 0, overlap: 0 };
  if (na === nb) return { dice: 1, overlap: 1 };
  const ba = bigrams(na);
  const bb = bigrams(nb);
  if (ba.size === 0 || bb.size === 0) return { dice: 0, overlap: 0 };
  let shared = 0;
  for (const g of ba) if (bb.has(g)) shared += 1;
  return {
    dice: (2 * shared) / (ba.size + bb.size),
    overlap: shared / Math.min(ba.size, bb.size)
  };
}

export function titleSimilarity(a, b) {
  return bigramStats(a, b).dice;
}

// 文字 n-gram だけでは「メルカリ、2025年度決算を発表」と
// 「ラクマ、2025年度決算を発表」が区別できない。違うのは社名だけで、
// 残り全部が一致してしまうからだ。そこで固有名詞らしき語を別に抜き出し、
// 「両方に固有名詞があるのに一つも重ならない」ときはマージを禁じる。
//
// 抜き出す対象は次の 2 つに絞った。汎用語を拾うと逆に誤マージが増える。
//   - 大文字で始まる / 大文字を含むラテン語（Slack, OpenAI, AWS, SmartHR …）
//   - 3 文字以上のカタカナ連続（メルカリ, ラクマ, サイボウズ …）
export function extractEntities(title) {
  if (!title) return new Set();
  const out = new Set();

  for (const m of title.matchAll(/[A-Za-z][A-Za-z0-9.+&-]{2,}/g)) {
    const token = m[0];
    if (/[A-Z]/.test(token)) out.add(token.toLowerCase().replace(/[.+&-]+$/, ''));
  }
  for (const m of title.matchAll(/[ァ-ヴー]{3,}/g)) {
    out.add(m[0]);
  }
  return out;
}

function sharedEntities(a, b) {
  const ea = extractEntities(a);
  const eb = extractEntities(b);
  const shared = new Set();
  for (const e of ea) if (eb.has(e)) shared.add(e);
  return { ea, eb, shared };
}

// 見出しに出てくる数字は強い手がかりになる。「150億円」が両方にあれば、
// 同じ出来事を指している可能性が高い。ただし年号（2025 など）は
// 同じ会社の別ニュースにも当たり前に出てくるので、手がかりから外す。
function distinctiveNumbers(title) {
  const out = new Set();
  for (const m of (title || '').matchAll(/\d+/g)) {
    const value = Number(m[0]);
    const isYear = m[0].length === 4 && value >= 1900 && value <= 2100;
    if (!isYear) out.add(m[0]);
  }
  return out;
}

function hasSharedNumber(a, b) {
  const na = distinctiveNumbers(a);
  const nb = distinctiveNumbers(b);
  for (const n of na) if (nb.has(n)) return true;
  return false;
}

/**
 * 2 つの見出しが同じ話題かどうか。
 *
 * 文字 n-gram の類似度だけでは、次の 2 つを同時に満たせない。
 *   - 媒体ごとに言い回しが違う同一ニュースをまとめる（似ていないのに同じ）
 *   - 社名だけ違う同型の見出しを分ける（似ているのに違う）
 * そこで、固有名詞と数字という別方向の手がかりを重ねて判定している。
 */
export function isSameStory(a, b) {
  const { ea, eb, shared } = sharedEntities(a, b);

  // 両方に固有名詞があるのに一つも重ならない → 別の話題と断定してよい
  if (ea.size > 0 && eb.size > 0 && shared.size === 0) return false;

  const { dice, overlap } = bigramStats(a, b);
  if (dice >= 0.58) return true;
  if (overlap >= 0.72 && dice >= 0.5) return true;

  // 同じ固有名詞と同じ数字を共有していれば、言い回しが違っても同じ出来事とみる
  if (shared.size > 0 && hasSharedNumber(a, b) && dice >= 0.45) return true;

  return false;
}

/**
 * 同じ話題を1件にまとめる。まとめた相手は corroboration として残し、
 * 「複数媒体が同時に扱った＝重要」というシグナルに使う。
 */
export function dedupe(items) {
  const groups = [];
  const byUrl = new Map();

  for (const item of items) {
    const key = canonicalUrl(item.link);

    const existingByUrl = key && byUrl.get(key);
    if (existingByUrl) {
      existingByUrl.duplicates.push(item);
      continue;
    }

    // 言語をまたいだ同一話題（英語版と日本語版）は別枠で扱いたいので、
    // マージは同じ言語どうしに限る。
    const near = groups.find(
      (g) => g.lang === item.lang && isSameStory(g.primary.title, item.title)
    );
    if (near) {
      near.duplicates.push(item);
      continue;
    }

    const group = { primary: item, duplicates: [], lang: item.lang };
    groups.push(group);
    if (key) byUrl.set(key, group);
  }

  return groups.map((g) => {
    // グループ内で最も信頼度の高い情報源を代表にする
    const all = [g.primary, ...g.duplicates];
    all.sort((a, b) => (b.sourceWeight || 1) - (a.sourceWeight || 1));
    const primary = all[0];
    const others = all.slice(1);
    return {
      ...primary,
      canonical: canonicalUrl(primary.link),
      corroboration: others.length,
      alsoReportedBy: [...new Set(others.map((o) => o.sourceName))]
    };
  });
}

// --- スコアリング ----------------------------------------------------------

const RECENCY_HALF_LIFE_HOURS = 16;

export function recencyScore(publishedAt, now = Date.now()) {
  if (!publishedAt) return 0.45; // 日時不明は中間評価にする（切り捨てない）
  const ageHours = (now - Date.parse(publishedAt)) / 3_600_000;
  if (!Number.isFinite(ageHours)) return 0.45;
  if (ageHours < 0) return 1; // 未来日付のフィードは新しい扱い
  return Math.pow(0.5, ageHours / RECENCY_HALF_LIFE_HOURS);
}

/**
 * 1 記事を採点する。
 * @param {object} item
 * @param {Record<string, number>} interestWeights タグID -> 重み
 */
export function scoreItem(item, interestWeights, now = Date.now()) {
  const tags = inferTags(item);

  let interest = 0;
  for (const { tagId, strength } of tags) {
    const w = interestWeights?.[tagId] ?? 1;
    interest += w * Math.min(strength, 3);
  }
  // タグが1つも当たらない記事を殺しきらないよう下駄を履かせる
  const interestFactor = 1 + interest / 4;

  const recency = recencyScore(item.publishedAt, now);
  const source = item.sourceWeight ?? 1;
  const corroborationFactor = 1 + 0.3 * (item.corroboration || 0);

  const score = recency * source * interestFactor * corroborationFactor;

  return {
    ...item,
    tags,
    score,
    scoreBreakdown: {
      recency: Number(recency.toFixed(3)),
      source,
      interestFactor: Number(interestFactor.toFixed(3)),
      corroborationFactor: Number(corroborationFactor.toFixed(3))
    }
  };
}

// --- 選定 ------------------------------------------------------------------

// 尺ごとの構成。深掘りと一言紹介の比率は、聞いていて疲れない配分に寄せている。
export const DURATION_PLANS = {
  5: { deepDive: 2, roundup: 4, glossary: 1 },
  10: { deepDive: 3, roundup: 6, glossary: 2 },
  15: { deepDive: 4, roundup: 8, glossary: 3 }
};

export function planFor(durationMin) {
  return DURATION_PLANS[durationMin] || DURATION_PLANS[10];
}

/**
 * スコア順に並べつつ、同じ情報源ばかりにならないよう制約をかけて選ぶ。
 */
export function select(scored, { durationMin = 10, maxAgeHours = 36, excludeLinks = [] } = {}) {
  const plan = planFor(durationMin);
  const excluded = new Set(excludeLinks.map(canonicalUrl));
  const now = Date.now();

  const eligible = scored
    .filter((item) => !excluded.has(item.canonical || canonicalUrl(item.link)))
    .filter((item) => {
      if (!item.publishedAt) return true; // 日時不明は落とさない
      const ageHours = (now - Date.parse(item.publishedAt)) / 3_600_000;
      return !Number.isFinite(ageHours) || ageHours <= maxAgeHours;
    })
    .sort((a, b) => b.score - a.score);

  const perSource = new Map();
  const deepDive = [];
  const roundup = [];

  // 深掘りは 1 情報源あたり 1 本まで。朝いちばんの3本が同じ媒体だと視野が狭まる。
  for (const item of eligible) {
    if (deepDive.length >= plan.deepDive) break;
    const used = perSource.get(item.sourceId) || 0;
    if (used >= 1) continue;
    perSource.set(item.sourceId, used + 1);
    deepDive.push(item);
  }

  // ラウンドアップは 1 情報源あたり 2 本まで
  const chosen = new Set(deepDive.map((i) => i.canonical || canonicalUrl(i.link)));
  for (const item of eligible) {
    if (roundup.length >= plan.roundup) break;
    const key = item.canonical || canonicalUrl(item.link);
    if (chosen.has(key)) continue;
    const used = perSource.get(item.sourceId) || 0;
    if (used >= 3) continue;
    perSource.set(item.sourceId, used + 1);
    chosen.add(key);
    roundup.push(item);
  }

  return { deepDive, roundup, plan, eligibleCount: eligible.length };
}
