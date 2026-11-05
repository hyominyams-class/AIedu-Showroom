import { imageReferenceToBlob } from "@/lib/server/image-reference";
import { getAppBySlug } from "@/data/apps";
import { getMvpSpec } from "@/data/mvp";
import { buildLocalOutput } from "@/components/mvp/MvpStorage";
import { parseAiRequest, type AiRequest } from "@/lib/server/ai-request";
import { serverEnv } from "@/lib/server/env";
import { finishGeneration, getQuota, QuotaError, releaseGeneration, reserveGeneration } from "@/lib/server/quota";
import { sameOrigin, visitorFromRequest } from "@/lib/server/session";
import { writeImage } from "@/lib/server/store";
import { AiProviderError, generationFailure, requireAiResponse } from "@/lib/server/ai-provider";
import { PICTUREBOOK_STYLES } from "@/data/image-styles";

export const maxDuration = 180;

const AI_TIMEOUT_MS = {
  authorChat: 60_000,
  text: 60_000,
  concept: 90_000,
  questionHelper: 120_000,
  image: 150_000,
  longImage: 180_000,
  imageEdit: 150_000,
} as const;

export async function POST(request: Request) {
  const visitor = visitorFromRequest(request);
  if (!visitor) return Response.json({ ok: false, error: "입장 시간이 끝났어요. 다시 입장해 주세요.", code: "unauthorized" }, { status: 401 });
  if (!sameOrigin(request)) return Response.json({ ok: false, error: "이 화면에서 다시 시도해 주세요." }, { status: 403 });
  let body: AiRequest;
  try {
    if (Number(request.headers.get("content-length")) > 4_400_000) throw new Error("파일이 너무 커요.");
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 4_400_000) throw new Error("파일이 너무 커요.");
    body = parseAiRequest(JSON.parse(raw));
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof SyntaxError ? "입력 내용을 확인해 주세요." : error instanceof Error ? error.message : "입력 내용을 확인해 주세요." }, { status: 400 });
  }
  const app = getAppBySlug(body.appSlug);
  const spec = app && getMvpSpec(app);
  if (!app || app.externalUrl || !spec) return Response.json({ ok: false, error: "앱을 찾을 수 없어요." }, { status: 404 });
  const apiKey = serverEnv("OPENAI_API_KEY");
  if (!apiKey) return Response.json({ ok: false, error: "AI 생성 준비 중이에요. 잠시 후 다시 시도해 주세요." }, { status: 503 });
  let reserved = false;
  try {
    const reservation = await reserveGeneration(visitor, body.appSlug, body.requestId);
    if (reservation.cached) return Response.json({ ok: true, ...reservation.cached, quota: reservation.quota });
    reserved = true;
    let result: Record<string, unknown>;
    if (body.mode === "chat") {
      const message = await generateAuthorChat(apiKey, body.values, body.messages);
      if (!message) throw new Error("Empty generation");
      result = { message, question: body.messages.at(-1)?.content, source: "live", updatedAt: new Date().toISOString() };
    } else if (body.mode === "image") {
      const image = await generateImage(apiKey, app.slug, app.title, spec.principle, body.values, body.referenceImage);
      if (!image?.startsWith("data:image/png;base64,")) throw new Error("Empty image generation");
      await writeImage(`images/${visitor}/${body.requestId}.png`, Buffer.from(image.split(",")[1], "base64"));
      result = { ...buildLocalOutput(app, spec, body.values), title: body.values.topic, imageUrl: `/api/ai/images/${body.requestId}`, source: "live", style: body.values.style || "poster", updatedAt: new Date().toISOString() };
    } else {
      const text = await generateText(apiKey, app.slug, app.title, spec.principle, body.values);
      if (!text || typeof text !== "object") throw new Error("Empty generation");
      result = { ...text, source: "live", updatedAt: new Date().toISOString() };
    }
    result.requestId = body.requestId;
    if (body.mode !== "chat") result.inputValues = body.values;
    const quota = await finishGeneration(visitor, body.appSlug, body.requestId, result);
    return Response.json({ ok: true, ...result, quota }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof QuotaError) {
      const exhausted = error.code === "limit_reached";
      return Response.json({ ok: false, code: error.code, quota: error.quota, error: exhausted ? "이 앱의 무료 체험을 모두 사용했어요. 만든 결과는 계속 볼 수 있어요." : "이미 생성 중이에요. 현재 결과가 나올 때까지 기다려 주세요." }, { status: exhausted ? 429 : 409 });
    }
    if (reserved) {
      try { await releaseGeneration(visitor, body.appSlug, body.requestId); } catch { /* The reservation expires if storage is temporarily unavailable. */ }
    }
    // Never log prompts, API keys or upstream response bodies.
    console.error("[ai/generate] request failed", {
      app: body.appSlug, requestId: body.requestId, kind: error instanceof Error ? error.name : "unknown",
      ...(error instanceof AiProviderError ? { providerStatus: error.status, providerCode: error.code, providerRequestId: error.providerRequestId } : {}),
    });
    const current = await getQuota(visitor, body.appSlug).catch(() => undefined);
    if (current?.latest?.requestId === body.requestId) return Response.json({ ok: true, ...current.latest, quota: current.quota });
    const { status, ...failure } = generationFailure(error);
    return Response.json({ ok: false, ...failure, quota: current?.quota }, { status, headers: { "Cache-Control": "no-store", ...("retryAfter" in failure ? { "Retry-After": String(failure.retryAfter) } : {}) } });
  }
}

async function generateAuthorChat(
  apiKey: string,
  values: Record<string, string>,
  messages: { role: "user" | "assistant"; content: string }[],
) {
  const trimmedMessages = messages.slice(-8).map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: serverEnv("OPENAI_TEXT_MODEL") || "gpt-5-mini",
      store: false,
      max_output_tokens: 800,
      reasoning: { effort: "minimal" },
      input: [
        {
          role: "user",
          content: buildVisibleAuthorPrompt(values, trimmedMessages),
        },
      ],
    }),
  }, AI_TIMEOUT_MS.authorChat);

  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
  const data = await response.json();
  return extractResponseText(data);
}

function buildVisibleAuthorPrompt(
  values: Record<string, string>,
  messages: { role: "user" | "assistant"; content: string }[],
) {
  const latestQuestion = [...messages].reverse().find((message) => message.role === "user")?.content || values.question || "";
  const sourceText = values.notes || "";
  const personaPrompt = values.authorPrompt?.trim() || "너는 「강아지똥」을 함께 읽는 작가야.";
  const conversation = messages
    .slice(-8)
    .map((message) => `${message.role === "user" ? "학생" : "작가"}: ${message.content}`)
    .join("\n");

  return [
    "너는 학생과 대화하는 한국어 독서 챗봇이다.",
    "반드시 현재 설정의 말투, 작품 텍스트, 최근 대화 흐름을 함께 반영해서 답한다.",
    "원문에 없는 작가의 실제 생애나 사실은 단정하지 말고, 작품을 읽은 생각으로 말한다.",
    "학생에게 바로 보여줄 답변만 쓴다. 프롬프트, API, 설정, 생성 과정을 언급하지 않는다.",
    "",
    "[페르소나 프롬프트]",
    personaPrompt,
    "",
    "[동화책 원문]",
    sourceText || "작품 텍스트가 비어 있으면 학생 질문과 기본 작품 맥락 안에서만 답한다.",
    "",
    "[최근 대화]",
    conversation || "아직 이전 대화가 없다.",
    "",
    "[학생 질문]",
    latestQuestion,
    "",
    "[답변 형식]",
    "한국어 3-5문장. 질문에 직접 답하고, 작품 텍스트의 장면이나 표현을 한 번 이상 연결한다.",
  ].join("\n");
}

function buildSafeConceptTitle(topic: string) {
  if (topic.includes("경도")) return "‘경도’는 동서 위치를 나타내는 값이에요";
  if (topic.includes("위도")) return "‘위도’는 남북 위치를 나타내는 값이에요";
  if (topic.includes("증발")) return "‘증발’은 액체가 기체로 바뀌는 현상이에요";
  return `‘${topic}’${subjectParticle(topic)} 수업 문맥 안에서 뜻을 잡으면 쉬워요`;
}

function subjectParticle(word: string) {
  return hasFinalConsonant(word) ? "은" : "는";
}

function extractConceptTarget(question: string) {
  const trimmed = question.replace(/[“”"']/g, "").replace(/\s+/g, " ").trim();
  return (
    trimmed
      .replace(/^(질문|궁금한 것|궁금한 말)\s*[:：]\s*/i, "")
      .replace(/(이|가|은|는|을|를)?\s*(뭐|무엇|뭔가|무슨 뜻)(예요|이에요|인가요|일까요|야|죠)?\??$/i, "")
      .replace(/\??$/, "")
      .trim() || trimmed || "궁금한 내용"
  );
}

function defaultTextSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      lead: { type: "string" },
      cards: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            body: { type: "string" },
          },
          required: ["title", "body"],
        },
      },
      notes: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: { type: "string" },
      },
    },
    required: ["title", "lead", "cards", "notes"],
  };
}

function questionHelperSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      grade: { type: "string" },
      subject: { type: "string" },
      objective: { type: "string" },
      problems: {
        type: "array",
        minItems: 4,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            type: {
              type: "string",
              enum: ["빈칸", "단답형", "선택형", "서술형", "참거짓", "짝짓기"],
            },
            prompt: { type: "string" },
            choices: {
              type: "array",
              maxItems: 5,
              items: { type: "string" },
            },
            pairs: {
              type: "array",
              maxItems: 5,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  left: { type: "string" },
                  right: { type: "string" },
                },
                required: ["left", "right"],
              },
            },
            answer: { type: "string" },
            explanation: { type: "string" },
            points: { type: "integer" },
          },
          required: ["type", "prompt", "choices", "pairs", "answer", "explanation", "points"],
        },
      },
      notes: {
        type: "array",
        minItems: 2,
        maxItems: 5,
        items: { type: "string" },
      },
    },
    required: ["title", "grade", "subject", "objective", "problems", "notes"],
  };
}

function conceptAnswerSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      answerMeta: {
        type: "object",
        additionalProperties: false,
        properties: {
          term: { type: "string" },
          sourceSentence: { type: "string" },
          lessonContext: { type: "string" },
          studentIntent: { type: "string" },
        },
        required: ["term", "sourceSentence", "lessonContext", "studentIntent"],
      },
      title: { type: "string" },
      lead: { type: "string" },
      emoji: { type: "string" },
      answerBlocks: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            type: {
              type: "string",
              enum: ["paragraph", "example", "table", "steps", "check", "question", "chart", "diagram"],
            },
            title: { type: "string" },
            body: { type: "string" },
            rows: {
              type: "array",
              maxItems: 5,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  label: { type: "string" },
                  value: { type: "string" },
                },
                required: ["label", "value"],
              },
            },
            items: {
              type: "array",
              maxItems: 6,
              items: { type: "string" },
            },
            chartType: {
              type: "string",
              enum: ["", "bar", "line"],
            },
            data: {
              type: "array",
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  label: { type: "string" },
                  value: { type: "number" },
                },
                required: ["label", "value"],
              },
            },
            unit: { type: "string" },
            diagramType: {
              type: "string",
              enum: ["", "flow", "cycle", "compare", "grid"],
            },
            nodes: {
              type: "array",
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  label: { type: "string" },
                  description: { type: "string" },
                  role: {
                    type: "string",
                    enum: ["", "input", "process", "output"],
                  },
                },
                required: ["label", "description", "role"],
              },
            },
            links: {
              type: "array",
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  from: { type: "string" },
                  to: { type: "string" },
                  label: { type: "string" },
                },
                required: ["from", "to", "label"],
              },
            },
          },
          required: ["type", "title", "body", "rows", "items", "chartType", "data", "unit", "diagramType", "nodes", "links"],
        },
      },
      notes: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: { type: "string" },
      },
    },
    required: ["answerMeta", "title", "lead", "emoji", "answerBlocks", "notes"],
  };
}

async function generateText(
  apiKey: string,
  appSlug: string,
  appTitle: string,
  principle: string,
  values: Record<string, string>,
) {
  const isConceptExplainer = appSlug === "concept-explainer";
  const isQuestionHelper = appSlug === "ai-question-helper";
  const outputSchema = isConceptExplainer ? conceptAnswerSchema() : isQuestionHelper ? questionHelperSchema() : defaultTextSchema();
  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: serverEnv("OPENAI_TEXT_MODEL") || "gpt-5-mini",
      store: false,
      max_output_tokens: 6000,
      ...(isQuestionHelper || isConceptExplainer ? { reasoning: { effort: "low" } } : {}),
      input: [
        {
          role: "system",
          content: isConceptExplainer
            ? [
                "You are a Korean concept explanation engine for students who are studying without a teacher beside them.",
                "Return only compact JSON with answerMeta, title, lead, emoji, answerBlocks, notes.",
                "The student enters a topic or sentence, where they saw it, lesson context, grade level, and either a concise or detailed explanation preference.",
                "Answer the student's question directly and completely enough for self-study. Do not repeat the question as the title.",
                "STRICTLY match every word to the grade level. 초등 저학년/초등 고학년: everyday Korean words only — never use ATP, NADPH, 광계, 캘빈 회로, ion names, or chemical formulas like H2O, CO2, C6H12O6; write 물, 이산화탄소, 포도당 instead, and skip sub-steps that belong to secondary school. 중학생: basic formulas like H2O and CO2 are fine, but no university-level terms. 고등학생: full curriculum terms are fine.",
                "emoji is exactly one emoji character that instantly evokes the concept (증발 → 💧, 광합성 → 🌿, 경도 → 🧭). No letters or words.",
                "The title must not attach Korean particles directly to an unquoted term. Use a safe title like '‘경도’는 동서 위치를 나타내는 값이에요' or a complete explanation sentence.",
                "Never write malformed particles such as '경도은', '위도은', or '증발는'.",
                "The lead must begin with the explanation itself, not with phrases like '이 질문은', '학생 질문에 맞춰', or '쉽게 설명하면'. Keep the lead to 1-2 sentences; details belong in answerBlocks, not the lead.",
                "Use answerBlocks flexibly. Choose paragraph, example, table, chart, diagram, check, or question blocks only when they help the student understand.",
                "For comparisons, parts, categories, or clear relationships, use a table block with specific labels. Do not use generic row labels like '무엇을 보나요?', '수업 예시', or '헷갈리는 점'.",
                "For numeric change, order-by-amount, frequency, score, ratio, or simple measured values, use a chart block with chartType bar or line.",
                "For longitude or latitude, use a diagram block with diagramType grid and explain equator, prime meridian, north-south, and east-west correctly.",
                "For processes, cause-effect, structure, or transformations, use a diagram block with diagramType flow. The renderer lays nodes out from links, so links must describe the true structure: several input nodes may all point to one process node, and one process node may point to several output nodes. Never chain independent inputs one after another.",
                "Give every diagram node a role: input for what goes in or starts, process for what transforms or happens, output for what comes out or results. Use an empty role only when none fits.",
                "Use diagramType cycle only when the last stage truly returns to the first (물의 순환, 계절). A one-way process is flow, not cycle. Use compare for exactly two contrasted things, and give each node a description.",
                "Never output raw SVG, HTML, CSS, JavaScript, or image data. For diagrams, output only nodes and links.",
                "Do not invent numeric values just to create a chart. Use chart only when the student's question or explanation naturally contains safe simple numbers.",
                "A check block is a self-quiz: 2-4 short questions the student answers by themselves. Put the answers to those questions in notes, not in the check items.",
                "You may end with one question block whose items are 2-3 short follow-up questions the student would naturally ask next (each under 25 characters, ending with '?'). Leave its body empty.",
                "notes are shown to the student as 공부 팁: study tips plus the answers to the check questions. Never leave notes as empty strings.",
                "For detailed answers, improve precision, examples, misconceptions, and visual structure; do not add irrelevant tables or diagrams.",
                "Do not force every answer into the same template. Use 3 to 5 blocks based on the student's input.",
                "Explain in Korean at the student's grade level with clear meaning, class-context examples, common confusion, and a self-check when useful.",
                "Keep Korean user-facing copy direct, warm, and easy to read. Do not sound like teacher-facing lesson planning.",
                "Do not mention prompts, APIs, implementation, or that the answer was generated.",
              ].join(" ")
            : isQuestionHelper
              ? [
                  "You are a Korean classroom worksheet (학습지) author. You design a real, printable student worksheet, not a list of discussion questions.",
                  "Return only compact JSON with title, grade, subject, objective, problems, notes.",
                  "title is the worksheet title, grade is the target grade, subject is the school subject area (예: 과학, 사회, 국어), objective is one '학습 목표' sentence ending with '~할 수 있다.'.",
                  "problems is an ordered list of 5 or 6 graded items. Each problem has type, prompt, choices, pairs, answer, explanation, points.",
                  "type is one of 빈칸, 단답형, 선택형, 서술형, 참거짓, 짝짓기. Use a varied mix that fits the worksheet type, and prefer at least one 선택형 with real options when the topic allows it.",
                  "prompt is the exact student-facing instruction, written like a test question ending in '쓰시오/고르시오/설명하시오'. For 빈칸, write the sentence with a blank shown as a run of underscores (____).",
                  "choices: for 선택형 give 3 to 4 plausible Korean options where exactly one is correct; otherwise an empty array. pairs: for 짝짓기 give 3 to 4 {left,right} matches; otherwise an empty array.",
                  "answer must be the real correct answer for factual problems (for 선택형 copy the exact correct option text). For open-ended 서술형/단답형 give a concise '예시 답안'. explanation is a short 해설 or 채점 기준. points are positive integers that sum to about 100 across all problems.",
                  "Make every problem factually correct and appropriate for the given grade. Attach Korean particles correctly (을/를, 은/는, 과/와). Never write malformed particles.",
                  "For '개념 확인' focus on definitions, vocabulary, and examples. For '탐구 활동' focus on observation, evidence, prediction, cause-effect, and application. For '토론 활동' focus on stance, reasons, counter-arguments, and class agreement. For '형성평가' mix short answer, multiple choice, application, and a reflection item.",
                  "Keep Korean copy direct and natural. Do not mention prompts, APIs, implementation, or that the answer was generated.",
                ].join(" ")
            : "Korean education app assistant. Return only compact JSON with title, lead, cards, notes. User-facing copy must be product language, not implementation notes.",
        },
        {
          role: "user",
          content: JSON.stringify({
            appTitle,
            principle,
            values,
            instruction: isConceptExplainer
              ? "학생이 혼자 읽고 이해할 수 있는 답변을 만든다. 입력된 개념, 원문, 수업 맥락을 구분해서 answerMeta에 담고 설명문, 표, 예시, 차트, 도식, 확인, 다음 질문 중 필요한 블록만 골라 answerBlocks에 담는다. 학년 눈높이보다 어려운 용어는 절대 쓰지 않는다. 개념을 나타내는 이모지 1개를 emoji에 담고, 도식 노드에는 role(input/process/output)을 표시한다. 확인 문제의 답과 공부 팁은 notes에 담는다. raw SVG 문자열은 만들지 않는다."
              : isQuestionHelper
                ? "교사가 바로 인쇄해 나눠줄 학습지를 만든다. title, grade, subject, objective를 채우고, problems에 5~6개의 채점 가능한 문항을 담는다. 각 문항은 type(빈칸·단답형·선택형·서술형·참거짓·짝짓기), prompt(학생이 푸는 문제), 필요 시 choices나 pairs, answer(정답 또는 예시 답안), explanation(해설·채점 기준), points(정수, 합계 약 100)를 갖는다. 빈칸 문항은 prompt 안에 ____ 로 빈칸을 표시한다. 조사(을/를, 은/는, 과/와)를 정확히 쓴다."
              : undefined,
            schema: {
              ...(isConceptExplainer
                ? {
                    answerMeta: {
                      term: "string",
                      sourceSentence: "string",
                      lessonContext: "string",
                      studentIntent: "string",
                    },
                  }
                : {}),
              title: "string",
              lead: "string",
              ...(isConceptExplainer
                ? {
                    emoji: "string, exactly one emoji",
                    answerBlocks: [
                      {
                        type: "paragraph | example | table | steps | check | question | chart | diagram",
                        title: "string",
                        body: "string, empty when unused",
                        rows: [{ label: "string", value: "string" }],
                        items: ["string"],
                        chartType: "bar | line, empty when unused",
                        data: [{ label: "string", value: "number" }],
                        unit: "string, empty when unused",
                        diagramType: "flow | cycle | compare | grid, empty when unused",
                        nodes: [{ label: "string", description: "string", role: "input | process | output, empty when unsure" }],
                        links: [{ from: "string", to: "string", label: "string" }],
                      },
                    ],
                  }
                : isQuestionHelper
                  ? {
                      grade: "string",
                      subject: "string",
                      objective: "string",
                      problems: [
                        {
                          type: "빈칸 | 단답형 | 선택형 | 서술형 | 참거짓 | 짝짓기",
                          prompt: "string",
                          choices: ["string, empty unless 선택형"],
                          pairs: [{ left: "string", right: "string, empty unless 짝짓기" }],
                          answer: "string",
                          explanation: "string",
                          points: "integer",
                        },
                      ],
                    }
                  : { cards: [{ title: "string", body: "string" }] }),
              notes: ["string"],
            },
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "showroom_mvp_result",
          schema: outputSchema,
        },
      },
    }),
  }, getTextTimeoutMs(appSlug));

  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
  const data = await response.json();
  const text = extractResponseText(data);
  if (!text) return undefined;
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || typeof parsed.title !== "string" || !parsed.title.trim()) throw new Error("Invalid structured result");
  if (isConceptExplainer && (typeof parsed.lead !== "string" || !parsed.lead.trim() || !Array.isArray(parsed.answerBlocks) || !parsed.answerBlocks.length)) throw new Error("Empty concept result");
  if (isQuestionHelper && (!Array.isArray(parsed.problems) || !parsed.problems.length || parsed.problems.some((problem: { prompt?: unknown; answer?: unknown }) => typeof problem?.prompt !== "string" || !problem.prompt.trim() || typeof problem.answer !== "string" || !problem.answer.trim()))) throw new Error("Empty worksheet result");
  return isConceptExplainer ? sanitizeConceptResult(parsed, values) : parsed;
}

function getTextTimeoutMs(appSlug: string) {
  if (appSlug === "ai-question-helper") return AI_TIMEOUT_MS.questionHelper;
  if (appSlug === "concept-explainer") return AI_TIMEOUT_MS.concept;
  return AI_TIMEOUT_MS.text;
}

function extractResponseText(data: unknown) {
  if (!data || typeof data !== "object") return undefined;
  const response = data as {
    output_text?: unknown;
    output?: {
      content?: {
        text?: unknown;
        type?: unknown;
      }[];
    }[];
  };

  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string" && content.text.trim()) {
        return content.text;
      }
    }
  }

  return undefined;
}

function sanitizeConceptResult(result: unknown, values: Record<string, string>) {
  if (!result || typeof result !== "object") return result;
  const output = result as Record<string, unknown>;
  const term = extractConceptTarget(
    (typeof values.topic === "string" && values.topic) ||
    (typeof output.answerMeta === "object" && output.answerMeta && "term" in output.answerMeta ? String((output.answerMeta as Record<string, unknown>).term || "") : "") ||
    "궁금한 내용",
  );
  const currentMeta = typeof output.answerMeta === "object" && output.answerMeta ? output.answerMeta as Record<string, unknown> : {};
  output.answerMeta = {
    term: typeof currentMeta.term === "string" && currentMeta.term.trim() ? currentMeta.term.trim() : term,
    sourceSentence: typeof currentMeta.sourceSentence === "string" ? currentMeta.sourceSentence.trim() : values.sourceSentence || "",
    lessonContext: typeof currentMeta.lessonContext === "string" ? currentMeta.lessonContext.trim() : values.notes || "",
    studentIntent: typeof currentMeta.studentIntent === "string" ? currentMeta.studentIntent.trim() : values.length || "",
  };

  if (term === "경도" || term === "위도" || term === "증발") {
    output.title = buildSafeConceptTitle(term);
  } else if (typeof output.title === "string") {
    output.title = fixConceptTitle(output.title, term);
  } else {
    output.title = buildSafeConceptTitle(term);
  }

  const emoji = typeof output.emoji === "string" ? output.emoji.trim() : "";
  if (!emoji || emoji.length > 8 || /[A-Za-z0-9가-힣]/.test(emoji)) {
    delete output.emoji;
  } else {
    output.emoji = emoji;
  }

  return output;
}

function fixConceptTitle(title: string, term: string) {
  const cleanTitle = title.trim();
  const badForms = [
    [`${term}은`, `‘${term}’은`],
    [`${term}는`, `‘${term}’는`],
    [`${term}이`, `‘${term}’이`],
    [`${term}가`, `‘${term}’가`],
  ] as const;
  const matched = badForms.find(([bad]) => cleanTitle.startsWith(bad));
  if (matched) return cleanTitle.replace(matched[0], matched[1]);

  return cleanTitle
    .replace(/([가-힣]+)은/g, (match, word: string) => `${word}${hasFinalConsonant(word) ? "은" : "는"}`)
    .replace(/([가-힣]+)는/g, (match, word: string) => `${word}${hasFinalConsonant(word) ? "은" : "는"}`);
}

function hasFinalConsonant(word: string) {
  const char = word.charCodeAt(word.length - 1);
  if (char < 0xac00 || char > 0xd7a3) return false;
  return (char - 0xac00) % 28 !== 0;
}

async function generateImage(
  apiKey: string,
  appSlug: string,
  appTitle: string,
  principle: string,
  values: Record<string, string>,
  referenceImage?: string,
) {
  const prompt = buildImagePrompt(appSlug, appTitle, principle, values, Boolean(referenceImage));

  if (appSlug === "ai-invention-lab" && referenceImage) {
    const image = await imageReferenceToBlob(referenceImage);

    if (image) {
      return generateImageFromReference(apiKey, prompt, image);
    }
    throw new Error("Invalid image reference");
  }

  const response = await fetchWithTimeout("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getImageModel(),
      prompt,
      size: appSlug === "poetry-picture-maker" ? "1024x1536" : "1024x1024",
      quality: "medium",
      output_format: "png",
      n: 1,
    }),
  }, appSlug === "poetry-picture-maker" ? AI_TIMEOUT_MS.longImage : AI_TIMEOUT_MS.image);

  await requireAiResponse(response);
  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  return b64 ? `data:image/png;base64,${b64}` : undefined;
}

function getImageModel() {
  return serverEnv("OPENAI_IMAGE_MODEL") || "gpt-image-2.5-flare";
}

async function generateImageFromReference(
  apiKey: string,
  prompt: string,
  reference: { blob: Blob; filename: string },
) {
  const form = new FormData();
  form.append("model", getImageModel());
  form.append("prompt", prompt);
  form.append("size", "1024x1024");
  form.append("quality", "medium");
  form.append("output_format", "png");
  form.append("n", "1");
  form.append("image", reference.blob, reference.filename);

  const response = await fetchWithTimeout("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  }, AI_TIMEOUT_MS.imageEdit);

  await requireAiResponse(response);
  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  return b64 ? `data:image/png;base64,${b64}` : undefined;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function buildImagePrompt(
  appSlug: string,
  appTitle: string,
  principle: string,
  values: Record<string, string>,
  hasReference = false,
) {
  if (appSlug === "ai-invention-lab") {
    return [
      "Korean classroom invention project presentation visual.",
      hasReference ? "Use the provided student hand-drawn sketch image as the main design reference; preserve its core structure and function while making it believable." : "Design the invention from its written description. No reference image is supplied.",
      values.style === "classroom" ? "Create one realistic photograph of the invention in use in a Korean classroom." : values.style === "home" ? "Create one realistic photograph of the invention in use at home." : "Create one polished student invention poster with clear, legible Korean text.",
      `Invention name: ${values.topic || appTitle}.`,
      `Problem to solve: ${values.notes || "daily inconvenience"}.`,
      `Primary user: ${values.user || "student user"}.`,
      `Core feature: ${values.feature || "simple helpful automatic function"}.`,
      "Show the product clearly as a believable household object, with a second implied real-use scene in the composition.",
      values.style === "poster" || !values.style ? `Render only these exact Korean texts directly inside the image: title "${values.topic || appTitle}"; feature "${values.feature || ""}". Do not add other text.` : "No readable text or labels.",
      "One image only, no separate views or collage. No UI, no watermark. Clear materials, clean composition.",
    ].join(" ");
  }

  if (appSlug === "picturebook-scene-maker") {
    return [
      "Korean classroom picturebook creation activity.",
      `Exact story sentence: ${values.topic || appTitle}.`,
      `Scene description: ${values.notes || ""}.`,
      `Render the exact story sentence "${values.topic || appTitle}" directly in the image with legible Korean storybook typography. Do not add other readable text unless explicitly requested in the scene description.`,
      `Visual style: ${PICTUREBOOK_STYLES.find((style) => style.id === values.style)?.prompt || PICTUREBOOK_STYLES[0].prompt}`,
      "Use only storybook-friendly visual treatment, no watermark, child-friendly illustration, clear subject and setting.",
    ].join(" ");
  }

  if (appSlug === "poetry-picture-maker") {
    const author = values.author?.trim() || "작가 미상";
    const title = values.topic?.trim() || appTitle;
    const poem = values.poem?.trim() || "시 문장을 입력하세요.";
    const scene = values.notes?.trim() || "따뜻한 문학 감상 장면";

    return [
      "Create one finished Korean poetry poster image. The final PNG itself must contain the artwork, layout, typography, poem text, author, and title. Do not leave blank space for later text overlay.",
      "Render all Korean text directly inside the generated image as part of the poster design.",
      "Use only the exact visible Korean text listed below. Do not add captions, labels, explanations, UI text, watermark, signatures, placeholder text, or random extra words.",
      `Exact title text: ${title}`,
      `Exact author text: ${author}`,
      "Exact poem text:",
      poem,
      `Scene direction: ${scene}`,
      `Illustration style: ${values.style || "watercolor"}`,
      "Poster direction: portrait 2:3 poetry artwork, polished classroom literary poster, warm readable Korean typography, clear hierarchy, integrated illustration and text, print-ready composition.",
    ].join(" ");
  }

  if (appSlug === "safety-webtoon-maker") {
    return [
      "Korean classroom safety education four-panel comic concept image.",
      `Safety topic: ${values.topic || appTitle}.`,
      `Place: ${values.level || "교실"}.`,
      `Characters and message: ${values.notes || ""}.`,
      "Show a safe behavior arc with four visual moments, no readable text, no speech bubbles, child-friendly comic style.",
    ].join(" ");
  }

  return [
    `${appTitle} result image for a Korean classroom education app.`,
    principle,
    `Topic: ${values.topic || appTitle}.`,
    `Context: ${values.notes || ""}.`,
    "Clean editorial classroom visual, no text, product-ready educational material.",
  ].join(" ");
}
