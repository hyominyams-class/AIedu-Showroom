import { readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { getAppBySlug } from "@/data/apps";
import { getMvpSpec } from "@/data/mvp";
import { MvpOutput, buildLocalOutput } from "@/components/mvp/MvpStorage";

type AiRequest = {
  appSlug?: string;
  mode?: "text" | "image" | "mixed" | "chat";
  values?: Record<string, string>;
  referenceImage?: string;
  messages?: {
    role: "user" | "assistant";
    content: string;
  }[];
};

export const maxDuration = 180;

const AI_TIMEOUT_MS = {
  authorChat: 60_000,
  text: 60_000,
  concept: 90_000,
  questionHelper: 120_000,
  image: 120_000,
  longImage: 180_000,
  imageEdit: 120_000,
} as const;

export async function POST(request: Request) {
  let body: AiRequest;
  try {
    body = (await request.json()) as AiRequest;
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
  const app = body.appSlug ? getAppBySlug(body.appSlug) : undefined;

  if (!app) {
    return Response.json({ ok: false, error: "앱을 찾을 수 없습니다." }, { status: 404 });
  }

  const spec = getMvpSpec(app);

  if (!spec) {
    return Response.json({ ok: false, error: "앱 생성 기능이 없습니다." }, { status: 404 });
  }

  const values = body.values ?? {};
  const fallback = buildLocalOutput(app, spec, values);
  const textFallback = app.slug === "concept-explainer" ? buildConceptApiFallback(values, fallback) : fallback;

  if (
    (body.mode === "image" || body.mode === "mixed") &&
    (app.slug === "poetry-picture-maker" || app.slug === "ai-invention-lab" || app.slug === "picturebook-scene-maker")
  ) {
    const imageUrl =
      app.slug === "poetry-picture-maker"
        ? "/visuals/poetry/rain-playground-poetry-poster.png"
        : app.slug === "ai-invention-lab"
          ? "/visuals/invention/auto-watering-planter-poster.png"
          : "/visuals/picturebook/rain-puddle-word-scene.png";
    return Response.json({ ok: true, ...fallback, imageUrl, source: "local" });
  }

  const apiKey = getOpenAiKey();

  if (body.mode === "chat" && app.slug === "author-meet-chatbot") {
    const fallbackMessage = buildAuthorFallback(values, body.messages ?? []);

    if (!apiKey) {
      return Response.json({ ok: true, message: fallbackMessage, source: "fallback" });
    }

    try {
      const message = await generateAuthorChat(apiKey, values, body.messages ?? []);
      return Response.json({
        ok: true,
        message: message || fallbackMessage,
        source: message ? "live" : "fallback",
      });
    } catch (error) {
      logAiFallback("author-chat", error);
      return Response.json({ ok: true, message: fallbackMessage, source: "fallback" });
    }
  }

  if (!apiKey) {
    return Response.json({ ok: true, ...textFallback, source: "fallback" });
  }

  try {
    if (body.mode === "image" || body.mode === "mixed") {
      const image = await generateImage(apiKey, app.slug, app.title, spec.principle, values, body.referenceImage);

      return Response.json({
        ok: true,
        ...fallback,
        imageUrl: image || fallback.imageUrl,
        source: image ? "live" : "fallback",
      });
    }

    const text = await generateText(apiKey, app.slug, app.title, spec.principle, values);
    if (app.slug === "concept-explainer" && !text) {
      return Response.json({ ok: true, ...textFallback, source: "fallback" });
    }
    return Response.json({
      ok: true,
      ...textFallback,
      ...text,
      source: text ? "live" : "fallback",
    });
  } catch (error) {
    logAiFallback(app.slug, error);
    return Response.json({ ok: true, ...textFallback, source: "fallback" });
  }
}

function logAiFallback(scope: string, error: unknown) {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(`[ai/generate] ${scope} fell back to local output. ${message}`);
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
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini",
      input: [
        {
          role: "user",
          content: buildVisibleAuthorPrompt(values, trimmedMessages),
        },
      ],
    }),
  }, AI_TIMEOUT_MS.authorChat);

  if (!response.ok) return undefined;
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

function buildAuthorFallback(
  values: Record<string, string>,
  messages: { role: "user" | "assistant"; content: string }[],
) {
  const latestQuestion = [...messages].reverse().find((message) => message.role === "user")?.content || values.question || "";
  const source = values.notes?.trim() || "강아지똥은 작은 존재도 누군가의 생명을 피울 수 있다는 마음을 담고 있습니다.";
  const sourceLine = source.split(/\r?\n/).find((line) => line.trim())?.trim() || source;
  const personaPrompt = values.authorPrompt?.trim() || "";

  if (/까칠|시크|퉁명|무뚝뚝|냉소|삐딱/.test(personaPrompt)) {
    return [
      "글쎄, 답은 그렇게 복잡하지 않아.",
      `${sourceLine} 그러니까 ${latestQuestion || "그 질문"}에 대한 답도 거기서 찾아야지.`,
      "강아지똥은 자기 쓸모를 처음으로 발견했고, 민들레를 살릴 수 있는 일이 자기에게 남은 역할이라고 본 거야.",
    ].join(" ");
  }

  return [
    "네 질문을 들으니 강아지똥이 오래 품고 있던 마음이 떠오르네.",
    `작품 속 ${sourceLine} 이 장면은 작고 낮은 자리에도 생명을 살리는 힘이 있다는 뜻으로 읽을 수 있어.`,
    latestQuestion ? `"${latestQuestion}"라는 물음에는, 자신을 내어주는 일이 사라짐이 아니라 다른 생명 안에서 다시 피어나는 일이라고 답하고 싶어.` : "궁금한 장면을 하나 더 말해주면 그 마음을 이어서 이야기해볼게.",
  ].join(" ");
}

function getOpenAiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

  try {
    const file = readFileSync(join(process.cwd(), "local.env"), "utf8");
    const line = file
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find((item) => item.startsWith("OPENAI_API_KEY="));
    return line?.replace(/^OPENAI_API_KEY=/, "").trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

function buildConceptApiFallback(values: Record<string, string>, fallback: MvpOutput) {
  const question = values.topic?.trim() || "궁금한 내용";
  const topic = extractConceptTarget(question);
  const level = values.level?.trim() || "학생";
  const context = cleanConceptContext(values.notes || "") || "오늘 수업";
  const sourceSentence = cleanConceptContext(values.sourceSentence || "");
  const payload = buildConceptFallbackPayload(topic, context, sourceSentence, level, values.length === "자세히");

  return {
    ...fallback,
    ...payload,
    updatedAt: new Date().toISOString(),
  };
}

function buildConceptFallbackPayload(topic: string, context: string, sourceSentence: string, level: string, isDetailed: boolean) {
  const makePayload = (lead: string, answerBlocks: Record<string, unknown>[]) => ({
    title: buildSafeConceptTitle(topic),
    lead,
    cards: answerBlocks.map((block) => {
      const typed = block as { title?: string; body?: string; items?: string[]; rows?: { label: string; value: string }[] };
      return {
        title: typed.title || "설명",
        body: typed.body || typed.items?.join(" ") || typed.rows?.map((row) => `${row.label}: ${row.value}`).join(" ") || "",
      };
    }),
    answerMeta: {
      term: topic,
      sourceSentence,
      lessonContext: context,
      studentIntent: `${level} 수준에서 이해하기`,
    },
    answerBlocks,
    notes: [],
  });

  if (topic.includes("경도")) {
    const lead = "‘경도’는 본초자오선을 기준으로 어떤 장소가 동쪽이나 서쪽으로 얼마나 떨어져 있는지 나타내는 값이에요.";
    const blocks: Record<string, unknown>[] = [
      { type: "paragraph", title: "핵심 뜻", body: lead },
      {
        type: "table",
        title: "위도와 경도 비교",
        rows: [
          { label: "위도", value: "적도를 기준으로 북쪽·남쪽 위치를 나타냅니다." },
          { label: "경도", value: "본초자오선을 기준으로 동쪽·서쪽 위치를 나타냅니다." },
          { label: "지도에서 보기", value: "위도선은 가로 방향, 경도선은 세로 방향으로 생각하면 쉽습니다." },
        ],
      },
      {
        type: "diagram",
        title: "위도와 경도 위치 보기",
        diagramType: "grid",
        nodes: [
          { label: "경도", description: "동서 위치를 나타내는 값입니다." },
          { label: "본초자오선", description: "경도 0도의 기준선입니다." },
          { label: "위도와 차이", description: "위도는 남북 위치, 경도는 동서 위치를 나타냅니다." },
        ],
        links: [],
      },
      {
        type: "check",
        title: "확인하기",
        items: ["경도는 동쪽·서쪽 위치를 나타낸다고 말할 수 있어요.", "본초자오선이 경도의 기준선이라는 점을 기억할 수 있어요.", "위도와 경도의 차이를 한 문장으로 설명할 수 있어요."],
      },
    ];
    if (isDetailed) {
      blocks.splice(3, 0, {
        type: "example",
        title: "수업 문장에 넣어 보기",
        body: sourceSentence ? `문장 속 "${sourceSentence}"에서 경도는 위치를 더 정확히 나타내기 위해 쓰인 말이에요.` : `${context}에서 경도는 지구 위 장소의 위치를 더 정확히 말할 때 쓰입니다.`,
      });
    }
    return makePayload(lead, blocks);
  }

  if (topic.includes("위도")) {
    const lead = "‘위도’는 적도를 기준으로 어떤 장소가 북쪽이나 남쪽으로 얼마나 떨어져 있는지 나타내는 값이에요.";
    return makePayload(lead, [
      { type: "paragraph", title: "핵심 뜻", body: lead },
      {
        type: "table",
        title: "위도와 경도 비교",
        rows: [
          { label: "위도", value: "적도를 기준으로 북쪽·남쪽 위치를 나타냅니다." },
          { label: "경도", value: "본초자오선을 기준으로 동쪽·서쪽 위치를 나타냅니다." },
          { label: "지도에서 보기", value: "위도선은 가로 방향, 경도선은 세로 방향으로 생각하면 쉽습니다." },
        ],
      },
      {
        type: "diagram",
        title: "위도와 경도 위치 보기",
        diagramType: "grid",
        nodes: [
          { label: "위도", description: "남북 위치를 나타내는 값입니다." },
          { label: "적도", description: "위도 0도의 기준선입니다." },
          { label: "경도와 차이", description: "경도는 동서 위치를 나타냅니다." },
        ],
        links: [],
      },
      { type: "check", title: "확인하기", items: ["위도는 북쪽·남쪽 위치를 나타낸다고 말할 수 있어요.", "적도가 위도의 기준선이라는 점을 기억할 수 있어요.", "위도와 경도의 차이를 한 문장으로 설명할 수 있어요."] },
    ]);
  }

  if (topic.includes("증발")) {
    const lead = "‘증발’은 물 같은 액체가 기체가 되어 공기 중으로 퍼지는 현상이에요.";
    return makePayload(lead, [
      { type: "paragraph", title: "핵심 뜻", body: lead },
      {
        type: "diagram",
        title: "증발이 일어나는 흐름",
        diagramType: "flow",
        nodes: [
          { label: "액체 물", description: "처음에는 눈에 보이는 물입니다." },
          { label: "수증기", description: "기체 상태로 바뀝니다." },
          { label: "공기 중", description: "주변 공기와 섞입니다." },
        ],
        links: [
          { from: "액체 물", to: "수증기", label: "상태 변화" },
          { from: "수증기", to: "공기 중", label: "퍼짐" },
        ],
      },
      { type: "example", title: "생활 예시", body: "젖은 수건이 시간이 지나며 마르는 것은 물이 증발해서 공기 중으로 퍼지기 때문이에요." },
      { type: "check", title: "확인하기", items: ["증발은 액체가 기체로 바뀌는 현상이라고 말할 수 있어요.", "물이 사라진 것이 아니라 모습이 바뀐 것이라고 설명할 수 있어요.", "젖은 수건이 마르는 까닭을 증발과 연결할 수 있어요."] },
    ]);
  }

  const lead = `‘${topic}’은 ${context}에서 중요한 뜻을 가진 말이에요. 앞뒤 문장이나 수업 장면과 함께 보면 무엇을 가리키는지 더 쉽게 알 수 있어요.`;
  return makePayload(lead, [
    { type: "paragraph", title: "핵심 뜻", body: lead },
    { type: "example", title: "수업 문장에 넣어 보기", body: sourceSentence ? `문장 속 "${sourceSentence}"에서 ‘${topic}’이 무엇을 가리키는지 앞뒤 내용과 함께 살펴보면 좋아요.` : `${context}에서 ‘${topic}’이 어떤 뜻으로 쓰였는지 한 문장으로 바꾸어 생각해요.` },
    { type: "check", title: "확인하기", items: [`‘${topic}’의 뜻을 한 문장으로 말할 수 있어요.`, `수업 문장 안에서 ‘${topic}’이 어떤 역할을 하는지 찾을 수 있어요.`, "비슷한 말과 헷갈리는 점을 하나 말할 수 있어요."] },
  ]);
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

function cleanConceptContext(notes: string) {
  return notes
    .trim()
    .replace(/[.!?。]+$/, "")
    .replace(/입니다$/, "")
    .replace(/이에요$/, "")
    .replace(/예요$/, "");
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
                },
                required: ["label", "description"],
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
    required: ["answerMeta", "title", "lead", "answerBlocks", "notes"],
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
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini",
      ...(isQuestionHelper ? { reasoning: { effort: "low" } } : {}),
      input: [
        {
          role: "system",
          content: isConceptExplainer
            ? [
                "You are a Korean concept explanation engine for students who are studying without a teacher beside them.",
                "Return only compact JSON with answerMeta, title, lead, answerBlocks, notes.",
                "The student enters a topic or sentence, where they saw it, lesson context, grade level, and either a concise or detailed explanation preference.",
                "Answer the student's question directly and completely enough for self-study. Do not repeat the question as the title.",
                "The title must not attach Korean particles directly to an unquoted term. Use a safe title like '‘경도’는 동서 위치를 나타내는 값이에요' or a complete explanation sentence.",
                "Never write malformed particles such as '경도은', '위도은', or '증발는'.",
                "The lead must begin with the explanation itself, not with phrases like '이 질문은', '학생 질문에 맞춰', or '쉽게 설명하면'.",
                "Use answerBlocks flexibly. Choose paragraph, example, table, chart, diagram, or check blocks only when they help the student understand.",
                "For comparisons, parts, categories, or clear relationships, use a table block with specific labels. Do not use generic row labels like '무엇을 보나요?', '수업 예시', or '헷갈리는 점'.",
                "For numeric change, order-by-amount, frequency, score, ratio, or simple measured values, use a chart block with chartType bar or line.",
                "For longitude or latitude, use a diagram block with diagramType grid and explain equator, prime meridian, north-south, and east-west correctly.",
                "For processes, cycles, cause-effect, structure, or transformations, use a diagram block with diagramType flow, cycle, or compare.",
                "Never output raw SVG, HTML, CSS, JavaScript, or image data. For diagrams, output only nodes and links.",
                "Do not invent numeric values just to create a chart. Use chart only when the student's question or explanation naturally contains safe simple numbers.",
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
              ? "학생이 혼자 읽고 이해할 수 있는 답변을 만든다. 입력된 개념, 원문, 수업 맥락을 구분해서 answerMeta에 담고 설명문, 표, 예시, 차트, 도식, 확인 중 필요한 블록만 골라 answerBlocks에 담는다. raw SVG 문자열은 만들지 않는다."
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
                        nodes: [{ label: "string", description: "string" }],
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

  if (!response.ok) return undefined;
  const data = await response.json();
  const text = extractResponseText(data);
  if (!text) return undefined;
  const parsed = JSON.parse(text);
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

  if (term.includes("경도") || term.includes("위도") || term.includes("증발")) {
    output.title = buildSafeConceptTitle(term);
  } else if (typeof output.title === "string") {
    output.title = fixConceptTitle(output.title, term);
  } else {
    output.title = buildSafeConceptTitle(term);
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
  const prompt = buildImagePrompt(appSlug, appTitle, principle, values);

  if (appSlug === "ai-invention-lab" && referenceImage) {
    const image = await imageReferenceToBlob(referenceImage);

    if (image) {
      const edited = await generateImageFromReference(apiKey, prompt, image);
      if (edited) return edited;
    }
  }

  const response = await fetchWithTimeout("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getImageModel(appSlug),
      prompt,
      size: appSlug === "poetry-picture-maker" ? "1024x1536" : "1024x1024",
      quality: appSlug === "poetry-picture-maker" ? "high" : "medium",
      n: 1,
    }),
  }, appSlug === "poetry-picture-maker" ? AI_TIMEOUT_MS.longImage : AI_TIMEOUT_MS.image);

  if (!response.ok) return undefined;
  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  return b64 ? `data:image/png;base64,${b64}` : data.data?.[0]?.url;
}

function getImageModel(appSlug: string) {
  if (appSlug === "poetry-picture-maker") return "gpt-image-2";
  return process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
}

async function generateImageFromReference(
  apiKey: string,
  prompt: string,
  reference: { blob: Blob; filename: string },
) {
  const form = new FormData();
  form.append("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2");
  form.append("prompt", prompt);
  form.append("size", "1024x1024");
  form.append("quality", "medium");
  form.append("n", "1");
  form.append("image", reference.blob, reference.filename);

  const response = await fetchWithTimeout("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  }, AI_TIMEOUT_MS.imageEdit);

  if (!response.ok) return undefined;
  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  return b64 ? `data:image/png;base64,${b64}` : data.data?.[0]?.url;
}

async function imageReferenceToBlob(referenceImage: string) {
  if (referenceImage.startsWith("data:image/")) {
    const match = referenceImage.match(/^data:([^;,]+);base64,(.+)$/);
    if (!match) return undefined;
    const bytes = Buffer.from(match[2], "base64");
    return {
      blob: new Blob([new Uint8Array(bytes)], { type: match[1] }),
      filename: `student-sketch.${extensionFromMime(match[1])}`,
    };
  }

  if (!referenceImage.startsWith("/")) return undefined;

  const relativePath = normalize(referenceImage).replace(/^\/+/, "");
  if (relativePath.startsWith("..")) return undefined;

  const file = readFileSync(join(process.cwd(), "public", relativePath));
  const mimeType = mimeFromPath(relativePath);

  return {
    blob: new Blob([new Uint8Array(file)], { type: mimeType }),
    filename: `student-sketch${extname(relativePath) || ".png"}`,
  };
}

function mimeFromPath(path: string) {
  const extension = extname(path).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";
  return "image/png";
}

function extensionFromMime(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
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
) {
  if (appSlug === "ai-invention-lab") {
    return [
      "Korean classroom invention project presentation visual.",
      "Use the provided student hand-drawn sketch image as the main design reference; preserve its core structure and function while making it believable.",
      "Create a polished product poster style image for a student-designed everyday invention.",
      `Invention name: ${values.topic || appTitle}.`,
      `Problem to solve: ${values.notes || "daily inconvenience"}.`,
      `Primary user: ${values.user || "student user"}.`,
      `Core feature: ${values.feature || "simple helpful automatic function"}.`,
      "Show the product clearly as a believable household object, with a second implied real-use scene in the composition.",
      "No readable text, no labels, no UI, no watermark. Product-focused, bright classroom maker-project photography, realistic materials, clean background.",
    ].join(" ");
  }

  if (appSlug === "picturebook-scene-maker") {
    return [
      "Korean classroom picturebook creation activity.",
      `Exact story sentence: ${values.topic || appTitle}.`,
      `Scene description: ${values.notes || ""}.`,
      "Create one charming picturebook scene where Korean onomatopoeia can behave like part of the water splash.",
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
