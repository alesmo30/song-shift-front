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

There is no test runner configured (no test script, no test files) — this spec's acceptance criteria explicitly excluded automated tests.

## Spec-driven workflow

This project uses a spec-kit workflow: feature specs live in `specs/NN-slug.md` and follow a fixed template (Objetivo, Scope incluido/no incluido, Data model, Acceptance Criteria, Decisiones tomadas y descartadas, Riesgos identificados). Specs are written in Spanish. `specs/.spec-config.yml` controls whether `/spec-impl` auto-creates a branch. Before making non-trivial changes, check whether an existing spec already covers the area and whether it lists the change as explicitly out of scope — several things (real auth, real Spotify integration, responsive/mobile, tests) were deliberately deferred and documented as such rather than forgotten.

## Architecture

- **Routing**: `src/App.tsx` uses `react-router-dom` v6 classic API (`<BrowserRouter>/<Routes>/<Route>`), not v7 data routers. Three routes: `/login`, `/signup`, `/` (Landing). No auth guards — Landing is reachable directly.
- **Styling**: CSS Modules per component (`Component.module.css`) layered on top of `src/styles/global.css`, which holds design tokens (CSS custom properties like `--color-error`, `--fs-display-lg`, `--tracking-display`) and global utility classes prefixed `t-` (e.g. `t-btn-primary`, `t-wordmark`). This is a deliberate choice over Tailwind — the design handoff already ships tokens/utilities in this form. When styling, prefer existing `--*` tokens and `t-*` classes over inventing new values.
- **Forms**: Built with Formik. Field-level errors render through `src/components/ErrorSpan/ErrorSpan.tsx` via Formik's `<ErrorMessage component={ErrorSpan} />` pattern — validation is synchronous and client-side only (e.g. required fields, email regex), never hits a backend.
- **Callback-stub contract**: Page components accept typed optional callback props defined centrally in `src/types/callbacks.ts` (`LoginFormProps`, `SignupFormProps`, `LandingProps`). Every page falls back to a `console.log(...)` no-op when a callback isn't supplied, so pages render standalone before real logic (auth, Spotify, AI) is connected. When adding a new stubbed interaction, follow this pattern: add the callback's type to `callbacks.ts`, accept it as an optional prop, and no-op with `console.log` by default.
- **Mock data**: Inline in the component that uses it (e.g. `src/pages/Landing/mockData.ts`), tagged with the comment `// MOCK — quitar` so it's easy to find and delete once real data wiring exists. Preserve this tag convention on any new mock data.
- **Domain types**: Split by concern in `src/types/` — `song.ts` (Song, DetectedSong, DestinationSong, DestinationStatus), `user.ts` (User), `callbacks.ts` (prop contracts described above).
- **`src/references/`**: design handoff material (mockups, screenshots, the original `Totify.dc.html`, source assets) — not part of the production build. Production assets live in `src/assets/`; don't import from `references/` in app code.
- **Shared components** (`src/components/`): `Button`, `Input`, `Card`, `Tabs`, `StatusPill`, `SongRow`, `ErrorSpan`, plus one-off icon components in `components/icons/`. Reuse these instead of inlining new buttons/inputs/cards.
