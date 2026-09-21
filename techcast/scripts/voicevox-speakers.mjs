#!/usr/bin/env node
// VOICEVOX の話者一覧を出す
// ---------------------------------------------------------------------------
// 「どの声にするか」を選ぶには、まず何が使えるかを見ないと決められない。
// engine を立てたあと、これを実行して好みの ID を .env に書く。
//
//   node scripts/voicevox-speakers.mjs
//   node scripts/voicevox-speakers.mjs http://localhost:50021

const { loadEnvFile } = await import('../server/load-env.js');
loadEnvFile('.env');

const baseUrl = (process.argv[2] || process.env.VOICEVOX_URL || 'http://localhost:50021').replace(
  /\/+$/,
  ''
);

try {
  const res = await fetch(`${baseUrl}/speakers`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    console.error(`VOICEVOX が ${res.status} を返しました: ${baseUrl}/speakers`);
    process.exit(1);
  }

  const speakers = await res.json();
  console.log(`VOICEVOX の話者一覧（${baseUrl}）\n`);

  for (const speaker of speakers) {
    console.log(`■ ${speaker.name}`);
    for (const style of speaker.styles || []) {
      console.log(`    ID ${String(style.id).padStart(3)}  ${style.name}`);
    }
    console.log('');
  }

  console.log('気に入った ID を .env に書いてください:');
  console.log('  VOICEVOX_SPEAKER=3');
  console.log('\nニュースの読み上げなら、落ち着いた「ノーマル」系が聞きやすいです。');
} catch (err) {
  console.error(`VOICEVOX に接続できません: ${baseUrl}`);
  console.error(String(err?.message || err));
  console.error('\nengine が動いているか確認してください:');
  console.error('  docker compose ps');
  console.error('  curl http://localhost:50021/version');
  process.exit(1);
}
