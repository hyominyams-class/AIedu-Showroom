import { loadEnvConfig } from "@next/env";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { finishGeneration, getQuota, releaseGeneration, reserveGeneration } from "../src/lib/server/quota";

async function main() {
  loadEnvConfig(process.cwd());
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Private Blob storage is required");
  const visitor = randomUUID();
  const slug = "poetry-picture-maker";
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
    await finishGeneration(visitor, slug, id, { title: "Storage verification", source: "test" });
  }
  await assert.rejects(reserveGeneration(visitor, slug, randomUUID()));
  assert.equal((await getQuota(visitor, slug)).quota.used, 3);
  console.log("PASS: private storage, concurrent reservations, failure release, three-success boundary, consistent reread.");
}

main().catch((error) => { console.error("Remote quota verification failed:", error instanceof Error ? error.name : "unknown"); process.exitCode = 1; });
