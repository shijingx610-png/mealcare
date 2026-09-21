// 静的に置かれたエピソードを読む
// ---------------------------------------------------------------------------
// GitHub Pages のように「置いてあるだけ」の場所で配られたとき用。
// サーバーが無いので、毎朝の生成は別のところ（GitHub Actions など）で済ませ、
// アプリはその結果を読むだけにする。

async function getJson(url) {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url} を読めません (${res.status})`);
  return res.json();
}

/**
 * エピソード一覧。無ければ例外を投げる（＝静的配信ではない、と判断できる）。
 */
export async function loadStaticIndex() {
  const index = await getJson('data/index.json');
  if (!index || !Array.isArray(index.episodes)) {
    throw new Error('data/index.json の形式が違います');
  }
  return index;
}

/**
 * 台本まで含む本体。一覧は概要しか持っていないので、開くときに取りにいく。
 */
export async function loadStaticEpisode(entry) {
  const episode = await getJson(entry.data);
  return {
    ...episode,
    // 音声の場所は一覧側が持っている情報のほうが新しい
    audio: entry.audio || episode.audio || null
  };
}
