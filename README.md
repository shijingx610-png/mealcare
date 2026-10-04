# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

# メルカリ出品ヘルパー

2つの入り口があります。用途で選んでください。

| ページ | AIの使い方 | 費用 | 必要なもの |
| --- | --- | --- | --- |
| `/free.html`（**おすすめ・無料**） | 写真を選んでボタンを押すと、アプリ内で自動生成（Google AI Studio の無料枠を使用） | **0円** | サーバーにキーを置けば利用者は不要。置かない場合は各自の無料キー |
| `/mercari.html` | 写真をアップロードすると Claude が自動で解析する | 1回 5〜10円程度 | Anthropic の有料APIキー |

`/free.html` の流れは「写真を選ぶ → 自動生成 → 価格を決める → 出品ナビ」の4手です。
自動生成は2段階で動きます。

1. **写真検索** — Google検索を使って、写真の商品の型番・定価・中古相場・注意点を調べます
   （結果は「写真検索でわかったこと」から確認できます）
2. **出品情報の作成** — 調べた内容をもとに、商品名・カテゴリ・状態・説明文・価格帯・配送方法を作ります

検索が使えない場合（無料枠の制限など）は、自動的に写真だけで作成する動きに切り替わります。

`/free.html` は1枚のHTMLだけで完結します（ビルド不要・サーバー不要）。
無料キーの取得は [aistudio.google.com/apikey](https://aistudio.google.com/apikey) から1分ほどです。
キーはブラウザのlocalStorageにのみ保存され、AIへのリクエストは端末から直接送られます。
無料枠では入力内容がモデル改善に使われる場合があるため、人物や個人情報が写った写真は避けてください。
キーを設定しなくても、「手持ちのAIアプリで書いてもらう」（指示文をコピー→回答を貼り戻す）で同じ結果になります。

### 他の人に渡して使ってもらう（推奨の設置方法）

Vercel に置いて **サーバー側にAIキーを1つ持たせる**と、URLを渡された人は
**何も設定せずに**使えます（キーの入力画面すら出ません）。

1. このリポジトリを Vercel にデプロイする
2. プロジェクト → Settings → Environment Variables に登録する

| 環境変数 | 必須 | 役割 |
| --- | --- | --- |
| `GEMINI_API_KEY` | 必須 | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) で作る無料キー。設置した人の1つを全員で共有します |
| `APP_PASSWORD` | 任意 | 設定すると合言葉を知っている人だけが使えます。URLが広まったときの保険 |
| `DAILY_LIMIT` | 任意 | 1日あたりの生成回数の上限（既定 200） |
| `PER_MINUTE_LIMIT` | 任意 | 同じ回線からの1分あたりの上限（既定 8） |

3. Deployments → Redeploy
4. `https://<あなたのURL>/free.html` を渡す

渡された人の画面には「このアプリはこのまま使えます（設定は不要です）」と出て、
写真を選んでボタンを押すだけになります。キーは端末に配られず、サーバーの中だけに
あります。エラーが起きても、利用者にはキーの情報を見せません。

**知っておいてほしいこと**

- Gemini の無料枠には1分あたり・1日あたりの上限があります。同時に何人も使うと
  「いま混み合っています」と表示されます（課金は発生しません）
- 無料枠では入力内容がGoogleのモデル改善に使われる場合があります。人物や個人情報が
  写った写真は避けるよう、渡す相手にも伝えてください
- URLを知っている人は誰でも使えます。心配な場合は `APP_PASSWORD` を設定してください

**サーバーを用意しない場合**も動きます。`public/free.html` を単体で配ると、
受け取った人は「自分の無料キーを入れる」か「手持ちのAIアプリに指示文を貼る」
のどちらかで使えます（アプリが自動で判別して案内を切り替えます）。

### 商品説明は決まったテンプレートで作ります

本文は**1つ**にまとまっていて、編集も1か所、コピーも1回です。型は次のとおりです。

```
【コメントなし即購入OK!】
【匿名配送✨】

【商品】      ブランド名と特徴を1行ずつ
【状態】      写真から見える傷・汚れを正直に
【カラー】    英語と日本語の両方
【サイズ】    表記サイズ＋採寸の項目名（数値は出品者が実測して記入）
【素材】      読み取れた品質表示
【発送について】 梱包方法と注意

※素人検品〜（4つの注意書き）
```

冒頭2行と末尾の注意書きはチェックボックスで付け外しでき、手直しした本文を
壊さずに入れ替わります。**採寸の数値はAIが推測しません**。項目名だけが入るので、
実際に測って埋めてください（推測値を書くとトラブルの元になるため）。

型を変えたいときは、`public/free.html` 内の `# descriptionの書き方` と
`api/generate.js` の同じ箇所（プロンプト）、`HEADER_LINES` / `NOTES_BLOCK` /
`templateBody()` を直します。

### 出品ナビ（メルカリへの反映）

メルカリは外部アプリから出品項目を直接入力するAPIを公開していません
（自動入力をうたう外部ツールは規約違反にあたります）。項目ごとの貼り付けは必ず残るので、
**1画面につき1つの作業だけを出す出品ナビ**を用意しました。

1. メルカリの出品画面をひらく
2. 写真を登録する（共有メニューから渡すこともできます。写真は10枚まで、AIが見るのは先頭6枚）
3. 商品名を貼り付ける（コピー済み）
4. 商品の説明を貼り付ける（コピー済み）
5. カテゴリを選ぶ / 6. ブランドを選ぶ（ある場合）
7. 商品の状態を選ぶ / 8. 配送方法を選ぶ
9. 販売価格を入れる（コピー済み）
10. 出品するを押して完了（そのまま「下書きに残す」「次の商品へ」に進めます）

次の手順に進んだ時点で、その手順で使う文字を自動でコピーします。メルカリ側では
長押し →「ペースト」を押すだけです。入力内容とナビの現在地は自動保存されるため、
メルカリアプリと行き来しても、途中から続けられます。

---

# メルカリ出品AI（/mercari.html）

商品の写真を渡すと、メルカリに出品するための情報一式をAIがまとめて作成するアプリです。
既存の mealcare アプリ（`/`）とは独立したページとして動きます。

## できること

1. **写真の解析** — 商品写真（最大6枚）と任意のメモを送ると、Claude が商品を特定します
2. **商品名・説明文の作成** — 40文字以内の検索されやすいタイトルと、そのまま貼れる商品説明文
3. **カテゴリ・ブランド・サイズ・状態の判定** — 状態はメルカリの6段階から選定し、判断根拠と写真から見えるキズも提示
4. **価格設定** — 相場レンジと推奨価格に加えて、販売手数料10%と送料を引いた「手元に残る金額」をその場で計算。手取りから逆算した価格も出せます
5. **配送方法の提案** — 商品サイズからメルカリ便の最安の方法を選定（送料は上書き可能）
6. **出品** — 商品名・説明文・価格をワンタップでコピーし、メルカリの出品画面を開く
7. **下書き保存** — 端末内（localStorage）に保存して後から呼び出し

## 出品の最後のひと手間について

メルカリは外部アプリからの自動出品API を公開していません。そのため
「写真を渡す → 出品情報が完成する」までを自動化し、**最後の投稿だけはメルカリアプリ側で
コピペ＋写真選択で行う** 設計にしています（スクレイピングによる自動投稿は利用規約違反に
あたるため実装していません）。

## スマホでの使い方

このアプリはスマホで使う前提で作っています。

1. スマホのブラウザで `https://<あなたのVercelのURL>/mercari.html` を開く
2. iPhone は共有ボタン →「ホーム画面に追加」、Android は メニュー →「アプリをインストール」
3. ホーム画面のアイコンから、アプリのように全画面で起動します

写真の追加方法は3つあります。

| ボタン | 用途 |
| --- | --- |
| 📷 撮影する | その場でカメラを起動して撮影（実際に出品する写真はこれ） |
| アルバムから | 撮影済みの写真を選ぶ（複数選択可） |
| 🔗 画像URL | ネット上の画像URLを貼ると、サーバー経由で取り込む |

「画像URL」は、実物の写真を撮らずにAIの精度を試したいときのための機能です。
スマホのブラウザで画像を長押し →「画像アドレスをコピー」で URL が取れます。
**メルカリに登録する写真は自分で撮影したものを使ってください**
（メーカー公式画像や他サイトの画像の転載は、メルカリの規約違反・著作権侵害になります）。

## セットアップ

```bash
npm install
npm run dev       # http://localhost:5173/mercari.html
```

開発サーバーでも `api/*.js` が動くようにしてあるので、`/api/listing` と `/api/image` を
ローカルで試せます（`vite.config.js` の `apiDevServer`）。

### APIキーの設定（これだけは自分で行う必要があります）

写真解析には Anthropic の API キーが必要です。キーは課金アカウントに紐づくため、
アプリ側で肩代わりすることはできません。スマホからでも5分程度で設定できます。

1. [console.anthropic.com](https://console.anthropic.com/) にログイン →「API keys」→「Create Key」
   （初回は Billing でクレジットの購入が必要です）
2. 作成された `sk-ant-...` をコピー
3. Vercel のプロジェクト →「Settings」→「Environment Variables」
   - Key: `ANTHROPIC_API_KEY`
   - Value: コピーしたキー
   - Environment: Production / Preview / Development すべてにチェック
4. 「Deployments」→ 最新のデプロイの「…」→「Redeploy」

| 環境変数 | 用途 |
| --- | --- |
| `ANTHROPIC_API_KEY` | `/api/listing`（出品情報の作成）と `/api/photo`（食事写真解析）で使用 |

1回の解析でかかる費用は、写真3枚でおおよそ 5〜10円程度です（Claude Opus 5 の従量課金）。
安く抑えたい場合は `api/listing.js` の `model` を `claude-sonnet-5` に変えられます
（精度は少し下がります）。

キーがない状態でも、入力画面の「サンプルデータで画面を見る」から一連の画面を確認できます。

## 構成

| ファイル | 役割 |
| --- | --- |
| `mercari.html` / `src/mercari/main.jsx` | エントリーポイント |
| `src/mercari/MercariApp.jsx` | 画面（写真選択 / 結果編集 / 価格 / 配送 / 下書き） |
| `src/mercari/listing.js` | 出品データの初期値と商品説明文のテンプレート |
| `src/mercari/shipping.js` | 配送方法の送料表と手数料・手取りの計算 |
| `api/listing.js` | Claude に写真を渡して出品情報を構造化JSONで受け取るサーバー関数 |
| `api/image.js` | 画像URLをサーバー経由で取り込むサーバー関数（CORS回避・SSRF対策あり） |
| `api/generate.js` | サーバー側のAIキーで出品情報を作るサーバー関数（合言葉・回数制限つき） |
| `public/manifest.webmanifest` / `public/icon-*.png` | ホーム画面に追加したときのアイコンと表示設定 |
| `public/free.html` | 無料版（APIキー不要・1ファイルで完結） |

送料は2025年時点の目安です。改定された場合は `src/mercari/shipping.js` を更新するか、
アプリ内の「送料を上書きする」欄に実際の金額を入力してください。
