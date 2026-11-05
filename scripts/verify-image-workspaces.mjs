import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

// Only the explicit live flag permits two real picturebook generations.
const live = process.env.SHOWROOM_LIVE_IMAGES === "1";
const base = process.env.SHOWROOM_URL || "http://127.0.0.1:3117";
const out = path.resolve(process.env.SHOWROOM_IMAGE_REVIEW_DIR || "output/playwright/image-workspaces");
const stateFile = path.resolve(process.env.SHOWROOM_IMAGE_SESSION || "output/playwright/image-workspaces-session.json");
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...(fs.existsSync(stateFile) ? { storageState: stateFile } : {}) });
const login = await context.request.post(`${base}/api/verify-code`, { data: { code: process.env.SHOWROOM_ACCESS_CODE || "showroom2026" } });
assert.equal(login.status(), 200);
const page = await context.newPage();
page.setDefaultTimeout(30000);
const errors = [];
const report = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
async function open(slug) {
  await page.goto(`${base}/apps/${slug}/work`);
  await page.locator(".workspace-header h1").waitFor();
  await page.getByText("횟수 확인 중", { exact: true }).waitFor({ state: "hidden" });
}
async function capture(name) {
  for (const viewport of [{ width: 1440, height: 900, name: "desktop" }, { width: 390, height: 844, name: "mobile" }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].filter((img) => { const r = img.getBoundingClientRect(); return r.width && r.height && r.top < innerHeight && r.bottom > 0; }).map((img) => img.decode()));
    });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} overflows on ${viewport.name}`);
    await page.screenshot({ path: path.join(out, `${name}-${viewport.name}.png`), animations: "disabled" });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}
const quota = async (slug) => (await context.request.get(`${base}/api/ai/quota?app=${slug}`)).json();

try {
  await page.goto(`${base}/library`);
  await page.getByLabel("앱 검색").waitFor();
  assert.equal(await page.locator(".app-card").count(), 33);
  assert.equal(await page.getByRole("button", { name: "시화 제작 설명 보기", exact: true }).count(), 0);
  assert.equal((await context.request.get(`${base}/apps/poetry-picture-maker/work`)).status(), 404);
  assert.equal((await context.request.get(`${base}/api/ai/quota?app=poetry-picture-maker`)).status(), 404);
  for (const title of ["AI 발명 설계소", "그림책 장면 제작기"]) assert.equal(await page.getByRole("button", { name: `${title} 설명 보기`, exact: true }).locator(".difficulty-badge").innerText(), "중");
  await capture("catalog-33-apps");
  report.push({ catalog: 33, poetryRemoved: true, imageAppsDifficulty: "중" });

  for (const slug of ["picturebook-scene-maker", "ai-invention-lab"]) {
    await open(slug);
    await page.getByRole("button", { name: /내 작품 보기/ }).click();
    if ((await quota(slug)).history.length === 0) await page.getByText("첫 작품을 기다리고 있어요", { exact: true }).waitFor();
    await capture(`${slug}-gallery-initial`);
    await page.getByRole("button", { name: "작품 만들기", exact: true }).click();
    await page.getByRole("button", { name: "다음", exact: true }).click();
    assert.equal(await page.locator(".creation-style-preview").count(), 3);
    await page.locator(".creation-style-preview").evaluateAll(async (images) => { await Promise.all(images.map((img) => img.decode())); });
    await page.getByRole("radio").last().check();
    assert(await page.getByRole("radio").last().isChecked());
    await capture(`${slug}-style-references`);
    report.push({ app: slug, referenceImages: 3, selection: true });
  }

  await open("picturebook-scene-maker");
  let saved = await quota("picturebook-scene-maker");
  if (live) {
    while (saved.history.length < 2) {
      const style = saved.history.length === 0 ? "watercolor" : "colored-pencil";
      await open("picturebook-scene-maker");
      await page.getByLabel("이야기 문장", { exact: true }).fill("비가 그치자 작은 토끼가 무지개를 만났어요.");
      await page.getByLabel("장면 묘사", { exact: true }).fill("초록 풀밭에서 작은 하얀 토끼가 하늘의 무지개를 바라보는 따뜻한 그림책 장면.");
      await page.getByRole("button", { name: "다음", exact: true }).click();
      await page.locator(`input[value="${style}"]`).check();
      const start = Date.now();
      const responsePromise = page.waitForResponse((r) => r.url().endsWith("/api/ai/generate") && r.request().method() === "POST", { timeout: 200000 });
      await page.getByRole("button", { name: "이미지 만들기 · 1회", exact: true }).click();
      const response = await responsePromise;
      const data = await response.json();
      console.log(JSON.stringify({ style, status: response.status(), code: data.code, seconds: (Date.now() - start) / 1000 }));
      assert.equal(response.status(), 200, data.error);
      assert.equal(data.source, "live");
      await page.locator(".creation-result-step img").evaluate((img) => img.decode());
      report.push({ app: "picturebook-scene-maker", realGeneration: true, style, seconds: (Date.now() - start) / 1000, remaining: data.quota.remaining });
      await capture(`picturebook-result-${style}`);
      saved = await quota("picturebook-scene-maker");
    }
  }
  if (saved.history.length > 0) {
    await page.reload();
    await page.getByRole("button", { name: /내 작품 보기/ }).click();
    await page.locator(".creation-gallery-card").first().waitFor();
    assert.equal(await page.locator(".creation-gallery-card").count(), saved.history.length);
    await capture("picturebook-my-artworks");
    await page.locator(".creation-gallery-open").first().click();
    await page.locator(".creation-result-step img").evaluate((img) => img.decode());
    const source = await page.locator(".creation-result-step img").getAttribute("src");
    assert.equal(new URL(source, base).pathname, new URL(saved.latest.imageUrl, base).pathname);
    const downloaded = await context.request.get(new URL(`${saved.latest.imageUrl}?download=1`, base).toString());
    assert.equal(downloaded.status(), 200);
    assert.match(downloaded.headers()["content-disposition"], /attachment/);
    assert.equal((await quota("picturebook-scene-maker")).quota.used, saved.quota.used);
    report.push({ galleryRestored: saved.history.length, restoredStyles: saved.history.map((work) => work.style), opensLatest: true, download: true, noExtraUsage: true });
  }
} catch (error) {
  report.push({ ok: false, error: error.message });
  await page.screenshot({ path: path.join(out, "failure.png"), animations: "disabled" });
  process.exitCode = 1;
} finally {
  await context.storageState({ path: stateFile });
  fs.chmodSync(stateFile, 0o600);
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify({ base, live, report, errors }, null, 2));
  await browser.close();
}
if (errors.length) process.exitCode = 1;
console.log(JSON.stringify({ report, errors }, null, 2));
