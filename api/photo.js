// Vercel Serverless Function — Claude photo analysis proxy
// Env var required: ANTHROPIC_API_KEY
import Anthropic from '@anthropic-ai/sdk';

export const config = {
  api: {
    bodyParser: { sizeLimit: '6mb' }
  }
};

var MODEL = 'claude-opus-5-5';
var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

var RULES = 'あなたは日本の食事に詳しい管理栄養士です。食事のカロリーとPFC（たんぱく質・脂質・炭水化物）を、できるだけ正確に推定してください。\n'
  + '\n手順:\n'
  + '1. 食品・料理をすべて特定する。定食やセットは「ごはん」「味噌汁」「主菜」のように1品ずつ分ける\n'
  + '2. 1品ずつ重量（g）を見積もる。器の大きさを手がかりにする（茶碗のごはん約150g、丼のごはん約250g、味噌汁約180g、ラーメン1杯約600g、小鉢約70g、取り皿の直径約15cm、箸の長さ約23cm）\n'
  + '3. 日本食品標準成分表（八訂）の100gあたりの値を基準に、重量から計算する。揚げ物の衣と吸油、炒め油、ドレッシング、ソース、マヨネーズなど見落としやすい油脂・調味料も含める\n'
  + '4. コンビニ商品・チェーン店のメニューと分かる場合は、その商品の一般的な栄養成分表示の値を優先する\n'
  + '\n出力:\n'
  + '- n は具体的な料理名（例：「鶏の唐揚げ」「白米ごはん」）\n'
  + '- g は推定重量（グラム）、s は「約150g」「1杯」「5個」のような量の表示\n'
  + '- cal は kcal、p/f/c はグラム。迷ったときは少なめに見積もらず、最も可能性が高い値にする\n'
  + '- 食べ物が含まれない場合は items を空配列にする';

var PHOTO_PROMPT = 'この食事写真を分析してください。';
var TEXT_PROMPT = '次の食事の内容から推定してください（写真はありません）。量の指定がなければ一般的な1人前とする。\n食事: ';

var SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          n: { type: 'string' },
          g: { type: 'number' },
          cal: { type: 'number' },
          p: { type: 'number' },
          f: { type: 'number' },
          c: { type: 'number' },
          s: { type: 'string' }
        },
        required: ['n', 'g', 'cal', 'p', 'f', 'c', 's'],
        additionalProperties: false
      }
    }
  },
  required: ['items'],
  additionalProperties: false
};

function clampNum(v, max) {
  var n = Number(v);
  if (!isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

export function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter(function (it) { return it && typeof it.n === 'string' && it.n.trim(); })
    .slice(0, 15)
    .map(function (it) {
      return {
        n: it.n.trim().slice(0, 40),
        g: Math.round(clampNum(it.g, 3000)),
        cal: Math.round(clampNum(it.cal, 5000)),
        p: Math.round(clampNum(it.p, 500) * 10) / 10,
        f: Math.round(clampNum(it.f, 500) * 10) / 10,
        c: Math.round(clampNum(it.c, 1000) * 10) / 10,
        s: typeof it.s === 'string' ? it.s.slice(0, 30) : ''
      };
    });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: 'API key not configured' });
    return;
  }
  var body = req.body || {};
  var base64 = body.base64;
  var mediaType = body.mediaType || 'image/jpeg';
  var text = typeof body.text === 'string' ? body.text.trim().slice(0, 300) : '';
  var hint = typeof body.hint === 'string' ? body.hint.trim().slice(0, 200) : '';
  var content;
  if (base64) {
    if (typeof base64 !== 'string') {
      res.status(400).json({ error: 'base64 must be a string' });
      return;
    }
    if (ALLOWED_TYPES.indexOf(mediaType) < 0) {
      res.status(415).json({ error: 'unsupported image type' });
      return;
    }
    // Claude API の画像上限は 5MB（base64 で約 6.7MB）
    if (base64.length > 6.5 * 1024 * 1024) {
      res.status(413).json({ error: 'image too large' });
      return;
    }
    content = [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
      { type: 'text', text: PHOTO_PROMPT + (hint ? '\n食べた人からの補足（優先して反映する）: ' + hint : '') }
    ];
  } else if (text) {
    content = [{ type: 'text', text: TEXT_PROMPT + text }];
  } else {
    res.status(400).json({ error: 'base64 or text is required' });
    return;
  }

  var client = new Anthropic();
  try {
    var response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: RULES,
      output_config: {
        // 写真は量の見積もりに考える時間をかけたほうが精度が上がる
        effort: base64 ? 'high' : 'medium',
        format: { type: 'json_schema', schema: SCHEMA }
      },
      messages: [{ role: 'user', content: content }]
    });
    if (response.stop_reason === 'refusal') {
      res.status(422).json({ error: 'refused' });
      return;
    }
    var out = '';
    response.content.forEach(function (b) { if (b.type === 'text') out += b.text; });
    var parsed;
    try {
      parsed = JSON.parse(out);
    } catch (e) {
      res.status(502).json({ error: 'parse failed', message: String(e) });
      return;
    }
    var items = normalizeItems(parsed && parsed.items);
    if (items.length === 0) {
      res.status(422).json({ error: 'no food detected' });
      return;
    }
    res.status(200).json({ items: items });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: 'rate limited' });
    } else if (e instanceof Anthropic.APIError) {
      console.error('[photo] upstream error', e.status, e.message);
      res.status(502).json({ error: 'upstream error' });
    } else {
      console.error('[photo] failed', e);
      res.status(500).json({ error: 'request failed' });
    }
  }
}
