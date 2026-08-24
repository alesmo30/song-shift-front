import { test, expect } from '@playwright/test';
import { gotoAuthenticated, freeze } from './helpers';

const MOCK_EXTRACT_RESPONSE = {
  songs: [
    { id: 'd1', title: 'Cruel Summer', artist: 'Taylor Swift', duration: '2:58', confidence: 97 },
    { id: 'd2', title: 'Anti-Hero', artist: 'Taylor Swift', duration: '3:20', confidence: 94 },
    { id: 'd3', title: 'As It Was', artist: 'Harry Styles', duration: '2:47', confidence: 88 },
    { id: 'd4', title: 'Heat Waves', artist: 'Glass Animals', duration: null, confidence: 73 },
  ],
  processed: 1,
  failed: 0,
};

async function mockExtractSongs(page: import('@playwright/test').Page) {
  await page.route('**/songs/extract', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_EXTRACT_RESPONSE) });
  });
}

async function mockSendToPlaylist(page: import('@playwright/test').Page) {
  await page.route('**/songs/playlist', async (route) => {
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({ playlistId: '', accepted: 1, status: 'not-implemented' }),
    });
  });
}

test.describe('Landing', () => {
  test('renderiza navbar, banner y los dos paneles', async ({ page }) => {
    await gotoAuthenticated(page, '/');
    await expect(page.getByText('Spotify not connected')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Find Songs' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Spotify Playlist' })).toBeVisible();
    await expect(page.getByTestId('logout')).toBeVisible();
    await expect(page).toHaveScreenshot('landing.png');
  });

  test('el toggle de Spotify cambia el banner', async ({ page }) => {
    await gotoAuthenticated(page, '/');
    await page.getByTestId('spotify-toggle').click();
    await expect(page.getByText('Spotify connected')).toBeVisible();
    await freeze(page);
    await expect(page).toHaveScreenshot('landing-spotify-conectado.png');
  });

  test('los tabs cambian entre Search, Upload y Selected', async ({ page }) => {
    await gotoAuthenticated(page, '/');
    await expect(page.getByTestId('search-input')).toBeVisible();
    await page.getByTestId('tab-upload').click();
    await expect(page.getByText('Drop your Apple Music screenshots')).toBeVisible();
    await expect(page.getByTestId('search-input')).toHaveCount(0);
    await freeze(page);
    await expect(page).toHaveScreenshot('landing-tab-upload.png');
    await page.getByTestId('tab-selected').click();
    await expect(page.getByText('No songs selected')).toBeVisible();
    await page.getByTestId('tab-search').click();
    await expect(page.getByTestId('search-input')).toBeVisible();
  });

  test('la búsqueda devuelve resultados', async ({ page }) => {
    await gotoAuthenticated(page, '/');
    await page.getByTestId('search-input').fill('taylor');
    await page.getByTestId('search-submit').click();
    await expect(page.getByText('2 results · page 1 of 1')).toBeVisible();
    await expect(page.getByTestId('add-song')).toHaveCount(2);
    await freeze(page);
    await expect(page).toHaveScreenshot('landing-busqueda-resultados.png');
  });

  test('la búsqueda sin coincidencias muestra el empty state', async ({ page }) => {
    await gotoAuthenticated(page, '/');
    await page.getByTestId('search-input').fill('zzzzz');
    await page.getByTestId('search-submit').click();
    await expect(page.getByText('No songs found')).toBeVisible();
    await freeze(page);
    await expect(page).toHaveScreenshot('landing-busqueda-vacia.png');
  });

  test('añadir una canción marca el botón como añadido', async ({ page }) => {
    await gotoAuthenticated(page, '/');
    await page.getByTestId('search-input').fill('taylor');
    await page.getByTestId('search-submit').click();
    const first = page.getByTestId('add-song').first();
    await expect(first).toHaveText('+ Add');
    await first.click();
    await expect(first).toHaveText('✓ Added');
    await expect(first).toBeDisabled();
    await freeze(page);
    await expect(page).toHaveScreenshot('landing-cancion-anadida.png');
  });

  test('la paginación avanza y retrocede', async ({ page }) => {
    await gotoAuthenticated(page, '/');
    await page.getByTestId('search-input').fill('e');
    await page.getByTestId('search-submit').click();
    await expect(page.getByText('7 results · page 1 of 2')).toBeVisible();
    await expect(page.getByTestId('page-prev')).toBeDisabled();
    await expect(page.getByTestId('add-song')).toHaveCount(6);
    await page.getByTestId('page-next').click();
    await expect(page.getByText('7 results · page 2 of 2')).toBeVisible();
    await expect(page.getByTestId('add-song')).toHaveCount(1);
    await expect(page.getByTestId('page-next')).toBeDisabled();
    await freeze(page);
    await expect(page).toHaveScreenshot('landing-paginacion-p2.png');
    await page.getByTestId('page-prev').click();
    await expect(page.getByText('7 results · page 1 of 2')).toBeVisible();
  });

  test('el panel de playlist muestra el estado vacío por defecto', async ({ page }) => {
    await gotoAuthenticated(page, '/');
    await expect(page.getByText('0 songs added')).toBeVisible();
    await expect(page.getByText('No songs yet')).toBeVisible();
  });

  test('el refresh de playlist es clicable', async ({ page }) => {
    await gotoAuthenticated(page, '/');
    await page.getByTestId('refresh-playlist').click();
    await expect(page.getByRole('heading', { name: 'Spotify Playlist' })).toBeVisible();
  });

  test('el flujo de upload muestra preview, validación y canciones detectadas', async ({ page }) => {
    await mockExtractSongs(page);
    await gotoAuthenticated(page, '/');
    await page.getByTestId('tab-upload').click();
    await page.getByTestId('upload-input').setInputFiles('src/assets/logo-mark.png');
    await expect(page.getByTestId('clear-image-0')).toBeVisible();
    await page.getByTestId('validate-ai').click();
    await expect(page.getByText('AI detected these songs — confirm before adding:')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('add-detected-song')).toHaveCount(4);
    await freeze(page);
    await expect(page).toHaveScreenshot('landing-upload-detectadas.png');
    await page.getByTestId('clear-image-0').click();
    await expect(page.getByText('Drop your Apple Music screenshots')).toBeVisible();
  });

  test('subir 6 ficheros muestra error en el cliente y no llama al backend', async ({ page }) => {
    let extractCalled = false;
    await page.route('**/songs/extract', async (route) => {
      extractCalled = true;
      await route.continue();
    });
    await gotoAuthenticated(page, '/');
    await page.getByTestId('tab-upload').click();
    await page.getByTestId('upload-input').setInputFiles(Array(6).fill('src/assets/logo-mark.png'));
    await expect(page.getByTestId('upload-file-error')).toHaveText(/up to 5 screenshots/);
    expect(extractCalled).toBe(false);
  });

  test('un 502 al validar muestra error y conserva las imágenes', async ({ page }) => {
    await page.route('**/songs/extract', async (route) => {
      await route.fulfill({ status: 502, contentType: 'application/json', body: JSON.stringify({ status: 'error', message: 'Bad gateway' }) });
    });
    await gotoAuthenticated(page, '/');
    await page.getByTestId('tab-upload').click();
    await page.getByTestId('upload-input').setInputFiles('src/assets/logo-mark.png');
    await page.getByTestId('validate-ai').click();
    await expect(page.getByTestId('upload-api-error')).toBeVisible();
    await expect(page.getByTestId('clear-image-0')).toBeVisible();
  });

  test('el flujo completo: detectar, seleccionar y mandar a la playlist', async ({ page }) => {
    await mockExtractSongs(page);
    await mockSendToPlaylist(page);
    await gotoAuthenticated(page, '/');

    // Detectar desde Upload
    await page.getByTestId('tab-upload').click();
    await page.getByTestId('upload-input').setInputFiles('src/assets/logo-mark.png');
    await page.getByTestId('validate-ai').click();
    await expect(page.getByTestId('add-detected-song')).toHaveCount(4);

    // Seleccionar dos canciones detectadas
    const detectedAddButtons = page.getByTestId('add-detected-song');
    await detectedAddButtons.nth(0).click();
    await detectedAddButtons.nth(1).click();
    await expect(page.getByTestId('tab-selected')).toHaveText('Selected (2)');

    // Añadir una más desde Search — el contador es compartido
    await page.getByTestId('tab-search').click();
    await page.getByTestId('search-input').fill('taylor');
    await page.getByTestId('search-submit').click();
    await page.getByTestId('add-song').first().click();
    await expect(page.getByTestId('tab-selected')).toHaveText('Selected (3)');

    // Cambiar de pestaña y volver conserva la selección
    await page.getByTestId('tab-upload').click();
    await page.getByTestId('tab-selected').click();
    await expect(page.getByTestId('remove-selected')).toHaveCount(3);

    // Quitar una decrementa el contador
    await page.getByTestId('remove-selected').first().click();
    await expect(page.getByTestId('tab-selected')).toHaveText('Selected (2)');

    // Enviar a la playlist
    await page.getByTestId('add-to-playlist').click();
    await expect(page.getByTestId('tab-selected')).toHaveText('Selected (0)');
    await expect(page.getByText('No songs selected')).toBeVisible();

    await page.getByTestId('tab-search').click();
    await expect(page.getByText('2 songs added')).toBeVisible();
  });

  test('logout navega a /login', async ({ page }) => {
    await gotoAuthenticated(page, '/');
    await page.getByTestId('logout').click();
    await page.getByRole('button', { name: 'Yes' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
