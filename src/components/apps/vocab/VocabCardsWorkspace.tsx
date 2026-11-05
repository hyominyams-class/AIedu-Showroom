"use client";

import { BookOpen, Check, Plus, RotateCcw, Shuffle } from "lucide-react";
import { PageControls } from "@/components/mvp/PageControls";
import { WorkspaceHeader } from "@/components/mvp/WorkspaceHeader";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";

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

export function VocabCardsWorkspace({ app }: VocabCardsWorkspaceProps) {
  const [stage, setStage] = useState(0);
  const [listPage, setListPage] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [cards, setCards] = useState<VocabCard[]>(starterCards);
  const [activeIndex, setActiveIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [word, setWord] = useState("journey");
  const [meaning, setMeaning] = useState("여행");
  const [example, setExample] = useState("Reading is a journey.");

  /* eslint-disable react-hooks/set-state-in-effect -- Restore user cards after browser hydration. */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("showroom:vocab:v2") || "null");
      if (Array.isArray(saved) && saved.length > 0 && saved.length <= 200 && saved.every((card) => card && [card.id, card.word, card.meaning, card.example, card.hint].every((value) => typeof value === "string") && typeof card.known === "boolean")) setCards(saved);
    } catch { /* Start with the example cards when storage is unavailable. */ }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("showroom:vocab:v2", JSON.stringify(cards)); } catch { /* Learning remains available without browser storage. */ }
  }, [cards, hydrated]);

  const activeCard = cards[activeIndex] ?? cards[0];
  const knownCount = cards.filter((card) => card.known).length;
  const progress = cards.length ? Math.round((knownCount / cards.length) * 100) : 0;
  const reviewCards = useMemo(() => cards.filter((card) => !card.known), [cards]);
  const allKnown = cards.length > 0 && knownCount === cards.length;

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
    if (!cleanWord || !cleanMeaning) { setNotice("영단어와 뜻을 입력해 주세요."); return; }
    if (cards.length >= 200) { setNotice("한 번에 200개 단어까지 학습할 수 있어요."); return; }

    const nextCard = {
      id: crypto.randomUUID(),
      word: cleanWord,
      meaning: cleanMeaning,
      example: example.trim() || `${cleanWord} is today's word.`,
      hint: "새 단어",
      known: false,
    };
    setCards((current) => [nextCard, ...current]);
    setActiveIndex(0);
    setFlipped(false);
    setWord("");
    setMeaning("");
    setExample("");
    setNotice(`${cleanWord} 단어를 추가했어요.`);
  }

  function handleKnownButton() {
    const card = activeCard;
    if (!card) return;
    const wasUnknown = !card.known;
    toggleKnown(card.id);
    if (wasUnknown && cards.length > 1) {
      move(1);
    } else {
      setFlipped(false);
    }
  }

  function restartReview() {
    setCards((current) => current.map((card) => ({ ...card, known: false })));
    setActiveIndex(0);
    setFlipped(false);
  }

  function shuffleCards() {
    setCards((current) => {
      const next = [...current];
      for (let index = next.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [next[index], next[swap]] = [next[swap], next[index]];
      }
      return next;
    });
    setActiveIndex(0);
    setFlipped(false);
  }

  function resetCards() {
    setCards(starterCards);
    setListPage(0);
    setNotice("");
    setActiveIndex(0);
    setFlipped(false);
    setWord("journey");
    setMeaning("여행");
    setExample("Reading is a journey.");
  }

  return (
    <main className="workspace-page vocab-page">
      <WorkspaceHeader title={app.title} navigation="tabs" steps={["단어 준비", "카드 학습", "단어 목록"]} current={stage} onStep={setStage}
        onPrevious={stage === 1 ? () => move(-1) : stage > 0 ? () => setStage(stage - 1) : undefined}
        onNext={stage === 0 ? () => setStage(1) : stage === 1 ? () => move(1) : undefined} nextLabel={stage === 0 ? "학습 시작" : "다음 카드"}
        actions={<span className="workspace-page-count">암기 {knownCount} / {cards.length}</span>} />
      <div className="workspace-body">
      {notice && <p className="workspace-notice" role="status">{notice}</p>}
      <section className="vocab-layout">
        <form hidden={stage !== 0} className="vocab-add-panel" onSubmit={addCard}>
          <div className="mvp-panel-heading">
            <Plus size={18} />
            <strong>단어 추가</strong>
          </div>
          <div className="vocab-mascot-card">
            <div className="vocab-learning-mark" aria-hidden="true"><BookOpen size={32} /></div>
            <div>
              <span>암기율 {progress}%</span>
              <strong>{knownCount}/{cards.length}개</strong>
              <p>{reviewCards.length ? "외울 단어를 하나씩 넘겨보세요." : "오늘 단어를 모두 확인했습니다."}</p>
            </div>
          </div>
          <label className="mvp-field">
            <span>영단어</span>
            <input maxLength={80} required value={word} placeholder="예: journey" onChange={(event) => setWord(event.target.value)} />
          </label>
          <label className="mvp-field">
            <span>뜻</span>
            <input maxLength={150} required value={meaning} placeholder="예: 여행" onChange={(event) => setMeaning(event.target.value)} />
          </label>
          <label className="mvp-field">
            <span>예문</span>
            <input maxLength={300} value={example} placeholder="예: Reading is a journey." onChange={(event) => setExample(event.target.value)} />
          </label>
          <button className="button-primary justify-center" type="submit">
            <Plus size={18} />
            단어 추가
          </button>
        </form>

        <section hidden={stage !== 1} className="vocab-card-panel" aria-label="영단어 암기 카드">
          <div className="vocab-game-strip">
            <span>{activeIndex + 1}/{cards.length}</span>
            <span>{activeCard.known ? "암기 완료" : "복습 중"}</span>
            <span>{activeCard.hint}</span>
          </div>

          {allKnown ? (
            <div className="vocab-complete" role="status">
              <span className="vocab-complete-badge">
                <Check size={24} />
              </span>
              <strong>{cards.length}개 단어를 모두 외웠어요!</strong>
              <p>복습을 다시 시작하거나 단어를 추가해 이어가세요.</p>
              <button className="button-primary justify-center" type="button" onClick={restartReview}>
                <RotateCcw size={18} />
                복습 다시 시작
              </button>
            </div>
          ) : (
            <>
              <button className="vocab-flip-card" data-flipped={flipped} type="button" aria-pressed={flipped} onClick={() => setFlipped((current) => !current)}>
                <span className="vocab-flip-inner">
                  <span className="vocab-flip-face vocab-flip-front">
                    <span className="vocab-flip-tag">단어</span>
                    <strong>{activeCard.word}</strong>
                    <p>{activeCard.hint} 힌트를 보고 뜻을 떠올려보세요.</p>
                    <small>눌러서 뜻 보기</small>
                  </span>
                  <span className="vocab-flip-face vocab-flip-back">
                    <span className="vocab-flip-tag">뜻</span>
                    <strong>{activeCard.meaning}</strong>
                    <p>{activeCard.example}</p>
                    <small>눌러서 단어 보기</small>
                  </span>
                </span>
              </button>

              <div className="vocab-control-row">
                <button className="button-primary" type="button" onClick={handleKnownButton} disabled={!flipped && !activeCard.known}>
                  <Check size={18} />
                  {activeCard.known ? "다시 복습" : "외웠어요"}
                </button>
              </div>
              {!flipped && !activeCard.known ? (
                <p className="vocab-hint-note">뜻을 확인한 뒤 외웠는지 표시할 수 있어요.</p>
              ) : null}
            </>
          )}

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

        </section>
      </section>
          <div hidden={stage !== 2}>
          <PageControls page={listPage} total={Math.ceil(cards.length / 10)} onPage={setListPage} label="단어 목록 페이지" />
          <div className="vocab-list" aria-label="단어 목록">
            {cards.slice(listPage * 10, listPage * 10 + 10).map((card, offset) => { const index = listPage * 10 + offset; return (
              <button
                className={cards[activeIndex]?.id === card.id ? "is-active" : ""}
                key={card.id}
                type="button"
                onClick={() => {
                  setActiveIndex(index);
                  setFlipped(false);
                  setStage(1);
                }}
              >
                <span>{index + 1}</span>
                <strong>{card.word}</strong>
                <em>{card.known ? "완료" : "복습"}</em>
              </button>
            ); })}
          </div>
          </div>
      </div>
    </main>
  );
}
