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
 * HTML からフィードの場所を見つける。
 *
 * フィードの URL は移転する。だが移転先はたいてい、サイトのトップページの
 * <link rel="alternate" type="application/rss+xml" href="..."> に書いてある。
 * これは RSS の自動検出として昔から使われている仕組みで、
 * 「カタログの URL が死んだら本人に聞きにいく」ための最短経路になる。
 */
export function discoverFeedUrls(html, baseUrl) {
  if (!html) return [];
  const found = [];

  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    if (!/rel\s*=\s*["']?[^"'>]*alternate/i.test(tag)) continue;
    if (!/type\s*=\s*["'](application\/(rss|atom)\+xml|application\/rdf\+xml|text\/xml)["']/i.test(tag)) {
      continue;
    }
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (!href) continue;
    try {
      found.push(new URL(decodeEntities(href[1]).trim(), baseUrl).toString());
    } catch {
      // 解決できない href は捨てる
    }
  }

  // よくある置き場所も候補に足す。<link> を書いていないサイトがまだ多い。
  if (found.length === 0) {
    for (const guess of ['/feed', '/rss', '/rss.xml', '/atom.xml', '/index.rdf', '/feed.xml']) {
      try {
        found.push(new URL(guess, baseUrl).toString());
      } catch {
        // 無視
      }
    }
  }

  return [...new Set(found)];
}

async function fetchXml(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept:
          'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5'
      }
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const buf = new Uint8Array(await res.arrayBuffer());
    return {
      ok: true,
      text: decodeBytes(buf, res.headers.get('content-type')),
      finalUrl: res.url || url
    };
  } catch (err) {
    const aborted = err && (err.name === 'AbortError' || err.name === 'TimeoutError');
    return {
      ok: false,
      error: aborted ? `タイムアウト (${timeoutMs}ms)` : String(err?.message || err)
    };
  } finally {
    clearTimeout(timer);
  }
}

function normalizeItems(parsed, source, resolvedUrl, maxItems) {
  return parsed
    .filter((entry) => entry.title && entry.link)
    .slice(0, maxItems)
    .map((entry) => ({
      ...entry,
      sourceId: source.id,
      sourceName: source.name,
      sourceWeight: source.weight ?? 1,
      sourceTags: source.tags ?? [],
      lang: source.lang ?? 'ja',
      sourceUrl: resolvedUrl
    }));
}

/**
 * 候補 URL を順に試し、最初に読めたものを使う。
 * 全部だめならサイトのトップから自動検出を試みる。
 *
 * @param {object} source カタログの1件
 * @param {{timeoutMs?:number, maxItems?:number, overrideUrl?:string, discover?:boolean}} [options]
 */
export async function fetchSource(source, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxItems = options.maxItems ?? 25;
  const allowDiscovery = options.discover !== false;
  const startedAt = Date.now();

  // 手動で直した URL を最優先。次にカタログの URL、その次に代替 URL。
  const candidates = [
    options.overrideUrl,
    source.url,
    ...(source.altUrls || [])
  ].filter(Boolean);

  const tried = [];

  for (const url of [...new Set(candidates)]) {
    const res = await fetchXml(url, timeoutMs);
    if (!res.ok) {
      tried.push({ url, error: res.error });
      continue;
    }
    const parsed = parseFeed(res.text);
    if (parsed.length === 0) {
      tried.push({ url, error: 'フィードとして解釈できる項目が 0 件' });
      continue;
    }
    return {
      sourceId: source.id,
      ok: true,
      error: null,
      resolvedUrl: url,
      movedFrom: url === source.url ? null : source.url,
      discovered: false,
      tried,
      elapsedMs: Date.now() - startedAt,
      items: normalizeItems(parsed, source, url, maxItems)
    };
  }

  // ここまで全滅。サイト本体にフィードの場所を聞きにいく。
  const homepage = source.homepage || originOf(source.url);
  if (allowDiscovery && homepage) {
    const page = await fetchXml(homepage, timeoutMs);
    if (page.ok) {
      const discovered = discoverFeedUrls(page.text, page.finalUrl || homepage).filter(
        (u) => !candidates.includes(u)
      );
      for (const url of discovered.slice(0, 4)) {
        const res = await fetchXml(url, timeoutMs);
        if (!res.ok) {
          tried.push({ url, error: res.error });
          continue;
        }
        const parsed = parseFeed(res.text);
        if (parsed.length === 0) {
          tried.push({ url, error: 'フィードとして解釈できる項目が 0 件' });
          continue;
        }
        return {
          sourceId: source.id,
          ok: true,
          error: null,
          resolvedUrl: url,
          movedFrom: source.url,
          discovered: true,
          tried,
          elapsedMs: Date.now() - startedAt,
          items: normalizeItems(parsed, source, url, maxItems)
        };
      }
    } else {
      tried.push({ url: homepage, error: page.error });
    }
  }

  return {
    sourceId: source.id,
    ok: false,
    error: tried[0]?.error || '取得できませんでした',
    resolvedUrl: null,
    movedFrom: null,
    discovered: false,
    tried,
    elapsedMs: Date.now() - startedAt,
    items: []
  };
}

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * 複数の情報源を並列取得する。1 つ落ちても全体は止めない。
 */
export async function fetchAllSources(sources, options = {}) {
  const overrides = options.urlOverrides || {};
  const results = await Promise.all(
    sources.map((s) => fetchSource(s, { ...options, overrideUrl: overrides[s.id] }))
  );
  const items = results.flatMap((r) => r.items);
  const health = results.map(({ items: _items, ...rest }) => rest);
  return { items, health };
}
