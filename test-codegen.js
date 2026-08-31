import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/otros/mewgenics/builder');
  await page.getByRole('textbox', { name: 'Buscar partes…' }).first().click();
  await page.getByRole('textbox', { name: 'Buscar partes…' }).first().click();
  await page.getByText('No hay partes que coincidan').first().click();
});