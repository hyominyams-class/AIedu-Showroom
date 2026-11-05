export class AiProviderError extends Error {
  constructor(public status: number, public code: string, public retryAfter: number, public providerRequestId?: string) {
    super(`AI provider returned ${status}`);
    this.name = "AiProviderError";
  }
}

export async function requireAiResponse(response: Response) {
  if (response.ok) return;
  const body = await response.json().catch(() => null);
  const rawCode = body?.error?.code || body?.error?.type;
  const code = typeof rawCode === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(rawCode) ? rawCode : "unknown";
  const retry = Number(response.headers.get("retry-after"));
  const retryAfter = Number.isFinite(retry) && retry > 0 ? Math.min(300, Math.ceil(retry)) : 30;
  throw new AiProviderError(response.status, code, retryAfter, response.headers.get("x-request-id") || undefined);
}

export function generationFailure(error: unknown) {
  if (error instanceof AiProviderError) {
    if (/content_policy|moderation|safety/.test(error.code)) return {
      status: 400, code: "image_content_rejected", error: "이 내용으로는 이미지를 만들기 어려워요. 문장이나 장면 묘사를 바꿔 주세요. 체험 횟수는 줄어들지 않았어요.",
    };
    if (error.status === 429 && !/quota|billing/.test(error.code)) return {
      status: 429, code: "provider_rate_limited", retryAfter: error.retryAfter,
      error: `이미지 요청이 잠시 몰렸어요. ${error.retryAfter}초 뒤 다시 만들어 주세요. 체험 횟수는 줄어들지 않았어요.`,
    };
    if (/quota|billing/.test(error.code) || [401, 403, 404].includes(error.status)) return {
      status: 503, code: "provider_unavailable", error: "이미지 만들기를 잠시 사용할 수 없어요. 완성한 작품은 내 작품 보기에서 계속 열 수 있어요.",
    };
  }
  if (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name)) return {
    status: 504, code: "generation_timeout", error: "이미지를 만드는 시간이 길어졌어요. 잠시 후 다시 시도해 주세요. 체험 횟수는 줄어들지 않았어요.",
  };
  return { status: 503, code: "generation_failed", error: "생성을 확인하지 못했어요. 이전 결과는 그대로 남아 있어요. 잠시 후 다시 시도해 주세요." };
}
