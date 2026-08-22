import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const skillRequire = createRequire("/Users/user/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js");
    return import(skillRequire.resolve("playwright"));
  }
}

const playwright = await loadPlaywright();
const chromium = playwright.chromium ?? playwright.default?.chromium;
if (!chromium) throw new Error("Playwright chromium launcher was not found");

const thumbDir = path.resolve("public/visuals/generated-thumbnails");
const previewDir = path.resolve("public/visuals/landing-previews");
fs.mkdirSync(thumbDir, { recursive: true });
fs.mkdirSync(previewDir, { recursive: true });

// Each externally hosted showroom app gets two real screenshots of the live service:
// a hero frame for the card thumbnail and one inner frame for the lightbox gallery.
// Frames are 4:3 so they survive both the card crop and the taller lightbox crop.
const shots = [
  {
    file: path.join(thumbDir, "digital-reading-passport.png"),
    url: "https://reading-passport-xga6.vercel.app/",
    width: 1080,
  },
  {
    file: path.join(previewDir, "digital-reading-passport.png"),
    url: "https://reading-passport-xga6.vercel.app/landing",
    width: 1080,
    anchor: "세계와 연결되는",
    anchorOffset: -70,
  },
  {
    file: path.join(thumbDir, "national-heritage-map.png"),
    url: "https://history-map-chi.vercel.app/",
    width: 1200,
  },
  {
    file: path.join(previewDir, "national-heritage-map.png"),
    url: "https://history-map-chi.vercel.app/",
    width: 1200,
    anchor: "기록이 지도에 오르기까지",
    anchorOffset: -90,
  },
  {
    file: path.join(thumbDir, "ml-microbit-studio.png"),
    url: "https://ml-microbit.vercel.app/",
    width: 820,
    anchor: "내가 정한 손모양을 직접 가르치는 모델",
    anchorOffset: -34,
    clip: true,
  },
  {
    file: path.join(previewDir, "ml-microbit-studio.png"),
    url: "https://ml-microbit.vercel.app/",
    width: 900,
  },
];

const browser = await chromium.launch();

async function capture(shot) {
  const height = Math.round((shot.width * 3) / 4);
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.clip ? Math.max(height, 1400) : height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  try {
    await page.goto(shot.url, { waitUntil: "networkidle", timeout: 60000 });
  } catch {
    await page.goto(shot.url, { waitUntil: "domcontentloaded", timeout: 60000 });
  }
  await page.waitForTimeout(2800);

  let top = 0;
  if (shot.anchor) {
    top = await page.evaluate((text) => {
      const node = [...document.querySelectorAll("h1,h2,h3,h4,p,span,div")].find(
        (el) => el.textContent?.trim() === text || el.textContent?.trim().startsWith(text),
      );
      return node ? Math.round(node.getBoundingClientRect().top + window.scrollY) : 0;
    }, shot.anchor);
    if (!top) throw new Error(`anchor not found: ${shot.anchor}`);
    top = Math.max(0, top + (shot.anchorOffset ?? 0));
  }

  let buffer;
  if (shot.clip) {
    buffer = await page.screenshot({ fullPage: true, clip: { x: 0, y: top, width: shot.width, height } });
  } else {
    if (top) {
      await page.evaluate((y) => window.scrollTo(0, y), top);
      await page.waitForTimeout(1500);
    }
    buffer = await page.screenshot();
  }

  fs.writeFileSync(shot.file, buffer);
  console.log(`saved ${path.basename(path.dirname(shot.file))}/${path.basename(shot.file)} (${buffer.length} bytes)`);
  await context.close();
}

for (const shot of shots) {
  await capture(shot);
}

await browser.close();
console.log("done");
