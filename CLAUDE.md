# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Totify — frontend for a tool that bridges an Apple Music library to Spotify. React 19 + TypeScript + Vite. This repo currently contains only the **visual scaffold** (spec `specs/01-visual-scaffold-auth-landing.md`, status: implemented): Login, Sign Up, and Landing pages with no real business logic wired in yet. Auth, Spotify OAuth, and AI image validation are all stubbed.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # tsc -b (type-check) then vite build
npm run lint      # eslint .
npm run preview   # preview production build
```

```bash
npm run test:e2e         # playwright test (regresión visual + funcional)
npm run test:e2e:update  # regenera snapshots — solo tras revisar cada diff
```

There is no unit test runner (no Jest/Vitest). The only automated tests are the Playwright suite in `e2e/`, added by spec 02: 23 tests and 14 screenshot baselines in `e2e/__screenshots__/`, run against `npm run dev` via `playwright.config.ts` (`maxDiffPixelRatio: 0.02`, animations disabled, fonts awaited). Interactive elements carry stable `data-testid` hooks so selectors survive component swaps.

## Spec-driven workflow

This project uses a spec-kit workflow: feature specs live in `specs/NN-slug.md` and follow a fixed template (Objetivo, Scope incluido/no incluido, Data model, Acceptance Criteria, Decisiones tomadas y descartadas, Riesgos identificados). Specs are written in Spanish. `specs/.spec-config.yml` controls whether `/spec-impl` auto-creates a branch. Before making non-trivial changes, check whether an existing spec already covers the area and whether it lists the change as explicitly out of scope — several things (real auth, real Spotify integration, responsive/mobile, tests) were deliberately deferred and documented as such rather than forgotten.

## Architecture

- **Routing**: `src/App.tsx` uses `react-router-dom` v6 classic API (`<BrowserRouter>/<Routes>/<Route>`), not v7 data routers. Three routes: `/login`, `/signup`, `/` (Landing). No auth guards — Landing is reachable directly.
- **UI library**: Material UI v9 (spec 02). Components come from MUI; their Totify look lives in `src/theme/theme.ts`, mounted in `main.tsx` inside `<StyledEngineProvider injectFirst><ThemeProvider>`. `injectFirst` is load-bearing: MUI's styles are injected first so `global.css` and the CSS Modules keep winning the cascade. There is deliberately **no** `CssBaseline` — `global.css` already resets and paints the body. Before hand-rolling any control, use the MUI equivalent; only wrap it when there is domain logic to map (see `StatusPill`, `SongRow`).
- **Styling**: two layers. (1) `src/styles/global.css` holds the design tokens (CSS custom properties like `--color-error`, `--fs-display-lg`, `--tracking-display`) plus the surviving utility classes `t-heading`, `t-wordmark`, `t-panel`, `t-row`, `t-error-text`; the tokens are the single source of truth and the theme references them with `var(--*)`. (2) CSS Modules per component/page (`Component.module.css`) for layout only. Deliberately not Tailwind — the design handoff ships tokens in this form. When styling, reach for existing `--*` tokens before inventing values, and add component looks to the theme rather than to new CSS.
- **Forms**: Built with Formik + MUI `TextField`. Field errors are wired with `error={Boolean(touched.x && errors.x)}` and `helperText`, so MUI links them to the input via `aria-describedby`/`aria-invalid`. Validation is synchronous and client-side only (`src/helpers/error-*-validation.ts`: required fields, email regex), never hits a backend.
- **Callback-stub contract**: Page components accept typed optional callback props defined centrally in `src/types/callbacks.ts` (`LoginFormProps`, `SignupFormProps`, `LandingProps`). Every page falls back to a `console.log(...)` no-op when a callback isn't supplied, so pages render standalone before real logic (auth, Spotify, AI) is connected. When adding a new stubbed interaction, follow this pattern: add the callback's type to `callbacks.ts`, accept it as an optional prop, and no-op with `console.log` by default.
- **Mock data**: Inline in the component that uses it (e.g. `src/pages/Landing/mockData.ts`), tagged with the comment `// MOCK — quitar` so it's easy to find and delete once real data wiring exists. Preserve this tag convention on any new mock data.
- **Domain types**: Split by concern in `src/types/` — `song.ts` (Song, DetectedSong, DestinationSong, DestinationStatus), `user.ts` (User), `callbacks.ts` (prop contracts described above).
- **`src/references/`**: design handoff material (mockups, screenshots, the original `Totify.dc.html`, source assets) — not part of the production build. Production assets live in `src/assets/`; don't import from `references/` in app code.
- **Shared components** (`src/components/`): only two, and both exist because they map domain types, not because they restyle MUI — `StatusPill` (`DestinationStatus` → label + colour, over `Chip`) and `SongRow` (`Song` → title/artist/duration row, over `ListItem`). Everything else imports MUI directly. `components/icons/` keeps a single icon, `SpotifyIcon`, because Material Icons has no Spotify logo; it is a `SvgIcon` wrapper around the handoff glyph. Generic icons come from `@mui/icons-material` — import by direct path (`@mui/icons-material/Search`), never from the barrel.
