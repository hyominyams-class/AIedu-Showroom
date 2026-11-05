export const AI_APPS = {
  "author-meet-chatbot": { mode: "chat", limit: 20 },
  "concept-explainer": { mode: "text", limit: 20 },
  "ai-question-helper": { mode: "text", limit: 20 },
  "poetry-picture-maker": { mode: "image", limit: 3 },
  "picturebook-scene-maker": { mode: "image", limit: 3 },
  "ai-invention-lab": { mode: "image", limit: 3 },
} as const;

export type AiAppSlug = keyof typeof AI_APPS;
export type Quota = { limit: number; used: number; remaining: number; busy: boolean };
export function aiPolicy(slug: string) {
  return Object.hasOwn(AI_APPS, slug) ? AI_APPS[slug as AiAppSlug] : undefined;
}
