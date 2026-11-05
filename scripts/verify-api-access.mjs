import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { request } from "playwright";

const baseURL = process.env.SHOWROOM_URL || "http://127.0.0.1:3120";
const client = await request.newContext({ baseURL });
try {
  const valid = { appSlug: "concept-explainer", requestId: randomUUID(), mode: "text", values: { topic: "증발" } };
  assert.equal((await client.post("/api/ai/generate", { data: valid })).status(), 401);
  assert.equal((await client.post("/api/ai/generate", { data: valid, headers: { cookie: "showroom_access=granted" } })).status(), 401);
  assert.equal((await client.post("/api/verify-code", { data: { code: "incorrect-example" } })).status(), 401);
  assert.equal((await client.post("/api/verify-code", { data: { code: process.env.SHOWROOM_ACCESS_CODE || "showroom2026" } })).status(), 200);
  assert.equal((await client.post("/api/ai/generate", { data: valid, headers: { origin: "https://unrelated.example" } })).status(), 403);
  for (const invalid of [{ ...valid, mode: "image" }, { ...valid, appSlug: "class-timer-station" }, { ...valid, values: [] }, { ...valid, values: { topic: "x".repeat(16001) } }]) {
    assert.equal((await client.post("/api/ai/generate", { data: invalid })).status(), 400);
  }
  const quota = await (await client.get("/api/ai/quota?app=concept-explainer")).json();
  assert.equal(quota.quota.used, 0);
  assert.equal(quota.quota.remaining, 20);
  assert.equal((await client.post("/api/logout")).status(), 200);
  assert.equal((await client.get("/api/ai/quota?app=concept-explainer")).status(), 401);
  console.log("PASS: unauthenticated/forged access, login, origin, unsupported modes/apps, input limits, no deduction on rejected input, logout.");
} finally { await client.dispose(); }
