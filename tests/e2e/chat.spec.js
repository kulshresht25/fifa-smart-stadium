/**
 * E2E tests — Chat assistant
 *
 * Tests the full chat interaction flow: typing, sending,
 * fallback responses, suggestion chips, clearing chat,
 * and persona switching.
 */
import { test, expect } from '@playwright/test';

test.describe('Chat assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
    // Navigate to chat page
    await page.click('[data-page="chat"]');
    await page.waitForSelector('#chat-inp');
  });

  test('welcome message is displayed on load', async ({ page }) => {
    const msgs = page.locator('#chat-msgs .chat-msg');
    await expect(msgs.first()).toBeVisible();
    const text = await msgs.first().textContent();
    expect(text.length).toBeGreaterThan(10);
  });

  test('suggestion chips are shown for the fan persona', async ({ page }) => {
    const chips = page.locator('#sugg-bar .sugg-chip, #sugg-bar button');
    await expect(chips.first()).toBeVisible();
  });

  test('typing a message shows it in the chat', async ({ page }) => {
    const input = page.locator('#chat-inp');
    await input.fill('Where is the nearest restroom?');
    await page.click('#send-btn');

    // User message should appear
    const userMsg = page.locator('.user-msg').first();
    await expect(userMsg).toBeVisible({ timeout: 5000 });
    await expect(userMsg).toContainText('restroom');
  });

  test('pressing Enter sends the message', async ({ page }) => {
    const input = page.locator('#chat-inp');
    await input.fill('Where is Gate 3?');
    await input.press('Enter');

    // Check message was sent
    const userMsg = page.locator('.user-msg').first();
    await expect(userMsg).toBeVisible({ timeout: 5000 });
  });

  test('AI/fallback response is returned after sending', async ({ page }) => {
    const input = page.locator('#chat-inp');
    await input.fill('food please');
    await page.click('#send-btn');

    // Wait for AI message (with generous timeout for any network latency or fallback)
    const aiMsg = page.locator('.ai-msg').nth(1);
    await expect(aiMsg).toBeVisible({ timeout: 10000 });
    const responseText = await aiMsg.textContent();
    expect(responseText.length).toBeGreaterThan(5);
  });

  test('input field clears after sending', async ({ page }) => {
    const input = page.locator('#chat-inp');
    await input.fill('Test message');
    await page.click('#send-btn');
    await expect(input).toHaveValue('');
  });

  test('clear chat button removes messages', async ({ page }) => {
    // Send a message first
    const input = page.locator('#chat-inp');
    await input.fill('Hello!');
    await page.click('#send-btn');
    await page.waitForSelector('.user-msg');

    // Clear chat
    await page.click('#chat-clear');
    // After clearing, only the welcome message should remain
    await page.waitForTimeout(500);
    const msgs = page.locator('#chat-msgs .chat-msg');
    const count = await msgs.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('suggestion chip fills and sends a message', async ({ page }) => {
    const chip = page.locator('#sugg-bar .sugg-chip, #sugg-bar button').first();
    await chip.click();
    // Message should appear in chat
    const userMsg = page.locator('.user-msg').first();
    await expect(userMsg).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Persona switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#app');
  });

  test('switching persona to Organizer updates chat suggestions', async ({ page }) => {
    await page.click('[data-persona="organizer"]');
    await page.waitForTimeout(300);
    await page.click('[data-page="chat"]');

    const chips = page.locator('#sugg-bar .sugg-chip, #sugg-bar button');
    const allText = await chips.allTextContents();
    // Organizer chips contain operational keywords
    const hasOpsChip = allText.some(t =>
      t.toLowerCase().includes('crowd') ||
      t.toLowerCase().includes('capacity') ||
      t.toLowerCase().includes('security')
    );
    expect(hasOpsChip).toBe(true);
  });
});
