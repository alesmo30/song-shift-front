# 05 — Conexión de Spotify desde la UI

**Estado:** Approved
**Depende de:** `specs/04-tab-selected-y-upload-real.md` (Implementado) y `backend/specs/02-spotify-oauth.md` (mergeado en `main` vía PR #25)
**Fecha:** 2026-08-24

**Objetivo:** Sustituir el toggle local del banner de Spotify por la conexión real contra los cuatro endpoints del backend, de modo que conectar, desconectar y reconectar dependan del servidor y no de un booleano en el cliente.

## Context

El banner de Spotify de `src/pages/Landing/Landing.tsx:115-122` es un stub visual desde la spec 01: `handleToggleSpotify` (`Landing.tsx:39-46`) invierte el booleano de Redux `user.isSpotifyConnected` y llama a un `console.log`. El banner puede afirmar "conectado" sin que exista ninguna cuenta de Spotify enlazada.

Con `backend/specs/02-spotify-oauth.md` ya mergeado, el backend es dueño del flujo Authorization Code completo y expone cuatro endpoints reales. Esta spec conecta la UI a ellos.

El spec 04, ya mergeado, declaró explícitamente que Spotify seguía siendo el toggle local de la spec 01 y que no condicionaba el envío a la playlist. Este spec recoge ese hilo.

Solo cubre conectar, ver el estado, desconectar y reconectar. Playlists, matching y alta masiva quedan para el spec 06.

## Scope

**Incluido:**

- `src/api/spotify.service.ts`: `getSpotifyAuthUrl`, `getSpotifyStatus`, `disconnectSpotify`, sobre el `apiClient` existente. No se toca `src/api/client.ts`.
- `src/types/spotify.ts`: `SpotifyConnection` y `SpotifyConnectionStatus`.
- `src/store/features/spotifySlice.ts`: estado de conexión más los thunks `fetchSpotifyStatus`, `startSpotifyConnect` y `disconnectSpotifyAccount`. Registrado en `store.ts` y **fuera** de la `whitelist` de redux-persist.
- `userSlice`: nuevo reducer `setSpotifyConnected(boolean)`, único escritor de `user.isSpotifyConnected`. Se elimina el flip local de `Landing.tsx:40`.
- Ruta `/spotify/callback` en `src/App.tsx`, dentro de `PrivateRoutes`, y página `src/pages/SpotifyCallback/SpotifyCallback.tsx`.
- Banner de Landing con cuatro estados visuales: comprobando, desconectado, conectado y necesita reconexión.
- Diálogo de confirmación al desconectar, reutilizando el patrón del logout que ya vive en `Landing.tsx:83-104`.
- Manejo de los `reason` del backend (`access_denied`, `invalid_state`, `state_expired`, `state_reused`, `token_exchange_failed`, `profile_fetch_failed`, `user_not_allowlisted`) como mensaje al usuario.
- Tratamiento del `409 SPOTIFY_REAUTH_REQUIRED` como "reconectar", no como sesión de Totify caducada.
- Reescritura de `e2e/landing.spec.ts:41-48` y `e2e/persistence.spec.ts:75-87`, más `e2e/spotify.spec.ts` nuevo. Helper `mockSpotifyApi` en `e2e/helpers.ts` (el sembrado de sesión ya existe como `gotoAuthenticated`).
- **Deuda menor (paso 0):** `src/vite-env.d.ts` y `.env.example` documentando `VITE_API_URL`.

**NO incluido (specs futuras):**

- **Selector de playlist destino, crear playlist y leer sus tracks** → `frontend/specs/06`.
- **Matching de tracks y UI de revisión** → `frontend/specs/06`, contra los endpoints de `backend/specs/03`.
- **Alta masiva de canciones en Spotify.** El botón "Add to playlist" del spec 04 sigue llamando al stub `POST /songs/playlist`; este spec no lo redirige a Spotify.
- **Que la conexión de Spotify condicione nada.** Se puede seguir usando la app entera sin conectar; el banner es informativo.
- Refrescar el estado en segundo plano o por polling. Se consulta al montar Landing y tras volver del callback.
- Sync entre pestañas del estado de conexión. Heredado del spec 03: la pestaña B no se entera hasta recargar.
- Popup de OAuth. Se descarta a favor del redirect completo.
- Mostrar la biblioteca de playlists del usuario, aunque el scope `playlist-read-private` ya esté concedido.
- Quitar `e2e/__screenshots__` del `.gitignore` para que la regresión visual sea un contrato de CI. Es cambio de política del repo y merece su propia spec.
- Tocar `PlaylistPanel`, `UploadPanel`, `SearchPanel` o `songsSlice`. Todo eso es del spec 04.

## Modelo de datos

### `src/types/spotify.ts` — nuevo

Espeja la respuesta de `GET /spotify/status` del backend, sin inventar campos.

```ts
export type SpotifyConnectionStatus =
  | 'idle'          // aún no se ha preguntado
  | 'loading'       // fetchSpotifyStatus en vuelo
  | 'connected'
  | 'disconnected'
  | 'needs-reconnect'
  | 'error';        // la consulta de estado falló

export interface SpotifyConnection {
  connected: boolean;
  spotifyUserId: string | null;
  displayName: string | null;
  email: string | null;
  country: string | null;
  scopes: string[];
  connectedAt: string | null;   // ISO 8601
  needsReconnect: boolean;
}

export type SpotifyCallbackReason =
  | 'access_denied'
  | 'invalid_state'
  | 'state_expired'
  | 'state_reused'
  | 'token_exchange_failed'
  | 'profile_fetch_failed'
  | 'user_not_allowlisted';
```

### `src/store/features/spotifySlice.ts` — nuevo

```ts
interface SpotifyState {
  status: SpotifyConnectionStatus;
  connection: SpotifyConnection | null;
  error: string | null;          // mensaje ya legible para el usuario
  connecting: boolean;           // true mientras se pide authorizeUrl
}

const initialState: SpotifyState = {
  status: 'idle',
  connection: null,
  error: null,
  connecting: false,
};
```

Convenciones:

- `status` se deriva de la respuesta, no se escribe a mano desde componentes: `connected && needsReconnect` → `'needs-reconnect'`; `connected` → `'connected'`; si no → `'disconnected'`.
- El slice **no** entra en la `whitelist` de `persistConfig` (`src/store/store.ts:23-30`). El estado de conexión se vuelve a pedir en cada carga; una caché persistida podría afirmar "conectado" sobre un grant ya revocado.
- `error` guarda el mensaje final, no el `reason` crudo. El mapeo `reason → mensaje` vive en el slice, no en el componente.

### `UserState` — cambio en `src/store/features/userSlice.ts`

La forma no cambia; cambia quién escribe `isSpotifyConnected`.

```ts
// Nuevo reducer, único escritor del campo
setSpotifyConnected: (state, action: PayloadAction<boolean>) => {
  state.isSpotifyConnected = action.payload;
}
```

- Se despacha **solo** desde los casos `fulfilled`/`rejected` de `fetchSpotifyStatus` y desde el thunk de desconexión.
- `setUser` sigue aceptando el payload completo (spec 03) y `Login.tsx` sigue mandando `isSpotifyConnected: false` en el login. Deja de importar: al montar Landing se consulta el servidor y gana su respuesta.
- No sube `persistConfig.version`: la forma persistida es idéntica a la del spec 03.

### Contrato consumido del backend

Se consume tal cual, sin adaptadores:

```
POST   /spotify/auth-url        { redirectPath?: string } → { authorizeUrl, state, expiresAt }
GET    /spotify/status                                    → SpotifyConnection
DELETE /spotify/connection                                → 204
```

`GET /spotify/callback` no lo llama el frontend: lo invoca el navegador por redirect de Spotify, y el backend responde con un 302 a `{FRONTEND_URL}{redirectPath}?spotify=connected` o `?spotify=error&reason=...`.

Convención de errores:

- **`409` con `{ code: 'SPOTIFY_REAUTH_REQUIRED' }` significa "reconecta Spotify", no "tu sesión de Totify caducó".** El backend usa 409 y no 401 justamente para que el interceptor de `src/api/client.ts:46` no dispare `/renew-tokens`.

## Plan de implementación

Cada paso deja `npm run build` y `npm run lint` en verde, y la app arrancable. Los pasos 1–4 no cambian nada visible: el banner sigue funcionando como antes hasta el paso 5.

0. **Deuda de tipado del entorno.** Añadir `src/vite-env.d.ts` con la referencia de tipos de Vite, para que `import.meta.env.VITE_API_URL` (`src/api/client.ts:16`) deje de estar sin tipar, y `.env.example` documentando esa variable. Prueba: `npm run build` sigue en verde. No es código de Spotify; va en su propio commit.

1. **Tipos.** Crear `src/types/spotify.ts` con `SpotifyConnection`, `SpotifyConnectionStatus` y `SpotifyCallbackReason`. Prueba: `npm run build` en verde.

2. **Servicio.** Crear `src/api/spotify.service.ts` con `getSpotifyAuthUrl(redirectPath?)`, `getSpotifyStatus()` y `disconnectSpotify()`, al estilo de `src/api/auth.service.ts`. Prueba manual: con el backend levantado y sesión iniciada, llamar `getSpotifyStatus()` desde la consola del navegador y ver `connected: false`.

3. **Slice.** Crear `src/store/features/spotifySlice.ts` con el estado inicial, los tres thunks y el mapeo `reason → mensaje`. Registrarlo en `src/store/store.ts` **sin** tocar la `whitelist`. Prueba: el slice aparece en Redux DevTools y no se escribe en `localStorage`.

4. **Escritor único.** Añadir `setSpotifyConnected` a `userSlice` y despacharlo desde los `extraReducers` del slice de Spotify. Todavía no se quita el flip del banner. Prueba: `npm run test:e2e` sigue verde, porque nada cambió de comportamiento aún.

5. **Banner.** En `Landing.tsx`: `useEffect` de montaje que despacha `fetchSpotifyStatus`, y `handleToggleSpotify` se parte en `handleConnect` (pide la URL y hace `window.location.assign`) y `handleDisconnect` (abre el diálogo de confirmación). Se elimina el `dispatch(setUser(...))` con el flip. Cuatro estados visuales, botón deshabilitado mientras `connecting` o `loading`. **Aquí es donde el banner deja de mentir**, y donde los dos tests de e2e existentes empiezan a fallar.

6. **Ruta de callback.** Crear `src/pages/SpotifyCallback/SpotifyCallback.tsx` y registrar `/spotify/callback` en `src/App.tsx` dentro de `PrivateRoutes`. Lee `useSearchParams`, despacha `fetchSpotifyStatus`, y navega a `/` con `replace: true` pasando el mensaje por router state. Prueba manual: navegar a mano a `/spotify/callback?spotify=error&reason=access_denied` y ver el mensaje en Landing.

7. **Reconexión y 409.** Variante de banner `needs-reconnect` con su acción de reconectar (mismo flujo que conectar). Tratar el `409 SPOTIFY_REAUTH_REQUIRED` de cualquier llamada como transición a ese estado. Prueba: forzar `needsReconnect: true` en la fila de `SpotifyAccount` y recargar.

8. **Helper de test.** Añadir `mockSpotifyApi` a `e2e/helpers.ts`, junto a `gotoStable`, `gotoAuthenticated` y `freeze`. Enruta `**/spotify/**` a fixtures. El sembrado de sesión ya lo cubre `gotoAuthenticated`, que el spec 04 dejó hecho. Prueba: el helper se usa en un test trivial que pasa.

9. **Reescribir los tests rotos.** `e2e/landing.spec.ts:41-48` se parte en dos: arranque de OAuth (con `/spotify/auth-url` stubbeado, aserción sobre el request) y banner conectado (estado sembrado, `/spotify/status` stubbeado, sin clic). `e2e/persistence.spec.ts:75-87` pasa a comprobar que un `isSpotifyConnected: true` persistido pierde frente a un `status` que dice `connected: false`. Prueba: `npm run test:e2e` en verde.

10. **Tests nuevos.** `e2e/spotify.spec.ts`: desconectar con confirmación, la ruta de callback con `?spotify=connected` y con cada `reason`, la variante `needs-reconnect`, y el `409` mostrando "reconectar" en vez de desloguear. Todo con `page.route`; **nunca se llama a Spotify de verdad desde Playwright**.

## Criterios de aceptación

### Conectar

- [ ] Con la sesión iniciada y sin cuenta de Spotify, el banner dice "Spotify not connected".
- [ ] Al montar Landing se dispara exactamente una petición a `GET /spotify/status`.
- [ ] Mientras esa petición está en vuelo, el botón del banner está deshabilitado.
- [ ] Pulsar "Connect Spotify" dispara `POST /spotify/auth-url` y navega a la URL devuelta.
- [ ] Mientras `POST /spotify/auth-url` está en vuelo, el botón está deshabilitado y no se puede disparar dos veces.
- [ ] Aprobar el consentimiento en Spotify devuelve al usuario a la app y el banner queda en "Spotify connected".
- [ ] Tras conectar, el banner muestra el `displayName` de la cuenta de Spotify.
- [ ] Volver del callback deja la URL en `/`, sin `?spotify=connected` colgando en la barra de direcciones.
- [ ] El usuario sigue autenticado en Totify tras el viaje completo a Spotify y de vuelta.

### Estado derivado del servidor

- [ ] Con `isSpotifyConnected: true` persistido en `localStorage` y un `GET /spotify/status` que responde `connected: false`, el banner muestra desconectado.
- [ ] Ese mismo caso deja `isSpotifyConnected` en `false` en el estado persistido tras la respuesta.
- [ ] Ningún componente escribe `user.isSpotifyConnected` directamente: el único `dispatch(setSpotifyConnected(...))` sale del slice de Spotify.
- [ ] El slice `spotify` no aparece en la clave `persist:totify` de `localStorage`.
- [ ] Recargar la página vuelve a consultar `GET /spotify/status`.

### Desconectar

- [ ] Estando conectado, el botón del banner ofrece desconectar.
- [ ] Pulsarlo abre un diálogo de confirmación; cancelar no dispara ninguna petición.
- [ ] Confirmar dispara `DELETE /spotify/connection` y deja el banner en desconectado.
- [ ] El diálogo de desconexión advierte de que el permiso sigue vivo en la cuenta de Spotify del usuario hasta que lo retire en spotify.com/account/apps.

### Reconexión y errores

- [ ] Con `needsReconnect: true` en la respuesta de status, el banner muestra la variante de reconexión, distinta de conectado y de desconectado.
- [ ] La acción de reconectar arranca el mismo flujo que conectar.
- [ ] Una respuesta `409` con `code: 'SPOTIFY_REAUTH_REQUIRED'` lleva al estado de reconexión y **no** desloguea al usuario de Totify.
- [ ] Ese `409` **no** dispara `POST /renew-tokens`.
- [ ] `/spotify/callback?spotify=error&reason=access_denied` muestra un mensaje de que el usuario canceló, no un error genérico.
- [ ] Cada uno de los siete `reason` del backend tiene su propio mensaje y ninguno muestra `[object Object]` ni el `reason` crudo.
- [ ] Si `GET /spotify/status` falla, el banner queda en estado de error y no afirma que hay conexión.

### Proyecto

- [ ] `npm run build` pasa.
- [ ] `npm run lint` pasa.
- [ ] `npm run test:e2e` pasa entero.
- [ ] `e2e/landing.spec.ts` y `e2e/persistence.spec.ts` ya no contienen ningún test que asuma que el toggle invierte estado en local.
- [ ] Ningún test de Playwright hace una petición real a `accounts.spotify.com` ni a `api.spotify.com`.
- [ ] Las 14 baselines visuales pasan sin regenerarse, salvo `landing-spotify-conectado.png`, cuyo banner cambia por diseño. (Ver nota en Riesgos: viven fuera del repo.)
- [ ] `src/api/client.ts` no se ha modificado.
- [ ] `src/pages/Landing/PlaylistPanel.tsx`, `UploadPanel.tsx`, `SearchPanel.tsx` y `songsSlice.ts` no se han modificado.

## Decisiones tomadas y descartadas

- **El estado de conexión lo manda el servidor, no el cliente**: hoy `user.isSpotifyConnected` es un booleano que se invierte con un clic, así que el banner puede afirmar "conectado" sin que exista ninguna cuenta enlazada. Con el backend de la spec 02 en pie, la única fuente fiable es `GET /spotify/status`. "Persistido `true` + grant revocado en Spotify" es un estado real que solo el backend conoce, y por eso se consulta en cada montaje de Landing.

- **Se conserva `isSpotifyConnected` en `userSlice` en vez de moverlo al slice nuevo**: quitarlo obliga a subir `persistConfig.version` a 1, escribir una migración y reescribir los fixtures de forma persistida de `e2e/persistence.spec.ts:9` y `:79`. Conservarlo cuesta un reducer de tres líneas. La disciplina se logra con la regla de escritor único: `setSpotifyConnected` solo se despacha desde el slice de Spotify. Descartado también dejar el campo escribible desde componentes: es exactamente el bug que este spec viene a arreglar.

- **`Login.tsx` sigue mandando `isSpotifyConnected: false` y no se toca**: hoy eso pisa el valor persistido en cada login, que era un bug real. Deja de serlo en cuanto el servidor manda: el login apaga el flag y el `fetchSpotifyStatus` del montaje de Landing lo corrige medio segundo después. Cambiar la firma de `setUser` para hacerlo parcial contradice la decisión del spec 03 de payload completo tipado.

- **Redirect completo con ruta dedicada, no popup**: el popup (`window.open` más una página puente servida por el backend) conserva el estado en memoria de la SPA y se siente más fluido, pero añade un modo de fallo por bloqueo de popups, un `postMessage` cross-origin cuyo origen hay que verificar, y una relación `opener` entre `127.0.0.1` y `localhost` que es delicada en dev. Con redux-persist ya montado desde la spec 03, el redirect completo no pierde nada: el estado sobrevive al viaje porque vive en `localStorage`.

- **Ruta `/spotify/callback` propia en vez de consumir el query param en Landing**: aterrizar en `/?spotify=connected` y leerlo en el `useEffect` de Landing es menos código, pero mezcla la lógica de retorno de OAuth con el montaje de la página principal, y deja los siete `reason` de error sin un sitio natural donde renderizarse. La ruta dedicada se autodocumenta y limpia la URL con `navigate('/', { replace: true })`.

- **La ruta de callback vive dentro de `PrivateRoutes`**: el guard lee el estado rehidratado de redux-persist, que sobrevive al viaje a Spotify. Ponerla fuera del guard la dejaría accesible sin sesión, y el `fetchSpotifyStatus` que dispara necesita el JWT igualmente.

- **`POST /spotify/auth-url` devuelve la URL y el frontend navega, en vez de un enlace directo al backend**: el JWT viaja como cabecera `Authorization` puesta por el interceptor de axios, y una navegación top-level del navegador no puede llevar cabeceras. Es la contraparte en el cliente de la decisión ya tomada en `backend/specs/02-spotify-oauth.md`.

- **El slice de Spotify no se persiste**: es la aplicación directa de la regla de la spec 03 de que cada slice decide explícitamente. Persistir la conexión daría un primer render más rápido a costa de poder afirmar "conectado" sobre un grant ya muerto — justo el bug que se está arreglando.

- **`status` es un enum derivado, no un booleano más un par de flags**: `'idle' | 'loading' | 'connected' | 'disconnected' | 'needs-reconnect' | 'error'` hace imposible representar estados contradictorios como "cargando y conectado a la vez". Descartado `{ loading: boolean, connected: boolean, error: string | null }`: tres campos independientes permiten ocho combinaciones, de las cuales la mitad no significan nada.

- **El mapeo `reason → mensaje` vive en el slice, no en los componentes**: la página de callback y el banner necesitan los mismos textos. Duplicarlos garantiza que se desincronicen.

- **El `409 SPOTIFY_REAUTH_REQUIRED` se trata como "reconectar", nunca como sesión caducada**: es la contraparte en el cliente de la decisión del backend de no usar 401 para fallos de Spotify. Hay un criterio de aceptación explícito de que ese 409 no dispara `POST /renew-tokens`.

- **Cuatro estados visuales de banner, no dos**: `needs-reconnect` es indistinguible de `connected` si solo se mira el booleano, y el usuario se quedaría mirando un banner verde mientras nada funciona. El estado `checking` evita el parpadeo de "desconectado" durante el primer render.

- **La desconexión avisa de que Spotify conserva el permiso**: `DELETE /spotify/connection` solo borra la fila local; Spotify no ofrece endpoint de revocación. Sin ese aviso el usuario cree que cortó el acceso del todo. Es un riesgo de expectativa heredado del backend, y la UI es el único sitio donde se puede explicar.

- **Se redactó como independiente del 04, pero el 04 se mergeó antes**: cuando se escribió este spec el 04 estaba en curso y se decidió no encadenarlos, porque solo se cruzaban en dos líneas de `store.ts`. El 04 llegó a `main` primero, así que ese riesgo de conflicto desapareció y el spec pasa a construir sobre él: `songsSlice` ya está registrado y `gotoAuthenticated` ya existe.

- **La deuda de tipado del entorno se salda como paso 0**: falta `src/vite-env.d.ts`, así que `import.meta.env.VITE_API_URL` está sin tipar desde que existe `client.ts`. Es de dos archivos y encaja con un spec que cablea la capa de API. Va en commit propio para que no se mezcle con el código de Spotify. Nota: los dos `TS6133` que rompían el build cuando se redactó este spec ya los arregló el spec 04 al mergearse.

- **No se quita `e2e/__screenshots__` del `.gitignore`**: hacer que la regresión visual sea un contrato real de CI es un cambio de política del repo con implicaciones propias (¿qué SO genera las baselines?, ¿qué pasa con los diffs de fuentes?). Merece su propia spec, no colarse en esta.

## Riesgos identificados

- **Solo 25 usuarios pueden autorizar la app.** Heredado de `backend/specs/02-spotify-oauth.md`: la app de Spotify está en Development Mode y cada tester debe estar dado de alta a mano en el dashboard con el email exacto de su cuenta. Quien pruebe este spec sin estar en la lista verá un error opaco en la pantalla de consentimiento que parece un bug del frontend. El `reason: 'user_not_allowlisted'` está contemplado justamente para poder decirlo con claridad en pantalla.

- **Las 14 baselines visuales no viven en el repo.** `e2e/__screenshots__` está en `.gitignore`, así que existen solo en la máquina de quien las generó. En un clon nuevo o en CI, la primera corrida las crea en vez de comparar, y el criterio "pasan sin regenerarse" no verifica nada. Al implementar este spec en un worktree hay que copiarlas a mano desde el checkout principal para que la comprobación tenga sentido.

- **`store.ts` acumula reducers sin que ningún test lo verifique.** Este spec añade el tercero (`spotify`) junto a `user` y `songs`. Si un merge futuro perdiera una de esas líneas, ningún test lo detectaría: cada slice se prueba por separado y nadie comprueba que el `rootReducer` los tenga todos.

- **La ventana roja del paso 5 al 9.** Entre que el banner deja de mentir y que se reescriben los tests, `npm run test:e2e` está en rojo a propósito. Si el trabajo se interrumpe ahí, el siguiente que llegue puede pensar que rompió algo.

- **El JWT sigue en `localStorage`.** Heredado del spec 03 y sin resolver aquí. Este spec no lo empeora — los tokens de Spotify nunca llegan al navegador, que era el punto de que el backend fuese dueño del OAuth — pero un XSS sigue permitiendo manejar el Spotify del usuario a través de la API de Totify mientras el token viva.

- **`127.0.0.1` y `localhost` son orígenes distintos.** El callback aterriza en `127.0.0.1:3000` antes de rebotar al frontend en `localhost:5173`. Como el rebote es un 302 plano, sin cookies ni XHR, es inocuo. Pero si alguien intenta más adelante autenticar el callback por cookie, se encontrará con que la cookie de sesión no viaja.

- **El usuario puede conectar una cuenta de Spotify distinta a la que espera.** Si tiene otra sesión abierta en el navegador, Spotify usa esa sin preguntar, porque el backend manda `show_dialog=false`. El banner muestra el `displayName` precisamente para que se note. Cambiar de cuenta hoy exige desconectar y volver a conectar.

- **`GET /spotify/status` en cada montaje de Landing.** Es una llamada barata (el backend no consulta a Spotify, solo lee su fila), pero es una petición por navegación a la página principal. Si Landing acabara remontándose con frecuencia, convendría revisarlo.

## Lo que **no** entra en esta spec

- Selector de playlist destino, crear playlist y leer sus tracks.
- Matching de canciones contra Spotify y UI de revisión.
- Alta masiva de canciones en la playlist.
- Que estar conectado a Spotify condicione ninguna otra parte de la app.
- Sync del estado de conexión entre pestañas.
- Popup de OAuth.
- Sacar `e2e/__screenshots__` del `.gitignore`.
- Tocar `PlaylistPanel`, `UploadPanel`, `SearchPanel` o `songsSlice`, que son del spec 04.

Cada uno, cuando llegue, va en su propia spec.

## Verificación

### Automática

```bash
npm run build       # tsc -b + vite build
npm run lint
npm run test:e2e    # incluye los reescritos y e2e/spotify.spec.ts
```

Las 14 baselines visuales deben copiarse al worktree desde el checkout principal antes de correr la suite (ver Riesgos).

### Manual — recorrido real en el navegador

Requiere el backend levantado (`cd backend && npm start`) y una cuenta de Spotify dada de alta en la lista blanca del dashboard.

1. `npm run dev` y login con una cuenta real de Totify.
2. Banner en "Spotify not connected". En el Network tab: una sola llamada a `GET /spotify/status`.
3. Pulsar "Connect Spotify" → sale la pantalla de consentimiento de Spotify.
4. Aprobar → vuelta a `/`, banner en "Spotify connected" con el `displayName`, y la URL **sin** `?spotify=connected`.
5. Recargar → el banner sigue conectado y se ve una nueva llamada a `GET /spotify/status`.
6. **El caso que justifica el spec:** con la app conectada, revocar Totify en spotify.com/account/apps, forzar una llamada que refresque el token, recargar → el banner pasa a la variante de reconexión. En el Network tab, el `409` **no** va seguido de un `POST /renew-tokens`.
7. Desconectar → aparece el diálogo de confirmación, con el aviso sobre spotify.com/account/apps. Confirmar → banner en desconectado.
8. Navegar a mano a `/spotify/callback?spotify=error&reason=access_denied` → mensaje de cancelación, no error genérico.

Los pasos 2 a 8 son los que conviene recorrer con automatización de navegador, capturando el Network tab en los pasos 2, 6 y 7 — que es donde las aserciones importan y donde un test de Playwright con `page.route` no prueba nada, porque las respuestas están stubbeadas.
