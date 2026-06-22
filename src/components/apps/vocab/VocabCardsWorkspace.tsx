"use client";

import Image from "next/image";
import { BookOpen, Check, ChevronLeft, ChevronRight, Plus, RotateCcw, Shuffle } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import { versionVisualAsset } from "@/lib/visuals";

type VocabCardsWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type VocabCard = {
  id: string;
  word: string;
  meaning: string;
  example: string;
  hint: string;
  known: boolean;
};

const starterCards: VocabCard[] = [
  { id: "v-1", word: "harvest", meaning: "수확하다", example: "Farmers harvest apples in fall.", hint: "가을 농장", known: false },
  { id: "v-2", word: "bright", meaning: "밝은", example: "The classroom is bright.", hint: "햇빛이 들어온 교실", known: false },
  { id: "v-3", word: "share", meaning: "나누다", example: "We share ideas with friends.", hint: "친구와 함께", known: false },
  { id: "v-4", word: "quiet", meaning: "조용한", example: "The library is quiet.", hint: "도서관", known: false },
  { id: "v-5", word: "build", meaning: "짓다, 만들다", example: "Students build a small bridge.", hint: "블록 쌓기", known: false },
  { id: "v-6", word: "wonder", meaning: "궁금해하다", example: "I wonder why the sky changes color.", hint: "왜 그럴까", known: false },
];

export function VocabCardsWorkspace({ app, spec }: VocabCardsWorkspaceProps) {
  const [cards, setCards] = useState<VocabCard[]>(starterCards);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [word, setWord] = useState("journey");
  const [meaning, setMeaning] = useState("여행");
  const [example, setExample] = useState("Reading is a journey.");

  const activeCard = cards[activeIndex] ?? cards[0];
  const knownCount = cards.filter((card) => card.known).length;
  const progress = cards.length ? Math.round((knownCount / cards.length) * 100) : 0;
  const reviewCards = useMemo(() => cards.filter((card) => !card.known), [cards]);

  function move(direction: -1 | 1) {
    if (!cards.length) return;
    setActiveIndex((current) => (current + direction + cards.length) % cards.length);
    setFlipped(false);
  }

  function toggleKnown(id: string) {
    setCards((current) =>
      current.map((card) => card.id === id ? { ...card, known: !card.known } : card),
    );
  }

  function addCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanWord = word.trim();
    const cleanMeaning = meaning.trim();
    if (!cleanWord || !cleanMeaning) return;

    const nextCard = {
      id: `v-${Date.now()}`,
      word: cleanWord,
      meaning: cleanMeaning,
      example: example.trim() || `${cleanWord} is today's word.`,
      hint: cleanMeaning.slice(0, 2) || "새 단어",
      known: false,
    };
    setCards((current) => [nextCard, ...current]);
    setActiveIndex(0);
    setFlipped(false);
    setWord("");
    setMeaning("");
    setExample("");
  }

  function shuffleCards() {
    setCards((current) => [...current].reverse());
    setActiveIndex(0);
    setFlipped(false);
  }

  function resetCards() {
    setCards(starterCards);
    setActiveIndex(0);
    setFlipped(false);
    setWord("journey");
    setMeaning("여행");
    setExample("Reading is a journey.");
  }

  return (
    <main className="mvp-page vocab-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <BookOpen size={17} />
              영단어 암기
            </span>
            <p>{app.category} · {spec.workLabel}</p>
          </div>
          <strong>{app.shortDescription}</strong>
        </div>
        <div className="mvp-hero-actions">
          <Link className="button-secondary" href="/library">
            앱 선택
          </Link>
        </div>
      </section>

      <section className="vocab-layout">
        <form className="vocab-add-panel" onSubmit={addCard}>
          <div className="mvp-panel-heading">
            <Plus size={18} />
            <strong>단어 추가</strong>
          </div>
          <div className="vocab-mascot-card">
            <Image
              src={versionVisualAsset("/visuals/landing-previews/english-vocab-cards.png")}
              alt=""
              width={112}
              height={112}
              className="vocab-mascot-image"
              priority
              unoptimized
            />
            <div>
              <span>암기율 {progress}%</span>
              <strong>{knownCount}/{cards.length}개</strong>
              <p>{reviewCards.length ? "외울 단어를 하나씩 넘겨보세요." : "오늘 단어를 모두 확인했습니다."}</p>
            </div>
          </div>
          <label className="mvp-field">
            <span>영단어</span>
            <input value={word} placeholder="예: journey" onChange={(event) => setWord(event.target.value)} />
          </label>
          <label className="mvp-field">
            <span>뜻</span>
            <input value={meaning} placeholder="예: 여행" onChange={(event) => setMeaning(event.target.value)} />
          </label>
          <label className="mvp-field">
            <span>예문</span>
            <input value={example} placeholder="예: Reading is a journey." onChange={(event) => setExample(event.target.value)} />
          </label>
          <button className="button-primary justify-center" type="submit">
            <Plus size={18} />
            단어 추가
          </button>

          <div className="vocab-progress-card">
            <span>암기율</span>
            <strong>{progress}%</strong>
            <p>{knownCount}/{cards.length}개 암기</p>
          </div>
        </form>

        <section className="vocab-card-panel" aria-label="영단어 암기 카드">
          <div className="vocab-game-strip">
            <span>{activeIndex + 1}/{cards.length}</span>
            <span>{activeCard.known ? "암기 완료" : "복습 중"}</span>
            <span>{activeCard.hint}</span>
          </div>

          <button className={`vocab-flashcard ${flipped ? "is-flipped" : ""}`} type="button" onClick={() => setFlipped((current) => !current)}>
            <span>{flipped ? "뜻" : "단어"}</span>
            <strong>{flipped ? activeCard.meaning : activeCard.word}</strong>
            <p>{flipped ? activeCard.example : `${activeCard.hint} 힌트를 보고 뜻을 떠올려보세요.`}</p>
            <small>눌러서 뒤집기</small>
          </button>

          <div className="vocab-control-row">
            <button className="button-secondary" type="button" onClick={() => move(-1)}>
              <ChevronLeft size={18} />
              이전
            </button>
            <button className="button-primary" type="button" onClick={() => toggleKnown(activeCard.id)}>
              <Check size={18} />
              {activeCard.known ? "다시 복습" : "외웠어요"}
            </button>
            <button className="button-secondary" type="button" onClick={() => move(1)}>
              다음
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="vocab-tool-row">
            <button className="button-secondary" type="button" onClick={shuffleCards}>
              <Shuffle size={18} />
              순서 바꾸기
            </button>
            <button className="button-secondary" type="button" onClick={resetCards}>
              <RotateCcw size={18} />
              초기화
            </button>
          </div>

          <div className="vocab-list" aria-label="복습 단어">
            {cards.map((card, index) => (
              <button
                className={cards[activeIndex]?.id === card.id ? "is-active" : ""}
                key={card.id}
                type="button"
                onClick={() => {
                  setActiveIndex(index);
                  setFlipped(false);
                }}
              >
                <span>{index + 1}</span>
                <strong>{card.word}</strong>
                <em>{card.known ? "완료" : "복습"}</em>
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
