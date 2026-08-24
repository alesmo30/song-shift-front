import type { Page } from '@playwright/test';

const PERSIST_KEY = 'persist:totify';

const MOCK_USER = {
  name: 'jane',
  email: 'jane@example.com',
  isSpotifyConnected: false,
  token: 'mock-token',
};

/**
 * Navega y deja la página en un estado determinista para capturar snapshots:
 * fuentes cargadas (Syne/DM Sans vienen de Google Fonts) y animaciones apagadas.
 */
export async function gotoStable(page: Page, path: string) {
  await page.goto(path);
  await freeze(page);
}

/**
 * `/` está detrás de `PrivateRoutes`: sin un usuario persistido redirige a
 * `/login`. Sembramos el estado de redux-persist antes de navegar para las
 * rutas protegidas, igual que hace persistence.spec.ts.
 */
export async function gotoAuthenticated(page: Page, path: string) {
  await gotoStable(page, path);
  await page.evaluate(
    ({ key, user }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          user: JSON.stringify(user),
          _persist: JSON.stringify({ version: 0, rehydrated: true }),
        }),
      );
    },
    { key: PERSIST_KEY, user: MOCK_USER },
  );
  await gotoStable(page, path);
}

export async function freeze(page: Page) {
  await page.addStyleTag({
    content: `*, *::before, *::after {
      animation: none !important;
      transition: none !important;
    }`,
  });
  await page.evaluate(() => document.fonts.ready);
}
