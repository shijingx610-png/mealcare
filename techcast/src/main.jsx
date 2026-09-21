import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// サービスワーカーはホーム画面追加とオフライン表示のためだけに使う。
// 開発中はキャッシュが邪魔になり、共有リンク（デモ）では登録先が無いので、
// 自分のサーバーから配られたときだけ登録する。
const isLocalHost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if (
  'serviceWorker' in navigator &&
  import.meta.env.PROD &&
  import.meta.env.VITE_RELATIVE !== 'true' &&
  !isLocalHost
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // 登録できなくてもアプリ自体は動く
    });
  });
}
