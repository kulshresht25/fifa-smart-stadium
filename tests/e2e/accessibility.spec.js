/**
 * E2E tests — Accessibility companion & keyboard navigation
 *
 * Verifies the Accessibility page renders correctly, font controls
 * work, keyboard navigation is supported, and accessible routes
 * are visible. Also tests basic ARIA attributes.
 */
import { test, expect } from '@playwright/test';

test.describe('Accessibility page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
    await page.click('[data-page="accessibility"]');
    await page.waitForSelector('#page-accessibility.active');
  });

  test('accessibility feature cards are rendered', async ({ page }) => {
    const cards = page.locator('#acc-features .acc-feat-card, #acc-features > *');
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('accessible route cards are visible', async ({ page }) => {
    const routes = page.locator('#routes-grid .route-card, #routes-grid > *');
    await expect(routes.first()).toBeVisible({ timeout: 5000 });
  });

  test('font increase button increases font size', async ({ page }) => {
    const htmlEl = page.locator('html');
    const before = await htmlEl.evaluate(el => el.style.fontSize || '16px');

    await page.click('#font-inc');
    const after = await htmlEl.evaluate(el => el.style.fontSize);

    // Font size should have increased
    const beforePx = parseInt(before);
    const afterPx = parseInt(after);
    expect(afterPx).toBeGreaterThan(beforePx);
  });

  test('font decrease button decreases font size', async ({ page }) => {
    // First increase it
    await page.click('#font-inc');
    const htmlEl = page.locator('html');
    const before = await htmlEl.evaluate(el => el.style.fontSize);

    await page.click('#font-dec');
    const after = await htmlEl.evaluate(el => el.style.fontSize);

    expect(parseInt(after)).toBeLessThan(parseInt(before));
  });

  test('reset accessibility settings button works', async ({ page }) => {
    await page.click('#font-inc');
    await page.click('#font-inc');
    await page.click('#reset-access-btn');

    const htmlEl = page.locator('html');
    const fontSize = await htmlEl.evaluate(el => el.style.fontSize);
    expect(fontSize).toBe('16px');
  });

  test('high contrast button toggles the class', async ({ page }) => {
    await page.click('#high-contrast-btn');
    const hasContrast = await page.evaluate(() => document.body.classList.contains('high-contrast'));
    expect(hasContrast).toBe(true);

    await page.click('#high-contrast-btn');
    const removed = await page.evaluate(() => document.body.classList.contains('high-contrast'));
    expect(removed).toBe(false);
  });
});

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
  });

  test('Tab key cycles through sidebar nav items', async ({ page }) => {
    // Focus the first nav item
    const firstNavItem = page.locator('.nav-item').first();
    await firstNavItem.focus();

    // Tab to the next one
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.className);
    expect(focused).toBeTruthy();
  });

  test('Enter key activates focused nav item', async ({ page }) => {
    const chatNav = page.locator('[data-page="chat"]');
    await chatNav.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#page-chat')).toHaveClass(/active/);
  });

  test('Escape key closes the settings modal', async ({ page }) => {
    await page.click('#settings-btn');
    const overlay = page.locator('#settings-overlay');
    await expect(overlay).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(overlay).not.toHaveClass(/open/);
  });
});

test.describe('ARIA attributes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
  });

  test('nav items have aria-current="page" for active page', async ({ page }) => {
    const activeNav = page.locator('.nav-item[aria-current="page"]');
    await expect(activeNav).toHaveCount(1);
  });

  test('persona buttons have aria-pressed attribute', async ({ page }) => {
    const personaBtn = page.locator('[data-persona="fan"]');
    const pressed = await personaBtn.getAttribute('aria-pressed');
    expect(pressed).toBe('true');
  });

  test('chat input has an accessible placeholder', async ({ page }) => {
    await page.click('[data-page="chat"]');
    const input = page.locator('#chat-inp');
    const placeholder = await input.getAttribute('placeholder');
    expect(placeholder).toBeTruthy();
    expect(placeholder.length).toBeGreaterThan(0);
  });

  test('send button is identifiable', async ({ page }) => {
    await page.click('[data-page="chat"]');
    const sendBtn = page.locator('#send-btn');
    await expect(sendBtn).toBeVisible();
  });
});
