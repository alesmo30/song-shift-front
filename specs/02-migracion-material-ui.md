# 02 — Migración a Material UI (Totify frontend)

**Estado:** Aprobado
**Depende de:** `specs/01-visual-scaffold-auth-landing.md` (Implementado)
**Fecha:** 2026-08-01

**Objetivo:** Reemplazar todos los componentes de UI propios del frontend por sus equivalentes de Material UI, conservando el diseño actual mediante un theme que consume los tokens de `global.css`, y blindando el cambio con tests de regresión visual de Playwright capturados antes de migrar.

## Context

El frontend (`frontend/`) es el scaffold visual del spec 01: componentes hechos a mano (`Button`, `Input`, `Card`, `Tabs`, `StatusPill`, `SongRow`, `ErrorSpan`), iconos SVG propios y varios `<button>` crudos dentro de los paneles de Landing. Nada de eso trae accesibilidad real: los tabs no tienen `role="tablist"`/`aria-selected`, los errores de Formik no están enlazados a sus campos por `aria-describedby`, y los botones-icono no tienen nombre accesible.

Migrar a MUI aporta esos comportamientos ya probados y da una base común para el resto de la app. El riesgo es el drift visual: el diseño viene de un handoff con tokens y clases `.t-*` que hay que respetar al máximo. Por eso el spec ordena Playwright **primero** (baselines del estado actual) y migración **después**.

## Scope

**Incluido:**
- Instalar `@mui/material`, `@emotion/react`, `@emotion/styled`, `@mui/icons-material` y `@playwright/test`.
- Theme central (`src/theme/theme.ts`) que consume las CSS custom properties de `global.css` (`var(--color-*)`, `--font-*`, `--radius-*`, `--fs-*`) vía `palette`, `typography`, `shape` y `components.styleOverrides`.
- Migración de los 6 componentes compartidos a MUI aplicando la **regla de reemplazo directo**: si el componente de MUI, ya vestido por el theme, cubre el caso sin lógica de dominio propia, se **borra** el componente nuestro y las páginas importan MUI directamente. Solo sobrevive un wrapper en `src/components/` cuando aporta lógica de dominio (mapeo de tipos, labels, tintes) que no cabe en el theme.
- Migración de los `<button>` crudos de `Landing.tsx`, `SearchPanel.tsx`, `UploadPanel.tsx`, `PlaylistPanel.tsx`.
- Iconos genéricos a `@mui/icons-material`; `SpotifyIcon` se conserva envuelto en `SvgIcon`.
- `TextField` con label externo + error por `helperText`; eliminación de `ErrorSpan`.
- Suite Playwright: baselines pre-migración + tests funcionales de los flujos existentes.

**NO incluido:**
- Migrar el layout a `Box`/`Stack`/`Grid` — los `*.module.css` de layout (grid de paneles, navbar, banner, dropzone, empty states) se conservan tal cual.
- `CssBaseline` / `ScopedCssBaseline` — `global.css` ya cumple ese rol.
- Cambiar `global.css`: los tokens siguen siendo la fuente de verdad, no se editan valores.
- Responsive / mobile (sigue fuera de alcance desde el spec 01).
- Lógica de negocio real (auth, Spotify, IA), tests unitarios, tocar `backend/`.
- Modo claro / theme switching.
- Sustituir Formik por otra librería de formularios.

## Data model

No introduce estructuras nuevas de dominio. Solo un módulo de theme:

```typescript
// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';
export const totifyTheme = createTheme({ /* palette | typography | shape | components */ });
```

Los tipos de `src/types/{song,user,callbacks}.ts` no cambian.

## Mapeo componente → MUI

**Regla de reemplazo directo:** si MUI + theme cubren el componente por completo, el archivo nuestro se borra y las páginas importan MUI. Sobrevive wrapper solo si hay lógica de dominio.

| Actual | MUI | Destino del archivo | Nota de fidelidad |
|---|---|---|---|
| `Button` (`primary`/`secondary`, `loading`) | `Button` (`variant="contained"` / `"outlined"`) | **Borrar** `src/components/Button/` | El theme aporta el look de `.t-btn-primary` (gradiente + `--shadow-brand-cta`) y `.t-btn-secondary`; `loading` es prop nativa de MUI. Sin lógica propia que justifique wrapper. Si el spinner nativo se aparta del actual, `startIcon={<CircularProgress size={14} color="inherit" />}` en el call site. |
| `Input` | `TextField` | **Borrar** `src/components/Input/` | El label externo en mayúsculas se resuelve en el theme (`MuiInputLabel`: `position: static`, `text-transform: uppercase`, tokens de `.t-label`), no en un wrapper. `MuiOutlinedInput` replica `.t-input` y suprime notch/legend. |
| `Card` | `Card` | **Borrar** `src/components/Card/` | `MuiCard.styleOverrides` = `.t-card`: fondo translúcido, borde, `--radius-lg`, `backdrop-filter: var(--blur-card)`. El wrapper actual solo concatenaba clases. |
| `Tabs` | `Tabs` + `Tab` | **Borrar** `src/components/Tabs/` | `Landing.tsx` usa `<Tabs value onChange>` con `<Tab icon label>` directo. Track segmentado vía theme: `TabIndicator` oculto, `Tab` seleccionado con `--color-input-bg`. Gana `role="tablist"` y teclado. |
| `StatusPill` | `Chip` `size="small"` | **Wrapper** (se conserva) | Mapea `DestinationStatus` → label (`Queued`/`Adding…`/`Added ✓`) y color. Ese mapeo es dominio, no cabe en el theme. |
| `SongRow` | `ListItem` + `ListItemText` | **Wrapper** (se conserva) | Recibe el tipo `Song` y compone título/artista/duración + slot `action` (pasa a `secondaryAction`). Dominio. |
| `ErrorSpan` | — | **Borrar** | El error va en `TextField error + helperText`. |
| `Log out`, `Connect Spotify`, `Search`, `+ Add`, `Validate with AI`, paginación | `Button` | Importado directo en cada panel | Sin cambiar textos ni tamaños. La paginación sigue siendo dos `Button` (`← Prev` / `Next →`), no `Pagination`. |
| `refreshBtn`, `clearBtn` | `IconButton` | Importado directo | Requieren `aria-label` (`"Refresh playlist"`, `"Remove image"`). |
| `SearchIcon`/`ImageIcon`/`RefreshIcon`/`NoteIcon` | `Search`/`Image`/`Refresh`/`MusicNote` de `@mui/icons-material` | Ajustar `fontSize`/`sx` a los tamaños en px actuales (13, 15, 22…). |
| `SpotifyIcon` | `SvgIcon` con el `path` actual | Material Icons no incluye el logo de Spotify. |

## Implementation Plan

Cada paso deja la app funcionando y tipando (`npm run build`).

1. **Playwright + baselines (antes de tocar UI).** Instalar `@playwright/test`; `playwright.config.ts` con `webServer: npm run dev`, `baseURL: http://localhost:5173`, un solo proyecto Chromium, viewport fijo desktop. Tests en `frontend/e2e/`:
   - `auth.spec.ts`: `/login` (render, error de validación con email sin `@`, estado "Signing In..."), `/signup` (4 campos, errores).
   - `landing.spec.ts`: navbar, toggle del banner Spotify, cambio de tabs Search/Upload, búsqueda con resultados y con "No songs found", `+ Add` → `✓ Added`, paginación, panel Playlist con status pills.
   Determinismo: esperar `document.fonts.ready`, desactivar animaciones/transiciones por CSS inyectado, `maxDiffPixelRatio: 0.02`. Correr, generar snapshots, commitearlos. **Estas baselines son el contrato del resto del spec.**
2. **Dependencias MUI.** `@mui/material @emotion/react @emotion/styled @mui/icons-material`. Sin cambios de UI todavía; `npm run build` y Playwright siguen verdes.
3. **Theme.** `src/theme/theme.ts` + `<ThemeProvider>` en `src/main.tsx` (envolviendo `<BrowserRouter>`, después del import de `global.css`, sin `CssBaseline`). Paleta y tipografía leyendo `var(--*)`. Playwright verde: aún nadie consume el theme.
4. **`Button` (borrar).** `Login.tsx` y `Signup.tsx` importan `@mui/material/Button` directo; se elimina `src/components/Button/`. Los defaults (`variant`, gradiente, `loading`) viven en el theme. Verificar snapshots de Login/Signup.
5. **`Input` (borrar) + formularios.** `TextField` importado directo en Login/Signup, con el label externo resuelto por `MuiInputLabel` en el theme. Sustituir `<ErrorMessage component={ErrorSpan} />` por `error`/`helperText` alimentados desde `errors`/`touched` de Formik. Borrar `src/components/Input/` y `src/components/ErrorSpan/`. Revisar si `lodash` queda sin uso y, si es así, quitarlo de `package.json`.
6. **`Card` y `Tabs` (borrar), `StatusPill` y `SongRow` (wrapper).** Uno por uno, corriendo Playwright entre cada uno para aislar el paso que introduzca drift. `Card`/`Tabs` desaparecen de `src/components/` y sus consumidores pasan a importar MUI; `StatusPill` y `SongRow` se reimplementan por dentro sobre `Chip` y `ListItem` sin cambiar su firma.
7. **Iconos.** Sustituir los 4 genéricos por `@mui/icons-material`; envolver `SpotifyIcon` en `SvgIcon`. Los tamaños en px se ajustan hasta que los snapshots vuelvan a pasar.
8. **Botones sueltos de Landing.** Los `<button>` de `Landing.tsx` y los 3 paneles pasan a `Button`/`IconButton` con `aria-label` donde corresponde. Las clases `styles.*` que ahora solo aportan layout se mantienen; las que solo pintaban el botón se borran.
9. **Limpieza y verificación final.** Eliminar clases `.t-*` y reglas CSS de componente que ya no consume nadie (dejar los tokens `--*` intactos). `npm run lint`, `npm run build`, Playwright completo. Revisar los diffs de snapshot aceptados uno por uno contra `src/references/` y `.playwright-evidence/`.

## Acceptance Criteria

- [ ] `npm run build` (`tsc -b` + `vite build`) pasa sin errores.
- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] `npx playwright test` pasa completo contra las baselines capturadas en el paso 1; cada diff aceptado está justificado por escrito en el PR.
- [ ] `src/components/Button/`, `Input/`, `Card/`, `Tabs/` y `ErrorSpan/` están eliminados; sus consumidores importan MUI directamente.
- [ ] Los únicos wrappers que quedan en `src/components/` son `StatusPill` y `SongRow`, y cada uno justifica su existencia con lógica de dominio (mapeo de `DestinationStatus` / composición del tipo `Song`).
- [ ] `src/components/` no contiene ningún `<button>`, `<input>` ni `<div>`-como-card propio: todo delega en MUI.
- [ ] `Landing.tsx`, `SearchPanel.tsx`, `UploadPanel.tsx`, `PlaylistPanel.tsx` no contienen elementos `<button>` nativos.
- [ ] Los tabs Search/Upload exponen `role="tablist"`/`role="tab"` con `aria-selected` correcto.
- [ ] Cada campo de Login y Signup enlaza su mensaje de error vía `aria-describedby` y marca `aria-invalid` cuando es inválido.
- [ ] Los botones-icono (refresh, clear) tienen nombre accesible (`getByRole('button', { name: ... })` los encuentra).
- [ ] `src/components/ErrorSpan/` está eliminado y no queda ninguna importación suya.
- [ ] `global.css` conserva todos los tokens `--*` sin cambios de valor.
- [ ] `src/main.tsx` monta `ThemeProvider` y **no** monta `CssBaseline`.
- [ ] `SpotifyIcon` sigue renderizando el glyph original (envuelto en `SvgIcon`).
- [ ] Los mocks siguen marcados con `// MOCK — quitar` y los empty states se mantienen.
- [ ] Cero llamadas reales a APIs externas: la migración no toca lógica.

## Decisiones tomadas y descartadas

- **Theme que consume CSS vars, no valores hardcodeados**: `global.css` sigue siendo la única fuente de verdad de los tokens, tal como documenta `frontend/CLAUDE.md`. Descartado copiar los hex al `createTheme` (duplicaría la fuente de verdad) y descartado el `sx` suelto por componente (inconsistente a escala).
- **Layout se queda en CSS Modules**: MUI reemplaza componentes, no maquetación. Migrar las 478 líneas de `Landing.module.css` a `Box`/`Grid` sería una reescritura con alto riesgo de drift y sin beneficio de accesibilidad.
- **Baselines de Playwright ANTES de migrar**: sin snapshot del estado previo, "no se rompió nada" no es verificable. Descartada la comparación manual contra `.playwright-evidence/` (no repetible) y el test solo funcional (no detecta drift visual).
- **Sin `CssBaseline`**: el reset de `global.css` es más agresivo y el `body` lleva gradientes radiales propios; añadir el baseline de MUI solo arriesga pisarlos.
- **Errores de Formik vía `helperText`**: enlaza el error al campo por `aria-describedby`, que es justamente lo que hoy falta. Cuesta borrar `ErrorSpan` y tocar las dos páginas.
- **Reemplazo directo por encima del wrapper**: si el componente de MUI vestido por el theme cubre el caso, se borra el nuestro y las páginas importan MUI (`Button`, `Input`, `Card`, `Tabs`, `ErrorSpan`). Un wrapper que solo concatena clases es indirección sin valor y desincroniza la API respecto a la documentación de MUI. Descartada la opción de conservar todas las firmas actuales: acotaba el diff a `src/components/` pero dejaba una capa muerta que habría que mantener.
- **Wrapper solo con lógica de dominio**: `StatusPill` y `SongRow` sobreviven porque traducen tipos del dominio (`DestinationStatus`, `Song`) a props visuales; ese mapeo no cabe en el theme y repetirlo en cada call site sería peor.
- **`SpotifyIcon` no se migra**: el logo de Spotify es marca registrada y no está en Material Icons; sustituirlo por un icono genérico cambiaría el diseño del banner y de las filas de playlist.
- **Paginación con dos `Button`, no `Pagination`**: el componente de MUI impone su propio look (numeritos), lejos del `← Prev / Next →` actual.

## Riesgos identificados

- **Fuentes desde Google Fonts** (`@import` en `global.css`): si la red falla durante un run de Playwright, cambia el render del texto y todos los snapshots fallan en masa. Mitigación: `document.fonts.ready` antes de cada captura; si aparece flakiness, autohospedar las fuentes (fuera de este spec).
- **Especificidad Emotion vs CSS Modules**: MUI inyecta sus estilos en `<head>` y el orden frente al CSS que importa Vite no está garantizado. Si aparecen overrides perdidos, la salida es `StyledEngineProvider injectFirst`, no una cascada de `!important`.
- **`backdrop-filter` de `.t-card`** ya venía sin fallback definido desde el spec 01; pasarlo al theme no lo arregla.
- **Peso del bundle**: MUI + icons suma un tamaño no trivial. Importar siempre por ruta directa (`@mui/icons-material/Search`), nunca barrel.
- **El `Button` de MUI renderiza `<span class="MuiTouchRipple-root">`**: el ripple es una animación que puede introducir flakiness en snapshots; desactivarlo en el theme (`disableRipple`) si aparece, decidiéndolo contra las baselines y no a priori.

## Verificación

```bash
cd frontend
npm run lint
npm run build
npx playwright test                       # contra baselines del paso 1
npx playwright test --update-snapshots    # SOLO tras revisar y justificar cada diff
npm run dev                               # revisión visual manual /login → /signup → /
```

Revisión manual final contra `src/references/screenshots/` y `.playwright-evidence/`: fuentes Syne/DM Sans, gradiente del CTA, radios, fondo del body con los dos glows radiales.
