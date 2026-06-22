"use client";

import { Bot, BookOpenText, Loader2, MessageSquareText, RotateCcw, Send } from "lucide-react";
import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { AppItem } from "@/data/apps";
import { MvpSpec } from "@/data/mvp";

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

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content: "안녕. 강아지똥 이야기를 떠올리며 천천히 말해볼게. 궁금한 장면이나 마음에 남은 문장을 물어봐.",
  },
];

export function AuthorChatbotWorkspace({ app, spec }: AuthorChatbotWorkspaceProps) {
  const [sourceText, setSourceText] = useState(defaultSource);
  const [authorPrompt, setAuthorPrompt] = useState(defaultAuthorPrompt);
  const [question, setQuestion] = useState("강아지똥은 왜 민들레에게 자신을 내어주었나요?");
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [loading, setLoading] = useState(false);
  const typingTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        window.clearInterval(typingTimer.current);
      }
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: cleanQuestion }];
    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    let answer = "";
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appSlug: app.slug,
          mode: "chat",
          values: {
            topic: "강아지똥",
            level: "작가와의 만남",
            notes: sourceText,
            question: cleanQuestion,
            authorPrompt,
          },
          messages: nextMessages,
        }),
      });
      const data = await response.json();
      answer = data?.message || data?.lead || fallbackAnswer(cleanQuestion, sourceText, authorPrompt);
    } catch {
      answer = fallbackAnswer(cleanQuestion, sourceText, authorPrompt);
    }

    setLoading(false);
    typeAssistantMessage(answer);
  }

  function typeAssistantMessage(answer: string) {
    if (typingTimer.current) {
      window.clearInterval(typingTimer.current);
    }

    let index = 0;
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
      }
    }, 22);
  }

  function resetChat() {
    if (typingTimer.current) {
      window.clearInterval(typingTimer.current);
      typingTimer.current = null;
    }
    setMessages(starterMessages);
    setQuestion("강아지똥은 왜 민들레에게 자신을 내어주었나요?");
    setLoading(false);
  }

  return (
    <main className="mvp-page app-special-page author-chatbot-page">
      <section className="mvp-topbar mvp-showroom-hero mvp-work-hero">
        <div className="mvp-hero-copy">
          <div className="mvp-hero-title-row">
            <h1>{app.title}</h1>
            <span className="mvp-surface-icon">
              <Bot size={17} />
              대화방
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

      <section className="author-chat-layout">
        <aside className="author-source-panel">
          <div className="mvp-panel-heading">
            <MessageSquareText size={18} />
            <strong>챗봇 설정</strong>
          </div>
          <section className="author-prompt-card" aria-label="페르소나 프롬프트">
            <div className="author-source-title">
              <span><MessageSquareText size={15} /> 페르소나 프롬프트</span>
              <strong>수정 가능</strong>
            </div>
            <div className="author-prompt-example">
              <label className="mvp-field author-prompt-field">
                <span>페르소나</span>
                <textarea value={authorPrompt} onChange={(event) => setAuthorPrompt(event.target.value)} />
              </label>
            </div>
          </section>

          <section className="author-source-stack" aria-label="동화책 원문">
            <div className="author-source-title">
              <span><BookOpenText size={15} /> 동화책 원문</span>
              <strong>강아지똥</strong>
            </div>
            <label className="mvp-field author-source-field">
              <span>원문</span>
              <textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} />
            </label>
          </section>
        </aside>

        <section className="author-chat-panel" aria-label="작가와의 대화방">
          <div className="author-chat-header">
            <span><Bot size={18} /> 작가와의 만남</span>
            <button className="button-secondary" type="button" onClick={resetChat}>
              <RotateCcw size={17} />
              새 대화
            </button>
          </div>

          <div className="author-chat-thread" aria-live="polite">
            {messages.map((message, index) => (
              <article className={`author-chat-bubble ${message.role}`} key={`${message.role}-${index}`}>
                {message.content ? <MarkdownMessage text={message.content} /> : "답변을 쓰는 중..."}
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
              value={question}
              placeholder="작가에게 묻고 싶은 말을 입력하세요."
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button className="button-primary" disabled={loading || !question.trim()} type="submit" aria-label="보내기">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

function fallbackAnswer(question: string, sourceText: string, authorPrompt: string) {
  const source = sourceText.trim() || defaultSource;
  const prompt = authorPrompt.trim();
  const sourceLine = source.split(/\r?\n/).find((line) => line.trim())?.trim() || "강아지똥은 민들레를 피우는 거름이 됩니다.";

  if (/한\s*문장|짧게|간단/.test(prompt)) {
    return `강아지똥은 ${sourceLine} 그래서 자신이 누군가에게 필요할 수 있다는 마음으로 민들레에게 자신을 내어주었을 거예요.`;
  }

  if (/까칠|시크|퉁명|무뚝뚝|냉소|삐딱/.test(prompt)) {
    return [
      "글쎄, 대단한 이유를 새로 만들 필요는 없어.",
      `${sourceLine} 그러니까 ${question}에 대한 답도 꽤 분명하지.`,
      "자기가 할 수 있는 일이 그거였고, 처음으로 자기 쓸모를 찾았으니까 내어준 거야.",
    ].join(" ");
  }

  if (/엄격|분명|단호|비판/.test(prompt)) {
    return [
      "강아지똥의 선택은 자기 역할을 찾은 결정으로 볼 수 있어요.",
      `${sourceLine} 이 흐름은 쓸모없어 보이던 존재가 생명을 돕는 순간을 보여줍니다.`,
      `${question} 이 질문에는, 민들레를 살릴 수 있는 일이 자기에게 주어진 가장 분명한 역할이었기 때문이라고 답할 수 있어요.`,
    ].join(" ");
  }

  return [
    `네 질문을 들으니 강아지똥이 오래 품고 있던 마음이 떠오르네.`,
    `작품에서는 ${sourceLine}`,
    `${question} 이 질문에는 이렇게 답하고 싶어. 자신을 내어준다는 것은 사라지는 일이 아니라, 다른 생명 안에서 다시 피어나는 일이란다.`,
  ].join(" ");
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
