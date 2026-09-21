// .env の読み込み
// ---------------------------------------------------------------------------
// 手順書には「.env に書いてから npm start」と書いてある。
// ところが Node は .env を勝手には読まない。Vite の開発サーバーは読むので、
// 「dev では効くのに start では効かない」という一番たちの悪いズレが起きる。
// ここで揃えておく。
//
// 既に環境変数として入っているものは上書きしない（Docker の env_file や
// docker compose の environment のほうが強い、という直感に合わせる）。

import { existsSync } from 'node:fs';

export function loadEnvFile(file = '.env') {
  if (!existsSync(file)) return false;
  try {
    // Node 20.6 以降に入っている。同名の値がすでにあっても上書きはされない。
    process.loadEnvFile(file);
    return true;
  } catch {
    return false;
  }
}
