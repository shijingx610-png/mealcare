// テスト用のフィード。実在の媒体を模した最小構成。
// 発行時刻は「実行時刻からの相対」で埋めるので、鮮度スコアのテストが時間で壊れない。

function iso(hoursAgo) {
  return new Date(Date.now() - hoursAgo * 3600_000).toUTCString();
}

export const RSS_JA = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>テスト媒体A</title>
  <item>
    <title><![CDATA[SmartHRがシリーズEで150億円を調達]]></title>
    <link>https://example-a.test/news/1?utm_source=rss</link>
    <description>&lt;p&gt;人事労務SaaSのSmartHRは、シリーズEラウンドで150億円の資金調達を実施したと発表した。&lt;/p&gt;</description>
    <pubDate>${iso(2)}</pubDate>
    <category>SaaS</category>
    <dc:creator>記者A</dc:creator>
  </item>
  <item>
    <title>AWSが東京リージョンに新しいマネージドサービスを追加</title>
    <link>https://example-a.test/news/2</link>
    <description>クラウド基盤の新サービスが国内で提供開始された。</description>
    <pubDate>${iso(5)}</pubDate>
  </item>
  <item>
    <title>去年の古い記事</title>
    <link>https://example-a.test/news/old</link>
    <description>鮮度の条件から外れるはずの記事。</description>
    <pubDate>${iso(24 * 200)}</pubDate>
  </item>
</channel>
</rss>`;

export const RDF_JA = `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <item rdf:about="https://example-b.test/n/1">
    <title>SmartHR、150億円の資金調達を発表</title>
    <link>https://example-b.test/n/1</link>
    <description>同社は調達資金を海外展開と採用に充てるとしている。</description>
    <dc:date>${new Date(Date.now() - 3 * 3600_000).toISOString()}</dc:date>
  </item>
  <item rdf:about="https://example-b.test/n/2">
    <title>ラクマ、2025年度の決算を発表</title>
    <link>https://example-b.test/n/2</link>
    <description>営業利益は前年から増加した。</description>
    <dc:date>${new Date(Date.now() - 7 * 3600_000).toISOString()}</dc:date>
  </item>
</rdf:RDF>`;

export const ATOM_EN = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Test Outlet C</title>
  <entry>
    <title>OpenAI launches an agent API for enterprises</title>
    <link rel="alternate" href="https://example-c.test/p/1"/>
    <summary>The company says the API lets developers build agents that use tools.</summary>
    <published>${new Date(Date.now() - 1 * 3600_000).toISOString()}</published>
  </entry>
  <entry>
    <title>Notion adds AI summaries to pages</title>
    <link rel="alternate" href="https://example-c.test/p/2"/>
    <summary>A new feature for its workspace product.</summary>
    <published>${new Date(Date.now() - 9 * 3600_000).toISOString()}</published>
  </entry>
</feed>`;

export const BROKEN = '<html><body>これはフィードではありません</body></html>';
