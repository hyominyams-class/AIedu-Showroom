import { AppItem, getDemoExample } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";

export type MvpOutput = {
  title: string;
  lead: string;
  cards: { title: string; body: string }[];
  notes: string[];
  imageUrl?: string;
  source?: "live" | "fallback" | "local";
  csv?: string;
  updatedAt: string;
};

export type MvpState = {
  values: Record<string, string>;
  output: MvpOutput;
  extra: {
    activeIndex: number;
    checked: string[];
    log: string[];
    threshold: number;
  };
};

export function mvpStorageKey(slug: string) {
  return `showroom:mvp:${slug}`;
}

export function createDefaultState(app: AppItem, spec: MvpSpec): MvpState {
  const example = getDemoExample(app);
  const values = { ...example.values };
  return {
    values,
    output: buildLocalOutput(app, spec, values),
    extra: {
      activeIndex: 0,
      checked: [],
      log: [],
      threshold: Number.parseInt(values.level, 10) || 80,
    },
  };
}

export function loadMvpState(app: AppItem, spec: MvpSpec): MvpState {
  if (typeof window === "undefined") {
    return createDefaultState(app, spec);
  }

  const stored = window.localStorage.getItem(mvpStorageKey(app.slug));
  if (!stored) return createDefaultState(app, spec);

  try {
    return JSON.parse(stored) as MvpState;
  } catch {
    return createDefaultState(app, spec);
  }
}

export function saveMvpState(slug: string, state: MvpState) {
  window.localStorage.setItem(mvpStorageKey(slug), JSON.stringify(state));
}

export function getPrimary(values: Record<string, string>, fallback: string) {
  return values.topic?.trim() || fallback;
}

export function getDetail(values: Record<string, string>, fallback: string) {
  return values.notes?.trim() || fallback;
}

export function getLevel(values: Record<string, string>, fallback = "기본") {
  return values.level?.trim() || fallback;
}

export function buildLocalOutput(app: AppItem, spec: MvpSpec, values: Record<string, string>): MvpOutput {
  const primary = getPrimary(values, app.title);
  const detail = getDetail(values, app.lessonUse);
  const level = getLevel(values, app.fields.find((field) => field.id === "level")?.options?.[0]);
  const cleanDetail = compactText(detail);
  const scriptLine = firstSentence(cleanDetail);
  const now = new Date().toISOString();

  const outputByKind: Record<string, MvpOutput> = {
    timer: {
      title: `${primary} 시간표`,
      lead: `${level} 활동을 교실용 시간표로 엽니다.`,
      cards: [
        { title: "준비", body: detail },
        { title: "점검", body: "모둠별 진행 상황을 확인하고 남은 시간을 알립니다." },
        { title: "발표", body: "발표 순서를 섞고 30초 발표를 이어갑니다." },
        { title: "정리", body: "마무리 질문으로 오늘의 핵심을 남깁니다." },
      ],
      notes: ["시간 배분", "발표 순서", "마무리 질문"],
      source: "local",
      updatedAt: now,
    },
    quiz: {
      title: `${primary} 복습 퀴즈`,
      lead: `${level} 수준으로 확인, 적용, 설명 문제를 풉니다.`,
      cards: [
        { title: "확인 문제", body: `${primary}에서 가장 먼저 확인할 개념을 고릅니다.` },
        { title: "적용 문제", body: `${detail} 조건을 넣어 비슷한 문제를 해결합니다.` },
        { title: "설명 문제", body: "친구에게 풀이 과정을 한 문장씩 설명합니다." },
        { title: "도전 문제", body: "실수하기 쉬운 조건을 찾아 고칩니다." },
        { title: "복습 추천", body: "틀린 카드와 같은 유형을 한 번 더 풉니다." },
      ],
      notes: ["정답 보기", "점수 계산", "복습 추천"],
      source: "local",
      updatedAt: now,
    },
    passport: {
      title: `${primary} 독서여권`,
      lead: `${level} 스탬프에 생각 문장과 다음 질문을 남깁니다.`,
      cards: [
        { title: "읽은 책", body: primary },
        { title: "생각 문장", body: detail },
        { title: "다음 질문", body: "이 책을 친구에게 추천한다면 어떤 장면부터 말할까요?" },
      ],
      notes: ["읽음", "생각", "추천"],
      source: "local",
      updatedAt: now,
    },
    campaign: {
      title: `${primary} 카드뉴스`,
      lead: `${level}에게 전할 메시지를 네 장으로 나눕니다.`,
      cards: [
        { title: "문제", body: `${primary}에서 지금 가장 먼저 보이는 문제입니다.` },
        { title: "근거", body: detail },
        { title: "행동", body: "오늘 바로 시작할 수 있는 한 가지 행동을 제안합니다." },
        { title: "참여 요청", body: `${level}이 함께 참여할 수 있는 짧은 문구를 남깁니다.` },
      ],
      notes: ["문제", "근거", "행동", "참여"],
      source: "local",
      updatedAt: now,
    },
    experiment: {
      title: `${primary} 탐구 카드`,
      lead: `${level} 방식에 맞춰 준비, 관찰, 기록, 질문을 진행합니다.`,
      cards: [
        { title: "준비물", body: detail },
        { title: "관찰 기준", body: `${level}할 때 변하는 것과 그대로인 것을 나눠 봅니다.` },
        { title: "기록 질문", body: "결과가 달라진 까닭을 조건과 연결해 씁니다." },
      ],
      notes: ["안전 확인", "관찰 메모", "생각 질문"],
      source: "local",
      updatedAt: now,
    },
    picturebook: {
      title: `${primary} 장면`,
      lead: `${level} 분위기의 그림책 장면과 다음 문장을 만듭니다.`,
      cards: [
        { title: "주인공", body: primary },
        { title: "장소와 배경", body: detail },
        { title: "다음 문장", body: "작은 선택이 다음 장면의 길을 엽니다." },
      ],
      notes: ["주인공", "장소", "분위기"],
      imageUrl: app.previewImages[1] ?? app.previewImages[0] ?? app.thumbnail,
      source: "fallback",
      updatedAt: now,
    },
    questions: {
      title: `${primary} 질문`,
      lead: `${level}에 맞춘 수업 질문입니다.`,
      cards: [
        { title: "읽기 전", body: `${primary}을 읽기 전에 꼭 알아야 할 낱말이나 배경은 무엇인가요?` },
        { title: "근거 찾기", body: `글에서 ${primary}와 직접 연결되는 근거 한 문장을 찾으세요.` },
        { title: "생각 넓히기", body: `${cleanDetail}와 연결해 내 생각이 달라진 부분은 무엇인가요?` },
        { title: "토론", body: `우리 반은 ${primary}에 대해 어떤 선택을 해야 할까요? 이유를 함께 말하세요.` },
      ],
      notes: ["읽기 전", "근거", "토론"],
      source: "fallback",
      updatedAt: now,
    },
    feedback: {
      title: `${primary} 발표 코칭`,
      lead: `${level} 중심으로 바로 고쳐 말할 문장입니다.`,
      cards: [
        { title: "살릴 점", body: `${scriptLine} 이 문장은 발표 주제를 바로 보여줍니다.` },
        { title: "고칠 점", body: `${level}이 더 분명하게 들리도록 이유와 행동을 한 문장씩 나누세요.` },
        { title: "다시 말하기", body: rewritePresentationLine(primary, cleanDetail) },
        { title: "연습 체크", body: "첫 문장 5초, 핵심 근거 1개, 마지막 요청 1개를 소리 내어 확인하세요." },
      ],
      notes: ["강점", "수정", "연습"],
      source: "fallback",
      updatedAt: now,
    },
    invention: {
      title: `${primary} 이미지 결과`,
      lead: `${detail} 문제를 기능, 사용 장면, 발표 문장으로 바꿉니다.`,
      cards: [
        { title: "불편한 점", body: detail },
        { title: "사용하는 사람", body: values.user?.trim() || "이 발명품이 필요한 사람을 떠올립니다." },
        { title: "핵심 기능", body: values.feature?.trim() || `${primary}에 자동 도움 기능을 넣습니다.` },
      ],
      notes: ["문제", "기능", "발표"],
      imageUrl: app.previewImages[0] ?? app.thumbnail,
      source: "local",
      updatedAt: now,
    },
    webtoon: {
      title: `${primary} 안전 웹툰`,
      lead: `${level}에서 위험을 알아차리고 안전 약속까지 이어갑니다.`,
      cards: [
        { title: "1컷 위험 상황", body: detail },
        { title: "2컷 멈춤", body: "친구가 손짓으로 멈춤 신호를 보냅니다." },
        { title: "3컷 바른 행동", body: `${level}에서 안전한 행동으로 바꿉니다.` },
        { title: "4컷 안전 약속", body: `${primary} 약속을 함께 읽습니다.` },
      ],
      notes: ["위험", "멈춤", "행동", "약속"],
      imageUrl: app.previewImages[1] ?? app.thumbnail,
      source: "fallback",
      updatedAt: now,
    },
    dashboard: {
      title: `${primary} 센서 보드`,
      lead: `${level} 센서값을 기준선과 알림 기록으로 읽습니다.`,
      cards: [
        { title: "현재 값", body: "82%" },
        { title: "기준선", body: detail },
        { title: "알림", body: "기준을 넘은 시간대를 로그에 남깁니다." },
      ],
      notes: ["실시간 값", "기준선", "알림 기록"],
      csv: "time,value,status\n09:00,62,normal\n09:10,74,normal\n09:20,83,alert\n09:30,79,normal",
      source: "local",
      updatedAt: now,
    },
    portfolio: {
      title: `${primary} 팀 보드`,
      lead: `${level} 단계의 할 일과 피드백을 한 보드에 둡니다.`,
      cards: [
        { title: "계획", body: primary },
        { title: "자료", body: "조사 링크와 사진 기록을 모읍니다." },
        { title: "산출물", body: detail },
        { title: "피드백", body: "다음 차시에 반영할 의견을 남깁니다." },
      ],
      notes: ["계획", "자료", "산출물", "피드백"],
      source: "local",
      updatedAt: now,
    },
    map: {
      title: `${primary} 데이터 맵`,
      lead: `${level} 데이터를 장소, 관찰, 제안 카드로 연결합니다.`,
      cards: [
        { title: "장소", body: detail },
        { title: "관찰", body: `${primary}의 위험 지점과 이유를 기록합니다.` },
        { title: "제안", body: "학생이 직접 요청할 개선 행동을 씁니다." },
      ],
      notes: ["장소", "관찰", "데이터", "제안"],
      csv: "place,type,score,note\n정문 앞,교통,86,차량 속도 관찰\n골목길,교통,72,시야 확보 필요",
      source: "local",
      updatedAt: now,
    },
    report: {
      title: `${primary} 성장 리포트`,
      lead: `${level} 기준으로 성취, 참여, 성장 기록을 봅니다.`,
      cards: [
        { title: "강점", body: `${detail}에서 꾸준한 참여가 보입니다.` },
        { title: "보완", body: `${primary}의 핵심 개념을 말로 설명하는 연습이 필요합니다.` },
        { title: "다음 과제", body: "비슷한 문제를 만들고 친구에게 풀이를 설명합니다." },
      ],
      notes: ["성취", "참여", "성장"],
      source: "local",
      updatedAt: now,
    },
    chatbot: {
      title: `${primary} 답변`,
      lead: `${level}에서 찾은 답변과 다음 질문입니다.`,
      cards: [
        { title: "학생 질문", body: cleanDetail },
        { title: "답변", body: chatbotAnswer(primary, level, cleanDetail) },
        { title: "근거", body: `${level}에 있는 기준과 예시를 먼저 확인하세요.` },
        { title: "추천 질문", body: `${primary}에서 내 상황에 맞는 예시를 하나 더 물어보세요.` },
      ],
      notes: ["답변", "근거", "다음 질문"],
      source: "fallback",
      updatedAt: now,
    },
  };

  return outputByKind[spec.kind];
}

export function applyStateToOutput(app: AppItem, spec: MvpSpec, state: MvpState, output = state.output): MvpOutput {
  const values = state.values;
  const primary = getPrimary(values, app.title);
  const detail = getDetail(values, app.lessonUse);
  const level = getLevel(values, app.fields.find((field) => field.id === "level")?.options?.[0]);
  const checked = state.extra.checked;
  const log = state.extra.log;
  const threshold = state.extra.threshold || 80;
  const activeIndex = state.extra.activeIndex || 0;
  const updatedAt = new Date().toISOString();

  if (spec.kind === "timer") {
    const groupCount = Number.parseInt(values.groupCount || "", 10) || 5;
    const order = log.length ? log : Array.from({ length: groupCount }, (_, index) => `${index + 1}모둠`);
    return {
      ...output,
      cards: [
        ...output.cards.filter((card) => card.title !== "발표 순서").slice(0, 4),
        { title: "발표 순서", body: order.join(" → ") },
      ],
      notes: uniqueItems([`${groupCount}개 모둠`, ...output.notes]),
      updatedAt,
    };
  }

  if (spec.kind === "quiz") {
    return {
      ...output,
      cards: output.cards.map((card) => ({
        ...card,
        body: checked.includes(card.title) ? appendOnce(card.body, "정답 확인을 마쳤습니다.") : card.body,
      })),
      notes: uniqueItems([`${checked.length}/${output.cards.length}개 확인`, ...output.notes]),
      updatedAt,
    };
  }

  if (spec.kind === "passport") {
    return {
      ...output,
      cards: [
        ...output.cards.filter((card) => card.title !== "스탬프 기록" && card.title !== "누적 기록"),
        { title: "스탬프 기록", body: checked.length ? checked.join(", ") : "읽음 스탬프부터 시작합니다." },
        ...(log.length ? [{ title: "누적 기록", body: log.join(" / ") }] : []),
      ],
      notes: checked.length ? uniqueItems(checked) : output.notes,
      updatedAt,
    };
  }

  if (spec.kind === "experiment") {
    return {
      ...output,
      cards: [
        ...output.cards.filter((card) => card.title !== "관찰 메모"),
        { title: "관찰 메모", body: values.observation?.trim() || "관찰한 변화와 조건을 적습니다." },
      ],
      notes: uniqueItems([`완료 ${checked.length}단계`, ...output.notes]),
      updatedAt,
    };
  }

  if (spec.kind === "dashboard") {
    const valuesByTime = [62, 74, 83, 79, 88, 71, 65];
    const rows = valuesByTime.map((value, index) => {
      const minute = String(index * 10).padStart(2, "0");
      return `09:${minute},${value},${value >= threshold ? "alert" : "normal"},${threshold}`;
    });
    return {
      ...output,
      cards: [
        { title: "현재 값", body: `${valuesByTime.at(-1)}%` },
        { title: "기준선", body: `${threshold}% · ${detail}` },
        { title: "알림", body: `${valuesByTime.filter((value) => value >= threshold).length}번의 알림이 기록됩니다.` },
      ],
      notes: [`기준선 ${threshold}%`, level, primary],
      csv: `time,value,status,threshold\n${rows.join("\n")}`,
      updatedAt,
    };
  }

  if (spec.kind === "portfolio") {
    return {
      ...output,
      cards: output.cards.map((card) => ({
        ...card,
        body: checked.includes(card.title) ? appendOnce(card.body, "완료 표시가 남았습니다.") : card.body,
      })),
      notes: uniqueItems([`완료 ${checked.length}개`, ...output.notes]),
      updatedAt,
    };
  }

  if (spec.kind === "map") {
    const score = values.markerScore || "82";
    return {
      ...output,
      cards: [
        ...output.cards.filter((card) => card.title !== "선택 지점"),
        { title: "선택 지점", body: `${activeIndex + 1}번 장소 · 위험도 ${score}` },
      ],
      notes: [`${activeIndex + 1}번 장소`, `${score}점`, level],
      csv: `place,type,score,note\n${activeIndex + 1}번 장소,${level},${score},${detail.replaceAll("\n", " ")}`,
      updatedAt,
    };
  }

  if (spec.kind === "report") {
    const metrics = ["성취", "참여", "성장"];
    return {
      ...output,
      cards: [
        ...output.cards.filter((card) => card.title !== "선택 지표"),
        { title: "선택 지표", body: `${metrics[activeIndex % metrics.length]} 기록을 다음 과제에 반영합니다.` },
      ],
      notes: uniqueItems([metrics[activeIndex % metrics.length], ...output.notes]),
      updatedAt,
    };
  }

  if (spec.kind === "questions" || spec.kind === "feedback" || spec.kind === "chatbot") {
    return {
      ...output,
      notes: checked.length ? uniqueItems(checked) : output.notes,
      updatedAt,
    };
  }

  if (spec.kind === "webtoon") {
    return {
      ...output,
      cards: [
        ...output.cards.filter((card) => card.title !== "역할극 질문"),
        { title: "역할극 질문", body: `${activeIndex + 1}컷 다음에 어떤 안전 행동을 말할까요?` },
      ],
      notes: uniqueItems([`선택 컷 ${activeIndex + 1}`, ...output.notes]),
      updatedAt,
    };
  }

  if (spec.kind === "invention") {
    return {
      ...output,
      updatedAt,
    };
  }

  return {
    ...output,
    updatedAt,
  };
}

function uniqueItems(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function appendOnce(body: string, sentence: string) {
  return body.includes(sentence) ? body : `${body} ${sentence}`;
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim() || "수업 자료";
}

function firstSentence(value: string) {
  const [sentence] = value.split(/(?<=[.!?。！？]|다\.)\s+/);
  return sentence?.trim() || value;
}

function rewritePresentationLine(primary: string, detail: string) {
  const shortDetail = detail.length > 44 ? `${detail.slice(0, 44)}...` : detail;
  return `${primary}에서 중요한 점은 ${shortDetail}입니다. 그래서 지금 바로 실천할 행동을 하나 정해야 합니다.`;
}

function chatbotAnswer(role: string, source: string, question: string) {
  const shortQuestion = question.length > 42 ? `${question.slice(0, 42)}...` : question;
  return `${role} 기준으로 보면 "${shortQuestion}"는 ${source}에서 먼저 확인할 내용입니다. 핵심 조건을 한 가지로 좁힌 뒤 예시와 함께 답하세요.`;
}

export function outputToText(output: MvpOutput, state?: MvpState) {
  return [
    output.title,
    output.lead,
    ...output.cards.map((card) => `${card.title}: ${card.body}`),
    state?.extra.checked.length ? `선택: ${state.extra.checked.join(", ")}` : "",
    state?.extra.log.length ? `기록: ${state.extra.log.join(" / ")}` : "",
    `핵심: ${output.notes.join(", ")}`,
  ].filter(Boolean).join("\n");
}

export function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
