import React, { useState, useEffect } from "react";
import { RECIPES } from "./data/recipes";
import { searchFoods, scaleFood } from "./data/foods/index.js";

function suggestRecipes(answer){
  var scored=RECIPES.map(function(r){
    var score=0;
    if(r.scene.indexOf(answer.scene)>=0) score+=50;
    if(r.calRange===answer.calRange) score+=30;
    if(answer.ingredient==='おまかせ') score+=20;
    else if(r.mainIngredient===answer.ingredient) score+=40;
    score+=Math.max(0,20-r.cookTimeMin);
    score+=Math.random()*5;
    return {recipe:r,score:score};
  });
  scored.sort(function(a,b){return b.score-a.score;});
  return scored.slice(0,3).map(function(x){return x.recipe;});
}

function migrateLocalStorage(){
  var currentVersion=localStorage.getItem('mc2_migration_v')||'0';
  if(currentVersion==='1') return;
  try{
    var oldWater=localStorage.getItem('mc_water');
    if(oldWater&&!localStorage.getItem('mc2_water')){
      localStorage.setItem('mc2_water',oldWater);
    }
    var oldMeals=localStorage.getItem('mc_meals');
    if(oldMeals&&!localStorage.getItem('mc2_meals')){
      localStorage.setItem('mc2_meals',oldMeals);
    }
    var oldWeights=localStorage.getItem('mc_weights');
    if(oldWeights&&!localStorage.getItem('mc2_weights')){
      localStorage.setItem('mc2_weights',oldWeights);
    }
    ['mc_water','mc_meals','mc_weights'].forEach(function(k){
      localStorage.removeItem(k);
    });
    localStorage.setItem('mc2_migration_v','1');
  }catch(e){
    console.error('[migration] failed',e);
  }
}

class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state={hasError:false,error:null};
  }
  static getDerivedStateFromError(error){
    return {hasError:true,error:error};
  }
  componentDidCatch(error,info){
    console.error('[ErrorBoundary]',error,info);
    try{
      var logs=JSON.parse(localStorage.getItem('mc2_error_logs')||'[]');
      logs.push({
        at:new Date().toISOString(),
        message:error.message,
        screen:this.props.screen
      });
      localStorage.setItem('mc2_error_logs',JSON.stringify(logs.slice(-20)));
    }catch{/* ログ保存に失敗しても画面表示は続ける */}
  }
  render(){
    if(this.state.hasError){
      var self=this;
      return React.createElement('div',{
        style:{padding:24,textAlign:'center',background:'#1e293b',borderRadius:12,margin:16,color:'#cbd5e1'}
      },
        React.createElement('div',{style:{fontSize:36,marginBottom:12}},'😢'),
        React.createElement('div',{style:{fontSize:16,fontWeight:'bold',marginBottom:8}},'画面の表示に失敗しました'),
        React.createElement('div',{style:{fontSize:12,opacity:0.8,marginBottom:16}},this.state.error?this.state.error.message:'不明なエラー'),
        React.createElement('button',{
          onClick:function(){self.setState({hasError:false,error:null});},
          style:{background:'#22c55e',color:'#fff',border:'none',padding:'10px 24px',borderRadius:8,fontWeight:'bold',cursor:'pointer'}
        },'🔄 もう一度開く')
      );
    }
    return this.props.children;
  }
}

var G='#22c55e',N='#0f172a',N2='#1e293b',N3='#334155',S='#94a3b8',S2='#cbd5e1',R='#ef4444',Y='#f59e0b',B='#3b82f6',PU='#8b5cf6';


function getDisplayName(profile){
  var name=profile&&profile.name?profile.name.trim():'';
  return name&&name.length>0?name:'あなた';
}
// 端末のローカル日付（日本時間なら JST）で YYYY-MM-DD を返す。toISOString は UTC なので使わない
function dateStr(d){var m=d.getMonth()+1,day=d.getDate();return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(day<10?'0':'')+day;}
function todayStr(){return dateStr(new Date());}
function shiftDate(ds,delta){var d=new Date(ds+'T12:00:00');d.setDate(d.getDate()+delta);return dateStr(d);}
function lastNDays(n){var t=todayStr(),out=[];for(var i=n-1;i>=0;i--)out.push(shiftDate(t,-i));return out;}
function hasRecord(meals,d){return getDayMacros(meals[d]).cal>0;}
// 今日（今日が未記録なら昨日）から遡って連続で記録できている日数
function calcStreak(meals){
  var d=todayStr();
  if(!hasRecord(meals,d)) d=shiftDate(d,-1);
  var n=0;
  while(hasRecord(meals,d)&&n<3650){n++;d=shiftDate(d,-1);}
  return n;
}
function loadJSON(key,fallback){try{var v=JSON.parse(localStorage.getItem(key));return v==null?fallback:v;}catch{return fallback;}}
function saveJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch(e){console.error('[storage] save failed',key,e);}}
function fmtDate(d){var dt=new Date(d+'T12:00:00');return (dt.getMonth()+1)+'/'+dt.getDate();}
function mkId(){return Math.random().toString(36).slice(2,9);}

function getMacros(items){
  if(!items) return {cal:0,p:0,f:0,c:0};
  return items.reduce(function(a,it){
    var q=it.qty||1;
    return {cal:a.cal+(it.cal||0)*q,p:a.p+(it.p||0)*q,f:a.f+(it.f||0)*q,c:a.c+(it.c||0)*q};
  },{cal:0,p:0,f:0,c:0});
}
function getDayMacros(dm){
  if(!dm) return {cal:0,p:0,f:0,c:0};
  var all=[].concat(dm.breakfast||[],dm.lunch||[],dm.dinner||[],dm.snack||[]);
  var r=getMacros(all);
  return {cal:Math.round(r.cal),p:Math.round(r.p*10)/10,f:Math.round(r.f*10)/10,c:Math.round(r.c*10)/10};
}
function calcGoals(pf){
  if(!pf) return {cal:2000,p:150,f:55,c:250};
  if(pf.goals) return pf.goals;
  var h=parseFloat(pf.height)||170,w=parseFloat(pf.weight)||70,a=parseInt(pf.age)||30,g=pf.gender;
  var bmr=g==='female'?10*w+6.25*h-5*a-161:10*w+6.25*h-5*a+5;
  var tdee=bmr*1.55;
  var cal=Math.round(pf.goal==='diet'?tdee-500:pf.goal==='muscle'?tdee+300:tdee);
  var pr=Math.round(w*(pf.goal==='muscle'?2.0:1.6));
  var ft=Math.round(cal*0.25/9);
  var cb=Math.round((cal-pr*4-ft*9)/4);
  return {cal:cal,p:pr,f:ft,c:cb};
}
function calcScore(m,goals){
  if(!goals||m.cal===0) return 0;
  var cs=Math.max(0,100-Math.abs(m.cal-goals.cal)/goals.cal*100);
  var ps=m.p>=goals.p?100:m.p/goals.p*100;
  var fs=m.f<=goals.f*1.2?100:Math.max(0,100-(m.f-goals.f*1.2)/goals.f*50);
  var cc=Math.max(0,100-Math.abs(m.c-goals.c)/goals.c*60);
  return Math.round(cs*0.4+ps*0.3+fs*0.15+cc*0.15);
}

// ── AI Photo Analysis (via /api/photo proxy) ──
// スマホの写真は数MB〜十数MBあり、HEIC のこともある。長辺1568pxの JPEG に縮小してから送る
var PHOTO_MAX_EDGE=1568;
function prepareImage(file){
  return new Promise(function(resolve,reject){
    var url=URL.createObjectURL(file);
    var img=new Image();
    img.onload=function(){
      var scale=Math.min(1,PHOTO_MAX_EDGE/Math.max(img.naturalWidth,img.naturalHeight));
      var w=Math.round(img.naturalWidth*scale),h=Math.round(img.naturalHeight*scale);
      var canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
      ctx.drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      var dataUrl=canvas.toDataURL('image/jpeg',0.85);
      resolve({base64:dataUrl.split(',')[1],mediaType:'image/jpeg'});
    };
    img.onerror=function(){URL.revokeObjectURL(url);reject(new Error('decode failed'));};
    img.src=url;
  });
}
function photoErrorMessage(status){
  if(status===422) return '食べ物を見つけられませんでした。料理全体が写るように撮り直してみてください。';
  if(status===413) return '画像が大きすぎました。別の写真で試してください。';
  if(status===429) return '混み合っています。少し時間をおいてもう一度お試しください。';
  if(status===0) return '通信できませんでした。電波の良い場所でもう一度お試しください。';
  return '解析に失敗しました。もう一度試すか、検索・手入力で記録してください。';
}
// payload: { base64, mediaType, hint } で写真、{ text } で文字から推定
function callFoodAI(payload, onSuccess, onError) {
  fetch('/api/photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(function(r){ return r.json().catch(function(){return {};}).then(function(d){ return {ok:r.ok, status:r.status, data:d}; }); })
    .then(function(res){
      var items = res.data && res.data.items;
      if(res.ok && Array.isArray(items) && items.length>0) onSuccess(items.map(function(it){return Object.assign({},it,{base:Object.assign({},it)});}));
      else onError(photoErrorMessage(res.ok?422:res.status));
    })
    .catch(function(){ onError(photoErrorMessage(0)); });
}

// ── LINE 公式アカウント連携 ──
var LINE_ID='@741apbnk';
var LINE_ADD_URL='https://line.me/R/ti/p/'+LINE_ID;
// 公式アカウントとのトークを開き、本文を入力欄に入れた状態にする（送信はユーザーが押す）
function lineMessageUrl(text){return 'https://line.me/R/oaMessage/'+LINE_ID+'/?'+encodeURIComponent(text);}
function openLine(text,from){
  var log=loadJSON('mc2_line_clicks',[]);
  log.push({at:new Date().toISOString(),from:from||'coach'});
  saveJSON('mc2_line_clicks',log.slice(-100));
  window.open(text?lineMessageUrl(text):LINE_ADD_URL,'_blank','noopener');
}
var MEAL_SECTIONS=[{id:'breakfast',l:'朝食'},{id:'lunch',l:'昼食'},{id:'dinner',l:'夕食'},{id:'snack',l:'間食'}];
function buildDailyReport(profile,meals,weights,day){
  var goals=calcGoals(profile);
  var dm=meals[day]||{};
  var m=getDayMacros(dm);
  var lines=['【MealCare 日報】'+getDisplayName(profile)+' / '+fmtDate(day)];
  lines.push('摂取 '+m.cal+' / 目標 '+goals.cal+' kcal');
  lines.push('P '+m.p+'g / F '+m.f+'g / C '+m.c+'g（スコア '+calcScore(m,goals)+'点）');
  MEAL_SECTIONS.forEach(function(sec){
    var items=dm[sec.id]||[];
    if(items.length===0) return;
    var cal=Math.round(getMacros(items).cal);
    lines.push('■'+sec.l+'（'+cal+'kcal）'+items.map(function(it){return it.n+((it.qty||1)!==1?'×'+it.qty:'');}).join('、'));
  });
  var w=weights.find(function(x){return x.date===day;});
  if(w) lines.push('体重 '+w.weight+'kg'+(w.fat?' / 体脂肪率 '+w.fat+'%':''));
  return lines.join('\n');
}
function summarizeWeek(profile,meals,weights){
  var goals=calcGoals(profile);
  var days=lastNDays(7);
  var rec=days.filter(function(d){return hasRecord(meals,d);});
  function avg(k){return rec.length?rec.reduce(function(s,d){return s+getDayMacros(meals[d])[k];},0)/rec.length:0;}
  var inWeek=weights.filter(function(w){return w.date>=days[0];});
  var wChange=inWeek.length>=2?Math.round((inWeek[inWeek.length-1].weight-inWeek[0].weight)*10)/10:null;
  var avgScore=rec.length?rec.reduce(function(s,d){return s+calcScore(getDayMacros(meals[d]),goals);},0)/rec.length:0;
  return {goals:goals,days:days,recorded:rec.length,avgCal:avg('cal'),avgP:avg('p'),avgF:avg('f'),avgC:avg('c'),wChange:wChange,latestWeight:weights.length?weights[weights.length-1].weight:null,avgScore:avgScore};
}
function buildWeeklyReport(profile,meals,weights,missions){
  var w=summarizeWeek(profile,meals,weights);
  var lines=['【MealCare 週報】'+getDisplayName(profile)+' / '+fmtDate(w.days[0])+'〜'+fmtDate(w.days[6])];
  lines.push('記録日数 '+w.recorded+'/7日');
  if(w.recorded>0){
    lines.push('平均 '+Math.round(w.avgCal)+' kcal（目標 '+w.goals.cal+'）');
    lines.push('平均 P '+w.avgP.toFixed(0)+'g / F '+w.avgF.toFixed(0)+'g / C '+w.avgC.toFixed(0)+'g');
    lines.push('食事スコア平均 '+Math.round(w.avgScore)+'点');
  }
  if(w.latestWeight!==null) lines.push('体重 '+w.latestWeight+'kg'+(w.wChange!==null?'（今週 '+(w.wChange>0?'+':'')+w.wChange+'kg）':''));
  if(missions&&missions.length>0){
    var done=missions.filter(function(m){return m.done;}).length;
    lines.push('ミッション '+done+'/'+missions.length+' 達成');
  }
  return lines.join('\n');
}

// ── Charts ──
function DonutChart(props){
  var p=props.p||0,f=props.f||0,c=props.c||0,size=props.size||120;
  var tot=p+f+c||1;
  var slices=[{v:p,col:B},{v:f,col:Y},{v:c,col:G}];
  var angle=-Math.PI/2;
  var r=size/2-10,cx=size/2,cy=size/2;
  var paths=slices.map(function(sl,i){
    var a=(sl.v/tot)*2*Math.PI;
    if(a<0.01) return null;
    var x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle);
    var ea=angle+a,x2=cx+r*Math.cos(ea),y2=cy+r*Math.sin(ea);
    var large=a>Math.PI?1:0;
    var d='M'+cx+','+cy+'L'+x1+','+y1+'A'+r+','+r+',0,'+large+',1,'+x2+','+y2+'Z';
    angle=ea;
    return React.createElement('path',{key:i,d:d,fill:sl.col,opacity:0.85});
  });
  return (
    <svg width={size} height={size}>
      {paths}
      <circle cx={cx} cy={cy} r={r-16} fill={N2}/>
    </svg>
  );
}
function BarProg(props){
  var value=props.value||0,max=props.max||1,color=props.color||G,h=props.h||8;
  var pct=Math.min(100,max>0?(value/max)*100:0);
  return (
    <div style={{background:N3,borderRadius:4,height:h,overflow:'hidden'}}>
      <div style={{width:pct+'%',height:'100%',background:pct>110?R:color,borderRadius:4,transition:'width 0.5s ease'}}/>
    </div>
  );
}
function WeightChart(props){
  var data=props.data,width=props.width||300,height=props.height||140;
  if(!data||data.length<2) return <div style={{color:S,textAlign:'center',padding:20,fontSize:13}}>データなし</div>;
  var vals=data.map(function(d){return d.weight;});
  var mn=Math.min.apply(null,vals)-0.4,mx=Math.max.apply(null,vals)+0.4,rng=mx-mn||1;
  var pl={l:34,r:8,t:8,b:22};
  var W=width-pl.l-pl.r,H=height-pl.t-pl.b;
  var pts=data.map(function(d,i){return {x:pl.l+(i/(data.length-1))*W,y:pl.t+H-((d.weight-mn)/rng)*H};});
  var line=pts.map(function(p,i){return (i===0?'M':'L')+p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ');
  var last=pts[pts.length-1];
  var area=line+'L'+last.x.toFixed(1)+','+(pl.t+H)+'L'+pl.l+','+(pl.t+H)+'Z';
  var yl=[mn+(mx-mn)*0.1,(mn+mx)/2,mx-(mx-mn)*0.1];
  var show=data.filter(function(_,i){return i===0||i===data.length-1||i===Math.floor(data.length/2);});
  return (
    <svg width={width} height={height} style={{overflow:'visible'}}>
      <defs>
        <linearGradient id="wg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={G} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={G} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {yl.map(function(v,i){var y2=pl.t+H-((v-mn)/rng)*H;return <line key={i} x1={pl.l} x2={pl.l+W} y1={y2} y2={y2} stroke={N3} strokeWidth="1" strokeDasharray="3,3"/>;} )}
      <path d={area} fill="url(#wg)"/>
      <path d={line} fill="none" stroke={G} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={last.x} cy={last.y} r="4" fill={G}/>
      {yl.map(function(v,i){var y2=pl.t+H-((v-mn)/rng)*H;return <text key={i} x={pl.l-3} y={y2+4} textAnchor="end" fill={S} fontSize="9">{v.toFixed(1)}</text>;})}
      {show.map(function(d,i){var idx=data.indexOf(d);return <text key={i} x={pl.l+(idx/(data.length-1))*W} y={height-3} textAnchor="middle" fill={S} fontSize="9">{fmtDate(d.date)}</text>;})}
    </svg>
  );
}
function CalChart(props){
  var data=props.data,goal=props.goal,width=props.width||300,height=props.height||100;
  if(!data||data.length===0) return null;
  var pad={l:6,r:6,t:6,b:20};
  var W=width-pad.l-pad.r,H=height-pad.t-pad.b;
  var maxV=Math.max(goal*1.3,Math.max.apply(null,data.map(function(d){return d.cal;})),100);
  var bw=Math.min(24,W/data.length-4);
  return (
    <svg width={width} height={height}>
      {data.map(function(d,i){
        var x=pad.l+(i+0.5)*(W/data.length)-bw/2;
        var bh=Math.max(2,(d.cal/maxV)*H);
        var y=pad.t+H-bh;
        var col=d.cal>goal*1.08?R:d.cal>goal*0.88?G:Y;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} fill={col} opacity={0.8} rx={2}/>
            <text x={x+bw/2} y={height-4} textAnchor="middle" fill={S} fontSize="8">{fmtDate(d.date)}</text>
          </g>
        );
      })}
      <line x1={pad.l} x2={pad.l+W} y1={pad.t+H-(goal/maxV)*H} y2={pad.t+H-(goal/maxV)*H} stroke={Y} strokeWidth="1.5" strokeDasharray="4,3"/>
    </svg>
  );
}
function MiniChart(props){
  var data=props.data,width=props.width||120,height=props.height||40;
  if(!data||data.length<2) return null;
  var vals=data.map(function(d){return d.w;});
  var mn=Math.min.apply(null,vals)-0.2,mx=Math.max.apply(null,vals)+0.2,rng=mx-mn||1;
  var W=width-8,H=height-8;
  var pts=data.map(function(d,i){return {x:4+(i/(data.length-1))*W,y:4+H-((d.w-mn)/rng)*H};});
  var line=pts.map(function(p,i){return (i===0?'M':'L')+p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ');
  var last=pts[pts.length-1];
  var area=line+'L'+last.x.toFixed(1)+','+(4+H)+'L4,'+(4+H)+'Z';
  var col=vals[vals.length-1]<=vals[0]?G:R;
  var gid='mg'+data.length+'x'+Math.round(vals[0]*10);
  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={col} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={'url(#'+gid+')'}/>
      <path d={line} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={last.x} cy={last.y} r="3" fill={col}/>
    </svg>
  );
}
function DetailChart(props){
  var wl=props.weightLog;
  if(!wl||wl.length<2) return null;
  var vals=wl.map(function(d){return d.w;});
  var mn=Math.min.apply(null,vals)-0.3,mx=Math.max.apply(null,vals)+0.3,rng=mx-mn||1;
  var W=192,H=64;
  var pts=wl.map(function(d,i){return {x:4+(i/(wl.length-1))*W,y:4+H-((d.w-mn)/rng)*H};});
  var line=pts.map(function(p,i){return (i===0?'M':'L')+p.x.toFixed(1)+','+p.y.toFixed(1);}).join(' ');
  var last=pts[pts.length-1];
  var area=line+'L'+last.x.toFixed(1)+',68L4,68Z';
  var ends=wl.filter(function(_,i){return i===0||i===wl.length-1;});
  return (
    <svg width={200} height={80} style={{overflow:'visible'}}>
      <defs>
        <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={G} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={G} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#cg)"/>
      <path d={line} fill="none" stroke={G} strokeWidth="2" strokeLinecap="round"/>
      <circle cx={last.x} cy={last.y} r="3.5" fill={G}/>
      {ends.map(function(d,i){
        var idx=wl.indexOf(d);
        return <text key={i} x={pts[idx].x} y={77} textAnchor={i===0?'start':'end'} fill={S} fontSize="9">{d.d}</text>;
      })}
    </svg>
  );
}

// ── Primitives ──
function Cd(props){
  return <div style={Object.assign({background:props.bg||N2,borderRadius:16,padding:16},props.style||{})}>{props.children}</div>;
}
function Btn(props){
  var color=props.color||G,outline=props.outline||false,sm=props.sm||false,full=props.full||false;
  return (
    <button onClick={props.onClick} style={Object.assign({
      background:outline?'transparent':color,color:outline?color:'#000',
      fontWeight:700,border:outline?'1.5px solid '+color:'none',
      borderRadius:10,padding:sm?'6px 14px':'10px 20px',
      cursor:'pointer',fontSize:sm?12:14,width:full?'100%':'auto'
    },props.style||{})}>{props.children}</button>
  );
}

// ── Onboarding ──
function Onboarding(props){
  var initial=props.initial;
  var [step,setStep]=useState(initial?1:0);
  var [form,setForm]=useState(function(){
    var base={name:'',age:'',gender:'male',height:'',weight:'',goal:'diet',targetWeight:'',targetCal:''};
    if(!initial) return base;
    var f=Object.assign(base,initial);
    delete f.goals;
    return f;
  });
  var [formErr,setFormErr]=useState('');
  function upd(k,v){setForm(function(f){var nf=Object.assign({},f);nf[k]=v;return nf;});}
  var auto=calcGoals(form);
  function inRange(v,min,max){var n=parseFloat(v);return !isNaN(n)&&n>=min&&n<=max;}
  function nextFromBasics(){
    if(!form.name.trim()) return setFormErr('お名前を入力してください（コーチへの報告に使います）');
    if(!inRange(form.age,10,100)) return setFormErr('年齢は10〜100の範囲で入力してください');
    if(!inRange(form.height,100,230)) return setFormErr('身長は100〜230cmの範囲で入力してください');
    if(!inRange(form.weight,25,250)) return setFormErr('体重は25〜250kgの範囲で入力してください');
    setFormErr('');setStep(2);
  }
  function submit(){
    if(form.targetWeight!==''&&!inRange(form.targetWeight,25,250)) return setFormErr('目標体重は25〜250kgの範囲で入力してください');
    if(form.targetCal!==''&&!inRange(form.targetCal,800,6000)) return setFormErr('目標カロリーは800〜6000kcalの範囲で入力してください');
    setFormErr('');
    var g=calcGoals(form);
    var goals={cal:form.targetCal?+form.targetCal:g.cal,p:g.p,f:g.f,c:g.c};
    var pf=Object.assign({},form,{name:form.name.trim()});
    pf.goals=goals;
    props.onDone(pf);
  }
  var errBox=formErr?<div style={{background:'#fee2e2',color:'#991b1b',padding:'8px 12px',borderRadius:8,fontSize:13,marginTop:10}}>{formErr}</div>:null;
  var inpS={background:N,border:'1px solid '+N3,borderRadius:10,padding:'10px 14px',color:'#fff',fontSize:15,width:'100%',boxSizing:'border-box'};
  return (
    <div style={{background:N,minHeight:'100vh',maxWidth:480,margin:'0 auto'}}>
      {step>0&&<div style={{padding:'14px 20px 0'}}><div style={{display:'flex',gap:6}}>{[1,2,3].map(function(i){return <div key={i} style={{flex:1,height:4,borderRadius:2,background:step>=i?G:N3}}/>;})}</div></div>}
      {step===0&&(
        <div style={{textAlign:'center',padding:'60px 24px'}}>
          <div style={{fontSize:72,marginBottom:16}}>🥗</div>
          <h1 style={{color:G,fontSize:32,fontWeight:900,margin:'0 0 8px'}}>MealCare</h1>
          <p style={{color:S,lineHeight:1.7,margin:'0 0 40px',fontSize:15}}>食事・栄養・体重管理を<br/>ひとつのアプリで。</p>
          <Btn onClick={function(){setStep(1);}} style={{width:'100%',padding:'15px',fontSize:16}}>はじめる →</Btn>
        </div>
      )}
      {step===1&&(
        <div style={{padding:'24px 20px'}}>
          <h2 style={{color:'#fff',fontSize:20,fontWeight:800,marginBottom:20}}>{initial?'プロフィールを編集':'基本情報を入力'}</h2>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div><label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>お名前（LINEの表示名と同じだとスムーズです）</label><input style={inpS} value={form.name} onChange={function(e){upd('name',e.target.value);}}/></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>年齢</label><input style={inpS} type="number" value={form.age} onChange={function(e){upd('age',e.target.value);}}/></div>
              <div><label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>性別</label>
                <select style={inpS} value={form.gender} onChange={function(e){upd('gender',e.target.value);}}>
                  <option value="male">男性</option><option value="female">女性</option>
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>身長(cm)</label><input style={inpS} type="number" value={form.height} onChange={function(e){upd('height',e.target.value);}}/></div>
              <div><label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>体重(kg)</label><input style={inpS} type="number" value={form.weight} onChange={function(e){upd('weight',e.target.value);}}/></div>
            </div>
            {errBox}
            <div style={{display:'flex',gap:10,marginTop:4}}>
              <Btn onClick={function(){setFormErr('');if(initial)props.onCancel();else setStep(0);}} outline sm style={{flex:1}}>{initial?'キャンセル':'戻る'}</Btn>
              <Btn onClick={nextFromBasics} style={{flex:2}}>次へ</Btn>
            </div>
          </div>
        </div>
      )}
      {step===2&&(
        <div style={{padding:'24px 20px'}}>
          <h2 style={{color:'#fff',fontSize:20,fontWeight:800,marginBottom:16}}>目標を選択</h2>
          {[{v:'diet',i:'🏃',t:'ダイエット',d:'体重を減らしたい'},{v:'muscle',i:'💪',t:'筋肉をつける',d:'筋肉量を増やしたい'},{v:'health',i:'🌿',t:'健康維持',d:'健康的な体を維持したい'},{v:'maintain',i:'⚖️',t:'体重維持',d:'現在の体重を維持したい'}].map(function(g){
            return (
              <div key={g.v} onClick={function(){upd('goal',g.v);}} style={{background:form.goal===g.v?G+'22':N2,border:'2px solid '+(form.goal===g.v?G:N3),borderRadius:14,padding:'14px 16px',marginBottom:10,cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:24}}>{g.i}</span>
                <div><div style={{color:'#fff',fontWeight:700,fontSize:14}}>{g.t}</div><div style={{color:S,fontSize:12}}>{g.d}</div></div>
                {form.goal===g.v&&<span style={{marginLeft:'auto',color:G,fontSize:18,fontWeight:800}}>✓</span>}
              </div>
            );
          })}
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Btn onClick={function(){setStep(1);}} outline sm style={{flex:1}}>戻る</Btn>
            <Btn onClick={function(){setStep(3);}} style={{flex:2}}>次へ</Btn>
          </div>
        </div>
      )}
      {step===3&&(
        <div style={{padding:'24px 20px'}}>
          <h2 style={{color:'#fff',fontSize:20,fontWeight:800,marginBottom:18}}>目標カロリー確認</h2>
          <Cd bg={N2} style={{marginBottom:18}}>
            <div style={{color:S,fontSize:12,fontWeight:600,marginBottom:4}}>自動計算された目標</div>
            <div style={{color:G,fontSize:30,fontWeight:900}}>{auto.cal}<span style={{fontSize:16,color:S,fontWeight:400}}> kcal/日</span></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:12,paddingTop:12,borderTop:'1px solid '+N3}}>
              {[{l:'タンパク質',v:auto.p+'g',c:B},{l:'脂質',v:auto.f+'g',c:Y},{l:'炭水化物',v:auto.c+'g',c:G}].map(function(n){
                return <div key={n.l} style={{textAlign:'center'}}><div style={{color:n.c,fontWeight:800,fontSize:16}}>{n.v}</div><div style={{color:S,fontSize:10}}>{n.l}</div></div>;
              })}
            </div>
          </Cd>
          <div style={{marginBottom:12}}><label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>目標体重(kg)</label><input style={inpS} type="number" value={form.targetWeight} onChange={function(e){upd('targetWeight',e.target.value);}}/></div>
          <div style={{marginBottom:18}}><label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>カロリー調整（空欄で自動計算）</label><input style={inpS} type="number" value={form.targetCal} onChange={function(e){upd('targetCal',e.target.value);}} placeholder={String(auto.cal)}/></div>
          {errBox}
          <div style={{display:'flex',gap:10,marginTop:10}}>
            <Btn onClick={function(){setFormErr('');setStep(2);}} outline sm style={{flex:1}}>戻る</Btn>
            <Btn onClick={submit} style={{flex:2,padding:'12px',fontSize:15}}>{initial?'保存する':'🎉 スタート！'}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── BottomNav ──
function BottomNav(props){
  var tabs=[{id:'home',i:'🏠',l:'ホーム'},{id:'log',i:'✏️',l:'記録'},{id:'nutrition',i:'📊',l:'栄養'},{id:'weight',i:'⚖️',l:'体重'},{id:'coach',i:'👨‍💼',l:'コーチ'}];
  return (
    <div style={{position:'fixed',bottom:0,left:'50%',transform:'translateX(-50%)',width:'100%',maxWidth:480,background:N2,borderTop:'1px solid '+N3,display:'flex',zIndex:100}}>
      {tabs.map(function(t){
        return (
          <button key={t.id} onClick={function(){props.onChange(t.id);}} style={{flex:1,background:'none',border:'none',cursor:'pointer',padding:'10px 0 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <span style={{fontSize:20}}>{t.i}</span>
            <span style={{fontSize:9,fontWeight:700,color:props.tab===t.id?G:S}}>{t.l}</span>
            {props.tab===t.id&&<div style={{width:18,height:2,background:G,borderRadius:1,marginTop:1}}/>}
          </button>
        );
      })}
    </div>
  );
}

// ── Recommendation helpers ──
function getCurrentScene(d){
  var h=d.getHours();
  if(h>=4&&h<10) return '朝';
  if(h>=10&&h<15) return '昼';
  if(h>=15&&h<18) return '間食';
  return '夕';
}
function getTodayRecommendation(profile,meals){
  var today=todayStr();
  var cached=loadJSON('mc2_today_recommend',null);
  if(cached&&cached.date===today){
    var r=RECIPES.find(function(x){return x.id===cached.recipeId;});
    if(r) return r;
  }
  var scene=getCurrentScene(new Date());
  var todayMeals=meals[today]?getDayMacros(meals[today]):{cal:0};
  var todayCal=todayMeals.cal||0;
  var goals=calcGoals(profile);
  var target=goals.cal||2000;
  var remaining=target-todayCal;
  var calRange=remaining<300?1:remaining<500?2:remaining<700?3:4;
  var seed=new Date().getFullYear()*10000+(new Date().getMonth()+1)*100+new Date().getDate();
  var cutoff=Date.now()-7*24*60*60*1000;
  var recent=loadJSON('mc2_recent_recipes',[]).filter(function(x){return x.at>cutoff;}).map(function(x){return x.id;});
  var candidates=RECIPES.filter(function(r){return recent.indexOf(r.id)<0;});
  if(candidates.length===0) candidates=RECIPES;
  var scored=candidates.map(function(r){
    var score=0;
    if(scene&&r.scene.indexOf(scene)>=0) score+=50;
    if(r.calRange===calRange) score+=30;
    score+=Math.max(0,20-r.cookTimeMin);
    score+=((r.id*seed)%17);
    return {r:r,s:score};
  });
  scored.sort(function(a,b){return b.s-a.s;});
  var pick=scored[0].r;
  saveJSON('mc2_today_recommend',{date:today,recipeId:pick.id});
  var log2=loadJSON('mc2_recent_recipes',[]);
  log2.push({id:pick.id,at:Date.now()});
  saveJSON('mc2_recent_recipes',log2.slice(-30));
  return pick;
}

// ── HomeScreen ──
function HomeScreen(props){
  var profile=props.profile,meals=props.meals,weights=props.weights,setTab=props.setTab,setMealTab=props.setMealTab;
  var [water,setWater]=useState(function(){return loadJSON('mc2_water',{})[todayStr()]||0;});
  var today=todayStr();
  var dm=meals[today]||{breakfast:[],lunch:[],dinner:[],snack:[]};
  var m=getDayMacros(dm);
  var goals=calcGoals(profile);
  var score=calcScore(m,goals);
  var streak=calcStreak(meals);
  var lw=weights.length>0?weights[weights.length-1]:null;
  var bmi=lw&&profile?Math.round(lw.weight/Math.pow(parseFloat(profile.height)/100,2)*10)/10:null;
  function saveWater(nw){setWater(nw);var d=loadJSON('mc2_water',{});d[today]=nw;saveJSON('mc2_water',d);}
  function addWater(){saveWater(water+200);}
  function removeWater(){saveWater(Math.max(0,water-200));}
  var hour=new Date().getHours();
  var greeting=hour<11?'おはようございます':hour<17?'こんにちは':'こんばんは';
  var mealSecs=[{id:'breakfast',l:'朝食',i:'🌅'},{id:'lunch',l:'昼食',i:'🌞'},{id:'dinner',l:'夕食',i:'🌙'},{id:'snack',l:'間食',i:'🍪'}];
  return (
    <div style={{padding:'16px 16px 90px',overflowX:'hidden'}}>
      <div style={{marginBottom:16}}>
        <div style={{color:S,fontSize:12}}>{new Date().toLocaleDateString('ja-JP',{year:'numeric',month:'long',day:'numeric',weekday:'short'})}</div>
        <div style={{color:'#fff',fontSize:20,fontWeight:800}}>👋 {greeting}、{getDisplayName(profile)}！</div>
      </div>
      <Cd style={{marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div>
            <div style={{color:S,fontSize:12,fontWeight:600}}>本日の摂取カロリー</div>
            <div style={{color:'#fff',fontSize:28,fontWeight:900}}>{m.cal}<span style={{color:S,fontSize:14,fontWeight:400}}> / {goals.cal} kcal</span></div>
          </div>
          <DonutChart p={m.p} f={m.f} c={m.c} size={90}/>
        </div>
        <BarProg value={m.cal} max={goals.cal} h={10}/>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:14}}>
          {[{l:'タンパク質',v:m.p,g:goals.p,c:B},{l:'脂質',v:m.f,g:goals.f,c:Y},{l:'炭水化物',v:m.c,g:goals.c,c:G}].map(function(n){
            return (
              <div key={n.l}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{color:n.c,fontSize:11,fontWeight:700}}>{n.l}</span>
                  <span style={{color:S,fontSize:10}}>{n.v}/{n.g}g</span>
                </div>
                <BarProg value={n.v} max={n.g} color={n.c} h={6}/>
              </div>
            );
          })}
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
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <div style={{color:'#fff',fontWeight:700}}>💧 水分摂取</div>
          <div style={{color:B,fontWeight:800,fontSize:16}}>{(water/1000).toFixed(2)} L</div>
        </div>
        <div style={{display:'flex',gap:4,alignItems:'center'}}>
          <button onClick={removeWater} style={{background:N3,border:'none',borderRadius:8,color:'#fff',fontWeight:800,fontSize:16,width:32,height:32,cursor:'pointer',flexShrink:0}}>−</button>
          {[0,1,2,3,4,5,6,7,8,9].map(function(i){return <div key={i} style={{flex:1,height:28,borderRadius:5,background:water>=(i+1)*200?B+'88':N3,border:'1px solid '+(water>=(i+1)*200?B:N3),transition:'all 0.3s'}}/>;} )}
          <button onClick={addWater} style={{background:B,border:'none',borderRadius:8,color:'#fff',fontWeight:800,fontSize:16,width:32,height:32,cursor:'pointer',flexShrink:0}}>+</button>
        </div>
        <div style={{color:S,fontSize:11,marginTop:6}}>目標: 2000ml　+200ml ずつ追加</div>
      </Cd>
      {(() => {
        var rec=getTodayRecommendation(profile,meals);
        if(!rec) return null;
        return (
          <div style={{marginTop:4,marginBottom:14}}>
            <div style={{fontSize:14,color:S,fontWeight:'bold',marginBottom:8}}>🍳 今日のおすすめレシピ</div>
            <div style={{background:'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)',borderRadius:16,padding:16,border:'1px solid '+N3}}>
              <div style={{fontSize:12,color:G,fontWeight:'bold'}}>{rec.scene.join('・')}</div>
              <div style={{fontSize:17,fontWeight:'bold',color:'#fff',marginTop:4}}>{rec.name}</div>
              <div style={{fontSize:12,color:S2,marginTop:8}}>{rec.desc}</div>
              <div style={{display:'flex',gap:12,marginTop:12,fontSize:12,color:S}}>
                <span>⏱{rec.cookTimeMin}分</span>
                <span>🔥{rec.cal}kcal</span>
                <span>💪P{rec.p}g</span>
              </div>
            </div>
          </div>
        );
      })()}
      <div style={{color:'#fff',fontWeight:800,marginBottom:8}}>今日の食事</div>
      {mealSecs.map(function(ms){
        var items=dm[ms.id]||[];
        var mm=getMacros(items);
        return (
          <Cd key={ms.id} style={{marginBottom:8,cursor:'pointer'}} onClick={function(){setMealTab(ms.id);setTab('log');}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:20}}>{ms.i}</span>
                <div><div style={{color:'#fff',fontWeight:700,fontSize:14}}>{ms.l}</div><div style={{color:S,fontSize:11}}>{items.length} 品目</div></div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{color:G,fontWeight:800}}>{Math.round(mm.cal)} kcal</div>
                <div style={{color:S,fontSize:11}}>P:{Math.round(mm.p)} F:{Math.round(mm.f)} C:{Math.round(mm.c)}</div>
              </div>
            </div>
            {items.length>0&&(
              <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid '+N3,display:'flex',flexWrap:'wrap',gap:4}}>
                {items.slice(0,4).map(function(it){return <span key={it.uid||it.id} style={{background:N3,borderRadius:6,padding:'2px 8px',fontSize:11,color:S2}}>{it.n}</span>;})}
                {items.length>4&&<span style={{color:S,fontSize:11}}>+{items.length-4}</span>}
              </div>
            )}
          </Cd>
        );
      })}
      {lw&&(
        <Cd style={{marginTop:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div><div style={{color:S,fontSize:12}}>最新の体重</div><div style={{color:'#fff',fontSize:22,fontWeight:900}}>{lw.weight}<span style={{fontSize:14,color:S}}> kg</span></div></div>
            {bmi&&<div style={{textAlign:'right'}}><div style={{color:S,fontSize:12}}>BMI</div><div style={{color:bmi<18.5?Y:bmi<25?G:bmi<30?Y:R,fontSize:22,fontWeight:900}}>{bmi}</div></div>}
            {profile&&profile.targetWeight&&<div style={{textAlign:'right'}}><div style={{color:S,fontSize:12}}>目標まで</div><div style={{color:G,fontSize:18,fontWeight:800}}>{(lw.weight-parseFloat(profile.targetWeight)).toFixed(1)}<span style={{fontSize:12,color:S}}> kg</span></div></div>}
          </div>
        </Cd>
      )}
      <Cd style={{marginTop:10,background:G+'18',border:'1px solid '+G+'44'}}>
        <div style={{color:G,fontWeight:800,fontSize:13,marginBottom:4}}>💡 今日のワンポイント</div>
        <div style={{color:S2,fontSize:13,lineHeight:1.6}}>
          {m.cal===0?'まずは1食だけでも記録してみましょう。最初から完璧じゃなくて大丈夫です。':score>=80?'いいバランスです。この調子で、無理なく続けていきましょう。':m.p<goals.p*0.7?'たんぱく質が少なめです。次の食事で卵・納豆・サラダチキンなどを1品足してみましょう。':'いいペースです。残りの食事で目標カロリーに近づけていきましょう。'}
        </div>
      </Cd>
      <Cd style={{marginTop:10,background:'#06C75518',border:'1px solid #06C75566'}}>
        <div style={{color:'#06C755',fontWeight:800,fontSize:13,marginBottom:4}}>📤 今日の記録をコーチに報告</div>
        <div style={{color:S2,fontSize:12,lineHeight:1.6,marginBottom:10}}>食事内容をまとめた日報をLINEで送れます。送信前に内容を確認・追記できます。</div>
        <Btn onClick={function(){openLine(buildDailyReport(profile,meals,weights,today),'home_daily');}} full color="#06C755" style={{color:'#fff'}}>LINEで日報を送る</Btn>
      </Cd>
    </div>
  );
}

// ── RecipeSuggestion ──
function RecipeSuggestion(props){
  var [step,setStep]=useState(1);
  var [answer,setAnswer]=useState({scene:null,calRange:null,ingredient:null});
  var [suggestions,setSuggestions]=useState([]);
  var [selectedRecipe,setSelectedRecipe]=useState(null);

  function selectScene(s){setAnswer(Object.assign({},answer,{scene:s}));setStep(2);}
  function selectCal(c){setAnswer(Object.assign({},answer,{calRange:c}));setStep(3);}
  function selectIng(i){
    var newAns=Object.assign({},answer,{ingredient:i});
    setAnswer(newAns);
    setSuggestions(suggestRecipes(newAns));
    setStep(4);
  }
  function goBack(){
    if(step===2)setStep(1);
    else if(step===3)setStep(2);
    else if(step===4)setStep(3);
    else if(step===5)setStep(4);
  }
  function recordRecipe(r){
    var mealType=answer.scene;
    props.addFood({id:'r'+mkId(),n:r.name,cal:r.cal,p:r.p,f:r.f,c:r.c,s:'レシピ:'+r.id},mealType);
    alert('✅ '+r.name+' を記録しました');
    props.onClose();
  }

  if(step===1){
    return React.createElement('div',{style:{padding:16}},
      React.createElement('div',{style:{fontSize:14,color:'#94a3b8',marginBottom:16}},'Step 1/3 食事シーンは？'),
      ['朝','昼','夕','間食'].map(function(s){
        return React.createElement('button',{
          key:s,
          onClick:function(){selectScene(s);},
          style:{display:'block',width:'100%',padding:16,marginBottom:8,background:'#1e293b',color:'#fff',border:'1px solid #334155',borderRadius:8,fontSize:16}
        },s);
      })
    );
  }
  if(step===2){
    var labels={1:'〜300kcal（軽め）',2:'〜500kcal（標準）',3:'〜700kcal（しっかり）',4:'700+kcal（がっつり）'};
    return React.createElement('div',{style:{padding:16}},
      React.createElement('button',{onClick:goBack,style:{background:'none',border:'none',color:'#94a3b8',marginBottom:8}},'← 戻る'),
      React.createElement('div',{style:{fontSize:14,color:'#94a3b8',marginBottom:16}},'Step 2/3 カロリーの目安は？'),
      [1,2,3,4].map(function(c){
        return React.createElement('button',{
          key:c,
          onClick:function(){selectCal(c);},
          style:{display:'block',width:'100%',padding:16,marginBottom:8,background:'#1e293b',color:'#fff',border:'1px solid #334155',borderRadius:8,fontSize:15}
        },labels[c]);
      })
    );
  }
  if(step===3){
    var ings=['鶏むね','鶏もも','魚','卵','豆腐','野菜','おまかせ'];
    return React.createElement('div',{style:{padding:16}},
      React.createElement('button',{onClick:goBack,style:{background:'none',border:'none',color:'#94a3b8',marginBottom:8}},'← 戻る'),
      React.createElement('div',{style:{fontSize:14,color:'#94a3b8',marginBottom:16}},'Step 3/3 メイン食材は？'),
      ings.map(function(i){
        return React.createElement('button',{
          key:i,
          onClick:function(){selectIng(i);},
          style:{display:'block',width:'100%',padding:14,marginBottom:8,background:'#1e293b',color:'#fff',border:'1px solid #334155',borderRadius:8,fontSize:15}
        },i);
      })
    );
  }
  if(step===4){
    return React.createElement('div',{style:{padding:16}},
      React.createElement('button',{onClick:goBack,style:{background:'none',border:'none',color:'#94a3b8',marginBottom:8}},'← 戻る'),
      React.createElement('div',{style:{fontSize:16,fontWeight:'bold',color:'#fff',marginBottom:12}},'あなたへのおすすめ 3選'),
      suggestions.map(function(r,i){
        var medals=['🥇','🥈','🥉'];
        return React.createElement('div',{
          key:r.id,
          onClick:function(){setSelectedRecipe(r);setStep(5);},
          style:{background:'#1e293b',padding:14,borderRadius:10,marginBottom:8,border:'1px solid #334155',cursor:'pointer'}
        },
          React.createElement('div',{style:{fontSize:15,fontWeight:'bold',color:'#fff'}},medals[i]+' '+r.name),
          React.createElement('div',{style:{fontSize:11,color:'#94a3b8',marginTop:4}},'⏱'+r.cookTimeMin+'分 🔥'+r.cal+'kcal 💪P'+r.p+'g 🧈F'+r.f+'g')
        );
      })
    );
  }
  if(step===5&&selectedRecipe){
    var r=selectedRecipe;
    return React.createElement('div',{style:{padding:16}},
      React.createElement('button',{onClick:goBack,style:{background:'none',border:'none',color:'#94a3b8',marginBottom:8}},'← 戻る'),
      React.createElement('div',{style:{fontSize:18,fontWeight:'bold',color:'#fff'}},r.name),
      React.createElement('div',{style:{fontSize:11,color:'#94a3b8',marginTop:2}},r.enName),
      React.createElement('div',{style:{fontSize:13,color:'#cbd5e1',marginTop:8}},r.desc),
      React.createElement('div',{style:{background:'#0f172a',padding:12,borderRadius:8,marginTop:12}},
        React.createElement('div',{style:{color:'#22c55e',fontSize:14,fontWeight:'bold'}},'🔥 '+r.cal+'kcal'),
        React.createElement('div',{style:{color:'#cbd5e1',fontSize:12,marginTop:4}},'💪P '+r.p+'g 🧈F '+r.f+'g 🍚C '+r.c+'g')
      ),
      React.createElement('div',{style:{fontSize:13,color:'#94a3b8',marginTop:16,marginBottom:8}},'─ 材料 ─'),
      r.ingredients.map(function(ing,i){
        return React.createElement('div',{key:i,style:{fontSize:13,color:'#cbd5e1',marginBottom:4}},'・'+ing.name+' '+ing.amount);
      }),
      React.createElement('div',{style:{fontSize:13,color:'#94a3b8',marginTop:16,marginBottom:8}},'─ 作り方 ─'),
      r.steps.map(function(s,i){
        return React.createElement('div',{key:i,style:{fontSize:13,color:'#cbd5e1',marginBottom:6}},(i+1)+'. '+s);
      }),
      React.createElement('div',{style:{fontSize:13,color:'#94a3b8',marginTop:16,marginBottom:8}},'─ ポイント ─'),
      r.points.map(function(p,i){
        return React.createElement('div',{key:i,style:{fontSize:13,color:'#cbd5e1',marginBottom:4}},'◎ '+p);
      }),
      React.createElement('button',{
        onClick:function(){recordRecipe(r);},
        style:{width:'100%',padding:14,marginTop:20,background:'#22c55e',color:'#fff',border:'none',borderRadius:10,fontSize:15,fontWeight:'bold',cursor:'pointer'}
      },'＋ この内容で記録する')
    );
  }
  return null;
}

// ── LogScreen ──
function LogScreen(props){
  var meals=props.meals,setMeals=props.setMeals,mealTab=props.mealTab,setMealTab=props.setMealTab;
  var [day,setDay]=useState(todayStr());
  var [showAdd,setShowAdd]=useState(false);
  var [mode,setMode]=useState('search');
  var [search,setSearch]=useState('');
  var [manual,setManual]=useState({n:'',cal:'',p:'',f:'',c:''});
  var [err,setErr]=useState('');
  var [imgAnalyzing,setImgAnalyzing]=useState(false);
  var [imgResults,setImgResults]=useState([]);
  var [imgError,setImgError]=useState('');
  var dm=meals[day]||{breakfast:[],lunch:[],dinner:[],snack:[]};
  var tabs=[{id:'breakfast',l:'朝食',i:'🌅'},{id:'lunch',l:'昼食',i:'🌞'},{id:'dinner',l:'夕食',i:'🌙'},{id:'snack',l:'間食',i:'🍪'}];
  var items=dm[mealTab]||[];
  var mm=getMacros(items);
  var results=search.trim()?searchFoods(search,null,40):[];
  var [picked,setPicked]=useState(null);
  var [pickGrams,setPickGrams]=useState('');
  var [hint,setHint]=useState('');
  var [recent,setRecent]=useState(function(){return loadJSON('mc2_recent_foods',[]);});
  function rememberFood(food){
    var entry={n:food.n,s:food.s,g:food.g,cal:food.cal,p:food.p,f:food.f,c:food.c};
    setRecent(function(r){
      var nr=[entry].concat(r.filter(function(x){return !(x.n===entry.n&&x.s===entry.s);})).slice(0,20);
      saveJSON('mc2_recent_foods',nr);
      return nr;
    });
  }
  function pickFood(food){setPicked(food);setPickGrams(String(food.g||100));}
  var pickedScaled=picked&&+pickGrams>0?scaleFood(picked,+pickGrams):null;
  function addPicked(){
    if(!pickedScaled) return;
    var label=+pickGrams===picked.g?picked.s:pickGrams+'g';
    var item=Object.assign({},pickedScaled,{id:'f'+mkId(),s:label});
    rememberFood(item);
    setPicked(null);
    addFood(item);
  }
  function estimateByText(){
    var q=search.trim();
    if(!q) return;
    setImgAnalyzing(true);setImgResults([]);setImgError('');setImgConfirm(null);setImgAdded({});
    callFoodAI({text:q},function(parsed){
      setImgResults(parsed);setImgConfirm('pending');setImgAnalyzing(false);
    },function(msg){setImgError(msg);setImgAnalyzing(false);});
  }
  function setResultGrams(i,v){
    setImgResults(function(list){
      return list.map(function(it,idx){
        if(idx!==i) return it;
        var grams=Math.max(0,Math.min(3000,+v||0));
        var base=it.base;
        if(!base||!base.g) return Object.assign({},it,{g:grams});
        var r=grams/base.g;
        return Object.assign({},it,{g:grams,s:grams+'g',cal:Math.round(base.cal*r),p:Math.round(base.p*r*10)/10,f:Math.round(base.f*r*10)/10,c:Math.round(base.c*r*10)/10});
      });
    });
  }
  function removeResult(i){setImgResults(function(list){return list.filter(function(_,idx){return idx!==i;});});}
  function cleanAI(f){var o=Object.assign({id:'ai'+mkId()},f);delete o.base;return o;}
  var inpS={background:N,border:'1px solid '+N3,borderRadius:8,padding:'8px 12px',color:'#fff',fontSize:13,width:'100%',boxSizing:'border-box'};
  function changeDay(delta){setDay(shiftDate(day,delta));}
  // meals は関数型で更新する（写真の「全て追加」のように連続で呼ばれても取りこぼさない）
  function updateMeal(key,fn){
    setMeals(function(m){
      var cur=m[day]||{breakfast:[],lunch:[],dinner:[],snack:[]};
      var ndm=Object.assign({},cur);
      ndm[key]=fn(cur[key]||[]);
      var nm=Object.assign({},m);nm[day]=ndm;return nm;
    });
  }
  function addFood(food,targetMeal,keepOpen){
    var sceneMap={'朝':'breakfast','昼':'lunch','夕':'dinner','間食':'snack'};
    var key=targetMeal?(sceneMap[targetMeal]||targetMeal):mealTab;
    var nit=Object.assign({},food,{qty:1,uid:mkId()});
    updateMeal(key,function(list){return list.concat([nit]);});
    if(keepOpen) return;
    closeAdd();
  }
  function closeAdd(){
    setShowAdd(false);setSearch('');setPicked(null);setImgResults([]);setImgConfirm(null);setImgError('');
  }
  function changeQty(u,delta){
    updateMeal(mealTab,function(list){
      return list.map(function(it){
        if(it.uid!==u) return it;
        var q=Math.round(((it.qty||1)+delta)*10)/10;
        return Object.assign({},it,{qty:Math.max(0.5,Math.min(10,q))});
      });
    });
  }
  function addManual(){
    var name=(manual.n||'').trim();
    if(!name||name.length>30){
      setErr('食事名を入力してください（30文字以内）');
      return;
    }
    var cal=+manual.cal;
    if(isNaN(cal)||cal<0||cal>5000){
      setErr('カロリーは0〜5000の範囲で入力してください');
      return;
    }
    var p=manual.p===''?0:+manual.p;
    var f=manual.f===''?0:+manual.f;
    var c=manual.c===''?0:+manual.c;
    if(isNaN(p)||p<0||p>500){setErr('たんぱく質は0〜500gで入力してください');return;}
    if(isNaN(f)||f<0||f>500){setErr('脂質は0〜500gで入力してください');return;}
    if(isNaN(c)||c<0||c>1000){setErr('炭水化物は0〜1000gで入力してください');return;}
    setErr('');
    addFood({id:'m'+mkId(),n:name,cal:cal,p:p,f:f,c:c,s:'手入力'});
    setManual({n:'',cal:'',p:'',f:'',c:''});
  }
  function removeFood(u){
    updateMeal(mealTab,function(list){return list.filter(function(it){return it.uid!==u;});});
  }
  var [imgConfirm,setImgConfirm]=useState(null);
  var [imgAdded,setImgAdded]=useState({});

  function handleFileChange(e){
    if(!e.target.files||!e.target.files[0]) return;
    var file=e.target.files[0];
    e.target.value='';// 同じ写真を選び直しても onChange が発火するように
    setImgAnalyzing(true);
    setImgResults([]);
    setImgError('');
    setImgConfirm(null);
    setImgAdded({});
    prepareImage(file).then(function(img){
      callFoodAI({base64:img.base64,mediaType:img.mediaType,hint:hint.trim()},function(parsed){
        setImgResults(parsed);
        setImgConfirm('pending');
        setImgAnalyzing(false);
      },function(msg){
        setImgError(msg);
        setImgAnalyzing(false);
      });
    }).catch(function(){
      setImgError('この画像は読み込めませんでした。JPEG / PNG の写真でお試しください。');
      setImgAnalyzing(false);
    });
  }
  var curTab=tabs.find(function(t){return t.id===mealTab;})||tabs[0];
  return (
    <div style={{padding:'12px 16px 90px',overflowX:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
        <button onClick={function(){changeDay(-1);}} style={{background:N3,border:'none',color:'#fff',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:16}}>‹</button>
        <div style={{flex:1,textAlign:'center',color:'#fff',fontWeight:700,fontSize:14}}>{day===todayStr()?'今日':fmtDate(day)}</div>
        <button onClick={function(){changeDay(1);}} disabled={day>=todayStr()} style={{background:N3,border:'none',color:'#fff',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:16}}>›</button>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:14,overflowX:'auto',paddingBottom:2}}>
        {tabs.map(function(t){return <button key={t.id} onClick={function(){setMealTab(t.id);}} style={{background:mealTab===t.id?G:N2,color:mealTab===t.id?'#000':'#fff',border:'none',borderRadius:10,padding:'7px 14px',cursor:'pointer',fontWeight:700,fontSize:12,whiteSpace:'nowrap'}}>{t.i} {t.l}</button>;} )}
      </div>
      <Cd style={{marginBottom:12}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{color:'#fff',fontWeight:700}}>{curTab.l} 合計</div>
          <div style={{color:G,fontWeight:800}}>{Math.round(mm.cal)} kcal</div>
        </div>
        <div style={{color:S,fontSize:12,marginTop:4}}>P:{mm.p.toFixed(1)}g　F:{mm.f.toFixed(1)}g　C:{mm.c.toFixed(1)}g</div>
      </Cd>
      {items.length===0?(
        <div style={{textAlign:'center',padding:'30px 0',color:S}}><div style={{fontSize:40,marginBottom:8}}>🍽️</div><div style={{fontSize:14}}>まだ記録がありません</div></div>
      ):items.map(function(it){
        return (
          <Cd key={it.uid||it.id} style={{marginBottom:8,padding:12}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{flex:1}}>
                <div style={{color:'#fff',fontWeight:700,fontSize:13}}>{it.n}</div>
                <div style={{color:S,fontSize:11}}>{it.s||''}　P:{((it.p||0)*(it.qty||1)).toFixed(1)}g F:{((it.f||0)*(it.qty||1)).toFixed(1)}g C:{((it.c||0)*(it.qty||1)).toFixed(1)}g</div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginTop:6}}>
                  <button aria-label="量を減らす" onClick={function(){changeQty(it.uid,-0.5);}} style={{background:N3,border:'none',borderRadius:6,color:'#fff',width:26,height:22,cursor:'pointer',fontWeight:800}}>−</button>
                  <span style={{color:S2,fontSize:12,minWidth:34,textAlign:'center'}}>×{it.qty||1}</span>
                  <button aria-label="量を増やす" onClick={function(){changeQty(it.uid,0.5);}} style={{background:N3,border:'none',borderRadius:6,color:'#fff',width:26,height:22,cursor:'pointer',fontWeight:800}}>＋</button>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{color:G,fontWeight:800,fontSize:14}}>{Math.round(it.cal*(it.qty||1))} kcal</div>
                <button onClick={function(){removeFood(it.uid);}} style={{background:'none',border:'none',color:R,cursor:'pointer',fontSize:16,padding:'0 4px'}}>✕</button>
              </div>
            </div>
          </Cd>
        );
      })}
      <Btn onClick={function(){setShowAdd(true);}} full style={{marginTop:8,padding:'12px'}}>＋ 食品を追加</Btn>
      {showAdd&&(
        <div onClick={function(e){if(e.target===e.currentTarget)closeAdd();}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:N2,borderRadius:'20px 20px 0 0',padding:'20px',width:'100%',maxWidth:480,maxHeight:'80vh',overflow:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{color:'#fff',fontWeight:800,fontSize:16}}>食品を追加</div>
              <button aria-label="閉じる" onClick={closeAdd} style={{background:'none',border:'none',color:S,cursor:'pointer',fontSize:20}}>✕</button>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
              {[{id:'photo',l:'📸 写真AI'},{id:'search',l:'🔍 検索'},{id:'manual',l:'✏️ 手入力'},{id:'recipe',l:'🍳 レシピ提案'}].map(function(mv){
                return <button key={mv.id} onClick={function(){setMode(mv.id);}} style={{flex:1,background:mode===mv.id?G:N3,color:mode===mv.id?'#000':'#fff',border:'none',borderRadius:10,padding:'8px',cursor:'pointer',fontWeight:700,fontSize:11}}>{mv.l}</button>;
              })}
            </div>
            {(imgAnalyzing||imgError||imgResults.length>0)&&(
              <div style={{marginBottom:12}}>
                {imgAnalyzing&&(
                  <div style={{textAlign:'center',padding:20}}>
                    <div style={{fontSize:32,marginBottom:8}}>🤖</div>
                    <div style={{color:G,fontWeight:700,fontSize:14}}>AIが分析中...</div>
                    <div style={{color:S,fontSize:12,marginTop:4}}>量と栄養素を計算しています（10〜40秒ほど）</div>
                  </div>
                )}
                {imgError&&<div style={{background:R+'22',border:'1px solid '+R+'44',borderRadius:10,padding:12,color:R,fontSize:13,textAlign:'center',marginBottom:10}}>{imgError}</div>}
                {imgResults.length>0&&imgConfirm==='pending'&&(
                  <div>
                    <div style={{background:B+'18',border:'1px solid '+B+'44',borderRadius:12,padding:14,marginBottom:12,textAlign:'left'}}>
                      <div style={{color:B,fontWeight:800,fontSize:14,marginBottom:4}}>🤖 この内容で合っていますか？</div>
                      <div style={{color:S,fontSize:11,marginBottom:8}}>量（g）を直すとカロリーも自動で計算し直します</div>
                      {imgResults.map(function(f,i){
                        return (
                          <div key={i} style={{padding:'8px 0',borderBottom:i<imgResults.length-1?'1px solid '+N3:'none'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                              <div style={{color:'#fff',fontSize:13,fontWeight:700,flex:1}}>{f.n}</div>
                              <div style={{color:G,fontWeight:800,fontSize:13}}>{f.cal} kcal</div>
                              <button aria-label={f.n+'を外す'} onClick={function(){removeResult(i);}} style={{background:'none',border:'none',color:S,cursor:'pointer',fontSize:14}}>✕</button>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:4}}>
                              <input aria-label={f.n+'の量（g）'} type="number" inputMode="numeric" value={f.g||''} onChange={function(e){setResultGrams(i,e.target.value);}} style={{width:70,background:N,border:'1px solid '+N3,borderRadius:6,padding:'4px 6px',color:'#fff',fontSize:12}}/>
                              <span style={{color:S,fontSize:11}}>g　P:{f.p}g F:{f.f}g C:{f.c}g</span>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{color:G,fontWeight:700,fontSize:13,marginTop:8}}>
                        合計: {imgResults.reduce(function(sum,f){return sum+(f.cal||0);},0)} kcal
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8,marginBottom:10}}>
                      <button onClick={function(){
                        imgResults.forEach(function(f){var it=cleanAI(f);rememberFood(it);addFood(it,null,true);});
                        closeAdd();
                      }} style={{flex:2,background:G,border:'none',borderRadius:10,color:'#000',padding:'11px',cursor:'pointer',fontWeight:700,fontSize:13}}>✅ 全て追加する</button>
                      <button onClick={function(){setImgConfirm('select');}} style={{flex:1,background:N3,border:'none',borderRadius:10,color:'#fff',padding:'11px',cursor:'pointer',fontWeight:700,fontSize:12}}>選んで追加</button>
                    </div>
                    <button onClick={function(){setImgResults([]);setImgConfirm(null);}} style={{width:'100%',background:'none',border:'1px solid '+N3,borderRadius:10,color:S,padding:'8px',cursor:'pointer',fontSize:12}}>✕ やり直す</button>
                  </div>
                )}
                {imgResults.length>0&&imgConfirm==='select'&&(
                  <div>
                    <div style={{color:S2,fontWeight:700,fontSize:13,marginBottom:8}}>追加したい食品をタップしてください</div>
                    {imgResults.map(function(f,i){
                      return (
                        <div key={i} onClick={function(){if(imgAdded[i])return;var it=cleanAI(f);rememberFood(it);addFood(it,null,true);setImgAdded(function(a){var na=Object.assign({},a);na[i]=true;return na;});}} style={{background:imgAdded[i]?G+'22':N,borderRadius:10,padding:'10px 12px',marginBottom:6,cursor:imgAdded[i]?'default':'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',border:'1px solid '+G+'44'}}>
                          <div style={{textAlign:'left'}}>
                            <div style={{color:'#fff',fontSize:13,fontWeight:700}}>{imgAdded[i]?'✓ ':''}{f.n}</div>
                            <div style={{color:S,fontSize:11}}>{f.s}　P:{f.p}g F:{f.f}g C:{f.c}g</div>
                          </div>
                          <div style={{color:G,fontWeight:800,fontSize:14}}>{f.cal} kcal</div>
                        </div>
                      );
                    })}
                    <button onClick={closeAdd} style={{width:'100%',background:G,border:'none',borderRadius:10,color:'#000',padding:'10px',cursor:'pointer',fontWeight:700,fontSize:13,marginTop:4}}>完了</button>
                  </div>
                )}
              </div>
            )}
            {mode==='photo'&&!imgAnalyzing&&imgResults.length===0&&(
              <div>
                <input id="mc-file-input" type="file" accept="image/*" style={{display:'none'}} onChange={handleFileChange}/>
                <div style={{background:N,borderRadius:12,border:'2px dashed '+N3,padding:20,textAlign:'center',marginBottom:12}}>
                  <div style={{fontSize:40,marginBottom:8}}>📸</div>
                  <div style={{color:S2,fontSize:13,marginBottom:12}}>食事の写真をアップロードすると<br/>AIが食品とカロリーを推定します</div>
                  <input value={hint} onChange={function(e){setHint(e.target.value);}} placeholder="補足（任意）例：ご飯は大盛り、ドレッシングあり" style={Object.assign({},inpS,{marginBottom:12})}/>
                  <button onClick={function(){document.getElementById('mc-file-input').click();}} style={{background:G,border:'none',borderRadius:10,color:'#000',padding:'10px 20px',cursor:'pointer',fontWeight:700,fontSize:13}}>📷 写真を選択 / 撮影</button>
                  <div style={{color:S,fontSize:11,marginTop:12,lineHeight:1.6,textAlign:'left'}}>精度を上げるコツ：真上から料理全体を撮る／お皿や箸を一緒に写す／量や味付けは補足に書く</div>
                </div>
              </div>
            )}
            {mode==='search'&&!picked&&imgResults.length===0&&!imgAnalyzing&&(
              <div>
                <input style={Object.assign({},inpS,{marginBottom:10})} placeholder="食品名・料理名・お店の名前で検索" value={search} onChange={function(e){setSearch(e.target.value);setImgError('');}}/>
                {!search.trim()&&recent.length>0&&<div style={{color:S,fontSize:12,margin:'4px 0 8px',textAlign:'left'}}>最近使った食品</div>}
                {!search.trim()&&recent.length===0&&<div style={{color:S,fontSize:12,margin:'4px 0 8px',textAlign:'left'}}>約970品の食材・料理・コンビニ・外食メニューから探せます</div>}
                {(search.trim()?results:recent).map(function(f,i){
                  return (
                    <div key={(f.id||f.n+f.s)+i} onClick={function(){if(search.trim())pickFood(f);else{rememberFood(f);addFood(Object.assign({id:'f'+mkId()},f));}}} style={{background:N,borderRadius:10,padding:'10px 12px',marginBottom:6,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                      <div style={{textAlign:'left'}}><div style={{color:'#fff',fontSize:13,fontWeight:600}}>{f.n}</div><div style={{color:S,fontSize:11}}>{f.s}　P:{f.p}g F:{f.f}g C:{f.c}g</div></div>
                      <div style={{color:G,fontWeight:800,fontSize:13,whiteSpace:'nowrap'}}>{f.cal} kcal</div>
                    </div>
                  );
                })}
                {search.trim()&&(
                  <div style={{background:PU+'18',border:'1px solid '+PU+'55',borderRadius:12,padding:12,marginTop:8,textAlign:'left'}}>
                    <div style={{color:S2,fontSize:12,marginBottom:8}}>{results.length===0?'見つかりませんでした。':'ぴったりのものがない？'}AIが「{search.trim()}」のカロリーを推定します。</div>
                    <button onClick={estimateByText} style={{width:'100%',background:PU,border:'none',borderRadius:10,color:'#fff',padding:'10px',cursor:'pointer',fontWeight:700,fontSize:13}}>🤖 AIで推定する</button>
                  </div>
                )}
              </div>
            )}
            {mode==='search'&&picked&&(
              <div style={{textAlign:'left'}}>
                <button onClick={function(){setPicked(null);}} style={{background:'none',border:'none',color:S,marginBottom:8,cursor:'pointer'}}>← 検索に戻る</button>
                <div style={{color:'#fff',fontSize:16,fontWeight:800}}>{picked.n}</div>
                <div style={{color:S,fontSize:12,marginBottom:12}}>基準：{picked.s}（{picked.g}g）＝ {picked.cal} kcal</div>
                <div style={{display:'flex',gap:6,marginBottom:10}}>
                  {[0.5,1,1.5,2].map(function(r){
                    var gv=Math.round(picked.g*r);
                    var on=+pickGrams===gv;
                    return <button key={r} onClick={function(){setPickGrams(String(gv));}} style={{flex:1,background:on?G:N3,color:on?'#000':'#fff',border:'none',borderRadius:8,padding:'8px 4px',cursor:'pointer',fontWeight:700,fontSize:12}}>×{r}</button>;
                  })}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                  <input aria-label="量（g）" type="number" inputMode="numeric" value={pickGrams} onChange={function(e){setPickGrams(e.target.value);}} style={Object.assign({},inpS,{flex:1})}/>
                  <span style={{color:S,fontSize:13}}>g</span>
                </div>
                {pickedScaled&&(
                  <Cd bg={N} style={{marginBottom:12,padding:12}}>
                    <div style={{color:G,fontSize:20,fontWeight:900}}>{pickedScaled.cal} kcal</div>
                    <div style={{color:S2,fontSize:12}}>P {pickedScaled.p}g / F {pickedScaled.f}g / C {pickedScaled.c}g</div>
                  </Cd>
                )}
                <Btn onClick={addPicked} full>この量で追加</Btn>
              </div>
            )}
            {mode==='manual'&&(
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <input style={inpS} placeholder="食品名（必須）" value={manual.n} onChange={function(e){setManual(function(m){var nm=Object.assign({},m);nm.n=e.target.value;return nm;});}}/>
                <input style={inpS} placeholder="カロリー (kcal)（必須）" type="number" value={manual.cal} onChange={function(e){setManual(function(m){var nm=Object.assign({},m);nm.cal=e.target.value;return nm;});}}/>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {[['p','P(g)'],['f','F(g)'],['c','C(g)']].map(function(pair){
                    return <input key={pair[0]} style={inpS} placeholder={pair[1]} type="number" value={manual[pair[0]]} onChange={function(e){var k=pair[0];var v=e.target.value;setManual(function(m){var nm=Object.assign({},m);nm[k]=v;return nm;});}} />;
                  })}
                </div>
                {err&&<div style={{background:'#fee2e2',color:'#991b1b',padding:'8px 12px',borderRadius:8,fontSize:13,marginBottom:8}}>{err}</div>}
                <Btn onClick={addManual} full>追加</Btn>
              </div>
            )}
            {mode==='recipe'&&(
              <RecipeSuggestion addFood={addFood} onClose={closeAdd}/>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── NutritionScreen ──
function NutritionScreen(props){
  var meals=props.meals,profile=props.profile;
  var goals=calcGoals(profile);
  var m=getDayMacros(meals[todayStr()]);
  var days=lastNDays(7);
  var calData=days.map(function(d){return {date:d,cal:getDayMacros(meals[d]).cal};});
  var week=summarizeWeek(profile,meals,[]);
  var avgCal=week.avgCal,avgP=week.avgP,avgF=week.avgF,avgC=week.avgC;
  var tip=week.recorded===0?'まだ今週の記録がありません。1日1食からでも記録してみましょう。':avgF>goals.f*1.15?'今週は脂質が多めです。揚げ物を減らしてみましょう。':avgP<goals.p*0.8?'タンパク質が不足気味です。肉・魚・卵を意識しましょう。':'バランスよく食べられています！この調子を維持しましょう。';
  return (
    <div style={{padding:'16px 16px 90px'}}>
      <div style={{color:'#fff',fontSize:18,fontWeight:800,marginBottom:14}}>📊 栄養分析</div>
      <Cd style={{marginBottom:12}}>
        <div style={{color:'#fff',fontWeight:700,marginBottom:12}}>今日のPFCバランス</div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <DonutChart p={m.p} f={m.f} c={m.c} size={110}/>
          <div style={{flex:1}}>
            {[{l:'タンパク質(P)',v:m.p,g:goals.p,c:B},{l:'脂質(F)',v:m.f,g:goals.f,c:Y},{l:'炭水化物(C)',v:m.c,g:goals.c,c:G}].map(function(n){
              return (
                <div key={n.l} style={{marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:n.c,fontSize:12,fontWeight:700}}>{n.l}</span><span style={{color:S,fontSize:11}}>{n.v}g / {n.g}g</span></div>
                  <BarProg value={n.v} max={n.g} color={n.c}/>
                </div>
              );
            })}
          </div>
        </div>
      </Cd>
      <Cd style={{marginBottom:12}}>
        <div style={{color:'#fff',fontWeight:700,marginBottom:10}}>週間カロリー推移</div>
        <CalChart data={calData} goal={goals.cal} width={320}/>
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:8}}><div style={{width:20,height:2,background:Y}}/><span style={{color:S,fontSize:11}}>目標: {goals.cal} kcal</span></div>
      </Cd>
      <Cd style={{marginBottom:12}}>
        <div style={{color:'#fff',fontWeight:700,marginBottom:12}}>週間平均<span style={{color:S,fontSize:11,fontWeight:400}}>（記録した{week.recorded}日分）</span></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[{l:'平均カロリー',v:Math.round(avgCal)+'kcal',c:'#fff'},{l:'平均P',v:avgP.toFixed(1)+'g',c:B},{l:'平均F',v:avgF.toFixed(1)+'g',c:Y},{l:'平均C',v:avgC.toFixed(1)+'g',c:G}].map(function(n){
            return <Cd key={n.l} bg={N} style={{padding:10,textAlign:'center'}}><div style={{color:n.c,fontWeight:800,fontSize:16}}>{n.v}</div><div style={{color:S,fontSize:11}}>{n.l}</div></Cd>;
          })}
        </div>
      </Cd>
      <Cd style={{background:G+'18',border:'1px solid '+G+'44'}}><div style={{color:G,fontWeight:700,marginBottom:4}}>📈 今週のまとめ</div><div style={{color:S2,fontSize:13,lineHeight:1.6}}>{tip}</div></Cd>
    </div>
  );
}

// ── WeightScreen ──
function WeightScreen(props){
  var weights=props.weights,setWeights=props.setWeights,profile=props.profile;
  var [w,setW]=useState('');
  var [fat,setFat]=useState('');
  var [errW,setErrW]=useState('');
  var inpS={background:N,border:'1px solid '+N3,borderRadius:8,padding:'10px 12px',color:'#fff',fontSize:15,flex:1};
  function addWeight(){
    var weight=+w;
    if(!w||isNaN(weight)||weight<20||weight>300){
      setErrW('体重は20〜300kgの範囲で入力してください');
      return;
    }
    if(fat!==''){
      var fatNum=+fat;
      if(isNaN(fatNum)||fatNum<0||fatNum>60){
        setErrW('体脂肪率は0〜60%の範囲で入力してください');
        return;
      }
    }
    setErrW('');
    var entry={date:todayStr(),weight:weight,fat:fat?+fat:null};
    setWeights(weights.filter(function(e){return e.date!==todayStr();}).concat([entry]).sort(function(a,b){return a.date.localeCompare(b.date);}));
    setW('');setFat('');
  }
  var latest=weights.length>0?weights[weights.length-1]:null;
  var first=weights.length>0?weights[0]:null;
  var bmi=latest&&profile?Math.round(latest.weight/Math.pow(parseFloat(profile.height)/100,2)*10)/10:null;
  var bmiLabel=!bmi?'':bmi<18.5?'低体重':bmi<25?'普通':bmi<30?'肥満(1)':'肥満(2)';
  var bmiColor=!bmi?S:bmi<18.5?Y:bmi<25?G:bmi<30?Y:R;
  var change=latest&&first?Math.round((latest.weight-first.weight)*10)/10:null;
  return (
    <div style={{padding:'16px 16px 90px'}}>
      <div style={{color:'#fff',fontSize:18,fontWeight:800,marginBottom:14}}>⚖️ 体重管理</div>
      <Cd style={{marginBottom:12}}>
        <div style={{color:'#fff',fontWeight:700,marginBottom:12}}>体重を記録</div>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <input style={inpS} type="number" placeholder="体重 (kg)" value={w} onChange={function(e){setW(e.target.value);}} step="0.1"/>
          <input style={inpS} type="number" placeholder="体脂肪率 %" value={fat} onChange={function(e){setFat(e.target.value);}} step="0.1"/>
        </div>
        {errW&&<div style={{background:'#fee2e2',color:'#991b1b',padding:'8px 12px',borderRadius:8,fontSize:13,marginBottom:8}}>{errW}</div>}
        <Btn onClick={addWeight} full>記録する</Btn>
      </Cd>
      {latest&&(
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            <Cd style={{textAlign:'center',padding:14}}><div style={{color:G,fontSize:28,fontWeight:900}}>{latest.weight}</div><div style={{color:S,fontSize:12}}>kg（最新）</div></Cd>
            {bmi&&<Cd style={{textAlign:'center',padding:14}}><div style={{color:bmiColor,fontSize:28,fontWeight:900}}>{bmi}</div><div style={{color:S,fontSize:12}}>BMI・{bmiLabel}</div></Cd>}
            {profile&&profile.targetWeight&&<Cd style={{textAlign:'center',padding:14}}><div style={{color:G,fontSize:24,fontWeight:900}}>{(latest.weight-parseFloat(profile.targetWeight)).toFixed(1)}</div><div style={{color:S,fontSize:12}}>kg（目標まで）</div></Cd>}
            {change!==null&&<Cd style={{textAlign:'center',padding:14}}><div style={{color:change<=0?G:R,fontSize:24,fontWeight:900}}>{change>0?'+':''}{change}</div><div style={{color:S,fontSize:12}}>kg（開始からの変化）</div></Cd>}
          </div>
          <Cd style={{marginBottom:12}}><div style={{color:'#fff',fontWeight:700,marginBottom:10}}>体重推移</div><WeightChart data={weights.slice(-21)} width={320} height={140}/></Cd>
          <Cd style={{marginBottom:12}}>
            <div style={{color:'#fff',fontWeight:700,marginBottom:8}}>最近の記録</div>
            {weights.slice(-7).reverse().map(function(e){
              return (
                <div key={e.date} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid '+N3}}>
                  <span style={{color:S,fontSize:12}}>{fmtDate(e.date)}</span>
                  <span style={{color:'#fff',fontSize:13,fontWeight:700}}>{e.weight} kg{e.fat?<span style={{color:S,fontWeight:400}}> / {e.fat}%</span>:null}</span>
                  <button aria-label="この記録を削除" onClick={function(){if(window.confirm(fmtDate(e.date)+' の記録を削除しますか？'))setWeights(weights.filter(function(x){return x.date!==e.date;}));}} style={{background:'none',border:'none',color:R,cursor:'pointer',fontSize:14}}>✕</button>
                </div>
              );
            })}
            <div style={{color:S,fontSize:11,marginTop:6}}>同じ日にもう一度記録すると上書きされます</div>
          </Cd>
          {first&&(
            <Cd>
              <div style={{color:'#fff',fontWeight:700,marginBottom:12}}>ビフォーアフター</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[{l:'開始時',d:first},{l:'現在',d:latest}].map(function(r){
                  return (
                    <div key={r.l} style={{background:N,borderRadius:12,padding:12,textAlign:'center'}}>
                      <div style={{color:S,fontSize:11,marginBottom:4}}>{r.l} ({fmtDate(r.d.date)})</div>
                      <div style={{color:'#fff',fontSize:20,fontWeight:900}}>{r.d.weight} kg</div>
                      {r.d.fat&&<div style={{color:S,fontSize:12}}>{r.d.fat}%</div>}
                    </div>
                  );
                })}
              </div>
            </Cd>
          )}
        </div>
      )}
    </div>
  );
}

// ── LineConsultSection ──
function LineConsultSection(){
  return (
    <div style={{marginTop:24}}>
      <div style={{fontSize:14,color:S,marginBottom:8,fontWeight:'bold'}}>個別相談</div>
      <div style={{background:'linear-gradient(135deg,#06C755 0%,#04a047 100%)',borderRadius:16,padding:20,color:'#fff',boxShadow:'0 4px 12px rgba(6,199,85,0.3)'}}>
        <div style={{fontSize:18,fontWeight:'bold',marginBottom:8}}>💬 shoと直接話す</div>
        <div style={{fontSize:13,lineHeight:1.6,opacity:0.95,marginBottom:16}}>まだ友だち追加していない方は、先に公式LINEを追加してください。日報・週報・相談はすべてこのLINEに届きます。</div>
        <button onClick={function(){openLine(null,'coach_add');}} style={{width:'100%',background:'#fff',color:'#06C755',border:'none',padding:'14px',borderRadius:10,fontSize:15,fontWeight:'bold',cursor:'pointer'}}>公式LINEを友だち追加 →</button>
        <div style={{fontSize:11,opacity:0.85,marginTop:12,lineHeight:1.5,whiteSpace:'pre-line'}}>{'※ AIではなくsho本人が返信します\n※ 返信まで1〜2日いただく場合があります'}</div>
      </div>
    </div>
  );
}

// ── CoachScreen ──
var DEFAULT_MISSIONS=[
  {id:1,text:'毎食タンパク質20g以上を意識する',done:false,auto:false,priority:'high'},
  {id:2,text:'毎日記録をつける（7日連続）',done:false,auto:false,priority:'mid'},
  {id:3,text:'夕食の炭水化物を100g以内に抑える',done:false,auto:false,priority:'mid'}
];
var CONSULT_TEMPLATES=[
  {l:'食事の相談',t:'食事について相談です。\n'},
  {l:'外食・飲み会',t:'外食・飲み会の予定があります。何に気をつければいいですか？\n'},
  {l:'体重が落ちない',t:'記録は続けていますが、体重がなかなか落ちません。\n'},
  {l:'続かない',t:'最近、記録や食事管理が続かなくなっています。\n'}
];
function CoachScreen(props){
  var meals=props.meals,weights=props.weights,profile=props.profile;
  var [sub,setSub]=useState('report');
  var [missions,setMissions]=useState(function(){return loadJSON('mc2_missions',DEFAULT_MISSIONS);});
  var [draft,setDraft]=useState(function(){return loadJSON('mc2_consult_draft','');});
  var [attachReport,setAttachReport]=useState(true);
  var [newMissionText,setNewMissionText]=useState('');
  var [newPriority,setNewPriority]=useState('mid');
  var [autoMsg,setAutoMsg]=useState('');
  useEffect(function(){saveJSON('mc2_missions',missions);},[missions]);
  useEffect(function(){saveJSON('mc2_consult_draft',draft);},[draft]);
  var week=summarizeWeek(profile,meals,weights);
  var goals=week.goals,avgCal=week.avgCal,avgP=week.avgP,avgF=week.avgF,recorded=week.recorded,wChange=week.wChange,avgScore=week.avgScore;
  var weeklyText=buildWeeklyReport(profile,meals,weights,missions);
  var inpS={background:N,border:'1px solid '+N3,borderRadius:8,padding:'8px 12px',color:'#fff',fontSize:13,width:'100%',boxSizing:'border-box'};
  function pColor(p){return p==='high'?R:p==='mid'?Y:G;}
  function pLabel(p){return p==='high'?'高':p==='mid'?'中':'低';}
  function sendConsult(){
    var body=draft.trim();
    if(!body) return;
    openLine(body+(attachReport?'\n\n'+weeklyText:''),'coach_consult');
    setDraft('');
  }
  function suggestMissions(){
    var nm=[];
    var base=Date.now();
    function mk(i,text,priority){return {id:base+i,text:text,done:false,auto:true,priority:priority};}
    if(avgP<goals.p*0.8) nm.push(mk(1,'毎食タンパク質を意識して摂る（目標：'+goals.p+'g/日）','high'));
    if(avgF>goals.f*1.15) nm.push(mk(2,'今週は揚げ物・脂っこい食事を2回以内に抑える','high'));
    if(recorded<5) nm.push(mk(3,'今週は毎日食事を記録する（7日連続を目指そう）','mid'));
    if(avgCal>goals.cal*1.1) nm.push(mk(4,'1日の摂取カロリーを'+goals.cal+'kcal以内に抑える','high'));
    if(nm.length===0) nm.push(mk(5,'今週の目標：毎日水を2L以上飲む','low'));
    setMissions(function(m){return m.filter(function(mi){return !mi.auto;}).concat(nm);});
    setAutoMsg(nm.length+'件のミッションを追加しました');
    setTimeout(function(){setAutoMsg('');},3000);
  }
  function addMission(){
    var text=newMissionText.trim();
    if(!text) return;
    setMissions(function(m){return m.concat([{id:Date.now(),text:text.slice(0,60),done:false,auto:false,priority:newPriority}]);});
    setNewMissionText('');
  }
  var doneCount=missions.filter(function(m){return m.done;}).length;
  return (
    <div style={{padding:'12px 16px 90px'}}>
      <div style={{color:'#fff',fontSize:18,fontWeight:800,marginBottom:12}}>👨‍💼 コーチ</div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {[{id:'report',l:'📋 レポート'},{id:'consult',l:'💬 相談'},{id:'missions',l:'🎯 ミッション'}].map(function(sv){
          return <button key={sv.id} onClick={function(){setSub(sv.id);}} style={{flex:1,background:sub===sv.id?G:N2,color:sub===sv.id?'#000':'#fff',border:'none',borderRadius:10,padding:'8px 4px',cursor:'pointer',fontWeight:700,fontSize:11,whiteSpace:'nowrap'}}>{sv.l}</button>;
        })}
      </div>
      {sub==='report'&&(
        <div>
          <Cd style={{marginBottom:10}}>
            <div style={{color:'#fff',fontWeight:700,marginBottom:12}}>週次レポート<span style={{color:S,fontSize:11,fontWeight:400}}>（直近7日）</span></div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[{l:'平均カロリー',v:recorded?Math.round(avgCal)+'kcal':'--',c:G},{l:'記録日数',v:recorded+'/7日',c:B},{l:'体重変化',v:wChange!==null?(wChange>0?'+':'')+wChange+'kg':'--',c:wChange!==null&&wChange<=0?G:wChange===null?S:R},{l:'食事スコア',v:recorded?Math.round(avgScore)+'点':'--',c:avgScore>=70?G:Y}].map(function(n){
                return <Cd key={n.l} bg={N} style={{padding:12,textAlign:'center'}}><div style={{color:n.c,fontSize:18,fontWeight:900}}>{n.v}</div><div style={{color:S,fontSize:11,marginTop:2}}>{n.l}</div></Cd>;
              })}
            </div>
          </Cd>
          <Cd style={{background:G+'18',border:'1px solid '+G+'44',marginBottom:10}}>
            <div style={{color:G,fontWeight:700,marginBottom:6}}>今週のまとめ</div>
            <div style={{color:S2,fontSize:13,lineHeight:1.7}}>
              {recorded>=5?'今週は'+recorded+'日記録できました。この積み重ねが一番の近道です。':recorded>0?'今週は'+recorded+'日の記録です。完璧じゃなくて大丈夫。まずは1日1食からでも続けていきましょう。':'今週はまだ記録がありません。今日の1食から始めてみましょう。'}
              {wChange!==null&&wChange<0?' 体重は'+Math.abs(wChange)+'kg減っています。順調です。':''}
              {recorded>0?(avgScore>=70?' 食事スコアも良い水準です。':' 食事スコアは'+Math.round(avgScore)+'点。どこを整えるかはコーチと一緒に考えましょう。'):''}
            </div>
          </Cd>
          <Cd style={{background:'#06C75518',border:'1px solid #06C75566'}}>
            <div style={{color:'#06C755',fontWeight:800,fontSize:13,marginBottom:8}}>📤 週報をコーチに送る</div>
            <pre style={{textAlign:'left',background:N,borderRadius:8,padding:10,color:S2,fontSize:11,lineHeight:1.6,whiteSpace:'pre-wrap',margin:'0 0 10px',fontFamily:'inherit'}}>{weeklyText}</pre>
            <Btn onClick={function(){openLine(weeklyText,'coach_weekly');}} full color="#06C755" style={{color:'#fff'}}>LINEで週報を送る</Btn>
            <div style={{color:S,fontSize:11,marginTop:8,lineHeight:1.5}}>LINEが開き、上の内容が入力欄に入ります。ひとこと添えて送信してください。</div>
          </Cd>
        </div>
      )}
      {sub==='consult'&&(
        <div>
          <Cd style={{marginBottom:10}}>
            <div style={{color:'#fff',fontWeight:700,marginBottom:8}}>コーチに相談する</div>
            <div style={{color:S,fontSize:12,lineHeight:1.6,marginBottom:10}}>書いた内容は公式LINEでshoに届き、返信もLINEに届きます。どんな小さなことでも大丈夫です。</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:10}}>
              {CONSULT_TEMPLATES.map(function(t){
                return <button key={t.l} onClick={function(){setDraft(function(d){return d?d+'\n'+t.t:t.t;});}} style={{background:N3,border:'none',borderRadius:14,color:S2,fontSize:11,padding:'5px 10px',cursor:'pointer'}}>{t.l}</button>;
              })}
            </div>
            <textarea value={draft} onChange={function(e){setDraft(e.target.value);}} placeholder="例：来週の飲み会、何を頼めばいいですか？" rows={5} style={Object.assign({},inpS,{resize:'vertical',lineHeight:1.6,fontFamily:'inherit'})}/>
            <label style={{display:'flex',alignItems:'center',gap:8,color:S2,fontSize:12,margin:'10px 0'}}>
              <input type="checkbox" checked={attachReport} onChange={function(e){setAttachReport(e.target.checked);}}/>
              今週の記録（週報）を一緒に送る
            </label>
            <Btn onClick={sendConsult} full color="#06C755" style={{color:'#fff',opacity:draft.trim()?1:0.5}}>LINEで送る</Btn>
          </Cd>
        </div>
      )}
      {sub==='missions'&&(
        <div>
          <Cd bg={N2} style={{marginBottom:12}}>
            <div style={{color:S,fontSize:12,lineHeight:1.6,marginBottom:10}}>コーチから届いたミッションをここに入れておくと、毎日チェックできます。</div>
            <input style={Object.assign({},inpS,{marginBottom:8})} placeholder="ミッション内容を入力..." value={newMissionText} onChange={function(e){setNewMissionText(e.target.value);}} onKeyDown={function(e){if(e.key==='Enter')addMission();}}/>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{color:S,fontSize:12,flexShrink:0}}>優先度：</div>
              {[{v:'high',l:'高',c:R},{v:'mid',l:'中',c:Y},{v:'low',l:'低',c:G}].map(function(pv){
                return <button key={pv.v} onClick={function(){setNewPriority(pv.v);}} style={{flex:1,background:newPriority===pv.v?pv.c:N3,color:'#fff',border:'none',borderRadius:8,padding:'6px',cursor:'pointer',fontWeight:700,fontSize:12}}>{pv.l}</button>;
              })}
              <Btn onClick={addMission} sm style={{flexShrink:0}}>追加</Btn>
            </div>
            <button onClick={suggestMissions} style={{width:'100%',marginTop:10,background:'none',border:'1px dashed '+N3,borderRadius:10,color:S2,padding:'8px',cursor:'pointer',fontSize:12}}>📊 今週の記録からミッションを提案してもらう</button>
            {autoMsg&&<div style={{color:G,fontSize:12,marginTop:8,fontWeight:700}}>{autoMsg}</div>}
          </Cd>
          {missions.length===0&&<div style={{textAlign:'center',padding:'30px 0',color:S}}><div style={{fontSize:36,marginBottom:8}}>🎯</div><div>ミッションはまだありません</div></div>}
          {['high','mid','low'].map(function(pr){
            var group=missions.filter(function(ms){return (ms.priority||'mid')===pr;});
            if(group.length===0) return null;
            return (
              <div key={pr}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:pColor(pr)}}/>
                  <div style={{color:S,fontSize:11,fontWeight:700}}>優先度{pLabel(pr)}</div>
                </div>
                {group.map(function(ms){
                  return (
                    <Cd key={ms.id} style={{marginBottom:8,padding:12}}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <button aria-label={ms.done?'未達成に戻す':'達成にする'} onClick={function(){
                          setMissions(function(m){return m.map(function(mi){return mi.id===ms.id?Object.assign({},mi,{done:!mi.done}):mi;});});
                        }} style={{width:24,height:24,borderRadius:'50%',border:'2px solid '+(ms.done?G:N3),background:ms.done?G:'transparent',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#000',fontSize:14,fontWeight:800}}>
                          {ms.done?'✓':''}
                        </button>
                        <div style={{flex:1}}>
                          <div style={{color:ms.done?S:S2,fontSize:13,textDecoration:ms.done?'line-through':'none'}}>{ms.text}</div>
                          {ms.auto&&<span style={{color:PU,fontSize:10}}>📊 記録から提案</span>}
                        </div>
                        <button aria-label="ミッションを削除" onClick={function(){setMissions(function(m){return m.filter(function(mi){return mi.id!==ms.id;});});}} style={{background:'none',border:'none',color:S,cursor:'pointer',fontSize:14,padding:'0 2px'}}>🗑</button>
                      </div>
                    </Cd>
                  );
                })}
              </div>
            );
          })}
          {missions.length>0&&(
            <div style={{textAlign:'center',marginTop:10}}>
              <div style={{color:S,fontSize:12,marginBottom:4}}>{doneCount}/{missions.length} 達成</div>
              <BarProg value={doneCount} max={Math.max(missions.length,1)} h={6}/>
              <button onClick={function(){openLine('【ミッション報告】'+getDisplayName(profile)+'\n'+missions.map(function(m){return (m.done?'✅ ':'⬜ ')+m.text;}).join('\n'),'coach_missions');}} style={{marginTop:12,background:'none',border:'1px solid #06C755',borderRadius:10,color:'#06C755',padding:'8px 14px',cursor:'pointer',fontSize:12,fontWeight:700}}>達成状況をLINEで報告</button>
            </div>
          )}
        </div>
      )}
      <LineConsultSection/>
    </div>
  );
}

// ── ExportScreen ──
function ExportScreen(props){
  var meals=props.meals,weights=props.weights,profile=props.profile,onClose=props.onClose;
  var [type,setType]=useState('meals');
  var [copied,setCopied]=useState(false);
  var goals=calcGoals(profile);
  function mealRows(){
    var header=['日付','食事区分','食品名','カロリー','P(g)','F(g)','C(g)','合計Cal','合計P','合計F','合計C','スコア'];
    var rows=[header];
    Object.keys(meals).sort().forEach(function(date){
      var dm=meals[date];
      var dayM=getDayMacros(dm);
      var sc=calcScore(dayM,goals);
      [{key:'breakfast',l:'朝食'},{key:'lunch',l:'昼食'},{key:'dinner',l:'夕食'},{key:'snack',l:'間食'}].forEach(function(sec){
        var items=dm[sec.key]||[];
        items.forEach(function(it,i){
          rows.push([date,sec.l,it.n,Math.round(it.cal*(it.qty||1)),Math.round((it.p||0)*(it.qty||1)*10)/10,Math.round((it.f||0)*(it.qty||1)*10)/10,Math.round((it.c||0)*(it.qty||1)*10)/10,i===0?dayM.cal:'',i===0?dayM.p:'',i===0?dayM.f:'',i===0?dayM.c:'',i===0?sc:'']);
        });
      });
    });
    return rows;
  }
  function weightRows(){
    var header=['日付','体重(kg)','体脂肪率(%)','BMI','目標体重','差分(kg)'];
    var rows=[header];
    weights.forEach(function(w){
      var h=parseFloat((profile&&profile.height)||170);
      var bmi=Math.round(w.weight/Math.pow(h/100,2)*10)/10;
      var diff=profile&&profile.targetWeight?Math.round((w.weight-parseFloat(profile.targetWeight))*10)/10:'';
      rows.push([w.date,w.weight,w.fat||'',bmi,(profile&&profile.targetWeight)||'',diff]);
    });
    return rows;
  }
  function nutritionRows(){
    var header=['日付','Cal','目標Cal','Cal%','P(g)','目標P','P%','F(g)','目標F','F%','C(g)','目標C','C%','スコア'];
    var rows=[header];
    Object.keys(meals).sort().forEach(function(date){
      var m=getDayMacros(meals[date]);
      function pct(k){return goals[k]>0?Math.round(m[k]/goals[k]*100):0;}
      rows.push([date,m.cal,goals.cal,pct('cal'),m.p,goals.p,pct('p'),m.f,goals.f,pct('f'),m.c,goals.c,pct('c'),calcScore(m,goals)]);
    });
    return rows;
  }
  function getRows(){return type==='meals'?mealRows():type==='weight'?weightRows():nutritionRows();}
  function toTSV(rows){return rows.map(function(r){return r.join('\t');}).join('\n');}
  function toCSV(rows){return rows.map(function(r){return r.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(',');}).join('\n');}
  var rows=getRows();
  var header=rows[0];
  var dataRows=rows.slice(1);
  function copyTSV(){
    if(!navigator.clipboard){alert('この端末ではコピーできません。CSVをダウンロードしてください。');return;}
    navigator.clipboard.writeText(toTSV(rows)).then(function(){setCopied(true);setTimeout(function(){setCopied(false);},2000);}).catch(function(){alert('コピーに失敗しました。CSVをダウンロードしてください。');});
  }
  function download(){
    var blob=new Blob(['\uFEFF'+toCSV(rows)],{type:'text/csv;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='mealcare_'+type+'_'+todayStr()+'.csv';a.click();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }
  return (
    <div style={{position:'fixed',inset:0,background:N,zIndex:300,overflow:'auto',maxWidth:480,margin:'0 auto'}}>
      <div style={{padding:'16px 16px 100px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <button onClick={onClose} style={{background:N3,border:'none',color:'#fff',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:14}}>← 戻る</button>
          <div style={{color:'#fff',fontSize:18,fontWeight:800}}>📤 Sheetsエクスポート</div>
        </div>
        <Cd bg={N2} style={{marginBottom:14,padding:14}}>
          <div style={{color:G,fontWeight:700,fontSize:13,marginBottom:8}}>📋 Google Sheetsへの手順</div>
          {['① 「タブ区切りでコピー」を押す','② Sheetsを開いてA1をクリック','③ Ctrl+V（⌘+V）で貼り付け'].map(function(s,i){return <div key={i} style={{color:S2,fontSize:12,lineHeight:1.8}}>{s}</div>;})}
        </Cd>
        <div style={{display:'flex',gap:6,marginBottom:12}}>
          {[{id:'meals',l:'🍽️ 食事'},{id:'weight',l:'⚖️ 体重'},{id:'nutrition',l:'📊 栄養'}].map(function(t){
            return <button key={t.id} onClick={function(){setType(t.id);}} style={{flex:1,background:type===t.id?G:N2,color:type===t.id?'#000':'#fff',border:'none',borderRadius:10,padding:'8px 4px',cursor:'pointer',fontWeight:700,fontSize:11}}>{t.l}</button>;
          })}
        </div>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          <button onClick={copyTSV} style={{flex:2,background:copied?G:B,color:'#fff',border:'none',borderRadius:10,padding:'11px',cursor:'pointer',fontWeight:700,fontSize:13}}>{copied?'✓ コピー完了！':'📋 タブ区切りでコピー'}</button>
          <button onClick={download} style={{flex:1,background:N2,color:'#fff',border:'1px solid '+N3,borderRadius:10,padding:'11px',cursor:'pointer',fontWeight:700,fontSize:12}}>⬇ CSV</button>
        </div>
        <div style={{color:S,fontSize:12,marginBottom:6}}>{dataRows.length} 件のデータ</div>
        <div style={{overflowX:'auto',borderRadius:12,border:'1px solid '+N3}}>
          <table style={{borderCollapse:'collapse',width:'100%',minWidth:400,fontSize:11}}>
            <thead><tr style={{background:N3}}>{header.map(function(h,i){return <th key={i} style={{color:S2,padding:'8px 8px',textAlign:'left',whiteSpace:'nowrap',fontWeight:700}}>{h}</th>;})}</tr></thead>
            <tbody>
              {dataRows.slice(0,15).map(function(row,i){
                return <tr key={i} style={{background:i%2===0?N2:N,borderBottom:'1px solid '+N3}}>{row.map(function(cell,j){return <td key={j} style={{color:S2,padding:'6px 8px',whiteSpace:'nowrap'}}>{cell}</td>;})}</tr>;
              })}
            </tbody>
          </table>
          {dataRows.length>15&&<div style={{color:S,fontSize:11,textAlign:'center',padding:'8px',background:N2}}>... 他 {dataRows.length-15} 件</div>}
        </div>
      </div>
    </div>
  );
}

// ── Main App ──
export default function App(){
  // 旧キー（mc_*）からの移行は state を読む前に済ませる
  useState(migrateLocalStorage);
  var [profile,setProfile]=useState(function(){return loadJSON('mc2_profile',null);});
  var [meals,setMeals]=useState(function(){var m=loadJSON('mc2_meals',{});return m&&typeof m==='object'?m:{};});
  var [weights,setWeights]=useState(function(){var w=loadJSON('mc2_weights',[]);return Array.isArray(w)?w:[];});
  var [tab,setTab]=useState('home');
  var [mealTab,setMealTab]=useState('breakfast');
  var [showExport,setShowExport]=useState(false);
  var [editingProfile,setEditingProfile]=useState(false);
  useEffect(function(){if(profile)saveJSON('mc2_profile',profile);},[profile]);
  useEffect(function(){saveJSON('mc2_meals',meals);},[meals]);
  useEffect(function(){saveJSON('mc2_weights',weights);},[weights]);
  if(!profile) return <Onboarding onDone={function(pf){setProfile(pf);setTab('home');}}/>;
  if(editingProfile) return <Onboarding initial={profile} onCancel={function(){setEditingProfile(false);}} onDone={function(pf){setProfile(pf);setEditingProfile(false);}}/>;
  return (
    <div style={{background:N,minHeight:'100vh',maxWidth:480,margin:'0 auto',fontFamily:'-apple-system,BlinkMacSystemFont,"Hiragino Sans","Noto Sans JP",sans-serif',color:'#fff',overflowX:'hidden',width:'100%',boxSizing:'border-box'}}>
      {showExport&&<ExportScreen meals={meals} weights={weights} profile={profile} onClose={function(){setShowExport(false);}}/>}
      <div style={{paddingTop:8}}>
        <div style={{display:'flex',justifyContent:'flex-end',gap:6,padding:'6px 16px 4px'}}>
          <button onClick={function(){setEditingProfile(true);}} style={{background:N2,border:'1px solid '+N3,borderRadius:8,color:S2,fontSize:11,fontWeight:700,padding:'6px 10px',cursor:'pointer'}}>⚙️ プロフィール・目標</button>
          <button onClick={function(){setShowExport(true);}} style={{background:N2,border:'1px solid '+N3,borderRadius:8,color:S2,fontSize:11,fontWeight:700,padding:'6px 10px',cursor:'pointer'}}>📤 データ出力</button>
        </div>
        {tab==='home'&&<ErrorBoundary screen="home"><HomeScreen profile={profile} meals={meals} weights={weights} setTab={setTab} setMealTab={setMealTab}/></ErrorBoundary>}
        {tab==='log'&&<ErrorBoundary screen="log"><LogScreen meals={meals} setMeals={setMeals} mealTab={mealTab} setMealTab={setMealTab}/></ErrorBoundary>}
        {tab==='nutrition'&&<ErrorBoundary screen="nutrition"><NutritionScreen meals={meals} profile={profile}/></ErrorBoundary>}
        {tab==='weight'&&<ErrorBoundary screen="weight"><WeightScreen weights={weights} setWeights={setWeights} profile={profile}/></ErrorBoundary>}
        {tab==='coach'&&<ErrorBoundary screen="coach"><CoachScreen meals={meals} weights={weights} profile={profile}/></ErrorBoundary>}
      </div>
      <BottomNav tab={tab} onChange={setTab}/>
    </div>
  );
}
