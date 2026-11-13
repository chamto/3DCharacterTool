// ═══ 3D 월드: 같은 자세·동작 데이터를 실제 3D 도형(깊이 버퍼)으로 그린다. 외부 라이브러리 없이 WebGL 직접 사용 ═══
// 좌표는 2D와 같은 [앞, 오른쪽, 위]. 투영도 2D와 같은 직교 투영(옆으로 돌림 yaw, 내려다봄 sq)이라 두 월드가 같은 자리·크기로 보인다.
let WORLD='2d';
const R3D=(()=>{let gl=null,cvs=null,prog=null,buf={},ok=false;
 const VS=`attribute vec3 p;attribute vec3 n;uniform mat4 M;uniform mat3 N;uniform mat4 V;uniform float ow;uniform float r0;uniform float r1;uniform float tap;
 varying vec3 vn;void main(){vec3 q=p;if(tap>.5){float k=mix(r0,r1,q.z);q.xy*=k;}vec3 nn=normalize(N*n);vec4 w=M*vec4(q,1.);w.xyz+=nn*ow;vn=nn;gl_Position=V*w;}`;
 const FS=`precision mediump float;varying vec3 vn;uniform vec3 col;uniform vec3 L;uniform float flat_;uniform float alpha;
 void main(){if(flat_>.5){gl_FragColor=vec4(col,alpha);return;}float d=dot(normalize(vn),L);vec3 ink=vec3(.12,.11,.10);vec3 c=d>.55?mix(col,vec3(1.),.22):d>-.05?col:mix(col,ink,.34);gl_FragColor=vec4(c,alpha);}`;
 const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(s);return s};
 // 단위 도형: 원통(z 0→1, 반지름 1, 마개 포함), 공, 상자
 function mesh(P,Nn){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);const a=new Float32Array(P.length*2);for(let i=0;i<P.length/3;i++){a.set(P.slice(i*3,i*3+3),i*6);a.set(Nn.slice(i*3,i*3+3),i*6+3)}gl.bufferData(gl.ARRAY_BUFFER,a,gl.STATIC_DRAW);return{b,n:P.length/3}}
 function build(){const P=[],Nn=[],tri=(a,b,c,na,nb,nc)=>{P.push(...a,...b,...c);Nn.push(...na,...nb,...nc)};
  // 원통
  const S=20;for(let i=0;i<S;i++){const a0=i/S*6.2832,a1=(i+1)/S*6.2832,c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1),A=[c0,s0,0],B=[c1,s1,0],C=[c1,s1,1],D=[c0,s0,1],na=[c0,s0,0],nb=[c1,s1,0];tri(A,B,C,na,nb,nb);tri(A,C,D,na,nb,na);tri([0,0,0],B,A,[0,0,-1],[0,0,-1],[0,0,-1]);tri([0,0,1],D,C,[0,0,1],[0,0,1],[0,0,1])}
  buf.cyl=mesh(P.splice(0),Nn.splice(0));
  // 공
  const LA=12,LO=20,sp=(la,lo)=>{const t=la/LA*Math.PI-Math.PI/2,f=lo/LO*6.2832;return[Math.cos(t)*Math.cos(f),Math.cos(t)*Math.sin(f),Math.sin(t)]};for(let i=0;i<LA;i++)for(let j=0;j<LO;j++){const a=sp(i,j),b=sp(i,j+1),c=sp(i+1,j+1),d=sp(i+1,j);tri(a,b,c,a,b,c);tri(a,c,d,a,c,d)}
  buf.sph=mesh(P.splice(0),Nn.splice(0));
  // 상자
  const F=[[[1,0,0],[0,1,0],[0,0,1]],[[-1,0,0],[0,0,1],[0,1,0]],[[0,1,0],[0,0,1],[1,0,0]],[[0,-1,0],[1,0,0],[0,0,1]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[0,1,0],[1,0,0]]];
  for(const[n,u,v] of F){const c=(su,sv)=>[n[0]+u[0]*su+v[0]*sv,n[1]+u[1]*su+v[1]*sv,n[2]+u[2]*su+v[2]*sv];tri(c(-1,-1),c(1,-1),c(1,1),n,n,n);tri(c(-1,-1),c(1,1),c(-1,1),n,n,n)}
  buf.box=mesh(P.splice(0),Nn.splice(0));
  buf.dyn=gl.createBuffer()}
 function init(){if(gl)return ok;cvs=document.getElementById('gl3d');if(!cvs)return false;gl=cvs.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl)return false;
  try{prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);build();ok=true}catch(e){console.warn(e);ok=false}return ok}
 const U=n=>gl.getUniformLocation(prog,n);
 const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
 // 변환: 단위 도형 → 세상. 열 벡터 a,b,c(축)와 o(원점)
 const mat=(a,b,c,o)=>[a[0],a[1],a[2],0,b[0],b[1],b[2],0,c[0],c[1],c[2],0,o[0],o[1],o[2],1];
 function nmat(a,b,c){// (M3)^-T
  const m=[a[0],b[0],c[0],a[1],b[1],c[1],a[2],b[2],c[2]],det=m[0]*(m[4]*m[8]-m[5]*m[7])-m[1]*(m[3]*m[8]-m[5]*m[6])+m[2]*(m[3]*m[7]-m[4]*m[6])||1e-6,
   inv=[(m[4]*m[8]-m[5]*m[7])/det,(m[2]*m[7]-m[1]*m[8])/det,(m[1]*m[5]-m[2]*m[4])/det,(m[5]*m[6]-m[3]*m[8])/det,(m[0]*m[8]-m[2]*m[6])/det,(m[2]*m[3]-m[0]*m[5])/det,(m[3]*m[7]-m[4]*m[6])/det,(m[1]*m[6]-m[0]*m[7])/det,(m[0]*m[4]-m[1]*m[3])/det];
  // inv는 행 우선. 열 우선 전치(=inv^T)를 넘긴다: inv^T 의 열 우선 = inv 의 행 우선 그대로
  return inv}
 const perp=ax=>{let u=vcross(ax,[0,0,1]);if(vlen(u)<.2)u=vcross(ax,[1,0,0]);u=norm(u);return[u,norm(vcross(ax,u))]};
 let parts=[];
 const seg=(A,B,r0,r1,col,o={})=>{const ax=vsub(B,A);if(vlen(ax)<1e-4)return;const[u,w]=o.side?(()=>{let s=vsub(o.side,vmul(norm(ax),vdot(o.side,norm(ax))));if(vlen(s)<.1)return perp(norm(ax));s=norm(s);return[s,norm(vcross(norm(ax),s))]})():perp(norm(ax));const ex=o.ex||1;parts.push({m:'cyl',a:vmul(u,ex),b:w,c:ax,o:A,r0,r1,col})};
 const ball=(C,rx,ry,rz,col,o={})=>{const f=o.f||[1,0,0],r=o.r||[0,1,0],up=o.u||[0,0,1];parts.push({m:'sph',a:vmul(f,rx),b:vmul(r,ry),c:vmul(up,rz),o:C,col})};
 const box=(C,hx,hy,hz,col,o={})=>{const f=o.f||[1,0,0],r=o.r||[0,1,0],up=o.u||[0,0,1];parts.push({m:'box',a:vmul(f,hx),b:vmul(r,hy),c:vmul(up,hz),o:C,col})};
 const boxAB=(A,B,w,t,col,side)=>{const ax=vsub(B,A),L=vlen(ax);if(L<1e-4)return;const z=vmul(ax,1/L);let s=side||[0,1,0];s=vsub(s,vmul(z,vdot(s,z)));if(vlen(s)<.1)s=perp(z)[0];s=norm(s);const th=norm(vcross(z,s));parts.push({m:'box',a:vmul(s,w),b:vmul(th,t),c:vmul(z,L/2),o:vlerp(A,B,.5),col})};
 // ─ 뼈대: 2D 그리기와 같은 식 ─
 function skeleton(m,pose,down){const mech=m.style==='mech',bd=m.body||{},bT=bd.torso??1,LM=bd.limb??1,bL=bd.leg??1,bS=bd.shoulder??1,hs=bd.head??1,bN=bd.neck??1,legDrop=48-48*bL;
  const feet=pose.feet||KDEF.feet,crouch=pose.crouch??0,elb=pose.elb??0,nod=pose.nod??0,L=pose.lean+(down||0)*14,drop=(down||0)*30+crouch,H0=48*bL-drop,bend=u=>L*(u-H0)/60,T=u=>[bend(u),0,u],uS=H0+40;
  const legs=[0,1].map(i=>{const side=i?1:-1,Hp=mech?[0,side*8*bT,H0-2]:[0,side*9*bT,H0],F=[feet[i][0],feet[i][1],0],K=ik2(Hp,F,(mech?23.1:25.5)*bL,(mech?23.1:25.5)*bL,[1,side*(mech?.1:.45),0]),toe=norm([1,side*(mech?.15:.32),0]),A=vadd(F,[0,0,mech?6:5]);return{side,Hp,K,F,A,toe}});
  const hd=[pose.h[0]+L*(pose.h[2]-48)/60,pose.h[1],pose.h[2]-drop-legDrop],d=norm(pose.d),sword=!mech||m.weapon==='sword';
  const op=pose.off||KDEF.off,off=mech?(sword?vsub(hd,vmul(d,11)):[op[0]+L*(op[2]-48)/60,op[1],op[2]-drop-legDrop]):vsub(hd,vmul(d,10));
  const arms=[0,1].map(i=>{const side=i?1:-1,S=mech?[bend(uS),side*18*bS,uS-1]:[bend(uS),side*16*bS,uS],Hn=i?hd:off,E=mech?ik2(S,Hn,22,22,[-.4,side*(.6+elb*.8),-.8]):ik2(S,Hn,23,22,[-.35,side*(.7+elb*.8),-.8]);return{side,S,E,Hn}});
  const head=mech?vadd(T(uS+11*bN+2),[nod*4,0,-nod*2]):vadd(T(uS+18*bN),[nod*5,0,-nod*3]);
  const nA=nod*.6,hyw=pose.hyaw??0,cP=Math.cos(nA),sP=Math.sin(nA),cY=Math.cos(hyw),sY=Math.sin(hyw),HR=v=>{const[f,r,u]=v,f2=f*cP+u*sP,u2=u*cP-f*sP;return[f2*cY-r*sY,f2*sY+r*cY,u2]};
  return{mech,bT,LM,hs,bS,legs,arms,hd,d,sword,H0,uS,T,bend,head,HR,blade:bladeLen(m)}}
 // ─ 판금 기사 ─
 function knight(m,K){const p=m.pal||{},st=p.steel||'#d9dee0',cl=p.cloth||'#3d4f9a',tr=p.trim||'#7d878d',le=p.leather||'#5a3e2a',sk=p.skin||'#e8d2b4',{bT,LM,T,H0,uS}=K;
  for(const g of K.legs){seg(g.Hp,g.K,5.4*LM,4.6*LM,st);ball(g.K,4.6*LM,4.6*LM,4.6*LM,st);seg(g.K,g.A,4.6*LM,3.6*LM,st);const heel=vadd(g.F,vmul(g.toe,-4)),tip=vadd(g.F,vmul(g.toe,10));boxAB(vadd(heel,[0,0,2.2]),vadd(tip,[0,0,1.6]),3.6*LM,2.2,st,[-g.toe[1],g.toe[0],0])}
  seg(T(H0-6),T(H0+8),11*bT,9.2*bT,st,{ex:.75});seg(T(H0+8),T(uS+3),9.2*bT,14*bT,st,{ex:.68});seg(T(H0+5),T(H0+7),9.6*bT,9.6*bT,le,{ex:.78});
  if(m.coat&&m.armor!=='jin'){const kc=vlerp(K.legs[0].K,K.legs[1].K,.5);seg(T(H0+7),[kc[0]*.5,0,kc[2]-3],10*bT,15*bT,cl,{ex:.85})}
  if(m.armor==='jin'){const kc=vlerp(K.legs[0].K,K.legs[1].K,.5);seg(T(H0+6),[kc[0]*.5,0,Math.max(H0-36,kc[2]-9)],10*bT,15*bT,st,{ex:.9})}
  for(const g of K.arms){const fw=norm(vsub(g.Hn,g.E)),wr=vsub(g.Hn,vmul(fw,4));ball(vadd(g.S,[0,g.side*1.5,1]),7.6*(m.psize||1),7.2*(m.psize||1),6.4*(m.psize||1),st);seg(g.S,g.E,4.2*LM,3.8*LM,st);ball(g.E,4*LM,4*LM,4*LM,st);seg(g.E,wr,4*LM,3.6*LM,st);ball(g.Hn,3.8*LM,3.8*LM,3.8*LM,p.glove||st)}
  // 머리·투구(형태를 단순화)
  const hd_=K.head,HR=K.HR,hs=K.hs,f=HR([1,0,0]),r=HR([0,1,0]),u=HR([0,0,1]);seg(T(uS+2),vadd(hd_,[0,0,-8*hs]),4.6,4.2,st);
  const kit=m.helm==='kit'&&m.hkit?m.hkit:null,form=kit?kit.form:m.helm,HC=kit&&kit.colors&&kit.colors.main?kit.colors.main:st,up=kit&&kit.visor==='up';
  if((m.hwear||'helm')!=='helm'){ball(hd_,9*hs,8.4*hs,10.5*hs,sk,{f,r,u});return}
  if(form==='great'){seg(vadd(hd_,vmul(u,-11*hs)),vadd(hd_,vmul(u,11*hs)),10.4*hs,10*hs,HC,{side:r});box(vadd(hd_,vmul(f,10.3*hs)),.6,6.5*hs,.9*hs,'#1d1a17',{f,r,u})}
  else if(form==='kettle'){ball(hd_,9*hs,8.4*hs,10.5*hs,sk,{f,r,u});ball(vadd(hd_,vmul(u,4*hs)),10.6*hs,9.8*hs,9*hs,HC,{f,r,u});seg(vadd(hd_,vmul(u,3.6*hs)),vadd(hd_,vmul(u,4.4*hs)),15*hs,15*hs,HC,{side:r})}
  else if(form==='jin'||form==='jin2'){ball(vadd(hd_,vmul(u,3*hs)),10.8*hs,10*hs,10.5*hs,HC,{f,r,u});if(!up)seg(vadd(hd_,vmul(u,3*hs)),vadd(hd_,vmul(u,-14*hs)),10.6*hs,13.4*hs,HC,{side:r});else{ball(hd_,9*hs,8.4*hs,10.5*hs,sk,{f,r,u});seg(vadd(hd_,vmul(u,1.6*hs)),vadd(hd_,vmul(u,6.6*hs)),12.2*hs,11.4*hs,HC,{side:r})}
   if(kit&&kit.crest!=='none')seg(vadd(hd_,vmul(u,13*hs)),vadd(hd_,vmul(u,30*hs)),1.2,.4,p.plume||'#8a1c1c',{side:r})}
  else{ball(hd_,10.2*hs,9.6*hs,11.6*hs,HC,{f,r,u});if(!up)box(vadd(hd_,vadd(vmul(f,9.6*hs),vmul(u,1*hs))),.8,6*hs,.8*hs,'#1d1a17',{f,r,u});else ball(vadd(hd_,vmul(f,2*hs)),8.6*hs,8*hs,9.6*hs,sk,{f,r,u})}}
 // ─ 로봇 ─
 function mech(m,K){const p=m.pal||{},body=p.body||'#e8e4da',acc=p.accent||'#c4512b',dk=p.dark||'#3b3f46',jt=p.joint||'#8d9196',{bT,LM,T,H0,uS}=K,LN=m.frame==='lance';
  for(const g of K.legs){const sv=[-g.toe[1],g.toe[0],0];seg(g.Hp,g.K,(LN?3.8:4.6)*LM,(LN?3.4:4.2)*LM,jt);ball(g.K,5*LM,5*LM,5*LM,jt);boxAB(vadd(g.K,[0,0,1]),g.A,6*LM,6*LM,acc,sv);if(LN)boxAB(vadd(g.K,[3,0,-3]),vadd(g.K,[2,0,8]),3*LM,1.2,body,sv);
   const heel=vadd(g.F,vmul(g.toe,-7)),tip=vadd(g.F,vmul(g.toe,LN?17:15));boxAB(vadd(heel,[0,0,3]),vadd(tip,[0,0,2]),7*LM,2.8,acc,sv)}
  box(T(H0-1.5),9*bT,11*bT,6.5,dk);box(T(H0+12),7*bT,(LN?7:9)*bT,7,jt);box(T((H0+18+uS+3)/2),9.5*bT,(LN?16:15)*bT,(uS+3-H0-18)/2,body);
  if(m.skirt)for(const sd of[-1,1])boxAB([K.bend(H0+3),sd*12.5*bT,H0+3],[0,sd*14*bT,H0-12],7*bT,1.6,body,[1,0,0]);
  for(const g of K.arms){const fw=norm(vsub(g.Hn,g.E)),wr=vsub(g.Hn,vmul(fw,4));ball(g.S,5*LM,5*LM,5*LM,jt);box(vadd(g.S,[0,g.side*3,0]),7*(m.body?.pad??1),7*(m.body?.pad??1),7*(m.body?.pad??1),body);
   if(LN){boxAB(vadd(g.S,[-.5,g.side*8.2,-4]),vadd(g.S,[-3,g.side*12.5,17]),7,.9,body,norm([.5,g.side*.86,0]));ball(vadd(g.S,[1,g.side*11,6]),2.4,2.4,2.4,p.glow||'#62c4f0')}
   seg(g.S,g.E,3.4*LM,3.2*LM,jt);ball(g.E,4.4*LM,4.4*LM,4.4*LM,jt);boxAB(vadd(g.E,vmul(fw,1)),wr,5.6*LM,5.6*LM,LN?body:acc);box(g.Hn,4.4*LM,4.6*LM,4.6*LM,jt,{f:fw,r:norm(vcross([0,0,1],fw)),u:norm(vcross(fw,norm(vcross([0,0,1],fw))))})}
  const hd_=K.head,HR=K.HR,hs=K.hs,f=HR([1,0,0]),r=HR([0,1,0]),u=HR([0,0,1]),hdm=m.hdim||{};seg(T(uS+2),vadd(hd_,vmul(u,-6*hs)),4.2,3.8,jt);box(hd_,6.8*hs*(hdm.d??1),6.5*hs*(hdm.w??1),6.5*hs*(hdm.h??1),p.head||body,{f,r,u});box(vadd(hd_,vadd(vmul(f,6.9*hs*(hdm.d??1)),vmul(u,1.5*hs))),.5,4.4*hs,.8*hs,p.glow||'#ffd23f',{f,r,u});
  if(m.crest==='fin')boxAB(vadd(hd_,vmul(u,6.5*hs)),vadd(hd_,vmul(u,15*hs)),4*hs,.6,p.trim||'#2f5d8a',f);
  if(m.capeOn){const SL=K.arms[0].S,SR=K.arms[1].S,hemU=Math.max(4,H0*.1);parts.push({m:'quad',q:[vadd(SL,[-4.5,-1.5,3]),vadd(SR,[-4.5,1.5,3]),[K.bend(hemU)-17,26*bT,hemU],[K.bend(hemU)-17,-26*bT,hemU]],col:p.mcape||'#283a6b'})}}
 // ─ 칼 ─
 function sword(m,K){if(!K.sword)return null;const p=m.pal||{},d=K.d,hd=K.hd,mech=K.mech,pom=vsub(hd,vmul(d,mech?17:14)),guard=vadd(hd,vmul(d,mech?5:4)),tip=vadd(hd,vmul(d,K.blade));let gv=vcross(d,[0,0,1]);if(vlen(gv)<.2)gv=[0,1,0];gv=norm(gv);
  seg(pom,guard,1.6,1.6,p.leather||p.dark||'#5a3e2a');ball(pom,2.6,2.6,2.6,p.trim||'#c9a24a');boxAB(vsub(guard,vmul(gv,0)),vadd(guard,vmul(d,2.4)),mech?10:8,1.6,p.trim||'#7d878d',gv);boxAB(guard,tip,mech?3.2:2.4,.6,p.blade||'#dfe3e4',gv);return{guard,tip}}
 // ─ 섬광 궤적(3D): 타격 중 칼날 띠를 이어 투명 띠로 ─
 const trail=[];
 function view(X,Y,s,W,H){const cs=Math.cos(VIEW.yaw),sn=Math.sin(VIEW.yaw),sq=VIEW.sq,uk=VIEW.uk,r=[cs,-sn,0],u=[-sn*sq,-cs*sq,uk],b=[sn*uk,cs*uk,sq];
  // clip = [(X + s·r·p)/W*2-1, 1-(Y - s·u·p)/H*2, -(b·p)/2000]
  const ax=2*s/W,ay=2*s/H,bx=2*X/W-1,by=1-2*Y/H,z=-1/2000;
  return[ax*r[0],ay*u[0],z*b[0],0, ax*r[1],ay*u[1],z*b[1],0, ax*r[2],ay*u[2],z*b[2],0, bx,by,0,1]}
 function render(m,pose,down,X,Y,s,W,H,DPR,o={}){if(!init())return false;if(m.style!=='knight'&&m.style!=='mech')return false;
  const w=Math.round(W*DPR),h=Math.round(H*DPR);if(cvs.width!==w||cvs.height!==h){cvs.width=w;cvs.height=h}gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
  parts=[];const K=skeleton(m,pose,down);(K.mech?mech:knight)(m,K);const sw=sword(m,K);
  gl.useProgram(prog);const V=view(X,Y,s,W,H),cs=Math.cos(VIEW.yaw),sn=Math.sin(VIEW.yaw);gl.uniformMatrix4fv(U('V'),false,V);gl.uniform3fv(U('L'),norm([sn*.9-cs*.7,cs*.9+sn*.7,1.1]));
  const pL=gl.getAttribLocation(prog,'p'),nL=gl.getAttribLocation(prog,'n');
  const draw=(pt,outline)=>{let me;if(pt.m==='quad'){me=null}else me=buf[pt.m];
   if(pt.m==='quad'){const q=pt.q,n=norm(vcross(vsub(q[1],q[0]),vsub(q[3],q[0]))),a=new Float32Array([...q[0],...n,...q[1],...n,...q[2],...n,...q[0],...n,...q[2],...n,...q[3],...n]);gl.bindBuffer(gl.ARRAY_BUFFER,buf.dyn);gl.bufferData(gl.ARRAY_BUFFER,a,gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(pL,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(nL,3,gl.FLOAT,false,24,12);gl.uniformMatrix4fv(U('M'),false,[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);gl.uniformMatrix3fv(U('N'),false,[1,0,0,0,1,0,0,0,1]);gl.uniform1f(U('tap'),0);gl.uniform1f(U('ow'),outline?2.2/s:0);gl.drawArrays(gl.TRIANGLES,0,6);return}
   gl.bindBuffer(gl.ARRAY_BUFFER,me.b);gl.vertexAttribPointer(pL,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(nL,3,gl.FLOAT,false,24,12);
   gl.uniformMatrix4fv(U('M'),false,mat(pt.a,pt.b,pt.c,pt.o));gl.uniformMatrix3fv(U('N'),false,nmat(pt.a,pt.b,pt.c));gl.uniform1f(U('tap'),pt.m==='cyl'?1:0);gl.uniform1f(U('r0'),pt.r0||1);gl.uniform1f(U('r1'),pt.r1||1);gl.uniform1f(U('ow'),outline?2.2/s:0);gl.drawArrays(gl.TRIANGLES,0,me.n)};
  gl.enableVertexAttribArray(pL);gl.enableVertexAttribArray(nL);gl.uniform1f(U('alpha'),1);
  // 외곽선: 뒷면만, 법선 방향으로 부풀려 먹색으로(뒤집은 껍질)
  if(o.outline!==false){gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.frontFace(gl.CCW);gl.uniform1f(U('flat_'),1);gl.uniform3fv(U('col'),[.12,.11,.1]);for(const pt of parts)if(pt.m!=='quad')draw(pt,true);gl.disable(gl.CULL_FACE)}
  gl.uniform1f(U('flat_'),0);for(const pt of parts){gl.uniform3fv(U('col'),hex(pt.col));draw(pt,false)}
  // 섬광 띠: 타격 키 동안 칼날(코등이→칼끝) 자리를 모아 이어 그린다
  if(sw&&o.strike){trail.push({g:sw.guard,t:sw.tip,c:o.clock});}else if(!o.strike)trail.length=0;while(trail.length&&o.clock-trail[0].c>o.life)trail.shift();
  if(sw&&o.fx&&trail.length>1){const fl=((o.clock/(o.per||60))|0)%2,colr=fl?[1,1,1]:[1,.96,.67],a=[];for(let i=0;i<trail.length;i++){const e=trail[i],al=(i+1)/trail.length;a.push(...e.g,0,0,1,...e.t,0,0,al)}
   // 세로 띠를 삼각형으로(정점 법선 자리에 투명도를 실어 보낸다)
   const tri=[];for(let i=0;i<trail.length-1;i++){const o_=i*12,n_=(i+1)*12;const P=k=>a.slice(k,k+6);tri.push(...P(o_),...P(o_+6),...P(n_+6),...P(o_),...P(n_+6),...P(n_))}
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.uniform1f(U('flat_'),1);gl.uniform3fv(U('col'),colr);
   const ta=new Float32Array(tri);gl.bindBuffer(gl.ARRAY_BUFFER,buf.dyn);gl.bufferData(gl.ARRAY_BUFFER,ta,gl.DYNAMIC_DRAW);gl.vertexAttribPointer(pL,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(nL,3,gl.FLOAT,false,24,12);
   gl.uniformMatrix4fv(U('M'),false,[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);gl.uniformMatrix3fv(U('N'),false,[1,0,0,0,1,0,0,0,1]);gl.uniform1f(U('tap'),0);gl.uniform1f(U('ow'),0);
   // 띠 전체를 같은 투명도로 두 겹(옅은 겹 + 진한 겹): 오래된 쪽이 저절로 짧아 보이게
   for(const al of[.45,.75]){gl.uniform1f(U('alpha'),al);gl.drawArrays(gl.TRIANGLES,0,ta.length/6)}gl.uniform1f(U('alpha'),1);gl.depthMask(true);gl.disable(gl.BLEND)}
  return true}
 function show(on){const c=document.getElementById('gl3d');if(c)c.hidden=!on;if(!on)trail.length=0}
 return{render,show,init,ok:m=>m&&(m.style==='knight'||m.style==='mech')}})();

