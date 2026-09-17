// localStorage の読み書き
// ---------------------------------------------------------------------------
// サーバーにデータベースを持たない設計にしている。理由は 2 つ。
//  - 自分ひとりが聞くアプリに、運用が必要な状態を持たせたくない
//  - 「何を聞いたか」は個人の関心そのもので、手元から出したくない
// 代わりに、端末をまたいだ同期はできない。設定はエクスポートで持ち運ぶ。

const KEYS = {
  settings: 'tc1_settings',
  episodes: 'tc1_episodes',
  learned: 'tc1_learned_terms'
};

const MAX_EPISODES = 30;
const MAX_EXCLUDE_LINKS = 400;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    // 容量超過。古いエピソードを落とすのは呼び出し側の責務にする。
    console.warn('[store] 保存に失敗しました', err);
    return false;
  }
}

export const DEFAULT_SETTINGS = {
  enabledSourceIds: null, // null = サーバー側の既定（core のみ）
  interestWeights: null, // null = タグごとの既定値
  durationMin: 10,
  maxAgeHours: 36,
  useClaude: true,
  rate: 1.15,
  voiceURI: null,
  autoGenerateOnOpen: true
};

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) };
}

export function saveSettings(settings) {
  return write(KEYS.settings, settings);
}

export function loadEpisodes() {
  const list = read(KEYS.episodes, []);
  return Array.isArray(list) ? list : [];
}

export function saveEpisode(episode) {
  const existing = loadEpisodes().filter((e) => e.id !== episode.id);
  let next = [episode, ...existing].slice(0, MAX_EPISODES);
  // 保存できるまで古いものから捨てる。台本は長いので容量に当たりうる。
  while (next.length > 1 && !write(KEYS.episodes, next)) {
    next = next.slice(0, next.length - 1);
  }
  if (next.length <= 1) write(KEYS.episodes, next);
  return next;
}

export function deleteEpisode(id) {
  const next = loadEpisodes().filter((e) => e.id !== id);
  write(KEYS.episodes, next);
  return next;
}

/**
 * すでに扱った記事の URL。同じニュースを翌朝もう一度聞かされないようにする。
 */
export function recentlyCoveredLinks(episodes = loadEpisodes()) {
  const links = [];
  for (const ep of episodes) {
    for (const ref of [...(ep.items?.deepDive || []), ...(ep.items?.roundup || [])]) {
      if (ref.url) links.push(ref.url);
    }
    if (links.length >= MAX_EXCLUDE_LINKS) break;
  }
  return links.slice(0, MAX_EXCLUDE_LINKS);
}

export function loadLearnedTerms() {
  const list = read(KEYS.learned, []);
  return Array.isArray(list) ? list : [];
}

export function toggleLearnedTerm(termId) {
  const current = new Set(loadLearnedTerms());
  if (current.has(termId)) current.delete(termId);
  else current.add(termId);
  const next = [...current];
  write(KEYS.learned, next);
  return next;
}

export function exportAll() {
  return {
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
    learnedTerms: loadLearnedTerms(),
    episodes: loadEpisodes()
  };
}

export function importAll(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('読み込めない形式です');
  if (payload.settings) write(KEYS.settings, { ...DEFAULT_SETTINGS, ...payload.settings });
  if (Array.isArray(payload.learnedTerms)) write(KEYS.learned, payload.learnedTerms);
  if (Array.isArray(payload.episodes)) write(KEYS.episodes, payload.episodes.slice(0, MAX_EPISODES));
}
