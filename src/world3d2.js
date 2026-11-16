// ═══ 3D 월드2: 2D 월드의 모양 정의(높이별 단면·타원체·머리 좌표 면)를 그대로 써서 3D 겉면(메쉬)을 만들고 WebGL 깊이 버퍼로 그린다 ═══
// 2D는 단면 점들의 겉 윤곽을 칠했지만, 여기서는 이웃 단면을 삼각형으로 이어(로프트) 진짜 겉면을 만든다. 투영은 2D와 같은 직교 투영.
/* ═══ 2D·편집기 연동(호스트) ═══ 3D 월드는 아래 W3HOST로만 바깥(편집기·2D)에 닿는다. 3D를 따로 떼어 낼 때는 이 묶음만 바꿔 끼우면 된다.
   proj(모델·키 자료) commit(되돌리기 기록) opt·LS(화면 옵션 저장) VIEW(시점) WORLD·setWorld(월드 전환) wake(다시 그리기 요청) drag(무대 끌기 상태) drawModel(2D 그리기: 그림 탭 안내값·손발 고리) */
const W3HOST={get proj(){return proj},commit:()=>commit(),get opt(){return opt},get LS(){return LS},get VIEW(){return VIEW},get WORLD(){return typeof WORLD!=='undefined'?WORLD:undefined},setWorld:w=>setWorld(w),wake:t=>wake(t),get drag(){return typeof drag!=='undefined'?drag:undefined},get drawModel(){return drawModel},set drawModel(f){drawModel=f},get PIECE_CAP(){return typeof PIECE_CAP!=='undefined'?PIECE_CAP:null},set PIECE_CAP(f){PIECE_CAP=f},get gl3d(){return document.getElementById('gl3d2')}};
const R3D2=(()=>{
 /* ═══ 자체 계산 도구(2D 파일에서 옮겨 온 같은 식) ═══ 2D 쪽 같은 이름 함수에 기대지 않도록 3D 안에 따로 둔다 */
 const lerp=(a,b,k)=>a+(b-a)*k,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),norm=v=>{const m=Math.hypot(...v)||1;return v.map(x=>x/m)};
 const vadd=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],vsub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],vmul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],vdot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],vlen=a=>Math.hypot(a[0],a[1],a[2]),vlerp=(a,b,k)=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2],b[2],k)],vcross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const ik2=(P,F,a,b,bend)=>{const v=vsub(F,P),l=vlen(v)||1,u=vmul(v,1/l),d=Math.min(l,a+b-.01),x=(d*d+a*a-b*b)/(2*d),h=Math.sqrt(Math.max(0,a*a-x*x));let bd=vsub(bend,vmul(u,vdot(bend,u)));const bl=vlen(bd)||1;bd=vmul(bd,1/bl);return vadd(vadd(P,vmul(u,x)),vmul(bd,h))};
 const W3HMC=new Map(),hexMix=(a,b,k)=>{const ck=a+b+k;if(W3HMC.has(ck))return W3HMC.get(ck);const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),A=p(a),B=p(b),r='#'+A.map((v,i)=>Math.round(lerp(v,B[i],k)).toString(16).padStart(2,'0')).join('');W3HMC.set(ck,r);return r};
 const KDEF={feet:[[16,-8],[-16,9]],crouch:0,elb:0,nod:0,hyaw:0,hroll:0,off:[14,-9,72]},POSE_STAND={h:[1,27,42],d:[0,.25,-1],lean:0,feet:[[1,-15],[1,15]],crouch:0,elb:0,nod:0,hyaw:0,hroll:0,off:[1,-27,42]};/* 기본 자세값·곧게 선 자세(편집기 자세 목록 첫 번째와 같음) */
 const bladeLen=m=>m.style==='mech'?(m.weapon==='sword'?118:30):m.style==='knight'?108:m.style==='fig'?m.blade:m.style==='robot'?118:{katana:96,dual:80,flail:74}[m.weapon];
 const P0=p=>{const o={h:[...p.h],d:[...p.d],lean:p.lean};if(p.feet)o.feet=p.feet.map(f=>[...f]);if(p.off)o.off=[...p.off];for(const n of['crouch','elb','nod','hyaw','hroll'])if(p[n]!=null)o[n]=p[n];return o};
 const kf=(p,n)=>p[n]??KDEF[n],mixP=(a,b,k)=>({h:a.h.map((v,i)=>lerp(v,b.h[i],k)),d:a.d.map((v,i)=>lerp(v,b.d[i],k)),lean:lerp(a.lean,b.lean,k)}),mixK=(a,b,k)=>{const o=mixP(a,b,k),fa=a.feet||KDEF.feet,fb=b.feet||KDEF.feet;o.feet=fa.map((f,i)=>[lerp(f[0],fb[i][0],k),lerp(f[1],fb[i][1],k)]);const oa=a.off||KDEF.off,ob=b.off||KDEF.off;o.off=oa.map((v,i)=>lerp(v,ob[i],k));for(const n of['crouch','elb','nod','hyaw','hroll'])o[n]=lerp(kf(a,n),kf(b,n),k);return o};
let gl=null,cvs=null,prog=null,vb=null,ok=false;
 // 스키닝: 겉면은 기본자세에서 한 번만 만들고, 꼭짓점마다 따라갈 뼈(ba, bb)와 섞는 비율(w)을 적어 둔다. 매 프레임 뼈 행렬만 뼈 텍스처(BT)로 올려 GPU가 꼭짓점을 옮긴다.
 // 한 줄(row) = 캐릭터 한 명(인스턴스), 뼈 하나 = 텍셀 3개(3×4 행렬의 세 행). 자락(치마·망토)은 두 뼈 사이를 섞어(pb = 두 번째 뼈 기준 위치) 2D와 같은 보간을 그대로 재현한다.
 const VS=`attribute vec3 p;attribute vec3 n;attribute vec3 c;attribute float id;attribute vec4 hl;attribute vec3 pb;attribute vec3 bw;attribute float ins;uniform mat4 V;uniform float ow;uniform float SKN;uniform sampler2D BT;uniform vec2 BTs;uniform float PIDN;
 varying vec3 vn;varying vec3 vrn;varying vec3 vc;varying vec3 vw;varying float vt;varying float vid;varying vec4 vh;
 vec4 rw(float b,float r){return texture2D(BT,vec2((b*3.+r+.5)/BTs.x,(ins+.5)/BTs.y));}
 vec3 xm(vec4 r0,vec4 r1,vec4 r2,vec3 q,float t){vec4 q4=vec4(q,t);return vec3(dot(r0,q4),dot(r1,q4),dot(r2,q4));}
 void main(){vh=hl;vec3 P=p,N=n;if(SKN>.5&&bw.x>-.5){vec4 a0=rw(bw.x,0.),a1=rw(bw.x,1.),a2=rw(bw.x,2.);P=xm(a0,a1,a2,p,1.);N=xm(a0,a1,a2,n,0.);if(bw.z>0.){vec4 b0=rw(bw.y,0.),b1=rw(bw.y,1.),b2=rw(bw.y,2.);P+=bw.z*(xm(b0,b1,b2,pb,1.)-xm(a0,a1,a2,pb,1.));N=mix(N,xm(b0,b1,b2,n,0.),bw.z);}}// 자락: p=(1-w)pa+w·pb 이므로 A(p)+w(B(pb)-A(pb)) = (1-w)A(pa)+w·B(pb)
  vec3 q=P+normalize(N)*ow;vn=N;vrn=n;vid=id+ins*PIDN;vt=floor(c.r/2.);vc=vec3(c.r-2.*vt,c.g,c.b);vw=p;gl_Position=V*vec4(q,1.);}`;// vw: 기본자세 위치(무늬가 몸에 붙도록)
 const FS=`precision highp float;varying vec3 vn;varying vec3 vrn;varying vec3 vc;varying vec3 vw;varying float vt;varying float vid;varying vec4 vh;uniform sampler2D HT;uniform sampler2D ST;uniform sampler2D MC;uniform float SM;uniform vec3 SR;uniform vec3 SU;uniform vec3 PST;uniform vec3 PSH;uniform vec3 PHI;uniform float BRU;uniform sampler2D LT;uniform sampler2D FT;uniform vec3 L;uniform float flat_;uniform vec3 ink;uniform vec3 B;uniform sampler2D AT;uniform vec2 ATs;
 void main(){if(flat_>3.5){vec3 g=mix(vc,vec3(.95,.93,.89),.55);gl_FragColor=vec4(g*.42,.42);return;}if(flat_>2.5){float k=floor(vid+.5);gl_FragColor=vec4(mod(k,256.)/255.,floor(k/256.)/255.,1.,1.);return;}if(flat_>1.5){gl_FragColor=vec4(vc,clamp(vn.x,0.,1.));return;}vec3 nn=normalize(vn);if(flat_>.5){if(dot(nn,B)>0.)discard;gl_FragColor=vec4(ink,1.);return;}float d=dot(nn,L);
  vec3 base=vc;float txa=0.;if(vh.w>.5&&vh.w<1.5){float az=atan(vh.y,vh.x+1.);vec4 tx=texture2D(HT,vec2(.5+az/6.2832,(20.-vh.z)/34.));base=mix(base,tx.rgb,tx.a);txa=tx.a;}// 투구 상세 텍스처: 머리 국소 좌표로 방위각·높이를 구해 입힌다
  // 2D처럼 팔레트 그늘색·밝은색을 쓴다(판금은 모델 팔레트 값, 나머지는 바탕색에서 2D와 같은 비율로 만든다)
  /* 갑옷줄·리벳·테두리·띠·버클·멜빵·가슴 능선: 폴리곤도 수식도 아닌, 미리 구워 둔 그림판(AT)에서 읽는다. 꼬리표 w = 10 + 종류(0 통,1 몸통,2 구) + 3·칸 번호. dcK=먹선, dcB=바탕색 덮기(명암 받음), dcR=가슴 능선 */
  vec4 dcB=vec4(0.);float dcK=0.,dcR=0.;
  if(vh.w>9.5){float cd=floor(vh.w+.5)-10.,kd=mod(cd,3.),cl=floor(cd/3.);vec2 og=vec2(mod(cl,8.),floor(cl/8.))*256.,ts=vec2(256.),uv=vec2(0.);float on=1.;
   if(kd<.5){/* 통: vh=(둘레 cos, sin, 축 위치 0~1) */uv=vec2(atan(vh.y,vh.x)/6.2832+.5,vh.z);}
   else if(kd<1.5){/* 몸통: vh=(좌우 -1~1, 높이 0~1, 앞뒤). 앞 그림은 첫 칸, 뒤 그림은 옆 칸 */ts.y=512.;uv=vec2(vh.x*.5+.5,vh.y);if(vh.z<0.)og.x+=256.;}
   else{/* 구: vh=리벳 방향을 x축으로 한 좌표 → 앞 반구를 (y,z)로 눌러 편 그림 */vec3 n=normalize(vh.xyz);uv=n.yz*.5+.5;on=step(0.,n.x);}
   vec2 px=og+clamp(uv,.5/ts,1.-.5/ts)*ts;vec4 A=texture2D(AT,px/ATs),Bp=texture2D(AT,(px+vec2(0.,ATs.y*.5))/ATs);/* 윗절반 = 바탕색(알파 곱한 RGB, A), 아랫절반 = (R 먹선, G 가슴 능선) */
   dcB=vec4(A.rgb/max(A.a,.004),smoothstep(.3,.7,A.a)*on);dcK=smoothstep(.3,.7,Bp.r)*on;dcR=Bp.g*on;}
  base=mix(base,dcB.rgb,dcB.a);
  bool isSt=distance(vc,PST)<.03&&dcB.a<.5;vec3 rt=base/max(vc,vec3(.01));
  vec3 shC=isSt?PSH*rt:mix(base,vec3(.08,.09,.13),.4),hiC=isSt?PHI*rt:mix(base,vec3(1.,.99,.96),.55),dpC=mix(shC,vec3(.06,.06,.08),.35);
  vec4 S=vec4(.5);if(BRU>.5){if(vh.w>.5&&vh.w<3.5){float az=atan(vh.y,vh.x+1.);S=texture2D(ST,vec2(az*.55,(20.-vh.z)/34.*.9));}else{vec3 w=pow(abs(normalize(vrn)),vec3(4.));w/=w.x+w.y+w.z;vec3 q=vw/18.;S=texture2D(ST,q.yz)*w.x+texture2D(ST,q.xz)*w.y+texture2D(ST,q.xy)*w.z;}}
  float nx=dot(nn,SR),ny=dot(nn,SU),j=BRU>.5?(S.r-.5)*.12:0.,shd,dp,hl;// 먹선 그림체: 무늬 없음 / 붓터치 그림체: 붓 결로 명암 경계를 흔든다
  if(SM<1.5){vec3 L1=normalize(-SR*.85+SU*.45+B*.35);float dd=dot(nn,L1)+j;shd=step(dd,.12);dp=step(dd,-.38);hl=step(.955,dot(nn,normalize(L1+B))+j*.3);}// 1 툰: 화면 왼쪽 위 조명, 딱 끊는 경계, 좁은 광택
  else if(SM<2.5){float x=nx+j;shd=step(.2,x);dp=step(.72,x);hl=step(abs(x+.68),.08);}// 2 화면 기준: 오른쪽 40% 그늘, 왼쪽 16% 지점 가는 광택 띠(2D 규칙)
  else{float lv=texture2D(MC,vec2(nx,ny)*.5+.5+vec2(j*.25,0.)).r;shd=step(lv,.5);dp=step(lv,.17);hl=step(.85,lv);}// 3 매트캡: 그려 둔 공 그림에서 명암 단계를 읽는다
  vec3 col=mix(base,shC,shd);col=mix(col,dpC,dp);
  if(BRU>.5){col=mix(col,shC*.9,shd*S.b*.35);col=mix(col,col*1.07,(1.-shd)*S.r*.35);col=mix(col,hiC,hl*(.45+.55*S.r));}else col=mix(col,hiC,hl);// 붓터치: 그늘 안 굵은 붓 자국, 밝은 면 마른 붓 긁힘, 광택은 붓 획 모양
  if(vh.w>1.5&&vh.w<2.5){float az=atan(vh.y,vh.x+1.);col=mix(col,col*.5,texture2D(LT,vec2(az*8.,vh.z/2.1),-16.).b*.85);}// 사슬 무늬(2D 사슬 두건과 같은 엇갈린 반달 고리): 찰갑 그림 B칸에 구워 둔 무늬
  if((vt>.5&&vt<1.5)||(vt>3.5&&vt<4.5)){// 찰갑(꼬리표 4는 위를 향한 면에도 입힌다): 미리 그려 둔 찰갑 그림(찰갑선 1.5배 기준, 판 2칸×2줄 한 장)을 기본자세 위치에 옆면·앞면 투영으로 입힌다(R=먹선, G=판 안 높이)
   vec3 an=abs(normalize(vrn));float wy=an.x/(an.x+an.y+1e-4);vec4 T=mix(texture2D(LT,vec2(vw.x/5.4,vw.z/6.8)),texture2D(LT,vec2(vw.y/5.4,vw.z/6.8)),wy);float tz=step(3.5,vt)*smoothstep(.6,.9,an.z);T=mix(T,texture2D(LT,vw.xy/5.4),tz);/* 위를 향한 면: 같은 찰갑 그림을 위에서 내려다본 투영으로 읽는다 */
   float side=mix(smoothstep(.9,.6,an.z),1.,tz)*(1.-txa);/* 투구 그림(드림 눈구멍 등)이 칠해진 곳엔 찰갑 무늬 없음 */col*=mix(1.,.9+.14*T.g,side);col=mix(col,vec3(.07,.065,.06),T.r*side);}
  if(vh.w>2.5&&vh.w<3.5){float az=atan(vh.y,vh.x+1.);vec4 f=texture2D(FT,vec2(.5+az/6.2832,(20.-vh.z)/34.));col=mix(col,f.rgb,f.a);}// 얼굴 그림: 눈썹·입·코 선·X 눈·안대와 끈·콧수염·수염선(폴리곤 대신 머리 국소 좌표 그림)
  if(vh.w>3.5&&vh.w<4.5){col=mix(col,vec3(.11,.1,.09),texture2D(LT,vec2(atan(vh.y,vh.x)/6.2832+.5,clamp(vh.z/14.,.01,.99)),-16.).a);}// 정강이·아래팔 능선: 통 둘레 각도·반지름으로 찾아 읽는 먹선(찰갑 그림 A칸)
  col=mix(col,PSH*.95,dcR);// 가슴 가운데 능선(장식표 몸통 줄에서)
  col=mix(col,BRU>.5?col*.52:vec3(.114,.102,.09),dcK*(BRU>.5?.75:1.));/* 붓터치: 갑옷줄은 먹색 대신 바탕색을 어둡게(2D처럼 연한 회색 줄) */// 갑옷줄 먹선·리벳: 명암 없이
  if(vt>2.5&&vt<3.5)col=vc;// 갑옷줄 먹선: 명암·광택 없이
  if(BRU>.5){vec2 fp=gl_FragCoord.xy;float a1=dot(fp,vec2(.94,.34)),a2=dot(fp,vec2(-.34,.94)),r1=fract(sin(floor(a1/4.)*91.7)*4375.85),r2=fract(sin(floor(a1/4.)*17.3+floor((a2+r1*400.)/(50.+r1*90.))*53.1)*2341.7);col=mix(col,min(col*1.12+.05,vec3(1.)),step(.7,r1)*step(.55,r2)*.55);}/* 붓터치: 2D처럼 화면에 비스듬히 지나가는 마른 붓 결(밝은 가는 줄, 군데군데 끊김) */gl_FragColor=vec4(col,1.);}`;
 const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(s);return s};
 // 관절 외곽선(부품 경계선): 부품 번호를 따로 그린 뒤, 이웃 픽셀의 번호가 다르면 먹선을 긋는다 → 2D처럼 부품마다 외곽선
 const EVS=`attribute vec2 q;varying vec2 uv;void main(){uv=q*.5+.5;gl_Position=vec4(q,0.,1.);}`;
 const EFS=`precision highp float;varying vec2 uv;uniform sampler2D T;uniform vec2 px;uniform vec3 ink;uniform float wo;uniform float wb;uniform float BRU;
 float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
 float id(vec2 o){vec4 c=texture2D(T,uv+o*px);return c.b<.5?-1.:floor(c.r*255.+.5)+floor(c.g*255.+.5)*256.;}
 // 매끄럽게: 둘레 8방향(반지름 1, 0.5 두 겹)을 보고 번호가 다른 비율만큼 진하게(가장자리 계단 완화)
 // 외곽선(배경↔몸, 굵기 wo)과 경계선(부품↔부품, 굵기 wb)을 따로 본다
 float hit(float c,float d,float bg){if(abs(d-c)<.5||max(c,d)<-.5)return 0.;float isBg=(c<-.5||d<-.5)?1.:0.;return bg>.5?isBg:1.-isBg;}
 void main(){float c=id(vec2(0.));float e=0.;vec2 fc=gl_FragCoord.xy;float bw=BRU>.5?mix(.6,1.6,vn(fc/9.)):1.;for(int i=0;i<8;i++){float a=float(i)*.7854;vec2 o=vec2(cos(a),sin(a))*bw;
   if(wo>.01){e+=.09*hit(c,id(o*wo),1.)+.035*hit(c,id(o*wo*.5),1.);}
   if(wb>.01){e+=.09*hit(c,id(o*wb),0.)+.035*hit(c,id(o*wb*.5),0.);}}
  float al=smoothstep(.03,.2,e);if(BRU>.5){al*=mix(.45,1.,vn(fc/5.+3.1));al*=step(.16,vn(fc/14.+7.7));}if(BRU>.5)al*=.38;if(al<.02)discard;// 붓선: 진하기 흔들림 + 군데군데 끊김
 /* 선명하게: 조금만 걸쳐도 진하게, 가장자리 1픽셀 안에서만 부드럽게 */gl_FragColor=vec4((BRU>.5?mix(ink,vec3(.4,.4,.44),.6):ink)*al,al);}`;/* 붓터치: 2D처럼 먹선 외곽선 없이 연한 회색으로 옅게 */
 let eprog=null,qb=null,fbo=null,ftex=null,frb=null,fw=0,fh=0;
 function fboSize(w,h){if(fbo&&fw===w&&fh===h)return;fw=w;fh=h;if(!fbo){fbo=gl.createFramebuffer();ftex=gl.createTexture();frb=gl.createRenderbuffer()}
  gl.bindTexture(gl.TEXTURE_2D,ftex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);for(const k of[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.NEAREST);for(const k of[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);
  gl.bindRenderbuffer(gl.RENDERBUFFER,frb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,ftex,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,frb);gl.bindFramebuffer(gl.FRAMEBUFFER,null)}
 let ib=null,hb=null,htex=null,hkey='',stex=null,mtex=null,ltex=null;
 /* 표시줄에 '드림 단' 슬라이더를 끼워 넣는다(editor.js·shell_head.html은 건드리지 않음) */
 function mkUI(){/* 3D 월드2 화면 조정: 명암·외곽선·경계선·갑옷줄은 모델 탭 맨 위로, 금나라 투구 드림 조정은 모델 탭의 투구 칸으로 옮긴다. editor.js·helmimport.js·shell_head.html은 건드리지 않고, 모델 탭이 다시 그려질 때마다 덧붙인다 */
  const sw=document.getElementById('shadesw');if(!sw||sw._p3)return;sw._p3=1;
  {const b3=document.querySelector('#worldsw button[data-world="3d"]');if(b3)b3.remove();const b32=document.querySelector('#worldsw button[data-world="3d2"]');if(b32)b32.textContent='3D 월드';try{if(W3HOST.WORLD==='3d')W3HOST.setWorld('3d2')}catch(_){}}/* 예전 3D 월드 버튼은 없애고 3D 월드2를 '3D 월드'로 부른다 */
  for(const el of[sw.querySelector('span'),...sw.querySelectorAll('button[data-shade]'),...['w3o','w3b','w3a'].map(id=>{const e=document.getElementById(id);return e&&e.closest('label')})])if(el)el.style.display='none';/* 무대 위 표시줄에서는 숨긴다(원래 조작부는 그대로 두고 모델 탭의 대리 조작부가 움직인다) */
  const pn=document.getElementById('panel');if(pn)new MutationObserver(()=>patchPanel()).observe(pn,{childList:true});patchPanel();orbitUI()}
 let P3W=null;
 function patchPanel(){const pn=document.getElementById('panel');if(!pn)return;let w3=false;try{w3=W3HOST.WORLD==='3d2'}catch(_){}
  /* 아래 재생줄(재생·키·+키)은 동작 탭에서만 보인다 */
  {const tb=document.querySelector('#tabs button[aria-selected="true"]'),tl=document.getElementById('tl'),want=tb&&tb.dataset.tab==='anim'?'':'none';if(tl&&tl.style.display!==want){tl.style.display=want;window.dispatchEvent(new Event('resize'))}}
  /* 게임에서 가져오기: 1안·2안·3안 묶음 제거 */
  for(const sb of[...pn.querySelectorAll('.sub')])if(/^[123]안/.test(sb.textContent.trim())){const nx=sb.nextElementSibling;if(nx&&nx.classList.contains('seg'))nx.remove();sb.remove()}
  /* 게임에서 가져오기: 백기사1·백기사1 붓터치 제거 */
  for(const b of[...pn.querySelectorAll('button[data-act="src"]')])if(['백기사1','백기사1 · 붓터치'].includes(b.textContent.trim()))b.remove();
  /* 그림체(도포 무사·갑옷 무사·거대 기사·판금 기사·로봇 모델) 항목 제거. 같은 칸의 '이름'은 남긴다 */
  for(const h of[...pn.querySelectorAll('h3')])if(h.textContent.trim()==='그림체'){const nx=h.nextElementSibling;if(nx&&nx.classList.contains('seg'))nx.remove();h.remove()}
  /* 투구 형태: 조관 추가 */
  const fb=pn.querySelector('button[data-act="hkit"][data-k="form"]');if(fb&&!pn.querySelector('button[data-act="hkit"][data-k="form"][data-v="joguan"]')){let f='';try{f=W3HOST.proj.model.hkit.form}catch(_){}const b=document.createElement('button');b.dataset.act='hkit';b.dataset.k='form';b.dataset.v='joguan';b.setAttribute('aria-pressed',String(f==='joguan'));b.textContent='조관';fb.parentNode.appendChild(b)}
  /* 투구 형태: 클로즈헬름 추가. 고르면 면갑 상태(내림·올림) */
  {let f='';try{f=W3HOST.proj.model.hkit.form}catch(_){}if(fb&&!pn.querySelector('button[data-act="hkit"][data-k="form"][data-v="close"]')){const b=document.createElement('button');b.dataset.act='hkit';b.dataset.k='form';b.dataset.v='close';b.setAttribute('aria-pressed',String(f==='close'));b.textContent='클로즈헬름';fb.parentNode.appendChild(b)}
   let fc='';try{fc=W3HOST.proj.model.hkit.face}catch(_){}const pvz=['close','peak','closed'],pc=f==='parts'&&pvz.includes(fc),cv_=f==='close'||pc,dj=pc&&(fc==='jin'||fc==='jin2');/* pc: 조립 몸체에서 면갑·드림 상태가 있는 얼굴 가리개 */
   const fcb=pn.querySelector('button[data-act="hkit"][data-k="face"]');if(fcb)for(const[v,l]of[['close','클로즈'],['peak','뾰족 투구'],['closed','면갑 투구'],['kettle','챙 투구'],['joguan','조관']])if(!pn.querySelector('button[data-act="hkit"][data-k="face"][data-v="'+v+'"]')){const b=document.createElement('button');b.dataset.act='hkit';b.dataset.k='face';b.dataset.v=v;b.setAttribute('aria-pressed',String(fc===v));b.textContent=l;fcb.parentNode.appendChild(b)}/* 얼굴 가리개: 다른 투구의 앞부분 */
   if(f==='parts'&&['kettle','joguan'].includes(fc))for(const sb of[...pn.querySelectorAll('.sub')])if(['눈구멍','숨구멍'].includes(sb.textContent.trim())){const nx=sb.nextElementSibling;if(nx&&nx.classList.contains('seg'))nx.remove();sb.remove()}/* 눈 틈이 정해진 얼굴(뾰족·면갑 투구는 눈구멍·숨구멍을 그대로 쓴다) */
   const key_=f+'|'+(pc?fc:''),ov_=document.getElementById('w3cvis');if(ov_&&(!cv_||ov_.dataset.k!==key_))ov_.remove();if(fb&&cv_&&!document.getElementById('w3cvis')){let vz='down';try{vz=W3HOST.proj.model.hkit.visor==='up'?'up':'down'}catch(_){}const g=document.createElement('div');g.id='w3cvis';g.dataset.k=key_;g.style.display='grid';g.style.gap='8px';g.innerHTML='<div class="sub">'+(dj?'드림 상태':'면갑 상태')+'</div><div class="seg">'+(dj?[['down','드림 내리기 · 눈만'],['up',fc==='jin'?'드림 올리기 · 접어 올림':'드림 올리기 · 옆자락만']]:[['down','면갑 내리기'],['up','면갑 올리기']]).map(([v,l])=>'<button data-act="hkit" data-k="visor" data-v="'+v+'" aria-pressed="'+(vz===v)+'">'+l+'</button>').join('')+'</div>';if(pc){const lb=document.createElement('label');lb.className='sl';lb.innerHTML='<span>바이저 튀어나옴</span><input type="range" min="0.3" max="2" step="0.05"><b></b>';const r=lb.querySelector('input'),bv=lb.querySelector('b');let v0=1;try{v0=W3HOST.proj.model.hkit.vpro??1}catch(_){}r.value=String(v0);bv.textContent=(+v0).toFixed(2);r.oninput=e=>{e.stopPropagation();bv.textContent=(+r.value).toFixed(2);try{W3HOST.proj.model.hkit.vpro=+r.value}catch(_){}W3HOST.wake(400)};r.onchange=()=>{try{W3HOST.commit()}catch(_){}};g.appendChild(lb)}/* 바이저 튀어나옴(조립 몸체 바이저1·2·3) */((pc&&fcb)?fcb.parentNode:fb.parentNode).after(g)}}
  /* 조립 몸체: 원래 '면갑 상태'(면갑·평면 가면 얼굴)를 얼굴 가리개 바로 아래로 옮긴다 */
  {const fb2=pn.querySelector('button[data-act="hkit"][data-k="face"]'),fs=fb2&&fb2.parentNode,vs=[...pn.querySelectorAll('.sub')].find(e=>e.textContent.trim()==='면갑 상태'&&!e.closest('#w3cvis'));if(fs&&vs&&fs.nextElementSibling!==vs){const sg=vs.nextElementSibling;fs.after(vs);if(sg&&sg.classList.contains('seg'))vs.after(sg)}}
  /* 머리에 쓰는 것: 기본은 맨머리, 투구·사슬 두건·천 두건을 켜고 끄는 단추(투구와 두건은 함께 쓸 수 있고, 두건은 둘 중 하나) */
  {let M=null;try{M=W3HOST.proj.model}catch(_){}const hb=pn.querySelector('button[data-act="mset"][data-k="hwear"]'),hseg=hb&&hb.parentNode;
   if(M&&hseg){if((M.hwear==='coif'||M.hwear==='hood')&&M.hood==null){M.hood=M.hwear;M.hwear='none'}/* 예전 값 옮기기 */
    const hOn=(M.hwear||'helm')==='helm',hd=M.hood||'',kk=hOn+'|'+hd;if(hseg.dataset.w3!==kk){hseg.dataset.w3=kk;hseg.innerHTML=[['mset','hwear',hOn?'none':'helm','투구',hOn],['mset','hood',hd==='coif'?'':'coif','사슬 두건',hd==='coif'],['mset','hood',hd==='hood'?'':'hood','천 두건',hd==='hood']].map(([a,k,v,l,on])=>'<button data-act="'+a+'" data-k="'+k+'" data-v="'+v+'" aria-pressed="'+on+'">'+l+'</button>').join('')}
    const hsub=hseg.previousElementSibling;if(hsub&&hsub.classList.contains('sub')&&hsub.textContent.trim()==='머리에 쓰는 것')hsub.textContent='머리에 쓰는 것 · 여러 개 고르기'}}
  /* 조립 몸체: '머리에 쓰는 것'을 정수리 바로 위로 옮긴다(정수리가 있을 때만) */
  {const hs=[...pn.querySelectorAll('.sub')].find(e=>e.textContent.trim().startsWith('머리에 쓰는 것')),hseg=hs&&hs.nextElementSibling,ds=[...pn.querySelectorAll('.sub')].find(e=>e.textContent.trim()==='정수리');if(hs&&hseg&&hseg.classList.contains('seg')&&ds&&ds.previousElementSibling!==hseg){ds.before(hs);hs.after(hseg)}}
  /* 조립 몸체: '얼굴 가리개' → '투구'(코·볼가리개는 빼서 '투구가리개'로), 챙은 투구 위로, 투구가리개(코가리개·볼가리개 여러 개 고르기) */
  {let H={},fP=false;try{H=W3HOST.proj.model.hkit||{};fP=W3HOST.proj.model.helm==='kit'&&(W3HOST.proj.model.hwear||'helm')==='helm'&&(H.form||'parts')==='parts'}catch(_){}const fb3=pn.querySelector('button[data-act="hkit"][data-k="face"]'),fseg=fb3&&fb3.parentNode,fsub=fseg&&fseg.previousElementSibling;
   if(fP&&fseg&&fsub&&fsub.classList.contains('sub')){for(const v of['nasal','cheek']){const b=fseg.querySelector('button[data-v="'+v+'"]');if(b)b.remove()}if(H.face==='nasal'||H.face==='cheek'){const o=fseg.querySelector('button[data-v="open"]');if(o)o.setAttribute('aria-pressed','true')}{const b=fseg.querySelector('button[data-v="visor"]');if(b)b.remove()}/* 면갑 항목 제거 */
    {const ORD=[['open','경투구'],['kettle','챙 투구'],['joguan','조관'],['mask','통투구'],['closed','바이저1'],['peak','바이저2'],['close','바이저3']],bt=ORD.map(([v,l])=>{const b=fseg.querySelector('button[data-v="'+v+'"]');if(b&&b.textContent!==l)b.textContent=l;return b}).filter(Boolean),cur=[...fseg.children];if(bt.some((b,i)=>cur[i]!==b))for(const b of bt)fseg.appendChild(b)}/* 투구 이름·순서 */if(fsub.textContent.trim()!=='투구')fsub.textContent='투구';
    const bs=[...pn.querySelectorAll('.sub')].find(e=>e.textContent.trim()==='챙'),bseg=bs&&bs.nextElementSibling;if(bs&&bseg&&fsub.previousElementSibling!==bseg){fsub.before(bs);bs.after(bseg)}/* 챙을 투구 위로 */
    const on=k=>H[k]!=null?(H[k]==='1'||H[k]===true):H.face===k,kg=String(on('nasal'))+on('cheek')+on('fmask'),og=document.getElementById('w3pgd');if(og&&og.dataset.k!==kg)og.remove();
    if(!document.getElementById('w3pgd')){const anchor=document.getElementById('w3pdr')||[...pn.querySelectorAll('.sub')].find(e=>['목가리개','목드림'].includes(e.textContent.trim()));if(anchor){const g=document.createElement('div');g.id='w3pgd';g.dataset.k=kg;g.style.display='grid';g.style.gap='8px';g.innerHTML='<div class="sub">투구가리개 · 여러 개 고르기</div><div class="seg">'+[['nasal','코가리개'],['cheek','볼가리개'],['fmask','얼굴가리개']].map(([k,l])=>'<button data-act="hkit" data-k="'+k+'" data-v="'+(on(k)?'0':'1')+'" aria-pressed="'+on(k)+'">'+l+'</button>').join('')+'</div>';anchor.before(g)}}}}
   /* 조립 몸체: 목가리개를 '투구드림'(빈 칸), '찰갑드림'(종류·상태·드림 조정·눈 모양·안대), '목드림'(서양 기사 목가리개 + 길이·퍼짐)으로 나눈다 */
   {const H=(()=>{try{return W3HOST.proj.model.hkit||{}}catch(_){return{}}})(),lj=H.face==='jin'||H.face==='jin2',fP=(H.form||'parts')==='parts'&&(()=>{try{return W3HOST.proj.model.helm==='kit'&&(W3HOST.proj.model.hwear||'helm')==='helm'}catch(_){return false}})(),dr=fP?(H.drim?H.drim:(lj?H.face:'none')):'',dv=(H.dvis||(lj?H.visor:'down'))==='up'?'up':'down',nk_=H.neck||'none',hd_=H.hdrim||'none',k2=[dr,dv,hd_,H.hdwrap,H.hdpat,(()=>{try{return W3HOST.proj.model.fEye+'|'+!!W3HOST.proj.model.patch}catch(_){return''}})()].join('|'),k3=nk_,nseg=(()=>{const b=pn.querySelector('button[data-act="hkit"][data-k="neck"]');return b?b.parentNode:null})(),o2=document.getElementById('w3pdr'),o3=document.getElementById('w3pnk');
    if(o2&&(!fP||o2.dataset.k!==k2))o2.remove();if(o3&&(!fP||o3.dataset.k!==k3))o3.remove();const anc=[...pn.querySelectorAll('.sub')].find(e=>['목가리개','목드림'].includes(e.textContent.trim())),at=anc&&anc.nextElementSibling;if(fP&&anc&&anc.textContent.trim()!=='목드림')anc.textContent='목드림';
    const box=(id,k)=>{const g=document.createElement('div');g.id=id;g.dataset.k=k;g.style.display='grid';g.style.gap='8px';return g};
    const sl=(g,nm,mn,mx,st_,val,fmt,set)=>{const lb=document.createElement('label');lb.className='sl';lb.innerHTML='<span>'+nm+'</span><input type="range"><b></b>';const r=lb.querySelector('input'),bv=lb.querySelector('b');r.min=mn;r.max=mx;r.step=st_;r.value=String(val);bv.textContent=fmt(r.value);r.oninput=e=>{e.stopPropagation();bv.textContent=fmt(r.value);set(+r.value);W3HOST.wake(400)};r.onchange=()=>{try{W3HOST.commit()}catch(_){}};g.appendChild(lb)};
    const seg=(g,title,btns)=>{const d=document.createElement('div');d.innerHTML='<div class="sub">'+title+'</div><div class="seg">'+btns.map(([a,k,v,l,on])=>'<button data-act="'+a+'" data-k="'+k+'" data-v="'+v+'" aria-pressed="'+on+'">'+l+'</button>').join('')+'</div>';d.style.display='grid';d.style.gap='8px';g.appendChild(d)};
    if(fP&&nseg&&nk_!=='none'&&!document.getElementById('w3pnk')){const g=box('w3pnk',k3),pf='목드림';sl(g,pf+' 길이',.5,1.6,.05,H.nlen??1,v=>(+v).toFixed(2),v=>{W3HOST.proj.model.hkit.nlen=v});sl(g,pf+' 퍼짐',0,2.5,.05,H.nspr??1,v=>(+v).toFixed(2),v=>{W3HOST.proj.model.hkit.nspr=v});nseg.after(g)}/* 목드림: 서양 기사 목가리개의 길이·퍼짐 */
    if(fP&&anc&&!document.getElementById('w3pdr')){const g=box('w3pdr',k2);
     /* 투구드림: 자리만 만들어 비워 둔다 */seg(g,'찰갑드림',[['none','없음'],['jin','찰갑드림'],['jin2','찰갑드림2']].map(([v,l])=>['hkit','drim',v,l,dr===v]));
     if(dr!=='none'){seg(g,'드림 상태',[['down','드림 내리기 · 눈만'],['up',dr==='jin'?'드림 올리기 · 접어 올림':'드림 올리기 · 옆자락만']].map(([v,l])=>['hkit','dvis',v,l,dv===v]));
      if(dr==='jin'&&dv==='up'){const t=document.createElement('div');t.className='sub';t.textContent='드림 조정';g.appendChild(t);for(const[k,nm,mn,mx,st_,get,fmt]of[['drimStep','단',1,4,1,dstep,v=>v+'단'],['drimGap','단차',0,2,.05,dgap,v=>(+v).toFixed(2)],['drimOv','층 겹침',0,6,.1,dov,v=>(+v).toFixed(1)]])sl(g,nm,mn,mx,st_,get(),fmt,v=>{try{W3HOST.opt[k]=v;W3HOST.LS.set('model-ed-opt',W3HOST.opt)}catch(_){}})}
      if(dv==='down'){let fe='dot',pt=false;try{fe=W3HOST.proj.model.fEye||'dot';pt=!!W3HOST.proj.model.patch}catch(_){}seg(g,'드림 틈 눈 모양',[['dot','점 눈'],['narrow','가는 눈'],['fierce','부릅뜬 눈'],['x','X 눈']].map(([v,l])=>['mset','fEye',v,l,fe===v]));seg(g,'안대',[['1','외눈 안대'],['0','없음']].map(([v,l])=>['mbool','patch',v,l,(v==='1')===pt]))}}
     seg(g,'투구드림',[['none','없음'],['short','짧은'],['long','긴'],['flared','퍼진'],['mail','사슬']].map(([v,l])=>['hkit','hdrim',v,l,hd_===v]));if(hd_!=='none'){sl(g,'투구드림 길이',.5,1.6,.05,H.hlen??1,v=>(+v).toFixed(2),v=>{W3HOST.proj.model.hkit.hlen=v});sl(g,'투구드림 퍼짐',0,2.5,.05,H.hspr??1,v=>(+v).toFixed(2),v=>{W3HOST.proj.model.hkit.hspr=v});const wr=H.hdwrap==='1'||H.hdwrap===true,pt=H.hdpat||'none';seg(g,'투구드림 여밈 · 켜고 끄기',[['hkit','hdwrap',wr?'0':'1','여밈 · 턱 감싸기',wr]]);seg(g,'드림 문양',[['none','없음'],['stud','징'],['lamellar','찰갑'],['scale','비늘'],['mail','쇠사슬']].map(([v,l])=>['hkit','hdpat',v,l,pt===v]))}/* 여밈(트인 얼굴일 때 턱 아래를 감쌈)·문양 *//* 투구드림: 투구 밑단에서 늘어뜨리는 드림(목드림과 따로) */
     anc.before(g)}}/* 찰갑드림·투구드림 순서로 목드림 앞에 */
  /* 갑옷: 폴드런에 '대형 폴드런' 추가(3D 월드) */
  {const pb=pn.querySelector('button[data-act="mset"][data-k="paul"]');if(pb&&w3&&!pn.querySelector('button[data-k="paul"][data-v="large"]')){let pv='';try{pv=W3HOST.proj.model.paul}catch(_){}const b=document.createElement('button');b.dataset.act='mset';b.dataset.k='paul';b.dataset.v='large';b.setAttribute('aria-pressed',String(pv==='large'));b.textContent='대형 폴드런';pb.parentNode.appendChild(b)}
   if(pb&&w3&&!pn.querySelector('button[data-k="paul"][data-v="body"]')){let pv='';try{pv=W3HOST.proj.model.paul}catch(_){}const b=document.createElement('button');b.dataset.act='mset';b.dataset.k='paul';b.dataset.v='body';b.setAttribute('aria-pressed',String(pv==='body'));b.textContent='몸통 폴드런';pb.parentNode.appendChild(b)}}
  /* 갑옷: 강철 치마(톤렛). 3D 월드에서만, 판금 갑옷일 때 */
  {let ar='plate',tn=false;try{ar=W3HOST.proj.model.armor||'plate';tn=!!W3HOST.proj.model.tonlet}catch(_){}const ot=document.getElementById('w3ton');if(ot&&(!w3||ar==='jin'))ot.remove();
   if(w3&&ar!=='jin'&&!document.getElementById('w3ton')){const anc=[...pn.querySelectorAll('.sub')].find(e=>e.textContent.trim()==='겉옷 (서코트)');const at=anc&&anc.nextElementSibling;if(at){const g=document.createElement('div');g.id='w3ton';g.style.display='grid';g.style.gap='8px';g.innerHTML='<div class="sub">강철 치마 (톤렛)</div><div class="seg">'+[['1','입음'],['0','없음']].map(([v,l])=>'<button data-act="mbool" data-k="tonlet" data-v="'+v+'" aria-pressed="'+((v==='1')===tn)+'">'+l+'</button>').join('')+'</div>';at.after(g)}}}
  const isModel=!!pn.querySelector('#mname');
  /* 모델 탭 맨 위: 3D 표시(3D 월드2에서만) */
  const old=document.getElementById('w3opt');if(old&&(!w3||!isModel))old.remove();
  if(w3&&isModel&&!document.getElementById('w3opt')){const g=document.createElement('section');g.className='grp';g.id='w3opt';g.innerHTML='<h3>3D 표시</h3><div class="sub">명암</div><div class="seg" id="w3sh"></div>';const sh=g.querySelector('#w3sh'),org=[...document.querySelectorAll('#shadesw button[data-shade]')];
   const syncSh=()=>sh.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',org[i]?org[i].getAttribute('aria-pressed')||'false':'false'));
   org.forEach(o=>{const b=document.createElement('button');b.textContent=o.textContent;b.onclick=()=>{o.click();setTimeout(syncSh,0)};sh.appendChild(b)});syncSh();
   for(const[id,nm]of[['w3o','외곽선'],['w3b','경계선']]){/* 갑옷줄 항목은 뺐다 */const o=document.getElementById(id),ov=document.getElementById(id+'v');if(!o)continue;const lb=document.createElement('label');lb.className='sl';lb.innerHTML='<span>'+nm+'</span><input type="range"><b></b>';const r=lb.querySelector('input'),bv=lb.querySelector('b');r.min=o.min;r.max=o.max;r.step=o.step;r.value=o.value;bv.textContent=ov?ov.textContent:o.value;r.oninput=()=>{o.value=r.value;o.dispatchEvent(new Event('input'));bv.textContent=ov?ov.textContent:r.value};g.appendChild(lb)}
   pn.insertBefore(g,pn.firstChild)}
  /* 금나라 투구를 고르면 드림 조정(단·단차·층 겹침) */
  let jin=false;try{const m=W3HOST.proj.model;jin=m.helm==='kit'&&m.hkit&&m.hkit.form==='jin'}catch(_){}
  const od=document.getElementById('w3drim');if(od&&!jin)od.remove();
  if(jin&&!document.getElementById('w3drim')){const anc=[...pn.querySelectorAll('.sub')].find(e=>e.textContent.trim()==='드림 상태');const at=anc&&anc.nextElementSibling;if(at){const g=document.createElement('div');g.id='w3drim';g.style.display='grid';g.style.gap='8px';g.innerHTML='<div class="sub">드림 조정 · 드림 올림(3D 월드)</div>';
    for(const[k,nm,mn,mx,st,get,fmt]of[['drimStep','단',1,4,1,dstep,v=>v+'단'],['drimGap','단차',0,2,.05,dgap,v=>(+v).toFixed(2)],['drimOv','층 겹침',0,6,.1,dov,v=>(+v).toFixed(1)]]){const lb=document.createElement('label');lb.className='sl';lb.innerHTML='<span>'+nm+'</span><input type="range"><b></b>';const r=lb.querySelector('input'),bv=lb.querySelector('b');r.min=mn;r.max=mx;r.step=st;r.value=String(get());bv.textContent=fmt(r.value);r.oninput=()=>{bv.textContent=fmt(r.value);try{W3HOST.opt[k]=+r.value;W3HOST.LS.set('model-ed-opt',W3HOST.opt);W3HOST.wake(500)}catch(_){}};g.appendChild(lb)}
    at.after(g)}}}
 /* 카메라 위아래 회전 제한 풀기: editor.js는 VIEW.sq를 .2~1로 묶는다. 3D 월드2에서 시점을 돌릴 때만 그 뒤에 이어 받아 -.95~1(아래에서 올려다보기까지)로 넓힌다. 다른 월드로 나가면 원래 범위로 되돌린다 */
 function orbitUI(){const cv_=document.getElementById('cv');if(!cv_||cv_._p3)return;cv_._p3=1;let ly=null,P3=null;cv_.addEventListener('pointerdown',e=>{ly=e.clientY;P3=W3HOST.VIEW.sq},true);cv_.addEventListener('pointermove',e=>{if(ly==null)return;const dy=e.clientY-ly;ly=e.clientY;try{if(W3HOST.WORLD!=='3d2'||!W3HOST.drag||W3HOST.drag.mode!=='orbit')return}catch(_){return}P3=clamp(P3+dy*.004,-.95,1);W3HOST.VIEW.sq=P3});const up=()=>{ly=null};cv_.addEventListener('pointerup',up,true);cv_.addEventListener('pointercancel',up,true)}
 function init(){if(gl)return ok;cvs=document.getElementById('gl3d2');if(!cvs)return false;mkUI();gl=cvs.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});if(!gl)return false;
  try{prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw gl.getProgramInfoLog(prog);vb=gl.createBuffer();ib=gl.createBuffer();hb=gl.createBuffer();htex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,htex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));stex=gl.createTexture();(()=>{const N=256,cv=document.createElement('canvas');cv.width=cv.height=N;const c=cv.getContext('2d'),img=c.createImageData(N,N);
   // 채널마다 따로 그리기 위해 그림판 세 장을 만들어 합친다
   const layer=fn=>{const L=document.createElement('canvas');L.width=L.height=N;const g=L.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,N,N);g.strokeStyle='#fff';g.lineCap='round';fn(g);return g.getImageData(0,0,N,N).data};
   let sd=7;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
   const R_=layer(g=>{for(let i=0;i<34;i++){const x=rnd()*N,y=rnd()*N,l=22+rnd()*40,a=-.25+rnd()*.5;g.lineWidth=3+rnd()*4;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+l*.5,y+Math.sin(a)*l*.5-3,x+l*Math.cos(a),y+l*Math.sin(a));g.stroke();for(const dx of[-N,N])for(const dy of[-N,N,0]){g.beginPath();g.moveTo(x+dx,y+dy);g.lineTo(x+dx+l,y+dy+l*Math.sin(a));g.stroke()}}});// 밝은 붓 결: 짧게 휜 가로 획
   const B_=layer(g=>{for(let i=-N;i<N*2;i+=15+rnd()*5){g.lineWidth=2.4+rnd()*1.6;g.beginPath();g.moveTo(i,0);g.lineTo(i+N*.55,N);g.stroke()}});// 빗금: 한 방향 사선
   const G_=layer(g=>{for(let i=-N;i<N*2;i+=17+rnd()*5){g.lineWidth=2.2+rnd()*1.4;g.beginPath();g.moveTo(i,N);g.lineTo(i+N*.5,0);g.stroke()}});// 엇빗금: 반대 사선(깊은 그늘)
   for(let k=0;k<N*N;k++){img.data[k*4]=R_[k*4];img.data[k*4+1]=G_[k*4];img.data[k*4+2]=B_[k*4];img.data[k*4+3]=255}
   gl.bindTexture(gl.TEXTURE_2D,stex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,N,N,0,gl.RGBA,gl.UNSIGNED_BYTE,img.data);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT)})();
   mtex=gl.createTexture();(()=>{const N=256,cv=document.createElement('canvas');cv.width=cv.height=N;const g=cv.getContext('2d');// 매트캡: 2D 화풍으로 그린 명암 공(회색 값 = 명암 단계: 0 깊은 그늘, 85 그늘, 170 바탕, 255 광택)
    let sd=11;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647},gy=v=>`rgb(${v},${v},${v})`;g.fillStyle=gy(170);g.fillRect(0,0,N,N);g.lineCap='round';
    g.fillStyle=gy(85);g.beginPath();g.moveTo(N*.62,0);for(let y=0;y<=N;y+=16)g.lineTo(N*(.6+rnd()*.04),y);g.lineTo(N,N);g.lineTo(N,0);g.fill();
    g.strokeStyle=gy(85);for(let i=0;i<5;i++){const x=N*(.56+rnd()*.1);g.lineWidth=N*(.05+rnd()*.06);g.beginPath();g.moveTo(x,-8);g.quadraticCurveTo(x+(rnd()-.5)*14,N/2,x+(rnd()-.5)*16,N+8);g.stroke()}// 그늘 경계: 붓으로 내리그은 굵은 획
    g.fillStyle=gy(0);g.beginPath();g.moveTo(N*.88,0);for(let y=0;y<=N;y+=16)g.lineTo(N*(.86+rnd()*.03),y);g.lineTo(N,N);g.lineTo(N,0);g.fill();
    g.strokeStyle=gy(255);for(const[x,w] of[[.16,.045],[.23,.02]]){g.lineWidth=N*w;g.beginPath();g.moveTo(N*x,N*.08);g.quadraticCurveTo(N*(x-.01),N*.5,N*(x+.01),N*.92);g.stroke()}// 광택: 왼쪽 가는 세로 붓 획
    gl.bindTexture(gl.TEXTURE_2D,mtex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE)})();
   ltex=gl.createTexture();(()=>{const N=256,img=new Uint8Array(N*N*4),SS=3;// 찰갑 그림: 셰이더에서 쓰던 식(찰갑선 1.5배)을 그대로 한 번만 계산해 굽는다. 가로 2판, 세로 2줄(둘째 줄 반 칸 밀림)
    const sm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)},L=1.5;
    for(let py=0;py<N;py++)for(let px=0;px<N;px++){let acc=0,g=0;for(let sy=0;sy<SS;sy++)for(let sx=0;sx<SS;sx++){const u=(px+(sx+.5)/SS)/N*2,v=(py+(sy+.5)/SS)/N*2,row=Math.floor(v),fy=v-row,fxr=u+row*.5,fx=fxr-Math.floor(fxr);
      const seam=sm(.085*L,.01*L,Math.min(fx,1-fx))*(fy>=.12?1:0),top=sm(.1*L,.02*L,Math.abs(fy-(.86+.1*(1-(fx*2-1)**2)))),lace=Math.hypot((fx-.5)*2.7,(fy-.32)*3.4)<.28*Math.sqrt(L)?1:0;acc+=Math.max(seam,top,lace);g+=fy}
     const q=(py*N+px)*4;img[q]=Math.round(acc/SS/SS*255);img[q+1]=Math.round(g/SS/SS*255);let ch=0,rg=0;for(let sy=0;sy<SS;sy++)for(let sx=0;sx<SS;sx++){const u=(px+(sx+.5)/SS)/N,v=(py+(sy+.5)/SS)/N,gy=v*2,rw_=Math.floor(gy),fy=gy-rw_,gx=u+(rw_%2)*.5,fx=gx-Math.floor(gx),ar=Math.abs(fy-.78*(1-4*(fx-.5)*(fx-.5)));ch+=1-sm(.05,.13,ar);const th=Math.abs((u-.5)*6.2832);rg+=1-sm(.2,.32,th*v*14)}/* 사슬 무늬(B, 두 줄 한 벌)와 능선 먹선(A, 가로=둘레각 -π~π, 세로=반지름 0~14) */
     img[q+2]=Math.round(ch/SS/SS*255);img[q+3]=Math.round(rg/SS/SS*255)}
    gl.bindTexture(gl.TEXTURE_2D,ltex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,N,N,0,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT)})();
   eprog=gl.createProgram();gl.attachShader(eprog,sh(gl.VERTEX_SHADER,EVS));gl.attachShader(eprog,sh(gl.FRAGMENT_SHADER,EFS));gl.linkProgram(eprog);if(!gl.getProgramParameter(eprog,gl.LINK_STATUS))throw gl.getProgramInfoLog(eprog);qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);ok=true}catch(e){console.warn(e);ok=false}return ok}
 const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
 /* 금나라 투구 말린 드림 단 수(1~4): 3D 월드2 표시줄의 '드림 단' 슬라이더(opt.drimStep) */
 const dstep=()=>{try{return clamp(Math.round(W3HOST.opt.drimStep??2),1,4)}catch(e){return 2}},dshape=()=>1/* 드림 모양은 강시모 하나(기본·빵모 제거, 빵모 1단은 투구 '조관'으로) */,dgap=()=>{try{return clamp(+(W3HOST.opt.drimGap??.55),0,2)}catch(e){return .55}},ddir=()=>2/* 쌓임 방향은 아래로 벌어짐 하나(위로 벌어짐·좁아짐 제거) */,dov=()=>{try{return clamp(+(W3HOST.opt.drimOv??3),0,6)}catch(e){return 3}};/* 강시모 전용: dgap 층간 단차(층마다 옮겨 앉는 반지름), ddir 쌓이는 방향(0 위로 벌어짐, 1 위로 좁아짐, 2 아래로 벌어짐: 각 층이 아래가 넓다), dov 층 겹침(윗층이 아랫층 위로 포개지는 높이) *//* 드림 모양: 0 기본 1 강시모 2 빵모 */
 // 장식표(AT): 부품마다 한 줄(32칸)이 굽기 재료. 종류(첫 칸): 0 통(겹판 줄·리벳·테두리), 1 몸통(허리 줄·목둘레·띠·버클·멜빵·가슴 능선), 2 구(리벳). 줄마다 그림판 칸이 배정되고, 꼭짓점 꼬리표는 w=10+종류+3·칸 번호
 const decRow=a=>{while(a.length<32)a.push(0);DEC.push(...a);const pl=atPlan();return(a[0]===3?0:a[0])+3*pl.cells[pl.cells.length-1]};/* 종류 3(무늬)은 셰이더에서 통과 같은 (둘레각, 세로) 좌표로 읽는다 *//* 반환값 = 종류 + 3·칸 번호(꼭짓점 꼬리표 w = 10 + 반환값) */
 /* 장식 그림판: 가로 8칸(칸 = 256²). 통·구는 한 칸, 몸통은 2×2칸(앞 그림 256×512, 뒤 그림 256×512). 윗절반 = 바탕색(알파 곱한 RGB, A), 아랫절반 = (R 먹선, G 가슴 능선). 같은 줄 내용은 구운 그림을 다시 쓴다 */
 const ATC=256,ATW=2048,ATP=1,AT_TILES=new Map();
 function atPlan(){const used=new Set(),cells=[];let rows=1;for(let r=0;r<DEC.length/32;r++){const k=DEC[r*32]===1?2:1;let c=-1;for(let y=0;c<0;y++)for(let x=0;x+k<=8&&c<0;x++){let ok=true;for(let j=0;j<k&&ok;j++)for(let i=0;i<k;i++)if(used.has((y+j)*8+x+i)){ok=false;break}if(ok){c=y*8+x;for(let j=0;j<k;j++)for(let i=0;i<k;i++)used.add((y+j)*8+x+i);rows=Math.max(rows,y+k)}}cells.push(c)}return{cells,rows}}
 const smS=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)},stp=(e,x)=>x>=e?1:0;
 /* 타일 한 장 굽기: ev(u,v,o)가 칸 안 위치(0~1)마다 o=[R,G,B,바탕알파,먹선,능선]을 채운다. 한 칸을 2×2로 잘게 봐서 가장자리를 부드럽게 한다 */
 function atFill(w,h,ev){const A=new Uint8Array(w*h*4),B=new Uint8Array(w*h*4),o=[0,0,0,0,0,0],SS=2,s2=1/(SS*SS);for(let j=0;j<h;j++)for(let i=0;i<w;i++){let r=0,g=0,b=0,a=0,k=0,rg=0;for(let sy=0;sy<SS;sy++)for(let sx=0;sx<SS;sx++){ev((i+(sx+.5)/SS)/w,(j+(sy+.5)/SS)/h,o);a+=o[3];r+=o[0]*o[3];g+=o[1]*o[3];b+=o[2]*o[3];k+=o[4];rg+=o[5]}const q=(j*w+i)*4;A[q]=Math.round(r*s2*255);A[q+1]=Math.round(g*s2*255);A[q+2]=Math.round(b*s2*255);A[q+3]=Math.round(a*s2*255);B[q]=Math.round(k*s2*255);B[q+1]=Math.round(rg*s2*255);B[q+3]=255}return{w,h,A,B}}
 /* 통: 가로 = 둘레각 -π~π, 세로 = (축 위치 s + 1) ÷ (길이 + 2). 겹판 줄(최대 5)·리벳(앞쪽 원)·윗단 테두리 */
 function bakeTube(r){const L=r[1],hw=r[2],rr=r[3],lm=[r[4],r[5],r[6],r[7],r[8]],ry=r[9],ra=r[10],rb=r[11],rw=r[12];return[{x:0,y:0,...atFill(ATC,ATC,(u,v,o)=>{const th=(u-.5)*6.2832,s=v*(L+2*ATP)-ATP;let m=0;if(hw>=.001)for(const q of lm)if(hw>=Math.abs(s-q*L)){m=1;break}if(rr>=.001&&Math.abs(th)<=1.5708){const t=Math.min(1,Math.max(0,s/L)),rad=ra+(rb-ra)*t,dx=s-ry*L,dy=th*rad;if(dx*dx+dy*dy<=rr*rr)m=1}o[0]=r[13];o[1]=r[14];o[2]=r[15];o[3]=rw>=.001&&rw>=Math.abs(s-.02*L)?1:0;o[4]=m;o[5]=0})}]}
 /* 몸통: 가로 = 좌우 -Yh~Yh, 세로 = 높이 H0-7 ~ uS+2. 앞 그림(f>0)과 뒤 그림(f<0)을 따로 굽는다 */
 function bakeTorso(r){const H0=r[1],T0w=r[3],uA=H0-7,uB=r[2]+2,Yh=r[31],mk=front=>atFill(ATC,2*ATC,(a,b,o)=>{const y=(a*2-1)*Yh,u=uA+b*(uB-uA),ay=Math.abs(y),f=front?1:-1;
   const wl=Math.max(stp(Math.abs(u-H0-3),T0w),stp(Math.abs(u-H0+1),T0w),stp(Math.abs(u-H0+5),T0w))*stp(.001,T0w),nk=stp(r[4],u)*stp(u,r[5]),bl=stp(r[6],u)*stp(u,r[7]),bi=stp(r[6]+.2,u)*stp(u,r[7]-.2),bkx=stp(ay,r[24])*stp(r[25],u)*stp(u,r[26])*stp(0,f);
   const be=stp(r[6]-.2,u)*stp(u,r[7]+.2)*(1-bi)*(1-stp(ay,r[24]+.2)*stp(0,f)),bki=stp(ay,r[24]-.2)*stp(r[25]+.2,u)*stp(u,r[26]-.2),bke=stp(ay,r[24]+.2)*stp(r[25]-.2,u)*stp(u,r[26]+.2)*stp(0,f)*(1-bki);
   const k=(u-r[22])/(r[23]-r[22]),ys=r[20]+(r[21]-r[20])*k,sm=Math.max(stp(Math.abs(y-ys),r[19]),stp(Math.abs(y+ys),r[19]))*stp(0,k)*stp(k,1)*stp(f,0);
   let c=8,al=nk;if(sm){c=16;al=1}if(bl){c=12;al=1}if(bkx){c=8;al=1}o[0]=r[c];o[1]=r[c+1];o[2]=r[c+2];o[3]=al;o[4]=Math.max(wl,be,bke);o[5]=stp(r[28],u)*stp(u,r[29])*stp(0,f)*(1-smS(.3,.45,ay))*r[30]});return[{x:0,y:0,...mk(true)},{x:ATC,y:0,...mk(false)}]}
 /* 구: 앞 반구를 (y,z)로 편 그림. 리벳 방향에서 각도 안쪽이 먹선 */
 function bakeBall(r){const c=r[1];return[{x:0,y:0,...atFill(ATC,ATC,(u,v,o)=>{const y=u*2-1,z=v*2-1,q=y*y+z*z;o[0]=o[1]=o[2]=o[3]=o[5]=0;o[4]=q<=1&&Math.sqrt(1-q)>=c&&c>=.001?1:0})}]}
 /* 무늬(종류 3): 가로 = 무늬 한 칸(둘레각으로 반복, 0~1), 세로 = 표면 위→아래(0~1). r[1] 무늬(1 징 2 찰갑 3 비늘 4 쇠사슬 5 겹판), r[2] 세로 줄 수, r[3] 칸 가로÷줄 높이, r[4..6] 징 색, r[7] 선 굵기, r[8..9] 겹판 줄(세로 범위), r[10] 겹판 리벳 세로 위치 */
 function bakePattern(r){const T=r[1],NR=Math.max(1,r[2]),AS=r[3]||1,lw=r[7]||.06;return[{x:0,y:0,...atFill(ATC,ATC,(u,v,o)=>{o[0]=o[1]=o[2]=o[3]=o[4]=o[5]=0;const hR=1/AS,Y=v*NR,row=Math.floor(Y),y=v*NR*hR;
   if(T===1){const off=(row%2)*.5,dx=u-.5-off-Math.round(u-.5-off),dy=(Y-row-.5)*hR,d=Math.hypot(dx,dy),R_=.24;if(d<R_){o[0]=r[4];o[1]=r[5];o[2]=r[6];o[3]=1;if(d>R_-lw*.8)o[4]=1}}/* 징: 칸마다 금빛 못머리(줄마다 반 칸 엇갈림) */
   else if(T===2){const fy=Y-row,off=(row%2)*.25,fx=(u+off)*2,dx=fx-Math.round(fx);if(fy<lw*AS*.9||Math.abs(dx)<lw)o[4]=1;const hx=((u+off)*2-Math.floor((u+off)*2))-.5;if(Math.hypot(hx*.5,(fy-.22)*hR)<.045)o[4]=1}/* 찰갑: 줄마다 작은 미늘 두 장, 줄 경계·미늘 사이 선, 미늘 위쪽 끈 구멍 */
   else if(T===3){const Rr=.56;let win=-1,wd=0;for(let rr=Math.floor(y/hR)-2;rr<=Math.floor(y/hR)+1;rr++){if(rr<-1)continue;const yc=rr*hR,xo=(((rr%2)+2)%2)*.5,dx=u-xo-Math.round(u-xo),dy=y-yc;if(dy>=-.02&&dx*dx+dy*dy<=Rr*Rr){win=rr;wd=Math.hypot(dx,dy);break}}if(win>=-1&&wd>Rr-lw)o[4]=1}/* 비늘(어린갑): 아래가 둥근 비늘, 위 줄이 아래 줄을 덮는다 */
   else if(T===4){const Rg=.3;for(let rr=row-1;rr<=row+1;rr++){const yc=(rr+.5)*hR,xo=(((rr%2)+2)%2)*.5,dx=u-xo-Math.round(u-xo),d=Math.hypot(dx,y-yc);if(Math.abs(d-Rg)<lw*.9){o[4]=1;break}}}/* 쇠사슬: 엇갈린 고리 */
   else if(T===6){const fr=Y-row;if(fr>=r[8]&&fr<=r[9])o[4]=1;if(Math.hypot(u-.5,(fr-r[10])*hR)<.06)o[4]=1}/* 이어 붙인 겹판: 겹판마다 아랫단 줄 + 리벳 */
   else if(T===5){if(v>=r[8]&&v<=r[9])o[4]=1;const dx=u-.5,dy=(v-r[10])*hR*NR;if(Math.hypot(dx,dy)<.07)o[4]=1}})}]}/* 겹판: 아랫단 줄 + 리벳 */
 function atBake(){const pl=atPlan(),n=DEC.length/32;if(!n)return{W:1,TH:2,data:new Uint8Array(8)};const W=ATW,H=pl.rows*ATC,TH=2*H,data=new Uint8Array(W*TH*4);
  for(let r=0;r<n;r++){const row=DEC.slice(r*32,r*32+32),key=row.join(',');let ts=AT_TILES.get(key);if(!ts){ts=row[0]===1?bakeTorso(row):row[0]===0?bakeTube(row):row[0]===3?bakePattern(row):bakeBall(row);if(AT_TILES.size>60)AT_TILES.clear();AT_TILES.set(key,ts)}
   const ox=pl.cells[r]%8*ATC,oy=Math.floor(pl.cells[r]/8)*ATC;for(const t of ts)for(let y=0;y<t.h;y++){const a=((oy+t.y+y)*W+ox+t.x)*4,b=((H+oy+t.y+y)*W+ox+t.x)*4;data.set(t.A.subarray(y*t.w*4,(y+1)*t.w*4),a);data.set(t.B.subarray(y*t.w*4,(y+1)*t.w*4),b)}}
  return{W,TH,data}}
 /* 장식 그림판 올리기: 줄 내용이 그대로면 다시 굽거나 올리지 않는다 */
 function decUp(o){const key=DEC.join(',');if(o&&o.key===key)return o;const b=atBake(),tex=o&&o.tex||gl.createTexture();gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,b.W,b.TH,0,gl.RGBA,gl.UNSIGNED_BYTE,b.data);for(const k of[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR);for(const k of[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0);return{tex,key,W:b.W,TH:b.TH}}
 let ATO=null;// 예전 방식(매 프레임 겉면 생성) 전용 장식표
 // ─ 메쉬 쌓기: 꼭짓점마다 위치·법선·색 ─
 let V=[],IDS=[],HLA=[],SKA=[],DEC=[],HLOC=null,PID=0,TAG=2;
 /* 폴리곤(삼각형) 부위별 집계: pmk는 지금까지 쌓은 삼각형 중 직전 표시 뒤의 몫을 부위 이름으로 적고, pmx는 안쪽에서 따로 센 몫(얼굴·머리카락)을 적는다 */
 let PF=[],PFL=0;/* 그림 탭 부위 조각용 표시(2D 조각 이름: thigh·shin·foot·uarm·farm·hand·head·torso, 빈 이름 = 나머지) */let PM=[],PMX={},PML=0;const pmk=n=>{if(MODE!=='mesh')return;const c=V.length/27;PM.push([n,c-PML]);PML=c},pfk=t=>{if(MODE!=='mesh')return;const c=V.length/27;PF.push([t,c-PFL]);PFL=c},pmx=(n,v0)=>{if(MODE==='mesh')PMX[n]=(PMX[n]||0)+(V.length-v0)/27};
 function pmDone(){const x=Object.entries(PMX),sub=x.reduce((a,b)=>a+b[1],0),out=PM.map(([n,c])=>n==='목·머리·투구'?['목·투구·장식',c-sub]:[n,c]);for(const[n,c]of x)out.push([n,c]);return out.filter(e=>e[1]>0)}
 // 뼈: MODE 'mesh'(겉면 만들기, 기본자세 뼈를 REST에) / 'bone'(뼈만 계산해 CUR에). 뼈 = 틀(원점 + 축 3개). 부품마다 자기 틀을 뼈로 등록하므로 기본자세→지금자세 변환이 부품 모양과 정확히 맞는다
 let MODE='mesh',BI=0,CB=0,REST=[],CUR=[];const bone=F=>{(MODE==='mesh'?REST:CUR).push(F);return BI++};
 const push=(p,n,c,pb,bb,w)=>{V.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0]+2*TAG,c[1],c[2]);IDS.push(PID);if(pb)SKA.push(pb[0],pb[1],pb[2],CB,bb,w);else SKA.push(p[0],p[1],p[2],CB,CB,0);if(HLOC&&HLOC.fn)HLA.push(...HLOC.fn(p));else if(HLOC){const d=vsub(p,HLOC.o);HLA.push(vdot(d,HLOC.f)/HLOC.s,vdot(d,HLOC.r)/HLOC.s,vdot(d,HLOC.u)/HLOC.s,HLOC.w||1)}else HLA.push(0,0,0,0)};
 // 단면 고리들을 이어 겉면을 만든다. rings: 같은 개수의 점을 가진 고리 배열(아래→위). 법선은 이웃 점으로 구하고, 중심 밖을 향하게 맞춘다
 function loft(R,col,o={}){if(MODE==='bone')return;const pid0=PID;if(o.pid!=null)PID=o.pid;else if(!o.samePid)PID++;const C=hex(col),n=R[0].length,m=R.length,closed=o.open?false:true,N=[];if(m<2)return;
  const cen=R.map(r=>{let x=0,y=0,z=0;for(const p of r){x+=p[0];y+=p[1];z+=p[2]}return[x/r.length,y/r.length,z/r.length]});
  for(let j=0;j<m;j++){N.push([]);for(let i=0;i<n;i++){const a=R[j][(i+1)%n],b=R[j][(i-1+n)%n],u=R[Math.min(m-1,j+1)][i],d=R[Math.max(0,j-1)][i];let nn=norm(vcross(vsub(a,b),vsub(u,d)));if(!isFinite(nn[0]))nn=norm(vsub(R[j][i],cen[j]));if(vdot(nn,vsub(R[j][i],o.center||cen[j]))<0)nn=vmul(nn,-1);N[j].push(nn)}}
  const tw=o.two,Q=(j,i)=>tw?push(R[j][i],N[j][i],C,tw.pb(j,i),tw.bb,tw.ti?tw.ti(j,i):tw.t(j)):push(R[j][i],N[j][i],C);/* ti: 꼭짓점마다 섞는 비율 */// 자락: 둘째 뼈 쪽 끝점 pb와 비율 t를 함께 적는다
  const I=closed?n:n-1;for(let j=0;j<m-1;j++)for(let i=0;i<I;i++){const i2=(i+1)%n;if(o.skip&&o.skip(j,i,i2))continue;Q(j,i);Q(j,i2);Q(j+1,i2);Q(j,i);Q(j+1,i2);Q(j+1,i)}
  const cap=(r,c_,dn)=>{for(let i=0;i<n;i++){const a=r[i],b=r[(i+1)%n],nn=dn;push(c_,nn,C);push(a,nn,C);push(b,nn,C)}};
  if(o.capB){const dn=norm(vsub(cen[0],cen[1]));cap(R[0],cen[0],dn)}if(o.capT){const dn=norm(vsub(cen[m-1],cen[m-2]));cap(R[m-1],cen[m-1],dn)}if(o.pid!=null)PID=pid0}
 // 두 점 사이 통(양 끝 둥근 마개). 2D tube와 같은 반지름
 function tube(A,B,ra,rb,col,cap=.5,o2={}){const ax=vsub(B,A),L0=vlen(ax),L=Math.max(L0,1e-3),z=L0<1e-3?[0,0,1]:vmul(ax,1/L);let u=vcross(z,[0,0,1]);if(vlen(u)<.2)u=vcross(z,[1,0,0]);u=norm(u);const w=norm(vcross(z,u)),rmx=Math.max(ra,rb),n=rmx>3?16:rmx>1.2?10:6,R=[];/* 둘레 칸 수: 굵기에 맞춰 */
  const b=bone([A,u,w,vmul(z,L)]);if(MODE==='bone'||L0<1e-3)return;const cb0=CB;CB=b;// 통 자신의 틀(끝점·방향·길이)이 뼈
  const ring=(c,r)=>{const a=[];for(let i=0;i<n;i++){const t=i/n*6.2832;a.push(vadd(c,vadd(vmul(u,Math.cos(t)*r),vmul(w,Math.sin(t)*r))))}return a};
  for(let k=2;k>=1;k--){const t=k/2*Math.PI/2;R.push(ring(vsub(A,vmul(z,Math.sin(t)*ra*cap)),Math.max(.05,Math.cos(t)*ra)))}R.push(ring(A,ra));R.push(ring(B,rb));for(let k=1;k<=2;k++){const t=k/2*Math.PI/2;R.push(ring(vadd(B,vmul(z,Math.sin(t)*rb*cap)),Math.max(.05,Math.cos(t)*rb)))}
  const hl0=HLOC;if(o2.ridge&&!HLOC){const d=(v=>{let q=vsub(v,vmul(z,vdot(v,z)));return vlen(q)<.1?u:norm(q)})(o2.ridge===true?[1,0,0]:o2.ridge),ex=norm(vcross(z,d));HLOC={fn:p_=>{const q=vsub(p_,A),tt=vdot(q,z)/L,v=vsub(q,vmul(z,vdot(q,z))),l=vlen(v)||1;return[vdot(v,d)/l,vdot(v,ex)/l,lerp(ra,rb,clamp(tt,0,1)),4]}}}// 능선: 둘레 각도를 적어 셰이더가 선을 긋는다
  /* 2D 판의 갑옷줄(겹판 줄 lames·리벳 rivets·윗단 테두리 rim): 폴리곤 없이 장식표 줄 + 통 국소 좌표(둘레 cos·sin, 축 위치 0~1)로 셰이더가 그린다 */
  {const lam=AW>0?o2.lames||[]:[],riv=AW>0?o2.rivets||[]:[];if(MODE==='mesh'&&!HLOC&&(lam.length||riv.length||o2.rim)){const dd=(v=>{const q=vsub(v,vmul(z,vdot(v,z)));return vlen(q)<.1?u:norm(q)})(o2.out||[1,0,0]),ex=norm(vcross(z,dd)),lm=[...lam,-9,-9,-9,-9,-9].slice(0,5),rc=o2.rim?hex(o2.rim):[0,0,0],
    row=decRow([0,L,lam.length?.22*AW:0,riv.length?(o2.rr||.55)*Math.sqrt(AW):0, lm[0],lm[1],lm[2],lm[3], lm[4],riv.length?riv[0]:-9,ra,rb, o2.rim?.45:-1,rc[0],rc[1],rc[2]]);
   HLOC={fn:p_=>{const q=vsub(p_,A),sz=vdot(q,z),v=vsub(q,vmul(z,sz)),l=vlen(v)||1;return[vdot(v,dd)/l,vdot(v,ex)/l,(sz+ATP)/(L+2*ATP),10+row]}}}}
  loft(R,col,{center:vlerp(A,B,.5),pid:o2.pid});
  HLOC=hl0;
  CB=cb0}
 const INKL='#1d1a17';let AW=1,HWK=1;// AW: 갑옷줄 배율(투구의 숨구멍·리벳·능선·띠 포함), HWK: 머리 배율(투구 눈 틈 + 얼굴의 눈·눈썹·입). 0이면 눈만 0.7배로 남김
 // 타원체(국소 좌표 함수 X로 세상에 놓음). 위도 범위 la0~la1(라디안)
 function ellip(X,Rf,Rr,Ru,cf,cu,col,la0=-Math.PI/2,la1=Math.PI/2,o={}){const X0=X([0,0,0]),b=bone([X0,vsub(X([1,0,0]),X0),vsub(X([0,1,0]),X0),vsub(X([0,0,1]),X0)]);if(MODE==='bone')return;const cb0=CB;CB=b;const RM=Math.max(Rf,Rr,Ru),n=RM<1.6?10:RM<3.2?14:20,m=RM<1.6?5:RM<3.2?7:10,R=[];/* 작은 타원체는 낮은 해상도 */for(let j=0;j<=m;j++){const p=lerp(la0,la1,j/m),a=[];for(let i=0;i<n;i++){const t=i/n*6.2832;a.push(X([cf+Math.cos(p)*Math.cos(t)*Rf,Math.cos(p)*Math.sin(t)*Rr,cu+Math.sin(p)*Ru]))}R.push(a)}loft(R,col,{center:X([cf,0,cu]),capB:o.capB,capT:o.capT,pid:o.pid});CB=cb0}
 // 몸통 틀: 높이 H0 원점, 위로 1 올라갈 때 앞으로 lean/60 밀림(2D bend와 같은 식)
 const torsoF=K=>{const H0=K.H0,s_=K.bend(H0+1)-K.bend(H0);return[[K.bend(H0),0,H0],[1,0,0],[0,1,0],[s_,0,1]]};
 // ─ 뼈대(2D와 같은 식) ─
 function skel(m,pose,down){const bd=m.body||{},bT=bd.torso??1,LM=bd.limb??1,bL=bd.leg??1,bS=bd.shoulder??1,hs=bd.head??1,bN=bd.neck??1,legDrop=48-48*bL;
  const feet=pose.feet||KDEF.feet,crouch=pose.crouch??0,elb=pose.elb??0,nod=pose.nod??0,L=pose.lean+(down||0)*14,drop=(down||0)*30+crouch,H0=48*bL-drop,bend=u=>L*(u-H0)/60,T=u=>[bend(u),0,u],uS=H0+40;
  const legs=[0,1].map(i=>{const side=i?1:-1,Hp=[0,side*9*bT,H0],F=(()=>{const f=[feet[i][0],feet[i][1],0],dx=f[0]-Hp[0],dy=f[1]-Hp[1],dh=Math.hypot(dx,dy),mx=Math.sqrt(Math.max(0,(50.8*bL)**2-H0*H0));return dh>mx&&dh>1e-6?[Hp[0]+dx*mx/dh,Hp[1]+dy*mx/dh,0]:f})(),/* 발 고리를 다리 길이보다 멀리 끌어도 다리가 늘어나지 않게: 닿는 거리까지만 */K=ik2(Hp,F,25.5*bL,25.5*bL,[1,side*.45,0]),toe=norm([1,side*.32,0]),A=vadd(F,[0,0,5]);return{side,Hp,K,F,A,toe}});
  const d=norm(pose.d);let hd=[pose.h[0]+L*(pose.h[2]-48)/60,pose.h[1],pose.h[2]-drop-legDrop],off=vsub(hd,vmul(d,10));
  {const RCH=44.8,SH=[[bend(uS),-16*bS,uS],[bend(uS),16*bS,uS]],ex=(S,P)=>{const v=vsub(P,S),l=vlen(v);return l>RCH?vmul(v,(RCH-l)/l):[0,0,0]};for(let it=0;it<4;it++){const e1=ex(SH[1],hd);hd=vadd(hd,e1);off=vadd(off,e1);const e0=ex(SH[0],off);hd=vadd(hd,e0);off=vadd(off,e0)}}/* 손 고리를 팔 길이보다 멀리 끌어도 팔이 늘어나지 않게: 두 손(칼 쥔 간격 그대로)을 어깨에서 닿는 거리 안으로 함께 당긴다 */
  const arms=[0,1].map(i=>{const side=i?1:-1,S=[bend(uS),side*16*bS,uS],Hn=i?hd:off,E=ik2(S,Hn,23,22,[-.35,side*(.7+elb*.8),-.8]);return{side,S,E,Hn}});
  const nA=nod*.6,hyw=pose.hyaw??0,hrl=pose.hroll??0,head=vadd(T(uS+18*bN),[nod*5,0,-nod*3]),cP=Math.cos(nA),sP=Math.sin(nA),cY=Math.cos(hyw),sY=Math.sin(hyw),cR=Math.cos(hrl),sR=Math.sin(hrl);
  const HR=v=>{const[f,r,u]=v,r1=r*cR-u*sR,u1=r*sR+u*cR,f2=f*cP+u1*sP,u2=u1*cP-f*sP;return[f2*cY-r1*sY,f2*sY+r1*cY,u2]},HL=v=>vadd(head,HR(vmul(v,hs)));
  // 몸통 단면(2D lv와 같은 식)
  const lv=u=>{const w0=H0+6,top=uS+2;if(u>=w0){const k=clamp((u-w0)/(top-w0),0,1);return{rw:lerp(11.5,15.5,k)*bT,df:lerp(7.8,10.4,Math.sin(k*Math.PI*.5))*bT,fo:bend(u)+k*1.5}}const k=clamp((w0-u)/14,0,1);return{rw:lerp(11.5,14.2,k)*bT,df:lerp(7.8,9.8,k)*bT,fo:bend(w0)}};
  const ring=(u,g=0,n=20)=>{const v=lv(u),a=[];for(let k=0;k<n;k++){const t=k/n*6.2832;a.push([v.fo+Math.cos(t)*(v.df+g),Math.sin(t)*(v.rw+g),u])}return a};
  return{bT,LM,bL,hs,legs,arms,hd,d,off,H0,uS,T,bend,head,HR,HL,lv,ring}}
 // ─ 판금 기사 ─
 function knight(m,K,pose){const p=m.pal||{},st=p.steel||'#d9dee0',cl=p.cloth||'#3d4f9a',tr=p.trim||'#c9a24a',le=p.leather||'#5a3e2a',sk=p.skin||'#e8d2b4',gl_=p.glove||st,beltC=p.belt||le,{bT,LM,bL,H0,uS,T,ring,HL,hs}=K,psz=m.psize||1;
  // 몸통: 골반 아래(H0-7)부터 어깨(uS+2)까지 2D와 같은 단면을 촘촘히 이어 붙인다
  const BT_=bone(torsoF(K));CB=BT_;const MS=MODE==='mesh';// 몸통 뼈: 숙임(lean)만큼 위로 갈수록 앞으로 밀리는 기울임(전단) + 웅크림 높이
  const JT=m.armor==='jin'?1:2;TAG=JT;// 금나라 미늘 갑옷이면 미늘 무늬
  if(MS){const TR=[];for(let k=0;k<=12;k++){const u=lerp(H0-7,uS+2,k/12);TR.push(ring(u))}const th=hex(tr),bc=hex(beltC),lc=hex(le),trow=decRow([1,H0,uS,m.armor!=='jin'&&AW>0?.22*AW:-1, uS+.5,uS+1.7,H0+4.6,H0+7.4, th[0],th[1],th[2],0, bc[0],bc[1],bc[2],0, lc[0],lc[1],lc[2],.75, 8,5,uS-1,H0+12, 2.5,H0+4,H0+8,1, H0+7,uS-2,1,15.6*bT]);/* 허리 겹판 줄·목둘레 테두리·허리띠·버클·등 멜빵·가슴 능선: 폴리곤 없이 몸통 셰이더가 그림 */
   HLOC={fn:q=>[q[1]/(15.6*bT),(q[2]-(H0-7))/(uS+2-(H0-7)),q[0]-K.lv(q[2]).fo,10+trow]};loft(TR,st,{capB:true,capT:true});HLOC=null}TAG=2;pmk('몸통');pfk('torso');const TPID=PID;// 몸통 부품 번호(몸통 위 줄들은 같은 번호 → 경계선 없음)
  // 가슴 능선·허리 겹판 줄·목둘레 테두리·등 멜빵은 몸통 셰이더(장식표)가 그린다
  // 허리띠: 허리 단면을 조금 키운 띠
  // 허리띠·앞 버클도 몸통 셰이더(장식표)가 그린다
  // 앞자락(겉옷 위 허리에서 늘어지는 천): 윗단은 몸통 뼈, 아랫단은 자락 단 뼈. 밑단에 술(먹선)
  const TON=!!m.tonlet&&m.armor!=='jin';/* 톤렛(강철 치마): 겉옷 치마·앞자락·허벅지 판 대신 */
  if(m.coat&&m.armor!=='jin'&&m.flap&&!TON){const v=K.lv(H0+4),tp=[v.fo+v.df+2.2,0,H0+4],bt=[tp[0]+2,0,H0-34*bL],BF=bone([bt,[1,0,0],[0,1,0],[0,0,1]]),fc=p.flap||'#8a1c1c';
   if(MS){const TP=[],BTm=[];for(let k=0;k<=6;k++){const y=lerp(-1,1,k/6);TP.push(vadd(tp,[.2*(1-y*y),y*4.6*bT,0]));BTm.push(vadd(bt,[.2*(1-y*y),y*5.2*bT,0]))}const RR=[0,1,2,3].map(j=>TP.map((q,k)=>vlerp(q,BTm[k],j/3)));CB=BT_;loft(RR,fc,{open:true,center:T(H0-10),two:{pb:(j,i)=>BTm[i],bb:BF,t:j=>j/3}})}
   for(let k=0;k<=6;k++){const q=vadd(bt,[.3,lerp(-5.2,5.2,k/6)*bT,0]);TAG=3;tube(q,vadd(q,[0,0,-3]),.22,.22,INKL,.5);TAG=2}CB=BT_}
  // 칼집(허리 → 뒤 또는 앞으로): 통 + 끝 장식(쇠 마구리)
  if(m.sheath){const fr=m.sheathDir==='front',top=fr?[K.bend(H0+5)+8*bT,12*bT,H0+5]:[K.bend(H0+5)+5,-13*bT,H0+5],tip=fr?[24*bT,-14*bT,H0-34*bL]:[-16,-17*bT,H0-38];tube(top,tip,2.6,2.1,p.sheath||le,.9);tube(vlerp(top,tip,.92),tip,2.25,1.75,st,.9);CB=BT_}
  // 겉옷: 가슴 아래~허리 몸판 + 무릎까지 치마
  const COAT=m.coat&&m.armor!=='jin';if(COAT){const kc=vlerp(K.legs[0].K,K.legs[1].K,.5),spread=Math.abs(K.legs[0].K[1]-K.legs[1].K[1])/2,hemU=Math.max(H0-22,kc[2]+6);
   const sY=Math.max(15*bT,spread+6*LM),BHm=bone([[kc[0]*.55,0,hemU],[1,0,0],[0,sY,0],[0,0,1]]);// 치마 단 뼈: 무릎 위치·다리 벌림을 따라가는 단
   if(MS){loft([ring(H0+6,1.4),ring(H0+14,1.4),ring(H0+22,1.4),ring(uS-5,1.3)],cl,{capT:true});
   const W=ring(H0+6,1.7),HM=[],SK=[W];for(let k=0;k<20;k++){const q=k/20*6.2832;HM.push([kc[0]*.55+Math.cos(q)*12*bT,Math.sin(q)*sY,hemU+Math.sin(k*1.7)*.8])}for(let j=1;j<=4;j++)SK.push(W.map((w,k)=>vlerp(w,HM[k],j/4)));
   if(!TON)loft(SK,cl,{open:false,center:T(H0-8),two:{pa:(j,i)=>W[i],pb:(j,i)=>HM[i],bb:BHm,t:j=>j/4}})}}
  if(m.armor==='jin'){TAG=1;const kc=vlerp(K.legs[0].K,K.legs[1].K,.5),spread=Math.abs(K.legs[0].K[1]-K.legs[1].K[1])/2,hemU=Math.max(H0-36*bL,kc[2]-9),sY=Math.max(16.5*bT,spread+7*LM),BHm=bone([[kc[0]*.5,0,hemU],[1,0,0],[0,sY,0],[0,0,1]]);
   if(MS){const W=ring(H0+6,1.2),HM=[],SK=[W];for(let k=0;k<20;k++){const q=k/20*6.2832;HM.push([kc[0]*.5+Math.cos(q)*13.5*bT,Math.sin(q)*sY,hemU])}for(let j=1;j<=4;j++)SK.push(W.map((w,k)=>vlerp(w,HM[k],j/4)));loft(SK,st,{center:T(H0-8),two:{pa:(j,i)=>W[i],pb:(j,i)=>HM[i],bb:BHm,t:j=>j/4}})}TAG=2}
  if(TON){CB=BT_;/* 톤렛: 허리에서 무릎까지 종 모양으로 벌어지는 가로 겹판 6장. 위 판의 밑단이 아래 판 윗단을 덮는다. 밑단은 띠 색 테. 자락처럼 두 뼈(허리·치마 단) 사이를 섞어 다리를 따라간다 */
   const kc=vlerp(K.legs[0].K,K.legs[1].K,.5),spread=Math.abs(K.legs[0].K[1]-K.legs[1].K[1])/2,hemU=Math.max(H0-29*bL,kc[2]+1),sY=Math.max(17*bT,spread+8*LM),BHm=bone([[kc[0]*.5,0,hemU],[1,0,0],[0,sY,0],[0,0,1]]);
   if(MS){const N_=28,u0=H0+5,W0=ring(u0,1.4,N_),c0=K.lv(u0).fo,HM=[];for(let k=0;k<N_;k++){const q=k/N_*6.2832;HM.push([kc[0]*.5+Math.cos(q)*15.5*bT,Math.sin(q)*sY,hemU])}
    const sh=t=>1-(1-t)**1.8,PT=(t,g,du=0)=>{const s=sh(t),cx=lerp(c0,kc[0]*.5,s);return W0.map((w,i)=>{const x=lerp(w[0],HM[i][0],s),y=lerp(w[1],HM[i][1],s),d=norm([x-cx,y,0]);return[x+d[0]*g,y+d[1]*g,lerp(u0,hemU,t)+du]})},NL=6;
    TAG=2;for(let k=0;k<NL;k++){const t0=Math.max(0,k/NL-(k?.05:0)),t1=(k+1)/NL,TS=[t0,(t0+t1)/2,t1,t1];loft([PT(t0,0),PT(TS[1],.3),PT(t1,.75),PT(t1,.3,.45)],st,{two:{pb:(j,i)=>HM[i],bb:BHm,t:j=>TS[j]}})}
    loft([PT(1,.55,.75),PT(1,1.15,.2),PT(1,1.05,-.45),PT(1,.4,-.35)],tr,{two:{pb:(j,i)=>HM[i],bb:BHm,t:()=>1}})}TAG=2}/* 밑단 테 */
  // 다리: 2D와 같은 반지름의 통
  pmk('겉옷·치마·칼집·자락');pfk('');for(const g of K.legs){const out=[.6,g.side*.8,0];tube(g.Hp,g.K,8*LM,6.4*LM,st,.5,{lames:[.12,.26],rivets:[.5],out});if(!m.coat&&m.armor!=='jin'&&!TON)tube(vadd(g.Hp,[2,g.side,7]),vlerp(g.Hp,g.K,.5),9.8*LM,8.8*LM,st,.5,{lames:[.28,.52,.76],rivets:[.15],out});
   pfk('thigh');tube(vadd(g.K,[0,0,6]),vadd(g.K,[1,0,3.5]),6.6*LM,6.4*LM,st,.2,{rivets:[.52],out:[1,0,0],rr:.6});/* 무릎 리벳: 장식표 */tube(vadd(g.K,[.5,0,-4]),vadd(g.K,[0,0,-7]),6*LM,5.8*LM,st,.2);
   tube(g.K,g.A,5.8*LM,4.1*LM,st,.5,{ridge:true});pfk('shin');tube(vadd(g.A,[0,0,-1]),vadd(vadd(g.F,vmul(g.toe,14*Math.sqrt(LM))),[0,0,1.6]),4.6*LM,2.8*LM,st,.8,{lames:[.22,.36,.5,.64,.78]});pfk('foot')}
  // 팔
  pmk('다리');for(const g of K.arms){const{side,S,E,Hn}=g,ud=norm(vsub(E,S)),fw=norm(vsub(Hn,E)),wr=vsub(Hn,vmul(fw,3.5));const JA=m.armor==='jin',out=[.5,side*.85,0];TAG=JT;tube(S,E,5.6*LM,5*LM,st,.5,JA?{}:{lames:[.55],rivets:[.3],out});TAG=2;pfk('uarm');tube(E,wr,5*LM,4.3*LM,st,.5,{ridge:[.6,0,.6]});
   {const R_=5.6*LM,on_=norm(out),e1=norm(vcross(on_,[0,0,1])),e2=vcross(on_,e1),h0_=HLOC;/* 팔꿈치 리벳: 구 위 점(장식표 종류 2) */if(MS&&AW>0){const row=decRow([2,Math.cos(Math.min(1.4,.55*Math.sqrt(AW)/R_)),0,0]);HLOC={fn:p_=>{const q=vsub(p_,E);return[vdot(q,on_),vdot(q,e1),vdot(q,e2),10+row]}}}ellip(v=>vadd(E,v),R_,R_,R_,0,0,st);HLOC=h0_}ellip(v=>vadd(vadd(E,vmul([0,side,0],4.8*LM)),vadd(v,[-3,0,0])),4.4*LM,2.2*LM,4.4*LM,0,0,st);
   pfk('farm');tube(vsub(wr,vmul(fw,1.5)),vadd(wr,vmul(fw,3.5)),4.8*LM,6.8*LM,gl_,.15,{lames:[.6]});ellip(v=>vadd(Hn,v),4.8*LM,4.8*LM,4.8*LM,0,0,gl_);pfk('hand');
   const LGP=!JA&&(m.paul==='large'||m.paul==='body'),top=LGP?vadd(S,vmul(ud,2.5*psz)):vadd(S,[0,side*2,3]),lo=vadd(S,vmul(ud,LGP?13.5*psz:12*psz));TAG=JT;if(JA||m.paul!=='body')tube(top,lo,LGP?6.6*psz:8.6*psz,LGP?6.2*psz:7.6*psz,st,.95,JA?{rim:tr}:{lames:LGP?[.25,.45,.65,.85]:[.34,.52,.7,.86],rivets:[.15],out,rim:tr});/* 대형 폴드런이면 팔 통은 위팔 겹판만(작게), 몸통 폴드런이면 위팔 겹판 통 없음 */TAG=2;
   if(!JA&&m.paul==='haute')boxF(vadd(S,[.5,-side*3.5,4+4.25*psz]),[5.5,0,0],[0,.6,0],[0,0,4.25*psz],st);
   const SBn=!JA&&(m.paul==='large'||m.paul==='body')?(()=>{const D0=norm([.05,side*.25,-1]),uh=norm(vlerp(D0,ud,.5)),r0=[0,side,0];let e2=vsub(r0,vmul(uh,vdot(r0,uh)));if(vlen(e2)<.25){const f0=[1,0,0];e2=vsub(f0,vmul(uh,vdot(f0,uh)))}e2=norm(e2);return bone([S,uh,e2,vcross(uh,e2)])})():-1;/* 어깨 뼈: 위팔이 도는 각도의 절반만 따라 도는 틀(두 모드 모두 등록). 겹판이 팔을 반쯤 따라가 크게 일그러지지 않게 */
   if(!JA&&(m.paul==='large'||m.paul==='body')&&MS){const BODY=m.paul==='body';/* BODY: 몸통 폴드런(가슴·등까지 덮음) *//* 대형 폴드런: 어깨 위를 앞뒤로 감싸는 겹판 5장. 안쪽(목 쪽) 겹판일수록 앞(겨드랑이)·뒤(어깨뼈)로 길게 내려오고, 바깥 겹판은 팔 위를 덮는다. 몸통 뼈를 따라간다 */
    const cb0=CB;CB=BT_;const C=vadd(S,[-.5,-side*3,-2]),Rx=BODY?Math.max(12.5*psz,(K.lv(uS-8).df+(m.coat?3.2:1.8))/.72):12.5*psz,Ry=9.8*psz,Rz=BODY?11.5*psz:9.3*psz,/* 몸통 폴드런: 앞뒤 반지름을 몸통 두께(겉옷이면 그 바깥)보다 크게 */NL=BODY?6:4,PM=1.3,PMIN=BODY?-.8:-.15,TS=30,HUG=(q,k,ex)=>{if(!BODY)return q;const lv_=K.lv(Math.min(q[2],uS+1)),cx=lv_.fo,nx=(q[0]-cx)/lv_.df,ny=q[1]/lv_.rw,sn=Math.hypot(nx,ny)||1,g=(m.coat?1.6:.35)+.45*k+ex*12,t=1+g/lv_.df,w=clamp((lv_.rw-Math.abs(q[1]))/5,0,1)*clamp((uS+3-q[2])/4,0,1)*clamp((Math.abs(q[0]-cx)-2)/4,0,1);let r=q;if(w>0){const f=lerp(1,t/sn,w);r=[cx+(q[0]-cx)*f,q[1]*f,q[2]]}const wz=lerp(.7,1,clamp((uS+10-r[2])/7,0,1)),xm=(lv_.df+g+1.2)*Math.sqrt(Math.max(.04,1-(r[1]/(lv_.rw+12))**2)),dx_=r[0]-cx;if(wz>0&&Math.abs(dx_)>xm)r=[cx+Math.sign(dx_)*lerp(Math.abs(dx_),xm,wz),r[1],r[2]];return r},/* 몸통 폭 바깥(겨드랑이 쪽)도 앞뒤로는 몸통 윤곽을 넓힌 타원 안까지만 *//* 몸통 폴드런: 몸통 위에 놓인 부분은 몸통 단면(타원)에서 겹판마다 정해진 간격만큼만 띄워 몸에 붙인다(팔 쪽·어깨 위는 그대로) */P_=(th,ph,sc)=>{const d=[Math.cos(ph)*Math.sin(th),side*Math.sin(ph),Math.cos(ph)*Math.cos(th)];return vadd(C,[Rx*sc*d[0],Ry*sc*d[1],Rz*sc*d[2]])},TM=ph=>BODY?lerp(2.45,1.05,(ph-PMIN)/(PM-PMIN)):lerp(1.95,1.05,Math.max(0,ph)/PM);/* 몸통 폴드런은 목 쪽(안쪽) 겹판이 가슴·등 가운데로 넘어오고 아래로 길게 내려온다 *//* TM: 앞뒤로 내려오는 각도(안쪽일수록 큼) */
    const LREP=BODY?7:5,lrow=decRow([3,5,1,BODY?1.6:1.3,0,0,0,.06,BODY?.6:0,BODY?.68:.07,BODY?.47:.2]),/* 보이는 가장자리에 줄: 몸통 폴드런은 위 겹판이 아래를 덮어 아랫단, 대형은 바깥 겹판이 안쪽을 덮어 윗단 */VR=BODY?[0,.33,.66,1]:[0,.33,.66,.8,1],hl0=HLOC;let lp=null;HLOC={fn:p_=>p_._h?[p_._h[0],p_._h[1],p_._h[2],10+lrow]:[0,0,0,0]};const TAGH=(q,f,ri)=>{q._h=[Math.cos(6.2832*LREP*f),Math.sin(6.2832*LREP*f),VR[ri]];return q};/* 겹판 줄·리벳은 무늬 그림판(종류 3, 겹판)에 구워 읽고, 겹판은 모두 같은 부품 번호(경계선 없음) */
    if(!BODY)for(let k=0;k<NL;k++){const p0=lerp(PMIN,PM,k/NL)-(k?.06:0),p1=lerp(PMIN,PM,(k+1)/NL)+.14,sc=1+.055*k,R=[];for(const[ri,[ph,ex]]of[[p0,0],[(p0+p1)/2,.012],[p1,.02],[p1,-.012],[p0,-.02]].entries()){/* 겹판 두께: 바깥면 → 아랫단 → 안쪽면(겹판 사이로 안이 비어 보이지 않게) */const tm=TM(ph),row=[];for(let i=0;i<=TS;i++){const th=lerp(-tm*1.08,tm,i/TS);row.push(TAGH(HUG(P_(th,ph,sc+ex),k,ex),i/TS,ri))}R.push(row)}const wk=.35+.55*k/(NL-1);loft(R,st,{open:true,center:C,pid:lp,two:{pb:(j,i)=>R[j][i],bb:SBn,t:()=>wk}});if(lp==null)lp=PID}/* 바깥(팔 쪽) 겹판일수록 어깨를 많이 따라간다 */
    else{/* 몸통 폴드런(참고 사진 그대로): 가로 겹판 9장이 어깨를 감싸며 위에서 아래로 층층이 쌓인다. 겹판은 몸통 단면을 따라 앞 가운데 쪽에서 어깨·팔 바깥을 돌아 등 가운데 쪽까지 이어지고, 위 겹판일수록 목 가까이(안쪽)까지 오며 아래로 갈수록 바깥으로 물러나 가슴에 V자 앞자락을 만든다. 위 겹판의 아랫단이 아래 겹판 윗단을 덮는다 */
     const NB=5,z0=uS+4.5,z1=uS-15,hb=(z0-z1)/NB,gb=m.coat?2.6:1.3,RWF=Math.abs(S[1])+5.5*psz,zt=uS-1,NA=48,
      sh=z=>z>zt?Math.sqrt(Math.max(.12,1-((z-zt)/6.5)**2)):1,PB=(z,a,g)=>{const lv_=K.lv(Math.min(z,uS+1)),s_=sh(z),Xr=lerp(lv_.df*.72,lv_.df,s_)+g,Yr=lerp(8.5*bT,RWF,s_)+g;return[lv_.fo+Xr*Math.cos(a),side*Yr*Math.sin(a),z]};
     {/* 한 장의 면: 위(z0)에서 아래(z1)까지 줄을 이어 하나의 겹판 껍질로 만든다(겹판 사이가 갈라지지 않음). 겹판마다 아랫단이 살짝 들려 층이 보이고, 겹판 줄·리벳은 무늬 그림판(종류 3, 무늬 6)에서 읽는다. V자 앞자락은 줄마다 시작 각도를 바꿔 매끈한 사선이 된다 */
      const RZ=[];for(let k=0;k<NB;k++)for(const f of[0,.45,.9])RZ.push([(k+f)/NB,f]);RZ.push([1,1]);const prw=decRow([3,6,NB,3.2,0,0,0,.06,.9,.985,.5]),rows=[];
      for(const[q,f]of RZ){const z=lerp(z0,z1,q),qa=Math.min(q,.999),af=lerp(.1,.78,qa*qa),ab=lerp(.14,.85,qa*qa),g=gb+.7*(1-q)+.22*f,r_=[];for(let i=0;i<=NA;i++){const a=lerp(af,Math.PI-ab,i/NA),p_=PB(z,a,g);p_._h=[Math.cos(2*LREP*a),Math.sin(2*LREP*a),q];/* 리벳은 둘레각 기준(줄마다 같은 자리, 세로로 맞춤) */r_.push(p_)}rows.push(r_)}
      {const r_=rows[rows.length-1].map((p_,i)=>{const z=z1,qa=.999,a=lerp(lerp(.1,.78,qa*qa),Math.PI-lerp(.14,.85,qa*qa),i/NA),w_=PB(z,a,gb+.02);w_._h=p_._h;return w_});rows.push(r_)}/* 아랫단 두께(안쪽으로 접힌 면) */
      const h1=HLOC;HLOC={fn:p_=>p_._h?[p_._h[0],p_._h[1],p_._h[2],10+prw]:[0,0,0,0]};
      loft(rows,st,{open:true,center:[K.lv(uS-6).fo,side*4,uS-6],two:{pb:(j,i)=>rows[j][i],bb:SBn,t:()=>0,ti:(j,i)=>{const p_=rows[j][i],rw0=K.lv(Math.min(p_[2],uS+1)).rw;return .9*clamp((Math.abs(p_[1])-rw0*.55)/(RWF-rw0*.55),0,1)*clamp((p_[2]-(uS-16))/8,.35,1)}}});HLOC=h1}}
    HLOC=hl0;/* 몸통 폴드런: 가슴·등 가운데 쪽은 몸통을, 어깨·팔 바깥 쪽은 어깨를 따라간다 */
    CB=cb0}pfk('uarm')}// 오트 피스: 어깨 안쪽에 세운 관판(목 옆 방패판)// 어깨판: 겹판 줄·리벳·윗단 테두리
  // 목·머리
  pmk('팔·어깨·장갑');tube(T(uS),vadd(K.head,[0,0,-8*hs]),5,4.4,st);
  helm(m,K,st,sk,tr,p);HLOC=null;pmk('목·머리·투구');pfk('head')}
 function helm(m,K,st,sk,tr,p){let FONCE=0;/* 얼굴은 한 번만(두건 + 투구일 때 겹치지 않게) */const HOODK=m.hood!=null?m.hood:(m.hwear==='coif'||m.hwear==='hood'?m.hwear:'');/* 두건(사슬 coif·천 hood)은 투구와 따로 쓴다. 예전 값(hwear가 두건)도 읽는다 */const{HL,hs}=K,kit=m.helm==='kit'&&m.hkit?m.hkit:null,HW=m.hwear||'helm',F=kit?kit.form:m.helm,up=kit?kit.visor==='up':(m.helm==='open'||m.helm==='peakup'),HC=kit&&kit.colors&&kit.colors.main?kit.colors.main:st,TC=kit&&kit.colors&&kit.colors.trim?kit.colors.trim:tr,INKC='#1d1a17';
  const HB=bone([K.head,vmul(K.HR([1,0,0]),hs),vmul(K.HR([0,1,0]),hs),vmul(K.HR([0,0,1]),hs)]);CB=HB;let FDZ=0;// 머리 뼈(투구·머리카락·두건이 따라감). FDZ: 두건 위에 얼굴을 얹을 때 앞으로 띄우는 양
  // 얼굴 창: 앞쪽(x>2)에서 가운데 (u=c) 높이·폭 타원 안의 면은 만들지 않는다 → 안의 머리·얼굴이 보인다
  const inWin=(w,...P)=>{const c=P.reduce((a,b)=>vadd(a,b),[0,0,0]).map(v=>v/P.length);return c[0]>2&&(c[1]/w.r)**2+((c[2]-w.c)/w.h)**2<1};
  const skull=()=>ellip(HL,9.2,8.2,10.8,-.6,-1.2,sk),eyes=()=>{for(const sd of[-1,1])ellip(HL,.9,.9,.9,7.4,sd*3.1,INKC,undefined,undefined,{})};
  // 눈은 얼굴 앞면 위 작은 공
  const eye=(sd)=>ellip(v=>HL(vadd(v,[7.6,sd*3.1,0])),.8,.8,.8,0,0,INKC);
  const FPb=(r,u,dz=0)=>{const x=Math.sqrt(Math.max(0,1-(r/8.2)**2-((u+1.2)/10.8)**2));return HL([-.6+x*9.2+dz+FDZ,r,u])},hairC=p.hair||'#3b3732',brow=hexMix(hairC,INKC,.45),ey=m.fEye||'dot',nz=m.fNose||'small',mo=m.fMouth||'line',bd=m.beard||'none';
  const line_=(pts,r,col,pid)=>{for(let i=0;i<pts.length-1;i++)tube(pts[i],pts[i+1],r,r,col,.9,pid!=null?{pid}:{})};
  const FK=HWK,EKf=FK>0?Math.sqrt(FK):.84,lineF=(pts,r,col)=>{if(FK>0)line_(pts,r*FK,col,SPID);else line_(pts,.001,col,SPID)};let SPID=null;// 머리 배율: 눈은 0이어도 남기고, 눈썹·입은 0이면 사라짐(뼈 수는 그대로)
  // 눈·눈썹·입은 머리통과 같은 부품 번호 → 경계선 굵기와 상관없이 머리 배율로만 보임
  const PATCH=!!m.patch||m.fEye==='patch'||m.fEye==='round';// 외눈 안대(따로 고르는 옵션; 예전에 눈 모양으로 고른 안대도 안대로)
  // 얼굴: 머리통·귀·눈동자·코 볼록면·덥수룩한 수염만 입체로 만들고, 눈썹·입·코 선·X 눈·가는 눈·안대와 끈·콧수염·턱수염·수염선은 얼굴 그림(머리 국소 좌표 텍스처)에 그린다
  const HF={o:K.head,s:hs,f:K.HR([1,0,0]),r:K.HR([0,1,0]),u:K.HR([0,0,1]),w:3};
  const face=(full=true,noEars=false)=>{if(FONCE)return;FONCE=1;const pv_=V.length,t0=TAG,h0=HLOC;HLOC=HF;TAG=0;skull();SPID=PID;const fp={pid:SPID};
   for(const sd of[-1,1]){if(noEars)break;ellip(v=>HL(vadd([-1,sd*8.75,-1.6],v)),1.85,.5,2.8,0,0,INKC,undefined,undefined,fp);ellip(v=>HL(vadd([-1,sd*9.05,-1.6],v)),1.5,.65,2.4,0,0,sk,undefined,undefined,fp)}/* 귀: 머리카락 밖으로(2D도 머리카락 위에 귀) */
   /* 눈동자는 얼굴 그림(텍스처)에 그린다 */
   if(full){const NZ={small:[1.2,.9,1.6],hook:[1.8,.9,2],broad:[1.2,1.6,1.5]}[nz]||[1.2,.9,1.6];ellip(v=>vadd(FPb(0,-3.6,-.4),v),NZ[0],NZ[1],NZ[2],0,0,sk,undefined,undefined,fp);
    if(bd==='full')ellip(HL,9.6,8.8,11.2,-.4,-1.6,hairC,-Math.PI/2,-.35,{capT:true,pid:SPID})}
   if(MODE==='mesh')faceTex({ey,ball:['dot','fierce','xround','patch','round'].includes(ey),nz,mo,bd,PATCH,hairC,brow,hair:m.hair||'short',full});TAG=t0;HLOC=h0;pmx('얼굴(머리통·귀·코)',pv_)};
  // 머리 모양(2D hairSet과 같은 선): 앞은 이마 위, 옆은 귀 높이, 뒤는 목덜미까지. 긴 머리=등 뒤로 늘어진 자락, 묶은 머리=뒤통수 위 상투, 민머리=없음
  const hairCap=fill=>{if(HOODK)return;/* 두건 속 머리카락은 그리지 않는다 */const hs_=m.hair||'short';if(hs_==='bald')return;const pv_=V.length,h0=HLOC;HLOC=HF;
   if(MODE==='mesh'){const Rf=10.3,Rr=9.3,Ru=12,cf=-.9,cu=-1,n=24,zt=x=>fill?(x>.45?.42:x>.25?lerp(-.5,.42,(x-.25)/.2):-.5):(x>.45?.42:x>.25?lerp(-.05,.42,(x-.25)/.2):x>-.1?-.05:x>-.3?lerp(-.5,-.05,(x+.3)/.2):-.5),R=[];/* fill: 귀 자리 계단(구멍)을 없애고 옆도 뒤처럼 낮게 */
    for(let j=0;j<=7;j++){const a=[];for(let i=0;i<n;i++){const t=i/n*6.2832,la=lerp(Math.asin(zt(Math.cos(t))),Math.PI/2,j/7);a.push(HL([cf+Rf*Math.cos(la)*Math.cos(t),Rr*Math.cos(la)*Math.sin(t),cu+Ru*Math.sin(la)]))}R.push(a)}loft(R,hairC,{center:HL([cf,0,cu])});
    if(hs_==='long'){const top=[],bot=[];for(let k=0;k<12;k++){const t=Math.PI*.55+k/11*Math.PI*.9;top.push(HL([-.6+Math.cos(t)*10.4,Math.sin(t)*9.6,.8]));bot.push(HL([-.6+Math.cos(t)*11.4-1,Math.sin(t)*10.8,-18.2]))}const mid=top.map((q,k)=>vlerp(q,bot[k],.5));loft([top,mid,bot],hairC,{open:true,center:HL([-1,0,-6])})}}
   if(hs_==='knot')ellip(v=>HL(vadd(v,[-4,0,11.8])),3.4,3.4,3.4,0,0,hairC);HLOC=h0;pmx('머리카락',pv_)};
  // 사슬 두건(coif)·천 두건(hood): 머리를 감싸고 어깨까지 퍼지는 자락, 앞은 얼굴이 드러나는 타원 구멍(살색 면 + 얼굴)
  const hood=(chain,wh)=>{const col=chain?st:(p.cloth||'#6d675e'),G=chain?1.6:2.2,Rf=9.2+G,Rr=8.2+G,Ru=10.8+G,cf=-1,cu=-.8;
   face(true,true);// 안의 머리·얼굴(귀는 두건 속)
   if(MODE==='mesh'){const n=40,LR=[];{const a=[];for(let i=0;i<n;i++){const t=i/n*6.2832;a.push([Math.cos(t)*10.5-1.5,Math.sin(t)*11.5,-14.2])}LR.push(a)}
    for(let j=0;j<=14;j++){const la=lerp(-.6,Math.PI/2,j/14),a=[];for(let i=0;i<n;i++){const t=i/n*6.2832;a.push([cf+Rf*Math.cos(la)*Math.cos(t),Rr*Math.cos(la)*Math.sin(t),cu+Ru*Math.sin(la)])}LR.push(a)}
    const h0=HLOC;HLOC=chain?{o:K.head,s:hs,f:K.HR([1,0,0]),r:K.HR([0,1,0]),u:K.HR([0,0,1]),w:2}:null;// 사슬 두건: 머리 국소 좌표로 사슬 무늬
    const W_={r:5.9,c:-4,h:7.6};loft(LR.map(r=>r.map(HL)),col,{center:HL([cf,0,cu]),skip:(j,i,i2)=>inWin(W_,LR[j][i],LR[j][i2],LR[j+1][i],LR[j+1][i2])});HLOC=h0}
   if(!chain&&!wh)tube(HL([-9.5,0,6]),HL([-12.5,0,HE_CU+8]),2.6,.4,col,.6)};/* 투구를 함께 쓰면 꼬리는 뺀다 */// 천 두건 꼬리
  const HE_CU=-1.2;
  if(HW!=='helm'){if(HOODK){hood(HOODK==='coif');return}face();hairCap();return}if(HOODK)hood(HOODK==='coif',true);/* 두건을 쓴 채로 투구를 덧쓴다 */
  const HAX={o:K.head,s:hs,f:K.HR([1,0,0]),r:K.HR([0,1,0]),u:K.HR([0,0,1])};HLOC=HAX;CB=HB;if(MODE==='mesh')helmTex(m,kit,F,up,HC,TC,sk);// 머리 뼈: 투구 몸체·면갑처럼 머리 좌표로 만든 면이 따라간다
  const _face=face,_deco0=null;
  // 위도 고리로 정의된 2D 투구 몸체를 그대로 로프트: 아래 목둘레 고리 → 위도 고리들 → 정수리
  const NL=32,shell=(Rf,Rr,Ru,cf,bot,top,col,win)=>{if(MODE==='bone')return;const LR=[];if(bot)LR.push(Array.from({length:NL},(_,i)=>{const t=i/NL*6.2832;return[Math.cos(t)*bot[0]+bot[2],Math.sin(t)*bot[1],bot[3]]}));for(let la=-6;la<=9;la++){const pp=la/9*1.2,r=Math.cos(pp),a=[];for(let lo=0;lo<NL;lo++){const t=lo/NL*6.2832;a.push([Math.cos(t)*Rf*r+cf,Math.sin(t)*Rr*r,Math.sin(pp)*Ru])}LR.push(a)}if(top)LR.push(Array.from({length:NL},(_,i)=>vadd(top[0],[Math.cos(i/NL*6.2832)*.3,Math.sin(i/NL*6.2832)*.3,0])));/* 정수리 꼭짓점 */
   loft(LR.map(r=>r.map(HL)),col,{capT:true,capB:!bot,center:HL([cf,0,0]),skip:win?(j,i,i2)=>inWin(win,LR[j][i],LR[j][i2],LR[j+1][i],LR[j+1][i2]):null})};
  const WINF={r:6.4,c:-3,h:6.6};// 2D 열린 얼굴 판과 같은 범위(폭 ±6, 이마 3 ~ 턱 -9)
  const raisedVisor=col=>{if(MODE!=='mesh')return;const lo=[],hi=[];for(let k=0;k<=12;k++){const r=lerp(-9.5,9.5,k/12),q=1-(r/9.5)**2;lo.push(HL([2+4*q,r,10+3*q]));hi.push(HL([-2+5*q,r*.95,12+4*q]))}loft([lo,lo.map((q,i)=>vlerp(q,hi[i],.5)),hi],col,{open:true,center:HL([-2,0,8])})};// 면갑 올림: 이마 위로 젖힌 면갑판(2D와 같은 점)
  const neckRing=(Rf,Rr,cf,u)=>{const a=[];for(let lo=0;lo<20;lo++){const t=lo/20*6.2832;a.push([Math.cos(t)*Rf+cf,Math.sin(t)*Rr,u])}return a};
  // 면갑 면: 2D vzFeat와 같은 식(가운데 앞 돌출 fcu(u), 옆으로 갈수록 r² 만큼 들어감)
  const visor=(nodes,kE,su,col,bu=[])=>{if(MODE==='bone')return;const fcu=u=>{if(u>=nodes[0][0])return nodes[0][1];for(let i=0;i<nodes.length-1;i++){const[a0,f0]=nodes[i],[a1,f1]=nodes[i+1];if(u<=a0&&u>=a1)return lerp(f0,f1,(a0-u)/(a0-a1))}return nodes[nodes.length-1][1]},kk=u=>Math.max(0,(fcu(u)-kE)/81);
   const R=[],RS=[];const u0=nodes[nodes.length-1][0],u1=nodes[0][0];for(let j=0;j<=10;j++){const u=lerp(u0,u1,j/10),a=[];for(let i=0;i<=12;i++){const r=lerp(-9,9,i/12);a.push(HL([fcu(u)-kk(u)*r*r+.3,r,u]))}R.push(a)}loft(R,col,{open:true,center:HL([0,0,0])});
  };
  // ─ 부품 조립 투구(2D kitDraw와 같은 치수): 정수리 모양·폭·높이, 얼굴(트인·코가리개·볼가리개·면갑·가면), 챙, 목가리개, 띠·리벳·세로띠, 장식 ─
  /* 금나라 드림 내림(눈구멍 뚫린 찰갑 드림): BU=사발 밑동 높이. 금나라 투구·조립 몸체 '금나라 투구' 얼굴이 같이 쓴다 */
  const jinDrim=(HC,BU)=>{if(MODE==='mesh'){const n=40,US=[BU+.5,...[2.6,1.7,.8,-.1,-1,-1.9,-2.8,-4.2,-6,-9,-12,-14.5].filter(u=>u<BU+.3)],/* 밑동이 낮으면 그보다 높은 고리는 뺀다 */rad=u=>u>=-6?[lerp(11,10.4,(u+6)/(BU+6.5)),lerp(10.6,9.8,(u+6)/(BU+6.5))]:[lerp(14.2,11,(u+14.5)/8.5),lerp(13.8,10.6,(u+14.5)/8.5)];      const LR=US.slice().reverse().map(u=>{const[a,b]=rad(u);return Array.from({length:n},(_,i)=>{const t=i/n*6.2832;return[Math.cos(t)*a-1,Math.sin(t)*b,u]})});      const eyeWin=(...P)=>{const c=P.reduce((a,b)=>vadd(a,b),[0,0,0]).map(v=>v/P.length);return c[0]>2&&Math.abs(c[1])<6.6&&c[2]<3.15&&c[2]>-.6-1*(1-(c[1]/6.6)**2)};      TAG=1;loft(LR.map(r=>r.map(HL)),HC,{center:HL([-1,0,-5]),skip:(j,i,i2)=>eyeWin(LR[j][i],LR[j][i2],LR[j+1][i],LR[j+1][i2])});TAG=2}};
  /* 클로즈 면갑 공용(클로즈헬름·조립 몸체 '클로즈' 얼굴): SR(u)=사발 반지름[앞,옆]. 턱가리개(목~코 밑, 앞 능선)와 뾰족한 면갑(옆 회전축에 걸림, 올리면 축을 중심으로 젖힘)·눈 틈·회전축 리벳. win은 사발에서 비울 앞쪽 */
  const cTab=(T_,u)=>{if(u>=T_[0][0])return T_[0][1];for(let i=0;i<T_.length-1;i++){const[a0,v0]=T_[i],[a1,v1]=T_[i+1];if(u<=a0&&u>=a1)return lerp(v0,v1,(a0-u)/(a0-a1))}return T_[T_.length-1][1]};
  const closeVis=(CF,RF,RR,SR,up_,col,pk=1,slt='single',brt='none')=>{/* pk: 바이저 튀어나옴 배율 */const TV=.6*Math.PI,ee=t=>(Math.abs(t)/TV)**2,SP=(t,u,g,pr)=>{const[a,b]=SR(u);return[CF+(a+g)*Math.cos(t)+pr*Math.max(0,1-Math.abs(t)/1.25)**2,(b+g)*Math.sin(t),u]},vTop=t=>lerp(7.5,2.6,ee(t)),PIV=[CF+(SR(1.5)[0]+1.3)*Math.cos(TV),0,1.5],th=up_?1:0,PV=[[7.5,1],[3.5,4.6],[.8,8],[-2.2,8.2]],
    ROT=q=>{if(!th)return q;const df=q[0]-PIV[0],du=q[2]-PIV[2],c=Math.cos(th),s_=Math.sin(th);return[PIV[0]+df*c-du*s_,q[1],PIV[2]+df*s_+du*c]};
   const win=(...P)=>{const c=P.reduce((a,b)=>vadd(a,b),[0,0,0]).map(v=>v/P.length),tt=Math.atan2(c[1]/RR,(c[0]-CF)/RF);return Math.abs(tt)<TV*.9&&c[2]<vTop(tt)-1.2};
   const draw=()=>{const h0=HLOC,t0=TAG;HLOC=null;TAG=2;let bp_=null,vp_=null;/* 턱가리개·면갑 부품 번호: 눈 틈·숨구멍을 같은 번호로 그려 구분선이 생기지 않게 */if(MODE==='mesh'){const NT=24,cols=k=>lerp(-TV,TV,k/NT);
     {const PB=[[1.5,7],[-1.5,7],[-4.5,6.8],[-8,4.2],[-11,1.6],[-13.5,.6]],R=[];for(let v=0;v<=8;v++){const a=[];for(let k=0;k<=NT;k++){const t=cols(k),u=lerp(-13.5,lerp(-1.5,1.5,ee(t)),v/8);a.push(HL(SP(t,u,.6,cTab(PB,u)*pk)))}R.push(a)}loft(R,col,{open:true,center:HL([CF,0,-6])});bp_=PID}/* 턱가리개 */
     {const R=[];for(let v=0;v<=8;v++){const a=[];for(let k=0;k<=NT;k++){const t=cols(k),u=lerp(lerp(-2.2,1.2,ee(t)),vTop(t),v/8);a.push(HL(ROT(SP(t,u,1.3,cTab(PV,u)*pk))))}R.push(a)}loft(R,col,{open:true,center:HL(ROT([CF,0,2]))});vp_=PID}}/* 면갑: 눈 높이 아래가 새 부리처럼 튀어나옴 */
    TAG=3;{const VSP=(t,u)=>HL(ROT(SP(t,u,1.4,cTab(PV,u)*pk))),row=(u,t0,t1,n)=>{const sl=[];for(let k=0;k<=n;k++)sl.push(VSP(lerp(t0,t1,k/n),u));for(let i=0;i<sl.length-1;i++)tube(sl[i],sl[i+1],.42,.42,INKL,.9,{pid:vp_})};
     if(slt==='single'||slt==='cross')row(.9,-.55,.55,8);else if(slt==='double'){row(1.6,-.55,.55,8);row(.2,-.5,.5,8)}else if(slt==='eyes'){row(.9,-.55,-.13,3);row(.9,.13,.55,3)}if(slt==='cross')tube(VSP(0,.9),VSP(0,-1.6),.42,.42,INKL,.9,{pid:vp_});/* 눈 틈: 한 줄·두 줄·T자·두 눈·없음(면갑과 함께 젖혀진다) */
     const BSP=(t,u,g)=>HL(SP(t,u,g,cTab([[1.5,7],[-1.5,7],[-4.5,6.8],[-8,4.2],[-11,1.6],[-13.5,.6]],u)*pk)),hole=(t,u)=>tube(BSP(t,u,.55),BSP(t,u,.75),.34,.34,INKL,.9,{pid:bp_});
     for(const sd of[-1,1]){if(brt==='holes'){for(const a of[.4,.6,.8])for(const u of[-3.6,-5.4,-7.2])hole(sd*a,u)}else if(brt==='slots'||(brt==='oneside'&&sd===1)){for(const a of[.38,.54,.7,.86])tube(BSP(sd*a,-3.2,.7),BSP(sd*a,-7.4,.7),.28,.28,INKL,.9,{pid:bp_})}}}TAG=2;/* 숨구멍(턱가리개): 구멍·세로 틈·한쪽 틈·없음 */
    const hi=hexMix(col,'#ffffff',.4);for(const sd of[-1,1]){const P_=[PIV[0],sd*(SR(1.5)[1]+1.6),PIV[2]];ellip(v=>HL(vadd(v,P_)),1.1,.5,1.1,0,0,hi)}HLOC=h0;TAG=t0};/* 회전축 리벳 */
   return{win,draw}};
  const kitParts=()=>{const K_=kit,C=K_.colors||{},main=C.main||st,trim=C.trim||tr,acc=C.accent||p.plume||p.flap||'#8a1c1c',hi=hexMix(main,'#ffffff',.45),w=K_.width||1,h=K_.height||1,flat=K_.dome==='flat',FX0=K_.face,LJ=FX0==='jin'||FX0==='jin2',LNC=FX0==='nasal'||FX0==='cheek',FX=LJ||LNC?'open':FX0,NAS=K_.nasal!=null?(K_.nasal==='1'||K_.nasal===true):FX0==='nasal',CHK=K_.cheek!=null?(K_.cheek==='1'||K_.cheek===true):FX0==='cheek',FMK=K_.fmask==='1'||K_.fmask===true,/* 투구가리개(코·볼가리개)는 투구(얼굴 가리개)와 따로, 둘 다 고를 수 있다. 예전 얼굴 가리개 코·볼가리개는 트인 얼굴 + 그 가리개로 읽는다 */VUP=K_.visor==='up',DR=K_.drim?K_.drim:(LJ?FX0:'none'),DUP=(K_.dvis||(LJ?K_.visor:'down'))==='up',JINF=DR==='jin'||DR==='jin2',/* 드림(DR·DUP)은 얼굴 가리개와 따로 고른다. 예전에 얼굴 가리개로 고른 금나라 드림은 드림으로 읽는다 */VZF=FX==='peak'||FX==='closed',open=['open','nasal','cheek','kettle','joguan'].includes(FX)||JINF||(['visor','mask'].includes(FX)&&VUP);/* 얼굴 가리개에 다른 투구의 앞부분: 뾰족·면갑 투구(면갑), 챙 투구(챙), 금나라 투구·투구2(드림), 조관(챙 벽) */
   const G={Rf:12*w,Rr:10.8*w,Ru:(K_.dome==='tall'?15:12.5)*h,cf:-1,cu:K_.dome==='tall'?1:0},fmax=K_.face==='mask'?9.4*w:1e9,cb=K_.brim&&K_.brim!=='none'?4.5:1.5,S0=open?{Rf:G.Rf*.94,Rr:G.Rr*.94,Ru:G.Ru*.9,cf:-1,cu:cb}:G;
   const top=flat?S0.cu+13*h-(open?cb:0)*.4:S0.cu+S0.Ru,apex=K_.dome==='pointed'?top+6*h:K_.dome==='onion'?top+3.5*h:top,base=open?cb:-12,MS_=MODE==='mesh',N=24;
   const kU=u=>flat?1:Math.sqrt(Math.max(0,1-((u-S0.cu)/S0.Ru)**2)),ringAt=(u,g=0)=>{const k=kU(u),a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HL([Math.min(S0.cf+Math.cos(t)*(S0.Rf*k+g),fmax),Math.sin(t)*(S0.Rr*k+g),u]))}return a};
   const xA=(r,u)=>flat?Math.sqrt(Math.max(0,1-(r/S0.Rr)**2)):Math.sqrt(Math.max(0,1-(r/S0.Rr)**2-((u-S0.cu)/S0.Ru)**2)),SP=(r,u,d=0)=>HL([Math.min(S0.cf+xA(r,u)*S0.Rf,fmax)+d,r,u]);
   const crestK=K_.crest||'none';if(crestK==='horns')decoIn(top-6);
   let FD=0;const face1=(a,b)=>{if(FD)return;FD=1;face(a,b)};/* 얼굴은 한 번만 */if(JINF)face1(true,!(DR==='jin'&&DUP));else if(open){face1();hairCapless()}
   const CLS=K_.face==='close',CVp=CLS?closeVis(S0.cf,S0.Rf,S0.Rr,u=>[Math.max(S0.Rf*kU(u),9.8*w),Math.max(S0.Rr*kU(u),9.4*w)],K_.visor==='up',main,K_.vpro??1,K_.slit||'single',K_.breaths||'none'):null;if(CLS&&K_.visor==='up')face1(true,true);/* 클로즈 얼굴: 클로즈헬름의 면갑·턱가리개를 이 몸체에 건다. 면갑을 올리면 얼굴이 보인다 */
   // 목가리개(아벤테일): 위 고리 → 아래로 퍼지는 고리. 얼굴이 트였으면 앞을 비운다. 사슬은 회갈색, 판이면 겹판 줄 2개
   const guard=(nk,lm,sm,op,u0,g0)=>{if(nk==='none')return;const bot_=nk==='long'||nk==='mail'?-17:-13.5,spread=(nk==='flared'?4.5:nk==='mail'?2.5:1.2)*sm,col=nk==='mail'?hexMix(main,'#8d877c',.35):main,bot=u0+(bot_-u0)*lm;/* 길이·퍼짐 배율 */
    if(MS_){const ring2=(u,k)=>{const a=[];for(let i=0;i<=N;i++){const t=op?lerp(.35*Math.PI,1.65*Math.PI,i/N):i/N*6.2832;a.push(HL([Math.cos(t)*(G.Rf-1+g0+spread*k)-1.5,Math.sin(t)*(G.Rr-.4+g0+spread*k),u]))}return op?a:a.slice(0,N)};
     {const h0=HLOC;if(nk==='mail')HLOC={...HLOC,w:2};loft([ring2(bot,1),ring2((bot+u0)/2,.5),ring2(u0,0)],col,{open:op,center:HL([-1.5,0,(bot+u0)/2])});HLOC=h0}/* 사슬: 사슬 무늬 */
     if(nk!=='mail'&&AW>0){TAG=3;for(const u of[bot+3.2,bot+6]){const k=(u-bot)/(u0-bot),rr_=[ring2(u-.2*AW,1-k),ring2(u+.2*AW,1-k)];loft(rr_.map(r_=>r_.map(q=>vadd(HL([-1.5,0,u]),vmul(vsub(q,HL([-1.5,0,u])),1.012)))),INKL,{open:op,samePid:true})}TAG=2}}};
   guard(K_.neck||'none',K_.nlen??1,K_.nspr??1,false,-7,0);/* 목드림: 서양 기사 목가리개(목을 한 바퀴 감쌈) */
   {const nk=K_.hdrim||'none',WR=(K_.hdwrap==='1'||K_.hdwrap===true)&&open,PT=K_.hdpat||'none';if(nk!=='none'&&MS_){/* 투구드림: 투구 밑단에서 늘어뜨림. 얼굴이 트였으면 앞을 비우고, 여밈(WR)이면 턱 아래에서 앞이 닫혀 턱을 감싼다. 문양(PT): 징·찰갑·비늘·쇠사슬 */
    const u0=open?cb-1:-5,g0=open?0:.7,bot_=nk==='long'||nk==='mail'?-17:-13.5,spread=(nk==='flared'?4.5:nk==='mail'?2.5:1.2)*(K_.hspr??1),bot=u0+(bot_-u0)*(K_.hlen??1),col=nk==='mail'&&PT==='none'?hexMix(main,'#8d877c',.35):main,NRW=6,M_=N+1,
     gap=u=>!open?0:!WR?.35*Math.PI:u>-5?.35*Math.PI:u>-7.5?lerp(.35*Math.PI,.03,(-5-u)/2.5):.03,PTL=(u,k,t,g=0)=>{const pull=WR&&u<-5?2.6*Math.min(1,(-5-u)/2.5)*Math.max(0,Math.cos(t))**2:0;return[Math.cos(t)*(G.Rf-1+g0+spread*k+g-pull)-1.5,Math.sin(t)*(G.Rr-.4+g0+spread*k+g),u]},
     rowAt=(u,k,g=0)=>{const a=gap(u),out=[];for(let i=0;i<M_;i++){const t=open?lerp(a,6.2832-a,i/(M_-1)):i/N*6.2832;out.push(PTL(u,k,t,g))}return open?out:out.slice(0,N)},US=Array.from({length:NRW},(_,j)=>lerp(u0,bot,j/(NRW-1)));
    {const h0=HLOC,t0=TAG,TX=PT!=='none';let rows;if(TX){/* 문양은 무늬 그림판(종류 3)에 구워 읽는다: 꼭짓점마다 (반복 둘레각 cos·sin, 위→아래 0~1) */
      const TY={stud:1,lamellar:2,scale:3,mail:4}[PT],REP={stud:16,lamellar:22,scale:20,mail:30}[PT],NRp={stud:5,lamellar:6,scale:8,mail:14}[PT],circ=6.2832*(G.Rf+G.Rr)/2,AS=(circ/REP)/((u0-bot)/NRp),tc=hex(trim),prow=decRow([3,TY,NRp,AS,tc[0],tc[1],tc[2],PT==='mail'?.1:.065]),MM=73,NRX=8,
       rowT=(u,k)=>{const a=gap(u),out=[];for(let i=0;i<MM;i++){const t=open?lerp(a,6.2832-a,i/(MM-1)):i/(MM-1)*6.2832,q=HL(PTL(u,k,t));q._h=[Math.cos(REP*t),Math.sin(REP*t),(u0-u)/(u0-bot)];out.push(q)}return open?out:out.slice(0,MM-1)};
      rows=Array.from({length:NRX},(_,j)=>{const u=lerp(bot,u0,j/(NRX-1));return rowT(u,1-j/(NRX-1))});HLOC={fn:p_=>p_._h?[p_._h[0],p_._h[1],p_._h[2],10+prow]:[0,0,0,0]}}
     else{if(nk==='mail')HLOC={...HLOC,w:2};else HLOC=null;rows=US.slice().reverse().map((u,j)=>rowAt(u,1-j/(NRW-1)).map(HL))}
     loft(rows,col,{open,center:HL([-1.5,0,(bot+u0)/2])});HLOC=h0;TAG=t0}}}/* 문양 없음 + 종류 '사슬'이면 예전처럼 사슬 무늬(HLA w 2) */
   // 챙
   const br=K_.brim||'none';if(br!=='none'&&MS_){const g=br==='wide'?3.6:br==='down'?3:1.8,lo=br==='down'?cb-3:cb-.7,rg=(R1,R2,u)=>{const a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HL([Math.cos(t)*R1-1,Math.sin(t)*R2,u]))}return a};loft([rg(S0.Rf+.3,S0.Rr+.3,cb+.4),rg(S0.Rf+g,S0.Rr+g,lo),rg(S0.Rf+g-.3,S0.Rr+g-.3,lo-.5),rg(S0.Rf+.3,S0.Rr+.3,cb-.4)],main,{center:HL([-1,0,cb])})}
   // 몸체: 위도 고리(평평한 통이면 원통), 닫힌 얼굴이면 아래 목둘레로 좁아짐, 뾰족·양파형은 꼭짓점
   if(MS_){const R=[],HLb=v=>{const q=HL(v);q._l=v;return q};/* _l: 클로즈 얼굴의 앞쪽 비우기 판정용 머리 좌표 */if(flat){for(let j=0;j<=6;j++){const u=lerp(base,top,j/6),sc=j===6?.88:1,a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HLb([Math.min(S0.cf+Math.cos(t)*S0.Rf*sc,fmax),Math.sin(t)*S0.Rr*sc,u]))}R.push(a)}}
    else{if(!open){const a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HLb([Math.min(Math.cos(t)*9.8*w-1.5,fmax),Math.sin(t)*9.4*w,-12]))}R.push(a)}for(let la=open?0:-4;la<=5;la++){const pp=la/6*Math.PI/2,a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HLb([Math.min(S0.cf+Math.cos(pp)*Math.cos(t)*S0.Rf,fmax),Math.cos(pp)*Math.sin(t)*S0.Rr,S0.cu+Math.sin(pp)*S0.Ru]))}R.push(a)}
     if(apex>top+.1){const k=.35,a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HLb([S0.cf+Math.cos(t)*S0.Rf*.25*k,Math.sin(t)*S0.Rr*.25*k,lerp(top,apex,.75)]))}R.push(a)}
     const tp=apex>top+.1?apex:top,a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HLb([S0.cf+Math.cos(t)*.05,Math.sin(t)*.05,tp]))}R.push(a)}
    loft(R,main,{center:HL([S0.cf,0,(base+top)/2]),capB:flat&&!open,capT:flat,skip:CLS?(j,i,i2)=>CVp.win(R[j][i]._l,R[j][i2]._l,R[j+1][i]._l,R[j+1][i2]._l):VZF&&VUP?(j,i,i2)=>inWin(WINF,R[j][i]._l,R[j][i2]._l,R[j+1][i]._l,R[j+1][i2]._l):null})}if(CLS)CVp.draw();/* 뼈를 등록하는 눈 틈·리벳이 있어 두 모드 모두 부른다 */
   if(VZF){if(VUP){face1(true,true);raisedVisor(main)}else if(FX==='peak'){const PK={pointed:[14.5,16.5,15],round:[14,15,14.4],flat:[13.4,13.6,13.4],beak:[14,20.5,14.6]}[K_.vdesign||'pointed']||[14.5,16.5,15];visor([[11,11.5],[2,PK[1]],[-6,PK[2]],[-13.6,9.6]].map(([u,f])=>[u,10+(f-10)*(K_.vpro??1)]),10,5,main)}else{const FC={pointed:[12.5,17,9.5],round:[12.5,15,9.5],flat:[12,12.8,10.5],beak:[12,20.5,9]}[K_.vdesign||'pointed']||[12.5,17,9.5];visor([[6,FC[0]],[-1.5,FC[1]],[-11,FC[2]]].map(([u,f])=>[u,8+(f-8)*(K_.vpro??1)]),8,2.4,main)}}/* 바이저2(뾰족)·바이저1(면갑 투구) 얼굴: 그 투구의 면갑(튀어나옴 배율 vpro). 올리면 앞을 비우고 젖힌 면갑판 */
   if(FX==='kettle'&&MS_){const R0=S0.Rf*kU(cb),R1=S0.Rr*kU(cb);loft([[R0+.3,R1+.3,cb+.5],[R0+4.4,R1+4.4,cb-1.1],[R0+4.2,R1+4.2,cb-1.6],[R0+.3,R1+.3,cb-.3]].map(([f,r,u])=>neckRing(f,r,S0.cf,u).map(HL)),main,{center:HL([S0.cf,0,cb])})}/* 챙 투구 얼굴: 넓게 처진 챙 */
   if(FX==='joguan'&&MS_){const R0=S0.Rf*kU(cb),R1=S0.Rr*kU(cb),h0=HLOC;HLOC=null;loft([[11.2,10.7,3],[11.9,11.4,5.25],[12.6,12.1,8],[13.2,12.7,8.15],[13.4,12.9,8.5],[13.1,12.6,8.8],[12.5,12,8.55],[12.1,11.6,8.1],[11.5,11,5.75],[10.9,10.1,3.2]].map(([f,r,u])=>neckRing(R0+f-10.8,R1+r-10,S0.cf,cb+u-3).map(HL)),main,{});HLOC=h0}/* 조관 얼굴: 밑동에서 위로 벌어지는 속 빈 챙 벽 */
   if(JINF){const h0=HLOC;if(!DUP){jinDrim(main,cb)}/* 금나라 드림 내림: 눈구멍 뚫린 찰갑 드림 */
    else if(DR==='jin'){HLOC=null;if(MS_){const q_=S0.Rr/S0.Rf,RS=rows=>rows.map(([f,u])=>neckRing(f,f*q_,S0.cf,u).map(HL)),h1=4.5,z1=cb+h1,T1=[[S0.Rf*kU(cb),cb-.05]];for(let q=0;q<=4;q++){const z=cb+h1*q/4;T1.push([S0.Rf*kU(z)+.7,z])}T1.push([S0.Rf*kU(z1)+.05,z1+.05]);TAG=4;loft(RS(T1),main,{});
      const Rb=S0.Rf*kU(cb),n_=dstep(),s_=dgap(),o3=(dov()-3)*2.8/3;for(let k=1;k<n_;k++){const ut=z1+k*o3,rt=Rb+.6+(k-1)*s_,rb=rt+.8,ub=ut-2.8;TAG=4;loft(RS([[rb,ub],[rt,ut],[rt-.6,ut],[rb-.6,ub],[rb,ub]]),main,{})}
      TAG=0;const hr_=Rb+.76;loft(RS([[hr_,cb-.2],[hr_,cb+1]]),p.cloth||tr,{capB:true,capT:true})}TAG=2}/* 금나라 드림 올림(강시모): 밑동에 겹쳐 감긴 1단 띠 + 2단부터 아래로 벌어지며 포갠 층(드림 조정의 단·단차·층 겹침) + 밑단 천 */
    else{HLOC=null;const DB=-14.5,FB=-11.5,tp=cb+.5,cloth=p.cloth||tr,red=p.flap&&p.flap!==st?p.flap:'#b3261a',dF=u=>u>=-6?lerp(10.4,11,clamp((tp-u)/(tp+6),0,1)):lerp(11,14.2,clamp((-6-u)/(-6-DB),0,1)),dS=u=>u>=-6?lerp(9.8,10.6,clamp((tp-u)/(tp+6),0,1)):lerp(10.6,13.8,clamp((-6-u)/(-6-DB),0,1)),arc=(u,t0,t1,g)=>Array.from({length:9},(_,q)=>{const t=lerp(t0,t1,q/8);return HL([-1+Math.cos(t)*(dF(u)+.5+g),Math.sin(t)*(dS(u)+.5+g),u])});
     if(MS_)for(const[t0,t1,ub]of[[.95,1.75,FB],[1.75,Math.PI,DB],[Math.PI,4.53,DB],[4.53,5.33,FB]]){const us=[tp,0,-3,-6,-9,ub].filter(u=>u<=tp&&u>=ub),cn=HL([-1,0,(tp+ub)/2]);TAG=1;loft(us.map(u=>arc(u,t0,t1,0)),main,{open:true,center:cn});TAG=0;loft([arc(ub+1,t0,t1,.12),arc(ub,t0,t1,.12)],cloth,{open:true,center:cn});TAG=2}
     const knot=HL([6.9,0,-9.4]);for(const t of[.95,5.33]){const a=HL([-1+Math.cos(t)*(dF(FB)+.8),Math.sin(t)*(dS(FB)+.8),FB+.6]),m_=HL([6.2,Math.sign(Math.sin(t))*5.4,-9.2]);tube(a,m_,.8,.8,red,.5);tube(m_,knot,.8,.8,red,.5)}ellip(v=>vadd(knot,v),1.5,1.5,1.5,0,0,red);for(const sd of[-1,1])tube(knot,HL([7.6,sd*2.4,-13]),.9,.7,red,.5)}/* 금나라 투구2 드림 올림: 옆·뒷자락, 밑단 천, 턱 앞 붉은 끈 */
    TAG=2;HLOC=h0}
   if(K_.dome==='onion')ellip(v=>HL(vadd(v,[S0.cf,0,apex+1.6])),1.5,1.5,1.5,0,0,trim);
   // 띠(trim)·트인 얼굴 테두리·리벳·세로 띠
   const nb=Math.max(0,Math.min(3,K_.bands|0)),bandAt=u=>{if(MS_)loft([ringAt(u-.45,.18),ringAt(u+.45,.18)],trim,{center:HL([S0.cf,0,u])})};
   if(open)bandAt(base+.5);for(let i=1;i<=nb;i++)bandAt(base+(top-base)*i/(nb+1)*.85);
   if(K_.rivets&&MS_&&AW>0){const u=open?base+1.4:base+(top-base)*.12,k=kU(u);TAG=3;for(let q=0;q<16;q++){const t=q/16*6.2832,c_=HL([Math.min(S0.cf+Math.cos(t)*S0.Rf*k,fmax)+.15*Math.cos(t),Math.sin(t)*(S0.Rr*k+.15),u]),r_=.45*Math.sqrt(AW),RR=[];for(let j=0;j<=3;j++){const la=-Math.PI/2+j/3*Math.PI,aa=[];for(let i=0;i<6;i++){const qq=i/6*6.2832;aa.push(vadd(c_,[Math.cos(la)*Math.cos(qq)*r_*hs,Math.cos(la)*Math.sin(qq)*r_*hs,Math.sin(la)*r_*hs]))}RR.push(aa)}loft(RR,INKL,{samePid:true})}TAG=2}
   if(K_.vband){const pts=[];for(let q=0;q<=10;q++){const t=.12+q/10*(Math.PI-.5);pts.push(HL([Math.min(S0.cf+Math.cos(t)*S0.Rf,fmax)+.3*Math.cos(t),0,(flat?top:S0.cu+Math.sin(t)*S0.Ru)+.35]))}line_(pts,.9,hi)}
   // 얼굴 부품: 코가리개(가운데 세로 막대), 볼가리개(양 볼 판), 면갑 올림(이마 위 젖힌 판 + 눈 틈)
   if(NAS)tube(HL([10.2,0,2.6]),HL([10.2,0,-4.2]),.95,.95,main,.9);/* 코가리개: 한 통(토막 사이 구분선 없음) */
   if(CHK&&MS_)for(const sd of[-1,1]){const poly=[[4.6,cb-1],[8.6,cb-1],[8.2,-7.5],[5.6,-9.6],[4.2,-5]],P=d=>poly.map(([r,u])=>FPb(sd*r,u,d));loft([P(1.1),P(1.9)],main,{center:FPb(sd*6.4,-4.5,1.5)});/* 판 둘레(두께) */
    const eR=(E,u)=>{for(let i=0;i<E.length-1;i++){const[r0,u0]=E[i],[r1,u1]=E[i+1];if(u<=u0&&u>=u1)return lerp(r0,r1,(u0-u)/(u0-u1||1))}return E[E.length-1][0]},EL=[[4.6,cb-1],[4.2,-5],[5.6,-9.6]],ER=[[8.6,cb-1],[8.2,-7.5],[5.6,-9.6]],NJ=8,NI=5;for(const d of[1.9,1.1]){const R=[];for(let j=0;j<=NJ;j++){const u=lerp(cb-1,-9.6,j/NJ),a=eR(EL,u),b=eR(ER,u),row=[];for(let i=0;i<=NI;i++)row.push(FPb(sd*lerp(a,b,i/NI),u,d));R.push(row)}loft(R,main,{open:true,samePid:d===1.1,center:FPb(sd*6.4,-4.5,d===1.9?-3:6)})}}/* 볼가리개 앞·뒷면: 얼굴 곡면을 따르는 격자라 얼굴이 판을 뚫고 나오지 않는다 */
   if(FMK){const h0=HLOC,t0=TAG;HLOC=null;TAG=2;/* 얼굴가리개: 사람 얼굴 모양 철가면(눈구멍·코·입술), 양옆에 장식 귀 */
    if(MS_){const uT=Math.min(cb-.5,1.6),uB=-11.6,NR=24,NU=26,nose=u=>u>.5||u<-4.4?0:u>-3.6?(.5-u)/4.1:(u+4.4)/.8,dz=(r,u)=>{const ar=Math.abs(r);return 1.8*Math.max(0,1-ar/1.4)**1.5*nose(u)+.55*Math.max(0,1-(ar/2.4)**2)*Math.max(0,1-((u+6.6)/.8)**2)+.25*Math.max(0,1-(ar/3.2)**2)*Math.max(0,1-((u+9.5)/1.6)**2)},/* 코 능선·입술·턱 */
     G_=[],RR=[];for(let j=0;j<=NU;j++){const u=lerp(uT,uB,j/NU),row=[],rl=[];for(let i=0;i<=NR;i++){const r=lerp(-8.15,8.15,i/NR);row.push(FPb(r,u,.85+dz(r,u)));rl.push([r,u])}RR.push(row);G_.push(rl)}
     const inM=([r,u])=>(r/8.1)**2+(u<-4?((u+4)/7.6)**2:0)<1,eye=([r,u])=>((Math.abs(r)-3.1)/1.3)**2+((u-.1)/.62)**2<1;
     loft(RR,main,{open:true,center:FPb(0,-5,-6),skip:(j,i,i2)=>{const q=[G_[j][i],G_[j][i2],G_[j+1][i],G_[j+1][i2]],c=[q.reduce((a,b)=>a+b[0],0)/4,q.reduce((a,b)=>a+b[1],0)/4];return!inM(c)||eye(c)}})}
    TAG=3;tube(FPb(-2,-6.35,1.45),FPb(2,-6.35,1.45),.18,.18,INKL,.9);TAG=2;/* 입 선 */
    for(const sd of[-1,1])ellip(v=>HL(vadd(v,[.6,sd*9.5,-1.2])),1.2,.55,2.1,0,0,trim);/* 장식 귀 */
    HLOC=h0;TAG=t0}
   if(open&&VUP&&(K_.face==='visor'||K_.face==='mask')){if(MS_){const lo=[],up_=[];for(let r=-8.5;r<=8.51;r+=1.7){lo.push(SP(r*w,cb+.4,3.4));up_.push(SP(r*w,cb+7.4,1.4))}loft([lo,lo.map((q,i)=>vlerp(q,up_[i],.5)),up_],main,{open:true,center:HL([0,0,cb+3])})}TAG=3;const sl=[];for(let r=-6.5;r<=6.51;r+=1.3)sl.push(SP(r*w,cb+2.4,3.45));for(let i=0;i<sl.length-1;i++)tube(sl[i],sl[i+1],.45,.45,INKL,.9);TAG=2}
   // 장식: 능선·볏판·깃털·꼭지·날개
   if(crestK==='ridge'){const pts=[];for(let q=0;q<=10;q++){const t=.35+q/10*(Math.PI-.9);pts.push(HL([S0.cf+Math.cos(t)*S0.Rf*.98,0,(flat?top:S0.cu+Math.sin(t)*S0.Ru)+.4]))}line_(pts,1.2,hi)}
   else if(crestK==='comb'&&MS_){const R=[];for(let q=0;q<=10;q++){const t=.4+q/10*(Math.PI-1),f=S0.cf+Math.cos(t)*S0.Rf*.95,u=flat?top:S0.cu+Math.sin(t)*S0.Ru*.98,u2=u+4.5*Math.sin(q/10*Math.PI)**.6+.3;R.push([HL([f,-.5,u-.5]),HL([f,-.5,u2]),HL([f,.5,u2]),HL([f,.5,u-.5])])}loft(R,acc,{capB:true,capT:true,center:HL([S0.cf,0,top])})}
   else if(crestK==='plume'){const B=[S0.cf,0,apex],P=[[0,0,0],[-2,0,4.5],[-7,0,7],[-13,0,5],[-17,0,-1],[-18,0,-7]].map(v=>HL(vadd(B,v)));for(let i=0;i<P.length-1;i++){const t=i/(P.length-1),wd=x=>(1-Math.abs(x-.35)*1.3)*3+.5;tube(P[i],P[i+1],wd(t),wd(t+1/(P.length-1)),acc,.9)}ellip(v=>HL(vadd(v,B)),1.6,1.6,1.6,0,0,trim)}
   else if(crestK==='spike')tube(HL([S0.cf,0,apex-.5]),HL([S0.cf,0,apex+5.5]),1.4,.05,trim,.3);
   else if(crestK==='wings'&&MS_)for(const sd of[-1,1]){const Rr_=S0.Rr,bt=top-3,pp=[[-1,sd*(Rr_-.5),bt-3],[0,sd*(Rr_+3),bt+2],[-2,sd*(Rr_+7),bt+9],[-6,sd*(Rr_+7.5),bt+12.5],[-9,sd*(Rr_+4),bt+8],[-6,sd*(Rr_+.5),bt]],P=d=>pp.map(v=>HL(vadd(v,[0,d,0])));loft([P(-.25),P(.25)],hexMix(acc,'#ffffff',.82),{capB:true,capT:true,center:HL([-4,sd*(Rr_+4),bt+5])})}};
  const hairCapless=()=>{};
  const crest=kit?({ridge:'comb',comb:'comb',plume:'plume',horns:'horns'}[kit.crest]||'none'):(m.hcrest||'none'),PC=p.plume||p.flap||'#8a1c1c';
  const deco=(topU)=>{const h0=HLOC;HLOC=null;decoIn(topU);HLOC=h0},decoIn=(topU)=>{if(crest==='plume'){const P=[[0,0,topU],[-1,0,topU+5],[-4,0,topU+9],[-9,0,topU+11],[-14,0,topU+9]].map(HL);for(let i=0;i<P.length-1;i++)tube(P[i],P[i+1],2.4-i*.4,2-i*.4,PC,.9)}
   else if(crest==='comb')ellip(v=>HL(vadd(v,[-2,0,topU-1])),9,1.1,4.2,0,0,TC,0,Math.PI/2,{capB:true});else if(crest==='horns')for(const sd of[-1,1]){const P=[[-1,sd*9.6,5],[-2,sd*14,9],[-1,sd*16,16]].map(HL);tube(P[0],P[1],2.2,1.6,'#e6dcc0',.6);tube(P[1],P[2],1.6,.3,'#e6dcc0',.6)}};
  if(F==='great'){deco(10.5);const R=[];for(const u of[-12,-6,0,6,10.5]){R.push(neckRing(10.6,10,-1,u).map(HL))}/* 통투구: 머리 좌표로 옮겨 놓음 */loft(R,HC,{capT:true,capB:true});return}
  if(F==='kettle'){deco(14);face();ellip(HL,10.6,9.8,9,-1,5,HC,0,Math.PI/2,{capB:true});loft([neckRing(14,13.4,-1,4.2).map(HL),neckRing(13.6,13,-1,5).map(HL)],HC,{capB:true,capT:true});return}
  if(F==='joguan'){/* 조관: 빵모 1단 모양의 검은 관(찰갑 무늬 없음). 원래 사발 + 사발 밑동에서 위로 벌어지는 속 빈 챙 벽. 귀 보임 */const BU=3,BK=kit&&kit.colors&&kit.colors.main?kit.colors.main:'#1d1b19',H=5,U=BU+H;/* 색: 투구 '몸체' 색(정하지 않으면 검정) */face(true,false);hairCap(false);HLOC=null;TAG=2;ellip(HL,10.8,10,10.5,-1,BU,BK,0,Math.PI/2,{capB:true});loft([[11.2,10.7,BU],[11.9,11.4,BU+H*.45],[12.6,12.1,U],[13.2,12.7,U+.15],[13.4,12.9,U+.5],[13.1,12.6,U+.8],[12.5,12,U+.55],[12.1,11.6,U+.1],[11.5,11,BU+H*.55],[10.9,10.1,BU+.2]].map(([f,r,u])=>neckRing(f,r,-1,u).map(HL)),BK,{});deco(BU+10.5);/* 꼭대기 장식(볏·깃털·뿔·없음): 투구 칸의 '꼭대기 장식' 그대로 */TAG=2;HLOC=null;return}
  if(F==='close'){/* 클로즈헬름: 볏 달린 사발 + 옆 회전축 하나에 함께 걸린 뾰족한 면갑(위)과 턱가리개(아래) + 목 겹판 3단. 면갑 올림이면 면갑만 축을 중심으로 젖혀 얼굴이 보인다 */
   HLOC=null;TAG=2;const MS_=MODE==='mesh',CF=-1.5,RF=11.4,RR=10.4,RU=12,cr_=kit&&kit.crest||'ridge';if(up)face(true,true);
   const SR=u=>{if(u>=-5.75){const k=Math.sqrt(Math.max(0,1-(u/RU)**2));return[RF*k,RR*k]}return[cTab([[-5.75,10],[-10,9.3],[-13.5,9.7]],u),cTab([[-5.75,9.12],[-10,8.8],[-13.5,9.3]],u)]};/* 사발 반지름(앞, 옆): 위는 타원체, 아래는 목으로 좁아졌다 다시 벌어짐 */
   const CV=closeVis(CF,RF,RR,SR,up,HC);
   if(MS_){const n=32,LR=[],LAS=[];for(let j=0;j<=12;j++)LAS.push(lerp(-.5,Math.PI/2*.97,j/12));const US=[-13.5,-10,...LAS.map(la=>RU*Math.sin(la))];
    for(const u of US){const a=[];for(let i=0;i<n;i++){const t=i/n*6.2832,[ra,rb]=SR(u);a.push([CF+ra*Math.cos(t),rb*Math.sin(t),u])}LR.push(a)}LR.push(Array.from({length:n},(_,i)=>[CF+Math.cos(i/n*6.2832)*.2,Math.sin(i/n*6.2832)*.2,RU]));
    loft(LR.map(r=>r.map(HL)),HC,{center:HL([CF,0,0]),skip:(j,i,i2)=>CV.win(LR[j][i],LR[j][i2],LR[j+1][i],LR[j+1][i2])});/* 면갑·턱가리개가 덮는 앞쪽은 비운다(면갑을 올리면 얼굴이 보임) */
    {const cs=cr_==='ridge'?4.6:2.4,R=[];for(let q=0;q<=12;q++){const ph=.45+q/12*(Math.PI-1),f=CF+Math.cos(ph)*RF*.98,u=Math.sin(ph)*RU*.98,u2=u+cs*Math.sin(q/12*Math.PI)**.6+.3;R.push([HL([f,-.45,u-.5]),HL([f,-.45,u2]),HL([f,.45,u2]),HL([f,.45,u-.5])])}loft(R,HC,{capB:true,capT:true,center:HL([CF,0,RU])})}/* 볏: 사발 가운데 앞뒤로 */
    for(let k=0;k<3;k++){const u_=-12.4-1.75*k,a=9.9+1.05*k,b=9.5+1.05*k;loft([neckRing(a,b,CF,u_),neckRing(a+.9,b+.9,CF,u_-2.1),neckRing(a+.4,b+.4,CF,u_-2.3)].map(r=>r.map(HL)),HC,{center:HL([CF,0,u_-1])})}}/* 목 겹판 3단: 아래로 한 단씩 벌어짐 */
   for(let k=0;k<3;k++)for(const r of[-.7,.7]){const u_=-12.4-1.75*k-1.1,a=9.9+1.05*k+.6,q=HL([CF+a+.1,r,u_]);tube(q,vadd(q,vmul(K.HR([1,0,0]),.15*hs)),.36,.36,INKL,.9)}TAG=2;/* 목 겹판 리벳 */CV.draw();
   if(cr_==='plume'||cr_==='horns')deco(RU+(cr_==='plume'?2.5:-2));HLOC=null;TAG=2;return}
  if(F==='jin'||F==='jin2'){const BU=3,BM=up&&F==='jin'&&dshape()>0;/* BM: 빵모·강시모(투구는 드림 내림 때 모델의 원래 사발 그대로, 드림만 말아 올림. 귀를 가리는 자락 없음) */ellip(HL,10.8,10,10.5,-1,BU,HC,0,Math.PI/2,{capB:true});
   if(!up){face(true,true);// 드림 내림: 눈구멍을 실제로 뚫고, 안의 진짜 얼굴(눈 모양·눈썹·안대 설정 그대로)이 보이게
    jinDrim(HC,BU)}
   else{face(true,!BM);hairCap(!BM);/* 드림 올림: 귀는 그리지 않고, 귀 자리 구멍 없이 뒤통수 머리카락. 빵모는 귀를 보이게 한다 */if(F==='jin'&&BM){const hb_=HLOC;HLOC=null;/* 드림 올림(강시모·빵모): 사발은 원래 크기 그대로 두고, 드림을 말아 올려 사발 위에 겹친다 */
     const n_=dstep(),sh1=dshape()===1,dd=ddir(),s_=dgap(),bw=z=>{const q=1-((z-BU)/10.5)**2;return q>0?Math.sqrt(q):0},RS=rows=>rows.map(([f,r,u])=>neckRing(f,r,-1,u).map(HL));
     if(sh1){/* 강시모 1단: 사발 아랫부분에 겹쳐 감긴 띠(사발 곡면을 따라 .7 두께). 2단부터 방향 옵션대로 포갠다. 2단은 1단에 붙기만 하고 겹침은 3단부터 */
      const h1=4.5,z1=BU+h1,k1=bw(z1),T1=[[10.8,10,BU-.05]];for(let q=0;q<=4;q++){const z=BU+h1*q/4,k=bw(z);T1.push([10.8*k+.7,10*k+.7,z])}T1.push([10.8*k1+.05,10*k1+.05,z1+.05]);TAG=4;loft(RS(T1),HC,{});
      const rT1=10.8*k1+.7,ov=n_>2?Math.min(Math.max(0,dov()-3),2.8*.9):0,/* 층 겹침 3이 기준(변화 없음), 3보다 크면 겹침 */shl=(rb,ub,rt,ut)=>{TAG=4;loft(RS([[rb,rb-.5,ub],[rt,rt-.5,ut],[rt-.6,rt-1.1,ut],[rb-.6,rb-1.1,ub],[rb,rb-.5,ub]]),HC,{})};/* 층 하나: 두께 .6의 닫힌 고리 */
      if(dd===2){const o3=(dov()-3)*2.8/3;for(let k=1;k<n_;k++){const ut=z1+k*o3,rt=11.4+(k-1)*s_;shl(rt+.8,ut-2.8,rt,ut)}}/* 아래로 벌어짐: 겹침은 1단의 위쪽 라인에서 시작. 층 겹침 3 = 모든 층이 그 라인에 겹쳐 앉음(변화 없음), 0 = 층마다 한 층 높이씩 아래로(최대 아래로 겹침), 6 = 층마다 위로(최대 위로 겹침). 아래 층일수록 단차만큼 벌어짐 */
      else{let top=z1,rb=rT1;for(let k=1;k<n_;k++){if(k>1)rb=Math.max(8.5,rb+(dd===0?1:-1)*s_);const ub=top-(k>1?ov:0);shl(rb,ub,rb+.8,ub+2.8);top=ub+2.8}}}/* 위로 벌어짐/좁아짐: 1단 위로 층을 쌓는다 */
     else{/* 빵모: 사발 밑동에서 위로 벌어지는 속 빈 챙 벽(바깥 위로 → 말린 가장자리 → 안쪽 아래로). 단을 올리면 벽이 위로 길어진다 */const H=5+(n_-1)*2.8,U=BU+H;TAG=4;loft(RS([[11.2,10.7,BU],[11.9,11.4,BU+H*.45],[12.6,12.1,U],[13.2,12.7,U+.15],[13.4,12.9,U+.5],[13.1,12.6,U+.8],[12.5,12,U+.55],[12.1,11.6,U+.1],[11.5,11,BU+H*.55],[10.9,10.1,BU+.2]]),HC,{})}
     TAG=2;HLOC=hb_}else if(F==='jin'){const hb_=HLOC;HLOC=null;TAG=4;/* 말린 드림(접은 챙): 윗면까지 찰갑 무늬 *//* 참고 그림의 말린 드림: 단으로 포개 말린 두툼한 띠. 각 단은 아래로 벌어지고 위 단은 한 칸 물러난다 */loft((()=>{const sh_=dshape();/* 모양 1 강시모: 위로 갈수록 벌어지는 층층 사다리꼴(2 빵모는 위에서 따로 만든다) */if(sh_===1){const n=dstep(),h=(5+(n-1)*2.8)/n,R=[];for(let k=0;k<n;k++){const rb=10.9+k*.7,ub=BU+1.6+k*h;R.push(neckRing(rb,rb-.5,-1,ub).map(HL),neckRing(rb+1.1,rb+.6,-1,ub+h).map(HL))}return R}const n=dstep(),f=n<2?1.6:.25,ld=n<2?0:.9,h=(5+(n-1)*2.8)/n,R=[];/* 단이 늘수록 전체 키가 커지고 단마다 뚜렷이 물러난다(청나라 강시 모자처럼 층층이 솟은 모양) */for(let k=0;k<n;k++){const rb=12.6-k*(f+ld),ub=BU+1.6+k*h;R.push(neckRing(rb,rb-.5,-1,ub).map(HL),neckRing(rb-f,rb-f-.5,-1,ub+h).map(HL))}return R})(),HC,{capB:true,capT:true});/* 단 수(드림 단 슬라이더): 단마다 한 칸 물러나며 포개진다. 단이 많을수록 계단이 잘고 깊다 */TAG=2;HLOC=hb_}
    /* 드림 올림(2D jinDraw와 같게): 접은 챙 아래 천 가장자리, 귀 옆 속드림 자락(금나라 투구2는 뒷자락까지), 자락 밑단 천, 턱 밑에서 묶는 붉은 끈 */
    {const h0_=HLOC;HLOC=null;const FOLD=F==='jin',DB=-14.5,FB=-11.5,gi=-.5,/* 자락은 머리카락·머리통 바깥에 둔다(안쪽이면 머리카락이 뚫고 나와 구멍처럼 보임) */top=FOLD?BU+1.4:BU+.5,cloth=p.cloth||tr,red=p.flap&&p.flap!==st?p.flap:'#b3261a',
     dF=u=>u>=-6?lerp(10.4,11,clamp((BU+.5-u)/(BU+6.5),0,1)):lerp(11,14.2,clamp((-6-u)/(-6-DB),0,1)),dS=u=>u>=-6?lerp(9.8,10.6,clamp((BU+.5-u)/(BU+6.5),0,1)):lerp(10.6,13.8,clamp((-6-u)/(-6-DB),0,1));
     if(FOLD){TAG=0;const hr_=BM?(dshape()===1?11.56:11.26):12.66,hu_=BM?BU-.2:BU+1.6;loft([neckRing(hr_,hr_-.5,-1,hu_).map(HL),neckRing(hr_,hr_-.5,-1,hu_+1.2).map(HL)],cloth,{capB:true,capT:true});TAG=2}/* 챙 밑단 천 */
     const secs=BM?[]:FOLD?[[.95,1.85,FB],[4.43,5.33,FB]]:[[.95,1.75,FB],[1.75,Math.PI,DB],[Math.PI,4.53,DB],[4.53,5.33,FB]],arc=(u,t0,t1,g)=>Array.from({length:9},(_,q)=>{const t=lerp(t0,t1,q/8);return HL([-1+Math.cos(t)*(dF(u)-gi+g),Math.sin(t)*(dS(u)-gi+g),u])});
     for(const[t0,t1,ub]of secs){const us=[top,0,-3,-6,-9,ub].filter(u=>u<=top&&u>=ub),cn=HL([-1,0,(top+ub)/2]);TAG=1;loft(us.map(u=>arc(u,t0,t1,0)),HC,{open:true,center:cn});TAG=0;loft([arc(ub+1,t0,t1,.12),arc(ub,t0,t1,.12)],cloth,{open:true,center:cn});TAG=2}
     const knot=HL([6.9,0,-9.4]);/* 2D는 턱 밑에서 묶지만 3D는 몸통 윗면이 턱 바로 밑이라 파묻힌다 → 턱 앞쪽 가장자리에서 묶는다 */for(const t of BM?[]:[.95,5.33]){const a=HL([-1+Math.cos(t)*(dF(FB)-gi+.3),Math.sin(t)*(dS(FB)-gi+.3),FB+.6]),m_=HL([6.2,Math.sign(Math.sin(t))*5.4,-9.2]);tube(a,m_,.8,.8,red,.5);tube(m_,knot,.8,.8,red,.5)}
     if(!BM){ellip(v=>vadd(knot,v),1.5,1.5,1.5,0,0,red);for(const sd of[-1,1])tube(knot,HL([7.6,sd*2.4,-13]),.9,.7,red,.5)}/* 빵모: 귀를 덮는 속드림 자락과 턱 끈이 없다 */HLOC=h0_}}
   if(kit&&kit.crest!=='none'){HLOC=null;tube(HL([-1,0,BM?BU+10.5:Math.max(BU+10.5,up&&F==='jin'?BU+1.6+5+(dstep()-1)*2.8-.5:0)]),HL([-3,0,BM?BU+28:Math.max(BU+28,up&&F==='jin'?BU+1.6+5+(dstep()-1)*2.8+16.5:0)]),1.4,.4,p.plume||'#8a1c1c',.5)}HLOC=null;return}
  if(F==='peak'||F==='peakup'){deco(18);shell(11.6,10.8,12.5,-1,[11.8,11.6,-1,-14],[[1,0,19.5]],HC,up?WINF:null);if(!up){const PK={pointed:[14.5,16.5,15],round:[14,15,14.4],flat:[13.4,13.6,13.4],beak:[14,20.5,14.6]}[kit&&kit.vdesign||'pointed']||[14.5,16.5,15];visor([[11,11.5],[2,PK[1]],[-6,PK[2]],[-13.6,9.6]],10,5,HC,[-2,-4.5,-7])}else{face(true,true);raisedVisor(HC)}return}
  if(F==='parts'){kitParts();return}
  // 기본(면갑 투구 등): 2D helmBody와 같은 위도 고리 + 목둘레 고리
  deco(12.5);
  shell(12,10.6,12.5,-1.5,[9.5,9.2,-2,-12],null,HC,up?WINF:null);
  if(!up){const FC={pointed:[12.5,17,9.5],round:[12.5,15,9.5],flat:[12,12.8,10.5],beak:[12,20.5,9]}[kit&&kit.vdesign||'pointed']||[12.5,17,9.5];visor([[6,FC[0]],[-1.5,FC[1]],[-11,FC[2]]],8,2.4,HC,[-3,-5.5,-8])}else{face(true,true);raisedVisor(HC)}}
 // ─ 얼굴 그림: 머리 국소 좌표(방위각·높이)로 펼친 2048×1024 그림. 머리통·머리카락·수염 겉면이 같은 좌표로 읽는다 ─
 const FW=2048,FH=1024,fcv=document.createElement('canvas');fcv.width=FW;fcv.height=FH;let fkey='',facetx=null;
 function faceTex(o){const key=JSON.stringify(o);if(key===fkey)return;fkey=key;const c=fcv.getContext('2d'),U=FH/34,INK='#1d1a17';c.clearRect(0,0,FW,FH);c.lineCap='round';c.lineJoin='round';
  const M=q=>[(.5+Math.atan2(q[1],q[0]+1)/6.2832)*FW,(20-q[2])/34*FH],FL=(r,u,dz=0)=>[-.6+9.2*Math.sqrt(Math.max(0,1-(r/8.2)**2-((u+1.2)/10.8)**2))+dz,r,u];
  const poly=(Q,w,col,close,fill)=>{const P=Q.map(M);let segs=[[P[0]]];for(let i=1;i<P.length;i++){if(Math.abs(P[i][0]-P[i-1][0])>FW/2)segs.push([]);segs[segs.length-1].push(P[i])}// 그림 좌우 끝을 넘는 선은 나눠 긋는다
   for(const sg of segs){if(sg.length<2)continue;c.beginPath();sg.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));if(close)c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(w>0){c.strokeStyle=col;c.lineWidth=w*U;c.stroke()}}};
  const ln=(pts,w,col)=>poly(pts.map(([r,u])=>FL(r,u)),w,col);
  for(const sd of[-1,1]){const r=sd*3.1;
   if(o.ball&&!(o.PATCH&&sd<0)){const E=[];for(let k=0;k<24;k++){const t=k/24*6.2832;E.push(FL(r+Math.cos(t)*.85,Math.sin(t)*.85,.2))}poly(E,0,INK,true,INK)}// 눈동자
   if(o.PATCH&&sd<0){const E=[];for(let k=0;k<24;k++){const t=k/24*6.2832;E.push(FL(r+Math.cos(t)*2.1,.3+Math.sin(t)*1.85))}poly(E,.12,INK,true,INK)}// 외눈 안대(먹색 판)
   else if(o.ey==='x'){ln([[r-1,1],[r+1,-1]],.64,INK);ln([[r-1,-1],[r+1,1]],.64,INK)}else if(o.ey==='narrow')ln([[r-1.4,0],[r+1.4,.15]],.7,INK);
   ln(o.ey==='fierce'?[[r-sd*1.7,1.6],[r+sd*1.5,3.2]]:[[r-sd*1.5,2.3],[r+sd*1.5,2.6]],o.ey==='fierce'?1:.76,o.brow)}// 눈썹
  if(o.full){const nz=o.nz,NL=nz==='hook'?[[0,-.6],[0,-1.8],[0,-3.4],[-.9,-3.8]]:nz==='broad'?[[.3,-1],[.3,-3]]:[[.5,-1.2],[.9,-3.6],[-.4,-3.6]];poly(NL.map(([r,u],i)=>FL(r,u,nz==='hook'?[1.4,2.6,2.4,1.2][i]:nz==='broad'?[1,1.6][i]:[.9,1.6,1.3][i])),.6,INK);// 코 선
   if(nz==='broad')for(const sd of[-1,1]){const E=[];for(let k=0;k<12;k++){const t=k/12*6.2832;E.push(FL(sd*1.3+Math.cos(t)*.4,-3.6+Math.sin(t)*.4,1.1))}poly(E,0,INK,true,INK)}
   const MW=2.4,mo=o.mo;if(mo==='open')poly([[-2,-6.4],[0,-5.9],[2,-6.4],[0,-8.2]].map(([r,u])=>FL(r,u)),.15,INK,true,'#5a2a22');else ln(mo==='smile'?[[-MW,-6],[-1,-6.5],[0,-6.6],[1,-6.5],[MW,-6]]:mo==='frown'?[[-MW,-6.7],[-1,-6.2],[0,-6.1],[1,-6.2],[MW,-6.7]]:[[-MW,-6.4],[MW,-6.4]],.7,'#6b3328');
   if(o.bd==='mustache'||o.bd==='full'){const MS_=[[-3.6,-6.9],[-1.6,-5.3],[0,-5.1],[1.6,-5.3],[3.6,-6.9]];ln(MS_,2,INK);ln(MS_,1.5,o.hairC)}// 콧수염
   if(o.bd==='goatee')poly([[-2.2,-7.4],[2.2,-7.4],[1.7,-10.6],[0,-12.6],[-1.7,-10.6]].map(([r,u])=>FL(r,u)),.35,INK,true,o.hairC);// 턱수염
   if(o.bd==='full'){const la=-.35,P=[];for(let q=0;q<=72;q++){const t=q/72*6.2832-Math.PI;P.push([-.4+9.6*Math.cos(la)*Math.cos(t),8.8*Math.cos(la)*Math.sin(t),-1.6+11.2*Math.sin(la)])}poly(P,.6,INK)}}// 덥수룩한 수염 윗단
  if(o.PATCH){const zt=x=>x>.45?.42:x>.25?lerp(-.05,.42,(x-.25)/.2):x>-.1?-.05:x>-.3?lerp(-.5,-.05,(x+.3)/.2):-.5,P=[];// 안대 끈: 안대에서 관자놀이를 지나 머리를 비스듬히 한 바퀴
   for(let q=0;q<=72;q++){const t=-.35+q/72*6.2832,z=2+3*Math.sin(t),onH=o.hair!=='bald'&&((z+1)/12)>zt(Math.cos(t))&&Math.abs(Math.sin(t))>.2,E_=onH?[10.3,9.3,12,-.9,-1]:[9.2,8.2,10.8,-.6,-1.2],k=Math.sqrt(Math.max(0,1-((z-E_[4])/E_[2])**2));P.push([E_[3]+E_[0]*k*Math.cos(t),E_[1]*k*Math.sin(t),z])}poly(P,.6,INK)}
  if(!facetx)facetx=gl.createTexture();gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,facetx);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,fcv);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0)}
 // ─ 투구 상세 텍스처: 가로 = 머리 둘레 방위각(앞이 가운데), 세로 = 높이(위 20 → 아래 -14). 2D 투구에 덧그리던 눈구멍·숨구멍·능선·리벳·띠·눈썹판을 여기에 그린다 ─
 const TXW=1024,TXH=512,tcv=document.createElement('canvas');tcv.width=TXW;tcv.height=TXH;
 function helmTex(m,kit,F,up,HC,TC,sk){const key=JSON.stringify([F,up,kit&&[kit.slit,kit.breaths,kit.vridge,kit.vdesign,kit.rivets,kit.bands,kit.face,kit.width,kit.visor],HC,TC,sk,m.fEye,!!m.patch,HWK,AW]);if(key===hkey)return;hkey=key;
  const c=tcv.getContext('2d'),INK='#1d1a17',X=(r,R=13)=>(.5+Math.atan2(r,R)/6.2832)*TXW,XA=a=>(.5+a/6.2832)*TXW,Y=z=>(20-z)/34*TXH,U=TXH/34;c.clearRect(0,0,TXW,TXH);c.lineCap='round';c.lineJoin='round';
  // 투구 상세 굵기 배율: KM(눈 틈은 0이어도 0.7배로 남김)
  let KM=AW;const EK=HWK>0?HWK:.7;
  const band=(r0,r1,z,h,col=INK,R=13)=>{if(h*KM<=0)return;c.strokeStyle=col;c.lineWidth=h*U*KM;c.beginPath();c.moveTo(X(r0,R),Y(z));c.lineTo(X(r1,R),Y(z));c.stroke()},dot=(r,z,rad,col=INK,R=13)=>{if(rad*KM<=0)return;rad*=KM;c.fillStyle=col;c.beginPath();c.arc(X(r,R),Y(z),rad*U,0,7);c.fill()},vline=(r,z0,z1,w,col,R=13)=>{if(w*KM<=0)return;c.strokeStyle=col;c.lineWidth=w*U*KM;c.beginPath();c.moveTo(X(r,R),Y(z0));c.lineTo(X(r,R),Y(z1));c.stroke()};
  const ring=(z,w,col)=>{if(w*KM<=0)return;c.strokeStyle=col;c.lineWidth=w*U*KM;c.beginPath();c.moveTo(0,Y(z));c.lineTo(TXW,Y(z));c.stroke()},rivRow=(z,col,step=.42,rad=.42)=>{if(KM<=0)return;rad*=Math.sqrt(KM);for(let a=-Math.PI+step/2;a<Math.PI;a+=step){c.fillStyle=col;c.beginPath();c.arc(XA(a),Y(z),rad*U,0,7);c.fill();c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.arc(XA(a)-rad*U*.3,Y(z)+-rad*U*.3,rad*U*.35,0,7);c.fill()}};
  const slit=(su,R)=>{const t=kit?kit.slit||'single':'single';if(t==='none')return;const k0=KM;KM=EK;if(t==='double'){band(-6.6,6.6,su+.9,.9,INK,R);band(-6.6,6.6,su-.9,.9,INK,R)}else if(t==='eyes'){band(-6.2,-1.3,su,1.3,INK,R);band(1.3,6.2,su,1.3,INK,R)}else{band(-7,7,su,1.35,INK,R);if(t==='cross')vline(0,su,su-4.5,1.1,INK,R)}KM=k0};
  const breaths=(zs,R)=>{const b=kit?kit.breaths||'holes':'holes';if(b==='none')return;const k0=KM;KM=1;for(const z of zs)for(let r=-4.2;r<=4.21;r+=1.4){if(b==='oneside'&&r<.5)continue;if(b==='slots')vline(r,z+.8,z-.8,.5,INK,R);else dot(r,z,.45,INK,R)}KM=k0};// 숨구멍: 배율 없이 고정 크기
  const ridge=(z0,z1,R)=>{if(kit&&kit.vridge===false)return;vline(.25,z0,z1,.5,'rgba(255,255,255,.65)',R);vline(-.25,z0,z1,.45,'rgba(29,26,23,.55)',R)};
  const pivot=z=>{if(KM<=0)return;for(const a of[-Math.PI/2,Math.PI/2]){c.fillStyle=TC;c.beginPath();c.arc(XA(a),Y(z),1*U*Math.sqrt(KM),0,7);c.fill();c.strokeStyle=INK;c.lineWidth=.25*U;c.stroke()}};
  if(F==='great'){KM=EK;band(-6.5,-1,2.3,1.2);band(1,6.5,2.3,1.2);KM=AW;vline(0,8,-11,.6,'rgba(29,26,23,.5)');KM=1;for(let r=2;r<=6;r+=1.3)for(let z=-4;z>=-8.5;z-=1.5)dot(r,z,.4);KM=AW;rivRow(-11,TC);ring(-11.8,.5,'rgba(29,26,23,.4)')}
  else if(F==='kettle'){rivRow(5.8,TC,.5,.45);ring(4.6,.5,'rgba(29,26,23,.45)')}
  else if(F==='jin'||F==='jin2'){ring(3.6,.95,TC);rivRow(3.6,INK,.45,.25);vline(0,4.2,13.4,.95,TC);
   if(!up){// 눈썹판(금색) + 드림 앞 눈 틈(피부색과 눈)
    if(KM>0)for(const sd of[-1,1]){c.fillStyle=TC;c.beginPath();for(let k=0;k<=6;k++){const r=sd*(1.2+k*1.05),z=3.9+(.2+Math.sin(k/6*Math.PI)*1.6+(6-k)*.12+.9)*Math.min(KM,2);k?c.lineTo(X(r,11),Y(z)):c.moveTo(X(r,11),Y(z))}for(let k=6;k>=0;k--){const r=sd*(1.2+k*1.05);c.lineTo(X(r,11),Y(3.9))}c.closePath();c.fill();c.strokeStyle=INK;c.lineWidth=.2*U;c.stroke()}
    /* 드림 눈구멍은 이제 실제로 뚫고 안의 얼굴을 보여 준다(그림에는 그리지 않음) */}}
  else if(F==='parts'){const op=['open','nasal','cheek','close','kettle','joguan','jin','jin2','peak','closed'].includes(kit.face)||(['visor','mask'].includes(kit.face)&&kit.visor==='up'),Rw=12*(kit.width||1);if(kit.face==='peak'){if(kit.visor!=='up'){slit(5,15);breaths([-2,-4.5,-7],15);ridge(10,-12,15)}pivot(5.5)}else if(kit.face==='closed'){if(kit.visor!=='up'){slit(2.4,15);breaths([-3,-5.5,-8],15);ridge(5,-10,15)}pivot(3)}/* 뾰족·면갑 투구 얼굴: 그 투구와 같은 눈 틈·숨구멍·능선·축 */// 부품 조립 투구: 2D faceParts와 같은 눈 틈·숨구멍
   if(!op){KM=EK;const sl=kit.slit||'none';if(sl==='single'||sl==='cross')band(-7.5,7.5,2.5,1.35,INK,Rw);if(sl==='double'){band(-7.5,7.5,3.4,1,INK,Rw);band(-7.5,7.5,1.4,1,INK,Rw)}if(sl==='cross')vline(0,2.5,-7.5,1.2,INK,Rw);if(sl==='eyes'){band(-5.8,-1.4,2.6,1.25,INK,Rw);band(1.4,5.8,2.6,1.25,INK,Rw)}
    KM=1;const bb=kit.breaths||'none';for(const sd of[-1,1]){if(bb==='holes'){for(let r=3;r<=7.5;r+=1.5)for(let u=-3.5;u>=-9.6;u-=2)dot(sd*r,u,.42,INK,Rw)}else if(bb==='slots'||(bb==='oneside'&&sd===1)){for(let r=3;r<=7.2;r+=1.4)vline(sd*r,-3,-8,.55,INK,Rw)}}KM=AW}}
  else if(F==='peak'||F==='peakup'){rivRow(-13,TC,.45,.4);if(!up){slit(5,15);breaths([-2,-4.5,-7],15);ridge(10,-12,15)}pivot(5.5)}
  else{rivRow(-11,TC,.45,.4);if(!up){slit(2.4,15);breaths([-3,-5.5,-8],15);ridge(5,-10,15)}pivot(3)}
  if(kit&&kit.rivets&&F!=='parts')rivRow(0,TC,.6,.35);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,htex);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,tcv);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0)}
 // ─ 칼 ─
 function sword(m,K){const p=m.pal||{},d=K.d,hd=K.hd,pom=vsub(hd,vmul(d,14)),guard=vadd(hd,vmul(d,4)),tip=vadd(hd,vmul(d,bladeLen(m)));let gv=vcross(d,[0,0,1]);if(vlen(gv)<.2)gv=[0,1,0];gv=norm(gv);
  tube(pom,guard,1.8,1.8,p.leather||'#5a3e2a',.2);ellip(v=>vadd(pom,v),2.8,2.8,2.8,0,0,p.trim||'#c9a24a');tube(vsub(guard,vmul(gv,8)),vadd(guard,vmul(gv,8)),1.2,1.2,p.trim||'#7d878d',.6);
  // 칼날: 납작한 마름모 단면을 손잡이→칼끝으로 로프트
  const th=norm(vcross(d,gv)),bw=2.4,bt=.5;CB=bone([guard,gv,th,d]);/* 칼 뼈 */const sec=(c,w)=>[vadd(c,vmul(gv,w)),vadd(c,vmul(th,bt*w/bw)),vsub(c,vmul(gv,w)),vsub(c,vmul(th,bt*w/bw))];loft([sec(guard,bw),sec(vlerp(guard,tip,.85),bw*.85),sec(tip,.05)],p.blade||'#dfe3e4',{capB:true,center:vlerp(guard,tip,.5)})}

 // ─ 로봇: 3D 월드와 같은 부품 배치를 이 월드의 겉면 도구(로프트)로 만든다 ─
 const seg=(A,B,r0,r1,col)=>tube(A,B,r0,r1,col,.4);
 const ball=(C,rx,ry,rz,col,o={})=>{const f=o.f||[1,0,0],r=o.r||[0,1,0],u=o.u||[0,0,1];ellip(v=>vadd(C,vadd(vadd(vmul(f,v[0]),vmul(r,v[1])),vmul(u,v[2]))),rx,ry,rz,0,0,col)};
 const boxF=(C,f,r,u,col)=>{const b=bone([C,f,r,u]);if(MODE==='bone')return;const cb0=CB;CB=b;PID++;const P=(a,b,c)=>vadd(C,vadd(vadd(vmul(f,a),vmul(r,b)),vmul(u,c))),ring=c=>[P(1,1,c),P(-1,1,c),P(-1,-1,c),P(1,-1,c)];const R=[ring(-1),ring(1)];
  // 상자 면은 평평하게: 면마다 따로 삼각형(꼭짓점 법선 = 면 법선)
  const C3=hex(col),F_=[[P(1,-1,-1),P(1,1,-1),P(1,1,1),P(1,-1,1),f],[P(-1,1,-1),P(-1,-1,-1),P(-1,-1,1),P(-1,1,1),vmul(f,-1)],[P(1,1,-1),P(-1,1,-1),P(-1,1,1),P(1,1,1),r],[P(-1,-1,-1),P(1,-1,-1),P(1,-1,1),P(-1,-1,1),vmul(r,-1)],[P(1,1,1),P(-1,1,1),P(-1,-1,1),P(1,-1,1),u],[P(1,-1,-1),P(-1,-1,-1),P(-1,1,-1),P(1,1,-1),vmul(u,-1)]];
  for(const[a,b,c,d,n] of F_){const nn=norm(n);push(a,nn,C3);push(b,nn,C3);push(c,nn,C3);push(a,nn,C3);push(c,nn,C3);push(d,nn,C3)}CB=cb0};
 const box=(C,hx,hy,hz,col,o={})=>boxF(C,vmul(o.f||[1,0,0],hx),vmul(o.r||[0,1,0],hy),vmul(o.u||[0,0,1],hz),col);
 const boxAB=(A,B,w,t,col,side)=>{const ax=vsub(B,A),L0=vlen(ax),L=Math.max(L0,1e-4),z=L0<1e-4?[0,0,1]:vmul(ax,1/L);let s_=side||[0,1,0];s_=vsub(s_,vmul(z,vdot(s_,z)));if(vlen(s_)<.1){s_=vcross(z,[0,0,1]);if(vlen(s_)<.1)s_=[1,0,0]}s_=norm(s_);const th=norm(vcross(z,s_));boxF(vlerp(A,B,.5),vmul(s_,w),vmul(th,t),vmul(z,L/2),col)};
 const perp=ax=>{let u=vcross(ax,[0,0,1]);if(vlen(u)<.2)u=vcross(ax,[1,0,0]);u=norm(u);return[u,norm(vcross(ax,u))]};
 let parts=[];// 3D 월드 코드와 호환용(쓰지 않음)
 function mechSkel(m,pose,down){const mech=m.style==='mech',bd=m.body||{},bT=bd.torso??1,LM=bd.limb??1,bL=bd.leg??1,bS=bd.shoulder??1,hs=bd.head??1,bN=bd.neck??1,legDrop=48-48*bL;
  const feet=pose.feet||KDEF.feet,crouch=pose.crouch??0,elb=pose.elb??0,nod=pose.nod??0,L=pose.lean+(down||0)*14,drop=(down||0)*30+crouch,H0=48*bL-drop,bend=u=>L*(u-H0)/60,T=u=>[bend(u),0,u],uS=H0+40;
  const legs=[0,1].map(i=>{const side=i?1:-1,Hp=mech?[0,side*8*bT,H0-2]:[0,side*9*bT,H0],F=[feet[i][0],feet[i][1],0],K=ik2(Hp,F,(mech?23.1:25.5)*bL,(mech?23.1:25.5)*bL,[1,side*(mech?.1:.45),0]),toe=norm([1,side*(mech?.15:.32),0]),A=vadd(F,[0,0,mech?6:5]);return{side,Hp,K,F,A,toe}});
  const hd=[pose.h[0]+L*(pose.h[2]-48)/60,pose.h[1],pose.h[2]-drop-legDrop],d=norm(pose.d),sword=!mech||m.weapon==='sword';
  const op=pose.off||KDEF.off,off=mech?(sword?vsub(hd,vmul(d,11)):[op[0]+L*(op[2]-48)/60,op[1],op[2]-drop-legDrop]):vsub(hd,vmul(d,10));
  const arms=[0,1].map(i=>{const side=i?1:-1,S=mech?[bend(uS),side*18*bS,uS-1]:[bend(uS),side*16*bS,uS],Hn=i?hd:off,E=mech?ik2(S,Hn,22,22,[-.4,side*(.6+elb*.8),-.8]):ik2(S,Hn,23,22,[-.35,side*(.7+elb*.8),-.8]);return{side,S,E,Hn}});
  const head=mech?vadd(T(uS+11*bN+2),[nod*4,0,-nod*2]):vadd(T(uS+18*bN),[nod*5,0,-nod*3]);
  const nA=nod*.6,hyw=pose.hyaw??0,cP=Math.cos(nA),sP=Math.sin(nA),cY=Math.cos(hyw),sY=Math.sin(hyw),HR=v=>{const[f,r,u]=v,f2=f*cP+u*sP,u2=u*cP-f*sP;return[f2*cY-r*sY,f2*sY+r*cY,u2]};
  return{mech,bT,LM,hs,bS,legs,arms,hd,d,sword,H0,uS,T,bend,head,HR,blade:bladeLen(m)}}
 function mechBody(m,K){const p=m.pal||{},body=p.body||'#e8e4da',acc=p.accent||'#c4512b',dk=p.dark||'#3b3f46',jt=p.joint||'#8d9196',{bT,LM,T,H0,uS}=K,LN=m.frame==='lance';
  for(const g of K.legs){const sv=[-g.toe[1],g.toe[0],0];seg(g.Hp,g.K,(LN?3.8:4.6)*LM,(LN?3.4:4.2)*LM,jt);ball(g.K,5*LM,5*LM,5*LM,jt);boxAB(vadd(g.K,[0,0,1]),g.A,6*LM,6*LM,acc,sv);if(LN)boxAB(vadd(g.K,[3,0,-3]),vadd(g.K,[2,0,8]),3*LM,1.2,body,sv);
   const heel=vadd(g.F,vmul(g.toe,-7)),tip=vadd(g.F,vmul(g.toe,LN?17:15));boxAB(vadd(heel,[0,0,3]),vadd(tip,[0,0,2]),7*LM,2.8,acc,sv)}
  box(T(H0-1.5),9*bT,11*bT,6.5,dk);box(T(H0+12),7*bT,(LN?7:9)*bT,7,jt);box(T((H0+18+uS+3)/2),9.5*bT,(LN?16:15)*bT,(uS+3-H0-18)/2,body);
  if(m.skirt)for(const sd of[-1,1])boxAB([K.bend(H0+3),sd*12.5*bT,H0+3],[0,sd*14*bT,H0-12],7*bT,1.6,body,[1,0,0]);
  for(const g of K.arms){const fw=norm(vsub(g.Hn,g.E)),wr=vsub(g.Hn,vmul(fw,4));ball(g.S,5*LM,5*LM,5*LM,jt);box(vadd(g.S,[0,g.side*3,0]),7*(m.body?.pad??1),7*(m.body?.pad??1),7*(m.body?.pad??1),body);
   if(LN){boxAB(vadd(g.S,[-.5,g.side*8.2,-4]),vadd(g.S,[-3,g.side*12.5,17]),7,.9,body,norm([.5,g.side*.86,0]));ball(vadd(g.S,[1,g.side*11,6]),2.4,2.4,2.4,p.glow||'#62c4f0')}
   seg(g.S,g.E,3.4*LM,3.2*LM,jt);ball(g.E,4.4*LM,4.4*LM,4.4*LM,jt);boxAB(vadd(g.E,vmul(fw,1)),wr,5.6*LM,5.6*LM,LN?body:acc);box(g.Hn,4.4*LM,4.6*LM,4.6*LM,jt,{f:fw,r:norm(vcross([0,0,1],fw)),u:norm(vcross(fw,norm(vcross([0,0,1],fw))))})}
  const hd_=K.head,HR=K.HR,hs=K.hs,f=HR([1,0,0]),r=HR([0,1,0]),u=HR([0,0,1]),hdm=m.hdim||{};seg(T(uS+2),vadd(hd_,vmul(u,-6*hs)),4.2,3.8,jt);box(hd_,6.8*hs*(hdm.d??1),6.5*hs*(hdm.w??1),6.5*hs*(hdm.h??1),p.head||body,{f,r,u});box(vadd(hd_,vadd(vmul(f,6.9*hs*(hdm.d??1)),vmul(u,1.5*hs))),.5,4.4*hs,.8*hs,p.glow||'#ffd23f',{f,r,u});
  if(m.crest==='fin')boxAB(vadd(hd_,vmul(u,6.5*hs)),vadd(hd_,vmul(u,15*hs)),4*hs,.6,p.trim||'#2f5d8a',f);
  if(m.capeOn){const SL=K.arms[0].S,SR=K.arms[1].S,hemU=Math.max(4,H0*.1),q=[vadd(SL,[-4.5,-1.5,3]),vadd(SR,[-4.5,1.5,3]),[K.bend(hemU)-17,26*bT,hemU],[K.bend(hemU)-17,-26*bT,hemU]],R=[];CB=bone(torsoF(K));const BCh=bone([[K.bend(hemU)-17,0,hemU],[1,0,0],[0,1,0],[0,0,1]]);/* 망토: 윗단은 몸통 뼈, 아랫단은 단 뼈, 사이는 섞음 */
   if(MODE==='mesh'){const TP=[],BT2=[],off=i=>[-Math.sin(i/8*Math.PI*4)*1.2,0,0];for(let i=0;i<=8;i++){TP.push(vlerp(q[0],q[1],i/8));BT2.push(vlerp(q[3],q[2],i/8))}for(let j=0;j<=6;j++){const t=j/6,a=[];for(let i=0;i<=8;i++)a.push(vadd(vlerp(TP[i],BT2[i],t),vmul(off(i),t)));R.push(a)}TAG=0;loft(R,p.mcape||'#283a6b',{open:true,center:T(H0+20),two:{pa:(j,i)=>TP[i],pb:(j,i)=>vadd(BT2[i],off(i)),bb:BCh,t:j=>j/6}});TAG=2}}/* 망토: 주름진 천 면 */}
 function mechSword(m,K){if(!K.sword)return null;const p=m.pal||{},d=K.d,hd=K.hd,mech=K.mech,pom=vsub(hd,vmul(d,mech?17:14)),guard=vadd(hd,vmul(d,mech?5:4)),tip=vadd(hd,vmul(d,K.blade));let gv=vcross(d,[0,0,1]);if(vlen(gv)<.2)gv=[0,1,0];gv=norm(gv);
  seg(pom,guard,1.6,1.6,p.leather||p.dark||'#5a3e2a');ball(pom,2.6,2.6,2.6,p.trim||'#c9a24a');boxAB(vsub(guard,vmul(gv,0)),vadd(guard,vmul(d,2.4)),mech?10:8,1.6,p.trim||'#7d878d',gv);boxAB(guard,tip,mech?3.2:2.4,.6,p.blade||'#dfe3e4',gv);return{guard,tip}}

 function mechM(m,K){const K2=mechSkel(m,K.pose,K.down);K2.m=m;mechBody(m,K2);const sw=mechSword(m,K2);K.hd=K2.hd;K.d=K2.d;K.blade=K2.blade;K.mech=true}
 // ─ 섬광 궤적(3D): 타격을 시작할 때 앞 키 자세→타격 자세를 미리 따라가며 칼날(코등이→칼끝) 위치를 구해 두고,
 // 그 칼날들이 쓸고 가는 3D 띠를 지금 칼까지만 드러낸다. 칼끝 바깥으로 손가락처럼 갈라진 빛꼬리, 지금 칼날 앞에 밝은 섬광 머리.
 // 흰빛·옅은 노랑이 번갈아 깜빡이고, 노란빛 차례엔 손 쪽을 중심으로 6% 커진다(울렁임). 먹 궤적을 고르면 같은 띠를 먹색으로.
 let FX=null;const bladeOf=K=>{const mc=K.m&&K.m.style==='mech',g=vadd(K.hd,vmul(K.d,mc?5:4)),t=vadd(K.hd,vmul(K.d,bladeLen(K.m)));return{g,t}};
 function fxBuild(m,o){const SM=[];for(let q=0;q<=16;q++){const t=q/16,ps=mixK(P0(o.pk.pose),o.k.pose,t),dn=lerp(o.pk.down||0,o.k.down||0,t),K=m.style==='mech'?mechSkel(m,ps,dn):skel(m,ps,dn);K.m=m;SM.push(bladeOf(K))}return{idx:o.idx,SM}}
 function fxDraw(m,K,o){const EV=[],ink=o.mode==='ink',fl=((o.clock/(o.per||60))|0)%2,col=ink?[.12,.11,.1]:fl?[1,1,1]:[1,.96,.67],P=(p,a,c=col)=>EV.push(p[0],p[1],p[2],a,0,0,c[0],c[1],c[2]);// 효과는 꼬리표 0
  const cur=bladeOf(K),SM=FX.SM;let j=0,bd=1e9;for(let i=0;i<SM.length;i++){const d=vlen(vsub(SM[i].t,cur.t));if(d<bd){bd=d;j=i}}
  const pts=SM.slice(0,j+1).concat([cur]),n=pts.length;if(n<2)return EV;const sc=(!ink&&!fl)?1.06:1,ex=(e,k)=>{const g=e.g,t=e.t,d=vsub(t,g);return[vadd(g,vmul(d,.15*sc)),vadd(g,vmul(d,k*sc))]};
  for(let i=0;i<n-1;i++){const a0=(.2+.8*i/(n-1))*(ink?.5:.85),a1=(.2+.8*(i+1)/(n-1))*(ink?.5:.85),[g0,t0]=ex(pts[i],1.08),[g1,t1]=ex(pts[i+1],1.08);P(g0,a0);P(t0,a0);P(t1,a1);P(g0,a0);P(t1,a1);P(g1,a1)}
  if(!ink){// 빛꼬리: 칼끝 바깥 가장자리에서 칼날 방향으로 뻗는 손가락(가운데가 가장 김)
   // 섬광 빛줄기: 띠 안에서 칼날 위 같은 비율(f) 자리를 이어, 시작 쪽에서 지금 칼 쪽으로 흐르는 가는 줄기(2D와 같은 방향 규칙)
   const NS=Math.round(30*(o.den??1)),rn=(k,q)=>{const x=Math.sin(k*12.9898+q*78.233+fl*3.1)*43758.5453;return x-Math.floor(x)};
   for(let k=0;k<NS;k++){const f=.18+rn(k,1)*.9,i0=Math.floor(rn(k,2)*(n-1)*.7),i1=Math.min(n-1,i0+2+Math.floor(rn(k,3)*(n-1)*.6)),wd=vlen(vsub(pts[n-1].t,pts[n-1].g))*(k%3?.006:.014),sc_=k%3?(fl?[.4,.6,.9]:[.85,.55,.1]):[1,1,1];
    for(let i=i0;i<i1;i++){const pa=vadd(pts[i].g,vmul(vsub(pts[i].t,pts[i].g),f*sc)),pb=vadd(pts[i+1].g,vmul(vsub(pts[i+1].t,pts[i+1].g),f*sc)),bn=vmul(norm(vsub(pts[i].t,pts[i].g)),wd),a0=(i-i0)/(i1-i0)*.9,a1=(i+1-i0)/(i1-i0)*.9;P(vsub(pa,bn),a0,sc_);P(vadd(pa,bn),a0,sc_);P(vadd(pb,bn),a1,sc_);P(vsub(pa,bn),a0,sc_);P(vadd(pb,bn),a1,sc_);P(vsub(pb,bn),a1,sc_)}}
   const NF=Math.max(1,Math.min(30,Math.round(o.tailN||5))),TP=o.tailPos??0,TA=o.tailArc??.5;for(let k=0;k<NF;k++){const u0=k/NF,u1=(k+1)/NF,um=(u0+u1)/2,at=u=>{const x=u*(n-1),i=Math.min(n-2,Math.floor(x)),f=x-i;return{g:vlerp(pts[i].g,pts[i+1].g,f),t:vlerp(pts[i].t,pts[i+1].t,f)}},A=at(u0),B=at(u1),M=at(um),dA=ex(A,1.08)[1],dB=ex(B,1.08)[1],dir=norm(vsub(M.t,M.g)),L=vlen(vsub(M.t,M.g))*(.08+.45*TA*Math.sin(um*Math.PI))*(1.2-TP)/1.2,tip=vadd(ex(M,1.08)[1],vmul(dir,L)),al=.25+.5*um;P(dA,al);P(dB,al);P(tip,al*.3)}
   // 섬광 머리: 지금 칼날 앞쪽으로 살짝 내민 밝은 띠
   if(n>=2){const pv=pts[n-2],mv=vsub(cur.t,pv.t),ml=vlen(mv);if(ml>1e-3){const fw=vmul(mv,1/ml),[g,t]=ex(cur,1.1),w=vlen(vsub(cur.t,cur.g))*.06*(o.glow||1.2),g2=vadd(g,vmul(fw,w*.5)),t2=vadd(t,vmul(fw,w));P(g,1);P(t,1);P(t2,.9);P(g,1);P(t2,.9);P(g2,.9)}}}
  return EV}
 function view(X,Y,s,W,H){const cs=Math.cos(W3HOST.VIEW.yaw),sn=Math.sin(W3HOST.VIEW.yaw),sq=W3HOST.VIEW.sq,uk=W3HOST.VIEW.uk,r=[cs,-sn,0],u=[-sn*sq,-cs*sq,uk],b=[sn*uk,cs*uk,sq],ax=2*s/W,ay=2*s/H,bx=2*X/W-1,by=1-2*Y/H,z=-1/2000;
  return[ax*r[0],ay*u[0],z*b[0],0, ax*r[1],ay*u[1],z*b[1],0, ax*r[2],ay*u[2],z*b[2],0, bx,by,0,1]}
 function render(m,pose,down,X,Y,s,W,H,DPR,o={}){if(!init())return false;if(m.style!=='knight'&&m.style!=='mech')return false;AW=o.wArm??1;HWK=1;const mk=JSON.stringify(m)+'|'+AW+'|'+dstep()+'|'+dshape()+'|'+dgap()+'|'+ddir()+'|'+dov();/* 머리 배율은 없앰(눈·코·입·투구 눈 틈은 기본 크기 고정) */if(!o.old&&skOK()&&SKBAD!==mk){if(renderSk(m,pose,down,X,Y,s,W,H,DPR,o,mk))return true;SKBAD=mk}lastStat={cpu:0,bone:0,n:1,old:true};// 스키닝을 못 쓰면(확장 미지원·뼈 수 불일치) 예전 방식
  const w=Math.round(W*DPR),h=Math.round(H*DPR);if(cvs.width!==w||cvs.height!==h){cvs.width=w;cvs.height=h}gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
  V=[];IDS=[];HLA=[];SKA=[];DEC=[];PM=[];PMX={};PML=0;PF=[];PFL=0;MODE='mesh';BI=0;CB=0;REST=[];HLOC=null;PID=0;TAG=2;const K=skel(m,pose,down);K.m=m;K.pose=pose;K.down=down;if(m.style==='mech')mechM(m,K);else{knight(m,K,pose);sword(m,K)}
  gl.useProgram(prog);const cs=Math.cos(W3HOST.VIEW.yaw),sn=Math.sin(W3HOST.VIEW.yaw),U=n=>gl.getUniformLocation(prog,n);gl.uniformMatrix4fv(U('V'),false,view(X,Y,s,W,H));noSkin();gl.uniform3fv(U('L'),norm([sn*.9-cs*.7,cs*.9+sn*.7,1.1]));gl.uniform3fv(U('ink'),[.07,.065,.06]);gl.uniform3fv(U('B'),[sn*W3HOST.VIEW.uk,cs*W3HOST.VIEW.uk,W3HOST.VIEW.sq]);gl.uniform3fv(U('SR'),[cs,-sn,0]);gl.uniform3fv(U('SU'),[-sn*W3HOST.VIEW.sq,-cs*W3HOST.VIEW.sq,W3HOST.VIEW.uk]);gl.uniform1f(U('SM'),{toon:1,screen:2,matcap:3}[o.shade]||2);gl.uniform1f(U('BRU'),m.paint==='brush'?1:0);{const pp=m.pal||{},st=pp.steel||'#d9dee0';gl.uniform3fv(U('PST'),hex(st));gl.uniform3fv(U('PSH'),hex(pp.shade||hexMix(st,'#14161e',.4)));gl.uniform3fv(U('PHI'),hex(pp.hi||'#ffffff'))}
  const A=new Float32Array(V);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,A,gl.DYNAMIC_DRAW);const pL=gl.getAttribLocation(prog,'p'),nL=gl.getAttribLocation(prog,'n'),cL=gl.getAttribLocation(prog,'c');
  for(const[l,o] of[[pL,0],[nL,12],[cL,24]]){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,3,gl.FLOAT,false,36,o)}const cnt=A.length/9;
  const iL=gl.getAttribLocation(prog,'id');gl.bindBuffer(gl.ARRAY_BUFFER,ib);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(IDS),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(iL);gl.vertexAttribPointer(iL,1,gl.FLOAT,false,4,0);const hL=gl.getAttribLocation(prog,'hl');gl.bindBuffer(gl.ARRAY_BUFFER,hb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(HLA),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(hL);gl.vertexAttribPointer(hL,4,gl.FLOAT,false,16,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,htex);gl.uniform1i(U('HT'),1);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,stex);gl.uniform1i(U('ST'),2);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,mtex);gl.uniform1i(U('MC'),3);gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,ltex);gl.uniform1i(U('LT'),5);gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,facetx||ltex);gl.uniform1i(U('FT'),6);{const a_=decUp(ATO);ATO=a_;gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,a_.tex);gl.uniform1i(U('AT'),7);gl.uniform2f(U('ATs'),a_.W,a_.TH)}gl.activeTexture(gl.TEXTURE0);gl.bindBuffer(gl.ARRAY_BUFFER,vb);
  // 1) 부품 번호 그림(경계선 계산용)
  fboSize(w,h);gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(U('ow'),0);gl.uniform1f(U('flat_'),3);gl.drawArrays(gl.TRIANGLES,0,cnt);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);
  // 외곽선: 뒷면만 법선 방향으로 부풀려 먹색(뒤집은 껍질)
  // 바깥을 향한 면은 버리고 뒤쪽 면만 남긴다(감김 방향과 무관)
  gl.uniform1f(U('flat_'),0);gl.uniform1f(U('ow'),0);gl.drawArrays(gl.TRIANGLES,0,cnt);
  // 2) 부품 경계선: 번호가 바뀌는 곳에 먹선(관절·겹친 부품 사이)
  if(o.edges!==false){gl.disableVertexAttribArray(iL);gl.disableVertexAttribArray(hL);gl.disable(gl.DEPTH_TEST);gl.useProgram(eprog);gl.bindBuffer(gl.ARRAY_BUFFER,qb);const qL=gl.getAttribLocation(eprog,'q');for(const l of[pL,nL,cL])gl.disableVertexAttribArray(l);gl.enableVertexAttribArray(qL);gl.vertexAttribPointer(qL,2,gl.FLOAT,false,0,0);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,ftex);gl.uniform1i(gl.getUniformLocation(eprog,'T'),0);gl.uniform2f(gl.getUniformLocation(eprog,'px'),1/w,1/h);gl.uniform1f(gl.getUniformLocation(eprog,'wo'),(o.wOut??.8)*DPR);gl.uniform1f(gl.getUniformLocation(eprog,'wb'),(o.wBnd??.8)*DPR);gl.uniform1f(gl.getUniformLocation(eprog,'BRU'),m.paint==='brush'?1:0);gl.uniform3fv(gl.getUniformLocation(eprog,'ink'),[.07,.065,.06]);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLES,0,3);gl.disable(gl.BLEND);gl.disableVertexAttribArray(qL);
   gl.useProgram(prog);gl.enable(gl.DEPTH_TEST);gl.enableVertexAttribArray(hL);gl.bindBuffer(gl.ARRAY_BUFFER,vb);for(const[l,of] of[[pL,0],[nL,12],[cL,24]]){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,3,gl.FLOAT,false,36,of)}}
  gl.disableVertexAttribArray(iL);gl.vertexAttrib1f(iL,0);gl.disableVertexAttribArray(hL);gl.vertexAttrib4f(hL,0,0,0,0);
  // 섬광 궤적: 타격 키 동안만. 투명하게 섞고 깊이는 비교만(쓰지 않음) → 몸 뒤로 가면 가려진다
  if(o.strike&&o.mode&&o.mode!=='none'){if(!FX||FX.idx!==o.idx)FX=fxBuild(m,o);K.m=m;const EV=fxDraw(m,K,o);if(EV.length){const EA=new Float32Array(EV);gl.bufferData(gl.ARRAY_BUFFER,EA,gl.DYNAMIC_DRAW);for(const[l,of] of[[pL,0],[nL,12],[cL,24]])gl.vertexAttribPointer(l,3,gl.FLOAT,false,36,of);
   gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-2,-2);gl.uniform1f(U('flat_'),2);gl.drawArrays(gl.TRIANGLES,0,EA.length/9);gl.disable(gl.POLYGON_OFFSET_FILL);gl.depthMask(true);gl.disable(gl.BLEND)}}else FX=null;
  return true}
 // ─ 스키닝 렌더 ─
 let SKBAD='',XI=null,XF=false,VTU=0,skChecked=false,MESH=null,btex=null,insb=null,skb=null,BTD=null;
 function skOK(){if(!skChecked){skChecked=true;XI=gl.getExtension('ANGLE_instanced_arrays');XF=!!gl.getExtension('OES_texture_float');VTU=gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);btex=gl.createTexture();insb=gl.createBuffer();skb=gl.createBuffer()}return !!(XI&&XF&&VTU>0)}
 const A_=n=>gl.getAttribLocation(prog,n);
 function noSkin(){gl.uniform1f(gl.getUniformLocation(prog,'SKN'),0);gl.uniform1i(gl.getUniformLocation(prog,'BT'),4);/* 뼈 텍스처 자리를 4번에 고정(0번은 부품 번호 그림이라 겹치면 오류) */for(const nm of['pb','bw','ins']){const l=A_(nm);if(l<0)continue;gl.disableVertexAttribArray(l);if(XI&&nm==='ins')XI.vertexAttribDivisorANGLE(l,0)}gl.vertexAttrib3f(A_('bw'),-1,0,0);gl.vertexAttrib1f(A_('ins'),0)}
 // 3×4 틀 F=[o,a,b,c](열) → 행렬, 역행렬, 곱
 const fm=F=>{const[o,a,b,c]=F;return[a[0],b[0],c[0],o[0], a[1],b[1],c[1],o[1], a[2],b[2],c[2],o[2]]};
 const inv34=M=>{const[a,b,c,x,d,e,f,y,g,h,i,z]=M,A=e*i-f*h,B=-(d*i-f*g),C=d*h-e*g,dt=a*A+b*B+c*C,k=Math.abs(dt)<1e-9?0:1/dt;
  const r=[A*k,-(b*i-c*h)*k,(b*f-c*e)*k, B*k,(a*i-c*g)*k,-(a*f-c*d)*k, C*k,-(a*h-b*g)*k,(a*e-b*d)*k];return[r[0],r[1],r[2],-(r[0]*x+r[1]*y+r[2]*z), r[3],r[4],r[5],-(r[3]*x+r[4]*y+r[5]*z), r[6],r[7],r[8],-(r[6]*x+r[7]*y+r[8]*z)]};
 const mul34=(P,Q,out,o)=>{for(let r=0;r<3;r++){const p0=P[r*4],p1=P[r*4+1],p2=P[r*4+2],p3=P[r*4+3];for(let c=0;c<4;c++)out[o+r*4+c]=p0*Q[c]+p1*Q[4+c]+p2*Q[8+c]+(c===3?p3:0)}};
 const TI=[1,0,0,0,0,1,0,0,0,0,1,0],FT=new Float64Array(12),F2=new Float64Array(12),fm2=(F,o)=>{const[p,a,b,c]=F;o[0]=a[0];o[1]=b[0];o[2]=c[0];o[3]=p[0];o[4]=a[1];o[5]=b[1];o[6]=c[1];o[7]=p[1];o[8]=a[2];o[9]=b[2];o[10]=c[2];o[11]=p[2]};
 const REST_POSE=()=>P0(POSE_STAND);
 function build(m,K){if(m.style==='mech'){mechM(m,K);pmk('로봇 전체')}else{knight(m,K,K.pose);sword(m,K);pmk('칼');pfk('')}HLOC=null}
 // 겉면을 기본자세에서 한 번만 만든다(모델 설정이 바뀌면 다시)
 function ensureMesh(m,key){if(MESH&&MESH.key===key)return MESH;
  V=[];IDS=[];HLA=[];SKA=[];DEC=[];PM=[];PMX={};PML=0;PF=[];PFL=0;MODE='mesh';BI=0;CB=0;REST=[];HLOC=null;PID=0;TAG=2;const rp=REST_POSE(),K=skel(m,rp,0);K.m=m;K.pose=rp;K.down=0;build(m,K);
  const vbo=MESH&&MESH.vbo||gl.createBuffer(),ibo=MESH&&MESH.ibo||gl.createBuffer(),hbo=MESH&&MESH.hbo||gl.createBuffer(),sbo=MESH&&MESH.sbo||gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(V),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,ibo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(IDS),gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,hbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(HLA),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,sbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(SKA),gl.STATIC_DRAW);
  const at_=decUp(MESH&&MESH.at);
  MESH={key,vbo,ibo,hbo,sbo,parts:pmDone(),pf:PF.slice(),at:at_,cnt:V.length/9,nb:BI,pidn:PID+1,rinv:REST.map(F=>inv34(fm(F)))};V=[];IDS=[];HLA=[];SKA=[];return MESH}
 // 뼈만 계산: 같은 부품 함수를 'bone' 모드로 돌려 지금 자세의 틀을 모은다(겉면 점은 만들지 않음)
 function bones(m,pose,down){MODE='bone';BI=0;CB=0;CUR=[];HLOC=null;const K=skel(m,pose,down);K.m=m;K.pose=pose;K.down=down;build(m,K);MODE='mesh';return K}
 const CS=[];// 군중 배치 칸(가운데부터 바깥으로)
 function cell(i){while(CS.length<=i){const k=CS.length;if(!k){CS.push([0,0]);continue}let best=null;const R_=Math.ceil(Math.sqrt(k))+2;for(let x=-R_;x<=R_;x++)for(let y=-R_;y<=R_;y++){if(CS.some(c=>c[0]===x&&c[1]===y))continue;const d=x*x+y*y*1.3+(x>0?.1:0);if(!best||d<best[2])best=[x,y,d]}CS.push([best[0],best[1]])}return CS[i]}
 let lastStat={cpu:0,bone:0,n:1};
 function renderSk(m,pose,down,X,Y,s,W,H,DPR,o,mk){const t0=performance.now();const w=Math.round(W*DPR),h=Math.round(H*DPR);if(cvs.width!==w||cvs.height!==h){cvs.width=w;cvs.height=h}
  const ME=ensureMesh(m,mk),NI=Math.max(1,Math.min(400,o.crowd|0||1)),NB=ME.nb,BW=NB*3,GH=o.ghost&&NI===1?1:0,NR=NI+GH;// GH: 앞 키 잔상(뼈 텍스처 마지막 줄)
  if(!BTD||BTD.length<BW*4*NR)BTD=new Float32Array(BW*4*NR*1.25|0);
  let K0=null;const tb=performance.now();
  for(let n=0;n<NR;n++){const gh=n===NI,ps=gh?o.ghost:n&&o.crowdPose?o.crowdPose(n):{pose,down},K=bones(m,ps.pose,ps.down);if(!n)K0=K;
   if(CUR.length!==NB){console.warn('뼈 수 불일치',CUR.length,NB);MESH=null;return false}
   const[cx,cy]=gh?[0,0]:cell(n),ya=n&&!gh?((n*2.399)%1.2-.6):0,cY=Math.cos(ya),sY=Math.sin(ya);TI[0]=cY;TI[1]=-sY;TI[3]=cx*70;TI[4]=sY;TI[5]=cY;TI[7]=cy*70;
   for(let b=0;b<NB;b++){fm2(CUR[b],FT);if(n){mul34(TI,FT,F2,0);mul34(F2,ME.rinv[b],BTD,(n*BW+b*3)*4)}else mul34(FT,ME.rinv[b],BTD,(n*BW+b*3)*4)}}
  const tbone=performance.now()-tb;
  gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,btex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,BW,NR,0,gl.RGBA,gl.FLOAT,BTD.subarray(0,BW*4*NR));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
  gl.useProgram(prog);const cs=Math.cos(W3HOST.VIEW.yaw),sn=Math.sin(W3HOST.VIEW.yaw),U=n=>gl.getUniformLocation(prog,n);gl.uniformMatrix4fv(U('V'),false,view(X,Y,s,W,H));gl.uniform3fv(U('L'),norm([sn*.9-cs*.7,cs*.9+sn*.7,1.1]));gl.uniform3fv(U('ink'),[.07,.065,.06]);gl.uniform3fv(U('B'),[sn*W3HOST.VIEW.uk,cs*W3HOST.VIEW.uk,W3HOST.VIEW.sq]);gl.uniform3fv(U('SR'),[cs,-sn,0]);gl.uniform3fv(U('SU'),[-sn*W3HOST.VIEW.sq,-cs*W3HOST.VIEW.sq,W3HOST.VIEW.uk]);gl.uniform1f(U('SM'),{toon:1,screen:2,matcap:3}[o.shade]||2);gl.uniform1f(U('BRU'),m.paint==='brush'?1:0);{const pp=m.pal||{},st=pp.steel||'#d9dee0';gl.uniform3fv(U('PST'),hex(st));gl.uniform3fv(U('PSH'),hex(pp.shade||hexMix(st,'#14161e',.4)));gl.uniform3fv(U('PHI'),hex(pp.hi||'#ffffff'))}
  gl.uniform1f(U('SKN'),1);gl.uniform1i(U('BT'),4);gl.uniform2f(U('BTs'),BW,NR);gl.uniform1f(U('PIDN'),ME.pidn);
  const pL=A_('p'),nL=A_('n'),cL=A_('c'),iL=A_('id'),hL=A_('hl'),pbL=A_('pb'),bwL=A_('bw'),inL=A_('ins');
  gl.bindBuffer(gl.ARRAY_BUFFER,ME.vbo);for(const[l,of] of[[pL,0],[nL,12],[cL,24]]){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,3,gl.FLOAT,false,36,of)}
  gl.bindBuffer(gl.ARRAY_BUFFER,ME.ibo);gl.enableVertexAttribArray(iL);gl.vertexAttribPointer(iL,1,gl.FLOAT,false,4,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,ME.hbo);gl.enableVertexAttribArray(hL);gl.vertexAttribPointer(hL,4,gl.FLOAT,false,16,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,ME.sbo);gl.enableVertexAttribArray(pbL);gl.vertexAttribPointer(pbL,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(bwL);gl.vertexAttribPointer(bwL,3,gl.FLOAT,false,24,12);
  const IA=new Float32Array(NI);for(let i=0;i<NI;i++)IA[i]=i;gl.bindBuffer(gl.ARRAY_BUFFER,insb);gl.bufferData(gl.ARRAY_BUFFER,IA,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(inL);gl.vertexAttribPointer(inL,1,gl.FLOAT,false,4,0);XI.vertexAttribDivisorANGLE(inL,1);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,htex);gl.uniform1i(U('HT'),1);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,stex);gl.uniform1i(U('ST'),2);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,mtex);gl.uniform1i(U('MC'),3);gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,ltex);gl.uniform1i(U('LT'),5);gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,facetx||ltex);gl.uniform1i(U('FT'),6);gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,ME.at.tex);gl.uniform1i(U('AT'),7);gl.uniform2f(U('ATs'),ME.at.W,ME.at.TH);gl.activeTexture(gl.TEXTURE0);
  const D=()=>{if(o.only){for(const[a,c]of o.only)XI.drawArraysInstancedANGLE(gl.TRIANGLES,a,c,NI)}else XI.drawArraysInstancedANGLE(gl.TRIANGLES,0,ME.cnt,NI)};/* o.only: [시작 꼭짓점, 개수] 목록만 그린다(그림 탭 부위 조각) */// 같은 겉면을 인원수만큼 한 번에(인스턴싱)
  // 1) 부품 번호 그림 → 2) 외곽선 → 3) 본 그림: 모든 캐릭터를 한꺼번에
  fboSize(w,h);gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniform1f(U('ow'),0);gl.uniform1f(U('flat_'),3);D();gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);
  // (바깥 외곽선도 부품 경계선 단계에서 같은 굵기로 긋는다: 배경과 부품의 경계)
  gl.uniform1f(U('flat_'),0);gl.uniform1f(U('ow'),0);D();
  if(GH){// 앞 키 잔상: 본 그림 뒤에 반투명으로(몸에 가린 곳은 안 보임)
   gl.bindBuffer(gl.ARRAY_BUFFER,insb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([NI]),gl.DYNAMIC_DRAW);gl.vertexAttribPointer(inL,1,gl.FLOAT,false,4,0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.uniform1f(U('flat_'),4);XI.drawArraysInstancedANGLE(gl.TRIANGLES,0,ME.cnt,1);gl.depthMask(true);gl.disable(gl.BLEND)}
  XI.vertexAttribDivisorANGLE(inL,0);for(const l of[iL,hL,pbL,bwL,inL,pL,nL,cL])gl.disableVertexAttribArray(l);
  // 4) 부품 경계선: 화면 전체에 한 번
  if(o.edges!==false&&((o.wOut??.8)>0||(o.wBnd??.8)>0)){gl.disable(gl.DEPTH_TEST);gl.useProgram(eprog);gl.bindBuffer(gl.ARRAY_BUFFER,qb);const qL=gl.getAttribLocation(eprog,'q');gl.enableVertexAttribArray(qL);gl.vertexAttribPointer(qL,2,gl.FLOAT,false,0,0);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,ftex);gl.uniform1i(gl.getUniformLocation(eprog,'T'),0);gl.uniform2f(gl.getUniformLocation(eprog,'px'),1/w,1/h);gl.uniform1f(gl.getUniformLocation(eprog,'wo'),(o.wOut??.8)*DPR);gl.uniform1f(gl.getUniformLocation(eprog,'wb'),(o.wBnd??.8)*DPR);gl.uniform1f(gl.getUniformLocation(eprog,'BRU'),m.paint==='brush'?1:0);gl.uniform3fv(gl.getUniformLocation(eprog,'ink'),[.07,.065,.06]);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLES,0,3);gl.disable(gl.BLEND);gl.disableVertexAttribArray(qL);gl.useProgram(prog);gl.enable(gl.DEPTH_TEST)}
  // 5) 섬광 궤적(주인공만): 스키닝 없이 그대로
  noSkin();gl.vertexAttrib1f(iL,0);gl.vertexAttrib4f(hL,0,0,0,0);
  if(o.strike&&o.mode&&o.mode!=='none'){if(!FX||FX.idx!==o.idx)FX=fxBuild(m,o);const EV=fxDraw(m,K0,o);if(EV.length){const EA=new Float32Array(EV);gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,EA,gl.DYNAMIC_DRAW);for(const[l,of] of[[pL,0],[nL,12],[cL,24]]){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,3,gl.FLOAT,false,36,of)}
   gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(-2,-2);gl.uniform1f(U('flat_'),2);gl.drawArrays(gl.TRIANGLES,0,EA.length/9);gl.disable(gl.POLYGON_OFFSET_FILL);gl.depthMask(true);gl.disable(gl.BLEND);for(const l of[pL,nL,cL])gl.disableVertexAttribArray(l)}}else FX=null;
  lastStat={cpu:performance.now()-t0,bone:tbone,n:NI,verts:ME.cnt,nb:NB};return true}
 function show(on){const c=document.getElementById('gl3d2');if(c)c.hidden=!on;if(!on&&W3HOST.VIEW.sq<.2)W3HOST.VIEW.sq=.2;if(P3W!==on){P3W=on;patchPanel()}}/* 3D 월드2를 나가면 아래에서 보던 시점을 2D 범위로 되돌린다 */
setTimeout(()=>{try{mkUI()}catch(e){console.warn(e)}},0);/* 모델 탭 정리(1안·2안·3안 제거, 조관 추가)는 2D에서도 처음부터 */
/* 자세를 3D 뼈대의 닿는 거리 안으로 맞춘 자세로 돌려준다(손·발 목표만 바꿈). 2D 계산(그림 탭 안내값·화면 고리)도 같은 팔다리 길이를 쓰게 한다 */
 const clampPose=(m,pose,down)=>{const K=skel(m,pose,down||0),bd=m.body||{},bL=bd.leg??1,L=pose.lean+(down||0)*14,drop=(down||0)*30+(pose.crouch??0),legDrop=48-48*bL,h2=K.hd[2]+drop+legDrop,h=[K.hd[0]-L*(h2-48)/60,K.hd[1],h2],ft=K.legs.map(g=>[g.F[0],g.F[1]]),pf=pose.feet;let ch=Math.hypot(h[0]-pose.h[0],h[1]-pose.h[1],h[2]-pose.h[2])>1e-4;if(pf)for(let i=0;i<2;i++)if(Math.hypot(ft[i][0]-pf[i][0],ft[i][1]-pf[i][1])>1e-4)ch=true;return ch?{...pose,h,feet:pf?ft:pose.feet}:pose};
 const pieces=()=>{if(!MESH||!MESH.pf)return[];let v=0;return MESH.pf.map(([t,c])=>{const r=[t,v,c*3];v+=c*3;return r}).filter(r=>r[2]>0)};/* 부위 조각: [이름, 시작 꼭짓점, 개수] */
 return{render,show,init,clampPose,pieces,stat:()=>lastStat,parts:()=>MESH&&MESH.parts,benchBones:(m,pose,N)=>{const t0=performance.now();for(let i=0;i<N;i++)bones(m,pose,0);return(performance.now()-t0)/N},ok:m=>m&&(m.style==='knight'||m.style==='mech')}})();
setTimeout(()=>{try{if(W3HOST.WORLD==='2d')W3HOST.setWorld('3d2')}catch(e){console.warn(e)}},0);
/* 화면을 위아래로 쓸어 넘길 때 손가락이 지나간 슬라이더 값이 바뀌지 않게: 터치가 가로로 8px 넘게 움직여야 슬라이더를 움직인 것으로 본다(세로로 먼저 움직이면 스크롤, 값은 그대로) */
(()=>{let TS=null;try{const st=document.createElement('style');st.textContent='input[type=range]{touch-action:pan-y}';document.head.appendChild(st)}catch(_){}
 const isR=el=>el&&el.tagName==='INPUT'&&el.type==='range';
 window.addEventListener('touchstart',e=>{const r=e.target;if(isR(r)&&e.touches.length===1){const t=e.touches[0];TS={r,x:t.clientX,y:t.clientY,v:r.value,m:0}}else TS=null},{capture:true,passive:true});
 window.addEventListener('touchmove',e=>{if(!TS||TS.m)return;const t=e.touches[0],dx=Math.abs(t.clientX-TS.x),dy=Math.abs(t.clientY-TS.y);if(dy>8&&dy>=dx){TS.m=2;TS.r.value=TS.v}else if(dx>8){TS.m=1;TS.r.dispatchEvent(new Event('input',{bubbles:true}))}},{capture:true,passive:true});
 const block=e=>{if(TS&&e.target===TS.r&&TS.m!==1&&e.isTrusted){e.stopImmediatePropagation();TS.r.value=TS.v}};window.addEventListener('input',block,true);window.addEventListener('change',block,true);
 const end=()=>{const s_=TS;setTimeout(()=>{if(TS===s_)TS=null},50)};window.addEventListener('touchend',end,{capture:true,passive:true});window.addEventListener('touchcancel',end,{capture:true,passive:true})})();/* 처음 열면 3D 월드로 시작한다 */
{const _dm=W3HOST.drawModel;W3HOST.drawModel=function(c,m,o){let w3=false;try{w3=W3HOST.WORLD==='3d2'&&o&&o.pose&&m&&m.style==='knight';if(w3)o={...o,pose:R3D2.clampPose(m,o.pose,o.down||0)}}catch(_){w3=false}
  const cap=w3?W3HOST.PIECE_CAP:null;if(!cap)return _dm.call(this,c,m,o);
  /* 그림 탭이 부위 조각(PIECE_CAP)을 받는 중이면: 안내값(HINTS)만 2D로 채우고, 조각 모양·색은 3D 화면을 부위별로 따로 그려 넘긴다(2D 모델이 섞이지 않게) */
  W3HOST.PIECE_CAP=null;let r;try{r=_dm.call(this,c,m,o)}finally{W3HOST.PIECE_CAP=cap}
  try{const N=c.canvas.width,op=W3HOST.opt||{},lines=m.paint==='plain'?{wOut:0,wBnd:0,wArm:0}:{wOut:op.w3o??.8,wBnd:op.w3b??.8,wArm:op.w3a??1},ro={shade:op.shade3||'screen',...lines};
   if(R3D2.render(m,o.pose,o.down||0,o.X,o.Y,o.s,N,N,1,ro)){const PS=R3D2.pieces(),cv3=W3HOST.gl3d;c.clearRect(0,0,N,N);for(const[t,a,n]of PS)cap(()=>{R3D2.render(m,o.pose,o.down||0,o.X,o.Y,o.s,N,N,1,{...ro,only:[[a,n]]});c.drawImage(cv3,0,0,N,N)},t||undefined)}}catch(e){console.warn(e)}
  return r}}/* 3D 월드에서는 2D 그리기(그림 탭 안내값·손발 고리)에도 팔다리가 늘어나지 않은 자세를 넘긴다 */
