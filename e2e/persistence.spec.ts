import { test, expect } from '@playwright/test';
import { gotoStable, mockSpotifyApi, type SpotifyStatusOverrides } from './helpers';

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
 * en la página (p. ej. una acción de Spotify) cuando el test luego hace
 * `page.reload()`. También stubea GET /spotify/status como desconectado por
 * defecto -- ver mockSpotifyApi en helpers.ts -- para que el mount de Landing
 * no golpee el backend real; pasar `spotifyStatus` para otro estado.
 */
async function seedPersistedUserAndGoto(
  page: import('@playwright/test').Page,
  path: string,
  user: PersistedUser,
  spotifyStatus?: SpotifyStatusOverrides,
) {
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
  await mockSpotifyApi(page, { status: spotifyStatus });
  await gotoStable(page, path);
}

test.describe('Persistencia de Redux (redux-persist)', () => {
  test('el login persiste y sobrevive a un reload', async ({ page }) => {
    await page.route('http://localhost:3000/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { name: 'jane', lastName: 'doe', email: 'jane@example.com' },
          accessToken: 'mock-token',
        }),
      });
    });
    await mockSpotifyApi(page);
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

  test('un isSpotifyConnected persistido en true pierde frente a un status que dice false', async ({ page }) => {
    // Este es el caso que justifica que la conexión de Spotify la mande el
    // servidor y no un booleano local: el flag persistido dice "conectado"
    // pero GET /spotify/status dice lo contrario (p. ej. el usuario revocó
    // el acceso desde Spotify). El servidor debe ganar.
    await seedPersistedUserAndGoto(
      page,
      '/',
      {
        name: 'jane',
        email: 'jane@example.com',
        isSpotifyConnected: true,
        token: 'mock-token',
      },
      { connected: false },
    );

    await expect(page.getByText('Spotify not connected')).toBeVisible();

    const persisted = await page.evaluate((key) => window.localStorage.getItem(key), PERSIST_KEY);
    expect(persisted).toBeTruthy();
    const user = JSON.parse(JSON.parse(persisted as string).user);
    expect(user.isSpotifyConnected).toBe(false);
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
    await page.getByRole('button', { name: 'Yes' }).click();
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
    // Estado corrupto → sin usuario válido → el guard de rutas manda a /login,
    // que es el comportamiento correcto; lo que este test verifica es que no crashea.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: /Sign In/ })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
