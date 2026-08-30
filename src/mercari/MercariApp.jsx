import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SHIPPING_OPTIONS, FEE_RATE, MIN_PRICE, findShipping, calcProfit, priceForProfit, yen } from './shipping';
import { CONDITIONS, buildDescription, emptyListing, SAMPLE_LISTING } from './listing';

// palette
var BG = '#0f172a', CARD = '#1e293b', LINE = '#334155', SUB = '#94a3b8', SUB2 = '#cbd5e1';
var RED = '#ff4b3a', OK = '#22c55e', WARN = '#f59e0b';

var MAX_PHOTOS = 6;
var DRAFT_KEY = 'mp_drafts_v1';

// ---------- utils ----------
function mkId() { return Math.random().toString(36).slice(2, 9); }

function readDrafts() {
  try {
    var raw = localStorage.getItem(DRAFT_KEY);
    var list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn('[drafts] read failed', e);
    return [];
  }
}

function writeDrafts(list) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(list.slice(0, 30)));
  } catch (e) {
    console.warn('[drafts] write failed', e);
  }
}

// 写真を縮小して base64 にする（API のサイズ上限対策）
function compressImage(file, maxEdge, quality) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onerror = function () { reject(new Error('画像を読み込めませんでした')); };
    reader.onload = function (ev) {
      var img = new Image();
      img.onerror = function () { reject(new Error('画像を読み込めませんでした')); };
      img.onload = function () {
        var scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        var w = Math.max(1, Math.round(img.width * scale));
        var h = Math.max(1, Math.round(img.height * scale));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        var dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ dataUrl: dataUrl, base64: dataUrl.split(',')[1], mediaType: 'image/jpeg' });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise(function (resolve, reject) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

// ---------- 小さな部品 ----------
function Card(props) {
  return (
    <div style={Object.assign({ background: CARD, borderRadius: 14, padding: 16, marginBottom: 12 }, props.style || {})}>
      {props.children}
    </div>
  );
}

function Label(props) {
  return (
    <div style={{ color: SUB, fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: 0.4 }}>
      {props.children}
    </div>
  );
}

function Field(props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>{props.label}</Label>
      <input
        value={props.value}
        onChange={function (e) { props.onChange(e.target.value); }}
        placeholder={props.placeholder || ''}
        inputMode={props.inputMode}
        style={{
          width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + LINE,
          borderRadius: 10, color: '#fff', padding: '10px 12px', fontSize: 14, outline: 'none'
        }}
      />
      {props.hint ? <div style={{ color: SUB, fontSize: 11, marginTop: 4 }}>{props.hint}</div> : null}
    </div>
  );
}

function Btn(props) {
  var bg = props.kind === 'ghost' ? 'transparent' : props.kind === 'sub' ? LINE : RED;
  var color = props.kind === 'sub' ? '#fff' : props.kind === 'ghost' ? SUB2 : '#fff';
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      style={Object.assign({
        background: props.disabled ? '#475569' : bg,
        color: color,
        border: props.kind === 'ghost' ? '1px solid ' + LINE : 'none',
        borderRadius: 10,
        padding: props.big ? '14px 20px' : '9px 14px',
        fontSize: props.big ? 15 : 13,
        fontWeight: 700,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        width: props.full ? '100%' : 'auto'
      }, props.style || {})}
    >
      {props.children}
    </button>
  );
}

function CopyBtn(props) {
  var [done, setDone] = useState(false);
  return (
    <Btn
      kind="sub"
      onClick={function () {
        copyText(props.text).then(function () {
          setDone(true);
          setTimeout(function () { setDone(false); }, 1500);
        }).catch(function () {
          window.prompt('コピーできませんでした。手動でコピーしてください', props.text);
        });
      }}
      style={props.style}
    >
      {done ? '✓ コピーしました' : props.label}
    </Btn>
  );
}

// ---------- 写真選択画面 ----------
function InputScreen(props) {
  var photos = props.photos;
  var fileRef = useRef(null);

  function onFiles(e) {
    var files = e.target.files;
    if (!files || files.length === 0) return;
    var room = MAX_PHOTOS - photos.length;
    var picked = Array.prototype.slice.call(files, 0, room);
    var jobs = picked.map(function (f) { return compressImage(f, 1024, 0.72); });
    Promise.all(jobs).then(function (results) {
      props.onAddPhotos(results.map(function (r) { return { id: mkId(), dataUrl: r.dataUrl, base64: r.base64, mediaType: r.mediaType }; }));
    }).catch(function (err) {
      props.onError(err.message || '画像の読み込みに失敗しました');
    });
    e.target.value = '';
  }

  return (
    <div>
      <Card>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>1. 商品の写真を追加</div>
        <div style={{ color: SUB, fontSize: 12, marginBottom: 12 }}>
          全体・正面・ブランドタグ・傷がある部分、の順で撮ると精度が上がります（最大{MAX_PHOTOS}枚）
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
          {photos.map(function (p, i) {
            return (
              <div key={p.id} style={{ position: 'relative', paddingTop: '100%', borderRadius: 10, overflow: 'hidden', background: BG }}>
                <img src={p.dataUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                {i === 0 ? (
                  <div style={{ position: 'absolute', left: 4, top: 4, background: RED, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>メイン</div>
                ) : null}
                <button
                  onClick={function () { props.onRemovePhoto(p.id); }}
                  style={{ position: 'absolute', right: 4, top: 4, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: 999, width: 22, height: 22, cursor: 'pointer', fontSize: 12 }}
                >✕</button>
              </div>
            );
          })}
          {photos.length < MAX_PHOTOS ? (
            <button
              onClick={function () { fileRef.current.click(); }}
              style={{ paddingTop: '100%', position: 'relative', background: BG, border: '2px dashed ' + LINE, borderRadius: 10, cursor: 'pointer' }}
            >
              <span style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: SUB, fontSize: 12 }}>
                <span style={{ fontSize: 24 }}>＋</span>写真を追加
              </span>
            </button>
          ) : null}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onFiles} />
      </Card>

      <Card>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>2. 分かる範囲でメモ（任意）</div>
        <div style={{ color: SUB, fontSize: 12, marginBottom: 10 }}>
          購入時期、定価、使用回数、付属品の有無など。書くほど説明文と価格が正確になります。
        </div>
        <textarea
          value={props.note}
          onChange={function (e) { props.onNoteChange(e.target.value); }}
          placeholder="例: 3年前に楽天で15,000円で購入。10回ほど着用。箱と保証書あり。袖口に小さなシミあり。"
          rows={4}
          style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + LINE, borderRadius: 10, color: '#fff', padding: 12, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
        />
      </Card>

      <Btn big full disabled={photos.length === 0} onClick={props.onAnalyze}>
        ✨ AIで出品情報をつくる
      </Btn>
      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <button onClick={props.onSample} style={{ background: 'none', border: 'none', color: SUB, fontSize: 12, textDecoration: 'underline', cursor: 'pointer' }}>
          サンプルデータで画面を見る
        </button>
      </div>
    </div>
  );
}

// ---------- 価格カード ----------
function PricePanel(props) {
  var listing = props.listing;
  var ship = findShipping(props.shippingId);
  var shippingCost = props.shippingOverride === '' ? ship.fee : Number(props.shippingOverride) || 0;
  var materialCost = props.shippingOverride === '' ? ship.material : 0;
  var calc = calcProfit(props.price, shippingCost, materialCost, props.payer);
  var lo = Math.max(MIN_PRICE, Math.min(listing.priceMin, listing.priceMax));
  var hi = Math.max(lo + 100, listing.priceMax);
  var sliderMin = Math.max(MIN_PRICE, Math.floor(lo * 0.7));
  var sliderMax = Math.ceil(hi * 1.4);

  return (
    <Card>
      <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 10 }}>💰 価格設定</div>

      <div style={{ background: BG, borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ color: SUB, fontSize: 11, fontWeight: 700 }}>AIが見た相場</span>
          <span style={{ color: SUB2, fontSize: 13, fontWeight: 700 }}>{yen(lo)} 〜 {yen(hi)}</span>
        </div>
        <div style={{ color: SUB, fontSize: 12, lineHeight: 1.6 }}>{listing.priceReason}</div>
      </div>

      <Label>販売価格（メルカリに入力する金額）</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <input
          value={props.price}
          onChange={function (e) { props.onPriceChange(e.target.value.replace(/[^0-9]/g, '')); }}
          inputMode="numeric"
          style={{ flex: 1, boxSizing: 'border-box', background: BG, border: '1px solid ' + LINE, borderRadius: 10, color: '#fff', padding: '12px', fontSize: 22, fontWeight: 800, outline: 'none' }}
        />
        <span style={{ color: SUB2, fontSize: 16, fontWeight: 700 }}>円</span>
      </div>
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={50}
        value={Math.min(sliderMax, Math.max(sliderMin, Number(props.price) || sliderMin))}
        onChange={function (e) { props.onPriceChange(e.target.value); }}
        style={{ width: '100%', accentColor: RED, marginBottom: 8 }}
      />
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { l: '相場の下限', v: lo },
          { l: 'AIのおすすめ', v: listing.priceRecommended },
          { l: '相場の上限', v: hi }
        ].map(function (b) {
          return (
            <button key={b.l} onClick={function () { props.onPriceChange(String(b.v)); }}
              style={{ flex: 1, background: Number(props.price) === b.v ? RED : LINE, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 4px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {b.l}<br />{yen(b.v)}
            </button>
          );
        })}
      </div>

      <div style={{ background: BG, borderRadius: 10, padding: 12 }}>
        {[
          { l: '販売価格', v: calc.price, sign: '' },
          { l: '販売手数料（' + Math.round(FEE_RATE * 100) + '%）', v: -calc.fee, sign: '-' },
          { l: '送料（' + (props.payer === 'buyer' ? '着払い・購入者負担' : ship.label) + '）', v: -calc.shipping, sign: '-' }
        ].concat(calc.material > 0 ? [{ l: '梱包資材（専用箱など）', v: -calc.material, sign: '-' }] : []).map(function (row) {
          return (
            <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: SUB2, marginBottom: 6 }}>
              <span>{row.l}</span><span>{yen(row.v)}</span>
            </div>
          );
        })}
        <div style={{ height: 1, background: LINE, margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>手元に残る金額</span>
          <span style={{ color: calc.profit > 0 ? OK : RED, fontWeight: 800, fontSize: 20 }}>{yen(calc.profit)}</span>
        </div>
        {calc.profit <= 0 ? (
          <div style={{ color: RED, fontSize: 11, marginTop: 6 }}>手数料と送料で赤字です。価格を上げるか、送料の安い配送方法を選んでください。</div>
        ) : null}
        {Number(props.price) < MIN_PRICE ? (
          <div style={{ color: WARN, fontSize: 11, marginTop: 6 }}>メルカリの最低価格は{MIN_PRICE}円です。</div>
        ) : null}
      </div>

      <div style={{ marginTop: 12 }}>
        <Label>手取りから逆算する</Label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1000, 3000, 5000, 10000].map(function (t) {
            return (
              <button key={t} onClick={function () { props.onPriceChange(String(priceForProfit(t, shippingCost, materialCost))); }}
                style={{ flex: 1, background: LINE, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 2px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {yen(t)}残す
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

// ---------- 配送カード ----------
function ShippingPanel(props) {
  var ship = findShipping(props.shippingId);
  return (
    <Card>
      <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 10 }}>📮 配送方法</div>
      <select
        value={props.shippingId}
        onChange={function (e) { props.onShippingChange(e.target.value); }}
        style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + LINE, borderRadius: 10, color: '#fff', padding: '10px 12px', fontSize: 14, marginBottom: 8 }}
      >
        {SHIPPING_OPTIONS.map(function (o) {
          return <option key={o.id} value={o.id}>{o.carrier} / {o.label} — {yen(o.fee + o.material)}</option>;
        })}
      </select>
      <div style={{ color: SUB, fontSize: 12, marginBottom: 10, lineHeight: 1.6 }}>
        {ship.size} ・ {ship.hint}<br />
        AIの梱包サイズ予想: {props.listing.estimatedSize || '不明'}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {[{ id: 'seller', l: '送料込み（出品者負担）' }, { id: 'buyer', l: '着払い（購入者負担）' }].map(function (o) {
          return (
            <button key={o.id} onClick={function () { props.onPayerChange(o.id); }}
              style={{ flex: 1, background: props.payer === o.id ? RED : LINE, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 4px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              {o.l}
            </button>
          );
        })}
      </div>

      <Label>送料を上書きする（空欄なら上の料金を使用）</Label>
      <input
        value={props.shippingOverride}
        onChange={function (e) { props.onShippingOverride(e.target.value.replace(/[^0-9]/g, '')); }}
        inputMode="numeric"
        placeholder={String(ship.fee + ship.material)}
        style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + LINE, borderRadius: 10, color: '#fff', padding: '10px 12px', fontSize: 14, outline: 'none' }}
      />
      <div style={{ color: SUB, fontSize: 11, marginTop: 6 }}>
        送料は2025年時点の目安です。最新の料金はメルカリアプリでご確認ください。
      </div>
    </Card>
  );
}

// ---------- 結果画面 ----------
function ResultScreen(props) {
  var listing = props.listing;
  var titleLen = listing.title.length;

  function setField(key, value) {
    props.onListingChange(key, value);
  }

  return (
    <div>
      {props.photos && props.photos.length > 0 ? (
        <Card style={{ padding: 12 }}>
          <div style={{ color: SUB, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>この順番でメルカリに写真を登録してください</div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {props.photos.map(function (p, i) {
              return (
                <div key={p.id} style={{ position: 'relative', flex: '0 0 auto' }}>
                  <img src={p.dataUrl} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                  <span style={{ position: 'absolute', left: 3, top: 3, background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 5 }}>{i + 1}</span>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {listing.policyWarning ? (
        <Card style={{ background: '#7f1d1d', border: '1px solid ' + RED }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, marginBottom: 4 }}>⚠️ 出品前に確認してください</div>
          <div style={{ color: '#fecaca', fontSize: 12, lineHeight: 1.6 }}>{listing.policyWarning}</div>
        </Card>
      ) : null}

      {listing.questions && listing.questions.length > 0 ? (
        <Card style={{ border: '1px solid ' + WARN }}>
          <div style={{ color: WARN, fontWeight: 800, fontSize: 13, marginBottom: 6 }}>❓ 写真だけでは分からなかったこと</div>
          {listing.questions.map(function (q, i) {
            return <div key={i} style={{ color: SUB2, fontSize: 12, lineHeight: 1.7 }}>・{q}</div>;
          })}
          <div style={{ color: SUB, fontSize: 11, marginTop: 8 }}>分かる項目は下で直接なおしてください。</div>
        </Card>
      ) : null}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>📝 商品情報</div>
          <span style={{ background: listing.confidence === 'high' ? OK : listing.confidence === 'medium' ? WARN : LINE, color: listing.confidence === 'low' ? SUB2 : '#00250f', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999 }}>
            AIの確信度: {listing.confidence === 'high' ? '高' : listing.confidence === 'medium' ? '中' : '低'}
          </span>
        </div>

        <Label>商品名（タイトル）</Label>
        <textarea
          value={listing.title}
          onChange={function (e) { setField('title', e.target.value); }}
          rows={2}
          style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + (titleLen > 40 ? RED : LINE), borderRadius: 10, color: '#fff', padding: 12, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 4 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: SUB, fontSize: 11 }}>検索されやすい言葉を前半に</span>
          <span style={{ color: titleLen > 40 ? RED : SUB, fontSize: 11, fontWeight: 700 }}>{titleLen} / 40</span>
        </div>

        <Field label="カテゴリ" value={listing.categoryPath} onChange={function (v) { setField('categoryPath', v); }} hint="メルカリのカテゴリ選択の目安です" />
        <Field label="ブランド" value={listing.brand} onChange={function (v) { setField('brand', v); }} placeholder="ノーブランドなら空欄" />
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}><Field label="サイズ" value={listing.size} onChange={function (v) { setField('size', v); }} /></div>
          <div style={{ flex: 1 }}><Field label="カラー" value={listing.color} onChange={function (v) { setField('color', v); }} /></div>
        </div>

        <Label>商品の状態</Label>
        <select
          value={listing.condition}
          onChange={function (e) { setField('condition', e.target.value); }}
          style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + LINE, borderRadius: 10, color: '#fff', padding: '10px 12px', fontSize: 14 }}
        >
          {CONDITIONS.map(function (c) { return <option key={c} value={c}>{c}</option>; })}
        </select>
        <div style={{ color: SUB, fontSize: 11, marginTop: 6 }}>判断の根拠: {listing.conditionReason}</div>

        {listing.flaws && listing.flaws.length > 0 ? (
          <div style={{ marginTop: 12, background: BG, borderRadius: 10, padding: 12 }}>
            <div style={{ color: WARN, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>写真から見えたキズ・使用感</div>
            {listing.flaws.map(function (f, i) {
              return <div key={i} style={{ color: SUB2, fontSize: 12, lineHeight: 1.7 }}>・{f}</div>;
            })}
          </div>
        ) : null}
      </Card>

      <PricePanel
        listing={listing}
        price={props.price}
        onPriceChange={props.onPriceChange}
        shippingId={props.shippingId}
        shippingOverride={props.shippingOverride}
        payer={props.payer}
      />

      <ShippingPanel
        listing={listing}
        shippingId={props.shippingId}
        onShippingChange={props.onShippingChange}
        shippingOverride={props.shippingOverride}
        onShippingOverride={props.onShippingOverride}
        payer={props.payer}
        onPayerChange={props.onPayerChange}
      />

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>🧾 商品説明</div>
          <Btn kind="ghost" onClick={props.onRebuildDescription}>テンプレで作り直す</Btn>
        </div>
        <textarea
          value={props.description}
          onChange={function (e) { props.onDescriptionChange(e.target.value); }}
          rows={16}
          style={{ width: '100%', boxSizing: 'border-box', background: BG, border: '1px solid ' + LINE, borderRadius: 10, color: '#fff', padding: 12, fontSize: 13, lineHeight: 1.7, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ color: SUB, fontSize: 11 }}>メルカリの上限は1,000文字</span>
          <span style={{ color: props.description.length > 1000 ? RED : SUB, fontSize: 11, fontWeight: 700 }}>{props.description.length} / 1000</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <label style={{ color: SUB2, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={props.opts.instant} onChange={function (e) { props.onOptChange('instant', e.target.checked); }} />即購入OK
          </label>
          <label style={{ color: SUB2, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={props.opts.negotiable} onChange={function (e) { props.onOptChange('negotiable', e.target.checked); }} />値下げ交渉可
          </label>
          <label style={{ color: SUB2, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={props.opts.smoker} onChange={function (e) { props.onOptChange('smoker', e.target.checked); }} />ペット・喫煙者なしを明記
          </label>
        </div>
      </Card>

      {listing.photoAdvice && listing.photoAdvice.length > 0 ? (
        <Card>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, marginBottom: 6 }}>📸 追加で撮ると売れやすい写真</div>
          {listing.photoAdvice.map(function (a, i) {
            return <div key={i} style={{ color: SUB2, fontSize: 12, lineHeight: 1.7 }}>・{a}</div>;
          })}
        </Card>
      ) : null}

      <Card>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>🚀 メルカリに出品する</div>
        <div style={{ color: SUB, fontSize: 12, marginBottom: 12, lineHeight: 1.7 }}>
          メルカリは外部アプリからの自動出品に対応していないため、最後の投稿だけはアプリ側で行います。
          下のボタンでコピーして、出品画面に貼り付けてください。
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CopyBtn label="① 商品名をコピー" text={listing.title} style={{ width: '100%' }} />
          <CopyBtn label="② 商品説明をコピー" text={props.description} style={{ width: '100%' }} />
          <CopyBtn label="③ 価格をコピー" text={String(props.price)} style={{ width: '100%' }} />
          <a href="https://jp.mercari.com/sell" target="_blank" rel="noreferrer"
            style={{ display: 'block', textAlign: 'center', background: RED, color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '14px 20px', fontWeight: 800, fontSize: 15 }}>
            メルカリの出品画面をひらく
          </a>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
        <Btn kind="sub" full onClick={props.onSave}>💾 下書きに保存</Btn>
        <Btn kind="ghost" full onClick={props.onReset}>次の商品へ</Btn>
      </div>
    </div>
  );
}

// ---------- 下書き一覧 ----------
function DraftsScreen(props) {
  if (props.drafts.length === 0) {
    return (
      <Card>
        <div style={{ color: SUB, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>保存した下書きはまだありません</div>
      </Card>
    );
  }
  return (
    <div>
      {props.drafts.map(function (d) {
        return (
          <Card key={d.id} style={{ padding: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {d.thumb ? <img src={d.thumb} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8 }} /> : null}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.listing.title}</div>
                <div style={{ color: SUB, fontSize: 11 }}>{yen(d.price)} ・ {new Date(d.savedAt).toLocaleDateString('ja-JP')}</div>
              </div>
              <Btn kind="sub" onClick={function () { props.onOpen(d); }}>開く</Btn>
              <button onClick={function () { props.onDelete(d.id); }} style={{ background: 'none', border: 'none', color: SUB, cursor: 'pointer', fontSize: 14 }}>🗑</button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ---------- 本体 ----------
export default function MercariApp() {
  var [screen, setScreen] = useState('input'); // input | loading | result | drafts
  var [photos, setPhotos] = useState([]);
  var [note, setNote] = useState('');
  var [listing, setListing] = useState(emptyListing());
  var [price, setPrice] = useState('');
  var [shippingId, setShippingId] = useState('nekopos');
  var [shippingOverride, setShippingOverride] = useState('');
  var [payer, setPayer] = useState('seller');
  var [description, setDescription] = useState('');
  var [descTouched, setDescTouched] = useState(false);
  var [opts, setOpts] = useState({ instant: true, negotiable: true, smoker: true });
  var [error, setError] = useState('');
  var [drafts, setDrafts] = useState([]);

  useEffect(function () { setDrafts(readDrafts()); }, []);

  var composed = useMemo(function () {
    return buildDescription(listing, opts, findShipping(shippingId).label);
  }, [listing, opts, shippingId]);

  // 手を入れていない説明文は、項目の変更に追従させる
  useEffect(function () {
    if (!descTouched) setDescription(composed);
  }, [composed, descTouched]);

  function applyListing(next) {
    setListing(next);
    setPrice(String(next.priceRecommended || ''));
    setShippingId(next.shippingId || 'nekopos');
    setShippingOverride('');
    setDescTouched(false);
    setDescription(buildDescription(next, opts, findShipping(next.shippingId || 'nekopos').label));
  }

  function analyze() {
    setError('');
    setScreen('loading');
    fetch('/api/listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: photos.map(function (p) { return { base64: p.base64, mediaType: p.mediaType }; }),
        note: note
      })
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
      .then(function (res) {
        if (!res.ok || !res.data.listing) {
          setError((res.data && res.data.error) || '解析に失敗しました。もう一度お試しください。');
          setScreen('input');
          return;
        }
        applyListing(Object.assign(emptyListing(), res.data.listing));
        setScreen('result');
      })
      .catch(function () {
        setError('通信に失敗しました。電波の良い場所でもう一度お試しください。');
        setScreen('input');
      });
  }

  function saveDraft() {
    var draft = {
      id: mkId(),
      savedAt: Date.now(),
      thumb: photos.length > 0 ? photos[0].dataUrl : '',
      listing: listing,
      price: Number(price) || 0,
      shippingId: shippingId,
      shippingOverride: shippingOverride,
      payer: payer,
      description: description,
      opts: opts
    };
    var next = [draft].concat(drafts);
    setDrafts(next);
    writeDrafts(next);
    setError('');
    window.alert('下書きに保存しました');
  }

  function openDraft(d) {
    setListing(d.listing);
    setPrice(String(d.price));
    setShippingId(d.shippingId);
    setShippingOverride(d.shippingOverride || '');
    setPayer(d.payer || 'seller');
    setDescription(d.description);
    setDescTouched(true);
    setOpts(d.opts || opts);
    setPhotos(d.thumb ? [{ id: mkId(), dataUrl: d.thumb, base64: '', mediaType: 'image/jpeg' }] : []);
    setScreen('result');
  }

  function deleteDraft(id) {
    var next = drafts.filter(function (d) { return d.id !== id; });
    setDrafts(next);
    writeDrafts(next);
  }

  function reset() {
    setPhotos([]);
    setNote('');
    setListing(emptyListing());
    setPrice('');
    setDescription('');
    setDescTouched(false);
    setShippingOverride('');
    setPayer('seller');
    setScreen('input');
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: SUB2, fontFamily: 'system-ui, -apple-system, "Hiragino Kaku Gothic ProN", sans-serif' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: BG, borderBottom: '1px solid ' + LINE, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>
          <span style={{ color: RED }}>●</span> メルカリ出品AI
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {screen === 'drafts' ? (
            <Btn kind="ghost" onClick={function () { setScreen(listing.title ? 'result' : 'input'); }}>もどる</Btn>
          ) : (
            <Btn kind="ghost" onClick={function () { setScreen('drafts'); }}>下書き {drafts.length}</Btn>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: 16 }}>
        {error ? (
          <Card style={{ background: '#7f1d1d' }}>
            <div style={{ color: '#fecaca', fontSize: 13 }}>{error}</div>
          </Card>
        ) : null}

        {screen === 'input' ? (
          <InputScreen
            photos={photos}
            note={note}
            onNoteChange={setNote}
            onAddPhotos={function (list) { setPhotos(photos.concat(list)); }}
            onRemovePhoto={function (id) { setPhotos(photos.filter(function (p) { return p.id !== id; })); }}
            onAnalyze={analyze}
            onError={setError}
            onSample={function () { applyListing(SAMPLE_LISTING); setScreen('result'); }}
          />
        ) : null}

        {screen === 'loading' ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>AIが写真を分析しています...</div>
            <div style={{ color: SUB, fontSize: 12, marginTop: 8, lineHeight: 1.8 }}>
              商品の特定 → 状態の判定 → 相場の推定 → 説明文の作成<br />
              20〜40秒ほどかかります
            </div>
          </div>
        ) : null}

        {screen === 'result' ? (
          <ResultScreen
            photos={photos}
            listing={listing}
            price={price}
            onPriceChange={setPrice}
            shippingId={shippingId}
            onShippingChange={setShippingId}
            shippingOverride={shippingOverride}
            onShippingOverride={setShippingOverride}
            payer={payer}
            onPayerChange={setPayer}
            description={description}
            onDescriptionChange={function (v) { setDescTouched(true); setDescription(v); }}
            onRebuildDescription={function () { setDescTouched(false); setDescription(composed); }}
            opts={opts}
            onOptChange={function (k, v) {
              var next = Object.assign({}, opts);
              next[k] = v;
              setOpts(next);
            }}
            onListingChange={function (k, v) {
              var next = Object.assign({}, listing);
              next[k] = v;
              setListing(next);
            }}
            onSave={saveDraft}
            onReset={reset}
          />
        ) : null}

        {screen === 'drafts' ? (
          <DraftsScreen drafts={drafts} onOpen={openDraft} onDelete={deleteDraft} />
        ) : null}
      </div>
    </div>
  );
}
