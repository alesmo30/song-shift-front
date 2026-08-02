import type { Page } from '@playwright/test';

/**
 * Navega y deja la página en un estado determinista para capturar snapshots:
 * fuentes cargadas (Syne/DM Sans vienen de Google Fonts) y animaciones apagadas.
 */
export async function gotoStable(page: Page, path: string) {
  await page.goto(path);
  await freeze(page);
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
