import { test, expect } from '@playwright/test';
import { gotoAuthenticated, seedAuthenticatedUser, mockSpotifyApi, gotoStable, SPOTIFY_PLAYLIST_FIXTURE, type SpotifyPlaylistFixture } from './helpers';

const SECOND_PLAYLIST: SpotifyPlaylistFixture = {
  id: 'pl-road-trip',
  name: 'Road Trip',
  description: '',
  trackCount: 12,
  public: false,
  imageUrl: null,
  url: 'https://open.spotify.com/playlist/pl-road-trip',
};

test.describe('Playlist destino', () => {
  test('desconectado no llama a GET /spotify/playlists y muestra el mensaje de conectar', async ({ page }) => {
    const playlistRequests: string[] = [];
    await seedAuthenticatedUser(page, '/');
    await page.route('**/spotify/playlists**', (route) => {
      playlistRequests.push(route.request().url());
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], total: 0, limit: 50, offset: 0 }) });
    });
    await mockSpotifyApi(page, { status: { connected: false } });
    await gotoStable(page, '/');

    await expect(page.getByText('Connect Spotify to choose a destination playlist')).toBeVisible();
    expect(playlistRequests).toEqual([]);
  });

  test('al conectar, el selector aparece y lista las playlists', async ({ page }) => {
    await gotoAuthenticated(page, '/', { connected: true, displayName: 'Jane Doe' }, [SPOTIFY_PLAYLIST_FIXTURE, SECOND_PLAYLIST]);

    await expect(page.getByTestId('playlist-select')).toBeVisible();
    await page.getByTestId('playlist-select').locator('input').click();
    await expect(page.getByRole('option', { name: 'Verano 2026' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Road Trip' })).toBeVisible();
  });

  test('elegir una playlist manda PUT /spotify/default-playlist y persiste tras recargar', async ({ page }) => {
    await gotoAuthenticated(page, '/', { connected: true, displayName: 'Jane Doe' }, [SPOTIFY_PLAYLIST_FIXTURE]);

    const putRequest = page.waitForRequest(
      (req) => req.url().includes('/spotify/default-playlist') && req.method() === 'PUT',
    );
    await page.getByTestId('playlist-select').locator('input').click();
    await page.getByRole('option', { name: 'Verano 2026' }).click();
    const request = await putRequest;
    expect(request.postDataJSON()).toEqual({ playlistId: SPOTIFY_PLAYLIST_FIXTURE.id });
    await expect(page.getByRole('heading', { name: 'Verano 2026' })).toBeVisible();

    // Recargar con el status ya reflejando el destino guardado.
    await mockSpotifyApi(page, {
      status: { connected: true, displayName: 'Jane Doe', defaultPlaylistId: SPOTIFY_PLAYLIST_FIXTURE.id },
      playlists: [SPOTIFY_PLAYLIST_FIXTURE],
    });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Verano 2026' })).toBeVisible();
    await expect(page.getByText('42 songs in playlist')).toBeVisible();
  });

  test('un defaultPlaylistId que no está en la lista deja el selector vacío', async ({ page }) => {
    await gotoAuthenticated(
      page,
      '/',
      { connected: true, displayName: 'Jane Doe', defaultPlaylistId: 'pl-borrada' },
      [SPOTIFY_PLAYLIST_FIXTURE],
    );

    await expect(page.getByRole('heading', { name: 'Spotify Playlist' })).toBeVisible();
    await expect(page.getByTestId('playlist-select').locator('input')).toHaveValue('');
  });

  test('crear una playlist nueva la deja elegida como destino', async ({ page }) => {
    await gotoAuthenticated(page, '/', { connected: true, displayName: 'Jane Doe' }, []);

    await page.getByTestId('create-playlist-open').click();
    await expect(page.getByTestId('create-playlist-confirm')).toBeDisabled();
    await page.getByTestId('new-playlist-name').locator('input').fill('Mi playlist nueva');
    await expect(page.getByTestId('create-playlist-confirm')).toBeEnabled();

    const createRequest = page.waitForRequest((req) => req.url().includes('/spotify/playlists') && req.method() === 'POST');
    await page.getByTestId('create-playlist-confirm').click();
    await createRequest;

    await expect(page.getByRole('heading', { name: 'Mi playlist nueva' })).toBeVisible();
  });

  test('refresh-playlist recarga la lista de playlists', async ({ page }) => {
    await gotoAuthenticated(page, '/', { connected: true, displayName: 'Jane Doe' }, [SPOTIFY_PLAYLIST_FIXTURE]);

    const secondLoad = page.waitForRequest((req) => req.url().includes('/spotify/playlists') && req.method() === 'GET');
    await mockSpotifyApi(page, {
      status: { connected: true, displayName: 'Jane Doe' },
      playlists: [SPOTIFY_PLAYLIST_FIXTURE, SECOND_PLAYLIST],
    });
    await page.getByTestId('refresh-playlist').click();
    await secondLoad;

    await page.getByTestId('playlist-select').locator('input').click();
    await expect(page.getByRole('option', { name: 'Road Trip' })).toBeVisible();
  });

  test('sin playlist destino, Add to playlist está deshabilitado', async ({ page }) => {
    await gotoAuthenticated(page, '/', { connected: false }, []);
    await page.getByTestId('search-input').fill('taylor');
    await page.getByTestId('search-submit').click();
    await page.getByTestId('add-song').first().click();

    await page.getByTestId('tab-selected').click();
    await expect(page.getByTestId('add-to-playlist')).toBeDisabled();
  });

  test('con playlist destino elegida, Add to playlist está habilitado', async ({ page }) => {
    await gotoAuthenticated(
      page,
      '/',
      { connected: true, displayName: 'Jane Doe', defaultPlaylistId: SPOTIFY_PLAYLIST_FIXTURE.id },
      [SPOTIFY_PLAYLIST_FIXTURE],
    );
    await page.getByTestId('search-input').fill('taylor');
    await page.getByTestId('search-submit').click();
    await page.getByTestId('add-song').first().click();

    await page.getByTestId('tab-selected').click();
    await expect(page.getByTestId('add-to-playlist')).toBeEnabled();
  });

  test('un 409 al cargar playlists pasa a needs-reconnect sin desloguear', async ({ page }) => {
    await gotoAuthenticated(page, '/', { connected: true, displayName: 'Jane Doe' });
    await page.route('**/spotify/playlists**', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'error', message: 'Spotify connection expired', code: 'SPOTIFY_REAUTH_REQUIRED' }),
      }),
    );
    await page.reload();

    await expect(page.getByText('Spotify needs reconnection')).toBeVisible();
    await expect(page.getByTestId('logout')).toBeVisible();
  });
});
