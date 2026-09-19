import React, { useRef, useState } from 'react';

const DURATIONS = [
  { value: 5, label: '5分', hint: '駅まで歩く間' },
  { value: 10, label: '10分', hint: '通勤の片道' },
  { value: 15, label: '15分', hint: 'じっくり' }
];

export default function SettingsView({
  settings,
  catalog,
  voices,
  learnedTerms,
  onChange,
  onVoiceChange,
  mediaSessionSupported,
  wakeLockSupported,
  onExport,
  onImport
}) {
  const fileRef = useRef(null);
  const [importError, setImportError] = useState(null);

  const weights = settings.interestWeights || {};
  const japaneseVoices = voices.filter((v) => (v.lang || '').toLowerCase().startsWith('ja'));

  function setWeight(tagId, value) {
    const base = catalog
      ? Object.fromEntries(catalog.tags.map((t) => [t.id, t.defaultWeight]))
      : {};
    onChange({ interestWeights: { ...base, ...weights, [tagId]: value } });
  }

  function handleExport() {
    const data = onExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techcast-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      onImport(JSON.parse(text));
    } catch (err) {
      setImportError(`読み込めませんでした：${err.message}`);
    } finally {
      event.target.value = '';
    }
  }

  return (
    <section className="settings">
      <h2>設定</h2>

      <fieldset>
        <legend>番組の長さ</legend>
        <div className="duration-row">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              className={settings.durationMin === d.value ? 'duration duration-active' : 'duration'}
              onClick={() => onChange({ durationMin: d.value })}
            >
              <strong>{d.label}</strong>
              <span>{d.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>記事の鮮度</legend>
        <label className="range-row">
          <span>
            {settings.maxAgeHours} 時間以内の記事を対象にする
          </span>
          <input
            type="range"
            min="12"
            max="72"
            step="6"
            value={settings.maxAgeHours}
            onChange={(e) => onChange({ maxAgeHours: Number(e.target.value) })}
          />
        </label>
        <p className="hint">
          週末や祝日はニュースが減ります。土日に聞くなら 48 時間以上にしておくと番組が痩せません。
        </p>
      </fieldset>

      <fieldset>
        <legend>台本の書き手</legend>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={settings.useClaude}
            onChange={(e) => onChange({ useClaude: e.target.checked })}
          />
          <span>Claude に台本を書かせる</span>
        </label>
        <p className="hint">
          {catalog?.claudeConfigured
            ? 'APIキーが設定されています。英語記事の日本語化と、ニュース同士のつながりの説明が有効になります。'
            : 'サーバーに ANTHROPIC_API_KEY が設定されていません。現在はテンプレートで生成されます。'}
        </p>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={settings.autoGenerateOnOpen}
            onChange={(e) => onChange({ autoGenerateOnOpen: e.target.checked })}
          />
          <span>アプリを開いたとき、その日の番組がなければ自動で作る</span>
        </label>
      </fieldset>

      <fieldset>
        <legend>再生</legend>
        <label className="range-row">
          <span>読み上げ速度 {settings.rate.toFixed(2)} 倍</span>
          <input
            type="range"
            min="0.8"
            max="2"
            step="0.05"
            value={settings.rate}
            onChange={(e) => onChange({ rate: Number(e.target.value) })}
          />
        </label>
        <label className="select-row">
          <span>音声</span>
          <select value={settings.voiceURI || ''} onChange={(e) => onVoiceChange(e.target.value)}>
            <option value="">自動で選ぶ</option>
            {(japaneseVoices.length ? japaneseVoices : voices).map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name}（{v.lang}）
              </option>
            ))}
          </select>
        </label>
        {japaneseVoices.length === 0 && (
          <p className="hint">
            日本語の音声が見つかりませんでした。OS の音声パックを追加すると聞き取りやすくなります。
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>スマホで聞く</legend>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={settings.keepScreenAwake}
            onChange={(e) => onChange({ keepScreenAwake: e.target.checked })}
          />
          <span>再生中は画面を消さない</span>
        </label>
        <p className="hint">
          ブラウザの読み上げは、画面が消えると止まる端末があります。
          最後まで聞き切るにはこれを入れておくのが確実です。そのぶん電池は減ります。
          {!wakeLockSupported && ' このブラウザはこの機能に対応していないため、設定しても効きません。'}
        </p>
        <p className="hint">
          {mediaSessionSupported
            ? 'ロック画面とイヤホンのボタンから、再生・停止・コーナー送りができます。'
            : 'このブラウザはロック画面からの操作に対応していません。'}
        </p>
        <p className="hint">
          ホーム画面に追加すると、アプリのように開けてオフラインでも過去の番組を聞けます。
          iOS は共有メニューから、Android はメニューから追加できます。
        </p>
      </fieldset>

      {catalog && (
        <fieldset>
          <legend>興味の重み</legend>
          <p className="hint">
            大きくしたトピックが選ばれやすくなります。転職先として狙う領域を上げておくと、
            毎朝の内容が自分ごとに寄っていきます。
          </p>
          <div className="weights">
            {catalog.tags.map((tag) => {
              const value = weights[tag.id] ?? tag.defaultWeight;
              return (
                <label key={tag.id} className="weight-row">
                  <span className="weight-label">{tag.label}</span>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={value}
                    onChange={(e) => setWeight(tag.id, Number(e.target.value))}
                  />
                  <span className="weight-value">{value.toFixed(1)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {catalog?.podcast && (
        <fieldset>
          <legend>ポッドキャストアプリで聞く</legend>
          {catalog.podcast.ttsProvider ? (
            <>
              <p className="hint">
                音声合成が設定されています（{catalog.podcast.ttsProvider}）。
                下の URL を普段のポッドキャストアプリに登録すると、毎朝の番組がそちらに届きます。
                ロック画面もバックグラウンド再生もオフラインも、アプリ側の機能で手に入ります。
              </p>
              <p className="feed-url">
                <code>{catalog.podcast.feedUrl}</code>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(catalog.podcast.feedUrl)}
                >
                  コピー
                </button>
              </p>
              <p className="hint">
                配信できる回：{catalog.podcast.episodesWithAudio} 本。
                毎朝の自動生成を動かしていないと増えません。
              </p>
            </>
          ) : (
            <p className="hint">
              音声合成が未設定のため、いまはこのアプリ内での読み上げのみです。
              VOICEVOX か Google Cloud TTS を設定すると、音声ファイルが作られ、
              ポッドキャストアプリから購読できるようになります。手順は README に書いてあります。
            </p>
          )}
        </fieldset>
      )}

      <fieldset>
        <legend>データ</legend>
        <p className="hint">
          覚えた用語 {learnedTerms.length} 件。設定と番組はこの端末にだけ保存されています。
          別の端末で使うときは書き出して読み込んでください。
        </p>
        <div className="data-row">
          <button type="button" onClick={handleExport}>
            書き出す
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}>
            読み込む
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            hidden
          />
        </div>
        {importError && <div className="banner banner-error">{importError}</div>}
      </fieldset>
    </section>
  );
}
