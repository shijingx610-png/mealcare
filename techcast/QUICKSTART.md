# はじめかた（1ページ）

AI・IT業界のニュースを毎朝まとめて、ポッドキャストとして聞けるようにします。

---

## 必要なもの

**Docker** だけです。入っていなければ先に入れてください。

- macOS / Windows … [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Linux … `curl -fsSL https://get.docker.com | sh`

---

## 手順

```bash
cd techcast
npm install
npm run setup
```

これだけです。`npm run setup` が次のことを全部やります。

1. 設定ファイル（`.env`）を作る
2. VOICEVOX とアプリを起動する
3. 起動を待つ
4. 今日の番組を 1 本作って確かめる

終わると、こう表示されます。

```
セットアップ完了

  アプリ          http://localhost:3000
  購読用フィード  http://localhost:3000/api/podcast
```

---

## 聞く

**パソコンで聞く**　`http://localhost:3000` を開いて再生ボタンを押します。

**スマホで聞く**　ポッドキャストアプリの「URL で追加」に購読用フィードを貼ります。
Apple Podcasts、Pocket Casts、Overcast、AntennaPod などが対応しています。

同じ家の Wi-Fi から聞く場合は、`localhost` をパソコンの IP に変えてください。
IP は次で調べられます。

```bash
ipconfig getifaddr en0          # macOS
hostname -I | awk '{print $1}'  # Linux
```

`.env` に書いておくと、フィードの中身も正しい URL になります。

```bash
PUBLIC_BASE_URL=http://192.168.1.20:3000
```

書いたら `docker compose up -d` で反映されます。

---

## 毎日の更新

**何もしなくて大丈夫です。** 毎朝 4:30 に新しい番組ができます。

パソコンを止めていて 4:30 に動けなかった場合は、次に起動したときに自動で作り直します。

時刻を変えたいときは `.env` に書きます。

```bash
DAILY_HOUR=4
DAILY_MINUTE=30
```

---

## 声を変える

使える声の一覧を出します。

```bash
docker compose exec techcast node scripts/voicevox-speakers.mjs
```

気に入った ID を `.env` に書いて、`docker compose up -d` で反映します。

```bash
VOICEVOX_SPEAKER=3
TTS_SPEED=1.2
```

---

## 台本の質を上げる（任意）

`.env` に API キーを 1 行足すと、英語のニュースが日本語になり、
ニュース同士のつながりも説明されるようになります。

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

費用の目安は月 200 円から 700 円ほどです。入れなくても番組は作られます。

---

## よく使うコマンド

```bash
docker compose logs -f techcast    # 動いているか見る
docker compose down                # 止める
docker compose up -d               # また動かす

docker compose exec techcast node scripts/run-daily.mjs --force   # 今すぐ作り直す
```

---

## 困ったとき

**音声だけできていない**

VOICEVOX が応答していません。台本は残っているので、アプリ内では読み上げで聞けます。

```bash
docker compose ps
docker compose logs voicevox | tail
```

**記事が集まらない**

アプリの「情報源」タブで「使用中の情報源を確認」を押してください。
読み込めないフィードがあれば、その場で移転先を見つけて直せます。

**イメージが見つからないと言われる**

`.env` に次を足して `npm run setup` をやり直してください。

```bash
VOICEVOX_IMAGE=voicevox/voicevox_engine:cpu-ubuntu20.04-latest
```

**もっと詳しく**

[docs/VOICEVOX.md](./docs/VOICEVOX.md) に、Docker を使わない方法や設定の一覧があります。
