// Vercel Serverless Function — Claude photo analysis proxy
// Env var required: ANTHROPIC_API_KEY

export const config = {
  api: {
    bodyParser: { sizeLimit: '6mb' }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
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
  if (base64.length > 7 * 1024 * 1024) {
    res.status(413).json({ error: 'image too large' });
    return;
  }

  var prompt = 'あなたはプロの管理栄養士です。この食事写真を詳細に分析してください。以下のルールに従ってください。\n1. 写真に写っている全ての食品・料理を必ず特定する\n2. 判断が難しい場合でも、最も可能性が高いものを推定して回答する（「不明」「判断できない」は禁止）\n3. 盛り付けの量・器のサイズ・食品の見た目から重量を推定する\n4. 日本食・コンビニ食・外食など一般的な食事を想定してカロリーと栄養素を計算する\n5. 必ずJSON配列のみ返す。説明文・前置き・コードブロック記号は不要\n形式: [{"n":"具体的な食品名","cal":カロリー数値,"p":タンパク質g,"f":脂質g,"c":炭水化物g,"s":"推定量"}]';

  var payload = {
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text', text: prompt }
      ]
    }]
  };

  try {
    var apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });
    var data = await apiRes.json();
    if (!apiRes.ok) {
      res.status(apiRes.status).json({ error: 'upstream error', detail: data });
      return;
    }
    var blocks = data.content || [];
    var text = '';
    for (var i = 0; i < blocks.length; i++) text += blocks[i].text || '';
    var clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      var parsed = JSON.parse(clean);
      if (!Array.isArray(parsed)) {
        res.status(502).json({ error: 'unexpected format' });
        return;
      }
      res.status(200).json({ items: parsed });
    } catch (e) {
      res.status(502).json({ error: 'parse failed', raw: clean });
    }
  } catch (e) {
    res.status(500).json({ error: 'fetch failed', message: String(e) });
  }
}
