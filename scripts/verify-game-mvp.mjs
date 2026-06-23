import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const skillRequire = createRequire("/Users/user/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js");
    return import(skillRequire.resolve("playwright"));
  }
}

const playwright = await loadPlaywright();
const chromium = playwright.chromium ?? playwright.default?.chromium;

if (!chromium) {
  throw new Error("Playwright chromium launcher was not found");
}

const baseUrl = process.env.SHOWROOM_URL || "http://localhost:3001";
const outDir = path.resolve("output/playwright/game-mvp-review");
fs.mkdirSync(outDir, { recursive: true });

const errors = [];

function parseState(text) {
  return JSON.parse(text);
}

async function grantAccess(page) {
  const response = await page.request.post(`${baseUrl}/api/verify-code`, {
    data: { code: process.env.SHOWROOM_ACCESS_CODE || "showroom2026" },
  });
  if (!response.ok()) {
    throw new Error(`Access grant failed: ${response.status()}`);
  }
}

async function state(page) {
  return parseState(await page.evaluate(() => {
    if (typeof window.render_game_to_text !== "function") {
      throw new Error("render_game_to_text missing");
    }
    return window.render_game_to_text();
  }));
}

async function screenshot(page, name, options = {}) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: options.fullPage ?? true });
}

async function verifyAddition(page) {
  await page.setViewportSize({ width: 1365, height: 900 });
  await page.goto(`${baseUrl}/apps/addition-card-match-game/work`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /게임 시작/ }).waitFor();
  await page.getByRole("button", { name: /게임 시작/ }).click();
  await page.waitForTimeout(250);

  const preview = await state(page);
  if (preview.mode !== "preview") throw new Error(`addition preview mode failed: ${preview.mode}`);
  if (!preview.cards.every((card) => card.visible && card.label !== "card-back")) {
    throw new Error("addition preview does not reveal all cards");
  }
  await screenshot(page, "addition-preview-desktop");

  await page.evaluate(() => window.advanceTime?.(6000));
  await page.waitForTimeout(650);
  const hidden = await state(page);
  if (hidden.mode !== "playing") throw new Error(`addition did not enter playing: ${hidden.mode}`);
  if (!hidden.cards.some((card) => card.label === "card-back")) {
    throw new Error("addition hidden backs not represented in text state");
  }
  await screenshot(page, "addition-hidden-desktop");

  await matchAllAdditionPairs(page, hidden);

  const complete = await state(page);
  if (complete.mode !== "complete") throw new Error(`addition did not complete: ${complete.mode}`);
  if (complete.matchedPairs !== 8) throw new Error(`addition matched count wrong: ${complete.matchedPairs}`);
  await screenshot(page, "addition-complete-desktop");

  await page.setViewportSize({ width: 390, height: 920 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /게임 시작/ }).waitFor();
  await page.getByRole("button", { name: /게임 시작/ }).click();
  await page.waitForTimeout(250);
  await screenshot(page, "addition-preview-mobile", { fullPage: false });
  await page.evaluate(() => window.advanceTime?.(6000));
  await page.waitForTimeout(100);
  const hiddenMobile = await state(page);
  await matchAllAdditionPairs(page, hiddenMobile);
  const completeMobile = await state(page);
  if (completeMobile.mode !== "complete") throw new Error(`addition mobile did not complete: ${completeMobile.mode}`);
  await page.locator(".addition-overlay-card--win").evaluate((element) => {
    element.scrollIntoView({ block: "center", inline: "nearest" });
  });
  await page.waitForTimeout(100);
  await screenshot(page, "addition-complete-mobile", { fullPage: false });
}

async function matchAllAdditionPairs(page, initialState) {
  const pairIds = [...new Set(initialState.cards.map((card) => card.pairId))];
  for (const pairId of pairIds) {
    const latest = await state(page);
    const first = latest.cards.find((card) => card.pairId === pairId && card.kind === "expression");
    const second = latest.cards.find((card) => card.pairId === pairId && card.kind === "answer");
    if (!first || !second) throw new Error(`pair not found: ${pairId}`);
    await page.locator("button.addition-card").nth(first.index).click();
    await page.locator("button.addition-card").nth(second.index).click();
    await page.evaluate(() => window.advanceTime?.(800));
    await page.waitForTimeout(60);
  }
}

async function verifyHistory(page) {
  await page.setViewportSize({ width: 1365, height: 900 });
  await page.goto(`${baseUrl}/apps/history-typing-rain/work`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /시작하기/ }).waitFor();
  await screenshot(page, "history-ready-desktop");
  await page.getByRole("button", { name: /시작하기/ }).click();
  await page.waitForTimeout(150);

  const started = await state(page);
  if (started.mode !== "playing") throw new Error(`history start failed: ${started.mode}`);
  if (!started.words.length) throw new Error("history has no falling words after start");

  await page.getByLabel("키워드 입력").fill(started.words[0].text);
  await page.getByRole("button", { name: /^입력$/ }).click();
  await page.waitForTimeout(120);
  const hit = await state(page);
  if (hit.hits < 1 || hit.score <= 0) throw new Error("history typed hit did not score");
  await screenshot(page, "history-after-hit-desktop");

  await page.getByRole("button", { name: /일시정지/ }).click();
  await page.waitForTimeout(100);
  const paused = await state(page);
  if (paused.mode !== "paused") throw new Error(`history pause failed: ${paused.mode}`);
  await screenshot(page, "history-paused-desktop");

  await page.getByRole("button", { name: /이어하기/ }).click();
  await page.evaluate(() => window.advanceTime?.(61000));
  await page.waitForTimeout(150);
  const ended = await state(page);
  if (ended.mode !== "ended") throw new Error(`history did not end after time advance: ${ended.mode}`);
  await screenshot(page, "history-ended-desktop");

  await page.setViewportSize({ width: 390, height: 920 });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /시작하기/ }).waitFor();
  await page.getByRole("button", { name: /시작하기/ }).click();
  await page.waitForTimeout(150);
  await screenshot(page, "history-playing-mobile", { fullPage: false });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));

  await grantAccess(page);
  await verifyAddition(page);
  await verifyHistory(page);

  await browser.close();
  fs.writeFileSync(path.join(outDir, "console-errors.json"), JSON.stringify(errors, null, 2));
  if (errors.length) {
    throw new Error(`Console errors found: ${errors.join("; ")}`);
  }
  console.log(`verified game MVP flows at ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
