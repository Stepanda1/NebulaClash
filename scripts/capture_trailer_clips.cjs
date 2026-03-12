const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = process.env.NEBULA_CAPTURE_URL || 'http://127.0.0.1:4174';
const OUT_DIR = path.resolve(process.cwd(), 'output', 'trailer-clips');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function finalizeVideo(video, targetName) {
  const rawPath = await video.path();
  const targetPath = path.join(OUT_DIR, targetName);
  fs.copyFileSync(rawPath, targetPath);
  return targetPath;
}

async function newContext(browser, initScript) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
  });
  if (initScript) {
    await context.addInitScript(initScript);
  }
  const page = await context.newPage();
  return { context, page };
}

async function main() {
  ensureDir(OUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const manifest = [];

  try {
    {
      const { context, page } = await newContext(browser, () => {
        localStorage.setItem('match3_language', 'ru');
      });
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      await page.click('text=ИГРАТЬ СЕЙЧАС');
      await page.waitForTimeout(3000);
      const video = page.video();
      await context.close();
      const target = await finalizeVideo(video, '01-landing-to-tutorial.webm');
      manifest.push({ file: path.basename(target), note: 'Landing CTA into first playable/tutorial flow.' });
    }

    {
      const { context, page } = await newContext(browser, () => {
        localStorage.setItem('match3_language', 'ru');
        localStorage.setItem('match3_tutorial_seen', '1');
        localStorage.setItem('match3_unlocked_level_v5', '8');
      });
      await page.goto(`${BASE_URL}/play`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1800);
      await page.click('button[aria-label="Уровень 8"]');
      await page.waitForTimeout(1400);
      const video = page.video();
      await context.close();
      const target = await finalizeVideo(video, '02-roadmap-to-level-start.webm');
      manifest.push({ file: path.basename(target), note: 'Roadmap into pre-level modal.' });
    }

    {
      const { context, page } = await newContext(browser, () => {
        localStorage.setItem('match3_language', 'ru');
        localStorage.setItem('match3_tutorial_seen', '1');
        localStorage.setItem('match3_unlocked_level_v5', '8');
      });
      await page.goto(`${BASE_URL}/play`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1800);
      await page.click('button[aria-label^="Ежедневная награда"]');
      await page.waitForTimeout(1400);
      const video = page.video();
      await context.close();
      const target = await finalizeVideo(video, '03-daily-reward.webm');
      manifest.push({ file: path.basename(target), note: 'Daily reward popup as a meta progression beat.' });
    }

    {
      const { context, page } = await newContext(browser, () => {
        localStorage.setItem('match3_language', 'ru');
        localStorage.setItem('match3_tutorial_seen', '1');
        localStorage.setItem('match3_unlocked_level_v5', '8');
      });
      await page.goto(`${BASE_URL}/play`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1800);
      await page.click('button[aria-label="Рейтинг"]');
      await page.waitForTimeout(1400);
      const video = page.video();
      await context.close();
      const target = await finalizeVideo(video, '04-leaderboard.webm');
      manifest.push({ file: path.basename(target), note: 'Leaderboard popup as a social proof beat.' });
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ baseUrl: BASE_URL, clips: manifest }, null, 2),
    'utf8',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
