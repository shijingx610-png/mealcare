// 用語マッチのための小さな共有ユーティリティ
// ---------------------------------------------------------------------------
// 素朴に includes で判定すると、短い英略語が他の単語に埋もれて誤爆する。
//   'ai'  → "said" / "email" / "available"
//   'ses' → "releases"
//   'ec'  → "technology"
// 日本語には単語境界がないので includes のままでよく、英数字だけの語に限って
// 境界チェックを掛ける、という二段構えにしている。

const ASCII_ONLY = /^[\x20-\x7e]+$/;

const cache = new Map();

function boundaryRegex(needle) {
  let re = cache.get(needle);
  if (!re) {
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 英数字に挟まれていないことを要求する。記号や日本語は境界として許す。
    re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    cache.set(needle, re);
  }
  return re;
}

/**
 * haystack（小文字化済みを想定）に needle が「語として」含まれるか。
 * @param {string} haystack
 * @param {string} needle
 */
export function containsTerm(haystack, needle) {
  if (!haystack || !needle) return false;
  const n = needle.toLowerCase();
  if (ASCII_ONLY.test(n)) return boundaryRegex(n).test(haystack);
  return haystack.includes(n);
}

/**
 * 何個の needle が当たったかを数える。
 */
export function countMatches(haystack, needles) {
  let n = 0;
  for (const needle of needles) {
    if (containsTerm(haystack, needle)) n += 1;
  }
  return n;
}
