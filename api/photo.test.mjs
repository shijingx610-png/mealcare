// node --test api/photo.test.mjs
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import handler, { normalizeItems } from './photo.js';

function mockRes() {
  return {
    statusCode: 0, body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; }
  };
}

var realFetch = globalThis.fetch;
var lastRequest = null;
function fakeClaude(payload, stopReason) {
  globalThis.fetch = async function (url, init) {
    lastRequest = { url: String(url), body: JSON.parse(init.body) };
    return new Response(JSON.stringify({
      id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5-5',
      content: [{ type: 'text', text: JSON.stringify(payload) }],
      stop_reason: stopReason || 'end_turn', stop_details: null,
      usage: { input_tokens: 10, output_tokens: 10 }
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
}

beforeEach(function () { process.env.ANTHROPIC_API_KEY = 'test-key'; lastRequest = null; });
afterEach(function () { globalThis.fetch = realFetch; });

test('normalizeItems は数値を丸めて不正値を落とす', function () {
  var out = normalizeItems([
    { n: ' 白米 ', cal: 252.4, p: 3.84, f: -1, c: 'x', s: '150g' },
    { n: '', cal: 100 },
    null
  ]);
  assert.deepEqual(out, [{ n: '白米', cal: 252, p: 3.8, f: 0, c: 0, s: '150g' }]);
});

test('写真を送ると食品リストを返し、新しいモデルと構造化出力でリクエストする', async function () {
  fakeClaude({ items: [{ n: '鶏の唐揚げ', cal: 300, p: 18, f: 20, c: 10, s: '4個' }] });
  var res = mockRes();
  await handler({ method: 'POST', body: { base64: 'AAAA', mediaType: 'image/jpeg' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.items[0].n, '鶏の唐揚げ');
  assert.equal(lastRequest.body.model, 'claude-opus-5-5');
  assert.equal(lastRequest.body.output_config.format.type, 'json_schema');
  assert.equal(lastRequest.body.fallbacks, 'default');
});

test('食べ物が見つからないときは 422', async function () {
  fakeClaude({ items: [] });
  var res = mockRes();
  await handler({ method: 'POST', body: { base64: 'AAAA', mediaType: 'image/jpeg' } }, res);
  assert.equal(res.statusCode, 422);
});

test('対応していない画像形式は 415', async function () {
  var res = mockRes();
  await handler({ method: 'POST', body: { base64: 'AAAA', mediaType: 'image/heic' } }, res);
  assert.equal(res.statusCode, 415);
});

test('GET は 405', async function () {
  var res = mockRes();
  await handler({ method: 'GET' }, res);
  assert.equal(res.statusCode, 405);
});
