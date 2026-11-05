"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { aiPolicy, type Quota } from "@/lib/ai-policy";

export type AiResult = Record<string, unknown> & { source: "live"; requestId: string; imageUrl?: string; message?: string; question?: string; inputValues?: Record<string, string> };
type GenerateInput = { values: Record<string, string>; referenceImage?: string; messages?: { role: "user" | "assistant"; content: string }[] };

export function savedInput<T extends Record<string, string>>(result: AiResult, defaults: T): T {
  return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, typeof result.inputValues?.[key] === "string" ? result.inputValues[key] : fallback])) as T;
}

export function useAiGeneration(slug: string) {
  const [quota, setQuota] = useState<Quota | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [latest, setLatest] = useState<AiResult | null>(null);
  const [history, setHistory] = useState<AiResult[]>([]);
  const active = useRef(false);
  const mounted = useRef(true);
  const attempt = useRef<{ signature: string; id: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/ai/quota?app=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const data = await response.json();
      if (!mounted.current) return;
      if (!response.ok) { setError(data.error || "남은 횟수를 확인하지 못했어요."); return; }
      setQuota(data.quota);
      if (data.latest?.source === "live") setLatest(data.latest);
      if (Array.isArray(data.history)) setHistory(data.history.filter((item: AiResult) => item?.source === "live"));
    } catch {
      if (mounted.current) setError("인터넷 연결을 확인한 뒤 다시 시도해 주세요.");
    }
  }, [slug]);

  useEffect(() => {
    mounted.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetch current usage from the server on mount.
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { mounted.current = false; window.removeEventListener("focus", onFocus); };
  }, [refresh]);

  useEffect(() => {
    if (!quota?.busy || pending) return;
    const id = window.setInterval(() => { void refresh(); }, 4000);
    return () => window.clearInterval(id);
  }, [quota?.busy, pending, refresh]);

  const generate = useCallback(async (input: GenerateInput): Promise<AiResult | undefined> => {
    if (active.current) return;
    const policy = aiPolicy(slug);
    if (!policy) return;
    if (quota && quota.remaining === 0) { setError("무료 체험을 모두 사용했어요. 만든 결과는 계속 볼 수 있어요."); return; }
    active.current = true;
    setPending(true);
    setError("");
    const signature = JSON.stringify(input);
    if (attempt.current?.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() };
    const requestId = attempt.current.id;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 200_000);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ ...input, messages: input.messages?.slice(-8), appSlug: slug, mode: policy.mode, requestId }),
      });
      const data = await response.json();
      if (mounted.current && data.quota) setQuota(data.quota);
      if (!response.ok || !data.ok || data.source !== "live") throw new Error(data.error || "생성을 마치지 못했어요. 다시 시도해 주세요.");
      if (mounted.current) {
        setLatest(data);
        setHistory((current) => [...current.filter((item) => item.requestId !== data.requestId), data]);
      }
      attempt.current = null;
      return data;
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error && failure.name !== "AbortError" ? failure.message : "응답이 늦어지고 있어요. 잠시 후 다시 확인해 주세요.");
      // Reuse this request id when retrying the same input: the server replays a
      // completed result instead of making a second paid call.
      void refresh();
    } finally {
      window.clearTimeout(timer);
      active.current = false;
      if (mounted.current) setPending(false);
    }
  }, [quota, refresh, slug]);

  return { quota, pending, error, latest, history, generate, refresh, clearError: () => setError(""), unavailable: pending || Boolean(quota?.busy) || quota?.remaining === 0 || !quota };
}
