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

## セットアップ

```bash
npm install
npm run dev       # http://localhost:5173/mercari.html
```

写真解析には Anthropic の API キーが必要です。Vercel のプロジェクト設定で環境変数を追加してください。

| 環境変数 | 用途 |
| --- | --- |
| `ANTHROPIC_API_KEY` | `/api/listing`（写真解析）と `/api/photo`（食事写真解析）で使用 |

キーがない状態でも、入力画面の「サンプルデータで画面を見る」から一連の画面を確認できます。

## 構成

| ファイル | 役割 |
| --- | --- |
| `mercari.html` / `src/mercari/main.jsx` | エントリーポイント |
| `src/mercari/MercariApp.jsx` | 画面（写真選択 / 結果編集 / 価格 / 配送 / 下書き） |
| `src/mercari/listing.js` | 出品データの初期値と商品説明文のテンプレート |
| `src/mercari/shipping.js` | 配送方法の送料表と手数料・手取りの計算 |
| `api/listing.js` | Claude に写真を渡して出品情報を構造化JSONで受け取るサーバー関数 |

送料は2025年時点の目安です。改定された場合は `src/mercari/shipping.js` を更新するか、
アプリ内の「送料を上書きする」欄に実際の金額を入力してください。
