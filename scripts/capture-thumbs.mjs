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
const previewDir = path.resolve("public/visuals/landing-previews");
fs.mkdirSync(thumbDir, { recursive: true });
fs.mkdirSync(previewDir, { recursive: true });

function save(slug, buffer) {
  fs.writeFileSync(path.join(thumbDir, `${slug}.png`), buffer);
  fs.writeFileSync(path.join(previewDir, `${slug}.png`), buffer);
  console.log(`saved ${slug}.png (${buffer.length} bytes)`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
const page = await context.newPage();

const access = await page.request.post(`${baseUrl}/api/verify-code`, { data: { code: process.env.SHOWROOM_ACCESS_CODE || "showroom2026" } });
if (!access.ok()) throw new Error(`access grant failed: ${access.status()}`);

// ---------- neon rhythm runner ----------
await page.goto(`${baseUrl}/apps/neon-rhythm-runner/work`, { waitUntil: "domcontentloaded" });
await page.locator(".runner-canvas").waitFor();
await page.getByRole("button", { name: /러너 시작/ }).click();
await page.waitForTimeout(120);
// pose a lively in-play frame: run a bit, then jump so the runner is airborne over the neon track
await page.evaluate(() => {
  window.advanceTime?.(2550);
  window.dispatchEvent(new KeyboardEvent("keydown", { code: "Space", key: " ", bubbles: true }));
  window.advanceTime?.(150);
});
await page.waitForTimeout(80);
const runnerShot = await page.locator(".runner-canvas-wrap").screenshot();
save("neon-rhythm-runner", runnerShot);

// ---------- liberation text adventure ----------
await page.goto(`${baseUrl}/apps/liberation-text-adventure/work`, { waitUntil: "domcontentloaded" });
await page.locator(".adv-parchment--cover").waitFor();
await page.waitForTimeout(150);
const advShot = await page.locator(".adv-parchment--cover").screenshot();
save("liberation-text-adventure", advShot);

await browser.close();
console.log("done");
