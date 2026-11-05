import { after, test } from "node:test";
import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { finishGeneration, getQuota, QuotaError, releaseGeneration, reserveGeneration } from "../src/lib/server/quota";
import { issueSession, signSession, verifySession, visitorFromRequest } from "../src/lib/server/session";
import { parseAiRequest } from "../src/lib/server/ai-request";
import { imageReferenceToBlob } from "../src/lib/server/image-reference";
import { POST as generateRoute } from "../src/app/api/ai/generate/route";

const directory = mkdtempSync(join(tmpdir(), "showroom-quota-test-"));
process.env.SHOWROOM_DATA_DIR = directory;
process.env.SHOWROOM_STORE = "local";
process.env.SHOWROOM_SESSION_SECRET = "test-only-signing-secret-32-characters-long";
after(() => rm(directory, { recursive: true, force: true }));

test("image quota permits three successes, replays a request without charging, rejects the fourth", async () => {
  const visitor = randomUUID();
  const slug = "picturebook-scene-maker";
  const ids = Array.from({ length: 3 }, () => randomUUID());
  for (const id of ids) {
    await reserveGeneration(visitor, slug, id);
    await finishGeneration(visitor, slug, id, { source: "live", title: id });
  }
  assert.equal((await getQuota(visitor, slug)).quota.remaining, 0);
  assert.equal((await reserveGeneration(visitor, slug, ids[0])).cached?.title, ids[0]);
  await assert.rejects(reserveGeneration(visitor, slug, randomUUID()), (error: unknown) => error instanceof QuotaError && error.code === "limit_reached");
  assert.equal((await getQuota(visitor, "ai-invention-lab")).quota.remaining, 3);
});

test("text generation allows exactly twenty successes", async () => {
  for (const slug of ["author-meet-chatbot", "concept-explainer", "ai-question-helper"] as const) {
    const visitor = randomUUID();
    for (let i = 0; i < 20; i++) {
      const id = randomUUID();
      await reserveGeneration(visitor, slug, id);
      await finishGeneration(visitor, slug, id, { message: "성공" });
    }
    await assert.rejects(reserveGeneration(visitor, slug, randomUUID()), QuotaError);
    assert.equal((await getQuota(visitor, slug)).quota.used, 20);
  }
});

test("concurrent tabs get one reservation; failures do not consume a use", async () => {
  const visitor = randomUUID();
  const ids = Array.from({ length: 12 }, () => randomUUID());
  const results = await Promise.allSettled(ids.map((id) => reserveGeneration(visitor, "ai-invention-lab", id)));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const successfulId = ids[results.findIndex((r) => r.status === "fulfilled")];
  await releaseGeneration(visitor, "ai-invention-lab", successfulId);
  const afterFailure = await getQuota(visitor, "ai-invention-lab");
  assert.equal(afterFailure.quota.used, 0);
  assert.equal(afterFailure.quota.busy, false);
  await reserveGeneration(visitor, "ai-invention-lab", successfulId);
  await finishGeneration(visitor, "ai-invention-lab", successfulId, { title: "재시도 성공" });
  assert.equal((await getQuota(visitor, "ai-invention-lab")).quota.used, 1);
});

test("quota persists when a fresh server process reads it", async () => {
  const visitor = randomUUID();
  const requestId = randomUUID();
  await reserveGeneration(visitor, "ai-invention-lab", requestId);
  await finishGeneration(visitor, "ai-invention-lab", requestId, { title: "saved" });
  const code = `const { getQuota } = require('./src/lib/server/quota.ts'); getQuota('${visitor}', 'ai-invention-lab').then(x=>console.log(x.quota.used));`;
  const result = await new Promise<string>((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", "-e", code], { cwd: process.cwd(), env: process.env });
    let output = ""; let error = "";
    child.stdout.on("data", (data) => { output += data; });
    child.stderr.on("data", (data) => { error += data; });
    child.on("exit", (status) => status === 0 ? resolve(output.trim()) : reject(new Error(error)));
  });
  assert.equal(result, "1");
});

test("access requires a valid signature; login reuses the signed browser identity", () => {
  const visitor = randomUUID();
  const signed = signSession(visitor, "visitor", 3600);
  assert.equal(verifySession(signed, "visitor"), visitor);
  assert.equal(verifySession(signed, "access"), undefined);
  assert.equal(verifySession(`${signed.slice(0, -2)}xx`, "visitor"), undefined);
  assert.equal(verifySession(signSession(visitor, "access", -1), "access"), undefined);
  assert.equal(visitorFromRequest(new Request("http://localhost/api/ai/generate", { headers: { cookie: "showroom_access=granted" } })), undefined);
  const headers = issueSession(new Request("http://localhost/api/verify-code", { headers: { cookie: `showroom_visitor=${signed}` } }));
  const access = headers.getSetCookie().find((c) => c.startsWith("showroom_access="))!.split(";")[0].split("=")[1];
  assert.equal(verifySession(access, "access"), visitor);
});

test("input rejects unsupported apps, mode switching and remote/path references", () => {
  const valid = { appSlug: "ai-invention-lab", mode: "image", requestId: randomUUID(), values: { topic: "발명" } };
  assert.equal(parseAiRequest(valid).appSlug, valid.appSlug);
  for (const change of [{ appSlug: "__proto__" }, { appSlug: "class-timer-station" }, { mode: "text" }, { referenceImage: "https://example.com/a.png" }, { referenceImage: "/../../local.env" }, { values: { topic: 5 } }]) {
    assert.throws(() => parseAiRequest({ ...valid, ...change }));
  }
});

test("uploaded reference bytes match the verified sample image; paths and executable MIME types are rejected", async () => {
  const example = await imageReferenceToBlob("/visuals/sample-uploads/student-smart-planter-sketch.png");
  assert(example);
  const original = Buffer.from(await example.blob.arrayBuffer());
  const referenceImage = `data:image/png;base64,${original.toString("base64")}`;
  parseAiRequest({ appSlug: "ai-invention-lab", mode: "image", requestId: randomUUID(), values: { topic: "자동 급수 화분" }, referenceImage });
  const uploaded = await imageReferenceToBlob(referenceImage);
  assert(uploaded);
  assert.equal(uploaded.blob.type, "image/png");
  assert.deepEqual(Buffer.from(await uploaded.blob.arrayBuffer()), original);
  assert.equal(await imageReferenceToBlob("/../../local.env"), undefined);
  assert.equal(await imageReferenceToBlob("data:image/svg+xml;base64,PHN2Zy8+"), undefined);
  assert.equal(imageReferenceToBlob("data:image/png;base64,bm90LWEtcmVhbC1pbWFnZQ=="), undefined);
  assert.throws(() => parseAiRequest({ appSlug: "ai-invention-lab", mode: "image", requestId: randomUUID(), values: { topic: "발명" }, referenceImage: "data:image/png;base64,bm90LWEtcmVhbC1pbWFnZQ==" }));
});

test("an empty provider result returns an error and releases its reservation without charging", async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.OPENAI_API_KEY;
  const visitor = randomUUID();
  process.env.OPENAI_API_KEY = "test-key-not-a-real-credential";
  globalThis.fetch = async (input) => {
    assert.equal(input, "https://api.openai.com/v1/responses");
    return Response.json({ output_text: JSON.stringify({ title: "증발", lead: "설명", answerBlocks: [] }) });
  };
  try {
    const response = await generateRoute(new Request("http://localhost/api/ai/generate", {
      method: "POST", headers: { "Content-Type": "application/json", cookie: `showroom_access=${signSession(visitor, "access", 3600)}` },
      body: JSON.stringify({ appSlug: "concept-explainer", mode: "text", requestId: randomUUID(), values: { topic: "증발" } }),
    }));
    assert.equal(response.status, 503);
    const current = await getQuota(visitor, "concept-explainer");
    assert.equal(current.quota.used, 0);
    assert.equal(current.quota.busy, false);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
  }
});

test("a second picturebook image survives a provider rate limit and retries without losing the first artwork", async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.OPENAI_API_KEY;
  const oldModel = process.env.OPENAI_IMAGE_MODEL;
  const visitor = randomUUID();
  process.env.OPENAI_API_KEY = "test-key-not-a-real-credential";
  process.env.OPENAI_IMAGE_MODEL = "gpt-image-2.5-flare";
  const image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jgWQAAAAASUVORK5CYII=";
  let calls = 0;
  globalThis.fetch = async (input, options) => {
    assert.equal(input, "https://api.openai.com/v1/images/generations");
    const payload = JSON.parse(String(options?.body));
    assert.equal(payload.model, "gpt-image-2.5-flare");
    assert.equal(payload.output_format, "png");
    if (++calls === 2) return Response.json({ error: { code: "rate_limit_exceeded" } }, { status: 429, headers: { "Retry-After": "15" } });
    return Response.json({ data: [{ b64_json: image }] });
  };
  const request = (requestId: string, style: string) => generateRoute(new Request("http://localhost/api/ai/generate", {
    method: "POST", headers: { "Content-Type": "application/json", cookie: `showroom_access=${signSession(visitor, "access", 3600)}` },
    body: JSON.stringify({ appSlug: "picturebook-scene-maker", mode: "image", requestId, values: { topic: "빗방울이 반짝였어요.", style } }),
  }));
  try {
    const firstId = randomUUID();
    const secondId = randomUUID();
    assert.equal((await request(firstId, "watercolor")).status, 200);
    const failed = await request(secondId, "colored-pencil");
    assert.equal(failed.status, 429);
    assert.equal(failed.headers.get("Retry-After"), "15");
    assert.equal((await failed.json()).code, "provider_rate_limited");
    const afterFailure = await getQuota(visitor, "picturebook-scene-maker");
    assert.equal(afterFailure.quota.used, 1);
    assert.equal(afterFailure.quota.busy, false);
    assert.equal(afterFailure.latest?.requestId, firstId);
    assert.equal((await request(secondId, "colored-pencil")).status, 200);
    const completed = await getQuota(visitor, "picturebook-scene-maker");
    assert.equal(completed.history.length, 2);
    assert.equal(completed.quota.used, 2);
    assert.equal(completed.quota.remaining, 1);
    assert.notEqual(completed.history[0].imageUrl, completed.history[1].imageUrl);
    assert.equal((await request(secondId, "colored-pencil")).status, 200);
    assert.equal(calls, 3, "Reopening the saved request must not call the provider again");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = oldKey;
    if (oldModel === undefined) delete process.env.OPENAI_IMAGE_MODEL; else process.env.OPENAI_IMAGE_MODEL = oldModel;
  }
});
