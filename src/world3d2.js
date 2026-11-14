// ═══ 3D 월드2: 2D 월드의 모양 정의(높이별 단면·타원체·머리 좌표 면)를 그대로 써서 3D 겉면(메쉬)을 만들고 WebGL 깊이 버퍼로 그린다 ═══
// 2D는 단면 점들의 겉 윤곽을 칠했지만, 여기서는 이웃 단면을 삼각형으로 이어(로프트) 진짜 겉면을 만든다. 투영은 2D와 같은 직교 투영.
const R3D2=(()=>{let gl=null,cvs=null,prog=null,vb=null,ok=false;
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
  if(vt>.5&&vt<1.5){// 찰갑: 미리 그려 둔 찰갑 그림(찰갑선 1.5배 기준, 판 2칸×2줄 한 장)을 기본자세 위치에 옆면·앞면 투영으로 입힌다(R=먹선, G=판 안 높이)
   vec3 an=abs(normalize(vrn));float wy=an.x/(an.x+an.y+1e-4);vec4 T=mix(texture2D(LT,vec2(vw.x/5.4,vw.z/6.8)),texture2D(LT,vec2(vw.y/5.4,vw.z/6.8)),wy);
   float side=smoothstep(.9,.6,an.z)*(1.-txa);/* 투구 그림(드림 눈구멍 등)이 칠해진 곳엔 찰갑 무늬 없음 */col*=mix(1.,.9+.14*T.g,side);col=mix(col,vec3(.07,.065,.06),T.r*side);}
  if(vh.w>2.5&&vh.w<3.5){float az=atan(vh.y,vh.x+1.);vec4 f=texture2D(FT,vec2(.5+az/6.2832,(20.-vh.z)/34.));col=mix(col,f.rgb,f.a);}// 얼굴 그림: 눈썹·입·코 선·X 눈·안대와 끈·콧수염·수염선(폴리곤 대신 머리 국소 좌표 그림)
  if(vh.w>3.5&&vh.w<4.5){col=mix(col,vec3(.11,.1,.09),texture2D(LT,vec2(atan(vh.y,vh.x)/6.2832+.5,clamp(vh.z/14.,.01,.99)),-16.).a);}// 정강이·아래팔 능선: 통 둘레 각도·반지름으로 찾아 읽는 먹선(찰갑 그림 A칸)
  col=mix(col,PSH*.95,dcR);// 가슴 가운데 능선(장식표 몸통 줄에서)
  col=mix(col,vec3(.114,.102,.09),dcK);// 갑옷줄 먹선·리벳: 명암 없이
  if(vt>2.5)col=vc;// 갑옷줄 먹선: 명암·광택 없이
  gl_FragColor=vec4(col,1.);}`;
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
  float al=smoothstep(.03,.2,e);if(BRU>.5){al*=mix(.45,1.,vn(fc/5.+3.1));al*=step(.16,vn(fc/14.+7.7));}if(al<.02)discard;// 붓선: 진하기 흔들림 + 군데군데 끊김
 /* 선명하게: 조금만 걸쳐도 진하게, 가장자리 1픽셀 안에서만 부드럽게 */gl_FragColor=vec4(ink*al,al);}`;
 let eprog=null,qb=null,fbo=null,ftex=null,frb=null,fw=0,fh=0;
 function fboSize(w,h){if(fbo&&fw===w&&fh===h)return;fw=w;fh=h;if(!fbo){fbo=gl.createFramebuffer();ftex=gl.createTexture();frb=gl.createRenderbuffer()}
  gl.bindTexture(gl.TEXTURE_2D,ftex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);for(const k of[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.NEAREST);for(const k of[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);
  gl.bindRenderbuffer(gl.RENDERBUFFER,frb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,ftex,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,frb);gl.bindFramebuffer(gl.FRAMEBUFFER,null)}
 let ib=null,hb=null,htex=null,hkey='',stex=null,mtex=null,ltex=null;
 function init(){if(gl)return ok;cvs=document.getElementById('gl3d2');if(!cvs)return false;gl=cvs.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});if(!gl)return false;
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
 // 장식표(AT): 부품마다 한 줄(32칸)이 굽기 재료. 종류(첫 칸): 0 통(겹판 줄·리벳·테두리), 1 몸통(허리 줄·목둘레·띠·버클·멜빵·가슴 능선), 2 구(리벳). 줄마다 그림판 칸이 배정되고, 꼭짓점 꼬리표는 w=10+종류+3·칸 번호
 const decRow=a=>{while(a.length<32)a.push(0);DEC.push(...a);const pl=atPlan();return a[0]+3*pl.cells[pl.cells.length-1]};/* 반환값 = 종류 + 3·칸 번호(꼭짓점 꼬리표 w = 10 + 반환값) */
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
 function atBake(){const pl=atPlan(),n=DEC.length/32;if(!n)return{W:1,TH:2,data:new Uint8Array(8)};const W=ATW,H=pl.rows*ATC,TH=2*H,data=new Uint8Array(W*TH*4);
  for(let r=0;r<n;r++){const row=DEC.slice(r*32,r*32+32),key=row.join(',');let ts=AT_TILES.get(key);if(!ts){ts=row[0]===1?bakeTorso(row):row[0]===0?bakeTube(row):bakeBall(row);if(AT_TILES.size>60)AT_TILES.clear();AT_TILES.set(key,ts)}
   const ox=pl.cells[r]%8*ATC,oy=Math.floor(pl.cells[r]/8)*ATC;for(const t of ts)for(let y=0;y<t.h;y++){const a=((oy+t.y+y)*W+ox+t.x)*4,b=((H+oy+t.y+y)*W+ox+t.x)*4;data.set(t.A.subarray(y*t.w*4,(y+1)*t.w*4),a);data.set(t.B.subarray(y*t.w*4,(y+1)*t.w*4),b)}}
  return{W,TH,data}}
 /* 장식 그림판 올리기: 줄 내용이 그대로면 다시 굽거나 올리지 않는다 */
 function decUp(o){const key=DEC.join(',');if(o&&o.key===key)return o;const b=atBake(),tex=o&&o.tex||gl.createTexture();gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,b.W,b.TH,0,gl.RGBA,gl.UNSIGNED_BYTE,b.data);for(const k of[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR);for(const k of[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0);return{tex,key,W:b.W,TH:b.TH}}
 let ATO=null;// 예전 방식(매 프레임 겉면 생성) 전용 장식표
 // ─ 메쉬 쌓기: 꼭짓점마다 위치·법선·색 ─
 let V=[],IDS=[],HLA=[],SKA=[],DEC=[],HLOC=null,PID=0,TAG=2;
 /* 폴리곤(삼각형) 부위별 집계: pmk는 지금까지 쌓은 삼각형 중 직전 표시 뒤의 몫을 부위 이름으로 적고, pmx는 안쪽에서 따로 센 몫(얼굴·머리카락)을 적는다 */
 let PM=[],PMX={},PML=0;const pmk=n=>{if(MODE!=='mesh')return;const c=V.length/27;PM.push([n,c-PML]);PML=c},pmx=(n,v0)=>{if(MODE==='mesh')PMX[n]=(PMX[n]||0)+(V.length-v0)/27};
 function pmDone(){const x=Object.entries(PMX),sub=x.reduce((a,b)=>a+b[1],0),out=PM.map(([n,c])=>n==='목·머리·투구'?['목·투구·장식',c-sub]:[n,c]);for(const[n,c]of x)out.push([n,c]);return out.filter(e=>e[1]>0)}
 // 뼈: MODE 'mesh'(겉면 만들기, 기본자세 뼈를 REST에) / 'bone'(뼈만 계산해 CUR에). 뼈 = 틀(원점 + 축 3개). 부품마다 자기 틀을 뼈로 등록하므로 기본자세→지금자세 변환이 부품 모양과 정확히 맞는다
 let MODE='mesh',BI=0,CB=0,REST=[],CUR=[];const bone=F=>{(MODE==='mesh'?REST:CUR).push(F);return BI++};
 const push=(p,n,c,pb,bb,w)=>{V.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0]+2*TAG,c[1],c[2]);IDS.push(PID);if(pb)SKA.push(pb[0],pb[1],pb[2],CB,bb,w);else SKA.push(p[0],p[1],p[2],CB,CB,0);if(HLOC&&HLOC.fn)HLA.push(...HLOC.fn(p));else if(HLOC){const d=vsub(p,HLOC.o);HLA.push(vdot(d,HLOC.f)/HLOC.s,vdot(d,HLOC.r)/HLOC.s,vdot(d,HLOC.u)/HLOC.s,HLOC.w||1)}else HLA.push(0,0,0,0)};
 // 단면 고리들을 이어 겉면을 만든다. rings: 같은 개수의 점을 가진 고리 배열(아래→위). 법선은 이웃 점으로 구하고, 중심 밖을 향하게 맞춘다
 function loft(R,col,o={}){if(MODE==='bone')return;const pid0=PID;if(o.pid!=null)PID=o.pid;else if(!o.samePid)PID++;const C=hex(col),n=R[0].length,m=R.length,closed=o.open?false:true,N=[];if(m<2)return;
  const cen=R.map(r=>{let x=0,y=0,z=0;for(const p of r){x+=p[0];y+=p[1];z+=p[2]}return[x/r.length,y/r.length,z/r.length]});
  for(let j=0;j<m;j++){N.push([]);for(let i=0;i<n;i++){const a=R[j][(i+1)%n],b=R[j][(i-1+n)%n],u=R[Math.min(m-1,j+1)][i],d=R[Math.max(0,j-1)][i];let nn=norm(vcross(vsub(a,b),vsub(u,d)));if(!isFinite(nn[0]))nn=norm(vsub(R[j][i],cen[j]));if(vdot(nn,vsub(R[j][i],o.center||cen[j]))<0)nn=vmul(nn,-1);N[j].push(nn)}}
  const tw=o.two,Q=(j,i)=>tw?push(R[j][i],N[j][i],C,tw.pb(j,i),tw.bb,tw.t(j)):push(R[j][i],N[j][i],C);// 자락: 둘째 뼈 쪽 끝점 pb와 비율 t를 함께 적는다
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
  const legs=[0,1].map(i=>{const side=i?1:-1,Hp=[0,side*9*bT,H0],F=[feet[i][0],feet[i][1],0],K=ik2(Hp,F,25.5*bL,25.5*bL,[1,side*.45,0]),toe=norm([1,side*.32,0]),A=vadd(F,[0,0,5]);return{side,Hp,K,F,A,toe}});
  const hd=[pose.h[0]+L*(pose.h[2]-48)/60,pose.h[1],pose.h[2]-drop-legDrop],d=norm(pose.d),off=vsub(hd,vmul(d,10));
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
   HLOC={fn:q=>[q[1]/(15.6*bT),(q[2]-(H0-7))/(uS+2-(H0-7)),q[0]-K.lv(q[2]).fo,10+trow]};loft(TR,st,{capB:true,capT:true});HLOC=null}TAG=2;pmk('몸통');const TPID=PID;// 몸통 부품 번호(몸통 위 줄들은 같은 번호 → 경계선 없음)
  // 가슴 능선·허리 겹판 줄·목둘레 테두리·등 멜빵은 몸통 셰이더(장식표)가 그린다
  // 허리띠: 허리 단면을 조금 키운 띠
  // 허리띠·앞 버클도 몸통 셰이더(장식표)가 그린다
  // 앞자락(겉옷 위 허리에서 늘어지는 천): 윗단은 몸통 뼈, 아랫단은 자락 단 뼈. 밑단에 술(먹선)
  if(m.coat&&m.armor!=='jin'&&m.flap){const v=K.lv(H0+4),tp=[v.fo+v.df+2.2,0,H0+4],bt=[tp[0]+2,0,H0-34*bL],BF=bone([bt,[1,0,0],[0,1,0],[0,0,1]]),fc=p.flap||'#8a1c1c';
   if(MS){const TP=[],BTm=[];for(let k=0;k<=6;k++){const y=lerp(-1,1,k/6);TP.push(vadd(tp,[.2*(1-y*y),y*4.6*bT,0]));BTm.push(vadd(bt,[.2*(1-y*y),y*5.2*bT,0]))}const RR=[0,1,2,3].map(j=>TP.map((q,k)=>vlerp(q,BTm[k],j/3)));CB=BT_;loft(RR,fc,{open:true,center:T(H0-10),two:{pb:(j,i)=>BTm[i],bb:BF,t:j=>j/3}})}
   for(let k=0;k<=6;k++){const q=vadd(bt,[.3,lerp(-5.2,5.2,k/6)*bT,0]);TAG=3;tube(q,vadd(q,[0,0,-3]),.22,.22,INKL,.5);TAG=2}CB=BT_}
  // 칼집(허리 → 뒤 또는 앞으로): 통 + 끝 장식(쇠 마구리)
  if(m.sheath){const fr=m.sheathDir==='front',top=fr?[K.bend(H0+5)+8*bT,12*bT,H0+5]:[K.bend(H0+5)+5,-13*bT,H0+5],tip=fr?[24*bT,-14*bT,H0-34*bL]:[-16,-17*bT,H0-38];tube(top,tip,2.6,2.1,p.sheath||le,.9);tube(vlerp(top,tip,.92),tip,2.25,1.75,st,.9);CB=BT_}
  // 겉옷: 가슴 아래~허리 몸판 + 무릎까지 치마
  const COAT=m.coat&&m.armor!=='jin';if(COAT){const kc=vlerp(K.legs[0].K,K.legs[1].K,.5),spread=Math.abs(K.legs[0].K[1]-K.legs[1].K[1])/2,hemU=Math.max(H0-22,kc[2]+6);
   const sY=Math.max(15*bT,spread+6*LM),BHm=bone([[kc[0]*.55,0,hemU],[1,0,0],[0,sY,0],[0,0,1]]);// 치마 단 뼈: 무릎 위치·다리 벌림을 따라가는 단
   if(MS){loft([ring(H0+6,1.4),ring(H0+14,1.4),ring(H0+22,1.4),ring(uS-5,1.3)],cl,{capT:true});
   const W=ring(H0+6,1.7),HM=[],SK=[W];for(let k=0;k<20;k++){const q=k/20*6.2832;HM.push([kc[0]*.55+Math.cos(q)*12*bT,Math.sin(q)*sY,hemU+Math.sin(k*1.7)*.8])}for(let j=1;j<=4;j++)SK.push(W.map((w,k)=>vlerp(w,HM[k],j/4)));
   loft(SK,cl,{open:false,center:T(H0-8),two:{pa:(j,i)=>W[i],pb:(j,i)=>HM[i],bb:BHm,t:j=>j/4}})}}
  if(m.armor==='jin'){TAG=1;const kc=vlerp(K.legs[0].K,K.legs[1].K,.5),spread=Math.abs(K.legs[0].K[1]-K.legs[1].K[1])/2,hemU=Math.max(H0-36*bL,kc[2]-9),sY=Math.max(16.5*bT,spread+7*LM),BHm=bone([[kc[0]*.5,0,hemU],[1,0,0],[0,sY,0],[0,0,1]]);
   if(MS){const W=ring(H0+6,1.2),HM=[],SK=[W];for(let k=0;k<20;k++){const q=k/20*6.2832;HM.push([kc[0]*.5+Math.cos(q)*13.5*bT,Math.sin(q)*sY,hemU])}for(let j=1;j<=4;j++)SK.push(W.map((w,k)=>vlerp(w,HM[k],j/4)));loft(SK,st,{center:T(H0-8),two:{pa:(j,i)=>W[i],pb:(j,i)=>HM[i],bb:BHm,t:j=>j/4}})}TAG=2}
  // 다리: 2D와 같은 반지름의 통
  pmk('겉옷·치마·칼집·자락');for(const g of K.legs){const out=[.6,g.side*.8,0];tube(g.Hp,g.K,8*LM,6.4*LM,st,.5,{lames:[.12,.26],rivets:[.5],out});if(!m.coat&&m.armor!=='jin')tube(vadd(g.Hp,[2,g.side,7]),vlerp(g.Hp,g.K,.5),9.8*LM,8.8*LM,st,.5,{lames:[.28,.52,.76],rivets:[.15],out});
   tube(vadd(g.K,[0,0,6]),vadd(g.K,[1,0,3.5]),6.6*LM,6.4*LM,st,.2,{rivets:[.52],out:[1,0,0],rr:.6});/* 무릎 리벳: 장식표 */tube(vadd(g.K,[.5,0,-4]),vadd(g.K,[0,0,-7]),6*LM,5.8*LM,st,.2);
   tube(g.K,g.A,5.8*LM,4.1*LM,st,.5,{ridge:true});tube(vadd(g.A,[0,0,-1]),vadd(vadd(g.F,vmul(g.toe,14*Math.sqrt(LM))),[0,0,1.6]),4.6*LM,2.8*LM,st,.8,{lames:[.22,.36,.5,.64,.78]})}
  // 팔
  pmk('다리');for(const g of K.arms){const{side,S,E,Hn}=g,ud=norm(vsub(E,S)),fw=norm(vsub(Hn,E)),wr=vsub(Hn,vmul(fw,3.5));const JA=m.armor==='jin',out=[.5,side*.85,0];TAG=JT;tube(S,E,5.6*LM,5*LM,st,.5,JA?{}:{lames:[.55],rivets:[.3],out});TAG=2;tube(E,wr,5*LM,4.3*LM,st,.5,{ridge:[.6,0,.6]});
   {const R_=5.6*LM,on_=norm(out),e1=norm(vcross(on_,[0,0,1])),e2=vcross(on_,e1),h0_=HLOC;/* 팔꿈치 리벳: 구 위 점(장식표 종류 2) */if(MS&&AW>0){const row=decRow([2,Math.cos(Math.min(1.4,.55*Math.sqrt(AW)/R_)),0,0]);HLOC={fn:p_=>{const q=vsub(p_,E);return[vdot(q,on_),vdot(q,e1),vdot(q,e2),10+row]}}}ellip(v=>vadd(E,v),R_,R_,R_,0,0,st);HLOC=h0_}ellip(v=>vadd(vadd(E,vmul([0,side,0],4.8*LM)),vadd(v,[-3,0,0])),4.4*LM,2.2*LM,4.4*LM,0,0,st);
   tube(vsub(wr,vmul(fw,1.5)),vadd(wr,vmul(fw,3.5)),4.8*LM,6.8*LM,gl_,.15,{lames:[.6]});ellip(v=>vadd(Hn,v),4.8*LM,4.8*LM,4.8*LM,0,0,gl_);
   const top=vadd(S,[0,side*2,3]),lo=vadd(S,vmul(ud,12*psz));TAG=JT;tube(top,lo,8.6*psz,7.6*psz,st,.95,JA?{rim:tr}:{lames:[.34,.52,.7,.86],rivets:[.15],out,rim:tr});TAG=2;
   if(!JA&&m.paul==='haute')boxF(vadd(S,[.5,-side*3.5,4+4.25*psz]),[5.5,0,0],[0,.6,0],[0,0,4.25*psz],st)}// 오트 피스: 어깨 안쪽에 세운 관판(목 옆 방패판)// 어깨판: 겹판 줄·리벳·윗단 테두리
  // 목·머리
  pmk('팔·어깨·장갑');tube(T(uS),vadd(K.head,[0,0,-8*hs]),5,4.4,st);
  helm(m,K,st,sk,tr,p);HLOC=null;pmk('목·머리·투구')}
 function helm(m,K,st,sk,tr,p){const{HL,hs}=K,kit=m.helm==='kit'&&m.hkit?m.hkit:null,HW=m.hwear||'helm',F=kit?kit.form:m.helm,up=kit?kit.visor==='up':(m.helm==='open'||m.helm==='peakup'),HC=kit&&kit.colors&&kit.colors.main?kit.colors.main:st,TC=kit&&kit.colors&&kit.colors.trim?kit.colors.trim:tr,INKC='#1d1a17';
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
  const face=(full=true,noEars=false)=>{const pv_=V.length,t0=TAG,h0=HLOC;HLOC=HF;TAG=0;skull();SPID=PID;const fp={pid:SPID};
   for(const sd of[-1,1]){if(noEars)break;ellip(v=>HL(vadd([-1,sd*8.75,-1.6],v)),1.85,.5,2.8,0,0,INKC,undefined,undefined,fp);ellip(v=>HL(vadd([-1,sd*9.05,-1.6],v)),1.5,.65,2.4,0,0,sk,undefined,undefined,fp)}/* 귀: 머리카락 밖으로(2D도 머리카락 위에 귀) */
   /* 눈동자는 얼굴 그림(텍스처)에 그린다 */
   if(full){const NZ={small:[1.2,.9,1.6],hook:[1.8,.9,2],broad:[1.2,1.6,1.5]}[nz]||[1.2,.9,1.6];ellip(v=>vadd(FPb(0,-3.6,-.4),v),NZ[0],NZ[1],NZ[2],0,0,sk,undefined,undefined,fp);
    if(bd==='full')ellip(HL,9.6,8.8,11.2,-.4,-1.6,hairC,-Math.PI/2,-.35,{capT:true,pid:SPID})}
   if(MODE==='mesh')faceTex({ey,ball:['dot','fierce','xround','patch','round'].includes(ey),nz,mo,bd,PATCH,hairC,brow,hair:m.hair||'short',full});TAG=t0;HLOC=h0;pmx('얼굴(머리통·귀·코)',pv_)};
  // 머리 모양(2D hairSet과 같은 선): 앞은 이마 위, 옆은 귀 높이, 뒤는 목덜미까지. 긴 머리=등 뒤로 늘어진 자락, 묶은 머리=뒤통수 위 상투, 민머리=없음
  const hairCap=()=>{const hs_=m.hair||'short';if(hs_==='bald')return;const pv_=V.length,h0=HLOC;HLOC=HF;
   if(MODE==='mesh'){const Rf=10.3,Rr=9.3,Ru=12,cf=-.9,cu=-1,n=24,zt=x=>x>.45?.42:x>.25?lerp(-.05,.42,(x-.25)/.2):x>-.1?-.05:x>-.3?lerp(-.5,-.05,(x+.3)/.2):-.5,R=[];
    for(let j=0;j<=7;j++){const a=[];for(let i=0;i<n;i++){const t=i/n*6.2832,la=lerp(Math.asin(zt(Math.cos(t))),Math.PI/2,j/7);a.push(HL([cf+Rf*Math.cos(la)*Math.cos(t),Rr*Math.cos(la)*Math.sin(t),cu+Ru*Math.sin(la)]))}R.push(a)}loft(R,hairC,{center:HL([cf,0,cu])});
    if(hs_==='long'){const top=[],bot=[];for(let k=0;k<12;k++){const t=Math.PI*.55+k/11*Math.PI*.9;top.push(HL([-.6+Math.cos(t)*10.4,Math.sin(t)*9.6,.8]));bot.push(HL([-.6+Math.cos(t)*11.4-1,Math.sin(t)*10.8,-18.2]))}const mid=top.map((q,k)=>vlerp(q,bot[k],.5));loft([top,mid,bot],hairC,{open:true,center:HL([-1,0,-6])})}}
   if(hs_==='knot')ellip(v=>HL(vadd(v,[-4,0,11.8])),3.4,3.4,3.4,0,0,hairC);HLOC=h0;pmx('머리카락',pv_)};
  // 사슬 두건(coif)·천 두건(hood): 머리를 감싸고 어깨까지 퍼지는 자락, 앞은 얼굴이 드러나는 타원 구멍(살색 면 + 얼굴)
  const hood=chain=>{const col=chain?st:(p.cloth||'#6d675e'),G=chain?1.6:2.2,Rf=9.2+G,Rr=8.2+G,Ru=10.8+G,cf=-1,cu=-.8;
   face(true,true);// 안의 머리·얼굴(귀는 두건 속)
   if(MODE==='mesh'){const n=40,LR=[];{const a=[];for(let i=0;i<n;i++){const t=i/n*6.2832;a.push([Math.cos(t)*10.5-1.5,Math.sin(t)*11.5,-14.2])}LR.push(a)}
    for(let j=0;j<=14;j++){const la=lerp(-.6,Math.PI/2,j/14),a=[];for(let i=0;i<n;i++){const t=i/n*6.2832;a.push([cf+Rf*Math.cos(la)*Math.cos(t),Rr*Math.cos(la)*Math.sin(t),cu+Ru*Math.sin(la)])}LR.push(a)}
    const h0=HLOC;HLOC=chain?{o:K.head,s:hs,f:K.HR([1,0,0]),r:K.HR([0,1,0]),u:K.HR([0,0,1]),w:2}:null;// 사슬 두건: 머리 국소 좌표로 사슬 무늬
    const W_={r:5.9,c:-4,h:7.6};loft(LR.map(r=>r.map(HL)),col,{center:HL([cf,0,cu]),skip:(j,i,i2)=>inWin(W_,LR[j][i],LR[j][i2],LR[j+1][i],LR[j+1][i2])});HLOC=h0}
   if(!chain)tube(HL([-9.5,0,6]),HL([-12.5,0,HE_CU+8]),2.6,.4,col,.6)};// 천 두건 꼬리
  const HE_CU=-1.2;
  if(HW!=='helm'){if(HW==='coif'||HW==='hood'){hood(HW==='coif');return}face();hairCap();return}
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
  const kitParts=()=>{const K_=kit,C=K_.colors||{},main=C.main||st,trim=C.trim||tr,acc=C.accent||p.plume||p.flap||'#8a1c1c',hi=hexMix(main,'#ffffff',.45),w=K_.width||1,h=K_.height||1,flat=K_.dome==='flat',open=['open','nasal','cheek'].includes(K_.face)||(['visor','mask'].includes(K_.face)&&K_.visor==='up');
   const G={Rf:12*w,Rr:10.8*w,Ru:(K_.dome==='tall'?15:12.5)*h,cf:-1,cu:K_.dome==='tall'?1:0},fmax=K_.face==='mask'?9.4*w:1e9,cb=K_.brim&&K_.brim!=='none'?4.5:1.5,S0=open?{Rf:G.Rf*.94,Rr:G.Rr*.94,Ru:G.Ru*.9,cf:-1,cu:cb}:G;
   const top=flat?S0.cu+13*h-(open?cb:0)*.4:S0.cu+S0.Ru,apex=K_.dome==='pointed'?top+6*h:K_.dome==='onion'?top+3.5*h:top,base=open?cb:-12,MS_=MODE==='mesh',N=24;
   const kU=u=>flat?1:Math.sqrt(Math.max(0,1-((u-S0.cu)/S0.Ru)**2)),ringAt=(u,g=0)=>{const k=kU(u),a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HL([Math.min(S0.cf+Math.cos(t)*(S0.Rf*k+g),fmax),Math.sin(t)*(S0.Rr*k+g),u]))}return a};
   const xA=(r,u)=>flat?Math.sqrt(Math.max(0,1-(r/S0.Rr)**2)):Math.sqrt(Math.max(0,1-(r/S0.Rr)**2-((u-S0.cu)/S0.Ru)**2)),SP=(r,u,d=0)=>HL([Math.min(S0.cf+xA(r,u)*S0.Rf,fmax)+d,r,u]);
   const crestK=K_.crest||'none';if(crestK==='horns')decoIn(top-6);
   if(open){face();hairCapless()}
   // 목가리개(아벤테일): 위 고리 → 아래로 퍼지는 고리. 얼굴이 트였으면 앞을 비운다. 사슬은 회갈색, 판이면 겹판 줄 2개
   const nk=K_.neck||'none';if(nk!=='none'){const bot=nk==='long'||nk==='mail'?-17:-13.5,spread=nk==='flared'?4.5:nk==='mail'?2.5:1.2,u0=open?cb-1:-7,col=nk==='mail'?hexMix(main,'#8d877c',.35):main;
    if(MS_){const ring2=(u,k)=>{const a=[];for(let i=0;i<=N;i++){const t=open?lerp(.35*Math.PI,1.65*Math.PI,i/N):i/N*6.2832;a.push(HL([Math.cos(t)*(G.Rf-1+spread*k)-1.5,Math.sin(t)*(G.Rr-.4+spread*k),u]))}return open?a:a.slice(0,N)};
     {const h0=HLOC;if(nk==='mail')HLOC={...HLOC,w:2};loft([ring2(bot,1),ring2((bot+u0)/2,.5),ring2(u0,0)],col,{open,center:HL([-1.5,0,(bot+u0)/2])});HLOC=h0}/* 사슬 목가리개: 사슬 무늬 */
     if(nk!=='mail'&&AW>0){TAG=3;for(const u of[bot+3.2,bot+6]){const k=(u-bot)/(u0-bot),rr_=[ring2(u-.2*AW,1-k).map(q=>vadd(q,[0,0,0])),ring2(u+.2*AW,1-k)];loft(rr_.map(r_=>r_.map(q=>vadd(HL([-1.5,0,u]),vmul(vsub(q,HL([-1.5,0,u])),1.012)))),INKL,{open,samePid:true})}TAG=2}}}
   // 챙
   const br=K_.brim||'none';if(br!=='none'&&MS_){const g=br==='wide'?3.6:br==='down'?3:1.8,lo=br==='down'?cb-3:cb-.7,rg=(R1,R2,u)=>{const a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HL([Math.cos(t)*R1-1,Math.sin(t)*R2,u]))}return a};loft([rg(S0.Rf+.3,S0.Rr+.3,cb+.4),rg(S0.Rf+g,S0.Rr+g,lo),rg(S0.Rf+g-.3,S0.Rr+g-.3,lo-.5),rg(S0.Rf+.3,S0.Rr+.3,cb-.4)],main,{center:HL([-1,0,cb])})}
   // 몸체: 위도 고리(평평한 통이면 원통), 닫힌 얼굴이면 아래 목둘레로 좁아짐, 뾰족·양파형은 꼭짓점
   if(MS_){const R=[];if(flat){for(let j=0;j<=6;j++){const u=lerp(base,top,j/6),sc=j===6?.88:1,a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HL([Math.min(S0.cf+Math.cos(t)*S0.Rf*sc,fmax),Math.sin(t)*S0.Rr*sc,u]))}R.push(a)}}
    else{if(!open){const a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HL([Math.min(Math.cos(t)*9.8*w-1.5,fmax),Math.sin(t)*9.4*w,-12]))}R.push(a)}for(let la=open?0:-4;la<=5;la++){const pp=la/6*Math.PI/2,a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HL([Math.min(S0.cf+Math.cos(pp)*Math.cos(t)*S0.Rf,fmax),Math.cos(pp)*Math.sin(t)*S0.Rr,S0.cu+Math.sin(pp)*S0.Ru]))}R.push(a)}
     if(apex>top+.1){const k=.35,a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HL([S0.cf+Math.cos(t)*S0.Rf*.25*k,Math.sin(t)*S0.Rr*.25*k,lerp(top,apex,.75)]))}R.push(a)}
     const tp=apex>top+.1?apex:top,a=[];for(let i=0;i<N;i++){const t=i/N*6.2832;a.push(HL([S0.cf+Math.cos(t)*.05,Math.sin(t)*.05,tp]))}R.push(a)}
    loft(R,main,{center:HL([S0.cf,0,(base+top)/2]),capB:flat&&!open,capT:flat})}
   if(K_.dome==='onion')ellip(v=>HL(vadd(v,[S0.cf,0,apex+1.6])),1.5,1.5,1.5,0,0,trim);
   // 띠(trim)·트인 얼굴 테두리·리벳·세로 띠
   const nb=Math.max(0,Math.min(3,K_.bands|0)),bandAt=u=>{if(MS_)loft([ringAt(u-.45,.18),ringAt(u+.45,.18)],trim,{center:HL([S0.cf,0,u])})};
   if(open)bandAt(base+.5);for(let i=1;i<=nb;i++)bandAt(base+(top-base)*i/(nb+1)*.85);
   if(K_.rivets&&MS_&&AW>0){const u=open?base+1.4:base+(top-base)*.12,k=kU(u);TAG=3;for(let q=0;q<16;q++){const t=q/16*6.2832,c_=HL([Math.min(S0.cf+Math.cos(t)*S0.Rf*k,fmax)+.15*Math.cos(t),Math.sin(t)*(S0.Rr*k+.15),u]),r_=.45*Math.sqrt(AW),RR=[];for(let j=0;j<=3;j++){const la=-Math.PI/2+j/3*Math.PI,aa=[];for(let i=0;i<6;i++){const qq=i/6*6.2832;aa.push(vadd(c_,[Math.cos(la)*Math.cos(qq)*r_*hs,Math.cos(la)*Math.sin(qq)*r_*hs,Math.sin(la)*r_*hs]))}RR.push(aa)}loft(RR,INKL,{samePid:true})}TAG=2}
   if(K_.vband){const pts=[];for(let q=0;q<=10;q++){const t=.12+q/10*(Math.PI-.5);pts.push(HL([Math.min(S0.cf+Math.cos(t)*S0.Rf,fmax)+.3*Math.cos(t),0,(flat?top:S0.cu+Math.sin(t)*S0.Ru)+.35]))}line_(pts,.9,hi)}
   // 얼굴 부품: 코가리개(가운데 세로 막대), 볼가리개(양 볼 판), 면갑 올림(이마 위 젖힌 판 + 눈 틈)
   if(open&&K_.face==='nasal')line_([2.6,0,-2,-4.2].map(u=>HL([-.6+9.2+1.6,0,u])),.95,main);
   if(open&&K_.face==='cheek'&&MS_)for(const sd of[-1,1]){const poly=[[4.6,cb-1],[8.6,cb-1],[8.2,-7.5],[5.6,-9.6],[4.2,-5]],P=d=>poly.map(([r,u])=>FPb(sd*r,u,d));loft([P(1.1),P(1.9)],main,{capB:true,capT:true,center:FPb(sd*6.4,-4.5,1.5)})}
   if(open&&(K_.face==='visor'||K_.face==='mask')){if(MS_){const lo=[],up_=[];for(let r=-8.5;r<=8.51;r+=1.7){lo.push(SP(r*w,cb+.4,3.4));up_.push(SP(r*w,cb+7.4,1.4))}loft([lo,lo.map((q,i)=>vlerp(q,up_[i],.5)),up_],main,{open:true,center:HL([0,0,cb+3])})}TAG=3;const sl=[];for(let r=-6.5;r<=6.51;r+=1.3)sl.push(SP(r*w,cb+2.4,3.45));for(let i=0;i<sl.length-1;i++)tube(sl[i],sl[i+1],.45,.45,INKL,.9);TAG=2}
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
  if(F==='jin'||F==='jin2'){const BU=3;ellip(HL,10.8,10,10.5,-1,BU,HC,0,Math.PI/2,{capB:true});
   if(!up){face(true,true);// 드림 내림: 눈구멍을 실제로 뚫고, 안의 진짜 얼굴(눈 모양·눈썹·안대 설정 그대로)이 보이게
    if(MODE==='mesh'){const n=40,US=[BU+.5,2.6,1.7,.8,-.1,-1,-1.9,-2.8,-4.2,-6,-9,-12,-14.5],rad=u=>u>=-6?[lerp(11,10.4,(u+6)/(BU+6.5)),lerp(10.6,9.8,(u+6)/(BU+6.5))]:[lerp(14.2,11,(u+14.5)/8.5),lerp(13.8,10.6,(u+14.5)/8.5)];
     const LR=US.slice().reverse().map(u=>{const[a,b]=rad(u);return Array.from({length:n},(_,i)=>{const t=i/n*6.2832;return[Math.cos(t)*a-1,Math.sin(t)*b,u]})});
     const eyeWin=(...P)=>{const c=P.reduce((a,b)=>vadd(a,b),[0,0,0]).map(v=>v/P.length);return c[0]>2&&Math.abs(c[1])<6.6&&c[2]<3.15&&c[2]>-.6-1*(1-(c[1]/6.6)**2)};
     TAG=1;loft(LR.map(r=>r.map(HL)),HC,{center:HL([-1,0,-5]),skip:(j,i,i2)=>eyeWin(LR[j][i],LR[j][i2],LR[j+1][i],LR[j+1][i2])});TAG=2}}
   else{face();if(F==='jin')loft([neckRing(12.1,11.6,-1,BU+1.6).map(HL),neckRing(11.2,10.7,-1,BU+6.6).map(HL)],HC,{capB:true,capT:true});
    /* 드림 올림(2D jinDraw와 같게): 접은 챙 아래 천 가장자리, 귀 옆 속드림 자락(금나라 투구2는 뒷자락까지), 자락 밑단 천, 턱 밑에서 묶는 붉은 끈 */
    {const h0_=HLOC;HLOC=null;const FOLD=F==='jin',DB=-14.5,FB=-11.5,gi=FOLD?1:0,top=FOLD?BU+1.4:BU+.5,cloth=p.cloth||tr,red=p.flap&&p.flap!==st?p.flap:'#b3261a',
     dF=u=>u>=-6?lerp(10.4,11,clamp((BU+.5-u)/(BU+6.5),0,1)):lerp(11,14.2,clamp((-6-u)/(-6-DB),0,1)),dS=u=>u>=-6?lerp(9.8,10.6,clamp((BU+.5-u)/(BU+6.5),0,1)):lerp(10.6,13.8,clamp((-6-u)/(-6-DB),0,1));
     if(FOLD){TAG=0;loft([neckRing(12.16,11.66,-1,BU+1.6).map(HL),neckRing(12.16,11.66,-1,BU+2.8).map(HL)],cloth,{capB:true,capT:true});TAG=2}/* 챙 밑단 천 */
     const secs=FOLD?[[.95,1.85,FB],[4.43,5.33,FB]]:[[.95,1.75,FB],[1.75,Math.PI,DB],[Math.PI,4.53,DB],[4.53,5.33,FB]],arc=(u,t0,t1,g)=>Array.from({length:9},(_,q)=>{const t=lerp(t0,t1,q/8);return HL([-1+Math.cos(t)*(dF(u)-gi+g),Math.sin(t)*(dS(u)-gi+g),u])});
     for(const[t0,t1,ub]of secs){const us=[top,0,-3,-6,-9,ub].filter(u=>u<=top&&u>=ub),cn=HL([-1,0,(top+ub)/2]);TAG=1;loft(us.map(u=>arc(u,t0,t1,0)),HC,{open:true,center:cn});TAG=0;loft([arc(ub+1,t0,t1,.12),arc(ub,t0,t1,.12)],cloth,{open:true,center:cn});TAG=2}
     const knot=HL([6.9,0,-9.4]);/* 2D는 턱 밑에서 묶지만 3D는 몸통 윗면이 턱 바로 밑이라 파묻힌다 → 턱 앞쪽 가장자리에서 묶는다 */for(const t of[.95,5.33]){const a=HL([-1+Math.cos(t)*(dF(FB)-gi+.3),Math.sin(t)*(dS(FB)-gi+.3),FB+.6]),m_=HL([6.2,Math.sign(Math.sin(t))*5.4,-9.2]);tube(a,m_,.8,.8,red,.5);tube(m_,knot,.8,.8,red,.5)}
     ellip(v=>vadd(knot,v),1.5,1.5,1.5,0,0,red);for(const sd of[-1,1])tube(knot,HL([7.6,sd*2.4,-13]),.9,.7,red,.5);HLOC=h0_}}
   if(kit&&kit.crest!=='none'){HLOC=null;tube(HL([-1,0,BU+10.5]),HL([-3,0,BU+28]),1.4,.4,p.plume||'#8a1c1c',.5)}HLOC=null;return}
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
  else if(F==='parts'){const op=['open','nasal','cheek'].includes(kit.face)||(['visor','mask'].includes(kit.face)&&kit.visor==='up'),Rw=12*(kit.width||1);// 부품 조립 투구: 2D faceParts와 같은 눈 틈·숨구멍
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
 function view(X,Y,s,W,H){const cs=Math.cos(VIEW.yaw),sn=Math.sin(VIEW.yaw),sq=VIEW.sq,uk=VIEW.uk,r=[cs,-sn,0],u=[-sn*sq,-cs*sq,uk],b=[sn*uk,cs*uk,sq],ax=2*s/W,ay=2*s/H,bx=2*X/W-1,by=1-2*Y/H,z=-1/2000;
  return[ax*r[0],ay*u[0],z*b[0],0, ax*r[1],ay*u[1],z*b[1],0, ax*r[2],ay*u[2],z*b[2],0, bx,by,0,1]}
 function render(m,pose,down,X,Y,s,W,H,DPR,o={}){if(!init())return false;if(m.style!=='knight'&&m.style!=='mech')return false;AW=o.wArm??1;HWK=1;const mk=JSON.stringify(m)+'|'+AW;/* 머리 배율은 없앰(눈·코·입·투구 눈 틈은 기본 크기 고정) */if(!o.old&&skOK()&&SKBAD!==mk){if(renderSk(m,pose,down,X,Y,s,W,H,DPR,o,mk))return true;SKBAD=mk}lastStat={cpu:0,bone:0,n:1,old:true};// 스키닝을 못 쓰면(확장 미지원·뼈 수 불일치) 예전 방식
  const w=Math.round(W*DPR),h=Math.round(H*DPR);if(cvs.width!==w||cvs.height!==h){cvs.width=w;cvs.height=h}gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
  V=[];IDS=[];HLA=[];SKA=[];DEC=[];PM=[];PMX={};PML=0;MODE='mesh';BI=0;CB=0;REST=[];HLOC=null;PID=0;TAG=2;const K=skel(m,pose,down);K.m=m;K.pose=pose;K.down=down;if(m.style==='mech')mechM(m,K);else{knight(m,K,pose);sword(m,K)}
  gl.useProgram(prog);const cs=Math.cos(VIEW.yaw),sn=Math.sin(VIEW.yaw),U=n=>gl.getUniformLocation(prog,n);gl.uniformMatrix4fv(U('V'),false,view(X,Y,s,W,H));noSkin();gl.uniform3fv(U('L'),norm([sn*.9-cs*.7,cs*.9+sn*.7,1.1]));gl.uniform3fv(U('ink'),[.07,.065,.06]);gl.uniform3fv(U('B'),[sn*VIEW.uk,cs*VIEW.uk,VIEW.sq]);gl.uniform3fv(U('SR'),[cs,-sn,0]);gl.uniform3fv(U('SU'),[-sn*VIEW.sq,-cs*VIEW.sq,VIEW.uk]);gl.uniform1f(U('SM'),{toon:1,screen:2,matcap:3}[o.shade]||2);gl.uniform1f(U('BRU'),m.paint==='brush'?1:0);{const pp=m.pal||{},st=pp.steel||'#d9dee0';gl.uniform3fv(U('PST'),hex(st));gl.uniform3fv(U('PSH'),hex(pp.shade||hexMix(st,'#14161e',.4)));gl.uniform3fv(U('PHI'),hex(pp.hi||'#ffffff'))}
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
 const REST_POSE=()=>P0(POSE_PRESETS[0][1]);
 function build(m,K){if(m.style==='mech'){mechM(m,K);pmk('로봇 전체')}else{knight(m,K,K.pose);sword(m,K);pmk('칼')}HLOC=null}
 // 겉면을 기본자세에서 한 번만 만든다(모델 설정이 바뀌면 다시)
 function ensureMesh(m,key){if(MESH&&MESH.key===key)return MESH;
  V=[];IDS=[];HLA=[];SKA=[];DEC=[];PM=[];PMX={};PML=0;MODE='mesh';BI=0;CB=0;REST=[];HLOC=null;PID=0;TAG=2;const rp=REST_POSE(),K=skel(m,rp,0);K.m=m;K.pose=rp;K.down=0;build(m,K);
  const vbo=MESH&&MESH.vbo||gl.createBuffer(),ibo=MESH&&MESH.ibo||gl.createBuffer(),hbo=MESH&&MESH.hbo||gl.createBuffer(),sbo=MESH&&MESH.sbo||gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(V),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,ibo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(IDS),gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER,hbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(HLA),gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,sbo);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(SKA),gl.STATIC_DRAW);
  const at_=decUp(MESH&&MESH.at);
  MESH={key,vbo,ibo,hbo,sbo,parts:pmDone(),at:at_,cnt:V.length/9,nb:BI,pidn:PID+1,rinv:REST.map(F=>inv34(fm(F)))};V=[];IDS=[];HLA=[];SKA=[];return MESH}
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
  gl.useProgram(prog);const cs=Math.cos(VIEW.yaw),sn=Math.sin(VIEW.yaw),U=n=>gl.getUniformLocation(prog,n);gl.uniformMatrix4fv(U('V'),false,view(X,Y,s,W,H));gl.uniform3fv(U('L'),norm([sn*.9-cs*.7,cs*.9+sn*.7,1.1]));gl.uniform3fv(U('ink'),[.07,.065,.06]);gl.uniform3fv(U('B'),[sn*VIEW.uk,cs*VIEW.uk,VIEW.sq]);gl.uniform3fv(U('SR'),[cs,-sn,0]);gl.uniform3fv(U('SU'),[-sn*VIEW.sq,-cs*VIEW.sq,VIEW.uk]);gl.uniform1f(U('SM'),{toon:1,screen:2,matcap:3}[o.shade]||2);gl.uniform1f(U('BRU'),m.paint==='brush'?1:0);{const pp=m.pal||{},st=pp.steel||'#d9dee0';gl.uniform3fv(U('PST'),hex(st));gl.uniform3fv(U('PSH'),hex(pp.shade||hexMix(st,'#14161e',.4)));gl.uniform3fv(U('PHI'),hex(pp.hi||'#ffffff'))}
  gl.uniform1f(U('SKN'),1);gl.uniform1i(U('BT'),4);gl.uniform2f(U('BTs'),BW,NR);gl.uniform1f(U('PIDN'),ME.pidn);
  const pL=A_('p'),nL=A_('n'),cL=A_('c'),iL=A_('id'),hL=A_('hl'),pbL=A_('pb'),bwL=A_('bw'),inL=A_('ins');
  gl.bindBuffer(gl.ARRAY_BUFFER,ME.vbo);for(const[l,of] of[[pL,0],[nL,12],[cL,24]]){gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,3,gl.FLOAT,false,36,of)}
  gl.bindBuffer(gl.ARRAY_BUFFER,ME.ibo);gl.enableVertexAttribArray(iL);gl.vertexAttribPointer(iL,1,gl.FLOAT,false,4,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,ME.hbo);gl.enableVertexAttribArray(hL);gl.vertexAttribPointer(hL,4,gl.FLOAT,false,16,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,ME.sbo);gl.enableVertexAttribArray(pbL);gl.vertexAttribPointer(pbL,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(bwL);gl.vertexAttribPointer(bwL,3,gl.FLOAT,false,24,12);
  const IA=new Float32Array(NI);for(let i=0;i<NI;i++)IA[i]=i;gl.bindBuffer(gl.ARRAY_BUFFER,insb);gl.bufferData(gl.ARRAY_BUFFER,IA,gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(inL);gl.vertexAttribPointer(inL,1,gl.FLOAT,false,4,0);XI.vertexAttribDivisorANGLE(inL,1);
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,htex);gl.uniform1i(U('HT'),1);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,stex);gl.uniform1i(U('ST'),2);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,mtex);gl.uniform1i(U('MC'),3);gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,ltex);gl.uniform1i(U('LT'),5);gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,facetx||ltex);gl.uniform1i(U('FT'),6);gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,ME.at.tex);gl.uniform1i(U('AT'),7);gl.uniform2f(U('ATs'),ME.at.W,ME.at.TH);gl.activeTexture(gl.TEXTURE0);
  const D=()=>XI.drawArraysInstancedANGLE(gl.TRIANGLES,0,ME.cnt,NI);// 같은 겉면을 인원수만큼 한 번에(인스턴싱)
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
 function show(on){const c=document.getElementById('gl3d2');if(c)c.hidden=!on}
return{render,show,init,stat:()=>lastStat,parts:()=>MESH&&MESH.parts,benchBones:(m,pose,N)=>{const t0=performance.now();for(let i=0;i<N;i++)bones(m,pose,0);return(performance.now()-t0)/N},ok:m=>m&&(m.style==='knight'||m.style==='mech')}})();
