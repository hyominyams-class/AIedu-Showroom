import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { serverEnv } from "./env";

export class StoreUnavailableError extends Error {}

function blobOptions() {
  if (process.env.SHOWROOM_STORE === "local" && !process.env.VERCEL) return undefined;
  const token = serverEnv("BLOB_READ_WRITE_TOKEN");
  if (token) return { token };
  if (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN) return { storeId: process.env.BLOB_STORE_ID };
  if (process.env.VERCEL) throw new StoreUnavailableError("Persistent storage is not configured");
  return undefined;
}

function filePath(key: string) {
  // Keys are internal identifiers; this guard also prevents accidental traversal.
  if (!/^[a-zA-Z0-9/_-]+\.(json|png)$/.test(key) || key.includes("..")) throw new Error("Invalid storage key");
  return join(serverEnv("SHOWROOM_DATA_DIR") || join(process.cwd(), ".showroom-data"), key);
}

export async function readStored(key: string) {
  const options = blobOptions();
  if (options) {
    const result = await get(key, { ...options, access: "private", useCache: false });
    if (!result) return null;
    if (!result.stream) throw new StoreUnavailableError("Empty storage response");
    return { bytes: Buffer.from(await new Response(result.stream).arrayBuffer()), etag: result.blob.etag };
  }
  try {
    const bytes = await readFile(filePath(key));
    return { bytes, etag: createHash("sha256").update(bytes).digest("hex") };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeImage(key: string, bytes: Buffer) {
  const options = blobOptions();
  if (options) {
    await put(key, bytes, { ...options, access: "private", contentType: "image/png", addRandomSuffix: false, allowOverwrite: true });
    return;
  }
  const path = filePath(key);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes, { mode: 0o600 });
}

/** The callback must be pure: Blob can retry it after a concurrent update. */
export async function mutateStored<T, R>(key: string, initial: () => T, change: (value: T) => { next: T; result: R }): Promise<R> {
  const options = blobOptions();
  if (options) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const current = await readStored(key);
      const state = current ? JSON.parse(current.bytes.toString()) as T : initial();
      const { next, result } = change(state);
      try {
        await put(key, JSON.stringify(next), {
          ...options, access: "private", contentType: "application/json", addRandomSuffix: false,
          allowOverwrite: Boolean(current), ...(current ? { ifMatch: current.etag } : {}),
        });
        return result;
      } catch (error) {
        // Concurrent first creation has no prior ETag. Verify existence instead
        // of depending on a provider's human-readable "already exists" error.
        if (!(error instanceof BlobPreconditionFailedError) && !(!current && await readStored(key))) throw error;
      }
    }
    throw new StoreUnavailableError("Storage conflict; retry later");
  }

  const path = filePath(key);
  const lock = `${path}.lock`;
  await mkdir(dirname(path), { recursive: true });
  let acquired = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { await mkdir(lock); acquired = true; break; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      try {
        if (Date.now() - (await stat(lock)).mtimeMs > 60_000) await rm(lock, { recursive: true, force: true });
      } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  if (!acquired) throw new StoreUnavailableError("Storage lock timeout");
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const current = await readStored(key);
    const { next, result } = change(current ? JSON.parse(current.bytes.toString()) as T : initial());
    await writeFile(temporary, JSON.stringify(next), { mode: 0o600 });
    await rename(temporary, path);
    return result;
  } finally {
    await rm(temporary, { force: true });
    await rm(lock, { recursive: true, force: true });
  }
}
