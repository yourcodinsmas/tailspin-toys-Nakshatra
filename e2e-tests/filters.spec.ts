import { test, expect } from '@playwright/test';

test.describe('Game catalog filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('filters by one or more categories', async ({ page }) => {
    const gameCard = (title: string) =>
      page.getByTestId('game-card').filter({ hasText: title });

    await test.step('Select multiple categories', async () => {
      await page.getByRole('checkbox', { name: 'Strategy' }).check();
      await page.getByRole('checkbox', { name: 'Puzzle' }).check();
    });

    await test.step('Show games in either selected category', async () => {
      await expect(page.getByTestId('filter-results')).toHaveText(
        /^Showing 8 of \d+ games$/,
      );
      await expect(gameCard('DevOps Dominion')).toBeVisible();
      await expect(gameCard('Code Puzzle Chronicles')).toBeVisible();
      await expect(gameCard('Cloud Conqueror')).toBeHidden();
    });
  });

  test('filters by publisher', async ({ page }) => {
    const gameCard = (title: string) =>
      page.getByTestId('game-card').filter({ hasText: title });

    await page.getByLabel('Publisher').selectOption({ label: 'CodeForge Studios' });

    await expect(page.getByTestId('filter-results')).toHaveText(
      /^Showing 6 of \d+ games$/,
    );
    await expect(gameCard('DevOps Dominion')).toBeVisible();
    await expect(gameCard('Pipeline Conquest')).toBeHidden();
  });

  test('combines category and publisher filters', async ({ page }) => {
    const gameCard = (title: string) =>
      page.getByTestId('game-card').filter({ hasText: title });

    await page.getByRole('checkbox', { name: 'Strategy' }).check();
    await page.getByLabel('Publisher').selectOption({ label: 'CodeForge Studios' });

    await expect(page.getByTestId('filter-results')).toHaveText(
      /^Showing 1 of \d+ games$/,
    );
    await expect(gameCard('DevOps Dominion')).toBeVisible();
    await expect(gameCard('Pipeline Conquest')).toBeHidden();
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
