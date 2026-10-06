# 코코비 핑크 블랙 히어로 — 랜딩 페이지

배포: https://kg-deploy1-eta.vercel.app/

## 실행
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 생성 (Vercel 이 이 명령으로 빌드)
```

## 구조
| 경로 | 내용 |
|---|---|
| `index.html` | Hero(배경 영상) / 게임소개 / HEROES / MONSTERS / 스토리 / 미디어 / Footer 마크업·문구 |
| `src/style.css` | `:root` 핑크·블랙 토큰, 섹션 스타일, 반응형(1100px / 640px) |
| `src/main.js` | 헤더 고정·스크롤 스파이, 게임소개 슬라이더, `CHARACTERS`(히어로), `MONSTERS`(몬스터 8), 스크롤 등장, 영상 모달 |
| `src/spine.js` | Spine 3.8 WebGL 로더/측정/그리기 헬퍼 |
| `src/cta.js` | 푸터 몬스터 스티커 트레일 + 잭잭 커서 (gsap) |
| `public/cocobi/` | 이미지, `spine/*.skel.bytes·atlas.txt·png`, `cocobi_60sec_web.mp4` |
| `public/vendor/` | spine-webgl 3.8 런타임 |
| `public/fonts/` | Cocobi Bold |

`public/` 안의 파일은 빌드 때 그대로 복사되며, 코드에서는 `/cocobi/...` 처럼 절대경로로 참조합니다.

## 자주 바꿀 곳
- 히어로/몬스터 문구·스킨·아이콘 크롭: `src/main.js`의 `CHARACTERS`, `MONSTERS`
- 배경 영상 반복 구간: `src/main.js` Hero 블록의 `END = 43`
- 영상 링크: 버튼의 `data-youtube` / `data-list`
- App Store 링크: 출시 전이라 Google Play 링크로 임시 연결 (`index.html`의 첫 번째 `.store-btn`)

## 비밀 정보
API 키 등은 `.env`에만 두세요. `.env`는 `.gitignore`로 제외되어 있습니다.
