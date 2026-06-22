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

## TODO
- Broader request remains open-ended: review the non-game education apps one by one for deeper product behavior, not only visual polish.
- Future improvement: add sound effects after confirming browser audio policy and user preference.
- Future improvement: add difficulty selection and saved high scores if persistence becomes in-scope.
