const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const BASE_URL = process.env.NEBULA_CAPTURE_URL || 'http://127.0.0.1:4174';
const OUT_DIR = path.resolve(process.cwd(), 'output', 'trailer-shots');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function saveShot(page, name, note, manifest) {
  const target = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: target, fullPage: true });
  manifest.push({ file: `${name}.png`, note });
}

async function preparePage(browser, initScript) {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  if (initScript) {
    await context.addInitScript(initScript);
  }
  const page = await context.newPage();
  return { context, page };
}

async function main() {
  ensureDir(OUT_DIR);
  const manifest = [];
  const browser = await chromium.launch({ headless: true });

  try {
    {
      const { context, page } = await preparePage(browser, () => {
        localStorage.setItem('match3_language', 'ru');
      });
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
      await saveShot(page, '01-landing', 'Marketing landing with primary CTA.', manifest);
      await context.close();
    }

    {
      const { context, page } = await preparePage(browser, () => {
        localStorage.setItem('match3_language', 'ru');
        localStorage.removeItem('match3_tutorial_seen');
      });
      await page.goto(`${BASE_URL}/play`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3500);
      await saveShot(page, '02-tutorial-start', 'First-time play flow with tutorial overlay and live board behind it.', manifest);
      await context.close();
    }

    {
      const { context, page } = await preparePage(browser, () => {
        localStorage.setItem('match3_language', 'ru');
        localStorage.setItem('match3_tutorial_seen', '1');
        localStorage.setItem('match3_unlocked_level_v5', '8');
      });
      await page.goto(`${BASE_URL}/play`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3500);
      await saveShot(page, '03-roadmap', 'Roadmap with unlocked progression and meta widgets.', manifest);

      await page.click('button[aria-label="Уровень 8"]');
      await page.waitForTimeout(1200);
      await saveShot(page, '04-level-start-modal', 'Pre-level modal with goal preview before match start.', manifest);

      await page.goto(`${BASE_URL}/play`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
      await page.click('button[aria-label^="Ежедневная награда"]');
      await page.waitForTimeout(1000);
      await saveShot(page, '05-daily-reward', 'Daily reward popup for meta progression beat.', manifest);

      await page.goto(`${BASE_URL}/play`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
      await page.click('button[aria-label="Рейтинг"]');
      await page.waitForTimeout(1000);
      await saveShot(page, '06-leaderboard', 'Leaderboard popup for progression/social proof beat.', manifest);

      await context.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ baseUrl: BASE_URL, shots: manifest }, null, 2),
    'utf8',
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
