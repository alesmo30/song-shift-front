import { test, expect } from '@playwright/test';
import { gotoStable } from './helpers';

/** Comportamientos que aporta MUI y que el scaffold propio no tenía. */
test.describe('Accesibilidad ganada con MUI', () => {
  test('los tabs exponen role tablist/tab con aria-selected', async ({ page }) => {
    await gotoStable(page, '/');
    await expect(page.getByRole('tablist')).toBeVisible();
    const search = page.getByRole('tab', { name: 'Search' });
    const upload = page.getByRole('tab', { name: 'Upload Photo' });
    await expect(search).toHaveAttribute('aria-selected', 'true');
    await expect(upload).toHaveAttribute('aria-selected', 'false');
    await upload.click();
    await expect(upload).toHaveAttribute('aria-selected', 'true');
    await expect(search).toHaveAttribute('aria-selected', 'false');
  });

  test('los errores de login se enlazan al campo', async ({ page }) => {
    await gotoStable(page, '/login');
    await page.getByRole('button', { name: /Sign In/ }).click();
    const email = page.getByLabel('Email');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    const describedBy = await email.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`#${describedBy}`)).toHaveText('Email is required');
  });

  test('los errores de signup se enlazan a cada campo', async ({ page }) => {
    await gotoStable(page, '/signup');
    await page.getByRole('button', { name: /Create Account/ }).click();
    for (const [label, message] of [
      ['Name', 'Name is required'],
      ['Last name', 'Last name is required'],
      ['Email', 'Email is required'],
      ['Password', 'Password is required'],
    ]) {
      const field = page.getByLabel(label, { exact: true });
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      const describedBy = await field.getAttribute('aria-describedby');
      await expect(page.locator(`#${describedBy}`)).toHaveText(message);
    }
  });

  test('los botones-icono tienen nombre accesible', async ({ page }) => {
    await gotoStable(page, '/');
    await expect(page.getByRole('button', { name: 'Refresh playlist' })).toBeVisible();

    await page.getByTestId('tab-upload').click();
    await page.getByTestId('upload-input').setInputFiles('src/assets/logo-mark.png');
    await expect(page.getByRole('button', { name: 'Remove image' })).toBeVisible();
  });
});
