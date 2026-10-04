// 食品データベースの読み込みと検索
import basic from './basic.js';
import dishes from './dishes.js';
import store from './store.js';
import extra from './extra.js';

// 行を { id, n, alias, s, g, cal, p, f, c, cat } に変換する
export function parseFoods(text, prefix) {
  var out = [];
  var cat = '';
  text.split('\n').forEach(function (raw, i) {
    var line = raw.trim();
    if (!line) return;
    if (line[0] === '#') { cat = line.slice(1); return; }
    var cols = line.split('|');
    if (cols.length !== 8) throw new Error('foods: 列数が不正 (' + prefix + ':' + (i + 1) + ') ' + line);
    out.push({
      id: prefix + i,
      n: cols[0],
      alias: cols[1],
      s: cols[2],
      g: +cols[3],
      cal: +cols[4],
      p: +cols[5],
      f: +cols[6],
      c: +cols[7],
      cat: cat
    });
  });
  return out;
}

export var FOODS = [].concat(
  parseFoods(basic, 'b'),
  parseFoods(dishes, 'd'),
  parseFoods(store, 's'),
  parseFoods(extra, 'x')
);

// カタカナ→ひらがな、全角英数→半角、小文字化、空白除去
export function normalize(str) {
  return String(str || '')
    .replace(/[ァ-ヶ]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) - 0x60); })
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (ch) { return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0); })
    .toLowerCase()
    .replace(/[\s\u3000・]/g, '');
}

var INDEX = null;
function buildIndex(foods) {
  return foods.map(function (f) {
    return { food: f, name: normalize(f.n), alias: normalize(f.alias), cat: normalize(f.cat) };
  });
}

// スペース区切りの各語がすべて名前・別名・カテゴリのどこかに含まれるものを返す
export function searchFoods(query, extra, limit) {
  var words = String(query || '').split(/[\s\u3000]+/).map(normalize).filter(Boolean);
  if (words.length === 0) return [];
  if (!INDEX) INDEX = buildIndex(FOODS);
  var pool = extra && extra.length ? buildIndex(extra).concat(INDEX) : INDEX;
  var scored = [];
  pool.forEach(function (e) {
    var score = 0;
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      var pos = e.name.indexOf(w);
      if (pos === 0) score += 30;
      else if (pos > 0) score += 20;
      else if (e.alias.indexOf(w) >= 0) score += 10;
      else if (e.cat.indexOf(w) >= 0) score += 5;
      else return;
    }
    if (e.name === words.join('')) score += 50;
    score -= e.name.length * 0.2;
    scored.push({ food: e.food, score: score });
  });
  scored.sort(function (a, b) { return b.score - a.score; });
  return scored.slice(0, limit || 40).map(function (x) { return x.food; });
}

// 量を変えたときの栄養値（g 指定）
export function scaleFood(food, grams) {
  var base = food.g || 100;
  var r = grams / base;
  function round1(v) { return Math.round(v * r * 10) / 10; }
  return {
    n: food.n,
    s: grams + 'g',
    g: grams,
    cal: Math.round(food.cal * r),
    p: round1(food.p),
    f: round1(food.f),
    c: round1(food.c)
  };
}
