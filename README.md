# AI EDU Showroom

교사 연수에서 만들 수 있는 교육용 앱 아이디어를 난이도별로 탐색하고, 각 앱의 체험 흐름을 확인하는 Next.js 기반 쇼룸입니다.

## 실행

```bash
npm install
npm run dev
```

로컬 주소는 `http://localhost:3000`입니다.

## 입장 코드

기본 로컬 코드는 `showroom2026`입니다.

배포 환경에서는 `TRAINING_ACCESS_CODE` 환경변수로 코드를 지정합니다.

```bash
TRAINING_ACCESS_CODE=showroom2026
```

## 앱 구성

앱 구성 기준은 [docs/app-reconfiguration-plan.md](docs/app-reconfiguration-plan.md)에 정리되어 있습니다.
제품 요구사항은 [docs/prd-ai-education-showroom.md](docs/prd-ai-education-showroom.md)에 정리되어 있습니다.
공개 앱 추가·제외 근거와 운영 주소 확인 기록은 [2026-11-05 목록 점검](docs/catalog-audit-2026-11-05.md)을 참고하세요.

현재 목록은 33개입니다. 새로 등록한 공개 앱 13개는 `src/data/published-apps.ts`, 기존 쇼룸 체험과 외부 앱은 `src/data/apps.ts`에서 관리합니다. 공개 앱의 실제 화면 썸네일은 `public/visuals/published-apps/`에 있습니다.

- `하`: HTML, CSS, JavaScript와 정적 데이터 중심
- `중`: 단일 API 키 기반 이미지 생성, 챗봇, 텍스트 생성
- `상`: 여러 API, 외부 연동, 인증, 저장소가 필요한 프로젝트형 앱

## 주요 명령

```bash
npm run assets
npm run lint
npm run build
```


## AI 체험과 서버 설정

`.env.example`을 `.env.local`로 복사하고 서버 환경변수를 설정합니다.

- `OPENAI_API_KEY`: 텍스트·이미지 생성 키. 브라우저에 전달하지 않습니다.
- `SHOWROOM_SESSION_SECRET`: 32자 이상의 별도 무작위 비밀값. 방문자·입장 쿠키 서명용입니다.
- `BLOB_READ_WRITE_TOKEN`: 비공개 Vercel Blob 저장소 키. 사용량과 생성 결과를 저장합니다.
- 선택: `OPENAI_TEXT_MODEL`(기본 `gpt-5-mini`), `OPENAI_IMAGE_MODEL`(기본 `gpt-image-2.5-flare`).

운영 환경에서는 Vercel Production·Preview에 등록한 값을 사용합니다. `.env.local`과
기존 `local.env`는 Git·배포 소스·함수 파일 추적에서 제외합니다. 로컬에서 Blob 키가
없으면 `.showroom-data/`에 기록하며, Vercel에서 지속 저장소가 없으면 생성을 차단합니다.

텍스트 생성은 브라우저별·앱별 20회, 이미지 생성은 3회입니다. 새로고침·재접속·입력
초기화로 횟수가 복구되지 않습니다. 동시 생성은 잠그고, 성공 결과만 차감하며 같은
요청 ID는 저장된 결과를 돌려줍니다. 익명 체험이므로 쿠키 삭제나 다른 브라우저까지
동일인으로 묶지는 않습니다. 운영 도구의 학급 장부는 해당 브라우저에 저장됩니다.

## 검증

- `npm run test:ai`: 횟수 경계·동시 요청·재시작·서명·입력·업로드 바이트 검사.
- `npm run verify:games`: 네 게임의 시작·조작·완료·재시작과 캡처.
- `npm run verify:flows`: 타이머·단어·자리·건의·대여·투표·목록 흐름 검사.
- `npm run capture:apps`: 내부 15개 앱과 홈·목록의 데스크톱·모바일 캡처.
- 브라우저 검사 대상은 `SHOWROOM_URL`로 지정합니다.
- `SHOWROOM_LIVE_AI=1 node scripts/verify-live-ai.mjs`는 실제 생성에 비용이 발생할 수
  있습니다. 이미 저장한 결과는 재사용합니다. 생성 키·브라우저 세션 파일은 공유하지 않습니다.

점검 내역은 `docs/showroom-upgrade.md`, 캡처와 검사 결과는 Git에서 제외된
`output/playwright/`에 저장합니다.
