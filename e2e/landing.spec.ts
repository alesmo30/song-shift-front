import { test, expect } from '@playwright/test';
import { gotoStable, freeze } from './helpers';

test.describe('Landing', () => {
  test('renderiza navbar, banner y los dos paneles', async ({ page }) => {
    await gotoStable(page, '/');
    await expect(page.getByText('Spotify not connected')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Find Songs' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Spotify Playlist' })).toBeVisible();
    await expect(page.getByTestId('logout')).toBeVisible();
    await expect(page).toHaveScreenshot('landing.png');
  });

  test('el toggle de Spotify cambia el banner', async ({ page }) => {
    await gotoStable(page, '/');
    await page.getByTestId('spotify-toggle').click();
    await expect(page.getByText('Spotify connected')).toBeVisible();
    await freeze(page);
    await expect(page).toHaveScreenshot('landing-spotify-conectado.png');
  });

  test('los tabs cambian entre Search y Upload', async ({ page }) => {
    await gotoStable(page, '/');
    await expect(page.getByTestId('search-input')).toBeVisible();
    await page.getByTestId('tab-upload').click();
    await expect(page.getByText('Drop your Apple Music screenshot')).toBeVisible();
    await expect(page.getByTestId('search-input')).toHaveCount(0);
    await freeze(page);
    await expect(page).toHaveScreenshot('landing-tab-upload.png');
    await page.getByTestId('tab-search').click();
    await expect(page.getByTestId('search-input')).toBeVisible();
  });

  test('la búsqueda devuelve resultados', async ({ page }) => {
    await gotoStable(page, '/');
    await page.getByTestId('search-input').fill('taylor');
    await page.getByTestId('search-submit').click();
    await expect(page.getByText('2 results · page 1 of 1')).toBeVisible();
    await expect(page.getByTestId('add-song')).toHaveCount(2);
    await freeze(page);
    await expect(page).toHaveScreenshot('landing-busqueda-resultados.png');
  });

  test('la búsqueda sin coincidencias muestra el empty state', async ({ page }) => {
    await gotoStable(page, '/');
    await page.getByTestId('search-input').fill('zzzzz');
    await page.getByTestId('search-submit').click();
    await expect(page.getByText('No songs found')).toBeVisible();
    await freeze(page);
    await expect(page).toHaveScreenshot('landing-busqueda-vacia.png');
  });

  test('añadir una canción marca el botón como añadido', async ({ page }) => {
    await gotoStable(page, '/');
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
    await gotoStable(page, '/');
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

  test('el panel de playlist muestra las status pills', async ({ page }) => {
    await gotoStable(page, '/');
    await expect(page.getByText('1 of 3 songs added')).toBeVisible();
    await expect(page.getByText('Added ✓')).toBeVisible();
    await expect(page.getByText('Adding…')).toBeVisible();
    await expect(page.getByText('Queued')).toBeVisible();
  });

  test('el refresh de playlist es clicable', async ({ page }) => {
    await gotoStable(page, '/');
    await page.getByTestId('refresh-playlist').click();
    await expect(page.getByRole('heading', { name: 'Spotify Playlist' })).toBeVisible();
  });

  test('logout navega a /login', async ({ page }) => {
    await gotoStable(page, '/');
    await page.getByTestId('logout').click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
