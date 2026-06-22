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

- `하`: HTML, CSS, JavaScript와 정적 데이터 중심
- `중`: 단일 API 키 기반 이미지 생성, 챗봇, 텍스트 생성
- `상`: 여러 API, 외부 연동, 인증, 저장소가 필요한 프로젝트형 앱

## 주요 명령

```bash
npm run assets
npm run lint
npm run build
```
