// 用語辞書
// ---------------------------------------------------------------------------
// このアプリが「ニュースアプリ」と違うのはここ。
// 業界未経験でニュースを聞くと、内容そのものより先に「知らない単語」で詰まる。
// 詰まった単語をその場で回収できないと、毎朝聞いても語彙が増えない。
//
// definition : 読み上げ前提。前提知識なしで1〜2文で分かるように書く。
// interview  : カジュアル面談や面接で、その語をどう使うと話が通じるか。
// level      : 1 = まず押さえる / 2 = 業界人と話すなら / 3 = 踏み込んだ話題

import { containsTerm } from './match.js';

export const GLOSSARY = [
  // ── SaaS のビジネス指標 ────────────────────────────────────────────
  {
    id: 'arr',
    term: 'ARR',
    reading: 'エーアールアール',
    aliases: ['arr', 'annual recurring revenue', '年間経常収益'],
    category: 'SaaS指標',
    level: 1,
    definition:
      '年間経常収益。サブスクリプション契約から1年間に繰り返し入ってくる売上のことです。単発の受注ではなく「毎年続く売上」だけを数えるので、SaaS企業の規模はほぼこの数字で語られます。',
    interview:
      '「御社は今ARRどのくらいのフェーズですか」と聞けるだけで、事業の段階を理解しようとしている人だと伝わります。'
  },
  {
    id: 'mrr',
    term: 'MRR',
    reading: 'エムアールアール',
    aliases: ['mrr', 'monthly recurring revenue', '月次経常収益'],
    category: 'SaaS指標',
    level: 1,
    definition:
      '月次経常収益。ARRの月単位版です。月額課金のサービスでは、こちらの増減を毎月追いかけて事業の健康状態を見ます。',
    interview:
      'ARRとMRRは12倍の関係。どちらで語るかで、その会社が年単位契約か月単位契約かが透けて見えます。'
  },
  {
    id: 'churn',
    term: 'チャーンレート',
    reading: 'チャーンレート',
    aliases: ['churn', 'チャーン', '解約率', 'churn rate'],
    category: 'SaaS指標',
    level: 1,
    definition:
      '解約率。契約してくれた顧客が一定期間でどれだけ離れたかの割合です。SaaSは水を溜めるバケツのようなもので、穴が大きいとどれだけ新規を入れても溜まりません。',
    interview:
      '「新規獲得より解約を減らすほうが効く局面もありますよね」と言えると、数字で事業を見る人という印象になります。'
  },
  {
    id: 'nrr',
    term: 'NRR',
    reading: 'エヌアールアール',
    aliases: ['nrr', 'net revenue retention', 'ネットレベニューリテンション', '売上維持率'],
    category: 'SaaS指標',
    level: 2,
    definition:
      '既存顧客だけを見たときに、売上が1年で何%になったかを示す数字です。解約で減った分と、追加購入で増えた分を差し引きします。100%を超えていれば、新規ゼロでも売上が伸びている状態です。',
    interview:
      'NRRが120%という会社は、既存顧客が勝手に育つ構造を持っています。強いSaaSを見分ける最短の指標です。'
  },
  {
    id: 'ltv',
    term: 'LTV',
    reading: 'エルティーブイ',
    aliases: ['ltv', 'life time value', 'lifetime value', '顧客生涯価値'],
    category: 'SaaS指標',
    level: 1,
    definition:
      '顧客生涯価値。1人の顧客が取引を始めてから終わるまでに、合計でいくら払ってくれるかの見込み額です。',
    interview:
      'LTVは「長く使ってもらえるか」の裏返し。プロダクトの良さを金額に翻訳した数字だと考えると腹落ちします。'
  },
  {
    id: 'cac',
    term: 'CAC',
    reading: 'シーエーシー',
    aliases: ['cac', 'customer acquisition cost', '顧客獲得コスト'],
    category: 'SaaS指標',
    level: 1,
    definition:
      '顧客獲得コスト。1人の顧客を取るのに、広告費や営業人件費を合わせていくらかかったかです。',
    interview:
      'LTVがCACの3倍以上あれば健全、というのが業界の目安。この「3倍」を知っているだけで会話が一段深くなります。'
  },
  {
    id: 'unit-economics',
    term: 'ユニットエコノミクス',
    reading: 'ユニットエコノミクス',
    aliases: ['ユニットエコノミクス', 'unit economics'],
    category: 'SaaS指標',
    level: 2,
    definition:
      '顧客1人あたりで見たときに、事業が儲かっているかどうかの採算です。会社全体が赤字でも、顧客1人あたりで黒字なら、あとは数を増やせば成立します。',
    interview:
      '赤字のスタートアップに「なぜ投資が集まるのか」を説明できる考え方です。'
  },
  {
    id: 'rule-of-40',
    term: 'Rule of 40',
    reading: 'ルールオブフォーティ',
    aliases: ['rule of 40', 'ルールオブ40', '40%ルール'],
    category: 'SaaS指標',
    level: 3,
    definition:
      '売上成長率と利益率を足して40を超えていれば健全なSaaSだ、という経験則です。成長を優先して赤字でもいいし、成長が緩んだなら利益を出せ、という考え方を1本の式にしたものです。',
    interview:
      '成長と利益のどちらを優先するかは会社のフェーズで変わる、という理解を示せます。'
  },
  {
    id: 'burn-runway',
    term: 'バーンレート / ランウェイ',
    reading: 'バーンレート、ランウェイ',
    aliases: ['バーンレート', 'burn rate', 'ランウェイ', 'runway', '資金燃焼'],
    category: 'スタートアップ',
    level: 2,
    definition:
      'バーンレートは月にいくら現金が減るか、ランウェイはその調子であと何か月もつかです。ランウェイ12か月を切ると、次の資金調達が現実的な課題になります。',
    interview:
      '転職先を選ぶときに、直近の調達時期を見てランウェイを逆算する、という視点は持っておいて損がありません。'
  },

  // ── 売り方・組織 ──────────────────────────────────────────────────
  {
    id: 'plg',
    term: 'PLG',
    reading: 'ピーエルジー',
    aliases: ['plg', 'product led growth', 'プロダクトレッドグロース'],
    category: '事業モデル',
    level: 2,
    definition:
      'プロダクト主導の成長。営業が売り込むより先に、ユーザーが自分で無料で使い始めて、よければ有料に上がっていく売り方です。SlackやNotionがこの形です。',
    interview:
      '「御社はPLG寄りですか、営業主導ですか」と聞くと、その会社で自分が何をする職種なのかが具体的に見えてきます。'
  },
  {
    id: 'slg',
    term: 'SLG / エンタープライズ営業',
    reading: 'エスエルジー',
    aliases: ['slg', 'sales led growth', 'セールスレッドグロース', 'エンタープライズ営業'],
    category: '事業モデル',
    level: 2,
    definition:
      '営業主導の成長。担当者がつき、商談と稟議を重ねて大企業に導入してもらう売り方です。単価は高く、決まるまでの期間は長くなります。',
    interview:
      'PLGとSLGは優劣ではなく、顧客の規模と意思決定のしかたで選ぶもの、と理解しておくと話が早いです。'
  },
  {
    id: 'the-model',
    term: 'THE MODEL',
    reading: 'ザ・モデル',
    aliases: ['the model', 'ザモデル', 'ザ・モデル', 'インサイドセールス', '分業型営業'],
    category: '組織',
    level: 2,
    definition:
      'マーケティング、インサイドセールス、フィールドセールス、カスタマーサクセスに営業活動を分業する型です。国内SaaSの多くがこの形を採っています。',
    interview:
      '未経験から入りやすいのはインサイドセールスとカスタマーサクセス。どの箱の話をしているか意識して聞くと、求人票の意味が変わります。'
  },
  {
    id: 'customer-success',
    term: 'カスタマーサクセス',
    reading: 'カスタマーサクセス',
    aliases: ['カスタマーサクセス', 'customer success', 'cs部門'],
    category: '組織',
    level: 1,
    definition:
      '導入後の顧客が実際に成果を出せるように伴走する職種です。問い合わせを待つサポートと違い、こちらから使い方を設計して解約を防ぎにいきます。',
    interview:
      '「使ってもらって終わりではなく、成果が出て初めて継続される」という発想は、指導や接客の経験と地続きです。'
  },
  {
    id: 'onboarding',
    term: 'オンボーディング',
    reading: 'オンボーディング',
    aliases: ['オンボーディング', 'onboarding'],
    category: '組織',
    level: 1,
    definition:
      '新しく入った顧客や社員が、自力で動けるようになるまでの立ち上げ支援のことです。SaaSではここでつまずくとそのまま解約につながります。',
    interview:
      '最初の1か月の体験設計が継続率を決める、という話はどの業界でも通じます。'
  },
  {
    id: 'mql-sql',
    term: 'MQL / SQL',
    reading: 'エムキューエル、エスキューエル',
    aliases: ['mql', 'sql（営業）', 'marketing qualified lead', 'sales qualified lead', 'リード'],
    category: '組織',
    level: 3,
    definition:
      '見込み客の温度感を表す区分です。MQLはマーケティング側が「見込みあり」と判断した段階、SQLは営業が「商談になる」と認めた段階を指します。',
    interview:
      'データベースのSQLとは全くの別物です。文脈で見分けてください。'
  },

  // ── プロダクト開発 ────────────────────────────────────────────────
  {
    id: 'pmf',
    term: 'PMF',
    reading: 'ピーエムエフ',
    aliases: ['pmf', 'product market fit', 'プロダクトマーケットフィット'],
    category: 'プロダクト',
    level: 1,
    definition:
      'プロダクトが市場に受け入れられている状態のことです。作ったものが売れ続け、放っておいてもユーザーが増え始めた瞬間を指します。',
    interview:
      'PMF前とPMF後では、会社に求められる人材が全く変わります。求人を見るときの補助線になります。'
  },
  {
    id: 'mvp',
    term: 'MVP',
    reading: 'エムブイピー',
    aliases: ['mvp', 'minimum viable product', '実用最小限'],
    category: 'プロダクト',
    level: 1,
    definition:
      '仮説を検証できる最小限のプロダクトです。全部作ってから出すのではなく、いちばん確かめたい一点だけ作って世に出します。',
    interview:
      '完璧を待たずに小さく出して学ぶ、という進め方そのものです。'
  },
  {
    id: 'pdm',
    term: 'プロダクトマネージャー（PdM）',
    reading: 'プロダクトマネージャー',
    aliases: ['プロダクトマネージャー', 'pdm', 'product manager', 'プロダクトオーナー'],
    category: '職種',
    level: 1,
    definition:
      '何を作るかを決める人です。ユーザーの課題、事業の狙い、技術的な制約の三つを突き合わせて優先順位をつけます。作る人ではなく、決める人です。',
    interview:
      'PdMとPMM（プロダクトマーケティングマネージャー）は別職種。PMMは作ったものをどう売るかを担当します。'
  },
  {
    id: 'ab-test',
    term: 'A/Bテスト',
    reading: 'エービーテスト',
    aliases: ['a/bテスト', 'abテスト', 'a/b test', 'split test'],
    category: 'プロダクト',
    level: 1,
    definition:
      '2つの案を実際のユーザーに同時に出して、数字が良かったほうを採用する検証方法です。議論で決めずにデータで決めます。',
    interview:
      '「感覚ではなく数字で決める」文化があるかどうかは、面談で必ず聞く価値があります。'
  },
  {
    id: 'okr',
    term: 'OKR',
    reading: 'オーケーアール',
    aliases: ['okr', 'objectives and key results'],
    category: '組織',
    level: 2,
    definition:
      '目標の立て方の一つです。定性的な目標を1つ立て、それが達成できたと言える数値の条件を3つほどぶら下げます。多くのテック企業が四半期ごとに回しています。',
    interview:
      'KPIが「見る数字」なのに対し、OKRは「挑戦する目標」。混同している人は多いので、区別できると光ります。'
  },
  {
    id: 'agile-scrum',
    term: 'アジャイル / スクラム',
    reading: 'アジャイル、スクラム',
    aliases: ['アジャイル', 'agile', 'スクラム', 'scrum', 'スプリント', 'sprint'],
    category: '開発プロセス',
    level: 1,
    definition:
      '1〜2週間の短い単位で作って見せて直す、という開発の進め方です。この単位をスプリントと呼びます。最初に全部決めきる従来型の対極にあります。',
    interview:
      '「毎週見直す前提で計画を立てる」という感覚は、習慣化の設計と本質的に同じです。'
  },

  // ── 技術の基礎 ────────────────────────────────────────────────────
  {
    id: 'saas-paas-iaas',
    term: 'SaaS / PaaS / IaaS',
    reading: 'サース、パース、イアース',
    aliases: ['saas', 'paas', 'iaas', 'サース'],
    category: 'クラウド',
    level: 1,
    definition:
      'クラウドの提供範囲の違いです。SaaSは完成したソフトをそのまま使う形、PaaSはアプリを作る土台まで借りる形、IaaSはサーバーそのものを借りる形を指します。',
    interview:
      '料理に例えるなら、SaaSは出来上がった定食、PaaSはキッチン付きの部屋、IaaSは更地です。'
  },
  {
    id: 'api',
    term: 'API',
    reading: 'エーピーアイ',
    aliases: ['api', 'application programming interface'],
    category: '技術',
    level: 1,
    definition:
      'ソフト同士がやり取りするための窓口です。人間が画面を操作する代わりに、プログラムから機能を呼び出せるようにした入口だと考えてください。',
    interview:
      '「API連携できますか」は、他のツールと繋げられますかという意味。SaaSの商談で最も頻出する質問の一つです。'
  },
  {
    id: 'sdk',
    term: 'SDK',
    reading: 'エスディーケー',
    aliases: ['sdk', 'software development kit'],
    category: '技術',
    level: 2,
    definition:
      'ある機能を自分のアプリに組み込むための道具一式です。APIを使いやすく包んだもの、と捉えておけば実務では困りません。'
    ,
    interview: 'APIが「窓口」なら、SDKは「窓口に行くための定期券と地図」です。'
  },
  {
    id: 'sla',
    term: 'SLA',
    reading: 'エスエルエー',
    aliases: ['sla', 'service level agreement', 'サービス品質保証'],
    category: 'エンタープライズ',
    level: 2,
    definition:
      'サービスの品質を「稼働率99.9%以上」のように数値で約束する契約です。下回ったら返金する、といった条項がつきます。',
    interview:
      '大企業向けの商談ではSLAの有無が決め手になることがあります。'
  },
  {
    id: 'cloud-native',
    term: 'クラウドネイティブ / コンテナ',
    reading: 'クラウドネイティブ、コンテナ',
    aliases: ['クラウドネイティブ', 'cloud native', 'コンテナ', 'container', 'docker', 'kubernetes', 'k8s'],
    category: 'クラウド',
    level: 2,
    definition:
      'クラウド上で動かす前提で作られたシステムのことです。アプリを「コンテナ」という持ち運びやすい箱に入れ、必要な数だけ自動で増減させます。その箱を束ねる仕組みがKubernetesです。',
    interview:
      '「オンプレからクラウドへ」という移行案件は国内にまだ大量にあります。DX文脈で必ず出てきます。'
  },
  {
    id: 'cicd',
    term: 'CI/CD',
    reading: 'シーアイシーディー',
    aliases: ['ci/cd', 'cicd', '継続的インテグレーション', 'continuous delivery'],
    category: '開発プロセス',
    level: 2,
    definition:
      'コードを書いたら自動でテストして自動で公開する仕組みです。人が手作業でリリースしていた工程を機械に任せることで、1日に何度もリリースできるようになります。',
    interview:
      '「リリース頻度はどのくらいですか」は開発文化を測る良い質問です。'
  },
  {
    id: 'devops-sre',
    term: 'DevOps / SRE',
    reading: 'デブオプス、エスアールイー',
    aliases: ['devops', 'sre', 'site reliability'],
    category: '職種',
    level: 2,
    definition:
      '作る人と運用する人を分けず、一体で回す考え方がDevOpsです。SREはそれを職種にしたもので、サービスが落ちない仕組みづくりを専門に担います。',
    interview:
      '「落ちないこと」を人の頑張りではなく仕組みで担保する、という発想が根っこにあります。'
  },
  {
    id: 'onpre',
    term: 'オンプレミス',
    reading: 'オンプレミス',
    aliases: ['オンプレミス', 'オンプレ', 'on-premise', 'on premises'],
    category: 'エンタープライズ',
    level: 1,
    definition:
      '自社の建物やデータセンターに機材を置いて動かす形です。クラウドの対義語として使われます。',
    interview:
      '金融や公共では今もオンプレが主流。「クラウドが当たり前」は業界によって全く違います。'
  },

  // ── AI 周辺 ───────────────────────────────────────────────────────
  {
    id: 'llm',
    term: 'LLM（大規模言語モデル）',
    reading: 'エルエルエム',
    aliases: ['llm', '大規模言語モデル', 'large language model'],
    category: 'AI',
    level: 1,
    definition:
      '大量の文章を学習して、次に来る言葉を予測するモデルです。ChatGPTやClaudeの中身にあたります。',
    interview:
      '「AIを使っています」だけでは差別化になりません。何の業務のどこに効いたかまで話せると強いです。'
  },
  {
    id: 'rag',
    term: 'RAG',
    reading: 'ラグ',
    aliases: ['rag', 'retrieval augmented generation', '検索拡張生成'],
    category: 'AI',
    level: 2,
    definition:
      'AIに答えさせる前に、社内文書などから関係する資料を検索して渡す手法です。モデル自体を作り直さずに、自社の情報に基づいた回答をさせられます。',
    interview:
      '国内の法人向けAI案件は、実態としてこのRAGがかなりの割合を占めています。'
  },
  {
    id: 'ai-agent',
    term: 'AIエージェント',
    reading: 'エーアイエージェント',
    aliases: ['aiエージェント', 'ai agent', 'エージェント', 'agentic'],
    category: 'AI',
    level: 2,
    definition:
      '質問に答えるだけでなく、自分で手順を考えて道具を使い、作業を最後までやり切るAIです。調べる、書く、送るまでを任せる方向に進んでいます。',
    interview:
      '2025年以降のSaaSの主戦場。「人が使う道具」から「人の代わりに働く同僚」への移行と捉えると流れが掴めます。'
  },
  {
    id: 'token',
    term: 'トークン',
    reading: 'トークン',
    aliases: ['トークン', 'token', 'コンテキストウィンドウ', 'context window'],
    category: 'AI',
    level: 2,
    definition:
      'AIが文章を扱うときの最小単位です。日本語ならおおむね1文字が1トークン前後。AIの利用料金はこのトークン数で決まります。',
    interview:
      'AI企業の原価構造はトークン単価。値下げのニュースが業界に効く理由がここにあります。'
  },

  // ── セキュリティ・信頼 ────────────────────────────────────────────
  {
    id: 'zero-trust',
    term: 'ゼロトラスト',
    reading: 'ゼロトラスト',
    aliases: ['ゼロトラスト', 'zero trust'],
    category: 'セキュリティ',
    level: 2,
    definition:
      '社内ネットワークの中だから安全、とは考えず、すべてのアクセスを毎回疑って確認する設計方針です。リモートワークの普及で主流になりました。',
    interview:
      '「境界を守る」から「一つひとつを確認する」への転換、と一言で言えると伝わります。'
  },
  {
    id: 'soc2',
    term: 'SOC 2 / ISMS',
    reading: 'ソックツー、アイエスエムエス',
    aliases: ['soc 2', 'soc2', 'isms', 'iso27001', 'プライバシーマーク'],
    category: 'セキュリティ',
    level: 3,
    definition:
      'セキュリティ体制が整っていることを第三者に認めてもらう認証です。大企業にSaaSを売るとき、これがないと検討の土俵に乗れないことがあります。',
    interview:
      'エンタープライズ攻略の前提条件。営業職なら知っておくと話が早いです。'
  },
  {
    id: 'sso',
    term: 'SSO / SAML',
    reading: 'エスエスオー、サムル',
    aliases: ['sso', 'シングルサインオン', 'saml', 'oauth', 'oidc'],
    category: 'セキュリティ',
    level: 2,
    definition:
      '1回ログインすれば複数のサービスを使い回せる仕組みです。企業が導入するSaaSの必須要件になりやすい機能です。',
    interview:
      '「SSO対応しているか」は法人向けSaaSの機能比較表に必ず並ぶ項目です。'
  },

  // ── 国内の文脈 ────────────────────────────────────────────────────
  {
    id: 'dx',
    term: 'DX',
    reading: 'ディーエックス',
    aliases: ['dx', 'デジタルトランスフォーメーション', 'デジタル変革'],
    category: '国内IT',
    level: 1,
    definition:
      'デジタル技術で事業のやり方そのものを作り変えることです。紙をPDFにするのは電子化で、業務の流れごと作り直して初めてDXと呼びます。',
    interview:
      '言葉が広く使われすぎて意味が薄れています。「具体的に何がどう変わったか」まで聞ける人が信頼されます。'
  },
  {
    id: 'sier',
    term: 'SIer / 受託開発 / 自社開発',
    reading: 'エスアイヤー',
    aliases: ['sier', 'エスアイヤー', '受託開発', '自社開発', 'ses', 'システムインテグレータ'],
    category: '国内IT',
    level: 1,
    definition:
      'SIerは他社のシステムを請け負って作る会社、自社開発は自分たちのプロダクトを作って売る会社です。同じエンジニアでも、働き方も評価のされ方も変わります。',
    interview:
      '未経験転職ではここの区別が最重要。求人票で最初に確認すべき一点です。'
  },
  {
    id: 'vertical-horizontal',
    term: 'バーティカルSaaS / ホリゾンタルSaaS',
    reading: 'バーティカルサース、ホリゾンタルサース',
    aliases: ['バーティカルsaas', 'ホリゾンタルsaas', 'vertical saas', 'horizontal saas'],
    category: '事業モデル',
    level: 2,
    definition:
      'バーティカルは建設業や医療など特定業界に特化したSaaS、ホリゾンタルは業界を問わず使える人事や会計のSaaSです。',
    interview:
      '前職の業界知識が活きるのはバーティカル。未経験転職では狙い目になりやすい領域です。'
  },
  {
    id: 'tam',
    term: 'TAM / SAM / SOM',
    reading: 'タム、サム、ソム',
    aliases: ['tam', 'sam', 'som', '市場規模'],
    category: '事業モデル',
    level: 3,
    definition:
      '市場規模を3段階で見る枠組みです。TAMは理論上の最大市場、SAMはそのうち自社が狙える範囲、SOMは現実的に取れる範囲を指します。',
    interview:
      '「この会社はどこまで伸びうるか」を自分で見積もる道具になります。'
  },
  {
    id: 'series',
    term: 'シード / シリーズA・B・C',
    reading: 'シード、シリーズエー',
    aliases: ['シード', 'seed', 'シリーズa', 'シリーズb', 'シリーズc', 'series a', 'series b'],
    category: 'スタートアップ',
    level: 1,
    definition:
      'スタートアップの資金調達の段階です。シードは製品を作り始める頃、シリーズAはPMFが見え始めた頃、BやCは営業や採用で一気に広げる段階を指します。',
    interview:
      '段階ごとに社内の整い具合が全く違います。「整っていない環境を面白がれるか」は自己分析の材料になります。'
  },
  {
    id: 'valuation',
    term: 'バリュエーション',
    reading: 'バリュエーション',
    aliases: ['バリュエーション', 'valuation', '企業価値'],
    category: 'スタートアップ',
    level: 2,
    definition:
      '企業の値段のことです。調達時に「時価総額いくらとして、何%の株を渡すか」で決まります。',
    interview:
      '調達額そのものより、バリュエーションと調達額の比率のほうが、その会社の勢いを表します。'
  }
];

export const GLOSSARY_BY_ID = Object.fromEntries(GLOSSARY.map((g) => [g.id, g]));

/**
 * 記事群に登場した用語を、辞書と突き合わせて拾う。
 * @param {Array<{title?:string,summary?:string}>} items
 * @param {{exclude?:string[], limit?:number}} [options] exclude には「もう覚えた」用語IDを渡す
 */
export function detectTerms(items, options = {}) {
  const exclude = new Set(options.exclude || []);
  const limit = options.limit ?? 3;

  const haystack = items
    .map((i) => `${i.title || ''} ${i.summary || ''}`)
    .join(' ')
    .toLowerCase();

  const hits = [];
  for (const entry of GLOSSARY) {
    if (exclude.has(entry.id)) continue;
    const matched = entry.aliases.filter((a) => containsTerm(haystack, a));
    if (matched.length > 0) {
      hits.push({ entry, matchCount: matched.length, matchedAliases: matched });
    }
  }

  // 出現回数が多い順。同数なら初級（level が小さい）を優先する。
  hits.sort((a, b) => b.matchCount - a.matchCount || a.entry.level - b.entry.level);
  return hits.slice(0, limit).map((h) => h.entry);
}

/**
 * 記事側に用語が見つからなかった日でも、語彙は毎日増やしたい。
 * まだ扱っていない用語から、易しい順に埋め草を出す。
 */
export function fallbackTerms(exclude = [], limit = 1) {
  const excludeSet = new Set(exclude);
  return GLOSSARY.filter((g) => !excludeSet.has(g.id))
    .sort((a, b) => a.level - b.level)
    .slice(0, limit);
}
