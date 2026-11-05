"use client";

import { Bot, BookOpenText, Download, Loader2, MessageSquareText, RotateCcw, Send } from "lucide-react";
import { useAiGeneration } from "@/components/mvp/useAiGeneration";
import { GenerationNotice, WorkspaceHeader } from "@/components/mvp/WorkspaceHeader";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";
import { downloadText } from "@/components/mvp/MvpStorage";

type AuthorChatbotWorkspaceProps = {
  app: AppItem;
  spec: MvpSpec;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const defaultSource =
  [
    "외진 길가에 떨어진 강아지똥은 스스로를 아무 쓸모없는 존재라고 여깁니다.",
    "지나가던 흙덩이와 동물들은 강아지똥을 반기지 않고, 강아지똥은 자신이 왜 태어났는지 오래 생각합니다.",
    "비가 오고 바람이 부는 동안에도 강아지똥은 그 자리에 남아 외로움과 부끄러움을 견딥니다.",
    "어느 날 민들레 씨앗이 찾아와 꽃을 피우려면 따뜻한 거름이 필요하다고 말합니다.",
    "강아지똥은 자신이 민들레를 살릴 수 있다는 사실을 알고 기꺼이 몸을 내어줍니다.",
    "마침내 길가에는 노란 민들레꽃이 피고, 작고 낮은 자리에 있던 강아지똥의 마음은 새 생명으로 이어집니다.",
    "이 이야기는 보잘것없어 보이는 존재에게도 누군가를 살리는 귀한 쓸모가 있다는 뜻을 전합니다.",
  ].join("\n");

const defaultAuthorPrompt = [
  "너는 「강아지똥」을 함께 읽는 작가야.",
  "다정하고 낮은 목소리로 말하고, 작은 존재의 쓸모와 생명의 따뜻함을 중심에 둬.",
  "원문 밖의 사실은 단정하지 말고 작품을 읽은 생각으로 말해줘.",
  "학생에게 보여줄 수 있도록 한국어 3-5문장으로 답해줘.",
].join("\n");

const tonePresets = [
  { id: "warm", label: "다정한 작가", hint: "따뜻하고 낮은 목소리", prompt: defaultAuthorPrompt },
  {
    id: "calm",
    label: "차분한 해설",
    hint: "담담하게 장면을 짚어요",
    prompt: [
      "너는 「강아지똥」을 함께 읽는 작가야.",
      "차분하고 담담한 말투로 작품의 장면을 천천히 짚어 줘.",
      "원문 밖의 사실은 단정하지 말고 작품을 읽은 생각으로 말해줘.",
      "학생에게 보여줄 수 있도록 한국어 3-5문장으로 답해줘.",
    ].join("\n"),
  },
  {
    id: "clear",
    label: "또박또박 선생님",
    hint: "핵심을 분명하게",
    prompt: [
      "너는 「강아지똥」을 함께 읽는 작가야.",
      "분명하고 또박또박한 말투로 핵심을 짚어 설명해 줘.",
      "원문 밖의 사실은 단정하지 말고 작품을 읽은 생각으로 말해줘.",
      "학생에게 보여줄 수 있도록 한국어 3-5문장으로 답해줘.",
    ].join("\n"),
  },
];

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content: "안녕. 강아지똥 이야기를 떠올리며 천천히 말해볼게. 궁금한 장면이나 마음에 남은 문장을 물어봐.",
  },
];

export function AuthorChatbotWorkspace({ app }: AuthorChatbotWorkspaceProps) {
  const [sourceText, setSourceText] = useState(defaultSource);
  const [tone, setTone] = useState("warm");
  const [question, setQuestion] = useState("강아지똥은 왜 민들레에게 자신을 내어주었나요?");
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const ai = useAiGeneration(app.slug);
  const loading = ai.pending;
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const recovered = useRef(false);
  const typingTimer = useRef<number | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- Restore the authenticated browser's completed conversation. */
  useEffect(() => {
    if (!ai.quota || recovered.current) return;
    recovered.current = true;
    const restored: ChatMessage[] = ai.history.flatMap((result) => typeof result.message === "string" ? [
      ...(typeof result.question === "string" ? [{ role: "user" as const, content: result.question }] : []),
      { role: "assistant" as const, content: result.message },
    ] : []);
    if (restored.length) setMessages([...starterMessages, ...restored]);
  }, [ai.quota, ai.history]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const authorPrompt = tonePresets.find((preset) => preset.id === tone)?.prompt ?? defaultAuthorPrompt;
  const busy = loading || typing;

  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        window.clearInterval(typingTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }, [messages, loading, typing, step]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion || busy || ai.unavailable) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: cleanQuestion }];
    setMessages(nextMessages);
    const data = await ai.generate({ values: { topic: "강아지똥", level: "작가와의 만남", notes: sourceText, question: cleanQuestion, authorPrompt }, messages: nextMessages });
    if (data?.message) { setQuestion(""); typeAssistantMessage(data.message); }
    else setMessages(messages);
  }

  function typeAssistantMessage(answer: string) {
    if (typingTimer.current) {
      window.clearInterval(typingTimer.current);
    }

    let index = 0;
    setTyping(true);
    setMessages((current) => [...current, { role: "assistant", content: "" }]);
    typingTimer.current = window.setInterval(() => {
      index += 2;
      setMessages((current) => {
        const next = [...current];
        const last = next[next.length - 1];
        if (!last || last.role !== "assistant") return current;
        next[next.length - 1] = { ...last, content: answer.slice(0, index) };
        return next;
      });

      if (index >= answer.length && typingTimer.current) {
        window.clearInterval(typingTimer.current);
        typingTimer.current = null;
        setTyping(false);
      }
    }, 22);
  }

  function openHistory() {
    const restored: ChatMessage[] = ai.history.flatMap((result) => typeof result.message === "string" ? [
      ...(typeof result.question === "string" ? [{ role: "user" as const, content: result.question }] : []),
      { role: "assistant" as const, content: result.message },
    ] : []);
    setMessages([...starterMessages, ...restored]);
  }

  function resetChat() {
    recovered.current = true;
    if (typingTimer.current) {
      window.clearInterval(typingTimer.current);
      typingTimer.current = null;
    }
    setMessages(starterMessages);
    setQuestion("강아지똥은 왜 민들레에게 자신을 내어주었나요?");
    setTyping(false);
    ai.clearError();
  }

  return (
    <main className="workspace-page author-chatbot-page">
      <WorkspaceHeader title={app.title} steps={["작품", "말투", "대화"]} current={step} onStep={setStep} busy={busy} quota={ai.quota} onPrevious={step > 0 ? () => setStep(step - 1) : undefined} onNext={step < 2 ? () => setStep(step + 1) : undefined} nextLabel={step === 1 ? "대화 시작" : "다음"} />
      <div className="workspace-body">
      <GenerationNotice exhausted={ai.quota?.remaining === 0} error={ai.error} pending={Boolean(ai.quota?.busy) && !ai.pending} onRetry={() => { ai.clearError(); void ai.refresh(); }} />
      <section className="author-chat-layout">
        <aside className="author-source-panel" hidden={step === 2}>
          <div className="mvp-panel-heading">
            <MessageSquareText size={18} />
            <strong>챗봇 설정</strong>
          </div>
          <section className="author-prompt-card" aria-label="작가 말투" hidden={step !== 1}>
            <div className="author-source-title">
              <span><MessageSquareText size={15} /> 작가 말투</span>
              <strong>{tonePresets.find((preset) => preset.id === tone)?.label}</strong>
            </div>
            <div className="author-tone-row">
              {tonePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`author-tone-chip ${tone === preset.id ? "is-active" : ""}`}
                  aria-pressed={tone === preset.id}
                  onClick={() => setTone(preset.id)}
                >
                  <strong>{preset.label}</strong>
                  <span>{preset.hint}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="author-source-stack" aria-label="작품 내용" hidden={step !== 0}>
            <div className="author-source-title">
              <span><BookOpenText size={15} /> 작품 내용</span>
              <strong>강아지똥 · 예시 줄거리</strong>
            </div>
            <label className="mvp-field author-source-field">
              <span>줄거리·발췌문</span>
              <textarea maxLength={16000} value={sourceText} onChange={(event) => setSourceText(event.target.value)} />
            </label>
          </section>
        </aside>

        <section className="author-chat-panel" aria-label="작가와의 대화방" hidden={step !== 2}>
          <div className="author-chat-header">
            <span><Bot size={18} /> 작가와의 만남</span>
            <div className="author-chat-actions">
            {messages.length === 1 && ai.history.length > 0 && <button className="button-secondary" type="button" onClick={openHistory}>이전 답변</button>}
            {messages.length > 1 && <button className="button-secondary" type="button" disabled={busy} onClick={() => downloadText("작가와의-대화.txt", messages.map((message) => `${message.role === "user" ? "질문" : "답변"}: ${message.content}`).join("\n\n"))}><Download size={16} />대화 저장</button>}
            <button className="button-secondary" type="button" onClick={resetChat} disabled={busy}>
              <RotateCcw size={17} />
              새 대화
            </button>
            </div>
          </div>

          <div className="author-chat-thread" aria-live="polite" ref={threadRef}>
            {messages.map((message, index) => (
              <article className={`author-chat-bubble ${message.role}`} key={`${message.role}-${index}`}>
                {message.content ? <MarkdownMessage text={message.content} /> : "…"}
              </article>
            ))}
            {loading ? (
              <article className="author-chat-bubble assistant is-loading">
                <Loader2 className="animate-spin" size={16} />
                작품을 다시 읽고 있어요.
              </article>
            ) : null}
          </div>

          <form className="author-chat-form" onSubmit={submit}>
            <input
              aria-label="작가에게 질문"
              maxLength={4000}
              value={question}
              disabled={busy}
              placeholder={busy ? "작가가 답하는 중이에요" : "작가에게 묻고 싶은 말을 입력하세요."}
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button className="button-primary" disabled={busy || ai.unavailable || !question.trim()} type="submit" aria-label="보내기">
              {busy ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
        </section>
      </section>
      </div>
    </main>
  );
}

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "ordered"; items: string[] }
  | { type: "unordered"; items: string[] }
  | { type: "paragraph"; text: string };

function MarkdownMessage({ text }: { text: string }) {
  const blocks = parseMarkdownBlocks(text);

  return (
    <div className="author-chat-markdown">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const HeadingTag = `h${block.level}` as "h1" | "h2" | "h3";
          return <HeadingTag key={`${block.type}-${index}`}>{renderInlineMarkdown(block.text)}</HeadingTag>;
        }

        if (block.type === "ordered") {
          return (
            <ol key={`${block.type}-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === "unordered") {
          return (
            <ul key={`${block.type}-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>
              ))}
            </ul>
          );
        }

        return <p key={`${block.type}-${index}`}>{renderInlineMarkdown(block.text)}</p>;
      })}
    </div>
  );
}

function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let listType: "ordered" | "unordered" | null = null;
  let listItems: string[] = [];

  function flushParagraph() {
    const content = paragraph.join(" ").trim();
    if (content) {
      blocks.push({ type: "paragraph", text: content });
    }
    paragraph = [];
  }

  function flushList() {
    if (listType && listItems.length) {
      blocks.push({ type: listType, items: listItems });
    }
    listType = null;
    listItems = [];
  }

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2].trim(),
      });
      return;
    }

    const orderedMatch = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (orderedMatch) {
      flushParagraph();
      if (listType !== "ordered") {
        flushList();
        listType = "ordered";
      }
      listItems.push(orderedMatch[1].trim());
      return;
    }

    const unorderedMatch = /^[-*]\s+(.+)$/.exec(trimmed);
    if (unorderedMatch) {
      flushParagraph();
      if (listType !== "unordered") {
        flushList();
        listType = "unordered";
      }
      listItems.push(unorderedMatch[1].trim());
      return;
    }

    flushList();
    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();

  return blocks.length ? blocks : [{ type: "paragraph", text }];
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("`")) {
      nodes.push(<code key={`code-${match.index}`}>{token.slice(1, -1)}</code>);
    } else {
      nodes.push(<strong key={`strong-${match.index}`}>{token.slice(2, -2)}</strong>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
