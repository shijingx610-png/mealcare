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
| `public/manifest.webmanifest` / `public/icon-*.png` | ホーム画面に追加したときのアイコンと表示設定 |

送料は2025年時点の目安です。改定された場合は `src/mercari/shipping.js` を更新するか、
アプリ内の「送料を上書きする」欄に実際の金額を入力してください。
