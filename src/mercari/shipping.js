// 配送方法と送料の目安（2025年時点・出品者負担「送料込み」の料金）
// 料金は改定されることがあるため、アプリ上で手入力の上書きができるようにしている。
// api/listing.js の SHIPPING_IDS と ID を対応させること。

export var SHIPPING_OPTIONS = [
  { id: 'nekopos', label: 'ネコポス', carrier: 'らくらくメルカリ便', fee: 210, material: 0, size: 'A4・厚さ3cm・1kg以内', hint: '本、薄手の衣類、小物' },
  { id: 'yu_packet', label: 'ゆうパケット', carrier: 'ゆうゆうメルカリ便', fee: 230, material: 0, size: 'A4・厚さ3cm・1kg以内', hint: '本、CD、薄手の衣類' },
  { id: 'yu_packet_post', label: 'ゆうパケットポスト', carrier: 'ゆうゆうメルカリ便', fee: 215, material: 5, size: '厚さ3cm・2kg以内', hint: 'ポスト投函で発送できる小物（専用シール5円）' },
  { id: 'compact', label: '宅急便コンパクト', carrier: 'らくらくメルカリ便', fee: 450, material: 70, size: '専用BOX（25×20×5cm）', hint: '厚みのある小物、化粧品、小型家電（専用BOX 70円）' },
  { id: 'yu_packet_plus', label: 'ゆうパケットプラス', carrier: 'ゆうゆうメルカリ便', fee: 455, material: 65, size: '専用箱（24×17×7cm）', hint: '厚みのある小物（専用箱 65円）' },
  { id: 'takkyubin60', label: '宅急便 60サイズ', carrier: 'らくらくメルカリ便', fee: 750, material: 0, size: '3辺合計60cm・2kg以内', hint: 'スニーカー、バッグ、小型の箱物' },
  { id: 'yu_pack60', label: 'ゆうパック 60サイズ', carrier: 'ゆうゆうメルカリ便', fee: 770, material: 0, size: '3辺合計60cm・25kg以内', hint: '重さのある60サイズの荷物' },
  { id: 'takkyubin80', label: '宅急便 80サイズ', carrier: 'らくらくメルカリ便', fee: 850, material: 0, size: '3辺合計80cm・5kg以内', hint: '衣類まとめ、中型の箱物' },
  { id: 'yu_pack80', label: 'ゆうパック 80サイズ', carrier: 'ゆうゆうメルカリ便', fee: 870, material: 0, size: '3辺合計80cm・25kg以内', hint: '重さのある80サイズの荷物' },
  { id: 'takkyubin100', label: '宅急便 100サイズ', carrier: 'らくらくメルカリ便', fee: 1050, material: 0, size: '3辺合計100cm・10kg以内', hint: 'コート、大きめの箱物' },
  { id: 'yu_pack100', label: 'ゆうパック 100サイズ', carrier: 'ゆうゆうメルカリ便', fee: 1070, material: 0, size: '3辺合計100cm・25kg以内', hint: '重さのある100サイズの荷物' },
  { id: 'large', label: '120サイズ以上 / 梱包資材あり', carrier: 'らくらくメルカリ便ほか', fee: 1200, material: 0, size: '3辺合計120cm〜', hint: '大型商品。実際の料金に合わせて送料を上書きしてください' }
];

export var FEE_RATE = 0.1; // メルカリ販売手数料 10%
export var MIN_PRICE = 300;
export var MAX_PRICE = 9999999;

export function findShipping(id) {
  for (var i = 0; i < SHIPPING_OPTIONS.length; i++) {
    if (SHIPPING_OPTIONS[i].id === id) return SHIPPING_OPTIONS[i];
  }
  return SHIPPING_OPTIONS[0];
}

// 手取りの計算。payer が 'buyer'（着払い）のときは送料を負担しない。
export function calcProfit(price, shippingCost, materialCost, payer) {
  var p = Number(price) || 0;
  var fee = Math.floor(p * FEE_RATE);
  var ship = payer === 'buyer' ? 0 : (Number(shippingCost) || 0);
  var material = payer === 'buyer' ? 0 : (Number(materialCost) || 0);
  return {
    price: p,
    fee: fee,
    shipping: ship,
    material: material,
    profit: p - fee - ship - material
  };
}

// 手取りが目標額になる販売価格（送料込み）
export function priceForProfit(targetProfit, shippingCost, materialCost) {
  var target = Number(targetProfit) || 0;
  var cost = (Number(shippingCost) || 0) + (Number(materialCost) || 0);
  return Math.ceil((target + cost) / (1 - FEE_RATE));
}

export function yen(n) {
  var v = Math.round(Number(n) || 0);
  var sign = v < 0 ? '-' : '';
  return sign + String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '円';
}
