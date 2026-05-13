import React, { useState, useEffect } from "react";
import { RECIPES } from "./data/recipes";

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
    var oldClients=localStorage.getItem('mc_clients');
    if(oldClients&&!localStorage.getItem('mc2_clients')){
      localStorage.setItem('mc2_clients',oldClients);
    }
    var oldMeals=localStorage.getItem('mc_meals');
    if(oldMeals&&!localStorage.getItem('mc2_meals')){
      localStorage.setItem('mc2_meals',oldMeals);
    }
    var oldWeights=localStorage.getItem('mc_weights');
    if(oldWeights&&!localStorage.getItem('mc2_weights')){
      localStorage.setItem('mc2_weights',oldWeights);
    }
    ['mc_water','mc_clients','mc_meals','mc_weights'].forEach(function(k){
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
    }catch(e){}
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

var FDB=[
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
  {id:56,n:'鶏ささみ',s:'100g',cal:98,p:23.0,f:0.8,c:0,cat:'肉・魚'},
  {id:57,n:'豚もも肉',s:'100g',cal:171,p:20.5,f:9.3,c:0.2,cat:'肉・魚'},
  {id:58,n:'タラ',s:'100g',cal:72,p:17.6,f:0.2,c:0.1,cat:'肉・魚'},
  {id:59,n:'エビ',s:'100g',cal:82,p:18.4,f:0.6,c:0.1,cat:'肉・魚'},
  {id:60,n:'ホタテ',s:'100g',cal:72,p:13.5,f:0.9,c:1.5,cat:'肉・魚'},
  {id:61,n:'サバ缶',s:'1缶150g',cal:228,p:26.2,f:13.9,c:0.3,cat:'肉・魚'},
  {id:62,n:'鶏ハム',s:'100g',cal:120,p:22.0,f:2.8,c:1.0,cat:'肉・魚'},
  {id:63,n:'ゆで卵',s:'1個',cal:78,p:6.5,f:5.4,c:0.3,cat:'卵・豆'},
  {id:64,n:'枝豆',s:'50g',cal:68,p:5.8,f:3.2,c:4.5,cat:'卵・豆'},
  {id:65,n:'小松菜',s:'100g',cal:14,p:1.5,f:0.2,c:2.4,cat:'野菜'},
  {id:66,n:'キャベツ',s:'100g',cal:23,p:1.3,f:0.2,c:5.2,cat:'野菜'},
  {id:67,n:'もやし',s:'100g',cal:15,p:1.7,f:0.1,c:2.6,cat:'野菜'},
  {id:68,n:'こんにゃく',s:'100g',cal:5,p:0.1,f:0,c:2.3,cat:'野菜'},
  {id:69,n:'キウイ',s:'1個',cal:53,p:1.0,f:0.2,c:13.5,cat:'果物'},
  {id:70,n:'いちご',s:'100g',cal:34,p:0.9,f:0.1,c:8.5,cat:'果物'},
  {id:71,n:'ギリシャヨーグルト',s:'100g',cal:59,p:10.0,f:0.2,c:3.6,cat:'乳製品'},
  {id:72,n:'カッテージチーズ',s:'100g',cal:99,p:13.3,f:4.5,c:1.9,cat:'乳製品'},
  {id:73,n:'サラダチキン',s:'1枚115g',cal:115,p:24.5,f:1.4,c:0.5,cat:'加工食品'},
  {id:74,n:'照り焼きチキン',s:'150g',cal:220,p:30.0,f:7.5,c:8.5,cat:'料理'},
  {id:75,n:'野菜炒め',s:'200g',cal:155,p:8.0,f:8.5,c:12.0,cat:'料理'},
  {id:76,n:'鶏鍋',s:'400g',cal:280,p:28.0,f:8.0,c:18.0,cat:'料理'},
  {id:77,n:'オートミール粥',s:'200g',cal:130,p:5.0,f:2.5,c:22.0,cat:'料理'},
  {id:78,n:'ブロッコリーツナサラダ',s:'200g',cal:115,p:16.0,f:3.5,c:6.0,cat:'料理'},
  {id:79,n:'LSN サラダチキン プレーン',s:'110g',cal:116,p:24.4,f:1.5,c:1.0,cat:'ローソン'},
  {id:80,n:'LSN サラダチキン スモーク',s:'115g',cal:124,p:24.5,f:2.0,c:1.5,cat:'ローソン'},
  {id:81,n:'LSN ブランパン',s:'1個35g',cal:68,p:5.4,f:2.9,c:2.0,cat:'ローソン'},
  {id:82,n:'LSN からあげクン',s:'5個100g',cal:230,p:13.5,f:15.0,c:8.0,cat:'ローソン'},
  {id:83,n:'LSN おにぎり 鮭',s:'105g',cal:178,p:4.5,f:1.2,c:37.0,cat:'ローソン'},
  {id:84,n:'LSN おにぎり 昆布',s:'100g',cal:168,p:3.2,f:0.5,c:36.5,cat:'ローソン'},
  {id:85,n:'LSN ギリシャヨーグルト',s:'100g',cal:59,p:10.0,f:0.2,c:3.6,cat:'ローソン'},
  {id:86,n:'LSN ゆでたまご',s:'1個',cal:76,p:6.5,f:5.2,c:0.3,cat:'ローソン'},
  {id:87,n:'LSN 豚汁スープ',s:'200g',cal:88,p:4.5,f:3.2,c:10.5,cat:'ローソン'},
  {id:88,n:'FM サラダチキン プレーン',s:'115g',cal:120,p:25.0,f:1.5,c:1.0,cat:'ファミマ'},
  {id:89,n:'FM サラダチキン 柚子こしょう',s:'115g',cal:118,p:24.5,f:1.4,c:1.2,cat:'ファミマ'},
  {id:90,n:'FM サラダチキンスティック',s:'67g',cal:83,p:12.2,f:2.5,c:0.4,cat:'ファミマ'},
  {id:91,n:'FM ファミチキ胸肉',s:'95g',cal:220,p:18.5,f:12.5,c:8.5,cat:'ファミマ'},
  {id:92,n:'FM おにぎり 鮭',s:'105g',cal:180,p:4.6,f:1.3,c:37.5,cat:'ファミマ'},
  {id:93,n:'FM おにぎり 明太子',s:'105g',cal:175,p:4.2,f:1.0,c:37.0,cat:'ファミマ'},
  {id:94,n:'FM チキンとたまごのサラダ',s:'160g',cal:145,p:12.5,f:7.5,c:7.0,cat:'ファミマ'},
  {id:95,n:'FM おでん 大根',s:'100g',cal:25,p:0.8,f:0.1,c:5.5,cat:'ファミマ'},
  {id:96,n:'FM おでん たまご',s:'60g',cal:78,p:6.5,f:5.2,c:0.5,cat:'ファミマ'},
  {id:97,n:'FM 豆腐わかめスープ',s:'180ml',cal:42,p:3.0,f:1.5,c:3.5,cat:'ファミマ'},
];

function getDisplayName(profile){
  var name=profile&&profile.name?profile.name.trim():'';
  return name&&name.length>0?name:'あなた';
}
function todayStr(){return new Date().toISOString().slice(0,10);}
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

// ── AI Photo Analysis ──
function callPhotoAI(base64, mediaType, onSuccess, onError) {
  var source = {};
  source['type'] = 'base64';
  source['media_type'] = mediaType;
  source['data'] = base64;

  var imgBlock = {};
  imgBlock['type'] = 'image';
  imgBlock['source'] = source;

  var txtBlock = {};
  txtBlock['type'] = 'text';
  txtBlock['text'] = 'あなたはプロの管理栄養士です。この食事写真を詳細に分析してください。以下のルールに従ってください。\n1. 写真に写っている全ての食品・料理を必ず特定する\n2. 判断が難しい場合でも、最も可能性が高いものを推定して回答する（「不明」「判断できない」は禁止）\n3. 盛り付けの量・器のサイズ・食品の見た目から重量を推定する\n4. 日本食・コンビニ食・外食など一般的な食事を想定してカロリーと栄養素を計算する\n5. 必ずJSON配列のみ返す。説明文・前置き・コードブロック記号は不要\n形式: [{"n":"具体的な食品名","cal":カロリー数値,"p":タンパク質g,"f":脂質g,"c":炭水化物g,"s":"推定量"}]';

  var userMsg = {};
  userMsg['role'] = 'user';
  userMsg['content'] = [imgBlock, txtBlock];

  var body = {};
  body['model'] = 'claude-sonnet-4-20250514';
  body['max_tokens'] = 1000;
  body['messages'] = [userMsg];

  var hdrs = {};
  hdrs['Content-Type'] = 'application/json';

  var opts = {};
  opts['method'] = 'POST';
  opts['headers'] = hdrs;
  opts['body'] = JSON.stringify(body);

  fetch('https://api.anthropic.com/v1/messages', opts)
    .then(function(r){return r.json();})
    .then(function(data){
      var blocks = data.content || [];
      var text = '';
      for(var i=0;i<blocks.length;i++){text+=blocks[i].text||'';}
      var clean = text.replace(/```json/g,'').replace(/```/g,'').trim();
      try{
        var parsed = JSON.parse(clean);
        if(Array.isArray(parsed)) onSuccess(parsed);
        else onError();
      }catch(e){onError();}
    })
    .catch(function(){onError();});
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
  var [step,setStep]=useState(0);
  var [form,setForm]=useState({name:'',age:'',gender:'male',height:'',weight:'',goal:'diet',targetWeight:'',targetCal:''});
  function upd(k,v){setForm(function(f){var nf=Object.assign({},f);nf[k]=v;return nf;});}
  var auto=calcGoals(form);
  function submit(){
    var g=calcGoals(form);
    var goals={cal:form.targetCal?+form.targetCal:g.cal,p:g.p,f:g.f,c:g.c};
    var pf=Object.assign({},form);
    pf.goals=goals;
    props.onDone(pf);
  }
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
          <h2 style={{color:'#fff',fontSize:20,fontWeight:800,marginBottom:20}}>基本情報を入力</h2>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div><label style={{color:S,fontSize:12,fontWeight:600,display:'block',marginBottom:5}}>お名前</label><input style={inpS} value={form.name} onChange={function(e){upd('name',e.target.value);}}/></div>
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
            <div style={{display:'flex',gap:10,marginTop:4}}>
              <Btn onClick={function(){setStep(0);}} outline sm style={{flex:1}}>戻る</Btn>
              <Btn onClick={function(){setStep(2);}} style={{flex:2}}>次へ</Btn>
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
          <div style={{display:'flex',gap:10}}>
            <Btn onClick={function(){setStep(2);}} outline sm style={{flex:1}}>戻る</Btn>
            <Btn onClick={submit} style={{flex:2,padding:'12px',fontSize:15}}>🎉 スタート！</Btn>
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
  var cached=null;
  try{cached=JSON.parse(localStorage.getItem('mc2_today_recommend')||'null');}catch(e){}
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
  var recent=[];
  try{
    var log=JSON.parse(localStorage.getItem('mc2_recent_recipes')||'[]');
    var cutoff=Date.now()-7*24*60*60*1000;
    recent=log.filter(function(x){return x.at>cutoff;}).map(function(x){return x.id;});
  }catch(e){}
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
  try{
    localStorage.setItem('mc2_today_recommend',JSON.stringify({date:today,recipeId:pick.id}));
    var log2=JSON.parse(localStorage.getItem('mc2_recent_recipes')||'[]');
    log2.push({id:pick.id,at:Date.now()});
    localStorage.setItem('mc2_recent_recipes',JSON.stringify(log2.slice(-30)));
  }catch(e){}
  return pick;
}

// ── HomeScreen ──
function HomeScreen(props){
  var profile=props.profile,meals=props.meals,weights=props.weights,setTab=props.setTab,setMealTab=props.setMealTab;
  var [water,setWater]=useState(function(){try{var d=JSON.parse(localStorage.getItem('mc2_water')||'{}');return d[todayStr()]||0;}catch(e){return 0;}});
  var today=todayStr();
  var dm=meals[today]||{breakfast:[],lunch:[],dinner:[],snack:[]};
  var m=getDayMacros(dm);
  var goals=calcGoals(profile);
  var score=calcScore(m,goals);
  var streak=Object.keys(meals).filter(function(d){return getDayMacros(meals[d]).cal>0;}).length;
  var lw=weights.length>0?weights[weights.length-1]:null;
  var bmi=lw&&profile?Math.round(lw.weight/Math.pow(parseFloat(profile.height)/100,2)*10)/10:null;
  function addWater(){var nw=water+200;setWater(nw);try{var d=JSON.parse(localStorage.getItem('mc2_water')||'{}');d[today]=nw;localStorage.setItem('mc2_water',JSON.stringify(d));}catch(e){}}
  function removeWater(){var nw=Math.max(0,water-200);setWater(nw);try{var d=JSON.parse(localStorage.getItem('mc2_water')||'{}');d[today]=nw;localStorage.setItem('mc2_water',JSON.stringify(d));}catch(e){}}
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
        <div style={{color:G,fontWeight:800,fontSize:13,marginBottom:4}}>🤖 AIアドバイス</div>
        <div style={{color:S2,fontSize:13,lineHeight:1.6}}>
          {score>=80?'素晴らしい食事バランスです！今日の目標達成率が高く、特にタンパク質が十分摂取できています。':score>=60?'良いペースです。もう少しタンパク質を意識して摂ると、より栄養バランスが整います。':'記録が少ないようです。まずは食事を記録する習慣をつけましょう。'}
        </div>
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
  var results=FDB.filter(function(f){return f.n.indexOf(search)>=0||f.cat.indexOf(search)>=0;}).slice(0,20);
  var inpS={background:N,border:'1px solid '+N3,borderRadius:8,padding:'8px 12px',color:'#fff',fontSize:13,width:'100%',boxSizing:'border-box'};
  function changeDay(delta){var d=new Date(day+'T12:00:00');d.setDate(d.getDate()+delta);setDay(d.toISOString().slice(0,10));}
  function addFood(food,targetMeal){
    var sceneMap={'朝':'breakfast','昼':'lunch','夕':'dinner','間食':'snack'};
    var key=targetMeal?(sceneMap[targetMeal]||targetMeal):mealTab;
    var nit=Object.assign({},food,{qty:1,uid:mkId()});
    var newItems=(dm[key]||[]).concat([nit]);
    var ndm=Object.assign({},dm);
    ndm[key]=newItems;
    setMeals(function(m){var nm=Object.assign({},m);nm[day]=ndm;return nm;});
    setSearch('');setShowAdd(false);setImgResults([]);
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
    var newItems=(dm[mealTab]||[]).filter(function(it){return it.uid!==u;});
    var ndm=Object.assign({},dm);
    ndm[mealTab]=newItems;
    setMeals(function(m){var nm=Object.assign({},m);nm[day]=ndm;return nm;});
  }
  var [imgConfirm,setImgConfirm]=useState(null);

  function handleFileChange(e){
    alert('写真からの自動入力機能は現在準備中です。\n手入力または検索をご利用ください。');
    e.target.value='';
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
                <div style={{color:S,fontSize:11}}>{it.s||''}　P:{(it.p*(it.qty||1)).toFixed(1)}g F:{(it.f*(it.qty||1)).toFixed(1)}g C:{(it.c*(it.qty||1)).toFixed(1)}g</div>
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
        <div onClick={function(e){if(e.target===e.currentTarget)setShowAdd(false);}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
          <div style={{background:N2,borderRadius:'20px 20px 0 0',padding:'20px',width:'100%',maxWidth:480,maxHeight:'80vh',overflow:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div style={{color:'#fff',fontWeight:800,fontSize:16}}>食品を追加</div>
              <button onClick={function(){setShowAdd(false);}} style={{background:'none',border:'none',color:S,cursor:'pointer',fontSize:20}}>✕</button>
            </div>
            <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
              {[{id:'photo',l:'📸 写真AI',wip:true},{id:'search',l:'🔍 検索'},{id:'manual',l:'✏️ 手入力'},{id:'recipe',l:'🍳 レシピ提案'}].map(function(mv){
                if(mv.wip){
                  return (
                    <button key={mv.id} onClick={function(){setMode(mv.id);}} style={{flex:1,background:mode===mv.id?G:N3,color:mode===mv.id?'#000':'#fff',border:'none',borderRadius:10,padding:'8px',cursor:'pointer',fontWeight:700,fontSize:11,opacity:0.5,position:'relative'}}>
                      {mv.l}
                      <span style={{fontSize:9,display:'block',marginTop:2}}>準備中</span>
                    </button>
                  );
                }
                return <button key={mv.id} onClick={function(){setMode(mv.id);}} style={{flex:1,background:mode===mv.id?G:N3,color:mode===mv.id?'#000':'#fff',border:'none',borderRadius:10,padding:'8px',cursor:'pointer',fontWeight:700,fontSize:11}}>{mv.l}</button>;
              })}
            </div>
            {mode==='photo'&&(
              <div>
                <input id="mc-file-input" type="file" accept="image/*" style={{display:'none'}} onChange={handleFileChange}/>
                <div style={{background:N,borderRadius:12,border:'2px dashed '+N3,padding:20,textAlign:'center',marginBottom:12}}>
                  <div style={{fontSize:40,marginBottom:8}}>📸</div>
                  <div style={{color:S2,fontSize:13,marginBottom:12}}>食事の写真をアップロードすると<br/>AIが食品とカロリーを自動判別します</div>
                  <button onClick={function(){document.getElementById('mc-file-input').click();}} style={{background:G,border:'none',borderRadius:10,color:'#000',padding:'10px 20px',cursor:'pointer',fontWeight:700,fontSize:13}}>📷 写真を選択 / 撮影</button>
                </div>
                {imgAnalyzing&&(
                  <div style={{textAlign:'center',padding:20}}>
                    <div style={{fontSize:32,marginBottom:8}}>🤖</div>
                    <div style={{color:G,fontWeight:700,fontSize:14}}>AIが食品を詳細分析中...</div>
                    <div style={{color:S,fontSize:12,marginTop:4}}>栄養素・カロリーを計算しています</div>
                  </div>
                )}
                {imgError&&<div style={{background:R+'22',border:'1px solid '+R+'44',borderRadius:10,padding:12,color:R,fontSize:13,textAlign:'center',marginBottom:10}}>{imgError}</div>}
                {imgResults.length>0&&imgConfirm==='pending'&&(
                  <div>
                    <div style={{background:B+'18',border:'1px solid '+B+'44',borderRadius:12,padding:14,marginBottom:12}}>
                      <div style={{color:B,fontWeight:800,fontSize:14,marginBottom:6}}>🤖 以下の食品を検出しました。合っていますか？</div>
                      {imgResults.map(function(f,i){
                        return (
                          <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:i<imgResults.length-1?'1px solid '+N3:'none'}}>
                            <div>
                              <div style={{color:'#fff',fontSize:13,fontWeight:700}}>{f.n}</div>
                              <div style={{color:S,fontSize:11}}>{f.s}　P:{f.p}g F:{f.f}g C:{f.c}g</div>
                            </div>
                            <div style={{color:G,fontWeight:800,fontSize:13}}>{f.cal} kcal</div>
                          </div>
                        );
                      })}
                      <div style={{marginTop:8}}>
                        <div style={{color:G,fontWeight:700,fontSize:13,marginBottom:4}}>
                          合計: {imgResults.reduce(function(s,f){return s+f.cal;},0)} kcal
                        </div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8,marginBottom:10}}>
                      <button onClick={function(){
                        imgResults.forEach(function(f){addFood(Object.assign({id:'ai'+mkId()},f));});
                        setImgConfirm('done');
                      }} style={{flex:2,background:G,border:'none',borderRadius:10,color:'#000',padding:'11px',cursor:'pointer',fontWeight:700,fontSize:13}}>✅ はい、全て追加する</button>
                      <button onClick={function(){setImgConfirm('select');}} style={{flex:1,background:N3,border:'none',borderRadius:10,color:'#fff',padding:'11px',cursor:'pointer',fontWeight:700,fontSize:12}}>選んで追加</button>
                    </div>
                    <button onClick={function(){setImgResults([]);setImgConfirm(null);}} style={{width:'100%',background:'none',border:'1px solid '+N3,borderRadius:10,color:S,padding:'8px',cursor:'pointer',fontSize:12}}>✕ キャンセル（撮り直す）</button>
                  </div>
                )}
                {imgResults.length>0&&imgConfirm==='select'&&(
                  <div>
                    <div style={{color:S2,fontWeight:700,fontSize:13,marginBottom:8}}>追加したい食品をタップしてください</div>
                    {imgResults.map(function(f,i){
                      return (
                        <div key={i} onClick={function(){addFood(Object.assign({id:'ai'+mkId()},f));}} style={{background:N,borderRadius:10,padding:'10px 12px',marginBottom:6,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',border:'1px solid '+G+'44'}}>
                          <div>
                            <div style={{color:'#fff',fontSize:13,fontWeight:700}}>{f.n}</div>
                            <div style={{color:S,fontSize:11}}>{f.s}　P:{f.p}g F:{f.f}g C:{f.c}g</div>
                          </div>
                          <div style={{color:G,fontWeight:800,fontSize:14}}>{f.cal} kcal</div>
                        </div>
                      );
                    })}
                    <button onClick={function(){setImgConfirm('pending');}} style={{width:'100%',background:'none',border:'1px solid '+N3,borderRadius:10,color:S,padding:'8px',cursor:'pointer',fontSize:12,marginTop:4}}>← 戻る</button>
                  </div>
                )}
              </div>
            )}
            {mode==='search'&&(
              <div>
                <input style={Object.assign({},inpS,{marginBottom:10})} placeholder="食品名・カテゴリで検索" value={search} onChange={function(e){setSearch(e.target.value);}}/>
                {results.map(function(f){
                  return (
                    <div key={f.id} onClick={function(){addFood(f);}} style={{background:N,borderRadius:10,padding:'10px 12px',marginBottom:6,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div><div style={{color:'#fff',fontSize:13,fontWeight:600}}>{f.n}</div><div style={{color:S,fontSize:11}}>{f.s}　P:{f.p}g F:{f.f}g C:{f.c}g</div></div>
                      <div style={{color:G,fontWeight:800,fontSize:13}}>{f.cal} kcal</div>
                    </div>
                  );
                })}
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
              <RecipeSuggestion addFood={addFood} onClose={function(){setShowAdd(false);}}/>
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
  var days=Object.keys(meals).sort().slice(-7);
  var calData=days.map(function(d){return {date:d,cal:getDayMacros(meals[d]).cal};});
  function avg(k){return days.reduce(function(s,d){return s+getDayMacros(meals[d])[k];},0)/Math.max(days.length,1);}
  var avgCal=avg('cal'),avgP=avg('p'),avgF=avg('f'),avgC=avg('c');
  var tip=avgF>goals.f*1.15?'今週は脂質が多めです。揚げ物を減らしてみましょう。':avgP<goals.p*0.8?'タンパク質が不足気味です。肉・魚・卵を意識しましょう。':'バランスよく食べられています！この調子を維持しましょう。';
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
        <div style={{color:'#fff',fontWeight:700,marginBottom:12}}>週間平均</div>
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

// ── CoachScreen ──
function CoachScreen(props){
  var meals=props.meals,weights=props.weights,profile=props.profile;
  var [sub,setSub]=useState('report');
  var initMsg1={id:1,from:'coach',text:'今週もお疲れ様です！タンパク質の摂取量が先週より改善されています。この調子で続けましょう！',date:'2026-03-19'};
  var initMsg2={id:2,from:'coach',text:'週2回の筋トレと合わせて、食後に軽いウォーキングを取り入れてみてください。脂質代謝が高まります。',date:'2026-03-20'};
  var [msgs,setMsgs]=useState([initMsg1,initMsg2]);
  var initMs1={id:1,text:'毎食タンパク質20g以上を意識する',done:false,auto:false,priority:'high'};
  var initMs2={id:2,text:'毎日記録をつける（7日連続）',done:false,auto:false,priority:'mid'};
  var initMs3={id:3,text:'夕食の炭水化物を100g以内に抑える',done:false,auto:false,priority:'mid'};
  var [missions,setMissions]=useState([initMs1,initMs2,initMs3]);
  var [missionMode,setMissionMode]=useState('user');
  var [coachPass,setCoachPass]=useState('');
  var [coachUnlocked,setCoachUnlocked]=useState(false);
  var [editingId,setEditingId]=useState(null);
  var [editText,setEditText]=useState('');
  var [newMissionText,setNewMissionText]=useState('');
  var [newPriority,setNewPriority]=useState('mid');
  var [autoMsg,setAutoMsg]=useState('');
  var [input,setInput]=useState('');
  var goals=calcGoals(profile);
  var days=Object.keys(meals).sort().slice(-7);
  var avgCal=days.reduce(function(s,d){return s+getDayMacros(meals[d]).cal;},0)/Math.max(days.length,1);
  var avgP=days.reduce(function(s,d){return s+getDayMacros(meals[d]).p;},0)/Math.max(days.length,1);
  var avgF=days.reduce(function(s,d){return s+getDayMacros(meals[d]).f;},0)/Math.max(days.length,1);
  var recorded=days.filter(function(d){return getDayMacros(meals[d]).cal>0;}).length;
  var lw=weights.length>0?weights[weights.length-1]:null;
  var fw=weights.length>0?weights[0]:null;
  var wChange=lw&&fw?Math.round((lw.weight-fw.weight)*10)/10:null;
  var avgScore=days.reduce(function(s,d){return s+calcScore(getDayMacros(meals[d]),goals);},0)/Math.max(days.length,1);
  var inpS={background:N,border:'1px solid '+N3,borderRadius:8,padding:'8px 12px',color:'#fff',fontSize:13,width:'100%',boxSizing:'border-box'};
  function pColor(p){return p==='high'?R:p==='mid'?Y:G;}
  function pLabel(p){return p==='high'?'高':p==='mid'?'中':'低';}
  function autoReply(text){
    var igNote='\n\n💪 食事・筋トレ情報はInstagramでも発信中！\n→ @sho.ishii_fit ( https://www.instagram.com/sho.ishii_fit/ )';
    var reply='';
    if(/体重|減.*(た|ない)|増.*(た|ない)|落ち/.test(text)) reply='体重の変化は日々の積み重ねです！週単位のトレンドで判断しましょう💪';
    else if(/タンパク質|プロテイン|筋肉|筋トレ|トレーニング/.test(text)) reply='タンパク質は筋肉の材料になる大切な栄養素です。体重×1.5〜2gを目安に毎食バランスよく摂れると理想的ですよ🍗';
    else if(/脂質|油|揚げ|カロリー高/.test(text)) reply='脂質は悪者ではありませんが摂りすぎには注意です。良質な脂質（アボカド・オリーブオイル・魚）を中心に選ぶと良いですよ🥑';
    else if(/眠れ|睡眠|疲れ|だるい|体調/.test(text)) reply='睡眠不足や疲れは食欲増加・代謝低下につながります。まずはしっかり休むことも立派なトレーニングです😌';
    else if(/食欲|食べ過ぎ|つい食べ|間食|やめられ/.test(text)) reply='食欲のコントロールは誰でも難しいです。ストレス・睡眠不足・水分不足が原因のことが多いですよ🧘';
    else if(/モチベ|やる気|続か|挫折|辛い|しんどい/.test(text)) reply='気持ちが落ちる時期は誰にでもあります！今日も記録してくれたこと、それだけで素晴らしい👏';
    else if(/水分|水|飲み物/.test(text)) reply='水分補給はダイエット・筋肉合成・代謝すべてに影響します。1日1.5〜2Lを目安にこまめに飲む習慣をつけましょう💧';
    else if(/炭水化物|糖質|ご飯|パン|ラーメン/.test(text)) reply='炭水化物はエネルギー源として重要です。夕食を少し減らして朝・昼にしっかり摂るサイクルがおすすめです🍚';
    else if(/おすすめ|何を食べ|メニュー|レシピ/.test(text)) reply='おすすめは「鶏むね肉＋ブロッコリー＋玄米」の組み合わせ！高タンパク・低脂質・栄養バランスが整った王道メニューです🥦🍗';
    else if(/ありがとう|感謝|嬉しい/.test(text)) reply='こちらこそ毎日頑張ってくれてありがとうございます！一緒に目標に向かっていきましょう😊';
    else if(/質問|聞きた|教えて/.test(text)) reply='もちろんです！気になることはどんどん聞いてください✍️';
    else reply='メッセージありがとうございます！目標に向けて一緒に取り組んでいきましょう💡';
    return reply+igNote;
  }
  function send(){
    if(!input.trim()) return;
    var t=input;
    var um={};um.id=Date.now();um.from='user';um.text=t;um.date=todayStr();
    setMsgs(function(m){return m.concat([um]);});
    setInput('');
    setTimeout(function(){
      var cm={};cm.id=Date.now()+1;cm.from='coach';cm.text=autoReply(t);cm.date=todayStr();
      setMsgs(function(m){return m.concat([cm]);});
    },800);
  }
  function autoGenerate(){
    var nm=[];
    var m1={};m1.id=Date.now()+1;m1.text='毎食タンパク質を意識して摂る（目標：'+goals.p+'g/日）';m1.done=false;m1.auto=true;m1.priority='high';
    var m2={};m2.id=Date.now()+2;m2.text='今週は揚げ物・脂っこい食事を2回以内に抑える';m2.done=false;m2.auto=true;m2.priority='high';
    var m3={};m3.id=Date.now()+3;m3.text='今週は毎日食事を記録する（7日連続を目指そう）';m3.done=false;m3.auto=true;m3.priority='mid';
    var m4={};m4.id=Date.now()+4;m4.text='1日の摂取カロリーを'+goals.cal+'kcal以内に抑える';m4.done=false;m4.auto=true;m4.priority='high';
    var m5={};m5.id=Date.now()+5;m5.text='今週の目標：毎日水を2L以上飲む';m5.done=false;m5.auto=true;m5.priority='low';
    if(avgP<goals.p*0.8) nm.push(m1);
    if(avgF>goals.f*1.15) nm.push(m2);
    if(recorded<5) nm.push(m3);
    if(avgCal>goals.cal*1.1) nm.push(m4);
    if(nm.length===0) nm.push(m5);
    setMissions(function(m){return m.filter(function(mi){return !mi.auto;}).concat(nm);});
    setAutoMsg(nm.length+'件のミッションを自動生成しました！');
    setTimeout(function(){setAutoMsg('');},3000);
  }
  return (
    <div style={{padding:'12px 16px 90px'}}>
      <div style={{color:'#fff',fontSize:18,fontWeight:800,marginBottom:12}}>👨‍💼 コーチ</div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {[{id:'report',l:'📋 レポート'},{id:'messages',l:'💬 メッセージ'},{id:'missions',l:'🎯 ミッション'}].map(function(sv){
          return <button key={sv.id} onClick={function(){setSub(sv.id);}} style={{flex:1,background:sub===sv.id?G:N2,color:sub===sv.id?'#000':'#fff',border:'none',borderRadius:10,padding:'8px 4px',cursor:'pointer',fontWeight:700,fontSize:11,whiteSpace:'nowrap'}}>{sv.l}</button>;
        })}
      </div>
      {sub==='report'&&(
        <div>
          <Cd style={{marginBottom:10}}>
            <div style={{color:'#fff',fontWeight:700,marginBottom:12}}>週次レポート</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[{l:'平均カロリー',v:Math.round(avgCal)+'kcal',c:G},{l:'記録日数',v:recorded+'/7日',c:B},{l:'体重変化',v:wChange!==null?(wChange>0?'+':'')+wChange+'kg':'--',c:wChange!==null&&wChange<=0?G:R},{l:'食事スコア',v:Math.round(avgScore)+'点',c:avgScore>=70?G:Y}].map(function(n){
                return <Cd key={n.l} bg={N} style={{padding:12,textAlign:'center'}}><div style={{color:n.c,fontSize:18,fontWeight:900}}>{n.v}</div><div style={{color:S,fontSize:11,marginTop:2}}>{n.l}</div></Cd>;
              })}
            </div>
          </Cd>
          <Cd style={{background:G+'18',border:'1px solid '+G+'44'}}>
            <div style={{color:G,fontWeight:700,marginBottom:6}}>AIサマリー</div>
            <div style={{color:S2,fontSize:13,lineHeight:1.7}}>
              {recorded>=5?'今週は'+recorded+'日記録できました。素晴らしい継続力です！':'今週は'+recorded+'日の記録です。毎日記録する習慣をつけましょう。'}
              {wChange!==null&&wChange<0?' 体重は'+Math.abs(wChange)+'kg減少しています。目標に向けて順調に進んでいます。':''}
              {avgScore>=70?' 食事スコアも高水準をキープできています。':' 食事スコアは'+Math.round(avgScore)+'点です。栄養バランスを意識してみましょう。'}
            </div>
          </Cd>
        </div>
      )}
      {sub==='messages'&&(
        <div>
          <div style={{marginBottom:10,maxHeight:340,overflowY:'auto',display:'flex',flexDirection:'column',gap:10}}>
            {msgs.map(function(msg){
              return (
                <div key={msg.id} style={{display:'flex',justifyContent:msg.from==='user'?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:'80%',background:msg.from==='user'?G:N2,borderRadius:msg.from==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px',padding:'10px 14px'}}>
                    <div style={{color:msg.from==='user'?'#000':'#fff',fontSize:13,lineHeight:1.6,whiteSpace:'pre-line'}}>{msg.text}</div>
                    <div style={{color:msg.from==='user'?'rgba(0,0,0,0.4)':'rgba(255,255,255,0.4)',fontSize:10,marginTop:4}}>{fmtDate(msg.date)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{display:'flex',gap:8}}>
            <input value={input} onChange={function(e){setInput(e.target.value);}} placeholder="コーチへのメッセージ..." onKeyDown={function(e){if(e.key==='Enter')send();}} style={{flex:1,background:N2,border:'1px solid '+N3,borderRadius:10,padding:'10px 14px',color:'#fff',fontSize:13}}/>
            <Btn onClick={send} sm>送信</Btn>
          </div>
        </div>
      )}
      {sub==='missions'&&(
        <div>
          <div style={{display:'flex',gap:6,marginBottom:12}}>
            <button onClick={function(){setMissionMode('user');}} style={{flex:1,background:missionMode==='user'?G:N2,color:missionMode==='user'?'#000':'#fff',border:'none',borderRadius:10,padding:'8px',cursor:'pointer',fontWeight:700,fontSize:12}}>👤 ユーザー</button>
            <button onClick={function(){setMissionMode('coach');}} style={{flex:1,background:missionMode==='coach'?PU:N2,color:'#fff',border:'1px solid '+(missionMode==='coach'?PU:N3),borderRadius:10,padding:'8px',cursor:'pointer',fontWeight:700,fontSize:12}}>🔑 コーチ管理</button>
          </div>
          {missionMode==='coach'&&!coachUnlocked&&(
            <Cd bg={N2} style={{marginBottom:12}}>
              <div style={{color:'#fff',fontWeight:700,marginBottom:8}}>コーチ用パスワード</div>
              <div style={{display:'flex',gap:8}}>
                <input style={Object.assign({},inpS,{flex:1})} type="password" placeholder="パスワードを入力" value={coachPass} onChange={function(e){setCoachPass(e.target.value);}} onKeyDown={function(e){if(e.key==='Enter'&&coachPass==='syou5858')setCoachUnlocked(true);}}/>
                <Btn onClick={function(){if(coachPass==='syou5858'){setCoachUnlocked(true);}else{alert('パスワードが違います');}}} sm color={PU} style={{color:'#fff'}}>解除</Btn>
              </div>
            </Cd>
          )}
          {missionMode==='coach'&&coachUnlocked&&(
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{color:PU,fontWeight:800,fontSize:14}}>🔑 コーチ管理パネル</div>
                <button onClick={function(){setCoachUnlocked(false);setMissionMode('user');}} style={{background:'none',border:'none',color:S,fontSize:12,cursor:'pointer'}}>ロック</button>
              </div>
              <Cd bg={N2} style={{marginBottom:12}}>
                <div style={{color:'#fff',fontWeight:700,fontSize:13,marginBottom:4}}>🤖 データ分析から自動生成</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
                  {[{l:'平均P',v:avgP.toFixed(0)+'g',ok:avgP>=goals.p*0.8},{l:'平均Cal',v:Math.round(avgCal)+'kcal',ok:Math.abs(avgCal-goals.cal)<goals.cal*0.1},{l:'記録日数',v:recorded+'/7',ok:recorded>=5}].map(function(it){
                    return <div key={it.l} style={{background:N,borderRadius:8,padding:'8px',textAlign:'center'}}><div style={{color:it.ok?G:R,fontWeight:800,fontSize:14}}>{it.v}</div><div style={{color:S,fontSize:10}}>{it.l}</div></div>;
                  })}
                </div>
                {autoMsg&&<div style={{color:G,fontSize:12,marginBottom:8,fontWeight:700}}>{autoMsg}</div>}
                <Btn onClick={autoGenerate} full color={PU} style={{color:'#fff'}}>⚡ AIミッションを自動生成</Btn>
              </Cd>
              <Cd bg={N2} style={{marginBottom:12}}>
                <div style={{color:'#fff',fontWeight:700,fontSize:13,marginBottom:10}}>＋ ミッションを手動追加</div>
                <input style={Object.assign({},inpS,{marginBottom:8})} placeholder="ミッション内容を入力..." value={newMissionText} onChange={function(e){setNewMissionText(e.target.value);}}/>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <div style={{color:S,fontSize:12,flexShrink:0}}>優先度：</div>
                  {[{v:'high',l:'高',c:R},{v:'mid',l:'中',c:Y},{v:'low',l:'低',c:G}].map(function(pv){
                    return <button key={pv.v} onClick={function(){setNewPriority(pv.v);}} style={{flex:1,background:newPriority===pv.v?pv.c:N3,color:'#fff',border:'none',borderRadius:8,padding:'6px',cursor:'pointer',fontWeight:700,fontSize:12}}>{pv.l}</button>;
                  })}
                  <Btn onClick={function(){
                    if(!newMissionText.trim()) return;
                    var nm={};nm.id=Date.now();nm.text=newMissionText;nm.done=false;nm.auto=false;nm.priority=newPriority;
                    setMissions(function(m){return m.concat([nm]);});
                    setNewMissionText('');
                  }} sm color={PU} style={{color:'#fff',flexShrink:0}}>追加</Btn>
                </div>
              </Cd>
              {missions.map(function(ms){
                return (
                  <Cd key={ms.id} style={{marginBottom:8,padding:12}}>
                    {editingId===ms.id?(
                      <div style={{display:'flex',gap:8}}>
                        <input style={Object.assign({},inpS,{flex:1})} value={editText} onChange={function(e){setEditText(e.target.value);}}/>
                        <Btn onClick={function(){
                          setMissions(function(m){return m.map(function(mi){
                            if(mi.id!==editingId) return mi;
                            var nm=Object.assign({},mi);nm.text=editText;return nm;
                          });});
                          setEditingId(null);
                        }} sm color={G}>保存</Btn>
                        <Btn onClick={function(){setEditingId(null);}} sm outline>✕</Btn>
                      </div>
                    ):(
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:6,height:6,borderRadius:'50%',background:pColor(ms.priority||'mid'),flexShrink:0}}/>
                        <div style={{flex:1,color:ms.done?S:S2,fontSize:12,textDecoration:ms.done?'line-through':'none'}}>{ms.text}</div>
                        {ms.auto&&<span style={{background:PU+'33',color:PU,fontSize:9,borderRadius:4,padding:'2px 5px'}}>AUTO</span>}
                        <button onClick={function(){setEditingId(ms.id);setEditText(ms.text);}} style={{background:'none',border:'none',color:B,cursor:'pointer',fontSize:14,padding:'0 2px'}}>✏️</button>
                        <button onClick={function(){setMissions(function(m){return m.filter(function(mi){return mi.id!==ms.id;});});}} style={{background:'none',border:'none',color:R,cursor:'pointer',fontSize:14,padding:'0 2px'}}>🗑</button>
                      </div>
                    )}
                  </Cd>
                );
              })}
            </div>
          )}
          {missionMode==='user'&&(
            <div>
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
                            <button onClick={function(){
                              setMissions(function(m){return m.map(function(mi){
                                if(mi.id!==ms.id) return mi;
                                var nm=Object.assign({},mi);nm.done=!mi.done;return nm;
                              });});
                            }} style={{width:24,height:24,borderRadius:'50%',border:'2px solid '+(ms.done?G:N3),background:ms.done?G:'transparent',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#000',fontSize:14,fontWeight:800}}>
                              {ms.done?'✓':''}
                            </button>
                            <div style={{flex:1}}>
                              <div style={{color:ms.done?S:S2,fontSize:13,textDecoration:ms.done?'line-through':'none'}}>{ms.text}</div>
                              {ms.auto&&<span style={{color:PU,fontSize:10}}>⚡ AI自動生成</span>}
                            </div>
                          </div>
                        </Cd>
                      );
                    })}
                  </div>
                );
              })}
              <div style={{textAlign:'center',marginTop:10}}>
                <div style={{color:S,fontSize:12,marginBottom:4}}>{missions.filter(function(m){return m.done;}).length}/{missions.length} 達成</div>
                <BarProg value={missions.filter(function(m){return m.done;}).length} max={Math.max(missions.length,1)} h={6}/>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ClientManagerScreen ──
function ClientManagerScreen(props){
  var onClose=props.onClose,meals=props.meals||{},weights=props.weights||[],profile=props.profile;
  var c1={};c1.id='c1';c1.name='田中 健太';c1.age=30;c1.height=175;c1.weight=73;c1.goal='diet';c1.targetWeight=68;c1.startDate='2026-02-01';c1.lastLogin='2026-03-21';c1.streak=14;c1.avgCal=1850;c1.avgP=98;c1.weightLog=[{d:'2/1',w:73.0},{d:'2/8',w:72.4},{d:'2/15',w:72.0},{d:'2/22',w:71.5},{d:'3/1',w:71.2},{d:'3/8',w:70.8},{d:'3/15',w:70.5},{d:'3/21',w:70.1}];c1.score=78;
  var c2={};c2.id='c2';c2.name='鈴木 美咲';c2.age=26;c2.height=162;c2.weight=58;c2.goal='diet';c2.targetWeight=54;c2.startDate='2026-02-15';c2.lastLogin='2026-03-20';c2.streak=5;c2.avgCal=1420;c2.avgP=72;c2.weightLog=[{d:'2/15',w:58.0},{d:'2/22',w:57.6},{d:'3/1',w:57.3},{d:'3/8',w:57.0},{d:'3/15',w:56.8},{d:'3/21',w:56.5}];c2.score=65;
  var c3={};c3.id='c3';c3.name='山本 大輔';c3.age=35;c3.height=178;c3.weight=82;c3.goal='muscle';c3.targetWeight=80;c3.startDate='2026-01-10';c3.lastLogin='2026-03-18';c3.streak=2;c3.avgCal=2480;c3.avgP=145;c3.weightLog=[{d:'1/10',w:82.0},{d:'1/24',w:82.5},{d:'2/7',w:82.8},{d:'2/21',w:83.0},{d:'3/7',w:82.5},{d:'3/18',w:82.2}];c3.score=52;
  var c4={};c4.id='c4';c4.name='佐藤 あかり';c4.age=22;c4.height=158;c4.weight=52;c4.goal='health';c4.targetWeight=50;c4.startDate='2026-03-01';c4.lastLogin='2026-03-15';c4.streak=0;c4.avgCal=980;c4.avgP=45;c4.weightLog=[{d:'3/1',w:52.0},{d:'3/8',w:51.8},{d:'3/15',w:51.5}];c4.score=38;
  var defaultClients=[c1,c2,c3,c4];
  function buildClients(base){
    return base.map(function(c){
      if(profile&&c.name===profile.name){
        var ds=Object.keys(meals).sort().slice(-7);
        var rCal=ds.length>0?Math.round(ds.reduce(function(s,d){return s+getDayMacros(meals[d]).cal;},0)/ds.length):c.avgCal;
        var rP=ds.length>0?Math.round(ds.reduce(function(s,d){return s+getDayMacros(meals[d]).p;},0)/ds.length*10)/10:c.avgP;
        var rStreak=Object.keys(meals).filter(function(d){return getDayMacros(meals[d]).cal>0;}).length;
        var rScore=calcScore(getDayMacros(meals[todayStr()]),calcGoals(profile))||c.score;
        var rWL=weights.slice(-8).map(function(w){return {d:fmtDate(w.date),w:w.weight};});
        var nc=Object.assign({},c);
        nc.avgCal=rCal;nc.avgP=rP;nc.streak=rStreak;nc.score=rScore;
        nc.weightLog=rWL.length>=2?rWL:c.weightLog;
        nc.lastLogin=todayStr();
        nc.weight=weights.length>0?weights[weights.length-1].weight:c.weight;
        nc.height=parseFloat(profile.height)||c.height;
        nc.goal=profile.goal||c.goal;
        nc.targetWeight=parseFloat(profile.targetWeight)||c.targetWeight;
        return nc;
      }
      return c;
    });
  }
  var [clients]=useState(function(){try{var s=JSON.parse(localStorage.getItem('mc_clients')||'[]');return buildClients(s.length>0?s:defaultClients);}catch(e){return buildClients(defaultClients);}});
  var [selected,setSelected]=useState(null);
  var [view,setView]=useState('list');
  var [sortKey,setSortKey]=useState('name');
  var [filterStatus,setFilterStatus]=useState('all');
  var [notes,setNotes]=useState({});
  function sColor(s){return s==='active'?G:s==='warning'?Y:R;}
  function sLabel(s){return s==='active'?'✅ 順調':s==='warning'?'⚠️ 注意':'🚨 要対応';}
  function goalLabel(g){return g==='diet'?'ダイエット':g==='muscle'?'筋肉増量':g==='health'?'健康維持':'体重維持';}
  function daysSince(d){return Math.floor((new Date()-new Date(d))/86400000);}
  function autoSt(c){var ds=daysSince(c.lastLogin);if(ds>=5||c.score<40)return 'danger';if(ds>=3||c.score<60)return 'warning';return 'active';}
  var sorted=clients.filter(function(c){return filterStatus==='all'||autoSt(c)===filterStatus;}).sort(function(a,b){return sortKey==='score'?b.score-a.score:sortKey==='streak'?b.streak-a.streak:a.name.localeCompare(b.name);});
  var summary={total:clients.length,active:clients.filter(function(c){return autoSt(c)==='active';}).length,warning:clients.filter(function(c){return autoSt(c)==='warning';}).length,danger:clients.filter(function(c){return autoSt(c)==='danger';}).length,avgScore:Math.round(clients.reduce(function(s,c){return s+c.score;},0)/Math.max(clients.length,1))};
  if(view==='detail'&&selected){
    var c=clients.find(function(cl){return cl.id===selected;});
    if(!c) return null;
    var st=autoSt(c);
    var bmi=Math.round(c.weight/Math.pow(c.height/100,2)*10)/10;
    var diff=c.weightLog.length>1?Math.round((c.weightLog[c.weightLog.length-1].w-c.weightLog[0].w)*10)/10:0;
    var alerts=[];
    if(daysSince(c.lastLogin)>=3) alerts.push('最終ログインから'+daysSince(c.lastLogin)+'日経過しています');
    if(c.avgCal<1200) alerts.push('1日の平均カロリーが低すぎます（1200kcal未満）');
    if(c.avgP<50) alerts.push('タンパク質摂取量が不足しています');
    if(c.streak===0) alerts.push('記録が途絶えています。声かけが必要です');
    var inpS2={background:N,border:'1px solid '+N3,borderRadius:8,padding:'8px 12px',color:'#fff',fontSize:13,width:'100%',boxSizing:'border-box'};
    return (
      <div style={{padding:'12px 16px 100px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <button onClick={function(){setView('list');}} style={{background:N3,border:'none',color:'#fff',borderRadius:8,padding:'6px 12px',cursor:'pointer'}}>← 一覧</button>
          <div style={{color:'#fff',fontWeight:800,fontSize:16}}>{c.name}</div>
          <span style={{marginLeft:'auto',background:sColor(st)+'22',color:sColor(st),borderRadius:8,padding:'4px 10px',fontSize:12,fontWeight:700}}>{sLabel(st)}</span>
        </div>
        {alerts.length>0&&<Cd bg={R+'18'} style={{marginBottom:12,border:'1px solid '+R+'44'}}><div style={{color:R,fontWeight:700,marginBottom:6}}>⚠️ 自動アラート</div>{alerts.map(function(a,i){return <div key={i} style={{color:S2,fontSize:12,lineHeight:1.8}}>・{a}</div>;})}</Cd>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
          {[{l:'食事スコア',v:c.score+'点',c:c.score>=70?G:c.score>=50?Y:R},{l:'連続記録',v:c.streak+'日',c:G},{l:'最終ログイン',v:daysSince(c.lastLogin)===0?'今日':daysSince(c.lastLogin)+'日前',c:daysSince(c.lastLogin)>=3?R:G}].map(function(n){
            return <Cd key={n.l} bg={N2} style={{padding:10,textAlign:'center'}}><div style={{color:n.c,fontWeight:800,fontSize:16}}>{n.v}</div><div style={{color:S,fontSize:10,marginTop:2}}>{n.l}</div></Cd>;
          })}
        </div>
        <Cd style={{marginBottom:12}}>
          <div style={{color:'#fff',fontWeight:700,marginBottom:10}}>体重推移</div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <DetailChart weightLog={c.weightLog}/>
            <div>
              <div style={{color:S,fontSize:11}}>開始時</div><div style={{color:'#fff',fontWeight:800}}>{c.weightLog[0].w} kg</div>
              <div style={{color:S,fontSize:11,marginTop:6}}>現在</div><div style={{color:'#fff',fontWeight:800}}>{c.weightLog[c.weightLog.length-1].w} kg</div>
              <div style={{color:diff<=0?G:R,fontWeight:700,fontSize:13,marginTop:4}}>{diff>0?'+':''}{diff} kg</div>
            </div>
          </div>
        </Cd>
        <Cd style={{marginBottom:12}}>
          <div style={{color:'#fff',fontWeight:700,marginBottom:10}}>基本情報</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[{l:'目標',v:goalLabel(c.goal)},{l:'目標体重',v:c.targetWeight+'kg'},{l:'BMI',v:String(bmi)},{l:'平均Cal',v:c.avgCal+'kcal'},{l:'平均P',v:c.avgP+'g'},{l:'開始日',v:c.startDate}].map(function(n){
              return <div key={n.l} style={{background:N,borderRadius:8,padding:'8px 10px',display:'flex',justifyContent:'space-between'}}><span style={{color:S,fontSize:12}}>{n.l}</span><span style={{color:'#fff',fontSize:12,fontWeight:700}}>{n.v}</span></div>;
            })}
          </div>
        </Cd>
        <Cd>
          <div style={{color:'#fff',fontWeight:700,marginBottom:8}}>📝 コーチメモ</div>
          <textarea value={notes[c.id]||''} onChange={function(e){var cid=c.id;var v=e.target.value;setNotes(function(n){var nn=Object.assign({},n);nn[cid]=v;return nn;});}} placeholder="このクライアントへのメモを入力..." style={Object.assign({},inpS2,{height:80,resize:'vertical'})}/>
        </Cd>
      </div>
    );
  }
  return (
    <div style={{padding:'12px 16px 100px'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
        <button onClick={onClose} style={{background:N3,border:'none',color:'#fff',borderRadius:8,padding:'6px 12px',cursor:'pointer'}}>← 戻る</button>
        <div style={{color:'#fff',fontWeight:800,fontSize:16}}>👥 クライアント管理</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
        {[{l:'合計',v:summary.total,c:'#fff'},{l:'順調',v:summary.active,c:G},{l:'注意',v:summary.warning,c:Y},{l:'要対応',v:summary.danger,c:R}].map(function(n){
          return <Cd key={n.l} bg={N2} style={{padding:10,textAlign:'center'}}><div style={{color:n.c,fontWeight:900,fontSize:20}}>{n.v}</div><div style={{color:S,fontSize:10}}>{n.l}</div></Cd>;
        })}
      </div>
      <Cd style={{marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'#fff',fontWeight:700,fontSize:13}}>平均スコア</span><span style={{color:summary.avgScore>=70?G:summary.avgScore>=50?Y:R,fontWeight:800}}>{summary.avgScore}点</span></div>
        <BarProg value={summary.avgScore} max={100} color={summary.avgScore>=70?G:summary.avgScore>=50?Y:R} h={10}/>
      </Cd>
      <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
        {[{v:'all',l:'全員'},{v:'active',l:'✅ 順調'},{v:'warning',l:'⚠️ 注意'},{v:'danger',l:'🚨 要対応'}].map(function(f){
          return <button key={f.v} onClick={function(){setFilterStatus(f.v);}} style={{background:filterStatus===f.v?PU:N2,color:'#fff',border:'none',borderRadius:8,padding:'5px 10px',cursor:'pointer',fontSize:11,fontWeight:700}}>{f.l}</button>;
        })}
        <select value={sortKey} onChange={function(e){setSortKey(e.target.value);}} style={{background:N2,color:S,border:'1px solid '+N3,borderRadius:8,padding:'5px 10px',fontSize:11,marginLeft:'auto'}}>
          <option value="name">名前順</option><option value="score">スコア順</option><option value="streak">継続日数順</option>
        </select>
      </div>
      <div style={{overflowX:'auto',borderRadius:12,border:'1px solid '+N3,marginBottom:14}}>
        <table style={{borderCollapse:'collapse',width:'100%',minWidth:480,fontSize:12}}>
          <thead><tr style={{background:N3}}>{['名前','状態','スコア','継続','推移','ログイン',''].map(function(h,i){return <th key={i} style={{color:S2,padding:'9px 8px',textAlign:'left',whiteSpace:'nowrap',fontWeight:700}}>{h}</th>;})}</tr></thead>
          <tbody>
            {sorted.map(function(cl,i){
              var st=autoSt(cl),ds=daysSince(cl.lastLogin);
              return (
                <tr key={cl.id} style={{background:i%2===0?N2:N,borderBottom:'1px solid '+N3}}>
                  <td style={{padding:'8px 8px',color:'#fff',fontWeight:700,whiteSpace:'nowrap'}}>{cl.name}</td>
                  <td style={{padding:'8px 8px',whiteSpace:'nowrap'}}><span style={{background:sColor(st)+'22',color:sColor(st),borderRadius:6,padding:'2px 6px',fontSize:10,fontWeight:700}}>{sLabel(st)}</span></td>
                  <td style={{padding:'8px 8px'}}><span style={{color:cl.score>=70?G:cl.score>=50?Y:R,fontWeight:800}}>{cl.score}</span></td>
                  <td style={{padding:'8px 8px',color:S2}}>{cl.streak}日</td>
                  <td style={{padding:'4px 8px'}}><MiniChart data={cl.weightLog}/></td>
                  <td style={{padding:'8px 8px',color:ds>=3?R:S2,whiteSpace:'nowrap'}}>{ds===0?'今日':ds+'日前'}</td>
                  <td style={{padding:'8px 8px'}}><button onClick={function(){setSelected(cl.id);setView('detail');}} style={{background:PU,border:'none',borderRadius:6,color:'#fff',padding:'4px 8px',cursor:'pointer',fontSize:11,fontWeight:700}}>詳細</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {clients.filter(function(c){return autoSt(c)==='danger';}).length>0&&(
        <Cd bg={R+'18'} style={{border:'1px solid '+R+'44'}}>
          <div style={{color:R,fontWeight:700,marginBottom:8}}>🚨 要フォロー</div>
          {clients.filter(function(c){return autoSt(c)==='danger';}).map(function(c){
            return (
              <div key={c.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6,padding:'8px 10px',background:N,borderRadius:8}}>
                <div><div style={{color:'#fff',fontWeight:700,fontSize:13}}>{c.name}</div><div style={{color:S,fontSize:11}}>{daysSince(c.lastLogin)>=5?daysSince(c.lastLogin)+'日間ログインなし':'スコア'+c.score+'点'}</div></div>
                <button onClick={function(){setSelected(c.id);setView('detail');}} style={{background:R,border:'none',borderRadius:8,color:'#fff',padding:'6px 12px',cursor:'pointer',fontSize:12,fontWeight:700}}>確認</button>
              </div>
            );
          })}
        </Cd>
      )}
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
  function copyTSV(){navigator.clipboard.writeText(toTSV(rows)).then(function(){setCopied(true);setTimeout(function(){setCopied(false);},2000);});}
  function download(){
    var blob=new Blob(['\uFEFF'+toCSV(rows)],{type:'text/csv;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='mealcare_'+type+'_'+todayStr()+'.csv';a.click();
    URL.revokeObjectURL(url);
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
        <Cd bg={N2} style={{marginTop:14}}>
          <div style={{color:'#fff',fontWeight:700,fontSize:13,marginBottom:6}}>🔗 対象スプレッドシート</div>
          <a href="https://docs.google.com/spreadsheets/d/1VNIHx9MuKUJ4EP5gcpqiznf-6wxQnpmZz9xCpVIIwuM/edit" target="_blank" rel="noreferrer" style={{color:B,fontSize:12,wordBreak:'break-all'}}>食事管理シート →</a>
        </Cd>
      </div>
    </div>
  );
}

// ── Main App ──
export default function App(){
  useEffect(function(){
    migrateLocalStorage();
  },[]);
  var [profile,setProfile]=useState(function(){try{return JSON.parse(localStorage.getItem('mc2_profile'))||null;}catch(e){return null;}});
  var [meals,setMeals]=useState(function(){try{var m=JSON.parse(localStorage.getItem('mc2_meals'));return m&&Object.keys(m).length>0?m:{};}catch(e){return {};}});
  var [weights,setWeights]=useState(function(){try{var w=JSON.parse(localStorage.getItem('mc2_weights'));return w&&w.length>0?w:[];}catch(e){return [];}});
  var [tab,setTab]=useState('home');
  var [mealTab,setMealTab]=useState('breakfast');
  var [showExport,setShowExport]=useState(false);
  var [showClients,setShowClients]=useState(false);
  var [clientPassInput,setClientPassInput]=useState('');
  var [showClientPassModal,setShowClientPassModal]=useState(false);
  useEffect(function(){try{if(profile)localStorage.setItem('mc2_profile',JSON.stringify(profile));}catch(e){};},[profile]);
  useEffect(function(){try{localStorage.setItem('mc2_meals',JSON.stringify(meals));}catch(e){};},[meals]);
  useEffect(function(){try{localStorage.setItem('mc2_weights',JSON.stringify(weights));}catch(e){};},[weights]);
  useEffect(function(){
    if(!profile) return;
    try{
      var saved=JSON.parse(localStorage.getItem('mc_clients')||'[]');
      if(saved.length===0) return;
      var updated=saved.map(function(c){
        if(c.name!==profile.name) return c;
        var nc=Object.assign({},c);nc.lastLogin=todayStr();return nc;
      });
      localStorage.setItem('mc_clients',JSON.stringify(updated));
    }catch(e){}
  },[profile]);
  function openClientManager(){setClientPassInput('');setShowClientPassModal(true);}
  function submitClientPass(){
    if(clientPassInput==='syou5858'){setShowClientPassModal(false);setShowClients(true);}
    else{alert('パスワードが違います');}
  }
  if(!profile) return <Onboarding onDone={function(pf){setProfile(pf);setTab('home');}}/>;
  return (
    <div style={{background:N,minHeight:'100vh',maxWidth:480,margin:'0 auto',fontFamily:'-apple-system,BlinkMacSystemFont,"Hiragino Sans","Noto Sans JP",sans-serif',color:'#fff',overflowX:'hidden',width:'100%',boxSizing:'border-box'}}>
      {showExport&&<ExportScreen meals={meals} weights={weights} profile={profile} onClose={function(){setShowExport(false);}}/>}
      {showClients&&<ClientManagerScreen meals={meals} weights={weights} profile={profile} onClose={function(){setShowClients(false);}}/>}
      {showClientPassModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:N2,borderRadius:20,padding:28,width:300}}>
            <div style={{textAlign:'center',fontSize:40,marginBottom:8}}>🔐</div>
            <div style={{color:'#fff',fontWeight:800,fontSize:16,textAlign:'center',marginBottom:4}}>コーチ専用エリア</div>
            <div style={{color:S,fontSize:12,textAlign:'center',marginBottom:18}}>パスワードを入力してください</div>
            <input type="password" placeholder="パスワード" value={clientPassInput} onChange={function(e){setClientPassInput(e.target.value);}} onKeyDown={function(e){if(e.key==='Enter')submitClientPass();}} style={{background:N,border:'1px solid '+N3,borderRadius:10,padding:'10px 14px',color:'#fff',fontSize:15,width:'100%',boxSizing:'border-box',marginBottom:12}} autoFocus/>
            <div style={{display:'flex',gap:8}}>
              <button onClick={function(){setShowClientPassModal(false);}} style={{flex:1,background:N3,border:'none',borderRadius:10,color:'#fff',padding:'10px',cursor:'pointer',fontWeight:700,fontSize:13}}>キャンセル</button>
              <button onClick={submitClientPass} style={{flex:2,background:PU,border:'none',borderRadius:10,color:'#fff',padding:'10px',cursor:'pointer',fontWeight:700,fontSize:13}}>解除</button>
            </div>
          </div>
        </div>
      )}
      <div style={{paddingTop:8}}>
        <div style={{display:'flex',justifyContent:'flex-end',gap:6,padding:'6px 16px 4px'}}>
          <button onClick={openClientManager} style={{background:PU+'22',border:'1px solid '+PU,borderRadius:8,color:PU,fontSize:11,fontWeight:700,padding:'6px 10px',cursor:'pointer'}}>🔐 コーチ管理</button>
          <button onClick={function(){setShowExport(true);}} style={{background:N2,border:'1px solid '+N3,borderRadius:8,color:S2,fontSize:11,fontWeight:700,padding:'6px 10px',cursor:'pointer'}}>📤 Sheets出力</button>
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