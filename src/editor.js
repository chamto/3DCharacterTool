// ═══ 모델 공방: 위 코드는 검술대전의 인물 그리기를 그대로 옮겨 온 것 ═══
const VIEW={sq:.72,uk:.93,yaw:.35};
const $=id=>document.getElementById(id);
const P0=p=>{const o={h:[...p.h],d:[...p.d],lean:p.lean};if(p.feet)o.feet=p.feet.map(f=>[...f]);if(p.off)o.off=[...p.off];for(const n of['crouch','elb','nod','hyaw','hroll'])if(p[n]!=null)o[n]=p[n];return o};
const kf=(p,n)=>p[n]??KDEF[n];
function mixK(a,b,k){const o=mix(a,b,k),fa=a.feet||KDEF.feet,fb=b.feet||KDEF.feet;o.feet=fa.map((f,i)=>[lerp(f[0],fb[i][0],k),lerp(f[1],fb[i][1],k)]);const oa=a.off||KDEF.off,ob=b.off||KDEF.off;o.off=oa.map((v,i)=>lerp(v,ob[i],k));for(const n of['crouch','elb','nod','hyaw','hroll'])o[n]=lerp(kf(a,n),kf(b,n),k);return o}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const SW=['#f3dcc0','#e8d2b4','#d6ac84','#a8754f','#6e4a32','#ffd23f','#4fe3d0','#9fe36a','#c4512b','#c9a35a','#e8e4da','#eef1f2','#d9dee0','#aab2b6','#7d878d','#4d565c','#2a3038','#3d4f9a','#8a1c1c','#c9a24a','#5a3e2a','#f2eee4','#e2dccd','#cfc9bb','#b9b2a3','#8d877c','#6d675e','#4a463f','#3b3732','#2b2824','#12100e','#b3261a','#7a2a20','#4a2a4f','#3b4a6b','#2a5d9c'];
function mkKey(name,pose,o={}){return{name,pose:P0(pose),down:o.down||0,hold:o.hold??700,rate:o.rate??9,lunge:o.lunge||0}}

// ─── 게임에서 가져올 인물 ───
const KPAL={blue:{steel:'#d9dee0',shade:'#8f989d',hi:'#f6f8f8',trim:'#7d878d',cloth:'#3d4f9a',flap:'#8a1c1c',leather:'#5a3e2a'},
 bright:{steel:'#e4e6e3',shade:'#9b9f9c',hi:'#ffffff',trim:'#8d877c',cloth:'#3d4f9a',flap:'#8a1c1c',leather:'#4a3a2c'},
 blued:{steel:'#3a4250',shade:'#1f242c',hi:'#8a96a3',trim:'#c9a24a',cloth:'#3d4f9a',flap:'#8a1c1c',leather:'#5a3e2a'}};
const MPAL={iron:{body:'#e8e4da',accent:'#c4512b',dark:'#3b3f46',joint:'#8d9196',glow:'#ffd23f',trim:'#2f5d8a',blade:'#dfe3e4'},
 black:{body:'#4a4f57',accent:'#2b2f35',dark:'#1d2026',joint:'#7d838a',glow:'#4fe3d0',trim:'#c9a24a',blade:'#cfd5d8'},
 brass:{body:'#c9a35a',accent:'#7a4a2a',dark:'#3a2e24',joint:'#8a8070',glow:'#9fe36a',trim:'#e8e0c8',blade:'#e2dccd'}};
const MPRESETS=[
 {label:'강철 거신',m:{style:'mech',name:'강철 거신',limbs:'round',eyes:'visor',crest:'fin',emblem:'core',weapon:'none',skirt:true,body:{torso:1.12,limb:1.08,leg:1.3,shoulder:1.2,head:.85,neck:.6},pal:MPAL.iron}},
 {label:'흑철 호위기',m:{style:'mech',name:'흑철 호위기',eyes:'mono',crest:'rods',emblem:'grill',weapon:'sword',skirt:true,body:{torso:1.2,limb:1.2,leg:1.05,shoulder:1.3,head:.8,neck:.5},pal:MPAL.black}},
 {label:'로봇 모델2 · 은빛 창기사',m:{style:'mech',name:'은빛 창기사',frame:'lance',capeOn:true,limbs:'box',chest:'box',belly:'box',pelvis:'box',eyes:'visor',crest:'fin',hMid:'horn',hLow:'jaw',hShape:'wedge',hFace:'full',hMouth:'none',emblem:'core',weapon:'sword',skirt:true,body:{torso:.95,limb:.92,leg:1.2,shoulder:1.12,pad:1,head:.72,neck:.8},pal:{body:'#e7e3d6',head:'#e7e3d6',accent:'#6c7486',dark:'#2f333c',joint:'#545a66',glow:'#62c4f0',trim:'#c9a24a',blade:'#dfe3e4',mcape:'#283a6b',mcapeIn:'#151c35'}}},
 {label:'황동 거인',m:{style:'mech',name:'황동 거인',eyes:'twin',crest:'none',emblem:'grill',weapon:'none',skirt:false,body:{torso:1.35,limb:1.35,leg:.9,shoulder:1.25,head:.75,neck:.4},pal:MPAL.brass}}];
const KPRESETS=[
 {label:'백기사1',m:{style:'knight',name:'백기사1',helm:'peak',paul:'round',psize:1.45,coat:true,flap:true,sheath:true,sheathDir:'front',
  body:{torso:1.3,limb:1.38,leg:.8,shoulder:1.22,head:.82,neck:.5},
  pal:{steel:'#e4e9e9',shade:'#8f9c9e',hi:'#ffffff',trim:'#6b7779',cloth:'#3f4f97',flap:'#8a1c1c',leather:'#b29868',belt:'#cfd5d6',sheath:'#4b5661',glove:'#2e3756'}}},
 {label:'백기사1 · 붓터치',m:null},
 {label:'파란 겉옷 기사',m:{style:'knight',name:'파란 겉옷 기사',helm:'closed',paul:'round',psize:1.25,coat:true,flap:true,sheath:true,pal:KPAL.blue}},
 {label:'16세기 르네상스 판금',m:{style:'knight',name:'르네상스 기사',helm:'closed',paul:'haute',psize:1.1,coat:false,flap:false,sheath:false,pal:KPAL.bright}},
 {label:'감색 바탕 · 금도금',m:{style:'knight',name:'감색 기사',helm:'open',paul:'haute',psize:1.15,coat:false,flap:false,sheath:true,pal:KPAL.blued}}];
const SOURCES=[
 ...ROSTER.map(c=>({grp:'1안 · 도포 무사',label:c.name,make:()=>({style:'fig',name:c.name,robe:c.robe,hat:c.hat,beard:c.beard,blade:92})})),
 ...ROSTER2.map(c=>({grp:'2안 · 임진 무사',label:`${c.name} · ${c.wname}`,make:()=>({style:'warrior',name:c.name,armor:c.armor,hat:c.hat,weapon:c.weapon,beard:c.beard,pal:{...ARM2[c.armor]}})})),
 ...KPRESETS.map(p=>({grp:'판금 기사 · 참고 그림',label:p.label,make:()=>JSON.parse(JSON.stringify(p.m))})),
 ...MPRESETS.map(p=>({grp:'로봇 모델',label:p.label,make:()=>JSON.parse(JSON.stringify(p.m))})),
 ...ROSTER.map(c=>({grp:'3안 · 거대 기사',label:c.name,make:()=>({style:'robot',name:c.name+' 기사',pal:{...ARM2['r_'+c.id]},cape:CAPES[c.id]})}))];
KPRESETS[1].m={...JSON.parse(JSON.stringify(KPRESETS[0].m)),paint:'brush',name:'백기사1'};
const GROUPS=[...new Set(SOURCES.map(s=>s.grp))];
function convert(m,style){if(style===m.style)return m;
 if(style==='fig')return{style,name:m.name,robe:'white',hat:'knot',beard:'full',blade:92};
 if(style==='mech')return{...JSON.parse(JSON.stringify(MPRESETS[0].m)),name:m.name};
 if(style==='knight')return{...JSON.parse(JSON.stringify(KPRESETS[2].m)),name:m.name};
 if(style==='warrior')return{style,name:m.name,armor:'joseon',hat:'jhelm',weapon:'katana',beard:'goatee',pal:m.pal?{...m.pal}:{...ARM2.joseon}};
 return{style,name:m.name,pal:m.pal?{...m.pal}:{...ARM2.r_cheol},cape:CAPES.cheol}}
let chKey='',chObj=null;
function buildCh(m){const k=JSON.stringify(m);if(k===chKey)return chObj;chKey=k;
 if(m.style==='knight'||m.style==='mech')chObj={id:'x',...m};
 else if(m.style==='fig')chObj={id:'x',name:m.name,robe:m.robe,hat:m.hat,beard:m.beard};
 else if(m.style==='warrior')chObj={id:'x',name:m.name,robe:'white',armor:m.armor,pal:m.pal,hat:m.hat,weapon:m.weapon,beard:m.beard,flail:m.weapon==='flail'};
 else chObj={id:'x',name:m.name,robot:true,armor:'r_x',pal:m.pal,cape:m.cape,hat:'rhelm',weapon:'katana',beard:'none',flail:false};
 return chObj}
const bladeLen=m=>m.style==='mech'?(m.weapon==='sword'?118:30):m.style==='knight'?108:m.style==='fig'?m.blade:m.style==='robot'?118:{katana:96,dual:80,flail:74}[m.weapon];
function drawModel(c,m,o){const ch=buildCh(m);if(m.style==='mech')return drawMech(c,ch,o);if(m.style==='knight')return drawKnight(c,ch,o);return m.style==='fig'?drawFig(c,ch,{...o,bladeLen:m.blade}):drawWarrior(c,ch,o)}

// ─── 게임 동작 ───
const RECOIL={h:[-6,7,108],d:[-.35,.25,.9],lean:-13};
const atk=(s,k=1,lun=1)=>[mkKey('자세',POSE[1],{hold:700,rate:9*k}),mkKey('준비',s.wind,{hold:Math.round(280/k),rate:16*k}),mkKey('타격',s.hit,{hold:650,rate:38*k,lunge:lun}),mkKey('자세',POSE[1],{hold:600,rate:9*k})];
const KP={wk1:{h:[10,-2,124],d:[.3,.15,.94],lean:0,feet:[[6,-21],[-8,21]],crouch:14,elb:.6,nod:.25},
 high:{h:[6,0,132],d:[-.15,0,.99],lean:-2,feet:[[12,-17],[-10,17]],crouch:10,elb:.35,nod:.1},
 wind:{h:[-4,3,136],d:[-.6,.05,.8],lean:-7,feet:[[12,-17],[-10,17]],crouch:8,elb:.55,nod:0},
 cut:{h:[40,0,62],d:[.9,0,-.42],lean:20,feet:[[24,-15],[-12,17]],crouch:16,elb:0,nod:.35},
 mid:{h:[22,2,74],d:[.85,0,.5],lean:3,feet:[[16,-10],[-14,11]],crouch:6,elb:.1,nod:0},
 pull:{h:[2,7,82],d:[.98,0,.12],lean:-5,feet:[[16,-10],[-14,11]],crouch:8,elb:.3,nod:0},
 thrust:{h:[52,0,80],d:[1,0,0],lean:18,feet:[[28,-11],[-16,13]],crouch:12,elb:0,nod:.15}};
const ANIM_PRESETS=[
 ['가위 공격',()=>atk(STRIKE[0])],['바위 공격',()=>atk(STRIKE[1])],['보 공격',()=>atk(STRIKE[2])],
 ['쳐내기',()=>[mkKey('자세',POSE[1]),mkKey('돌아서기',PARRY_POSE.wind,{hold:280,rate:20}),mkKey('막기',PARRY_POSE.hit,{hold:650,rate:40}),mkKey('자세',POSE[1],{hold:600})]],
 ['자세 바꾸기',()=>[0,1,2].map(i=>mkKey(STANCES[i],POSE[i],{hold:900}))],
 ['맞고 쓰러짐',()=>[mkKey('자세',POSE[1],{hold:600}),mkKey('맞음',RECOIL,{hold:300,rate:32}),mkKey('쓰러짐',POSE[1],{down:1,hold:1400,rate:6})]],
 ['판금 내려베기',()=>[mkKey('넓은 상단',KP.high,{hold:700}),mkKey('준비',KP.wind,{hold:320,rate:14}),mkKey('타격',KP.cut,{hold:650,rate:34,lunge:1.2}),mkKey('넓은 상단',KP.high,{hold:700,rate:8})]],
 ['판금 찌르기',()=>[mkKey('중단',KP.mid,{hold:600}),mkKey('당김',KP.pull,{hold:300,rate:14}),mkKey('찌름',KP.thrust,{hold:600,rate:36,lunge:1.4}),mkKey('중단',KP.mid,{hold:600,rate:8})]],
 ['기사 가위 공격',()=>atk(RSTRIKE[0],.55,1.7)],['기사 바위 공격',()=>atk(RSTRIKE[1],.55,1.7)],['기사 보 공격',()=>atk(RSTRIKE[2],.55,1.7)]];
const POSE_PRESETS=[
 ['곧게 선 자세',{h:[1,27,42],d:[0,.25,-1],lean:0,feet:[[1,-15],[1,15]],crouch:0,elb:0,nod:0,hyaw:0,hroll:0,off:[1,-27,42]}],
 ['백기사1 상단 자세',KP.wk1],['판금 넓은 상단',KP.high],['판금 내려베기 타격',KP.cut],['판금 찌름',KP.thrust],
 ['상단 자세',POSE[0]],['중단 자세',POSE[1]],['하단 자세',POSE[2]],['칼 얽힘',BIND_POSE],
 ['가위 준비',STRIKE[0].wind],['가위 타격',STRIKE[0].hit],['바위 준비',STRIKE[1].wind],['바위 타격',STRIKE[1].hit],['보 준비',STRIKE[2].wind],['보 타격',STRIKE[2].hit],
 ['쳐내기 돌아서기',PARRY_POSE.wind],['쳐내기 막기',PARRY_POSE.hit],['맞고 젖힘',RECOIL],
 ['기사 가위 준비',RSTRIKE[0].wind],['기사 가위 타격',RSTRIKE[0].hit],['기사 바위 준비',RSTRIKE[1].wind],['기사 바위 타격',RSTRIKE[1].hit],['기사 보 준비',RSTRIKE[2].wind],['기사 보 타격',RSTRIKE[2].hit]];

// ─── 상태 · 저장 · 되돌리기 ───
const LS={get(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}}};
const okPose=p=>p&&Array.isArray(p.h)&&p.h.length===3&&Array.isArray(p.d)&&p.d.length===3&&isFinite(p.lean)&&[...p.h,...p.d].every(isFinite);
function cleanProj(o){if(!o||!o.model||!['fig','warrior','robot','knight','mech'].includes(o.model.style)||!Array.isArray(o.keys)||!o.keys.length)return null;
 const keys=o.keys.filter(k=>k&&okPose(k.pose)).map(k=>({name:String(k.name||'키').slice(0,16),pose:P0(k.pose),down:clamp(+k.down||0,0,1),hold:clamp(+k.hold||700,60,3000),rate:clamp(+k.rate||9,1,100),lunge:clamp(+k.lunge||0,0,3)}));
 if(!keys.length)return null;const base=convert({style:'x',name:''},o.model.style);return{model:{...base,...o.model,pal:{...(base.pal||{}),...(o.model.pal||{})},name:String(o.model.name||'무명').slice(0,16)},keys,sel:clamp(o.sel|0,0,keys.length-1)}}
let proj=cleanProj(LS.get('model-ed-proj'))||{model:SOURCES[7].make(),keys:ANIM_PRESETS[6][1](),sel:0};
const opt=Object.assign({loop:true,speed:1,onion:true,trailFx:'ink',fxDen:1,fxPer:60,fxTailN:5,fxTailPos:0,fxTailArc:.5,fxGlow:1.2},LS.get('model-ed-opt')||{});
// 내보낼 항목 고르기
const EXG=['가위 공격','바위 공격','보 공격','쳐내기','상단 자세','중단 자세','하단 자세','칼 얽힘'];
opt.ex=Object.assign({slots:Object.fromEntries(EXG.map(n=>[n,true])),T:true,body:false,model:false},opt.ex||{});opt.ex.slots=Object.assign(Object.fromEntries(EXG.map(n=>[n,true])),opt.ex.slots||{});
opt.px=Object.assign({model:true,keys:true,time:true,body:true},opt.px||{});
const BODY=['off','feet','crouch','elb','nod','hyaw','hroll'],stripBody=p=>{const q={...p};for(const n of BODY)delete q[n];return q};
Object.assign(VIEW,LS.get('model-ed-view')||{});
const DEF_GAME=()=>({POSE:POSE.map(P0),STRIKE:STRIKE.map(s=>({wind:P0(s.wind),hit:P0(s.hit)})),PARRY:{wind:P0(PARRY_POSE.wind),hit:P0(PARRY_POSE.hit)},BIND:P0(BIND_POSE),T:{...ANIM_T}});
let game=LS.get('model-ed-game');if(!game||!game.data)game={data:DEF_GAME(),set:[]};
let lib=LS.get('model-ed-lib');if(!Array.isArray(lib))lib=[];
const stateStr=()=>JSON.stringify({model:proj.model,keys:proj.keys,sel:proj.sel});
let hist=[],fut=[],last=stateStr();
function commit(){const cur=stateStr();if(cur===last)return;hist.push(last);if(hist.length>80)hist.shift();fut=[];last=cur;LS.set('model-ed-proj',proj);updTop()}
function restore(str){proj=cleanProj(JSON.parse(str));last=str;LS.set('model-ed-proj',proj);stop();renderAll()}
$('undo').onclick=()=>{commit();if(!hist.length)return;fut.push(last);restore(hist.pop());toast('되돌렸습니다.')};
$('redo').onclick=()=>{if(!fut.length)return;hist.push(last);restore(fut.pop());toast('다시 했습니다.')};
const curKey=()=>proj.keys[proj.sel];
let tt=0;function toast(s){const t=$('toast');t.textContent=s;t.style.opacity=1;clearTimeout(tt);tt=setTimeout(()=>t.style.opacity=0,2400)}

// ─── 재생 ───
const PB={on:false,idx:0,t:0,disp:P0(curKey().pose),down:curKey().down,lx:0,clock:0,trail:null};
function enterKey(){const k=proj.keys[PB.idx];if(k.lunge)PB.lx=k.lunge*27}
function play(from){PB.on=true;PB.idx=from;PB.t=0;PB.trail=null;enterKey();syncPlay()}
function stop(){if(!PB.on)return;PB.on=false;wake(900);syncPlay()}
function tick(dt){const ks=proj.keys;
 if(PB.on){PB.t+=dt*1000*opt.speed;if(PB.t>=ks[PB.idx].hold){PB.t=0;PB.idx++;if(PB.idx>=ks.length){if(opt.loop)PB.idx=0;else{PB.idx=ks.length-1;PB.on=false;wake(900);proj.sel=PB.idx;renderTL();syncPlay();return}}enterKey();markNow()}
  const k=ks[PB.idx],a=1-Math.exp(-dt*opt.speed*k.rate);PB.disp=mixK(PB.disp,k.pose,a);PB.down=lerp(PB.down,k.down,a)}
 else{const k=curKey();if(drag&&drag.mode!=='orbit'){PB.disp=P0(k.pose);PB.down=k.down}else{const a=1-Math.exp(-dt*18);PB.disp=mixK(PB.disp,k.pose,a);PB.down=lerp(PB.down,k.down,a)}}
 PB.lx*=Math.exp(-dt*5*opt.speed)}

// ─── 무대 그리기 ───
const cv=$('cv'),ctx=cv.getContext('2d');let VW=1,VH=1,DPR=1,HANDLES=null,curS=1;
function fit(){const r=cv.getBoundingClientRect();DPR=Math.min(2,window.devicePixelRatio||1);VW=Math.max(1,r.width);VH=Math.max(1,r.height);cv.width=Math.round(VW*DPR);cv.height=Math.round(VH*DPR)}
new ResizeObserver(()=>{fit();wake()}).observe(cv);fit();
function floor(c,X,Y,s){const cs=Math.cos(VIEW.yaw),sn=Math.sin(VIEW.yaw),pt=(f,r)=>[X+(f*cs-r*sn)*s,Y+(f*sn+r*cs)*VIEW.sq*s];
 c.save();c.lineWidth=1;c.strokeStyle='rgba(18,16,14,.16)';
 for(let k=-90;k<=90;k+=30){c.beginPath();c.moveTo(...pt(k,-90));c.lineTo(...pt(k,90));c.moveTo(...pt(-90,k));c.lineTo(...pt(90,k));c.stroke()}
 c.strokeStyle='rgba(18,16,14,.32)';c.beginPath();for(let i=0;i<=48;i++){const a=i/48*6.2832,p=pt(Math.cos(a)*90,Math.sin(a)*90);i?c.lineTo(...p):c.moveTo(...p)}c.stroke();
 c.strokeStyle=SEAL;c.lineWidth=2.5;c.lineCap='round';const a=pt(92,0),b=pt(112,0),l=pt(104,6),r=pt(104,-6);c.beginPath();c.moveTo(...a);c.lineTo(...b);c.moveTo(...l);c.lineTo(...b);c.lineTo(...r);c.stroke();
 c.font='700 12px "Gowun Batang",serif';c.fillStyle=SEAL;c.textAlign='center';const q=pt(124,0);c.fillText('앞',q[0],q[1]+4);c.restore()}
function ring(c,p,lab,col){c.save();c.lineWidth=2.5;c.strokeStyle=col;c.fillStyle='rgba(242,238,228,.55)';c.beginPath();c.arc(p[0],p[1],12,0,7);c.fill();c.stroke();c.beginPath();c.arc(p[0],p[1],3,0,7);c.fillStyle=col;c.fill();
 c.font='700 12px "Gowun Batang",serif';c.textAlign='left';c.lineWidth=4;c.lineJoin='round';c.strokeStyle=PAPER;c.strokeText(lab,p[0]+15,p[1]-10);c.fillStyle=col;c.fillText(lab,p[0]+15,p[1]-10);c.restore()}
// 멈춰 있으면 다시 그리지 않는다: 재생·끌기·조작 직후에만 그린다
const isStrikeKey=k=>!!k&&(k.lunge>0||/타격|찌름|찌르기|베기|막기/.test(k.name)),FXDUMMY=document.createElement('canvas').getContext('2d');
let wakeUntil=0;const wake=(ms=700)=>{wakeUntil=Math.max(wakeUntil,performance.now()+ms)};
for(const ev of['pointerdown','pointerup','input','change','click','keydown'])document.addEventListener(ev,()=>wake(),{capture:true,passive:true});
function frame(now){const dt=Math.min(.05,(now-(frame.last||now))/1000);frame.last=now;
 if(document.visibilityState!=='hidden'&&(PB.on||drag||now<wakeUntil)){RENDER_LQ=PB.on||!!drag;tick(dt);const c=ctx,m=proj.model;c.setTransform(DPR,0,0,DPR,0,0);c.fillStyle=PAPER;c.fillRect(0,0,VW,VH);
  const s=curS=Math.min(VW/1.25,VH)/(m.style==='robot'?262:224),X=VW/2,Y=VH*.8;
  if(WORLD==='3d2'){HANDLES=null;// 3D 월드2: 2D 모양 정의로 만든 3D 겉면. 바닥만 2D
   if(!R3D2.ok(m)){c.fillStyle='#6d675e';c.font='600 15px system-ui,sans-serif';c.textAlign='center';c.fillText('3D 월드2는 판금 기사와 로봇 모델만 보여 줍니다',VW/2,VH/2);c.textAlign='left';R3D2.show(false);{const hc=$('hud3');hc.getContext('2d').clearRect(0,0,hc.width,hc.height)}requestAnimationFrame(frame);return}
   R3D2.show(true);const NC=opt.crowd3||1,cz=Math.min(1,3.5/Math.sqrt(NC)),s3=s*cz,Y3=NC>1?VH*.55:Y;/* 인원 시험: 인원이 많으면 모두 보이게 축소 */if(NC<=1)floor(c,X,Y,s);const ox=Math.cos(VIEW.yaw)*PB.lx*s3,oy=Math.sin(VIEW.yaw)*VIEW.sq*PB.lx*s3;PB.clock+=dt*1000;const k_=proj.keys[PB.idx],pk_=proj.keys[(PB.idx-1+proj.keys.length)%proj.keys.length];R3D2.render(m,PB.disp,PB.down,X+ox,Y3+oy,s3,VW,VH,DPR,{strike:PB.on&&isStrikeKey(k_),idx:PB.idx,k:k_,pk:pk_,clock:PB.clock,mode:{ink:'ink',flash:'flash',both:'flash',none:'none'}[opt.trailFx||'ink'],per:opt.fxPer||60,tailN:opt.fxTailN??5,glow:opt.fxGlow??1.2,den:opt.fxDen??1,tailPos:opt.fxTailPos??0,tailArc:opt.fxTailArc??.5,ghost:(!PB.on&&opt.onion&&proj.sel>0)?{pose:proj.keys[proj.sel-1].pose,down:proj.keys[proj.sel-1].down}:null,shade:opt.shade3||'screen',wOut:opt.w3o??.8,wBnd:opt.w3b??.8,wArm:opt.w3a??1,crowd:opt.crowd3||1,crowdPose:i=>{const ks=proj.keys,k=ks[(PB.idx+i)%ks.length];return{pose:mixK(PB.disp,k.pose,.3+(i*37%10)/25),down:PB.down}}});crowdStat(dt);if((opt.crowd3||1)>1)wake(400);
   {const hc=$('hud3'),hx=hc.getContext('2d');if(hc.width!==Math.round(VW*DPR)||hc.height!==Math.round(VH*DPR)){hc.width=Math.round(VW*DPR);hc.height=Math.round(VH*DPR)}hx.setTransform(DPR,0,0,DPR,0,0);hx.clearRect(0,0,VW,VH);
    if(NC<=1&&!PB.on){const hs0=HINTS,sv=seed;HINTS={};const r=drawModel(FXDUMMY,m,{X:X+ox,Y:Y3+oy,s:s3,ang:VIEW.yaw,pose:PB.disp,down:PB.down,noShadow:true,t:now});HINTS=hs0;seed=sv;HANDLES=r;/* 3D 월드2에서도 손·칼끝·발 고리를 끌어 자세를 고친다 */if(r.feet){ring(hx,r.feet[0],'앞발','#2f6b45');ring(hx,r.feet[1],'뒷발','#2f6b45')}if(r.off)ring(hx,r.off,'왼손',SEAL);ring(hx,r.a,'칼끝',BLUE);ring(hx,r.h,'손',SEAL)}}
   requestAnimationFrame(frame);return}
  floor(c,X,Y,s);const boil=now/170|0;
  const W3=WORLD==='3d'&&R3D.ok(m);if(W3){// 3D 월드: 바닥은 2D로 두고, 인물·칼·섬광 띠는 WebGL 3D로
   const ox=Math.cos(VIEW.yaw)*PB.lx*s,oy=Math.sin(VIEW.yaw)*VIEW.sq*PB.lx*s;PB.clock+=dt*1000;const TFX=opt.trailFx||'ink';
   R3D.render(m,PB.disp,PB.down,X+ox,Y+oy,s,VW,VH,DPR,{strike:PB.on&&isStrikeKey(proj.keys[PB.idx]),clock:PB.clock,fx:TFX!=='none',life:220,per:opt.fxPer||60,outline:opt.out3d!==false});HANDLES=null}
  else{
  if(!PB.on&&opt.onion&&proj.sel>0){const pk=proj.keys[proj.sel-1];seed=boil*7+3;drawModel(c,m,{X,Y,s,ang:VIEW.yaw,pose:pk.pose,down:pk.down,ghost:true,noShadow:true,t:now})}
  const ox=Math.cos(VIEW.yaw)*PB.lx*s,oy=Math.sin(VIEW.yaw)*VIEW.sq*PB.lx*s;PB.clock+=dt*1000;
  const TFX=opt.trailFx||'ink';if(PB.on&&(TFX==='ink'||TFX==='both'))drawTrail(c,PB,PB.clock);const FXON=PB.on&&(TFX==='flash'||TFX==='both');if(FXON&&PB.sw&&!drawSweep(c,PB.sw,X+ox,Y+oy,PB.clock))PB.sw=null;
  seed=boil*7+100;const r=drawModel(c,m,{X:X+ox,Y:Y+oy,s,ang:VIEW.yaw,pose:PB.disp,down:PB.down,spin:m.style==='warrior'&&m.weapon==='flail'&&PB.on,t:now});
  if(FXON){const k_=proj.keys[PB.idx],st=isStrikeKey(k_),O=[X+ox,Y+oy],rel=p=>[p[0]-O[0],p[1]-O[1]];
   if(st&&PB.swIdx!==PB.idx){PB.swIdx=PB.idx;// 시작 자세(앞 키)→타격 자세를 미리 따라가며 칼 위치를 구해, 배속과 상관없이 같은 빌보드를 만든다
    const pk=proj.keys[(PB.idx-1+proj.keys.length)%proj.keys.length],hs0=HINTS,sv=seed,lq=RENDER_LQ,SM=[];RENDER_LQ=true;for(let q=0;q<=14;q++){const t=q/14;HINTS={};const rb=drawModel(FXDUMMY,m,{X:0,Y:0,s,ang:VIEW.yaw,pose:mixK(P0(pk.pose),k_.pose,t),down:lerp(pk.down,k_.down,t),noShadow:true,t:now});SM.push({h:rb.h,a:rb.a})}HINTS=hs0;seed=sv;RENDER_LQ=lq;PB.sw=buildSweep(SM)}
   if(!st){PB.swIdx=null;PB.sw=null}else if(PB.sw)PB.sw.cur={h:rel(r.h),a:rel(r.a)};drawBladeGlow(c,PB,r,PB.clock);if(PB.sw)drawSweep(c,PB.sw,X+ox,Y+oy,PB.clock,[r.b,r.a])}// 빌보드를 칼 위에 한 번 더(칼날 둘레만): 빛이 칼을 감싼다, 몸은 덮지 않음
  if(PB.on){const k_=proj.keys[PB.idx];if(isStrikeKey(k_))pushTrail(PB,r,PB.clock)}else{PB.trail=null;PB.sw=null;PB.swIdx=null;PB.glowT=null}
  HANDLES=r;if(!PB.on){if(r.feet){ring(c,r.feet[0],'앞발','#2f6b45');ring(c,r.feet[1],'뒷발','#2f6b45')}if(r.off)ring(c,r.off,'왼손',SEAL);ring(c,r.a,'칼끝',BLUE);ring(c,r.h,'손',SEAL)}}}
 requestAnimationFrame(frame)}
// 월드 바꾸기: 2D 월드(지금까지의 그림) / 3D 월드(WebGL)
function setWorld(w){if(w==='3d'&&!R3D.init()){toast('이 브라우저에서는 3D(WebGL)를 쓸 수 없습니다');w='2d'}if(w==='3d2'&&!R3D2.init()){toast('이 브라우저에서는 3D(WebGL)를 쓸 수 없습니다');w='2d'}WORLD=w;$('shadesw').hidden=w!=='3d2';$('hud3').hidden=w!=='3d2';R3D.show(w==='3d');R3D2.show(w==='3d2');document.querySelectorAll('#worldsw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.world===w)));if(w==='3d'&&!R3D.ok(proj.model))toast('3D 월드는 판금 기사와 로봇 모델만 보여 줍니다');wake(900)}
document.querySelectorAll('#worldsw button').forEach(b=>b.onclick=()=>setWorld(b.dataset.world));

// ─── 무대 조작: 손·칼끝 끌기, 빈 곳 끌어 시점 돌리기 ───
let drag=null;
const ptr=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
const dd=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
cv.addEventListener('pointerdown',e=>{const p=ptr(e);let mode='orbit';
 if(!PB.on&&HANDLES){const cand=[['hand',HANDLES.h],['tip',HANDLES.a],...(HANDLES.feet||[]).map((f,i)=>['foot'+i,f]),...(HANDLES.off?[['off',HANDLES.off]]:[])].map(([m_,q])=>[m_,dd(p,q)]).sort((a,b)=>a[1]-b[1]);if(cand[0][1]<26)mode=cand[0][0]}
 drag={mode,x:p[0],y:p[1],moved:0};try{cv.setPointerCapture(e.pointerId)}catch(_){}});
cv.addEventListener('pointermove',e=>{if(!drag)return;wake();const p=ptr(e),dx=p[0]-drag.x,dy=p[1]-drag.y;drag.x=p[0];drag.y=p[1];drag.moved+=Math.abs(dx)+Math.abs(dy);
 if(drag.mode==='orbit'){VIEW.yaw=wrap(VIEW.yaw+dx*.012);VIEW.sq=clamp(VIEW.sq+dy*.004,.2,1);return}
 const k=curKey(),s=curS,cs=Math.cos(VIEW.yaw),sn=Math.sin(VIEW.yaw),df=cs*dx/s,dr=-sn*dx/s,du=-dy/(s*VIEW.uk);
 if(drag.mode.startsWith('foot')){const i=+drag.mode[4],a_=dx/s,b_=dy/(VIEW.sq*s);k.pose.feet=(k.pose.feet||KDEF.feet).map(f=>[...f]);const f=k.pose.feet[i];f[0]=clamp(f[0]+a_*cs+b_*sn,-45,50);f[1]=clamp(f[1]-a_*sn+b_*cs,-40,40)}
 else if(drag.mode==='off'){const o_=k.pose.off=[...(k.pose.off||KDEF.off)];o_[0]=clamp(o_[0]+df,-60,90);o_[1]=clamp(o_[1]+dr,-60,60);o_[2]=clamp(o_[2]+du,0,170)}
 else if(drag.mode==='hand'){k.pose.h[0]=clamp(k.pose.h[0]+df,-60,90);k.pose.h[1]=clamp(k.pose.h[1]+dr,-60,60);k.pose.h[2]=clamp(k.pose.h[2]+du,0,170)}
 else{const L=bladeLen(proj.model),d=norm(k.pose.d);k.pose.d=norm([d[0]*L+df,d[1]*L+dr,d[2]*L+du])}
 if(tab==='pose')syncSliders()});
const endDrag=()=>{if(!drag)return;const d=drag;drag=null;wake(900);
 if(d.mode==='orbit'){LS.set('model-ed-view',VIEW);if(d.moved<4&&PB.on){stop();proj.sel=PB.idx;renderTL();renderPanel();toast('멈췄습니다.')}return}
 const k=curKey();if(k.pose.off)k.pose.off=k.pose.off.map(v=>Math.round(v));if(k.pose.feet)k.pose.feet=k.pose.feet.map(f=>f.map(v=>Math.round(v)));k.pose.h=k.pose.h.map(v=>Math.round(v));k.pose.d=k.pose.d.map(v=>Math.round(v*1000)/1000);commit();if(tab==='pose')syncSliders()};
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);
/* 3D 월드2 인원 시험: 여러 명을 띄워 프레임 시간을 본다 */let CST={t:0,f:0,dt:0};const crowdStat=dt=>{CST.f++;CST.dt+=dt;const now=performance.now();if(now-CST.t<500)return;const st=R3D2.stat(),el=$('crowdst');if(el)el.textContent=st.old?'예전 방식(스키닝 미지원)':`CPU ${st.cpu.toFixed(1)}ms(뼈 ${st.bone.toFixed(1)}) · ${(CST.f*1000/(now-CST.t)).toFixed(0)}fps`;CST={t:now,f:0,dt:0}};
opt.crowd3=1;/* 인원 시험은 열 때마다 1명으로 */document.querySelectorAll('#crowdsel').forEach(sel=>{sel.value='1';sel.onchange=()=>{opt.crowd3=+sel.value;LS.set('model-ed-opt',opt);wake(800)}});
/* 3D 월드2 외곽선·경계선 굵기(px) */for(const[id,k,dv,un] of[['w3o','w3o',.8,'px'],['w3b','w3b',.8,'px'],['w3a','w3a',1,'배']]){const el=$(id),vb=$(id+'v');if(!el)continue;const sh=()=>{vb.textContent=(+el.value).toFixed(1)+un};el.value=String(opt[k]??dv);sh();el.oninput=()=>{opt[k]=+el.value;sh();LS.set('model-ed-opt',opt);wake(500)}}
/* 3D 월드2 명암 방식(무대 좌상단) */const syncShade=()=>document.querySelectorAll('#shadesw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shade===(opt.shade3||'screen'))));document.querySelectorAll('#shadesw button').forEach(b=>b.onclick=()=>{opt.shade3=b.dataset.shade;LS.set('model-ed-opt',opt);syncShade();wake(600)});syncShade();
document.querySelectorAll('.views button').forEach(b=>b.onclick=()=>{const to=+b.dataset.yaw,from=VIEW.yaw,dl=wrap(to-from),t0=performance.now();const st=()=>{const k=Math.min(1,(performance.now()-t0)/350);VIEW.yaw=from+dl*k*k*(3-2*k);if(k<1)requestAnimationFrame(st);else LS.set('model-ed-view',VIEW)};st()});

// ─── 시간줄 ───
function renderTL(){$('keys').innerHTML=proj.keys.map((k,i)=>`<button class="kc" data-i="${i}" aria-pressed="${i===proj.sel}" title="${i===proj.sel?'한 번 더 누르면 여기서부터 재생':''}"><b>${i+1}</b><span>${esc(k.name)}</span><small>${k.hold}ms</small></button>`).join('');markNow()}
function markNow(){$('keys').querySelectorAll('.kc').forEach((b,i)=>b.classList.toggle('now',PB.on&&i===PB.idx))}
function syncPlay(){const b=$('play');b.textContent=PB.on?'❚❚':'▶';b.setAttribute('aria-label',PB.on?'멈춤':'재생');markNow()}
$('keys').onclick=e=>{const b=e.target.closest('.kc');if(!b)return;const i=+b.dataset.i;
 if(PB.on){stop();proj.sel=i;renderTL();renderPanel();return}
 if(i===proj.sel){play(i);return}
 proj.sel=i;commit();renderTL();if(tab==='pose'||tab==='anim')renderPanel()};
$('play').onclick=()=>{if(PB.on){stop();proj.sel=PB.idx;renderTL();renderPanel()}else play(proj.sel)};
$('kadd').onclick=()=>{stop();const k=JSON.parse(JSON.stringify(curKey()));k.name=k.name.replace(/ \d+$/,'')+' '+(proj.keys.length+1);proj.keys.splice(proj.sel+1,0,k);proj.sel++;commit();renderTL();renderPanel();toast(`${proj.sel+1}번 키를 만들었습니다. 손과 칼끝을 끌어 자세를 바꿔 보세요.`)};

// ─── 조작 칸 ───
const panel=$('panel');let tab=LS.get('model-ed-tab')||'model';
const segBtns=(act,opts,cur,k='')=>`<div class="seg">${opts.map(([v,l])=>`<button data-act="${act}" data-k="${k}" data-v="${v}" aria-pressed="${String(v)===String(cur)}">${l}</button>`).join('')}</div>`;
const swRow=(k,label,cur)=>`<div class="swr"><span>${label}</span><div class="sws">${SW.map(c=>`<button class="sw" data-act="col" data-k="${k}" data-v="${c}" style="background:${c}" aria-label="${label} ${c}" aria-pressed="${c===cur}"></button>`).join('')}</div></div>`;
const ft=(i,j)=>[k=>(k.pose.feet||KDEF.feet)[i][j],(k,v)=>{k.pose.feet=(k.pose.feet||KDEF.feet).map(f=>[...f]);k.pose.feet[i][j]=v}],pf=n=>[k=>kf(k.pose,n),(k,v)=>k.pose[n]=v];
const PS_ALL=[['손 앞뒤',-60,90,1,k=>k.pose.h[0],(k,v)=>k.pose.h[0]=v],['손 좌우',-60,60,1,k=>k.pose.h[1],(k,v)=>k.pose.h[1]=v],['손 높이',0,170,1,k=>k.pose.h[2],(k,v)=>k.pose.h[2]=v],
 ['칼끝 앞뒤',-1,1,.01,k=>k.pose.d[0],(k,v)=>k.pose.d[0]=v],['칼끝 좌우',-1,1,.01,k=>k.pose.d[1],(k,v)=>k.pose.d[1]=v],['칼끝 위아래',-1,1,.01,k=>k.pose.d[2],(k,v)=>k.pose.d[2]=v],
 ['몸 기울기',-30,35,1,k=>k.pose.lean,(k,v)=>k.pose.lean=v],['주저앉기',0,1,.01,k=>k.down,(k,v)=>k.down=v],
 ['허리 낮추기',0,30,1,...pf('crouch'),1],['앞발 앞뒤',-45,50,1,...ft(0,0),1],['앞발 좌우',-40,15,1,...ft(0,1),1],['뒷발 앞뒤',-45,50,1,...ft(1,0),1],['뒷발 좌우',-15,40,1,...ft(1,1),1],
 ['팔꿈치 벌림',-1,1,.01,...pf('elb'),1],['고개 숙임 (pitch)',-.5,1,.01,...pf('nod'),1],['고개 돌림 (yaw)',-1,1,.01,...pf('hyaw'),1],['고개 갸웃 (roll)',-.7,.7,.01,...pf('hroll'),1]];
const PSL=()=>PS_ALL.filter(p=>!p[6]||proj.model.style==='knight'||proj.model.style==='mech');
const KS=[['유지 시간','hold',60,2000,10,'ms'],['따라가는 빠르기','rate',2,80,1,''],['파고들기','lunge',0,2,.1,'']];
const psGet=(k,n)=>PS_ALL[n][4](k);
const fmt=(v,st)=>st<1?Number(v).toFixed(2):String(Math.round(v));
function modelHTML(){const m=proj.model;let h=`<section class="grp"><h3>게임에서 가져오기</h3><p class="note">누르면 그 인물의 모습으로 바뀝니다. 동작은 그대로 남습니다.</p>`;
 for(const g of GROUPS)h+=`<div class="sub">${g}</div><div class="seg">${SOURCES.map((s,i)=>s.grp===g?`<button data-act="src" data-v="${i}">${esc(s.label)}</button>`:'').join('')}</div>`;
 h+=`</section><section class="grp"><h3>그림체</h3>${segBtns('style',[['fig','도포 무사'],['warrior','갑옷 무사'],['robot','거대 기사'],['knight','판금 기사'],['mech','로봇 모델']],m.style)}<label class="fld" for="mname"><span>이름</span><input id="mname" value="${esc(m.name)}" maxlength="16"></label></section><section class="grp"><h3>모습</h3>`;
 if(m.style==='fig')h+=`<div class="sub">옷</div>${segBtns('mset',[['white','흰 도포'],['grey','회색 도포'],['black','검은 도포']],m.robe,'robe')}
  <div class="sub">머리</div>${segBtns('mset',[['knot','상투'],['long','긴 머리'],['band','머리띠'],['gat','갓']],m.hat,'hat')}
  <div class="sub">수염</div>${segBtns('mset',[['none','없음'],['goatee','염소수염'],['full','덥수룩']],m.beard,'beard')}
  <label class="sl" for="mblade"><span>칼 길이</span><input type="range" id="mblade" min="50" max="140" step="1" value="${m.blade}"><b>${m.blade}</b></label>`;
 if(m.style==='warrior')h+=`<div class="sub">그림체</div>${segBtns('mset',[['ink','먹선'],['brush','붓터치 (수채)']],m.paint||'ink','paint')}
  <div class="sub">투구</div>${segBtns('mset',[['jhelm','조선 투구'],['ohelm','장교 투구'],['kabuto','카부토']],m.hat,'hat')}
  <div class="sub">무기</div>${segBtns('mset',[['katana','카타나'],['dual','쌍환도'],['flail','편곤']],m.weapon,'weapon')}
  <div class="sub">갑옷 짜임</div>${segBtns('mset',[['joseon','두정갑 징'],['officer','장교 갑'],['japan','왜갑 미늘']],m.armor,'armor')}
  <div class="sub">수염</div>${segBtns('mset',[['none','없음'],['goatee','있음']],m.beard,'beard')}
  ${swRow('coat','몸통',m.pal.coat)}${swRow('sleeve','팔',m.pal.sleeve)}${swRow('leg','다리',m.pal.leg)}${swRow('trim','허리띠',m.pal.trim)}${swRow('stud','징·무늬',m.pal.stud)}`;
 if(m.style==='mech')h+=`</section><section class="grp"><h3>머리 모델</h3>
  <div class="sub">머리 형태</div>${segBtns('mset',[['box','상자'],['wedge','쐐기'],['soft','둥근 상자'],['dome','돔'],['cyl','원통']],m.hShape||'box','hShape')}
  ${[['w','머리 폭'],['h','머리 높이'],['d','머리 깊이']].map(([k,lb])=>{const v=(m.hdim||{})[k]??1;return`<label class="sl" for="mhd_${k}"><span>${lb}</span><input type="range" id="mhd_${k}" data-hdim="${k}" min="0.7" max="1.5" step="0.02" value="${v}"><b>${(+v).toFixed(2)}</b></label>`}).join('')}
  <div class="sub">얼굴판</div>${segBtns('mset',[['band','눈 띠'],['full','얼굴 전체'],['none','없음']],m.hFace||'band','hFace')}
  <div class="sub">입</div>${segBtns('mset',[['lines','두 줄'],['vent','환기구'],['none','없음']],m.hMouth||'lines','hMouth')}
  ${swRow('head','머리 색',m.pal.head||m.pal.body)}
  <div class="sub">눈</div>${segBtns('mset',[['visor','일자 눈'],['twin','두 눈'],['mono','외눈']],m.eyes,'eyes')}
  <div class="sub">머리 상 · 관</div>${segBtns('mset',[['fin','가운데 볏'],['rods','안테나 한 쌍'],['crescent','반달관'],['ridge','등줄 볏'],['none','없음']],m.crest,'crest')}
  <div class="sub">머리 중 · 귀</div>${segBtns('mset',[['horn','귀뿔'],['disc','귀 원반'],['none','없음']],m.hMid||'none','hMid')}
  <div class="sub">머리 하 · 마스크</div>${segBtns('mset',[['slat','가로살 철마스크'],['jaw','턱가리개'],['none','없음']],m.hLow||'none','hLow')}
  </section><section class="grp"><h3>몸체</h3>
  <div class="sub">몸틀</div>${segBtns('mset',[['base','기본'],['lance','기사형 (로봇 모델2)']],m.frame||'base','frame')}
  <div class="sub">망토</div>${segBtns('mbool',[['1','두름'],['0','없음']],m.capeOn?'1':'0','capeOn')}${m.capeOn?swRow('mcape','망토 겉감',m.pal.mcape||'#283a6b')+swRow('mcapeIn','망토 안감',m.pal.mcapeIn||'#151c35'):''}
  <div class="sub">가슴 장식</div>${segBtns('mset',[['core','원형 코어'],['grill','환기구'],['bars','세로 띠'],['shield','방패 문장'],['none','민판']],m.emblem,'emblem')}
  <div class="sub">팔다리 형태</div>${segBtns('mset',[['round','둥근형'],['box','상자형']],m.limbs||'box','limbs')}
  <div class="sub">가슴</div>${segBtns('mset',[['box','상자형'],['soft','곡선형'],['round','둥근형']],m.chest||'box','chest')}
  <div class="sub">허리(배)</div>${segBtns('mset',[['box','상자형'],['soft','곡선형'],['round','둥근형']],m.belly||'box','belly')}
  <div class="sub">골반</div>${segBtns('mset',[['box','상자형'],['soft','곡선형'],['round','둥근형']],m.pelvis||'box','pelvis')}
  <div class="sub">무기</div>${segBtns('mset',[['none','맨주먹'],['sword','대검']],m.weapon,'weapon')}
  <div class="sub">허리 장갑</div>${segBtns('mbool',[['1','있음'],['0','없음']],m.skirt?'1':'0','skirt')}
  <div class="sub">신체 비율</div>${MBODYS.map(([key,lb,mn,mx])=>{const v=(m.body||{})[key]??1;return`<label class="sl" for="mb_${key}"><span>${lb}</span><input type="range" id="mb_${key}" data-body="${key}" min="${mn}" max="${mx}" step="0.02" value="${v}"><b>${(+v).toFixed(2)}</b></label>`}).join('')}
  <div class="row"><button data-act="bodyreset">보통 비율로</button></div>
  ${swRow('body','주 장갑',m.pal.body)}${swRow('accent','팔·다리 장갑',m.pal.accent)}${swRow('dark','허리·가슴 안쪽',m.pal.dark)}${swRow('joint','관절',m.pal.joint)}${swRow('glow','눈·코어 빛',m.pal.glow)}${swRow('trim','포인트',m.pal.trim)}${m.weapon==='sword'?swRow('blade','칼날',m.pal.blade):''}`;
 if(m.style==='knight')h+=`<div class="sub">그림체</div>${segBtns('mset',[['ink','먹선'],['brush','붓터치 (수채)']],m.paint||'ink','paint')}
  </section><section class="grp"><h3>머리 디자인</h3>
  <div class="sub">머리에 쓰는 것</div>${segBtns('mset',[['helm','투구'],['coif','사슬 두건'],['hood','천 두건'],['none','맨머리']],m.hwear||'helm','hwear')}
  ${(m.hwear||'helm')==='helm'?(()=>{if(m.helm!=='kit'||!m.hkit){m.hkit=kitFromOld(m);m.helm='kit'}return kitSection(m)})():''}
  ${((m.hwear||'helm')!=='helm'||m.helm==='open'||m.helm==='kettle'||(m.helm==='kit'&&m.hkit&&((m.hkit.form||'parts')==='parts'?(['open','nasal','cheek'].includes(m.hkit.face)||(['visor','mask'].includes(m.hkit.face)&&m.hkit.visor==='up')):(m.hkit.form==='kettle'||m.hkit.visor==='up'))))?`<div class="sub">눈</div>${segBtns('mset',[['dot','점 눈'],['narrow','가는 눈'],['fierce','부릅뜬 눈'],['x','X 눈']],m.fEye||'dot','fEye')}<div class="sub">안대</div>${segBtns('mbool',[['1','외눈 안대'],['0','없음']],m.patch?'1':'0','patch')}
  <div class="sub">코</div>${segBtns('mset',[['small','작은 코'],['hook','매부리코'],['broad','넓은 코']],m.fNose||'small','fNose')}
  <div class="sub">입</div>${segBtns('mset',[['line','다문 입'],['smile','웃는 입'],['frown','굳은 입'],['open','벌린 입']],m.fMouth||'line','fMouth')}
  <div class="sub">수염</div>${segBtns('mset',[['none','없음'],['mustache','콧수염'],['goatee','턱수염'],['full','덥수룩한 수염']],m.beard||'none','beard')}
  ${m.hwear==='none'?`<div class="sub">머리 모양</div>${segBtns('mset',[['short','짧은 머리'],['long','긴 머리'],['knot','묶은 머리'],['bald','민머리']],m.hair||'short','hair')}`:''}
  ${swRow('skin','피부',m.pal.skin||'#e8d2b4')}${swRow('hair','머리카락·수염',m.pal.hair||'#3b3732')}`:'<p class="note">얼굴은 면갑을 올리거나 챙 투구·두건·맨머리일 때 보입니다.</p>'}
  ${(m.hwear||'helm')==='helm'&&m.helm==='kit'&&m.hkit&&['jin','jin2'].includes(m.hkit.form)&&m.hkit.visor!=='up'?`<div class="sub">드림 틈 눈 모양</div>${segBtns('mset',[['dot','점 눈'],['narrow','가는 눈'],['fierce','부릅뜬 눈'],['x','X 눈']],m.fEye||'dot','fEye')}<div class="sub">안대</div>${segBtns('mbool',[['1','외눈 안대'],['0','없음']],m.patch?'1':'0','patch')}`:''}
  </section><section class="grp"><h3>갑옷</h3>
  <div class="sub">갑옷 종류</div>${segBtns('mset',[['plate','판금 갑옷'],['jin','금나라 미늘 갑옷']],m.armor||'plate','armor')}
  ${m.armor!=='jin'?`<div class="sub">폴드런 (어깨 보호구)</div>${segBtns('mset',[['round','둥근 겹판'],['haute','오트 피스(관판)']],m.paul,'paul')}`:''}
  <label class="sl" for="mpsize"><span>어깨 크기</span><input type="range" id="mpsize" min="0.7" max="1.6" step="0.05" value="${m.psize}"><b>${(+m.psize).toFixed(2)}</b></label>
  ${m.armor==='jin'?'<p class="note">미늘 갑옷은 쇠비늘 치마가 정강이까지 내려옵니다. 치마 밑단 천 색은 ‘겉옷’ 색을 씁니다.</p>':`<div class="sub">겉옷 (서코트)</div>${segBtns('mbool',[['1','입음'],['0','벗음 · 태시츠 보임']],m.coat?'1':'0','coat')}`}
  ${m.coat&&m.armor!=='jin'?`<div class="sub">앞자락</div>${segBtns('mbool',[['1','있음'],['0','없음']],m.flap?'1':'0','flap')}`:''}
  <div class="sub">칼집</div>${segBtns('mbool',[['1','참'],['0','안 참']],m.sheath?'1':'0','sheath')}${m.sheath?segBtns('mset',[['back','옆구리 뒤로'],['front','앞으로 가로질러']],m.sheathDir||'back','sheathDir'):''}
  <div class="sub">신체 비율</div>${BODYS.map(([key,lb,mn,mx])=>{const v=(m.body||{})[key]??1;return`<label class="sl" for="mb_${key}"><span>${lb}</span><input type="range" id="mb_${key}" data-body="${key}" min="${mn}" max="${mx}" step="0.02" value="${v}"><b>${(+v).toFixed(2)}</b></label>`}).join('')}
  <div class="row"><button data-act="bodyreset">보통 비율로</button></div>
  ${swRow('steel','강철',m.pal.steel)}${swRow('shade','강철 그늘',m.pal.shade)}${swRow('hi','반짝임',m.pal.hi)}${swRow('trim','테두리·도금',m.pal.trim)}${m.coat||m.armor==='jin'?swRow('cloth',m.armor==='jin'?'밑단 천':'겉옷',m.pal.cloth||'#2e3756')+(m.flap&&m.armor!=='jin'?swRow('flap','앞자락',m.pal.flap):''):''}${swRow('leather','가죽·손잡이',m.pal.leather)}${swRow('glove','장갑',m.pal.glove||m.pal.steel)}${swRow('belt','허리띠',m.pal.belt||m.pal.leather)}${m.sheath?swRow('sheath','칼집',m.pal.sheath||m.pal.leather):''}`;
 if(m.style==='robot')h+=`${swRow('coat','장갑판',m.pal.coat)}${swRow('sleeve','팔',m.pal.sleeve)}${swRow('leg','다리',m.pal.leg)}${swRow('trim','장식·눈',m.pal.trim)}${swRow('stud','무늬',m.pal.stud)}${swRow('cape','망토',m.cape)}`;
 return h+`</section>`}
function poseHTML(){const k=curKey();return`<section class="grp"><h3>${proj.sel+1}번 키 · ${esc(k.name)}</h3><p class="note">무대의 <b>빨간 원(손)</b>과 <span style="color:var(--blue);font-weight:700">파란 원(칼끝)</span>을 끌어 자세를 잡습니다. 앞뒤 깊이는 시점을 돌려서 끌거나 아래 막대로 맞춥니다.</p>
 ${PSL().map(p=>{const n=PS_ALL.indexOf(p),[lb,mn,mx,st]=p;return(n===8?'<div class="sub">판금 기사 몸</div>':'')+`<label class="sl" for="ps${n}"><span>${lb}</span><input type="range" id="ps${n}" data-ps="${n}" min="${mn}" max="${mx}" step="${st}" value="${psGet(k,n)}"><b>${fmt(psGet(k,n),st)}</b></label>`}).join('')}
 <div class="row"><button data-act="mirror">좌우 뒤집기</button><button data-act="copyprev" ${proj.sel?'':'disabled'}>앞 키 자세 복사</button></div></section>
 <section class="grp"><h3>게임 자세 가져오기</h3><p class="note">누르면 지금 키의 자세가 바뀝니다.</p><div class="pgrid">${POSE_PRESETS.map((p,i)=>`<button data-act="ppre" data-v="${i}">${p[0]}</button>`).join('')}</div></section>`}
function animHTML(){const k=curKey();return`<section class="grp"><h3>${proj.sel+1}번 키 · 시간</h3><label class="fld" for="kname"><span>키 이름</span><input id="kname" value="${esc(k.name)}" maxlength="16"></label>
 ${KS.map(([lb,key,mn,mx,st,u],n)=>`<label class="sl" for="ks${n}"><span>${lb}</span><input type="range" id="ks${n}" data-ks="${n}" min="${mn}" max="${mx}" step="${st}" value="${k[key]}"><b>${fmt(k[key],st)}${u}</b></label>`).join('')}
 <p class="note">유지 시간 동안 이 자세를 향해 움직입니다. 빠르기가 클수록 확 꺾이고, 파고들기는 키가 시작될 때 앞으로 내딛는 거리입니다.</p>
 <div class="row"><button data-act="kl" ${proj.sel?'':'disabled'}>← 앞으로</button><button data-act="kr" ${proj.sel<proj.keys.length-1?'':'disabled'}>뒤로 →</button><button data-act="kdup">복제</button><button data-act="kdel" ${proj.keys.length>1?'':'disabled'}>삭제</button></div></section>
 <section class="grp"><h3>재생</h3>${segBtns('speed',[[.25,'¼배속'],[.5,'½배속'],[1,'1배속']],opt.speed)}<div class="row"><button data-act="loop" aria-pressed="${opt.loop}">반복 재생</button><button data-act="onion" aria-pressed="${opt.onion}">앞 키 잔상</button></div><div class="sub">검 궤적 효과</div>${segBtns('trailfx',[['ink','먹 궤적'],['flash','섬광 검기'],['both','둘 다'],['none','없음']],opt.trailFx||'ink')}${['flash','both'].includes(opt.trailFx)?`<label class="sl" for="fxden"><span>섬광 빛줄기</span><input type="range" id="fxden" min="0" max="3" step="0.1" value="${opt.fxDen??1}"><b>${(+(opt.fxDen??1)).toFixed(1)}</b></label><label class="sl" for="fxtn"><span>꼬리 갈래 수</span><input type="range" id="fxtn" min="1" max="30" step="1" value="${opt.fxTailN??5}"><b>${opt.fxTailN??5}</b></label><label class="sl" for="fxtp"><span>꼬리 안내선 위치</span><input type="range" id="fxtp" min="0" max="0.85" step="0.01" value="${opt.fxTailPos??0}"><b>${(+(opt.fxTailPos??0)).toFixed(2)}</b></label><label class="sl" for="fxta"><span>꼬리 호 높이</span><input type="range" id="fxta" min="0" max="1" step="0.01" value="${opt.fxTailArc??.5}"><b>${(+(opt.fxTailArc??.5)).toFixed(2)}</b></label><label class="sl" for="fxgl"><span>섬광 머리 빛무리</span><input type="range" id="fxgl" min="1" max="2.5" step="0.05" value="${opt.fxGlow??1.2}"><b>${(+(opt.fxGlow??1.2)).toFixed(2)}배</b></label><label class="sl" for="fxper"><span>반짝임 주기</span><input type="range" id="fxper" min="30" max="300" step="10" value="${opt.fxPer||60}"><b>${opt.fxPer||60}ms</b></label>`:''}</section>
 <section class="grp"><h3>게임 동작 불러오기</h3><p class="note">키를 모두 이 동작으로 바꿉니다. 되돌리기로 돌아갈 수 있습니다.</p><div class="pgrid">${ANIM_PRESETS.map((p,i)=>`<button data-act="apre" data-v="${i}">${p[0]}</button>`).join('')}</div></section>`}
const BODYS=[['torso','몸통 폭',.8,1.6],['limb','팔다리 굵기',.8,1.7],['leg','다리 길이',.7,1.2],['shoulder','어깨 간격',.8,1.5],['head','머리 크기',.7,1.3],['neck','목 길이',.3,1.3]];
const MBODYS=[...BODYS.slice(0,4),['pad','어깨뽕 크기',.5,2],...BODYS.slice(4)];
const SLOTS=[['가위 공격','atk',0],['바위 공격','atk',1],['보 공격','atk',2],['쳐내기','parry'],['상단 자세','pose',0],['중단 자세','pose',1],['하단 자세','pose',2],['칼 얽힘','bind']];
let armed=null;
function outHTML(){return`<section class="grp"><h3>검술대전에 넣기</h3><p class="note">공격·쳐내기 칸에는 <b>2번 키(준비)</b>와 <b>3번 키(타격)</b>가 들어가고, 2번 키의 유지 시간·빠르기와 3번 키의 빠르기·파고들기가 공격 공통 시간값이 됩니다. 자세 칸에는 지금 고른 키가 들어갑니다.</p>
 <div class="sub">① 지금 동작을 칸에 넣기</div><div class="pgrid">${SLOTS.map((s,i)=>`<button data-act="slot" data-v="${i}" class="${game.set.includes(s[0])?'set':''}">${s[0]}</button>`).join('')}</div>
 <div class="sub">② 내보낼 칸 고르기</div><div class="seg">${EXG.map(n=>`<button data-act="exs" data-k="${n}" aria-pressed="${opt.ex.slots[n]}">${n}</button>`).join('')}<button data-act="exf" data-k="T" aria-pressed="${opt.ex.T}">공격 시간값</button></div>
 <div class="sub">③ 함께 넣을 값</div><div class="seg"><button data-act="exf" data-k="body" aria-pressed="${opt.ex.body}">판금 몸 값 (발·허리·팔꿈치·고개)</button><button data-act="exf" data-k="model" aria-pressed="${opt.ex.model}">모델 디자인</button></div>
 <div class="seg"><button data-act="exall" data-v="1">모두 넣기</button><button data-act="exall" data-v="0">칸 모두 빼기</button><button data-act="exset">넣은 칸만</button></div>
 <p class="note" id="gsum"></p>
 <textarea id="gjson" rows="4" readonly aria-label="게임 동작 데이터"></textarea>
 <div class="row"><button class="go" data-act="gcopy">복사</button><button data-act="greset" class="${armed==='greset'?'arm':''}">${armed==='greset'?'한 번 더 누르면 초기화':'기본값으로'}</button></div>
 <p class="note">게임에서 <b>메뉴 → 동작 수정툴 → 동작 데이터(JSON)</b> 칸에 붙여 넣고 ‘붙여넣은 값 불러오기’ 후 저장하면 그 동작으로 싸웁니다. 공격 셋과 자세 셋은 게임이 빈칸을 읽지 못해서, 하나만 빼면 그 칸은 기본값으로 채워집니다. 판금 몸 값과 모델 디자인은 지금 게임이 읽지 않고 그냥 넘깁니다.</p></section>
 <section class="grp"><h3>보관함</h3><div class="row"><input id="libname" aria-label="저장할 이름" value="${esc(proj.model.name)} · ${esc(proj.keys.length>1?proj.keys[Math.min(2,proj.keys.length-1)].name:proj.keys[0].name)}" maxlength="24"><button class="go" data-act="libsave">저장</button></div>
 ${lib.length?`<ul class="lib">${lib.map((it,i)=>`<li><button data-act="libload" data-v="${i}">${esc(it.name)}<small>${it.data.keys.length}키 · ${esc(it.date)}</small></button><button class="del ${armed==='del'+i?'arm':''}" data-act="libdel" data-v="${i}" aria-label="${esc(it.name)} 지우기">${armed==='del'+i?'한 번 더':'지우기'}</button></li>`).join('')}</ul>`:'<p class="empty">저장한 모델이 없습니다. 이름을 적고 저장하면 여기 쌓입니다.</p>'}
 <p class="note">보관함은 이 브라우저에만 남습니다.</p></section>
 <section class="grp"><h3>작업 파일 (JSON)</h3><div class="seg">${[['model','모델 디자인'],['keys','동작 키'],['time','키 시간값'],['body','판금 몸 값']].map(([k,l])=>`<button data-act="pxf" data-k="${k}" aria-pressed="${opt.px[k]}" ${k!=='model'&&k!=='keys'&&!opt.px.keys?'disabled':''}>${l}</button>`).join('')}</div>
 <p class="note" id="psum"></p><p class="note">불러올 때 빠진 항목은 지금 것을 그대로 둡니다. 모델만 넣은 파일을 불러오면 모습만 바뀌고 동작은 남습니다.</p>
 <textarea id="pjson" rows="4" spellcheck="false" aria-label="모델과 동작 데이터"></textarea><div class="row"><button data-act="pcopy">복사</button><button data-act="pload">붙여넣은 값 불러오기</button></div></section>`}
function gameOut(){const ex=opt.ex,g=game.data,D=DEF_GAME(),o={};let filled=0;const B=p=>ex.body?p:stripBody(p);
 const arr=(names,src,def)=>{if(!names.some(n=>ex.slots[n]))return null;return names.map((n,i)=>{if(ex.slots[n])return src[i];filled++;return def[i]})};
 const ps=arr(['상단 자세','중단 자세','하단 자세'],g.POSE,D.POSE);if(ps)o.POSE=ps.map(B);
 const st=arr(['가위 공격','바위 공격','보 공격'],g.STRIKE,D.STRIKE);if(st)o.STRIKE=st.map(s=>({wind:B(s.wind),hit:B(s.hit)}));
 if(ex.slots['쳐내기'])o.PARRY={wind:B(g.PARRY.wind),hit:B(g.PARRY.hit)};if(ex.slots['칼 얽힘'])o.BIND=B(g.BIND);if(ex.T)o.T={...g.T};if(ex.model)o.MODEL=proj.model;
 return{o,filled}}
function projOut(){const px=opt.px,o={};if(px.model)o.model=proj.model;
 if(px.keys)o.keys=proj.keys.map(k=>{const r={name:k.name,pose:px.body?P0(k.pose):stripBody(P0(k.pose)),down:k.down};if(px.time){r.hold=k.hold;r.rate=k.rate;r.lunge=k.lunge}return r});return o}
const kb=s=>{const n=new Blob([s]).size;return n<1024?n+'B':(n/1024).toFixed(1)+'KB'};
function fillOut(){const{o,filled}=gameOut(),gs=Object.keys(o).length?JSON.stringify(o):'',ps=Object.keys(projOut()).length?JSON.stringify(projOut()):'';$('gjson').value=gs;$('pjson').value=ps;
 $('gsum').innerHTML=gs?`${kb(gs)} · 들어간 칸 ${EXG.filter(n=>opt.ex.slots[n]).length}/8${filled?` · <b>뺀 칸 ${filled}개는 기본값으로 채움</b>`:''}`:'<b>고른 항목이 없습니다.</b>';
 $('psum').innerHTML=ps?`${kb(ps)} · ${[opt.px.model&&'모델',opt.px.keys&&`키 ${proj.keys.length}개`].filter(Boolean).join(' · ')}`:'<b>고른 항목이 없습니다.</b>'}
function renderPanel(){if(!['model','pose','anim','out','paint'].includes(tab))tab='model';panel.innerHTML=({model:modelHTML,pose:poseHTML,anim:animHTML,out:outHTML,paint:paintHTML})[tab]();if(tab==='out')fillOut();if(tab==='paint')attachPaint();if(tab==='model')kitAttach();
 for(const[id,key,f] of[['fxden','fxDen',v=>(+v).toFixed(1)],['fxper','fxPer',v=>v+'ms'],['fxtn','fxTailN',v=>v],['fxtp','fxTailPos',v=>(+v).toFixed(2)],['fxta','fxTailArc',v=>(+v).toFixed(2)],['fxgl','fxGlow',v=>(+v).toFixed(2)+'배']]){const el=$(id);if(el)el.oninput=e=>{e.stopPropagation();opt[key]=+el.value;el.nextElementSibling.textContent=f(el.value);LS.set('model-ed-opt',opt);if(PB.sw)PB.swIdx=-1}}
 document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===tab)))}
function syncSliders(){const k=curKey();panel.querySelectorAll('[data-ps]').forEach(inp=>{const n=+inp.dataset.ps,v=psGet(k,n);inp.value=v;inp.nextElementSibling.textContent=fmt(v,PS_ALL[n][3])})}
function updTop(){$('mname-top').textContent=proj.model.name;$('undo').disabled=!hist.length;$('redo').disabled=!fut.length}
function renderAll(){renderTL();renderPanel();updTop();syncPlay()}
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;armed=null;LS.set('model-ed-tab',tab);renderPanel()});
async function copyText(ta,label){try{await navigator.clipboard.writeText(ta.value);toast(label+' 복사했습니다.')}catch(_){ta.removeAttribute('readonly');ta.select();toast('선택해 두었습니다. 직접 복사해 주세요.')}}
const r2=v=>Math.round(v*100)/100,rp=p=>{const o={h:p.h.map(r2),d:norm(p.d).map(v=>Math.round(v*1000)/1000),lean:r2(p.lean)};if(p.feet)o.feet=p.feet.map(f=>f.map(r2));if(p.off)o.off=p.off.map(r2);for(const n of['crouch','elb','nod','hyaw','hroll'])if(p[n]!=null)o[n]=r2(p[n]);return o};

panel.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||b.disabled)return;const act=b.dataset.act,v=b.dataset.v,k=b.dataset.k,m=proj.model;
 if(act!=='greset'&&act!=='libdel'&&act!=='alb-del')armed=null;
 if(paintClick(act,v,k))return;
 if(kitClick(act,v,k))return;
 switch(act){
  case'src':proj.model=SOURCES[+v].make();commit();renderPanel();toast(`${SOURCES[+v].label} 모습을 가져왔습니다.`);break;
  case'style':proj.model=convert(m,v);commit();renderPanel();break;
  case'mset':m[k]=v;commit();renderPanel();break;
  case'bodyreset':delete m.body;commit();renderPanel();toast('보통 비율로 돌렸습니다.');break;
  case'mbool':m[k]=v==='1';commit();renderPanel();break;
  case'col':if(k==='cape')m.cape=v;else m.pal[k]=v;commit();renderPanel();break;
  case'mirror':{const kk=curKey();kk.pose.h[1]=-kk.pose.h[1];kk.pose.d[1]=-kk.pose.d[1];if(kk.pose.feet)kk.pose.feet=[[kk.pose.feet[1][0],-kk.pose.feet[1][1]],[kk.pose.feet[0][0],-kk.pose.feet[0][1]]];commit();syncSliders();break}
  case'copyprev':{const kk=curKey(),pk=proj.keys[proj.sel-1];kk.pose=P0(pk.pose);kk.down=pk.down;commit();syncSliders();toast('앞 키 자세를 복사했습니다.');break}
  case'ppre':{stop();const kk=curKey(),p=POSE_PRESETS[+v];const old=kk.pose;kk.pose=P0(p[1]);for(const n of['off','feet','crouch','elb','nod','hyaw','hroll'])if(p[1][n]==null&&old[n]!=null)kk.pose[n]=n==='feet'?old.feet.map(f=>[...f]):old[n];kk.down=0;commit();syncSliders();toast(`${proj.sel+1}번 키를 ‘${p[0]}’로 바꿨습니다.`);break}
  case'kl':case'kr':{stop();const j=proj.sel+(act==='kl'?-1:1),ks=proj.keys;[ks[j],ks[proj.sel]]=[ks[proj.sel],ks[j]];proj.sel=j;commit();renderTL();renderPanel();break}
  case'kdup':$('kadd').click();break;
  case'kdel':{stop();proj.keys.splice(proj.sel,1);proj.sel=Math.min(proj.sel,proj.keys.length-1);commit();renderTL();renderPanel();toast('키를 지웠습니다. 되돌리기로 살릴 수 있습니다.');break}
  case'speed':opt.speed=+v;LS.set('model-ed-opt',opt);renderPanel();break;
  case'trailfx':opt.trailFx=v;LS.set('model-ed-opt',opt);renderPanel();break;
  case'loop':case'onion':opt[act]=!opt[act];LS.set('model-ed-opt',opt);renderPanel();break;
  case'apre':{const p=ANIM_PRESETS[+v];proj.keys=p[1]();proj.sel=Math.min(2,proj.keys.length-1);commit();renderTL();renderPanel();play(0);toast(`‘${p[0]}’ 동작을 불러왔습니다.`);break}
  case'slot':{const[name,kind,i]=SLOTS[+v],ks=proj.keys,g=game.data;
   if(kind==='atk'||kind==='parry'){if(ks.length<2){toast('키가 두 개 이상 있어야 합니다.');break}const[w,h]=ks.length>=3?[ks[1],ks[2]]:[ks[0],ks[1]];
    if(kind==='atk')g.STRIKE[i]={wind:rp(w.pose),hit:rp(h.pose)};else g.PARRY={wind:rp(w.pose),hit:rp(h.pose)};
    if(kind==='atk')g.T={wind:Math.round(w.hold),windRate:Math.round(w.rate),hitRate:Math.round(h.rate),lunge:r2(h.lunge)}}
   else if(kind==='pose')g.POSE[i]=rp(curKey().pose);else g.BIND=rp(curKey().pose);
   if(!game.set.includes(name))game.set.push(name);LS.set('model-ed-game',game);renderPanel();toast(`‘${name}’ 칸에 넣었습니다. 복사해서 게임에 붙여 넣어 주세요.`);break}
  case'exs':opt.ex.slots[k]=!opt.ex.slots[k];LS.set('model-ed-opt',opt);renderPanel();break;
  case'exf':opt.ex[k]=!opt.ex[k];LS.set('model-ed-opt',opt);renderPanel();break;
  case'exall':for(const n of EXG)opt.ex.slots[n]=v==='1';opt.ex.T=v==='1';LS.set('model-ed-opt',opt);renderPanel();break;
  case'exset':for(const n of EXG)opt.ex.slots[n]=game.set.includes(n);opt.ex.T=game.set.some(n=>n.endsWith('공격'));LS.set('model-ed-opt',opt);renderPanel();toast(game.set.length?'이번에 넣은 칸만 골랐습니다.':'아직 넣은 칸이 없습니다.');break;
  case'pxf':opt.px[k]=!opt.px[k];LS.set('model-ed-opt',opt);renderPanel();break;
  case'gcopy':if(!$('gjson').value){toast('고른 항목이 없습니다.');break}copyText($('gjson'),'게임 동작 데이터를');break;
  case'greset':if(armed!=='greset'){armed='greset';renderPanel();break}armed=null;game={data:DEF_GAME(),set:[]};LS.set('model-ed-game',game);renderPanel();toast('게임 동작 데이터를 기본값으로 돌렸습니다.');break;
  case'libsave':{const name=($('libname').value||proj.model.name).trim().slice(0,24),d=new Date(),date=`${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,it={name,date,data:JSON.parse(JSON.stringify({model:proj.model,keys:proj.keys}))},j=lib.findIndex(x=>x.name===name);
   if(j>=0)lib.splice(j,1);lib.unshift(it);LS.set('model-ed-lib',lib);renderPanel();toast(`‘${name}’을 보관함에 저장했습니다.`);break}
  case'libload':{const it=lib[+v],p=cleanProj({...it.data,sel:0});if(!p)break;stop();proj=p;commit();renderAll();toast(`‘${it.name}’을 불러왔습니다.`);break}
  case'libdel':if(armed!=='del'+v){armed='del'+v;renderPanel();break}armed=null;lib.splice(+v,1);LS.set('model-ed-lib',lib);renderPanel();break;
  case'pcopy':if(!$('pjson').value){toast('고른 항목이 없습니다.');break}copyText($('pjson'),'작업 파일을');break;
  case'pload':{let p=null;try{const j=JSON.parse($('pjson').value);if(!j.model&&!Array.isArray(j.keys))throw 0;const keys=Array.isArray(j.keys)?j.keys.map((k,i)=>{const cur=proj.keys[i]||mkKey('키',POSE[1]);return{...cur,...k,pose:{...cur.pose,...(k.pose||{})}}}):proj.keys;p=cleanProj({model:j.model||proj.model,keys,sel:0})}catch(_){}if(!p){toast('형식이 맞지 않습니다. 복사한 내용을 그대로 붙여 넣어 주세요.');break}stop();proj=p;commit();renderAll();toast('작업 파일을 불러왔습니다.');break}
 }});
panel.addEventListener('input',e=>{const t=e.target,k=curKey();
 if(t.dataset.ps!=null){const p=PS_ALL[+t.dataset.ps],v=+t.value;p[5](k,v);t.nextElementSibling.textContent=fmt(v,p[3]);stop()}
 else if(t.dataset.ks!=null){const[,key,,,st,u]=KS[+t.dataset.ks];k[key]=+t.value;t.nextElementSibling.textContent=fmt(k[key],st)+u;if(key==='hold')renderTL()}
 else if(t.dataset.hdim){const m=proj.model;m.hdim={...(m.hdim||{}),[t.dataset.hdim]:+t.value};t.nextElementSibling.textContent=(+t.value).toFixed(2)}
 else if(t.dataset.body){const m=proj.model;m.body={...(m.body||{}),[t.dataset.body]:+t.value};t.nextElementSibling.textContent=(+t.value).toFixed(2)}
 else if(t.id==='pwet'){popt.wet=+t.value;t.nextElementSibling.textContent=Math.round(popt.wet*100)+'%';savePopt()}
 else if(t.id==='mpsize'){proj.model.psize=+t.value;t.nextElementSibling.textContent=(+t.value).toFixed(2)}
 else if(t.id==='mblade'){proj.model.blade=+t.value;t.nextElementSibling.textContent=t.value}
 else if(t.id==='mname'){proj.model.name=t.value||'무명';updTop()}
 else if(t.id==='kname'){k.name=t.value||'키';renderTL()}});
panel.addEventListener('change',e=>{if(e.target.matches('input'))commit()});

// 탭 줄이 무대 바로 아래에 붙어 있도록 무대 높이를 알려 준다
new ResizeObserver(()=>document.documentElement.style.setProperty('--stagew',$('stagewrap').offsetHeight+'px')).observe($('stagewrap'));new ResizeObserver(()=>document.documentElement.style.setProperty('--toph',$('top').offsetHeight+'px')).observe($('top'));/* 맨 위 메뉴(2D·3D 월드 전환)를 스크롤해도 고정 */
renderAll();wake(1500);requestAnimationFrame(frame);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{renderTL();wake()});

