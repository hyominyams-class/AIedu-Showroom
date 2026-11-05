import { aiPolicy, type AiAppSlug } from "../ai-policy";
import { imageReferenceToBlob } from "./image-reference";

export type AiRequest = {
  appSlug: AiAppSlug;
  requestId: string;
  mode: "text" | "image" | "chat";
  values: Record<string, string>;
  referenceImage?: string;
  messages: { role: "user" | "assistant"; content: string }[];
};

export function parseAiRequest(input: unknown): AiRequest {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("입력 내용을 확인해 주세요.");
  const raw = input as Record<string, unknown>;
  const policy = typeof raw.appSlug === "string" ? aiPolicy(raw.appSlug) : undefined;
  if (!policy || raw.mode !== policy.mode) throw new Error("이 앱에서 사용할 수 없는 생성 방식이에요.");
  if (typeof raw.requestId !== "string" || !/^[a-f0-9-]{36}$/.test(raw.requestId)) throw new Error("화면을 새로고침한 뒤 다시 시도해 주세요.");
  if (!raw.values || typeof raw.values !== "object" || Array.isArray(raw.values)) throw new Error("입력 내용을 확인해 주세요.");
  const entries = Object.entries(raw.values);
  if (entries.length > 24 || entries.some(([key, value]) => key.length > 40 || typeof value !== "string" || value.length > 16000)) throw new Error("입력 내용을 조금 줄여 주세요.");
  const values = Object.fromEntries(entries) as Record<string, string>;
  if (Object.values(values).join("").length > 30000) throw new Error("입력 내용을 조금 줄여 주세요.");
  const messages = raw.messages ?? [];
  if (!Array.isArray(messages) || messages.length > 8 || messages.some((m) => !m || typeof m !== "object" || !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || m.content.length > 4000)) throw new Error("대화 내용이 너무 길어요. 질문을 줄여 주세요.");
  if (policy.mode === "chat" && (!messages.length || messages.at(-1)?.role !== "user" || !messages.at(-1)?.content.trim())) throw new Error("질문을 입력해 주세요.");
  if (policy.mode !== "chat" && !(values.topic || values.title || "").trim()) throw new Error("주제를 입력해 주세요.");
  if (raw.appSlug === "poetry-picture-maker" && !values.poem?.trim()) throw new Error("시를 입력해 주세요.");
  if (raw.referenceImage !== undefined) {
    if (raw.appSlug !== "ai-invention-lab" || typeof raw.referenceImage !== "string" || raw.referenceImage.length > 4_100_000 || !(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(raw.referenceImage) || raw.referenceImage === "/visuals/sample-uploads/student-smart-planter-sketch.png")) throw new Error("스케치는 3MB 이하의 PNG·JPG·WebP 이미지로 선택해 주세요.");
    if (!imageReferenceToBlob(raw.referenceImage)) throw new Error("이미지를 읽을 수 없어요. PNG·JPG·WebP 파일을 다시 선택해 주세요.");
  }
  return { appSlug: raw.appSlug as AiAppSlug, requestId: raw.requestId, mode: raw.mode as AiRequest["mode"], values, referenceImage: raw.referenceImage as string | undefined, messages };
}
