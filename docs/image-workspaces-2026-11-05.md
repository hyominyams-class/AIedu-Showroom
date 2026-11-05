# 이미지 앱 개선 — 2026-11-05

- 시화 제작을 카탈로그와 생성 허용 목록에서 제외했다. 현재 33개 앱, 내부 체험 15개다.
- 그림책 장면 제작기와 AI 발명 설계소를 난이도 중으로 변경했다. 전체 목록은 하 → 중 → 상 순서를 유지한다.
- 그림책에 수채화·색연필·종이 콜라주 참고 이미지를 추가했다. 발명 설계소는 기존 포스터·교실·집 사용 장면을 참고 이미지로 표시한다.
- 두 이미지 앱의 내 작품 보기는 썸네일, 표현 방식, 만든 날짜, 작품 열기, 이미지 저장을 제공한다. 같은 브라우저의 저장 결과를 다시 조회하며 새로고침과 입력 초기화로 없어지지 않는다.
- 기본 이미지 모델은 [GPT Image 2.5 Flare](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare), 품질은 medium이다. PNG 출력과 스케치 편집을 지원한다.

## 두 번째 이미지 오류

실제 그림책 요청에서 첫 장은 성공하고 다음 요청은 약 9초 뒤 실패하는 현상을 재현했다. 두 번째 요청은 이미지 제공자를 호출하기 전 사용량 예약 단계에서 실패했다.

첫 결과를 포함한 JSON 기록이 1KB를 넘으면서 Blob 다운로드가 압축되고, GET의 ETag가 약한 태그(`W/"…"`)로 바뀌었다. 이 값은 조건부 쓰기의 `ifMatch`를 만족할 수 없어 계속 충돌했다. 기록을 `Accept-Encoding: identity`로 읽어 원본 표현의 강한 ETag를 사용하도록 수정했다. 기존 기록의 내용·횟수·작품은 변경하지 않았다.

참고: [Vercel Blob SDK의 조건부 쓰기](https://vercel.com/docs/vercel-blob/using-blob-sdk).

제공자 요청 제한·내용 거절·시간 초과는 각각 구분해 안내한다. 제공자 상태·오류 코드·요청 ID만 기록하고 입력 문장·키·원문 응답은 기록하지 않는다. JSON이 아닌 시간 초과 응답도 읽을 수 있는 안내로 처리한다.

## 확인한 결과

- 실제 Flare 그림책 2장 생성: 수채화와 색연필. 요청 응답은 각각 약 26초, 24초였다. 수정 전 두 번째 요청의 저장 충돌을 재현하고, 수정 뒤 같은 방문자의 남은 횟수로 정상 완료했다.
- 새로고침 뒤 두 작품 복구, 최신 작품 열기, 다운로드, 추가 차감 없음 확인.
- 실제 private Blob에서 큰 한글 기록을 포함한 동시 예약·실패 반환·연속 3회 완료·네 번째 차단 확인. 이 검사는 이미지 제공자를 호출하지 않는다.
- `npm run test:ai` 9개, lint, 타입 검사, 프로덕션 빌드 통과.
- 데스크톱 1440×900, 모바일 390×844에서 목록, 두 앱의 참고 이미지, 빈 작품 목록, 저장한 작품 목록 확인. 가로 넘침·콘솔 오류 없음.

캡처와 검사 보고서: `output/playwright/image-workspaces/`. 운영 재검사는 `output/playwright/image-workspaces-production/`에 저장한다. 브라우저 인증 상태 파일은 공유하지 않는다.

`SHOWROOM_LIVE_IMAGES=1 node scripts/verify-image-workspaces.mjs`는 별도 검사 브라우저에서 최대 두 장까지 실제 생성하며, 기존 작품은 재사용한다. 플래그가 없으면 생성 없이 UI와 저장 결과를 확인한다.

## 참고 이미지와 생성 프롬프트

참고 이미지는 내장 imagegen 도구로 각각 생성했다. 이미지 안에 텍스트를 넣거나 후처리하지 않았다. 원본을 아래 프로젝트 경로로 복사했다.

| 스타일 | 프로젝트 파일 | STYLE 문장 |
| --- | --- | --- |
| 수채화 | `public/visuals/style-references/watercolor.png` | Transparent watercolor on cold-pressed watercolor paper. Soft pigment blooms, watery washes, loose brush edges and visible ivory paper grain. |
| 색연필 | `public/visuals/style-references/colored-pencil.png` | Hand-drawn colored pencil on cream paper. Clearly visible pencil strokes and crosshatching, grainy pigment, warm contour lines and subtle white paper between strokes. |
| 종이 콜라주 | `public/visuals/style-references/paper-cut.png` | Handmade cut-paper collage. Tangible overlapping cut paper pieces, crisp irregular scissor-cut silhouettes, gently raised layers, paper fibers and small physical shadows. No painted or drawn textures. |

세 호출에 사용한 프롬프트 템플릿은 다음과 같다. `{id}`는 watercolor / colored-pencil / paper-cut, `{style}`은 위 STYLE 문장이다.

```text
Create a finished children's picturebook art reference image for the {id} option in a Korean classroom web app. Landscape 3:2 composition, the image fills the frame edge to edge. Subject: a young East Asian child wearing a yellow raincoat and red boots jumps across a blue rain puddle beside a small white dog, in a green school garden after the rain, with three flowers, a tree and a clear pale sky. Keep this exact simple scene so users can compare art materials. STYLE: {style} Charming but convincingly handmade, clear readable shapes, balanced cobalt blue, warm yellow, leafy green. No words, no letters, no numbers, no labels, no borders, no watermark, no UI. This is an actual illustration, not a UI mockup.
```
