export type Difficulty = "하" | "중" | "상";

export type AppStatus = "live" | "maintenance";

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
  keywords: string[];
  targetGrade: string;
  difficulty: Difficulty;
  status?: AppStatus;
  gasRecommended?: boolean;
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
    keywords: ["작가 페르소나 챗봇", "작품 텍스트 기반", "세션 대화 기억", "말투 모사"],
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
    keywords: ["단계별 타이머", "모둠 발표 순서", "교실 화면 보드", "준비·발표·정리"],
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
    keywords: ["맥락 기반 쉬운 설명", "학년 눈높이", "원문+질문 입력", "AI 텍스트"],
    targetGrade: "초3-중3",
    difficulty: "중",
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
    keywords: ["플래시카드", "앞뒤 뒤집기", "단어·뜻·예문", "암기 체크"],
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
    thumbnail: "/visuals/generated-thumbnails/addition-card-match-game.png",
    previewImages: [
      "/visuals/generated-thumbnails/addition-card-match-game.png",
      "/visuals/landing-previews/addition-card-match-game.png",
    ],
    tags: ["덧셈", "카드뒤집기", "1-2학년"],
    keywords: ["메모리 카드게임", "뒤집어 짝맞추기", "한 자리 덧셈", "8쌍 매칭"],
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
    keywords: ["타자 게임", "낙하하는 핵심어", "콤보 점수", "역사 복습"],
    targetGrade: "초5-중3",
    difficulty: "하",
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
    slug: "neon-rhythm-runner",
    title: "네온 리듬 러너",
    category: "리듬 게임",
    shortDescription:
      "비트에 맞춰 점프하고 슬라이드하며 네온 트랙을 질주하는 횡스크롤 러너입니다.",
    longDescription:
      "자동으로 달리는 러너가 비트에 맞춰 다가오는 네온 장애물을 점프와 슬라이드로 피하고, 박자에 놓인 네온 오브를 모아 콤보를 쌓습니다. 달릴수록 속도가 빨라지고, 라이프 3개가 모두 닳으면 게임이 끝납니다.",
    thumbnail: "/visuals/generated-thumbnails/neon-rhythm-runner.png",
    previewImages: [
      "/visuals/generated-thumbnails/neon-rhythm-runner.png",
      "/visuals/landing-previews/neon-rhythm-runner.png",
    ],
    tags: ["리듬", "러너", "반응 속도"],
    keywords: ["횡스크롤 러너", "네온 리듬 게임", "점프·슬라이드 회피", "비트 동기 오브"],
    targetGrade: "초4-고2",
    difficulty: "하",
    buildBasis: "브라우저에서 바로 실행",
    lessonUse: "반응 속도와 리듬감, 활동 전환 환기",
    demoType: "리듬 러너 게임",
    route: "/apps/neon-rhythm-runner",
    actionLabel: "러너 시작",
    fields: [
      {
        id: "topic",
        label: "트랙 이름",
        type: "text",
        placeholder: "예: 네온 시티",
      },
      {
        id: "level",
        label: "시작 속도",
        type: "select",
        options: ["느리게", "보통", "빠르게"],
      },
      {
        id: "notes",
        label: "조작 안내",
        type: "textarea",
        placeholder: "점프와 슬라이드로 장애물을 피하고 오브를 모아요.",
      },
    ],
    loadingMessages: [
      "네온 트랙을 켜는 중입니다.",
      "비트를 맞추는 중입니다.",
      "러너를 출발선에 세우는 중입니다.",
    ],
    mockResult: {
      title: "네온 리듬 러너",
      summary:
        "비트에 맞춰 장애물을 피하고 오브를 모아 점수와 콤보를 쌓는 러너 게임입니다.",
      highlights: ["점프·슬라이드", "비트 오브 수집", "콤보 점수"],
      cards: [
        {
          title: "점프와 슬라이드",
          body: "낮은 장애물은 점프로, 높은 장애물은 슬라이드로 피합니다.",
        },
        {
          title: "비트 오브",
          body: "박자에 맞춰 놓인 네온 오브를 모아 콤보를 올립니다.",
        },
        {
          title: "거리 기록",
          body: "달린 거리와 점수, 최고 콤보로 기록을 확인합니다.",
        },
      ],
    },
  },
  {
    slug: "liberation-text-adventure",
    title: "1919, 어둠을 넘어",
    category: "역사",
    shortDescription:
      "일제강점기를 배경으로 선택에 따라 이야기가 갈라지는 역사 어드벤처입니다.",
    longDescription:
      "1919년 경성, 학생이 된 당신은 거리에 번지는 만세의 물결 앞에서 결정을 내립니다. 격문을 나르고 태극기를 준비하며, 선택에 따라 이야기와 결말이 달라집니다. 오래된 고문서를 읽어 내려가듯 장면이 한 줄씩 펼쳐집니다.",
    thumbnail: "/visuals/generated-thumbnails/liberation-text-adventure.png",
    previewImages: [
      "/visuals/generated-thumbnails/liberation-text-adventure.png",
      "/visuals/landing-previews/liberation-text-adventure.png",
    ],
    tags: ["일제강점기", "3·1운동", "선택형 서사"],
    keywords: ["텍스트 어드벤처", "분기 선택형 서사", "일제강점기 3·1운동", "여러 결말"],
    targetGrade: "초5-고2",
    difficulty: "하",
    buildBasis: "브라우저에서 바로 실행",
    lessonUse: "역사적 사건 몰입과 선택의 의미 탐구",
    demoType: "텍스트 어드벤처",
    route: "/apps/liberation-text-adventure",
    actionLabel: "이야기 시작",
    fields: [
      {
        id: "topic",
        label: "주인공 이름",
        type: "text",
        placeholder: "예: 정아",
      },
      {
        id: "level",
        label: "이야기 분량",
        type: "select",
        options: ["짧게", "보통", "길게"],
      },
      {
        id: "notes",
        label: "배경 안내",
        type: "textarea",
        placeholder: "1919년 경성, 만세 운동이 거리에 번지는 봄입니다.",
      },
    ],
    loadingMessages: [
      "오래된 기록을 펼치는 중입니다.",
      "1919년 경성으로 들어가는 중입니다.",
      "첫 장면을 여는 중입니다.",
    ],
    mockResult: {
      title: "역사 어드벤처",
      summary:
        "선택에 따라 이야기와 결말이 달라지는 일제강점기 역사 어드벤처입니다.",
      highlights: ["분기 선택", "여러 결말", "역사 배경"],
      cards: [
        {
          title: "선택",
          body: "장면마다 주어진 선택지가 이야기의 방향을 바꿉니다.",
        },
        {
          title: "결말",
          body: "용기와 신중함의 선택이 서로 다른 결말로 이어집니다.",
        },
        {
          title: "역사",
          body: "3·1 운동과 독립선언서 등 실제 역사를 바탕으로 합니다.",
        },
      ],
    },
  },
  {
    slug: "picturebook-scene-maker",
    title: "그림책 장면 제작기",
    category: "AI 이미지",
    shortDescription:
      "문장과 장면 묘사를 한 장의 그림책 이미지로 보여줍니다.",
    longDescription:
      "학생의 문장과 장면 묘사를 그림책 장면으로 바꿉니다. 글자가 물보라가 되는 표현을 함께 살펴볼 수 있습니다.",
    thumbnail: "/visuals/generated-thumbnails/picturebook-scene-maker.png",
    previewImages: [
      "/visuals/picturebook/rain-puddle-word-scene.png",
      "/visuals/generated-thumbnails/picturebook-scene-maker.png",
      "/visuals/picturebook-scene-maker-preview.png",
    ],
    tags: ["이미지 생성", "국어", "창작"],
    keywords: ["AI 장면 이미지", "주제·분위기·인물 입력", "그림책 문장", "글자 렌더링"],
    targetGrade: "초2-중1",
    difficulty: "상",
    buildBasis: "텍스트와 장면 묘사",
    lessonUse: "이야기 쓰기와 장면 상상",
    demoType: "이미지 생성형",
    route: "/apps/picturebook-scene-maker",
    actionLabel: "그림책 장면 만들기",
    fields: [
      {
        id: "topic",
        label: "텍스트",
        type: "text",
        placeholder: "지후는 마법사처럼 물 웅덩이를 달렸습니다",
      },
      {
        id: "notes",
        label: "장면묘사",
        type: "textarea",
        placeholder: "노란 우비를 입은 지후가 강아지와 함께 비가 그친 운동장의 물 웅덩이를 달립니다. '풍덩', '첨벙' 같은 말이 물보라처럼 튀어 올라 글자가 그림의 일부가 됩니다.",
      },
    ],
    loadingMessages: [
      "물 웅덩이 장면을 여는 중입니다.",
      "풍덩 글자를 물보라에 얹는 중입니다.",
      "그림책 문장을 맞추는 중입니다.",
    ],
    mockResult: {
      title: "그림책 한 장면",
      summary:
        "텍스트와 장면 묘사가 그림책 이미지와 표현 글자로 이어집니다.",
      highlights: ["장면 이미지", "그림책 문장", "표현 글자"],
      cards: [
        {
          title: "텍스트",
          body: "지후는 마법사처럼 물 웅덩이를 달렸습니다.",
        },
        {
          title: "장면묘사",
          body: "노란 우비를 입은 지후와 강아지가 비가 그친 운동장의 물 웅덩이를 달립니다.",
        },
        {
          title: "표현 방식",
          body: "'풍덩', '첨벙' 같은 말이 물보라와 웅덩이의 일부처럼 보입니다.",
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
    keywords: ["시→장면 이미지", "시+묘사 입력", "분위기 반영", "AI 그림"],
    targetGrade: "초4-고2",
    difficulty: "상",
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
    title: "학습지 생성기",
    category: "AI 수업 도구",
    shortDescription:
      "수업 주제만 넣으면 바로 인쇄해 나눠줄 학습지를 만듭니다.",
    longDescription:
      "수업 주제와 학년, 학습 유형을 넣으면 학습 목표부터 번호 문항, 정답과 해설까지 갖춘 한 장짜리 학습지를 만듭니다. 빈칸, 단답형, 선택형, 서술형 문항이 배점과 함께 들어가고 바로 인쇄할 수 있습니다.",
    thumbnail: "/visuals/generated-thumbnails/ai-question-helper.png",
    previewImages: [
      "/visuals/generated-thumbnails/ai-question-helper.png",
      "/visuals/ai-question-helper-detail-preview.png",
    ],
    tags: ["학습지", "문항 생성", "정답 해설"],
    keywords: ["학습지 자동 생성", "학년·유형 선택", "문항+정답·해설", "형성평가"],
    targetGrade: "초3-고2",
    difficulty: "중",
    buildBasis: "수업 주제와 학년·유형",
    lessonUse: "학습지 출제와 형성평가",
    demoType: "학습지 생성형",
    route: "/apps/ai-question-helper",
    actionLabel: "학습지 만들기",
    fields: [
      {
        id: "topic",
        label: "수업 주제",
        type: "text",
        placeholder: "예: 물의 순환",
      },
      {
        id: "grade",
        label: "학년",
        type: "select",
        options: ["초등 3학년", "초등 4학년", "초등 5학년", "초등 6학년", "중학교 1학년", "중학교 2학년", "중학교 3학년"],
      },
      {
        id: "level",
        label: "학습지 유형",
        type: "select",
        options: ["개념 확인", "탐구 활동", "토론 활동", "형성평가"],
      },
      {
        id: "notes",
        label: "학습 목표",
        type: "textarea",
        placeholder: "예: 증발과 응결을 생활 예시로 이해하기",
      },
    ],
    loadingMessages: [
      "학습 목표를 잡는 중입니다.",
      "문항과 배점을 짜는 중입니다.",
      "정답과 해설을 채우는 중입니다.",
    ],
    mockResult: {
      title: "수업 학습지",
      summary:
        "학습 목표와 번호 문항, 정답·해설이 한 장에 담긴 학습지입니다.",
      highlights: ["학습 목표", "유형별 문항", "정답·해설"],
      cards: [
        {
          title: "학습 목표",
          body: "오늘 수업에서 학생이 도달할 목표를 한 문장으로 보여줍니다.",
        },
        {
          title: "유형별 문항",
          body: "빈칸, 단답형, 선택형, 서술형 문항을 배점과 함께 제공합니다.",
        },
        {
          title: "정답·해설",
          body: "문항마다 정답과 채점 기준을 함께 확인할 수 있습니다.",
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
    keywords: ["발명 발표 포스터", "아이디어 입력", "사용 장면 이미지", "AI 그림"],
    targetGrade: "초5-중3",
    difficulty: "상",
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
    slug: "seat-shuffle-picker",
    title: "우리 반 자리 뽑기",
    category: "앱스 스크립트",
    shortDescription:
      "명렬표 시트의 조건을 지키며 자리를 뽑고, 결과가 좌석표와 기록 시트에 쌓입니다.",
    longDescription:
      "앞자리 배려, 떼어놓을 짝, 고정 자리 조건을 명렬표 시트에서 관리하고 버튼 한 번으로 자리를 뽑습니다. 뽑은 결과는 좌석표 탭에 바로 그려지고, 회차별 실행 기록이 시트에 한 줄씩 남습니다. 자리 두 개를 눌러 서로 바꾸는 미세 조정도 됩니다.",
    thumbnail: "/visuals/generated-thumbnails/seat-shuffle-picker.png",
    previewImages: [
      "/visuals/generated-thumbnails/seat-shuffle-picker.png",
      "/visuals/generated-thumbnails/seat-shuffle-picker-sheet.png",
    ],
    tags: ["자리 배치", "명렬표", "학급 운영"],
    keywords: ["명렬표 시트 연동", "앞자리 배려", "떼어놓은 짝", "회차 기록"],
    targetGrade: "초1-고2",
    difficulty: "하",
    gasRecommended: true,
    buildBasis: "스프레드시트 명렬표와 뽑기 스크립트",
    lessonUse: "자리 바꾸는 날 학급 운영",
    demoType: "시트 연동 보드",
    route: "/apps/seat-shuffle-picker",
    actionLabel: "자리 뽑기",
    fields: [
      {
        id: "topic",
        label: "학급",
        type: "text",
        placeholder: "예: 3학년 2반",
      },
      {
        id: "level",
        label: "지킬 조건",
        type: "select",
        options: ["앞자리 배려", "떼어놓을 짝", "고정 자리"],
      },
      {
        id: "notes",
        label: "참고 사항",
        type: "textarea",
        placeholder: "자리를 정할 때 고려할 점을 적어 주세요.",
      },
    ],
    loadingMessages: ["명렬표를 읽는 중", "조건을 확인하는 중", "자리를 뽑는 중"],
    mockResult: {
      title: "3회차 자리 배치",
      summary: "명렬표 조건을 지킨 새 좌석표가 완성됩니다.",
      highlights: ["앞자리 배려 반영", "짝 분리 반영", "기록 자동 저장"],
      cards: [
        {
          title: "좌석표",
          body: "24명이 3개 분단, 네 줄 자리에 배치됩니다.",
        },
        {
          title: "조건",
          body: "앞자리 배려 학생은 첫째·둘째 줄에만 배치됩니다.",
        },
        {
          title: "기록",
          body: "실행 시각과 반영한 조건이 시트에 한 줄로 남습니다.",
        },
      ],
    },
  },
  {
    slug: "class-suggestion-box",
    title: "학급 건의함",
    category: "앱스 스크립트",
    shortDescription:
      "별명으로 보낸 건의가 접수 시트에 쌓이고, 승인 체크한 건의만 게시판에 올라옵니다.",
    longDescription:
      "학생이 별명으로 건의를 보내면 접수 시트에 한 줄씩 쌓입니다. 시트에서 승인 체크를 켜면 그 건의만 학급 게시판에 공개되고, 답변 열에 적어 둔 내용이 선생님 답변으로 함께 보입니다. 분류별 접수·게시 현황도 시트 함수로 집계됩니다.",
    thumbnail: "/visuals/generated-thumbnails/class-suggestion-box.png",
    previewImages: [
      "/visuals/generated-thumbnails/class-suggestion-box.png",
      "/visuals/generated-thumbnails/class-suggestion-box-sheet.png",
    ],
    tags: ["건의함", "학급 소통", "승인 게시"],
    keywords: ["익명 제출", "승인 체크 공개", "선생님 답변", "분류 집계"],
    targetGrade: "초3-고2",
    difficulty: "하",
    gasRecommended: true,
    buildBasis: "접수 시트와 승인 체크 스크립트",
    lessonUse: "학급 자치와 건의 문화 만들기",
    demoType: "시트 연동 게시판",
    fields: [
      {
        id: "topic",
        label: "별명",
        type: "text",
        placeholder: "예: 궁금이",
      },
      {
        id: "level",
        label: "분류",
        type: "select",
        options: ["수업", "급식", "시설", "행사", "기타"],
      },
      {
        id: "notes",
        label: "건의 내용",
        type: "textarea",
        placeholder: "우리 반을 위해 바꾸고 싶은 것을 적어 주세요.",
      },
    ],
    route: "/apps/class-suggestion-box",
    actionLabel: "건의 보내기",
    loadingMessages: ["건의를 접수하는 중", "시트에 기록하는 중"],
    mockResult: {
      title: "우리 반 건의 게시판",
      summary: "승인된 건의와 선생님 답변이 게시판에 모입니다.",
      highlights: ["익명 접수", "승인 후 공개", "답변 표시"],
      cards: [
        {
          title: "접수",
          body: "별명과 분류, 건의 내용이 시트에 한 줄로 쌓입니다.",
        },
        {
          title: "승인",
          body: "승인 체크를 켠 건의만 게시판에 올라옵니다.",
        },
        {
          title: "답변",
          body: "답변 열에 적은 내용이 건의 카드 아래에 붙습니다.",
        },
      ],
    },
  },
  {
    slug: "boardgame-rental-desk",
    title: "보드게임 대여 장부",
    category: "앱스 스크립트",
    shortDescription:
      "모둠이 보드게임을 빌리고 반납하는 기록이 장부 시트에 쌓이고 남은 수량이 자동으로 맞춰집니다.",
    longDescription:
      "학급 보드게임 선반에서 게임을 고르고 빌리는 모둠을 누르면 대여 기록 시트에 한 줄이 추가됩니다. 반납 체크를 켜면 반납 시각이 기록되고 남은 수량이 다시 늘어납니다. 오래 안 돌아온 게임은 대여 중 목록에서 따로 표시됩니다.",
    thumbnail: "/visuals/generated-thumbnails/boardgame-rental-desk.png",
    previewImages: [
      "/visuals/generated-thumbnails/boardgame-rental-desk.png",
      "/visuals/generated-thumbnails/boardgame-rental-desk-sheet.png",
    ],
    tags: ["대여 장부", "학급 물품", "보드게임"],
    keywords: ["대여·반납 기록", "남은 수량 자동", "연체 표시", "모둠별 장부"],
    targetGrade: "초1-고2",
    difficulty: "하",
    gasRecommended: true,
    buildBasis: "장부 시트와 수량 계산 스크립트",
    lessonUse: "쉬는 시간 학급 물품 관리",
    demoType: "시트 연동 장부",
    route: "/apps/boardgame-rental-desk",
    actionLabel: "대여 시작하기",
    fields: [
      {
        id: "topic",
        label: "게임",
        type: "select",
        options: ["할리갈리", "루미큐브", "부루마불", "젠가", "도블", "우노"],
      },
      {
        id: "level",
        label: "빌리는 모둠",
        type: "select",
        options: ["1모둠", "2모둠", "3모둠", "4모둠", "5모둠", "6모둠"],
      },
      {
        id: "notes",
        label: "메모",
        type: "textarea",
        placeholder: "빌릴 때 남길 메모를 적어 주세요.",
      },
    ],
    loadingMessages: ["장부를 여는 중", "대여를 기록하는 중"],
    mockResult: {
      title: "보드게임 대여 장부",
      summary: "대여와 반납이 장부 시트에 시각과 함께 기록됩니다.",
      highlights: ["대여 기록", "반납 체크", "남은 수량"],
      cards: [
        {
          title: "대여",
          body: "게임과 모둠을 고르면 장부에 한 줄이 추가됩니다.",
        },
        {
          title: "반납",
          body: "반납 체크를 켜면 반납 시각이 함께 기록됩니다.",
        },
        {
          title: "수량",
          body: "남은 수량이 보유 수에서 대여 중 수를 빼 계산됩니다.",
        },
      ],
    },
  },
  {
    slug: "live-class-poll",
    title: "우리 반 실시간 투표",
    category: "앱스 스크립트",
    shortDescription:
      "학생들이 투표할 때마다 응답 시트에 쌓이고 막대 그래프가 실시간으로 올라갑니다.",
    longDescription:
      "질문 시트에 적어 둔 투표를 골라 한 표를 던지면 응답 시트에 한 줄씩 쌓이고 집계 그래프가 바로 움직입니다. 다른 학생들의 표가 들어오는 동안 그래프가 실시간으로 갱신되고, 마감 체크를 켜면 투표가 닫히며 결과가 고정됩니다.",
    thumbnail: "/visuals/generated-thumbnails/live-class-poll.png",
    previewImages: [
      "/visuals/generated-thumbnails/live-class-poll.png",
      "/visuals/generated-thumbnails/live-class-poll-sheet.png",
    ],
    tags: ["실시간 투표", "수업 참여", "학급 회의"],
    keywords: ["응답 시트 누적", "실시간 그래프", "마감 체크", "집계 함수"],
    targetGrade: "초2-고2",
    difficulty: "하",
    gasRecommended: true,
    buildBasis: "응답 시트와 집계 스크립트",
    lessonUse: "수업 도입 의견 모으기와 학급 회의",
    demoType: "시트 연동 투표",
    route: "/apps/live-class-poll",
    actionLabel: "투표 시작하기",
    fields: [
      {
        id: "topic",
        label: "질문",
        type: "text",
        placeholder: "예: 가을 현장체험학습, 어디로 갈까요?",
      },
      {
        id: "level",
        label: "보기 수",
        type: "select",
        options: ["2개", "3개", "4개"],
      },
      {
        id: "notes",
        label: "보기 내용",
        type: "textarea",
        placeholder: "보기를 줄마다 하나씩 적어 주세요.",
      },
    ],
    loadingMessages: ["질문 시트를 읽는 중", "응답을 집계하는 중"],
    mockResult: {
      title: "실시간 투표 집계",
      summary: "응답이 쌓일 때마다 막대 그래프가 갱신됩니다.",
      highlights: ["한 사람 한 표", "실시간 집계", "마감 고정"],
      cards: [
        {
          title: "투표",
          body: "보기를 누르면 응답 시트에 한 줄이 추가됩니다.",
        },
        {
          title: "집계",
          body: "보기별 표수가 시트 함수로 계산되어 그래프에 반영됩니다.",
        },
        {
          title: "마감",
          body: "마감 체크를 켜면 투표가 닫히고 결과가 고정됩니다.",
        },
      ],
    },
  },
  {
    slug: "practical-consumer-mission",
    title: "실과 합리적 소비 실천",
    category: "실과",
    shortDescription:
      "예산 안에서 장보기 선택을 해 보고 소비 판단을 점검하는 미션 앱입니다.",
    longDescription:
      "학생이 장보기 목록, 예산, 구매 후보를 살피며 꼭 필요한 물건과 나중에 살 물건을 고릅니다. 선택 결과는 잔액, 필요도, 합리적 소비 점수로 이어집니다. 별도 접속 정보 없이 바로 열 수 있습니다.",
    thumbnail: "/visuals/generated-thumbnails/practical-consumer-mission.png",
    previewImages: [
      "/visuals/generated-thumbnails/practical-consumer-mission.png",
      "/visuals/landing-previews/practical-consumer-mission.png",
    ],
    tags: ["장보기", "합리적 소비", "예산"],
    keywords: ["예산 장보기 시뮬", "필요/욕구 판단", "소비 점수", "선택형 미션"],
    targetGrade: "초5-중1",
    difficulty: "하",
    buildBasis: "별도 웹앱 링크",
    lessonUse: "실과 소비 생활과 예산 선택",
    demoType: "외부 링크",
    route: "https://shopping-mission-app.streamlit.app/",
    externalUrl: "https://shopping-mission-app.streamlit.app/",
    actionLabel: "장보기 미션 열기",
    fields: [],
    loadingMessages: [],
    mockResult: {
      title: "장보기 미션",
      summary:
        "예산, 구매 목록, 소비 이유가 함께 보이는 합리적 소비 활동입니다.",
      highlights: ["예산", "필요도", "소비 점수"],
      cards: [
        {
          title: "예산",
          body: "정해진 금액 안에서 살 물건을 고릅니다.",
        },
        {
          title: "선택",
          body: "필요한 물건과 원하는 물건을 나누어 판단합니다.",
        },
        {
          title: "점수",
          body: "잔액과 선택 이유를 바탕으로 소비 점수를 확인합니다.",
        },
      ],
    },
  },
  {
    slug: "ai-catchmind",
    title: "AI Catchmind",
    category: "AI 게임",
    shortDescription:
      "팔레트에 그린 그림을 AI가 맞히는 그림 퀴즈 앱입니다.",
    longDescription:
      "학생이 제한 시간 안에 주제 그림을 그리고 AI가 정답을 추측합니다. 선 색, 굵기, 지우개를 쓰며 그림 힌트를 만들고, AI의 추측 기록으로 점수를 얻습니다. 입장코드: 1234",
    thumbnail: "/visuals/generated-thumbnails/ai-catchmind.png",
    previewImages: [
      "/visuals/generated-thumbnails/ai-catchmind.png",
      "/visuals/landing-previews/ai-catchmind.png",
    ],
    tags: ["그림 퀴즈", "팔레트", "AI 추측"],
    keywords: ["그림 퀴즈", "팔레트 드로잉", "AI 그림 추측", "제한시간 점수"],
    targetGrade: "초3-중3",
    difficulty: "중",
    buildBasis: "별도 웹앱 링크",
    lessonUse: "어휘 표현, 창의 그림, 모둠 게임",
    demoType: "외부 링크",
    route: "https://ai-catchmind-gge7lcpcca-du.a.run.app",
    externalUrl: "https://ai-catchmind-gge7lcpcca-du.a.run.app",
    actionLabel: "그림 퀴즈 열기",
    fields: [],
    loadingMessages: [],
    mockResult: {
      title: "AI 그림 추측",
      summary:
        "그림판, AI 추측 기록, 점수가 함께 보이는 캐치마인드 게임입니다.",
      highlights: ["팔레트", "AI 추측", "점수"],
      cards: [
        {
          title: "그림판",
          body: "주제에 맞는 그림을 선과 색으로 표현합니다.",
        },
        {
          title: "AI 추측",
          body: "AI가 그림을 보고 정답 후보를 말합니다.",
        },
        {
          title: "점수",
          body: "정답까지 걸린 시간과 추측 횟수로 점수를 얻습니다.",
        },
      ],
    },
  },
  {
    slug: "class-game-management",
    title: "학급경영 class-game",
    category: "학급경영",
    shortDescription:
      "문제를 풀고 학급 코인을 얻어 투자와 저축을 운영하는 학급 게임 앱입니다.",
    longDescription:
      "학생은 문제를 풀어 학급 코인을 모으고 저축, 투자, 소비 선택을 합니다. 교사는 문제, 보상, 이벤트를 조정해 학급 활동과 경제 습관을 함께 운영합니다. 교사용 ID: teacher_example, 학생용 ID: aiedap_example1 ~ aiedap_example40, 비밀번호: a123456789",
    thumbnail: "/visuals/generated-thumbnails/class-game-management.png",
    previewImages: [
      "/visuals/generated-thumbnails/class-game-management.png",
      "/visuals/landing-previews/class-game-management.png",
    ],
    tags: ["학급 코인", "문제 풀이", "투자 저축"],
    keywords: ["학급 경제 게임", "문제풀이 보상", "코인·투자·저축", "보상 대시보드"],
    targetGrade: "초4-중2",
    difficulty: "상",
    buildBasis: "별도 웹앱 링크",
    lessonUse: "학급 보상, 경제 습관, 문제 풀이",
    demoType: "외부 링크",
    route: "https://class-game-dun.vercel.app/",
    externalUrl: "https://class-game-dun.vercel.app/",
    actionLabel: "class-game 열기",
    fields: [],
    loadingMessages: [],
    mockResult: {
      title: "학급 코인 보드",
      summary:
        "문제 풀이, 코인 보상, 저축과 투자 선택이 연결되는 학급 게임입니다.",
      highlights: ["문제 풀이", "학급 코인", "투자 저축"],
      cards: [
        {
          title: "문제",
          body: "학생이 문제를 풀고 코인을 얻습니다.",
        },
        {
          title: "저축",
          body: "모은 코인을 목표 금액까지 쌓아 갑니다.",
        },
        {
          title: "투자",
          body: "이벤트에 따라 수익과 손실을 확인합니다.",
        },
      ],
    },
  },
  {
    slug: "smile-question-class",
    title: "Smile",
    category: "질문수업",
    shortDescription:
      "질문을 만들고 AI 점수로 질문의 힘을 확인하는 질문수업 앱입니다.",
    longDescription:
      "학생이 만든 질문을 AI가 명확성, 탐구성, 확장성 기준으로 채점합니다. 점수와 피드백을 보고 질문을 고쳐 더 좋은 탐구 질문으로 발전시킵니다.",
    thumbnail: "/visuals/generated-thumbnails/smile-question-class.png",
    previewImages: [
      "/visuals/generated-thumbnails/smile-question-class.png",
      "/visuals/landing-previews/smile-question-class.png",
    ],
    tags: ["질문 만들기", "AI 채점", "스마일"],
    keywords: ["질문 만들기 훈련", "AI 질문 평가", "점수+개선 피드백", "탐구 질문"],
    targetGrade: "초4-고2",
    difficulty: "중",
    status: "maintenance",
    buildBasis: "별도 웹앱 링크",
    lessonUse: "질문 만들기와 탐구 질문 개선",
    demoType: "외부 링크",
    route: "https://example.com/smile-question-class",
    externalUrl: "https://example.com/smile-question-class",
    actionLabel: "Smile 열기",
    fields: [],
    loadingMessages: [],
    mockResult: {
      title: "질문 점수",
      summary:
        "학생 질문, AI 점수, 개선 피드백이 함께 보이는 질문수업 화면입니다.",
      highlights: ["질문", "AI 점수", "개선 피드백"],
      cards: [
        {
          title: "질문",
          body: "학생이 수업 주제에서 궁금한 점을 씁니다.",
        },
        {
          title: "점수",
          body: "AI가 질문의 명확성, 탐구성, 확장성을 평가합니다.",
        },
        {
          title: "개선",
          body: "피드백을 바탕으로 질문을 다시 다듬습니다.",
        },
      ],
    },
  },
  {
    slug: "digital-reading-passport",
    title: "디지털 독서여권",
    category: "독서교육",
    shortDescription:
      "세계 여러 나라 그림책을 읽고 질문을 만들어 나만의 그림책까지 완성하는 독서 수업 앱입니다.",
    longDescription:
      "학생이 여러 나라의 그림책을 읽고 감정 스티커와 한 줄 감상을 남깁니다. 이어서 책 속 나라의 문화를 영상과 사진으로 탐색하고, 궁금한 점을 질문으로 만들어 세계를 넓혀 갑니다. 활동을 마칠 때마다 여권에 도장이 찍히고, 마지막에는 자기 이야기를 그림책으로 창작합니다. 학생 계정은 교사가 관리하고 새 작품은 비공개로 시작합니다.",
    thumbnail: "/visuals/generated-thumbnails/digital-reading-passport.png",
    previewImages: [
      "/visuals/generated-thumbnails/digital-reading-passport.png",
      "/visuals/landing-previews/digital-reading-passport.png",
    ],
    tags: ["세계시민교육", "그림책 읽기", "그림책 창작"],
    keywords: ["세계 그림책 읽기", "감정 표현과 한 줄 감상", "질문 만들기", "나만의 그림책 창작"],
    targetGrade: "초5-6",
    difficulty: "상",
    buildBasis: "별도 웹앱 링크",
    lessonUse: "세계시민교육 독서 활동과 창작 수업",
    demoType: "외부 링크",
    route: "https://reading-passport-xga6.vercel.app/",
    externalUrl: "https://reading-passport-xga6.vercel.app/",
    actionLabel: "독서여권 열기",
    fields: [],
    loadingMessages: [],
    mockResult: {
      title: "나의 독서 여권",
      summary:
        "읽기, 탐색, 질문, 창작 네 활동을 마치면 도장이 모여 한 권의 독서 여권이 됩니다.",
      highlights: ["그림책 읽기", "질문 만들기", "그림책 창작"],
      cards: [
        {
          title: "읽기",
          body: "여러 나라 그림책을 읽고 감정과 감상을 남깁니다.",
        },
        {
          title: "탐색",
          body: "책 속 나라의 문화를 영상과 사진으로 살펴봅니다.",
        },
        {
          title: "창작",
          body: "자기 이야기를 한 권의 그림책으로 만듭니다.",
        },
      ],
    },
  },
  {
    slug: "national-heritage-map",
    title: "국가유산 지도",
    category: "역사",
    shortDescription:
      "전남·광주 국가유산을 지도에서 찾아보고 답사 기록을 우리 반 지도에 남기는 앱입니다.",
    longDescription:
      "국가유산 오픈API 정보를 지도와 목록으로 함께 봅니다. 시대와 지역, 유형으로 걸러 찾고 위치, 설명, 사진, 로드뷰를 한 화면에서 확인합니다. 학생이 남긴 한줄평과 장소 기록은 교사가 확인한 뒤 우리 반 지도에 올라가고, 가 볼 곳을 담아 두면 날짜별 답사 코스와 이동 거리까지 만들어집니다.",
    thumbnail: "/visuals/generated-thumbnails/national-heritage-map.png",
    previewImages: [
      "/visuals/generated-thumbnails/national-heritage-map.png",
      "/visuals/landing-previews/national-heritage-map.png",
    ],
    tags: ["국가유산", "전남·광주", "답사 기록"],
    keywords: ["국가유산 오픈API", "지도·로드뷰 탐색", "학생 한줄평", "날짜별 답사 코스"],
    targetGrade: "초4-중2",
    difficulty: "상",
    buildBasis: "별도 웹앱 링크",
    lessonUse: "지역 국가유산 탐구와 현장 답사",
    demoType: "외부 링크",
    route: "https://history-map-chi.vercel.app/",
    externalUrl: "https://history-map-chi.vercel.app/",
    actionLabel: "국가유산 지도 열기",
    fields: [],
    loadingMessages: [],
    mockResult: {
      title: "우리 반 국가유산 지도",
      summary:
        "학생이 찾은 유산과 한줄평이 쌓여 우리 지역의 답사 기록이 됩니다.",
      highlights: ["지도 탐색", "한줄평", "답사 코스"],
      cards: [
        {
          title: "탐색",
          body: "시대와 지역, 유형으로 걸러 지도와 목록을 함께 봅니다.",
        },
        {
          title: "기록",
          body: "학생이 올린 장소와 한줄평을 교사가 확인해 지도에 남깁니다.",
        },
        {
          title: "답사",
          body: "가 볼 곳을 담아 날짜별 코스와 이동 거리를 확인합니다.",
        },
      ],
    },
  },
  {
    slug: "ml-microbit-studio",
    title: "마이크로비트 머신러닝",
    category: "머신러닝",
    shortDescription:
      "카메라와 마이크로 모은 데이터로 모델을 학습시키고 그 결과를 마이크로비트로 보내는 앱입니다.",
    longDescription:
      "제스처, 손 좌표, 자세, 얼굴, 소리 가운데 실습에 맞는 입력을 고르고 직접 샘플을 모아 KNN과 Dense 모델을 학습시킵니다. 학습한 모델을 실시간 화면에서 바로 시험해 보고, 인식 결과를 시리얼 통신으로 마이크로비트에 보내 동작까지 연결합니다. 모델 선택부터 학습, 실행, 장치 연결, 코드 편집까지 다섯 단계로 이어집니다.",
    thumbnail: "/visuals/generated-thumbnails/ml-microbit-studio.png",
    previewImages: [
      "/visuals/generated-thumbnails/ml-microbit-studio.png",
      "/visuals/landing-previews/ml-microbit-studio.png",
    ],
    tags: ["머신러닝", "마이크로비트", "시리얼 통신"],
    keywords: ["KNN·Dense 모델 학습", "카메라·마이크 입력", "실시간 추론 실험", "micro:bit 시리얼 전송"],
    targetGrade: "초5-중3",
    difficulty: "상",
    buildBasis: "별도 웹앱 링크",
    lessonUse: "AI 원리 실습과 피지컬 컴퓨팅",
    demoType: "외부 링크",
    route: "https://ml-microbit.vercel.app/",
    externalUrl: "https://ml-microbit.vercel.app/",
    actionLabel: "AI 스튜디오 열기",
    fields: [],
    loadingMessages: [],
    mockResult: {
      title: "내가 학습시킨 모델",
      summary:
        "직접 모은 샘플로 학습한 모델이 화면에서 동작하고 마이크로비트로 이어집니다.",
      highlights: ["모델 학습", "실시간 실행", "장치 연결"],
      cards: [
        {
          title: "학습",
          body: "클래스마다 샘플을 모아 KNN이나 Dense 모델을 학습시킵니다.",
        },
        {
          title: "실행",
          body: "카메라와 마이크 입력으로 인식 결과를 바로 확인합니다.",
        },
        {
          title: "장치",
          body: "인식 결과를 시리얼 통신으로 마이크로비트에 보냅니다.",
        },
      ],
    },
  },
];

export const apps: AppItem[] = allApps;

export const difficultyLabels: Record<Difficulty, string> = {
  하: "바로 실행형",
  중: "AI 생성형",
  상: "심화 기능형",
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
  "picturebook-scene-maker": {
    values: {
      topic: "지후는 마법사처럼 물 웅덩이를 달렸습니다",
      notes: "노란 우비를 입은 지후가 강아지와 함께 비가 그친 운동장의 물 웅덩이를 달립니다. '풍덩', '첨벙' 같은 말이 물보라처럼 튀어 올라 글자가 그림의 일부가 됩니다.",
    },
    resultTitle: "그림책 장면 이미지",
    resultLead: "텍스트와 장면 묘사가 한 장의 그림책 이미지로 이어집니다.",
    artifactLabel: "장면 생성",
    artifactTitle: "지후는 마법사처럼 물 웅덩이를 달렸습니다",
    artifactSubtitle: "풍덩 풍덩 물 웅덩이",
    artifactNotes: ["우비 입은 소년", "함께 달리는 강아지", "물보라 글자"],
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
      grade: "초등 5학년",
      level: "탐구 활동",
      notes: "증발과 응결을 생활 예시로 이해하기",
    },
    resultTitle: "물의 순환 학습지",
    resultLead: "학습 목표와 번호 문항, 정답·해설이 한 장의 학습지로 이어집니다.",
    artifactLabel: "학습지",
    artifactTitle: "물의 순환 학습지",
    artifactSubtitle: "초등 5학년 · 총 100점",
    artifactNotes: ["빈칸·서술형 문항", "배점 표시", "정답·해설"],
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
  "seat-shuffle-picker": {
    values: {
      topic: "3학년 2반",
      level: "앞자리 배려",
      notes: "시력이 나쁜 학생 두 명은 앞줄에, 자주 다투는 짝은 떨어뜨립니다.",
    },
    resultTitle: "3회차 자리 배치",
    resultLead: "명렬표 조건을 지킨 좌석표가 완성되고 기록 시트에 한 줄 남습니다.",
    artifactLabel: "좌석표",
    artifactTitle: "우리 반 자리 뽑기",
    artifactSubtitle: "24명 · 3개 분단 · 조건 반영",
    artifactNotes: ["앞자리 배려", "짝 분리", "회차 기록"],
  },
  "class-suggestion-box": {
    values: {
      topic: "궁금이",
      level: "수업",
      notes: "수학 시간에 모둠 화이트보드를 더 자주 쓰고 싶어요.",
    },
    resultTitle: "우리 반 건의 게시판",
    resultLead: "승인 체크한 건의만 게시판에 올라오고 답변이 함께 붙습니다.",
    artifactLabel: "건의 게시판",
    artifactTitle: "학급 건의함",
    artifactSubtitle: "익명 접수 · 승인 공개 · 답변",
    artifactNotes: ["접수 시트", "승인 체크", "선생님 답변"],
  },
  "boardgame-rental-desk": {
    values: {
      topic: "할리갈리",
      level: "3모둠",
      notes: "점심시간에 빌리고 청소 시간 전에 반납합니다.",
    },
    resultTitle: "보드게임 대여 장부",
    resultLead: "대여와 반납이 시각과 함께 장부 시트에 쌓입니다.",
    artifactLabel: "대여 장부",
    artifactTitle: "보드게임 대여 장부",
    artifactSubtitle: "8종 12개 · 모둠별 기록",
    artifactNotes: ["대여 기록", "반납 체크", "남은 수량"],
  },
  "live-class-poll": {
    values: {
      topic: "가을 현장체험학습, 어디로 갈까요?",
      level: "4개",
      notes: "과학관, 미술관, 숲 체험원, 역사 박물관",
    },
    resultTitle: "실시간 투표 집계",
    resultLead: "응답 시트에 표가 쌓일 때마다 그래프가 바로 움직입니다.",
    artifactLabel: "투표 집계",
    artifactTitle: "우리 반 실시간 투표",
    artifactSubtitle: "한 사람 한 표 · 실시간 그래프",
    artifactNotes: ["응답 누적", "실시간 집계", "마감 체크"],
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
