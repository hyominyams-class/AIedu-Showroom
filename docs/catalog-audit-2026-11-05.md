# 공개 앱 등록 점검 — 2026-11-05

기존 23개에서 디지털 독서여권·국가유산 지도를 제외하고, `/Users/user/task`에서 운영 주소를 확인한 앱 17개를 추가했다. 이후 사용자 요청으로 시화공방·자유 이미지 스튜디오·왓이스잇·에듀테크 교원연수 신청을 제외해 현재 총 34개다. 새 앱은 `src/data/published-apps.ts`에서 관리한다.

## 등록 근거

각 프로젝트의 README·배포 문서·공개 메타데이터를 대조하고, 아래 주소를 HTTP GET 및 Chromium에서 열어 첫 화면을 확인했다. HTTP 200은 모든 로그인·AI·게임 기능의 정상 동작을 보장하는 검사가 아니다.

| 프로젝트 폴더 | 공개 주소 | 확인 |
| --- | --- | --- |
| `dokdo-gangchi` | https://dokdoday.web.app | HTTP 200 · 공개 화면 확인 |
| `halloween-attack` | https://halloween-attack-school.web.app | HTTP 200 · 공개 화면 확인 |
| `team-game` | https://team-game-one.vercel.app | HTTP 200 · 공개 화면 확인 |
| `escape-game` | https://escape-game-new.vercel.app | HTTP 200 · 공개 화면 확인 |
| `friendly-game` | https://friendly-game-kr.web.app | HTTP 200 · 공개 화면 확인 |
| `math-block` | https://chagok-blocks.web.app | HTTP 200 · 공개 화면 확인 |
| `3d-city` | https://world-travel-library-2q6sbduynq-du.a.run.app | HTTP 200 · 공개 화면 확인 |
| `love-korean` | https://love-korean-loyvoyunvq-du.a.run.app | HTTP 200 · 공개 화면 확인 |
| `world-wide-map` | https://world-wide-map.vercel.app | HTTP 200 · 공개 화면 확인 |
| `library-game` | https://library-game.vercel.app | HTTP 200 · 공개 화면 확인 |
| `ForTeacherAI` | https://for-teacher-ai.vercel.app | HTTP 200 · 공개 화면 확인 |
| `Teacehr-RoadMap` | https://teacher-growth-ivory.vercel.app | HTTP 200 · 공개 화면 확인 |
| `Teacher_Test` | https://teacher-test-mu.vercel.app | HTTP 200 · 공개 화면 확인 |
| `edutech-forms` | https://jgedutech.web.app | HTTP 200 · 확인 후 사용자 요청으로 제외 |
| `poem-maker` | https://poem-maker-2zcrhgslia-du.a.run.app | HTTP 200 · 확인 후 사용자 요청으로 제외 |
| `free-image-studio` | https://free-image-studio-sigma.vercel.app | HTTP 200 · 확인 후 사용자 요청으로 제외 |
| `inquiry-based-learning/question-lab` | https://inquiry-based-learning-pi.vercel.app | HTTP 200 · 확인 후 사용자 요청으로 제외 |

## 썸네일

`public/visuals/published-apps/`에 현재 등록 중인 새 앱의 실제 공개 화면 13장을 1200×900 WebP로 저장했다. 도입 화면이 있는 앱은 사용자 조작으로 메인 화면까지 진행했다. 세계로는 공개 체험 계정의 지구본 화면을 촬영했다. 이미지 안의 문구를 추가하거나 수정하지 않았다.

## 제외·중복 처리

- 사용자 요청: `reading_passport`, `reading_passport-training-experience`, 국가유산 지도.
- `gps-map`: 문서에 기록된 `https://trip-map-7380.web.app`과 `https://trip-map-436ksg7yga-du.a.run.app` 모두 HTTP 404. 임의 대체 주소를 만들지 않았다.
- `Microbit_With_AI` / `micro_bit`, `shopping-app`은 기존 마이크로비트 머신러닝·AI Catchmind와 동일 서비스라 중복 등록하지 않았다.
- `ForTeacherAI-*`, 아카이브·백업 폴더는 같은 서비스의 작업 사본이다.
- `homepage`는 앱 모음/포트폴리오라 앱으로 재등록하지 않았다.
- `review-student-records`는 설치형 스킬이며 브라우저 실행 앱이 아니다.
- `smart-school-life`, `glocal-app`, `microbit-icbanq`, `movie-library`, `practice`, `example`, `design-model`, `icbanQ`는 이번 조사에서 연결 가능한 별도 운영 앱 주소를 확인하지 못했다.

## Classgame

목록은 유지하고 실행 링크는 `/login`으로 연결한다. 교사·학생 ID와 공용 비밀번호를 소개에서 제거하고 학생 전용 체험 로그인으로 안내한다. Classgame 구현·커밋·배포는 `class-game`의 별도 작업으로 수행했다. 기능 커밋 `2fe255e`, 운영 기록 포함 최종 `53e6d5f`의 main 푸시·Vercel 배포 성공 후 로그인 버튼과 학생 대시보드 실제 화면을 추가 촬영했다. 공용 체험 학생이며 교사·관리자 권한, 계정정보 변경, 다른 학생에게 송금은 제한한다.

## 쇼룸 검증

- `npm run lint`, `npm run build` 통과.
- 최초 추가 시 production 서버에서 38개 카드, 제외 앱 부재, 신규 17개 썸네일 디코딩·정확한 링크·새 탭 속성, 키워드/띄어쓰기 검색, 빈 결과, 카테고리·난이도 필터, 초기화 검사 통과.
- 데스크톱 1440×1100, 모바일 390×844 화면 확인. 실제 카드 → 상세창 → 독도강치 새 탭 접속 통과. 이 흐름의 JavaScript 런타임 오류 0건.
- 브라우저 검수 원본은 Git 제외 `output/playwright/showroom-*.png`, 실행 기록은 `output/catalog-browser-qa.txt`.

## 후속 목록 조정

사용자가 지정한 시화공방(`poem-maker`), 자유 이미지 스튜디오(`free-image-studio`), 왓이스잇(`inquiry-lab`), 에듀테크 교원연수 신청(`edutech-forms`) 4개를 쇼룸 목록에서 제외했다. 현재 34개이며, 기존 `시화 제작` 체험 앱은 유지한다. 홈 미리보기와 라이브러리는 동일한 앱 목록을 사용한다.
