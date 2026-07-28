# 01 — Scaffold visual: Auth + Landing (Totify)

**Estado:** Implementado
**Depende de:** ninguno (primer spec del proyecto)
**Fecha:** 2026-07-28

**Objetivo:** Construir el scaffold visual (sin lógica de negocio) de Login, Sign Up y Landing de Totify usando React Router v6, con componentes limpios y callbacks stub listos para que el usuario conecte su propia lógica de auth/Spotify/AI.

## Scope

**Incluido:**
- Instalar y configurar `react-router-dom` v6 (`BrowserRouter`, rutas `/login`, `/signup`, `/` → Landing).
- Copiar `global.css` (design tokens + resets + clases utilitarias, incluye `@import` de Google Fonts Syne/DM Sans) a `src/styles/global.css`, importado una vez en `main.tsx`.
- Página **Login**: card, inputs email/password, botón "Sign In", link a Sign Up, validación visual de error (texto rojo) mostrada vía prop, sin lógica real de auth.
- Página **Sign Up**: card, Name/Last name/Email/Password, botón "Create Account", link a Login.
- Página **Landing**: navbar + logout button, banner conexión Spotify (toggle visual), panel izquierdo (tabs Search/Upload con UI completa), panel derecho (playlist destino con status pills).
- Componentes compartidos reutilizables: `SongRow`, `Tabs`, `StatusPill`, `Button`, `Input`, `Card`.
- Callbacks stub tipados en cada página/formulario (ej. `onLogin`, `onSignup`, `onConnectSpotify`, `onSearch`, `onValidateWithAI`, `onAddSong`) — implementación default: no-op o `console.log`.
- Datos mock para poblar visualmente (canciones, resultados búsqueda, playlist), marcados con comentario `// MOCK — quitar` para remoción fácil.
- Assets logo (`logo-mark.png`, `logo-full.png`) copiados a `src/assets/`.

**NO incluido (fuera de este spec):**
- Lógica real de autenticación (login/signup contra backend, manejo de sesión/tokens).
- Integración real con Spotify API (OAuth, búsqueda, agregar canciones).
- Integración real con IA de validación de imágenes.
- Persistencia de estado entre sesiones (localStorage, backend, etc.).
- Rutas protegidas / guards de auth reales (landing queda accesible visualmente sin verificación).
- Responsive / mobile (handoff explícito: solo desktop).
- Tests automatizados.
- Tailwind (quedó como alternativa no elegida, ver Decisiones).

## Data model

Solo tipos TypeScript para forma visual (sin persistencia real).

```typescript
// src/types/song.ts
export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string; // "3:24"
}

export interface DetectedSong extends Song {
  confidence: number; // 0–100, viene de AI (mock por ahora)
}

export type DestinationStatus = 'queued' | 'adding' | 'added';

export interface DestinationSong {
  song: Song;
  status: DestinationStatus;
}

// src/types/user.ts
export interface User {
  email: string;
  name: string;
  lastName: string;
}

// src/types/callbacks.ts (props stub compartidos)
export interface LoginFormProps {
  onLogin?: (email: string, password: string) => void;
  error?: string;
}

export interface SignupFormProps {
  onSignup?: (data: { name: string; lastName: string; email: string; password: string }) => void;
  error?: string;
}

export interface LandingProps {
  user?: User | null;
  spotifyConnected?: boolean;
  onConnectSpotify?: () => void;
  onLogout?: () => void;
  onSearch?: (query: string) => void;
  onValidateWithAI?: (image: File | string) => void;
  onAddSong?: (song: Song) => void;
  onRefreshPlaylist?: () => void;
}
```

Todos los callbacks son opcionales y con default no-op/`console.log` dentro del componente si no se pasan — así el componente renderiza standalone sin que el usuario tenga que cablear nada todavía.

## Implementation Plan

1. **Setup dependencias**: `npm install react-router-dom`.
2. **Tokens y assets**: copiar `global.css` (de `design_handoff_totify 2/`) a `src/styles/global.css`, importar en `main.tsx`. Copiar `logo-mark.png`, `logo-full.png` a `src/assets/`.
3. **Tipos**: crear `src/types/{song,user,callbacks}.ts` según Data Model.
4. **Router**: configurar `BrowserRouter` en `main.tsx`/`App.tsx` con rutas `/login`, `/signup`, `/` (Landing).
5. **Componentes compartidos** (`src/components/`): `Card`, `Input`, `Button`, `Tabs`, `SongRow`, `StatusPill` — CSS Modules por componente, reutilizando clases `.t-*` de `global.css`.
6. **Página Login** (`src/pages/Login/`): estructura del handoff, validación visual (required + `@`), `onLogin` stub, link a `/signup`.
7. **Página Signup** (`src/pages/Signup/`): 4 campos, `onSignup` stub, link a `/login`.
8. **Página Landing** (`src/pages/Landing/`): navbar, banner Spotify, panel izquierdo (Search/Upload tabs) con mocks (`// MOCK — quitar`), panel derecho (playlist) con mocks, todos los callbacks stub.
9. **Verificación manual**: `npm run dev`, navegar `/login` → `/signup` → `/`, confirmar visual pixel-accurate vs handoff, confirmar que remover bloques `// MOCK` deja estados vacíos correctos (empty states).

## Acceptance Criteria

- [x] `npm run dev` levanta sin errores.
- [x] Ruta `/login` renderiza card con logo, subtítulo, inputs email/password, botón "Sign In", link a `/signup`.
- [x] Ruta `/signup` renderiza card con Name/Last name/Email/Password, botón "Create Account", link a `/login`.
- [x] Ruta `/` renderiza Landing completo: navbar + logout, banner Spotify (toggle visual), panel Search/Upload (tabs funcionan visualmente), panel Playlist destino.
- [x] Validación visual funciona: campos vacíos o email sin `@` muestran texto de error en rojo (`--color-error`), sin llamar backend.
- [x] Tabs Search/Upload cambian de contenido al click (estado local de UI, no lógica de negocio).
- [x] Mocks de canciones/resultados/playlist están marcados con `// MOCK — quitar` y removerlos deja los empty states correctos ("no results", "No songs yet", etc.).
- [x] Todos los callbacks (`onLogin`, `onSignup`, `onConnectSpotify`, `onSearch`, `onValidateWithAI`, `onAddSong`, `onRefreshPlaylist`) están tipados y aceptan implementación externa vía props.
- [x] Visual coincide con handoff (colores, tipografía Syne/DM Sans, radios, spacing) usando `global.css` + clases `.t-*`.
- [x] `tsc -b` (build) pasa sin errores de tipos.
- [x] Cero llamadas reales a APIs externas (Spotify, AI, backend) — todo simulado/estático.

## Decisiones tomadas y descartadas

- **CSS Modules + `global.css` (tokens/utilities) en vez de Tailwind**: handoff ya trae variables/clases `.t-*` listas para usar; Tailwind agregaría capa extra sin necesidad. Tailwind queda anotado como alternativa válida si el usuario decide migrar después.
- **React Router v6** (no v7): API clásica `<Routes>/<Route>`, más simple, sin necesidad de data routers para este alcance.
- **Callbacks stub opcionales con no-op/`console.log` default**: permite que cada página renderice standalone sin que el usuario tenga que cablear nada todavía, pero deja el contrato de tipos listo para conectar lógica real.
- **Mocks inline con comentario `// MOCK — quitar`** en vez de archivos separados: más simple de detectar y borrar en el propio componente, evita capa de indirección (mock files) para algo temporal.
- **Sin guards de auth reales**: Landing accesible directo por ruta; usuario decide después cómo proteger. Evita construir lógica de sesión que es justamente lo que el usuario quiere implementar por su cuenta.
- **Sin responsive/mobile**: handoff explícito que fue diseñado solo para desktop; agregar breakpoints sería inventar decisiones de diseño no confirmadas.
- **Assets copiados a `src/assets/`** en vez de referenciar `src/references/`: carpeta `references/` es material de diseño, no debe ser dependencia de build de producción.

## Riesgos identificados

- `global.css` viene del handoff sin validar contra el build de Vite; el `@import` de Google Fonts dentro del CSS penaliza el first paint frente a un `<link>` en `index.html`.
- El prototipo simula el flujo add-song con timers (500ms → 1800ms); replicarlo visualmente puede confundirse con lógica real al cablear la API después.
- `backdrop-filter` no tiene fallback definido en el handoff para navegadores sin soporte.
