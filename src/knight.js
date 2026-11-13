// ═══ 판금 기사: 관절 뼈대 + 부위별 판 조각 (16세기 르네상스 판금 구조 참고) ═══
const vadd=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],vsub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],vmul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],vdot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],vlen=a=>Math.hypot(a[0],a[1],a[2]),vlerp=(a,b,k)=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2],b[2],k)];
const vcross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
// 두 마디 관절 풀이: 시작점 P에서 끝점 F까지, 길이 a·b, 굽는 방향 bend
function ik2(P,F,a,b,bend){const v=vsub(F,P),l=vlen(v)||1,u=vmul(v,1/l),d=Math.min(l,a+b-.01),x=(d*d+a*a-b*b)/(2*d),h=Math.sqrt(Math.max(0,a*a-x*x));let bd=vsub(bend,vmul(u,vdot(bend,u)));const bl=vlen(bd)||1;bd=vmul(bd,1/bl);return vadd(vadd(P,vmul(u,x)),vmul(bd,h))}
const KDEF={feet:[[16,-8],[-16,9]],crouch:0,elb:0,nod:0,hyaw:0,hroll:0,off:[14,-9,72]};
let RENDER_LQ=false,PIECE_CAP=null,HINTS={};const HMC=new Map();
// 붓 결 무늬: 색마다 세 가지를 한 번만 그려 두고, 판 모양으로 오려 붙인다
const TEX=new Map(),TILE=192;
function brushTile(fill,v){const key=fill+'|'+v;let t=TEX.get(key);if(t)return t;const cv=document.createElement('canvas');cv.width=cv.height=TILE;const g=cv.getContext('2d'),sv=seed;seed=900+v*7919+(parseInt(fill.slice(1),16)%9973);
 const dk=hexMix(hexMix(fill,'#2a3550',.35),INK,.35),lt=hexMix(fill,'#ffffff',.65),md=hexMix(fill,dk,.5),st=[];
 for(let i=0;i<64;i++){const pk=R();st.push({x:rr(0,TILE),y:rr(0,TILE),l:rr(30,110),bd:rr(-.12,.12),col:pk<.42?dk:pk<.78?lt:md,a:rr(.25,.65),w:rr(1.2,4.4),hi:false})}
 for(let i=0;i<16;i++)st.push({x:rr(0,TILE),y:rr(0,TILE),l:rr(15,55),bd:0,col:'#ffffff',a:.7,w:rr(.6,1.4),hi:true});
 for(const q of st)for(const ox of[-TILE,0,TILE])for(const oy of[-TILE,0,TILE]){const x=q.x+ox,y=q.y+oy;if(x+q.l<0||x-q.l>TILE||y<-6||y>TILE+6)continue;g.globalAlpha=q.a;brush(g,q.hi?[[x,y],[x+q.l,y]]:[[x-q.l/2,y],[x,y+q.l*q.bd],[x+q.l/2,y]],q.w,{col:q.col,taper:q.hi?.95:.85,j:q.hi?.5:1.1})}
 seed=sv;t={cv};TEX.set(key,t);return t}
function hexMix(a,b,k){const ck=a+b+k;if(HMC.has(ck))return HMC.get(ck);const r=hexMix0(a,b,k);HMC.set(ck,r);return r}
function hexMix0(a,b,k){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),A=p(a),B=p(b);return'#'+A.map((v,i)=>Math.round(lerp(v,B[i],k)).toString(16).padStart(2,'0')).join('')}

function drawKnight(c,ch,o){
 // 투구 부품 조립에서 기존 투구 형태(뾰족·면갑·통·챙)를 고르면 그 형태의 몸체를 쓰고, 면갑 올림/내림과 장식만 부품 값으로 바꾼다
 if(ch.helm==='kit'&&ch.hkit&&ch.hkit.form&&ch.hkit.form!=='parts'){const K=ch.hkit,up=K.visor==='up';ch={...ch,helm:{peak:up?'peakup':'peak',closed:up?'open':'closed',great:'great',kettle:'kettle',jin:'jin',jin2:'jin'}[K.form]||'closed',jinUp:up,jinV2:K.form==='jin2',hcrest:{ridge:'comb',comb:'comb',plume:'plume',horns:'horns'}[K.crest]||'none',hcol:K.colors||null,vz:{design:K.vdesign||'pointed',slit:K.slit||'single',breaths:K.breaths||'holes',ridge:K.vridge!==false},hkit:null}}
 const{X,Y,s,ang,pose}=o,cs=Math.cos(ang),sn=Math.sin(ang),sq=VIEW.sq,uk=VIEW.uk,down=o.down||0,pal=ch.pal,lw=1.7*Math.max(s,1)**.5;
 const Jp=v=>[X+(v[0]*cs-v[1]*sn)*s,Y+(v[0]*sn+v[1]*cs)*sq*s-v[2]*s*uk],dep=v=>v[0]*sn+v[1]*cs;
 const HPAL=ch.hcol&&ch.hcol.main?{...pal,steel:ch.hcol.main,shade:ch.hcol.shade||hexMix(ch.hcol.main,INK,.35),hi:hexMix(ch.hcol.main,'#ffffff',.45),trim:ch.hcol.trim||pal.trim}:pal;// 투구만 쓰는 색
 const feet=pose.feet||KDEF.feet,crouch=pose.crouch??0,elb=pose.elb??0,nod=pose.nod??0;
 const bd=ch.body||{},bT=bd.torso??1,LM=bd.limb??1,bL=bd.leg??1,bS=bd.shoulder??1,hs=bd.head??1,bN=bd.neck??1,legDrop=48-48*bL;
 const L=pose.lean+down*14,drop=down*30+crouch,H0=48*bL-drop,bend=u=>L*(u-H0)/60,T=u=>[bend(u),0,u];
 const JA=ch.armor==='jin',COAT=ch.coat&&!JA,uS=H0+40,psz=ch.psize||1,glove=pal.glove||pal.steel,beltC=pal.belt||pal.leather,sheathC=pal.sheath||pal.leather;
 // ─ 뼈대 ─
 const legs=[0,1].map(i=>{const side=i?1:-1,Hp=[0,side*9*bT,H0],F=[feet[i][0],feet[i][1],0],K=ik2(Hp,F,25.5*bL,25.5*bL,[1,side*.45,0]),toe=norm([1,side*.32,0]),A=vadd(F,[0,0,5]);return{side,Hp,K,F,A,toe}});
 const hd=[pose.h[0]+L*(pose.h[2]-48)/60,pose.h[1],pose.h[2]-drop-legDrop],d=norm(pose.d),off=vsub(hd,vmul(d,10));
 const arms=[0,1].map(i=>{const side=i?1:-1,S=[bend(uS),side*16*bS,uS],Hn=i?hd:off,E=ik2(S,Hn,23,22,[-.35,side*(.7+elb*.8),-.8]);return{side,S,E,Hn}});
 // 고개: 좌우 돌림(yaw) → 숙임(pitch) → 갸웃(roll)
 const nA=nod*.6,hyw=pose.hyaw??0,hrl=pose.hroll??0,head=vadd(T(uS+18*bN),[nod*5,0,-nod*3]);
 const cP=Math.cos(nA),sP=Math.sin(nA),cY=Math.cos(hyw),sY=Math.sin(hyw),cR=Math.cos(hrl),sR=Math.sin(hrl);
 const HR=v=>{const[f,r,u]=v,r1=r*cR-u*sR,u1=r*sR+u*cR,f2=f*cP+u1*sP,u2=u1*cP-f*sP;return[f2*cY-r1*sY,f2*sY+r1*cY,u2]};
 const HL=v=>vadd(head,HR(vmul(v,hs))),faces=n=>dep(HR(n))>.08;
 const LH=(k,b,a,r,reg)=>(HINTS.limbs||(HINTS.limbs=[])).push({k,b:Jp(b),a:Jp(a),r:r*s,reg:!!reg});
 const KIT=ch.helm==='kit'&&ch.hkit?ch.hkit:null,KOPEN=!!KIT&&(['open','nasal','cheek'].includes(KIT.face)||(['visor','mask'].includes(KIT.face)&&KIT.visor==='up'));
 const HW=ch.hwear||'helm',HT=ch.helm,BAREF=HW!=='helm'||HT==='kettle'||HT==='jin'||(HW==='helm'&&KOPEN),FACEV=BAREF||HT==='open'||HT==='peakup',HE={Rf:9.2,Rr:8.2,Ru:10.8,cf:-.6,cu:-1.2};
 const FPb=(r,u,dz=0)=>{const x=Math.sqrt(Math.max(0,1-(r/HE.Rr)**2-((u-HE.cu)/HE.Ru)**2));return[HE.cf+x*HE.Rf+dz,r,u]},FPo=(r,u,dz=0)=>[10.4+dz,r,u],FP=BAREF?FPb:FPo;
 const FL=BAREF?{eU:0,nU:-3.6,mU:-6.4,cU:-11,eR:3.1,wR:7.4}:{eU:-.5,nU:-2.9,mU:-5,cU:-8.4,eR:3,wR:5.6};
 const fvis=(r,u)=>{if(!BAREF)return faces([1,0,0]);const q=FPb(r,u);return dep(HR([(q[0]-HE.cf)/HE.Rf**2,r/HE.Rr**2,(u-HE.cu)/HE.Ru**2]))>0};
 if(BAREF)HINTS.face={vis:dep(HR([1,0,0])),eL:Jp(HL(FPb(-4.5,1.5))),eM:Jp(HL(FPb(0,1.2))),eR:Jp(HL(FPb(4.5,1.5))),n0:Jp(HL(FPb(0,-1))),n1:Jp(HL(FPb(0,-5)))};else
 HINTS.face={vis:dep(HR([1,0,0])),eL:Jp(HL([13.5,-5.5,3.5])),eM:Jp(HL([15,0,3])),eR:Jp(HL([13.5,5.5,3.5])),n0:Jp(HL([15.5,0,0])),n1:Jp(HL([14,0,-7]))};
 {const ps=hs*s,hp={eyes:[],visor:null,ant:[],fin:null,r:1.1*ps};if(FACEV)hp.eyes.push(Jp(HL(FP(-FL.eR,FL.eU))),Jp(HL(FP(FL.eR,FL.eU))));else if(ch.helm==='custom'){}else if(KIT){if(KIT.slit&&KIT.slit!=='none')hp.visor=[Jp(HL([8.6,-7,2.5])),Jp(HL([11,0,2.5])),Jp(HL([8.6,7,2.5]))]}else if(ch.helm==='great')hp.visor=[Jp(HL([7.2,-7.5,2.6])),Jp(HL([10.6,0,2.6])),Jp(HL([7.2,7.5,2.6]))];else if(ch.helm==='peak')hp.visor=[Jp(HL([10.5,-9,4.6])),Jp(HL([16.6,0,5.2])),Jp(HL([10.5,9,4.6]))];else hp.visor=[Jp(HL([9.6,-8.4,2.2])),Jp(HL([13.6,0,2.8])),Jp(HL([9.6,8.4,2.2]))];
  hp.fin=ch.helm==='peak'?null:null;HINTS.hp=hp}
 // ─ 그리기 도구 ─
 const path=p=>{c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath()};
 const BR=ch.paint==='brush'&&!o.ghost,INKB='#2c3036',LQ=RENDER_LQ;
 // 붓터치: 형태 안에 마른 붓 긁힘, 밖은 끊기는 붓선
 const paintTex=(p,fill,ang)=>{const b=bbox(p),A=ang??-1.15,t=brushTile(fill,(R()*3)|0),ox=rr(0,TILE),oy=rr(0,TILE);if(!t.pat)t.pat=c.createPattern(t.cv,'repeat');
  const kk=Math.max(.7,s*.55),D=Math.hypot(b.w,b.h)/kk/2+4;c.save();c.translate((b.x0+b.x1)/2,(b.y0+b.y1)/2);c.rotate(A);c.scale(kk,kk);c.translate(ox,oy);c.fillStyle=t.pat;c.fillRect(-ox-D,-oy-D,D*2,D*2);c.restore()};
 const roughLine=(p,w)=>{const ga=c.globalAlpha,pts=[...p,p[0]],segs=[];for(let i=0;i<pts.length-1;i+=3)segs.push({i,e:Math.min(pts.length-1,i+3),skip:R()<.14,a:rr(.6,.95),w:rr(.9,2),jx:rr(-.8,.8),jy:rr(-.8,.8)});
  c.strokeStyle=INKB;c.lineCap='round';c.lineJoin='round';
  if(LQ){c.globalAlpha=ga*.85;c.lineWidth=w*1.3;c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke()}
  else for(const g of segs){if(g.skip)continue;c.globalAlpha=ga*g.a;c.lineWidth=w*g.w;c.beginPath();c.moveTo(pts[g.i][0]+g.jx,pts[g.i][1]+g.jy);for(let j=g.i+1;j<=g.e;j++)c.lineTo(pts[j][0],pts[j][1]);c.stroke()}
  c.globalAlpha=ga};
 const solid=(poly,fill,shadeFn,o2={})=>{const p=o2.raw?poly:smooth(poly,1,true);path(p);c.fillStyle=fill;c.fill();if(shadeFn||BR){c.save();path(p);c.clip();if(shadeFn)shadeFn(p);if(BR)paintTex(p,fill,o2.ang);c.restore()}if(o2.line!==false&&ch.paint!=='plain'){if(BR){if(o2.edge){const ga=c.globalAlpha;c.globalAlpha=ga*.7;c.strokeStyle=o2.edge;c.lineWidth=1.2;c.lineJoin='round';path(p);c.stroke();c.globalAlpha=ga}}else brush(c,[...p,p[0]],o2.w||lw,{taper:.3,j:.25})}};
 const bbox=p=>{let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const q of p){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}return{x0,x1,y0,y1,w:x1-x0,h:y1-y0}};
 const sideShade=(sh,hi)=>BR?p=>{const b=bbox(p),ga=c.globalAlpha,st=[];for(let i=0;i<5;i++)st.push([b.x0+b.w*rr(.58,.98),rr(-4,4),rr(-5,5),b.w*rr(.16,.32)]);const hs_=[];for(let i=0;i<2;i++)hs_.push([b.x0+b.w*rr(.12,.32),rr(-2,2),Math.max(1.4,b.w*rr(.05,.1))]);
  c.lineCap='round';c.strokeStyle=hexMix(sh,'#2a3550',.25);c.globalAlpha=ga*.9;for(const[x,d1,d2,w] of st.slice(0,LQ?2:5)){c.lineWidth=w;c.beginPath();c.moveTo(x,b.y0-3);c.quadraticCurveTo(x+d1,b.y0+b.h/2,x+d2,b.y1+3);c.stroke()}
  if(hi){c.strokeStyle=hi;c.globalAlpha=ga*.85;for(const[x,d1,w] of hs_){c.lineWidth=w;c.beginPath();c.moveTo(x,b.y0);c.lineTo(x+d1,b.y1);c.stroke()}}c.globalAlpha=ga}:p=>{const b=bbox(p);c.fillStyle=sh;c.fillRect(b.x0+b.w*.6,b.y0-4,b.w,b.h+8);if(hi){c.fillStyle=hi;c.fillRect(b.x0+b.w*.16,b.y0-4,Math.max(1.5,b.w*.08),b.h+8)}};
 const stroke=(pts,w,col=INK)=>{if(BR){const ga=c.globalAlpha;c.globalAlpha=ga*.85;c.strokeStyle=col===INK?INKB:col;c.lineWidth=w*1.15;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0]+rr(-.5,.5),q[1]+rr(-.5,.5)):c.moveTo(q[0],q[1]));c.stroke();c.globalAlpha=ga;return}c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke()};
 const dot=(p,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(p[0],p[1],r,0,7);c.fill()};
 // 미늘(작은 쇠비늘) 무늬: 이미 오려 둔 판 안에 엇갈린 줄로 그린다
 const scaleFill=(p,col,g)=>{const b=bbox(p);g=g||Math.max(2.2,1.15*s);const lc=hexMix(col,INK,.5),hc=hexMix(col,'#ffffff',.55),ga=c.globalAlpha,gy=g*1.2;c.lineCap='round';
  for(let y=b.y0-gy*.5,row=0;y<b.y1+gy;y+=gy,row++){c.globalAlpha=ga*.8;c.strokeStyle=lc;c.lineWidth=Math.max(.6,g*.2);c.beginPath();c.moveTo(b.x0,y);c.lineTo(b.x1,y);for(let x=b.x0+(row%2)*g/2;x<b.x1;x+=g){c.moveTo(x,y);c.lineTo(x,y+gy)}c.stroke();
   if(!LQ){c.globalAlpha=ga*.55;c.strokeStyle=hc;c.lineWidth=Math.max(.5,g*.16);c.beginPath();for(let x=b.x0+(row%2)*g/2+g*.3;x<b.x1;x+=g){c.moveTo(x,y+gy*.3);c.lineTo(x,y+gy*.75)}c.stroke()}}c.globalAlpha=ga};
 // 판 하나: 3D 두 점 사이의 통, 겹판 줄(lames)·밝은 면·그늘
 const tube=(A,B,ra,rb,o2={})=>{const a=Jp(A),b=Jp(B),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,ex=dx/l,ey=dy/l;let nx=-ey,ny=ex;if(nx<0){nx=-nx;ny=-ny}
  const RA=ra*s,RB=rb*s,cap=o2.cap??.5,poly=[[a[0]+nx*RA,a[1]+ny*RA],[b[0]+nx*RB,b[1]+ny*RB],[b[0]+ex*RB*cap,b[1]+ey*RB*cap],[b[0]-nx*RB,b[1]-ny*RB],[a[0]-nx*RA,a[1]-ny*RA],[a[0]-ex*RA*cap,a[1]-ey*RA*cap]];
  const fill=o2.fill||pal.steel,sh=o2.shade||pal.shade,hi=o2.hi===undefined?pal.hi:o2.hi;
  solid(poly,fill,pp_=>{c.fillStyle=sh;c.beginPath();c.moveTo(a[0]+nx*RA*.3,a[1]+ny*RA*.3);c.lineTo(b[0]+nx*RB*.3,b[1]+ny*RB*.3);c.lineTo(b[0]+nx*RB*3+ex*RB*2,b[1]+ny*RB*3+ey*RB*2);c.lineTo(a[0]+nx*RA*3-ex*RA*2,a[1]+ny*RA*3-ey*RA*2);c.closePath();c.fill();
   if(o2.scales)scaleFill(pp_,fill);
   if(hi)stroke([[a[0]-nx*RA*.5,a[1]-ny*RA*.5],[b[0]-nx*RB*.5,b[1]-ny*RB*.5]],Math.max(1.2,Math.min(RA,RB)*.22),hi);
   for(const t of o2.lames||[]){const m=[lerp(a[0],b[0],t),lerp(a[1],b[1],t)],r=lerp(RA,RB,t),bu=(o2.bulge??1)*r*.4;if(BR){const ga=c.globalAlpha;c.globalAlpha=ga*rr(.45,.8);c.strokeStyle=INKB;c.lineCap='round';c.lineWidth=Math.max(1.2,lw*rr(.7,1.3));c.beginPath();c.moveTo(m[0]+nx*r*1.1+rr(-.6,.6),m[1]+ny*r*1.1);c.quadraticCurveTo(m[0]+ex*bu,m[1]+ey*bu,m[0]-nx*r*1.1,m[1]-ny*r*1.1+rr(-.6,.6));c.stroke();c.globalAlpha=ga}else{c.strokeStyle=o2.lameCol||INK;c.lineWidth=Math.max(1,lw*.75);c.beginPath();c.moveTo(m[0]+nx*r*1.1,m[1]+ny*r*1.1);c.quadraticCurveTo(m[0]+ex*bu,m[1]+ey*bu,m[0]-nx*r*1.1,m[1]-ny*r*1.1);c.stroke()}}
   if(o2.ridge)stroke([[a[0]-nx*RA*.05,a[1]-ny*RA*.05],[b[0]-nx*RB*.05,b[1]-ny*RB*.05]],1,pal.shade);
   if(o2.rivets)for(const t of o2.rivets)dot([lerp(a[0],b[0],t)-nx*lerp(RA,RB,t)*.72,lerp(a[1],b[1],t)-ny*lerp(RA,RB,t)*.72],Math.max(1,s*.55),INK)},{line:o2.line,ang:Math.atan2(dy,dx)});
  return poly};
 const disc=(C,r,fill=pal.steel)=>{const p=Jp(C),pts=[];for(let i=0;i<14;i++){const t=i/14*6.2832;pts.push([p[0]+Math.cos(t)*r*s,p[1]+Math.sin(t)*r*s*.92])}solid(pts,fill,sideShade(pal.shade,pal.hi))};
 const hullOf=pts3=>hull(pts3.map(Jp));
 const P=[],add=(z,f,tag)=>P.push({z,f,tag,i:P.length});

 // ─ 땅 그림자 ─
 if(!o.noShadow){if(BR){const sv=seed;seed=4242;const ga=c.globalAlpha;for(let i=0;i<16;i++){const t=rr(0,6.283),rd=rr(0,26),p=Jp([Math.cos(t)*rd,Math.sin(t)*rd*1.2,0]),l=rr(12,36)*s*.5;c.globalAlpha=ga*rr(.2,.42);c.strokeStyle='#5d6f88';c.lineCap='round';c.lineWidth=rr(2,6)*s*.6;c.beginPath();c.moveTo(p[0]-l,p[1]+rr(-1,1));c.quadraticCurveTo(p[0],p[1]+rr(-2,2),p[0]+l,p[1]+rr(-1,1));c.stroke()}for(let i=0;i<10;i++){const p=Jp([rr(-34,34),rr(-34,34),0]);c.globalAlpha=ga*rr(.2,.5);dot(p,rr(.6,1.8)*s*.5,'#5d6f88')}c.globalAlpha=ga;seed=sv}else{const gs=[];for(let i=0;i<16;i++){const t=i/16*6.283;gs.push(Jp([Math.cos(t)*26,Math.sin(t)*26,0]))}hatch(c,gs,.15,3,1.1,{skip:.1})}}
 c.save();if(o.ghost)c.globalAlpha=.4;

 // ─ 다리: 퀴스(허벅지)·폴레인(무릎)·그리브(정강이)·사바톤(철신) ─
 for(const g of legs){const{side,Hp,K,F,A,toe}=g,out=[0,side,0];
  LH('thigh',K,Hp,8*LM);LH('shin',A,K,5.8*LM);LH('foot',vadd(A,[0,0,-1]),vadd(vadd(F,vmul(toe,14*Math.sqrt(LM))),[0,0,1.6]),4.6*LM);
  add(dep(T(H0+20))-1.2+dep(vlerp(Hp,K,.5))*.01,()=>tube(Hp,K,8*LM,6.4*LM,{lames:[.12,.26],rivets:[.5]}),'thigh');// 허벅지는 늘 허리 장갑(몸통·폴드) 뒤
  if(!ch.coat&&!JA)add(dep(T(H0+20))-1+dep(vlerp(Hp,K,.3))*.01,()=>tube(vadd(Hp,[2,side*1,7]),vlerp(Hp,K,.5),9.8*LM,8.8*LM,{lames:[.28,.52,.76],rivets:[.15]}),'thigh');
  add(dep(vlerp(K,A,.5))+13,()=>tube(K,A,5.8*LM,4.1*LM,{ridge:true}),'shin');
  add(dep(vlerp(K,A,.5))+13.001,()=>tube(vadd(A,[0,0,-1]),vadd(vadd(F,vmul(toe,14*Math.sqrt(LM))),[0,0,1.6]),4.6*LM,2.8*LM,{lames:[.22,.36,.5,.64,.78],cap:.8}),'foot');
  add(Math.max(dep(K),dep(vlerp(K,A,.5)),dep(vlerp(Hp,K,.5)))+14.01,()=>{const w=vadd(K,vmul(out,5.2*LM));disc(w,4.6*LM);disc(K,6.3*LM);const p=Jp(K);dot(p,Math.max(1,s*.6),INK);
   tube(vadd(K,[0,0,6]),vadd(K,[1,0,3.5]),6.6*LM,6.4*LM,{hi:null,cap:.2});tube(vadd(K,[.5,0,-4]),vadd(K,[0,0,-7]),6*LM,5.8*LM,{hi:null,cap:.2})})}

 // ─ 몸통: 브레스트플레이트(가슴판)·백플레이트·폴드(허리 겹판) ─
 const lv=u=>{const w0=H0+6,top=uS+2;if(u>=w0){const k=clamp((u-w0)/(top-w0),0,1);return{rw:lerp(11.5,15.5,k)*bT,df:lerp(7.8,10.4,Math.sin(k*Math.PI*.5))*bT,fo:bend(u)+k*1.5}}const k=clamp((w0-u)/14,0,1);return{rw:lerp(11.5,14.2,k)*bT,df:lerp(7.8,9.8,k)*bT,fo:bend(w0)}};
 const ring=(u,g=0,n=18)=>{const v=lv(u),a=[];for(let k=0;k<n;k++){const t=k/n*6.2832;a.push([v.fo+Math.cos(t)*(v.df+g),Math.sin(t)*(v.rw+g),u])}return a};
 const vis=(u,g=0,o_=.05,n=28)=>{const v=lv(u),a=[];let best=[];for(let k=0;k<=n;k++){const t=k/n*6.2832-Math.PI,ny=Math.cos(t)*sn+Math.sin(t)*cs;if(ny>o_)a.push(Jp([v.fo+Math.cos(t)*(v.df+g),Math.sin(t)*(v.rw+g),u]));else{if(a.length>best.length)best=a.slice();a.length=0}}return a.length>best.length?a:best};
 const front=(u,g=0)=>{const v=lv(u);return[v.fo+v.df+g,0,u]};
 LH('pelvis',T(H0-10),T(H0+3),12*bT,1);LH('waist',T(H0+3),T(H0+14),12*bT,1);LH('chest',T(H0+14),T(uS+2),14*bT,1);
 add(dep(T(H0+20)),()=>{
  const tp=hullOf([...ring(uS+2),...ring(H0+24),...ring(H0+6),...ring(H0-7)]);solid(tp,pal.steel,JA?p=>{sideShade(pal.shade,pal.hi)(p);scaleFill(p,pal.steel)}:sideShade(pal.shade,pal.hi));
  // 폴드 겹판
  if(!JA)for(const u of[H0+3,H0-1,H0-5]){const a=vis(u,.3);if(a.length>1)stroke(a,Math.max(1,lw*.8))}
  if(sn>-.15){// 가슴 가운데 능선과 목둘레 테두리
   if(JA)disc(front(H0+25,.8),3.4*bT,pal.trim);else stroke([Jp(front(uS-2)),Jp(front(H0+22,.6)),Jp(front(H0+7))],1.2,pal.shade);const nk=vis(uS+1,-.5,.3);if(nk.length>1)stroke(nk,2.4*s*.5+1,pal.trim)}
  else{// 등판: 멜빵과 버클
   for(const sd of[-1,1]){const a=Jp([bend(uS)-8,sd*8,uS]),b=Jp([bend(H0+12)-8,sd*5,H0+12]);stroke([a,b],2.2,pal.leather)}}
  if(COAT){const cl=hullOf([...ring(uS-5,1.2),...ring(H0+22,1.2),...ring(H0+6,1.2)]),cd=hexMix(pal.cloth,INK,.38);
   solid(cl,pal.cloth,p=>{sideShade(cd,null)(p);const b=bbox(p);for(const k of[.3,.55])stroke([[b.x0+b.w*k,b.y0+b.h*.35],[b.x0+b.w*(k+.03),b.y1]],1,cd)})}
  const bl=vis(H0+6,COAT?1.6:JA?1:.4,.02);if(bl.length>1)HINTS.waist=bl.map(q=>[q[0],q[1]]);if(bl.length>1){stroke(bl,3.4*s*.5+1.4,INK);stroke(bl,(ch.body?3.2:2.2)*s*.5,beltC);const m=Jp(front(H0+6,COAT?1.6:JA?1:.4));if(sn>0){c.fillStyle=pal.trim;c.fillRect(m[0]-2.5*s,m[1]-2*s,5*s,4*s)}}},'torso');
 // 겉옷 치마와 앞자락
 if(COAT){const kc=vlerp(legs[0].K,legs[1].K,.5),spread=Math.abs(legs[0].K[1]-legs[1].K[1])/2,hemU=Math.max(H0-22,kc[2]+6);
  add(dep(T(H0))+12,()=>{const w=ring(H0+6,1.6),hem=[];for(let k=0;k<18;k++){const t=k/18*6.2832;hem.push([kc[0]*.55+Math.cos(t)*12*bT,Math.sin(t)*Math.max(15*bT,spread+6*LM),hemU+Math.sin(k*1.7)*.8])}
   const sk=hullOf([...w,...hem]),cd=hexMix(pal.cloth,INK,.38);solid(sk,pal.cloth,p=>{sideShade(cd,null)(p);const b=bbox(p);for(const k of[.22,.4,.62,.8])stroke([[b.x0+b.w*k,b.y0+b.h*.25],[b.x0+b.w*(k+.02),b.y1+2]],1.1,cd)});
   // 가운데 트임
   const ft=Jp(front(H0+4,1.6)),fb=Jp([kc[0]*.55+12*bT,0,hemU]);if(sn>-.1)stroke([ft,fb],1.4,INK);
   const bt=Jp([bend(H0+4)-9,0,H0+4]),bb=Jp([kc[0]*.55-12*bT,0,hemU]);if(sn<.1)stroke([bt,bb],1.4,INK)},'torso');
  if(ch.flap){const tp=front(H0+4,2.2),bt=[tp[0]+2,0,H0-34*bL];add(dep(vlerp(tp,bt,.5))+12.6,()=>{const q=[Jp(vadd(tp,[0,-4.6*bT,0])),Jp(vadd(tp,[0,4.6*bT,0])),Jp(vadd(bt,[0,5.2*bT,0])),Jp(vadd(bt,[0,-5.2*bT,0]))];
   solid(q,pal.flap,p=>{const b=bbox(p);c.fillStyle=hexMix(pal.flap,INK,.35);c.fillRect(b.x0+b.w*.62,b.y0,b.w,b.h);stroke([[b.x0+b.w*.3,b.y0+b.h*.15],[b.x0+b.w*.32,b.y1]],1,hexMix(pal.flap,INK,.35))},{raw:true});
   const z=Jp(vadd(bt,[0,-5.2*bT,0])),z2=Jp(vadd(bt,[0,5.2*bT,0]));for(let k=0;k<=6;k++){const m=lerp2(z,z2,k/6);stroke([m,[m[0],m[1]+3*s]],1,INK)}})}}
 // 금나라 미늘 치마: 허리에서 정강이까지 내려오는 쇠비늘 자락, 앞은 갈라지고 밑단에 천 테
 if(JA){const kc=vlerp(legs[0].K,legs[1].K,.5),spread=Math.abs(legs[0].K[1]-legs[1].K[1])/2,hemU=Math.max(H0-36*bL,kc[2]-9),hemC=pal.cloth||'#2e3756';
  add(dep(T(H0))+12,()=>{const w=ring(H0+6,1.2),hm=[];for(let k=0;k<20;k++){const t=k/20*6.2832;hm.push([kc[0]*.5+Math.cos(t)*13.5*bT,Math.sin(t)*Math.max(16.5*bT,spread+7*LM),hemU])}
   const sk=hullOf([...w,...hm]);solid(sk,pal.steel,p=>{sideShade(pal.shade,pal.hi)(p);scaleFill(p,pal.steel)});
   const he=[];for(let k=0;k<=28;k++){const t=k/28*6.2832-Math.PI;if(Math.cos(t)*sn+Math.sin(t)*cs>.02)he.push(Jp([kc[0]*.5+Math.cos(t)*13.6*bT,Math.sin(t)*Math.max(16.6*bT,spread+7.1*LM),hemU+1.2]));else if(he.length>1)break;else he.length=0}
   if(he.length>1){stroke(he,4.6*s*.5+1.6,INK);stroke(he,4.6*s*.5,hemC)}
   for(const[fr,ok] of[[1,sn>-.1],[-1,sn<.1]]){if(!ok)continue;const a=Jp([bend(H0+4)+fr*(9.6*bT),0,H0+4]),b=Jp([kc[0]*.5+fr*13.5*bT,0,hemU]);stroke([a,b],1.6,INK)}
   for(const sd of[-1,1]){const t=sd*Math.PI/2;if(Math.abs(Math.cos(t)*sn+Math.sin(t)*cs)<.3)continue;const a=Jp([bend(H0+4),sd*13*bT,H0+4]),b=Jp([kc[0]*.5,sd*Math.max(16.5*bT,spread+7*LM),hemU]);stroke([a,b],1.2,INK)}},'torso')}
 // 칼집
 if(ch.sheath){const fr=ch.sheathDir==='front',top=fr?[bend(H0+5)+8*bT,12*bT,H0+5]:[bend(H0+5)+5,-13*bT,H0+5],tip=fr?[24*bT,-14*bT,H0-34*bL]:[-16,-17*bT,H0-38];add(dep(vlerp(top,tip,.4))+(fr?13.2:12.3),()=>{tube(top,tip,2.6,2.1,{fill:sheathC,shade:hexMix(sheathC,INK,.4),hi:hexMix(sheathC,PAPER,.35),cap:.9});const ch_=vlerp(top,tip,.92);tube(ch_,tip,2.2,1.7,{cap:.9})})}

 // ─ 고지트(목갑옷)·투구 ─
 add(dep(head)+7,()=>{for(let k=0;k<3;k++){const u=uS+3+k*2.6;const r3=[];for(let i=0;i<14;i++){const t=i/14*6.2832;r3.push([bend(u)+Math.cos(t)*(8.6-k*.8),Math.sin(t)*(9.5-k*.8),u])}const hp=hullOf(r3);solid(hp,pal.steel,sideShade(pal.shade,pal.hi),{w:lw*.9})}});
 // ─ 머리 디자인: 맨머리·두건·얼굴(눈·코·입·수염)·투구 장식 ─
 const skin=pal.skin||'#e8d2b4',hairC=pal.hair||'#3b3732',plumeC=pal.plume||pal.flap||'#8a1c1c',hw_=w=>w*s*.5*hs+.8;
 const ellP=(Rf,Rr,Ru,cf,cu,fl,n=6,m=18)=>{const a=[];for(let la=-n;la<=n;la++)for(let lo=0;lo<m;lo++){const p=la/n*Math.PI/2,t=lo/m*6.2832,x=Math.cos(p)*Math.cos(t),y=Math.cos(p)*Math.sin(t),z=Math.sin(p);if(!fl||fl(x,y,z))a.push(HL([cf+x*Rf,y*Rr,cu+z*Ru]))}return a};
 const fpJ=(r,u,dz=0)=>Jp(HL(FP(r,u,dz)));
 const drawFace=()=>{if(HINTS.face.vis<-.05)return;const{eU,nU,mU,cU,eR,wR}=FL,bd_=ch.beard||'none',brow=hexMix(hairC,INK,.45);
  if(bd_==='full')solid([[-wR,eU-1.5,0],[-wR*.96,mU,0],[-wR*.72,cU+.5,.4],[-2.6,cU-1.4,1.2],[0,cU-2.4,1.6],[2.6,cU-1.4,1.2],[wR*.72,cU+.5,.4],[wR*.96,mU,0],[wR,eU-1.5,0],[wR*.62,eU-3.2,0],[3,mU+1.4,0],[0,mU+1.9,0],[-3,mU+1.4,0],[-wR*.62,eU-3.2,0]].map(([r,u,d])=>fpJ(r,u,d)),hairC,null,{raw:true,w:lw*.7});
  else if(bd_==='goatee')solid([[-2.2,mU-1,0],[2.2,mU-1,0],[1.7,cU+.4,.6],[0,cU-1.6,1.2],[-1.7,cU+.4,.6]].map(([r,u,d])=>fpJ(r,u,d)),hairC,null,{raw:true,w:lw*.7});
  const ey=ch.fEye||'dot';for(const sd of[-1,1]){const r0=sd*eR;if(!fvis(r0,eU))continue;const P=fpJ(r0,eU),er=Math.max(1.1,s*.62*hs);
   if(ey==='narrow')stroke([fpJ(r0-1.4,eU),fpJ(r0+1.4,eU+.15)],hw_(1.5));else if(ey==='round'){dot(P,er*1.9,INK);dot(P,er*1.45,'#f6f2e8');dot(P,er*.85,INK)}else dot(P,er,INK);
   const bi=ey==='fierce'?[[r0-sd*1.7,eU+1.1],[r0+sd*1.5,eU+2.7]]:[[r0-sd*1.5,eU+1.9],[r0+sd*1.5,eU+2.1]];stroke(bi.map(([r,u])=>fpJ(r,u)),hw_(ey==='fierce'?2.2:1.4),brow)}
  const ns=ch.fNose||'small';if(fvis(0,nU)){if(ns==='hook')stroke([fpJ(0,eU-.6,.4),fpJ(0,(eU+nU)/2,1.7),fpJ(0,nU+.2,1.5),fpJ(-.9,nU-.2,.2)],hw_(1.3));else if(ns==='broad'){stroke([fpJ(.3,eU-1),fpJ(.3,nU+.6,.6)],hw_(1.2));for(const sd of[-1,1])dot(fpJ(sd*1.3,nU,.3),Math.max(.8,s*.45*hs),INK)}else stroke([fpJ(.5,eU-1.2),fpJ(.9,nU,.6),fpJ(-.4,nU,.4)],hw_(1.2))}
  if(bd_==='mustache'||bd_==='full'){const ms=[[-3.6,mU-.5],[-1.6,mU+1.1],[0,mU+1.3],[1.6,mU+1.1],[3.6,mU-.5]].map(([r,u])=>fpJ(r,u,.3));stroke(ms,hw_(2.8),INK);stroke(ms,hw_(1.8),hairC)}
  const mo=ch.fMouth||'line';if(fvis(0,mU)){if(mo==='smile')stroke(smooth([fpJ(-2.6,mU+.8),fpJ(-1.1,mU-.3),fpJ(1.1,mU-.3),fpJ(2.6,mU+.8)],1),hw_(1.3));else if(mo==='frown')stroke(smooth([fpJ(-2.4,mU-.7),fpJ(-1,mU+.2),fpJ(1,mU+.2),fpJ(2.4,mU-.7)],1),hw_(1.3));else if(mo==='open'){path([[-2,mU],[0,mU+.5],[2,mU],[0,mU-1.8]].map(([r,u])=>fpJ(r,u)));c.fillStyle=INK;c.fill()}else stroke([fpJ(-2.2,mU),fpJ(2.2,mU)],hw_(1.3))}};
 const skull=()=>solid(hullOf(ellP(HE.Rf,HE.Rr,HE.Ru,HE.cf,HE.cu)),skin,sideShade(hexMix(skin,INK,.2),null));
 const ears=()=>{for(const sd of[-1,1]){if(!faces([0,sd,0]))continue;const p=Jp(HL([-1,sd*8.3,-1.5]));c.beginPath();c.ellipse(p[0],p[1],1.5*s*hs,2.4*s*hs,0,0,7);c.fillStyle=skin;c.fill();c.strokeStyle=INK;c.lineWidth=lw*.7;c.stroke()}};
 const hairSh=()=>sideShade(hexMix(hairC,INK,.35),hexMix(hairC,'#ffffff',.18));
 const hairSet=(zf,zs,zb)=>ellP(HE.Rf+1.1,HE.Rr+1.1,HE.Ru+1.2,HE.cf-.3,HE.cu+.2,(x,y,z)=>z>(x>.25?zf:x>-.3?zs:zb));
 const hairDraw=pass=>{const hs_=ch.hair||'short';if(hs_==='bald')return;
  if(hs_==='long'&&pass!=='front'){const lp=[];for(let k=0;k<12;k++){const t=Math.PI*.55+k/11*Math.PI*.9;lp.push(HL([HE.cf+Math.cos(t)*(HE.Rf+1.2),Math.sin(t)*(HE.Rr+1.4),HE.cu+2]),HL([HE.cf+Math.cos(t)*(HE.Rf+2.2)-1,Math.sin(t)*(HE.Rr+2.6),HE.cu-17]))}solid(hullOf(lp),hairC,hairSh())}
  if(pass!=='front')solid(hullOf(hairSet(.42,-.05,-.5)),hairC,hairSh());
  if(pass==='front')solid(hullOf(hairSet(.42,.42,.42)),hairC,hairSh());
  if(hs_==='knot'&&pass!=='back'){const p=Jp(HL([-4,0,HE.cu+HE.Ru+2.2]));dot(p,3.4*s*hs+1.2,INK);dot(p,3.4*s*hs,hairC)}};
 const hoodDraw=chain=>{const col=chain?pal.steel:(pal.cloth||'#6d675e'),G=chain?1.6:2.2,pts=ellP(HE.Rf+G,HE.Rr+G,HE.Ru+G,HE.cf-.4,HE.cu+.4);for(let k=0;k<16;k++){const t=k/16*6.2832;pts.push(HL([Math.cos(t)*10.5-1.5,Math.sin(t)*11.5,HE.cu-13]))}if(!chain)pts.push(HL([-12.5,0,HE.cu+8]));
  const H=hullOf(pts);solid(H,col,sideShade(chain?pal.shade:hexMix(col,INK,.3),chain?pal.hi:null));
  if(chain&&!LQ){const b=bbox(H),g=Math.max(2,2.3*s*.5);c.save();path(smooth(H,1,true));c.clip();c.strokeStyle=hexMix(pal.steel,INK,.4);c.lineWidth=.8;for(let y=b.y0,row=0;y<b.y1;y+=g,row++){c.beginPath();for(let x=b.x0+(row%2)*g/2;x<b.x1;x+=g){c.moveTo(x-g*.35,y);c.quadraticCurveTo(x,y+g*.7,x+g*.35,y)}c.stroke()}c.restore()}
  if(HINTS.face.vis>.05){const op=[];for(let k=0;k<22;k++){const t=k/22*6.2832;op.push(fpJ(Math.cos(t)*5.6,-4+Math.sin(t)*7.4,.5))}solid(op,skin,null,{raw:true,w:lw*.9});c.save();path(op);c.clip();drawFace();c.restore();stroke([...op,op[0]],hw_(chain?2:1.6),INK)}};
 const kettleDraw=()=>{const ring=(R1,R2,u)=>{const a=[];for(let k=0;k<24;k++){const t=k/24*6.2832;a.push(HL([Math.cos(t)*R1-1,Math.sin(t)*R2,u]))}return a};
  solid(hullOf([...ring(14,13.4,5),...ring(13.6,13,4.2)]),HPAL.steel,sideShade(HPAL.shade,HPAL.hi));solid(hullOf(ellP(10.6,9.8,9,-1,5,(x,y,z)=>z>=0)),HPAL.steel,sideShade(HPAL.shade,HPAL.hi));
  const a=[];for(let k=0;k<=20;k++){const t=k/20*6.2832-Math.PI;if(faces([Math.cos(t),Math.sin(t),0]))a.push(Jp(HL([Math.cos(t)*10.6-1,Math.sin(t)*9.8,6.4])));else if(a.length>1)break;else a.length=0}if(a.length>1)stroke(a,1.2)};
 // 금나라 투구: 둥근 사발, 눈썹 판, 가운데 띠, 꼭지와 선 깃털, 머리 둘레의 미늘 드림(내리면 눈만, 올리면 얼굴이 드러남)
 const jinDraw=()=>{const up=!!ch.jinUp,FOLD=up&&!ch.jinV2,st=HPAL.steel,sh_=HPAL.shade,hi_=HPAL.hi,tr=HPAL.trim,vis=HINTS.face.vis,BU=3,BR_=10.8,BRr=10,BRu=10.5;
  const DB=-14.5,dF=u=>u>=-6?lerp(10.4,11,clamp((BU+.5-u)/(BU+6.5),0,1)):lerp(11,14.2,clamp((-6-u)/(-6-DB),0,1)),dS=u=>u>=-6?lerp(9.8,10.6,clamp((BU+.5-u)/(BU+6.5),0,1)):lerp(10.6,13.8,clamp((-6-u)/(-6-DB),0,1));
  const dRing=(u,g=0)=>{const a=[];for(let q=0;q<22;q++){const t=q/22*6.2832;a.push(HL([-1+Math.cos(t)*(dF(u)+g),Math.sin(t)*(dS(u)+g),u]))}return a};
  const dP=(r,u,d=0)=>Jp(HL([-1+dF(u)*Math.sqrt(Math.max(0,1-(r/dS(u))**2))+d,r,u])),dV=(r,u)=>{const Rr=dS(u);return dep(HR([Math.sqrt(Math.max(0,1-(r/Rr)**2)),r/Rr,0]))>.05};
  const fRing=(u,Rf,Rr)=>{const a=[];for(let q=0;q<24;q++){const t=q/24*6.2832;a.push(HL([-1+Math.cos(t)*Rf,Math.sin(t)*Rr,u]))}return a},fArc=(T,u,Rf,Rr)=>T.map(t=>Jp(HL([-1+Math.cos(t)*Rf,Math.sin(t)*Rr,u])));
  const bP=(r,u,d=0)=>{const k=Math.sqrt(Math.max(0,1-((u-BU)/BRu)**2)),Rr=BRr*k;return Jp(HL([-1+BR_*k*Math.sqrt(Math.max(0,1-(r/Math.max(.1,Rr))**2))+d,r,u]))},bV=(r,u)=>{const k=Math.sqrt(Math.max(0,1-((u-BU)/BRu)**2)),Rr=Math.max(.1,BRr*k);return dep(HR([Math.sqrt(Math.max(0,1-(r/Rr)**2)),r/Rr,(u-BU)/BRu]))>.04};
  // 드림(미늘 목·얼굴가리개)
  const hemOf=(t0,t1,u)=>{const a=[];for(let q=0;q<=16;q++){const t=lerp(t0,t1,q/16);if(faces([Math.cos(t),Math.sin(t),0]))a.push(Jp(HL([-1+Math.cos(t)*(dF(u)+.1),Math.sin(t)*(dS(u)+.1),u])));else if(a.length>1)break;else a.length=0}if(a.length>1){stroke(a,hw_(3.6),INK);stroke(a,hw_(2.2),pal.cloth||tr)}};
  if(!up){// 드림 내림: 머리 전체를 덮고 눈 틈만 남는다
   const dH=hullOf([...dRing(BU+.5),...dRing(-6),...dRing(DB)]);solid(dH,st,p=>{sideShade(sh_,hi_)(p);scaleFill(p,st)});hemOf(-Math.PI,Math.PI,DB+.8);
   if(vis>.05){const band=[];for(let r=-6.6;r<=6.6;r+=1.1)if(dV(r,2.4))band.push(dP(r,2.4,.1));for(let r=6.6;r>=-6.6;r-=1.1)if(dV(r,-1.4))band.push(dP(r,-1.4+Math.abs(r)*.12,.1));
    if(band.length>3){solid(band,skin,null,{raw:true,w:lw*.8});c.save();path(band);c.clip();const ey=ch.fEye||'dot',brow=hexMix(hairC,INK,.45);for(const sd of[-1,1]){const r=sd*3.1;if(!dV(r,.5))continue;const P=dP(r,.5,.2),er=Math.max(1.1,s*.62*hs);// 드림 틈: 얼굴과 같은 피부색, 같은 눈·눈썹
     if(ey==='narrow')stroke([dP(r-1.4,.5,.2),dP(r+1.4,.65,.2)],hw_(1.5));else if(ey==='round'){dot(P,er*1.9,INK);dot(P,er*1.45,'#f6f2e8');dot(P,er*.85,INK)}else dot(P,er,INK);
     const bi=ey==='fierce'?[[r-sd*1.7,1.6],[r+sd*1.5,3.2]]:[[r-sd*1.5,2.4],[r+sd*1.5,2.6]];stroke(bi.map(([rr_,u])=>dP(rr_,u,.2)),hw_(ey==='fierce'?2.2:1.4),brow)}c.restore()}
    if(dV(0,-3)){const cl=[dP(0,-1.8,.2),dP(0,-7,.2),dP(0,DB+1.4,.2)];stroke(cl,hw_(1.6),hexMix(st,INK,.55))}}}
  else{// 드림 올림. 금나라 투구: 드림을 접어 올린 챙 아래로 귀를 가리는 속드림 두 자락. 금나라 투구2: 앞을 걷어 얼굴이 다 드러나고, 양 귀 옆 드림 자락과 뒷자락만 늘어지며 붉은 끈으로 턱 밑에서 묶는다
   if(FOLD)solid(hullOf([...fRing(BU+1.6,12.1,11.6),...fRing(BU+6.6,11.2,10.7)]),st,sideShade(sh_,hi_));
   const FB=-11.5,gi=FOLD?1:0,sec=(t0,t1,ub)=>{const a=[];for(let q=0;q<=8;q++){const t=lerp(t0,t1,q/8);for(const u of[FOLD?BU+1.4:BU+.5,-4,ub])a.push(HL([-1+Math.cos(t)*(dF(u)-gi),Math.sin(t)*(dS(u)-gi),u]),HL([-1+Math.cos(t)*(dF(u)-1.6-gi),Math.sin(t)*(dS(u)-1.6-gi),u]))}return a};
   const S_=(FOLD?[[.95,1.85,FB],[4.43,5.33,FB]]:[[.95,1.75,FB],[1.75,Math.PI,DB],[Math.PI,4.53,DB],[4.53,5.33,FB]]).map(([t0,t1,ub])=>({t0,t1,ub,f:faces([Math.cos((t0+t1)/2),Math.sin((t0+t1)/2),0])}));
   const drawS=g=>{solid(hullOf(sec(g.t0,g.t1,g.ub)),st,p=>{sideShade(sh_,hi_)(p);scaleFill(p,st)});hemOf(g.t0,g.t1,g.ub+.8)};
   for(const g of S_)if(!g.f)drawS(g);
   skull();ears();drawFace();
   for(const g of S_)if(g.f)drawS(g);
   if(vis>-.1){const knot=Jp(HL([HE.cf+HE.Rf*.6,0,HE.cu-HE.Ru-.4])),red=pal.flap&&pal.flap!==st?pal.flap:'#b3261a';for(const t of[.95,5.33]){if(!faces([Math.cos(t),Math.sin(t),0])&&vis<.3)continue;const a=Jp(HL([-1+Math.cos(t)*(dF(FB)-.8),Math.sin(t)*(dS(FB)-.8),FB+.6])),m=lerp2(a,knot,.5),cv=smooth([a,[m[0],m[1]+3*s*hs],knot],2);stroke(cv,hw_(2.4),INK);stroke(cv,hw_(1.3),red)}
    dot(knot,Math.max(1.6,1.6*s*hs)+.8,INK);dot(knot,Math.max(1.6,1.6*s*hs),red);for(const sd of[-1,1]){const e=[knot,[knot[0]+sd*2.4*s*hs,knot[1]+3.6*s*hs]];stroke(e,hw_(2.2),INK);stroke(e,hw_(1.2),red)}}}
  // 사발
  solid(hullOf(ellP(BR_,BRr,BRu,-1,BU,(x,y,z)=>z>=0)),st,sideShade(sh_,hi_));
  {const a=[];for(let q=0;q<=28;q++){const t=q/28*6.2832-Math.PI;if(faces([Math.cos(t),Math.sin(t),0]))a.push(Jp(HL([-1+Math.cos(t)*(BR_+.3),Math.sin(t)*(BRr+.3),BU+.6])));else if(a.length>1)break;else a.length=0}if(a.length>1){stroke(a,hw_(4),INK);stroke(a,hw_(2.6),tr)}}
  // 가운데 세로 띠와 테두리 리벳
  {const a=[];for(let u=BU+1;u<=BU+BRu-.4;u+=1.2)if(bV(0,u))a.push(bP(0,u,.2));if(a.length>1){stroke(a,hw_(3.4),INK);stroke(a,hw_(2),tr)}}
  for(let q=0;q<14;q++){const t=q/14*6.2832;if(!faces([Math.cos(t),Math.sin(t),0])||Math.abs(Math.sin(t))<.2&&Math.cos(t)>0)continue;dot(Jp(HL([-1+Math.cos(t)*(BR_+.4),Math.sin(t)*(BRr+.4),BU+.6])),Math.max(.8,s*.4*hs),INK)}
  if(FOLD){// 드림 올림: 드림을 이마 위까지 접어 올려 사발 둘레에 두툼한 챙처럼 감긴다
   const T=[];let run=[];for(let q=0;q<=36;q++){const t=q/36*6.2832-Math.PI;if(faces([Math.cos(t),Math.sin(t),0]))run.push(t);else{if(run.length>T.length)T.splice(0,T.length,...run);run=[]}}if(run.length>T.length)T.splice(0,T.length,...run);
   if(T.length>1){const lo_=fArc(T,BU+1.6,12.1,11.6),hi2=fArc(T,BU+6.6,11.2,10.7);solid([...lo_,...hi2.slice().reverse()],st,p=>{sideShade(sh_,hi_)(p);scaleFill(p,st)},{raw:true});
    const md=fArc(T,BU+4,11.7,11.2);stroke(md,hw_(2),hexMix(st,INK,.55));stroke(hi2,hw_(2.4),INK);stroke(lo_,hw_(3.6),INK);stroke(lo_,hw_(2.2),pal.cloth||tr)}}
  else{// 눈썹 판
   for(const sd of[-1,1]){const tp=[],bt=[];for(let k=0;k<=6;k++){const r=sd*(1.2+k*1.05),uu=BU+1.1+Math.sin(k/6*Math.PI)*1.6+(6-k)*.12;if(bV(r,uu)){tp.push(bP(r,uu+.9,.5));bt.push(bP(r,BU+.9,.4))}}if(tp.length>1)solid([...tp,...bt.reverse()],tr,null,{raw:true,w:lw*.8})}}
  // 꼭지와 선 깃털
  const cr=ch.hcrest||'plume',T0=[-1,0,BU+BRu];if(cr!=='none'){const a=Jp(HL([-1,-1.3,T0[2]-.6])),b=Jp(HL([-1,1.3,T0[2]-.6])),t_=Jp(HL([-1,0,T0[2]+4.2]));solid([a,t_,b],tr,null,{raw:true});dot(Jp(HL([-1,0,T0[2]+.6])),Math.max(1.4,1.8*s*hs),tr)}
  if(cr==='plume'){const sp=smooth([[0,0,4],[-.4,0,8],[-1.4,0,12],[-3,0,16],[-5.2,0,19.5]].map(v=>Jp(HL([T0[0]+v[0],0,T0[2]+v[2]]))),3);for(const ps of[0,1,2])for(let i=0;i<sp.length-1;i++){const t=i/(sp.length-1),wd=(1-Math.abs(t-.4)*1.2)*4.6*s*.5*hs+.8;stroke([sp[i],sp[i+1]],ps===0?wd+1.6:ps===1?wd:Math.max(.5,wd*.25),ps===0?INK:ps===1?plumeC:hexMix(plumeC,'#ffffff',.35))}}};
 const greatDraw=()=>{const pts=[];for(let k=0;k<20;k++){const t=k/20*6.2832;for(const[u,f]of[[-13,1],[11,1],[13.2,.88]])pts.push(HL([Math.cos(t)*11.6*f-1,Math.sin(t)*10.6*f,u]))}pts.push(HL([-1,0,14]));solid(hullOf(pts),HPAL.steel,sideShade(HPAL.shade,HPAL.hi));
  const CP=(r,u,d=0)=>Jp(HL([-1+11.6*Math.sqrt(Math.max(0,1-(r/10.6)**2))+d,r,u])),visC=r=>dep(HR([Math.sqrt(Math.max(0,1-(r/10.6)**2)),r/10.6,0]))>.05;
  for(const u of[4.6,.6]){const a=[];for(let k=0;k<=24;k++){const t=k/24*6.2832-Math.PI;if(faces([Math.cos(t),Math.sin(t),0]))a.push(Jp(HL([Math.cos(t)*11.7-1,Math.sin(t)*10.7,u])));else if(a.length>1)break;else a.length=0}if(a.length>1)stroke(a,1.1)}
  for(const sd of[-1,1]){const a=[];for(let k=0;k<=6;k++){const r=sd*(1.4+k*1.05);if(visC(r))a.push(CP(r,2.6))}if(a.length>1)stroke(a,hw_(3.4),INK);for(let r=3;r<=7.6;r+=1.5)for(let u=-3.5;u>=-10;u-=2.2)if(visC(sd*r))dot(CP(sd*r,u),Math.max(.8,s*.4*hs),INK)}
  if(visC(0)){const vb=[12.5,6,-4,-12.8].map(u=>CP(0,u,.4));stroke(vb,hw_(4),INK);stroke(vb,hw_(2.4),HPAL.hi||HPAL.steel)}};
 const hornDraw=near=>{for(const sd of[-1,1]){if(faces([0,sd,0])!==near)continue;const sp=smooth([[-1,sd*9.6,5],[0,sd*14,7.5],[2,sd*17.2,12.5],[3.5,sd*16.4,18]].map(v=>Jp(HL(v))),3);for(const ps of[0,1])for(let i=0;i<sp.length-1;i++){const w=(1-i/(sp.length-1)*.85)*3.4*s*.5*hs+.6;stroke([sp[i],sp[i+1]],ps?w:w+1.6,ps?'#e9e1cc':INK)}}};
 const crestDraw=top=>{const cr=ch.hcrest||'comb';
  if(cr==='comb'&&HT!=='peak'&&HT!=='peakup'){const cm=smooth([[8,0,top[2]-3.5],[3,0,top[2]+.4],[-4,0,top[2]+.6],[-11,0,top[2]-3.6]].map(v=>Jp(HL(v))),2);stroke(cm,4.2*s*.5+1.6,INK);stroke(cm,2.2*s*.5,HPAL.hi||HPAL.steel)}
  else if(cr==='plume'){const B=top,sp=smooth([[0,0,0],[-2,0,4.5],[-7,0,7],[-13,0,5],[-17,0,-1],[-18,0,-7]].map(v=>Jp(HL([B[0]+v[0],0,B[2]+v[2]]))),3);for(const ps of[0,1,2])for(let i=0;i<sp.length-1;i++){const t=i/(sp.length-1),w=(1-Math.abs(t-.35)*1.3)*6*s*.5*hs+1;stroke([sp[i],sp[i+1]],ps===0?w+1.6:ps===1?w:Math.max(.6,w*.3),ps===0?INK:ps===1?plumeC:hexMix(plumeC,'#ffffff',.3))}dot(Jp(HL(B)),Math.max(1.5,2*s*hs),HPAL.trim)}
  else if(cr==='horns')hornDraw(true)};
 const customDraw=cm=>{const k=cm.k*(cm.sc||1),bot=-13.5+(cm.dy||0),top=bot+cm.h*k,rings=cm.rows.map(([y,hw,cx,col])=>{const u=top-y*k,r=Math.max(.6,hw*k),a=[];for(let q=0;q<16;q++){const t=q/16*6.2832;a.push(Jp(HL([Math.cos(t)*r*.92-1,cx*k+Math.sin(t)*r,u])))}return a});
  const polys=[];for(let i=0;i<rings.length-1;i++)polys.push(hull([...rings[i],...rings[i+1]]));if(!polys.length)return;
  const P_=()=>{c.beginPath();for(const p of polys){p.forEach((q,j)=>j?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath()}};
  if(ch.paint!=='plain'){P_();c.strokeStyle=BR?INKB:INK;c.lineWidth=lw*2;c.lineJoin='round';c.stroke()}
  const a0=Jp(HL([0,0,top])),a1=Jp(HL([0,0,bot])),g=c.createLinearGradient(a0[0],a0[1],a1[0],a1[1]+.01);cm.rows.forEach(([y,,,col])=>g.addColorStop(Math.min(1,Math.max(0,y/cm.h)),col));
  P_();c.fillStyle=g;c.fill();let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const p of polys)for(const q of p){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}
  const vis=dep(HR([1,0,0])),al=Math.max(0,Math.min(1,(vis-.15)/.55)),im=helmImg(cm),ga=c.globalAlpha;c.save();P_();c.clip();
  c.globalAlpha=ga*.3;c.fillStyle=INK;c.fillRect(x0+(x1-x0)*.62,y0,x1-x0,y1-y0);c.globalAlpha=ga*.35;c.fillStyle='#ffffff';c.fillRect(x0+(x1-x0)*.16,y0,Math.max(1.5,(x1-x0)*.07),y1-y0);
  if(im&&al>0){const fF=Math.max(...cm.rows.map(q=>q[1]))*k*.3-1,O=Jp(HL([fF,-cm.w/2*k,top])),A=Jp(HL([fF,cm.w/2*k,top])),B=Jp(HL([fF,-cm.w/2*k,top-cm.h*k]));c.globalAlpha=ga*al;c.transform((A[0]-O[0])/cm.w,(A[1]-O[1])/cm.w,(B[0]-O[0])/cm.h,(B[1]-O[1])/cm.h,O[0],O[1]);c.drawImage(im,0,0)}
  c.restore()};
 // ─ 부품 조립 투구(클로드가 사진을 읽어 고른 부품, 또는 직접 고른 부품) ─
 const kitDraw=K=>{const C=K.colors||{},main=C.main||pal.steel,sh=C.shade||hexMix(main,INK,.35),hi=hexMix(main,'#ffffff',.45),trim=C.trim||pal.trim,acc=C.accent||plumeC,w=K.width||1,h=K.height||1,flat=K.dome==='flat',open=KOPEN,vis=HINTS.face.vis;
  const G={Rf:12*w,Rr:10.8*w,Ru:(K.dome==='tall'?15:12.5)*h,cf:-1,cu:K.dome==='tall'?1:0},fmax=K.face==='mask'?9.4*w:1e9,cb=K.brim&&K.brim!=='none'?4.5:1.5;
  const S0=open?{Rf:G.Rf*.94,Rr:G.Rr*.94,Ru:G.Ru*.9,cf:-1,cu:cb}:G;
  const xA=(S,r,u)=>flat?Math.sqrt(Math.max(0,1-(r/S.Rr)**2)):Math.sqrt(Math.max(0,1-(r/S.Rr)**2-((u-S.cu)/S.Ru)**2));
  const SP=(r,u,d=0)=>Jp(HL([Math.min(S0.cf+xA(S0,r,u)*S0.Rf,fmax)+d,r,u])),SV=(r,u)=>dep(HR([Math.max(.05,xA(S0,r,u))/S0.Rf,r/S0.Rr**2,0]))>.002;
  const top=flat?S0.cu+13*h-(open?cb:0)*.4:S0.cu+S0.Ru,apex=K.dome==='pointed'?top+6*h:K.dome==='onion'?top+3.5*h:top,base=open?cb:-12;
  const ringU=(u,grow=0,fl=()=>true)=>{const k=flat?1:Math.sqrt(Math.max(0,1-((u-S0.cu)/S0.Ru)**2)),a=[];let started=false;for(let q=0;q<=28;q++){const t=q/28*6.2832-Math.PI;if(faces([Math.cos(t),Math.sin(t),0])&&fl(t)){a.push(Jp(HL([Math.min(S0.cf+Math.cos(t)*(S0.Rf*k+grow),fmax),Math.sin(t)*(S0.Rr*k+grow),u])));started=true}else if(started&&a.length>1)break;else{a.length=0;started=false}}return a};
  const neckDraw=()=>{const nk=K.neck||'none';if(nk==='none')return;const bot=nk==='long'||nk==='mail'?-17:-13.5,spread=nk==='flared'?4.5:nk==='mail'?2.5:1.2,pts=[];for(let q=0;q<20;q++){const t=q/20*6.2832;if(open&&Math.cos(t)>.15)continue;pts.push(HL([Math.cos(t)*(G.Rf-1)-1.5,Math.sin(t)*(G.Rr-.4),open?cb-1:-7]),HL([Math.cos(t)*(G.Rf-1+spread)-1.5,Math.sin(t)*(G.Rr-.4+spread),bot]))}
   const H=hullOf(pts),col=nk==='mail'?hexMix(main,'#8d877c',.35):main;solid(H,col,sideShade(nk==='mail'?hexMix(col,INK,.35):sh,nk==='mail'?null:hi));
   if(nk==='mail'&&!LQ){const b=bbox(H),g=Math.max(2,2.3*s*.5);c.save();path(smooth(H,1,true));c.clip();c.strokeStyle=hexMix(col,INK,.45);c.lineWidth=.8;for(let y=b.y0,row=0;y<b.y1;y+=g,row++){c.beginPath();for(let x=b.x0+(row%2)*g/2;x<b.x1;x+=g){c.moveTo(x-g*.35,y);c.quadraticCurveTo(x,y+g*.7,x+g*.35,y)}c.stroke()}c.restore()}
   else if(nk!=='mail'){for(const u of[bot+3.2,bot+6]){const a=[];for(let q=0;q<=24;q++){const t=q/24*6.2832-Math.PI;if(open&&Math.cos(t)>.15)continue;if(faces([Math.cos(t),Math.sin(t),0])){const k=(u-bot)/((open?cb-1:-7)-bot);a.push(Jp(HL([Math.cos(t)*(G.Rf-1+spread*(1-k))-1.5,Math.sin(t)*(G.Rr-.4+spread*(1-k)),u])))}}if(a.length>1)stroke(a,1)}}};
  const shell=()=>{const pts=[];for(let la=open?0:-4;la<=6;la++)for(let lo=0;lo<20;lo++){const p=la/6*Math.PI/2,t=lo/20*6.2832,x=Math.cos(p)*Math.cos(t),y=Math.cos(p)*Math.sin(t),z=Math.sin(p);
    if(flat){const u=open?cb+(13*h-cb*.4)*(la+0)/6:-12+(13*h+12)*(la+4)/10;pts.push(HL([Math.min(S0.cf+Math.cos(t)*S0.Rf*(la===6?.88:1),fmax),Math.sin(t)*S0.Rr*(la===6?.88:1),u]))}
    else pts.push(HL([Math.min(S0.cf+x*S0.Rf,fmax),y*S0.Rr,S0.cu+z*S0.Ru]))}
   if(!open&&!flat)for(let lo=0;lo<20;lo++){const t=lo/20*6.2832;pts.push(HL([Math.min(Math.cos(t)*9.8*w-1.5,fmax),Math.sin(t)*9.4*w,-12]))}
   if(apex>top)pts.push(HL([S0.cf,0,apex]));solid(hullOf(pts),main,sideShade(sh,hi));
   if(K.dome==='onion'){const p=Jp(HL([S0.cf,0,apex+1.6]));dot(p,Math.max(1.6,1.4*s*hs)+1,INK);dot(p,Math.max(1.2,1.4*s*hs),trim)}};
  const brimDraw=()=>{const b=K.brim||'none';if(b==='none')return;const ring=(R1,R2,u)=>{const a=[];for(let q=0;q<24;q++){const t=q/24*6.2832;a.push(HL([Math.cos(t)*R1-1,Math.sin(t)*R2,u]))}return a};const g=b==='wide'?3.6:b==='down'?3:1.8,bu=cb,lo=b==='down'?bu-3:bu-.7;
   solid(hullOf([...ring(S0.Rf+.3,S0.Rr+.3,bu),...ring(S0.Rf+g,S0.Rr+g,lo)]),main,sideShade(sh,hi))};
  const bandsDraw=()=>{const n=Math.max(0,Math.min(3,K.bands|0)),edge=ringU(base+.4);if(open&&edge.length>1){stroke(edge,hw_(2.6),INK);stroke(edge,hw_(1.4),trim)}
   for(let i=1;i<=n;i++){const u=base+(top-base)*i/(n+1)*.85,a=ringU(u,.15);if(a.length>1){stroke(a,hw_(3),INK);stroke(a,hw_(1.8),trim)}}
   if(K.rivets){const u=open?base+1.4:base+(top-base)*.12;for(let q=0;q<16;q++){const t=q/16*6.2832;if(!faces([Math.cos(t),Math.sin(t),0]))continue;const k=flat?1:Math.sqrt(Math.max(0,1-((u-S0.cu)/S0.Ru)**2));dot(Jp(HL([Math.min(S0.cf+Math.cos(t)*S0.Rf*k,fmax)+.2,Math.sin(t)*S0.Rr*k,u])),Math.max(.9,s*.45*hs),INK)}}
   if(K.vband){const a=[];for(let q=0;q<=14;q++){const t=.12+q/14*(Math.PI-.5),f=S0.cf+Math.cos(t)*S0.Rf,u=flat?(q<3?base+(top-base)*q/3:top):S0.cu+Math.sin(t)*S0.Ru;a.push(Jp(HL([Math.min(flat?(q<3?S0.cf+S0.Rf:S0.cf+Math.cos(t)*S0.Rf):f,fmax),0,u+.2])))}stroke(a,hw_(3.4),INK);stroke(a,hw_(2),hi)}};
  const faceParts=()=>{const sl=K.slit||'none',su=2.5,line=(pts,wd)=>{if(pts.length>1)stroke(pts,hw_(wd),INK)};
   if(!open){if(sl==='single'||sl==='cross'){const a=[];for(let r=-7.5;r<=7.5;r+=1)if(SV(r,su))a.push(SP(r,su));line(a,3.2)}
    if(sl==='double')for(const u of[3.4,1.4]){const a=[];for(let r=-7.5;r<=7.5;r+=1)if(SV(r,u))a.push(SP(r,u));line(a,2.4)}
    if(sl==='cross'&&SV(0,0))line([SP(0,su),SP(0,-1),SP(0,-4),SP(0,-7.5)],3);
    if(sl==='eyes')for(const sd of[-1,1]){const a=[];for(let k=0;k<=4;k++){const r=sd*(1.4+k*1.1);if(SV(r,su))a.push(SP(r,su+Math.sin(k/4*Math.PI)*.5))}line(a,3)}
    const br=K.breaths||'none';for(const sd of[-1,1]){if(br==='holes'){for(let r=3;r<=7.5;r+=1.5)for(let u=-3.5;u>=-9.6;u-=2)if(SV(sd*r,u))dot(SP(sd*r,u),Math.max(.8,s*.4*hs),INK)}else if(br==='slots'||(br==='oneside'&&sd===1)){for(let r=3;r<=7.2;r+=1.4)if(SV(sd*r,-5))stroke([SP(sd*r,-3),SP(sd*r,-8)],hw_(1.3),INK)}}}
   else{
    if(K.face==='nasal'&&vis>.1){const a=[2.6,0,-2,-4.2].map(u=>Jp(HL([HE.cf+HE.Rf+1.4,0,u])));stroke(a,hw_(3.4),INK);stroke(a,hw_(2),main)}
    if(K.face==='cheek')for(const sd of[-1,1]){if(!fvis(sd*6,-3)&&vis>.2)continue;if(vis<-.2)continue;const pp=[[4.6,cb-1],[8.6,cb-1],[8.2,-7.5],[5.6,-9.6],[4.2,-5]].map(([r,u])=>Jp(HL(FPb(sd*r,u,1.4))));solid(pp,main,sideShade(sh,hi),{raw:true})}}};
  const visorUp=()=>{if(!open||!(K.face==='visor'||K.face==='mask')||vis<-.3)return;// 면갑 올림: 이마 위로 젖혀 올린 면갑판
   const lo=[],up_=[];for(let r=-8.5;r<=8.5;r+=1.7){lo.push(SP(r*w,cb+.4,3.4));up_.push(SP(r*w,cb+7.4,1.4))}solid([...lo,...up_.reverse()],main,sideShade(sh,hi),{raw:true});const sl=[];for(let r=-6.5;r<=6.5;r+=1.3)sl.push(SP(r*w,cb+2.4,3.2));stroke(sl,hw_(2.8),INK)};
  const crestK=()=>{const cr=K.crest||'none';
   if(cr==='ridge'){const a=[];for(let q=0;q<=10;q++){const t=.35+q/10*(Math.PI-.9);a.push(Jp(HL([S0.cf+Math.cos(t)*S0.Rf*.98,0,(flat?top:S0.cu+Math.sin(t)*S0.Ru)+.4])))}stroke(a,hw_(4.6),INK);stroke(a,hw_(2.6),hi)}
   else if(cr==='comb'){const lo=[],up=[];for(let q=0;q<=10;q++){const t=.4+q/10*(Math.PI-1),f=S0.cf+Math.cos(t)*S0.Rf*.95,u=flat?top:S0.cu+Math.sin(t)*S0.Ru*.98;lo.push(Jp(HL([f,0,u])));up.push(Jp(HL([f,0,u+4.5*Math.sin(q/10*Math.PI)**.6+.3])))}solid([...lo,...up.reverse()],acc,null,{raw:true})}
   else if(cr==='plume'){const B=[S0.cf,0,apex],sp=smooth([[0,0,0],[-2,0,4.5],[-7,0,7],[-13,0,5],[-17,0,-1],[-18,0,-7]].map(v=>Jp(HL([B[0]+v[0],0,B[2]+v[2]]))),3);for(const ps of[0,1,2])for(let i=0;i<sp.length-1;i++){const t=i/(sp.length-1),wd=(1-Math.abs(t-.35)*1.3)*6*s*.5*hs+1;stroke([sp[i],sp[i+1]],ps===0?wd+1.6:ps===1?wd:Math.max(.6,wd*.3),ps===0?INK:ps===1?acc:hexMix(acc,'#ffffff',.3))}dot(Jp(HL(B)),Math.max(1.5,2*s*hs),trim)}
   else if(cr==='spike'){const a=Jp(HL([S0.cf,-1.4,apex-.5])),b=Jp(HL([S0.cf,1.4,apex-.5])),t_=Jp(HL([S0.cf,0,apex+5.5]));solid([a,t_,b],trim,null,{raw:true})}};
  const wingDraw=near=>{if(K.crest!=='wings')return;for(const sd of[-1,1]){if(faces([0,sd,0])!==near)continue;const R=S0.Rr,bt=top-3,pp=[[-1,sd*(R-.5),bt-3],[0,sd*(R+3),bt+2],[-2,sd*(R+7),bt+9],[-6,sd*(R+7.5),bt+12.5],[-9,sd*(R+4),bt+8],[-6,sd*(R+.5),bt]].map(v=>Jp(HL(v)));solid(pp,hexMix(acc,'#ffffff',.82),null,{raw:true});for(const k of[.3,.55,.8]){const a=Jp(HL([-1-2*k,sd*(R+.4),bt-2])),b=lerp2(pp[2],pp[4],k);stroke([a,b],1,hexMix(acc,INK,.3))}}};
  const hornK=near=>{if(K.crest==='horns')hornDraw(near)};
  hornK(false);wingDraw(false);
  if(open){if(vis>=0){neckDraw();skull();ears();drawFace()}else{skull();ears();neckDraw()}brimDraw();shell();faceParts()}
  else{neckDraw();brimDraw();shell();faceParts()}
  bandsDraw();visorUp();crestK();hornK(true);wingDraw(true)};
 add(dep(head)+8,()=>{if(HW==='helm'&&HT==='custom'&&ch.chelm){customDraw(ch.chelm);return}if(HW==='helm'&&KIT){kitDraw(KIT);return}const top=(HT==='peak'||HT==='peakup')?[1,0,19.5]:HT==='great'?[-1,0,13.6]:HT==='kettle'?[-1,0,14]:[-1.5,0,12.6];
  if(HW==='coif'||HW==='hood'){hoodDraw(HW==='coif');return}
  if(HW==='none'){if(HINTS.face.vis>.3){hairDraw('back');skull();ears();drawFace();hairDraw('front')}else{skull();ears();drawFace();hairDraw('all')}return}
  if((ch.hcrest)==='horns')hornDraw(false);
  if(HT==='jin'){if(ch.hcrest==='horns')hornDraw(false);jinDraw();if(ch.hcrest==='horns')hornDraw(true);return}
  if(HT==='kettle'){skull();ears();drawFace();kettleDraw()}else if(HT==='great')greatDraw();else helmBody();crestDraw(top)},'head');
 const helmBody=()=>{// 투구 몸체(뒤통수까지 둥근 통) + 목덜미 가리개
  if(ch.helm==='peak'||ch.helm==='peakup'){// 뾰족 투구: 솟은 정수리, 앞뒤로 흐르는 능선, 아래로 벌어진 목가리개
   const sp=[];for(let la=-2;la<=3;la++)for(let lo=0;lo<16;lo++){const t=lo/16*6.2832,pp=la/3*1.15,r=Math.cos(pp);sp.push(HL([Math.cos(t)*11.6*r-1,Math.sin(t)*10.8*r,Math.sin(pp)*12.5]))}
   sp.push(HL([1,0,19.5]),HL([-2,0,18.5]));for(let lo=0;lo<16;lo++){const t=lo/16*6.2832;sp.push(HL([Math.cos(t)*11.8-1,Math.sin(t)*11.6,-14]))}
   solid(hullOf(sp),HPAL.steel,sideShade(HPAL.shade,HPAL.hi));
   for(const[u,rr_] of[[-10.5,11],[-13,11.6]]){const a=[];for(let q=0;q<=24;q++){const t=q/24*6.2832-Math.PI;if(faces([Math.cos(t),Math.sin(t),0]))a.push(Jp(HL([Math.cos(t)*rr_-1,Math.sin(t)*rr_,u])));else if(a.length>1)break;else a.length=0}if(a.length>1)stroke(a,1.1)}
   const kl=[[1,0,19.5],[-6,0,16],[-11.5,0,6],[-12,0,-6]].map(v=>Jp(HL(v)));stroke(smooth(kl,2),2.4*s*.5+1,INK);stroke(smooth(kl,2),1.1*s*.5,HPAL.hi||HPAL.steel);
   for(const sd of[-1,1])if(faces([0,sd,0])){const p=Jp(HL([1.5,sd*11.2,2]));dot(p,Math.max(2,s*1.6),INK);dot(p,Math.max(1.2,s*1),HPAL.steel);dot(p,Math.max(.6,s*.4),INK)}
   return}
  const sph=[];for(let la=-2;la<=3;la++)for(let lo=0;lo<14;lo++){const t=lo/14*6.2832,pp=la/3*1.2,r=Math.cos(pp);sph.push(HL([Math.cos(t)*12*r-1.5,Math.sin(t)*10.6*r,Math.sin(pp)*12.5]))}
  for(let lo=0;lo<14;lo++){const t=lo/14*6.2832;sph.push(HL([Math.cos(t)*9.5-2,Math.sin(t)*9.2,-12]))}
  const hp=hullOf(sph);solid(hp,HPAL.steel,sideShade(HPAL.shade,HPAL.hi));
  for(const u of[-8,-10.5])if(true){const a=[];for(let k=0;k<=20;k++){const t=k/20*6.2832-Math.PI;if(Math.cos(t)*sn+Math.sin(t)*cs>.05){a.push(Jp(HL([Math.cos(t)*10-2,Math.sin(t)*9.6,u])))}}if(a.length>1)stroke(a,1)}
  for(const sd of[-1,1]){const pv=HL([1,sd*10.8,1]);if(sd*cs>.2){const p=Jp(pv);dot(p,Math.max(1.3,s*.9),INK)}}};
 // 면갑(바이저)·턱가리개
 // 면갑 면 위의 눈구멍·숨구멍: nodes=[[높이,앞으로 나온 정도],...] 가운데 단면, kE=옆 끝의 앞 위치, su=눈구멍 높이, bu=숨구멍 높이들
 const vzFeat=(nodes,kE,su,bu)=>{const fcu=u=>{if(u>=nodes[0][0])return nodes[0][1];for(let i=0;i<nodes.length-1;i++){const[a0,f0]=nodes[i],[a1,f1]=nodes[i+1];if(u<=a0&&u>=a1)return lerp(f0,f1,(a0-u)/(a0-a1))}return nodes[nodes.length-1][1]};
  const kk=u=>Math.max(0,(fcu(u)-kE)/81),VS=(r,u,d=0)=>Jp(HL([fcu(u)-kk(u)*r*r+.3+d,r,u])),SV=(r,u)=>dep(HR([1,2*kk(u)*r,0]))>.03;
  const ln=(pts,w)=>{const a=pts.filter(([r,u])=>SV(r,u)).map(([r,u])=>VS(r,u));if(a.length>1)stroke(smooth(a,1),w,INK)},W1=2.6*s*.5+1,SLR=[];for(let r=-8.4;r<=8.4;r+=1.2)SLR.push(r);
  if(VZ.slit==='single'||VZ.slit==='cross')ln(SLR.map(r=>[r,su+.04*(8.4*8.4-r*r)/8]),W1);
  if(VZ.slit==='double'){ln(SLR.map(r=>[r,su+1]),W1*.8);ln(SLR.map(r=>[r,su-1.2]),W1*.8)}
  if(VZ.slit==='eyes')for(const sd of[-1,1])ln([1.4,2.4,3.4,4.4,5.6].map(r=>[sd*r,su+Math.sin((r-1.4)/4.2*Math.PI)*.5]),W1);
  if(VZ.slit==='cross')ln([[0,su],[0,su-2.4],[0,su-5.4],[0,su-8.9]],W1*.9);
  const br=VZ.breaths;for(const sd of[-1,1]){if(br==='holes'){for(let r=2.4;r<=6.4;r+=1.6)for(const u of bu)if(SV(sd*r,u))dot(VS(sd*r,u),Math.max(.9,s*.45),INK)}
   else if(br==='slots'||(br==='oneside'&&sd===1)){for(let r=2.4;r<=6.6;r+=1.4)if(SV(sd*r,bu[1]))stroke([VS(sd*r,bu[0]+.4),VS(sd*r,bu[bu.length-1]+.4)],1.6*s*.4+.8,INK)}}
  return{VS,SV}};
 const VZ=ch.vz||{design:'pointed',slit:'single',breaths:'holes',ridge:true};
 const PK={pointed:[14.5,16.5,15],round:[14,15,14.4],flat:[13.4,13.6,13.4],beak:[14,20.5,14.6]}[VZ.design]||[14.5,16.5,15];
 const visorPts=ch.helm==='peak'?[[1,0,19.5],[7,-8.5,9],[7,8.5,9],[11.5,0,11],[PK[0],-6,3],[PK[0],6,3],[PK[1],0,2],[PK[2],0,-6],[12.5,-8,-9],[12.5,8,-9],[9,0,-14],[5,-10.6,-8],[5,10.6,-8],[5,-10.8,4],[5,10.8,4]]:(ch.helm==='open'||ch.helm==='peakup')?[[2,-9.5,10],[6,0,13],[2,9.5,10],[-2,-9,12],[-2,9,12],[3,0,16]]:(VZ.design==='round'?[[9,-9,4],[12,0,6],[9,9,4],[13.5,-4,1],[13.5,4,1],[15,0,-1.5],[13,-4.5,-5.5],[13,4.5,-5.5],[12,-7,-7],[12,7,-7],[9,0,-11],[6,-9.2,-3],[6,9.2,-3]]:VZ.design==='flat'?[[10.5,-8.5,5],[12,0,6],[10.5,8.5,5],[12.6,-7,-1],[12.6,7,-1],[12.8,0,-1.5],[12,-6.5,-8],[12,6.5,-8],[9.5,0,-11],[6,-9.2,-3],[6,9.2,-3]]:VZ.design==='beak'?[[9,-9,4],[12,0,6],[9,9,4],[13,-4.5,3],[13,4.5,3],[20.5,0,-2],[13,-4.5,-6.5],[13,4.5,-6.5],[11,-7,-7.5],[11,7,-7.5],[9,0,-11],[6,-9.2,-3],[6,9.2,-3]]:[[9,-9,4],[12,0,6],[9,9,4],[17,0,-1.5],[12,-7,-7],[12,7,-7],[9,0,-11],[6,-9.2,-3],[6,9.2,-3]]);
 if(HW==='helm'&&HT!=='great'&&HT!=='kettle'&&HT!=='custom'&&HT!=='kit'&&HT!=='jin')add(dep(HL([12,0,0]))+8,()=>{const vp=hullOf(visorPts.map(HL));solid(vp,HPAL.steel,sideShade(HPAL.shade,HPAL.hi));
  if(ch.helm==='peak'){const ln=(pts,w,col)=>stroke(smooth(pts.map(v=>Jp(HL(v))),1),w,col);
   // 가운데 세로 능선
   if(VZ.ridge){ln([[1,0,19.5],[11.5,0,11],[PK[1],0,2],[PK[2],0,-6],[9.6,0,-13.6]],1.3,HPAL.hi||HPAL.steel);ln([[11.6,.6,11],[PK[1]+.1,.6,2],[PK[2]+.1,.6,-6]],1,HPAL.shade)}
   vzFeat([[11,11.5],[2,PK[1]],[-6,PK[2]],[-13.6,9.6]],10,5,[-2,-4.5,-7],ln);
   ln([[13,-7.5,-8.6],[9.6,0,-13.6],[13,7.5,-8.6]],1,INK)}
  else if(ch.helm==='open'||ch.helm==='peakup'){const face=hullOf([[8.5,-6,3],[8.5,6,3],[9.5,-5.5,-7],[9.5,5.5,-7],[11,0,-9]].map(HL));solid(face,skin,null,{w:lw*.8});c.save();path(face);c.clip();drawFace();c.restore()}
  else{// 면갑 투구: 디자인에 맞춘 면 위에 눈구멍·숨구멍·가운데 능선을 고른 대로
   const FC={pointed:[12.5,17,9.5],round:[12.5,15,9.5],flat:[12,12.8,10.5],beak:[12,20.5,9]}[VZ.design]||[12.5,17,9.5];
   const SVr=vzFeat([[6,FC[0]],[-1.5,FC[1]],[-11,FC[2]]],VZ.design==='flat'?9:8,2.4,[-3,-5.5,-8]);
   if(VZ.ridge&&SVr.SV(0,-4))stroke([SVr.VS(0,-1.5,.2),SVr.VS(0,-4,.2),SVr.VS(0,-10.5,.2)],1,HPAL.shade)}},'head');

 // ─ 팔: 폴드런(어깨)·리어브레이스(위팔)·쿠터(팔꿈치)·뱀브레이스(아래팔)·곤틀릿 ─
 for(const g of arms){const{side,S,E,Hn}=g,ud=norm(vsub(E,S)),wr=vsub(Hn,vmul(norm(vsub(Hn,E)),3.5)),out=[0,side,0];
  {const fw_=norm(vsub(Hn,E));LH('uarm',E,S,5.6*LM);LH('farm',wr,E,5*LM);LH('hand',vsub(wr,vmul(fw_,1.5)),vadd(Hn,vmul(fw_,3.5)),6*LM)}
  add(dep(vlerp(S,E,.5))+10,()=>tube(S,E,5.6*LM,5*LM,JA?{scales:true}:{lames:[.55],rivets:[.3]}),'uarm');
  add(dep(vlerp(E,wr,.5))+10.2,()=>tube(E,wr,5*LM,4.3*LM,{ridge:true}),'farm');
  add(Math.max(dep(E),dep(vlerp(S,E,.5)),dep(vlerp(E,wr,.5)))+11,()=>{disc(vadd(E,vadd(vmul(out,4.8*LM),[-3,0,0])),4.4*LM);disc(E,5.6*LM);dot(Jp(E),Math.max(1,s*.55),INK)});
  add(dep(Hn)+10.8,()=>{const fw=norm(vsub(Hn,E));tube(vsub(wr,vmul(fw,1.5)),vadd(wr,vmul(fw,3.5)),4.8*LM,6.8*LM,{lames:[.6],cap:.15,fill:glove,shade:hexMix(glove,INK,.4)});disc(Hn,4.8*LM,glove);
   const p=Jp(Hn),q=Jp(vadd(Hn,vmul(out,3)));for(let k=-1;k<=1;k++)stroke([[p[0]-3*s,p[1]+k*1.6*s],[p[0]+3*s,p[1]+k*1.6*s]],1)},'hand');
  add(Math.max(dep(S),dep(vlerp(S,E,.5)))+13,()=>{const top=vadd(S,[0,side*2,3]),lo=vadd(S,vmul(ud,12*psz));
   if(JA){tube(top,lo,8.6*psz,7.6*psz,{cap:.95,scales:true});const rim=Jp(top);stroke([[rim[0]-6.5*psz*s,rim[1]],[rim[0]+6.5*psz*s,rim[1]]],Math.max(1.4,s*.9),pal.trim);return}
   if(ch.paul==='haute'){const a=vadd(S,[-5,-side*3.5,4]),b=vadd(S,[6,-side*3.5,4]);const q=[Jp(a),Jp(b),Jp(vadd(b,[0,0,8*psz])),Jp(vadd(a,[0,0,9*psz]))];solid(q,pal.steel,sideShade(pal.shade,pal.hi),{raw:true})}
   tube(vadd(S,[5,-side*2,-1]),vadd(S,[10,-side*7,-7]),5.8*psz,4.4*psz,{lames:[.45],cap:.7});
   tube(top,lo,8.6*psz,7.6*psz,{lames:[.34,.52,.7,.86],cap:.95,rivets:[.15]});
   const rim=Jp(top);stroke([[rim[0]-6.5*psz*s,rim[1]],[rim[0]+6.5*psz*s,rim[1]]],Math.max(1.4,s*.9),pal.trim)})}

 // ─ 장검(양손검) ─
 const pom=vsub(hd,vmul(d,15)),guard=vadd(hd,vmul(d,4.5)),tip=vadd(hd,vmul(d,108));let gv=vcross(d,[0,0,1]);if(vlen(gv)<.2)gv=[0,1,0];gv=norm(gv);
 add(dep(vlerp(pom,guard,.5))+10.5,()=>{tube(pom,guard,1.8,1.8,{fill:pal.leather,shade:hexMix(pal.leather,INK,.4),hi:null,cap:.2});disc(pom,2.8)});
 add(dep(vlerp(guard,tip,.4))+10.4,()=>{const a=Jp(guard),b=Jp(tip),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,w0=2.6*s,w1=.9*s;
  const bp=[[a[0]+nx*w0,a[1]+ny*w0],[b[0]-dx/l*w1*2+nx*w1,b[1]-dy/l*w1*2+ny*w1],b,[b[0]-dx/l*w1*2-nx*w1,b[1]-dy/l*w1*2-ny*w1],[a[0]-nx*w0,a[1]-ny*w0]];
  solid(bp,pal.hi||PAPER,p=>{c.fillStyle=pal.steel;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.lineTo(b[0]+nx*w0*3,b[1]+ny*w0*3);c.lineTo(a[0]+nx*w0*3,a[1]+ny*w0*3);c.fill();stroke([lerp2(a,b,.02),lerp2(a,b,.72)],1,pal.shade)},{raw:true,w:lw*.8,edge:pal.shade});
  const g0=Jp(vadd(guard,vmul(gv,10))),g1=Jp(vsub(guard,vmul(gv,10)));stroke([g0,g1],3.6*s*.5+1.8,INK);stroke([g0,g1],2*s*.5,pal.trim)});

 P.sort((a,b)=>a.z-b.z);const sv=seed;for(const p of P){if(BR)seed=7001+p.i*131;PIECE_CAP?PIECE_CAP(()=>p.f(),p.tag):p.f()}if(BR)seed=sv;
 c.restore();
 return{a:Jp(tip),b:Jp(guard),h:Jp(hd),feet:legs.map(g=>Jp(g.F))}}

