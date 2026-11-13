#!/usr/bin/env python3
"""src/의 조각을 이어 붙여 dist/model-workshop.html(배포본)과 dist/x.js(문법 점검용)를 만든다."""
import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'src');OUT=os.path.join(ROOT,'dist')
JS=['core.js','knight.js','mech.js','painter.js','helmimport.js','editor.js','world3d.js','world3d2.js']
rd=lambda n:open(os.path.join(SRC,n),encoding='utf8').read()
js=''.join(rd(n) for n in JS)
os.makedirs(OUT,exist_ok=True)
open(os.path.join(OUT,'model-workshop.html'),'w',encoding='utf8').write(rd('shell_head.html')+js+'</script>\n')
open(os.path.join(OUT,'x.js'),'w',encoding='utf8').write(js)
print('built',len(js),'bytes of js')
