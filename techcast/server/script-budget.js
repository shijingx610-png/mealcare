// 台本の文字数の配分
// ---------------------------------------------------------------------------
// 「10分」と表示しているのに 6 分半しか話さない、という状態になっていた。
// 各パートに指示する文字数を目分量で決めていて、合計を確かめていなかったため。
//
// ここでは尺から逆算する。まず全体の文字数を決め、固定パート（挨拶・用語・
// 締めなど）を引き、残りを深掘りに配る。合計が必ず尺に一致する。

// 日本語の読み上げは 1 分あたり 320 文字前後。再生速度は聞く人の設定なので、
// ここでは等速を基準にする。
export const CHARS_PER_MINUTE = 320;

/**
 * @param {number} durationMin 目標の尺（分）
 * @param {{deepDive:number, roundup:number, glossary:number}} plan
 */
export function scriptBudget(durationMin, plan) {
  const total = Math.round(durationMin * CHARS_PER_MINUTE);

  // 尺が伸びても、挨拶や締めは比例して長くしない。長い挨拶は聞きたくない。
  const opening = durationMin >= 15 ? 220 : durationMin >= 10 ? 200 : 150;
  const closing = durationMin >= 15 ? 110 : durationMin >= 10 ? 100 : 90;
  const career = durationMin >= 15 ? 200 : durationMin >= 10 ? 180 : 150;
  const glossaryEach = durationMin >= 10 ? 220 : 200;
  const roundupEach = durationMin >= 10 ? 90 : 80;

  const fixed =
    opening + closing + career + plan.glossary * glossaryEach + plan.roundup * roundupEach;

  // 残りを深掘りで埋める。ここが番組の中身なので、しわ寄せはここで吸収する。
  const deepDiveTotal = Math.max(plan.deepDive * 200, total - fixed);
  const deepDiveEach = Math.round(deepDiveTotal / Math.max(1, plan.deepDive));

  return {
    total,
    opening,
    closing,
    career,
    glossaryEach,
    roundupEach,
    roundupTotal: plan.roundup * roundupEach,
    deepDiveEach,
    // 実際に指示する合計。丸めのぶんだけ total とわずかにずれる。
    plannedTotal:
      opening +
      closing +
      career +
      plan.glossary * glossaryEach +
      plan.roundup * roundupEach +
      plan.deepDive * deepDiveEach
  };
}
