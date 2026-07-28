# Handoff: Totify — Apple Music to Spotify Transfer App

## Overview
Totify lets a user find songs seen in Apple Music (via search or screenshot upload + AI validation) and add them to a Spotify destination playlist. Three screens: Login, Sign Up, Landing (main app).

## About the Design Files
The bundled `Totify.dc.html` is a **design reference** built in an HTML prototyping tool (inline styles, a custom templating syntax like `{{ value }}` and `<sc-if>`/`<sc-for>`). It is **not production code** — do not copy it verbatim. Recreate the UI and interactions below as idiomatic **React + TypeScript** components, using whatever component/styling library the target codebase already has (styled-components, CSS Modules, Tailwind, etc.) — if none exists, plain CSS Modules + a small design-tokens file is a safe default.

## Fidelity
**High-fidelity.** Colors, spacing, typography, and copy below are final. Recreate pixel-accurately.

## Screens / Views

### 1. Login
- **Purpose**: Email/password sign-in.
- **Layout**: Full-viewport dark background, centered card, 420px wide, `border-radius: 22px`, `padding: 48px 44px`, `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.09)`, `backdrop-filter: blur(20px)`.
- **Components**:
  - Logo mark (48×48, `border-radius: 12px`, white bg) + "totify" wordmark, Syne 800, 28px, letter-spacing -1px.
  - Subtitle: "Bridge your Apple Music library to Spotify — effortlessly." 13.5px, `rgba(255,255,255,0.38)`.
  - Email input, Password input — both `background: rgba(255,255,255,0.06)`, `border: 1px solid rgba(255,255,255,0.1)`, `border-radius: 11px`, `padding: 13px 16px`, 14.5px text. Labels: 11.5px, 600 weight, uppercase, letter-spacing 0.6px, `rgba(255,255,255,0.5)`.
  - Inline error text in `#F87171`, 13px, shown only on validation failure.
  - "Sign In" button: full width, `linear-gradient(135deg, #FF2D55, #FF7043)`, white text 15px/600, `border-radius: 11px`, `padding: 15px`, shadow `0 4px 18px rgba(255,45,85,0.35)`.
  - Footer link: "Don't have an account? **Sign up free**" (accent `#FF7043`) → navigates to Sign Up.
- **Validation**: both fields required; email must contain `@`. Enter key submits.

### 2. Sign Up
- **Purpose**: New account creation.
- **Layout**: Same card shell/style as Login, scrollable container (`overflow-y: auto`) since it's taller.
- **Fields** (in order): **Name** and **Last name** side-by-side (`display:flex; gap:12px`, each 50% width), then **Email**, then **Password** — same input styling as Login.
- **Components**: same logo header, subtitle "Create your account to get started.", inline error text (same style as Login), "Create Account" button (identical gradient/style to Sign In), footer link "Already have an account? **Sign in**" → back to Login.
- **Validation**: all 4 fields required; email must contain `@`. On success, navigates straight to Landing (no separate confirmation step in this prototype — real implementation should call the actual signup API).

### 3. Landing (main app)
- **Top navbar** (56px tall, `border-bottom: 1px solid rgba(255,255,255,0.06)`, blurred dark bg): logo mark (32×32) + "totify" wordmark (Syne 800, 20px) on the left; "Log out" button on the right (`rgba(255,255,255,0.05)` bg, 1px border, `border-radius: 8px`, `padding: 7px 18px`, 13px text).
- **Spotify connect banner** (below navbar, full width, 11px/28px padding): Spotify glyph in a 34px green circle + status text on the left; "Connect Spotify" / "✓ Connected" toggle button on the right. Connected state tints banner bg `rgba(29,185,84,0.05)` and status text green.
- **Two-panel body** (flex row, `gap: 14px`, `padding: 16px 28px 20px`, each panel `flex:1`, `border-radius:16px`, `background: rgba(255,255,255,0.03)`, `border: 1px solid rgba(255,255,255,0.07)`):

  **Left — "Find Songs"**: two-tab switcher (Search / Upload Photo) inside a pill-track (`background: rgba(0,0,0,0.25)`, `border-radius:10px`, `padding:4px`).
  - *Search tab*: text input + "Search" button (`#FF2D55` bg); results list (song rows: 36px icon tile, title 13.5px/500, artist+duration 11.5px muted, "+ Add"/"✓ Added" pill button `#1DB954`); pagination footer (Prev/Next + "page X / Y", 6 results per page); empty states for "no results" and "type to search".
  - *Upload tab*: drag-and-drop zone (dashed border, turns green-tinted on drag-over) or file picker; once an image is set, shows a 150px preview with a round "×" clear button, then a "Validate with AI" button (gradient `#FF2D55→#FF7043`, pulses while validating); detected songs list shows title/artist + confidence % (green ≥90%, amber ≥75%, red below) + Add button.

  **Right — "Spotify Playlist"**: header shows "{added} of {total} songs added" + a refresh icon button (spins for 1.2s on click, `rgated(255,255,255,0.5)` stroke). Song rows: green-tinted icon tile, title/artist, status pill — "Queued" (grey) → "Adding…" (amber) → "Added ✓" (green), auto-progressing over ~2.3s after being added from the left panel. Empty state: "No songs yet" with instructions.

## Interactions & Behavior
- **Add-song flow**: clicking Add on the left inserts the song into the right panel at status "queued" → after 500ms "adding" → after another 1800ms "added". Model this as an async job status in the real app (poll or websocket against the actual Spotify-add API call).
- **AI validation**: "Validate with AI" simulates a 2.4s call returning 4 detected songs with confidence scores. Replace with a real vision-LLM call that returns `{title, artist, confidence}[]`; user must confirm each before it's added (never auto-add).
- **Search**: client-side filter in the prototype (mock library of 24 songs) with 6-per-page pagination. Replace with a real Spotify Search API call, paginated server-side.
- **Refresh** (right panel): should re-fetch actual playlist contents from Spotify.
- **Logout**: clears all session state, returns to Login.
- No responsive breakpoints were designed — this was built for desktop/laptop viewports. Confirm with design before adding mobile layouts.

## State Management
Suggested top-level state (e.g. in a store or top App component):
- `page`: `'login' | 'signup' | 'landing'`
- `user`: `{ email, name, lastName } | null`
- `spotifyConnected: boolean`
- `activeTab`: `'search' | 'upload'`
- `searchQuery: string`, `searchResults: Song[]`, `currentPage: number`
- `uploadedImage: string | null`, `detectedSongs: DetectedSong[]`, `isValidating: boolean`
- `destinationSongs: { song: Song; status: 'queued'|'adding'|'added' }[]`
- Form-local state for login/signup fields + validation error strings.

## Design Tokens
- **Colors**: bg `#07070F`; panel fill `rgba(255,255,255,0.03)`; panel border `rgba(255,255,255,0.07)`; primary text `#fff`; muted text `rgba(255,255,255,0.38–0.5)`; brand gradient `#FF2D55 → #FF7043` (buttons/CTAs); Spotify green `#1DB954`; error `#F87171`; amber (in-progress) `#FBBF24`.
- **Typography**: Headings/logo — **Syne** (700/800 weight). Body/UI — **DM Sans** (300–600 weight). Base UI text 13–15px; labels 11.5px uppercase.
- **Radius**: cards/panels 16–22px; inputs/buttons 10–11px; small chips/pills 7–9px; circular icon tiles use `border-radius: 50%` or 7–8px for squircle tiles.
- **Shadows**: CTA buttons use `0 4px 18px rgba(255,45,85,0.35)`.

## Assets
- `assets/logo-mark.png` — app logo mark (used at 32–48px, white rounded-square badge).
- `assets/logo-full.png` — full logo lockup (not currently placed in the UI, included for reference/marketing use).
- Spotify and Apple Music glyphs are hand-drawn inline SVG in the prototype — recreate with official brand SVGs per each platform's brand guidelines, or your own icon set if brand icons aren't licensed for use.

## Files
- `Totify.dc.html` — full design reference (all 3 screens, inline template + logic).
