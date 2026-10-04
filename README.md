# MealCare

sho（ハイブリッドボディメイク）のクライアント向け食事・体重記録アプリ。
React + Vite で作られた SPA で、Vercel にデプロイして使う。

## 主な機能

- 食事記録（食品データベース検索・手入力・写真AI・レシピ提案）
- PFC と カロリーの目標計算、栄養分析、体重推移
- コーチ連携（公式LINE `@741apbnk`）
  - 日報・週報・相談・ミッション達成報告を、本文を入れた状態で公式LINEのトークに渡す
  - 送信はクライアント本人が LINE 上で行い、返信も LINE に届く

## データの保存先

記録はすべて端末のブラウザ（localStorage）に保存される。サーバーには送らない。
機種変更やブラウザのデータ削除で消えるため、必要に応じて「📤 データ出力」から CSV を保存する。

## 写真AI

`api/photo.js`（Vercel Function）が Claude API を呼ぶ。

- Vercel の環境変数に `ANTHROPIC_API_KEY` を設定する
- 画像はブラウザ側で長辺 1568px の JPEG に縮小してから送る（HEIC もここで変換される）

## 開発

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm test         # api/ のテスト
npm run build
```

`techcast/` は別アプリ（ポッドキャスト）で、mealcare とは独立している。
