import { expect, test } from '@playwright/test';

test.describe('Tracker Sync', () => {
  test('performs a single pull when entering tracker page', async ({ page }) => {
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      (window as typeof window & { __trackerSyncCalls?: number }).__trackerSyncCalls = 0;

      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

        if (url.includes('/tools/vgc/tracker/sync')) {
          (window as typeof window & { __trackerSyncCalls?: number }).__trackerSyncCalls =
            ((window as typeof window & { __trackerSyncCalls?: number }).__trackerSyncCalls ?? 0) + 1;

          return new Response(
            JSON.stringify({
              success: true,
              statusCode: 200,
              message: 'ok',
              data: { sessions: [], matches: [], series: [], presets: [] },
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        return originalFetch(input, init);
      };
    });

    await page.goto('/localtest/tracker-sync-provider');
    await expect(page.getByTestId('sync-status')).toHaveText('idle');
    await page.waitForTimeout(1500);

    await expect
      .poll(async () => page.evaluate(() => (window as typeof window & { __trackerSyncCalls?: number }).__trackerSyncCalls ?? 0))
      .toBe(1);
  });

  test('shows conflict CTA and recovers to synced state after refresh click', async ({ page }) => {
    await page.goto('/localtest/tracker-sync-badge');

    await expect(page.getByText('Sync conflict')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh from cloud' })).toBeVisible();

    await page.getByRole('button', { name: 'Refresh from cloud' }).click();

    await expect(page.getByText('Synced')).toBeVisible();
    await expect(page.getByTestId('refresh-count')).toHaveText('refresh-count:1');
  });
});
