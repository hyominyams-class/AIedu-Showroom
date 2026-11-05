import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { finishGeneration, getQuota, releaseGeneration, reserveGeneration } from "../src/lib/server/quota";

async function main() {
  loadEnvConfig(process.cwd());
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Private Blob storage is required");
  const visitor = randomUUID();
  const slug = "picturebook-scene-maker";
  const first = randomUUID();
  const requests = [first, randomUUID(), randomUUID(), randomUUID()];
  const concurrent = await Promise.allSettled(requests.map((id) => reserveGeneration(visitor, slug, id)));
  assert.equal(concurrent.filter((r) => r.status === "fulfilled").length, 1);
  const winner = requests[concurrent.findIndex((r) => r.status === "fulfilled")];
  await releaseGeneration(visitor, slug, winner);
  assert.equal((await getQuota(visitor, slug)).quota.remaining, 3);
  for (let i = 0; i < 3; i++) {
    const id = randomUUID();
    await reserveGeneration(visitor, slug, id);
    await finishGeneration(visitor, slug, id, {
      title: "그림책 장면 저장 검사", source: "test",
      // A real image result exceeds the CDN's compression threshold. Small
      // ASCII fixtures miss the weak-ETag failure on the next reservation.
      inputValues: { topic: "비가 그친 뒤 우리 학교 운동장에서 새 이야기가 시작됐어요. ".repeat(60) },
    });
  }
  await assert.rejects(reserveGeneration(visitor, slug, randomUUID()));
  assert.equal((await getQuota(visitor, slug)).quota.used, 3);
  console.log("PASS: private storage, concurrent reservations, failure release, large Korean ledgers, three-success boundary, consistent reread.");
}

main().catch((error) => { console.error("Remote quota verification failed:", error instanceof Error ? error.name : "unknown"); process.exitCode = 1; });
