import { useState, useEffect } from "react";

const G='#22c55e',N='#0f172a',N2='#1e293b',N3='#334155',S='#94a3b8',S2='#cbd5e1',R='#ef4444',Y='#f59e0b',B='#3b82f6',PU='#8b5cf6';

const FDB=[
  {id:1,n:'白米',s:'150g',cal:252,p:3.8,f:0.5,c:55.7,cat:'穀物'},
  {id:2,n:'玄米',s:'150g',cal:248,p:4.2,f:1.5,c:51.3,cat:'穀物'},
  {id:3,n:'食パン',s:'60g',cal:158,p:5.6,f:2.6,c:28.0,cat:'穀物'},
  {id:4,n:'うどん',s:'200g',cal:210,p:5.2,f:0.8,c:43.2,cat:'穀物'},
  {id:5,n:'そば',s:'200g',cal:264,p:9.6,f:1.0,c:51.2,cat:'穀物'},
  {id:6,n:'パスタ',s:'80g',cal:302,p:9.7,f:1.5,c:58.8,cat:'穀物'},
  {id:7,n:'オートミール',s:'30g',cal:114,p:4.0,f:2.1,c:20.4,cat:'穀物'},
  {id:8,n:'鶏むね肉',s:'100g',cal:108,p:22.3,f:1.5,c:0,cat:'肉・魚'},
  {id:9,n:'鶏もも肉',s:'100g',cal:190,p:17.3,f:14.2,c:0,cat:'肉・魚'},
  {id:10,n:'豚ロース',s:'100g',cal:263,p:19.3,f:19.2,c:0.2,cat:'肉・魚'},
  {id:11,n:'牛もも肉',s:'100g',cal:182,p:21.2,f:10.7,c:0.6,cat:'肉・魚'},
  {id:12,n:'サーモン',s:'100g',cal:138,p:19.1,f:7.1,c:0.1,cat:'肉・魚'},
  {id:13,n:'マグロ赤身',s:'100g',cal:125,p:26.4,f:1.4,c:0.1,cat:'肉・魚'},
  {id:14,n:'卵',s:'1個',cal:76,p:6.2,f:5.2,c:0.2,cat:'卵・豆'},
  {id:15,n:'豆腐',s:'150g',cal:84,p:7.4,f:4.8,c:2.4,cat:'卵・豆'},
  {id:16,n:'納豆',s:'1P',cal:90,p:7.4,f:4.5,c:5.4,cat:'卵・豆'},
  {id:17,n:'ブロッコリー',s:'100g',cal:37,p:4.3,f:0.5,c:5.2,cat:'野菜'},
  {id:18,n:'ほうれん草',s:'100g',cal:23,p:2.2,f:0.4,c:3.1,cat:'野菜'},
  {id:19,n:'トマト',s:'150g',cal:29,p:1.1,f:0.2,c:5.6,cat:'野菜'},
  {id:20,n:'きゅうり',s:'100g',cal:14,p:1.0,f:0.1,c:3.0,cat:'野菜'},
  {id:21,n:'にんじん',s:'100g',cal:39,p:0.7,f:0.1,c:9.3,cat:'野菜'},
  {id:22,n:'アボカド',s:'1/2個',cal:125,p:1.6,f:11.3,c:5.8,cat:'野菜'},
  {id:23,n:'さつまいも',s:'100g',cal:130,p:1.2,f:0.2,c:30.3,cat:'野菜'},
  {id:24,n:'バナナ',s:'1本',cal:86,p:1.1,f:0.2,c:22.5,cat:'果物'},
  {id:25,n:'りんご',s:'1/2個',cal:87,p:0.2,f:0.2,c:22.7,cat:'果物'},
  {id:26,n:'みかん',s:'1個',cal:38,p:0.6,f:0.1,c:9.1,cat:'果物'},
  {id:27,n:'牛乳',s:'200ml',cal:134,p:6.6,f:7.6,c:9.6,cat:'乳製品'},
  {id:28,n:'ヨーグルト',s:'100g',cal:62,p:3.6,f:3.0,c:4.9,cat:'乳製品'},
  {id:29,n:'チーズ',s:'20g',cal:68,p:4.5,f:5.2,c:0.3,cat:'乳製品'},
  {id:30,n:'豆乳',s:'200ml',cal:92,p:7.2,f:4.0,c:6.2,cat:'乳製品'},
  {id:31,n:'味噌汁',s:'1杯',cal:40,p:2.8,f:1.5,c:4.0,cat:'その他'},
  {id:32,n:'プロテインバー',s:'1本',cal:180,p:20.0,f:6.0,c:20.0,cat:'その他'},
  {id:33,n:'おにぎり鮭',s:'1個',cal:197,p:5.0,f:1.5,c:40.5,cat:'その他'},
  {id:34,n:'サンドイッチ',s:'1個',cal:250,p:10.0,f:8.0,c:35.0,cat:'その他'},
  {id:35,n:'ビッグマック',s:'1個',cal:525,p:27.0,f:29.0,c:45.0,cat:'ファスト'},
  {id:36,n:'フライドポテトM',s:'170g',cal:454,p:5.3,f:22.0,c:56.0,cat:'ファスト'},
  {id:37,n:'カレーライス',s:'1皿',cal:714,p:17.5,f:19.0,c:112.0,cat:'その他'},
  {id:38,n:'ラーメン',s:'1杯',cal:495,p:18.0,f:16.0,c:68.0,cat:'その他'},
  {id:39,n:'親子丼',s:'1杯',cal:620,p:24.0,f:16.0,c:88.0,cat:'その他'},
  {id:40,n:'餃子',s:'5個',cal:197,p:8.3,f:10.5,c:18.7,cat:'その他'},
  {id:41,n:'プロテイン',s:'1杯',cal:110,p:22.0,f:1.5,c:3.0,cat:'サプリ'},
  {id:42,n:'アーモンド',s:'20粒',cal:166,p:6.0,f:14.3,c:5.6,cat:'ナッツ'},
  {id:43,n:'ツナ缶',s:'1缶',cal:70,p:13.5,f:1.5,c:0,cat:'肉・魚'},
  {id:44,n:'いわし缶',s:'1缶',cal:180,p:22.5,f:9.9,c:0.3,cat:'肉・魚'},
  {id:45,n:'コーラ',s:'350ml',cal:144,p:0,f:0,c:36.0,cat:'飲料'},
  {id:46,n:'コーヒー',s:'200ml',cal:8,p:0.4,f:0,c:1.2,cat:'飲料'},
  {id:47,n:'緑茶',s:'200ml',cal:4,p:0.4,f:0,c:0.6,cat:'飲料'},
  {id:48,n:'かぼちゃ',s:'100g',cal:91,p:1.9,f:0.3,c:20.6,cat:'野菜'},
  {id:49,n:'じゃがいも',s:'100g',cal:76,p:1.8,f:0.1,c:17.6,cat:'野菜'},
  {id:50,n:'えのき',s:'100g',cal:22,p:2.7,f:0.2,c:3.7,cat:'野菜'},
  {id:51,n:'しらす',s:'20g',cal:24,p:3.8,f:0.5,c:0.1,cat:'肉・魚'},
  {id:52,n:'全粒粉パン',s:'60g',cal:148,p:6.0,f:2.2,c:26.4,cat:'穀物'},
  {id:53,n:'豆乳ヨーグルト',s:'100g',cal:58,p:3.5,f:2.8,c:4.8,cat:'乳製品'},
  {id:54,n:'オリーブオイル',s:'大1',cal:111,p:0,f:12.0,c:0,cat:'調味料'},
  {id:55,n:'バター',s:'10g',cal:75,p:0.1,f:8.2,c:0,cat:'調味料'},
];

const todayStr = () => new Date().toISOString().slice(0,10);
const fmtDate = d => { const dt = new Date(d+'T12:00:00'); return `${dt.getMonth()+1}/${dt.getDate()}`; };
const mkId = () => Math.random().toString(36).slice(2,9);

function getMacros(items) {
  if (!items) return {cal:0,p:0,f:0,c:0};
  return items.reduce((a,it) => {
    const q = it.qty || 1;
    return { cal:a.cal+(it.cal||0)*q, p:a.p+(it.p||0)*q, f:a.f+(it.f||0)*q, c:a.c+(it.c||0)*q };
  }, {cal:0,p:0,f:0,c:0});
}

function getDayMacros(dm) {
  if (!dm) return {cal:0,p:0,f:0,c:0};
  const all = [...(dm.breakfast||[]),...(dm.lunch||[]),...(dm.dinner||[]),...(dm.snack||[])];
  const r = getMacros(all);
  return { cal:Math.round(r.cal), p:+(r.p.toFixed(1)), f:+(r.f.toFixed(1)), c:+(r.c.toFixed(1)) };
}

function calcGoals(pf) {
  if (!pf) return {cal:2000,p:150,f:55,c:250};
  if (pf.goals) return pf.goals;
  const h=parseFloat(pf.height)||170, w=parseFloat(pf.weight)||70, a=parseInt(pf.age)||30, g=pf.gender;
  const bmr = g==='female' ? 10*w+6.25*h-5*a-161 : 10*w+6.25*h-5*a+5;
  const tdee = bmr*1.55;
  const cal = Math.round(pf.goal==='diet' ? tdee-500 : pf.goal==='muscle' ? tdee+300 : tdee);
  const p = Math.round(w*(pf.goal==='muscle'?2.0:1.6));
  const f = Math.round(cal*0.25/9);
  const c = Math.round((cal-p*4-f*9)/4);
  return {cal,p,f,c};
}

function calcScore(m, goals) {
  if (!goals || m.cal===0) return 0;
  const cs = Math.max(0,100-Math.abs(m.cal-goals.cal)/goals.cal*100);
  const ps = m.p>=goals.p ? 100 : m.p/goals.p*100;
  const fs = m.f<=goals.f*1.2 ? 100 : Math.max(0,100-(m.f-goals.f*1.2)/goals.f*50);
  const cc = Math.max(0,100-Math.abs(m.c-goals.c)/goals.c*60);
  return Math.round(cs*0.4+ps*0.3+fs*0.15+cc*0.15);
}

function genSampleMeals() {
  const m = {};
  for (let i=6; i>=0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    const ds = d.toISOString().slice(0,10);
    m[ds] = {
      breakfast: [{...FDB[1],qty:1,uid:mkId()},{...FDB[13],qty:1,uid:mkId()},{...FDB[29],qty:1,uid:mkId()}],
      lunch:     [{...FDB[0],qty:1,uid:mkId()},{...FDB[7],qty:1,uid:mkId()},{...FDB[18],qty:1,uid:mkId()}],
      dinner:    [{...FDB[11],qty:1,uid:mkId()},{...FDB[16],qty:1,uid:mkId()},{...FDB[0],qty:1,uid:mkId()}],
      snack:     i%2===0 ? [{...FDB[31],qty:1,uid:mkId()}] : [],
    };
  }
  return m;
}

function genSampleWeights() {
  return Array.from({length:21}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(20-i));
    return {
      date: d.toISOString().slice(0,10),
      weight: +(73.0 - i*0.06 + (Math.random()*0.3-0.15)).toFixed(1),
      fat: +(20.0 - i*0.04 + (Math.random()*0.2-0.1)).toFixed(1),
    };
  });
}

// ── Charts ──────────────────────────────────────────
function DonutChart({p, f, c, size=120}) {
  const tot = p+f+c || 1;
  const slices = [{v:p,col:B},{v:f,col:Y},{v:c,col:G}];
  let angle = -Math.PI/2;
  const r = size/2-10, cx = size/2, cy = size/2;
  const paths = slices.map((sl, i) => {
    const a = (sl.v/tot)*2*Math.PI;
    if (a < 0.01) return null;
    const x1 = cx+r*Math.cos(angle), y1 = cy+r*Math.sin(angle);
    const ea = angle+a, x2 = cx+r*Math.cos(ea), y2 = cy+r*Math.sin(ea);
    const large = a > Math.PI ? 1 : 0;
    const path = `M${cx},${cy}L${x1},${y1}A${r},${r},0,${large},1,${x2},${y2}Z`;
    angle = ea;
    return <path key={i} d={path} fill={sl.col} opacity={0.85} />;
  });
  return (
    <svg width={size} height={size}>
      {paths}
      <circle cx={cx} cy={cy} r={r-16} fill={N2} />
    </svg>
  );
}

function BarProg({value, max, color=G, h=8}) {
  const pct = Math.min(100, max>0 ? (value/max)*100 : 0);
  return (
    <div style={{background:N3, borderRadius:4, height:h, overflow:'hidden'}}>
      <div style={{width:pct+'%', height:'100%', background:pct>110?R:color, borderRadius:4, transition:'width 0.5s ease'}} />
    </div>
  );
}

function WeightChart({data, width=300, height=140}) {
  if (!data || data.length < 2) return <div style={{color:S,textAlign:'center',padding:20,fontSize:13}}>データなし</div>;
  const vals = data.map(d => d.weight);
  const mn = Math.min(...vals)-0.4, mx = Math.max(...vals)+0.4, rng = mx-mn || 1;
  const pl = {l:34, r:8, t:8, b:22};
  const W = width-pl.l-pl.r, H = height-pl.t-pl.b;
  const pts = data.map((d,i) => ({
    x: pl.l+(i/(data.length-1))*W,
    y: pl.t+H-((d.weight-mn)/rng)*H,
  }));
  const line = pts.map((p,i) => `${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
  const area = `${line}L${pts[pts.length-1].x},${pl.t+H}L${pl.l},${pl.t+H}Z`;
  const yl = [mn+(mx-mn)*0.1, (mn+mx)/2, mx-(mx-mn)*0.1];
  const show = data.filter((_,i) => i===0 || i===data.length-1 || i===Math.floor(data.length/2));
  return (
    <svg width={width} height={height} style={{overflow:'visible'}}>
      <defs>
        <linearGradient id="wg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={G} stopOpacity="0.3" />
          <stop offset="100%" stopColor={G} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yl.map((v,i) => {
        const y2 = pl.t+H-((v-mn)/rng)*H;
        return <line key={i} x1={pl.l} x2={pl.l+W} y1={y2} y2={y2} stroke={N3} strokeWidth="1" strokeDasharray="3,3" />;
      })}
      <path d={area} fill="url(#wg)" />
      <path d={line} fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="4" fill={G} />
      {yl.map((v,i) => {
        const y2 = pl.t+H-((v-mn)/rng)*H;
        return <text key={i} x={pl.l-3} y={y2+4} textAnchor="end" fill={S} fontSize="9">{v.toFixed(1)}</text>;
      })}
      {show.map((d,i) => {
        const idx = data.indexOf(d);
        return <text key={i} x={pl.l+(idx/(data.length-1))*W} y={height-3} textAnchor="middle" fill={S} fontSize="9">{fmtDate(d.date)}</text>;
      })}
    </svg>
  );
}

function CalChart({data, goal, width=300, height=100}) {
  if (!data || data.length===0) return null;
  const pad = {l:6, r:6, t:6, b:20};
  const W = width-pad.l-pad.r, H = height-pad.t-pad.b;
  const maxV = Math.max(goal*1.3, ...data.map(d=>d.cal), 100);
  const bw = Math.min(24, W/data.length-4);
  return (
    <svg width={width} height={height}>
      {data.map((d,i) => {
        const x = pad.l+(i+0.5)*(W/data.length)-bw/2;
        const bh = Math.max(2,(d.cal/maxV)*H);
        const y = pad.t+H-bh;
        const col = d.cal>goal*1.08 ? R : d.cal>goal*0.88 ? G : Y;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} fill={col} opacity={0.8} rx={2} />
            <text x={x+bw/2} y={height-4} textAnchor="middle" fill={S} fontSize="8">{fmtDate(d.date)}</text>
          </g>
        );
      })}
      <line x1={pad.l} x2={pad.l+W} y1={pad.t+H-(goal/maxV)*H} y2={pad.t+H-(goal/maxV)*H} stroke={Y} strokeWidth="1.5" strokeDasharray="4,3" />
    </svg>
  );
}

// ── Primitives ───────────────────────────────────────
function Cd({children, style={}, bg=N2}) {
  return <div style={{background:bg, borderRadius:16, padding:16, ...style}}>{children}</div>;
}

function Btn({children, onClick, style={}, color=G, outline=false, sm=false, full=false}) {
  return (
    <button onClick={onClick} style={{
      background: outline ? 'transparent' : color,
      color: outline ? color : '#000',
      fontWeight:700, border: outline ? `1.5px solid ${color}` : 'none',
      borderRadius:10, padding: sm ? '6px 14px' : '10px 20px',
      cursor:'pointer', fontSize: sm ? 12 : 14,
      width: full ? '100%' : 'auto', ...style
    }}>{children}</button>
  );
}

// ── Onboarding ───────────────────────────────────────
function Onboarding({onDone}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({name:'田中 健太',age:'30',gender:'male',height:'175',weight:'73',goal:'diet',targetWeight:'68',targetCal:''});
  const upd = (k,v) => setForm(f => ({...f,[k]:v}));
  const auto = calcGoals(form);
  const submit = () => {
    const g = calcGoals(form);
    onDone({...form, goals:{cal:form.targetCal?+form.targetCal:g.cal, p:g.p, f:g.f, c:g.c}});
  };
  const inpStyle = {background:N, border:`1px solid ${N3}`, borderRadius:10, padding:'10px 14px', color:'#fff', fontSize:15, width:'100%', boxSizing:'border-box'};

  return (
    <div style={{background:N, minHeight:'100vh', maxWidth:480, margin:'0 auto'}}>
      {step > 0 && (
        <div style={{padding:'14px 20px 0'}}>
          <div style={{display:'flex', gap:6}}>
            {[1,2,3].map(i => <div key={i} style={{flex:1,height:4,borderRadius:2,background:step>=i?G:N3,transition:'background 0.3s'}} />)}
          </div>
        </div>
      )}

      {step===0 && (
        <div style={{textAlign:'center', padding:'60px 24px'}}>
          <div style={{fontSize:72, marginBottom:16}}>🥗</div>
          <h1 style={{color:G, fontSize:32, fontWeight:900, margin:'0 0 8px'}}>MealCare</h1>
          <p style={{color:S, lineHeight:1.7, margin:'0 0 40px', fontSize:15}}>食事・栄養・体重管理を<br/>ひとつのアプリで。</p>
          <Btn onClick={()=>setStep(1)} style={{width:'100%',padding:'15px',fontSize:16}}>はじめる →</Btn>
        </div>
      )}

      {step===1 && (
        <div style={{padding:'24px 20px'}}>
          <h2 style={{color:'#fff',fontSize:20,fontWeight:800,marginBottom:20}}>基本情報を入力</h2>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>お名前</label>
              <input style={inpStyle} value={form.name} onChange={e=>upd('name',e.target.value)} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>年齢</label>
                <input style={inpStyle} type="number" value={form.age} onChange={e=>upd('age',e.target.value)} />
              </div>
              <div>
                <label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>性別</label>
                <select style={inpStyle} value={form.gender} onChange={e=>upd('gender',e.target.value)}>
                  <option value="male">男性</option>
                  <option value="female">女性</option>
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>身長 (cm)</label>
                <input style={inpStyle} type="number" value={form.height} onChange={e=>upd('height',e.target.value)} />
              </div>
              <div>
                <label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>体重 (kg)</label>
                <input style={inpStyle} type="number" value={form.weight} onChange={e=>upd('weight',e.target.value)} />
              </div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:4}}>
              <Btn onClick={()=>setStep(0)} outline sm style={{flex:1}}>戻る</Btn>
              <Btn onClick={()=>setStep(2)} style={{flex:2}}>次へ</Btn>
            </div>
          </div>
        </div>
      )}

      {step===2 && (
        <div style={{padding:'24px 20px'}}>
          <h2 style={{color:'#fff',fontSize:20,fontWeight:800,marginBottom:16}}>目標を選択</h2>
          {[{v:'diet',i:'🏃',t:'ダイエット',d:'体重を減らしたい'},{v:'muscle',i:'💪',t:'筋肉をつける',d:'筋肉量を増やしたい'},{v:'health',i:'🌿',t:'健康維持',d:'健康的な体を維持したい'},{v:'maintain',i:'⚖️',t:'体重維持',d:'現在の体重を維持したい'}].map(g => (
            <div key={g.v} onClick={()=>upd('goal',g.v)} style={{background:form.goal===g.v?G+'22':N2,border:`2px solid ${form.goal===g.v?G:N3}`,borderRadius:14,padding:'14px 16px',marginBottom:10,cursor:'pointer',display:'flex',alignItems:'center',gap:12,transition:'all 0.2s'}}>
              <span style={{fontSize:24}}>{g.i}</span>
              <div>
                <div style={{color:'#fff',fontWeight:700,fontSize:14}}>{g.t}</div>
                <div style={{color:S,fontSize:12}}>{g.d}</div>
              </div>
              {form.goal===g.v && <span style={{marginLeft:'auto',color:G,fontSize:18,fontWeight:800}}>✓</span>}
            </div>
          ))}
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Btn onClick={()=>setStep(1)} outline sm style={{flex:1}}>戻る</Btn>
            <Btn onClick={()=>setStep(3)} style={{flex:2}}>次へ</Btn>
          </div>
        </div>
      )}

      {step===3 && (
        <div style={{padding:'24px 20px'}}>
          <h2 style={{color:'#fff',fontSize:20,fontWeight:800,marginBottom:18}}>目標カロリー確認</h2>
          <Cd bg={N2} style={{marginBottom:18}}>
            <div style={{color:S,fontSize:12,fontWeight:600,marginBottom:4}}>自動計算された目標</div>
            <div style={{color:G,fontSize:30,fontWeight:900}}>{auto.cal}<span style={{fontSize:16,color:S,fontWeight:400}}> kcal/日</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:12,paddingTop:12,borderTop:`1px solid ${N3}`}}>
              {[{l:'タンパク質',v:auto.p+'g',c:B},{l:'脂質',v:auto.f+'g',c:Y},{l:'炭水化物',v:auto.c+'g',c:G}].map(n => (
                <div key={n.l} style={{textAlign:'center'}}>
                  <div style={{color:n.c,fontWeight:800,fontSize:16}}>{n.v}</div>
                  <div style={{color:S,fontSize:10}}>{n.l}</div>
                </div>
              ))}
            </div>
          </Cd>
          <div style={{marginBottom:12}}>
            <label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>目標体重 (kg)</label>
            <input style={inpStyle} type="number" value={form.targetWeight} onChange={e=>upd('targetWeight',e.target.value)} />
          </div>
          <div style={{marginBottom:18}}>
            <label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>カロリー調整 <span style={{color:G,fontSize:11}}>（空欄で自動計算）</span></label>
            <input style={inpStyle} type="number" value={form.targetCal} onChange={e=>upd('targetCal',e.target.value)} placeholder={String(auto.cal)} />
          </div>
          <div style={{display:'flex',gap:10}}>
            <Btn onClick={()=>setStep(2)} outline sm style={{flex:1}}>戻る</Btn>
            <Btn onClick={submit} style={{flex:2,padding:'12px',fontSize:15}}>🎉 スタート！</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BottomNav ────────────────────────────────────────
function BottomNav({tab, onChange}) {
  const tabs = [{id:'home',i:'🏠',l:'ホーム'},{id:'log',i:'✏️',l:'記録'},{id:'nutrition',i:'📊',l:'栄養'},{id:'weight',i:'⚖️',l:'体重'},{id:'coach',i:'👨‍💼',l:'コーチ'}];
  return (
    <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:N2,borderTop:`1px solid ${N3}`,display:'flex',zIndex:100}}>
      {tabs.map(t => (
        <button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,background:'none',border:'none',cursor:'pointer',padding:'10px 0 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
          <span style={{fontSize:20}}>{t.i}</span>
          <span style={{fontSize:9,fontWeight:700,color:tab===t.id?G:S}}>{t.l}</span>
          {tab===t.id && <div style={{width:18,height:2,background:G,borderRadius:1,marginTop:1}} />}
        </button>
      ))}
    </div>
  );
}

// ── HomeScreen ───────────────────────────────────────
function HomeScreen({profile, meals, weights, setTab, setMealTab}) {
  const [water, setWater] = useState(() => {
    try { const d = JSON.parse(localStorage.getItem('mc_water') || '{}'); return d[todayStr()] || 0; } catch(e) { return 0; }
  });
  const today = todayStr();
  const dm = meals[today] || {breakfast:[],lunch:[],dinner:[],snack:[]};
  const m = getDayMacros(dm);
  const goals = calcGoals(profile);
  const score = calcScore(m, goals);
  const streak = Object.keys(meals).filter(d => getDayMacros(meals[d]).cal > 0).length;
  const lw = weights.length > 0 ? weights[weights.length-1] : null;
  const bmi = lw && profile ? +(lw.weight / ((parseFloat(profile.height)/100)**2)).toFixed(1) : null;

  const addWater = () => {
    const nw = water + 200;
    setWater(nw);
    try { const d = JSON.parse(localStorage.getItem('mc_water')||'{}'); d[today]=nw; localStorage.setItem('mc_water',JSON.stringify(d)); } catch(e) {}
  };

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'おはようございます' : hour < 17 ? 'こんにちは' : 'こんばんは';
  const mealSecs = [{id:'breakfast',l:'朝食',i:'🌅'},{id:'lunch',l:'昼食',i:'🌞'},{id:'dinner',l:'夕食',i:'🌙'},{id:'snack',l:'間食',i:'🍪'}];

  return (
    <div style={{padding:'16px 16px 90px'}}>
      <div style={{marginBottom:16}}>
        <div style={{color:S,fontSize:12}}>{new Date().toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'})}</div>
        <div style={{color:'#fff',fontSize:20,fontWeight:800}}>👋 {greeting}、{profile?.name || 'さん'}！</div>
      </div>

      <Cd style={{marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div>
            <div style={{color:S,fontSize:12,fontWeight:600}}>本日の摂取カロリー</div>
            <div style={{color:'#fff',fontSize:28,fontWeight:900}}>{m.cal}<span style={{color:S,fontSize:14,fontWeight:400}}> / {goals.cal} kcal</span></div>
          </div>
          <DonutChart p={m.p} f={m.f} c={m.c} size={90} />
        </div>
        <BarProg value={m.cal} max={goals.cal} h={10} />
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:14}}>
          {[{l:'タンパク質',v:m.p,g:goals.p,c:B},{l:'脂質',v:m.f,g:goals.f,c:Y},{l:'炭水化物',v:m.c,g:goals.c,c:G}].map(n => (
            <div key={n.l}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{color:n.c,fontSize:11,fontWeight:700}}>{n.l}</span>
                <span style={{color:S,fontSize:10}}>{n.v}/{n.g}g</span>
              </div>
              <BarProg value={n.v} max={n.g} color={n.c} h={6} />
            </div>
          ))}
        </div>
      </Cd>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        <Cd style={{display:'flex',flexDirection:'column',alignItems:'center',padding:14}}>
          <div style={{fontSize:28,fontWeight:900,color:score>=80?G:score>=60?Y:R}}>{score}</div>
          <div style={{color:S,fontSize:11,fontWeight:600}}>食事スコア</div>
          <div style={{color:S,fontSize:10,marginTop:2}}>/ 100点</div>
        </Cd>
        <Cd style={{display:'flex',flexDirection:'column',alignItems:'center',padding:14}}>
          <div style={{fontSize:28,fontWeight:900,color:G}}>🔥{streak}</div>
          <div style={{color:S,fontSize:11,fontWeight:600}}>連続記録</div>
          <div style={{color:S,fontSize:10,marginTop:2}}>日間</div>
        </Cd>
      </div>

      <Cd style={{marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{color:'#fff',fontWeight:700}}>💧 水分摂取</div>
          <div style={{color:B,fontWeight:800,fontSize:16}}>{(water/1000).toFixed(2)} L</div>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <div key={i} style={{flex:1,height:30,borderRadius:6,background:water>=(i+1)*200?B+'88':N3,border:`1px solid ${water>=(i+1)*200?B:N3}`,transition:'all 0.3s'}} />
          ))}
          <button onClick={addWater} style={{background:B,border:'none',borderRadius:8,color:'#fff',fontWeight:800,fontSize:18,width:36,height:36,cursor:'pointer',flexShrink:0}}>+</button>
        </div>
        <div style={{color:S,fontSize:11,marginTop:6}}>目標: 2000ml　+200ml ずつ追加</div>
      </Cd>

      <div style={{color:'#fff',fontWeight:800,marginBottom:8}}>今日の食事</div>
      {mealSecs.map(ms => {
        const items = dm[ms.id] || [];
        const mm = getMacros(items);
        return (
          <Cd key={ms.id} style={{marginBottom:8,cursor:'pointer'}} onClick={()=>{ setMealTab(ms.id); setTab('log'); }}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:20}}>{ms.i}</span>
                <div>
                  <div style={{color:'#fff',fontWeight:700,fontSize:14}}>{ms.l}</div>
                  <div style={{color:S,fontSize:11}}>{items.length} 品目</div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{color:G,fontWeight:800}}>{Math.round(mm.cal)} kcal</div>
                <div style={{color:S,fontSize:11}}>P:{Math.round(mm.p)} F:{Math.round(mm.f)} C:{Math.round(mm.c)}</div>
              </div>
            </div>
            {items.length > 0 && (
              <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${N3}`,display:'flex',flexWrap:'wrap',gap:4}}>
                {items.slice(0,4).map(it => <span key={it.uid||it.id} style={{background:N3,borderRadius:6,padding:'2px 8px',fontSize:11,color:S2}}>{it.n}</span>)}
                {items.length > 4 && <span style={{color:S,fontSize:11}}>+{items.length-4}</span>}
              </div>
            )}
          </Cd>
        );
      })}

      {lw && (
        <Cd style={{marginTop:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{color:S,fontSize:12}}>最新の体重</div>
              <div style={{color:'#fff',fontSize:22,fontWeight:900}}>{lw.weight}<span style={{fontSize:14,color:S}}> kg</span></div>
            </div>
            {bmi && <div style={{textAlign:'right'}}><div style={{color:S,fontSize:12}}>BMI</div><div style={{color:bmi<18.5?Y:bmi<25?G:bmi<30?Y:R,fontSize:22,fontWeight:900}}>{bmi}</div></div>}
            {profile?.targetWeight && <div style={{textAlign:'right'}}><div style={{color:S,fontSize:12}}>目標まで</div><div style={{color:G,fontSize:18,fontWeight:800}}>{(lw.weight-parseFloat(profile.targetWeight)).toFixed(1)}<span style={{fontSize:12,color:S}}> kg</span></div></div>}
          </div>
        </Cd>
      )}

      <Cd style={{marginTop:10,background:G+'18',border:`1px solid ${G}44`}}>
        <div style={{color:G,fontWeight:800,fontSize:13,marginBottom:4}}>🤖 AIアドバイス</div>
        <div style={{color:S2,fontSize:13,lineHeight:1.6}}>
          {score>=80 ? '素晴らしい食事バランスです！今日の目標達成率が高く、特にタンパク質が十分摂取できています。' :
           score>=60 ? '良いペースです。もう少しタンパク質を意識して摂ると、より栄養バランスが整います。' :
           '記録が少ないようです。まずは食事を記録する習慣をつけましょう。'}
        </div>
      </Cd>
    </div>
  );
}

// ── LogScreen ────────────────────────────────────────
function LogScreen({meals, setMeals, mealTab, setMealTab}) {
  const [day, setDay] = useState(todayStr());
  const [showAdd, setShowAdd] = useState(false);
  const [mode, setMode] = useState('search');
  const [search, setSearch] = useState('');
  const [manual, setManual] = useState({n:'',cal:'',p:'',f:'',c:''});

  const dm = meals[day] || {breakfast:[],lunch:[],dinner:[],snack:[]};
  const tabs = [{id:'breakfast',l:'朝食',i:'🌅'},{id:'lunch',l:'昼食',i:'🌞'},{id:'dinner',l:'夕食',i:'🌙'},{id:'snack',l:'間食',i:'🍪'}];
  const items = dm[mealTab] || [];
  const mm = getMacros(items);
  const results = FDB.filter(f => f.n.includes(search) || f.cat.includes(search)).slice(0,20);
  const inpStyle = {background:N,border:`1px solid ${N3}`,borderRadius:8,padding:'8px 12px',color:'#fff',fontSize:13,width:'100%',boxSizing:'border-box'};

  const changeDay = delta => {
    const d = new Date(day+'T12:00:00'); d.setDate(d.getDate()+delta);
    setDay(d.toISOString().slice(0,10));
  };

  const addFood = food => {
    const nit = {...food, qty:1, uid:mkId()};
    const ndm = {...dm, [mealTab]: [...(dm[mealTab]||[]), nit]};
    setMeals(m => ({...m, [day]:ndm}));
    setSearch(''); setShowAdd(false);
  };

  const addManual = () => {
    if (!manual.n || !manual.cal) return;
    addFood({id:'m'+mkId(), n:manual.n, cal:+manual.cal, p:+manual.p||0, f:+manual.f||0, c:+manual.c||0, s:'手入力'});
    setManual({n:'',cal:'',p:'',f:'',c:''});
  };

  const removeFood = u => {
    const ndm = {...dm, [mealTab]:(dm[mealTab]||[]).filter(it => it.uid!==u)};
    setMeals(m => ({...m, [day]:ndm}));
  };

  return (
    <div style={{padding:'12px 16px 90px'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <button onClick={()=>changeDay(-1)} style={{background:N3,border:'none',color:'#fff',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:16}}>‹</button>
        <div style={{flex:1,textAlign:'center',color:'#fff',fontWeight:700,fontSize:14}}>{day===todayStr()?'今日':fmtDate(day)}</div>
        <button onClick={()=>changeDay(1)} style={{background:N3,border:'none',color:'#fff',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:16}} disabled={day>=todayStr()}>›</button>
      </div>

      <div style={{display:'flex',gap:6,marginBottom:14,overflowX:'auto',paddingBottom:2}}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setMealTab(t.id)} style={{background:mealTab===t.id?G:N2,color:mealTab===t.id?'#000':'#fff',border:'none',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontWeight:700,fontSize:12,whiteSpace:'nowrap'}}>
            {t.i} {t.l}
          </button>
        ))}
      </div>

      <Cd style={{marginBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'#fff',fontWeight:700}}>{tabs.find(t=>t.id===mealTab)?.l} 合計</div>
          <div style={{color:G,fontWeight:800}}>{Math.round(mm.cal)} kcal</div>
        </div>
        <div style={{color:S,fontSize:12,marginTop:4}}>P:{mm.p.toFixed(1)}g　F:{mm.f.toFixed(1)}g　C:{mm.c.toFixed(1)}g</div>
      </Cd>

      {items.length===0 ? (
        <div style={{textAlign:'center',padding:'30px 0',color:S}}>
          <div style={{fontSize:40,marginBottom:8}}>🍽️</div>
          <div style={{fontSize:14}}>まだ記録がありません</div>
        </div>
      ) : items.map(it => (
        <Cd key={it.uid||it.id} style={{marginBottom:8,padding:12}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{flex:1}}>
              <div style={{color:'#fff',fontWeight:700,fontSize:13}}>{it.n}</div>
              <div style={{color:S,fontSize:11}}>{it.s||''}　P:{it.p*it.qty}g F:{it.f*it.qty}g C:{it.c*it.qty}g</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{color:G,fontWeight:800,fontSize:14}}>{Math.round(it.cal*it.qty)} kcal</div>
              <button onClick={()=>removeFood(it.uid)} style={{background:'none',border:'none',color:R,cursor:'pointer',fontSize:16,padding:'0 4px'}}>✕</button>
            </div>
          </div>
        </Cd>
      ))}

      <Btn onClick={()=>setShowAdd(true)} full style={{marginTop:8,padding:'12px'}}>＋ 食品を追加</Btn>

      {showAdd && (
        <div onClick={e=>{ if(e.target===e.currentTarget) setShowAdd(false); }} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:N2,borderRadius:'20px 20px 0 0',padding:'20px',width:'100%',maxWidth:480,maxHeight:'80vh',overflow:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{color:'#fff',fontWeight:800,fontSize:16}}>食品を追加</div>
              <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',color:S,cursor:'pointer',fontSize:20}}>✕</button>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:14}}>
              {[{id:'search',l:'🔍 検索'},{id:'manual',l:'✏️ 手入力'}].map(mv => (
                <button key={mv.id} onClick={()=>setMode(mv.id)} style={{flex:1,background:mode===mv.id?G:N3,color:mode===mv.id?'#000':'#fff',border:'none',borderRadius:10,padding:'8px',cursor:'pointer',fontWeight:700,fontSize:12}}>{mv.l}</button>
              ))}
            </div>
            {mode==='search' && (
              <>
                <input style={{...inpStyle,marginBottom:10}} placeholder="食品名・カテゴリで検索" value={search} onChange={e=>setSearch(e.target.value)} />
                {results.map(f => (
                  <div key={f.id} onClick={()=>addFood(f)} style={{background:N,borderRadius:10,padding:'10px 12px',marginBottom:6,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{color:'#fff',fontSize:13,fontWeight:600}}>{f.n}</div>
                      <div style={{color:S,fontSize:11}}>{f.s}　P:{f.p}g F:{f.f}g C:{f.c}g</div>
                    </div>
                    <div style={{color:G,fontWeight:800,fontSize:13}}>{f.cal} kcal</div>
                  </div>
                ))}
              </>
            )}
            {mode==='manual' && (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <input style={inpStyle} placeholder="食品名（必須）" value={manual.n} onChange={e=>setManual(m=>({...m,n:e.target.value}))} />
                <input style={inpStyle} placeholder="カロリー (kcal)（必須）" type="number" value={manual.cal} onChange={e=>setManual(m=>({...m,cal:e.target.value}))} />
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {[['p','P(g)'],['f','F(g)'],['c','C(g)']].map(([k,ph]) => (
                    <input key={k} style={inpStyle} placeholder={ph} type="number" value={manual[k]} onChange={e=>setManual(m=>({...m,[k]:e.target.value}))} />
                  ))}
                </div>
                <Btn onClick={addManual} full>追加</Btn>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── NutritionScreen ──────────────────────────────────
function NutritionScreen({meals, profile}) {
  const goals = calcGoals(profile);
  const today = todayStr();
  const m = getDayMacros(meals[today]);
  const days = Object.keys(meals).sort().slice(-7);
  const calData = days.map(d => ({date:d, cal:getDayMacros(meals[d]).cal}));
  const avg = k => days.reduce((s,d)=>s+getDayMacros(meals[d])[k],0) / Math.max(days.length,1);
  const avgCal=avg('cal'), avgP=avg('p'), avgF=avg('f'), avgC=avg('c');
  const tip = avgF > goals.f*1.15 ? '今週は脂質が多めです。揚げ物を減らしてみましょう。' :
              avgP < goals.p*0.8 ? 'タンパク質が不足気味です。肉・魚・卵を意識しましょう。' :
              'バランスよく食べられています！この調子を維持しましょう。';

  return (
    <div style={{padding:'16px 16px 90px'}}>
      <div style={{color:'#fff',fontSize:18,fontWeight:800,marginBottom:14}}>📊 栄養分析</div>

      <Cd style={{marginBottom:12}}>
        <div style={{color:'#fff',fontWeight:700,marginBottom:12}}>今日のPFCバランス</div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <DonutChart p={m.p} f={m.f} c={m.c} size={110} />
          <div style={{flex:1}}>
            {[{l:'タンパク質(P)',v:m.p,g:goals.p,c:B},{l:'脂質(F)',v:m.f,g:goals.f,c:Y},{l:'炭水化物(C)',v:m.c,g:goals.c,c:G}].map(n => (
              <div key={n.l} style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{color:n.c,fontSize:12,fontWeight:700}}>{n.l}</span>
                  <span style={{color:S,fontSize:11}}>{n.v}g / {n.g}g</span>
                </div>
                <BarProg value={n.v} max={n.g} color={n.c} />
              </div>
            ))}
          </div>
        </div>
      </Cd>

      <Cd style={{marginBottom:12}}>
        <div style={{color:'#fff',fontWeight:700,marginBottom:10}}>週間カロリー推移</div>
        <CalChart data={calData} goal={goals.cal} width={320} />
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8}}>
          <div style={{width:20,height:2,background:Y}} />
          <span style={{color:S,fontSize:11}}>目標: {goals.cal} kcal</span>
        </div>
      </Cd>

      <Cd style={{marginBottom:12}}>
        <div style={{color:'#fff',fontWeight:700,marginBottom:12}}>週間平均</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[{l:'平均カロリー',v:`${Math.round(avgCal)}kcal`,c:'#fff'},{l:'平均P',v:`${avgP.toFixed(1)}g`,c:B},{l:'平均F',v:`${avgF.toFixed(1)}g`,c:Y},{l:'平均C',v:`${avgC.toFixed(1)}g`,c:G}].map(n => (
            <Cd key={n.l} bg={N} style={{padding:10,textAlign:'center'}}>
              <div style={{color:n.c,fontWeight:800,fontSize:16}}>{n.v}</div>
              <div style={{color:S,fontSize:11}}>{n.l}</div>
            </Cd>
          ))}
        </div>
      </Cd>

      <Cd style={{background:G+'18',border:`1px solid ${G}44`}}>
        <div style={{color:G,fontWeight:700,marginBottom:4}}>📈 今週のまとめ</div>
        <div style={{color:S2,fontSize:13,lineHeight:1.6}}>{tip}</div>
      </Cd>
    </div>
  );
}

// ── WeightScreen ─────────────────────────────────────
function WeightScreen({weights, setWeights, profile}) {
  const [w, setW] = useState('');
  const [fat, setFat] = useState('');
  const inpStyle = {background:N,border:`1px solid ${N3}`,borderRadius:8,padding:'10px 12px',color:'#fff',fontSize:15,flex:1};

  const addWeight = () => {
    if (!w) return;
    const entry = {date:todayStr(), weight:+w, fat:fat?+fat:null};
    setWeights([...weights.filter(e=>e.date!==todayStr()), entry].sort((a,b)=>a.date.localeCompare(b.date)));
    setW(''); setFat('');
  };

  const latest = weights.length > 0 ? weights[weights.length-1] : null;
  const first  = weights.length > 0 ? weights[0] : null;
  const bmi = latest && profile ? +(latest.weight / ((parseFloat(profile.height)/100)**2)).toFixed(1) : null;
  const bmiLabel = !bmi?'':bmi<18.5?'低体重':bmi<25?'普通':bmi<30?'肥満(1)':'肥満(2)';
  const bmiColor = !bmi?S:bmi<18.5?Y:bmi<25?G:bmi<30?Y:R;
  const change = latest && first ? +(latest.weight-first.weight).toFixed(1) : null;

  return (
    <div style={{padding:'16px 16px 90px'}}>
      <div style={{color:'#fff',fontSize:18,fontWeight:800,marginBottom:14}}>⚖️ 体重管理</div>

      <Cd style={{marginBottom:12}}>
        <div style={{color:'#fff',fontWeight:700,marginBottom:12}}>体重を記録</div>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <input style={inpStyle} type="number" placeholder="体重 (kg)" value={w} onChange={e=>setW(e.target.value)} step="0.1" />
          <input style={inpStyle} type="number" placeholder="体脂肪率 %" value={fat} onChange={e=>setFat(e.target.value)} step="0.1" />
        </div>
        <Btn onClick={addWeight} full>記録する</Btn>
      </Cd>

      {latest && (
        <>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            <Cd style={{textAlign:'center',padding:14}}>
              <div style={{color:G,fontSize:28,fontWeight:900}}>{latest.weight}</div>
              <div style={{color:S,fontSize:12}}>kg（最新）</div>
            </Cd>
            {bmi && (
              <Cd style={{textAlign:'center',padding:14}}>
                <div style={{color:bmiColor,fontSize:28,fontWeight:900}}>{bmi}</div>
                <div style={{color:S,fontSize:12}}>BMI・{bmiLabel}</div>
              </Cd>
            )}
            {profile?.targetWeight && (
              <Cd style={{textAlign:'center',padding:14}}>
                <div style={{color:G,fontSize:24,fontWeight:900}}>{(latest.weight-parseFloat(profile.targetWeight)).toFixed(1)}</div>
                <div style={{color:S,fontSize:12}}>kg（目標まで）</div>
              </Cd>
            )}
            {change !== null && (
              <Cd style={{textAlign:'center',padding:14}}>
                <div style={{color:change<=0?G:R,fontSize:24,fontWeight:900}}>{change>0?'+':''}{change}</div>
                <div style={{color:S,fontSize:12}}>kg（開始からの変化）</div>
              </Cd>
            )}
          </div>

          <Cd style={{marginBottom:12}}>
            <div style={{color:'#fff',fontWeight:700,marginBottom:10}}>体重推移</div>
            <WeightChart data={weights.slice(-21)} width={320} height={140} />
          </Cd>

          {first && (
            <Cd>
              <div style={{color:'#fff',fontWeight:700,marginBottom:12}}>ビフォーアフター</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[{l:'開始時',d:first},{l:'現在',d:latest}].map(r => (
                  <div key={r.l} style={{background:N,borderRadius:12,padding:12,textAlign:'center'}}>
                    <div style={{color:S,fontSize:11,marginBottom:4}}>{r.l} ({fmtDate(r.d.date)})</div>
                    <div style={{color:'#fff',fontSize:20,fontWeight:900}}>{r.d.weight} kg</div>
                    {r.d.fat && <div style={{color:S,fontSize:12}}>{r.d.fat}%</div>}
                  </div>
                ))}
              </div>
            </Cd>
          )}
        </>
      )}
    </div>
  );
}

// ── CoachScreen ──────────────────────────────────────
function CoachScreen({meals, weights, profile}) {
  const [sub, setSub] = useState('report');
  const [msgs, setMsgs] = useState([
    {id:1,from:'coach',text:'今週もお疲れ様です！タンパク質の摂取量が先週より改善されています。この調子で続けましょう！',date:'2026-03-19'},
    {id:2,from:'coach',text:'週2回の筋トレと合わせて、食後に軽いウォーキングを取り入れてみてください。脂質代謝が高まります。',date:'2026-03-20'},
  ]);
  const [missions, setMissions] = useState([
    {id:1,text:'毎食タンパク質20g以上を意識する',done:false,auto:false,priority:'high'},
    {id:2,text:'毎日記録をつける（7日連続）',done:true,auto:false,priority:'mid'},
    {id:3,text:'夕食の炭水化物を100g以内に抑える',done:false,auto:false,priority:'mid'},
  ]);
  const [missionMode, setMissionMode] = useState('user'); // 'user' | 'coach'
  const [coachPass, setCoachPass] = useState('');
  const [coachUnlocked, setCoachUnlocked] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [newMissionText, setNewMissionText] = useState('');
  const [newPriority, setNewPriority] = useState('mid');
  const [autoMsg, setAutoMsg] = useState('');
  const [input, setInput] = useState('');

  const goals = calcGoals(profile);
  const days = Object.keys(meals).sort().slice(-7);
  const avgCal = days.reduce((s,d)=>s+getDayMacros(meals[d]).cal,0) / Math.max(days.length,1);
  const recorded = days.filter(d=>getDayMacros(meals[d]).cal>0).length;
  const lw = weights.length>0 ? weights[weights.length-1] : null;
  const fw = weights.length>0 ? weights[0] : null;
  const wChange = lw&&fw ? +(lw.weight-fw.weight).toFixed(1) : null;
  const avgScore = days.reduce((s,d)=>s+calcScore(getDayMacros(meals[d]),goals),0) / Math.max(days.length,1);

  const autoReply = (text) => {
    const t = text;
    if (/体重|減.*(た|ない)|増.*(た|ない)|落ち/.test(t))
      return '体重の変化は日々の積み重ねです！水分量や食塩の影響もあるので、週単位のトレンドで判断しましょう。引き続き記録を続けてください💪';
    if (/タンパク質|プロテイン|筋肉|筋トレ|トレーニング/.test(t))
      return 'タンパク質は筋肉の材料になる大切な栄養素です。体重×1.5〜2gを目安に、毎食バランスよく摂れると理想的ですよ🍗';
    if (/脂質|油|揚げ|カロリー高/.test(t))
      return '脂質は悪者ではありませんが、摂りすぎには注意です。良質な脂質（アボカド・オリーブオイル・魚）を中心に選ぶと良いですよ🥑';
    if (/眠れ|睡眠|疲れ|だるい|体調/.test(t))
      return '睡眠不足や疲れは食欲増加・代謝低下につながります。まずはしっかり休むことも立派なトレーニングです。無理せず行きましょう😌';
    if (/食欲|食べ過ぎ|つい食べ|間食|やめられ/.test(t))
      return '食欲のコントロールは誰でも難しいです。まず「なぜ食べたくなるか」を記録してみましょう。ストレス・睡眠不足・水分不足が原因のことが多いですよ🧘';
    if (/モチベ|やる気|続か|挫折|辛い|しんどい/.test(t))
      return '気持ちが落ちる時期は誰にでもあります！小さな目標を一つクリアするだけで十分です。今日も記録してくれたこと、それだけで素晴らしい👏';
    if (/水分|水|飲み物/.test(t))
      return '水分補給はダイエット・筋肉合成・代謝すべてに影響します。1日1.5〜2Lを目安に、こまめに飲む習慣をつけましょう💧';
    if (/炭水化物|糖質|ご飯|パン|ラーメン/.test(t))
      return '炭水化物はエネルギー源として重要です。完全にカットするより、夕食を少し減らして朝・昼にしっかり摂るサイクルがおすすめです🍚';
    if (/おすすめ|何を食べ|メニュー|レシピ/.test(t))
      return 'おすすめは「鶏むね肉＋ブロッコリー＋玄米」の組み合わせ！高タンパク・低脂質・栄養バランスが整った王道メニューです🥦🍗';
    if (/ありがとう|感謝|嬉しい/.test(t))
      return 'こちらこそ、毎日頑張ってくれてありがとうございます！一緒に目標に向かっていきましょう😊';
    if (/質問|聞きた|教えて/.test(t))
      return 'もちろんです！気になることはどんどん聞いてください。より具体的に教えてもらえると、的確なアドバイスができますよ✍️';
    return 'メッセージありがとうございます！内容を確認しました。目標に向けて一緒に取り組んでいきましょう💡次回のチェックインも楽しみにしています。';
  };

  const send = () => {
    if (!input.trim()) return;
    const userText = input;
    setMsgs(m => [...m, {id:Date.now(), from:'user', text:userText, date:todayStr()}]);
    setInput('');
    setTimeout(() => {
      setMsgs(m => [...m, {id:Date.now()+1, from:'coach', text:autoReply(userText), date:todayStr()}]);
    }, 800);
  };

  return (
    <div style={{padding:'12px 16px 90px'}}>
      <div style={{color:'#fff',fontSize:18,fontWeight:800,marginBottom:12}}>👨‍💼 コーチ</div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {[{id:'report',l:'📋 レポート'},{id:'messages',l:'💬 メッセージ'},{id:'missions',l:'🎯 ミッション'}].map(sv => (
          <button key={sv.id} onClick={()=>setSub(sv.id)} style={{flex:1,background:sub===sv.id?G:N2,color:sub===sv.id?'#000':'#fff',border:'none',borderRadius:10,padding:'8px 4px',cursor:'pointer',fontWeight:700,fontSize:11,whiteSpace:'nowrap'}}>{sv.l}</button>
        ))}
      </div>

      {sub==='report' && (
        <>
          <Cd style={{marginBottom:10}}>
            <div style={{color:'#fff',fontWeight:700,marginBottom:12}}>週次レポート</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[{l:'平均カロリー',v:`${Math.round(avgCal)}kcal`,c:G},{l:'記録日数',v:`${recorded}/7日`,c:B},{l:'体重変化',v:wChange!==null?`${wChange>0?'+':''}${wChange}kg`:'--',c:wChange!==null&&wChange<=0?G:R},{l:'食事スコア',v:`${Math.round(avgScore)}点`,c:avgScore>=70?G:Y}].map(n => (
                <Cd key={n.l} bg={N} style={{padding:12,textAlign:'center'}}>
                  <div style={{color:n.c,fontSize:18,fontWeight:900}}>{n.v}</div>
                  <div style={{color:S,fontSize:11,marginTop:2}}>{n.l}</div>
                </Cd>
              ))}
            </div>
          </Cd>
          <Cd style={{background:G+'18',border:`1px solid ${G}44`}}>
            <div style={{color:G,fontWeight:700,marginBottom:6}}>AIサマリー</div>
            <div style={{color:S2,fontSize:13,lineHeight:1.7}}>
              {recorded>=5 ? `今週は${recorded}日記録できました。素晴らしい継続力です！` : `今週は${recorded}日の記録です。毎日記録する習慣をつけましょう。`}
              {wChange!==null && wChange<0 ? ` 体重は${Math.abs(wChange)}kg減少しています。目標に向けて順調に進んでいます。` : ''}
              {avgScore>=70 ? ' 食事スコアも高水準をキープできています。' : ` 食事スコアは${Math.round(avgScore)}点です。栄養バランスを意識してみましょう。`}
            </div>
          </Cd>
        </>
      )}

      {sub==='messages' && (
        <>
          <div style={{marginBottom:10,maxHeight:340,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
            {msgs.map(msg => (
              <div key={msg.id} style={{display:'flex',justifyContent:msg.from==='user'?'flex-end':'flex-start'}}>
                <div style={{maxWidth:'80%',background:msg.from==='user'?G:N2,borderRadius:msg.from==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',padding:'10px 14px'}}>
                  <div style={{color:msg.from==='user'?'#000':'#fff',fontSize:13,lineHeight:1.6}}>{msg.text}</div>
                  <div style={{color:msg.from==='user'?'rgba(0,0,0,0.4)':'rgba(255,255,255,0.4)',fontSize:10,marginTop:4}}>{fmtDate(msg.date)}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} placeholder="コーチへのメッセージ..." onKeyDown={e=>e.key==='Enter'&&send()} style={{flex:1,background:N2,border:`1px solid ${N3}`,borderRadius:10,padding:'10px 14px',color:'#fff',fontSize:13}} />
            <Btn onClick={send} sm>送信</Btn>
          </div>
        </>
      )}

      {sub==='missions' && (() => {
        const goals2 = calcGoals(profile);
        const days2 = Object.keys(meals).sort().slice(-7);
        const avgP2 = days2.reduce((s,d)=>s+getDayMacros(meals[d]).p,0)/Math.max(days2.length,1);
        const avgF2 = days2.reduce((s,d)=>s+getDayMacros(meals[d]).f,0)/Math.max(days2.length,1);
        const avgCal2 = days2.reduce((s,d)=>s+getDayMacros(meals[d]).cal,0)/Math.max(days2.length,1);
        const recorded2 = days2.filter(d=>getDayMacros(meals[d]).cal>0).length;
        const lw2 = weights.length>0?weights[weights.length-1]:null;
        const wChange2 = weights.length>1?+(weights[weights.length-1].weight-weights[0].weight).toFixed(1):null;

        const autoGenerate = () => {
          const newMissions = [];
          if (avgP2 < goals2.p * 0.8)
            newMissions.push({id:Date.now()+1, text:`毎食タンパク質を意識して摂る（目標：${goals2.p}g/日）`, done:false, auto:true, priority:'high'});
          if (avgF2 > goals2.f * 1.15)
            newMissions.push({id:Date.now()+2, text:'今週は揚げ物・脂っこい食事を2回以内に抑える', done:false, auto:true, priority:'high'});
          if (recorded2 < 5)
            newMissions.push({id:Date.now()+3, text:'今週は毎日食事を記録する（7日連続を目指そう）', done:false, auto:true, priority:'mid'});
          if (avgCal2 > goals2.cal * 1.1)
            newMissions.push({id:Date.now()+4, text:`1日の摂取カロリーを${goals2.cal}kcal以内に抑える`, done:false, auto:true, priority:'high'});
          if (wChange2 !== null && wChange2 > 0.5)
            newMissions.push({id:Date.now()+5, text:'夕食の炭水化物を100g以内に抑えてみる', done:false, auto:true, priority:'mid'});
          if (newMissions.length === 0)
            newMissions.push({id:Date.now()+6, text:'今週の目標：毎日水を2L以上飲む', done:false, auto:true, priority:'low'});

          setMissions(m => {
            const manual = m.filter(mi => !mi.auto);
            return [...manual, ...newMissions];
          });
          setAutoMsg(`${newMissions.length}件のミッションを自動生成しました！`);
          setTimeout(()=>setAutoMsg(''),3000);
        };

        const addMission = () => {
          if (!newMissionText.trim()) return;
          setMissions(m => [...m, {id:Date.now(), text:newMissionText, done:false, auto:false, priority:newPriority}]);
          setNewMissionText(''); setNewPriority('mid');
        };

        const deleteMission = id => setMissions(m => m.filter(mi=>mi.id!==id));
        const startEdit = ms => { setEditingId(ms.id); setEditText(ms.text); };
        const saveEdit = () => {
          setMissions(m => m.map(mi=>mi.id===editingId?{...mi,text:editText}:mi));
          setEditingId(null); setEditText('');
        };

        const pColor = p => p==='high'?R:p==='mid'?Y:G;
        const pLabel = p => p==='high'?'高':p==='mid'?'中':'低';
        const inpS = {background:N,border:`1px solid ${N3}`,borderRadius:8,padding:'8px 12px',color:'#fff',fontSize:13,width:'100%',boxSizing:'border-box'};

        return (
          <div>
            {/* モード切替 */}
            <div style={{display:'flex',gap:6,marginBottom:12}}>
              <button onClick={()=>setMissionMode('user')} style={{flex:1,background:missionMode==='user'?G:N2,color:missionMode==='user'?'#000':'#fff',border:'none',borderRadius:10,padding:'8px',cursor:'pointer',fontWeight:700,fontSize:12}}>👤 ユーザー画面</button>
              <button onClick={()=>setMissionMode('coach')} style={{flex:1,background:missionMode==='coach'?PU:N2,color:missionMode==='coach'?'#fff':'#fff',border:`1px solid ${missionMode==='coach'?PU:N3}`,borderRadius:10,padding:'8px',cursor:'pointer',fontWeight:700,fontSize:12}}>🔑 コーチ管理</button>
            </div>

            {/* コーチ認証 */}
            {missionMode==='coach' && !coachUnlocked && (
              <Cd bg={N2} style={{marginBottom:12}}>
                <div style={{color:'#fff',fontWeight:700,marginBottom:8}}>コーチ用パスワード</div>
                <div style={{display:'flex',gap:8}}>
                  <input style={{...inpS,flex:1}} type="password" placeholder="パスワードを入力（初期: coach）" value={coachPass} onChange={e=>setCoachPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(coachPass==='coach'?setCoachUnlocked(true):null)} />
                  <Btn onClick={()=>coachPass==='coach'?setCoachUnlocked(true):alert('パスワードが違います')} sm color={PU} style={{color:'#fff'}}>解除</Btn>
                </div>
                <div style={{color:S,fontSize:11,marginTop:6}}>初期パスワード: <span style={{color:PU}}>coach</span></div>
              </Cd>
            )}

            {/* コーチ管理パネル */}
            {missionMode==='coach' && coachUnlocked && (
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{color:PU,fontWeight:800,fontSize:14}}>🔑 コーチ管理パネル</div>
                  <button onClick={()=>{setCoachUnlocked(false);setMissionMode('user');}} style={{background:'none',border:'none',color:S,fontSize:12,cursor:'pointer'}}>ロック</button>
                </div>

                {/* 自動生成 */}
                <Cd bg={N2} style={{marginBottom:12}}>
                  <div style={{color:'#fff',fontWeight:700,fontSize:13,marginBottom:4}}>🤖 データ分析から自動生成</div>
                  <div style={{color:S,fontSize:12,marginBottom:10,lineHeight:1.6}}>
                    直近7日間の食事・体重データを分析して、ユーザーに最適なミッションを自動で設定します。
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
                    {[{l:'平均P',v:`${avgP2.toFixed(0)}g`,ok:avgP2>=goals2.p*0.8},{l:'平均Cal',v:`${Math.round(avgCal2)}kcal`,ok:Math.abs(avgCal2-goals2.cal)<goals2.cal*0.1},{l:'記録日数',v:`${recorded2}/7`,ok:recorded2>=5}].map(it=>(
                      <div key={it.l} style={{background:N,borderRadius:8,padding:'8px',textAlign:'center'}}>
                        <div style={{color:it.ok?G:R,fontWeight:800,fontSize:14}}>{it.v}</div>
                        <div style={{color:S,fontSize:10}}>{it.l}</div>
                      </div>
                    ))}
                  </div>
                  {autoMsg && <div style={{color:G,fontSize:12,marginBottom:8,fontWeight:700}}>{autoMsg}</div>}
                  <Btn onClick={autoGenerate} full color={PU} style={{color:'#fff'}}>⚡ AIミッションを自動生成</Btn>
                </Cd>

                {/* 手動追加 */}
                <Cd bg={N2} style={{marginBottom:12}}>
                  <div style={{color:'#fff',fontWeight:700,fontSize:13,marginBottom:10}}>＋ ミッションを手動追加</div>
                  <input style={{...inpS,marginBottom:8}} placeholder="ミッション内容を入力..." value={newMissionText} onChange={e=>setNewMissionText(e.target.value)} />
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <div style={{color:S,fontSize:12,flexShrink:0}}>優先度：</div>
                    {[{v:'high',l:'高',c:R},{v:'mid',l:'中',c:Y},{v:'low',l:'低',c:G}].map(pv=>(
                      <button key={pv.v} onClick={()=>setNewPriority(pv.v)} style={{flex:1,background:newPriority===pv.v?pv.c:N3,color:'#fff',border:'none',borderRadius:8,padding:'6px',cursor:'pointer',fontWeight:700,fontSize:12}}>{pv.l}</button>
                    ))}
                    <Btn onClick={addMission} sm color={PU} style={{color:'#fff',flexShrink:0}}>追加</Btn>
                  </div>
                </Cd>

                {/* ミッション一覧（編集・削除）*/}
                <div style={{color:'#fff',fontWeight:700,fontSize:13,marginBottom:8}}>📋 現在のミッション ({missions.length}件)</div>
                {missions.map(ms => (
                  <Cd key={ms.id} style={{marginBottom:8,padding:12}}>
                    {editingId===ms.id ? (
                      <div style={{display:'flex',gap:8}}>
                        <input style={{...inpS,flex:1}} value={editText} onChange={e=>setEditText(e.target.value)} autoFocus />
                        <Btn onClick={saveEdit} sm color={G}>保存</Btn>
                        <Btn onClick={()=>setEditingId(null)} sm outline>✕</Btn>
                      </div>
                    ) : (
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:pColor(ms.priority||'mid'),flexShrink:0}} />
                        <div style={{flex:1,color:ms.done?S:S2,fontSize:12,textDecoration:ms.done?'line-through':'none'}}>{ms.text}</div>
                        {ms.auto && <span style={{background:PU+'33',color:PU,fontSize:9,borderRadius:4,padding:'2px 5px',flexShrink:0}}>AUTO</span>}
                        <button onClick={()=>startEdit(ms)} style={{background:'none',border:'none',color:B,cursor:'pointer',fontSize:16,padding:'0 2px'}}>✏️</button>
                        <button onClick={()=>deleteMission(ms.id)} style={{background:'none',border:'none',color:R,cursor:'pointer',fontSize:16,padding:'0 2px'}}>🗑</button>
                      </div>
                    )}
                  </Cd>
                ))}
              </div>
            )}

            {/* ユーザー画面 */}
            {missionMode==='user' && (
              <div>
                {missions.length===0 && <div style={{textAlign:'center',padding:'30px 0',color:S}}><div style={{fontSize:36,marginBottom:8}}>🎯</div><div>ミッションはまだありません</div></div>}
                {['high','mid','low'].map(pr => {
                  const group = missions.filter(ms=>(ms.priority||'mid')===pr);
                  if (group.length===0) return null;
                  return (
                    <div key={pr}>
                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:pColor(pr)}} />
                        <div style={{color:S,fontSize:11,fontWeight:700}}>優先度{pLabel(pr)}</div>
                      </div>
                      {group.map(ms => (
                        <Cd key={ms.id} style={{marginBottom:8,padding:12}}>
                          <div style={{display:'flex',alignItems:'center',gap:12}}>
                            <button onClick={()=>setMissions(m=>m.map(mi=>mi.id===ms.id?{...mi,done:!mi.done}:mi))} style={{width:24,height:24,borderRadius:'50%',border:`2px solid ${ms.done?G:N3}`,background:ms.done?G:'transparent',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#000',fontSize:14,fontWeight:800}}>
                              {ms.done ? '✓' : ''}
                            </button>
                            <div style={{flex:1}}>
                              <div style={{color:ms.done?S:S2,fontSize:13,textDecoration:ms.done?'line-through':'none'}}>{ms.text}</div>
                              {ms.auto && <span style={{color:PU,fontSize:10}}>⚡ AI自動生成</span>}
                            </div>
                          </div>
                        </Cd>
                      ))}
                    </div>
                  );
                })}
                <div style={{textAlign:'center',marginTop:10}}>
                  <div style={{color:S,fontSize:12}}>{missions.filter(m=>m.done).length}/{missions.length} 達成</div>
                  <BarProg value={missions.filter(m=>m.done).length} max={missions.length} h={6} />
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── ExportScreen ─────────────────────────────────────
function ExportScreen({meals, weights, profile, onClose}) {
  const [type, setType] = useState('meals');
  const [copied, setCopied] = useState(false);

  const goals = calcGoals(profile);

  const mealRows = () => {
    const header = ['日付','食事区分','食品名','カロリー(kcal)','タンパク質(g)','脂質(g)','炭水化物(g)','合計カロリー','合計P','合計F','合計C','食事スコア'];
    const rows = [header];
    Object.keys(meals).sort().forEach(date => {
      const dm = meals[date];
      const dayM = getDayMacros(dm);
      const score = calcScore(dayM, goals);
      const sections = [{key:'breakfast',l:'朝食'},{key:'lunch',l:'昼食'},{key:'dinner',l:'夕食'},{key:'snack',l:'間食'}];
      sections.forEach(sec => {
        const items = dm[sec.key] || [];
        items.forEach((it, i) => {
          rows.push([
            date, sec.l, it.n,
            Math.round(it.cal*(it.qty||1)),
            +((it.p||0)*(it.qty||1)).toFixed(1),
            +((it.f||0)*(it.qty||1)).toFixed(1),
            +((it.c||0)*(it.qty||1)).toFixed(1),
            i===0 ? dayM.cal : '',
            i===0 ? dayM.p : '',
            i===0 ? dayM.f : '',
            i===0 ? dayM.c : '',
            i===0 ? score : '',
          ]);
        });
      });
    });
    return rows;
  };

  const weightRows = () => {
    const header = ['日付','体重(kg)','体脂肪率(%)','BMI','目標体重(kg)','差分(kg)'];
    const rows = [header];
    weights.forEach(w => {
      const h = parseFloat(profile?.height)||170;
      const bmi = +(w.weight/((h/100)**2)).toFixed(1);
      const diff = profile?.targetWeight ? +(w.weight - parseFloat(profile.targetWeight)).toFixed(1) : '';
      rows.push([w.date, w.weight, w.fat||'', bmi, profile?.targetWeight||'', diff]);
    });
    return rows;
  };

  const nutritionRows = () => {
    const header = ['日付','カロリー(kcal)','目標Cal','Cal達成率(%)','P(g)','目標P','P達成率(%)','F(g)','目標F','F達成率(%)','C(g)','目標C','C達成率(%)','食事スコア'];
    const rows = [header];
    Object.keys(meals).sort().forEach(date => {
      const m = getDayMacros(meals[date]);
      const pct = v => goals[v]>0 ? Math.round(m[v]/goals[v]*100) : 0;
      rows.push([
        date, m.cal, goals.cal, pct('cal'),
        m.p, goals.p, pct('p'),
        m.f, goals.f, pct('f'),
        m.c, goals.c, pct('c'),
        calcScore(m, goals),
      ]);
    });
    return rows;
  };

  const getRows = () => type==='meals' ? mealRows() : type==='weight' ? weightRows() : nutritionRows();

  const toCSV = rows => rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const toTSV = rows => rows.map(r => r.join('\t')).join('\n');

  const csvText = toCSV(getRows());
  const tsvText = toTSV(getRows());

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(()=>setCopied(false), 2000); });
  };

  const download = () => {
    const blob = new Blob(['\uFEFF'+csvText], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mealcare_${type}_${todayStr()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const rows = getRows();
  const header = rows[0];
  const dataRows = rows.slice(1);

  const tabs2 = [{id:'meals',l:'🍽️ 食事記録'},{id:'weight',l:'⚖️ 体重'},{id:'nutrition',l:'📊 栄養'}];

  return (
    <div style={{position:'fixed',inset:0,background:N,zIndex:300,overflow:'auto',maxWidth:480,margin:'0 auto'}}>
      <div style={{padding:'16px 16px 100px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <button onClick={onClose} style={{background:N3,border:'none',color:'#fff',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:14}}>← 戻る</button>
          <div style={{color:'#fff',fontSize:18,fontWeight:800}}>📤 Sheetsエクスポート</div>
        </div>

        {/* 手順 */}
        <Cd bg={N2} style={{marginBottom:14,padding:14}}>
          <div style={{color:G,fontWeight:700,fontSize:13,marginBottom:8}}>📋 Google Sheetsへの取り込み手順</div>
          {[
            '① 下の「タブ区切りでコピー」ボタンを押す',
            '② Googleスプレッドシートを開く',
            '③ 貼り付けたいセル(A1)をクリック',
            '④ Ctrl+V（Mac: ⌘+V）で貼り付け',
            '　 → 自動的に列に分かれて入力されます',
          ].map((s,i) => <div key={i} style={{color:S2,fontSize:12,lineHeight:1.8}}>{s}</div>)}
          <div style={{marginTop:10,padding:'8px 10px',background:B+'22',borderRadius:8,border:`1px solid ${B}44`}}>
            <div style={{color:B,fontSize:12}}>💡 CSVダウンロードも可能です。スプレッドシートの「ファイル → インポート」からCSVファイルを取り込んでください。</div>
          </div>
        </Cd>

        {/* タブ */}
        <div style={{display:'flex',gap:6,marginBottom:12}}>
          {tabs2.map(t => (
            <button key={t.id} onClick={()=>setType(t.id)} style={{flex:1,background:type===t.id?G:N2,color:type===t.id?'#000':'#fff',border:'none',borderRadius:10,padding:'8px 4px',cursor:'pointer',fontWeight:700,fontSize:11,whiteSpace:'nowrap'}}>{t.l}</button>
          ))}
        </div>

        {/* ボタン群 */}
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          <button onClick={()=>copy(tsvText)} style={{flex:2,background:copied?G:B,color:'#fff',border:'none',borderRadius:10,padding:'11px',cursor:'pointer',fontWeight:700,fontSize:13,transition:'background 0.3s'}}>
            {copied ? '✓ コピー完了！' : '📋 タブ区切りでコピー'}
          </button>
          <button onClick={download} style={{flex:1,background:N2,color:'#fff',border:`1px solid ${N3}`,borderRadius:10,padding:'11px',cursor:'pointer',fontWeight:700,fontSize:12}}>
            ⬇ CSV
          </button>
        </div>

        {/* プレビューテーブル */}
        <div style={{color:S,fontSize:12,marginBottom:6}}>{dataRows.length} 件のデータ（プレビュー）</div>
        <div style={{overflowX:'auto',borderRadius:12,border:`1px solid ${N3}`}}>
          <table style={{borderCollapse:'collapse',width:'100%',minWidth:600,fontSize:11}}>
            <thead>
              <tr style={{background:N3}}>
                {header.map((h,i) => <th key={i} style={{color:S2,padding:'8px 10px',textAlign:'left',whiteSpace:'nowrap',fontWeight:700}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {dataRows.slice(0,15).map((row,i) => (
                <tr key={i} style={{background:i%2===0?N2:N, borderBottom:`1px solid ${N3}`}}>
                  {row.map((cell,j) => <td key={j} style={{color:S2,padding:'6px 10px',whiteSpace:'nowrap'}}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {dataRows.length > 15 && (
            <div style={{color:S,fontSize:11,textAlign:'center',padding:'8px',background:N2}}>... 他 {dataRows.length-15} 件</div>
          )}
        </div>

        {/* スプレッドシートリンク */}
        <Cd bg={N2} style={{marginTop:14}}>
          <div style={{color:'#fff',fontWeight:700,fontSize:13,marginBottom:6}}>🔗 対象スプレッドシート</div>
          <a href="https://docs.google.com/spreadsheets/d/1VNIHx9MuKUJ4EP5gcpqiznf-6wxQnpmZz9xCpVIIwuM/edit" target="_blank" rel="noreferrer"
            style={{color:B,fontSize:12,wordBreak:'break-all'}}>
            食事管理シート →
          </a>
        </Cd>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mc_profile')) || null; } catch(e) { return null; }
  });
  const [meals, setMeals] = useState(() => {
    try { const m = JSON.parse(localStorage.getItem('mc_meals')); return m && Object.keys(m).length>0 ? m : genSampleMeals(); } catch(e) { return genSampleMeals(); }
  });
  const [weights, setWeights] = useState(() => {
    try { const w = JSON.parse(localStorage.getItem('mc_weights')); return w && w.length>0 ? w : genSampleWeights(); } catch(e) { return genSampleWeights(); }
  });
  const [tab, setTab] = useState('home');
  const [mealTab, setMealTab] = useState('breakfast');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => { try { if(profile) localStorage.setItem('mc_profile',JSON.stringify(profile)); } catch(e) {} }, [profile]);
  useEffect(() => { try { localStorage.setItem('mc_meals',JSON.stringify(meals)); } catch(e) {} }, [meals]);
  useEffect(() => { try { localStorage.setItem('mc_weights',JSON.stringify(weights)); } catch(e) {} }, [weights]);

  if (!profile) return <Onboarding onDone={pf => { setProfile(pf); setTab('home'); }} />;

  return (
    <div style={{background:N, minHeight:'100vh', maxWidth:480, margin:'0 auto', fontFamily:'-apple-system,BlinkMacSystemFont,"Hiragino Sans","Noto Sans JP",sans-serif', color:'#fff'}}>
      {showExport && <ExportScreen meals={meals} weights={weights} profile={profile} onClose={()=>setShowExport(false)} />}
      <div style={{paddingTop:8}}>
        {/* 上部にエクスポートボタン */}
        <div style={{display:'flex',justifyContent:'flex-end',padding:'4px 16px 0'}}>
          <button onClick={()=>setShowExport(true)} style={{background:N2,border:`1px solid ${N3}`,borderRadius:8,color:S2,fontSize:11,fontWeight:700,padding:'5px 10px',cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
            📤 Sheetsへ出力
          </button>
        </div>
        {tab==='home'      && <HomeScreen profile={profile} meals={meals} weights={weights} setTab={setTab} setMealTab={setMealTab} />}
        {tab==='log'       && <LogScreen meals={meals} setMeals={setMeals} mealTab={mealTab} setMealTab={setMealTab} />}
        {tab==='nutrition' && <NutritionScreen meals={meals} profile={profile} />}
        {tab==='weight'    && <WeightScreen weights={weights} setWeights={setWeights} profile={profile} />}
        {tab==='coach'     && <CoachScreen meals={meals} weights={weights} profile={profile} />}
      </div>
      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}