"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Filter, Layers3, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AppCard } from "@/components/library/AppCard";
import { apps, categories, Difficulty, AppItem } from "@/data/apps";
import { getMvpSpec } from "@/data/mvp";
import { versionVisualAsset } from "@/lib/visuals";

const difficulties: Difficulty[] = ["하", "중", "상"];
const lightboxDifficultyClass = {
  하: "is-low",
  중: "is-mid",
  상: "is-high",
} as const;

export function LibraryClient() {
  const [category, setCategory] = useState("전체");
  const [difficulty, setDifficulty] = useState<Difficulty | "전체">("전체");
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const filteredApps = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return apps.filter((app) => {
      const categoryMatch = category === "전체" || app.category === category;
      const difficultyMatch = difficulty === "전체" || app.difficulty === difficulty;
      const keywordMatch =
        !keyword ||
        [app.title, app.shortDescription, app.category, app.tags.join(" "), app.buildBasis]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      return categoryMatch && difficultyMatch && keywordMatch;
    });
  }, [category, difficulty, query]);

  const visibleApps = filteredApps;
  const selectedApp = selectedSlug ? filteredApps.find((app) => app.slug === selectedSlug) ?? apps.find((app) => app.slug === selectedSlug) : undefined;

  function selectApp(app: AppItem) {
    setSelectedSlug(app.slug);
  }

  function selectAdjacentApp(direction: -1 | 1) {
    if (!selectedApp || filteredApps.length === 0) return;
    const currentIndex = filteredApps.findIndex((app) => app.slug === selectedApp.slug);
    const safeIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (safeIndex + direction + filteredApps.length) % filteredApps.length;
    setSelectedSlug(filteredApps[nextIndex].slug);
  }

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <section className="library-hero">
        <h1 className="sr-only">교육앱 아이디어 라이브러리</h1>
        <Image
          src="/visuals/library-showroom-wide.png"
          alt=""
          fill
          preload
          sizes="100vw"
          className="object-cover"
        />
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="filter-bar">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
            <input
              className="search-input"
              placeholder="앱 이름, 태그, 기술 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="filter-group" aria-label="난이도 필터">
            <Filter size={17} />
            {(["전체", ...difficulties] as const).map((item) => (
              <button
                className={`segmented-button ${difficulty === item ? "is-active" : ""}`}
                key={item}
                type="button"
                onClick={() => setDifficulty(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2" aria-label="카테고리 필터">
          <button
            className={`category-pill ${category === "전체" ? "is-active" : ""}`}
            type="button"
            onClick={() => setCategory("전체")}
          >
            <Layers3 size={16} />
            전체
          </button>
          {categories.map((item) => (
            <button
              className={`category-pill ${category === item ? "is-active" : ""}`}
              key={item}
              type="button"
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-[var(--muted)]">
            {filteredApps.length}개 앱
          </p>
          <button
            className="button-secondary"
            type="button"
            onClick={() => {
              setCategory("전체");
              setDifficulty("전체");
              setQuery("");
            }}
          >
            전체 보기
          </button>
        </div>

        <div className="app-card-grid mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {visibleApps.map((app, index) => (
            <AppCard app={app} key={app.slug} priority={index < 8} onSelect={selectApp} />
          ))}
        </div>

        {filteredApps.length === 0 ? (
          <div className="panel mt-8 p-8 text-center">
            <p className="text-lg font-semibold text-[var(--ink)]">검색 결과가 없습니다.</p>
            <p className="mt-2 text-sm font-normal text-[var(--muted)]">다른 단어나 필터로 다시 찾아보세요.</p>
          </div>
        ) : null}
      </section>

      {selectedApp ? (
        <AppLightbox
          app={selectedApp}
          key={selectedApp.slug}
          onClose={() => setSelectedSlug(null)}
          onPrevious={() => selectAdjacentApp(-1)}
          onNext={() => selectAdjacentApp(1)}
        />
      ) : null}
    </main>
  );
}

type AppLightboxProps = {
  app: AppItem;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

function AppLightbox({ app, onClose, onPrevious, onNext }: AppLightboxProps) {
  const spec = getMvpSpec(app);
  const experienceHref = app.externalUrl ?? `/apps/${app.slug}/work`;
  const galleryImages = app.previewImages.length > 0 ? app.previewImages : [app.thumbnail];
  const [imageIndex, setImageIndex] = useState(0);
  const activeImage = galleryImages[imageIndex] ?? galleryImages[0];
  const hasGallery = galleryImages.length > 1;

  function showPreviousImage() {
    setImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  }

  function showNextImage() {
    setImageIndex((current) => (current + 1) % galleryImages.length);
  }

  return (
    <Dialog.Root open onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <Dialog.Portal>
        <div className="lightbox">
          <Dialog.Overlay className="lightbox-scrim" />
          <Dialog.Content className="lightbox-panel showroom-lightbox-panel">
            <section className="lightbox-media showroom-lightbox-media" style={{ position: "relative" }} aria-label={`${app.title} 미리보기`}>
              <Image
                src={versionVisualAsset(activeImage)}
                alt={`${app.title} 미리보기 ${imageIndex + 1}`}
                fill
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-cover"
                preload
              />
              {hasGallery ? (
                <div className="lightbox-image-controls" aria-label="미리보기 이미지">
                  <button className="icon-button" type="button" aria-label="이전 이미지" onClick={showPreviousImage}>
                    <ChevronLeft size={19} />
                  </button>
                  <button className="icon-button" type="button" aria-label="다음 이미지" onClick={showNextImage}>
                    <ChevronRight size={19} />
                  </button>
                </div>
              ) : null}
              {hasGallery ? (
                <div className="lightbox-image-tabs" aria-label="미리보기 순서">
                  {galleryImages.map((image, index) => (
                    <button
                      className={`lightbox-image-tab ${imageIndex === index ? "is-active" : ""}`}
                      key={`${image}-${index}`}
                      type="button"
                      aria-label={`${index + 1}번 이미지`}
                      aria-current={imageIndex === index ? "true" : undefined}
                      onClick={() => setImageIndex(index)}
                    />
                  ))}
                </div>
              ) : null}
              <span className="lightbox-media-count">{imageIndex + 1} / {galleryImages.length}</span>
              <Dialog.Close asChild>
                <button className="icon-button lightbox-close-button" type="button" aria-label="닫기">
                  <X size={19} />
                </button>
              </Dialog.Close>
            </section>

            <section className="lightbox-content showroom-lightbox-content">
              <div className="app-detail-tags lightbox-tags">
                <span className={`lightbox-difficulty-chip ${lightboxDifficultyClass[app.difficulty]}`}>난이도 {app.difficulty}</span>
                <span className="lightbox-chip">{app.category}</span>
                <span className="lightbox-chip">{app.targetGrade}</span>
              </div>
              <Dialog.Title id="app-lightbox-title" className="lightbox-title">{app.title}</Dialog.Title>
              <Dialog.Description className="lightbox-description">{app.longDescription}</Dialog.Description>

              <dl className="lightbox-detail-list">
                <div>
                  <dt>수업 장면</dt>
                  <dd>{spec?.promise ?? app.shortDescription}</dd>
                </div>
                <div>
                  <dt>산출물</dt>
                  <dd>{spec?.output ?? app.actionLabel}</dd>
                </div>
                <div>
                  <dt>앱 소개</dt>
                  <dd>{app.shortDescription}</dd>
                </div>
              </dl>

              <div className="lightbox-actions showroom-lightbox-actions">
                <button className="button-secondary lightbox-previous-app" type="button" onClick={onPrevious}>
                  <ArrowLeft size={18} />
                  이전 앱
                </button>
                <Link className="button-primary showroom-experience-button" href={experienceHref} target={app.externalUrl ? "_blank" : undefined}>
                  앱 체험하기
                </Link>
                <button className="button-secondary lightbox-next-app" type="button" onClick={onNext}>
                  다음 앱
                  <ArrowRight size={18} />
                </button>
              </div>
            </section>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
