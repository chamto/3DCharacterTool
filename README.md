# 3D 캐릭터 툴 (검술대전 모델 공방)

배포: claude.ai 아티팩트 `QiahVxXgaiCPRR142WoNJD`

## 구조
- `src/shell_head.html`: 마크업과 CSS (`<script>` 여는 태그까지)
- `src/core.js`: 2D 공통 그리기와 인물 데이터
- `src/knight.js`: 판금 기사(2D)
- `src/mech.js`: 로봇 모델(2D)
- `src/painter.js`: 그림 탭(붓 이미지 `BRUSH_SRC` 포함)
- `src/helmimport.js`: 투구 부품 조립
- `src/editor.js`: 패널, 프레임, 상태
- `src/world3d.js`: 3D 월드(동결)
- `src/world3d2.js`: 3D 월드2(작업 대상)

## 빌드
```
python3 tools/build.py        # dist/model-workshop.html, dist/x.js 생성
node --check src/world3d2.js && node --check dist/x.js
```
조각은 위 순서대로 이어 붙인다. v166 배포본에서 나눴으며, 다시 빌드하면 배포본과 바이트 단위로 같다.

작업 기록은 `docs/`에 있다.
