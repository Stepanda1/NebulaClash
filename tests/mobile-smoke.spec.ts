import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const CONSENT_KEY = 'match3_consent_v1';
const TUTORIAL_KEY = 'match3_tutorial_seen';
const UNLOCKED_LEVEL_KEY = 'match3_unlocked_level_v5';
const LEVEL_STARS_KEY = 'match3_level_stars_v5';

async function acceptEssentialOnly(page: import('@playwright/test').Page) {
  const button = page.getByRole('button', { name: /только обязательное/i });
  if (await button.isVisible().catch(() => false)) {
    await button.click();
    await page.waitForTimeout(300);
  }
}

async function seedMapState(page: import('@playwright/test').Page) {
  await page.evaluate(
    ({ consentKey, tutorialKey, unlockedLevelKey, levelStarsKey }) => {
      localStorage.setItem(
        consentKey,
        JSON.stringify({
          essential: true,
          analytics: false,
          marketing: false,
          decidedAt: Date.now(),
        }),
      );
      localStorage.setItem(tutorialKey, '1');
      localStorage.setItem(unlockedLevelKey, '3');
      localStorage.setItem(levelStarsKey, JSON.stringify({ 1: 3, 2: 2 }));
    },
    {
      consentKey: CONSENT_KEY,
      tutorialKey: TUTORIAL_KEY,
      unlockedLevelKey: UNLOCKED_LEVEL_KEY,
      levelStarsKey: LEVEL_STARS_KEY,
    },
  );
}

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

async function expectModalWithinViewport(page: import('@playwright/test').Page, headingPattern: RegExp) {
  const heading = page.getByText(headingPattern).first();
  await expect(heading).toBeVisible();

  const box = await heading.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThan(260);
  await expectNoHorizontalOverflow(page);
}

test('landing and map fit mobile viewport', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(800);
  await acceptEssentialOnly(page);
  await expectNoHorizontalOverflow(page);

  await seedMapState(page);
  await page.goto('/play');
  await page.waitForTimeout(1500);

  await expect(page.getByRole('button', { name: /настройки карты/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('core mobile modals stay within viewport', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(800);
  await acceptEssentialOnly(page);
  await seedMapState(page);
  await page.goto('/play');
  await page.waitForTimeout(1500);

  await page.getByRole('button', { name: /настройки карты/i }).click();
  await expectModalWithinViewport(page, /настройки карты/i);
  await page.getByRole('button', { name: /закрыть/i }).click();

  await page.getByRole('button', { name: /ежедневная награда/i }).click();
  await expectModalWithinViewport(page, /ежедневная награда/i);
  await page.getByRole('button', { name: /закрыть/i }).click();

  await page.getByRole('button', { name: /недельный цикл/i }).click();
  await expectModalWithinViewport(page, /недельный цикл/i);
});

test('@a11y landing has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(800);
  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast'])
    .analyze();

  const seriousViolations = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  );

  expect(seriousViolations).toEqual([]);
});
