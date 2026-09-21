#!/usr/bin/env node
// 一発で立ち上げる
// ---------------------------------------------------------------------------
// やることは多くないが、順番を間違えると詰まる。
//   .env を用意する → VOICEVOX とアプリを起動する → 起動を待つ → 1本作って確かめる
// この 4 つを 1 コマンドにまとめて、途中で止まったら何をすればいいかを日本語で出す。
//
//   npm run setup

import { spawn } from 'node:child_process';
import { existsSync, copyFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ポートを .env で変えている場合に、表示する URL も合わせる。
// docker compose は .env を勝手に読むが、このスクリプトは読まないのでここで揃える。
function readPortFromEnvFile() {
  const envPath = path.join(rootDir, '.env');
  if (!existsSync(envPath)) return null;
  try {
    const line = readFileSync(envPath, 'utf8')
      .split('\n')
      .find((l) => /^\s*APP_PORT\s*=/.test(l));
    const value = line?.split('=')[1]?.trim();
    return value && /^\d+$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

const c = {
  bold: (s) => `\u001b[1m${s}\u001b[0m`,
  dim: (s) => `\u001b[2m${s}\u001b[0m`,
  green: (s) => `\u001b[32m${s}\u001b[0m`,
  yellow: (s) => `\u001b[33m${s}\u001b[0m`,
  red: (s) => `\u001b[31m${s}\u001b[0m`,
  cyan: (s) => `\u001b[36m${s}\u001b[0m`
};

function step(n, total, text) {
  console.log(`\n${c.cyan(`[${n}/${total}]`)} ${c.bold(text)}`);
}

function run(command, args, { quiet = false } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: quiet ? 'ignore' : 'inherit',
      shell: false
    });
    child.on('error', () => resolve(1));
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function hasDocker() {
  const version = await run('docker', ['--version'], { quiet: true });
  if (version !== 0) return false;
  // CLI があっても daemon が動いていないことがある。そこまで見ておく。
  const info = await run('docker', ['info'], { quiet: true });
  return info === 0;
}

async function waitForApp(timeoutMs = 240_000) {
  const startedAt = Date.now();
  process.stdout.write('    起動を待っています');
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(`${APP_URL}/api/sources`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        console.log(' ' + c.green('起動しました'));
        return await res.json();
      }
    } catch {
      // まだ起きていない
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 3000));
  }
  console.log('');
  return null;
}

function printNoDocker() {
  console.log(`
${c.yellow('Docker が見つかりませんでした。')}

いちばん簡単なのは Docker を入れる方法です。
  macOS / Windows  https://www.docker.com/products/docker-desktop/
  Linux            curl -fsSL https://get.docker.com | sh

入れたあと、もう一度 ${c.bold('npm run setup')} を実行してください。

${c.dim('Docker を使わない場合:')}
  1. VOICEVOX のアプリ版を入れて起動しておく  https://voicevox.hiroshiba.jp/
  2. .env に VOICEVOX_URL=http://localhost:50021 と書く
  3. npm run build && npm start
`);
}

let APP_PORT = process.env.APP_PORT || '3000';
let APP_URL = `http://localhost:${APP_PORT}`;

async function main() {
  console.log(c.bold('\nTechCast のセットアップ\n'));
  console.log(c.dim('AI・IT業界のニュースを毎朝ポッドキャストにする仕組みを立ち上げます。'));

  const total = 4;

  // --- 1. 設定ファイル ---
  step(1, total, '設定ファイルを用意します');
  const envPath = path.join(rootDir, '.env');
  if (existsSync(envPath)) {
    console.log('    .env はすでにあります。そのまま使います。');
  } else {
    copyFileSync(path.join(rootDir, '.env.example'), envPath);
    console.log(`    .env を作りました ${c.dim('(.env.example をもとにしています)')}`);
  }
  const portFromEnv = readPortFromEnvFile();
  if (portFromEnv) {
    APP_PORT = portFromEnv;
    APP_URL = `http://localhost:${APP_PORT}`;
  }
  console.log(
    c.dim(
      '    台本の質を上げたい場合は、あとで .env の ANTHROPIC_API_KEY に値を入れてください。\n' +
        '    入れなくても番組は作られます。'
    )
  );

  // --- 2. Docker ---
  step(2, total, 'Docker を確認します');
  if (!(await hasDocker())) {
    printNoDocker();
    process.exit(1);
  }
  console.log('    ' + c.green('使えます'));

  // --- 3. 起動 ---
  step(3, total, 'VOICEVOX とアプリを起動します');
  console.log(c.dim('    初回はイメージの取得とビルドで数分かかります。\n'));
  const up = await run('docker', ['compose', 'up', '-d', '--build']);
  if (up !== 0) {
    console.log(`
${c.red('起動に失敗しました。')}

よくある原因:
  ・VOICEVOX のイメージ名が変わっている
    → .env に次の行を足して、もう一度実行してください
       VOICEVOX_IMAGE=voicevox/voicevox_engine:cpu-ubuntu20.04-latest
  ・ポート ${APP_PORT} か 50021 が別のもので埋まっている
    → .env の APP_PORT / VOICEVOX_PORT を変える

詳しいログ:  docker compose logs
`);
    process.exit(1);
  }

  const catalog = await waitForApp();
  if (!catalog) {
    console.log(`
${c.red('アプリが応答しません。')}
  docker compose logs techcast
で何が起きているか見てください。
`);
    process.exit(1);
  }

  // --- 4. 最初の1本 ---
  step(4, total, '今日の番組を1本作って確かめます');
  console.log(c.dim('    記事を集めて台本を書き、音声にします。数分かかります。\n'));
  const made = await run('docker', [
    'compose',
    'exec',
    '-T',
    'techcast',
    'node',
    'scripts/run-daily.mjs',
    '--force'
  ]);

  const tts = catalog?.podcast?.ttsProvider;
  console.log(`
${c.green(c.bold('セットアップ完了'))}

  アプリ          ${c.cyan(APP_URL)}
  購読用フィード  ${c.cyan(`${APP_URL}/api/podcast`)}

  音声合成: ${tts || '未設定'}
  台本:     ${catalog?.claudeConfigured ? 'Claude' : 'テンプレート（ANTHROPIC_API_KEY 未設定）'}

${c.bold('次にやること')}

  1. ${APP_URL} を開いて、再生ボタンを押す
  2. ポッドキャストアプリの「URL で追加」に、上の購読用フィードを貼る
  3. そのまま放っておく。毎朝 4:30 に新しい番組ができます

${c.bold('覚えておくと便利なコマンド')}

  docker compose logs -f techcast              動いているか見る
  docker compose exec techcast node scripts/voicevox-speakers.mjs   声を変える
  docker compose down                          止める
  docker compose up -d                         また動かす
`);

  if (made !== 0) {
    console.log(
      c.yellow(
        '  ※ 最初の1本の作成でエラーが出ています。docker compose logs techcast を見てください。\n'
      )
    );
  }

  if (!catalog?.claudeConfigured) {
    console.log(
      c.dim(
        '  ※ いまはテンプレートで台本を書いています。英語記事の日本語化と、\n' +
          '    ニュース同士のつながりの説明を有効にするには .env に ANTHROPIC_API_KEY を\n' +
          '    入れて docker compose up -d をもう一度実行してください。\n'
      )
    );
  }
}

main().catch((err) => {
  console.error(c.red('\n想定外のエラーです:'), err?.message || err);
  process.exit(1);
});
