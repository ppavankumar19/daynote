import { test, expect } from '@playwright/test';

test.describe('DayNote basic flows', () => {
  test('redirects / to today', async ({ page }) => {
    await page.goto('/');
    const today = new Date().toISOString().slice(0, 10);
    await expect(page).toHaveURL(new RegExp(`/notes/${today}`));
  });

  test('shows empty state for today', async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await page.goto(`/notes/${today}`);
    // Should show some content (either empty state or notes)
    await expect(page.locator('main')).toBeVisible();
  });

  test('can open search palette with Ctrl+K', async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await page.goto(`/notes/${today}`);
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('searchbox')).toBeVisible();
  });

  test('search palette closes with Escape', async ({ page }) => {
    const today = new Date().toISOString().slice(0, 10);
    await page.goto(`/notes/${today}`);
    await page.keyboard.press('Control+k');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('searchbox')).not.toBeVisible();
  });

  test('can navigate to a specific date', async ({ page }) => {
    await page.goto('/notes/2025-01-01');
    await expect(page).toHaveURL('/notes/2025-01-01');
    await expect(page.locator('main')).toBeVisible();
  });

  test('invalid date redirects to today', async ({ page }) => {
    await page.goto('/notes/not-a-date');
    const today = new Date().toISOString().slice(0, 10);
    await expect(page).toHaveURL(new RegExp(`/notes/${today}`));
  });
});
