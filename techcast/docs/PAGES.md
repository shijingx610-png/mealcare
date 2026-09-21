# パソコンを起動せずに、毎朝の番組を受け取る

GitHub が毎朝あなたの代わりに番組を作って、配信まで済ませます。
自分のパソコンは一切関係ありません。寝ていても、旅行中でも、毎朝増えます。

費用はかかりません。VOICEVOX も GitHub Actions も GitHub Pages も無料の範囲で収まります。
台本を Claude に書かせる場合だけ、月 200 円から 700 円ほどかかります。

準備は 4 つ。10 分ほどで終わります。

---

## 1. ブランチを main に取り込む

**これが一番大事です。** GitHub の定期実行は、既定のブランチ（`main`）にある
ワークフローしか動かしません。作業ブランチに置いたままだと、いつまで経っても動きません。

GitHub でプルリクエストを作ってマージするか、手元でこうします。

```bash
git checkout main
git merge claude/it-news-podcast-app-kf9nqc
git push origin main
```

---

## 2. Pages を有効にする

1. リポジトリの **Settings** を開く
2. 左の **Pages** をクリック
3. **Source** を **GitHub Actions** にする

これだけです。ブランチを選ぶ欄は触らなくて構いません。

---

## 3. Claude の鍵を登録する（任意）

入れなくても番組はできますが、入れると次が変わります。

- 英語のニュースが日本語になる
- ニュース同士のつながりが説明される
- 用語の解説がその日の文脈に合わせて言い直される

1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Name に `ANTHROPIC_API_KEY`、Secret に鍵を貼る

> 鍵はここにしか置かないでください。コードに直接書くと、公開リポジトリなので誰でも読めます。

---

## 4. 一度手で動かす

定期実行を待たずに、その場で確かめます。

1. **Actions** タブを開く
2. 左から **TechCast daily** を選ぶ
3. **Run workflow** を押す（ブランチは `main`）

10 分ほどで終わります。終わったら実行結果のページに、その朝の中身と
アプリの URL、購読用フィードの URL が出ます。

---

## 聞く

**アプリ**

```
https://あなたのユーザー名.github.io/mealcare/
```

開いて再生ボタンを押すだけです。台本も全部読めます。

**ポッドキャストアプリ**

```
https://あなたのユーザー名.github.io/mealcare/feed.xml
```

この URL を、普段のポッドキャストアプリの「URL で追加」に貼ります。
Apple Podcasts、Pocket Casts、Overcast、AntennaPod などが対応しています。

あとは毎朝 4:30（日本時間）に新しい回が届きます。
5 時に聞き始められるよう、少し前に作るようにしてあります。

---

## 設定を変える

**Settings** → **Secrets and variables** → **Actions** → **Variables** タブで足します。
どれも任意です。

| 名前 | 既定 | 意味 |
| --- | --- | --- |
| `VOICEVOX_SPEAKER` | 3 | 声。番号は下で調べます |
| `TTS_SPEED` | 1.1 | 読み上げ速度 |
| `PODCAST_TITLE` | TechCast — IT・SaaS業界の朝 | 番組名 |
| `PODCAST_AUTHOR` | TechCast | 作者名 |
| `VOICEVOX_IMAGE` | cpu-latest | イメージが見つからないときに差し替える |

**声の番号を調べる**

手元に VOICEVOX があるなら次で一覧が出ます。

```bash
cd techcast && npm run voices
```

無い場合は [VOICEVOX の公式サイト](https://voicevox.hiroshiba.jp/) でキャラクターを見て、
好みのものを選んでから番号を調べてください。ニュースの読み上げなら、
落ち着いた「ノーマル」系が聞きやすいです。

**時刻を変える**

`.github/workflows/techcast-daily.yml` の `cron` を書き換えます。
**UTC で書く**ので、日本時間から 9 時間引いてください。

```yaml
- cron: '30 19 * * *'   # 19:30 UTC = 日本時間 4:30
- cron: '0 21 * * *'    # 21:00 UTC = 日本時間 6:00
```

---

## 仕組み

```
毎朝 4:30（日本時間）
  ↓
GitHub の仮想マシンが起動
  ↓
VOICEVOX を Docker で立ち上げる
  ↓
27媒体からニュースを集める
  ↓
Claude が台本を書く（鍵が無ければテンプレート）
  ↓
VOICEVOX が読み上げて音声にする
  ↓
MP3 に変換する（10分で約5MB）
  ↓
techcast-data ブランチに保存する（直近30本）
  ↓
GitHub Pages に配信する
  ↓
ポッドキャストアプリに届く
```

**保存について**　音声は `techcast-data` ブランチに置かれます。毎回ひとつの
コミットで丸ごと置き換えるので、履歴でリポジトリが太りません。古い回は
30 本を超えたぶんから自動で消えます。

---

## 困ったとき

**実行が失敗する**

Actions タブで赤くなっている実行を開くと、どのステップで止まったかが出ます。
実行結果のページには、その朝の中身と、読み込めなかった情報源の一覧も出ます。

**記事が 0 本になる**

情報源のフィードが移転しているか止まっています。実行結果のページに
「フィードが移転していました」と出ていれば、その URL を
`techcast/server/sources.js` に書き写しておくと次回から速くなります。

**Pages が 404 になる**

手順 2 を飛ばしています。Settings → Pages → Source を GitHub Actions にしてください。
設定した直後は反映に数分かかります。

**定期実行が止まった**

GitHub は、60 日間なにも動きがないリポジトリの定期実行を自動で止めます。
Actions タブに再開のボタンが出るので押してください。
普段から手を入れていれば起きません。

**音声だけできていない**

VOICEVOX の起動に失敗しています。台本は保存されているので、アプリ内では
読み上げで聞けます。`VOICEVOX_IMAGE` を
`voicevox/voicevox_engine:cpu-ubuntu20.04-latest` にして試してください。

---

## 自分のパソコンで動かす場合

こちらの手順は [VOICEVOX.md](./VOICEVOX.md) にあります。
ニュースをその場で作り直せるので、情報源や重みを調整しながら試すときに向いています。
両方を併用しても構いません。
