import type { Page } from '@playwright/test';

const PERSIST_KEY = 'persist:totify';

const MOCK_USER = {
  name: 'jane',
  email: 'jane@example.com',
  isSpotifyConnected: false,
  token: 'mock-token',
};

interface SpotifyStatus {
  connected: boolean;
  spotifyUserId: string | null;
  displayName: string | null;
  email: string | null;
  country: string | null;
  scopes: string[];
  connectedAt: string | null;
  needsReconnect: boolean;
  defaultPlaylistId: string | null;
}

const DEFAULT_SPOTIFY_STATUS: SpotifyStatus = {
  connected: false,
  spotifyUserId: null,
  displayName: null,
  email: null,
  country: null,
  scopes: [],
  connectedAt: null,
  needsReconnect: false,
  defaultPlaylistId: null,
};

export type SpotifyStatusOverrides = Partial<SpotifyStatus>;

export interface SpotifyPlaylistFixture {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  public: boolean;
  imageUrl: string | null;
  url: string;
}

export const SPOTIFY_PLAYLIST_FIXTURE: SpotifyPlaylistFixture = {
  id: 'pl-verano-2026',
  name: 'Verano 2026',
  description: '',
  trackCount: 42,
  public: false,
  imageUrl: null,
  url: 'https://open.spotify.com/playlist/pl-verano-2026',
};

/**
 * Enruta las llamadas de Spotify a respuestas fijas. Landing consulta
 * GET /spotify/status al montar, así que sin este stub cualquier test que
 * renderice Landing golpea el backend real con un token de prueba y cae
 * en el estado de error del banner — rompiendo tests que no tienen nada
 * que ver con Spotify. `gotoAuthenticated` ya lo aplica con el default
 * (desconectado); los tests que necesiten otro estado lo pisan pasando
 * `status`.
 */
export async function mockSpotifyApi(
  page: Page,
  options: {
    status?: SpotifyStatusOverrides;
    authUrl?: { authorizeUrl: string; state: string; expiresAt: string } | 'error';
    disconnect?: 'ok' | 'error';
    playlists?: SpotifyPlaylistFixture[];
  } = {},
) {
  const status = { ...DEFAULT_SPOTIFY_STATUS, ...options.status };
  await page.route('**/spotify/status', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(status) }),
  );

  const playlists = options.playlists ?? [];
  await page.route('**/spotify/playlists**', (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: playlists, total: playlists.length, limit: 50, offset: 0 }),
      });
    }
    if (request.method() === 'POST') {
      const body = request.postDataJSON() as { name: string };
      const created: SpotifyPlaylistFixture = {
        id: `pl-${body.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: body.name,
        description: '',
        trackCount: 0,
        public: false,
        imageUrl: null,
        url: 'https://open.spotify.com/playlist/created',
      };
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
    }
    return route.fallback();
  });

  await page.route('**/spotify/default-playlist', (route) => {
    const body = route.request().postDataJSON() as { playlistId: string | null };
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ defaultPlaylistId: body.playlistId }),
    });
  });

  if (options.authUrl) {
    await page.route('**/spotify/auth-url', (route) => {
      if (options.authUrl === 'error') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'error', message: 'boom' }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(options.authUrl) });
    });
  }

  if (options.disconnect) {
    await page.route('**/spotify/connection', (route) => {
      if (options.disconnect === 'error') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'error', message: 'boom' }),
        });
      }
      return route.fulfill({ status: 204 });
    });
  }
}

/**
 * Navega y deja la página en un estado determinista para capturar snapshots:
 * fuentes cargadas (Syne/DM Sans vienen de Google Fonts) y animaciones apagadas.
 */
export async function gotoStable(page: Page, path: string) {
  await page.goto(path);
  await freeze(page);
}

/**
 * Siembra el usuario en `persist:totify`, sin tocar las rutas de Spotify.
 * Nivel bajo: úsalo cuando necesites controlar tú mismo los `page.route` de
 * Spotify (el último `page.route` registrado para un patrón gana, así que
 * llamar a `mockSpotifyApi` con tu propio stub después de esto -- y antes
 * de la navegación final -- es lo que determina la respuesta real).
 */
export async function seedAuthenticatedUser(page: Page, path: string) {
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
}

/**
 * `/` está detrás de `PrivateRoutes`: sin un usuario persistido redirige a
 * `/login`. Sembramos el estado de redux-persist antes de navegar para las
 * rutas protegidas, igual que hace persistence.spec.ts. También stubea
 * GET /spotify/status como desconectado por defecto (ver mockSpotifyApi);
 * pasar `spotifyStatus` para probar otro estado del banner.
 */
export async function gotoAuthenticated(
  page: Page,
  path: string,
  spotifyStatus?: SpotifyStatusOverrides,
  playlists?: SpotifyPlaylistFixture[],
) {
  await seedAuthenticatedUser(page, path);
  await mockSpotifyApi(page, { status: spotifyStatus, playlists });
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
