/**
 * E2E tests — App navigation and page switching
 *
 * Verifies that the sidebar nav correctly switches between all
 * 7 main pages and that each page renders its primary content.
 */
import { test, expect } from '@playwright/test';

test.describe('App navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to boot
    await page.waitForSelector('#app', { timeout: 10000 });
  });

  test('page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle(/StadiumIQ/);
  });

  test('sidebar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('dashboard is the default active page', async ({ page }) => {
    const dashPage = page.locator('#page-dashboard');
    await expect(dashPage).toHaveClass(/active/);
  });

  test('clicking "AI Assistant" nav item shows chat page', async ({ page }) => {
    await page.click('[data-page="chat"]');
    await expect(page.locator('#page-chat')).toHaveClass(/active/);
    await expect(page.locator('#chat-msgs, .chat-wrapper')).toBeVisible();
  });

  test('clicking "Crowd Mgmt" nav item shows crowd page', async ({ page }) => {
    await page.click('[data-page="crowd"]');
    await expect(page.locator('#page-crowd')).toHaveClass(/active/);
  });

  test('clicking "Navigation" nav item shows navigation page', async ({ page }) => {
    await page.click('[data-page="navigation"]');
    await expect(page.locator('#page-navigation')).toHaveClass(/active/);
    // Stadium SVG map should be rendered
    await expect(page.locator('#stadium-map-svg, svg')).toBeVisible({ timeout: 5000 });
  });

  test('clicking "Transport" nav item shows transport page', async ({ page }) => {
    await page.click('[data-page="transport"]');
    await expect(page.locator('#page-transport')).toHaveClass(/active/);
  });

  test('clicking "Eco Tracker" nav item shows sustainability page', async ({ page }) => {
    await page.click('[data-page="sustainability"]');
    await expect(page.locator('#page-sustainability')).toHaveClass(/active/);
  });

  test('clicking "Accessibility" nav item shows accessibility page', async ({ page }) => {
    await page.click('[data-page="accessibility"]');
    await expect(page.locator('#page-accessibility')).toHaveClass(/active/);
  });

  test('breadcrumb updates on navigation', async ({ page }) => {
    await page.click('[data-page="chat"]');
    const breadcrumb = page.locator('#breadcrumb');
    await expect(breadcrumb).toContainText(/AI Assistant|Chat/i);
  });

  test('persona buttons are visible on dashboard', async ({ page }) => {
    const personas = ['fan', 'organizer', 'volunteer', 'staff'];
    for (const p of personas) {
      await expect(page.locator(`[data-persona="${p}"]`)).toBeVisible();
    }
  });
});

test.describe('Dashboard content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#page-dashboard.active');
  });

  test('match schedule cards are rendered', async ({ page }) => {
    const matches = page.locator('#matches-container .match-card');
    await expect(matches).toHaveCount(5);
  });

  test('venue cards are rendered', async ({ page }) => {
    const venues = page.locator('#venues-grid .venue-card');
    await expect(venues.first()).toBeVisible();
  });

  test('KPI fan count is visible', async ({ page }) => {
    const kpi = page.locator('#kpi-fans');
    await expect(kpi).toBeVisible();
    // Should contain a number
    const text = await kpi.textContent();
    expect(text).toMatch(/[\d,]+/);
  });
});
