/**
 * Records a ~35s product demo with Playwright against the live site.
 * Output: .demo/demo.webm (convert to mp4 with ffmpeg).
 *
 *   node scripts/record-demo.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdirSync, readdirSync, renameSync } from "node:fs";

const BASE = process.argv[2] ?? "https://jevspeak.org";
const OUT = ".demo";
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
  locale: "en-US",
});
const page = await ctx.newPage();

// Fake cursor so clicks are visible in the recording.
await page.addInitScript(() => {
  addEventListener("DOMContentLoaded", () => {
    const c = document.createElement("div");
    c.id = "__cursor";
    Object.assign(c.style, {
      position: "fixed", zIndex: 99999, width: "18px", height: "18px", pointerEvents: "none",
      left: "0px", top: "0px", transform: "translate(-2px,-2px)", transition: "transform 80ms",
    });
    c.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18"><path d="M2 1 L2 14 L5.5 10.5 L8 16 L10.5 15 L8 9.5 L13 9.5 Z" fill="#fff" stroke="#1e1e1e" stroke-width="1.4"/></svg>`;
    document.body.appendChild(c);
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; });
    addEventListener("mousedown", () => (c.style.transform = "translate(-2px,-2px) scale(0.8)"));
    addEventListener("mouseup", () => (c.style.transform = "translate(-2px,-2px) scale(1)"));
  });
});

async function moveTo(locator, steps = 18) {
  const b = await locator.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps });
}
async function clickHuman(locator) {
  await moveTo(locator);
  await sleep(180);
  await locator.click();
}
async function typeHuman(locator, text) {
  await clickHuman(locator);
  await sleep(200);
  for (const ch of text) {
    await page.keyboard.type(ch);
    await sleep(28 + Math.random() * 45);
  }
}
async function waitForReply(count) {
  await page.locator("main >> text=/^Jev$/").nth(count - 1).waitFor({ timeout: 30000 });
  await sleep(300);
}

await page.goto(`${BASE}/chat?lang=en`, { waitUntil: "networkidle" });
await page.mouse.move(700, 500);
await sleep(1200);

// 1. Ask the canonical question
const input = page.getByPlaceholder(/Say something/);
await typeHuman(input, "Will AI replace programmers?");
await sleep(350);
await page.keyboard.press("Enter");
await waitForReply(1);
await sleep(2800); // let the Brain bars settle on camera

// hover over the brain panel briefly
await moveTo(page.locator("aside").first(), 25);
await sleep(1500);

// 2. Debug view: scroll through the pipeline
await clickHuman(page.getByRole("button", { name: /^debug$/ }));
await sleep(900);
const convo = page.locator("main div.overflow-y-auto").first();
const box = await convo.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
for (let i = 0; i < 14; i++) {
  await page.mouse.wheel(0, 140);
  await sleep(260);
}
await sleep(1400);
for (let i = 0; i < 14; i++) {
  await page.mouse.wheel(0, -140);
  await sleep(120);
}
await sleep(500);
await clickHuman(page.getByRole("button", { name: /^debug$/ }));
await sleep(600);

// 3. Switch to Chinese and ask again
await clickHuman(page.getByRole("button", { name: /^EN$/ }));
await sleep(900);
await typeHuman(page.getByPlaceholder(/对 Jev 说点什么/), "AI 会取代程序员吗?");
await sleep(350);
await page.keyboard.press("Enter");
await waitForReply(2);
await sleep(3500);

await ctx.close();
await browser.close();

const webm = readdirSync(OUT).find((f) => f.endsWith(".webm"));
renameSync(`${OUT}/${webm}`, `${OUT}/demo.webm`);
console.log(`saved ${OUT}/demo.webm`);
