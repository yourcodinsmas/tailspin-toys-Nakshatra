import { test, expect, type Locator, type Page } from '@playwright/test';

/** Locates a catalog card by its visible game title. */
function getGameCard(page: Page, title: string): Locator {
  return page.getByTestId('game-card').filter({ hasText: title });
}

test.describe('Game catalog filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('filters by one or more categories', async ({ page }) => {
    await test.step('Select multiple categories', async () => {
      await page.getByRole('checkbox', { name: 'Strategy' }).check();
      await page.getByRole('checkbox', { name: 'Puzzle' }).check();
    });

    await test.step('Show games in either selected category', async () => {
      await expect(page.getByTestId('filter-results')).toHaveText(
        /^Showing 8 of \d+ games$/,
      );
      await expect(getGameCard(page, 'DevOps Dominion')).toBeVisible();
      await expect(getGameCard(page, 'Code Puzzle Chronicles')).toBeVisible();
      await expect(getGameCard(page, 'Cloud Conqueror')).toBeHidden();
    });
  });

  test('filters by publisher', async ({ page }) => {
    await page.getByLabel('Publisher').selectOption({ label: 'CodeForge Studios' });

    await expect(page.getByTestId('filter-results')).toHaveText(
      /^Showing 6 of \d+ games$/,
    );
    await expect(getGameCard(page, 'DevOps Dominion')).toBeVisible();
    await expect(getGameCard(page, 'Pipeline Conquest')).toBeHidden();
  });

  test('combines category and publisher filters', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Strategy' }).check();
    await page.getByLabel('Publisher').selectOption({ label: 'CodeForge Studios' });

    await expect(page.getByTestId('filter-results')).toHaveText(
      /^Showing 1 of \d+ games$/,
    );
    await expect(getGameCard(page, 'DevOps Dominion')).toBeVisible();
    await expect(getGameCard(page, 'Pipeline Conquest')).toBeHidden();
  });

  test('clears all selected filters', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Strategy' }).check();
    await page.getByLabel('Publisher').selectOption({ label: 'CodeForge Studios' });
    await page.getByRole('button', { name: 'Clear filters' }).click();

    await expect(page.getByRole('checkbox', { name: 'Strategy' })).not.toBeChecked();
    await expect(page.getByLabel('Publisher')).toHaveValue('');
    await expect(page.getByTestId('filter-results')).toHaveText(
      /^Showing 21 of 21 games$/,
    );
  });
});
