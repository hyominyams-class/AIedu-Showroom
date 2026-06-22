import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const outDir = join(process.cwd(), "public", "visuals");
const thumbnailDir = join(outDir, "generated-thumbnails");
const landingDir = join(outDir, "landing-previews");
mkdirSync(outDir, { recursive: true });
mkdirSync(thumbnailDir, { recursive: true });
mkdirSync(landingDir, { recursive: true });

const apps = [
  ["class-timer-station", "timer", "#e8d9b8", "#1b2f3a", "#f26f4b", "#2f8f83"],
  ["english-vocab-cards", "flipcards", "#dfe8ce", "#1e3325", "#d94f45", "#3f6ba8"],
  ["history-typing-rain", "typingrain", "#dbe9ee", "#21313f", "#c24d2c", "#2f7a69"],
  ["quiz-card-builder", "cards", "#dfe8ce", "#1e3325", "#d94f45", "#3f6ba8"],
  ["reading-passport-stampbook", "passport", "#e5dfd2", "#28303f", "#c24d2c", "#1f7a69"],
  ["cardnews-campaign-maker", "news", "#e2dfc8", "#252525", "#dfb335", "#38726b"],
  ["science-experiment-cards", "lab", "#d9e6e3", "#1c3335", "#da5c38", "#3c78a8"],
  ["picturebook-scene-maker", "book", "#e9d7d1", "#2d2430", "#407f77", "#d69b38"],
  ["ai-question-helper", "chat", "#dce7df", "#25342e", "#d45b46", "#466ea6"],
  ["presentation-feedback-coach", "podium", "#e6dfca", "#2b2c30", "#c6533a", "#2f817b"],
  ["ai-invention-lab", "blueprint", "#d8e4df", "#1c3038", "#d1633e", "#346fa3"],
  ["safety-webtoon-maker", "comic", "#eadbc6", "#2f2926", "#d84d43", "#2f7f78"],
  ["microbit-iot-dashboard", "dashboard", "#d8e2d4", "#1e3028", "#d85a3d", "#336aa0"],
  ["project-portfolio-studio", "kanban", "#e3dac8", "#2a2b30", "#d9a531", "#356f68"],
  ["local-issue-data-map", "map", "#dbe5dc", "#24352f", "#ca513d", "#3a72a7"],
  ["learning-analytics-report", "chart", "#e5dccb", "#263040", "#cf5a3f", "#327b71"],
  ["class-chatbot-hub", "network", "#deded3", "#232c38", "#d15b42", "#386da2"],
];

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function hex(color) {
  const value = color.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
    255,
  ];
}

function createCanvas(width, height, bg) {
  const pixels = new Uint8Array(width * height * 4);
  const [r, g, b, a] = hex(bg);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
    pixels[i + 3] = a;
  }

  return {
    width,
    height,
    pixels,
    rect(x, y, w, h, color) {
      const [rr, gg, bb, aa] = hex(color);
      for (let yy = Math.max(0, y); yy < Math.min(height, y + h); yy += 1) {
        for (let xx = Math.max(0, x); xx < Math.min(width, x + w); xx += 1) {
          const idx = (yy * width + xx) * 4;
          pixels[idx] = rr;
          pixels[idx + 1] = gg;
          pixels[idx + 2] = bb;
          pixels[idx + 3] = aa;
        }
      }
    },
    strokeRect(x, y, w, h, color, size = 6) {
      this.rect(x, y, w, size, color);
      this.rect(x, y + h - size, w, size, color);
      this.rect(x, y, size, h, color);
      this.rect(x + w - size, y, size, h, color);
    },
    circle(cx, cy, radius, color) {
      const [rr, gg, bb, aa] = hex(color);
      const r2 = radius * radius;
      for (let y = cy - radius; y <= cy + radius; y += 1) {
        for (let x = cx - radius; x <= cx + radius; x += 1) {
          if (x < 0 || y < 0 || x >= width || y >= height) continue;
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= r2) {
            const idx = (y * width + x) * 4;
            pixels[idx] = rr;
            pixels[idx + 1] = gg;
            pixels[idx + 2] = bb;
            pixels[idx + 3] = aa;
          }
        }
      }
    },
    line(x0, y0, x1, y1, color, size = 5) {
      const dx = Math.abs(x1 - x0);
      const sx = x0 < x1 ? 1 : -1;
      const dy = -Math.abs(y1 - y0);
      const sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      let x = x0;
      let y = y0;
      while (true) {
        this.rect(x - Math.floor(size / 2), y - Math.floor(size / 2), size, size, color);
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
          err += dy;
          x += sx;
        }
        if (e2 <= dx) {
          err += dx;
          y += sy;
        }
      }
    },
    dots(color, gap = 48, radius = 4) {
      for (let y = 32; y < height; y += gap) {
        for (let x = 32; x < width; x += gap) {
          this.circle(x, y, radius, color);
        }
      }
    },
  };
}

function encodePng(canvas) {
  const { width, height, pixels } = canvas;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    Buffer.from(pixels.buffer, y * width * 4, width * 4).copy(raw, row + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND"),
  ]);
}

function drawFrame(c, ink, accent, second) {
  c.strokeRect(78, 72, c.width - 156, c.height - 144, ink, 12);
  c.rect(112, 112, c.width - 224, 54, ink);
  c.circle(148, 139, 13, accent);
  c.circle(188, 139, 13, second);
  c.circle(228, 139, 13, "#f3efe5");
}

function drawMotif(c, motif, ink, accent, second, preview = false) {
  c.dots("#f3efe5", 52, 4);
  drawFrame(c, ink, accent, second);
  const top = preview ? 196 : 210;
  const left = 142;
  const right = c.width - 142;
  const bottom = c.height - 126;

  if (motif === "timer") {
    c.circle(c.width / 2, top + 170, 126, "#f3efe5");
    c.circle(c.width / 2, top + 170, 98, ink);
    c.line(c.width / 2, top + 170, c.width / 2, top + 105, accent, 12);
    c.line(c.width / 2, top + 170, c.width / 2 + 72, top + 196, second, 12);
    c.rect(left, bottom - 90, right - left, 36, accent);
    c.rect(left, bottom - 34, Math.floor((right - left) * 0.62), 36, second);
  } else if (motif === "flipcards") {
    c.rect(left + 92, top + 36, 220, 270, "#fffaf0");
    c.strokeRect(left + 92, top + 36, 220, 270, ink, 8);
    c.rect(left + 122, top + 76, 120, 22, accent);
    c.circle(left + 202, top + 174, 54, second);
    c.circle(left + 184, top + 158, 8, ink);
    c.circle(left + 220, top + 158, 8, ink);
    c.rect(left + 174, top + 196, 56, 10, ink);
    c.rect(left + 352, top + 66, 220, 270, "#f3efe5");
    c.strokeRect(left + 352, top + 66, 220, 270, ink, 8);
    c.rect(left + 388, top + 116, 140, 18, second);
    c.rect(left + 388, top + 168, 96, 16, ink);
    c.rect(left + 388, top + 216, 128, 16, ink);
    c.circle(left + 600, top + 78, 28, accent);
    c.circle(left + 66, top + 280, 22, second);
  } else if (motif === "typingrain") {
    c.rect(left + 34, top + 250, 600, 74, "#c89565");
    c.strokeRect(left + 34, top + 250, 600, 74, ink, 7);
    c.rect(left + 84, top + 34, 122, 64, "#fffaf0");
    c.strokeRect(left + 84, top + 34, 122, 64, ink, 6);
    c.rect(left + 114, top + 56, 62, 12, accent);
    c.rect(left + 294, top + 74, 148, 70, "#fffaf0");
    c.strokeRect(left + 294, top + 74, 148, 70, ink, 6);
    c.rect(left + 326, top + 100, 84, 12, second);
    c.rect(left + 488, top + 20, 132, 66, "#fffaf0");
    c.strokeRect(left + 488, top + 20, 132, 66, ink, 6);
    c.rect(left + 520, top + 46, 70, 12, accent);
    c.line(left + 136, top + 110, left + 136, top + 214, second, 7);
    c.line(left + 366, top + 154, left + 366, top + 230, accent, 7);
    c.line(left + 554, top + 98, left + 554, top + 218, second, 7);
    for (let i = 0; i < 8; i += 1) {
      c.rect(left + 82 + i * 62, top + 282, 34, 18, i % 2 ? "#9f6f4a" : "#b98459");
    }
  } else if (motif === "cards") {
    for (let i = 0; i < 4; i += 1) {
      c.rect(left + i * 112, top + i * 24, 210, 160, i % 2 ? "#f3efe5" : "#fffaf0");
      c.strokeRect(left + i * 112, top + i * 24, 210, 160, ink, 7);
      c.rect(left + i * 112 + 28, top + i * 24 + 36, 112, 16, accent);
      c.rect(left + i * 112 + 28, top + i * 24 + 78, 148, 12, second);
    }
  } else if (motif === "passport") {
    c.rect(left + 84, top, 390, 310, "#f3efe5");
    c.strokeRect(left + 84, top, 390, 310, ink, 9);
    c.line(left + 279, top, left + 279, top + 310, ink, 5);
    c.circle(left + 180, top + 150, 58, accent);
    c.strokeRect(left + 318, top + 78, 112, 86, second, 8);
    c.rect(left + 318, top + 204, 126, 16, ink);
  } else if (motif === "news") {
    for (let i = 0; i < 4; i += 1) {
      const x = left + (i % 2) * 282;
      const y = top + Math.floor(i / 2) * 174;
      c.rect(x, y, 242, 142, "#fffaf0");
      c.strokeRect(x, y, 242, 142, ink, 7);
      c.rect(x + 24, y + 24, 82, 18, i % 2 ? second : accent);
      c.rect(x + 24, y + 66, 164, 12, ink);
      c.rect(x + 24, y + 96, 112, 12, ink);
    }
  } else if (motif === "lab") {
    c.line(left + 120, top + 260, left + 260, top + 60, ink, 14);
    c.line(left + 260, top + 60, left + 420, top + 260, ink, 14);
    c.rect(left + 88, top + 260, 380, 18, ink);
    c.circle(left + 260, top + 176, 56, accent);
    c.circle(left + 338, top + 224, 34, second);
    c.rect(left + 525, top + 44, 90, 250, "#f3efe5");
    c.strokeRect(left + 525, top + 44, 90, 250, ink, 8);
    c.rect(left + 541, top + 174, 58, 88, second);
  } else if (motif === "book") {
    c.rect(left + 80, top + 30, 450, 300, "#fffaf0");
    c.strokeRect(left + 80, top + 30, 450, 300, ink, 8);
    c.line(left + 305, top + 30, left + 305, top + 330, ink, 5);
    c.circle(left + 196, top + 142, 54, accent);
    c.rect(left + 350, top + 96, 128, 18, second);
    c.rect(left + 350, top + 144, 94, 18, ink);
    c.rect(left + 350, top + 192, 128, 18, ink);
  } else if (motif === "chat") {
    c.rect(left + 70, top + 58, 420, 92, "#fffaf0");
    c.strokeRect(left + 70, top + 58, 420, 92, ink, 7);
    c.rect(left + 170, top + 190, 430, 108, ink);
    c.rect(left + 198, top + 222, 250, 16, "#f3efe5");
    c.rect(left + 198, top + 258, 164, 16, "#f3efe5");
    c.circle(left + 118, top + 104, 24, accent);
    c.circle(left + 552, top + 244, 28, second);
  } else if (motif === "podium") {
    c.rect(left + 168, top + 212, 286, 116, ink);
    c.rect(left + 198, top + 174, 226, 50, second);
    c.circle(left + 312, top + 104, 58, accent);
    c.line(left + 224, top + 112, left + 70, top + 198, ink, 9);
    c.line(left + 400, top + 112, left + 560, top + 198, ink, 9);
    c.rect(left + 62, top + 210, 116, 18, accent);
    c.rect(left + 508, top + 210, 116, 18, second);
  } else if (motif === "blueprint") {
    c.rect(left + 68, top + 38, 482, 286, "#f3efe5");
    c.strokeRect(left + 68, top + 38, 482, 286, ink, 8);
    c.circle(left + 292, top + 162, 68, accent);
    c.line(left + 292, top + 94, left + 292, top + 230, ink, 6);
    c.line(left + 224, top + 162, left + 360, top + 162, ink, 6);
    c.rect(left + 410, top + 78, 88, 18, second);
    c.rect(left + 410, top + 122, 64, 18, ink);
    c.rect(left + 410, top + 248, 88, 18, second);
  } else if (motif === "comic") {
    for (let i = 0; i < 4; i += 1) {
      const x = left + (i % 2) * 300;
      const y = top + Math.floor(i / 2) * 162;
      c.rect(x, y, 250, 126, "#fffaf0");
      c.strokeRect(x, y, 250, 126, ink, 8);
      c.circle(x + 82, y + 64, 30, i % 2 ? second : accent);
      c.rect(x + 128, y + 42, 76, 14, ink);
      c.rect(x + 128, y + 76, 54, 14, ink);
    }
  } else if (motif === "dashboard") {
    c.rect(left + 54, top + 36, 570, 302, "#fffaf0");
    c.strokeRect(left + 54, top + 36, 570, 302, ink, 8);
    c.rect(left + 92, top + 82, 140, 84, accent);
    c.rect(left + 262, top + 82, 140, 84, second);
    c.rect(left + 432, top + 82, 140, 84, ink);
    c.line(left + 92, top + 270, left + 206, top + 224, accent, 9);
    c.line(left + 206, top + 224, left + 328, top + 252, second, 9);
    c.line(left + 328, top + 252, left + 544, top + 196, ink, 9);
  } else if (motif === "kanban") {
    for (let i = 0; i < 3; i += 1) {
      const x = left + 40 + i * 188;
      c.rect(x, top + 34, 150, 306, "#fffaf0");
      c.strokeRect(x, top + 34, 150, 306, ink, 7);
      c.rect(x + 24, top + 78, 102, 42, i === 1 ? accent : second);
      c.rect(x + 24, top + 150, 102, 42, "#f3efe5");
      c.rect(x + 24, top + 222, 102, 42, i === 2 ? accent : "#f3efe5");
    }
  } else if (motif === "map") {
    c.rect(left + 70, top + 38, 510, 302, "#fffaf0");
    c.strokeRect(left + 70, top + 38, 510, 302, ink, 8);
    c.line(left + 112, top + 102, left + 534, top + 260, second, 10);
    c.line(left + 180, top + 302, left + 454, top + 72, ink, 7);
    c.circle(left + 198, top + 150, 24, accent);
    c.circle(left + 402, top + 214, 24, accent);
    c.circle(left + 498, top + 116, 24, second);
  } else if (motif === "chart") {
    c.rect(left + 72, top + 48, 500, 292, "#fffaf0");
    c.strokeRect(left + 72, top + 48, 500, 292, ink, 8);
    for (let i = 0; i < 5; i += 1) {
      const h = [82, 142, 110, 188, 232][i];
      c.rect(left + 122 + i * 78, top + 300 - h, 42, h, i % 2 ? second : accent);
    }
    c.line(left + 112, top + 296, left + 526, top + 296, ink, 7);
  } else {
    c.circle(left + 280, top + 166, 60, accent);
    c.circle(left + 150, top + 92, 42, second);
    c.circle(left + 430, top + 238, 42, second);
    c.line(left + 190, top + 112, left + 256, top + 148, ink, 8);
    c.line(left + 334, top + 188, left + 398, top + 222, ink, 8);
    c.line(left + 190, top + 92, left + 430, top + 238, ink, 5);
    c.rect(left + 82, top + 292, 520, 22, ink);
  }
}

function save(name, canvas) {
  writeFileSync(join(outDir, name), encodePng(canvas));
}

function saveIn(dir, name, canvas) {
  writeFileSync(join(dir, name), encodePng(canvas));
}

function generateAppAssets() {
  const selected = new Set(process.argv.slice(2));
  for (const [slug, motif, bg, ink, accent, second] of apps) {
    if (selected.size && !selected.has(slug)) continue;
    const thumb = createCanvas(1200, 800, bg);
    drawMotif(thumb, motif, ink, accent, second);
    save(`${slug}-thumb.png`, thumb);
    saveIn(thumbnailDir, `${slug}.png`, thumb);

    const preview = createCanvas(1400, 900, bg);
    drawMotif(preview, motif, ink, second, accent, true);
    preview.rect(116, 720, 520, 28, ink);
    preview.rect(116, 770, 360, 18, accent);
    preview.rect(850, 700, 320, 64, "#fffaf0");
    preview.strokeRect(850, 700, 320, 64, ink, 6);
    preview.rect(850, 790, 420, 24, second);
    save(`${slug}-preview.png`, preview);
    saveIn(landingDir, `${slug}.png`, preview);
  }
}

function generateHero() {
  const c = createCanvas(1800, 1100, "#17252f");
  c.dots("#223946", 54, 4);
  c.rect(0, 748, 1800, 352, "#e8dfcf");
  c.rect(118, 134, 650, 430, "#f3efe5");
  c.strokeRect(118, 134, 650, 430, "#101a20", 12);
  c.rect(174, 204, 244, 34, "#c9553d");
  c.rect(174, 282, 410, 26, "#244b59");
  c.rect(174, 346, 340, 26, "#244b59");
  c.rect(174, 430, 186, 56, "#2d7d73");
  c.rect(830, 178, 330, 250, "#dce7df");
  c.strokeRect(830, 178, 330, 250, "#101a20", 10);
  c.rect(1210, 118, 390, 330, "#eadbc6");
  c.strokeRect(1210, 118, 390, 330, "#101a20", 10);
  c.rect(890, 500, 520, 310, "#e3dac8");
  c.strokeRect(890, 500, 520, 310, "#101a20", 10);
  c.circle(1110, 618, 74, "#c9553d");
  c.circle(1340, 266, 66, "#2d7d73");
  c.line(916, 704, 1280, 564, "#244b59", 12);
  for (let i = 0; i < 7; i += 1) {
    c.rect(120 + i * 226, 860 + (i % 2) * 26, 150, 104, i % 3 === 0 ? "#dce7df" : i % 3 === 1 ? "#eadbc6" : "#e3dac8");
    c.strokeRect(120 + i * 226, 860 + (i % 2) * 26, 150, 104, "#101a20", 7);
  }
  save("hero-showroom.png", c);
}

generateAppAssets();
if (process.argv.length <= 2) {
  generateHero();
}

console.log(`Generated ${apps.length * 2 + 1} PNG assets in ${outDir}`);
