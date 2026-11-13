// ═══ 로봇 모델: 판금 기사와 같은 관절 뼈대에, 면마다 명암이 다른 상자·원통 부품 ═══
function drawMech(c,ch,o){
 const{X,Y,s,ang,pose}=o,cs=Math.cos(ang),sn=Math.sin(ang),sq=VIEW.sq,uk=VIEW.uk,down=o.down||0,pal=ch.pal,lw=1.5*Math.max(s,1)**.5;
 const Jp=v=>[X+(v[0]*cs-v[1]*sn)*s,Y+(v[0]*sn+v[1]*cs)*sq*s-v[2]*s*uk],dep=v=>v[0]*sn+v[1]*cs;
 const CAM=norm([sn*uk,cs*uk,sq]),LIT=norm(vadd(vadd(CAM,[0,0,.9]),vmul([cs,-sn,0],-.7)));
 const bd=ch.body||{},bT=bd.torso??1,LM=bd.limb??1,bL=bd.leg??1,bS=bd.shoulder??1,bP=bd.pad??1,hs=bd.head??1,bN=bd.neck??1,legDrop=48-48*bL;
 const feet=pose.feet||KDEF.feet,crouch=pose.crouch??0,elb=pose.elb??0,nod=pose.nod??0;
 const L=pose.lean+down*14,drop=down*30+crouch,H0=48*bL-drop,bend=u=>L*(u-H0)/60,T=u=>[bend(u),0,u],uS=H0+40;
 // 뼈대
 const legs=[0,1].map(i=>{const side=i?1:-1,Hp=[0,side*8*bT,H0-2],F=[feet[i][0],feet[i][1],0],K=ik2(Hp,F,23.1*bL,23.1*bL,[1,side*.1,0]),toe=norm([1,side*.15,0]),A=vadd(F,[0,0,6]);return{side,Hp,K,F,A,toe}});
 const hd=[pose.h[0]+L*(pose.h[2]-48)/60,pose.h[1],pose.h[2]-drop-legDrop],d=norm(pose.d),sword=ch.weapon==='sword';
 const op=pose.off||KDEF.off,offH=sword?vsub(hd,vmul(d,11)):[op[0]+L*(op[2]-48)/60,op[1],op[2]-drop-legDrop];
 const arms=[0,1].map(i=>{const side=i?1:-1,S=[bend(uS),side*18*bS,uS-1],Hn=i?hd:offH,E=ik2(S,Hn,22,22,[-.4,side*(.6+elb*.8),-.8]);return{side,S,E,Hn}});
 const nA=nod*.6,hyw=pose.hyaw??0,hrl=pose.hroll??0,head=vadd(T(uS+11*bN+2),[nod*4,0,-nod*2]);
 const cP=Math.cos(nA),sP=Math.sin(nA),cY=Math.cos(hyw),sY=Math.sin(hyw),cR=Math.cos(hrl),sR=Math.sin(hrl);
 const HR=v=>{const[f,r,u]=v,r1=r*cR-u*sR,u1=r*sR+u*cR,f2=f*cP+u1*sP,u2=u1*cP-f*sP;return[f2*cY-r1*sY,f2*sY+r1*cY,u2]};
 const LH=(k,b,a,r,reg)=>(HINTS.limbs||(HINTS.limbs=[])).push({k,b:Jp(b),a:Jp(a),r:r*s,reg:!!reg});
 const HDm=ch.hdim||{},dW=HDm.w??1,dH=HDm.h??1,dD=HDm.d??1,HL=v=>vadd(head,HR(vmul([v[0]*dD,v[1]*dW,(v[2]+6)*dH-6],hs)));
 HINTS.face={vis:dep(HR([1,0,0])),eL:Jp(HL([7.2,-4.5,1.5])),eM:Jp(HL([7.4,0,1.2])),eR:Jp(HL([7.2,4.5,1.5])),n0:Jp(HL([7.4,0,-1])),n1:Jp(HL([7.2,0,-4.5]))};
 HINTS.hbox=[[-6.5,-6.5,-6],[7,-6.5,-6],[7,6.5,-6],[-6.5,6.5,-6],[-5.5,-5.6,7],[6,-5.6,7],[6,5.6,7],[-5.5,5.6,7]].map(v=>Jp(HL(v)));
 {const ps=(hs*s),hp={eyes:[],visor:null,ant:[],fin:null,r:1.7*ps};if(ch.eyes==='twin'){hp.eyes.push(Jp(HL([7.1,-2.3,2.3])),Jp(HL([7.1,2.3,2.3])))}else if(ch.eyes==='mono'){hp.eyes.push(Jp(HL([7.1,0,2.3])));hp.r=1.4*ps}else hp.visor=[Jp(HL([7.1,-4,2.3])),Jp(HL([7.2,0,2.3])),Jp(HL([7.1,4,2.3]))];
  if(ch.crest==='rods')for(const sd of[-1,1])hp.ant.push([Jp(HL([0,sd*5.6,4])),Jp(HL([-2,sd*8,15]))]);else if(ch.crest==='fin')hp.fin=[Jp(HL([-4,0,7])),Jp(HL([1,0,16])),Jp(HL([6,0,7]))];if(ch.hMid==='horn')for(const sd of[-1,1])hp.ant.push([Jp(HL([-1,sd*6.5,1.5])),Jp(HL([-7,sd*10.5,10]))]);HINTS.hp=hp}
 {const wy=H0+5,ring=[];for(let q=0;q<=16;q++){const t=q/16*6.2832-Math.PI,ny=Math.cos(t)*sn+Math.sin(t)*cs;if(ny>.02)ring.push(Jp([bend(wy)+Math.cos(t)*12*bT,Math.sin(t)*8*bT*1.05,wy]))}if(ring.length>1)HINTS.waist=ring}
 // 그리기 도구
 const path=p=>{c.beginPath();p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.closePath()};
 const tone=(col,n)=>{const b=vdot(n,LIT);return b>.62?hexMix(col,'#ffffff',.28):b>.05?col:hexMix(col,INK,.32)};
 const edge=()=>{c.strokeStyle=INK;c.lineWidth=lw;c.lineJoin='round';c.stroke()};
 // 8꼭짓점 상자(아래 4, 위 4): 카메라 쪽 면만, 면마다 명암
 const box8=(V,col,o2={})=>{const ctr=vmul(V.reduce((a,b)=>vadd(a,b),[0,0,0]),1/8),F=[[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]],vis=[];
  for(let fi=0;fi<6;fi++){const f=F[fi],q=f.map(i=>V[i]);let n=norm(vcross(vsub(q[1],q[0]),vsub(q[3],q[0])));const fc=vmul(q.reduce((a,b)=>vadd(a,b),[0,0,0]),.25);if(vdot(n,vsub(fc,ctr))<0)n=vmul(n,-1);if(vdot(n,CAM)>.02)vis.push({fi,q,n})}
  for(const f of vis){const pp=f.q.map(Jp);path(pp);c.fillStyle=(o2.faceCol&&o2.faceCol[f.fi])||tone(col,f.n);c.fill();edge();if(o2.deco)o2.deco(f)}return vis};
 // 축을 따라 단면이 직사각형인 부품(앞뒤 크기가 다를 수 있다)
 const prism=(A,B,sa,sb,col,o2={})=>{const ax=norm(vsub(B,A));let sd=o2.side||[0,1,0];sd=vsub(sd,vmul(ax,vdot(sd,ax)));if(vlen(sd)<.1)sd=vsub([1,0,0],vmul(ax,ax[0]));sd=norm(sd);const th=norm(vcross(ax,sd));
  const cr=(P,w,d_)=>[vadd(vadd(P,vmul(sd,-w)),vmul(th,-d_)),vadd(vadd(P,vmul(sd,w)),vmul(th,-d_)),vadd(vadd(P,vmul(sd,w)),vmul(th,d_)),vadd(vadd(P,vmul(sd,-w)),vmul(th,d_))];
  return box8([...cr(A,sa[0],sa[1]),...cr(B,sb[0],sb[1])],col,o2)};
 const cyl=(A,B,ra,rb,col)=>{const a=Jp(A),b=Jp(B),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;let nx=-dy/l,ny=dx/l;if(nx<0){nx=-nx;ny=-ny}const RA=ra*s,RB=rb*s;
  const p=[[a[0]+nx*RA,a[1]+ny*RA],[b[0]+nx*RB,b[1]+ny*RB],[b[0]-nx*RB,b[1]-ny*RB],[a[0]-nx*RA,a[1]-ny*RA]];path(p);c.fillStyle=col;c.fill();
  c.save();path(p);c.clip();c.fillStyle=hexMix(col,INK,.32);c.beginPath();c.moveTo(a[0]+nx*RA*.35,a[1]+ny*RA*.35);c.lineTo(b[0]+nx*RB*.35,b[1]+ny*RB*.35);c.lineTo(b[0]+nx*RB*2,b[1]+ny*RB*2);c.lineTo(a[0]+nx*RA*2,a[1]+ny*RA*2);c.fill();
  c.strokeStyle=hexMix(col,'#ffffff',.4);c.lineWidth=Math.max(1,Math.min(RA,RB)*.3);c.beginPath();c.moveTo(a[0]-nx*RA*.5,a[1]-ny*RA*.5);c.lineTo(b[0]-nx*RB*.5,b[1]-ny*RB*.5);c.stroke();c.restore();path(p);edge()};
 const RND=ch.limbs==='round';
 // 둥근 통: 옆면 명암 + 카메라 쪽 끝 마개 + 둘레 띠
 const circ=(C,ax,r,n=20)=>{let u=vcross(ax,[0,0,1]);if(vlen(u)<.2)u=vcross(ax,[1,0,0]);u=norm(u);const w=norm(vcross(ax,u)),pts=[];for(let k=0;k<n;k++){const t=k/n*6.2832;pts.push({p:vadd(C,vadd(vmul(u,Math.cos(t)*r),vmul(w,Math.sin(t)*r))),dv:vadd(vmul(u,Math.cos(t)),vmul(w,Math.sin(t)))})}return pts};
 const rcyl=(A,B,ra,rb,col,o2={})=>{const ax=norm(vsub(B,A));cyl(A,B,ra,rb,col);
  for(const t of o2.bands||[]){const C=vlerp(A,B,t),r=lerp(ra,rb,t)*1.02,pts=circ(C,ax,r,28),vis=[];let started=false;for(let k=0;k<pts.length*2;k++){const q=pts[k%pts.length];if(vdot(q.dv,CAM)>0){vis.push(Jp(q.p));started=true}else if(started)break}if(vis.length>1){c.strokeStyle=o2.bandCol||INK;c.lineWidth=o2.bandW||Math.max(1,lw*.8);c.beginPath();vis.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.stroke()}}
  for(const[C,n,r] of[[A,vmul(ax,-1),ra],[B,ax,rb]]){if(o2.caps===false||vdot(n,CAM)<=.02)continue;const pp=circ(C,ax,r).map(q=>Jp(q.p));path(pp);c.fillStyle=tone(col,n);c.fill();edge();if(o2.capRing){const pi=circ(C,ax,r*.6).map(q=>Jp(q.p));path(pi);c.fillStyle=hexMix(col,INK,.25);c.fill()}}};
 // 둥근 몸통 덩어리(타원체): 투영한 점들의 껍질을 칠하고, 그늘·반짝임, 둘레 띠를 얹는다
 const blob=(C,rf,rw,rh,col,o2={})=>{const P=[],ex=2/(o2.n||2),sp=(v)=>Math.sign(v)*Math.pow(Math.abs(v),ex),tp=o2.taper||1;for(let la=-8;la<=8;la++)for(let lo=0;lo<32;lo++){const a=la/8*Math.PI/2,b=lo/32*6.2832,z=sp(Math.sin(a)),k=lerp(tp,1,(z+1)/2),q=Jp(vadd(C,[sp(Math.cos(a))*sp(Math.cos(b))*rf*k,sp(Math.cos(a))*sp(Math.sin(b))*rw*k,z*rh]));P.push(q[0],q[1])}
  const Q=[];for(let i=0;i<P.length;i+=2)Q.push([P[i],P[i+1]]);Q.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo_=[],up_=[];for(const p of Q){while(lo_.length>=2&&cr(lo_[lo_.length-2],lo_[lo_.length-1],p)<=0)lo_.pop();lo_.push(p)}for(let i=Q.length-1;i>=0;i--){const p=Q[i];while(up_.length>=2&&cr(up_[up_.length-2],up_[up_.length-1],p)<=0)up_.pop();up_.push(p)}
  const H=lo_.slice(0,-1).concat(up_.slice(0,-1));if(H.length<3)return;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const q of H){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}const cx=(x0+x1)/2,cy=(y0+y1)/2,RX=(x1-x0)/2,RY=(y1-y0)/2;
  path(H);c.fillStyle=col;c.fill();c.save();path(H);c.clip();c.fillStyle=hexMix(col,INK,.3);c.beginPath();c.ellipse(cx+RX*.5,cy+RY*.38,RX,RY,0,0,7);c.fill();c.fillStyle=col;c.beginPath();c.ellipse(cx-RX*.08,cy-RY*.05,RX*.82,RY*.8,0,0,7);c.fill();
  c.fillStyle=hexMix(col,'#ffffff',.42);c.beginPath();c.ellipse(cx-RX*.38,cy-RY*.4,RX*.22,RY*.16,-.4,0,7);c.fill();
  for(const f of o2.rings||[]){const z=f*rh,sc=(o2.n||2)>2?lerp(tp,1,(f+1)/2):Math.sqrt(Math.max(0,1-f*f)),vis=[];for(let k=0;k<=32;k++){const t=k/32*6.2832;if(dep([Math.cos(t),Math.sin(t),0])>0)vis.push(Jp(vadd(C,[sp(Math.cos(t))*rf*sc,sp(Math.sin(t))*rw*sc,z])))}if(vis.length>1){c.strokeStyle=o2.ringCol||hexMix(col,INK,.45);c.lineWidth=Math.max(1,lw*.75);c.beginPath();vis.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke()}}
  if(o2.deco)o2.deco();c.restore();path(H);edge()};
 const ball=(C,r,col)=>{const p=Jp(C),R_=r*s;c.beginPath();c.arc(p[0],p[1],R_,0,7);c.fillStyle=col;c.fill();c.save();c.clip();c.fillStyle=hexMix(col,INK,.32);c.beginPath();c.arc(p[0]+R_*.45,p[1]+R_*.35,R_,0,7);c.fill();c.fillStyle=hexMix(col,'#ffffff',.45);c.beginPath();c.arc(p[0]-R_*.35,p[1]-R_*.35,R_*.28,0,7);c.fill();c.restore();c.beginPath();c.arc(p[0],p[1],R_,0,7);edge()};
 // 면 위의 무늬: 면의 네 꼭짓점 사이를 u,v(0~1)로 짚는다
 const onFace=(q,u,v)=>{const a=vlerp(q[0],q[1],u),b=vlerp(q[3],q[2],u);return Jp(vlerp(a,b,v))};
 const facePoly=(q,uv,col,line=true)=>{const pp=uv.map(([u,v])=>onFace(q,u,v));path(pp);c.fillStyle=col;c.fill();if(line){c.strokeStyle=INK;c.lineWidth=lw*.7;c.stroke()}};
 const faceLine=(q,a,b,w=1,col=INK)=>{const p=onFace(q,...a),r=onFace(q,...b);c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(...p);c.lineTo(...r);c.stroke()};
 const P=[],add=(z,f,tag)=>P.push({z,f,tag});
 const body=pal.body,acc=pal.accent,dk=pal.dark,jt=pal.joint,glow=pal.glow,trim=pal.trim,LN=ch.frame==='lance';// LN: 기사형 몸틀(로봇 모델2)
 c.save();if(o.ghost)c.globalAlpha=.4;
 if(!o.noShadow){const gs=[];for(let i=0;i<16;i++){const t=i/16*6.283;gs.push(Jp([Math.cos(t)*28,Math.sin(t)*28,0]))}hatch(c,gs,.15,3,1.1,{skip:.1})}

 // ─ 다리: 가는 허벅지 관절대, 무릎 덮개, 굵게 퍼지는 정강이 장갑, 넓은 발 ─
 for(const g of legs){const{side,Hp,K,F,A,toe}=g,sideV=norm([-toe[1],toe[0],0]);
  LH('thigh',K,Hp,4.6*LM);LH('shin',A,K,7*LM);LH('foot',vadd(F,vmul(toe,-7)),vadd(F,vmul(toe,15)),8*LM);
  const out=[0,side,0];
  if(LN){// 기사형 다리: 가는 허벅지에 앞판, 위로 솟은 무릎판, 발목으로 크게 퍼지는 정강이 장갑과 옆 날개, 뾰족한 발과 뒤꿈치 박차
   add(dep(T(H0))-.6+dep(vlerp(Hp,K,.5))*.01,()=>{cyl(Hp,K,3.8*LM,3.4*LM,jt);prism(vadd(vlerp(Hp,K,.12),[2.2,0,0]),vadd(vlerp(Hp,K,.82),[2.4,0,0]),[4.4*LM,2.4],[3.6*LM,2],body,{side:sideV,deco:f=>{if(f.fi>1&&vdot(f.n,toe)>.5)faceLine(f.q,[.5,.1],[.5,.9],1,hexMix(body,INK,.4))}})},'thigh');
   add(Math.max(dep(K),dep(vlerp(K,A,.5)))+1.21,()=>{ball(K,4.6*LM,jt);prism(vadd(K,[3.4,0,-3.5]),vadd(K,[2.2,0,8.5]),[5*LM,2.2],[.9*LM,1.2],body,{side:sideV,deco:f=>{if(vdot(f.n,toe)>.5)faceLine(f.q,[.5,.15],[.5,.8],1,trim)}})});
   add(dep(vlerp(K,A,.5))+1,()=>{prism(vadd(K,[.5,0,1]),vadd(A,[.6,0,1.5]),[5*LM,5.4*LM],[9.6*LM,8.6*LM],body,{side:sideV,deco:f=>{if(f.fi<2)return;faceLine(f.q,[.5,.12],[.5,.86],1.2,hexMix(body,INK,.42));if(vdot(f.n,toe)>.5){facePoly(f.q,[[.38,.62],[.62,.62],[.58,.8],[.42,.8]],acc)}}});
    prism(vadd(vlerp(K,A,.45),vmul(out,5.4*LM)),vadd(vadd(A,vmul(out,10.5*LM)),[0,0,-1]),[3*LM,.9],[6.4*LM,.9],acc,{side:toe})},'shin');
   add(dep(F)+1.4,()=>{const heel=vadd(F,vmul(toe,-6)),tip=vadd(F,vmul(toe,17));prism(vadd(heel,[0,0,3.6]),vadd(tip,[0,0,1.6]),[7*LM,3.6],[2.2*LM,1.4],acc,{side:sideV});prism(vadd(heel,[0,0,2.6]),vadd(vadd(F,vmul(toe,-10)),[0,0,-.2]),[2*LM,1.6],[.8*LM,.6],dk,{side:sideV})},'foot');continue}
  add(dep(T(H0))-.6+dep(vlerp(Hp,K,.5))*.01,()=>cyl(Hp,K,4.6*LM,4.2*LM,jt),'thigh');// 허벅지는 늘 허리 장갑 뒤
  add(Math.max(dep(K),dep(vlerp(K,A,.5)))+1.21,()=>{ball(K,5.6*LM,jt);if(RND){ball(vadd(K,[3,0,1]),4.6*LM,body);return}prism(vadd(K,[1,0,5]),vadd(K,[3.5,0,-3]),[5*LM,2.2],[5.5*LM,2.6],body,{side:[0,1,0]})});
  add(dep(vlerp(K,A,.5))+1,()=>RND?rcyl(vadd(K,[0,0,1]),A,6*LM,8.4*LM,acc,{bands:[.22,.88],bandCol:hexMix(acc,INK,.5),caps:false}):prism(vadd(K,[0,0,1.5]),A,[6.2*LM,6.2*LM],[8.4*LM,8*LM],acc,{side:sideV,deco:f=>{if(f.fi===0||f.fi===1)return;faceLine(f.q,[.2,.25],[.8,.25],1,hexMix(acc,INK,.5))}}),'shin');
  add(dep(F)+1.4,()=>{const heel=vadd(F,vmul(toe,-7)),tip=vadd(F,vmul(toe,15));prism(vadd(heel,[0,0,3.2]),vadd(tip,[0,0,2.4]),[8.6*LM,3.2],[7.2*LM,2.4],acc,{side:sideV})},'foot')}

 // ─ 허리·배·가슴 ─
 const sideB=[0,1,0];
 LH('pelvis',T(H0-9),T(H0+5),12*bT,1);LH('waist',T(H0+5),T(H0+19),9*bT,1);LH('chest',T(H0+19),T(uS+3),15*bT,1);
 add(dep(T(H0))+.5,()=>{if(ch.pelvis==='round')blob(T(H0-1.5),8*bT,12.5*bT,7.5,dk,{rings:[.35]});else if(ch.pelvis==='soft')blob(T(H0-1.5),7.6*bT,12*bT,6.8,dk,{n:4,taper:.85});else prism(T(H0-8),T(H0+5),[10*bT,7*bT],[12*bT,8*bT],dk,{side:sideB});
  if(ch.skirt&&LN){for(const sd of[-1,1]){const a=[bend(H0+3),sd*11.5*bT,H0+3],b=[-1,sd*13.5*bT,H0-15];prism(a,b,[1.6,6.4*bT],[1.6,8.6*bT],body,{side:[1,0,0]})}
   prism([bend(H0)+8*bT,0,H0+2],[8.5*bT,0,H0-19],[6.4*bT,1.4],[.8*bT,1.2],body,{side:sideB,deco:f=>{if(f.fi>1)faceLine(f.q,[.5,.08],[.5,.8],1.1,trim)}})}
  else if(ch.skirt){for(const sd of[-1,1]){const a=[bend(H0+3),sd*12.5*bT,H0+3],b=[0,sd*14*bT,H0-12];prism(a,b,[1.8,7*bT],[1.8,8*bT],body,{side:[1,0,0]})}
   prism([bend(H0)+8*bT,0,H0+1],[7*bT,0,H0-11],[5.5*bT,1.4],[4.6*bT,1.4],body,{side:sideB})}},'waist');
 add(dep(T(H0+12)),()=>{if(ch.belly==='round')blob(T(H0+12),7*bT,9.4*bT,8,jt,{rings:[-.35,.35],ringCol:INK});else if(ch.belly==='soft')blob(T(H0+12),6.5*bT,9*bT,7,jt,{n:4,taper:.88,rings:[-.33,.33],ringCol:INK});else prism(T(H0+5),T(H0+19),LN?[6.4*bT,5*bT]:[8.4*bT,6.2*bT],LN?[8*bT,5.8*bT]:[9.6*bT,6.8*bT],jt,{side:sideB,deco:f=>{if(f.fi<2)return;for(const v of[.33,.66])faceLine(f.q,[0,v],[1,v],1)}})},'waist');
 add(dep(T(H0+28)),()=>{if(ch.chest==='round'||ch.chest==='soft'){const sft=ch.chest==='soft',zc=(H0+18+uS+3)/2,rh=(uS+3-H0-18)/2+(sft?.5:2),C=T(zc);blob(C,(sft?10:10)*bT,(sft?17:16.5)*bT,rh,body,{n:sft?4:2,taper:sft?.72:1,rings:sft?[]:[-.55],deco:()=>{const fv=sn;if(fv<.15)return;const fc=Jp(vadd(C,[10*bT*.92,0,-rh*.15])),sx=s*fv,sy=s*uk;
   if(ch.emblem==='core'){c.fillStyle=dk;c.beginPath();c.ellipse(fc[0],fc[1],4.2*sx*bT,4.6*sy,0,0,7);c.fill();c.fillStyle=glow;c.beginPath();c.ellipse(fc[0],fc[1],2.3*sx*bT,2.5*sy,0,0,7);c.fill()}
   else if(ch.emblem==='grill'){c.fillStyle=dk;c.beginPath();c.ellipse(fc[0],fc[1]+1.5*sy,6*sx*bT,4*sy,0,0,7);c.fill();c.strokeStyle=hexMix(dk,'#ffffff',.25);c.lineWidth=1.1;for(const k of[-1.5,0,1.5]){c.beginPath();c.moveTo(fc[0]-4.5*sx*bT,fc[1]+1.5*sy+k*sy);c.lineTo(fc[0]+4.5*sx*bT,fc[1]+1.5*sy+k*sy);c.stroke()}}
   else if(ch.emblem==='bars'){c.fillStyle=acc;for(const sd of[-1,1]){const x=fc[0]+sd*4.6*sx*bT;c.fillRect(x-1.5*sx*bT,fc[1]-9*sy,3*sx*bT,15*sy);c.strokeStyle=INK;c.lineWidth=lw*.7;c.strokeRect(x-1.5*sx*bT,fc[1]-9*sy,3*sx*bT,15*sy)}}
   else if(ch.emblem==='shield'){const w=4.6*sx*bT,y0=fc[1]-5*sy;c.beginPath();c.moveTo(fc[0]-w,y0);c.lineTo(fc[0]+w,y0);c.lineTo(fc[0]+w,y0+5*sy);c.lineTo(fc[0],y0+11*sy);c.lineTo(fc[0]-w,y0+5*sy);c.closePath();c.fillStyle=acc;c.fill();c.strokeStyle=INK;c.lineWidth=lw*.7;c.stroke();c.strokeStyle=trim;c.lineWidth=1.3;c.beginPath();c.moveTo(fc[0],y0+1.5*sy);c.lineTo(fc[0],y0+8.5*sy);c.stroke()}}});return}
  if(LN)for(const sd of[-1,1])prism([bend(uS)-3,sd*6*bT,uS],[bend(uS)-5,sd*7.6*bT,uS+9],[3.4*bT,1],[2.2*bT,.8],body,{side:[1,0,0]});// 목 뒤로 솟은 깃판
  prism(T(H0+18),T(uS+3),LN?[8.6*bT,7*bT]:[12*bT,8.4*bT],LN?[17.5*bT,10*bT]:[17*bT,10.5*bT],body,{side:sideB,deco:f=>{
   if(f.fi===2){
    if(ch.emblem==='core'){const pts=[];for(let k=0;k<16;k++){const t=k/16*6.2832;pts.push([.5+Math.cos(t)*.17,.62+Math.sin(t)*.22])}facePoly(f.q,pts,dk);const p2=pts.map(([u,v])=>[.5+(u-.5)*.55,.62+(v-.62)*.55]);facePoly(f.q,p2,glow,false)}
    else if(ch.emblem==='grill'){facePoly(f.q,[[.2,.48],[.8,.48],[.76,.82],[.24,.82]],dk);for(const v of[.56,.64,.72])faceLine(f.q,[.26,v],[.74,v],1.1,hexMix(dk,'#ffffff',.25))}
    else if(ch.emblem==='bars'){facePoly(f.q,[[.24,.1],[.36,.1],[.36,.9],[.24,.9]],acc);facePoly(f.q,[[.64,.1],[.76,.1],[.76,.9],[.64,.9]],acc)}
    else if(ch.emblem==='shield'){facePoly(f.q,[[.34,.82],[.66,.82],[.66,.6],[.5,.42],[.34,.6]],acc);faceLine(f.q,[.5,.5],[.5,.76],1.3,trim)}
    faceLine(f.q,[.5,.06],[.5,.4],1,hexMix(body,INK,.35));faceLine(f.q,[.08,.4],[.92,.4],1,hexMix(body,INK,.35))}}})},'torso');
 // 목·머리
 add(dep(head)+2,()=>{cyl(T(uS+2),HL([0,0,-6]),4.2,3.8,jt);
  const hb=[[-6.5,-6.5,-6],[7,-6.5,-6],[7,6.5,-6],[-6.5,6.5,-6],[-5.5,-5.6,7],[6,-5.6,7],[6,5.6,7],[-5.5,5.6,7]].map(HL);
  const nearS=sd=>dep(HL([0,sd*7,0]))>dep(head),
   mid=sd=>{if(ch.hMid==='horn'){const b=[-1,sd*6.3,1.5],P3=[[b[0]-2.2,b[1],b[2]-1.4],[b[0]+2,b[1],b[2]-1.2],[b[0]+.3,b[1],b[2]+2.6],[-7,sd*10.5,10]].map(v=>Jp(HL(v)));path([P3[0],P3[3],P3[1]]);c.fillStyle=hexMix(trim,INK,.25);c.fill();edge();path([P3[1],P3[3],P3[2]]);c.fillStyle=trim;c.fill();edge();path([P3[2],P3[3],P3[0]]);c.fillStyle=hexMix(trim,'#ffffff',.2);c.fill();edge()}
    else if(ch.hMid==='disc')rcyl(HL([0,sd*6.2,1]),HL([0,sd*8.2,1]),3.4*hs,3*hs,acc,{capRing:true})};
  for(const sd of[-1,1])if(!nearS(sd))mid(sd);
  const hcol=pal.head||body,HS=ch.hShape||'box',fwd=HR([1,0,0]);
  // 얼굴 무늬: M(u,v)는 얼굴 위 좌우 u·아래→위 v(0~1)를 화면 점으로
  const faceDeco=M=>{const fp=ch.hFace||'band',mo=ch.hMouth||'lines',poly=(uv,col,ln=true)=>{path(uv.map(([u,v])=>M(u,v)));c.fillStyle=col;c.fill();if(ln){c.strokeStyle=INK;c.lineWidth=lw*.7;c.stroke()}},seg=(a,b,w,col)=>{const p=M(...a),q=M(...b);c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(...p);c.lineTo(...q);c.stroke()};
   if(fp==='band')poly([[.12,.5],[.88,.5],[.84,.78],[.16,.78]],dk);else if(fp==='full')poly([[.1,.1],[.9,.1],[.9,.84],[.1,.84]],dk);
   if(ch.eyes==='visor')poly([[.18,.58],[.82,.58],[.8,.68],[.2,.68]],glow,false);
   else if(ch.eyes==='twin'){poly([[.22,.58],[.42,.58],[.42,.69],[.22,.69]],glow,false);poly([[.58,.58],[.78,.58],[.78,.69],[.58,.69]],glow,false)}
   else{const pts=[];for(let k=0;k<12;k++){const t=k/12*6.2832;pts.push([.5+Math.cos(t)*.08,.635+Math.sin(t)*.07])}poly(pts,glow,false)}
   const mc=fp==='full'?hexMix(dk,'#ffffff',.3):hexMix(hcol,INK,.45);
   if(mo==='lines'){seg([.3,.28],[.7,.28],1.2,mc);seg([.38,.18],[.62,.18],1.2,mc)}else if(mo==='vent')for(const v of[.15,.26])poly([[.3,v],[.7,v],[.7,v+.06],[.3,v+.06]],fp==='full'?hexMix(dk,'#ffffff',.22):dk,false)};
  if(HS==='box'||HS==='wedge'){const hb=(HS==='wedge'?[[-6.5,-6.5,-6],[8.6,-5,-6],[8.6,5,-6],[-6.5,6.5,-6],[-5.5,-5.6,7],[3.4,-4.6,7],[3.4,4.6,7],[-5.5,5.6,7]]:[[-6.5,-6.5,-6],[7,-6.5,-6],[7,6.5,-6],[-6.5,6.5,-6],[-5.5,-5.6,7],[6,-5.6,7],[6,5.6,7],[-5.5,5.6,7]]).map(HL);box8(hb,hcol,{deco:f=>{if(vdot(f.n,fwd)<(HS==='wedge'?.4:.7))return;faceDeco((u,v)=>onFace(f.q,u,v))}})}
  else{// 둥근 머리: 둥근 상자·돔·원통
   const Rf=6.9,Rw=6.6,cu=.5,Ru=6.6,P=[],sp=(v,e)=>Math.sign(v)*Math.pow(Math.abs(v),e);
   if(HS==='soft'){for(let la=-8;la<=8;la++)for(let lo=0;lo<32;lo++){const a=la/8*Math.PI/2,b=lo/32*6.2832;P.push(HL([sp(Math.cos(a),.5)*sp(Math.cos(b),.5)*Rf,sp(Math.cos(a),.5)*sp(Math.sin(b),.5)*Rw,cu+sp(Math.sin(a),.5)*Ru]))}}
   else{const topU=HS==='dome'?1:7;for(let lo=0;lo<32;lo++){const b=lo/32*6.2832;P.push(HL([Math.cos(b)*Rf,Math.sin(b)*Rw,-6]),HL([Math.cos(b)*Rf,Math.sin(b)*Rw,topU]));if(HS==='dome')for(let la=1;la<=6;la++){const a=la/6*Math.PI/2;P.push(HL([Math.cos(a)*Math.cos(b)*Rf,Math.cos(a)*Math.sin(b)*Rw,topU+Math.sin(a)*6]))}}}
   const H=hull(P.map(Jp));let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const q of H){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}const cx=(x0+x1)/2,cy=(y0+y1)/2,RX=(x1-x0)/2,RY=(y1-y0)/2;
   path(H);c.fillStyle=hcol;c.fill();c.save();path(H);c.clip();c.fillStyle=hexMix(hcol,INK,.3);c.beginPath();c.ellipse(cx+RX*.5,cy+RY*.38,RX,RY,0,0,7);c.fill();c.fillStyle=hcol;c.beginPath();c.ellipse(cx-RX*.08,cy-RY*.05,RX*.82,RY*.8,0,0,7);c.fill();c.fillStyle=hexMix(hcol,'#ffffff',.42);c.beginPath();c.ellipse(cx-RX*.38,cy-RY*.4,RX*.22,RY*.16,-.4,0,7);c.fill();c.restore();path(H);edge();
   if(HS==='cyl'){const a=[];for(let lo=0;lo<=32;lo++){const b=lo/32*6.2832;a.push(Jp(HL([Math.cos(b)*Rf,Math.sin(b)*Rw,7])))}c.strokeStyle=INK;c.lineWidth=Math.max(1,lw*.75);c.beginPath();a.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.stroke()}
   if(vdot(fwd,CAM)>.12){const W=5.2,sf=(r,u)=>{const kr=Math.abs(r/Rw);if(HS==='soft')return Rf*Math.pow(Math.max(0,1-kr**4-Math.abs((u-cu)/Ru)**4),.25);if(HS==='dome'&&u>1)return Rf*Math.sqrt(Math.max(0,1-kr*kr-((u-1)/6)**2));return Rf*Math.sqrt(Math.max(0,1-kr*kr))};
    faceDeco((u,v)=>{const r=(u-.5)*2*W,uu=-5+11*v;return Jp(HL([sf(r,uu)+.15,r,uu]))})}}
  if(ch.hLow==='slat'){const mk=[[7,-6,-6.4],[8.6,-5.6,-6.4],[8.6,5.6,-6.4],[7,6,-6.4],[7,-6.3,.2],[8,-6,.2],[8,6,.2],[7,6.3,.2]].map(HL);box8(mk,body,{deco:f=>{if(vdot(f.n,HR([1,0,0]))<.6)return;for(const v of[.2,.4,.6,.8])faceLine(f.q,[.1,v],[.9,v],1.3,hexMix(body,INK,.5))}})}
  else if(ch.hLow==='jaw'){const jw=[[-1,-6.8,-8.2],[9,-4.5,-8.2],[9,4.5,-8.2],[-1,6.8,-8.2],[-1,-6.8,-4.5],[8,-5,-3.6],[8,5,-3.6],[-1,6.8,-4.5]].map(HL);box8(jw,acc,{deco:f=>{if(vdot(f.n,HR([1,0,0]))>.6)faceLine(f.q,[.5,.15],[.5,.85],1.2,hexMix(acc,INK,.5))}})}
  for(const sd of[-1,1])if(nearS(sd))mid(sd);
  if(ch.crest==='crescent'){const pts=[];for(let k=0;k<=16;k++){const t=k/16;pts.push([4,-11+22*t,7.5+10*Math.pow(Math.abs(t*2-1),1.6)])}for(let k=16;k>=0;k--){const t=k/16;pts.push([4,-8.5+17*t,10+6.5*Math.pow(Math.abs(t*2-1),1.6)])}path(pts.map(v=>Jp(HL(v))));c.fillStyle=trim;c.fill();edge();const bs=[[3,-1.6,6.8],[5.5,-1.6,6.8],[5.5,1.6,6.8],[3,1.6,6.8],[3,-1.4,10.5],[5,-1.4,10.5],[5,1.4,10.5],[3,1.4,10.5]].map(HL);box8(bs,acc)}
  else if(ch.crest==='ridge'){const rg=[[-6,-1.3,6.8],[5.5,-1.3,6.8],[5.5,1.3,6.8],[-6,1.3,6.8],[-6.5,-.8,10.5],[2.5,-.8,11],[2.5,.8,11],[-6.5,.8,10.5]].map(HL);box8(rg,trim)}
  else if(ch.crest==='fin'){const a=HL([-4,0,7]),b=HL([6,0,7]),t=HL([1,0,16]);const pp=[a,b,t].map(Jp);path(pp);c.fillStyle=trim;c.fill();edge()}
  else if(ch.crest==='rods')for(const sd of[-1,1]){const a=Jp(HL([0,sd*5.6,4])),b=Jp(HL([-2,sd*8,15]));c.strokeStyle=INK;c.lineWidth=2.4*s*.5+1.2;c.lineCap='round';c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();c.strokeStyle=trim;c.lineWidth=1.2*s*.5;c.stroke();c.fillStyle=glow;c.beginPath();c.arc(b[0],b[1],1.6*s,0,7);c.fill()}},'head');
 // ─ 팔: 상자 어깨, 가는 위팔, 팔꿈치 공, 손목 쪽으로 넓어지는 아래팔, 주먹 ─
 for(const g of arms){const{side,S,E,Hn}=g,fw=norm(vsub(Hn,E)),wr=vsub(Hn,vmul(fw,4));
  if(LN){// 기사형 어깨: 둥근 어깨 껍질 위로 바깥쪽으로 기울어 솟은 날개판, 판 가운데 둥근 보석
   add(Math.max(dep(S),dep(vlerp(S,E,.5)))+3,()=>{ball(S,4.6*LM,jt);prism(vadd(S,[0,side*2.6*bP,5*bP]),vadd(S,[0,side*3.6*bP,-6*bP]),[6.4*bP,6*bP],[5.4*bP,5.6*bP],body,{side:[1,0,0],deco:f=>{if(f.n[2]>.5)faceLine(f.q,[.15,.5],[.85,.5],1.2,trim)}});
    const b0=vadd(S,[-.5,side*8.2*bP,-4*bP]),b1=vadd(S,[-3,side*12.5*bP,17*bP]),wv=norm([.5,side*.86,0]),pn=norm([.86,-side*.5,0]);prism(b0,b1,[8.4*bP,1*bP],[5.6*bP,1*bP],body,{side:wv,deco:f=>{if(Math.abs(vdot(f.n,pn))<.5)return;faceLine(f.q,[.08,.1],[.08,.92],1.1,hexMix(body,INK,.4));faceLine(f.q,[.92,.1],[.92,.92],1.1,hexMix(body,INK,.4))}});
    prism(vadd(b1,vmul(wv,-2.5*bP)),vadd(vadd(b1,vmul(wv,4*bP)),[-3*bP,0,4.5*bP]),[1.4*bP,.8*bP],[.4*bP,.6*bP],acc,{side:[0,0,1]});
    const gc=vadd(vlerp(b0,b1,.45),vmul(pn,1.1*bP));if(vdot(pn,CAM)>0){const g=Jp(gc),R_=3*bP*s,fx=Math.max(.3,Math.abs(vdot(pn,[sn,cs,0])));c.beginPath();c.ellipse(g[0],g[1],R_*fx+1,R_*1.25,0,0,7);c.fillStyle=dk;c.fill();edge();c.beginPath();c.ellipse(g[0],g[1],R_*.62*fx,R_*.8,0,0,7);c.fillStyle=glow;c.fill();c.fillStyle='#ffffff';c.beginPath();c.arc(g[0]-R_*.18,g[1]-R_*.3,Math.max(.6,R_*.16),0,7);c.fill()}})}
  else add(Math.max(dep(S),dep(vlerp(S,E,.5)))+3,()=>{ball(S,5*LM,jt);if(RND){ball(vadd(S,[0,side*3.5*bP,1.5*bP]),8.6*bP,body);return}prism(vadd(S,[0,side*3*bP,6.5*bP]),vadd(S,[0,side*3.5*bP,-7*bP]),[7.4*bP,7.4*bP],[6.6*bP,6.6*bP],body,{side:[1,0,0],deco:f=>{if(f.n[2]>.5)faceLine(f.q,[.15,.5],[.85,.5],1.2,trim)}})});
  LH('uarm',E,S,3.4*LM);LH('farm',wr,E,5.6*LM);LH('hand',vsub(Hn,vmul(fw,3)),vadd(Hn,vmul(fw,5)),4.8*LM);
  add(dep(vlerp(S,E,.5))+2.5,()=>cyl(S,E,3.4*LM,3.2*LM,jt),'uarm');
  add(Math.max(dep(E),dep(vlerp(S,E,.5)),dep(vlerp(E,wr,.5)))+2.71,()=>ball(E,4.4*LM,jt));
  if(LN)add(dep(vlerp(E,wr,.5))+2.6,()=>{prism(vadd(E,vmul(fw,1)),wr,[3.8*LM,3.8*LM],[7.2*LM,6.6*LM],body,{side:[0,0,1],deco:f=>{if(f.fi>1)faceLine(f.q,[.78,0],[.78,1],1.2,trim)}});prism(vadd(E,vmul(fw,-1)),vadd(vadd(E,vmul(fw,-6)),[0,0,-2]),[1.6*LM,1.4],[.4*LM,.5],acc,{side:[0,0,1]})},'farm');
  else add(dep(vlerp(E,wr,.5))+2.6,()=>RND?rcyl(vadd(E,vmul(fw,1)),wr,4.8*LM,6.6*LM,acc,{bands:[.8],bandCol:hexMix(acc,INK,.5),capRing:true}):prism(vadd(E,vmul(fw,1)),wr,[4.6*LM,4.6*LM],[6.6*LM,6.4*LM],acc,{side:[0,0,1],deco:f=>{if(f.fi>1)faceLine(f.q,[.82,0],[.82,1],1,hexMix(acc,INK,.5))}}),'farm');
  add(dep(Hn)+2.8,()=>prism(vsub(Hn,vmul(fw,3)),vadd(Hn,vmul(fw,5)),[4.4*LM,5*LM],[4.6*LM,5.2*LM],jt,{side:[0,0,1],deco:f=>{if(f.fi>1)for(const u of[.45,.7])faceLine(f.q,[u,.1],[u,.9],1)}}),'hand')}
 // ─ 망토: 두 어깨 뒤에서 늘어져 발목 근처까지, 밖은 겉감·안은 안감 ─
 if(ch.capeOn){const cO=pal.mcape||'#283a6b',cI=pal.mcapeIn||hexMix(cO,INK,.45),SL=arms[0].S,SR=arms[1].S,hemU=Math.max(4,H0*.1),hb=bend(hemU)-17,wd=26*bT;
  const top=[vadd(SL,[-4.5,-1.5,3]),vadd(T(uS+3),[-9*bT,0,0]),vadd(SR,[-4.5,1.5,3])],hem=[];for(let k=0;k<=8;k++){const t=k/8,y=lerp(-wd,wd,t);hem.push([hb-Math.abs(y)/wd*4+(k%2?1.6:-1),y,hemU+(k%2?1.2:0)])}
  const ctr=vlerp(T(H0+20),[hb,0,hemU],.35);add(dep(vadd(ctr,[-6,0,0])),()=>{const outer=vdot(norm([-1,0,.15]),CAM)>0,col=outer?cO:cI,pp=[...top,...hem.slice().reverse()].map(Jp);
   path(pp);c.fillStyle=col;c.fill();c.save();path(pp);c.clip();const fd=hexMix(col,INK,.35),fl=hexMix(col,'#ffffff',.18);
   for(let k=1;k<8;k++){const a=Jp(vlerp(top[0],top[2],k/8)),b=Jp(hem[k]);c.strokeStyle=k%2?fd:fl;c.lineWidth=Math.max(1,(k%2?2.2:1.4)*s*.5);c.lineCap='round';c.beginPath();c.moveTo(a[0],a[1]);c.quadraticCurveTo((a[0]+b[0])/2+(k%2?2:-2)*s*.3,(a[1]+b[1])/2,b[0],b[1]);c.stroke()}
   c.restore();path(pp);edge();if(!outer){const tl=top.map(Jp);c.strokeStyle=trim;c.lineWidth=Math.max(1.2,1.4*s*.5);c.beginPath();tl.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]));c.stroke()}
   for(const S_ of[top[0],top[2]]){const p=Jp(S_);c.fillStyle=trim;c.beginPath();c.arc(p[0],p[1],Math.max(1.4,1.6*s*.5),0,7);c.fill();edge()}},'torso')}
 // ─ 대검 ─
 let tip=vadd(hd,vmul(d,30));
 if(sword){const pom=vsub(hd,vmul(d,17)),guard=vadd(hd,vmul(d,5));tip=vadd(hd,vmul(d,118));let gv=vcross(d,[0,0,1]);if(vlen(gv)<.2)gv=[0,1,0];gv=norm(gv);
  add(dep(vlerp(pom,guard,.5))+2.55,()=>{cyl(pom,guard,2,2,dk);ball(pom,3,trim)});
  add(dep(vlerp(guard,tip,.4))+2.5,()=>{prism(guard,tip,[3.2,.8],[1.6,.6],pal.blade||'#dfe3e4',{side:gv});prism(vsub(guard,vmul(gv,0)),vadd(guard,vmul(d,3)),[10,2.4],[10,2.4],trim,{side:gv})})}

 P.sort((a,b)=>a.z-b.z);for(const p of P)PIECE_CAP?PIECE_CAP(()=>p.f(),p.tag):p.f();
 c.restore();
 return{a:Jp(tip),b:Jp(vadd(hd,vmul(d,5))),h:Jp(hd),feet:legs.map(g=>Jp(g.F)),off:sword?null:Jp(offH)}}
