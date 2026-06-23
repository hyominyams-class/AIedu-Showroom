<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Global UI Rules

- Do not use gradients in UI unless the user explicitly asks for them.
- Do not write visible UI copy in a meta, explanatory, or implementation-focused tone.
- Write all user-facing copy as direct product language for the end user.
- Avoid wording such as "정리했습니다", "구성했습니다", "배치했습니다", "비교할 수 있도록" in visible UI copy unless the user explicitly wants explanatory wording.

## Image Generation Rules

- When generated images need visible text, put the exact text requirements in the image generation prompt and let the image generation model render the text.
- Do not add, replace, correct, or stylize image text through local post-processing, compositing, canvas drawing, SVG overlays, or manual bitmap editing. If the text is wrong, iterate with the image generation model instead.
- 이미지 생성 결과물 안의 글자는 후작업으로 합성하거나 고치지 말고, 이미지 생성 모델이 직접 렌더링하도록 프롬프트에 정확히 넣고 재생성으로 해결한다.

## Product Quality Rules

- When the user asks to create a specific app, tool, game, or experience, do not stop at a shallow demo. Build the smallest complete MVP that a real end user could understand, operate, and judge.
- Before implementing, identify the expected MVP surface for that app type: core flow, primary states, empty/loading/error states, restart/reset paths, user feedback, and the domain-specific details users naturally expect.
- Improve both design and function. A pass is not complete if it only works mechanically while looking unfinished, or if it looks polished while missing core behavior.
- Prefer concrete product decisions over placeholder UI. Avoid unexplained "?", blank boxes, generic buttons, dummy panels, and default browser-looking controls unless they are intentional and refined.
- Verify the implemented experience from the user's point of view. Use screenshots, browser interaction, console checks, responsive checks, and state inspection where applicable.

## Game Quality Rules

- For games, use the `develop-web-game` workflow when applicable: implement in small iterations, expose `window.render_game_to_text`, expose deterministic `window.advanceTime(ms)`, run the Playwright game client after meaningful changes, inspect screenshots, inspect text state, and fix console errors.
- Game work must include a real start flow, clear visual identity, readable game pieces, feedback for player actions, win/lose or completion states, restart behavior, and controls that are tested end-to-end.
- Match the expected conventions of the game genre. For example, a memory/card game should include designed card backs, a reveal/preview phase before play when appropriate, flip animations or equivalent feedback, matched/unmatched states, attempt or timer feedback, and a finished-game state.
- Do not treat placeholder symbols as final art. If a game piece needs a back, face, board, token, enemy, obstacle, collectible, or effect, design it intentionally enough that the player can understand it without developer explanation.
- The main agent must review subagent work critically before accepting it. If visuals, interactions, responsiveness, game state, or genre expectations are weak, identify the gaps, request or make corrections, and repeat implementation and verification until the MVP is coherent.
