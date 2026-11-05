import { AI_APPS, type AiAppSlug, type Quota } from "../ai-policy";
import { mutateStored, readStored } from "./store";

type SavedResult = Record<string, unknown>;
type Ledger = {
  results: Record<string, SavedResult>;
  latest?: string;
  pending?: { id: string; expires: number };
};
const emptyLedger = (): Ledger => ({ results: {} });
const ledgerKey = (visitor: string, slug: AiAppSlug) => `quotas/${visitor}/${slug}.json`;

export class QuotaError extends Error {
  constructor(public code: "limit_reached" | "generation_busy" | "reservation_expired", public quota: Quota) { super(code); }
}

function summarize(ledger: Ledger, slug: AiAppSlug): Quota {
  const limit = AI_APPS[slug].limit;
  const used = Object.keys(ledger.results).length;
  return { limit, used, remaining: Math.max(0, limit - used), busy: Boolean(ledger.pending && ledger.pending.expires > Date.now()) };
}

export async function getQuota(visitor: string, slug: AiAppSlug) {
  const stored = await readStored(ledgerKey(visitor, slug));
  const ledger = stored ? JSON.parse(stored.bytes.toString()) as Ledger : emptyLedger();
  return { quota: summarize(ledger, slug), latest: ledger.latest ? ledger.results[ledger.latest] : undefined, history: Object.values(ledger.results) };
}

export async function reserveGeneration(visitor: string, slug: AiAppSlug, requestId: string) {
  return mutateStored<Ledger, { quota: Quota; cached?: SavedResult }>(ledgerKey(visitor, slug), emptyLedger, (ledger) => {
    const quota = summarize(ledger, slug);
    if (ledger.results[requestId]) return { next: ledger, result: { quota, cached: ledger.results[requestId] } };
    if (!quota.remaining) throw new QuotaError("limit_reached", quota);
    if (quota.busy) throw new QuotaError("generation_busy", quota);
    return { next: { ...ledger, pending: { id: requestId, expires: Date.now() + 6 * 60_000 } }, result: { quota: { ...quota, busy: true } } };
  });
}

export async function finishGeneration(visitor: string, slug: AiAppSlug, requestId: string, result: SavedResult) {
  return mutateStored<Ledger, Quota>(ledgerKey(visitor, slug), emptyLedger, (ledger) => {
    if (ledger.results[requestId]) return { next: ledger, result: summarize(ledger, slug) };
    if (ledger.pending?.id !== requestId) throw new QuotaError("reservation_expired", summarize(ledger, slug));
    const next = { ...ledger, results: { ...ledger.results, [requestId]: result }, latest: requestId, pending: undefined };
    return { next, result: summarize(next, slug) };
  });
}

export async function releaseGeneration(visitor: string, slug: AiAppSlug, requestId: string) {
  return mutateStored<Ledger, Quota>(ledgerKey(visitor, slug), emptyLedger, (ledger) => {
    const next = ledger.pending?.id === requestId ? { ...ledger, pending: undefined } : ledger;
    return { next, result: summarize(next, slug) };
  });
}
