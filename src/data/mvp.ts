import { AppItem } from "@/data/apps";

export type MvpKind =
  | "timer"
  | "quiz"
  | "passport"
  | "campaign"
  | "experiment"
  | "picturebook"
  | "questions"
  | "feedback"
  | "invention"
  | "webtoon"
  | "dashboard"
  | "portfolio"
  | "map"
  | "report"
  | "chatbot"
  | "runner"
  | "adventure"
  | "seating"
  | "suggestion"
  | "rental"
  | "poll";

export type MvpSpec = {
  kind: MvpKind;
  promise: string;
  output: string;
  principle: string;
  focus: string[];
  workLabel: string;
  resultLabel: string;
  storage: "local" | "copy" | "download" | "csv";
  liveAi?: "text" | "image" | "mixed";
};

export const mvpSpecs: Record<string, MvpSpec> = {
  "author-meet-chatbot": {
    kind: "chatbot",
    promise: "작품 텍스트를 바탕으로 작가와 대화합니다.",
    output: "작가 관점 답변과 이어지는 대화",
    principle: "강아지똥의 작가처럼 말하며 작품 텍스트와 이전 대화를 함께 참고합니다.",
    focus: ["작품 텍스트", "학생 질문", "세션 기억"],
    workLabel: "대화 시작",
    resultLabel: "작가 대화",
    storage: "local",
    liveAi: "text",
  },
  "class-timer-station": {
    kind: "timer",
    promise: "모둠 활동 시간을 바로 교실 화면으로 띄웁니다.",
    output: "단계 시간표와 발표 순서",
    principle: "활동 시간을 준비, 점검, 발표, 정리로 나눕니다.",
    focus: ["총 시간", "모둠 수", "발표 순서"],
    workLabel: "타이머 설정",
    resultLabel: "교실 보드",
    storage: "local",
  },
  "concept-explainer": {
    kind: "questions",
    promise: "모르는 단어나 문장을 수업 맥락에 맞춰 쉽게 설명합니다.",
    output: "쉬운 설명과 시각 답변",
    principle: "궁금한 내용, 원문, 수업 맥락, 학년을 바탕으로 학생이 혼자 이해할 답변을 만듭니다.",
    focus: ["궁금한 내용", "어디에서 봤나요", "배우는 내용"],
    workLabel: "질문하기",
    resultLabel: "쉬운 설명",
    storage: "copy",
    liveAi: "text",
  },
  "english-vocab-cards": {
    kind: "quiz",
    promise: "영단어를 앞뒤 카드로 넘기며 암기합니다.",
    output: "영단어 암기 카드",
    principle: "단어, 뜻, 예문을 카드 앞뒤면으로 나누고 암기 상태를 표시합니다.",
    focus: ["단어", "뜻", "예문"],
    workLabel: "암기 카드",
    resultLabel: "영단어 카드",
    storage: "local",
  },
  "addition-card-match-game": {
    kind: "quiz",
    promise: "덧셈식과 정답 카드를 뒤집어 짝을 맞힙니다.",
    output: "덧셈 카드 짝 맞추기",
    principle: "한 자리 수 덧셈식 8장과 정답 8장을 섞고 같은 값을 찾아 짝짓습니다.",
    focus: ["덧셈식", "정답 카드", "짝 맞추기"],
    workLabel: "카드 뒤집기",
    resultLabel: "덧셈 짝 맞추기",
    storage: "local",
  },
  "history-typing-rain": {
    kind: "quiz",
    promise: "떨어지는 역사 핵심어를 타자로 맞히며 복습합니다.",
    output: "낙하 단어 타자게임",
    principle: "역사 단어가 내려오고 정확히 입력하면 점수와 콤보를 얻습니다.",
    focus: ["역사 핵심어", "타자 입력", "점수"],
    workLabel: "타자 게임",
    resultLabel: "역사 타자 기록",
    storage: "local",
  },
  "picturebook-scene-maker": {
    kind: "picturebook",
    promise: "이야기 설정을 한 장의 그림책 장면으로 보여줍니다.",
    output: "장면 이미지와 그림책 문장",
    principle: "주인공, 장소, 분위기를 장면 요소로 나눕니다.",
    focus: ["주제", "분위기", "인물과 배경"],
    workLabel: "장면 만들기",
    resultLabel: "그림책 장면",
    storage: "copy",
    liveAi: "image",
  },
  "poetry-picture-maker": {
    kind: "picturebook",
    promise: "시의 장면과 문장을 한 장의 이미지로 만듭니다.",
    output: "시화 이미지",
    principle: "작가, 작품명, 시 문장, 장면 묘사를 이미지 생성 프롬프트로 연결합니다.",
    focus: ["작가", "시", "장면 묘사"],
    workLabel: "시화 만들기",
    resultLabel: "시화",
    storage: "copy",
    liveAi: "image",
  },
  "ai-question-helper": {
    kind: "questions",
    promise: "수업 주제를 바로 인쇄할 학습지로 바꿉니다.",
    output: "정답·해설이 포함된 학습지",
    principle: "주제, 학년, 학습 유형을 학습 목표와 유형별 문항, 정답·해설로 나눕니다.",
    focus: ["수업 주제", "학년", "학습지 유형"],
    workLabel: "학습지 만들기",
    resultLabel: "학습지",
    storage: "copy",
    liveAi: "text",
  },
  "neon-rhythm-runner": {
    kind: "runner",
    promise: "비트에 맞춰 달리며 장애물을 피하고 오브를 모읍니다.",
    output: "거리·점수·콤보 기록",
    principle: "자동으로 달리는 러너를 점프와 슬라이드로 조작해 비트 장애물을 피합니다.",
    focus: ["점프", "슬라이드", "비트 오브"],
    workLabel: "러너 시작",
    resultLabel: "러너 기록",
    storage: "local",
  },
  "liberation-text-adventure": {
    kind: "adventure",
    promise: "선택에 따라 이야기가 갈라지는 역사 어드벤처입니다.",
    output: "선택 분기와 결말",
    principle: "1919년 경성을 배경으로 선택지가 이야기와 결말을 바꿉니다.",
    focus: ["선택", "분기", "결말"],
    workLabel: "이야기 시작",
    resultLabel: "이야기 결말",
    storage: "local",
  },
  "ai-invention-lab": {
    kind: "invention",
    promise: "발명 아이디어를 포스터와 실제 사용 장면으로 키웁니다.",
    output: "발표 포스터, 교실 사용 장면, 집 사용 장면",
    principle: "불편한 점을 핵심 기능과 사용 장면으로 바꿉니다.",
    focus: ["발명품 이름", "해결할 불편함", "핵심 기능"],
    workLabel: "이미지 만들기",
    resultLabel: "이미지 결과",
    storage: "download",
    liveAi: "image",
  },
  "seat-shuffle-picker": {
    kind: "seating",
    promise: "명렬표 조건을 지키며 자리를 뽑아 시트에 기록합니다.",
    output: "좌석표와 회차별 자리 기록",
    principle: "명렬표 시트의 배려·짝·고정 조건을 읽어 자리를 뽑고, 좌석표와 기록 탭에 결과를 남깁니다.",
    focus: ["명렬표 조건", "랜덤 배치", "회차 기록"],
    workLabel: "자리 뽑기",
    resultLabel: "좌석표",
    storage: "local",
  },
  "class-suggestion-box": {
    kind: "suggestion",
    promise: "건의가 시트에 쌓이고 승인한 건의만 게시판에 올라옵니다.",
    output: "승인 게시판과 접수 시트",
    principle: "제출된 건의는 접수 시트에 쌓이고, 승인 체크가 켜진 행만 게시판에 공개됩니다.",
    focus: ["익명 접수", "승인 공개", "답변 표시"],
    workLabel: "건의 보내기",
    resultLabel: "건의 게시판",
    storage: "local",
  },
  "boardgame-rental-desk": {
    kind: "rental",
    promise: "대여와 반납이 장부 시트에 기록되고 수량이 자동으로 맞춰집니다.",
    output: "대여 기록 장부와 남은 수량",
    principle: "대여할 때 장부에 한 줄이 추가되고, 반납 체크가 켜지면 수량이 다시 늘어납니다.",
    focus: ["대여 기록", "반납 체크", "수량 계산"],
    workLabel: "대여 시작",
    resultLabel: "대여 장부",
    storage: "local",
  },
  "live-class-poll": {
    kind: "poll",
    promise: "표가 응답 시트에 쌓일 때마다 그래프가 실시간으로 움직입니다.",
    output: "실시간 막대 그래프와 응답 시트",
    principle: "한 사람이 한 표를 던지면 응답 시트에 한 줄이 쌓이고 집계 그래프가 바로 갱신됩니다.",
    focus: ["응답 누적", "실시간 집계", "마감 체크"],
    workLabel: "투표 시작",
    resultLabel: "투표 집계",
    storage: "local",
  },
};

export function getMvpSpec(app: AppItem): MvpSpec | undefined {
  return mvpSpecs[app.slug];
}
