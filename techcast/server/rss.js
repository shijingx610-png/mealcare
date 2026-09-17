// 依存ゼロの RSS 2.0 / RDF(RSS 1.0) / Atom パーサ
// ---------------------------------------------------------------------------
// フィードの世界は行儀が悪い。名前空間がまちまちで、CDATA が混ざり、
// 日本の媒体には EUC-JP や Shift_JIS のまま配信しているものもある。
// ライブラリを足す価値より、壊れたときに自分で直せることを優先して手書きにした。

const DEFAULT_TIMEOUT_MS = 12000;
const USER_AGENT =
  'Mozilla/5.0 (compatible; TechCast/1.0; +https://github.com/) morning-briefing-bot';

// --- 文字コード ------------------------------------------------------------

function charsetFromContentType(contentType) {
  if (!contentType) return null;
  const m = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType);
  return m ? m[1].toLowerCase() : null;
}

function charsetFromXmlDeclaration(bytes) {
  // 先頭 200 バイトを ASCII 相当で覗いて <?xml encoding="..."?> を探す
  const head = new TextDecoder('latin1').decode(bytes.slice(0, 200));
  const m = /encoding\s*=\s*["']([\w-]+)["']/i.exec(head);
  return m ? m[1].toLowerCase() : null;
}

function decodeBytes(bytes, contentType) {
  const label =
    charsetFromContentType(contentType) || charsetFromXmlDeclaration(bytes) || 'utf-8';
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

// --- エスケープ処理 --------------------------------------------------------

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’'
};

export function decodeEntities(input) {
  if (!input) return '';
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => safeCodePoint(parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (whole, name) => {
      const hit = NAMED_ENTITIES[name.toLowerCase()];
      return hit === undefined ? whole : hit;
    });
}

function safeCodePoint(code) {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

function stripCdata(input) {
  return input.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

export function stripHtml(input) {
  if (!input) return '';
  return decodeEntities(
    stripCdata(input)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

// --- タグ抽出 --------------------------------------------------------------

// 名前空間つき（dc:date など）にも当たるようにする。
function tagPattern(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `<(?:[a-z0-9_-]+:)?${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-z0-9_-]+:)?${escaped}>`,
    'i'
  );
}

function pickTag(block, names) {
  for (const name of names) {
    const m = tagPattern(name).exec(block);
    if (m && m[1] != null) {
      const value = decodeEntities(stripCdata(m[1])).trim();
      if (value) return value;
    }
  }
  return '';
}

function pickAllTags(block, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `<(?:[a-z0-9_-]+:)?${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[a-z0-9_-]+:)?${escaped}>`,
    'gi'
  );
  const out = [];
  let m;
  while ((m = re.exec(block)) !== null) {
    const value = decodeEntities(stripCdata(m[1])).trim();
    if (value) out.push(value);
  }
  return out;
}

function pickLink(block) {
  // Atom: <link rel="alternate" href="..."/> を優先し、なければ最初の href
  const alternate =
    /<(?:[a-z0-9_-]+:)?link[^>]*\brel=["']alternate["'][^>]*\bhref=["']([^"']+)["']/i.exec(
      block
    ) ||
    /<(?:[a-z0-9_-]+:)?link[^>]*\bhref=["']([^"']+)["'][^>]*\brel=["']alternate["']/i.exec(
      block
    );
  if (alternate) return decodeEntities(alternate[1]).trim();

  const anyHref = /<(?:[a-z0-9_-]+:)?link[^>]*\bhref=["']([^"']+)["']/i.exec(block);
  if (anyHref) return decodeEntities(anyHref[1]).trim();

  // RSS / RDF: <link>https://...</link>
  const text = pickTag(block, ['link', 'guid', 'id']);
  if (/^https?:\/\//i.test(text)) return text;
  return '';
}

function parseDate(raw) {
  if (!raw) return null;
  const t = Date.parse(raw);
  if (Number.isFinite(t)) return new Date(t).toISOString();
  return null;
}

// --- 本体 ------------------------------------------------------------------

/**
 * フィード XML を正規化済みエントリ配列にする。
 * @param {string} xml
 * @returns {Array<{title:string,link:string,summary:string,publishedAt:string|null,author:string,categories:string[]}>}
 */
export function parseFeed(xml) {
  if (!xml || typeof xml !== 'string') return [];

  const blocks = [];
  const re = /<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) blocks.push(m[2]);

  return blocks.map((block) => {
    const rawSummary = pickTag(block, [
      'description',
      'summary',
      'encoded', // content:encoded
      'content'
    ]);
    return {
      title: stripHtml(pickTag(block, ['title'])),
      link: pickLink(block),
      summary: stripHtml(rawSummary).slice(0, 700),
      publishedAt: parseDate(
        pickTag(block, ['pubDate', 'published', 'date', 'updated', 'modified'])
      ),
      author: stripHtml(pickTag(block, ['creator', 'author', 'name'])),
      categories: pickAllTags(block, 'category').slice(0, 8)
    };
  });
}

/**
 * 1 つの情報源を取得して正規化する。失敗しても投げず、結果に理由を載せる。
 * @param {{id:string,name:string,url:string,lang:string,weight:number,tags:string[]}} source
 * @param {{timeoutMs?:number, maxItems?:number}} [options]
 */
export async function fetchSource(source, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxItems = options.maxItems ?? 25;
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
      }
    });

    if (!res.ok) {
      return {
        sourceId: source.id,
        ok: false,
        error: `HTTP ${res.status}`,
        elapsedMs: Date.now() - startedAt,
        items: []
      };
    }

    const buf = new Uint8Array(await res.arrayBuffer());
    const xml = decodeBytes(buf, res.headers.get('content-type'));
    const parsed = parseFeed(xml);

    if (parsed.length === 0) {
      return {
        sourceId: source.id,
        ok: false,
        error: 'フィードとして解釈できる項目が 0 件',
        elapsedMs: Date.now() - startedAt,
        items: []
      };
    }

    const items = parsed
      .filter((entry) => entry.title && entry.link)
      .slice(0, maxItems)
      .map((entry) => ({
        ...entry,
        sourceId: source.id,
        sourceName: source.name,
        sourceWeight: source.weight ?? 1,
        sourceTags: source.tags ?? [],
        lang: source.lang ?? 'ja'
      }));

    return {
      sourceId: source.id,
      ok: true,
      error: null,
      elapsedMs: Date.now() - startedAt,
      items
    };
  } catch (err) {
    const aborted = err && (err.name === 'AbortError' || err.name === 'TimeoutError');
    return {
      sourceId: source.id,
      ok: false,
      error: aborted ? `タイムアウト (${timeoutMs}ms)` : String(err?.message || err),
      elapsedMs: Date.now() - startedAt,
      items: []
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 複数の情報源を並列取得する。1 つ落ちても全体は止めない。
 */
export async function fetchAllSources(sources, options = {}) {
  const results = await Promise.all(sources.map((s) => fetchSource(s, options)));
  const items = results.flatMap((r) => r.items);
  const health = results.map(({ items: _items, ...rest }) => rest);
  return { items, health };
}
