import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

// Explicit opt-in: this checks the real provider, not a mocked generator.
if (process.env.SHOWROOM_LIVE_AI !== "1") throw new Error("Set SHOWROOM_LIVE_AI=1 to allow provider calls (at most 3 text + 2 image generations).");
const base = process.env.SHOWROOM_URL || "http://127.0.0.1:3120";
const out = path.resolve("output/playwright/live-ai-review");
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const storage = path.resolve("output/playwright/ai-browser-session.json");
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...(fs.existsSync(storage) ? { storageState: storage } : {}) });
assert.equal((await context.request.post(`${base}/api/verify-code`, { data: { code: process.env.SHOWROOM_ACCESS_CODE || "showroom2026" } })).status(), 200);
const page = await context.newPage();
page.setDefaultNavigationTimeout(90000);
page.setDefaultTimeout(30000);
const errors = [];
let expectedFailure = false;
const report = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error" && !(expectedFailure && /503/.test(message.text()))) errors.push(message.text()); });
async function open(slug) { await page.goto(`${base}/apps/${slug}/work`); await page.locator(".workspace-header h1").waitFor(); await page.locator(".workspace-quota").filter({ hasText: "확인 중" }).waitFor({ state: "hidden" }); }
async function capture(name) {
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].filter((img) => { const r = img.getBoundingClientRect(); return !img.closest("details:not([open])") && !img.closest("[hidden]") && r.width && r.height && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; }).map((img) => img.decode().catch(() => {}))); });
  await page.screenshot({ animations: "disabled", path: path.join(out, `${name}-desktop.png`) });
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await page.screenshot({ animations: "disabled", path: path.join(out, `${name}-mobile.png`) });
  await page.setViewportSize({ width: 1440, height: 900 });
}
async function generate(click) {
  const response = page.waitForResponse((r) => r.url().endsWith("/api/ai/generate") && r.request().method() === "POST", { timeout: 200000 });
  await click();
  const resolved = await response;
  const data = await resolved.json();
  assert.equal(resolved.status(), 200, data.error || "Generation failed");
  assert.equal(data.source, "live");
  return data;
}
async function cachedOrCreate(slug, create) {
  const current = await (await context.request.get(`${base}/api/ai/quota?app=${slug}`)).json();
  if (current.latest?.source === "live") { console.log(`Reuse completed ${slug}`); return current.latest; }
  const result = await create();
  report.push({ app: slug, actualGeneration: true, remaining: result.quota.remaining, requestId: result.requestId });
  return result;
}

try {
  await open("author-meet-chatbot");
  const author = await cachedOrCreate("author-meet-chatbot", async () => {
    await page.getByRole("navigation", { name: "작업 단계" }).getByRole("button", { name: "3 대화", exact: true }).click();
    await page.getByLabel("작가에게 질문").fill("강아지똥이 민들레를 도와준 까닭을 두 문장으로 말해 주세요.");
    return generate(() => page.getByRole("button", { name: "보내기", exact: true }).click());
  });
  await page.reload(); await page.locator(".workspace-header h1").waitFor();
  await page.getByRole("navigation", { name: "작업 단계" }).getByRole("button", { name: "3 대화", exact: true }).click();
  await page.locator(".author-chat-thread").getByText(author.message, { exact: true }).waitFor();
  await capture("author-restored");
  const savedChat = page.waitForEvent("download");
  await page.getByRole("button", { name: "대화 저장", exact: true }).click();
  await (await savedChat).saveAs(path.join(out, "author-conversation.txt"));
  assert(fs.readFileSync(path.join(out, "author-conversation.txt"), "utf8").includes(author.message));
  await page.getByRole("button", { name: "새 대화", exact: true }).click();
  await page.getByRole("button", { name: "이전 답변", exact: true }).click();
  await page.locator(".author-chat-thread").getByText(author.message, { exact: true }).waitFor();
  report.push({ app: "author-meet-chatbot", historyAfterReset: true, textDownload: true });

  await open("concept-explainer");
  const concept = await cachedOrCreate("concept-explainer", async () => {
    await page.getByRole("button", { name: "다음", exact: true }).click();
    return generate(() => page.getByRole("button", { name: "설명 만들기 · 1회", exact: true }).click());
  });
  await page.reload(); await page.locator(".workspace-header h1").waitFor();
  await page.getByRole("navigation", { name: "작업 단계" }).getByRole("button", { name: "3 설명", exact: true }).click();
  await page.locator(".concept-answer-panel:not([hidden])").waitFor();
  await capture("concept-restored");
  const count = await page.locator(".workspace-page-count").innerText();
  const firstContent = await page.locator(".concept-step-slide").innerText();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  assert.notEqual(await page.locator(".workspace-page-count").innerText(), count);
  assert.notEqual(await page.locator(".concept-step-slide").innerText(), firstContent);
  await capture("concept-next-card");
  await page.getByRole("navigation", { name: "작업 단계" }).getByRole("button", { name: /질문$/ }).click();
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  assert.equal(await page.locator(".workspace-result-picker select").inputValue(), "");
  await page.locator(".workspace-result-picker select").selectOption(concept.requestId);
  await page.locator(".concept-answer-panel:not([hidden])").waitFor();
  report.push({ app: "concept-explainer", savedResultAfterReset: true });

  await open("ai-question-helper");
  const worksheet = await cachedOrCreate("ai-question-helper", () => generate(() => page.getByRole("button", { name: "학습지 만들기 · 1회", exact: true }).click()));
  await page.reload(); await page.locator(".workspace-header h1").waitFor();
  await page.getByRole("navigation", { name: "작업 단계" }).getByRole("button", { name: "2 학습지 보기", exact: true }).click();
  await page.getByRole("navigation", { name: "작업 단계" }).getByRole("button", { name: /수업 설정$/ }).click();
  await page.getByRole("button", { name: "초기화", exact: true }).click();
  assert.equal(await page.locator(".workspace-result-picker select").inputValue(), "");
  await page.locator(".workspace-result-picker select").selectOption(worksheet.requestId);
  report.push({ app: "ai-question-helper", savedResultAfterReset: true });
  await page.getByRole("button", { name: "정답·해설 보기", exact: true }).click();
  await capture("worksheet-answer");
  assert.equal(await page.locator(".worksheet-problem:visible").count(), 1);
  await page.getByRole("button", { name: "다음 문항", exact: true }).click();
  await page.emulateMedia({ media: "print" });
  assert(await page.locator(".worksheet-doc-head").isVisible(), "The printed worksheet must include its title, grade, and name fields");
  assert.equal(await page.locator(".worksheet-problem:visible").count(), worksheet.problems.length);
  await page.pdf({ path: path.join(out, "worksheet-print.pdf"), format: "A4", printBackground: true });
  await page.emulateMedia({ media: "screen" });

  for (const slug of ["picturebook-scene-maker", "ai-invention-lab"]) {
    await open(slug);
    const result = await cachedOrCreate(slug, async () => {
      if (slug === "ai-invention-lab") {
        await page.locator('input[type="file"]').setInputFiles(path.resolve("public/visuals/sample-uploads/student-smart-planter-sketch.png"));
        await page.getByText("student-smart-planter-sketch.png", { exact: true }).waitFor();
      }
      await page.getByRole("button", { name: "다음", exact: true }).click();
      return generate(() => page.getByRole("button", { name: "이미지 만들기 · 1회", exact: true }).click());
    });
    await page.reload(); await page.locator(".workspace-header h1").waitFor();
    await page.getByRole("button", { name: "최근 작품 보기", exact: true }).click();
    await page.locator(".creation-result-step img").waitFor();
    await page.locator(".creation-result-step img").evaluate((img) => img.decode());
    const download = await context.request.get(`${base}${result.imageUrl}?download=1`);
    assert.equal(download.status(), 200);
    assert.match(download.headers()["content-disposition"], /attachment/);
    fs.writeFileSync(path.join(out, `${slug}-generated.png`), await download.body());
    await capture(`${slug}-restored`);
    const outsider = await browser.newContext();
    assert.equal((await outsider.request.get(`${base}${result.imageUrl}`)).status(), 401);
    await outsider.request.post(`${base}/api/verify-code`, { data: { code: process.env.SHOWROOM_ACCESS_CODE || "showroom2026" } });
    assert.equal((await outsider.request.get(`${base}${result.imageUrl}`)).status(), 404);
    await outsider.close();
  }
  await open("ai-invention-lab");
  const savedInvention = await (await context.request.get(`${base}/api/ai/quota?app=ai-invention-lab`)).json();
  let uploadedBytesChecked = false;
  await page.route("**/api/ai/generate", async (route) => {
    const payload = route.request().postDataJSON();
    assert.match(payload.referenceImage, /^data:image\/png;base64,/);
    const bytes = Buffer.from(payload.referenceImage.split(",")[1], "base64");
    assert.deepEqual(bytes, fs.readFileSync("public/visuals/sample-uploads/student-smart-planter-sketch.png"));
    uploadedBytesChecked = true;
    await route.fulfill({ json: { ok: true, ...savedInvention.latest, quota: savedInvention.quota } });
  });
  await page.locator('input[type="file"]').setInputFiles(path.resolve("public/visuals/sample-uploads/student-smart-planter-sketch.png"));
  await page.getByText("student-smart-planter-sketch.png", { exact: true }).waitFor();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await generate(() => page.getByRole("button", { name: "이미지 만들기 · 1회", exact: true }).click());
  assert(uploadedBytesChecked);
  await page.unroute("**/api/ai/generate");
  report.push({ app: "ai-invention-lab", uploadPayloadVerified: true, providerCall: "reused prior successful identical-reference edit" });

  await open("picturebook-scene-maker");
  await page.getByRole("button", { name: "최근 작품 보기", exact: true }).click();
  await page.locator(".creation-result-step img").evaluate((img) => img.decode());
  await page.getByRole("button", { name: /내 작품 보기/ }).click();
  await page.locator(".creation-gallery-card").first().waitFor();
  await capture("picturebook-gallery-restored");
  await page.locator(".creation-gallery-open").first().click();
  await page.getByRole("button", { name: "내용 바꾸기", exact: true }).click();
  await page.getByRole("button", { name: "예시로 되돌리기", exact: true }).click();
  await page.getByRole("button", { name: "최근 작품 보기", exact: true }).click();
  report.push({ app: "picturebook-scene-maker", previousImageAfterReset: true });

  expectedFailure = true;
  const originalQuota = await (await context.request.get(`${base}/api/ai/quota?app=picturebook-scene-maker`)).json();
  await page.route("**/api/ai/generate", (route) => route.fulfill({ status: 503, json: { ok: false, error: "생성을 마치지 못했어요. 잠시 후 다시 시도해 주세요.", quota: originalQuota.quota } }));
  await page.getByRole("button", { name: "표현 바꾸기", exact: true }).click();
  await page.getByRole("button", { name: "이미지 만들기 · 1회", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "생성을 마치지 못했어요" }).waitFor();
  assert.equal(await page.locator(".workspace-quota").innerText(), `이미지 ${originalQuota.quota.remaining}회 남음`);
  await capture("image-error-simulated");
  await page.getByRole("navigation", { name: "작업 단계" }).getByRole("button", { name: "3 완성 작품", exact: true }).click();
  assert.equal(new URL(await page.locator(".creation-result-step img").getAttribute("src"), base).pathname, originalQuota.latest.imageUrl);
  await page.unroute("**/api/ai/generate");
  expectedFailure = false;
  report.push({ app: "picturebook-scene-maker", errorUi: "simulated", previousResultRetained: true, remainingUnchanged: true });

  // Boundary UI is simulated; the server's actual 3/20 boundaries are tested
  // separately without spending twenty provider requests.
  const existing = await (await context.request.get(`${base}/api/ai/quota?app=picturebook-scene-maker`)).json();
  await page.route("**/api/ai/quota?app=picturebook-scene-maker", (route) => route.fulfill({ json: { ...existing, quota: { limit: 3, used: 3, remaining: 0, busy: false } } }));
  await page.reload(); await page.getByText("이미지 0회 남음", { exact: true }).waitFor();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  assert(await page.getByRole("button", { name: "이미지 만들기 · 1회", exact: true }).isDisabled());
  await capture("image-limit-simulated");
  report.push({ app: "picturebook-scene-maker", boundaryUi: "simulated", preservesPreviousResult: Boolean(existing.latest?.imageUrl) });
  fs.writeFileSync(storage, JSON.stringify({ cookies: await context.cookies(), origins: [] }), { mode: 0o600 }); fs.chmodSync(storage, 0o600);
} catch (error) {
  report.push({ ok: false, error: error.message });
  await page.screenshot({ animations: "disabled", path: path.join(out, "failure.png") });
  process.exitCode = 1;
} finally {
  fs.writeFileSync(path.join(out, "ai-report.json"), JSON.stringify({ report, errors }, null, 2));
  fs.writeFileSync(storage, JSON.stringify({ cookies: await context.cookies(), origins: [] }), { mode: 0o600 }); fs.chmodSync(storage, 0o600);
  await browser.close();
}
if (errors.length) process.exitCode = 1;
console.log(JSON.stringify({ report, errors }, null, 2));
