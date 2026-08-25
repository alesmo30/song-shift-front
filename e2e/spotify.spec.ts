import { test, expect } from '@playwright/test';
import { gotoAuthenticated, mockSpotifyApi, seedAuthenticatedUser, gotoStable } from './helpers';

const REASON_MESSAGES: Record<string, string> = {
  access_denied: 'You cancelled the Spotify connection.',
  invalid_state: 'The Spotify connection request was invalid. Please try connecting again.',
  state_expired: 'The Spotify connection request expired. Please try connecting again.',
  state_reused: 'This Spotify connection link was already used. Please try connecting again.',
  token_exchange_failed: 'We could not complete the Spotify connection. Please try again.',
  profile_fetch_failed: 'We could not read your Spotify profile. Please try again.',
  user_not_allowlisted: 'This Spotify account is not authorized to use Totify yet.',
};

test.describe('Estado al montar', () => {
  test('dispara exactamente una petición a GET /spotify/status', async ({ page }) => {
    const statusRequests: string[] = [];

    await seedAuthenticatedUser(page, '/');
    await page.route('**/spotify/status', (route) => {
      statusRequests.push(route.request().url());
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          connected: false,
          spotifyUserId: null,
          displayName: null,
          email: null,
          country: null,
          scopes: [],
          connectedAt: null,
          needsReconnect: false,
        }),
      });
    });
    await gotoStable(page, '/');

    await expect(page.getByText('Spotify not connected')).toBeVisible();

    // React StrictMode invoca los efectos dos veces en desarrollo
    // (monta -> limpia -> monta); sin el guard de useRef en Landing.tsx
    // esto dispararía dos GET en vez de uno.
    expect(statusRequests.length).toBe(1);
  });

  test('si GET /spotify/status falla, el banner queda en error y no afirma conexión', async ({ page }) => {
    await seedAuthenticatedUser(page, '/');
    await page.route('**/spotify/status', (route) => route.fulfill({ status: 500 }));
    await gotoStable(page, '/');

    await expect(page.getByText('No pudimos comprobar tu conexión con Spotify.')).toBeVisible();
    await expect(page.getByText('Spotify connected')).not.toBeVisible();
    await expect(page.getByTestId('spotify-toggle')).toHaveText('Retry');
  });
});

test.describe('Desconectar Spotify', () => {
  test('cancelar el diálogo no dispara ninguna petición', async ({ page }) => {
    await gotoAuthenticated(page, '/', { connected: true, displayName: 'Jane Doe' });
    await expect(page.getByText('Spotify connected as Jane Doe')).toBeVisible();

    let disconnectCalled = false;
    await page.route('**/spotify/connection', () => {
      disconnectCalled = true;
    });

    await page.getByTestId('spotify-toggle').click();
    await expect(page.getByText('Disconnect Spotify?')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByText('Disconnect Spotify?')).not.toBeVisible();
    await expect(page.getByText('Spotify connected as Jane Doe')).toBeVisible();
    expect(disconnectCalled).toBe(false);
  });

  test('confirmar desconecta y el banner vuelve a desconectado', async ({ page }) => {
    await gotoAuthenticated(page, '/', { connected: true, displayName: 'Jane Doe' });
    await expect(page.getByText('Spotify connected as Jane Doe')).toBeVisible();

    const disconnectRequest = page.waitForRequest(
      (req) => req.url().includes('/spotify/connection') && req.method() === 'DELETE',
    );
    await mockSpotifyApi(page, { status: { connected: false }, disconnect: 'ok' });

    await page.getByTestId('spotify-toggle').click();
    await expect(page.getByText('Disconnect Spotify?')).toBeVisible();
    await page.getByRole('button', { name: 'Disconnect' }).click();

    await disconnectRequest;
    await expect(page.getByText('Spotify not connected')).toBeVisible();
  });

  test('el diálogo advierte que el permiso sigue vivo en Spotify', async ({ page }) => {
    await gotoAuthenticated(page, '/', { connected: true, displayName: 'Jane Doe' });
    await page.getByTestId('spotify-toggle').click();
    await expect(page.getByText(/spotify\.com\/account\/apps/)).toBeVisible();
  });
});

test.describe('Ruta de callback', () => {
  test('spotify=connected re-consulta el estado y limpia la URL', async ({ page }) => {
    await gotoAuthenticated(page, '/spotify/callback?spotify=connected', {
      connected: true,
      displayName: 'Jane Doe',
    });

    await expect(page).toHaveURL('/');
    await expect(page.getByText('Spotify connected as Jane Doe')).toBeVisible();
  });

  for (const [reason, message] of Object.entries(REASON_MESSAGES)) {
    test(`spotify=error&reason=${reason} muestra su propio mensaje`, async ({ page }) => {
      await gotoAuthenticated(page, `/spotify/callback?spotify=error&reason=${reason}`);

      await expect(page).toHaveURL('/');
      await expect(page.getByTestId('spotify-callback-error')).toHaveText(message);
      await expect(page.getByText('Spotify not connected')).toBeVisible();
    });
  }

  test('un reason desconocido no revienta y muestra un mensaje', async ({ page }) => {
    await gotoAuthenticated(page, '/spotify/callback?spotify=error&reason=something_new');

    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('spotify-callback-error')).toBeVisible();
  });
});

test.describe('Reconexión y 409', () => {
  test('needsReconnect true muestra la variante de reconexión', async ({ page }) => {
    await gotoAuthenticated(page, '/', { connected: true, displayName: 'Jane Doe', needsReconnect: true });

    await expect(page.getByText('Spotify needs reconnection')).toBeVisible();
    await expect(page.getByTestId('spotify-toggle')).toHaveText('Reconnect');
  });

  test('reconectar arranca el mismo flujo que conectar', async ({ page }) => {
    await gotoAuthenticated(page, '/', { connected: true, needsReconnect: true });
    await mockSpotifyApi(page, {
      status: { connected: true, needsReconnect: true },
      authUrl: {
        authorizeUrl: 'https://accounts.spotify.com/authorize?client_id=test&state=xyz',
        state: 'xyz',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    });

    const authUrlRequest = page.waitForRequest((req) => req.url().includes('/spotify/auth-url'));
    await page.getByTestId('spotify-toggle').click();
    const request = await authUrlRequest;
    expect(request.method()).toBe('POST');
    await page.waitForURL(/accounts\.spotify\.com/);
  });

  test('un 409 SPOTIFY_REAUTH_REQUIRED al consultar el estado pasa a needs-reconnect sin desloguear', async ({
    page,
  }) => {
    const renewTokensCalls: string[] = [];
    await page.route('**/renew-tokens', (route) => {
      renewTokensCalls.push(route.request().url());
      route.fulfill({ status: 401 });
    });

    // gotoAuthenticated registra su propio stub de /spotify/status (200,
    // desconectado); como Playwright usa el handler registrado más
    // reciente, el 409 se añade después y se recarga para que aplique.
    await gotoAuthenticated(page, '/');
    await page.route('**/spotify/status', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'error', message: 'Spotify connection expired', code: 'SPOTIFY_REAUTH_REQUIRED' }),
      }),
    );
    await page.reload();

    await expect(page.getByText('Spotify needs reconnection')).toBeVisible();
    // El usuario sigue logueado en Totify -- el guard no lo mandó a /login.
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('logout')).toBeVisible();
    expect(renewTokensCalls).toEqual([]);
  });

  test('un 409 al desconectar pasa a needs-reconnect en vez de mostrar un error genérico', async ({ page }) => {
    await gotoAuthenticated(page, '/', { connected: true, displayName: 'Jane Doe' });
    await page.route('**/spotify/connection', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'error', message: 'Spotify connection expired', code: 'SPOTIFY_REAUTH_REQUIRED' }),
      }),
    );

    await page.getByTestId('spotify-toggle').click();
    await page.getByRole('button', { name: 'Disconnect' }).click();

    await expect(page.getByText('Spotify needs reconnection')).toBeVisible();
  });
});
