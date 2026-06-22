export type Difficulty = "하" | "중" | "상";

export type DemoField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "file";
  placeholder?: string;
  options?: string[];
};

export type MockResult = {
  title: string;
  summary: string;
  highlights: string[];
  cards: {
    title: string;
    body: string;
  }[];
};

export type DemoExample = {
  values: Record<string, string>;
  fileName?: string;
  resultTitle: string;
  resultLead: string;
  artifactLabel: string;
  artifactTitle: string;
  artifactSubtitle: string;
  artifactNotes: string[];
};

export type AppItem = {
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  longDescription: string;
  thumbnail: string;
  previewImages: string[];
  tags: string[];
  targetGrade: string;
  difficulty: Difficulty;
  buildBasis: string;
  lessonUse: string;
  demoType: string;
  route: string;
  externalUrl?: string;
  actionLabel: string;
  fields: DemoField[];
  loadingMessages: string[];
  mockResult: MockResult;
};

const allApps: AppItem[] = [
  {
    slug: "author-meet-chatbot",
    title: "작가와의 만남 챗봇",
    category: "AI 챗봇",
    shortDescription:
      "입력한 작품 텍스트를 바탕으로 작가와 대화하듯 질문을 이어가는 챗봇입니다.",
    longDescription:
      "책 강아지똥을 읽은 뒤 학생이 작품 속 장면과 궁금한 점을 넣으면 작가의 말투와 주제 의식에 맞춰 대답합니다. 대화는 한 화면 안에서만 이어지고, 페이지를 나가면 초기화됩니다.",
    thumbnail: "/visuals/generated-thumbnails/author-meet-chatbot.png",
    previewImages: [
      "/visuals/generated-thumbnails/author-meet-chatbot.png",
      "/visuals/class-chatbot-hub-preview.png",
    ],
    tags: ["강아지똥", "작가 대화", "독서 질문"],
    targetGrade: "초3-중1",
    difficulty: "중",
    buildBasis: "작품 텍스트와 한 세션 대화",
    lessonUse: "독서 후 작가 인터뷰와 주제 탐구",
    demoType: "세션 챗봇",
    route: "/apps/author-meet-chatbot",
    actionLabel: "작가와 대화하기",
    fields: [
      {
        id: "topic",
        label: "책",
        type: "text",
        placeholder: "예: 강아지똥",
      },
      {
        id: "level",
        label: "대화 초점",
        type: "select",
        options: ["작가와의 만남", "등장인물", "주제", "표현"],
      },
      {
        id: "notes",
        label: "작품 텍스트",
        type: "textarea",
        placeholder: "작품에서 이야기하고 싶은 문장이나 장면을 적어보세요.",
      },
    ],
    loadingMessages: [
      "작품 텍스트를 읽는 중입니다.",
      "작가의 관점을 맞추는 중입니다.",
      "대화 답변을 쓰는 중입니다.",
    ],
    mockResult: {
      title: "작가와의 대화",
      summary:
        "학생 질문과 작품 텍스트를 바탕으로 한 세션 안에서 이어지는 대화입니다.",
      highlights: ["작품 기반 답변", "한 세션 기억", "대화형 출력"],
      cards: [
        {
          title: "작가 관점",
          body: "작품의 주제와 분위기를 지키며 학생 질문에 답합니다.",
        },
        {
          title: "작품 텍스트",
          body: "학생이 넣은 텍스트를 대화의 근거로 삼습니다.",
        },
        {
          title: "세션 대화",
          body: "페이지 안에서는 이전 질문을 기억하고 이어서 말합니다.",
        },
      ],
    },
  },
  {
    slug: "class-timer-station",
    title: "수업 타이머 스테이션",
    category: "수업 운영",
    shortDescription:
      "모둠 활동, 발표, 정리 시간을 한 화면에서 진행하는 교실 타이머입니다.",
    longDescription:
      "교사가 활동 이름과 시간을 입력하면 단계별 진행 화면과 발표 순서를 바로 띄울 수 있습니다. 자주 쓰는 타이머를 저장해 두고 수업 중 빠르게 전환합니다.",
    thumbnail: "/visuals/generated-thumbnails/class-timer-station.png",
    previewImages: [
      "/visuals/generated-thumbnails/class-timer-station.png",
      "/visuals/class-timer-station-preview.png",
    ],
    tags: ["타이머", "모둠 활동", "발표 순서"],
    targetGrade: "초3-중3",
    difficulty: "하",
    buildBasis: "교실 화면 타이머",
    lessonUse: "활동 시간 안내와 발표 순서 운영",
    demoType: "정적 인터랙션",
    route: "/apps/class-timer-station",
    actionLabel: "타이머 보드 만들기",
    fields: [
      {
        id: "topic",
        label: "활동 이름",
        type: "text",
        placeholder: "예: 우리 모둠 해결책 발표",
      },
      {
        id: "level",
        label: "진행 시간",
        type: "select",
        options: ["5분", "10분", "15분", "20분"],
      },
      {
        id: "notes",
        label: "진행 안내",
        type: "textarea",
        placeholder: "학생에게 보여줄 안내 문장을 입력하세요.",
      },
    ],
    loadingMessages: [
      "활동 시간을 맞추는 중입니다.",
      "발표 순서를 준비하는 중입니다.",
      "교실 화면을 여는 중입니다.",
    ],
    mockResult: {
      title: "활동 보드",
      summary:
        "활동 시작, 중간 점검, 발표 준비가 한 화면에 보이는 타이머 보드입니다.",
      highlights: ["단계별 시간 표시", "발표 순서 카드", "마무리 질문"],
      cards: [
        {
          title: "아이디어",
          body: "모둠별 아이디어를 쓰고 역할을 나눕니다.",
        },
        {
          title: "핵심 의견",
          body: "핵심 의견을 한 문장으로 고릅니다.",
        },
        {
          title: "발표",
          body: "발표자는 결과를 30초 안에 공유합니다.",
        },
      ],
    },
  },
  {
    slug: "concept-explainer",
    title: "개념 설명기",
    category: "수업 도구",
    shortDescription:
      "모르는 단어나 문장을 수업 맥락에 맞춰 쉽게 설명합니다.",
    longDescription:
      "학생이 수업 중 어려운 단어나 이해가 안 되는 문장을 입력하면 학년과 상황에 맞춰 쉬운 설명, 예시, 헷갈리는 점을 보여줍니다. 핵심 내용만 보거나 자세한 설명으로 바꿔 볼 수 있습니다.",
    thumbnail: "/visuals/generated-thumbnails/concept-explainer.png",
    previewImages: [
      "/visuals/generated-thumbnails/concept-explainer.png",
      "/visuals/ai-question-helper-preview.png",
    ],
    tags: ["단어 설명", "문장 풀이", "학습 질문"],
    targetGrade: "초3-중3",
    difficulty: "하",
    buildBasis: "학생 질문과 수업 맥락",
    lessonUse: "수업 중 단어와 문장 이해",
    demoType: "즉시 생성형",
    route: "/apps/concept-explainer",
    actionLabel: "질문하기",
    fields: [
      {
        id: "topic",
        label: "궁금한 내용",
        type: "text",
        placeholder: "예: 경도 / 증발 / 기후가 왜 달라져요?",
      },
      {
        id: "level",
        label: "학년",
        type: "select",
        options: ["초등 저학년", "초등 고학년", "중학생", "고등학생"],
      },
      {
        id: "sourceSentence",
        label: "어디에서 봤나요",
        type: "textarea",
        placeholder: "예: 지난 시간에 위도를 배우고 오늘 경도를 배웠어요.",
      },
      {
        id: "notes",
        label: "배우는 내용",
        type: "textarea",
        placeholder: "예: 과학 시간에 물의 상태 변화를 배우고 있어요.",
      },
    ],
    loadingMessages: [
      "질문을 읽는 중입니다.",
      "수업 맥락을 살피는 중입니다.",
      "쉬운 설명을 쓰는 중입니다.",
    ],
    mockResult: {
      title: "증발은 액체가 기체로 바뀌는 일이에요",
      summary:
        "물이 수증기가 되어 공기 중으로 퍼지는 현상을 젖은 수건 장면으로 확인합니다.",
      highlights: ["뜻", "예시", "헷갈리지 않기"],
      cards: [
        {
          title: "뜻",
          body: "액체가 눈에 잘 보이지 않는 기체가 되어 공기 중으로 퍼지는 현상이에요.",
        },
        {
          title: "예시",
          body: "젖은 수건이 마르는 것은 물이 증발해서 공기 중으로 퍼지기 때문이에요.",
        },
        {
          title: "헷갈리지 않기",
          body: "물이 없어진 것이 아니라 모습이 바뀐 거예요.",
        },
      ],
    },
  },
  {
    slug: "english-vocab-cards",
    title: "영단어 카드 암기",
    category: "영어",
    shortDescription:
      "영단어, 뜻, 예문을 앞뒤 카드로 넘기며 암기합니다.",
    longDescription:
      "단어와 뜻을 입력하면 학습 카드 덱이 만들어집니다. 카드를 눌러 뜻과 예문을 확인하고, 외운 단어를 체크하며 복습 목록을 줄여갑니다.",
    thumbnail: "/visuals/generated-thumbnails/english-vocab-cards.png",
    previewImages: [
      "/visuals/generated-thumbnails/english-vocab-cards.png",
      "/visuals/quiz-card-builder-preview.png",
    ],
    tags: ["영단어", "암기 카드", "복습"],
    targetGrade: "초3-중3",
    difficulty: "하",
    buildBasis: "브라우저에서 바로 실행",
    lessonUse: "단어 암기와 짧은 복습",
    demoType: "플래시카드",
    route: "/apps/english-vocab-cards",
    actionLabel: "암기 카드 열기",
    fields: [
      {
        id: "topic",
        label: "단어",
        type: "text",
        placeholder: "예: harvest",
      },
      {
        id: "notes",
        label: "뜻",
        type: "text",
        placeholder: "예: 수확하다",
      },
      {
        id: "level",
        label: "묶음",
        type: "select",
        options: ["기본 단어", "교과서 단어", "오늘의 단어", "시험 대비"],
      },
    ],
    loadingMessages: [
      "단어 카드를 여는 중입니다.",
      "뜻 보기 화면을 준비하는 중입니다.",
      "복습 목록을 만드는 중입니다.",
    ],
    mockResult: {
      title: "영단어 카드",
      summary:
        "단어, 뜻, 예문, 암기 상태가 함께 보이는 플래시카드 화면입니다.",
      highlights: ["단어 앞면", "뜻 뒷면", "암기 체크"],
      cards: [
        {
          title: "단어 앞면",
          body: "영단어를 크게 보여줍니다.",
        },
        {
          title: "뜻 뒷면",
          body: "클릭하면 뜻과 예문을 확인합니다.",
        },
        {
          title: "암기 상태",
          body: "알고 있는 단어를 체크해 복습할 단어를 남깁니다.",
        },
      ],
    },
  },
  {
    slug: "addition-card-match-game",
    title: "덧셈 카드 뒤집기",
    category: "수학",
    shortDescription:
      "한 자리 수 덧셈식 카드와 정답 카드를 뒤집어 짝을 맞힙니다.",
    longDescription:
      "1~2학년 학생이 식 카드 8장과 정답 카드 8장을 섞은 보드에서 같은 값을 찾아 짝짓는 활동입니다. 카드를 두 장씩 뒤집고, 맞으면 고정되며 모든 짝을 찾으면 활동이 끝납니다.",
    thumbnail: "/visuals/generated-thumbnails/english-vocab-cards.png",
    previewImages: [
      "/visuals/generated-thumbnails/english-vocab-cards.png",
      "/visuals/quiz-card-builder-preview.png",
    ],
    tags: ["덧셈", "카드뒤집기", "1-2학년"],
    targetGrade: "초1-초2",
    difficulty: "하",
    buildBasis: "브라우저에서 바로 실행",
    lessonUse: "한 자리 수 덧셈 짝 맞추기",
    demoType: "카드 뒤집기 게임",
    route: "/apps/addition-card-match-game",
    actionLabel: "덧셈 게임 열기",
    fields: [
      {
        id: "topic",
        label: "활동",
        type: "text",
        placeholder: "예: 한 자리 수 덧셈",
      },
      {
        id: "level",
        label: "학년",
        type: "select",
        options: ["1학년", "2학년", "1-2학년"],
      },
      {
        id: "notes",
        label: "활동 안내",
        type: "textarea",
        placeholder: "식 카드와 정답 카드를 하나씩 골라 짝을 맞혀요.",
      },
    ],
    loadingMessages: [
      "덧셈 카드를 섞는 중입니다.",
      "정답 카드를 준비하는 중입니다.",
      "짝 맞추기 보드를 여는 중입니다.",
    ],
    mockResult: {
      title: "덧셈 카드 게임",
      summary:
        "식 카드 8장과 정답 카드 8장을 뒤집어 같은 값을 찾는 짝 맞추기 보드입니다.",
      highlights: ["식 카드 8장", "정답 카드 8장", "짝 맞추기"],
      cards: [
        {
          title: "식 카드",
          body: "1+3, 2+4처럼 한 자리 수 덧셈식을 보여줍니다.",
        },
        {
          title: "정답 카드",
          body: "3, 4, 5, 6처럼 계산 결과를 보여줍니다.",
        },
        {
          title: "짝 맞추기",
          body: "식과 정답이 맞으면 카드가 고정됩니다.",
        },
      ],
    },
  },
  {
    slug: "history-typing-rain",
    title: "역사 타자 방어전",
    category: "역사",
    shortDescription:
      "하늘에서 떨어지는 역사 단어를 성벽에 닿기 전에 입력하는 타자 게임입니다.",
    longDescription:
      "고조선, 훈민정음, 임진왜란 같은 역사 핵심어가 위에서 내려옵니다. 학생은 단어를 빠르게 입력해 점수와 콤보를 얻고, 놓친 단어가 성벽에 닿으면 생명이 줄어듭니다.",
    thumbnail: "/visuals/generated-thumbnails/history-typing-rain.png",
    previewImages: [
      "/visuals/generated-thumbnails/history-typing-rain.png",
      "/visuals/landing-previews/history-typing-rain.png",
    ],
    tags: ["역사", "타자게임", "핵심어"],
    targetGrade: "초5-중3",
    difficulty: "중",
    buildBasis: "브라우저에서 바로 실행",
    lessonUse: "역사 핵심어 복습과 집중 활동",
    demoType: "타자 아케이드",
    route: "/apps/history-typing-rain",
    actionLabel: "타자 게임 시작",
    fields: [
      {
        id: "topic",
        label: "시대",
        type: "text",
        placeholder: "예: 조선",
      },
      {
        id: "level",
        label: "난이도",
        type: "select",
        options: ["천천히", "보통", "빠르게", "도전"],
      },
      {
        id: "notes",
        label: "핵심어",
        type: "textarea",
        placeholder: "예: 훈민정음, 임진왜란, 수원화성",
      },
    ],
    loadingMessages: [
      "역사 단어를 고르는 중입니다.",
      "성벽을 세우는 중입니다.",
      "타자 게임을 시작하는 중입니다.",
    ],
    mockResult: {
      title: "역사 타자 방어전",
      summary:
        "떨어지는 역사 핵심어를 입력해 점수와 콤보를 얻는 복습 게임입니다.",
      highlights: ["낙하 단어", "타자 입력", "점수 콤보"],
      cards: [
        {
          title: "낙하 단어",
          body: "역사 핵심어가 서로 다른 속도로 내려옵니다.",
        },
        {
          title: "성벽 방어",
          body: "단어가 바닥에 닿기 전에 정확히 입력합니다.",
        },
        {
          title: "복습 기록",
          body: "점수, 콤보, 정확도로 학습 집중도를 확인합니다.",
        },
      ],
    },
  },
  {
    slug: "reading-passport-stampbook",
    title: "독서여권 스탬프북",
    category: "독서교육",
    shortDescription:
      "읽은 책과 생각을 기록하고 독서여권 스탬프를 받는 앱입니다.",
    longDescription:
      "학생이 책 제목, 나라 또는 장르, 생각 문장을 입력하면 여권형 기록 카드가 완성됩니다. 저장 기능 없이도 독서 활동 화면을 만들 수 있습니다.",
    thumbnail: "/visuals/generated-thumbnails/reading-passport-stampbook.png",
    previewImages: [
      "/visuals/generated-thumbnails/reading-passport-stampbook.png",
      "/visuals/reading-passport-stampbook-preview.png",
    ],
    tags: ["독서 기록", "스탬프", "세계시민"],
    targetGrade: "초3-중2",
    difficulty: "하",
    buildBasis: "HTML, CSS, JavaScript",
    lessonUse: "독후 활동 기록과 공유",
    demoType: "정적 기록장",
    route: "/apps/reading-passport-stampbook",
    actionLabel: "독서여권 만들기",
    fields: [
      {
        id: "topic",
        label: "책 제목",
        type: "text",
        placeholder: "예: 긴긴밤",
      },
      {
        id: "level",
        label: "여권 구역",
        type: "select",
        options: ["우리 동네", "아시아", "아프리카", "상상 세계"],
      },
      {
        id: "notes",
        label: "남기고 싶은 문장",
        type: "textarea",
        placeholder: "책을 읽고 떠오른 생각을 적어보세요.",
      },
    ],
    loadingMessages: [
      "여권 기록면을 준비하는 중입니다.",
      "생각 문장을 담는 중입니다.",
      "스탬프를 찍는 중입니다.",
    ],
    mockResult: {
      title: "독서여권 기록",
      summary:
        "책 정보, 생각 문장, 다음 독서 질문이 담긴 여권형 기록 카드입니다.",
      highlights: ["읽은 책 기록", "생각 문장", "다음 질문"],
      cards: [
        {
          title: "여권 스탬프",
          body: "오늘의 독서 여정이 한 장의 스탬프로 남습니다.",
        },
        {
          title: "생각 질문",
          body: "등장인물의 선택을 내 생활과 연결해 봅니다.",
        },
        {
          title: "공유 문장",
          body: "친구에게 추천하고 싶은 한 장면을 고릅니다.",
        },
      ],
    },
  },
  {
    slug: "cardnews-campaign-maker",
    title: "카드뉴스 캠페인 메이커",
    category: "사회",
    shortDescription:
      "사회 문제를 4장짜리 카드뉴스 캠페인 초안으로 바꿔줍니다.",
    longDescription:
      "학생이 주제, 대상, 주장을 입력하면 문제 제기, 근거, 참여 요청 카드가 완성됩니다.",
    thumbnail: "/visuals/generated-thumbnails/cardnews-campaign-maker.png",
    previewImages: [
      "/visuals/generated-thumbnails/cardnews-campaign-maker.png",
      "/visuals/cardnews-campaign-maker-preview.png",
    ],
    tags: ["사회 문제", "국어", "캠페인"],
    targetGrade: "초5-고1",
    difficulty: "하",
    buildBasis: "HTML, CSS, JavaScript",
    lessonUse: "사회 참여 프로젝트와 설득 글쓰기",
    demoType: "정적 템플릿",
    route: "/apps/cardnews-campaign-maker",
    actionLabel: "카드뉴스 초안 만들기",
    fields: [
      {
        id: "topic",
        label: "캠페인 주제",
        type: "text",
        placeholder: "예: 학교 주변 쓰레기 줄이기",
      },
      {
        id: "level",
        label: "대상",
        type: "select",
        options: ["우리 반", "전교생", "학부모", "지역 주민"],
      },
      {
        id: "notes",
        label: "핵심 주장",
        type: "textarea",
        placeholder: "우리가 전하고 싶은 주장을 입력하세요.",
      },
    ],
    loadingMessages: [
      "카드 문장을 고르는 중입니다.",
      "주장과 근거를 나누는 중입니다.",
      "참여 요청 문장을 고르는 중입니다.",
    ],
    mockResult: {
      title: "4장 카드뉴스",
      summary:
        "문제, 근거, 해결 방법, 참여 요청이 이어지는 캠페인 카드 초안입니다.",
      highlights: ["문제 제기", "근거 카드", "참여 요청"],
      cards: [
        {
          title: "1장 문제",
          body: "지금 우리 주변에서 보이는 문제를 한눈에 보여줍니다.",
        },
        {
          title: "2장 근거",
          body: "왜 이 문제가 중요한지 수치와 사례로 설명합니다.",
        },
        {
          title: "3장 행동",
          body: "학생이 바로 실천할 수 있는 방법을 제안합니다.",
        },
      ],
    },
  },
  {
    slug: "science-experiment-cards",
    title: "과학 실험 절차 카드",
    category: "과학",
    shortDescription:
      "실험 주제를 단계, 관찰 포인트, 생각 질문 카드로 나눕니다.",
    longDescription:
      "실험 안내를 학생용 카드로 바꾸는 기본형 앱입니다. 조건문과 배열만으로도 실험 절차 화면을 만들 수 있습니다.",
    thumbnail: "/visuals/generated-thumbnails/science-experiment-cards.png",
    previewImages: [
      "/visuals/generated-thumbnails/science-experiment-cards.png",
      "/visuals/science-experiment-cards-preview.png",
    ],
    tags: ["탐구", "실험", "관찰"],
    targetGrade: "초4-중2",
    difficulty: "하",
    buildBasis: "HTML, CSS, JavaScript",
    lessonUse: "실험 전 안내와 관찰 기록",
    demoType: "정적 단계 카드",
    route: "/apps/science-experiment-cards",
    actionLabel: "실험 카드 만들기",
    fields: [
      {
        id: "topic",
        label: "실험 주제",
        type: "text",
        placeholder: "예: 물의 상태 변화",
      },
      {
        id: "level",
        label: "탐구 방식",
        type: "select",
        options: ["관찰", "비교", "측정", "분류"],
      },
      {
        id: "notes",
        label: "주의할 점",
        type: "textarea",
        placeholder: "안전 안내나 준비물을 입력하세요.",
      },
    ],
    loadingMessages: [
      "실험 단계를 나누는 중입니다.",
      "관찰 포인트를 고르는 중입니다.",
      "생각 질문을 붙이는 중입니다.",
    ],
    mockResult: {
      title: "탐구 절차 카드",
      summary:
        "준비, 관찰, 기록, 생각 질문으로 이어지는 실험 안내 카드입니다.",
      highlights: ["준비물", "관찰 포인트", "생각 질문"],
      cards: [
        {
          title: "준비",
          body: "실험 도구와 안전 약속을 확인합니다.",
        },
        {
          title: "관찰",
          body: "변하는 모습과 그대로인 조건을 나눠 기록합니다.",
        },
        {
          title: "질문",
          body: "결과가 달라졌다면 어떤 조건이 영향을 주었는지 생각합니다.",
        },
      ],
    },
  },
  {
    slug: "picturebook-scene-maker",
    title: "그림책 장면 제작기",
    category: "AI 이미지",
    shortDescription:
      "주제, 인물, 배경을 한 장의 그림책 장면으로 보여줍니다.",
    longDescription:
      "이미지 생성 API를 연결하면 학생의 이야기 설정을 그림책 장면으로 바꿀 수 있습니다. 쇼룸에서는 미리 준비한 예시 장면을 체험합니다.",
    thumbnail: "/visuals/generated-thumbnails/picturebook-scene-maker.png",
    previewImages: [
      "/visuals/generated-thumbnails/picturebook-scene-maker.png",
      "/visuals/picturebook-scene-maker-preview.png",
    ],
    tags: ["이미지 생성", "국어", "창작"],
    targetGrade: "초2-중1",
    difficulty: "중",
    buildBasis: "시 문장과 장면 묘사",
    lessonUse: "이야기 쓰기와 장면 상상",
    demoType: "이미지 생성형",
    route: "/apps/picturebook-scene-maker",
    actionLabel: "그림책 장면 만들기",
    fields: [
      {
        id: "topic",
        label: "이야기 주제",
        type: "text",
        placeholder: "예: 비 오는 날 길을 잃은 달팽이",
      },
      {
        id: "level",
        label: "장면 분위기",
        type: "select",
        options: ["따뜻함", "모험", "몽환", "유쾌함"],
      },
      {
        id: "notes",
        label: "등장인물과 배경",
        type: "textarea",
        placeholder: "주인공, 장소, 색감을 적어보세요.",
      },
    ],
    loadingMessages: [
      "장면 구도를 잡는 중입니다.",
      "인물과 배경을 맞추는 중입니다.",
      "그림책 문장을 붙이는 중입니다.",
    ],
    mockResult: {
      title: "그림책 한 장면",
      summary:
        "이야기 설정을 바탕으로 장면 이미지와 짧은 그림책 문장이 만들어졌습니다.",
      highlights: ["장면 이미지", "그림책 문장", "다음 장면 질문"],
      cards: [
        {
          title: "장면 문장",
          body: "주인공은 작지만 선명한 발자국을 따라 새로운 길을 찾습니다.",
        },
        {
          title: "그림 요소",
          body: "전경에는 주인공, 배경에는 수업 주제가 드러나는 물건을 둡니다.",
        },
        {
          title: "다음 질문",
          body: "이 장면 다음에 주인공은 누구를 만나게 될까요?",
        },
      ],
    },
  },
  {
    slug: "poetry-picture-maker",
    title: "시화 제작",
    category: "AI 이미지",
    shortDescription:
      "작가, 작품명, 시, 장면 묘사를 한 장의 시화 이미지로 만듭니다.",
    longDescription:
      "작가와 작품명, 시 전문 또는 일부, 장면 묘사를 입력하면 시의 정서와 장면이 함께 살아나는 시화 이미지를 생성합니다. 결과 화면에는 시 문장과 이미지가 한 장의 작품처럼 배치됩니다.",
    thumbnail: "/visuals/generated-thumbnails/poetry-picture-maker.png",
    previewImages: [
      "/visuals/poetry/rain-playground-poetry-poster.png",
      "/visuals/generated-thumbnails/poetry-picture-maker.png",
    ],
    tags: ["시화", "이미지 생성", "문학"],
    targetGrade: "초4-고2",
    difficulty: "중",
    buildBasis: "시 문장과 장면 묘사",
    lessonUse: "시 감상과 장면 상상 표현",
    demoType: "이미지 생성형",
    route: "/apps/poetry-picture-maker",
    actionLabel: "시화 만들기",
    fields: [
      {
        id: "author",
        label: "작가",
        type: "text",
        placeholder: "예: 권정생",
      },
      {
        id: "topic",
        label: "작품명",
        type: "text",
        placeholder: "예: 강아지똥",
      },
      {
        id: "poem",
        label: "시",
        type: "textarea",
        placeholder: "시 문장을 입력하세요.",
      },
      {
        id: "notes",
        label: "장면 묘사",
        type: "textarea",
        placeholder: "색감, 계절, 배경, 중심 장면을 적어보세요.",
      },
    ],
    loadingMessages: [
      "시의 정서를 읽는 중입니다.",
      "장면과 문장을 맞추는 중입니다.",
      "시화 이미지를 만드는 중입니다.",
    ],
    mockResult: {
      title: "시화 이미지",
      summary:
        "시 문장과 장면 묘사가 함께 보이는 문학 감상 이미지입니다.",
      highlights: ["시 문장", "장면 묘사", "작품 분위기"],
      cards: [
        {
          title: "시의 정서",
          body: "작품의 분위기를 색감과 빛으로 표현합니다.",
        },
        {
          title: "중심 장면",
          body: "학생이 적은 장면 묘사를 이미지의 중심 구도로 삼습니다.",
        },
        {
          title: "시 문장",
          body: "짧은 시 구절이 이미지 안에서 읽히도록 배치합니다.",
        },
      ],
    },
  },
  {
    slug: "ai-question-helper",
    title: "AI 활동지 메이커",
    category: "AI 수업 도구",
    shortDescription:
      "수업 주제에서 바로 쓰는 활동지 문항과 안내를 만듭니다.",
    longDescription:
      "수업 주제와 학년, 활동 목표를 바탕으로 도입, 개념 확인, 적용, 마무리 활동을 한 장짜리 활동지 흐름으로 만듭니다. 교사가 바로 다듬어 배포할 수 있는 학생용 문항과 체크 포인트를 함께 제공합니다.",
    thumbnail: "/visuals/generated-thumbnails/ai-question-helper.png",
    previewImages: [
      "/visuals/generated-thumbnails/ai-question-helper.png",
      "/visuals/ai-question-helper-detail-preview.png",
    ],
    tags: ["활동지", "수업자료", "평가"],
    targetGrade: "초3-고2",
    difficulty: "중",
    buildBasis: "브라우저에서 바로 실행",
    lessonUse: "수업 활동지 초안과 형성평가",
    demoType: "활동지 생성형",
    route: "/apps/ai-question-helper",
    externalUrl: "https://ai-catchmind-gge7lcpcca-du.a.run.app/",
    actionLabel: "앱 체험하기",
    fields: [
      {
        id: "topic",
        label: "수업 주제",
        type: "text",
        placeholder: "예: 물의 순환",
      },
      {
        id: "level",
        label: "활동 유형",
        type: "select",
        options: ["개념 확인", "탐구 활동", "토론 활동", "형성평가"],
      },
      {
        id: "notes",
        label: "학년과 목표",
        type: "textarea",
        placeholder: "예: 초등 5학년, 증발과 응결을 생활 예시로 이해하기",
      },
    ],
    loadingMessages: [
      "수업 흐름을 잡는 중입니다.",
      "학생 활동을 고르는 중입니다.",
      "활동지 문항을 만드는 중입니다.",
    ],
    mockResult: {
      title: "수업 활동지",
      summary:
        "도입, 개념 확인, 적용, 마무리로 이어지는 활동지 초안입니다.",
      highlights: ["도입 활동", "개념 확인", "마무리 점검"],
      cards: [
        {
          title: "도입",
          body: "오늘 배울 주제와 연결되는 생활 장면을 떠올립니다.",
        },
        {
          title: "개념 확인",
          body: "핵심 낱말을 자기 말로 설명하고 예시를 붙입니다.",
        },
        {
          title: "마무리",
          body: "수업 목표에 맞는 짧은 확인 문항으로 이해를 점검합니다.",
        },
      ],
    },
  },
  {
    slug: "presentation-feedback-coach",
    title: "발표 피드백 코치",
    category: "AI 챗봇",
    shortDescription:
      "발표 대본을 장점, 보완점, 더 좋은 표현으로 나눠 보여줍니다.",
    longDescription:
      "챗봇 API를 연결하면 학생 발표문에 맞춘 피드백을 줄 수 있습니다. 쇼룸에서는 대본 일부를 결과에 반영해 실제 피드백 화면처럼 체험합니다.",
    thumbnail: "/visuals/generated-thumbnails/presentation-feedback-coach.png",
    previewImages: [
      "/visuals/generated-thumbnails/presentation-feedback-coach.png",
      "/visuals/presentation-feedback-coach-preview.png",
    ],
    tags: ["발표", "피드백", "국어"],
    targetGrade: "초5-고3",
    difficulty: "중",
    buildBasis: "챗봇 API 키",
    lessonUse: "발표 연습과 말하기 평가",
    demoType: "텍스트 피드백형",
    route: "/apps/presentation-feedback-coach",
    actionLabel: "피드백 받기",
    fields: [
      {
        id: "topic",
        label: "발표 주제",
        type: "text",
        placeholder: "예: 우리 동네 하천을 지키는 방법",
      },
      {
        id: "level",
        label: "피드백 초점",
        type: "select",
        options: ["내용", "표현", "구조", "전달력"],
      },
      {
        id: "notes",
        label: "발표 대본",
        type: "textarea",
        placeholder: "발표문 일부를 입력하세요.",
      },
    ],
    loadingMessages: [
      "발표 문장을 읽는 중입니다.",
      "강점을 찾는 중입니다.",
      "바꿔 말할 문장을 고르는 중입니다.",
    ],
    mockResult: {
      title: "발표 피드백",
      summary:
        "좋은 점, 보완할 점, 다시 말해볼 문장이 한 화면에 나뉘어 표시됩니다.",
      highlights: ["장점", "보완점", "수정 문장"],
      cards: [
        {
          title: "잘한 점",
          body: "주제와 관련된 생활 사례가 있어 듣는 사람이 쉽게 따라옵니다.",
        },
        {
          title: "보완할 점",
          body: "마지막 문장에 실천 요청을 더하면 발표 목적이 분명해집니다.",
        },
        {
          title: "다시 말하기",
          body: "그래서 우리는 오늘부터 한 가지 행동을 함께 시작할 수 있습니다.",
        },
      ],
    },
  },
  {
    slug: "ai-invention-lab",
    title: "AI 발명 설계소",
    category: "AI 이미지",
    shortDescription:
      "발명 아이디어를 발표 포스터와 실제 사용 장면으로 보여줍니다.",
    longDescription:
      "학생이 그린 스케치와 문제 상황을 바탕으로 발명품 포스터와 실사 사용 예시 이미지를 만듭니다. 메이커 수업과 프로젝트 발표에 어울립니다.",
    thumbnail: "/visuals/generated-thumbnails/ai-invention-lab.png",
    previewImages: [
      "/visuals/invention/auto-watering-planter-classroom.png",
      "/visuals/invention/auto-watering-planter-balcony.png",
    ],
    tags: ["발명", "이미지 생성", "프로젝트"],
    targetGrade: "초5-중3",
    difficulty: "중",
    buildBasis: "스케치와 발명 아이디어",
    lessonUse: "메이커 수업과 프로젝트 발표",
    demoType: "이미지 생성형",
    route: "/apps/ai-invention-lab",
    actionLabel: "이미지 생성하기",
    fields: [
      {
        id: "upload",
        label: "아이디어 스케치",
        type: "file",
      },
      {
        id: "topic",
        label: "발명품 이름",
        type: "text",
        placeholder: "예: 자동 급수 화분",
      },
      {
        id: "notes",
        label: "해결하고 싶은 불편함",
        type: "textarea",
        placeholder: "어떤 불편함을 해결하고 싶은지 적어보세요.",
      },
    ],
    loadingMessages: [
      "아이디어 스케치를 읽는 중입니다.",
      "문제 상황과 기능을 연결하는 중입니다.",
      "이미지 결과를 여는 중입니다.",
    ],
    mockResult: {
      title: "발명 이미지 결과",
      summary:
        "문제 상황, 핵심 기능, 포스터와 사용 장면이 포함된 발명 결과입니다.",
      highlights: ["발표 포스터", "교실 사용 장면", "집 사용 장면"],
      cards: [
        {
          title: "핵심 기능",
          body: "센서로 상황을 감지하고 필요한 동작을 자동으로 실행합니다.",
        },
        {
          title: "사용 장면",
          body: "학생의 생활 속 불편함을 줄이는 교실용 발명품으로 소개합니다.",
        },
        {
          title: "발표 문장",
          body: "이 발명품은 작은 불편을 스스로 해결하도록 돕는 생활 과학 도구입니다.",
        },
      ],
    },
  },
  {
    slug: "safety-webtoon-maker",
    title: "생활 안전 웹툰 생성기",
    category: "AI 이미지",
    shortDescription:
      "생활 안전 주제를 4컷 웹툰으로 보여주는 앱입니다.",
    longDescription:
      "텍스트와 이미지 API를 연결하면 주제에 맞춘 웹툰 장면을 만들 수 있습니다. 생활지도, 보건, 안전교육에서 바로 응용할 수 있습니다.",
    thumbnail: "/visuals/generated-thumbnails/safety-webtoon-maker.png",
    previewImages: [
      "/visuals/generated-thumbnails/safety-webtoon-maker.png",
      "/visuals/safety-webtoon-maker-preview.png",
    ],
    tags: ["생활지도", "웹툰", "안전교육"],
    targetGrade: "초1-중2",
    difficulty: "중",
    buildBasis: "이미지 생성 API 키",
    lessonUse: "안전 규칙 만들기와 역할극",
    demoType: "이미지 생성형",
    route: "/apps/safety-webtoon-maker",
    actionLabel: "웹툰 만들기",
    fields: [
      {
        id: "topic",
        label: "안전 주제",
        type: "text",
        placeholder: "예: 복도에서 뛰지 않기",
      },
      {
        id: "level",
        label: "상황",
        type: "select",
        options: ["교실", "복도", "운동장", "등하굣길"],
      },
      {
        id: "notes",
        label: "등장인물",
        type: "textarea",
        placeholder: "등장인물과 안전 메시지를 입력하세요.",
      },
    ],
    loadingMessages: [
      "4컷 장면을 나누는 중입니다.",
      "안전 행동을 강조하는 중입니다.",
      "마지막 메시지를 고르는 중입니다.",
    ],
    mockResult: {
      title: "4컷 안전 웹툰",
      summary:
        "위험 상황에서 바른 행동으로 이어지는 웹툰 장면 초안입니다.",
      highlights: ["문제 상황", "위험 인식", "안전 메시지"],
      cards: [
        {
          title: "1컷",
          body: "학생이 익숙한 장소에서 위험 행동을 마주합니다.",
        },
        {
          title: "2컷",
          body: "친구가 위험을 알아차리고 멈춤 신호를 보냅니다.",
        },
        {
          title: "3-4컷",
          body: "바른 행동과 안전 문구가 함께 보입니다.",
        },
      ],
    },
  },
  {
    slug: "project-portfolio-studio",
    title: "탐구 프로젝트 포트폴리오",
    category: "프로젝트 학습",
    shortDescription:
      "팀별 산출물, 피드백, 발표 자료를 한곳에 모으는 프로젝트 앱입니다.",
    longDescription:
      "팀별 할 일, 자료 링크, 피드백을 저장하는 프로젝트 보드입니다. 로컬 저장과 파일 링크만으로도 수업용 MVP를 만들 수 있습니다.",
    thumbnail: "/visuals/generated-thumbnails/project-portfolio-studio.png",
    previewImages: [
      "/visuals/generated-thumbnails/project-portfolio-studio.png",
      "/visuals/project-portfolio-studio-preview.png",
    ],
    tags: ["포트폴리오", "협업", "저장소"],
    targetGrade: "초5-고3",
    difficulty: "중",
    buildBasis: "로컬 저장, 파일 링크, 선택형 DB",
    lessonUse: "팀 프로젝트 산출물 관리",
    demoType: "프로젝트형",
    route: "/apps/project-portfolio-studio",
    actionLabel: "포트폴리오 보드 보기",
    fields: [
      {
        id: "topic",
        label: "프로젝트 주제",
        type: "text",
        placeholder: "예: 학교 텃밭 개선 프로젝트",
      },
      {
        id: "level",
        label: "진행 단계",
        type: "select",
        options: ["탐구 계획", "자료 수집", "시제품 제작", "발표 준비"],
      },
      {
        id: "notes",
        label: "팀 목표",
        type: "textarea",
        placeholder: "팀이 이번 주에 달성할 목표를 입력하세요.",
      },
    ],
    loadingMessages: [
      "팀 보드를 여는 중입니다.",
      "산출물 칸을 준비하는 중입니다.",
      "피드백 카드를 연결하는 중입니다.",
    ],
    mockResult: {
      title: "팀 포트폴리오 보드",
      summary:
        "계획, 자료, 산출물, 피드백이 한 프로젝트 보드에 모였습니다.",
      highlights: ["팀별 저장", "피드백", "발표 자료"],
      cards: [
        {
          title: "계획",
          body: "팀 목표와 역할을 카드로 고정합니다.",
        },
        {
          title: "산출물",
          body: "사진, 문서, 링크를 차시별로 저장합니다.",
        },
        {
          title: "피드백",
          body: "교사와 친구 의견을 다음 할 일로 연결합니다.",
        },
      ],
    },
  },
  {
    slug: "local-issue-data-map",
    title: "지역 문제 데이터 맵",
    category: "사회",
    shortDescription:
      "지역 데이터를 지도와 카드로 연결해 탐구 주제를 보여줍니다.",
    longDescription:
      "지도 API와 학생 관찰 기록을 연결하는 지역 탐구 앱입니다. 지도 마커와 CSV 저장만으로도 수업용 MVP를 만들 수 있습니다.",
    thumbnail: "/visuals/generated-thumbnails/local-issue-data-map.png",
    previewImages: [
      "/visuals/generated-thumbnails/local-issue-data-map.png",
      "/visuals/local-issue-data-map-preview.png",
    ],
    tags: ["지도", "공공데이터", "지역 탐구"],
    targetGrade: "초6-고3",
    difficulty: "중",
    buildBasis: "지도 API, CSV, 공공데이터 API",
    lessonUse: "지역 문제 탐구와 데이터 리터러시",
    demoType: "외부 데이터 연동형",
    route: "/apps/local-issue-data-map",
    actionLabel: "데이터 맵 보기",
    fields: [
      {
        id: "topic",
        label: "탐구할 지역 문제",
        type: "text",
        placeholder: "예: 학교 주변 횡단보도 안전",
      },
      {
        id: "level",
        label: "데이터 종류",
        type: "select",
        options: ["안전", "환경", "교통", "복지"],
      },
      {
        id: "notes",
        label: "관찰한 장소",
        type: "textarea",
        placeholder: "지도에 표시할 장소나 관찰 내용을 입력하세요.",
      },
    ],
    loadingMessages: [
      "지도 마커를 준비하는 중입니다.",
      "지역 데이터를 맞추는 중입니다.",
      "탐구 카드를 여는 중입니다.",
    ],
    mockResult: {
      title: "지역 데이터 맵",
      summary:
        "지도 마커, 문제 카드, 현장 질문이 함께 보이는 탐구 화면입니다.",
      highlights: ["지도 마커", "데이터 카드", "현장 질문"],
      cards: [
        {
          title: "마커",
          body: "관찰 장소를 지도 위에 표시하고 사진 기록과 연결합니다.",
        },
        {
          title: "데이터",
          body: "공공데이터와 학생 관찰 기록을 같은 기준으로 봅니다.",
        },
        {
          title: "제안",
          body: "학생이 직접 제안할 해결 행동을 카드로 남깁니다.",
        },
      ],
    },
  },
  {
    slug: "class-chatbot-hub",
    title: "학급 챗봇 허브",
    category: "AI 챗봇",
    shortDescription:
      "학급 자료를 기반으로 과목별 챗봇을 운영하는 허브입니다.",
    longDescription:
      "학급 자료와 학생 질문을 연결하는 AI 답변 앱입니다. 텍스트 생성 API와 작은 자료 묶음으로 수업용 MVP를 만들 수 있습니다.",
    thumbnail: "/visuals/generated-thumbnails/class-chatbot-hub.png",
    previewImages: [
      "/visuals/generated-thumbnails/class-chatbot-hub.png",
      "/visuals/class-chatbot-hub-preview.png",
    ],
    tags: ["RAG", "챗봇", "자료 검색"],
    targetGrade: "초5-고3",
    difficulty: "중",
    buildBasis: "LLM API, 자료 텍스트, 로컬 기록",
    lessonUse: "학급 자료 검색과 자기주도 질문",
    demoType: "복합 AI 연동형",
    route: "/apps/class-chatbot-hub",
    actionLabel: "챗봇 허브 보기",
    fields: [
      {
        id: "topic",
        label: "챗봇 역할",
        type: "text",
        placeholder: "예: 과학 탐구 보고서 도우미",
      },
      {
        id: "level",
        label: "연결 자료",
        type: "select",
        options: ["학급 공지", "수업 자료", "프로젝트 문서", "평가 기준"],
      },
      {
        id: "notes",
        label: "학생 질문 예시",
        type: "textarea",
        placeholder: "학생이 자주 묻는 질문을 입력하세요.",
      },
    ],
    loadingMessages: [
      "자료 묶음을 찾는 중입니다.",
      "질문 경로를 연결하는 중입니다.",
      "챗봇 답변 화면을 준비하는 중입니다.",
    ],
    mockResult: {
      title: "학급 챗봇 허브",
      summary:
        "자료 출처, 추천 질문, 답변 카드가 함께 보이는 챗봇 허브입니다.",
      highlights: ["자료 검색", "추천 질문", "권한 관리"],
      cards: [
        {
          title: "자료 기반 답변",
          body: "업로드한 학급 문서에서 근거가 되는 내용을 찾아 답합니다.",
        },
        {
          title: "추천 질문",
          body: "학생 수준에 맞는 다음 질문을 자동으로 제안합니다.",
        },
        {
          title: "운영 화면",
          body: "교사는 자료 공개 범위와 챗봇 역할을 조정합니다.",
        },
      ],
    },
  },
  {
    slug: "economy-education-web",
    title: "경제교육 웹",
    category: "경제교육",
    shortDescription:
      "학생이 예산, 소비, 저축 결정을 직접 조작하는 경제 수업용 웹입니다.",
    longDescription:
      "경제 개념을 설명 카드가 아니라 선택, 결과, 피드백이 있는 웹 활동으로 다룹니다. 별도 프로젝트 링크에서 완성형 화면을 엽니다.",
    thumbnail: "/visuals/generated-thumbnails/economy-education-web.png",
    previewImages: [
      "/visuals/generated-thumbnails/economy-education-web.png",
      "/visuals/landing-previews/economy-education-web.png",
    ],
    tags: ["경제교육", "선택 활동", "시뮬레이션"],
    targetGrade: "초5-고1",
    difficulty: "상",
    buildBasis: "별도 웹앱 링크",
    lessonUse: "소비 선택, 예산 계획, 금융 문해력",
    demoType: "외부 링크",
    route: "https://example.com/economy-education-web",
    externalUrl: "https://example.com/economy-education-web",
    actionLabel: "경제교육 웹 열기",
    fields: [],
    loadingMessages: [],
    mockResult: {
      title: "경제교육 웹",
      summary: "예산과 선택 결과가 있는 경제 수업 웹입니다.",
      highlights: ["예산 선택", "소비 결과", "피드백"],
      cards: [
        {
          title: "예산",
          body: "학생이 제한된 예산 안에서 선택합니다.",
        },
        {
          title: "결과",
          body: "선택에 따른 잔액과 기회비용을 확인합니다.",
        },
        {
          title: "피드백",
          body: "소비와 저축 판단을 짧게 되돌아봅니다.",
        },
      ],
    },
  },
  {
    slug: "smile-question-class",
    title: "질문수업(스마일 프로젝트)",
    category: "질문수업",
    shortDescription:
      "학생 질문을 모으고 분류해 토론과 탐구 주제로 연결하는 수업 웹입니다.",
    longDescription:
      "스마일 프로젝트 질문수업을 위한 별도 웹앱입니다. 질문 등록, 분류, 선택, 공유 화면은 외부 링크에서 엽니다.",
    thumbnail: "/visuals/generated-thumbnails/smile-question-class.png",
    previewImages: [
      "/visuals/generated-thumbnails/smile-question-class.png",
      "/visuals/landing-previews/smile-question-class.png",
    ],
    tags: ["질문수업", "스마일 프로젝트", "토론"],
    targetGrade: "초4-고3",
    difficulty: "상",
    buildBasis: "별도 웹앱 링크",
    lessonUse: "질문 만들기, 질문 분류, 탐구 주제 선정",
    demoType: "외부 링크",
    route: "https://example.com/smile-question-class",
    externalUrl: "https://example.com/smile-question-class",
    actionLabel: "질문수업 웹 열기",
    fields: [],
    loadingMessages: [],
    mockResult: {
      title: "질문수업 보드",
      summary: "학생 질문을 모아 수업 질문으로 고르는 웹입니다.",
      highlights: ["질문 등록", "분류", "공유"],
      cards: [
        {
          title: "질문 등록",
          body: "학생이 떠올린 질문을 바로 남깁니다.",
        },
        {
          title: "분류",
          body: "사실, 이유, 탐구, 토론 질문으로 나눕니다.",
        },
        {
          title: "선택",
          body: "수업에서 다룰 질문을 함께 고릅니다.",
        },
      ],
    },
  },
  {
    slug: "advanced-app-tbd",
    title: "미정",
    category: "상급 프로젝트",
    shortDescription:
      "세 번째 상급 프로젝트 자리입니다.",
    longDescription:
      "별도 링크로 연결할 상급 프로젝트를 넣는 자리입니다. 주제와 URL이 정해지면 카드 정보만 교체합니다.",
    thumbnail: "/visuals/generated-thumbnails/advanced-app-tbd.png",
    previewImages: [
      "/visuals/generated-thumbnails/advanced-app-tbd.png",
      "/visuals/landing-previews/advanced-app-tbd.png",
    ],
    tags: ["상급", "외부 링크", "준비중"],
    targetGrade: "미정",
    difficulty: "상",
    buildBasis: "별도 웹앱 링크",
    lessonUse: "미정",
    demoType: "외부 링크",
    route: "https://example.com/advanced-app-tbd",
    externalUrl: "https://example.com/advanced-app-tbd",
    actionLabel: "링크 열기",
    fields: [],
    loadingMessages: [],
    mockResult: {
      title: "상급 프로젝트",
      summary: "외부 링크로 연결할 프로젝트 자리입니다.",
      highlights: ["주제 미정", "URL 교체", "상급"],
      cards: [
        {
          title: "주제",
          body: "프로젝트 주제를 정하면 카드 이름을 바꿉니다.",
        },
        {
          title: "링크",
          body: "완성형 웹앱 주소를 연결합니다.",
        },
        {
          title: "운영",
          body: "쇼룸에서는 내부 체험 화면을 만들지 않습니다.",
        },
      ],
    },
  },
];

const activeAppSlugs = new Set([
  "author-meet-chatbot",
  "class-timer-station",
  "concept-explainer",
  "english-vocab-cards",
  "addition-card-match-game",
  "history-typing-rain",
  "poetry-picture-maker",
  "picturebook-scene-maker",
  "ai-question-helper",
  "ai-invention-lab",
]);

export const apps: AppItem[] = allApps.filter((app) => activeAppSlugs.has(app.slug));

export const difficultyLabels: Record<Difficulty, string> = {
  하: "바로 실행형",
  중: "AI 생성형",
  상: "외부 연동형",
};

export const categories = Array.from(new Set(apps.map((app) => app.category)));

export function getAppBySlug(slug: string) {
  return apps.find((app) => app.slug === slug);
}

export function getAppsByCategory(category: string) {
  return apps.filter((app) => app.category === category);
}

export function getAppsByDifficulty(difficulty: Difficulty) {
  return apps.filter((app) => app.difficulty === difficulty);
}

const demoExamples: Record<string, DemoExample> = {
  "author-meet-chatbot": {
    values: {
      topic: "강아지똥",
      level: "작가와의 만남",
      notes: "강아지똥은 아무짝에도 쓸모없는 것처럼 보였지만 민들레 꽃을 피우는 거름이 됩니다.",
    },
    resultTitle: "작가와의 대화방",
    resultLead: "작품 텍스트와 학생 질문을 바탕으로 대화가 이어집니다.",
    artifactLabel: "대화 세션",
    artifactTitle: "강아지똥 작가 인터뷰",
    artifactSubtitle: "작품 텍스트 기반 답변",
    artifactNotes: ["한 세션 기억", "작가 관점", "작품 근거"],
  },
  "class-timer-station": {
    values: {
      topic: "우리 모둠 해결책 발표",
      level: "10분",
      notes: "역할을 나누고 핵심 해결책을 30초 안에 발표합니다.",
    },
    resultTitle: "발표 보드",
    resultLead: "모둠 준비, 중간 점검, 발표 순서가 교실 화면에 바로 보입니다.",
    artifactLabel: "교실 화면",
    artifactTitle: "10분 발표 스테이션",
    artifactSubtitle: "준비 6분 · 점검 2분 · 발표 2분",
    artifactNotes: ["모둠별 발표 순서", "마무리 질문", "시간 종료 알림"],
  },
  "concept-explainer": {
    values: {
      topic: "증발",
      sourceSentence: "젖은 수건이 시간이 지나면 마릅니다.",
      level: "초등 고학년",
      notes: "과학 시간에 물의 상태 변화를 배우고 있어요.",
    },
    resultTitle: "증발은 액체가 기체로 바뀌는 일이에요",
    resultLead: "물이 수증기가 되어 공기 중으로 퍼지는 현상을 젖은 수건 장면으로 확인합니다.",
    artifactLabel: "학습 질문",
    artifactTitle: "증발",
    artifactSubtitle: "뜻 · 예시 · 헷갈리지 않기",
    artifactNotes: ["액체에서 기체로", "젖은 수건 예시", "사라진 것이 아님"],
  },
  "english-vocab-cards": {
    values: {
      topic: "harvest",
      level: "오늘의 단어",
      notes: "수확하다",
    },
    resultTitle: "영단어 암기 카드",
    resultLead: "단어 앞면과 뜻 뒷면을 넘기며 외운 단어를 체크합니다.",
    artifactLabel: "암기 카드",
    artifactTitle: "오늘의 단어 6장",
    artifactSubtitle: "단어 · 뜻 · 예문",
    artifactNotes: ["단어 앞면", "뜻 뒷면", "암기 체크"],
  },
  "addition-card-match-game": {
    values: {
      topic: "한 자리 수 덧셈",
      level: "1-2학년",
      notes: "식 카드와 정답 카드를 하나씩 골라 짝을 맞혀요.",
    },
    resultTitle: "덧셈 카드 뒤집기",
    resultLead: "식 카드 8장과 정답 카드 8장을 섞어 같은 값을 찾아 맞힙니다.",
    artifactLabel: "덧셈 게임",
    artifactTitle: "한 자리 수 덧셈 짝 맞추기",
    artifactSubtitle: "식 카드 8장 · 정답 카드 8장",
    artifactNotes: ["1+3", "2+4", "정답 카드"],
  },
  "history-typing-rain": {
    values: {
      topic: "조선",
      level: "보통",
      notes: "훈민정음, 임진왜란, 수원화성",
    },
    resultTitle: "역사 타자 방어전",
    resultLead: "역사 핵심어가 떨어지고, 정확히 입력하면 성벽을 지키며 점수를 얻습니다.",
    artifactLabel: "타자 게임",
    artifactTitle: "조선 핵심어 방어전",
    artifactSubtitle: "낙하 단어 · 생명 3개 · 콤보 점수",
    artifactNotes: ["훈민정음", "임진왜란", "수원화성"],
  },
  "reading-passport-stampbook": {
    values: {
      topic: "긴긴밤",
      level: "상상 세계",
      notes: "함께 살아가는 힘을 떠올리게 한 장면을 남깁니다.",
    },
    resultTitle: "독서여권 기록면",
    resultLead: "읽은 책, 생각 문장, 추천 질문이 여권 한 면에 정리됩니다.",
    artifactLabel: "여권 기록",
    artifactTitle: "긴긴밤 독서 스탬프",
    artifactSubtitle: "상상 세계 입국 · 생각 문장 저장",
    artifactNotes: ["오늘의 장면", "추천 이유", "다음 독서 질문"],
  },
  "cardnews-campaign-maker": {
    values: {
      topic: "학교 주변 쓰레기 줄이기",
      level: "전교생",
      notes: "점심시간 뒤 운동장과 정문 주변을 함께 정리하자는 메시지입니다.",
    },
    resultTitle: "4장 캠페인 카드뉴스",
    resultLead: "문제 제기, 근거, 행동 제안, 참여 요청이 한 세트로 보입니다.",
    artifactLabel: "카드뉴스",
    artifactTitle: "우리 학교 10분 클린업",
    artifactSubtitle: "전교생 참여 캠페인",
    artifactNotes: ["문제 사진 자리", "참여 방법", "공유 문구"],
  },
  "science-experiment-cards": {
    values: {
      topic: "물의 상태 변화",
      level: "관찰",
      notes: "뜨거운 물과 얼음을 다룰 때 보안경과 장갑을 사용합니다.",
    },
    resultTitle: "탐구 절차 카드",
    resultLead: "준비물, 관찰 포인트, 기록 질문이 단계별 카드로 나뉩니다.",
    artifactLabel: "실험 카드",
    artifactTitle: "물의 상태 변화 관찰",
    artifactSubtitle: "준비 · 관찰 · 기록 · 질문",
    artifactNotes: ["안전 약속", "관찰 기준", "생각 질문"],
  },
  "picturebook-scene-maker": {
    values: {
      topic: "비 오는 날 길을 잃은 달팽이",
      level: "따뜻함",
      notes: "작은 달팽이가 노란 우산 아래에서 친구를 만납니다.",
    },
    resultTitle: "그림책 장면 이미지",
    resultLead: "이야기 설정이 한 장의 장면과 다음 문장으로 이어집니다.",
    artifactLabel: "장면 생성",
    artifactTitle: "노란 우산 아래 달팽이",
    artifactSubtitle: "따뜻한 비 오는 골목",
    artifactNotes: ["전경 캐릭터", "배경 색감", "다음 장면 문장"],
  },
  "poetry-picture-maker": {
    values: {
      author: "우리 반",
      topic: "비 온 뒤 운동장",
      poem: "비가 지나간 운동장에\n작은 햇살이 먼저 내려앉았다\n웅덩이는 하늘을 품고\n아이들의 발소리는 반짝인다\n오늘도 우리는\n젖은 길 위에 새 발자국을 놓는다",
      notes: "비가 그친 학교 운동장, 웅덩이에 하늘이 비치고 아이들이 새 발자국을 남기는 장면",
    },
    resultTitle: "시화 이미지",
    resultLead: "시 문장과 장면 묘사가 한 장의 문학 이미지로 보입니다.",
    artifactLabel: "시화",
    artifactTitle: "비 온 뒤 운동장",
    artifactSubtitle: "우리 반",
    artifactNotes: ["시 문장", "비 온 뒤 운동장", "새 발자국"],
  },
  "ai-question-helper": {
    values: {
      topic: "물의 순환",
      level: "탐구 활동",
      notes: "초등 5학년, 증발과 응결을 생활 예시로 이해하기",
    },
    resultTitle: "물의 순환 활동지",
    resultLead: "도입, 관찰, 적용, 마무리 문항이 한 장의 수업 흐름으로 이어집니다.",
    artifactLabel: "활동지",
    artifactTitle: "물의 순환 탐구",
    artifactSubtitle: "도입 1개 · 탐구 2개 · 마무리 1개",
    artifactNotes: ["생활 예시", "증발과 응결", "확인 문항"],
  },
  "presentation-feedback-coach": {
    values: {
      topic: "우리 동네 하천을 지키는 방법",
      level: "전달력",
      notes: "하천 주변 쓰레기를 줄이기 위해 우리가 할 수 있는 일을 발표합니다.",
    },
    resultTitle: "발표 피드백 카드",
    resultLead: "장점, 보완점, 다시 말할 문장이 발표 연습 화면에 표시됩니다.",
    artifactLabel: "피드백",
    artifactTitle: "하천 지킴이 발표 코칭",
    artifactSubtitle: "전달력 중심 피드백",
    artifactNotes: ["좋은 생활 사례", "마지막 요청 강화", "짧은 문장 제안"],
  },
  "ai-invention-lab": {
    values: {
      upload: "student-smart-planter-sketch.jpg",
      uploadDataUrl: "/visuals/sample-uploads/student-smart-planter-sketch.png",
      topic: "자동 급수 화분",
      notes: "식물을 자주 말리는 문제를 해결하고 싶습니다.",
      user: "식물 물 주기를 자주 잊는 학생",
      feature: "흙이 마르면 물통에서 뿌리 쪽으로 물을 보내줍니다.",
    },
    fileName: "student-smart-planter-sketch.jpg",
    resultTitle: "발명품 포스터와 실사 이미지",
    resultLead: "학생 스케치가 발표 포스터 1장과 실사 사용 예시 2장으로 확장됩니다.",
    artifactLabel: "이미지 3장",
    artifactTitle: "자동 급수 화분",
    artifactSubtitle: "발명품 포스터 · 실사 사용 예시",
    artifactNotes: ["포스터", "교실 사용 장면", "집 베란다 사용 장면"],
  },
  "safety-webtoon-maker": {
    values: {
      topic: "복도에서 뛰지 않기",
      level: "복도",
      notes: "친구 둘이 멈춤 신호를 보고 천천히 걷는 장면입니다.",
    },
    resultTitle: "4컷 안전 웹툰",
    resultLead: "위험 상황과 안전 약속을 담은 네 컷 웹툰입니다.",
    artifactLabel: "웹툰",
    artifactTitle: "복도에서는 천천히",
    artifactSubtitle: "위험 인식 · 바른 행동 · 안전 약속",
    artifactNotes: ["1컷 위험", "2컷 멈춤", "3-4컷 약속"],
  },
  "project-portfolio-studio": {
    values: {
      topic: "학교 텃밭 개선 프로젝트",
      level: "시제품 제작",
      notes: "자동 물주기 장치와 안내 표지판을 이번 주에 완성합니다.",
    },
    resultTitle: "팀 포트폴리오 보드",
    resultLead: "계획, 자료, 산출물, 피드백이 프로젝트 진행 단계별로 정리됩니다.",
    artifactLabel: "프로젝트 보드",
    artifactTitle: "초록텃밭 팀 보드",
    artifactSubtitle: "시제품 제작 단계",
    artifactNotes: ["역할 카드", "사진 산출물", "교사 피드백"],
  },
  "local-issue-data-map": {
    values: {
      topic: "학교 주변 횡단보도 안전",
      level: "교통",
      notes: "정문 앞 횡단보도와 골목길 차량 속도를 함께 관찰합니다.",
    },
    resultTitle: "지역 문제 데이터 맵",
    resultLead: "지도 마커, 관찰 기록, 공공데이터 카드가 탐구 화면으로 연결됩니다.",
    artifactLabel: "데이터 맵",
    artifactTitle: "정문 앞 안전 지도",
    artifactSubtitle: "교통 데이터 · 현장 관찰",
    artifactNotes: ["위험 지점", "관찰 메모", "개선 제안"],
  },
  "class-chatbot-hub": {
    values: {
      topic: "과학 탐구 보고서 도우미",
      level: "프로젝트 문서",
      notes: "변인 통제와 결론 쓰는 방법을 자주 묻습니다.",
    },
    resultTitle: "학급 챗봇 허브",
    resultLead: "자료 출처, 추천 질문, 답변 카드가 과목별 챗봇 화면에 표시됩니다.",
    artifactLabel: "챗봇",
    artifactTitle: "과학 탐구 보고서 챗봇",
    artifactSubtitle: "프로젝트 문서 기반 답변",
    artifactNotes: ["근거 문서", "추천 질문", "공개 범위"],
  },
};

export function getDemoExample(app: AppItem): DemoExample {
  return demoExamples[app.slug] ?? {
    values: Object.fromEntries(
      app.fields.map((field) => [
        field.id,
        field.options?.[0] ?? field.placeholder?.replace(/^예:\s*/, "") ?? app.title,
      ]),
    ),
    resultTitle: app.mockResult.title,
    resultLead: app.mockResult.summary,
    artifactLabel: app.demoType,
    artifactTitle: app.title,
    artifactSubtitle: app.lessonUse,
    artifactNotes: app.mockResult.highlights,
  };
}
