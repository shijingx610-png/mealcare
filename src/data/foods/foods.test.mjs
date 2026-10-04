// node --test src/data/foods/foods.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FOODS, searchFoods, normalize, scaleFood } from './index.js';

test('データは十分な件数があり、すべての数値が正しい', function () {
  assert.ok(FOODS.length >= 900, '件数: ' + FOODS.length);
  FOODS.forEach(function (f) {
    ['g', 'cal', 'p', 'f', 'c'].forEach(function (k) {
      assert.ok(Number.isFinite(f[k]) && f[k] >= 0, f.n + ' の ' + k + ' が不正: ' + f[k]);
    });
    assert.ok(f.g > 0, f.n + ' のグラムが 0');
  });
});

test('同じ名前の食品が重複していない', function () {
  var seen = {};
  FOODS.forEach(function (f) {
    assert.ok(!seen[f.n], '重複: ' + f.n);
    seen[f.n] = true;
  });
});

// 成分表（八訂）は食物繊維・糖アルコールを別係数で計算するため、野菜・いも・果物は簡易式とずれる
var SKIP_CATS = ['お酒', '野菜', 'きのこ・海藻', '果物'];
test('カロリーが PFC から計算した値と大きくずれていない（お酒・野菜などは除く）', function () {
  var bad = FOODS.filter(function (f) {
    if (SKIP_CATS.indexOf(f.cat) >= 0 || f.cal < 30) return false;
    var est = f.p * 4 + f.f * 9 + f.c * 4;
    return Math.abs(est - f.cal) / f.cal > 0.3;
  }).map(function (f) { return f.n + '(' + f.cal + ' vs ' + Math.round(f.p * 4 + f.f * 9 + f.c * 4) + ')'; });
  assert.deepEqual(bad, []);
});

test('ひらがな・カタカナ・別名のどれでも見つかる', function () {
  assert.equal(normalize('カラアゲ'), 'からあげ');
  assert.ok(searchFoods('からあげ').some(function (f) { return f.n.indexOf('唐揚げ') >= 0; }));
  assert.ok(searchFoods('マック ポテト').some(function (f) { return f.n === 'フライドポテト M'; }));
  assert.ok(searchFoods('すき家').length > 0);
  assert.equal(searchFoods('鶏むね肉 皮なし')[0].n, '鶏むね肉 皮なし');
});

test('グラムを変えると比例して計算される', function () {
  var rice = FOODS.find(function (f) { return f.n === '白米ごはん'; });
  var s = scaleFood(rice, 300);
  assert.equal(s.cal, rice.cal * 2);
  assert.equal(s.s, '300g');
});
