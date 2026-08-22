Original prompt: 타자 게임, 카드 뒤집기 게임은 게임 효과가 제대로 적용되지 않고 실제 게임 같게 구현이 전혀 안 된 상태이니 기능 고도화도 필요함. 실제 MVP 수준까지 게임 기능 고도화 되도록

## Progress
- Started MVP game upgrade for `history-typing-rain` and `english-vocab-cards`.
- Goal: turn both from styled demos into playable MVP game loops with clear state, scoring, feedback, and verification hooks.
- Added history typing game states, timer, target count, combo/fever, miss damage, clear/gameover flow, floating feedback, and `render_game_to_text`/`advanceTime`.
- Rebuilt vocab cards as a memory matching game with 12 tiles, selected/checking/matched states, turns, timer, combo scoring, complete state, plus study-card support.
- Added CSS for HUDs, danger words, feedback chips, matching tiles, matched states, and mobile layouts.
- Verified with `npm run lint`, `npm run build`, Playwright interaction checks, screenshots, and `render_game_to_text` state.
- New request: rebuild the typing game as a rectangular card/canvas MVP: press start, slow falling keywords, user types to remove, 3 lives, 1 minute, polished Tailwind UI.
- Replaced the history typing game with a canvas-based keyword rain game inside a rectangular Tailwind-styled card.
- Implemented 3 lives, 60-second timer, slow falling keyword cards, typed removal, score/combo/hit/miss state, floor collision, and game finish.
- Verified with skill client smoke run, authenticated Playwright interaction checks, desktop/mobile screenshots, `render_game_to_text`, `advanceTime`, `npm run lint`, and `npm run build`.
- New request: split English vocab memorization and card-flip game into separate low-difficulty apps. Build a grades 1-2 one-digit addition card matching game with 8 expression cards and 8 answer cards shuffled together.
- Converted `english-vocab-cards` to pure flashcard memorization and kept difficulty `하`.
- Added `addition-card-match-game` as a separate difficulty `하` app for grades 1-2 with 8 one-digit addition expression cards and 8 answer cards.
- Added route/spec/component wiring for the new game and verified matching via `render_game_to_text`.
- Verified with skill client smoke run, authenticated Playwright desktop/mobile screenshots, `npm run lint`, and `npm run build`.
- New active goal: review all games in `/Users/user/task/showroom` to playable MVP quality under `AGENTS.md`, `develop-web-game`, and `frontend-design` expectations.
- Inventory confirmed two actual games routed through `/apps/[slug]/work`: `addition-card-match-game` and `history-typing-rain`. `english-vocab-cards` is now a non-game flashcard memorization app.
- Subagent review completed for both games. Addition game gaps: no explicit start/preview phase, placeholder-style backs, weak completion framing, and timer/ref cleanup issues. History game gaps: metadata mismatch, English status copy, and unused pause mode.
- Upgraded `addition-card-match-game` with an explicit game start, timed full-card preview/memory phase, designed card backs without `?` placeholders, elapsed/preview status, deterministic test hook behavior for preview/check timers, victory state, replay action, and random reshuffle.
- Upgraded `history-typing-rain` by aligning metadata to 3 lives, replacing English status labels with Korean product copy, adding actual pause/resume behavior, blocking submissions while paused, and preventing mobile focus scroll jumps.
- Added authenticated Playwright verification for both protected game routes. It checks render state, card preview/hidden/complete states, typing hit scoring, pause, end state, desktop/mobile screenshots, and console errors.
- Verified current game round with `npm run lint`, authenticated Playwright checks, screenshot inspection in `output/playwright/game-mvp-review/`, and `npm run build`.
- Attempted the installed `develop-web-game` web game client through a local auth-injecting proxy. The first proxy approach could not reliably pass the app's client-side `AccessGate`; authenticated direct Playwright verification covered the same flows and generated usable state/screenshot evidence.
- Added tracked `npm run verify:games` verification so the protected game routes can be replayed with authenticated Playwright checks and reusable screenshot/state coverage.
- Addition game worker pass added selected/matched card feedback, stronger victory banner, pending-check stability for `advanceTime`, and main review removed duplicate completion panel.
- Added a dev-only `__game_verify=1` proxy path that sets the existing access cookie only when `NODE_ENV !== "production"`, allowing the installed `$WEB_GAME_CLIENT` to run against protected game routes without weakening production access.
- Re-ran the installed `$WEB_GAME_CLIENT` for `addition-card-match-game` and `history-typing-rain`; both generated screenshots and `render_game_to_text` state under `output/web-game-goal-*-final/` with no client error files.
- Final main verification passed: `npm run lint`, `npm run verify:games`, `git diff --check`, and `npm run build`. Latest screenshots inspected: addition hidden/complete desktop-mobile states and history playing/ended desktop-mobile states. Console errors remained `[]`.

## Session: 공개 9개 앱 MVP 고도화 + 폐기 자산 정리 (goal-driven)
- Confirmed the public set via `activeAppSlugs` and trimmed to 9 apps; removed `ai-question-helper`(활동지) per request. Deleted 12 deprecated app entries from `apps.ts`/`mvp.ts` (specs + demoExamples), simplified `apps` export, and pruned dead landing/`HeroSection` references.
- Deleted now-unreferenced files: `DemoExperience`, `MvpWorkspace`, generic `MvpResult`, `QuestionHelperWorkspace`. Rebuilt `work` route to a slug→component map and limited `result` route to invention + picturebook. Reverted the unintended `src/proxy.ts` `__game_verify` bypass.
- Library: removed pagination (9-app catalog) so there is no empty trailing page; fixed `<Image priority>`→`preload`.
- Games redesigned end-to-end. Addition: real 3D flip (front/back faces), designed card backs, 식/정답 tags, match/mismatch juice, simple star scoring, shuffle locked during play, start/win overlays. History: DPR-scaled crisp canvas, castle-defense night world (stars/moon/wall battlements), on-canvas HUD (score/combo/hearts/time bar), typed-target gold highlight, lane system (no overlap), difficulty curve, ready/paused/ended panels. Both keep `render_game_to_text`/`advanceTime`.
- Image apps reflect input without regenerating: poetry composes the user's typed poem with the curated art + copy/save; picturebook replaces the browser-wireframe fallback with a designed storybook-scene card (only renders a real image for inline data: URLs, avoiding the remote-URL next/image crash); invention navigates to its result so copy/save are reachable. Removed "미리보기창" placeholders/meta copy.
- vocab: real 3D flip, Fisher-Yates shuffle, "외웠어요" advances to the next card, removed the duplicate 암기율 panel. author: input lock during typing animation (fixes conversation-history corruption), chat auto-scroll, and replaced the raw system-prompt textarea with friendly 말투 presets.
- Dead CSS: removed 78 top-level rules whose selectors were all confirmed-dead classes (~590 lines), build/visual verified, no regression.
- Verified with `npm run lint`, `npm run build`, `node scripts/verify-game-mvp.mjs` (0 console errors), and authenticated Playwright screenshots of all 9 apps (games, image apps, vocab, author, library, concept, timer).

## TODO
- Remaining quality debt (deferred, non-user-facing): trim dead branches in `api/ai/generate/route.ts` (`isQuestionHelper`/`questionHelperSchema`, `safety-webtoon-maker`); narrow `MvpKind` + remove unused `MvpStorage` builders; sweep dead CSS still living inside `@media` blocks; unify design tokens (off-white/green hex families, `.button-primary` per-page color) — a larger refactor.
- Note: `lib/visuals.ts` THUMBNAIL_ASSET_VERSION bump + regenerated `public/visuals/*.png` appeared in the working tree but were not authored in the app-code pass; revert if unwanted.
- Future improvement: add sound effects after confirming browser audio policy and user preference.
- Future improvement: add difficulty selection and saved high scores if persistence becomes in-scope.
- Future improvement: add addition-specific thumbnail/preview assets instead of reusing the vocab/quiz imagery in app metadata.

## Session: per-app deep review + second improvement round
- Ran 4 parallel deep reviews of the current 9-app code; synthesized per-app "remaining gaps" with screenshots.
- 덧셈 카드: card aspect 1/1 → 8/5 (landscape) + narrower board so the 4×4 board + start overlay fit one screen.
- 수업 타이머 (was below MVP): timestamp-based countdown (no drift), time-up alert (red ring + WebAudio beep), localStorage persistence with delete, a real 발표 순서 board (모둠 수 / 다음 발표 / 순서 섞기 / current-presenter highlight), per-timer 진행 안내 banner. Dropped the fake static phase board.
- 역사 타자 mobile: responsive logical width + lane count (zoom in on narrow screens) so words/HUD stay legible; portrait-ish canvas height. Also: denser spawning (3 staggered seeds, tighter cadence), wall-damage cracks per lost life, Enter-to-restart on ready/ended, word-x clamp, removed duplicate bestCombo type field.
- 발명소 (images stay virtual by design): removed the localStorage-leaking inline gallery (result page owns the gallery), added an honest "예시 발명품" disclaimer + the participating sketch on the result, product-framed copy.
- 그림책: short-circuited image gen in the route (no cost/hang) + client AbortController timeout; hid the duplicate result text block.
- 개념 설명기: bound title/lead to whether the model's blocks are actually live (no heading/body mismatch); added answer-panel loading overlay + AI-fallback notice; split readiness % from the source badge; unified `--concept-accent` to green (killed the blue number-chip bleed).
- 작가 챗봇: surface an AI-fallback notice when the answer is a canned fallback.
- a11y: reduced-motion now covers card/timer flourishes; explicit focus rings on game controls.
- Verified `npm run lint` + `npm run build`, `verify:games` (0 console errors), and a Playwright sweep of all 9 apps (0 console errors total) + screenshots.
- Confirmed `next/image` uses `preload` (not deprecated `priority`) per this build's `get-img-props.d.ts`; a review suggesting the reverse was wrong for this custom Next.

## Session: 외부 앱 3종 추가 + Smile 점검 중 표시 (2026-08-22)
- 쇼룸에 외부 링크 앱 3종을 추가: `digital-reading-passport`(디지털 독서여권, 독서교육/상), `national-heritage-map`(국가유산 지도, 역사/상), `ml-microbit-studio`(마이크로비트 머신러닝, 머신러닝/상). 모두 `externalUrl`로 새 탭에서 열리는 기존 외부 앱 패턴(`class-game-management`)을 따름. 카탈로그 16→19개, 카테고리 13→15개(독서교육·머신러닝 신설).
- 썸네일/미리보기는 실제 서비스 화면을 Playwright로 캡처(`scripts/capture-external-thumbs.mjs`, `npm run assets:external`). 카드 4:3과 라이트박스 세로 크롭을 모두 견디도록 4:3 프레임으로 통일하고, 앵커 텍스트 기준으로 스크롤 위치를 잡아 재현 가능하게 만듦. ML 스튜디오는 뷰포트 820px에서 "내가 정한 손모양을 직접 가르치는 모델" 패널을 clip 캡처해 21 landmarks 다이어그램이 크롭에서 살아남도록 함.
- `AppItem`에 `status?: AppStatus`("live" | "maintenance") 추가. Smile은 항목·링크를 그대로 두고 `status: "maintenance"`만 지정.
- 점검 중 표현: 카드 미디어 우상단 `점검 중` 배지(`.status-badge`), 라이트박스 칩 + 안내 문구, `앱 체험하기` 링크를 비활성 상태로 교체해 점검 중에는 이동 불가.
- 확인: `npm run lint`(기존 러너/어드벤처 오류 2건만 잔존, 신규 파일 무결), `npm run build`, `npm run verify:games`, 인증 Playwright로 라이브러리 데스크톱/모바일·라이트박스 3종·Smile 점검 상태 캡처, 콘솔 에러 0건.
- 참고: Next dev 이미지 캐시가 `.next/dev/cache/images`에도 남아 있어 같은 경로의 이미지를 교체하면 `.next/cache/images`와 함께 지워야 새 이미지가 보임. `THUMBNAIL_ASSET_VERSION`은 `src/lib/visuals.ts`와 `next.config.ts` 두 곳에 있으므로 올릴 때 함께 맞춰야 함(이번에는 신규 경로라 올리지 않음).
