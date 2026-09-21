// デモモード用のデータ（自動生成。編集しないこと）
// ---------------------------------------------------------------------------
// API に届かない場所でアプリを開いたときに、画面の中身を見せるためのサンプル。
// ニュースはすべて説明用の例で、実在の記事ではない。リンクは example.com を指す。
// 生成元: scripts/build-demo-data.mjs

export const DEMO_DATA = {
  "catalog": {
    "sources": [
      {
        "id": "itmedia-ai",
        "name": "ITmedia AI+",
        "url": "https://rss.itmedia.co.jp/rss/2.0/aiplus.xml",
        "altUrls": [
          "https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml"
        ],
        "homepage": "https://www.itmedia.co.jp/aiplus/",
        "lang": "ja",
        "tier": "core",
        "weight": 1.3,
        "tags": [
          "ai",
          "japan"
        ],
        "note": "AI領域の国内報道。日本語で最初に押さえるならここ。"
      },
      {
        "id": "openai-news",
        "name": "OpenAI News",
        "url": "https://openai.com/news/rss.xml",
        "altUrls": [
          "https://openai.com/blog/rss.xml"
        ],
        "homepage": "https://openai.com/news/",
        "lang": "en",
        "tier": "core",
        "weight": 1.4,
        "tags": [
          "ai",
          "product"
        ],
        "note": "一次情報。業界の話題はここ発のものが多い。"
      },
      {
        "id": "google-ai-blog",
        "name": "Google AI ブログ",
        "url": "https://blog.google/technology/ai/rss/",
        "altUrls": [
          "https://blog.google/rss/"
        ],
        "homepage": "https://blog.google/technology/ai/",
        "lang": "en",
        "tier": "core",
        "weight": 1.2,
        "tags": [
          "ai",
          "bigtech",
          "product"
        ],
        "note": "Google のAI発表。一次情報。"
      },
      {
        "id": "anthropic-news",
        "name": "Anthropic News",
        "url": "https://www.anthropic.com/news/rss.xml",
        "altUrls": [
          "https://www.anthropic.com/rss.xml"
        ],
        "homepage": "https://www.anthropic.com/news",
        "lang": "en",
        "tier": "extra",
        "weight": 1.2,
        "tags": [
          "ai",
          "product"
        ],
        "note": "Claude の提供元。フィードが無い時期もあるので自動検出に任せている。"
      },
      {
        "id": "venturebeat-ai",
        "name": "VentureBeat AI",
        "url": "https://venturebeat.com/category/ai/feed/",
        "altUrls": [
          "https://venturebeat.com/feed/"
        ],
        "homepage": "https://venturebeat.com/category/ai/",
        "lang": "en",
        "tier": "core",
        "weight": 1.1,
        "tags": [
          "ai",
          "business",
          "enterprise"
        ],
        "note": "AIの企業導入とビジネス面。SaaS文脈の話題が多い。"
      },
      {
        "id": "mit-tech-review-ai",
        "name": "MIT Technology Review（AI）",
        "url": "https://www.technologyreview.com/topic/artificial-intelligence/feed/",
        "altUrls": [
          "https://www.technologyreview.com/feed/"
        ],
        "homepage": "https://www.technologyreview.com/topic/artificial-intelligence/",
        "lang": "en",
        "tier": "extra",
        "weight": 1.2,
        "tags": [
          "ai",
          "business"
        ],
        "note": "速報より、意味を考える記事。週末にまとめて聞くのに向く。"
      },
      {
        "id": "huggingface-blog",
        "name": "Hugging Face ブログ",
        "url": "https://huggingface.co/blog/feed.xml",
        "altUrls": [],
        "homepage": "https://huggingface.co/blog",
        "lang": "en",
        "tier": "extra",
        "weight": 1,
        "tags": [
          "ai",
          "devtool",
          "community"
        ],
        "note": "オープンなAIモデルの動向。技術寄り。"
      },
      {
        "id": "itmedia-news",
        "name": "ITmedia NEWS",
        "url": "https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml",
        "altUrls": [
          "https://rss.itmedia.co.jp/rss/2.0/topstory.xml"
        ],
        "homepage": "https://www.itmedia.co.jp/news/",
        "lang": "ja",
        "tier": "core",
        "weight": 1,
        "tags": [
          "bigtech",
          "product",
          "japan"
        ],
        "note": "国内IT全般の速報。量が多いので一次スクリーニング向き。"
      },
      {
        "id": "publickey",
        "name": "Publickey",
        "url": "https://www.publickey1.jp/atom.xml",
        "altUrls": [
          "https://www.publickey1.jp/index.rdf",
          "https://www.publickey1.jp/rss.xml"
        ],
        "homepage": "https://www.publickey1.jp/",
        "lang": "ja",
        "tier": "core",
        "weight": 1.3,
        "tags": [
          "devtool",
          "cloud",
          "saas"
        ],
        "note": "一次情報に忠実で解説が厚い。技術の意味を掴むのに最適。"
      },
      {
        "id": "cnet-japan",
        "name": "CNET Japan",
        "url": "https://feeds.japan.cnet.com/rss/cnet/all.rdf",
        "altUrls": [
          "https://japan.cnet.com/rss/index.rdf"
        ],
        "homepage": "https://japan.cnet.com/",
        "lang": "ja",
        "tier": "core",
        "weight": 1,
        "tags": [
          "business",
          "startup",
          "japan"
        ],
        "note": "ビジネス寄りのIT報道。"
      },
      {
        "id": "itmedia-enterprise",
        "name": "ITmedia エンタープライズ",
        "url": "https://rss.itmedia.co.jp/rss/2.0/enterprise.xml",
        "altUrls": [],
        "homepage": "https://www.itmedia.co.jp/enterprise/",
        "lang": "ja",
        "tier": "extra",
        "weight": 1,
        "tags": [
          "saas",
          "enterprise",
          "security",
          "japan"
        ],
        "note": "企業システム・情シス視点。SaaS導入事例が拾える。"
      },
      {
        "id": "zdnet-japan",
        "name": "ZDNET Japan",
        "url": "https://feeds.japan.zdnet.com/rss/zdnet/all.rdf",
        "altUrls": [
          "https://japan.zdnet.com/rss/index.rdf"
        ],
        "homepage": "https://japan.zdnet.com/",
        "lang": "ja",
        "tier": "extra",
        "weight": 1,
        "tags": [
          "enterprise",
          "saas",
          "security"
        ],
        "note": "エンタープライズIT・調査データが多い。"
      },
      {
        "id": "cloud-watch",
        "name": "クラウド Watch",
        "url": "https://cloud.watch.impress.co.jp/data/rss/1.0/clw/feed.rdf",
        "altUrls": [
          "https://cloud.watch.impress.co.jp/rss/"
        ],
        "homepage": "https://cloud.watch.impress.co.jp/",
        "lang": "ja",
        "tier": "extra",
        "weight": 1,
        "tags": [
          "cloud",
          "saas",
          "enterprise"
        ],
        "note": "クラウド／SaaSの製品発表を丁寧に拾う。"
      },
      {
        "id": "internet-watch",
        "name": "INTERNET Watch",
        "url": "https://internet.watch.impress.co.jp/data/rss/1.0/iw/feed.rdf",
        "altUrls": [],
        "homepage": "https://internet.watch.impress.co.jp/",
        "lang": "ja",
        "tier": "extra",
        "weight": 0.9,
        "tags": [
          "internet",
          "japan"
        ],
        "note": "ネットサービス全般。"
      },
      {
        "id": "nikkei-xtech-it",
        "name": "日経クロステック IT",
        "url": "https://xtech.nikkei.com/rss/xtech-it.rdf",
        "altUrls": [
          "https://xtech.nikkei.com/rss/index.rdf"
        ],
        "homepage": "https://xtech.nikkei.com/",
        "lang": "ja",
        "tier": "extra",
        "weight": 1.1,
        "tags": [
          "enterprise",
          "business",
          "japan"
        ],
        "note": "有料記事が混ざるが、見出しだけでも業界の空気が読める。"
      },
      {
        "id": "thebridge",
        "name": "THE BRIDGE",
        "url": "https://thebridge.jp/feed",
        "altUrls": [
          "https://thebridge.jp/rss"
        ],
        "homepage": "https://thebridge.jp/",
        "lang": "ja",
        "tier": "core",
        "weight": 1.1,
        "tags": [
          "startup",
          "funding",
          "japan"
        ],
        "note": "国内スタートアップの資金調達・事業動向。転職先探しの一次情報。"
      },
      {
        "id": "gigazine",
        "name": "GIGAZINE",
        "url": "https://gigazine.net/news/rss_2.0/",
        "altUrls": [],
        "homepage": "https://gigazine.net/",
        "lang": "ja",
        "tier": "extra",
        "weight": 0.7,
        "tags": [
          "internet",
          "product"
        ],
        "note": "話題性は高いが業界ニュース密度は低め。"
      },
      {
        "id": "hatena-it",
        "name": "はてなブックマーク テクノロジー",
        "url": "https://b.hatena.ne.jp/hotentry/it.rss",
        "altUrls": [
          "https://b.hatena.ne.jp/hotentry/it/rss"
        ],
        "homepage": "https://b.hatena.ne.jp/hotentry/it",
        "lang": "ja",
        "tier": "core",
        "weight": 1.2,
        "tags": [
          "community",
          "devtool",
          "japan"
        ],
        "note": "「国内のエンジニアが今日何を読んだか」が分かる。空気感の把握に効く。"
      },
      {
        "id": "zenn",
        "name": "Zenn トレンド",
        "url": "https://zenn.dev/feed",
        "altUrls": [],
        "homepage": "https://zenn.dev/",
        "lang": "ja",
        "tier": "extra",
        "weight": 0.9,
        "tags": [
          "devtool",
          "community",
          "japan"
        ],
        "note": "実務者の技術記事。用語の生きた使われ方が分かる。"
      },
      {
        "id": "qiita",
        "name": "Qiita 人気記事",
        "url": "https://qiita.com/popular-items/feed",
        "altUrls": [
          "https://qiita.com/popular-items/feed.atom"
        ],
        "homepage": "https://qiita.com/",
        "lang": "ja",
        "tier": "extra",
        "weight": 0.8,
        "tags": [
          "devtool",
          "community",
          "japan"
        ],
        "note": "同上。初学者向けの解説が多い。"
      },
      {
        "id": "techcrunch",
        "name": "TechCrunch",
        "url": "https://techcrunch.com/feed/",
        "altUrls": [
          "https://techcrunch.com/rss/"
        ],
        "homepage": "https://techcrunch.com/",
        "lang": "en",
        "tier": "core",
        "weight": 1.2,
        "tags": [
          "startup",
          "funding",
          "saas",
          "ai"
        ],
        "note": "資金調達とプロダクトローンチの本丸。日本語圏に来る前に読める。"
      },
      {
        "id": "hackernews",
        "name": "Hacker News フロントページ",
        "url": "https://hnrss.org/frontpage",
        "altUrls": [
          "https://news.ycombinator.com/rss"
        ],
        "homepage": "https://news.ycombinator.com/",
        "lang": "en",
        "tier": "core",
        "weight": 1.1,
        "tags": [
          "community",
          "devtool",
          "startup"
        ],
        "note": "世界のエンジニアの関心ランキング。一次情報への最短経路。"
      },
      {
        "id": "theverge",
        "name": "The Verge",
        "url": "https://www.theverge.com/rss/index.xml",
        "altUrls": [
          "https://www.theverge.com/rss/full.xml"
        ],
        "homepage": "https://www.theverge.com/",
        "lang": "en",
        "tier": "extra",
        "weight": 1,
        "tags": [
          "bigtech",
          "product",
          "internet"
        ],
        "note": "大手テック企業の動きとカルチャー。"
      },
      {
        "id": "arstechnica",
        "name": "Ars Technica",
        "url": "https://feeds.arstechnica.com/arstechnica/index",
        "altUrls": [
          "https://arstechnica.com/feed/"
        ],
        "homepage": "https://arstechnica.com/",
        "lang": "en",
        "tier": "extra",
        "weight": 1,
        "tags": [
          "bigtech",
          "security",
          "devtool"
        ],
        "note": "技術的に踏み込んだ解説。"
      },
      {
        "id": "saastr",
        "name": "SaaStr",
        "url": "https://www.saastr.com/feed/",
        "altUrls": [],
        "homepage": "https://www.saastr.com/",
        "lang": "en",
        "tier": "core",
        "weight": 1.3,
        "tags": [
          "saas",
          "business",
          "metrics"
        ],
        "note": "SaaSの経営指標（ARR・チャーン・CAC）を語彙ごと身につけられる。"
      },
      {
        "id": "a16z",
        "name": "Andreessen Horowitz",
        "url": "https://a16z.com/feed/",
        "altUrls": [],
        "homepage": "https://a16z.com/",
        "lang": "en",
        "tier": "extra",
        "weight": 1.1,
        "tags": [
          "saas",
          "startup",
          "ai",
          "business"
        ],
        "note": "投資家視点の構造分析。「なぜこの市場が伸びるか」の型が手に入る。"
      },
      {
        "id": "stratechery",
        "name": "Stratechery",
        "url": "https://stratechery.com/feed/",
        "altUrls": [],
        "homepage": "https://stratechery.com/",
        "lang": "en",
        "tier": "extra",
        "weight": 1.2,
        "tags": [
          "business",
          "bigtech",
          "saas"
        ],
        "note": "戦略の構造分析。無料記事は一部だが、見出しだけでも論点が拾える。"
      }
    ],
    "tags": [
      {
        "id": "saas",
        "label": "SaaS・業務ソフト",
        "defaultWeight": 1.6
      },
      {
        "id": "ai",
        "label": "AI・機械学習",
        "defaultWeight": 1.4
      },
      {
        "id": "startup",
        "label": "スタートアップ",
        "defaultWeight": 1.3
      },
      {
        "id": "funding",
        "label": "資金調達・M&A",
        "defaultWeight": 1.3
      },
      {
        "id": "business",
        "label": "ビジネスモデル・戦略",
        "defaultWeight": 1.2
      },
      {
        "id": "metrics",
        "label": "経営指標・KPI",
        "defaultWeight": 1.2
      },
      {
        "id": "product",
        "label": "プロダクト・新機能",
        "defaultWeight": 1
      },
      {
        "id": "devtool",
        "label": "開発者ツール・技術",
        "defaultWeight": 0.9
      },
      {
        "id": "cloud",
        "label": "クラウド基盤",
        "defaultWeight": 1
      },
      {
        "id": "security",
        "label": "セキュリティ",
        "defaultWeight": 0.8
      },
      {
        "id": "bigtech",
        "label": "大手テック企業",
        "defaultWeight": 1
      },
      {
        "id": "enterprise",
        "label": "エンタープライズIT・DX",
        "defaultWeight": 1.1
      },
      {
        "id": "career",
        "label": "働き方・採用・組織",
        "defaultWeight": 1.4
      },
      {
        "id": "internet",
        "label": "ネットサービス全般",
        "defaultWeight": 0.7
      },
      {
        "id": "community",
        "label": "コミュニティ話題",
        "defaultWeight": 0.8
      },
      {
        "id": "japan",
        "label": "国内動向",
        "defaultWeight": 1.1
      }
    ],
    "presets": [
      {
        "id": "ai",
        "name": "AI中心",
        "description": "AIの一次情報を主軸にする。モデルの発表、企業導入、業界の再編まで。AI関連の転職を狙うならこれ。",
        "sourceIds": [
          "itmedia-ai",
          "openai-news",
          "google-ai-blog",
          "anthropic-news",
          "venturebeat-ai",
          "techcrunch",
          "hackernews",
          "hatena-it"
        ],
        "weights": {
          "ai": 3,
          "product": 1.4,
          "startup": 1.2,
          "funding": 1.2,
          "business": 1.2,
          "devtool": 1.1,
          "bigtech": 1.2,
          "saas": 1,
          "enterprise": 0.9,
          "metrics": 0.8,
          "career": 1,
          "cloud": 0.8,
          "security": 0.5,
          "internet": 0.5,
          "community": 0.8,
          "japan": 1
        }
      },
      {
        "id": "saas",
        "name": "SaaS・事業中心",
        "description": "SaaSのビジネス面を主軸にする。経営指標、資金調達、売り方。事業側の職種を狙うならこれ。",
        "sourceIds": [
          "saastr",
          "thebridge",
          "cnet-japan",
          "itmedia-enterprise",
          "techcrunch",
          "a16z",
          "publickey",
          "hatena-it"
        ],
        "weights": {
          "saas": 3,
          "metrics": 2,
          "business": 1.8,
          "funding": 1.6,
          "startup": 1.4,
          "enterprise": 1.3,
          "career": 1.3,
          "japan": 1.2,
          "product": 1,
          "ai": 1,
          "bigtech": 0.8,
          "devtool": 0.6,
          "cloud": 0.7,
          "security": 0.5,
          "internet": 0.5,
          "community": 0.7
        }
      },
      {
        "id": "balanced",
        "name": "バランス",
        "description": "業界全体を広く。まずはここから始めて、偏らせたくなったら切り替える。",
        "sourceIds": [
          "itmedia-ai",
          "openai-news",
          "google-ai-blog",
          "venturebeat-ai",
          "itmedia-news",
          "publickey",
          "cnet-japan",
          "thebridge",
          "hatena-it",
          "techcrunch",
          "hackernews",
          "saastr"
        ],
        "weights": null
      }
    ],
    "glossarySize": 42,
    "claudeConfigured": false,
    "podcast": {
      "ttsProvider": null,
      "feedUrl": "（自分のPCで起動すると表示されます）",
      "episodesWithAudio": 0
    }
  },
  "episode": {
    "id": "demo",
    "createdAt": "2026-09-21T07:28:25.068Z",
    "dateLabel": "9月21日（月）",
    "durationMin": 10,
    "estimatedMinutes": 4.3,
    "generator": "template",
    "title": "【デモ】TechCast サンプル番組",
    "segments": [
      {
        "id": "opening-0",
        "kind": "opening",
        "heading": "オープニング",
        "body": "これは TechCast のデモ番組です。ここで読み上げているニュースはすべて説明用の例で、実際の記事ではありません。本物のニュースを聞くには、自分のパソコンでアプリを起動する必要があります。それでは、実際の番組がどんな形で届くのかを聞いてみてください。今日の見出しは3本です。1つ目、【サンプル】大手AI企業が企業向けエージェント基盤を発表。2つ目、【サンプル】国内SaaS企業がシリーズDで100億円を調達。3つ目、【サンプル】日本語に強いオープンソースモデルが公開。それでは順番に見ていきます。",
        "refs": []
      },
      {
        "id": "deepDive-1",
        "kind": "deepDive",
        "heading": "【サンプル】大手AI企業が企業向けエージェント基盤を発表",
        "body": "1本目。サンプル媒体Aから、【サンプル】大手AI企業が企業向けエージェント基盤を発表。これはデモ用の例です。実在の記事ではありません。社内の業務フローに沿って複数の作業を自動で進めるAIエージェントの基盤が発表された、という想定の記事です。AI関連は発表の数が多いぶん、「実験段階なのか、もう業務で使われているのか」を見分けるのが大事です。",
        "refs": [
          {
            "title": "【サンプル】大手AI企業が企業向けエージェント基盤を発表",
            "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E5%A4%A7%E6%89%8BAI%E4%BC%81%E6%A5%AD",
            "sourceName": "サンプル媒体A",
            "publishedAt": "2026-09-21T04:28:25.067Z",
            "alsoReportedBy": []
          }
        ]
      },
      {
        "id": "deepDive-2",
        "kind": "deepDive",
        "heading": "【サンプル】国内SaaS企業がシリーズDで100億円を調達",
        "body": "2本目。サンプル媒体Bから、【サンプル】国内SaaS企業がシリーズDで100億円を調達。これはデモ用の例です。実在の記事ではありません。人事労務SaaSが大型調達を実施し、海外展開と採用に充てる、という想定の記事です。調達額そのものより、何に使うと言っているかを聞くと、その会社がいま何に困っているかが分かります。",
        "refs": [
          {
            "title": "【サンプル】国内SaaS企業がシリーズDで100億円を調達",
            "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E5%9B%BD%E5%86%85SaaS",
            "sourceName": "サンプル媒体B",
            "publishedAt": "2026-09-21T01:28:25.067Z",
            "alsoReportedBy": []
          }
        ]
      },
      {
        "id": "deepDive-3",
        "kind": "deepDive",
        "heading": "【サンプル】日本語に強いオープンソースモデルが公開",
        "body": "3本目。サンプル媒体Cから、【サンプル】日本語に強いオープンソースモデルが公開。これはデモ用の例です。実在の記事ではありません。商用利用可能なライセンスで日本語特化のモデルが公開された、という想定の記事です。AI関連は発表の数が多いぶん、「実験段階なのか、もう業務で使われているのか」を見分けるのが大事です。",
        "refs": [
          {
            "title": "【サンプル】日本語に強いオープンソースモデルが公開",
            "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%AB%E5%BC%B7%E3%81%84",
            "sourceName": "サンプル媒体C",
            "publishedAt": "2026-09-20T22:28:25.067Z",
            "alsoReportedBy": []
          }
        ]
      },
      {
        "id": "glossary-4",
        "kind": "glossary",
        "heading": "今日の用語",
        "body": "続いて、今日の用語です。AIエージェント、読み方はエーアイエージェント。質問に答えるだけでなく、自分で手順を考えて道具を使い、作業を最後までやり切るAIです。調べる、書く、送るまでを任せる方向に進んでいます。2025年以降のSaaSの主戦場。「人が使う道具」から「人の代わりに働く同僚」への移行と捉えると流れが掴めます。最後に、ARR、読み方はエーアールアール。年間経常収益。サブスクリプション契約から1年間に繰り返し入ってくる売上のことです。単発の受注ではなく「毎年続く売上」だけを数えるので、SaaS企業の規模はほぼこの数字で語られます。「御社は今ARRどのくらいのフェーズですか」と聞けるだけで、事業の段階を理解しようとしている人だと伝わります。一度で覚えなくて大丈夫です。何度か出てくるうちに馴染んできます。",
        "refs": []
      },
      {
        "id": "career-5",
        "kind": "career",
        "heading": "転職メモ",
        "body": "ここで転職メモを一つ。職務経歴書は、前職の業務をそのまま書くより「どの課題を、どう測って、どう改善したか」に翻訳すると、業界が違っても伝わります。",
        "refs": []
      },
      {
        "id": "roundup-6",
        "kind": "roundup",
        "heading": "早耳ラウンドアップ",
        "body": "最後に、その他の気になったニュースを短く並べます。サンプル媒体Aから、【サンプル】クラウド大手が東京リージョンに新サービス。サンプル媒体Bから、【サンプル】業務チャットツールがAI要約機能を追加。サンプル媒体Cから、【サンプル】開発者調査、AI支援ツールの利用率が上昇。サンプル媒体Aから、【サンプル】セキュリティ認証の取得がSaaS選定の条件に。サンプル媒体Bから、【サンプル】IT人材の採用、未経験枠が前年より増加。サンプル媒体Cから、【サンプル】大手テック企業が組織再編を発表。以上です。",
        "refs": [
          {
            "title": "【サンプル】クラウド大手が東京リージョンに新サービス",
            "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E3%82%AF%E3%83%A9%E3%82%A6%E3%83%89%E5%A4%A7%E6%89%8B",
            "sourceName": "サンプル媒体A",
            "publishedAt": "2026-09-21T02:28:25.067Z",
            "alsoReportedBy": []
          },
          {
            "title": "【サンプル】業務チャットツールがAI要約機能を追加",
            "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E6%A5%AD%E5%8B%99%E3%83%81%E3%83%A3%E3%83%83%E3%83%88",
            "sourceName": "サンプル媒体B",
            "publishedAt": "2026-09-21T00:28:25.067Z",
            "alsoReportedBy": []
          },
          {
            "title": "【サンプル】開発者調査、AI支援ツールの利用率が上昇",
            "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E9%96%8B%E7%99%BA%E8%80%85%E8%AA%BF%E6%9F%BB%E3%80%81",
            "sourceName": "サンプル媒体C",
            "publishedAt": "2026-09-20T20:28:25.067Z",
            "alsoReportedBy": []
          },
          {
            "title": "【サンプル】セキュリティ認証の取得がSaaS選定の条件に",
            "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E3%82%BB%E3%82%AD%E3%83%A5%E3%83%AA%E3%83%86%E3%82%A3",
            "sourceName": "サンプル媒体A",
            "publishedAt": "2026-09-20T18:28:25.067Z",
            "alsoReportedBy": []
          },
          {
            "title": "【サンプル】IT人材の採用、未経験枠が前年より増加",
            "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91IT%E4%BA%BA%E6%9D%90%E3%81%AE%E6%8E%A1",
            "sourceName": "サンプル媒体B",
            "publishedAt": "2026-09-20T16:28:25.067Z",
            "alsoReportedBy": []
          },
          {
            "title": "【サンプル】大手テック企業が組織再編を発表",
            "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E5%A4%A7%E6%89%8B%E3%83%86%E3%83%83%E3%82%AF%E4%BC%81",
            "sourceName": "サンプル媒体C",
            "publishedAt": "2026-09-20T14:28:25.067Z",
            "alsoReportedBy": []
          }
        ]
      },
      {
        "id": "closing-7",
        "kind": "closing",
        "heading": "クロージング",
        "body": "今日は以上です。全部覚えようとしなくて大丈夫です。一つでも引っかかった話があれば、あとで記事を開いてみてください。それではまた明日。",
        "refs": []
      }
    ],
    "items": {
      "deepDive": [
        {
          "title": "【サンプル】大手AI企業が企業向けエージェント基盤を発表",
          "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E5%A4%A7%E6%89%8BAI%E4%BC%81%E6%A5%AD",
          "sourceName": "サンプル媒体A",
          "publishedAt": "2026-09-21T04:28:25.067Z",
          "alsoReportedBy": []
        },
        {
          "title": "【サンプル】国内SaaS企業がシリーズDで100億円を調達",
          "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E5%9B%BD%E5%86%85SaaS",
          "sourceName": "サンプル媒体B",
          "publishedAt": "2026-09-21T01:28:25.067Z",
          "alsoReportedBy": []
        },
        {
          "title": "【サンプル】日本語に強いオープンソースモデルが公開",
          "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E6%97%A5%E6%9C%AC%E8%AA%9E%E3%81%AB%E5%BC%B7%E3%81%84",
          "sourceName": "サンプル媒体C",
          "publishedAt": "2026-09-20T22:28:25.067Z",
          "alsoReportedBy": []
        }
      ],
      "roundup": [
        {
          "title": "【サンプル】クラウド大手が東京リージョンに新サービス",
          "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E3%82%AF%E3%83%A9%E3%82%A6%E3%83%89%E5%A4%A7%E6%89%8B",
          "sourceName": "サンプル媒体A",
          "publishedAt": "2026-09-21T02:28:25.067Z",
          "alsoReportedBy": []
        },
        {
          "title": "【サンプル】業務チャットツールがAI要約機能を追加",
          "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E6%A5%AD%E5%8B%99%E3%83%81%E3%83%A3%E3%83%83%E3%83%88",
          "sourceName": "サンプル媒体B",
          "publishedAt": "2026-09-21T00:28:25.067Z",
          "alsoReportedBy": []
        },
        {
          "title": "【サンプル】開発者調査、AI支援ツールの利用率が上昇",
          "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E9%96%8B%E7%99%BA%E8%80%85%E8%AA%BF%E6%9F%BB%E3%80%81",
          "sourceName": "サンプル媒体C",
          "publishedAt": "2026-09-20T20:28:25.067Z",
          "alsoReportedBy": []
        },
        {
          "title": "【サンプル】セキュリティ認証の取得がSaaS選定の条件に",
          "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E3%82%BB%E3%82%AD%E3%83%A5%E3%83%AA%E3%83%86%E3%82%A3",
          "sourceName": "サンプル媒体A",
          "publishedAt": "2026-09-20T18:28:25.067Z",
          "alsoReportedBy": []
        },
        {
          "title": "【サンプル】IT人材の採用、未経験枠が前年より増加",
          "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91IT%E4%BA%BA%E6%9D%90%E3%81%AE%E6%8E%A1",
          "sourceName": "サンプル媒体B",
          "publishedAt": "2026-09-20T16:28:25.067Z",
          "alsoReportedBy": []
        },
        {
          "title": "【サンプル】大手テック企業が組織再編を発表",
          "url": "https://example.com/sample/%E3%80%90%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB%E3%80%91%E5%A4%A7%E6%89%8B%E3%83%86%E3%83%83%E3%82%AF%E4%BC%81",
          "sourceName": "サンプル媒体C",
          "publishedAt": "2026-09-20T14:28:25.067Z",
          "alsoReportedBy": []
        }
      ]
    },
    "terms": [
      {
        "id": "ai-agent",
        "term": "AIエージェント",
        "reading": "エーアイエージェント",
        "category": "AI",
        "level": 2,
        "definition": "質問に答えるだけでなく、自分で手順を考えて道具を使い、作業を最後までやり切るAIです。調べる、書く、送るまでを任せる方向に進んでいます。",
        "interview": "2025年以降のSaaSの主戦場。「人が使う道具」から「人の代わりに働く同僚」への移行と捉えると流れが掴めます。"
      },
      {
        "id": "arr",
        "term": "ARR",
        "reading": "エーアールアール",
        "category": "SaaS指標",
        "level": 1,
        "definition": "年間経常収益。サブスクリプション契約から1年間に繰り返し入ってくる売上のことです。単発の受注ではなく「毎年続く売上」だけを数えるので、SaaS企業の規模はほぼこの数字で語られます。",
        "interview": "「御社は今ARRどのくらいのフェーズですか」と聞けるだけで、事業の段階を理解しようとしている人だと伝わります。"
      }
    ],
    "health": [],
    "stats": {}
  }
};
