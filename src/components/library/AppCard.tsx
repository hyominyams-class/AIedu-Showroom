import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { AppItem, difficultyLabels } from "@/data/apps";
import { getMvpSpec } from "@/data/mvp";
import { versionVisualAsset } from "@/lib/visuals";

const difficultyClass = {
  하: "difficulty-low",
  중: "difficulty-mid",
  상: "difficulty-high",
} as const;

const cardDifficultyClass = {
  하: "app-card-low",
  중: "app-card-mid",
  상: "app-card-high",
} as const;

type AppCardProps = {
  app: AppItem;
  priority?: boolean;
  onSelect?: (app: AppItem) => void;
};

export function AppCard({ app, priority = false, onSelect }: AppCardProps) {
  const spec = getMvpSpec(app);
  const cardContent = (
    <>
      <span className="app-card-media" style={{ position: "relative" }}>
        <Image
          src={versionVisualAsset(app.thumbnail)}
          alt={`${app.title} 미리보기`}
          fill
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 100vw"
          className="app-card-image"
        />
        <span className={`difficulty-badge ${difficultyClass[app.difficulty]}`}>{app.difficulty}</span>
        {app.status === "maintenance" ? <span className="status-badge">점검 중</span> : null}
        <span className="app-card-media-label">
          <span>{app.category}</span>
          <strong>{app.targetGrade}</strong>
        </span>
      </span>
      <span className="app-card-body">
        <span className="app-card-topline">
          <span className="app-card-category">{difficultyLabels[app.difficulty]}</span>
          <span className="app-card-arrow">
            <ArrowUpRight size={18} />
          </span>
        </span>
        <span className="text-xl font-bold leading-7 text-[var(--ink)]">{app.title}</span>
        <span className="app-card-promise">
          {spec?.promise ?? app.shortDescription}
        </span>
        <span className="app-card-output">
          <span>핵심 키워드</span>
          <span className="app-card-keyword-row">
            {app.keywords.slice(0, 4).map((keyword) => (
              <span className="app-card-keyword" key={keyword}>
                {keyword}
              </span>
            ))}
          </span>
        </span>
        <span className="app-card-meta">
          <span>{app.buildBasis}</span>
          <span>{app.lessonUse}</span>
        </span>
        <span className="mt-auto flex flex-wrap gap-2 pt-5">
          {app.tags.slice(0, 3).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </span>
      </span>
    </>
  );

  return (
    <button
      className={`app-card ${cardDifficultyClass[app.difficulty]} group text-left`}
      aria-label={`${app.title} 설명 보기`}
      type="button"
      onClick={() => onSelect?.(app)}
    >
      {cardContent}
    </button>
  );
}
