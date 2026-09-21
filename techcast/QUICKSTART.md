# はじめかた

AI・IT業界のニュースを毎朝まとめて、ポッドキャストとして聞けるようにします。

進め方は 2 つあります。**上のほうがおすすめです。**

---

## A. GitHub にまかせる（パソコン不要・おすすめ）

毎朝 GitHub が番組を作って配信します。あなたのパソコンは関係ありません。
寝ていても旅行中でも増えます。費用もかかりません。

準備は 4 つ、10 分ほどです。

1. **このブランチを `main` に取り込む**
   定期実行は `main` にあるものしか動きません。ここが一番よく抜けます。
2. **Settings → Pages → Source を「GitHub Actions」にする**
3. **Settings → Secrets → Actions に `ANTHROPIC_API_KEY` を入れる**（任意）
4. **Actions タブ → TechCast daily → Run workflow** を一度押す

10 分ほどで終わり、実行結果のページにアプリと購読用フィードの URL が出ます。

```
アプリ          https://あなたのユーザー名.github.io/mealcare/
購読用フィード  https://あなたのユーザー名.github.io/mealcare/feed.xml
```

購読用フィードを、普段のポッドキャストアプリの「URL で追加」に貼ってください。
あとは毎朝 4:30（日本時間）に新しい回が届きます。

**詳しい手順は [docs/PAGES.md](./docs/PAGES.md) にあります。**

---

## B. 自分のパソコンで動かす

情報源や重みを調整しながらその場で作り直したいとき向けです。
Docker が要ります。入っていなければ先に入れてください。

- macOS / Windows … [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Linux … `curl -fsSL https://get.docker.com | sh`

```bash
cd techcast
npm install
npm run setup
```

`npm run setup` が設定ファイルの用意、VOICEVOX の起動、最初の 1 本の生成まで
全部やります。終わるとこう出ます。

```
アプリ          http://localhost:3000
購読用フィード  http://localhost:3000/api/podcast
```

毎朝 4:30 に自動で番組ができます。パソコンを止めていて動けなかった日は、
次に起動したときに作り直します。

**詳しい手順は [docs/VOICEVOX.md](./docs/VOICEVOX.md) にあります。**

両方を併用しても構いません。

---

## 声を変える

**A の場合**　Settings → Secrets and variables → Actions → Variables に
`VOICEVOX_SPEAKER` を足します。

**B の場合**　使える声の一覧を出して、`.env` に書きます。

```bash
docker compose exec techcast node scripts/voicevox-speakers.mjs
```

```bash
VOICEVOX_SPEAKER=3
TTS_SPEED=1.2
```

---

## 困ったとき

**記事が集まらない**

情報源のフィードが移転しているか止まっています。アプリの「情報源」タブで
「使用中の情報源を確認」を押すと、その場で移転先を見つけて直せます。
A の場合は、Actions の実行結果のページに移転の記録が出ます。

**音声だけできていない**

VOICEVOX が動いていません。台本は残っているので、アプリ内では読み上げで聞けます。

```bash
docker compose ps
docker compose logs voicevox | tail
```

**イメージが見つからないと言われる**

VOICEVOX のイメージ名は時期によって変わります。次を試してください。

```bash
VOICEVOX_IMAGE=voicevox/voicevox_engine:cpu-ubuntu20.04-latest
```

A の場合は Variables に、B の場合は `.env` に書きます。
