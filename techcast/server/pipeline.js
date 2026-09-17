// 収集から台本までの一本道
// ---------------------------------------------------------------------------
// フロントからは「設定を渡すとエピソードが返る」だけに見えるようにする。

import { SOURCES, SOURCE_BY_ID, defaultEnabledSourceIds } from './sources.js';
import { fetchAllSources } from './rss.js';
import { defaultInterestWeights } from './taxonomy.js';
import { dedupe, scoreItem, select, planFor } from './rank.js';
import { detectTerms, fallbackTerms } from './glossary.js';
import { buildTemplateEpisode } from './script-template.js';
import { buildClaudeEpisode, MissingApiKeyError } from './script-claude.js';

function resolveSources(sourceIds) {
  const ids = Array.isArray(sourceIds) && sourceIds.length ? sourceIds : defaultEnabledSourceIds();
  return ids.map((id) => SOURCE_BY_ID[id]).filter(Boolean);
}

/**
 * 情報源を取得して、今日の番組に載せる記事を選ぶところまで。
 */
export async function collect({
  sourceIds,
  interestWeights,
  durationMin = 10,
  maxAgeHours = 36,
  excludeLinks = [],
  learnedTermIds = [],
  timeoutMs
} = {}) {
  const sources = resolveSources(sourceIds);
  if (sources.length === 0) {
    return {
      deepDive: [],
      roundup: [],
      terms: [],
      health: [],
      stats: { fetched: 0, unique: 0, eligible: 0, sources: 0 },
      plan: planFor(durationMin)
    };
  }

  const weights = { ...defaultInterestWeights(), ...(interestWeights || {}) };
  const { items, health } = await fetchAllSources(sources, { timeoutMs });

  const unique = dedupe(items);
  const now = Date.now();
  const scored = unique.map((item) => scoreItem(item, weights, now));
  const { deepDive, roundup, plan, eligibleCount } = select(scored, {
    durationMin,
    maxAgeHours,
    excludeLinks
  });

  const chosen = [...deepDive, ...roundup];
  let terms = detectTerms(chosen, { exclude: learnedTermIds, limit: plan.glossary });
  if (terms.length < plan.glossary) {
    // 記事から拾えなかった分は、まだ扱っていない易しい用語で埋める
    const already = new Set([...terms.map((t) => t.id), ...learnedTermIds]);
    terms = [...terms, ...fallbackTerms([...already], plan.glossary - terms.length)];
  }

  return {
    deepDive,
    roundup,
    terms,
    health,
    plan,
    stats: {
      sources: sources.length,
      sourcesOk: health.filter((h) => h.ok).length,
      fetched: items.length,
      unique: unique.length,
      eligible: eligibleCount
    }
  };
}

/**
 * 収集 → 台本まで一気に。Claude が使えなければテンプレートに落とす。
 * どちらで作ったかは episode.generator と fallbackReason で分かる。
 */
export async function generateEpisode(options = {}) {
  const { useClaude = true, date = new Date(), durationMin = 10, apiKey } = options;
  const collected = await collect({ ...options, durationMin });

  const base = {
    date,
    durationMin,
    deepDive: collected.deepDive,
    roundup: collected.roundup,
    terms: collected.terms,
    health: collected.health,
    stats: collected.stats,
    plan: collected.plan
  };

  if (collected.deepDive.length === 0 && collected.roundup.length === 0) {
    const episode = buildTemplateEpisode(base);
    return {
      ...episode,
      fallbackReason: '条件に合う新しい記事が見つかりませんでした'
    };
  }

  if (!useClaude) {
    return buildTemplateEpisode(base);
  }

  try {
    return await buildClaudeEpisode({ ...base, apiKey });
  } catch (err) {
    const reason =
      err instanceof MissingApiKeyError
        ? 'ANTHROPIC_API_KEY が未設定のため、テンプレートで生成しました'
        : `Claude での生成に失敗したため、テンプレートで生成しました（${err.message}）`;
    const episode = buildTemplateEpisode(base);
    return { ...episode, fallbackReason: reason };
  }
}

export { SOURCES };
