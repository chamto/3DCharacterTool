"use strict";
const INK='#12100e',PAPER='#f2eee4',PAPER2='#d9d3c4',SEAL='#b3261a',GREY='#8d877c';
const CW=800,CH=620,W=100,H=64,TOP=172,FH=420,U=7.0;
const HANDS=['가위','바위','보'],STANCES=['상단','중단','하단'],PARTS=['머리','몸통','다리','손'];
const FLESH={머리:20,몸통:30,손:10,다리:20},ARMOR={머리:100,몸통:200,손:50,다리:150};
const PIECES={머리:['투구'],몸통:['흉갑'],손:['장갑','하박','상박','어깨'],다리:['신발','종아리','허벅지']};
const beats=(a,b)=>(a===0&&b===2)||(a===1&&b===0)||(a===2&&b===1);
const handBeatenBy=h=>h===0?2:h===1?0:1; // h가 이기는 패

const t=(n,h,p,pw,c,re,ar,pri,line)=>({n,h,p,pw,c,re,ar,pri,line});
const ROSTER=[
 {id:'cheol',name:'강철두',title:'떠돌이 검객',robe:'white',hat:'knot',beard:'full',scar:1,move:24,atk:1,parry:.4,def:.2,arm:1,
  st:[{atk:2,parry:.5},{def:2,parry:1},{atk:1.5,parry:1.5}],pref:[.34,.33,.33],
  tech:[t('머리치기',0,'머리',22,0,21,80,1),t('몸통찌르기',1,'몸통',25,0,24,50,2),t('다리후리기',2,'다리',24,0,20,100,3),t('손목베기',0,'손',11,0,21,80,4),t('손등찍기',1,'손',12,0,24,50,5),t('손목걷기',2,'손',11,0,20,100,6)]},
 {id:'seorin',name:'서린',title:'하단의 여검객',robe:'grey',hat:'long',beard:'none',scar:0,move:30,atk:.92,parry:.46,def:.1,arm:.75,
  st:[{atk:1.6,parry:.5},{def:1.6,parry:1},{atk:1.7,parry:1.7}],pref:[.15,.25,.6],
  tech:[t('이마베기',0,'머리',19,0,22,70,1),t('명치찌르기',1,'몸통',22,0,26,44,2),t('발목걷기',2,'다리',21,0,22,100,3),t('손등긋기',0,'손',10,0,22,70,4),t('손목찌르기',1,'손',11,0,26,44,5),t('손날스치기',2,'손',10,0,22,100,6)]},
 {id:'kurobe',name:'쿠로베',title:'왜구 낭인',robe:'black',hat:'band',beard:'goatee',scar:2,move:22,atk:1.1,parry:.3,def:.18,arm:.9,
  st:[{atk:2.5,parry:.35},{def:1.5,parry:.9},{atk:1.3,parry:1.2}],pref:[.6,.25,.15],
  tech:[t('내려치기',0,'머리',24,0,22,70,1),t('밀어베기',1,'몸통',26,0,22,60,2),t('무릎베기',2,'다리',22,0,19,90,3),t('손모가지치기',0,'손',12,0,22,70,4),t('손목누르기',1,'손',13,0,22,60,5),t('손목후리기',2,'손',11,0,19,90,6)]},
 {id:'yuntae',name:'윤태',title:'포도군관',robe:'white',hat:'gat',beard:'goatee',scar:0,move:20,atk:.95,parry:.38,def:.3,arm:1.2,
  st:[{atk:1.8,parry:.5},{def:3,parry:1.2},{atk:1.3,parry:1.3}],pref:[.2,.6,.2],
  tech:[t('갓끈치기',0,'머리',20,0,20,80,1),t('자루밀기',1,'몸통',24,0,23,60,2),t('정강이치기',2,'다리',21,0,20,90,3),t('포승손목',0,'손',10,0,20,80,4),t('손등치기',1,'손',12,0,23,60,5),t('손목걸기',2,'손',10,0,20,90,6)]},
];

for(const ch of ROSTER)for(const x of ch.tech)x.pw=Math.round(x.pw*1.9);
let seed=1;const R=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296};
const rr=(a,b)=>a+(b-a)*R();
const lerp=(a,b,k)=>a+(b-a)*k,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function smooth(p,n=1,closed=false){for(let k=0;k<n;k++){const o=[];const m=closed?p.length:p.length-1;if(!closed)o.push(p[0]);for(let i=0;i<m;i++){const a=p[i],b=p[(i+1)%p.length];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}if(!closed)o.push(p[p.length-1]);p=o}return p}
// 끝이 빠지는 붓선
function brush(c,pts,w,o={}){const j=o.j??.5,tp=o.taper??1,col=o.col||INK,n=pts.length;if(n<2)return;const L=[],Rr=[];for(let i=0;i<n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;const q=i/(n-1);const prof=(1-tp)+tp*Math.pow(Math.sin(Math.PI*clamp(q*.96+.02,0,1)),.55);const wd=w*prof*(1+rr(-.22,.22))*.5;const jx=rr(-j,j),jy=rr(-j,j);L.push([pts[i][0]+jx-dy*wd,pts[i][1]+jy+dx*wd]);Rr.push([pts[i][0]+jx+dy*wd,pts[i][1]+jy-dx*wd])}c.fillStyle=col;c.beginPath();c.moveTo(L[0][0],L[0][1]);for(let i=1;i<n;i++)c.lineTo(L[i][0],L[i][1]);for(let i=n-1;i>=0;i--)c.lineTo(Rr[i][0],Rr[i][1]);c.closePath();c.fill()}
function line(c,a,b,w,o={}){const n=o.n||4,p=[];for(let i=0;i<=n;i++){const k=i/n;p.push([lerp(a[0],b[0],k),lerp(a[1],b[1],k)])}brush(c,p,w,o)}
function shape(c,pts,fill,w=2.2,o={}){const p=o.raw?pts:smooth(pts,o.sm??1,true);c.fillStyle=fill;c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.fill();if(w>0)brush(c,[...p,p[0]],w,{taper:.35,j:o.j??.35,col:o.col||INK})}
function hatch(c,pts,ang,gap,w,o={}){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;pts.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])});c.save();c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.clip();const cx=(x0+x1)/2,cy=(y0+y1)/2,rad=Math.hypot(x1-x0,y1-y0)/2+4,dx=Math.cos(ang),dy=Math.sin(ang);for(let s=-rad;s<rad;s+=gap*rr(.8,1.2)){if(R()<(o.skip||0))continue;const mx=cx-dy*s,my=cy+dx*s,l=rad*rr(.7,1);line(c,[mx-dx*l,my-dy*l],[mx+dx*l,my+dy*l],w,{col:o.col,j:.5,n:3})}c.restore()}
const POSE=[{h:[6,2,116],d:[-.35,.25,.75],lean:-2},{h:[20,1,70],d:[.8,0,.6],lean:3},{h:[13,7,46],d:[.86,.12,-.42],lean:6}];
const STRIKE=[
 {wind:{h:[0,2,120],d:[-.5,.2,.8],lean:-5},hit:{h:[28,0,68],d:[.92,0,-.3],lean:15}},
 {wind:{h:[2,4,72],d:[.7,.1,.05],lean:-3},hit:{h:[40,0,78],d:[1,0,.03],lean:17}},
 {wind:{h:[4,10,36],d:[-.3,.5,-.65],lean:4},hit:{h:[24,-6,92],d:[.72,-.25,.68],lean:9}},
];
const mix=(a,b,k)=>({h:a.h.map((v,i)=>lerp(v,b.h[i],k)),d:a.d.map((v,i)=>lerp(v,b.d[i],k)),lean:lerp(a.lean,b.lean,k)});
const norm=v=>{const m=Math.hypot(...v)||1;return v.map(x=>x/m)};

function drawFig(c,ch,o){ // o:{X,Y,s,ang,pose,down,hurt,ghost,bladeLen}
 const {X,Y,s,ang,pose}=o,cs=Math.cos(ang),sn=Math.sin(ang),sq=VIEW.sq;
 const down=o.down||0;
 const J=(f,r,u)=>[X+(f*cs-r*sn)*s,Y+(f*sn+r*cs)*sq*s-u*s*VIEW.uk];
 const dep=(f,r)=>f*sn+r*cs;
 const L=pose.lean+down*14,dropU=down*30;
 const bendF=(u)=>L*(u-46)/60;
 const H0=48-dropU,uC=84-dropU,uN=95-dropU,uH=106-dropU;
 const hipC=J(bendF(H0),0,H0),sh=[J(bendF(uC+4),15,uC+4),J(bendF(uC+4),-15,uC+4)];
 const hip=[J(0,8,H0),J(0,-8,H0)];
 // 다리
 const spread=down?12:1,fF=[18,-17],fR=[-7,8];
 const legs=[0,1].map(i=>{const r=i?-8:8;const footF=fF[i]*spread/ (down?6:1),foot=J(footF,fR[i],0),knee=J(footF*.72+2,fR[i]*1.2,24-dropU*.5);return{hip:hip[i],knee,foot,d:dep(footF,fR[i])}}).sort((a,b)=>a.d-b.d);
 const robe=ch.robe,fill=robe==='black'?INK:robe==='grey'?'#cfc9bb':PAPER,lineC=robe==='black'?PAPER:INK;
 c.save();if(o.ghost)c.globalAlpha=.4;
 // 그림자
 const gs=[];for(let i=0;i<14;i++){const a=i/14*6.283;gs.push([X+Math.cos(a)*29*s,Y+Math.sin(a)*12*s])}
 if(!o.noShadow){hatch(c,gs,.15,3,1.1,{skip:.08})}
 const limb=(a,b,w0,w1,f=fill)=>{const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;shape(c,[[a[0]+nx*w0*s,a[1]+ny*w0*s],[b[0]+nx*w1*s,b[1]+ny*w1*s],[b[0]-nx*w1*s,b[1]-ny*w1*s],[a[0]-nx*w0*s,a[1]-ny*w0*s]],f,1.8*Math.max(s,1)**.5,{sm:2,j:.3})};
 for(const l of legs){limb(l.hip,l.knee,9,7.5);limb(l.knee,l.foot,7.5,5.5);const ft=[l.foot[0]+cs*9*s,l.foot[1]+sn*5*s];line(c,l.foot,ft,7*s,{taper:.2});
   if(robe!=='black'){line(c,[lerp(l.hip[0],l.knee[0],.3)+3*s,lerp(l.hip[1],l.knee[1],.3)],[lerp(l.knee[0],l.foot[0],.5)+2*s,lerp(l.knee[1],l.foot[1],.5)],1,{n:3})}}
 // 칼·팔
 const d=norm(pose.d),hd=[pose.h[0]+bendF(pose.h[2]),pose.h[1],pose.h[2]-dropU];
 const off=[hd[0]-d[0]*13,hd[1]-d[1]*13,hd[2]-d[2]*13];
 const blen=o.bladeLen||92;
 const tip=[hd[0]+d[0]*blen,hd[1]+d[1]*blen,hd[2]+d[2]*blen];
 const swordBack=dep(tip[0],tip[1])<dep(0,0)-1;
 const drawSword=()=>{const pm=J(...off),gd=J(hd[0]+d[0]*7,hd[1]+d[1]*7,hd[2]+d[2]*7),tp=J(...tip);
   const n=[-(tp[1]-gd[1]),tp[0]-gd[0]];const nl=Math.hypot(...n)||1;const mid=[(gd[0]+tp[0])/2+n[0]/nl*2.5*s,(gd[1]+tp[1])/2+n[1]/nl*2.5*s];
   const bl=smooth([gd,mid,tp],2);brush(c,bl,5.4*s,{taper:.5,j:.1});brush(c,bl,2.5*s,{taper:.55,j:.1,col:PAPER});
   line(c,pm,gd,5*s,{taper:.1,j:.1});
   const gnx=-(gd[1]-pm[1]),gny=gd[0]-pm[0],gl=Math.hypot(gnx,gny)||1;line(c,[gd[0]+gnx/gl*6.5*s,gd[1]+gny/gl*6.5*s],[gd[0]-gnx/gl*6.5*s,gd[1]-gny/gl*6.5*s],3.5*s,{taper:.1,j:.1})};
 const isFar=sg=>sn<-.25||sg*cs<-.4;
 const drawArms=far=>{const ha=J(...hd),hb=J(...off);const pairs=[[sh[0],ha,1],[sh[1],hb,-1]];
   for(const [a,b,sg] of pairs){if(isFar(sg)!==far)continue;const m=[(a[0]+b[0])/2+sg*sn*5*s,(a[1]+b[1])/2+7*s];limb(a,m,6.5,6.5);limb(m,b,7,ch.hat==='band'?5:9);shape(c,[[b[0]-4*s,b[1]-4*s],[b[0]+4*s,b[1]-4*s],[b[0]+4*s,b[1]+4*s],[b[0]-4*s,b[1]+4*s]],robe==='black'?PAPER:PAPER,1.4)}};
 if(swordBack){drawSword()}
 drawArms(true);
 // 몸통 · 저고리
 const wa=[J(bendF(H0+8),11,H0+8),J(bendF(H0+8),-11,H0+8)];
 const hem=[J(-2,14,H0-22),J(-2,-14,H0-22)];
 {const rg=(u,rw,df,fo)=>{const a=[];for(let k=0;k<14;k++){const t=k/14*6.2832;a.push(J(fo+Math.cos(t)*df,Math.sin(t)*rw,u))}return a};
  shape(c,hull([...rg(H0+8,11,6.5,bendF(H0+8)),...rg(H0-22,14,9,-2)]),fill,2,{sm:1});
  shape(c,hull([...rg(uC+4,15,7.5,bendF(uC+4)),...rg((uC+H0)/2+4,13,8,bendF((uC+H0)/2+4)),...rg(H0+8,11,6.5,bendF(H0+8))]),fill,2.4,{sm:1})}
 if(sn>-.3){const nk=J(bendF(uN),0,uN-6),bel=J(bendF(H0+10)+7,0,H0+10);line(c,[nk[0]+5*s*(-sn),nk[1]],bel,1.6*s,{col:lineC,n:3});line(c,[nk[0]-5*s*(-sn)+3*s,nk[1]],bel,1.6*s,{col:lineC,n:3})}
 if(robe==='white'){hatch(c,[sh[0],lerp2(sh[0],sh[1],.45),lerp2(wa[0],wa[1],.45),wa[0]],1.1,3.4*s,.9)}
 if(robe==='grey'){hatch(c,[sh[0],sh[1],wa[1],wa[0]],.8,4*s,.8)}
 if(robe==='black'){for(let i=0;i<5;i++){const k=rr(.12,.88),a=lerp2(sh[0],sh[1],k),b=lerp2(wa[0],wa[1],k+rr(-.1,.1));line(c,a,b,1,{col:'#8f8a80',n:3})}}
 line(c,wa[0],wa[1],4.5*s,{taper:.2,col:robe==='black'?PAPER2:INK});
 // 머리
 const hc=J(bendF(uH),0,uH);const hr=11.5*s;
 line(c,J(bendF(uN),0,uN-2),hc,10*s,{taper:0,col:robe==='black'?PAPER:PAPER2});
 drawHeadSmall(c,ch,hc,hr,cs,sn,s,down,o.hurt);
 drawArms(false);
 if(!swordBack){drawSword()}
 c.restore();
 return{tipPos:J(...tip),a:J(...tip),b:J(hd[0]+d[0]*7,hd[1]+d[1]*7,hd[2]+d[2]*7),h:J(...hd)};
}
const lerp2=(a,b,k)=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k)];
function drawHeadSmall(c,ch,hc,r,cs,sn,s,down,hurt){
 const pts=[];for(let i=0;i<12;i++){const a=i/12*6.283;pts.push([hc[0]+Math.cos(a)*r*.92,hc[1]+Math.sin(a)*r])}
 shape(c,pts,PAPER,1.8,{sm:1});
 const fx=cs,fy=Math.max(sn,-1);
 // 머리칼
 const away=clamp(-sn*1.25,0,1),hair=[];if(away>.85){for(let i=0;i<16;i++){const a=i/16*6.283;hair.push([hc[0]+Math.cos(a)*r*1.05,hc[1]+Math.sin(a)*r*1.08])}}else{const back=Math.atan2(-1,-fx*(.9+away)),span=lerp(3.2,6.0,away);for(let i=0;i<=14;i++){const a=back-span/2+i/14*span;hair.push([hc[0]+Math.cos(a)*r*1.05,hc[1]+Math.sin(a)*r*1.08])}}
 if(!ch.noHair){shape(c,hair,INK,1,{raw:1});if(away>.3){c.save();c.globalAlpha=Math.min(1,(away-.3)*2);for(let i=-2;i<=2;i++)line(c,[hc[0]+i*r*.28,hc[1]-r*.85],[hc[0]+i*r*.36,hc[1]+r*.7],1.1,{col:'#5c564d',n:3});c.restore()}}
 if(ch.hat==='long'){line(c,[hc[0]-fx*r*.7,hc[1]],[hc[0]-fx*r*1.3,hc[1]+r*2.4],6*s,{n:4,taper:.7})}
 if(ch.hat==='knot'||ch.hat==='band'||ch.hat==='long'){const k=[hc[0]-fx*2*s,hc[1]-r*1.2];c.fillStyle=INK;c.beginPath();c.arc(k[0],k[1],4.2*s,0,7);c.fill()}
 if(ch.hat==='band'){line(c,[hc[0]-r,hc[1]-r*.3],[hc[0]+r,hc[1]-r*.3],3.2*s,{col:PAPER,taper:.1});line(c,[hc[0]-fx*r,hc[1]-r*.2],[hc[0]-fx*r*1.9,hc[1]+r*.5],2.2*s,{col:INK})}
 if(sn>-.35){const ex=hc[0]+fx*r*.45,ey=hc[1]+Math.max(0,sn)*r*.05-1*s+(ch.noHair?1.8*s:0),sp=Math.abs(sn)*r*.42+1.5*s;
   line(c,[ex-sp-2*s,ey-3*s],[ex-sp+2.4*s,ey-1.2*s],1.9*s,{taper:.2,j:.1});line(c,[ex+sp-2.4*s,ey-1.2*s],[ex+sp+2*s,ey-3*s],1.9*s,{taper:.2,j:.1});
   c.fillStyle=INK;c.beginPath();c.arc(ex-sp,ey,1.25*s,0,7);c.arc(ex+sp,ey,1.25*s,0,7);c.fill();
   if(ch.beard!=='none')hatch(c,[[ex-5*s,ey+4*s],[ex+5*s,ey+4*s],[ex+4*s,ey+9*s],[ex-4*s,ey+9*s]],1.57,1.6*s,1);
   line(c,[ex-2.4*s,ey+5.5*s],[ex+2.4*s,ey+5.5*s],hurt?2.4*s:1.2*s,{n:2,j:.1});
 }
 if(ch.hat==='gat'){const b=[];for(let i=0;i<14;i++){const a=i/14*6.283;b.push([hc[0]+Math.cos(a)*r*2.05,hc[1]-r*.62+Math.sin(a)*r*.62])}shape(c,b,'#2b2824',1.4,{raw:1});shape(c,[[hc[0]-r*.72,hc[1]-r*.65],[hc[0]+r*.72,hc[1]-r*.65],[hc[0]+r*.55,hc[1]-r*1.75],[hc[0]-r*.55,hc[1]-r*1.75]],INK,1.2,{raw:1});line(c,[hc[0]+fx*r*.8,hc[1]-r*.4],[hc[0]+fx*r*.5,hc[1]+r*1.3],1,{n:2})}
}

const wrap=a=>{while(a>Math.PI)a-=6.2832;while(a<-Math.PI)a+=6.2832;return a};
const HELM={jhelm:1,ohelm:1,kabuto:1};
const ROSTER2=[
 {id:'gawi',name:'가위',title:'조선 무사 · 쌍환도',atk:[10,3,3],hp:50,weapon:'dual',armor:'joseon',hat:'jhelm',beard:'goatee',scar:1,robe:'white',sigName:'십자베기',sigLine:'두 자루 칼날을 받아라!'},
 {id:'bawi',name:'바위',title:'조선 장교 · 편곤',atk:[3,10,3],hp:50,weapon:'flail',armor:'officer',hat:'ohelm',beard:'full',scar:0,robe:'black',sigName:'철편 일격',sigLine:'투구째 부숴 주마!'},
 {id:'bo',name:'보',title:'왜군 무사 · 카타나',atk:[3,3,10],hp:50,weapon:'katana',armor:'japan',hat:'kabuto',beard:'goatee',scar:2,robe:'white',sigName:'일섬',sigLine:'한 칼에 끝낸다.'},
];
ROSTER2.forEach(c=>c.sig=c.atk.indexOf(10));
Object.assign(ROSTER2[0],{wname:'환도',wlen:'S'});Object.assign(ROSTER2[1],{wname:'편곤',wlen:'L',flail:true});Object.assign(ROSTER2[2],{wname:'카타나',wlen:'M'});
const PARRY=[14,15,16],BLUE='#2a5d9c';
const PARRY_POSE={wind:{h:[14,4,96],d:[.55,-.15,.82],lean:0},hit:{h:[24,0,94],d:[.5,0,.87],lean:-2}},BIND_POSE={h:[24,0,80],d:[.86,0,.5],lean:9},ANIM_T={wind:280,windRate:16,hitRate:38,lunge:1};
const LENTXT={S:'짧음',M:'중간',L:'긺'};
function weaponEdge(a,b){if(a.mace&&!b.mace)return 1;if(b.mace&&!a.mace)return -1;if(a.flail&&!b.flail)return 1;if(b.flail&&!a.flail)return -1;if(a.wlen==='L'&&b.wlen==='S')return 1;if(a.wlen==='S'&&b.wlen==='L')return -1;return 0}
const flailDmg=(f,v)=>f.ch.flail&&!f.spin?Math.floor(v*.7):v;
function spinStart(f){if(!f.ch.flail)return;f.spin=!f.noSpinNext;f.noSpinNext=false}
const iga=w=>{const c=w.charCodeAt(w.length-1)-0xAC00;return w+(c>=0&&c%28?'이':'가')};
const TECH2={dual:['쌍칼 내려베기','환도 찌르기','쌍칼 후리기'],flail:['편곤 내려치기','자루 찌르기','편곤 휘두르기'],katana:['내려베기','찌르기','후려베기']};
const techName=(ch,h)=>h===ch.sig?ch.sigName:TECH2[ch.weapon][h];
const MOVE2=22,REACH=[{re:21,ar:80},{re:24,ar:50},{re:20,ar:100}],REACHTXT=['중간 거리 · 중간 폭','먼 거리 · 좁은 폭','짧은 거리 · 넓은 폭'];
const ARM2={joseon:{coat:'#cfc9bb',leg:PAPER,stud:INK,trim:INK,sleeve:'#cfc9bb'},officer:{coat:'#2b2824',leg:'#cfc9bb',stud:PAPER2,trim:SEAL,sleeve:'#2b2824'},japan:{coat:'#e2dccd',leg:'#3b3732',stud:INK,trim:SEAL,sleeve:'#3b3732'}};
function helmBack(c,ch,hc,r){
 if(ch.hat==='kabuto'){const y0=hc[1]-r*.45;shape(c,[[hc[0]-r*1.1,y0],[hc[0]+r*1.1,y0],[hc[0]+r*1.85,hc[1]+r*.75],[hc[0]-r*1.85,hc[1]+r*.75]],'#2b2824',1.4,{raw:1});for(const k of[.3,.65]){const y=y0+k*r*1.2,w=r*(1.1+.75*k);line(c,[hc[0]-w,y],[hc[0]+w,y],1,{col:PAPER2,n:3})}return}
 const col=ch.hat==='ohelm'?'#2b2824':'#cfc9bb';shape(c,[[hc[0]-r*1.05,hc[1]-r*.4],[hc[0]+r*1.05,hc[1]-r*.4],[hc[0]+r*1.3,hc[1]+r*1.5],[hc[0]-r*1.3,hc[1]+r*1.5]],col,1.5,{raw:1});
 c.fillStyle=ch.hat==='ohelm'?PAPER2:INK;for(const yk of[-.05,.35,.75,1.15]){const sp=1+(yk+.4)*.1;for(const xk of[-1.1,-.75,-.38,0,.38,.75,1.1]){c.beginPath();c.arc(hc[0]+xk*sp*r,hc[1]+yk*r,r*.07,0,7);c.fill()}}}
function sideFlap(c,ch,hc,r,cs,sn,s){const side=Math.abs(cs);if(side<.25||sn<-.2)return;const k=Math.min(1,(side-.25)/.5),bx=-Math.sign(cs),top=hc[1]-r*.42;
 // 귀 앞 옆머리
 c.save();c.globalAlpha=k;c.fillStyle=INK;c.beginPath();c.moveTo(hc[0]+bx*r*.05,top+r*.15);c.lineTo(hc[0]+bx*r*.32,top+r*.1);c.lineTo(hc[0]+bx*r*.26,hc[1]+r*.45);c.lineTo(hc[0]+bx*r*.1,hc[1]+r*.3);c.closePath();c.fill();
 // 뒤쪽 절반을 덮는 드림/목가리개
 const x0=hc[0]+bx*r*.28,x1=hc[0]+bx*r*1.22;
 if(ch.hat==='kabuto'){const q=[[x0,top],[x1,top+r*.05],[x1+bx*r*.35,hc[1]+r*.95],[x0+bx*r*.05,hc[1]+r*1.05]];shape(c,q,'#2b2824',1.3,{raw:1});for(const t of[.3,.55,.8]){line(c,lerp2(q[0],q[3],t),lerp2(q[1],q[2],t),1,{col:PAPER2,n:2})}c.fillStyle=SEAL;c.beginPath();c.arc(lerp(x0,x1,.35),hc[1]+r*.4,1.4*s,0,7);c.fill()}
 else{const off=ch.hat==='ohelm',q=[[x0,top],[x1,top+r*.02],[x1+bx*r*.15,hc[1]+r*1.45],[x0+bx*r*.02,hc[1]+r*1.5]];shape(c,q,off?'#2b2824':'#cfc9bb',1.3,{raw:1});c.fillStyle=off?PAPER2:INK;for(const yk of[-.15,.25,.65,1.05])for(const xk of[.25,.6,.92]){c.beginPath();c.arc(lerp(x0,x1,xk)+bx*r*.08*(yk+.15),hc[1]+yk*r,r*.07,0,7);c.fill()}}
 c.restore()}
function helmFront(c,ch,hc,r,cs,sn,s){const top=hc[1]-r*.35,dome=[];for(let i=0;i<=10;i++){const a=Math.PI+i/10*Math.PI;dome.push([hc[0]+Math.cos(a)*r*1.12,top+Math.sin(a)*r*1.02])}
 if(ch.hat==='kabuto'){shape(c,dome,INK,1.2,{raw:1});for(const k of[-.5,0,.5])line(c,[hc[0]+k*r*.9,top-r*.95],[hc[0]+k*r*1.05,top-1],1,{col:PAPER2,n:2});line(c,[hc[0]-r*1.25,top+1],[hc[0]+r*1.25,top+1],3.2*s,{taper:.2});
  if(sn>-.5){const bx=hc[0]+cs*r*.3;brush(c,smooth([[bx-1.5*s,top-r*.4],[bx-r*.55,top-r*1.3],[bx-r*1.15,top-r*2.4]]),3.4*s,{taper:.6,j:.1});brush(c,smooth([[bx+1.5*s,top-r*.4],[bx+r*.55,top-r*1.3],[bx+r*1.15,top-r*2.4]]),3.4*s,{taper:.6,j:.1});c.fillStyle=SEAL;c.beginPath();c.arc(bx,top-r*.45,2.4*s,0,7);c.fill()}return}
 const off=ch.hat==='ohelm';shape(c,dome,off?INK:'#4a463f',1.2,{raw:1});for(const k of[-.5,0,.5])line(c,[hc[0]+k*r*.9,top-r*.95],[hc[0]+k*r*1.05,top-1],1,{col:PAPER2,n:2});
 line(c,[hc[0]-r*1.3,top+1],[hc[0]+r*1.3,top+1],3.6*s,{taper:.2});line(c,[hc[0]-r*1.2,top],[hc[0]+r*1.2,top],1,{col:PAPER2,taper:.2});
 line(c,[hc[0],top-r*.95],[hc[0],top-r*1.85],2.4*s,{n:2,taper:.3});c.fillStyle=INK;c.beginPath();c.arc(hc[0],top-r*1.05,2.2*s,0,7);c.fill();
 const tc=off?SEAL:INK;for(let i=0;i<(off?9:6);i++){const a=-Math.PI/2+rr(-1.2,1.2);line(c,[hc[0],top-r*1.8],[hc[0]+Math.cos(a)*r*(off?.95:.6)-cs*r*.3,top-r*1.8+Math.abs(Math.sin(a))*r*(off?.9:.5)],(off?2.2:1.6)*s,{col:tc,n:2,taper:.8})}}

function hull(pts){const P_=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];for(const p of P_){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}for(let i=P_.length-1;i>=0;i--){const p=P_[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}up.pop();lo.pop();return lo.concat(up)}
function pushTrail(f,r,clock){(f.trail=f.trail||[]).push({t:clock,...r});while(f.trail.length&&clock-f.trail[0].t>170)f.trail.shift()}
// 미리 그려 둔 칼 궤적 이미지: 휘두른 각도에 가장 가까운 장을 골라 손을 축으로 돌려 붙인다
const SLASH_SPANS=[40,70,100,140,180],SLASH_IN=[.1,.35,.6,.78],SLASH_R=190,SLASH_C=400;
function makeSlash(deg,rin){const cv=document.createElement('canvas');cv.width=cv.height=SLASH_C;const c=cv.getContext('2d');c.translate(SLASH_C/2,SLASH_C/2);
 const sp=deg*Math.PI/180,a0=-sp/2,N=64,R=SLASH_R,Ri=R*rin,inr=u=>R-(R-Ri)*Math.pow(u,1.5),outr=u=>R*(1-.03*(1-u));
 const outer=[],inner=[];for(let k=0;k<=N;k++){const u=k/N,a=a0+sp*u;outer.push([Math.cos(a)*outr(u),Math.sin(a)*outr(u)]);inner.push([Math.cos(a)*inr(u),Math.sin(a)*inr(u)])}
 c.fillStyle=INK;c.beginPath();outer.forEach((p,k)=>k?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));for(let k=N;k>=0;k--)c.lineTo(inner[k][0],inner[k][1]);c.closePath();c.fill();
 c.strokeStyle=PAPER;c.lineCap='round';
 const band=(f0,w,u0,u1)=>{c.lineWidth=w;c.beginPath();let first=true;for(let k=Math.round(u0*N);k<=Math.round(u1*N);k++){const u=k/N,a=a0+sp*u,r=outr(u)-(outr(u)-inr(u))*f0,x=Math.cos(a)*r,y=Math.sin(a)*r;first?c.moveTo(x,y):c.lineTo(x,y);first=false}c.stroke()};
 band(.08,4,.35,.97);band(.3,1.8,.5,.93);band(.55,1.3,.62,.9);
 return cv}
const SLASH_IMG=SLASH_IN.map(r=>SLASH_SPANS.map(d=>makeSlash(d,r)));
function drawTrail(c,f,clock){const LIFE=170,tr=(f.trail||[]).filter(e=>clock-e.t<=LIFE);if(tr.length<2)return;
 for(const[ka,kb,kh] of[['a','b','h'],['a2','b2','h2']]){const sm=tr.filter(e=>e[ka]&&e[kh]);if(sm.length<2)continue;
  const ang=e=>Math.atan2(e[ka][1]-e[kh][1],e[ka][0]-e[kh][0]),rad=(e,k)=>Math.hypot(e[k][0]-e[kh][0],e[k][1]-e[kh][1]);
  let span=0,rmax=0;for(let i=1;i<sm.length;i++)span+=wrap(ang(sm[i])-ang(sm[i-1]));for(const e of sm)rmax=Math.max(rmax,rad(e,ka));
  const asp=Math.abs(span);if(asp<.45||rmax<20)continue;
  const last=sm[sm.length-1],ratio=clamp(rad(last,kb)/Math.max(1,rad(last,ka)),0,.95),ri=SLASH_IN.reduce((b,v,k)=>Math.abs(v-ratio)<Math.abs(SLASH_IN[b]-ratio)?k:b,0);
  const deg=Math.min(180,asp*180/Math.PI),idx=SLASH_SPANS.reduce((b,v,k)=>Math.abs(v-deg)<Math.abs(SLASH_SPANS[b]-deg)?k:b,0),start=ang(sm[0]),sw=SLASH_SPANS[idx]*Math.PI/180,rot=start+Math.sign(span)*sw/2,k_=rmax/SLASH_R;
  c.save();c.globalAlpha=Math.min(1,asp/.9);c.translate(last[kh][0],last[kh][1]);c.rotate(rot);c.scale(k_,k_*Math.sign(span));c.drawImage(SLASH_IMG[ri][idx],-SLASH_C/2,-SLASH_C/2);c.restore()}}
// 섬광 검기(회중 빌보드): 타격을 시작할 때 시작 칼(A)과 끝 칼(B) 위치로 궤적 전체를 감싸는 빌보드를 미리 한 장 만들어 두고,
// 칼이 지나가는 만큼만 드러내 보여 준다(체력 막대가 차오르듯). 앞쪽 가장자리는 곧은 사선, 뒤쪽 가장자리는 톱니처럼 갈라진 빛꼬리
const FX_COL=fl=>fl?[255,255,255]:[255,244,170],fxPer=()=>{try{return opt.fxPer||60}catch(e){return 60}},fxDen=()=>{try{return opt.fxDen??1}catch(e){return 1}},fxO=(k,d)=>{try{return opt[k]??d}catch(e){return d}};
function buildSweep(SM){// SM: 타격 시작→끝 자세를 미리 따라가며 구한 칼 위치들 [{h,a}] (모델 원점 기준)
 const A=SM[0],B=SM[SM.length-1],hA=A.h,tA=A.a,hB=B.h,tB=B.a,sub=(p,q)=>[p[0]-q[0],p[1]-q[1]],len=v=>Math.hypot(v[0],v[1])||1,cr=(u,v)=>u[0]*v[1]-u[1]*v[0],dt=(u,v)=>u[0]*v[0]+u[1]*v[1],nrm=v=>{const l=len(v);return[v[0]/l,v[1]/l]};
 // 바닥 = B 칼날(손→칼끝). w = 바닥에 수직, A 쪽(궤적 쪽)을 향함
 const bd=nrm(sub(tB,hB));let w=[-bd[1],bd[0]];let side=0;for(const e of SM)side+=dt(sub(e.a,hB),w);if(side<0)w=[-w[0],-w[1]];
 // 경계 1: A 칼날 시작(손)과 B 칼날 시작을 잇는 선. 두 손이 거의 같으면 바닥에 수직으로 세운다
 let d1=sub(hA,hB);d1=len(d1)<6||dt(nrm(d1),w)<.15?w:nrm(d1);
 // 경계 2: B 칼끝과 궤적의 최고 높이점(바닥 쪽에서 가장 바깥으로 솟은 칼끝, 이 선 안에 궤적이 모두 든다)을 잇는 선
 let T=tA,bt=-1e9;const d0=sub(tA,tB);for(const e of SM){const v=sub(e.a,tB);if(Math.hypot(v[0],v[1])<len(d0)*.15)continue;const th=-Math.atan2(cr(bd,v),dt(bd,v))*Math.sign(cr(bd,w));if(th>bt){bt=th;T=e.a}}
 let d2=nrm(sub(T,tB));if(dt(d2,w)<.15)d2=w;
 // 윗변: 궤적에서 바닥으로부터 가장 먼 점보다 조금 더 위(바닥과 나란히)
 let D=0;for(const e of SM){D=Math.max(D,dt(sub(e.a,hB),w),dt(sub(e.h,hB),w))}D*=1.08;
 const P1=[hB[0]+d1[0]*D/dt(d1,w),hB[1]+d1[1]*D/dt(d1,w)],P2=[tB[0]+d2[0]*(D-dt(sub(tB,hB),w))/dt(d2,w),tB[1]+d2[1]*(D-dt(sub(tB,hB),w))/dt(d2,w)];
 // 섬광 꼬리: 몸통 위쪽 호(둥근 경계)부터 윗변 너머까지, 손가락처럼 갈라져 끝이 둥글게 솟은 빛줄기 다발
 const at=(t,v)=>{const L=[lerp(hB[0],P1[0],v),lerp(hB[1],P1[1],v)],R=[lerp(tB[0],P2[0],v),lerp(tB[1],P2[1],v)];return[lerp(L[0],R[0],t),lerp(L[1],R[1],t)]},TPOS=fxO('fxTailPos',0),TARC=fxO('fxTailArc',.5),TV=t=>TPOS+TARC*Math.sin(t*Math.PI),TV2=TV;// 안내선 ㄱ(TV): 최종 칼(B 칼날) 양 끝에서 시작해 솟는 꼬리 시작 호(TPOS=0이면 B 칼날에서 바로), 높이 TARC. 안내선 ㄴ(TV2): ㄱ을 따라 함께 움직이는 손가락 뿌리 호
 // 최종 모양: 손바닥처럼 몸통 위로 둥근 끝의 손가락(빛꼬리)이 갈라져 솟는다. 가운데 손가락이 가장 길다
 // 꼬리: 안내선 ㄴ에서 손가락이 갈라져 솟고, 끝은 둥근 지붕 호(가운데가 가장 높음)에 닿는다
 // 손가락 사이는 V자 고개: 이웃한 두 손가락이 안내선 위의 한 점(뿌리)을 함께 쓰고, 옆선이 그 점으로 모인다
 const NF=clamp(Math.round(fxO('fxTailN',5)),1,30),tail=[],L0=Math.max(.25,1.2-TPOS);for(let k=NF-1;k>=0;k--){const b0=k/NF,b1=(k+1)/NF,tm=(b0+b1)/2,hw=(b1-b0)/2*.84,root=TV2(tm),ln=Math.max(TV2(b0),TV2(b1),root)+L0*(.6+.4*Math.sin(tm*Math.PI))+.03*Math.sin(k*2.3+1),tr=Math.min(.12,hw*1.5);
  if(k===NF-1)tail.push(at(b1,TV2(b1)));tail.push(at(tm+hw,ln-tr));for(let q=1;q<10;q++){const a=q/10*Math.PI;tail.push(at(tm+Math.cos(a)*hw,ln-tr+Math.sin(a)*tr))}tail.push(at(tm-hw,ln-tr),at(b0,TV2(b0)))}
 const poly=[hB,tB,...tail];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const q of poly){x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1])}x0-=4;y0-=4;x1+=4;y1+=4;
 const imgs=[0,1].map(fl=>{const cv=document.createElement('canvas'),W=Math.ceil(x1-x0),H=Math.ceil(y1-y0);cv.width=Math.max(2,W*2);cv.height=Math.max(2,H*2);const c=cv.getContext('2d');c.scale(2,2);c.translate(-x0,-y0);const[r,g,b]=FX_COL(fl),rgba=a=>`rgba(${r},${g},${b},${a})`;
  const shp=()=>{c.beginPath();poly.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath()};
  const mid=[(hB[0]+tB[0])/2,(hB[1]+tB[1])/2],gr=c.createLinearGradient(mid[0],mid[1],mid[0]+w[0]*D*1.2,mid[1]+w[1]*D*1.2);gr.addColorStop(0,rgba(1));gr.addColorStop(.5,rgba(.85));gr.addColorStop(1,rgba(.45));
  c.lineJoin='round';shp();c.fillStyle=gr;c.fill();const edgeLine=()=>{c.beginPath();c.moveTo(tB[0],tB[1]);for(let i=2;i<poly.length;i++)c.lineTo(poly[i][0],poly[i][1]);c.lineTo(hB[0],hB[1])};
  // 섬광 방향 줄기: 같은 비율 t의 위쪽 점 → 바닥(B 칼날) 점 방향
  c.save();shp();c.clip();c.lineCap='round';const sc=fl?'rgba(90,135,210,':'rgba(200,130,20,',rn=(k,q)=>{const x=Math.sin(k*12.9898+q*78.233+fl*3.1)*43758.5453;return x-Math.floor(x)},NS=Math.round(30*fxDen());
  for(let k=0;k<NS;k++){const t=rn(k,11),v0=.12+rn(k,12)*.5,v1=v0+.25+rn(k,13)*.5,p0=at(t,v1),p1=at(t,v0),wd=k%3?.9+rn(k,14)*1.4:2.2+rn(k,15)*3,lg=c.createLinearGradient(p0[0],p0[1],p1[0],p1[1]);
   lg.addColorStop(0,k%3?sc+'0)':'rgba(255,255,255,0)');lg.addColorStop(.7,k%3?sc+'.85)':'rgba(255,255,255,1)');lg.addColorStop(1,k%3?sc+'.5)':'rgba(255,255,255,.7)');c.strokeStyle=lg;c.lineWidth=wd;c.beginPath();c.moveTo(p0[0],p0[1]);c.lineTo(p1[0],p1[1]);c.stroke()}c.restore();
  return cv});
 return{imgs,x0,y0,w:x1-x0,h:y1-y0,A,B,cur:A,d1,d2,poly}}
// 합친 빌보드: 매 순간 [빌보드 판에서 지금 칼선 뒤(A 쪽)만 남긴 부분] + [칼날 앞 섬광 머리]를 테두리 하나로 잇는다.
// 칼선은 도형 안쪽에 묻히고, 테두리선은 이 합친 도형에 한 번만 긋는다. (빌보드 모양을 바꿀 때마다 이 합치기를 함께 맞춘다)
function sweepOutline(S,h,a,n,K,d1,d2){const P=S.poly,sd=q=>(q[0]-h[0])*n[0]+(q[1]-h[1])*n[1]-.5,Q=[];// 판을 칼선에서 자른다(Sutherland–Hodgman), 잘린 변의 두 끝을 기억
 let cut=[];for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length],sp=sd(p),sq=sd(q);if(sp>=0)Q.push(p);if((sp>=0)!==(sq>=0)){const t=sp/(sp-sq),x=[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];Q.push(x);cut.push(Q.length-1)}}
 const dx=a[0]-h[0],dy=a[1]-h[1],dl=Math.hypot(dx,dy)||1,ux=dx/dl,uy=dy/dl,M=[h[0]+dx*.5-n[0]*K*1.2,h[1]+dy*.5-n[1]*K*1.2],tq=dl*.28,head=[];
 const bz=(p0,c1,c2,p3)=>{for(let k=1;k<=12;k++){const t=k/12,m=1-t;head.push([m*m*m*p0[0]+3*m*m*t*c1[0]+3*m*t*t*c2[0]+t*t*t*p3[0],m*m*m*p0[1]+3*m*m*t*c1[1]+3*m*t*t*c2[1]+t*t*t*p3[1]])}};
 head.push(h);bz(h,[h[0]-d1[0]*K,h[1]-d1[1]*K],[M[0]-ux*tq,M[1]-uy*tq],M);bz(M,[M[0]+ux*tq,M[1]+uy*tq],[a[0]-d2[0]*K,a[1]-d2[1]*K],a);
 if(cut.length<2)return Q.length>2?{out:Q.concat(head.slice().reverse()),head}:{out:head,head};
 // 잘린 변(칼선 위) 자리에 섬광 머리를 끼운다: 칼선을 따라 손 쪽 끝 → 섬광 머리 → 칼끝 쪽 끝
 const along=q=>(q[0]-h[0])*ux+(q[1]-h[1])*uy,i0=cut[0],i1=cut[1],X0=Q[i0],X1=Q[i1];let out;
 if(i1===i0+1){const seg=along(X0)<=along(X1)?head:head.slice().reverse();out=Q.slice(0,i0+1).concat(seg,Q.slice(i1))}// 나갔다 들어오는 사이가 칼선 쪽 변
 else{const seg=along(X1)<=along(X0)?head:head.slice().reverse();out=Q.concat(seg)}// 처음과 끝 사이(닫는 변)가 칼선 쪽 변
 return{out,head}}
function drawSweep(c,S,Ox,Oy,clock,blade){const te=S.end?clock-S.end:0,HOLD=200,FADE=220;if(te>HOLD+FADE)return false;const A_=te<HOLD?1:1-(te-HOLD)/FADE,fl=((clock/fxPer())|0)%2;
 const h=S.cur.h,a=S.cur.a,dx=a[0]-h[0],dy=a[1]-h[1],dl=Math.hypot(dx,dy)||1,ux=dx/dl,uy=dy/dl;let nx=-uy,ny=ux;const tA=S.A.a;if(nx*(tA[0]-h[0])+ny*(tA[1]-h[1])<0){nx=-nx;ny=-ny}// n: 지금 칼선에서 A 쪽
 const[r,g,b]=FX_COL(fl),K=dl*.07*1.35,d1=S.d1||[nx,ny],d2=S.d2||[nx,ny],O=sweepOutline(S,h,a,[nx,ny],K,d1,d2),path=pts=>{c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath()};
 c.save();const BT=c.getTransform();c.translate(Ox,Oy);c.globalAlpha=A_;if(!fl){const P=S.B.h,k=1.06;c.translate(P[0],P[1]);c.scale(k,k);c.translate(-P[0],-P[1])}// 노란빛 차례엔 합친 빌보드 전체를 조금 크게: 울렁임
 // 섬광 머리 바깥 빛무리(옵션 배율)
 const gk=fxO('fxGlow',1.2);if(gk>1.001){const G=sweepOutline(S,h,a,[nx,ny],K*gk,d1,d2).head;c.beginPath();G.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.fillStyle=`rgba(${r},${g},${b},.35)`;c.fill()}
 // 합친 도형 하나로 오려, 안을 칠한다: 섬광 머리 쪽 밝은 바탕 + 빌보드 판(빛 바탕·빛줄기)
 c.save();path(O.out);c.clip();c.fillStyle=`rgba(${r},${g},${b},1)`;path(O.head);c.fill();c.save();if(blade){// 칼 위 덧그리기: 빌보드 판은 칼날 둘레 좁은 띠 안에서만(섬광 머리는 그대로)
  const T=c.getTransform();c.setTransform(BT);const[b0,b1]=blade,bx=b1[0]-b0[0],by=b1[1]-b0[1],bl_=Math.hypot(bx,by)||1,px=-by/bl_*7,py=bx/bl_*7;c.beginPath();c.moveTo(b0[0]+px,b0[1]+py);c.lineTo(b1[0]+px+bx/bl_*4,b1[1]+py+by/bl_*4);c.lineTo(b1[0]-px+bx/bl_*4,b1[1]-py+by/bl_*4);c.lineTo(b0[0]-px,b0[1]-py);c.closePath();c.clip();c.setTransform(T)}
 c.drawImage(S.imgs[fl],S.x0,S.y0,S.w,S.h);c.restore();c.restore();
 // 테두리선: 합친 도형에 한 번만
 c.strokeStyle=fl?'rgba(100,140,205,.6)':'rgba(200,140,30,.65)';c.lineWidth=1.6;c.lineJoin='round';c.lineCap='round';if(blade){c.beginPath();O.head.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke()}else{path(O.out);c.stroke()}
 c.restore();return true}
// 칼날에 붙은 번쩍임: 휘두르는 동안과 멈춘 직후 칼날을 흰빛·옅은 노랑으로 번갈아 덮는다
function drawBladeGlow(c,f,r,clock){const tr=(f.trail||[]).filter(e=>clock-e.t<=140&&e.a);if(tr.length>=2){const N=tr[tr.length-1],O=tr[0];if(Math.hypot(N.a[0]-O.a[0],N.a[1]-O.a[1])>14)f.glowT=clock}
 if(!r||!r.a||!r.b||f.glowT==null||clock-f.glowT>260)return;const A=1-Math.max(0,clock-f.glowT-120)/140,fl=((clock/fxPer())|0)%2,[R,G,B]=FX_COL(fl);
 c.save();c.lineCap='round';c.globalAlpha=A;for(const[w,a] of[[16,.25],[9,.5],[4.5,.95]]){c.strokeStyle=`rgba(${R},${G},${B},${a})`;c.lineWidth=w;c.beginPath();c.moveTo(r.b[0],r.b[1]);c.lineTo(r.a[0],r.a[1]);c.stroke()}
 c.strokeStyle=fl?'rgba(130,170,225,.7)':'rgba(220,170,50,.7)';c.lineWidth=1;c.beginPath();c.moveTo(r.b[0],r.b[1]);c.lineTo(r.a[0],r.a[1]);c.stroke();c.restore()}
function drawWarrior(c,ch,o){
 const {X,Y,s,ang,pose}=o,cs=Math.cos(ang),sn=Math.sin(ang),sq=VIEW.sq,down=o.down||0;
 const J=(f,r,u)=>[X+(f*cs-r*sn)*s,Y+(f*sn+r*cs)*sq*s-u*s*VIEW.uk];
 const dep=(f,r)=>f*sn+r*cs;
 const L=pose.lean+down*14,dropU=down*30,bendF=u=>L*(u-46)/60;
 const H0=48-dropU,uC=84-dropU,uN=95-dropU,uH=106-dropU,pal=(ch.pal||ARM2[ch.armor]);
 const sh=[J(bendF(uC+4),16,uC+4),J(bendF(uC+4),-16,uC+4)],hip=[J(0,8,H0),J(0,-8,H0)];
 const spread=down?12:1,rb=ch.robot&&!down,lg=rb?clamp(pose.lean,-10,26):0,fF=rb?[20+lg*1.15,-18-Math.max(0,lg)*.7]:[18,-17],fR=rb?[-8,9]:[-7,8];
 const legs=[0,1].map(i=>{const footF=fF[i]*spread/(down?6:1),foot=J(footF,fR[i],0),knee=rb?J(footF*.62+3,fR[i]*1.15,(i===0?26-Math.max(0,lg)*.35:22)):J(footF*.72+2,fR[i]*1.2,24-dropU*.5);return{hip:hip[i],knee,foot,d:dep(footF,fR[i])}}).sort((a,b)=>a.d-b.d);
 c.save();if(o.ghost)c.globalAlpha=.4;
 if(!o.noShadow){const gs=[];for(let i=0;i<14;i++){const a=i/14*6.283;gs.push([X+Math.cos(a)*29*s,Y+Math.sin(a)*12*s])}hatch(c,gs,.15,3,1.1,{skip:.08})}
 const limb=(a,b,w0,w1,f)=>{const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy)||1,nx=-dy/d,ny=dx/d;shape(c,[[a[0]+nx*w0*s,a[1]+ny*w0*s],[b[0]+nx*w1*s,b[1]+ny*w1*s],[b[0]-nx*w1*s,b[1]-ny*w1*s],[a[0]-nx*w0*s,a[1]-ny*w0*s]],f,1.8*Math.max(s,1)**.5,{sm:2,j:.3})};
 for(const l of legs){if(ch.robot){c.fillStyle=INK;c.beginPath();c.arc(l.knee[0],l.knee[1],6*s,0,7);c.fill()}if(ch.robot){limb(l.hip,l.knee,7.5,5.5,pal.leg);limb(l.knee,l.foot,5.5,4,pal.leg);const sh_=[lerp2(l.knee,l.foot,.15),lerp2(l.knee,l.foot,.75)];shape(c,[[sh_[0][0]-6*s,sh_[0][1]],[sh_[0][0]+6*s,sh_[0][1]],[sh_[1][0]+3*s,sh_[1][1]],[sh_[1][0]-3*s,sh_[1][1]]],pal.coat,1.4,{raw:1});shape(c,[[l.foot[0]-5*s,l.foot[1]-3*s],[l.foot[0]+cs*14*s,l.foot[1]+sn*7*s+1*s],[l.foot[0]+4*s,l.foot[1]+3*s]],'#4a463f',1.3,{raw:1})}else{limb(l.hip,l.knee,9,7.5,pal.leg);limb(l.knee,l.foot,7.5,5.5,pal.leg);line(c,lerp2(l.knee,l.foot,.5),l.foot,8*s,{taper:.1})}if(ch.robot){c.fillStyle='#4a463f';c.beginPath();c.arc(l.knee[0],l.knee[1],3.4*s,0,7);c.fill()}if(!ch.robot)line(c,l.foot,[l.foot[0]+cs*9*s,l.foot[1]+sn*5*s],7*s,{taper:.2})}
 const d=norm(pose.d),hd=[pose.h[0]+bendF(pose.h[2]),pose.h[1],pose.h[2]-dropU];
 const whip=clamp((pose.lean-3)/12,0,1),wind=clamp(-pose.lean/4,0,1);
 let off,dL=null;
 if(ch.weapon==='dual'){off=[bendF(uC-26)+16,-13,uC-26];dL=norm([lerp(lerp(.8,.25,wind),1,whip),lerp(-.2,-.1,whip),lerp(lerp(.5,.9,wind),-.25,whip)])}
 else if(ch.robot){const bk=clamp(pose.lean/20,0,1);off=[bendF(uC-20)-6-bk*16,-20-bk*10,uC-22+bk*30]}
 else off=[hd[0]-d[0]*14,hd[1]-d[1]*14,hd[2]-d[2]*14];
 const len=ch.weapon==='flail'?74:ch.weapon==='dual'?80:96;
 const tip=[hd[0]+d[0]*len,hd[1]+d[1]*len,hd[2]+d[2]*len];
 const back=dep(tip[0],tip[1])<-1;
 let flailHead=null;
 const blade=(from,dir,ln,hl)=>{const at=k=>J(from[0]+dir[0]*k,from[1]+dir[1]*k,from[2]+dir[2]*k);const pm=at(-hl),gd=at(6),tp=at(ln);const n=[-(tp[1]-gd[1]),tp[0]-gd[0]],nl=Math.hypot(...n)||1;const mid=[(gd[0]+tp[0])/2+n[0]/nl*3*s,(gd[1]+tp[1])/2+n[1]/nl*3*s];const bl=smooth([gd,mid,tp],2);brush(c,bl,5.2*s,{taper:.5,j:.1});brush(c,bl,2.4*s,{taper:.55,j:.1,col:PAPER});line(c,pm,gd,5*s,{taper:.1,j:.1});const gx=-(gd[1]-pm[1]),gy=gd[0]-pm[0],gl=Math.hypot(gx,gy)||1;line(c,[gd[0]+gx/gl*6*s,gd[1]+gy/gl*6*s],[gd[0]-gx/gl*6*s,gd[1]-gy/gl*6*s],3.5*s,{taper:.1,j:.1})};
 const drawWeapon=()=>{
  if(ch.robot){const at=k=>J(hd[0]+d[0]*k,hd[1]+d[1]*k,hd[2]+d[2]*k),pm=at(-10),gd=at(5),tp=at(118);line(c,gd,tp,3.4*s,{taper:.85,j:.05});line(c,gd,tp,1.3*s,{taper:.9,j:.05,col:PAPER});line(c,pm,gd,4.2*s,{taper:.1,j:.1});const g=at(3);c.fillStyle=INK;c.beginPath();c.ellipse(g[0],g[1],6*s,4*s,0,0,7);c.fill();c.strokeStyle=PAPER2;c.lineWidth=1;c.stroke()}
  else if(ch.weapon==='katana')blade(hd,d,96,18);
  else if(ch.weapon==='dual'){blade(hd,d,80,8);blade(off,dL,72,8)}
  else{const a=J(off[0]-d[0]*8,off[1]-d[1]*8,off[2]-d[2]*8),b=J(...tip);line(c,a,b,6*s,{taper:.1,j:.2});line(c,a,b,1.6*s,{col:PAPER2,taper:.3,j:.2});
   c.fillStyle=INK;for(const k of[.25,.97]){const p=lerp2(a,b,k);c.beginPath();c.arc(p[0],p[1],3.8*s,0,7);c.fill()}
   const sp=o.spin&&whip<.5,ta=(o.t||0)/90,fd=sp?norm([Math.cos(ta),Math.sin(ta),.15]):norm([lerp(d[0]*.3,d[0],whip),lerp(d[1]*.3,d[1],whip),lerp(-1,d[2],whip)]);
   if(sp){const ring=[];for(let k=0;k<=16;k++){const q=ta-k*.28;ring.push(J(tip[0]+Math.cos(q)*34,tip[1]+Math.sin(q)*34,tip[2]+5))}brush(c,ring,2.2*s,{taper:.9,j:.3})}
   for(let k=1;k<=3;k++){const p=J(tip[0]+fd[0]*k*1.7,tip[1]+fd[1]*k*1.7,tip[2]+fd[2]*k*1.7);c.beginPath();c.arc(p[0],p[1],1.8*s,0,7);c.fill()}
   const c0=[tip[0]+fd[0]*6,tip[1]+fd[1]*6,tip[2]+fd[2]*6],fs=J(...c0),fe=J(c0[0]+fd[0]*28,c0[1]+fd[1]*28,c0[2]+fd[2]*28);flailHead=[fe,fs];line(c,fs,fe,7.5*s,{taper:.1,j:.2});for(let k=0;k<4;k++){const p=lerp2(fs,fe,.2+k*.22);c.beginPath();c.arc(p[0],p[1],3*s,0,7);c.fill()}}};
 const isFar=sg=>sn<-.25||sg*cs<-.4;
 const drawArms=far=>{const ha=J(...hd),hb=J(...off);for(const[a,b,sg] of[[sh[0],ha,1],[sh[1],hb,-1]]){if(isFar(sg)!==far)continue;const m=[(a[0]+b[0])/2+sg*sn*5*s,(a[1]+b[1])/2+7*s];limb(a,m,6.5,6.5,pal.coat);limb(m,b,7,6,pal.sleeve);shape(c,[[b[0]-4*s,b[1]-4*s],[b[0]+4*s,b[1]-4*s],[b[0]+4*s,b[1]+4*s],[b[0]-4*s,b[1]+4*s]],PAPER,1.4)}};
 if(back)drawWeapon();drawArms(true);
 const hc=J(bendF(uH),0,uH),hr=11.5*s;
 const pm=ch.robot?1.75:1,pad=sg=>{const q=[J(bendF(uC+6+(pm-1)*8),sg*12,uC+6+(pm-1)*8),J(bendF(uC+6),sg*22*pm,uC+3+(pm-1)*6),J(bendF(uC-12),sg*24*pm,uC-13-(pm-1)*10),J(bendF(uC-10),sg*15,uC-10-(pm-1)*8)];shape(c,q,ch.armor==='japan'?'#3b3732':pal.coat,1.6,ch.robot?{sm:2}:{raw:1});if(ch.robot){line(c,lerp2(q[0],q[3],.5),lerp2(q[1],q[2],.5),1.4,{col:pal.trim,n:2});c.fillStyle=INK;const m=lerp2(lerp2(q[0],q[1],.6),lerp2(q[3],q[2],.6),.5);c.beginPath();c.arc(m[0],m[1],1.8*s,0,7);c.fill()}if(ch.armor==='japan')for(let k=1;k<3;k++)line(c,lerp2(q[0],q[3],k/3),lerp2(q[1],q[2],k/3),1,{col:PAPER2,n:2})};for(const sg of[1,-1])if(isFar(sg))pad(sg);
 if(!ch.robot&&sn>=-.2)helmBack(c,ch,hc,hr);
 // 몸통: 앞뒤 두께가 있는 단면을 층마다 두고, 보는 각도에 맞춰 외곽선을 잡는다
 const lvl=u=>{const w0=H0+8,s0=uC+4;if(u>=w0){const k=clamp((u-w0)/(s0-w0),0,1);return{rw:lerp(12,16,k),df:lerp(7,8.5,Math.sin(k*Math.PI)*.6+k*.4),fo:bendF(u)}}const k=clamp((w0-u)/36,0,1);return{rw:lerp(12,18,k),df:lerp(7,11,k),fo:lerp(bendF(w0),-3,k)}};
 const ring=(u,n=14)=>{const v=lvl(u),a=[];for(let k=0;k<n;k++){const t=k/n*6.2832;a.push(J(v.fo+Math.cos(t)*v.df,Math.sin(t)*v.rw,u))}return a};
 const vis=(u,o=0,n=24)=>{const v=lvl(u),a=[];for(let k=0;k<=n;k++){const t=k/n*6.2832,ny=Math.cos(t)*sn+Math.sin(t)*cs;if(ny>o)a.push(J(v.fo+Math.cos(t)*v.df,Math.sin(t)*v.rw,u));else if(a.length>1)break;else a.length=0}return a};
 const onBody=(u,t)=>{const v=lvl(u);return{p:J(v.fo+Math.cos(t)*v.df,Math.sin(t)*v.rw,u),ny:Math.cos(t)*sn+Math.sin(t)*cs}};
 const drawCape=()=>{const cc=ch.cape||'#3b3732',b0=J(bendF(uC+6)-7,15,uC+6),b1=J(bendF(uC+6)-7,-15,uC+6),fl=Math.sin((o.t||0)/420)*3,bl=clamp(pose.lean/22,-.3,1),tr=34+bl*34,lift=bl*34,fl2=Math.sin((o.t||0)/260)*6,e0=J(-tr+fl,30,lift+2+fl2),e1=J(-tr-fl-6,-30,lift+10-fl2),m0=J(-tr-14,0,lift+16+fl2*1.4);shape(c,[b0,b1,e1,m0,e0],cc,1.8,{sm:1});if(sn<-.2){for(const k of[-.35,0,.35]){const t=lerp2(b0,b1,.5+k),bt=lerp2(lerp2(e0,e1,.5+k),m0,.25);line(c,lerp2(t,bt,.15),bt,1.1,{col:PAPER2,n:3})}}};
 if(ch.robot&&sn>=-.2)drawCape();
 shape(c,hull([...ring(H0+8),...ring(H0-10),...ring(H0-28)]),pal.coat,2,{sm:1});
 shape(c,hull([...ring(uC+4),...ring((uC+H0)/2+4),...ring(H0+8)]),pal.coat,2.4,{sm:1});
 if(ch.armor==='japan'){for(let u=H0+12;u<uC;u+=7){const a=vis(u,.05);if(a.length>1)brush(c,a,1.3,{taper:.3,j:.2})}for(let u=H0-4;u>H0-28;u-=7){const a=vis(u,.05);if(a.length>1)brush(c,a,1.2,{taper:.3,j:.2})}
  for(const t of[-.5,.5]){const a=onBody(H0+4,t),b=onBody(H0-28,t);if(a.ny>.1)line(c,a.p,b.p,1.4,{n:2})}
  c.fillStyle=SEAL;for(let u=H0+15;u<uC;u+=7)for(const t of[-.6,0,.6]){const q=onBody(u,t);if(q.ny>.15){c.beginPath();c.arc(q.p[0],q.p[1],1.1*s,0,7);c.fill()}}}
 else if(ch.robot){for(const u of[H0+20,uC-6])line(c,onBody(u,-1.4).p,onBody(u,1.4).p,1.3,{n:3});for(const t of[-.55,.55]){const a=onBody(uC,t),b=onBody(H0+10,t);if(a.ny>.1)line(c,a.p,b.p,1.2,{n:2})}const g=onBody(uC-12,0);if(g.ny>.15){c.fillStyle=pal.trim===INK?'#4a463f':pal.trim;c.beginPath();c.moveTo(g.p[0],g.p[1]-5*s);c.lineTo(g.p[0]+6*s,g.p[1]);c.lineTo(g.p[0],g.p[1]+5*s);c.lineTo(g.p[0]-6*s,g.p[1]);c.closePath();c.fill()}for(let u=H0-4;u>H0-28;u-=8){const a=vis(u,.05);if(a.length>1)brush(c,a,1.1,{taper:.3,j:.2})}}
 else{c.fillStyle=pal.stud;for(let u=H0-22;u<uC;u+=7)for(let k=0;k<14;k++){const q=onBody(u,k/14*6.2832+(u%2)*.2);if(q.ny>.18){c.beginPath();c.arc(q.p[0],q.p[1],1.25*s,0,7);c.fill()}}
  if(sn>.05){const a=onBody(uN-4,0),b=onBody(H0-28,0);line(c,a.p,b.p,1.4*s,{col:ch.armor==='officer'?PAPER2:INK,n:4})}}
 {const bl=vis(H0+8,0);if(bl.length>1)brush(c,bl,4.5*s,{taper:.2,col:pal.trim,j:.1})}
 for(const sg of[1,-1])if(!isFar(sg))pad(sg);
 if(ch.robot&&sn<-.2)drawCape();
 line(c,J(bendF(uN),0,uN-2),hc,10*s,{taper:0,col:PAPER2});
 if(ch.robot)robotHead(c,ch,hc,hr,cs,sn,s);else{drawHeadSmall(c,{...ch,hat:'none',noHair:true},hc,hr,cs,sn,s,down,o.hurt);
 if(sn<-.2)helmBack(c,ch,hc,hr);
 sideFlap(c,ch,hc,hr,cs,sn,s);
 helmFront(c,ch,hc,hr,cs,sn,s)}
 drawArms(false);if(!back)drawWeapon();
 c.restore();
 const at=(o,dv,k)=>J(o[0]+dv[0]*k,o[1]+dv[1]*k,o[2]+dv[2]*k);return flailHead?{a:flailHead[0],b:flailHead[1],h:J(...hd)}:ch.robot?{a:J(hd[0]+d[0]*118,hd[1]+d[1]*118,hd[2]+d[2]*118),b:J(hd[0]+d[0]*7,hd[1]+d[1]*7,hd[2]+d[2]*7),h:J(...hd)}:{a:J(...tip),b:at(hd,d,7),h:J(...hd),a2:dL?at(off,dL,72):null,b2:dL?at(off,dL,7):null,h2:dL?J(...off):null}
}

Object.assign(ARM2,{
 r_cheol:{coat:'#c9c3b5',leg:'#8d877c',stud:INK,trim:SEAL,sleeve:'#8d877c'},
 r_seorin:{coat:'#ece7da',leg:'#b9b2a3',stud:'#6d675e',trim:SEAL,sleeve:'#b9b2a3'},
 r_kurobe:{coat:'#2b2824',leg:'#3b3732',stud:PAPER2,trim:SEAL,sleeve:'#4a463f'},
 r_yuntae:{coat:'#8d877c',leg:'#cfc9bb',stud:INK,trim:INK,sleeve:'#6d675e'}});
const CAPES={cheol:'#3b4a6b',seorin:'#7a2a20',kurobe:'#4a2a4f',yuntae:'#3b3732'};
const RSTRIKE=[
 {wind:{h:[-6,6,132],d:[-.6,.15,.78],lean:-9},hit:{h:[44,0,58],d:[.88,0,-.45],lean:24}},
 {wind:{h:[-12,10,84],d:[.95,.05,.12],lean:-7},hit:{h:[60,0,80],d:[1,0,.02],lean:26}},
 {wind:{h:[-10,-14,42],d:[-.6,-.45,-.66],lean:-6},hit:{h:[46,10,98],d:[.62,.5,.6],lean:16}}];
const robotCh=ch=>ch._robot||(ch._robot={...ch,robot:true,cape:CAPES[ch.id],armor:'r_'+ch.id,hat:'rhelm',weapon:'katana',beard:'none',flail:false,sig:-1});
function robotHead(c,ch,hc,r,cs,sn,s){const pal=(ch.pal||ARM2[ch.armor]),R=r*1.15;
 // 목 뒤 장갑판
 const dome=[];for(let i=0;i<=14;i++){const a=Math.PI+i/14*Math.PI;dome.push([hc[0]+Math.cos(a)*R,hc[1]-r*.1+Math.sin(a)*R*1.05])}
 const box=[...dome,[hc[0]+R*.92,hc[1]+r*.75],[hc[0]+R*.4,hc[1]+r*1.05],[hc[0]-R*.4,hc[1]+r*1.05],[hc[0]-R*.92,hc[1]+r*.75]];
 shape(c,box,pal.coat,2,{raw:1});
 // 판 이음선
 line(c,[hc[0]-R*.95,hc[1]+r*.05],[hc[0]+R*.95,hc[1]+r*.05],1.1*s,{n:3,col:INK});
 if(sn>-.3){const f=Math.max(0,sn),ex=hc[0]+cs*r*.38,w=R*(.55+.35*f);
  shape(c,[[ex-w,hc[1]-r*.32],[ex+w,hc[1]-r*.32],[ex+w*.9,hc[1]+r*.12],[ex-w*.9,hc[1]+r*.12]],INK,1,{raw:1});
  c.fillStyle=SEAL;c.fillRect(ex-w*.8,hc[1]-r*.14,w*1.6,Math.max(1.2,r*.12));
  line(c,[ex,hc[1]+r*.25],[ex,hc[1]+r*.95],1.2*s,{n:2,col:INK})}
 else{for(let i=-1;i<=1;i++)line(c,[hc[0]+i*R*.4,hc[1]-r*.8],[hc[0]+i*R*.45,hc[1]+r*.9],1,{col:pal.stud,n:2})}
 // 귀 쪽 원판
 if(Math.abs(cs)>.35){const ex=hc[0]-Math.sign(cs)*R*.15;c.fillStyle=INK;c.beginPath();c.arc(ex,hc[1]+r*.2,r*.32,0,7);c.fill();c.fillStyle=pal.coat;c.beginPath();c.arc(ex,hc[1]+r*.2,r*.17,0,7);c.fill()}
 // 정수리 지느러미
 shape(c,[[hc[0]-r*.12,hc[1]-R*1.0],[hc[0]+r*.12,hc[1]-R*1.0],[hc[0]+r*.05-cs*r*.25,hc[1]-R*1.75],[hc[0]-r*.05-cs*r*.25,hc[1]-R*1.75]],pal.trim===INK?'#4a463f':pal.trim,1.2,{raw:1})}

