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

var PROMPT = 'あなたはプロの管理栄養士です。この食事写真を分析し、写っている食品・料理ごとにカロリーとPFCを推定してください。\n'
  + '- 写っている食品・料理はすべて挙げる。判断が難しくても、最も可能性が高いものを推定する\n'
  + '- 盛り付けの量・器のサイズ・見た目から重量を推定し、s に「約200g」「1杯」のように書く\n'
  + '- 日本の家庭料理・コンビニ食・外食の一般的な値を基準にする\n'
  + '- n は具体的な料理名（例：「鶏の唐揚げ」「白米」）、cal は kcal、p/f/c はグラム\n'
  + '- 食べ物が写っていない場合は items を空配列にする';

var SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          n: { type: 'string' },
          cal: { type: 'number' },
          p: { type: 'number' },
          f: { type: 'number' },
          c: { type: 'number' },
          s: { type: 'string' }
        },
        required: ['n', 'cal', 'p', 'f', 'c', 's'],
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
  if (!base64 || typeof base64 !== 'string') {
    res.status(400).json({ error: 'base64 is required' });
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

  var client = new Anthropic();
  try {
    var response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: SCHEMA }
      },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: PROMPT }
        ]
      }]
    });
    if (response.stop_reason === 'refusal') {
      res.status(422).json({ error: 'refused' });
      return;
    }
    var text = '';
    response.content.forEach(function (b) { if (b.type === 'text') text += b.text; });
    var parsed;
    try {
      parsed = JSON.parse(text);
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
