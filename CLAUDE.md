# 3D 캐릭터 툴 (검술대전 모델 공방)

## 작업 원칙
- 답변은 한국어로 하고, 화면 문구는 존댓말로 쓴다.
- **질문에는 답만 하고 코드를 고치지 않는다.** 고치라는 요청이 있을 때만 작업한다.
- **3D 월드2(`src/world3d2.js`)에만 적용한다.** 2D(`core.js`, `knight.js`, `mech.js`, `helmimport.js`)와 3D 월드(`world3d.js`)는 건드리지 않는다. 공통 적용 사항이 있어도 마찬가지다.

## 배포 규칙 (소스와 아티팩트는 항상 같이 간다)
`src/`를 수정했으면 **같은 작업 안에서 종속된 아티팩트까지 적용한다.** 사용자가 따로 말하지 않아도 한다.
1. `node --check src/world3d2.js`
2. `python3 tools/build.py` → `dist/model-workshop.html`, `dist/x.js` 생성
3. `node --check dist/x.js`
4. 화면 확인(Playwright, chrome `--use-gl=swiftshader`). 해당 변경이 눈에 보이는 경우에만 한다.
5. 커밋하고 개발 브랜치에 푸시한다.
6. **아티팩트 재배포**: 같은 링크 `https://claude.ai/artifact/QiahVxXgaiCPRR142WoNJD`에 `dist/model-workshop.html`을 올린다. 새 링크를 만들지 않는다.
   - 올리기 전에 `action: read`로 현재 내용을 확인한다. 다른 곳에서 바뀌었으면 합쳐서 올린다.
7. 보고할 때 재배포 여부와 링크를 함께 적는다.

## 파일 구조
- `src/shell_head.html`: 마크업·CSS (`<script>` 여는 태그까지)
- `src/core.js`, `knight.js`, `mech.js`, `painter.js`, `helmimport.js`, `editor.js`, `world3d.js`: 2D·공통 (동결)
- `src/world3d2.js`: 3D 월드2 (작업 대상)
- 이어 붙이는 순서는 `tools/build.py`에 있다. v166 배포본에서 나눴고, 다시 빌드하면 배포본과 바이트 단위로 같다.
- 작업 기록은 `docs/`에 있다.

## 코드 함정
- **한 줄 코드 속 `//` 주석 금지.** `world3d2.js`는 한 줄에 코드가 많아서 `//`가 뒤 코드를 통째로 주석 처리한다. 줄 중간에는 `/* */`를 쓴다.
- **뼈 등록 순서가 `'mesh'`·`'bone'` 두 모드에서 같아야 한다.** `tube`·`ellip`·`boxF`는 두 모드 모두 `bone()`을 호출한다. 겉면 전용 계산만 `if(MODE==='mesh')`로 감싼다. 어기면 "뼈 수 불일치" 경고가 뜨고 예전 방식으로 떨어진다.
- **HLA(vec4) w 꼬리표**: 1 투구 상세 그림, 2 사슬 무늬, 3 얼굴 그림, 4 통 능선, **10 이상 = 장식표(AT) 줄 번호(10+줄)**.
- **장식표(AT)**: 갑옷줄·리벳·테두리·띠·버클·멜빵·가슴 능선은 폴리곤이 아니라 부품별 장식표 줄과 셰이더로 그린다. `decRow()`로 줄을 추가하고 `decUp()`으로 올린다. 종류 0 통, 1 몸통, 2 구.
- **TAG**(색 r에 2·TAG를 더해 담음): 0 무늬 없음, 1 찰갑, 2 판금, 3 먹선(명암 없음).
- **텍스처 유닛**: 0 ID FBO, 1 `HT`(투구), 2 `ST`(붓 결), 3 `MC`(매트캡), 4 `BT`(뼈), 5 `LT`(찰갑), 6 `FT`(얼굴), 7 `AT`(장식표). 0번에 ID 텍스처가 묶인 채로 샘플러 기본값 0을 쓰면 피드백 루프 오류가 난다.
- 변수 이름: `ftex`는 ID FBO 텍스처, 얼굴 텍스처는 `facetx`.
- 메쉬 캐시 키: `JSON.stringify(m)` + 갑옷줄 배율. 시험 환경은 소프트웨어 렌더라 GPU 시간은 믿지 않는다.
