import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.SHOWROOM_URL || "http://127.0.0.1:3117";
const out = path.resolve(process.env.SHOWROOM_CAPTURE_DIR || "output/playwright/showroom-upgrade");
fs.mkdirSync(out, { recursive: true });
const slugs = ["author-meet-chatbot", "class-timer-station", "concept-explainer", "english-vocab-cards", "addition-card-match-game", "history-typing-rain", "neon-rhythm-runner", "liberation-text-adventure", "ai-question-helper", "picturebook-scene-maker", "ai-invention-lab", "seat-shuffle-picker", "class-suggestion-box", "boardgame-rental-desk", "live-class-poll"];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const access = await context.request.post(`${base}/api/verify-code`, { data: { code: process.env.SHOWROOM_ACCESS_CODE || "showroom2026" } });
if (!access.ok()) throw new Error(`Login failed: ${access.status()}`);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push({ url: page.url(), message: error.message }));
page.on("console", (message) => { if (message.type() === "error") errors.push({ url: page.url(), message: message.text() }); });
const report = [];
try {
  for (const viewport of [{ width: 1440, height: 900, name: "desktop" }, { width: 390, height: 844, name: "mobile" }]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const slug of slugs) {
      await page.goto(`${base}/apps/${slug}/work`, { waitUntil: "domcontentloaded" });
      await page.locator(".workspace-header h1").waitFor();
      await page.locator(".workspace-quota").filter({ hasText: "확인 중" }).waitFor({ state: "hidden", timeout: 20000 });
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter((img) => { const r = img.getBoundingClientRect(); return !img.closest("details:not([open])") && !img.closest("[hidden]") && r.width && r.height && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; }).map((img) => img.decode().catch(() => {}))); });
      const dimensions = await page.evaluate(() => ({ width: innerWidth, contentWidth: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, headerBottom: document.querySelector(".workspace-header").getBoundingClientRect().bottom, controlFontMismatch: [...document.querySelectorAll(".workspace-page button,.workspace-page input,.workspace-page select,.workspace-page textarea")].filter((el) => el.getClientRects().length && !getComputedStyle(el).fontFamily.includes("Pretendard")).map((el) => el.tagName) }));
      const filename = `${slug}-${viewport.name}.png`;
      await page.screenshot({ animations: "disabled", path: path.join(out, filename) });
      report.push({ slug, viewport: viewport.name, screenshot: filename, ...dimensions, horizontalOverflow: dimensions.contentWidth > viewport.width + 1 });
      console.log(`Captured ${slug} ${viewport.name}${dimensions.contentWidth > viewport.width + 1 ? " — OVERFLOW" : ""}`);
    }
    await page.goto(`${base}/library`, { waitUntil: "domcontentloaded" });
    await page.getByRole("textbox", { name: "앱 검색" }).waitFor();
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter((img) => { const r = img.getBoundingClientRect(); return !img.closest("details:not([open])") && !img.closest("[hidden]") && r.width && r.height && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; }).map((img) => img.decode().catch(() => {}))); });
    await page.screenshot({ animations: "disabled", path: path.join(out, `library-${viewport.name}.png`) });
    await page.goto(`${base}/`);
    await page.locator(".intro-gate").waitFor({ state: "hidden", timeout: 10000 });
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter((img) => { const r = img.getBoundingClientRect(); return !img.closest("details:not([open])") && !img.closest("[hidden]") && r.width && r.height && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; }).map((img) => img.decode().catch(() => {}))); });
    await page.screenshot({ animations: "disabled", path: path.join(out, `home-${viewport.name}.png`) });
  }
  fs.writeFileSync(path.join(out, "screen-audit.json"), JSON.stringify({ base, report, errors }, null, 2));
  if (errors.length || report.some((r) => r.horizontalOverflow || r.controlFontMismatch.length)) process.exitCode = 1;
} finally { await browser.close(); }
