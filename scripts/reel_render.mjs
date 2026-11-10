// Render today's lyric Reel: a 1080x1920 card in the site's style, with the
// home page's sea lines drifting under the lyric, recorded for the length of
// the audio clip. Uses the site's own fonts, palette and helpers.
//
// Usage: node scripts/reel_render.mjs DAY_JSON CLIP_SECONDS OUT.webm
//   DAY_JSON: {"line","song","album","year","day"}
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const [dayFile, seconds, out] = process.argv.slice(2);
const day = JSON.parse(readFileSync(dayFile, "utf8"));
const ms = Math.round(parseFloat(seconds) * 1000) + 400;

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto("https://westcoasthearts.com/horoscope", { waitUntil: "networkidle" });

const b64 = await page.evaluate(async ({ day, ms }) => {
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load(`italic 300 120px ${SERIF}`), document.fonts.load(`500 54px ${SERIF}`),
    document.fonts.load(`italic 400 58px ${SERIF}`), document.fonts.load(`500 26px ${SANS}`),
    document.fonts.load(`400 32px ${SANS}`),
  ]).catch(() => {});
  const W = 1080, H = 1920, M = 96, TOP = 250, BOTTOM = H - 260;
  const P = day.day % 2 ? PAL.ivory : PAL.ink;   // alternate like the cards
  const mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; };

  // Static background: paper colour + grain.
  const bg = mk(), bx = bg.getContext("2d");
  bx.fillStyle = P.bg; bx.fillRect(0, 0, W, H); bx.fillStyle = paperGrain(bx, P.grain); bx.fillRect(0, 0, W, H);

  // Static text layer (same layout as the Story cards).
  const tx = mk(), x = tx.getContext("2d");
  x.textBaseline = "alphabetic";
  x.fillStyle = P.sub; x.font = `500 26px ${SANS}`; spaced(x, true, 6);
  x.fillText("WEST COAST HEARTS", M, TOP + 22); x.fillText("WESTCOASTHEARTS.COM", M, BOTTOM); spaced(x, false);
  let y = TOP + 150;
  x.font = `italic 400 58px ${SERIF}`; x.fillText("Lyric of the day", M, y); y += 70;
  const maxW = W - M * 2, room = H * .70 - 190 - y;
  let size = 136, lines;
  for (;;) {
    x.font = `italic 300 ${size}px ${SERIF}`; lines = qcBalance(x, "“" + day.line + "”", maxW);
    if ((lines.length <= 7 && lines.length * size * 1.08 <= room) || size <= 64) break;
    size -= 4;
  }
  x.fillStyle = P.text;
  lines.forEach((l, i) => x.fillText(l, i === 0 ? M - size * .28 : M, y + size + i * size * 1.08));
  y += size + (lines.length - 1) * size * 1.08 + 90;
  x.font = `500 54px ${SERIF}`; x.fillText(day.song, M, y);
  x.fillStyle = P.sub; x.font = `400 32px ${SANS}`; x.fillText(`from ${day.album}, ${day.year}`, M, y + 56);
  const textBottom = y + 80;

  // The sea, as on the home page, drifting slowly under the words.
  function makeNoise(seed) {
    let s = seed >>> 0; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const Pn = Array.from({ length: 512 }, rnd), f = t => t * t * (3 - 2 * t);
    return v => { const i = Math.floor(v), fr = v - i, a = Pn[i & 511], b = Pn[(i + 1) & 511]; return a + (b - a) * f(fr); };
  }
  const seed = hashStr("reel" + day.day), N = 18;
  const terrain = makeNoise(seed), hand = Array.from({ length: N }, (_, i) => makeNoise(seed + 11 + i)), weight = makeNoise(seed + 5);
  const g = (v, c, w) => Math.exp(-(((v - c) / w) ** 2));
  const horizon = Math.max(textBottom + 40, H * .66), span = H - horizon;
  const swellH = Math.min(H * .1, 220), swellW = W * .3;

  const cv = mk(), ctx = cv.getContext("2d");
  function frame(t) {
    ctx.drawImage(bg, 0, 0);
    const c1 = W * (0.3 + 0.35 * t / (ms / 1000)) + Math.sin(t * .9) * W * .05, c2 = W * .82 + Math.cos(t * .7) * W * .04;
    ctx.save(); ctx.globalAlpha = P.lineA * 1.6; ctx.strokeStyle = P.line; ctx.lineCap = "round"; ctx.lineJoin = "round";
    for (let i = 0; i < N; i++) {
      const k = i / (N - 1), base = horizon + span * (k * 1.04) + (terrain(k * 6 + 3) - .5) * span * .02, lift = (1 - k) ** 1.15;
      ctx.beginPath();
      for (let s = 0; s <= 160; s++) {
        const px = s / 160 * W, u = px / W;
        const py = base - swellH * lift * g(px, c1, swellW * (0.8 + 0.5 * k)) - swellH * .45 * lift * g(px, c2, swellW * .7)
          + (terrain(u * 2.4 + t * .35 + k * .5) - .5) * H * .02 * (0.4 + k) + (hand[i](u * 18 + i * 3) - .5) * 1.8;
        s ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.lineWidth = 1.6 + weight(i * .6) * 1.2; ctx.stroke();
    }
    ctx.restore();
    ctx.drawImage(tx, 0, 0);
  }

  frame(0);
  const stream = cv.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9", videoBitsPerSecond: 12e6 });
  const chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data);
  const done = new Promise(r => rec.onstop = r);
  rec.start(250);
  const t0 = performance.now();
  await new Promise(resolve => {
    (function loop() {
      const t = (performance.now() - t0) / 1000;
      frame(t);
      if (t * 1000 < ms) requestAnimationFrame(loop); else resolve();
    })();
  });
  rec.stop(); await done;
  const buf = await new Blob(chunks, { type: "video/webm" }).arrayBuffer();
  let s = ""; const u8 = new Uint8Array(buf);
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}, { day, ms });

await browser.close();
writeFileSync(out, Buffer.from(b64, "base64"));
console.log(`Rendered ${out} (${(b64.length * 0.75 / 1e6).toFixed(1)} MB) for day ${day.day}: ${day.line}`);
