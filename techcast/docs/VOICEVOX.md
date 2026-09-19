# VOICEVOX で音声にして、毎朝 5 時に聞けるようにする

やりたいことはこうだと理解しています。

- 朝 5 時にインプットの時間を取っている
- その時間には、**もう今日の新しい番組ができている**状態にしたい
- 音声は VOICEVOX で

そのための手順です。所要時間は 10 分ほど。

---

## 先に知っておいてほしいこと

VOICEVOX は、自分のマシンで動かすソフトです。クラウドのサービスではありません。
つまり **毎朝 5 時に動いている機械が必要** になります。

| 置き場所 | 向き | 備考 |
|---|---|---|
| 自宅サーバー、ミニPC、Raspberry Pi | ◎ | いちばん素直。つけっぱなしにできる |
| VPS（さくら、ConoHa、Hetzner など） | ◎ | 月数百円から。外出先からも聞ける |
| 普段使いの PC | △ | 朝 5 時に電源が入っていれば動く。スリープだと動かない |
| Vercel などのサーバーレス | ✗ | VOICEVOX を置けず、音声も残らない |

普段使いの PC でも一応使えます。スリープしていて 5 時に動けなかった場合は、
**次に起動したときに自動で作り直す**ようにしてあるので、朝 7 時に開いてもその日の番組は聞けます。
ただし「5 時ぴったりに必ず」を求めるなら、つけっぱなしにできる機械を用意してください。

VOICEVOX の音声には利用規約があります。個人で聞くぶんには問題ありませんが、
どこかに公開するなら [VOICEVOX の利用規約](https://voicevox.hiroshiba.jp/term/) と
各キャラクターの規約を確認してください。

---

## 手順 1：Docker を入れる

いちばん簡単なのは Docker で動かす方法です。VOICEVOX とアプリがまとめて立ち上がります。

- macOS / Windows：[Docker Desktop](https://www.docker.com/products/docker-desktop/) を入れる
- Linux：`curl -fsSL https://get.docker.com | sh`

入ったか確認します。

```bash
docker --version
docker compose version
```

> Docker を使いたくない場合は、この文書の最後の「Docker を使わない場合」を見てください。

---

## 手順 2：設定ファイルを作る

```bash
cd techcast
cp .env.example .env
```

`.env` を開いて、必要なところだけ書き換えます。**全部任意です。**
何も書かなくても動きますが、次の 1 行を入れると台本の質がはっきり変わります。

```bash
# 英語記事が日本語になり、ニュース同士のつながりも説明されるようになる
ANTHROPIC_API_KEY=sk-ant-...
```

VOICEVOX の接続先は Docker が自動で設定するので、`.env` に書く必要はありません。

---

## 手順 3：起動する

```bash
docker compose up -d
```

初回は VOICEVOX のイメージ取得に数分かかります。終わったら確認します。

```bash
docker compose ps          # 2つとも running になっていること
docker compose logs -f techcast
```

こういうログが出れば成功です。

```
TechCast を起動しました  http://localhost:3000
音声合成: VOICEVOX (http://voicevox:50021)
台本: Claude
毎朝の生成: 毎日 04:30（Asia/Tokyo）
```

ブラウザで http://localhost:3000 を開いてください。

> **イメージが見つからないと言われたら**
> VOICEVOX のイメージ名は時期によって変わります。`.env` に次のどれかを書いて試してください。
> ```bash
> VOICEVOX_IMAGE=voicevox/voicevox_engine:cpu-ubuntu20.04-latest
> ```
> GPU があるなら `nvidia-latest` 系にすると合成がかなり速くなります。

---

## 手順 4：声を選ぶ

どんな声が使えるかを一覧で出します。

```bash
docker compose exec techcast node scripts/voicevox-speakers.mjs
```

こんな出力になります。

```
■ 四国めたん
    ID   2  ノーマル
    ID   0  あまあま
■ ずんだもん
    ID   3  ノーマル
    ID   1  あまあま
```

気に入った ID を `.env` に書いて、再起動します。

```bash
# .env
VOICEVOX_SPEAKER=3
TTS_SPEED=1.2        # 少し速めのほうがニュースは聞きやすい
```

```bash
docker compose up -d
```

---

## 手順 5：試しに 1 本作る

スケジュールを待たずに、今すぐ作って確かめます。

```bash
docker compose exec techcast node scripts/run-daily.mjs --force
```

音声の生成には、10 分の番組で 1 分から数分かかります（マシンの速さ次第）。
こう出れば成功です。

```
[daily] 台本ができました: ...（claude、約9.8分）
[daily] 音声ができました: 8.4MB（voicevox、73秒）
```

できた音声はここで聞けます。

```
http://localhost:3000/api/audio?id=2026-09-19
```

---

## 手順 6：ポッドキャストアプリに登録する

アプリの「設定」タブに購読用の URL が出ています。それをポッドキャストアプリの
「URL で追加」に貼ります。

```
http://localhost:3000/api/podcast
```

**同じ家の Wi-Fi にいるスマホから聞く場合**は、`localhost` をそのマシンの IP に変えます。

```bash
# サーバーの IP を調べる
hostname -I | awk '{print $1}'       # Linux
ipconfig getifaddr en0                # macOS
```

`.env` に書いておくと、フィードの中身も正しい URL になります。

```bash
PUBLIC_BASE_URL=http://192.168.1.20:3000
```

```bash
docker compose up -d
```

登録先の URL は `http://192.168.1.20:3000/api/podcast` になります。

対応アプリ：Apple Podcasts、Pocket Casts、Overcast、AntennaPod など「URL で追加」ができるもの。
Spotify は公開番組しか登録できないので、この用途には向きません。

**外出先でも聞きたい場合**は、VPS に置くか、Tailscale などで自宅につなぐか、
Cloudflare Tunnel で外に出す方法があります。外に公開するなら `CRON_SECRET` を必ず設定してください。

---

## 毎朝 5 時に間に合わせる仕組み

既定では **4:30 に生成を始めます**。5 時ちょうどに始めると、記事の取得・台本・音声合成で
数分待つことになるからです。5 時に開いたときには、もうできている状態を狙っています。

時刻を変えたいときは `.env` に書きます。

```bash
DAILY_HOUR=4
DAILY_MINUTE=0          # 4:00 に作る
DAILY_TIMEZONE=Asia/Tokyo
```

この仕組みのポイントは 3 つです。

- **cron を別に用意しなくていい**。アプリ自身が時刻を持っています
- **サーバーの時計が UTC でも日本時間で動く**。Docker や VPS ではここがよくずれます
- **取りこぼしを拾う**。予定時刻に機械が止まっていた場合、次に起動した時点で
  その日の番組がまだ無ければ自動で作ります

止めたいときは `DAILY_ENABLED=false` を入れてください。

### 動いているか確かめる

```bash
docker compose logs techcast | grep daily
```

毎朝こういう行が増えていれば、回り続けています。

```
[daily] 2026-09-20 の番組を作ります（scheduled）
[daily] 台本ができました: ...
[daily] 音声ができました: 8.1MB（voicevox、68秒）
```

---

## うまくいかないとき

**「音声だけ失敗しています」と出る**

VOICEVOX が応答していません。台本は保存されているので、アプリ内では読み上げで聞けます。

```bash
docker compose ps                    # voicevox が running か
docker compose logs voicevox | tail
curl http://localhost:50021/version  # 応答するか
```

起動直後は engine の準備に時間がかかります。そのため失敗しても 15 秒、30 秒と間を置いて
3 回まで試し直すようにしてあります。それでもだめなら engine 側の問題です。

**音声の生成がとても遅い**

CPU 版は時間がかかります。次のどれかで改善します。

- `docker-compose.yml` の `VOICEVOX_CPUS` を増やす（既定は 2）
- 番組を短くする：`.env` に `EPISODE_MINUTES=5`
- GPU があるなら `VOICEVOX_IMAGE` を nvidia 系にする

**ポッドキャストアプリに何も出てこない**

まだ音声付きの回が 1 本もない可能性があります。手順 5 で 1 本作ってから登録してください。
フィードには**音声のある回だけ**が載ります。

**記事が集まらない**

アプリの「情報源」タブで「使用中の情報源を確認」を押してください。
読み込めないフィードがあれば、その場で移転先を見つけて直せます。

---

## Docker を使わない場合

Node.js 22 以上が要ります。

**1. VOICEVOX を入れる**

[公式サイト](https://voicevox.hiroshiba.jp/) からアプリ版を入れて起動しておくか、
エンジンだけを動かします。アプリ版を起動していれば、ポート 50021 で待ち受けています。

**2. アプリを動かす**

```bash
cd techcast
npm install
npm run build

# .env に書く
# VOICEVOX_URL=http://localhost:50021
# VOICEVOX_SPEAKER=3
# ANTHROPIC_API_KEY=sk-ant-...

npm start
```

`npm start` したプロセスが生きているかぎり、毎朝 4:30 に番組を作ります。

**3. 自動で立ち上げる**

PC を再起動しても動き続けるようにします。

macOS なら launchd に登録します。`~/Library/LaunchAgents/jp.techcast.plist` を作ります。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>jp.techcast</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/Users/あなたの名前/techcast/server.js</string>
  </array>
  <key>WorkingDirectory</key><string>/Users/あなたの名前/techcast</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/techcast.log</string>
  <key>StandardErrorPath</key><string>/tmp/techcast.error.log</string>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/jp.techcast.plist
```

Linux なら systemd に登録します。`/etc/systemd/system/techcast.service` を作ります。

```ini
[Unit]
Description=TechCast
After=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/techcast
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now techcast
sudo journalctl -u techcast -f
```

---

## 設定の一覧

`.env` に書けるもの。すべて任意です。

| 変数 | 既定 | 意味 |
|---|---|---|
| `ANTHROPIC_API_KEY` | なし | Claude に台本を書かせる |
| `VOICEVOX_URL` | なし | VOICEVOX の場所。Docker では自動設定 |
| `VOICEVOX_SPEAKER` | 3 | 話者ID。`npm run voices` で調べる |
| `TTS_SPEED` | 1.0 | 読み上げ速度 |
| `TTS_RETRIES` | 3 | 音声生成の再試行回数 |
| `EPISODE_MINUTES` | 10 | 番組の長さ（5 / 10 / 15） |
| `DAILY_HOUR` | 4 | 生成する時刻（時） |
| `DAILY_MINUTE` | 30 | 生成する時刻（分） |
| `DAILY_TIMEZONE` | Asia/Tokyo | 上記の時刻をどの地域で解釈するか |
| `DAILY_ENABLED` | true | `false` で自動生成を止める |
| `DAILY_CATCH_UP` | true | 起動時に取りこぼしを拾うか |
| `PUBLIC_BASE_URL` | 自動 | 購読用フィードに書く URL |
| `TECHCAST_DATA_DIR` | `.techcast-data` | 音声と台本の保存先 |
| `CRON_SECRET` | なし | 外部から叩く入口の保護。公開時は必須 |
| `PORT` | 3000 | 待ち受けポート |
