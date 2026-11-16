/* ═══ 3D 월드 그림 그리기(그림 탭) ═══ painter.js의 paintModel과 붓 도구를 옮겨 와 3D 자료만으로 그린다.
   색·모양: 3D 화면 / 부위 조각: 3D 부위별 렌더(가려진 부분 제외, R3D2.eachPiece) / 붓질 안내값: 3D 뼈대(R3D2.hints).
   2D 파일(core.js·knight.js·editor.js·painter.js)의 계산은 쓰지 않는다(난수·보간·붓 획 함수는 이 안에 복사). 그림 탭 화면과 공유하는 상태(재료 옵션·그림판·단계 목록·붓 자국 사진)와 편집기 값은 W3HOST로만 닿는다. 화면(그림 탭 UI)은 painter.js 것을 그대로 쓰고, 3D 월드일 때 paintModel만 이 파일 것으로 바꿔 부른다. */
const P3D=(()=>{const INK='#12100e';let seed=1;const R=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let x=Math.imul(seed^seed>>>15,1|seed);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296};const rr=(a,b)=>a+(b-a)*R();
const lerp=(a,b,k)=>a+(b-a)*k,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp2=(a,b,k)=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k)];
function smooth(p,n=1,closed=false){for(let k=0;k<n;k++){const o=[];const m=closed?p.length:p.length-1;if(!closed)o.push(p[0]);for(let i=0;i<m;i++){const a=p[i],b=p[(i+1)%p.length];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])}if(!closed)o.push(p[p.length-1]);p=o}return p}
function brush(c,pts,w,o={}){const j=o.j??.5,tp=o.taper??1,col=o.col||INK,n=pts.length;if(n<2)return;const L=[],Rr=[];for(let i=0;i<n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;const q=i/(n-1);const prof=(1-tp)+tp*Math.pow(Math.sin(Math.PI*clamp(q*.96+.02,0,1)),.55);const wd=w*prof*(1+rr(-.22,.22))*.5;const jx=rr(-j,j),jy=rr(-j,j);L.push([pts[i][0]+jx-dy*wd,pts[i][1]+jy+dx*wd]);Rr.push([pts[i][0]+jx+dy*wd,pts[i][1]+jy-dx*wd])}c.fillStyle=col;c.beginPath();c.moveTo(L[0][0],L[0][1]);for(let i=1;i<n;i++)c.lineTo(L[i][0],L[i][1]);for(let i=n-1;i>=0;i--)c.lineTo(Rr[i][0],Rr[i][1]);c.closePath();c.fill()}
let HINTS={},PIECE_CAP=null,paintHints=null;/* 이 파일 안에서만 쓰는 안내값·조각 받기·안내값 사본 */
function drawBig(c,shape,x,y,a,l,w,col,a_,flatB){const rgbS=(q,k=0)=>`rgb(${clamp(q[0]*(1+k),0,255)|0},${clamp(q[1]*(1+k),0,255)|0},${clamp(q[2]*(1+k),0,255)|0})`,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,hl=l/2,hw=w/2;
 if(shape==='flat')return flatB(x,y,a,l,w,col,a_);
 if(BRISTLE.includes(shape)||shape.startsWith('img')){const C=[];for(let i=0;i<=10;i++){const t=i/10;C.push([x+dx*(t-.5)*l,y+dy*(t-.5)*l])}return ribbonPath(c,shape,C,w,[col,col,col],a_)}
 const poly=P=>{c.beginPath();P.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath()};
 if(shape==='round'){c.lineCap='round';c.globalAlpha=a_;c.strokeStyle=rgbS(col);c.lineWidth=w;c.beginPath();c.moveTo(x-dx*(hl-hw),y-dy*(hl-hw));c.lineTo(x+dx*(hl-hw),y+dy*(hl-hw));c.stroke();
  for(let i=0;i<4;i++){const o=rr(-.38,.38)*w;c.globalAlpha=a_*rr(.15,.35);c.strokeStyle=rgbS(col,R()<.5?.12:-.15);c.lineWidth=rr(.8,1.8);c.beginPath();c.moveTo(x-dx*hl*.7+nx*o,y-dy*hl*.7+ny*o);c.lineTo(x+dx*hl*.7+nx*o,y+dy*hl*.7+ny*o);c.stroke()}c.globalAlpha=1;return}
 if(shape==='fan'){const w0=w*.4,w1=w*1.35,P=[[x-dx*hl+nx*w0/2,y-dy*hl+ny*w0/2],[x+dx*hl+nx*w1/2,y+dy*hl+ny*w1/2],[x+dx*hl-nx*w1/2,y+dy*hl-ny*w1/2],[x-dx*hl-nx*w0/2,y-dy*hl-ny*w0/2]];
  c.globalAlpha=a_*.55;c.fillStyle=rgbS(col);poly(P);c.fill();const n=Math.max(6,Math.round(w/1.3));c.lineCap='round';
  for(let i=0;i<n;i++){if(R()<.25)continue;const t=i/(n-1)-.5,s0=[x-dx*hl+nx*t*w0,y-dy*hl+ny*t*w0],e=hl*rr(.85,1.25),s1=[x+dx*e+nx*t*w1,y+dy*e+ny*t*w1];c.globalAlpha=a_*rr(.55,.95);c.strokeStyle=rgbS(col,rr(-.12,.1));c.lineWidth=rr(.9,2.2);c.beginPath();c.moveTo(...s0);c.lineTo(...s1);c.stroke()}c.globalAlpha=1;return}
 // 나이프: 날카로운 평행사변형, 한쪽 긴 변은 밝게 반대쪽은 어둡게, 끝은 긁혀 얇아진다
 const sk=w*.55,P=[[x-dx*hl+nx*hw+dx*sk,y-dy*hl+ny*hw+dy*sk],[x+dx*hl+nx*hw+dx*sk*.3,y+dy*hl+ny*hw+dy*sk*.3],[x+dx*hl-nx*hw,y+dy*hl-ny*hw],[x-dx*hl-nx*hw,y-dy*hl-ny*hw]];
 c.globalAlpha=a_;c.fillStyle=rgbS(col);poly(P);c.fill();
 const g=c.createLinearGradient(x-dx*hl,y-dy*hl,x+dx*hl,y+dy*hl);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.75,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,.35)');c.globalAlpha=1;c.fillStyle=g;poly(P);c.fill();
 c.lineCap='butt';c.globalAlpha=a_*.7;c.strokeStyle=rgbS(col,.3);c.lineWidth=1.2;c.beginPath();c.moveTo(...P[0]);c.lineTo(...P[1]);c.stroke();c.strokeStyle=rgbS(col,-.35);c.beginPath();c.moveTo(...P[3]);c.lineTo(...P[2]);c.stroke();
 c.globalAlpha=a_*.25;c.strokeStyle=rgbS(col,.15);c.lineWidth=.8;const o=rr(-.2,.2)*w;c.beginPath();c.moveTo(x-dx*hl*.6+nx*o,y-dy*hl*.6+ny*o);c.lineTo(x+dx*hl*.9+nx*o,y+dy*hl*.9+ny*o);c.stroke();c.globalAlpha=1}
// 길게 이어 긋기: 부품 하나를 끝에서 끝까지 한 번에 긋는 휘어진 띠. 붓 모양에 따라 굵기 변화와 끝 처리가 다르다
// 길게 이어 긋기: 중심선을 만든 뒤 붓 띠로 그린다
function drawLong(c,shape,x,y,a,l,w,cols,a_,bend){const n=14,dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,bd=(bend||0)*Math.min(l*.06,w*.9),C=[];
 for(let i=0;i<=n;i++){const t=i/n,o=bd*Math.sin(Math.PI*t)+rr(-.6,.6);C.push([x+dx*(t-.5)*l+nx*o,y+dy*(t-.5)*l+ny*o])}ribbonPath(c,shape,C,w,cols,a_)}
const BRISTLE=['dry','split','rough'];
// 부품의 실제 바깥 테두리를 따라 걷는다(무어 이웃 추적). 점마다 안쪽 방향과 그 자리 두께를 함께 돌려준다
function contourOf(d,N,inM){const S=2,G=N/S|0,f=(x,y)=>x>=0&&y>=0&&x<G&&y<G&&d[((y*S)*N+x*S)*4+3]>60;let sx=-1,sy=-1;
 for(let y=0;y<G&&sx<0;y++)for(let x=0;x<G;x++)if(f(x,y)){sx=x;sy=y;break}if(sx<0)return null;
 const DX=[1,1,0,-1,-1,-1,0,1],DY=[0,1,1,1,0,-1,-1,-1],P=[[sx,sy]];let cx=sx,cy=sy,prev=6,guard=0;
 while(guard++<12000){let found=false;const st=(prev+6)%8;for(let k=0;k<8;k++){const i=(st+k)%8,nx=cx+DX[i],ny=cy+DY[i];if(f(nx,ny)){cx=nx;cy=ny;prev=i;found=true;break}}if(!found)break;if(cx===sx&&cy===sy)break;P.push([cx,cy])}
 if(P.length<8)return null;
 // 3px 간격으로 다시 고르고 살짝 다듬기
 const R_=[];let acc=0;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];if(!i||acc>=1.5){R_.push([a[0]*S,a[1]*S]);acc=0}acc+=Math.hypot(b[0]-a[0],b[1]-a[1])}
 const n=R_.length,SM=R_.map((_,i)=>{let x=0,y=0;for(let j=-1;j<=1;j++){const q=R_[(i+j+n)%n];x+=q[0];y+=q[1]}return[x/3,y/3]});
 let A=0;for(let i=0;i<n;i++){const a=SM[i],b=SM[(i+1)%n];A+=a[0]*b[1]-b[0]*a[1]}const sg=A>0?1:-1;
 return SM.map((q,i)=>{const a=SM[(i-2+n)%n],b=SM[(i+2)%n],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*sg,ny=dx/l*sg;let t=0;while(t<60&&inM(q[0]+nx*(t+2),q[1]+ny*(t+2)))t+=2;return{x:q[0],y:q[1],nx,ny,t}})}
// 볼록 껍질(점 배열 [x,y,x,y…]) + 거의 일직선인 꼭짓점 정리
function hull2(a){const P=[];for(let i=0;i<a.length;i+=2)P.push([a[i],a[i+1]]);P.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);if(P.length<3)return P;const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
 for(const p of P){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}for(let i=P.length-1;i>=0;i--){const p=P[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}
 let H=lo.slice(0,-1).concat(up.slice(0,-1));for(let it=0;it<3;it++){const out=[];for(let i=0;i<H.length;i++){const a=H[(i-1+H.length)%H.length],b=H[i],c=H[(i+1)%H.length],a1=Math.atan2(b[1]-a[1],b[0]-a[0]),a2=Math.atan2(c[1]-b[1],c[0]-b[0]),dA=Math.abs(Math.atan2(Math.sin(a2-a1),Math.cos(a2-a1)));if(dA>.3||Math.hypot(b[0]-a[0],b[1]-a[1])>40)out.push(b)}if(out.length>=3)H=out}return H}
// 먹붓 1~4: 붓 자국 사진에서 오려 낸 모양. 먹을 투명도로 바꿔 두고, 그릴 때 색을 입혀 획을 따라 늘이고 휘어 붙인다
/* 붓 자국 사진은 그림 탭(painter.js)과 같은 것을 쓴다 */
const BSCR=document.createElement('canvas');BSCR.width=1024;BSCR.height=256;
function imgRibbon(c,idx,C,w,cols,a_,len){const im=W3HOST.paint.brushImg[idx];if(!im||!im.complete||!im.naturalWidth)return ribbonPath(c,'dry',C,w,cols,a_);
 const g=BSCR.getContext('2d'),k=len>1000?1000/len:1,SW=Math.max(8,Math.round(len*k)),SH=Math.max(4,Math.min(250,Math.round(w*1.35*k)));
 g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,SW+4,SH+4);
 if(R()<.5){g.save();g.translate(0,SH);g.scale(1,-1);g.drawImage(im,0,0,SW,SH);g.restore()}else g.drawImage(im,0,0,SW,SH);
 g.globalCompositeOperation='source-in';const gr=g.createLinearGradient(0,0,SW,0);gr.addColorStop(0,rgbQ(cols[0]));gr.addColorStop(.5,rgbQ(cols[1]));gr.addColorStop(1,rgbQ(cols[2]));g.fillStyle=gr;g.fillRect(0,0,SW,SH);g.globalCompositeOperation='source-over';
 let u=0;c.globalAlpha=a_;for(let i=1;i<C.length;i++){const p0=C[i-1],p1=C[i],dx=p1[0]-p0[0],dy=p1[1]-p0[1],sl=Math.hypot(dx,dy);if(sl<.01)continue;
  c.save();c.translate(p0[0],p0[1]);c.rotate(Math.atan2(dy,dx));c.drawImage(BSCR,Math.min(SW-1,u*k),0,Math.max(1,Math.min(SW-u*k,(sl+.8)*k)),SH,0,-SH/k/2,sl+.8,SH/k);c.restore();u+=sl}
 c.globalAlpha=1}
const rgbQ=(q,k=0)=>`rgb(${clamp(q[0]*(1+k),0,255)|0},${clamp(q[1]*(1+k),0,255)|0},${clamp(q[2]*(1+k),0,255)|0})`;
const colT=(cols,t)=>t<.5?cols[0].map((v,i)=>lerp(v,cols[1][i],t*2)):cols[1].map((v,i)=>lerp(v,cols[2][i],(t-.5)*2));
// 임의의 중심선(C)을 따라 붓 띠 하나를 그린다. 붓 모양마다 굵기 변화·결·끝 처리가 다르다
function ribbonPath(c,shape,C,w,cols,a_){const n=C.length-1;if(n<1)return;const NR=[];let len=0;for(let i=0;i<=n;i++){const a=C[Math.max(0,i-1)],b=C[Math.min(n,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;NR.push([-dy/l,dx/l]);if(i)len+=Math.hypot(C[i][0]-C[i-1][0],C[i][1]-C[i-1][1])}
 if(BRISTLE.includes(shape))return bristleRibbon(c,shape,C,NR,w,cols,a_,len);
 if(shape.startsWith('img'))return imgRibbon(c,+shape.slice(3)-1,C,w,cols,a_,len);
 const prof=t=>shape==='round'?Math.sqrt(Math.max(0,1-Math.pow(2*t-1,6))):shape==='fan'?(.45+.9*t)*(t>.93?(1-t)/.07*.6+.4:1):shape==='knife'?(t<.06?t/.06:1)*(1-.35*t):(t<.04?.85:1)*(t>.9?1-(t-.9)*3:1);
 const L=[],Rr=[];for(let i=0;i<=n;i++){const t=i/n,hw=w/2*prof(t)*(1+rr(-.06,.06));L.push([C[i][0]+NR[i][0]*hw,C[i][1]+NR[i][1]*hw]);Rr.push([C[i][0]-NR[i][0]*hw,C[i][1]-NR[i][1]*hw])}
 const g=c.createLinearGradient(C[0][0],C[0][1],C[n][0],C[n][1]);g.addColorStop(0,rgbQ(cols[0]));g.addColorStop(.5,rgbQ(cols[1]));g.addColorStop(1,rgbQ(cols[2]));
 c.globalAlpha=a_;c.fillStyle=g;c.beginPath();L.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));for(let i=n;i>=0;i--)c.lineTo(Rr[i][0],Rr[i][1]);c.closePath();c.fill();
 c.lineCap='round';c.lineJoin='round';const streak=shape==='knife'?1:shape==='fan'?7:Math.max(2,Math.min(5,Math.round(w/3)));
 for(let s=0;s<streak;s++){const off=rr(-.42,.42),k=R()<.5?.18:-.22,t0=rr(0,.25),t1=rr(.7,1);c.globalAlpha=a_*rr(.2,.45);c.strokeStyle=rgbQ(cols[1],k);c.lineWidth=rr(.7,1.6);c.beginPath();let on=false;
  for(let i=Math.round(t0*n);i<=Math.round(t1*n);i++){const q=lerp2(L[i],Rr[i],.5+off);if(R()<.08){on=false;continue}on?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]);on=true}c.stroke()}
 if(shape==='knife'){c.globalAlpha=a_*.6;c.strokeStyle=rgbQ(cols[1],.35);c.lineWidth=1.3;c.beginPath();L.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke();c.strokeStyle=rgbQ(cols[1],-.4);c.beginPath();Rr.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke()}
 if(shape==='flat'||shape==='fan'){const e=C[n],e0=C[Math.max(0,n-1)],dl=Math.hypot(e[0]-e0[0],e[1]-e0[1])||1,dx=(e[0]-e0[0])/dl,dy=(e[1]-e0[1])/dl,m=Math.max(3,Math.round(w/1.8));c.strokeStyle=rgbQ(cols[2]);for(let i=0;i<m;i++){if(R()<.4)continue;const t=i/(m-1),q=lerp2(L[n],Rr[n],t),ext=rr(.03,.12)*len;c.globalAlpha=a_*rr(.5,.85);c.lineWidth=rr(.8,1.6);c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(q[0]+dx*ext,q[1]+dy*ext);c.stroke()}}
 c.globalAlpha=1}
// 마른 붓·갈라진 붓·거친 붓: 붓털 한 가닥씩 따로 긋는다. 시작은 빽빽하게 붙고, 끝으로 갈수록 가닥이 갈라지고 끊긴다
function bristleRibbon(c,shape,C,NR,w,cols,a_,len){const n=C.length-1,nb=Math.max(8,Math.min(34,Math.round(w/1.2))),bw=w/nb*(shape==='split'?2.8:2.4);c.lineCap='round';c.lineJoin='round';
 // 붓의 몸통: 마른 붓은 앞쪽만, 거친 붓은 전체에 빽빽한 속을 먼저 깐다
 const core=(tEnd,hwf)=>{const iE=Math.max(1,Math.round(tEnd*n)),Lp=[],Rp=[];for(let i=0;i<=iE;i++){const t=i/n,hw=w*hwf*(shape==='dry'?1-.2*t:1)*(1+rr(-.08,.08));Lp.push([C[i][0]+NR[i][0]*hw,C[i][1]+NR[i][1]*hw]);Rp.push([C[i][0]-NR[i][0]*hw,C[i][1]-NR[i][1]*hw])}
  const g=c.createLinearGradient(C[0][0],C[0][1],C[iE][0],C[iE][1]);g.addColorStop(0,rgbQ(cols[0]));g.addColorStop(1,rgbQ(colT(cols,tEnd)));c.globalAlpha=a_;c.fillStyle=g;c.beginPath();Lp.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));for(let i=iE;i>=0;i--)c.lineTo(Rp[i][0],Rp[i][1]);c.closePath();c.fill()};
 if(shape==='dry')core(rr(.45,.62),.4);else if(shape==='rough')core(rr(.8,.95),.3);
 const clumps=shape==='split'?Array.from({length:3+(R()*2|0)},()=>rr(-.46,.46)):null;
 for(let b=0;b<nb;b++){let off=b/(nb-1)-.5;const cl=clumps?clumps[b%clumps.length]:0;if(clumps)off=cl+off*.22;
  let t0=rr(0,.05),t1;
  if(shape==='dry'){t1=Math.abs(off)>.32?rr(.3,.75):rr(.55,1.04);t0=rr(0,.04)}else if(shape==='split'){t0=rr(0,.14);t1=rr(.72,1.03)}else{t0=rr(0,.08);t1=rr(.82,1.03)}
  const gap0=shape==='dry'?.03:shape==='rough'?.08:.02,jit=shape==='rough'?.06:.025,cm=colT(cols,(t0+t1)/2);
  c.strokeStyle=rgbQ(cm,rr(-.08,.06));c.lineWidth=bw*rr(.65,1.15);c.globalAlpha=a_*rr(.75,1);
  c.beginPath();let on=false;const i0=Math.round(t0*n),i1=Math.min(n,Math.round(t1*n));
  for(let i=i0;i<=i1;i++){const t=i/n,env=shape==='dry'?1-.25*t:shape==='split'?.85+.4*t:1-.1*Math.abs(2*t-1),o=(off*env+rr(-jit,jit))*w;
   const q=[C[i][0]+NR[i][0]*o,C[i][1]+NR[i][1]*o];
   if(R()<gap0*(1+(shape==='dry'?5*t:1))){if(on)c.stroke();c.beginPath();on=false;continue}
   on?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]);on=true}
  if(on)c.stroke()}
 if(shape==='rough'||shape==='dry'){const k=shape==='rough'?6:3;for(let i=0;i<k;i++){const t=rr(.2,1),ii=Math.round(t*n),o=rr(-.75,.75)*w,q=[C[ii][0]+NR[ii][0]*o,C[ii][1]+NR[ii][1]*o],e=C[Math.min(n,ii+1)],dx=e[0]-C[ii][0],dy=e[1]-C[ii][1],dl=Math.hypot(dx,dy)||1,l=rr(3,12);c.globalAlpha=a_*rr(.5,.9);c.strokeStyle=rgbQ(colT(cols,t));c.lineWidth=rr(.6,1.4);c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(q[0]+dx/dl*l,q[1]+dy/dl*l);c.stroke()}}
 c.globalAlpha=1}
function paintModel(onProgress){
 if(W3HOST.paint.paintJob)W3HOST.paint.paintJob.cancel=true;const job={cancel:false};W3HOST.paint.paintJob=job;
 const N=900,src=document.createElement('canvas');src.width=src.height=N;const sc_=src.getContext('2d');
 // 1. 모델을 깨끗한 바탕에 한 번 그린다 (붓터치 그림체도 먹선으로 바꿔 색을 고르게 뽑는다)
 const m=W3HOST.proj.model.style==='knight'&&W3HOST.paint.popt.medium!=='oil2'?{...W3HOST.proj.model,paint:['flat','ljs','oil3'].includes(W3HOST.paint.popt.medium)?'plain':'brush'}:W3HOST.proj.model;
 let s=Math.min(N/1.25,N)/(m.style==='robot'?262:224)*.9,X=N/2,Y=N*.84;const sv=seed;
 // 3D 월드2에서 그리면: 색·모양 원본은 3D 화면(같은 투영)으로, 부품 위치·얼굴 같은 안내값(HINTS)과 부품 나누기는 같은 식의 2D 계산으로
 const USE3=R3D2.ok(m)&&R3D2.init();/* 3D 전용: 색·모양은 언제나 3D 화면 */
 const snap3=(mm,lo)=>{const lines=lo||(mm.paint==='plain'?{wOut:0,wBnd:0,wArm:0}:{wOut:W3HOST.opt.w3o??.8,wBnd:W3HOST.opt.w3b??.8,wArm:W3HOST.opt.w3a??1});R3D2.render(mm,W3HOST.PB.disp,W3HOST.PB.down,X,Y,s,N,N,1,{shade:W3HOST.opt.shade3||'screen',...lines});sc_.drawImage(document.getElementById('gl3d2'),0,0,N,N);if(typeof W3HOST.wake==='function')W3HOST.wake(300)};
 const draw2=()=>{sc_.clearRect(0,0,N,N);seed=11;HINTS=R3D2.hints(m,W3HOST.PB.disp,W3HOST.PB.down,X,Y,s)};/* 붓질 안내값은 3D 뼈대에서 */
 const draw=USE3?()=>{draw2();sc_.clearRect(0,0,N,N);snap3(m)}:draw2;draw();
 // 그림 칸에 꽉 차게: 한 번 그려 크기를 재고, 비율을 맞춰 다시 그린다
 {const d0=sc_.getImageData(0,0,N,N).data;let x0=N,x1=0,y0=N,y1=0;for(let y=0;y<N;y+=3)for(let x=0;x<N;x+=3)if(d0[(y*N+x)*4+3]>40){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
  if(x1>x0){const f=Math.min(2.4,.74*N/Math.max(x1-x0,y1-y0)),cx=(x0+x1)/2,cy=(y0+y1)/2;s*=f;X=N/2-(cx-X)*f;Y=N*.47-(cy-Y)*f;draw()}}seed=sv;
 const D=sc_.getImageData(0,0,N,N).data;
 // 유화3: 평붓은 테두리 없는 모습으로 그리되, 유화 단계(결 붓칠·외곽선)는 테두리 있는 모습을 원본으로 쓴다
 const D2=(W3HOST.paint.popt.medium==='oil3'&&W3HOST.proj.model.style==='knight')?(()=>{const hs0=HINTS,sv2=seed;sc_.clearRect(0,0,N,N);seed=11;HINTS={};snap3({...W3HOST.proj.model,paint:'ink'});const d=sc_.getImageData(0,0,N,N).data;HINTS=hs0;seed=sv2;return d})():null,D_OUT=D;
 // 이중섭풍 4단계 첫 붓: 3D 경계선(부품 경계·겹판 줄) 자리. 경계선만 켠 모습과 선 없는 모습을 같은 투영으로 그려 어두워진 칸을 경계선 칸으로 잡는다(외곽선은 3단계가 감으므로 뺀다)
 const BLM=(USE3&&W3HOST.paint.popt.medium==='ljs')?(()=>{const sv3=seed,hs0=HINTS,keep=sc_.getImageData(0,0,N,N),wa=W3HOST.opt.w3a??1,mm={...m,paint:'ink'};
  sc_.clearRect(0,0,N,N);snap3(mm,{wOut:0,wBnd:Math.max(.8,W3HOST.opt.w3b??.8),wArm:wa});const A=sc_.getImageData(0,0,N,N).data;sc_.clearRect(0,0,N,N);snap3(mm,{wOut:0,wBnd:0,wArm:wa});const B=sc_.getImageData(0,0,N,N).data;
  sc_.putImageData(keep,0,0);HINTS=hs0;seed=sv3;const M=new Uint8Array(N*N);for(let i=0;i<N*N;i++){const q=i*4;if(A[q+3]>60&&B[q+3]>60&&(B[q]+B[q+1]+B[q+2])-(A[q]+A[q+1]+A[q+2])>90)M[i]=1}return M})():null;
 // 평붓 터치: 부품(관절) 하나씩 따로 그려 모양·방향·색을 재고, 그 안을 채울 굵은 붓 자국을 미리 만든다
 const SZ0={big:1.45,mid:1,fine:.68}[W3HOST.paint.popt.size],parts=[],mparts=[],pgeo=[],heads=[],IG=Math.ceil(N/3),IDB=new Int32Array(IG*IG),headPids=new Set();let pidN=0;
 const limbPids=new Map(),LIMBK=['thigh','shin','foot','uarm','farm','hand','torso','waist'];
 if(['flat','ljs','oil2','oil3'].includes(W3HOST.paint.popt.medium)&&(m.style==='knight'||m.style==='mech')){
  const ana=d=>{let n=0,sx=0,sy=0;const pts=[];for(let y=0;y<N;y+=3)for(let x=0;x<N;x+=3)if(d[(y*N+x)*4+3]>60){n++;sx+=x;sy+=y;pts.push(x,y)}if(n<3)return null;
   const mx=sx/n,my=sy/n;let cxx=0,cyy=0,cxy=0;for(let i=0;i<pts.length;i+=2){const dx=pts[i]-mx,dy=pts[i+1]-my;cxx+=dx*dx;cyy+=dy*dy;cxy+=dx*dy}
   const th=.5*Math.atan2(2*cxy,cxx-cyy),ux=Math.cos(th),uy=Math.sin(th),vx=-uy,vy=ux;let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
   for(let i=0;i<pts.length;i+=2){const dx=pts[i]-mx,dy=pts[i+1]-my,u=dx*ux+dy*uy,v=dx*vx+dy*vy;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v)}
   const inM=(x,y)=>{x|=0;y|=0;return x>=0&&y>=0&&x<N&&y<N&&d[(y*N+x)*4+3]>60};
   const col=(x,y)=>{let r=0,g=0,b=0,k=0;for(let j=-4;j<=4;j+=2)for(let i=-4;i<=4;i+=2){const xx=clamp(x+i|0,0,N-1),yy=clamp(y+j|0,0,N-1),q=(yy*N+xx)*4;if(d[q+3]>60){r+=d[q];g+=d[q+1];b+=d[q+2];k++}}return k?[r/k,g/k,b/k,1]:null};
   const T=v1-v0+3;
   // 줄 단위로 부품을 채우는 붓 자국 목록: base는 기준 붓 폭, W·Lm은 폭·길이 배율, long은 길게 이어 긋기
   const rows=(base,W,Lm,long,keep)=>{const nr=Math.max(1,Math.round(T/(base*SZ0*W))),rw=T/nr,out=[];
   for(let ri=0;ri<nr;ri++){const v=v0+rw*(ri+.5);let run=null;
    const flush=uEnd=>{if(run===null)return;if(long&&uEnd-run>4){const L=uEnd-run,pc=t=>{const uc=run+L*t;return col(mx+ux*uc+vx*v,my+uy*uc+vy*v)},c1=pc(.5);if(c1&&R()<keep)out.push({x:mx+ux*(run+L/2)+vx*v,y:my+uy*(run+L/2)+vy*v,a:th,l:L+rw*.5,w:rw*1.05,p:c1,p0:pc(.12)||c1,p2:pc(.88)||c1,long:true,bend:rr(-1,1)});run=null;return}let a=run;while(a<uEnd-1){const L=Math.min(uEnd-a,rr(22,40)*SZ0*Lm*Math.sqrt(base/17)),uc=a+L/2,x=mx+ux*uc+vx*v,y=my+uy*uc+vy*v,c_=col(x,y);if(c_&&R()<keep)out.push({x,y,a:th+rr(-.05,.05),l:L+rw*.25,w:rw*1.18,p:c_});a+=L*.85}run=null};
    for(let u=u0;u<=u1+3;u+=3){const x=mx+ux*u+vx*v,y=my+uy*u+vy*v;if(inM(x,y)){if(run===null)run=u}else flush(u)}flush(u1+3)}
   return out};
   const thick=W3HOST.paint.popt.medium==='ljs'?rows(15,1,1,true,1):rows(17,W3HOST.paint.popt.bw,W3HOST.paint.popt.bl,W3HOST.paint.popt.blong,1);if(!thick.length){const c_=col(mx,my);if(c_)thick.push({x:mx,y:my,a:th,l:Math.max(6,u1-u0+3),w:Math.max(4,T),p:c_})}
   const mid=W3HOST.paint.popt.mon?rows(8.5,W3HOST.paint.popt.mw,W3HOST.paint.popt.ml,W3HOST.paint.popt.mlong,.8):[];
   // 부품의 양쪽 가장자리: 축을 따라 가며 부품 안쪽의 가장 바깥 점을 모은다
   const EL=[],ER=[];if(W3HOST.paint.popt.medium==='ljs'){for(let u=u0;u<=u1;u+=3){let lo=null,hi=null;for(let v=v0;v<=v1;v+=2){if(inM(mx+ux*u+vx*v,my+uy*u+vy*v)){if(lo===null)lo=v;hi=v}}if(lo!==null){EL.push([u,lo]);ER.push([u,hi])}}}
   // 이중섭풍: 부품 안의 '면'(같은 색 덩어리)과 그늘 방향을 잰다
   let faces=[],shd=[0,0],plum=.5;if(W3HOST.paint.popt.medium==='ljs'){const F=new Map();let ls=0,ln=0;const key=(r,g,b)=>((r>>4)<<8)|((g>>4)<<4)|(b>>4);
    for(let i=0;i<pts.length;i+=2){const x=pts[i],y=pts[i+1],q=(y*N+x)*4,l=(d[q]*.3+d[q+1]*.59+d[q+2]*.11)/255;ls+=l;ln++;const k=key(d[q],d[q+1],d[q+2]);let f=F.get(k);if(!f){f={p:[],l:0};F.set(k,f)}f.p.push(x,y);f.l+=l}
    plum=ln?ls/ln:.5;let sx=0,sy=0;for(let i=0;i<pts.length;i+=2){const x=pts[i],y=pts[i+1],q=(y*N+x)*4,l=(d[q]*.3+d[q+1]*.59+d[q+2]*.11)/255;const wgt=plum-l;sx+=(x-mx)*wgt;sy+=(y-my)*wgt}const sl=Math.hypot(sx,sy);shd=sl>1e-6?[sx/sl,sy/sl]:[0,0];
    const tot=pts.length/2;for(const f of F.values()){const n_=f.p.length/2;if(n_<Math.max(14,tot*.08))continue;const H=hull2(f.p);if(H.length<3)continue;let cx=0,cy=0,xx=0,yy=0,xy=0;for(let i=0;i<f.p.length;i+=2){cx+=f.p[i];cy+=f.p[i+1]}cx/=n_;cy/=n_;for(let i=0;i<f.p.length;i+=2){const a=f.p[i]-cx,b=f.p[i+1]-cy;xx+=a*a;yy+=b*b;xy+=a*b}
     faces.push({H,cx,cy,n:n_,lum:f.l/n_,ang:.5*Math.atan2(2*xy,xx-yy),elong:Math.sqrt((xx+yy+Math.hypot(xx-yy,2*xy))/(xx+yy-Math.hypot(xx-yy,2*xy)+1e-6))})}}
   const phull=W3HOST.paint.popt.medium==='ljs'?hull2(pts):null,cont=W3HOST.paint.popt.medium==='ljs'?contourOf(d,N,inM):null;let circ=0;if(phull&&phull.length>=3){let A=0,P=0;for(let k=0;k<phull.length;k++){const a=phull[k],b=phull[(k+1)%phull.length];A+=a[0]*b[1]-b[0]*a[1];P+=Math.hypot(b[0]-a[0],b[1]-a[1])}A=Math.abs(A)/2;circ=P>0?4*Math.PI*A/(P*P):0}
   return{thick,mid:W3HOST.paint.popt.medium==='ljs'?[]:mid,geo:{mx,my,th,u0,u1,v0,v1,T,EL,ER,faces,shd,plum,phull,circ,cont}}};
  PIECE_CAP=(run,tag)=>{sc_.clearRect(0,0,N,N);run();const dd=sc_.getImageData(0,0,N,N).data;pidN++;for(let y=0;y<N;y+=3)for(let x=0;x<N;x+=3)if(dd[(y*N+x)*4+3]>60)IDB[(y/3)*IG+x/3]=pidN;if(tag==='head')headPids.add(pidN);if(LIMBK.includes(tag))limbPids.set(pidN,tag);const r=ana(dd);if(r){r.geo.tag=tag;r.geo.pid=pidN;if(tag==='head')heads.push(r.geo);if(r.thick.length)parts.push(r.thick);if(r.geo.u1-r.geo.u0>6||r.geo.T>6)pgeo.push(r.geo);if(r.mid.length)mparts.push(r.mid)}};
  try{seed=11;HINTS=R3D2.hints(m,W3HOST.PB.disp,W3HOST.PB.down,X,Y,s);const lines=m.paint==='plain'?{wOut:0,wBnd:0,wArm:0}:{wOut:W3HOST.opt.w3o??.8,wBnd:W3HOST.opt.w3b??.8,wArm:W3HOST.opt.w3a??1};R3D2.eachPiece(m,W3HOST.PB.disp,W3HOST.PB.down,X,Y,s,N,{shade:W3HOST.opt.shade3||'screen',...lines},PIECE_CAP,sc_)}finally{PIECE_CAP=null}/* 부위 조각은 3D에서 부위별로(보이는 부분만) */}
 paintHints=JSON.parse(JSON.stringify(HINTS));
 // 2. 밝기와 결 방향 (작게 줄여서 계산)
 const G=3,gw=N/G|0,lum=new Float32Array(gw*gw),alp=new Float32Array(gw*gw);
 for(let y=0;y<gw;y++)for(let x=0;x<gw;x++){const i=((y*G)*N+x*G)*4;lum[y*gw+x]=(D[i]*.3+D[i+1]*.59+D[i+2]*.11)/255;alp[y*gw+x]=D[i+3]/255}
 const gang=new Float32Array(gw*gw),gmag=new Float32Array(gw*gw);
 for(let y=1;y<gw-1;y++)for(let x=1;x<gw-1;x++){const L=(a,b)=>lum[(y+b)*gw+x+a]*alp[(y+b)*gw+x+a]+(1-alp[(y+b)*gw+x+a]);
  const gx=L(1,-1)+2*L(1,0)+L(1,1)-L(-1,-1)-2*L(-1,0)-L(-1,1),gy=L(-1,1)+2*L(0,1)+L(1,1)-L(-1,-1)-2*L(0,-1)-L(1,-1);gang[y*gw+x]=Math.atan2(gy,gx);gmag[y*gw+x]=Math.hypot(gx,gy)}
 const at=(x,y)=>{x=clamp(x|0,0,N-1);y=clamp(y|0,0,N-1);const i=(y*N+x)*4;return[D[i],D[i+1],D[i+2],D[i+3]/255]};
 const gAt=(x,y)=>{const i=clamp(y/G|0,0,gw-1)*gw+clamp(x/G|0,0,gw-1);return[gang[i],gmag[i]]};
 let bx0=N,bx1=0,by0=N,by1=0;for(let y=0;y<gw;y++)for(let x=0;x<gw;x++)if(alp[y*gw+x]>.5){bx0=Math.min(bx0,x*G);bx1=Math.max(bx1,x*G);by0=Math.min(by0,y*G);by1=Math.max(by1,y*G)}
 const rgb=(c,k=0)=>{const f=1+k;return`rgb(${clamp(c[0]*f,0,255)|0},${clamp(c[1]*f,0,255)|0},${clamp(c[2]*f,0,255)|0})`};
 const toward=(c,t,k)=>[lerp(c[0],t[0],k),lerp(c[1],t[1],k),lerp(c[2],t[2],k),c[3]];
 const SZ={big:1.45,mid:1,fine:.68}[W3HOST.paint.popt.size],wet=W3HOST.paint.popt.wet,PAPERRGB=[255,255,255];
 // 3. 바깥에 그릴 캔버스
 const o=document.createElement('canvas');o.width=o.height=N;const c=o.getContext('2d');
 const jobs=[],push=f=>jobs.push(f);let curStage=null;W3HOST.paint.paintStages=[];W3HOST.paint.stageSel=-1;const snap=n=>{const t=document.createElement('canvas');t.width=t.height=600;t.getContext('2d').drawImage(o,0,0,600,600);W3HOST.paint.paintStages.push({name:n,cv:t})},begin=n=>push(()=>{if(curStage)snap(curStage);curStage=n});
 const stroke_=(pts,w,col,a,mode)=>{c.globalCompositeOperation=mode||'source-over';c.globalAlpha=a;brush(c,pts,w,{col,taper:.85,j:1.3});c.globalAlpha=1;c.globalCompositeOperation='source-over'};
 const line3=(x,y,a,l,bend)=>{const dx=Math.cos(a)*l/2,dy=Math.sin(a)*l/2,b=bend*l;return[[x-dx,y-dy],[x-dy*b/l*2,y+dx*b/l*2],[x+dx,y+dy]]};
 // 넓은 평붓 한 번: 반듯한 몸통, 안쪽 붓털 결, 끝이 마른 붓으로 갈라진다
 const flatB=(x,y,a,l,w,col,a_)=>{const dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx,hl=l/2,hw=w/2,sk=rr(-.15,.15)*w;
  const P=[[x-dx*hl+nx*hw+dx*sk,y-dy*hl+ny*hw+dy*sk],[x+dx*hl+nx*hw,y+dy*hl+ny*hw],[x+dx*hl-nx*hw,y+dy*hl-ny*hw],[x-dx*hl-nx*hw-dx*sk,y-dy*hl-ny*hw-dy*sk]];
  c.globalAlpha=a_;c.fillStyle=rgb(col);c.beginPath();P.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath();c.fill();
  c.lineCap='butt';for(let i=0;i<3;i++){const o=rr(-.45,.45)*w,s0=rr(.55,1),s1=rr(.55,1);c.globalAlpha=a_*rr(.15,.35);c.strokeStyle=rgb(col,R()<.5?.12:-.15);c.lineWidth=rr(.6,1.4);c.beginPath();c.moveTo(x-dx*hl*s0+nx*o,y-dy*hl*s0+ny*o);c.lineTo(x+dx*hl*s1+nx*o,y+dy*hl*s1+ny*o);c.stroke()}
  const n=Math.max(3,Math.round(w/1.6));c.strokeStyle=rgb(col);for(let i=0;i<n;i++){if(R()<.45)continue;const o=(i/(n-1)-.5)*w*.95,ext=rr(.05,.35)*l;c.globalAlpha=a_*rr(.55,.9);c.lineWidth=rr(.8,1.6);c.beginPath();c.moveTo(x+dx*hl+nx*o,y+dy*hl+ny*o);c.lineTo(x+dx*(hl+ext)+nx*o,y+dy*(hl+ext)+ny*o);c.stroke()}
  c.globalAlpha=1};
 // 1단계 굵은 붓: 고른 모양으로 그린다
 const bigB=(x,y,a,l,w,col,a_,sh=W3HOST.paint.popt.bshape)=>drawBig(c,sh,x,y,a,l,w,col,a_,flatB);
 // 발밑 그림자 (선택): 엷은 청회색 평붓을 옆으로 눕혀 깐다
 const shadowJob=()=>push(()=>{const cy=Math.min(N-24,by1+4),cx=(bx0+bx1)/2,w=(bx1-bx0)*.85+50;for(let i=0;i<26;i++){const x=cx+rr(-w/2,w/2),y=cy+rr(-8,18);flatB(x,y,rr(-.08,.08),rr(40,110)*SZ,rr(6,14)*SZ,R()<.35?[168,176,198,1]:[205,211,226,1],rr(.5,.75))}});
 const oil2Run=FULL=>{// FULL=false면 유화3: 평붓 그림 위에 1·2단계만 얹는다
 const D=(!FULL&&D2)?D2:D_OUT,at=(x,y)=>{x=clamp(x|0,0,N-1);y=clamp(y|0,0,N-1);const i=(y*N+x)*4;return[D[i],D[i+1],D[i+2],D[i+3]/255]};
 // ── 유화2: 고른 부위만 이미지 붓으로 유화처럼 칠한다. 1) 부위 시작에서 끝까지 결 따라, 같은 색이 이어지는 동안만 한 붓 2) 결 따라 하이라이트
 const SAT2=p=>{const l=p[0]*.3+p[1]*.59+p[2]*.11;return[0,1,2].map(i=>clamp((l+(p[i]-l)*1.3-128)*1.12+128,0,255)).concat(1)};
 const BI=({img1:0,img2:1,img3:2,img4:3})[W3HOST.paint.popt.o2shape]??0,DEN=+W3HOST.paint.popt.o2den||1;
 if(FULL){push(()=>{c.fillStyle='#ffffff';c.fillRect(0,0,N,N)});if(W3HOST.paint.popt.shadow){shadowJob()}}
 const ON=new Set(String(W3HOST.paint.popt.o2parts??'chest,waist,pelvis,thigh,shin,foot,uarm,farm,hand,rest').split(',')),TH=((paintHints&&paintHints.limbs)||[]),legs2=[];
 // 상박 부품마다 어느 다리 것인지: 보이는 칸의 가운데가 가장 가까운 다리 뼈대
 const BYL=new Map(),addC=(li,x,y)=>{let a=BYL.get(li);if(!a)BYL.set(li,a=[]);a.push([x,y])};
 {const acc=new Map(),dseg=(px,py,h)=>{const vx=h.a[0]-h.b[0],vy=h.a[1]-h.b[1],t=((px-h.b[0])*vx+(py-h.b[1])*vy)/(vx*vx+vy*vy||1),tc=clamp(t,0,1);return Math.hypot(px-h.b[0]-vx*tc,py-h.b[1]-vy*tc)+(t<0?-t:t>1?t-1:0)*30};
  for(let i=0;i<IDB.length;i++){const id=IDB[i],kd=limbPids.get(id);if(!kd)continue;const x=(i%IG)*3+1.5,y=(i/IG|0)*3+1.5;
   if(kd==='torso'||kd==='waist'){let bi=-1,bd=1e9;TH.forEach((h,k)=>{if(!h.reg)return;const d=dseg(x,y,h);if(d<bd){bd=d;bi=k}});if(bi>=0)addC(bi,x,y);continue}
   const a=acc.get(id)||{x:0,y:0,n:0,cells:[]};a.x+=x;a.y+=y;a.n++;a.cells.push([x,y]);acc.set(id,a)}
  for(const[id,a] of acc){const kd=limbPids.get(id);let bi=-1,bd=1e9;TH.forEach((h,k)=>{if(h.k!==kd)return;const d=dseg(a.x/a.n,a.y/a.n,h);if(d<bd){bd=d;bi=k}});if(bi>=0)for(const q of a.cells)addC(bi,q[0],q[1])}}
 // 나머지 부위(머리·어깨·무릎·팔꿈치·장식·칼 등): 부품마다 자기 긴 축을 결로 삼는다(화면 아래쪽 끝에서 시작)
 const TH2=TH.slice();if(ON.has('rest')){const seen=new Set();for(let i=0;i<IDB.length;i++)if(IDB[i])seen.add(IDB[i]);
  for(const g0 of pgeo){if(!seen.has(g0.pid)||limbPids.has(g0.pid))continue;const ux=Math.cos(g0.th),uy=Math.sin(g0.th),e0=[g0.mx+ux*g0.u0,g0.my+uy*g0.u0],e1=[g0.mx+ux*g0.u1,g0.my+uy*g0.u1],lo=e0[1]>=e1[1];
   const li=TH2.length;TH2.push({k:'rest',b:lo?e0:e1,a:lo?e1:e0});for(let i=0;i<IDB.length;i++)if(IDB[i]===g0.pid)addC(li,(i%IG)*3+1.5,(i/IG|0)*3+1.5)}}
 // 부위마다: 실제로 보이는 칸(가려진 곳 제외)을 모아 축 방향 범위를 잰다
 for(let li=0;li<TH2.length;li++){const h=TH2[li];if(!ON.has(h.k))continue;let ax=h.a[0]-h.b[0],ay=h.a[1]-h.b[1],L=Math.hypot(ax,ay);if(L<1){ax=0;ay=-1;L=1}const dx=ax/L,dy=ay/L,nx=-dy,ny=dx;
  const raw=BYL.get(li)||[];if(raw.length<5)continue;const cells=raw.map(([x,y])=>[x,y,(x-h.b[0])*dx+(y-h.b[1])*dy,(x-h.b[0])*nx+(y-h.b[1])*ny]);
  let t0=1e9,t1=-1e9,v0=1e9,v1=-1e9;for(const q of cells){t0=Math.min(t0,q[2]);t1=Math.max(t1,q[2]);v0=Math.min(v0,q[3]);v1=Math.max(v1,q[3])}
  const grid=new Uint8Array(IG*IG);for(const q of cells)grid[((q[1]/3)|0)*IG+((q[0]/3)|0)]=1;
  const mk=document.createElement('canvas');mk.width=mk.height=N;const mc=mk.getContext('2d');mc.fillStyle='#000';try{mc.filter='blur(1.2px)'}catch(_){}mc.beginPath();for(const q of cells){mc.moveTo(q[0]+3.3,q[1]);mc.arc(q[0],q[1],3.3,0,6.2832)}mc.fill();try{mc.filter='none'}catch(_){}
  // 결 방향 가로 단면에서 가장 밝은 줄(하이라이트 자리)
  const NB=12,lumB=new Array(NB).fill(0),cnt=new Array(NB).fill(0);for(const q of cells){const p=at(q[0],q[1]);if(p[3]<.5)continue;const b=clamp(Math.floor((q[3]-v0)/(v1-v0+1e-6)*NB),0,NB-1);lumB[b]+=p[0]*.3+p[1]*.59+p[2]*.11;cnt[b]++}
  let hb=0,hv=-1;for(let b=0;b<NB;b++)if(cnt[b]>2){const v=lumB[b]/cnt[b];if(v>hv){hv=v;hb=b}}
  legs2.push({b:h.b,dx,dy,nx,ny,t0,t1,v0,v1,mk,grid,hv:v0+(hb+.5)/NB*(v1-v0)})}
 if(!legs2.length)push(()=>{c.fillStyle='rgba(18,16,14,.6)';c.font='600 22px sans-serif';c.textAlign='center';c.fillText('고른 부위가 보이지 않습니다',N/2,40)});
 const P=(g,t,v)=>[g.b[0]+g.dx*t+g.nx*v,g.b[1]+g.dy*t+g.ny*v];
 const inG=(g,x,y)=>{x|=0;y|=0;if(x<0||y<0||x>=N||y>=N)return false;const gx=x/3|0,gy=y/3|0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const xx=gx+i,yy=gy+j;if(xx>=0&&yy>=0&&xx<IG&&yy<IG&&g.grid[yy*IG+xx])return true}return false};
 // 둘레 평균 색(먹 테두리처럼 아주 어두운 점은 뺀다)
 const avgC=(x,y)=>{let r=0,gg=0,b=0,k=0;for(let j=-3;j<=3;j+=3)for(let i=-3;i<=3;i+=3){const p=at(x+i,y+j);if(p[3]<.5)continue;const l=p[0]*.3+p[1]*.59+p[2]*.11;if(l<32)continue;r+=p[0];gg+=p[1];b+=p[2];k++}return k?[r/k,gg/k,b/k]:null};
 // 한 붓: 결을 따라 걸으며 같은 색이 이어지는 동안만 긋고, 색이 바뀌면 끊고 그 자리에서 새로 긋는다
 // 원본의 또렷한 검은 선(경계선·구별선) 위인지
 const isInk=(x,y)=>{const p=at(x,y);return p[3]>.5&&p[0]*.3+p[1]*.59+p[2]*.11<50};
 const runsAlong=(g,v)=>{const out=[];let cur=null,afterInk=false;const close=(t,ink)=>{if(cur&&t-cur.t0>3){cur.t1=t;cur.eInk=!!ink;out.push(cur)}cur=null};
  for(let t=g.t0-2;t<=g.t1+2;t+=1.5){const q=P(g,t,v);if(!inG(g,q[0],q[1])){close(t,false);afterInk=false;continue}
   // 검은 선을 만나면 붓을 거기서 끊는다: 한 붓은 선과 선 사이(한 칸)만 칠한다
   if(isInk(q[0],q[1])||isInk(q[0]+g.dx*.8,q[1]+g.dy*.8)){close(t,true);afterInk=true;continue}
   const cc=avgC(q[0],q[1]);if(!cc){if(cur)cur.last=t;continue}
   if(!cur){cur={t0:t,sum:[...cc],n:1,col:cc,last:t,sInk:afterInk};afterInk=false;continue}const m=cur.sum.map(x=>x/cur.n),d=Math.hypot(cc[0]-m[0],cc[1]-m[1],cc[2]-m[2]);
   if(d>34){close(t,false);cur={t0:t,sum:[...cc],n:1,col:cc,last:t,sInk:false}}else{cur.sum=cur.sum.map((x,i)=>x+cc[i]);cur.n++;cur.last=t}}
  close(g.t1+2,false);for(const r of out)r.col=SAT2(r.sum.map(x=>x/r.n).concat(1));return out};
 const lay=document.createElement('canvas');lay.width=lay.height=N;const lc=lay.getContext('2d');
 const segStroke=(g,v,ta,tb,w,cols,a,bend,bi=BI)=>{const C=[],n=Math.max(4,Math.min(14,Math.round((tb-ta)/6))),L=tb-ta;for(let i=0;i<=n;i++){const t=ta+L*i/n,o=bend*Math.sin(Math.PI*i/n)+rr(-.4,.4);C.push(P(g,t,v+o))}imgRibbon(lc,BI,C,w,cols,a,Math.max(4,L))};
 const flushLeg=g=>{lc.globalCompositeOperation='destination-in';lc.drawImage(g.mk,0,0);lc.globalCompositeOperation='source-over';c.drawImage(lay,0,0);lc.clearRect(0,0,N,N)};
 // 줄 하나를 같은 색 구간마다 따로 긋는다. 부위 끝은 바깥으로 길게 빼서(가면으로 잘림) 붓 끝 뭉침을 숨기고, 색 경계는 살짝만 겹친다
 const lineRuns=(g,v,w,colF,a,bend,extEnd,ov,bi=BI)=>{for(const r of runsAlong(g,v)){const st=r.sInk?r.t0:r.t0<=g.t0+3?r.t0-extEnd:r.t0-ov,en=r.eInk?r.t1:r.t1>=g.t1-3?r.t1+extEnd:r.t1+ov,cc=colF(r.col);segStroke(g,v,st,en,w,[cc,cc,cc],a,bend,bi)}};
 const hiPass=key=>{// 하이라이트는 흰색. 세기는 단계마다 따로(투명도·폭)
 for(const g of legs2){const W=Math.max(3,g.v1-g.v0);
  push(()=>{const WH=[255,255,255,1],hk=+W3HOST.paint.popt[key];if(!(hk>0))return;const A1=Math.min(1,.38*hk),A2=Math.min(1,.55*hk);for(let i=0;i<3;i++){const v=g.hv+rr(-.12,.12)*W,wd=Math.max(1.5,W*rr(.12,.2)*Math.min(1.4,.7+hk*.3));for(const r of runsAlong(g,v)){const m=(r.t1-r.t0)*.08;segStroke(g,v,r.t0+m,r.t1-m,wd,[WH,WH,WH],A1,rr(-1,1)*W*.04)}}
   const v=g.hv,wd=Math.max(1.2,W*.07);for(const r of runsAlong(g,v)){const m=(r.t1-r.t0)*.15;segStroke(g,v,r.t0+m,r.t1-m,wd,[WH,WH,WH],A2,0)}flushLeg(g)})}
 };
 // 원본의 검은 선 전체(바깥 경계선 + 안쪽 구별선)를 2px 칸으로 모아, 끊기지 않게 이어 걸으며 선마다 점 목록으로 뽑는다(한 번만 계산)
 let INKP=null;const inkPolys=()=>{if(INKP)return INKP;const K=N>>1,M=new Uint8Array(K*K);for(let y=0;y<K;y++)for(let x=0;x<K;x++)if(isInk(x*2+1,y*2+1))M[y*K+x]=1;
  const vis=new Uint8Array(K*K),DX=[1,1,0,-1,-1,-1,0,1],DY=[0,1,1,1,0,-1,-1,-1],ok=(x,y)=>x>=0&&y>=0&&x<K&&y<K&&M[y*K+x]&&!vis[y*K+x],eat=(x,y)=>{for(let k=0;k<8;k++){const nx=x+DX[k],ny=y+DY[k];if(nx>=0&&ny>=0&&nx<K&&ny<K)vis[ny*K+nx]=1}vis[y*K+x]=1};
  const walk=(x,y,dir)=>{const P_=[];let cx=x,cy=y,d=dir;for(let g=0;g<6000;g++){let best=-1,bs=-9;for(let k=0;k<8;k++){const nx=cx+DX[k],ny=cy+DY[k];if(!ok(nx,ny))continue;const sc=d<0?0:Math.cos((k-d)*Math.PI/4);if(sc>bs){bs=sc;best=k}}if(best<0||(d>=0&&bs<-.1))break;eat(cx,cy);cx+=DX[best];cy+=DY[best];d=best;P_.push([cx*2+1,cy*2+1])}eat(cx,cy);return P_};
  const out=[];for(let y=0;y<K;y++)for(let x=0;x<K;x++){if(!ok(x,y))continue;vis[y*K+x]=1;const fw=walk(x,y,-1);let bk=[];if(fw.length){const a=fw[0],dx=Math.sign(a[0]-(x*2+1)),dy=Math.sign(a[1]-(y*2+1));let rd=-1;for(let k=0;k<8;k++)if(DX[k]===-dx&&DY[k]===-dy)rd=k;bk=walk(x,y,rd)}
   const Q=[...bk.reverse(),[x*2+1,y*2+1],...fw];let len=0;for(let i=1;i<Q.length;i++)len+=Math.hypot(Q[i][0]-Q[i-1][0],Q[i][1]-Q[i-1][1]);if(len<8*Math.max(.7,SZ))continue;out.push(Q.map(([px,py])=>{const p=at(px,py);return[px,py,[p[0],p[1],p[2]]]}))}
  return INKP=out};
 // 외곽선(경계선·구별선) 한 붓: 선 바로 위를 그 자리 선 색 그대로, 같은 색이 이어지는 동안 한 붓으로 따라 긋는다
 // 원본 모델의 구별선을 1px 단위로 가늘게 깎아(뼈대) 선의 한가운데를 정확히 따라가고, 선마다 원래 굵기와 색을 잰다
 const skelLines=()=>{const M=new Uint8Array(N*N),ins=(x,y)=>at(x-5,y)[3]>.5&&at(x+5,y)[3]>.5&&at(x,y-5)[3]>.5&&at(x,y+5)[3]>.5;
  for(let y=6;y<N-6;y++)for(let x=6;x<N-6;x++){const i=(y*N+x)*4;if(D[i+3]<128)continue;if(D[i]*.3+D[i+1]*.59+D[i+2]*.11<50&&ins(x,y))M[y*N+x]=1}
  const INK=M.slice();// 굵기 재기용
  // Zhang-Suen 가늘게 깎기
  const nb=(i)=>[M[i-N],M[i-N+1],M[i+1],M[i+N+1],M[i+N],M[i+N-1],M[i-1],M[i-N-1]];let ch=true,it=0;const del=[];
  while(ch&&it++<20){ch=false;for(const st of[0,1]){del.length=0;for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){const i=y*N+x;if(!M[i])continue;const p=nb(i),B=p[0]+p[1]+p[2]+p[3]+p[4]+p[5]+p[6]+p[7];if(B<2||B>6)continue;let A=0;for(let k=0;k<8;k++)if(!p[k]&&p[(k+1)%8])A++;if(A!==1)continue;if(st===0?(p[0]*p[2]*p[4]===0&&p[2]*p[4]*p[6]===0):(p[0]*p[2]*p[6]===0&&p[0]*p[4]*p[6]===0))del.push(i)}if(del.length){ch=true;for(const i of del)M[i]=0}}}
  const OFF=[-N,-N+1,1,N+1,N,N-1,-1,-N-1],deg=i=>{let n=0;for(const o of OFF)if(M[i+o])n++;return n},vis=new Uint8Array(N*N),paths=[];
  const walk=i0=>{const P_=[i0];vis[i0]=1;let i=i0;for(;;){let nx=-1;for(const o of OFF){const j=i+o;if(M[j]&&!vis[j]){nx=j;break}}if(nx<0)break;vis[nx]=1;P_.push(nx);i=nx;if(deg(nx)>2)break}return P_};
  for(let i=N;i<N*N-N;i++)if(M[i]&&!vis[i]&&deg(i)===1)paths.push(walk(i));
  for(let i=N;i<N*N-N;i++)if(M[i]&&!vis[i])paths.push(walk(i));
  const thick=(x,y,nx,ny)=>{let a=0,b=0;while(a<8&&INK[Math.round(y+ny*(a+1))*N+Math.round(x+nx*(a+1))])a++;while(b<8&&INK[Math.round(y-ny*(b+1))*N+Math.round(x-nx*(b+1))])b++;return a+b+1};
  const wk=+W3HOST.paint.popt.o2lw||1;
  for(const P_ of paths){if(P_.length<10*Math.max(.7,SZ))continue;let Q=P_.map(i=>[i%N,(i/N)|0]);
   // 아주 살짝만 다듬어 계단을 없앤다(모양은 그대로)
   Q=Q.map((p,k)=>{const a=Q[Math.max(0,k-1)],c2=Q[Math.min(Q.length-1,k+1)];return[(a[0]+p[0]*2+c2[0])/4,(a[1]+p[1]*2+c2[1])/4]});
   const step=Math.max(18,Math.round(26*SZ));for(let s0=0;s0<Q.length-3;s0+=step-4){const C=Q.slice(s0,Math.min(Q.length,s0+step+1));if(C.length<4)continue;
    let tw=0,tn=0,cr=0,cg=0,cb=0;for(let k=0;k<C.length;k+=2){const a=C[Math.max(0,k-1)],b=C[Math.min(C.length-1,k+1)];let tx=b[0]-a[0],ty=b[1]-a[1];const L=Math.hypot(tx,ty)||1;tw+=thick(C[k][0],C[k][1],-ty/L,tx/L);tn++;const p=at(C[k][0],C[k][1]);cr+=p[0];cg+=p[1];cb+=p[2]}
    const w=Math.max(1.2,tw/tn*wk),cc=[cr/tn,cg/tn,cb/tn,1];let L=0;for(let k=1;k<C.length;k++)L+=Math.hypot(C[k][0]-C[k-1][0],C[k][1]-C[k-1][1]);imgRibbon(c,BI,C,w*rr(.95,1.15),[cc,cc,cc],.95,Math.max(4,L))}}};
 const inkOneStroke=(bi,wm,innerOnly)=>{const w=Math.max(1.3,2.4*SZ*(+W3HOST.paint.popt.o2lw||1))*Math.min(1.6,wm),inside=(x,y)=>at(x-5,y)[3]>.5&&at(x+5,y)[3]>.5&&at(x,y-5)[3]>.5&&at(x,y+5)[3]>.5;
  for(const line of inkPolys()){let run=[],sum=null,cnt=0;const flush=()=>{if(run.length>=3&&sum){const sm=run.map((p,k)=>{const a2=run[Math.max(0,k-1)],c2=run[Math.min(run.length-1,k+1)];return[(a2[0]+p[0]*2+c2[0])/4,(a2[1]+p[1]*2+c2[1])/4]});let L=0;for(let k=1;k<sm.length;k++)L+=Math.hypot(sm[k][0]-sm[k-1][0],sm[k][1]-sm[k-1][1]);const cc=sum.map(x=>x/cnt).concat(1);imgRibbon(c,bi,sm,w*rr(.85,1.1),[cc,cc,cc],.92,Math.max(4,L))}run=[];sum=null;cnt=0};
   for(const p of line){if(innerOnly&&!inside(p[0],p[1])){flush();continue}if(sum){const m=sum.map(x=>x/cnt);if(Math.hypot(p[2][0]-m[0],p[2][1]-m[1],p[2][2]-m[2])>34)flush()}if(!sum){sum=[0,0,0];cnt=0}run.push(p);sum=sum.map((x,ii)=>x+p[2][ii]);cnt++}flush()}};
 const s1Pass=(bi=BI,wm=1)=>{
 for(const g of legs2){const W=Math.max(3,g.v1-g.v0),ns=Math.max(2,Math.round(W/7*DEN)),bw=W/ns*1.9,ext=Math.max(8,bw*.6,(g.t1-g.t0)*.22);
  push(()=>{// 밑칠: 넓고 어둡게
   const nu=Math.max(2,ns/2|0);for(let i=0;i<nu;i++){const v=g.v0+W*(i+.5)/nu;lineRuns(g,v,bw*1.7*wm,c_=>c_.map((x,j)=>j<3?x*.72:x),.9,rr(-1,1)*bw*.12,ext,bw*.25,bi)}flushLeg(g)});
  push(()=>{// 본칠: 결마다 같은 색 구간을 한 붓씩
   const order=[...Array(ns).keys()].sort(()=>R()-.5);for(const i of order){const v=g.v0+W*(i+.5)/ns+rr(-.15,.15)*W/ns,jit=1+rr(-.05,.05);lineRuns(g,v,bw*wm,c_=>c_.map((x,j)=>j<3?clamp(x*jit,0,255):x),.92,rr(-1,1)*bw*.15,ext,bw*.2,bi)}flushLeg(g)});
}
  push(()=>inkOneStroke(bi,wm));
 };
 begin(FULL?'1. 결 따라 긴 붓칠':'유화 1 · 결 따라 긴 붓칠');s1Pass();
 begin(FULL?'2. 결 따라 하이라이트':'유화 2 · 결 따라 하이라이트');hiPass('o2hi');
 // 부품의 보이는 칸 격자를 따라 바깥 테두리를 한 바퀴 걷는다(3px 칸 → 화면 점, 살짝 다듬음)
 const traceGrid=g=>{const f=(x,y)=>x>=0&&y>=0&&x<IG&&y<IG&&g.grid[y*IG+x]===1;let sx=-1,sy=-1;for(let y=0;y<IG&&sx<0;y++)for(let x=0;x<IG;x++)if(f(x,y)){sx=x;sy=y;break}if(sx<0)return null;
  const DX=[1,1,0,-1,-1,-1,0,1],DY=[0,1,1,1,0,-1,-1,-1],Pt=[[sx,sy]];let cx=sx,cy=sy,prev=6,guard=0;while(guard++<8000){let found=false;const st=(prev+6)%8;for(let k=0;k<8;k++){const i=(st+k)%8,nx=cx+DX[i],ny=cy+DY[i];if(f(nx,ny)){cx=nx;cy=ny;prev=i;found=true;break}}if(!found||(cx===sx&&cy===sy))break;Pt.push([cx,cy])}
  if(Pt.length<4)return null;let Q=Pt.map(([x,y])=>[x*3+1.5,y*3+1.5]);for(let it=0;it<2;it++){const n=Q.length;Q=Q.map((_,i)=>{const a=Q[(i-1+n)%n],b=Q[i],c2=Q[(i+1)%n];return[(a[0]+b[0]*2+c2[0])/4,(a[1]+b[1]*2+c2[1])/4]})}return Q};
 const olStage=nm=>{if(W3HOST.paint.popt.o2line!=='off'){begin(nm);
  // 외곽선 = 원본 모델이 보여 주는 또렷한 검은 선을 그대로 옮긴다(테두리의 부드러운 가장자리도 살림)
  push(()=>{const im=new ImageData(N,N),o=im.data,lk=+W3HOST.paint.popt.o2lw||1,lo=Math.min(120,58+28*(lk-1)),hi=Math.max(20,lo-46);
   for(let i=0;i<N*N;i++){const j=i*4,a=D[j+3]/255;if(a<.35)continue;const l=D[j]*.3+D[j+1]*.59+D[j+2]*.11;if(l>=lo)continue;const k=clamp((lo-l)/(lo-hi),0,1)*a;o[j]=D[j]*.6;o[j+1]=D[j+1]*.6;o[j+2]=D[j+2]*.6;o[j+3]=Math.round(255*k)}
   const t=document.createElement('canvas');t.width=t.height=N;t.getContext('2d').putImageData(im,0,0);
   if(lk>1.25){const d=Math.min(2,(lk-1)*1.4);for(const[ox,oy] of[[d,0],[-d,0],[0,d],[0,-d]])c.drawImage(t,ox,oy)}c.drawImage(t,0,0)})}};
 if(FULL){
 const BI4=({img1:0,img2:1,img3:2,img4:3})[W3HOST.paint.popt.o2s4shape]??BI,W4=+W3HOST.paint.popt.o2s4w||1;begin('3. 긴 붓칠 한 번 더 · 보강');s1Pass(BI4,W4);
 // 같은 색 구간 안에서만 짧은 붓을 더 얹어 빈 곳을 메우고, 그늘 쪽은 조금 어둡게 눌러 형태를 세운다
 for(const g of legs2){const W=Math.max(3,g.v1-g.v0),rf=+W3HOST.paint.popt.o2rf;if(!(rf>0))continue;const ns=Math.max(2,Math.round(W/9*DEN*rf)),bw=W/Math.max(2,Math.round(W/7*DEN))*1.1;
  push(()=>{for(let i=0;i<ns*2;i++){const v=g.v0+W*rr(.05,.95),runs=runsAlong(g,v);if(!runs.length)continue;const r=runs[(R()*runs.length)|0],len=r.t1-r.t0;if(len<4)continue;
    const sl=len*rr(.35,.7),st=r.t0+rr(0,len-sl),dark=Math.abs(v-g.hv)>W*.38,k=dark?rr(.74,.86):rr(.94,1.08),cc=r.col.map((x,j)=>j<3?clamp(x*k,0,255):x);segStroke(g,v,st,st+sl,bw*W4*rr(.7,1.1),[cc,cc,cc],rr(.6,.85),rr(-1,1)*bw*.2,BI4)}flushLeg(g)})}
 olStage('4. 외곽선');
 begin('5. 하이라이트 한 번 더');hiPass('o2hi5');
 }
 // 유화3 마지막: 바깥 경계선은 빼고, 부위 안쪽 구별선만 그 선 색 그대로 한 붓으로 따라 긋는다
 if(!FULL&&W3HOST.paint.popt.o2line!=='off'){begin('유화 3 · 얼굴 구별선');
  // 유화2 외곽선처럼 원본의 또렷한 검은 선을 그대로 옮기되, 바깥(배경)과 맞닿은 경계선은 빼고 부위 안쪽 구별선만
  push(()=>{const im=new ImageData(N,N),o=im.data,lk=+W3HOST.paint.popt.o2lw||1,lo=Math.min(120,58+28*(lk-1)),hi=Math.max(20,lo-46),A=(x,y)=>x<0||y<0||x>=N||y>=N?0:D[(y*N+x)*4+3];
   for(let y=0;y<N;y++)for(let x=0;x<N;x++){const j=(y*N+x)*4,a=D[j+3]/255;if(a<.35)continue;const l=D[j]*.3+D[j+1]*.59+D[j+2]*.11;if(l>=lo)continue;if(!headPids.has(IDB[((y/3)|0)*IG+((x/3)|0)]))continue;if(A(x-5,y)<128||A(x+5,y)<128||A(x,y-5)<128||A(x,y+5)<128||A(x-4,y-4)<128||A(x+4,y+4)<128||A(x-4,y+4)<128||A(x+4,y-4)<128)continue;const k=clamp((lo-l)/(lo-hi),0,1)*a;o[j]=D[j]*.6;o[j+1]=D[j+1]*.6;o[j+2]=D[j+2]*.6;o[j+3]=Math.round(255*k)}
   const t=document.createElement('canvas');t.width=t.height=N;t.getContext('2d').putImageData(im,0,0);
   if(lk>1.25){const d=Math.min(2,(lk-1)*1.4);for(const[ox,oy] of[[d,0],[-d,0],[0,d],[0,-d]])c.drawImage(t,ox,oy)}c.drawImage(t,0,0)})}
 };
 if(W3HOST.paint.popt.medium==='oil2'){oil2Run(true)}else if(['oil','gogh','flat','ljs','oil3'].includes(W3HOST.paint.popt.medium)){
 const fa0=(x,y)=>{const[ga,gm]=gAt(x,y);return gm>.18?ga+Math.PI/2:-1};
 // ── 유화: 어두운 바탕 위에 진하고 불투명한 붓을 겹겹이, 붓털 자국과 물감 두께를 남긴다
 const SAT=p=>{const l=p[0]*.3+p[1]*.59+p[2]*.11;return[0,1,2].map(i=>clamp((l+(p[i]-l)*1.35-128)*1.15+128,0,255)).concat(p[3])};
 const GR={umber:[68,50,38],ochre:[146,108,60],teal:[32,56,60]}[W3HOST.paint.popt.ground]||[68,50,38];
 const isDark=p=>(p[0]*.3+p[1]*.59+p[2]*.11)<38;
 const br=(pts,w,col,a)=>{const[p0,p1,p2]=pts,dx=p2[0]-p0[0],dy=p2[1]-p0[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;stroke_(pts,w,rgb(col),a);
  c.lineCap='round';for(let i=0;i<4;i++){const o=rr(-.42,.42)*w;c.globalAlpha=a*rr(.3,.55);c.strokeStyle=rgb(col,R()<.5?.2:-.25);c.lineWidth=rr(.6,1.5);c.beginPath();c.moveTo(p0[0]+nx*o,p0[1]+ny*o);c.quadraticCurveTo(p1[0]+nx*o,p1[1]+ny*o,p2[0]+nx*o,p2[1]+ny*o);c.stroke()}
  if(w>4){const o=-w*.4;c.globalAlpha=a*.45;c.strokeStyle='rgb(255,244,222)';c.lineWidth=1;c.beginPath();c.moveTo(p0[0]+nx*o,p0[1]+ny*o);c.quadraticCurveTo(p1[0]+nx*o,p1[1]+ny*o,p2[0]+nx*o,p2[1]+ny*o);c.stroke();
   c.globalAlpha=a*.35;c.strokeStyle='rgb(20,14,10)';c.beginPath();c.moveTo(p0[0]-nx*o,p0[1]-ny*o);c.quadraticCurveTo(p1[0]-nx*o,p1[1]-ny*o,p2[0]-nx*o,p2[1]-ny*o);c.stroke()}
  c.globalAlpha=1};
 if(W3HOST.paint.popt.medium==='ljs'){
 // ── 이중섭풍: 흙빛 몇 가지로 색을 줄이고, 어두운 덩어리 위에 굵고 긴 흰 붓을 갈비뼈처럼 휘어 긋고, 굵은 검은 선으로 형태를 감는다
 push(()=>{c.fillStyle='#ffffff';c.fillRect(0,0,N,N)});if(W3HOST.paint.popt.shadow){shadowJob()}
 const lm=p=>(p[0]*.3+p[1]*.59+p[2]*.11)/255;
 const EARTH=p=>{const l=lm(p),warm=p[0]-p[2];let t;if(l<.2)t=[40,30,24];else if(l<.42)t=[92,74,60];else if(l<.68)t=warm>25?[170,88,60]:warm<-15?[98,102,104]:[152,126,94];else t=[236,224,200];return toward(p,t,.8)};
 const traceLines=th0=>{
  let lid=0;const vis=new Int32Array(gw*gw),cell=(x,y)=>clamp(y/G|0,0,gw-1)*gw+clamp(x/G|0,0,gw-1),seeds=[];
  for(let y=by0;y<=by1;y+=G)for(let x=bx0;x<=bx1;x+=G){const i=cell(x,y);if(gmag[i]>th0&&at(x,y)[3]>.3)seeds.push([x,y,gmag[i]])}
  seeds.sort((a,b)=>b[2]-a[2]);const lines=[],step=3*SZ;
  const mark=(x,y)=>{const cx=clamp(x/G|0,0,gw-1),cy=clamp(y/G|0,0,gw-1);for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const xx=cx+i,yy=cy+j;if(xx>=0&&yy>=0&&xx<gw&&yy<gw)if(!vis[yy*gw+xx])vis[yy*gw+xx]=lid}};
  const walk=(x,y,a0)=>{const pts=[];let a=a0;for(let k=0;k<70;k++){x+=Math.cos(a)*step;y+=Math.sin(a)*step;const i=cell(x,y);if((vis[i]&&vis[i]!==lid)||gmag[i]<.32||at(x,y)[3]<.2)break;let na=gang[i]+Math.PI/2;if(Math.cos(na-a)<0)na+=Math.PI;const da=Math.atan2(Math.sin(na-a),Math.cos(na-a));if(Math.abs(da)>.9)break;a+=da*.6;pts.push([x,y]);mark(x,y)}return pts};
  for(const[x,y] of seeds){if(vis[cell(x,y)])continue;lid++;const a=gang[cell(x,y)]+Math.PI/2;mark(x,y);const f=walk(x,y,a),b=walk(x,y,a+Math.PI);const pts=[...b.reverse(),[x,y],...f];if(pts.length<4)continue;let gs=0;for(const q of pts)gs+=gmag[cell(q[0],q[1])];lines.push({pts,g:gs/pts.length})}
  return lines};
 begin('어두운 덩어리');
 if(parts.length){for(const part of parts)for(const st of part){const q=k=>EARTH(k).map((v,i)=>i<3?v*.5:v);push(()=>drawLong(c,'img2',st.x,st.y,st.a+rr(-.04,.04),st.l*1.05,st.w*1.15,[q(st.p0||st.p),q(st.p),q(st.p2||st.p)],.95,rr(-1,1)))}}
 else{const sp=12*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const px=x+rr(-sp/2,sp/2),py=y+rr(-sp/2,sp/2),p=at(px,py);if(p[3]<.5)continue;const q=EARTH(p).map((v,i)=>i<3?v*.5:v);push(()=>drawLong(c,'img2',px,py,fa0(px,py),rr(50,100)*SZ,rr(14,20)*SZ,[q,q,q],.95,rr(-1,1)))}}
 begin('살붓');
 // 중간 밝기의 흙빛을 길게 얹어 몸통의 결을 잡는다. 아직 형태는 흐릿하게 둔다
 if(parts.length){for(const part of parts)for(const st of part){if(R()<.45)continue;const q=EARTH(st.p).map((v,i)=>i<3?v*.85:v);push(()=>drawLong(c,'img2',st.x,st.y,st.a+rr(-.05,.05),st.l*.85,st.w*.55,[q,q,q],.45,rr(-1,1)))}}
 else{const sp=13*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const px=x+rr(-sp/2,sp/2),py=y+rr(-sp/2,sp/2),p=at(px,py);if(p[3]<.5||R()<.4)continue;const q=EARTH(p).map((v,i)=>i<3?v*.85:v);push(()=>drawLong(c,'img2',px,py,fa0(px,py),rr(40,80)*SZ,rr(6,10)*SZ,[q,q,q],.55,rr(-1,1)))}}
 // 마지막: 굵은 한 붓으로 구조를 세운다 — 부품마다 근육·등줄기처럼 휜 흰 선 하나와 반대쪽 검은 선 하나, 넓은 부품엔 늑골, 머리엔 눈과 코
 begin('굵은 한 붓 · 구조');
 // 마지막: 부품 하나하나를 그 가장자리를 따라 굵은 한 붓으로 감는다. 긴 부품은 U자로 한 번 + 남은 변 한 번, 둥근 부품은 고리로 한 번
 const LC={ochre:[[214,150,58],[236,184,92],[176,112,40]],bone:[[236,226,204],[250,244,228],[200,182,150]],ink:[[34,26,20],[60,48,40],[20,16,12]]}[W3HOST.paint.popt.ljsline]||[[214,150,58],[236,184,92],[176,112,40]];
 const toW=(g,u,v)=>{const ux=Math.cos(g.th),uy=Math.sin(g.th);return[g.mx+ux*u-uy*v,g.my+uy*u+ux*v]};
 // 보이는 구간만: 선 위의 점이 다른 부품에 가려진 자리(앞 부품이 차지한 칸)면 그 자리에서 선을 끊는다
 let CUR=0;const IDat=(x,y)=>{const gx=clamp(x/3|0,0,IG-1),gy=clamp(y/3|0,0,IG-1);return IDB[gy*IG+gx]};
 const okAt=(x,y,pid)=>{for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const v=IDat(x+i*3,y+j*3);if(v===0||(pid instanceof Set?pid.has(v):v===pid))return true}return false};
 const visRuns=(C,pid)=>{if(!pid)return[C];const out=[];let run=[];const sub=[];for(let i=0;i<C.length;i++){if(i){const a=C[i-1],b=C[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(d/3));for(let k=1;k<n;k++)sub.push([lerp(a[0],b[0],k/n),lerp(a[1],b[1],k/n)])}sub.push(C[i])}
  for(const q of sub){if(okAt(q[0],q[1],pid))run.push(q);else{if(run.length>2)out.push(run);run=[]}}if(run.length>2)out.push(run);return out.map(r=>r.filter((q,i)=>i%2===0||i===r.length-1))};
 const covered=[];const lineStroke=(C,w)=>{if(C.length<3)return;for(const R_ of visRuns(C,CUR)){if(R_.length<3)continue;const S=smooth(R_,1);covered.push({S,w});push(()=>{const sh=LC[2].map(v=>v*.55);ribbonPath(c,'round',S,w*1.18,[sh,sh,sh],.45);ribbonPath(c,'round',S,w,[LC[0],LC[1],LC[0]].map(q=>q.map(v=>clamp(v*(1+rr(-.06,.06)),0,255))),.96)})}};
 const edges3=[];const order=pgeo.slice().sort((a,b)=>(b.u1-b.u0)*b.T-(a.u1-a.u0)*a.T);
 for(const g of order){CUR=g.pid||0;const len=g.u1-g.u0;if(g.tag!=='waist'&&g.tag!=='head'&&(Math.max(len,g.T)<9*SZ||len*g.T<70*SZ*SZ))continue;const D=g.cont;if(!D||D.length<8)continue;
  // 원래 모델의 실제 외곽(테두리 추적)을 따라 긋는다. 꺾인 꼭짓점에서는 붓을 떼고, 둥근 곳은 끊지 않고 잇는다
  const w=clamp(Math.min(g.T,len)*.23,3.8*SZ,11*SZ),ins=w*.55,n=D.length;
  const Q=D.map(p_=>{const o=Math.min(ins,p_.t*.45);return[p_.x+p_.nx*o,p_.y+p_.ny*o]});
  const turn=(i,k)=>{const a=D[(i-k+n)%n],b=D[i],c_=D[(i+k)%n],a1=Math.atan2(b.y-a.y,b.x-a.x),a2=Math.atan2(c_.y-b.y,c_.x-b.x);return Math.abs(Math.atan2(Math.sin(a2-a1),Math.cos(a2-a1)))};
  const ks=3,kl=8,score=D.map((_,i)=>{const s=turn(i,ks),l=turn(i,kl);return s>.62&&s>l*.72?s:0}),corners=[];
  for(let i=0;i<n;i++){if(!score[i])continue;let best=true;for(let j=-kl;j<=kl;j++){if(j&&score[(i+j+n)%n]>score[i]){best=false;break}}if(best&&!corners.some(c0=>Math.min(Math.abs(c0-i),n-Math.abs(c0-i))<kl))corners.push(i)}
  corners.sort((a,b)=>a-b);
  const segLen=(a,b)=>{let s=0;for(let i=a;i!==b;i=(i+1)%n){const j=(i+1)%n;s+=Math.hypot(D[j].x-D[i].x,D[j].y-D[i].y)}return s};
  if(corners.length<2){const st=(R()*n)|0,ov=Math.max(3,Math.round(n*.05)),C=[];for(let k=0;k<n+ov;k+=2)C.push(Q[(st+k)%n]);lineStroke(C,w)}
  else for(let ci=0;ci<corners.length;ci++){const a=corners[ci],b=corners[(ci+1)%corners.length];if(segLen(a,b)<w*1.1)continue;const C=[];for(let i=a;;i=(i+1)%n){C.push(Q[i]);if(i===b)break}lineStroke(C.filter((q,i)=>i%2===0||i===C.length-1),w)}
  // 각진 부품: 안쪽 면 경계도 곧은 한 붓으로 (바깥 외곽과 겹치지 않는 변만)
  const big3=(g.faces||[]).filter(f=>f.n>12);
  if(big3.length>=2&&corners.length>=3){const inner=[],nearOuter=(x,y)=>{let best=1e9;for(let i=0;i<n;i+=2)best=Math.min(best,Math.hypot(D[i].x-x,D[i].y-y));return best};
   for(const f of big3){const H=f.H;for(let k=0;k<H.length;k++){const a=H[k],b=H[(k+1)%H.length],el=Math.hypot(b[0]-a[0],b[1]-a[1]);if(el<w*1.3)continue;const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];if(nearOuter(mid[0],mid[1])<w*1.3||nearOuter(a[0],a[1])<w*.9&&nearOuter(b[0],b[1])<w*.9)continue;if(inner.some(e=>Math.hypot(e[0]-mid[0],e[1]-mid[1])<w*1.4))continue;inner.push(mid);
    const sh=w*.2/el,C=[];for(let s=0;s<=6;s++){const t=sh+(1-2*sh)*s/6;C.push([lerp(a[0],b[0],t)+rr(-.5,.5),lerp(a[1],b[1],t)+rr(-.5,.5)])}lineStroke(C,w)}}}}
 // 부품 안쪽 채우기: 윤곽 안을 같은 굵기의 나란한 한 붓으로 고르게 채워 명암·근육·질감을 만든다
 //  넓은 면(몸통 등)은 짧은 변 방향으로 빗살처럼, 긴 부품(팔·다리·칼)은 길이 방향으로, 둥근 부품은 안쪽 호 하나
 CUR=0;
 // 허리 경계: 모델이 알려 준 허리 둘레를 3단계 붓으로 한 번 감는다
 if(HINTS.waist&&HINTS.waist.length>1){const W_=HINTS.waist,wd=clamp(Math.hypot(W_[W_.length-1][0]-W_[0][0],W_[W_.length-1][1]-W_[0][1])*.07,4*SZ,10*SZ);lineStroke(W_.map(q=>[q[0]+rr(-.6,.6),q[1]+rr(-.6,.6)]),wd)}
 begin('명암 · 근육 · 질감');
 // 첫 붓: 경계선 따라 그리기. 경계선 칸(2px 격자)을 따라 걸으며 이어진 선을 모아, 검은 먹붓으로 한 획씩 긋는다
 if(BLM){const CG=2,cw=Math.ceil(N/CG),on=new Uint8Array(cw*cw),vis=new Uint8Array(cw*cw);for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(BLM[y*N+x])on[(y/CG|0)*cw+(x/CG|0)]=1;
  const ok=(x,y)=>x>=0&&y>=0&&x<cw&&y<cw&&on[y*cw+x]&&!vis[y*cw+x],mk=(x,y)=>{for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const xx=x+i,yy=y+j;if(xx>=0&&yy>=0&&xx<cw&&yy<cw)vis[yy*cw+xx]=1}};
  const walk=(x,y,a)=>{const out=[];for(let k=0;k<400;k++){let best=null;for(const da of[0,.26,-.26,.52,-.52,.79,-.79,1.05,-1.05])for(const d of[3,4]){const nx=Math.round(x+Math.cos(a+da)*d),ny=Math.round(y+Math.sin(a+da)*d);if(ok(nx,ny)){best=[nx,ny,a+da];break}}if(!best)break;const pa=a;[x,y]=best;a=Math.atan2(Math.sin(best[2]),Math.cos(best[2]));a=pa+Math.atan2(Math.sin(a-pa),Math.cos(a-pa))*.7;mk(x,y);out.push([x*CG+1,y*CG+1])}return out};
  const lw=clamp(3.2*SZ,2.4,5.5),INKB=[[34,28,24],[52,44,38],[18,14,12]];
  for(let y=0;y<cw;y++)for(let x=0;x<cw;x++){if(!ok(x,y))continue;let a0=null;for(let t=0;t<12&&a0===null;t++){const a=t/12*6.2832;for(const d of[3,4])if(ok(Math.round(x+Math.cos(a)*d),Math.round(y+Math.sin(a)*d))){a0=a;break}}mk(x,y);if(a0===null)continue;
   const f=walk(x,y,a0),b=walk(x,y,a0+Math.PI),P=[...b.reverse(),[x*CG+1,y*CG+1],...f];if(P.length<4)continue;const S=smooth(P.map(q=>[q[0]+rr(-.5,.5),q[1]+rr(-.5,.5)]),1),ww=lw*rr(.85,1.15);
   push(()=>{ribbonPath(c,'round',S,ww*1.25,[INKB[2],INKB[2],INKB[2]],.25);ribbonPath(c,'round',S,ww,INKB.map(q=>q.map(v=>clamp(v*(1+rr(-.1,.1)),0,255))),.92)})}}
 // 방향 고르기: 가로로 길면 가로, 세로로 길면 세로, 그 사이면 그 방향 그대로
 const snapA=a=>{a=((a%Math.PI)+Math.PI)%Math.PI;if(a<.3||a>Math.PI-.3)return 0;if(Math.abs(a-Math.PI/2)<.3)return Math.PI/2;return a};
 const inPoly=(H,x,y)=>{let s=0;for(let k=0;k<H.length;k++){const a=H[k],b=H[(k+1)%H.length],cr=(b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]);if(cr!==0){const sg=cr>0?1:-1;if(s===0)s=sg;else if(s!==sg)return false}}return true};
 const fillPass=(ph,FC=LC,wm=1,gk=W3HOST.paint.popt.ljsgap)=>{
 for(const g of order){CUR=g.pid||0;const len=g.u1-g.u0;if(g.tag==='head')continue;if(Math.max(len,g.T)<9*SZ||len*g.T<70*SZ*SZ)continue;if(!g.EL||g.EL.length<3)continue;
  const w0=clamp(Math.min(g.T,len)*.23,3.8*SZ,11*SZ),w=w0*wm,ins=w0*.55,gap=w*gk,n=g.EL.length,last=n-1;
  const tint=()=>[FC[0],FC[1],FC[0]].map(q=>q.map(v=>clamp(v*(1+rr(-.07,.05)),0,255)));
  const put=(C0,ww)=>{if(C0.length<2)return;for(const C of visRuns(C0,CUR)){if(C.length<3)continue;const S=C.length>3?smooth(C,1):C;covered.push({S,w:ww});push(()=>{const sh=FC[2].map(v=>v*.5);ribbonPath(c,'round',S,ww*1.15,[sh,sh,sh],.4);ribbonPath(c,'round',S,ww,tint(),.95)})}};
  const wAt=f=>{const i=Math.round(f*last);return g.ER[i][1]-g.EL[i][1]},roundish=(g.circ>.86&&g.phull&&g.phull.length>=10)||(len<g.T*1.5&&wAt(.12)<wAt(.5)*.8&&wAt(.88)<wAt(.5)*.8),big=(g.faces||[]).filter(f=>f.n>12);
  if(roundish){// 어깨·무릎: 그늘 쪽으로 둥근 호를 겹겹이
   const cen=toW(g,(g.u0+g.u1)/2,(g.v0+g.v1)/2),R0=Math.min(g.u1-g.u0,g.v1-g.v0)/2-ins*1.6;if(R0<w*.5)continue;
   const sa=(g.shd[0]||g.shd[1])?Math.atan2(g.shd[1],g.shd[0]):Math.PI*.25,k=clamp(Math.floor(R0/gap)+1,1,7);
   for(let s=0;s<k;s++){const r=R0-(s+ph)*gap;if(r<w*.35){if(r>-w*.3){const C=[];for(let t=0;t<=3;t++)C.push([cen[0]+Math.cos(sa)*t*.6,cen[1]+Math.sin(sa)*t*.6]);put(C,w*.9)}break}const span=Math.min(6.1,3.4+s*.5),C=[];for(let t=0;t<=16;t++){const a=sa-span/2+span*t/16;C.push([cen[0]+Math.cos(a)*r,cen[1]+Math.sin(a)*r*.92])}put(C,w*.8)}continue}
  if(len>g.T*2.1||big.length<2){// 팔·다리: 길이 방향 줄을 그늘 쪽부터 채운다. 어두울수록 더 많이
   const lohi=i=>[g.EL[i][0],g.EL[i][1]+ins*1.9,g.ER[i][1]-ins*1.9],[,mlo,mhi]=lohi(last>>1),inner=mhi-mlo,k=Math.floor(inner/gap)+1;if(inner<w*.5)continue;
   // 어느 쪽이 어두운지: 양쪽 가장자리 근처 밝기 비교
   let dl=0,dh=0;for(let i=Math.round(n*.2);i<Math.round(n*.8);i+=2){const[u,lo,hi]=lohi(i),a=toW(g,u,lo),b=toW(g,u,hi);dl+=lm(at(a[0],a[1]));dh+=lm(at(b[0],b[1]))}
   const fromLo=dl<=dh,cover=clamp(.85-g.plum*.8,.3,.6),kk=Math.max(1,Math.round(k*cover));
   for(let s=0;s<kk;s++){const f=clamp(k>1?(s+ph)/(k-1):.5,0,1),ff=fromLo?f:1-f,C=[],i0=Math.round(n*rr(.08,.18)),i1=Math.round(n*rr(.82,.92));for(let i=i0;i<i1;i++){const[u,lo,hi]=lohi(i);if(hi-lo<w*.4)continue;C.push(toW(g,u,lerp(lo,hi,ff)+rr(-.4,.4)))}put(C,w*.85)}continue}
  // 각진 면: 면마다 그 면이 긴 방향으로 줄을 긋는다. 밝은 면은 성기게
  const done=[];for(const f of big.sort((a,b)=>b.n-a.n)){if(done.some(H=>inPoly(H,f.cx,f.cy)))continue;done.push(f.H);const H=f.H,a=f.elong>1.25?snapA(f.ang):(Math.abs(Math.cos(g.th))>.7?0:Math.PI/2),dx=Math.cos(a),dy=Math.sin(a),nx=-dy,ny=dx;
   let p0=1e9,p1=-1e9;for(const q of H){const t=(q[0]-f.cx)*nx+(q[1]-f.cy)*ny;p0=Math.min(p0,t);p1=Math.max(p1,t)}
   const gg=gap*(f.lum>.7?1.5:f.lum>.5?1.3:f.lum>.3?1.1:1);for(let o=p0+ins*2.2+gg*ph;o<=p1-ins*2.2;o+=gg){const ox=f.cx+nx*o,oy=f.cy+ny*o;let t0=0,t1=0;const st=2;while(t0<600&&inPoly(H,ox-dx*(t0+st),oy-dy*(t0+st)))t0+=st;while(t1<600&&inPoly(H,ox+dx*(t1+st),oy+dy*(t1+st)))t1+=st;t0-=ins*2;t1-=ins*2;if(t0+t1<w*1.5)continue;
    const C=[];for(let s=0;s<=5;s++){const t=-t0+(t0+t1)*s/5;C.push([ox+dx*t+rr(-.4,.4),oy+dy*t+rr(-.4,.4)])}put(C,w*.8)}}}
 };
 fillPass(0);
 CUR=0;
 begin('붉은 붓 덧칠');{const RD=[[176,58,44],[204,84,62],[132,40,30]];fillPass(.5,RD,.72,W3HOST.paint.popt.ljsgap5);
  // 머리 포인트: 눈·눈구멍·안테나·볏을 붉은 붓(3단계보다 조금 가늘게)으로 짚어 머리를 알아보게 한다. 보이는 머리 위에서만
  const hg=heads.slice().sort((a,b)=>(b.u1-b.u0)*b.T-(a.u1-a.u0)*a.T)[0],hp=HINTS.hp,F=HINTS.face;
  if(hg&&hp){const w=clamp(Math.min(hg.T,hg.u1-hg.u0)*.23,3.8*SZ,11*SZ)*.72,er=Math.max(hp.r*1.3,w*.7);CUR=headPids;
   const red=C=>{for(const R_ of visRuns(C,CUR)){if(R_.length<2)continue;const S=R_.length>3?smooth(R_,1):R_;push(()=>{const sh=RD[2].map(v=>v*.5);ribbonPath(c,'round',S,w*1.15,[sh,sh,sh],.4);ribbonPath(c,'round',S,w,[RD[0],RD[1],RD[0]],.95)})}};
   if(F&&F.vis>.2){const sep=hp.eyes.length>1?Math.hypot(hp.eyes[1][0]-hp.eyes[0][0],hp.eyes[1][1]-hp.eyes[0][1]):1e9;for(const e of hp.eyes){const L_=Math.min(er*rr(1.4,1.7),Math.max(w*.4,sep*.5-w*.6)),tl=rr(-.25,.1),dx=Math.cos(tl),dy=Math.sin(tl),bw=er*rr(.25,.4),C=[];for(let k=0;k<=6;k++){const t=k/6*2-1;C.push([e[0]+dx*t*L_-dy*(1-t*t)*bw,e[1]+dy*t*L_+dx*(1-t*t)*bw*-1])}red(C)}if(hp.visor)red([hp.visor[0],lerp2(hp.visor[0],hp.visor[1],.5),hp.visor[1],lerp2(hp.visor[1],hp.visor[2],.5),hp.visor[2]])}
   for(const[a,b] of hp.ant)red([a,lerp2(a,b,.33),lerp2(a,b,.66),b]);if(hp.fin)red([hp.fin[0],hp.fin[1],hp.fin[2]]);CUR=0}}
 }else if(W3HOST.paint.popt.medium==='flat'||W3HOST.paint.popt.medium==='oil3'){
 // ── 평붓 터치: 넓고 납작한 붓을 면 단위로 반듯하게 눌러 놓는다. 명암은 몇 단계로 끊고, 그늘은 남색, 붓 끝은 마른 붓으로 갈라진다
 push(()=>{c.fillStyle='#ffffff';c.fillRect(0,0,N,N)});if(W3HOST.paint.popt.shadow){shadowJob()}
 const POST=p=>{const l=(p[0]*.3+p[1]*.59+p[2]*.11)/255,bands=[.12,.3,.5,.7,.88],b=bands.reduce((a,v)=>Math.abs(v-l)<Math.abs(a-l)?v:a),k=l>.02?b/l:1;let q=[p[0]*k,p[1]*k,p[2]*k].map(v=>clamp(v,0,255));const lq=q[0]*.3+q[1]*.59+q[2]*.11;q=q.map(v=>clamp(lq+(v-lq)*1.25,0,255));if(b<.45)q=toward(q,[28,36,80],(.45-b)*1.15);const mx=Math.max(...q),mn=Math.min(...q);if(mx-mn<28)q=toward(q,[q[0]*.86,q[1]*.93,Math.min(255,q[2]*1.08+12)],.6);return[...q,p[3]]};
 const fa=(x,y,base)=>{const[ga,gm]=gAt(x,y);return gm>.18?ga+Math.PI/2+rr(-.12,.12):base+rr(-.3,.3)};
 const col_=p=>isDark(p)?[26,32,72,1]:POST(p);
 // 1단계: 굵은 붓으로 관절(부품) 하나씩 크게 채운다. 뒤에 있는 부품부터 칠하므로 앞 부품이 자연스럽게 덮는다
 begin('굵은 붓 · 관절 단위');
 const paintRows=(list,sh,al)=>{for(const part of list)for(const st of part)push(()=>st.long?drawLong(c,sh,st.x,st.y,st.a,st.l,st.w,[col_(st.p0),col_(st.p),col_(st.p2)],al,st.bend):bigB(st.x,st.y,st.a,st.l,st.w,col_(st.p).map((v,i)=>i<3?clamp(v*(1+rr(-.05,.05)),0,255):v),al,sh))};
 const gridPass=(sp,wb,sh,long,W,Lm,al,keep)=>{for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){if(R()>keep)continue;const px=x+rr(-sp/2,sp/2),py=y+rr(-sp/2,sp/2),p=at(px,py);if(p[3]<.5)continue;push(()=>long?drawLong(c,sh,px,py,fa(px,py,-1),rr(60,120)*SZ*Math.sqrt(wb/15),rr(.8,1.2)*wb*SZ*W,[col_(p),col_(p),col_(p)],al,rr(-1,1)):bigB(px,py,fa(px,py,-1),rr(22,40)*SZ*Lm*Math.sqrt(wb/15),rr(.8,1.2)*wb*SZ*W,col_(p),al,sh))}};
 if(parts.length)paintRows(parts,W3HOST.paint.popt.bshape,.97);else gridPass(11*SZ,15,W3HOST.paint.popt.bshape,W3HOST.paint.popt.blong,W3HOST.paint.popt.bw,W3HOST.paint.popt.bl,.96,1);
 // 2단계: 중간 붓으로 부품 안의 형태와 명암을 다듬는다
 if(W3HOST.paint.popt.mon){begin('중간 붓 · 형태 다듬기');if(mparts.length)paintRows(mparts,W3HOST.paint.popt.mshape,.9);else gridPass(6.5*SZ,8,W3HOST.paint.popt.mshape,W3HOST.paint.popt.mlong,W3HOST.paint.popt.mw,W3HOST.paint.popt.ml,.9,.8)}
 // 2단계: 얇은 붓으로 디테일 — 경계와 무늬, 반짝임, 짙은 남색 경계
 begin('얇은 붓 · 디테일');
 if(W3HOST.paint.popt.tlong){
  // 경계를 따라 길게 이어 긋기: 결이 센 곳에서 출발해 경계 방향으로 따라가며 한 획으로 잇는다
  let lid=0;const vis=new Int32Array(gw*gw),cell=(x,y)=>clamp(y/G|0,0,gw-1)*gw+clamp(x/G|0,0,gw-1),seeds=[];
  for(let y=by0;y<=by1;y+=G)for(let x=bx0;x<=bx1;x+=G){const i=cell(x,y);if(gmag[i]>.45&&at(x,y)[3]>.3)seeds.push([x,y,gmag[i]])}
  seeds.sort((a,b)=>b[2]-a[2]);const lines=[],step=3*SZ;
  const mark=(x,y)=>{const cx=clamp(x/G|0,0,gw-1),cy=clamp(y/G|0,0,gw-1);for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const xx=cx+i,yy=cy+j;if(xx>=0&&yy>=0&&xx<gw&&yy<gw)if(!vis[yy*gw+xx])vis[yy*gw+xx]=lid}};
  const walk=(x,y,a0)=>{const pts=[];let a=a0;for(let k=0;k<70;k++){x+=Math.cos(a)*step;y+=Math.sin(a)*step;const i=cell(x,y);if((vis[i]&&vis[i]!==lid)||gmag[i]<.32||at(x,y)[3]<.2)break;let na=gang[i]+Math.PI/2;if(Math.cos(na-a)<0)na+=Math.PI;const da=Math.atan2(Math.sin(na-a),Math.cos(na-a));if(Math.abs(da)>.9)break;a+=da*.6;pts.push([x,y]);mark(x,y)}return pts};
  for(const[x,y] of seeds){if(vis[cell(x,y)])continue;lid++;const a=gang[cell(x,y)]+Math.PI/2;mark(x,y);const f=walk(x,y,a),b=walk(x,y,a+Math.PI);const pts=[...b.reverse(),[x,y],...f];if(pts.length<4)continue;let gs=0;for(const q of pts)gs+=gmag[cell(q[0],q[1])];lines.push({pts,g:gs/pts.length})}
  for(const ln of lines){const mid=ln.pts[ln.pts.length>>1],p=at(mid[0],mid[1]);push(()=>{const q=col_(p);ribbonPath(c,W3HOST.paint.popt.tshape,smooth(ln.pts,1),rr(2.2,3.6)*SZ*W3HOST.paint.popt.tw,[q,q,q],.95)})}
  if(W3HOST.paint.popt.line!=='none'&&W3HOST.paint.popt.medium!=='oil3'){const k=W3HOST.paint.popt.line==='bold'?1:.5;for(const ln of lines){if(ln.g<.9||R()<.3)continue;push(()=>{const q=[24,30,66];ribbonPath(c,W3HOST.paint.popt.tshape,smooth(ln.pts,1),rr(1.6,2.8)*SZ*W3HOST.paint.popt.tw,[q,q,q],.75*k)})}}
 {const sp=8*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const p=at(x,y);if(p[3]<.5||(p[0]+p[1]+p[2])/765<.8||R()<.55)continue;push(()=>bigB(x+rr(-3,3),y+rr(-3,3),fa(x,y,-1),rr(8,16)*SZ*W3HOST.paint.popt.tl,rr(2.4,4)*SZ*W3HOST.paint.popt.tw,[250,252,255,1],.95,W3HOST.paint.popt.tshape))}}
 }else{
 {const sp=3.4*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const px=x+rr(-1.2,1.2),py=y+rr(-1.2,1.2),[ga,gm]=gAt(px,py);if(gm<.45)continue;const p=at(px,py);if(p[3]<.35)continue;push(()=>bigB(px,py,ga+Math.PI/2+rr(-.1,.1),rr(6,12)*SZ*W3HOST.paint.popt.tl,rr(2.2,3.8)*SZ*W3HOST.paint.popt.tw,col_(p),.97,W3HOST.paint.popt.tshape))}}
 {const sp=8*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const p=at(x,y);if(p[3]<.5||(p[0]+p[1]+p[2])/765<.8||R()<.55)continue;push(()=>bigB(x+rr(-3,3),y+rr(-3,3),fa(x,y,-1),rr(8,16)*SZ*W3HOST.paint.popt.tl,rr(2.4,4)*SZ*W3HOST.paint.popt.tw,[250,252,255,1],.95,W3HOST.paint.popt.tshape))}}
 if(W3HOST.paint.popt.line!=='none'&&W3HOST.paint.popt.medium!=='oil3'){const k=W3HOST.paint.popt.line==='bold'?1:.5,sp=4*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const[ga,gm]=gAt(x,y);if(gm<1||R()<.5||at(x,y)[3]<.2)continue;push(()=>bigB(x,y,ga+Math.PI/2,rr(8,16)*SZ*W3HOST.paint.popt.tl,rr(1.8,3)*SZ*W3HOST.paint.popt.tw,[24,30,66,1],.75*k,W3HOST.paint.popt.tshape))}}
 }
 if(W3HOST.paint.popt.medium==='oil3')oil2Run(false);
 }else if(W3HOST.paint.popt.medium==='gogh'){
 // ── 고흐풍: 짧고 두꺼운 붓 자국을 형태의 흐름을 따라 나란히 촘촘히 놓고, 그늘은 군청·보라로, 빛은 크롬 노랑으로 밀어 낸다
 push(()=>{c.fillStyle='#ffffff';c.fillRect(0,0,N,N)});if(W3HOST.paint.popt.shadow){shadowJob()}
 const GG=p=>{const q=SAT(p),l=(q[0]*.3+q[1]*.59+q[2]*.11)/255;let r=q;if(l<.38)r=toward(r,[38,58,150],.42*(1-l/.38)+.12);else if(l>.7)r=toward(r,[250,214,90],.28*(l-.7)/.3+.08);return r.map((v,i)=>i<3?clamp(v,0,255):v)};
 const swirl=(x,y)=>Math.sin(x/58+Math.cos(y/71)*1.7)*1.6+Math.cos(y/47-x/90)*1.2;
 const flow=(x,y)=>{const[ga,gm]=gAt(x,y);return gm>.22?ga+Math.PI/2:swirl(x,y)};
 const curve=(x,y,l)=>{let a0=flow(x,y);const p1=[x+Math.cos(a0)*l/2,y+Math.sin(a0)*l/2];let a1=flow(p1[0],p1[1]);if(Math.cos(a1-a0)<0)a1+=Math.PI;const p2=[p1[0]+Math.cos(a1)*l/2,p1[1]+Math.sin(a1)*l/2];return[[x,y],p1,p2]};
 const accent=q=>{const l=(q[0]*.3+q[1]*.59+q[2]*.11)/255,warm=q[0]>q[2];return warm?[60,90,190,1]:[240,150,50,1]};
 begin('바탕 붓');
 // 1층: 형태를 덮는 굵은 바탕 붓
 {const sp=9*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const px=x+rr(-sp/2,sp/2),py=y+rr(-sp/2,sp/2),p=at(px,py);if(p[3]<.45)continue;const q=isDark(p)?[30,40,90,1]:GG(p).map((v,i)=>i<3?v*.82:v);push(()=>br(curve(px,py,rr(16,26)*SZ),rr(7,11)*SZ,q,.95))}}
 begin('짧은 붓 자국');
 // 2층: 흐름을 따라 나란히 놓는 짧은 붓 자국
 const dash=[];{const sp=4.6*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const px=x+rr(-sp*.45,sp*.45),py=y+rr(-sp*.45,sp*.45),p=at(px,py);if(p[3]<.5)continue;dash.push([px,py,p])}}
 for(let i=dash.length-1;i>0;i--){const j=R()*(i+1)|0;[dash[i],dash[j]]=[dash[j],dash[i]]}
 for(const[px,py,p] of dash)push(()=>{let q=isDark(p)?[28,38,88,1]:GG(p);q=q.map((v,i)=>i<3?clamp(v*(1+rr(-.1,.1)),0,255):v);if(R()<.14)q=toward(q,accent(q),.55);br(curve(px,py,rr(8,15)*SZ),rr(3.4,5.4)*SZ,q,rr(.9,1))});
 if(W3HOST.paint.popt.line!=='none')begin('군청 윤곽');
 // 군청 윤곽: 형태 둘레를 짙은 파랑으로 끊어 그린다
 if(W3HOST.paint.popt.line!=='none'){const k=W3HOST.paint.popt.line==='bold'?1:.6,sp=3.6*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const px=x+rr(-1.5,1.5),py=y+rr(-1.5,1.5),[ga,gm]=gAt(px,py);if(gm<.7||R()<.45)continue;if(at(px,py)[3]<.2)continue;push(()=>stroke_(line3(px,py,ga+Math.PI/2+rr(-.12,.12),rr(8,16)*SZ,rr(-.15,.15)),rr(2.2,3.8)*SZ,'rgb(28,44,108)',rr(.55,.85)*k))}}
 begin('노란 빛');
 // 노란 빛: 밝은 곳에 두꺼운 크롬 노랑과 흰 물감
 {const sp=7*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const p=at(x,y);if(p[3]<.5||(p[0]+p[1]+p[2])/765<.74||R()<.45)continue;const q=R()<.5?[255,232,120,1]:[255,250,232,1];push(()=>br(curve(x+rr(-3,3),y+rr(-3,3),rr(7,13)*SZ),rr(3.5,5.5)*SZ,q,.95))}}
 }else{
 // 바탕은 흰색 한 가지로 두고 칠하지 않는다
 push(()=>{c.fillStyle='#ffffff';c.fillRect(0,0,N,N)});if(W3HOST.paint.popt.shadow){shadowJob()}
 begin('밑칠');
 // 밑칠: 어둡게 크게
 {const sp=11*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const px=x+rr(-sp/2,sp/2),py=y+rr(-sp/2,sp/2),p=at(px,py);if(p[3]<.45)continue;const q=SAT(p).map((v,i)=>i<3?v*.55:v);push(()=>br(line3(px,py,-1.05+rr(-.5,.5),rr(20,40)*SZ,rr(-.1,.1)),rr(10,16)*SZ,q,.92))}}
 begin('본칠');
 // 본칠: 결을 따라 불투명하게
 const mainO=[];{const sp=7*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const px=x+rr(-sp*.6,sp*.6),py=y+rr(-sp*.6,sp*.6),p=at(px,py);if(p[3]<.5)continue;mainO.push([px,py,p])}}
 for(let i=mainO.length-1;i>0;i--){const j=R()*(i+1)|0;[mainO[i],mainO[j]]=[mainO[j],mainO[i]]}
 for(const[px,py,p] of mainO)push(()=>{const[ga,gm]=gAt(px,py),a=gm>.25?ga+Math.PI/2+rr(-.25,.25):-1.05+rr(-.45,.45),q=isDark(p)?[40,28,22,1]:SAT(p).map((v,i)=>i<3?clamp(v*(1+rr(-.08,.08)),0,255):v);br(line3(px,py,a,rr(14,32)*SZ,rr(-.12,.12)),rr(6,11)*SZ,q,rr(.85,.97))});
 begin('세부와 윤곽');
 // 세부: 경계만 가늘고 진하게
 {const sp=3.8*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const px=x+rr(-1.5,1.5),py=y+rr(-1.5,1.5),[ga,gm]=gAt(px,py);if(gm<.55)continue;const p=at(px,py);if(p[3]<.3)continue;const q=isDark(p)?[34,24,18,1]:SAT(p);push(()=>br(line3(px,py,ga+Math.PI/2+rr(-.15,.15),rr(6,13)*SZ,rr(-.1,.1)),rr(2.4,4.4)*SZ,q,.92));
  if(W3HOST.paint.popt.line!=='none'&&R()<.35&&((p[0]*.3+p[1]*.59+p[2]*.11)<115||gm>1.2)){const k=W3HOST.paint.popt.line==='bold'?1:.55;push(()=>stroke_(line3(px,py,ga+Math.PI/2+rr(-.1,.1),rr(9,20)*SZ,rr(-.15,.15)),rr(1.6,3.2)*SZ,'rgb(30,20,15)',rr(.35,.65)*k))}}}
 begin('밝은 물감');
 // 두껍게 얹은 밝은 물감
 {const sp=8*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const p=at(x,y);if(p[3]<.5||(p[0]+p[1]+p[2])/765<.8||R()<.6)continue;const q=toward(SAT(p),[255,244,222],.45);push(()=>br(line3(x+rr(-4,4),y+rr(-4,4),-1.05+rr(-.4,.4),rr(8,18)*SZ,rr(-.1,.1)),rr(4,7)*SZ,q,.95))}}
  }
 }else{
 // 바탕은 흰색 한 가지로 두고 칠하지 않는다
 push(()=>{c.fillStyle='#ffffff';c.fillRect(0,0,N,N)});if(W3HOST.paint.popt.shadow){shadowJob()}
 begin('물 번짐');
 // 물 번짐 바탕: 모델 색을 크고 무르게 먼저 깐다
 {const sp=16*SZ;for(let y=by0-10;y<=by1+10;y+=sp)for(let x=bx0-10;x<=bx1+10;x+=sp){const p=at(x+rr(-sp/2,sp/2),y+rr(-sp/2,sp/2));if(p[3]<.4)continue;const X_=x,Y_=y;push(()=>{const r=rr(14,26)*SZ*(.6+wet),g=c.createRadialGradient(X_,Y_,0,X_,Y_,r),q=toward(p,PAPERRGB,.35);g.addColorStop(0,`rgba(${q[0]|0},${q[1]|0},${q[2]|0},${.22*(.4+wet)})`);g.addColorStop(1,`rgba(${q[0]|0},${q[1]|0},${q[2]|0},0)`);c.globalCompositeOperation='multiply';c.fillStyle=g;c.fillRect(X_-r,Y_-r,r*2,r*2);c.globalCompositeOperation='source-over'})}}
 begin('굵은 붓');
 // 굵은 붓: 결 방향을 따라 색을 덮는다
 const main=[];{const sp=7*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const px=x+rr(-sp*.6,sp*.6),py=y+rr(-sp*.6,sp*.6),p=at(px,py);if(p[3]<.5)continue;main.push([px,py,p])}}
 for(let i=main.length-1;i>0;i--){const j=R()*(i+1)|0;[main[i],main[j]]=[main[j],main[i]]}
 for(const[px,py,p] of main)push(()=>{const[ga,gm]=gAt(px,py),a=gm>.25?ga+Math.PI/2+rr(-.25,.25):-1.05+rr(-.45,.45),l=rr(13,30)*SZ,dark=(p[0]*.3+p[1]*.59+p[2]*.11)<38,col=dark?rgb(toward(p,[70,82,108],.65)):rgb(p,rr(-.07,.06));stroke_(line3(px,py,a,l,rr(-.12,.12)),rr(4.5,9)*SZ,col,rr(.5,.78)*(dark?.55:1))});
 begin('그늘 겹칠');
 // 그늘 겹칠: 어두운 곳에 한 번 더 무른 붓
 {const sp=10*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const px=x+rr(-sp/2,sp/2),py=y+rr(-sp/2,sp/2),p=at(px,py);if(p[3]<.5)continue;const l_=(p[0]*.3+p[1]*.59+p[2]*.11)/255;if(l_>.55)continue;push(()=>{stroke_(line3(px,py,-1.05+rr(-.5,.5),rr(18,36)*SZ,rr(-.1,.1)),rr(6,12)*SZ,rgb(toward(p,[40,50,80],.35)),rr(.12,.25),'multiply')})}}
 begin('가는 붓');
 // 가는 붓: 윤곽과 무늬가 있는 곳만 촘촘히
 const fine=[];{const sp=3.6*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const px=x+rr(-1.5,1.5),py=y+rr(-1.5,1.5),[ga,gm]=gAt(px,py);if(gm<.55)continue;const p=at(px,py);if(p[3]<.3)continue;fine.push([px,py,p,ga,gm])}}
 for(const[px,py,p,ga] of fine)push(()=>{const dark=(p[0]*.3+p[1]*.59+p[2]*.11)<38;stroke_(line3(px,py,ga+Math.PI/2+rr(-.15,.15),rr(5,12)*SZ,rr(-.1,.1)),rr(1.8,3.4)*SZ,dark?rgb(toward(p,[55,66,92],.6)):rgb(p,rr(-.05,.04)),rr(.6,.85)*(dark?.6:1))});
 if(W3HOST.paint.popt.line!=='none')begin('윤곽 붓선');
 // 윤곽 붓선: 진한 남색이 끊기며 지나간다
 if(W3HOST.paint.popt.line!=='none'){const k=W3HOST.paint.popt.line==='bold'?1:.55;for(const[px,py,p,ga,gm] of fine){if(R()>.42)continue;const l_=(p[0]*.3+p[1]*.59+p[2]*.11)/255;if(l_>.45&&gm<1.2)continue;push(()=>stroke_(line3(px,py,ga+Math.PI/2+rr(-.1,.1),rr(8,18)*SZ,rr(-.15,.15)),rr(1.2,2.6)*SZ,'rgb(38,46,66)',rr(.25,.55)*k,'multiply'))}}
 begin('물감 고임');
 // 물감 고임: 바깥 경계에 진한 테
 {const sp=5*SZ;for(let y=by0-4;y<=by1+4;y+=sp)for(let x=bx0-4;x<=bx1+4;x+=sp){const a0=at(x,y)[3];if(a0<.5)continue;let edge=false;for(const[dx,dy] of[[6,0],[-6,0],[0,6],[0,-6]])if(at(x+dx*SZ,y+dy*SZ)[3]<.3){edge=true;break}if(!edge||R()<.35)continue;const p=at(x,y),[ga]=gAt(x,y);push(()=>stroke_(line3(x,y,ga+Math.PI/2,rr(6,14)*SZ,0),rr(1.5,3.5)*SZ,rgb(toward(p,[30,40,70],.45)),rr(.18,.35),'multiply'))}}
 begin('반짝임과 알갱이');
 // 마른 붓 반짝임
 {const sp=9*SZ;for(let y=by0;y<=by1;y+=sp)for(let x=bx0;x<=bx1;x+=sp){const p=at(x,y);if(p[3]<.5||(p[0]+p[1]+p[2])/765<.72||R()<.55)continue;push(()=>stroke_(line3(x+rr(-4,4),y+rr(-4,4),-1.05+rr(-.3,.3),rr(10,24)*SZ,0),rr(.8,2)*SZ,'#ffffff',rr(.45,.8)))}}
 // 물감 알갱이
 push(()=>{c.globalCompositeOperation='multiply';for(let i=0;i<1600;i++){const x=rr(bx0,bx1),y=rr(by0,by1);if(at(x,y)[3]<.5)continue;c.globalAlpha=rr(.05,.14);c.fillStyle='#4a4a58';c.fillRect(x,y,rr(1,2.2),rr(1,2.2))}c.globalCompositeOperation='source-over';c.globalAlpha=1});
 }
 // 4. 나눠서 그리며 진행을 보여 준다
 const pc=W3HOST.paint.PCV.getContext('2d'),total=jobs.length;let k=0;
 const step=()=>{if(job.cancel)return;const t0=performance.now();while(k<total&&performance.now()-t0<14)jobs[k++]();pc.drawImage(o,0,0);onProgress&&onProgress(k/total);if(k<total)requestAnimationFrame(step);else{if(curStage)snap(curStage);W3HOST.paint.paintJob=null;W3HOST.paint.painted=true;W3HOST.paint.stageSel=W3HOST.paint.paintStages.length-1;onProgress&&onProgress(1,true)}};
 requestAnimationFrame(step)}

return{paintModel}})();
{const _pm=W3HOST.paintModel;W3HOST.paintModel=function(cb){try{if(W3HOST.WORLD==='3d2'&&R3D2.ok(W3HOST.proj.model))return P3D.paintModel(cb)}catch(e){console.warn(e)}return _pm.call(this,cb)}}/* 3D 월드에서는 그림 그리기를 이 파일 것으로 */
