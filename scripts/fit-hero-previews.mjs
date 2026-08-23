import { readdir, readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const INTAKE = path.join(ROOT, "tmp/hero-intake");
const OUT_DIR = path.join(ROOT, "public/visuals/landing-previews");

const TARGET_W = 900;
const TARGET_H = 1125;
const RATIO = TARGET_W / TARGET_H;

// 카드 하단 25%를 흰 라벨이 덮으므로 세로가 남으면 위쪽을 더 살린다.
const TOP_BIAS = 0.3;

// 가로가 남을 때 남길 구간의 중심. 0이면 왼쪽 끝, 1이면 오른쪽 끝.
const FOCUS_X = {
  "ml-microbit-studio": 0.55,
  "class-suggestion-box": 0.38,
  "boardgame-rental-desk": 0.6,
  "digital-reading-passport": 0.56,
  "neon-rhythm-runner": 0.55,
  "live-class-poll": 0.5,
  "seat-shuffle-picker": 0.5,
  "liberation-text-adventure": 0.56,
};

const ACCEPTED = new Set([".png", ".jpg", ".jpeg", ".webp"]);

async function knownSlugs() {
  const source = await readFile(path.join(ROOT, "src/data/apps.ts"), "utf8");
  return new Set([...source.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));
}

function cropBox(width, height, slug) {
  const sourceRatio = width / height;
  if (Math.abs(sourceRatio - RATIO) < 0.001) {
    return { left: 0, top: 0, width, height };
  }
  if (sourceRatio > RATIO) {
    const cropWidth = Math.round(height * RATIO);
    const focus = FOCUS_X[slug] ?? 0.5;
    const left = Math.round(focus * width - cropWidth / 2);
    return { left: clamp(left, 0, width - cropWidth), top: 0, width: cropWidth, height };
  }
  const cropHeight = Math.round(width / RATIO);
  return { left: 0, top: Math.round((height - cropHeight) * TOP_BIAS), width, height: cropHeight };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const slugs = await knownSlugs();
await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(INTAKE).catch(() => []))
  .filter((name) => ACCEPTED.has(path.extname(name).toLowerCase()))
  .sort();

if (files.length === 0) {
  console.log(`비어 있음: ${path.relative(ROOT, INTAKE)}`);
  console.log("파일 이름을 <slug>.png 로 넣어 주세요.");
  process.exit(0);
}

let done = 0;
for (const file of files) {
  const slug = path.basename(file, path.extname(file)).replace(/-hero$/, "");
  if (!slugs.has(slug)) {
    console.log(`건너뜀  ${file} — apps.ts에 없는 슬러그 (${slug})`);
    continue;
  }

  const input = path.join(INTAKE, file);
  const { width, height } = await sharp(input).metadata();
  const box = cropBox(width, height, slug);
  const output = path.join(OUT_DIR, `${slug}-hero.png`);

  await sharp(input)
    .extract(box)
    .resize(TARGET_W, TARGET_H, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toFile(output);

  const trimmed = width - box.width > 0 ? `가로 -${width - box.width}px` : `세로 -${height - box.height}px`;
  console.log(`완료  ${slug}  ${width}x${height} → ${TARGET_W}x${TARGET_H}  (${height === box.height && width === box.width ? "잘림 없음" : trimmed})`);
  done += 1;
}

console.log(`\n${done}장 처리 → ${path.relative(ROOT, OUT_DIR)}/<slug>-hero.png`);
