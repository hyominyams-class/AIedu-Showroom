import Image from "next/image";
import Link from "next/link";
import { apps, difficultyLabels, type AppItem } from "@/data/apps";
import { versionVisualAsset } from "@/lib/visuals";

const heroShowcaseApps = apps;
const heroMarqueeApps = [...heroShowcaseApps, ...heroShowcaseApps];

const landingPreviewImages: Partial<Record<AppItem["slug"], string>> = {
  "author-meet-chatbot": "/visuals/landing-previews/author-meet-chatbot.png",
  "class-timer-station": "/visuals/landing-previews/class-timer-station.png",
  "concept-explainer": "/visuals/landing-previews/concept-explainer.png",
  "english-vocab-cards": "/visuals/landing-previews/english-vocab-cards.png",
  "addition-card-match-game": "/visuals/landing-previews/addition-card-match-game.png",
  "history-typing-rain": "/visuals/landing-previews/history-typing-rain.png",
  "ai-invention-lab": "/visuals/landing-previews/ai-invention-lab.png",
  "picturebook-scene-maker": "/visuals/landing-previews/picturebook-scene-maker.png",
  "poetry-picture-maker": "/visuals/landing-previews/poetry-picture-maker.png",
  "ai-question-helper": "/visuals/landing-previews/ai-question-helper.png",
  "digital-reading-passport": "/visuals/landing-previews/digital-reading-passport-hero.png",
  "ml-microbit-studio": "/visuals/landing-previews/ml-microbit-studio-hero.png",
  "neon-rhythm-runner": "/visuals/landing-previews/neon-rhythm-runner-hero.png",
  "liberation-text-adventure": "/visuals/landing-previews/liberation-text-adventure-hero.png",
  "seat-shuffle-picker": "/visuals/landing-previews/seat-shuffle-picker-hero.png",
  "class-suggestion-box": "/visuals/landing-previews/class-suggestion-box-hero.png",
  "boardgame-rental-desk": "/visuals/landing-previews/boardgame-rental-desk-hero.png",
  "live-class-poll": "/visuals/landing-previews/live-class-poll-hero.png",
};

export function HeroSection() {
  return (
    <main className="hero-shell">
      <div className="hero-backdrop" />
      <div className="hero-texture" />
      <section className="relative z-10 flex min-h-screen w-full flex-col justify-between px-4 pt-8 pb-0 sm:px-8 lg:px-12 xl:px-16">
        <Link className="hero-login-button button-secondary" href="/login">
          입장하기
        </Link>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker">AI로 만드는 나만의 교육도구</p>
            <h1 className="font-display hero-title text-[var(--ink)]">
              <span>AI EDU</span>
              <span>ShowRoom</span>
            </h1>
            <p className="hero-lede">
              교실 활동, 평가, 창작, 데이터 수업에 쓰는 AI 앱을 한 자리에서 살펴보세요.
            </p>
            <div className="hero-proof-row" aria-label="쇼룸 앱 정보">
              <span>{apps.length}개 앱</span>
              <span>{new Set(apps.map((app) => app.category)).size}개 수업 영역</span>
              <span>난이도 {Object.values(difficultyLabels).join(" · ")}</span>
            </div>
          </div>
        </div>

        <div className="hero-showcase" aria-label="앱 미리보기">
          <div className="hero-showcase-track">
            {heroMarqueeApps.map((app, index) => (
              <article
                aria-hidden={index >= heroShowcaseApps.length}
                className={`hero-preview-card hero-preview-card-${(index % 6) + 1}`}
                key={`${app.slug}-${index}`}
              >
                <span className="hero-preview-media">
                  <Image
                    src={versionVisualAsset(landingPreviewImages[app.slug] ?? app.previewImages[1] ?? app.thumbnail)}
                    alt=""
                    fill
                    preload={index < 3}
                    sizes="(min-width: 1280px) 300px, (min-width: 768px) 28vw, 72vw"
                    className="object-cover"
                  />
                </span>
                <span className="hero-preview-copy">
                  <span>{app.category}</span>
                  <strong>{app.title}</strong>
                  <small>{difficultyLabels[app.difficulty]}</small>
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
