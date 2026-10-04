// Vercel Serverless Function — 画像URLの取り込み
// ブラウザから直接よその画像を fetch すると CORS で読めないため、
// サーバー側で取得して data URL にして返す。
// 出品写真そのものではなく、AI解析のテスト用（メルカリの出品写真は自分で撮影したものを使うこと）。

var MAX_BYTES = 8 * 1024 * 1024;
var MAX_REDIRECTS = 3;
var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// 社内ネットワークや localhost への到達を防ぐ
var BLOCKED_HOST = /^(localhost|.*\.local|.*\.internal|\[?::1\]?|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.|0\.)/i;

function checkUrl(raw) {
  var url;
  try {
    url = new URL(raw);
  } catch (parseError) {
    console.warn('[image] invalid url', parseError.message);
    return { error: 'URLの形式が正しくありません' };
  }
  if (url.protocol !== 'https:') return { error: 'httpsで始まる画像URLを指定してください' };
  if (BLOCKED_HOST.test(url.hostname)) return { error: 'このURLは取得できません' };
  return { url: url };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  var body = req.body || {};
  var checked = checkUrl(typeof body.url === 'string' ? body.url.trim() : '');
  if (checked.error) {
    res.status(400).json({ error: checked.error });
    return;
  }

  var target = checked.url.toString();

  try {
    var response = null;
    for (var hop = 0; hop <= MAX_REDIRECTS; hop++) {
      response = await fetch(target, {
        redirect: 'manual',
        headers: {
          // 画像だけを取りに行っていることが分かるようにする
          'Accept': 'image/*',
          'User-Agent': 'mercari-listing-helper/1.0'
        }
      });
      if (response.status < 300 || response.status >= 400) break;
      var location = response.headers.get('location');
      if (!location) break;
      var next = checkUrl(new URL(location, target).toString());
      if (next.error) {
        res.status(400).json({ error: '転送先の画像を取得できませんでした' });
        return;
      }
      target = next.url.toString();
      response = null;
    }

    if (!response || !response.ok) {
      res.status(502).json({ error: '画像を取得できませんでした（' + (response ? response.status : 'リダイレクト過多') + '）。画像を長押しして「画像アドレスをコピー」したURLをお試しください。' });
      return;
    }

    var contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (ALLOWED_TYPES.indexOf(contentType) < 0) {
      res.status(415).json({ error: '画像のURLではないようです（' + (contentType || '不明') + '）' });
      return;
    }

    var length = Number(response.headers.get('content-length') || 0);
    if (length > MAX_BYTES) {
      res.status(413).json({ error: '画像のサイズが大きすぎます' });
      return;
    }

    var buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_BYTES) {
      res.status(413).json({ error: '画像のサイズが大きすぎます' });
      return;
    }

    res.status(200).json({
      dataUrl: 'data:' + contentType + ';base64,' + buffer.toString('base64'),
      mediaType: contentType
    });
  } catch (error) {
    console.error('[image] fetch failed', error);
    res.status(502).json({ error: '画像を取得できませんでした。URLをご確認ください。' });
  }
}
