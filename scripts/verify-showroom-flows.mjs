import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.SHOWROOM_URL || "http://127.0.0.1:3117";
const out = path.resolve("output/playwright/showroom-flows");
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
assert.equal((await context.request.post(`${base}/api/verify-code`, { data: { code: process.env.SHOWROOM_ACCESS_CODE || "showroom2026" } })).status(), 200);
const page = await context.newPage();
page.setDefaultNavigationTimeout(90000);
const errors = [];
const report = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
async function open(slug) { await page.goto(`${base}/apps/${slug}/work`); await page.locator(".workspace-header h1").waitFor(); }
async function tab(label) { await page.getByRole("navigation", { name: "화면 선택" }).getByRole("button", { name: label, exact: true }).click(); }
async function capture(name) {
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter((img) => { const r = img.getBoundingClientRect(); return !img.closest("details:not([open])") && !img.closest("[hidden]") && r.width && r.height && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; }).map((img) => img.decode().catch(() => {}))); });
  await page.screenshot({ animations: "disabled", path: path.join(out, `${name}-desktop.png`) });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} overflows on mobile`);
  await page.screenshot({ animations: "disabled", path: path.join(out, `${name}-mobile.png`) });
  await page.setViewportSize({ width: 1440, height: 900 });
}
async function expectText(locator, text) { await locator.filter({ hasText: text }).first().waitFor(); }

const cases = [
  ["timer", async () => {
    await open("class-timer-station");
    await page.getByText("새 타이머 추가", { exact: true }).click();
    await page.getByLabel("타이머 이름", { exact: true }).fill("1분 생각 정리");
    await page.getByLabel("시간(분)").fill("1");
    await page.getByRole("button", { name: "추가", exact: true }).click();
    await tab("수업 진행");
    await page.clock.install();
    await page.getByRole("button", { name: "시작", exact: true }).click();
    await page.clock.fastForward(10000);
    await page.getByRole("button", { name: "일시정지", exact: true }).click();
    const paused = await page.locator(".timer-progress-ring span").innerText();
    await page.clock.fastForward(5000);
    assert.equal(await page.locator(".timer-progress-ring span").innerText(), paused);
    await page.getByRole("button", { name: "시작", exact: true }).click();
    await page.clock.fastForward(61000);
    await page.getByText("시간 종료", { exact: true }).waitFor();
    await capture("timer-completed");
    await page.getByRole("button", { name: "다시 시작", exact: true }).click();
    await page.getByRole("button", { name: "일시정지", exact: true }).waitFor();
    await page.clock.fastForward(1000);
    assert.equal(await page.locator(".timer-progress-ring span").innerText(), "00:59");
    await page.getByRole("button", { name: "일시정지", exact: true }).click();
    await page.getByRole("button", { name: "리셋", exact: true }).click();
    assert.equal(await page.locator(".timer-progress-ring span").innerText(), "01:00");
    const presenter = await page.locator(".timer-presenter-now").innerText();
    await page.getByRole("button", { name: "다음 발표", exact: true }).click();
    assert.notEqual(await page.locator(".timer-presenter-now").innerText(), presenter);
  }],
  ["vocabulary", async () => {
    await open("english-vocab-cards");
    await page.getByLabel("영단어", { exact: true }).fill("seed");
    await page.getByLabel("뜻", { exact: true }).fill("씨앗");
    await page.getByLabel("예문", { exact: true }).fill("Seeds grow into plants.");
    await page.getByRole("button", { name: "단어 추가", exact: true }).click();
    await page.getByText("seed 단어를 추가했어요.").waitFor();
    await tab("카드 학습");
    await page.locator(".vocab-flip-card").click();
    assert.equal(await page.locator(".vocab-flip-card").getAttribute("data-flipped"), "true");
    await capture("vocabulary-reveal");
    await page.getByRole("button", { name: "외웠어요", exact: true }).click();
    await expectText(page.locator(".workspace-page-count"), "1 / 7");
    await page.reload(); await page.locator(".workspace-header h1").waitFor();
    await expectText(page.locator(".workspace-page-count"), "1 / 7");
    await tab("카드 학습");
    await page.getByRole("button", { name: "초기화", exact: true }).click();
    for (let i = 0; i < 6; i++) { await page.locator(".vocab-flip-card").click(); await page.getByRole("button", { name: "외웠어요", exact: true }).click(); }
    await page.getByText("6개 단어를 모두 외웠어요!").waitFor();
    await capture("vocabulary-completed");
    await page.getByRole("button", { name: "복습 다시 시작", exact: true }).click();
    await expectText(page.locator(".workspace-page-count"), "0 / 6");
  }],
  ["seating", async () => {
    await open("seat-shuffle-picker");
    await page.getByRole("button", { name: /회차 자리 뽑기/ }).click();
    await page.locator(".seatapp-grid.is-drawing").waitFor({ state: "hidden" });
    assert.equal(await page.locator(".seatapp-seat").count(), 24);
    assert.match(await page.locator(".seatapp-seat.is-fixed").innerText(), /김하윤/);
    assert.equal(await page.locator(".seatapp-seat.is-care").count(), 2);
    await expectText(page.locator(".seatapp-round-chip"), "3회차");
    await capture("seating-result");
    await page.reload(); await page.locator(".workspace-header h1").waitFor(); await tab("좌석표");
    await expectText(page.locator(".seatapp-round-chip"), "3회차");
    await tab("장부"); await page.getByRole("tab", { name: /배치.*기록|기록/ }).click();
    await capture("seating-records");
    await tab("명단·조건"); await page.getByRole("button", { name: "처음 명단으로", exact: true }).click();
    await tab("좌석표"); await expectText(page.locator(".seatapp-round-chip"), "2회차");
  }],
  ["suggestion", async () => {
    await open("class-suggestion-box");
    await page.getByLabel("건의 내용", { exact: true }).fill("");
    await page.getByRole("button", { name: "건의 보내기", exact: true }).click();
    await page.locator(".suggestapp-form-error").waitFor();
    const content = "친구들이 추천하는 책을 함께 읽는 시간을 만들어요.";
    await page.getByLabel("별명", { exact: true }).fill("책친구");
    await page.getByLabel("건의 내용", { exact: true }).fill(content);
    await page.getByRole("button", { name: "건의 보내기", exact: true }).click();
    await page.locator(".suggestapp-form-done").waitFor();
    await tab("검토 장부");
    await page.getByRole("row").filter({ hasText: content }).getByRole("button", { name: "승인 체크", exact: true }).click();
    await tab("게시판");
    // A new post can be on the last page of a populated board.
    for (let i = 0; i < 5 && !(await page.locator(".suggestapp-card").filter({ hasText: content }).count()); i++) await page.getByRole("navigation", { name: "건의 게시판 페이지" }).getByRole("button", { name: "다음 페이지" }).click();
    const card = page.locator(".suggestapp-card").filter({ hasText: content });
    await card.getByRole("button", { name: "답변 쓰기", exact: true }).click();
    await card.getByLabel("선생님 답변").fill("다음 주 독서 시간에 추천 책 한 권씩 소개해요.");
    await card.getByRole("button", { name: "답변 저장", exact: true }).click();
    await card.locator(".suggestapp-reply-form").waitFor({ state: "hidden" });
    await card.getByText("다음 주 독서 시간에 추천 책 한 권씩 소개해요.", { exact: true }).waitFor();
    await capture("suggestion-approved-replied");
    await tab("검토 장부");
    while (await page.getByRole("button", { name: "승인 해제", exact: true }).count()) await page.getByRole("button", { name: "승인 해제", exact: true }).first().click();
    await tab("게시판"); await page.getByText("아직 게시된 건의가 없어요", { exact: true }).waitFor();
    await capture("suggestion-empty");
    await tab("건의 작성"); await page.getByRole("button", { name: "처음 상태로", exact: true }).click();
    await tab("게시판"); assert(await page.locator(".suggestapp-card").count() > 0);
  }],
  ["rental", async () => {
    await open("boardgame-rental-desk");
    const game = page.locator(".rentapp-game-card").filter({ hasText: "할리갈리" });
    await game.getByRole("button", { name: "대여하기", exact: true }).click();
    await game.getByRole("button", { name: "1", exact: true }).click();
    await expectText(game.locator(".rentapp-stock-badge"), "1개 남음");
    await tab("대여·반납");
    const rental = page.locator(".rentapp-active-item").filter({ hasText: "할리갈리" });
    await rental.waitFor();
    await capture("rental-borrowed");
    await rental.getByRole("button", { name: "반납", exact: true }).click();
    await rental.waitFor({ state: "hidden" });
    await tab("게임 선반"); await expectText(game.locator(".rentapp-stock-badge"), "2개 남음");
    await tab("대여·반납");
    while (await page.locator(".rentapp-active-item").count()) {
      const count = await page.locator(".rentapp-active-item").count();
      await page.locator(".rentapp-active-item").first().getByRole("button", { name: "반납", exact: true }).click();
      await page.waitForFunction((before) => document.querySelectorAll(".rentapp-active-item").length < before, count);
    }
    await page.getByText("모든 게임이 제자리에 있어요", { exact: true }).waitFor();
    await capture("rental-empty");
    await page.getByRole("button", { name: "처음 장부로", exact: true }).click();
    assert(await page.locator(".rentapp-active-item").count() > 0);
  }],
  ["poll", async () => {
    await open("live-class-poll");
    await page.getByRole("button", { name: /가을 현장체험학습/ }).click();
    await page.getByRole("button", { name: /과학관/ }).click();
    await expectText(page.locator(".pollapp-total"), "1표");
    await page.getByRole("button", { name: "선택 바꾸기", exact: true }).click();
    await page.getByRole("button", { name: /미술관/ }).click();
    await expectText(page.locator(".pollapp-total"), "1표");
    await page.locator(".pollapp-bar-row").filter({ hasText: "미술관" }).getByText("내 선택", { exact: true }).waitFor();
    await capture("poll-results");
    await page.getByRole("button", { name: "예시 응답 1표 추가", exact: true }).click();
    await expectText(page.locator(".pollapp-total"), "2표");
    await tab("응답 장부"); await page.getByRole("tab", { name: "질문", exact: true }).click();
    await page.getByRole("row").filter({ hasText: "가을 현장체험학습" }).getByRole("button", { name: "마감 체크", exact: true }).click();
    await tab("투표·결과"); await page.getByText("마감된 투표", { exact: true }).waitFor();
    await capture("poll-closed");
    await tab("질문 선택"); await page.getByRole("button", { name: "처음 상태로", exact: true }).click();
    await page.getByRole("button", { name: /가을 현장체험학습/ }).click();
    await expectText(page.locator(".pollapp-total"), "0표");
  }],
  ["library", async () => {
    await page.goto(`${base}/library`); await page.getByLabel("앱 검색").waitFor();
    const first = await page.locator(".app-card").first().getAttribute("aria-label");
    await page.getByRole("navigation", { name: "앱 목록 페이지" }).getByRole("button", { name: "다음 페이지" }).click();
    assert.notEqual(await page.locator(".app-card").first().getAttribute("aria-label"), first);
    await page.getByLabel("앱 검색").fill("시화");
    await page.getByRole("button", { name: "시화 제작 설명 보기", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await capture("library-app-details");
    await page.getByRole("dialog").getByRole("button", { name: /닫기/ }).click();
    await page.getByLabel("앱 검색").fill("찾을수없는앱이름");
    await page.getByText("검색 결과가 없습니다.").waitFor();
    await capture("library-empty");
  }],
];

try {
  for (const [name, run] of cases) {
    try { await page.setViewportSize({ width: 1440, height: 900 }); await run(); report.push({ name, ok: true }); console.log(`PASS ${name}`); }
    catch (error) { report.push({ name, ok: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); await page.screenshot({ animations: "disabled", path: path.join(out, `${name}-failure.png`) }).catch(() => {}); }
  }
} finally {
  fs.writeFileSync(path.join(out, "flow-report.json"), JSON.stringify({ report, errors }, null, 2));
  await browser.close();
}
if (errors.length || report.some((r) => !r.ok)) process.exitCode = 1;
