import { test, expect } from '@playwright/test';
import { gotoStable, freeze } from './helpers';

test.describe('Login', () => {
  test('renderiza la card de login', async ({ page }) => {
    await gotoStable(page, '/login');
    await expect(page.getByRole('button', { name: /Sign In/ })).toBeVisible();
    await expect(page.getByText('Bridge your Apple Music library to Spotify — effortlessly.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up free' })).toBeVisible();
    await expect(page).toHaveScreenshot('login.png');
  });

  test('muestra errores de validación con campos vacíos', async ({ page }) => {
    await gotoStable(page, '/login');
    await page.getByRole('button', { name: /Sign In/ }).click();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await freeze(page);
    await expect(page).toHaveScreenshot('login-errors-vacios.png');
  });

  test('muestra error con email sin @', async ({ page }) => {
    await gotoStable(page, '/login');
    await page.getByPlaceholder('you@example.com').fill('noesunmail');
    await page.getByPlaceholder('••••••••').fill('secret123');
    await page.getByRole('button', { name: /Sign In/ }).click();
    await expect(page.getByText('Invalid email address')).toBeVisible();
    await expect(page.getByText('Password is required')).toHaveCount(0);
    await freeze(page);
    await expect(page).toHaveScreenshot('login-email-invalido.png');
  });

  test('pasa a estado "Signing In..." al enviar credenciales válidas', async ({ page }) => {
    await gotoStable(page, '/login');
    await page.getByPlaceholder('you@example.com').fill('jane@example.com');
    await page.getByPlaceholder('••••••••').fill('secret123');
    await page.getByRole('button', { name: /Sign In/ }).click();
    const submit = page.getByRole('button', { name: /Signing In/ });
    await expect(submit).toBeVisible();
    await expect(submit).toBeDisabled();
    await freeze(page);
    await expect(page).toHaveScreenshot('login-enviando.png');
  });

  test('el link lleva a /signup', async ({ page }) => {
    await gotoStable(page, '/login');
    await page.getByRole('link', { name: 'Sign up free' }).click();
    await expect(page).toHaveURL(/\/signup$/);
  });
});

test.describe('Signup', () => {
  test('renderiza la card de signup con 4 campos', async ({ page }) => {
    await gotoStable(page, '/signup');
    await expect(page.getByRole('button', { name: /Create Account/ })).toBeVisible();
    await expect(page.getByPlaceholder('Jane')).toBeVisible();
    await expect(page.getByPlaceholder('Doe')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page).toHaveScreenshot('signup.png');
  });

  test('muestra los 4 errores de validación', async ({ page }) => {
    await gotoStable(page, '/signup');
    await page.getByRole('button', { name: /Create Account/ }).click();
    await expect(page.getByText('Name is required', { exact: true })).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await freeze(page);
    await expect(page).toHaveScreenshot('signup-errores.png');
  });

  test('el link lleva a /login', async ({ page }) => {
    await gotoStable(page, '/signup');
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
