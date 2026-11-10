// Render today's 12 lyric-horoscope Story cards (1080x1920) using the
// site's own code, so Instagram always shows the same line as
// westcoasthearts.com/horoscope for each sign.
//
// Usage: node scripts/horoscope_cards.mjs OUT_DIR
// Writes OUT_DIR/<date>-NN-<sign>.jpg and OUT_DIR/<date>.json
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2] || "stories-out";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ timezoneId: "America/Los_Angeles", viewport: { width: 1200, height: 900 } });
await page.goto("https://westcoasthearts.com/horoscope", { waitUntil: "networkidle" });

const cards = await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load(`italic 300 90px ${SERIF}`), document.fonts.load(`500 40px ${SERIF}`),
    document.fonts.load(`italic 400 40px ${SERIF}`), document.fonts.load(`500 24px ${SANS}`),
  ]).catch(() => {});
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const md = now.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  // Story layout: the site's paper, waves and type, with a bigger lyric
  // and room for Instagram's header (top) and reply bar (bottom).
  function storyQuote(ctx, W, H, p, seed, o) {
    paper(ctx, W, H, p, seed, .80);
    const M = 96, TOP = 250, BOTTOM = H - 260;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = p.sub; ctx.font = `500 26px ${SANS}`; spaced(ctx, true, 6);
    ctx.fillText("WEST COAST HEARTS", M, TOP + 22);
    ctx.fillText("WESTCOASTHEARTS.COM", M, BOTTOM); spaced(ctx, false);
    let y = TOP + 150;
    ctx.fillStyle = p.sub; ctx.font = `italic 400 58px ${SERIF}`;
    ctx.fillText(o.kicker, M, y); y += 70;
    const maxW = W - M * 2, room = H * .78 - 190 - y;
    let size = 136, lines;
    for (;;) {
      ctx.font = `italic 300 ${size}px ${SERIF}`; lines = qcBalance(ctx, "\u201c" + o.line + "\u201d", maxW);
      if ((lines.length <= 7 && lines.length * size * 1.08 <= room) || size <= 64) break;
      size -= 4;
    }
    ctx.fillStyle = p.text;
    lines.forEach((l, i) => ctx.fillText(l, i === 0 ? M - size * .28 : M, y + size + i * size * 1.08));
    y += size + (lines.length - 1) * size * 1.08 + 90;
    ctx.font = `500 54px ${SERIF}`; ctx.fillText(o.song, M, y);
    ctx.fillStyle = p.sub; ctx.font = `400 32px ${SANS}`; ctx.fillText(o.sub, M, y + 56);
  }
  return SIGNS.map(([sign], i) => {
    const [line, song, album, year] = POOL[hashStr(dayKey + "|" + sign) % POOL.length];
    const c = document.createElement("canvas"); c.width = 1080; c.height = 1920;
    storyQuote(c.getContext("2d"), 1080, 1920, i % 2 ? PAL.ink : PAL.ivory, hashStr(dayKey + sign),
      { kicker: `${sign}, ${md}`, line, song, sub: `from ${album}, ${year}` });
    return { date, n: i + 1, sign, line, song, album, year, jpg: c.toDataURL("image/jpeg", 0.92) };
  });
});
await browser.close();

const date = cards[0].date;
const index = cards.map(({ jpg, ...rest }) => {
  const file = `${date}-${String(rest.n).padStart(2, "0")}-${rest.sign.toLowerCase()}.jpg`;
  writeFileSync(join(out, file), Buffer.from(jpg.split(",")[1], "base64"));
  return { ...rest, file };
});
writeFileSync(join(out, `${date}.json`), JSON.stringify(index, null, 1) + "\n");
console.log(`Rendered ${index.length} horoscope cards for ${date}.`);
for (const c of index) console.log(`  ${c.sign}: ${c.line} (${c.song})`);
