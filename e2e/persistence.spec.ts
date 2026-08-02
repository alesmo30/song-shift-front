import { test, expect } from '@playwright/test';
import { gotoStable } from './helpers';

const PERSIST_KEY = 'persist:totify';

type PersistedUser = {
  name: string;
  email: string;
  isSpotifyConnected: boolean;
  token: string;
};

/**
 * Escribe el estado persistido y navega a `path`. A diferencia de `addInitScript`,
 * esto no se re-ejecuta en reloads posteriores, así que no pisa cambios hechos
 * en la página (p. ej. un toggle) cuando el test luego hace `page.reload()`.
 */
async function seedPersistedUserAndGoto(page: import('@playwright/test').Page, path: string, user: PersistedUser) {
  await gotoStable(page, path);
  await page.evaluate(
    ({ key, user }: { key: string; user: PersistedUser }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          user: JSON.stringify(user),
          _persist: JSON.stringify({ version: 0, rehydrated: true }),
        }),
      );
    },
    { key: PERSIST_KEY, user },
  );
  await gotoStable(page, path);
}

test.describe('Persistencia de Redux (redux-persist)', () => {
  test('el login persiste y sobrevive a un reload', async ({ page }) => {
    await gotoStable(page, '/login');
    await page.getByPlaceholder('you@example.com').fill('jane@example.com');
    await page.getByPlaceholder('••••••••').fill('secret123');
    await page.getByRole('button', { name: /Sign In/ }).click();
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText('jane')).toBeVisible();

    await page.reload();
    await expect(page.getByText('jane')).toBeVisible();
    await expect(page.getByTestId('logout')).toBeVisible();
  });

  test('una tab nueva del mismo contexto lee el estado ya logueado', async ({ page, context }) => {
    const user: PersistedUser = {
      name: 'jane',
      email: 'jane@example.com',
      isSpotifyConnected: false,
      token: 'mock-token',
    };
    await seedPersistedUserAndGoto(page, '/', user);
    await expect(page.getByText('jane')).toBeVisible();

    const secondPage = await context.newPage();
    await seedPersistedUserAndGoto(secondPage, '/', user);
    await expect(secondPage.getByText('jane')).toBeVisible();
    await secondPage.close();
  });

  test('el toggle de Spotify persiste tras un reload', async ({ page }) => {
    await seedPersistedUserAndGoto(page, '/', {
      name: 'jane',
      email: 'jane@example.com',
      isSpotifyConnected: false,
      token: 'mock-token',
    });
    await page.getByTestId('spotify-toggle').click();
    await expect(page.getByText('Spotify connected')).toBeVisible();

    await page.reload();
    await expect(page.getByText('Spotify connected')).toBeVisible();
  });

  test('el logout borra el estado persistido', async ({ page }) => {
    await seedPersistedUserAndGoto(page, '/', {
      name: 'jane',
      email: 'jane@example.com',
      isSpotifyConnected: true,
      token: 'mock-token',
    });
    await expect(page.getByText('jane')).toBeVisible();

    await page.getByTestId('logout').click();
    await expect(page).toHaveURL(/\/login$/);

    const persisted = await page.evaluate((key) => window.localStorage.getItem(key), PERSIST_KEY);
    if (persisted) {
      expect(persisted).not.toContain('jane@example.com');
      expect(persisted).not.toContain('mock-token');
    }

    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('un estado persistido corrupto no rompe el arranque de la app', async ({ page }) => {
    await page.addInitScript(
      (key) => {
        window.localStorage.setItem(key, '{not-valid-json');
      },
      PERSIST_KEY,
    );

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await gotoStable(page, '/');
    await expect(page.getByTestId('logout')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
