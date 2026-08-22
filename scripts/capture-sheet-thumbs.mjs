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
if (!chromium) throw new Error("Playwright chromium launcher was not found");

const baseUrl = process.env.SHOWROOM_URL || "http://localhost:57397";
const thumbDir = path.resolve("public/visuals/generated-thumbnails");
fs.mkdirSync(thumbDir, { recursive: true });

function save(name, buffer) {
  fs.writeFileSync(path.join(thumbDir, `${name}.png`), buffer);
  console.log(`saved ${name}.png (${buffer.length} bytes)`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const page = await context.newPage();

const access = await page.request.post(`${baseUrl}/api/verify-code`, { data: { code: process.env.SHOWROOM_ACCESS_CODE || "showroom2026" } });
if (!access.ok()) throw new Error(`access grant failed: ${access.status()}`);

async function captureSheetApp({ slug, layoutSelector, beforeShot, sheetTab }) {
  await page.goto(`${baseUrl}/apps/${slug}/work`, { waitUntil: "domcontentloaded" });
  await page.locator(layoutSelector).waitFor();
  // 카드 썸네일(4:3 뷰포트)에 앱 화면만 담기도록 상단 헤더·푸터를 캡처에서 제외한다.
  await page.addStyleTag({ content: "header, footer { display: none !important; }" });
  await page.waitForTimeout(400);
  if (beforeShot) await beforeShot(page);

  await page.evaluate((selector) => {
    const layout = document.querySelector(selector);
    if (layout) {
      const top = layout.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, Math.max(0, top - 14));
    }
  }, layoutSelector);
  await page.waitForTimeout(250);

  const layoutShot = await page.screenshot();
  save(slug, layoutShot);

  await page.locator(".gsheet-dock-toggle").click();
  await page.waitForTimeout(520);
  if (sheetTab) {
    await page.locator(".gsheet-tab", { hasText: sheetTab }).click();
    await page.waitForTimeout(250);
  }
  const sheetShot = await page.locator(".gsheet-panel").screenshot();
  save(`${slug}-sheet`, sheetShot);
}

await captureSheetApp({
  slug: "seat-shuffle-picker",
  layoutSelector: ".seatapp-layout",
  sheetTab: "명렬표",
});

await captureSheetApp({
  slug: "class-suggestion-box",
  layoutSelector: ".suggestapp-layout",
  sheetTab: "건의함",
});

await captureSheetApp({
  slug: "boardgame-rental-desk",
  layoutSelector: ".rentapp-layout",
  sheetTab: "대여 기록",
});

await captureSheetApp({
  slug: "live-class-poll",
  layoutSelector: ".pollapp-layout",
  sheetTab: "응답",
  beforeShot: async (page) => {
    // 투표를 한 번 진행해 실시간 그래프가 보이는 상태로 캡처한다.
    await page.locator(".pollapp-option").first().click();
    await page.waitForTimeout(1400);
  },
});

await browser.close();
console.log("done");
