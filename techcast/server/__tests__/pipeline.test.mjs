// パイプラインの回帰テスト
// ---------------------------------------------------------------------------
// 外部フィードは実行のたびに中身が変わるので、ローカルに立てた HTTP サーバーで
// 固定のフィードを配って、取得から台本までを通しで確かめる。
//
//   node --test server/__tests__/

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { parseFeed, stripHtml, decodeEntities } from '../rss.js';
import { containsTerm } from '../match.js';
import { inferTags, defaultInterestWeights } from '../taxonomy.js';
import { detectTerms, fallbackTerms, GLOSSARY } from '../glossary.js';
import {
  canonicalUrl,
  dedupe,
  extractEntities,
  isSameStory,
  recencyScore,
  scoreItem,
  select
} from '../rank.js';
import { collect, generateEpisode } from '../pipeline.js';
import { discoverFeedUrls, fetchSource } from '../rss.js';
import { SOURCES } from '../sources.js';
import { buildTemplateEpisode } from '../script-template.js';
import { RSS_JA, RDF_JA, ATOM_EN, BROKEN } from './fixtures/feeds.js';

// --- フィード解析 ----------------------------------------------------------

describe('フィード解析', () => {
  test('RSS 2.0 の CDATA とエスケープを解く', () => {
    const [first] = parseFeed(RSS_JA);
    assert.equal(first.title, 'SmartHRがシリーズEで150億円を調達');
    assert.match(first.summary, /人事労務SaaS/);
    assert.ok(!first.summary.includes('<p>'), 'HTML タグが残っている');
    assert.ok(first.publishedAt, '発行日時を取れていない');
    assert.deepEqual(first.categories, ['SaaS']);
    assert.equal(first.author, '記者A');
  });

  test('RDF の dc:date と link を読む', () => {
    const items = parseFeed(RDF_JA);
    assert.equal(items.length, 2);
    assert.equal(items[0].link, 'https://example-b.test/n/1');
    assert.ok(items[0].publishedAt);
  });

  test('Atom の rel=alternate を優先して link を取る', () => {
    const items = parseFeed(ATOM_EN);
    assert.equal(items[0].link, 'https://example-c.test/p/1');
    assert.match(items[0].summary, /agents that use tools/);
  });

  test('フィードでないものからは何も取らない', () => {
    assert.deepEqual(parseFeed(BROKEN), []);
    assert.deepEqual(parseFeed(''), []);
    assert.deepEqual(parseFeed(null), []);
  });

  test('数値文字参照を含む実体参照を戻す', () => {
    assert.equal(decodeEntities('A&amp;B &#x3042;&#12356; &hellip;'), 'A&B あい …');
    assert.equal(stripHtml('<p>あ<br>い</p>'), 'あ い');
  });
});

// --- 語のマッチ ------------------------------------------------------------

describe('語のマッチ', () => {
  test('短い英略語が別の単語に埋もれて誤爆しない', () => {
    assert.equal(containsTerm('openai releases agent api', 'ses'), false);
    assert.equal(containsTerm('send an email today', 'ai'), false);
    assert.equal(containsTerm('technology roundup', 'ec'), false);
  });

  test('語として現れていれば当たる', () => {
    assert.equal(containsTerm('ai agent launched', 'ai'), true);
    assert.equal(containsTerm('runs on aws today', 'aws'), true);
    assert.equal(containsTerm('国内サース市場の動向', 'サース'), true);
  });
});

// --- タグ推定 --------------------------------------------------------------

describe('タグ推定', () => {
  test('資金調達とSaaSを取り違えない', () => {
    const tags = inferTags({
      title: 'SmartHRがシリーズEで150億円を調達、ARR成長率は50%超',
      summary: '国内SaaS大手の資金調達',
      categories: [],
      sourceTags: ['japan']
    }).map((t) => t.tagId);
    assert.ok(tags.includes('funding'), '資金調達タグがない');
    assert.ok(tags.includes('saas'), 'SaaSタグがない');
  });

  test('関係のない文からはタグを作らない', () => {
    const tags = inferTags({
      title: 'Technology giant said available',
      summary: '',
      categories: [],
      sourceTags: []
    });
    assert.deepEqual(tags, []);
  });
});

// --- 重複判定 --------------------------------------------------------------

describe('重複判定', () => {
  const samePairs = [
    ['SmartHRが150億円を調達', 'SmartHR、150億円の資金調達を発表'],
    // 片方に「シリーズEで」が入り、文字の一致率は下がる。
    // 社名と金額が揃っていることで同じ出来事だと判断する。
    ['SmartHRがシリーズEで150億円を調達', 'SmartHR、150億円の資金調達を発表'],
    ['OpenAIが新モデルGPT-5を発表', 'OpenAI、新モデル「GPT-5」を公開'],
    ['メルカリ、2025年度決算を発表 営業利益は前年比20%増', 'メルカリの2025年度決算、営業利益20%増'],
    ['AWSが東京リージョンで新サービスを提供開始', 'アマゾン、AWS東京リージョンに新サービス'],
    ['Google launches Gemini 3 for enterprise customers', 'Google unveils Gemini 3 aimed at enterprises'],
    ['Slack adds AI summaries to channels', 'Slack rolls out AI channel summaries']
  ];

  const differentPairs = [
    ['SmartHRが150億円を調達', 'freeeが100億円を調達'],
    ['OpenAIが新モデルGPT-5を発表', 'OpenAIがCEO人事を発表'],
    ['AWSが東京リージョンで新サービスを提供開始', 'AWSが大阪リージョンの障害を報告'],
    ['Google launches Gemini 3 for enterprise customers', 'Google faces antitrust ruling in Europe'],
    // 社名以外が完全一致する、文字n-gramだけでは分けられない組
    ['メルカリ、2025年度決算を発表', 'ラクマ、2025年度決算を発表'],
    ['Slack adds AI summaries to channels', 'Notion adds AI summaries to pages'],
    // 同じ会社・同じ年で話題だけ違う組。年号を手がかりから外していないと誤って統合する。
    ['AWSが2025年の決算を発表', 'AWSが2025年に新サービスを投入']
  ];

  for (const [a, b] of samePairs) {
    test(`同じ話題とみなす: ${a.slice(0, 18)}`, () => {
      assert.equal(isSameStory(a, b), true);
    });
  }

  for (const [a, b] of differentPairs) {
    test(`別の話題とみなす: ${a.slice(0, 18)}`, () => {
      assert.equal(isSameStory(a, b), false);
    });
  }

  test('固有名詞を拾う', () => {
    assert.deepEqual([...extractEntities('Slack adds AI summaries')], ['slack']);
    assert.deepEqual([...extractEntities('メルカリ、2025年度決算を発表')], ['メルカリ']);
  });

  test('追跡パラメータを落として URL を正規化する', () => {
    assert.equal(
      canonicalUrl('https://Example.com/a/?utm_source=x&id=3#frag'),
      'https://example.com/a?id=3'
    );
  });

  test('重複をまとめ、報じた媒体を残す', () => {
    const items = [
      { title: 'SmartHRが150億円を調達', link: 'https://a.test/1', lang: 'ja', sourceWeight: 1, sourceName: '媒体A' },
      { title: 'SmartHR、150億円の資金調達を発表', link: 'https://b.test/1', lang: 'ja', sourceWeight: 1.3, sourceName: '媒体B' },
      { title: 'まったく別のニュース', link: 'https://a.test/2', lang: 'ja', sourceWeight: 1, sourceName: '媒体A' }
    ];
    const groups = dedupe(items);
    assert.equal(groups.length, 2);
    const merged = groups.find((g) => g.corroboration > 0);
    assert.equal(merged.sourceName, '媒体B', '信頼度の高い媒体が代表になっていない');
    assert.deepEqual(merged.alsoReportedBy, ['媒体A']);
  });

  test('同一 URL は見出しが違っても 1 件にする', () => {
    const groups = dedupe([
      { title: '見出しA', link: 'https://x.test/1', lang: 'ja', sourceWeight: 1, sourceName: 'A' },
      { title: '見出しB', link: 'https://x.test/1?utm_source=y', lang: 'ja', sourceWeight: 1, sourceName: 'B' }
    ]);
    assert.equal(groups.length, 1);
  });
});

// --- スコアと選定 ----------------------------------------------------------

describe('スコアと選定', () => {
  test('鮮度は半減期16時間で落ちる', () => {
    const now = Date.now();
    assert.equal(recencyScore(new Date(now).toISOString(), now).toFixed(2), '1.00');
    assert.equal(recencyScore(new Date(now - 16 * 3600_000).toISOString(), now).toFixed(2), '0.50');
    assert.equal(recencyScore(null, now), 0.45, '日時不明を切り捨てている');
  });

  test('興味の重みがスコアに効く', () => {
    const item = {
      title: 'SaaS企業がARRを開示',
      summary: 'サブスクリプション収益の話',
      categories: [],
      sourceTags: [],
      sourceWeight: 1,
      publishedAt: new Date().toISOString()
    };
    const low = scoreItem(item, { ...defaultInterestWeights(), saas: 0 }).score;
    const high = scoreItem(item, { ...defaultInterestWeights(), saas: 3 }).score;
    assert.ok(high > low, '重みを上げてもスコアが上がっていない');
  });

  test('深掘りは1情報源あたり1本までにする', () => {
    const now = Date.now();
    const scored = Array.from({ length: 6 }, (_, i) => ({
      title: `記事${i}`,
      link: `https://x.test/${i}`,
      canonical: `https://x.test/${i}`,
      sourceId: i < 4 ? 'same' : `other${i}`,
      publishedAt: new Date(now - i * 3600_000).toISOString(),
      score: 10 - i
    }));
    const { deepDive } = select(scored, { durationMin: 10 });
    const ids = deepDive.map((d) => d.sourceId);
    assert.equal(new Set(ids).size, ids.length, '同じ情報源が深掘りに複数入っている');
  });

  test('既出の記事を除外する', () => {
    const scored = [
      { title: 'A', link: 'https://x.test/1', canonical: 'https://x.test/1', sourceId: 's', publishedAt: new Date().toISOString(), score: 9 },
      { title: 'B', link: 'https://x.test/2', canonical: 'https://x.test/2', sourceId: 't', publishedAt: new Date().toISOString(), score: 8 }
    ];
    const { deepDive, roundup } = select(scored, {
      durationMin: 5,
      excludeLinks: ['https://x.test/1?utm_source=z']
    });
    const titles = [...deepDive, ...roundup].map((i) => i.title);
    assert.deepEqual(titles, ['B'], '既出の記事が除外されていない');
  });
});

// --- 用語辞書 --------------------------------------------------------------

describe('用語辞書', () => {
  test('全ての項目に必要なフィールドがある', () => {
    for (const entry of GLOSSARY) {
      assert.ok(entry.id && entry.term && entry.reading, `${entry.id}: 基本情報が欠けている`);
      assert.ok(entry.definition?.length > 20, `${entry.id}: 定義が短すぎる`);
      assert.ok(entry.interview?.length > 10, `${entry.id}: 面接での使いどころがない`);
      assert.ok(entry.aliases?.length > 0, `${entry.id}: 別名がない`);
    }
  });

  test('IDが重複していない', () => {
    const ids = GLOSSARY.map((g) => g.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('覚えた用語は出さない', () => {
    const items = [{ title: 'ARRとチャーンレートの話', summary: '' }];
    const picked = detectTerms(items, { exclude: ['arr'], limit: 2 }).map((t) => t.id);
    assert.ok(!picked.includes('arr'));
  });

  test('記事から拾えないときも埋め草を返す', () => {
    const filler = fallbackTerms([], 2);
    assert.equal(filler.length, 2);
    assert.ok(filler.every((f) => f.level === 1), '易しい用語から出していない');
  });
});

// --- 通し（ローカルのフィクスチャサーバー）---------------------------------

describe('収集から台本まで', () => {
  let server;
  let base;
  const originalUrls = new Map();

  before(async () => {
    server = createServer((req, res) => {
      const routes = {
        '/a.xml': ['application/rss+xml; charset=utf-8', RSS_JA],
        '/b.rdf': ['application/xml; charset=utf-8', RDF_JA],
        '/c.atom': ['application/atom+xml; charset=utf-8', ATOM_EN],
        '/broken.xml': ['text/html; charset=utf-8', BROKEN]
      };
      const hit = routes[req.url];
      if (!hit) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': hit[0] });
      res.end(hit[1]);
    });

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;

    // カタログの URL を一時的にフィクスチャへ向ける
    const mapping = {
      'itmedia-news': '/a.xml',
      'cnet-japan': '/b.rdf',
      techcrunch: '/c.atom',
      publickey: '/broken.xml'
    };
    for (const source of SOURCES) {
      if (mapping[source.id]) {
        originalUrls.set(source.id, source.url);
        source.url = base + mapping[source.id];
      }
    }
  });

  after(async () => {
    for (const source of SOURCES) {
      if (originalUrls.has(source.id)) source.url = originalUrls.get(source.id);
    }
    await new Promise((resolve) => server.close(resolve));
  });

  const sourceIds = ['itmedia-news', 'cnet-japan', 'techcrunch', 'publickey'];

  test('取得・重複排除・選定が通しで動く', async () => {
    const result = await collect({ sourceIds, durationMin: 10, maxAgeHours: 36 });

    assert.equal(result.stats.sources, 4);
    assert.equal(result.stats.sourcesOk, 3, '壊れたフィードを正常扱いしている');

    const broken = result.health.find((h) => h.sourceId === 'publickey');
    assert.equal(broken.ok, false);
    assert.match(broken.error, /0 件/);

    // SmartHR の記事は 2 媒体にあるので 1 件にまとまるはず
    const chosen = [...result.deepDive, ...result.roundup];
    const smartHr = chosen.filter((i) => i.title.includes('SmartHR'));
    assert.equal(smartHr.length, 1, 'SmartHR の記事がまとまっていない');
    assert.ok(smartHr[0].corroboration >= 1, '複数媒体で報じられた印がついていない');

    // 鮮度から外れた記事は落ちる
    assert.ok(!chosen.some((i) => i.title.includes('古い記事')), '古い記事が残っている');

    // ラクマと メルカリ を取り違えず、別記事として残っている
    assert.ok(chosen.some((i) => i.title.includes('ラクマ')));

    assert.ok(result.terms.length > 0, '用語が選ばれていない');
  });

  test('テンプレート経路で台本まで組み上がる', async () => {
    const episode = await generateEpisode({
      sourceIds,
      durationMin: 10,
      useClaude: false
    });

    assert.equal(episode.generator, 'template');
    assert.ok(episode.title.length > 0);

    const kinds = episode.segments.map((s) => s.kind);
    assert.ok(kinds.includes('opening'));
    assert.ok(kinds.includes('deepDive'));
    assert.ok(kinds.includes('closing'));

    for (const segment of episode.segments) {
      assert.ok(segment.body.trim().length > 0, `${segment.kind} が空`);
      assert.ok(!segment.body.includes('undefined'), `${segment.kind} に undefined が混じっている`);
      assert.ok(!/<[a-z]+>/i.test(segment.body), `${segment.kind} に HTML が残っている`);
    }

    // 英語記事の原文要約は読み上げに混ぜない
    const deepDives = episode.segments.filter((s) => s.kind === 'deepDive');
    for (const segment of deepDives) {
      assert.ok(
        !segment.body.includes('The company says the API'),
        '英語の原文がそのまま台本に入っている'
      );
    }

    assert.ok(episode.estimatedMinutes > 0);
    assert.ok(episode.items.deepDive.every((r) => r.url && r.title));
  });

  test('情報源が全滅しても番組は作られる', async () => {
    const episode = await generateEpisode({
      sourceIds: ['publickey'],
      durationMin: 5,
      useClaude: false
    });
    assert.ok(episode.fallbackReason, '理由が伝えられていない');
    assert.ok(episode.segments.length >= 2, '空の番組が返っている');
    assert.ok(episode.terms.length > 0, '記事ゼロでも用語は届けたい');
  });
});

// --- フィードURLの自己修復 -------------------------------------------------
// 「カタログの URL が死んでいて何も表示されない」を、アプリ側で吸収できるかを見る。

describe('フィードURLの自己修復', () => {
  let server;
  let base;

  before(async () => {
    server = createServer((req, res) => {
      // 生きているフィード
      if (req.url === '/alive.xml' || req.url === '/moved/feed.xml' || req.url === '/manual.xml') {
        res.writeHead(200, { 'Content-Type': 'application/rss+xml; charset=utf-8' });
        res.end(RSS_JA);
        return;
      }
      // トップページ。移転先を <link> で告知している
      if (req.url === '/home') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          '<html><head><link rel="alternate" type="application/rss+xml" href="/moved/feed.xml"></head><body>移転しました</body></html>'
        );
        return;
      }
      // 告知のないトップページ
      if (req.url === '/silent-home') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<html><head></head><body>何も書いていない</body></html>');
        return;
      }
      // 200 は返すがフィードではない、という一番たちの悪いパターン
      if (req.url === '/not-a-feed.xml') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(BROKEN);
        return;
      }
      res.writeHead(404);
      res.end('gone');
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('主URLが死んでいたら代替URLに乗り換える', async () => {
    const r = await fetchSource({
      id: 'x',
      name: 'テスト',
      url: `${base}/dead.xml`,
      altUrls: [`${base}/alive.xml`],
      homepage: `${base}/home`,
      weight: 1,
      tags: []
    });
    assert.equal(r.ok, true);
    assert.equal(r.resolvedUrl, `${base}/alive.xml`);
    assert.equal(r.movedFrom, `${base}/dead.xml`, '移転元が記録されていない');
    assert.equal(r.discovered, false);
    assert.ok(r.items.length > 0);
  });

  test('200を返すがフィードでないURLは失敗として扱う', async () => {
    const r = await fetchSource({
      id: 'x',
      name: 'テスト',
      url: `${base}/not-a-feed.xml`,
      altUrls: [],
      homepage: `${base}/silent-home`,
      weight: 1,
      tags: []
    });
    assert.equal(r.ok, false);
    assert.ok(
      r.tried.some((t) => /0 件/.test(t.error)),
      'フィードとして解釈できない旨が残っていない'
    );
  });

  test('候補が全滅したらトップページから移転先を見つける', async () => {
    const r = await fetchSource({
      id: 'x',
      name: 'テスト',
      url: `${base}/dead.xml`,
      altUrls: [`${base}/also-dead.xml`],
      homepage: `${base}/home`,
      weight: 1,
      tags: []
    });
    assert.equal(r.ok, true, '自動検出で復帰できていない');
    assert.equal(r.discovered, true);
    assert.equal(r.resolvedUrl, `${base}/moved/feed.xml`);
    assert.ok(r.items.length > 0);
  });

  test('手で直したURLが最優先される', async () => {
    const r = await fetchSource(
      {
        id: 'x',
        name: 'テスト',
        url: `${base}/alive.xml`,
        altUrls: [],
        homepage: `${base}/home`,
        weight: 1,
        tags: []
      },
      { overrideUrl: `${base}/manual.xml` }
    );
    assert.equal(r.ok, true);
    assert.equal(r.resolvedUrl, `${base}/manual.xml`);
  });

  test('本当に全部だめなら、試したURLを理由つきで返す', async () => {
    const r = await fetchSource({
      id: 'x',
      name: 'テスト',
      url: `${base}/dead.xml`,
      altUrls: [`${base}/also-dead.xml`],
      homepage: `${base}/silent-home`,
      weight: 1,
      tags: []
    });
    assert.equal(r.ok, false);
    assert.ok(r.tried.length >= 2, '試行の記録が残っていない');
    assert.ok(r.error, '理由が空');
  });

  test('HTMLからフィードの場所を読む', () => {
    const urls = discoverFeedUrls(
      '<link rel="alternate" type="application/rss+xml" href="/feed/index.xml">',
      'https://example.test/news/'
    );
    assert.deepEqual(urls, ['https://example.test/feed/index.xml']);
  });

  test('告知がないサイトには定番の置き場所を当たる', () => {
    const urls = discoverFeedUrls('<html><head></head></html>', 'https://example.test/');
    assert.ok(urls.includes('https://example.test/feed'));
    assert.ok(urls.includes('https://example.test/index.rdf'));
  });
});

// --- 台本の体裁 ------------------------------------------------------------

describe('台本の体裁', () => {
  test('読み上げに邪魔な記号を混ぜない', () => {
    const item = {
      title: 'テスト記事',
      link: 'https://x.test/1',
      summary: '要約です。',
      publishedAt: new Date().toISOString(),
      sourceName: '媒体',
      sourceId: 's',
      lang: 'ja',
      tags: [{ tagId: 'saas', strength: 2 }],
      corroboration: 0,
      alsoReportedBy: []
    };
    const episode = buildTemplateEpisode({
      date: new Date(),
      durationMin: 5,
      deepDive: [item],
      roundup: [],
      terms: []
    });
    const text = episode.segments.map((s) => s.body).join('');
    assert.ok(!text.includes('http'), 'URL が読み上げ原稿に入っている');
    assert.ok(!text.includes('*'), '記号が混ざっている');
    assert.ok(!text.includes('undefined'));
  });

  test('用語名のスラッシュを読み上げ用に直す', () => {
    const term = GLOSSARY.find((g) => g.term.includes('/'));
    assert.ok(term, 'スラッシュを含む用語が辞書にない（テストの前提が崩れている）');

    const episode = buildTemplateEpisode({
      date: new Date(),
      durationMin: 5,
      deepDive: [],
      roundup: [],
      terms: [term]
    });
    const glossary = episode.segments.find((s) => s.kind === 'glossary');
    assert.ok(glossary, '用語コーナーが作られていない');
    assert.ok(!glossary.body.includes('/'), '読み上げ原稿にスラッシュが残っている');
    assert.ok(glossary.body.includes(term.reading), '読み方が入っていない');
  });
});
