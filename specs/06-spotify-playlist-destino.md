# 06 — Playlist destino de Spotify

**Estado:** Approved
**Depende de:** `specs/05-spotify-conexion-frontend.md` (Implementado, PR #7) y `backend/specs/03-spotify-playlists.md` (Approved — debe estar implementado y mergeado antes de implementar este)
**Fecha:** 2026-08-24

**Objetivo:** Dar a `PlaylistPanel` un selector de playlist destino real, alimentado por las playlists de Spotify del usuario, con opción de crear una nueva y con la elección recordada en el servidor.

## Context

El spec 05 dejó el banner de Spotify diciendo la verdad: conectar, desconectar y reconectar dependen del servidor y no de un booleano en el cliente. Lo que el usuario todavía no puede decir es **a dónde** quiere que vayan sus canciones.

`src/pages/Landing/PlaylistPanel.tsx` dice "Spotify Playlist" sin saber cuál, y su botón `data-testid="refresh-playlist"` gira un spinner 1200 ms sin consultar nada (`PlaylistPanel.tsx:17-25`). El "Add to playlist" del spec 04 manda al stub `POST /songs/playlist` sin destino, porque no hay ninguno que elegir.

Este spec es la fase 3 del plan de integración (`docs/spotify-integration-plan.md`), recortada según lo que se decidió al especificarla: se elige y se crea playlist, pero no se listan sus canciones ni se escribe nada en Spotify todavía.

## Scope

**Incluido:**

- `src/api/spotify.service.ts` gana `getSpotifyPlaylists(limit, offset)`, `createSpotifyPlaylist(name)` y `setDefaultPlaylist(playlistId)`. `src/api/client.ts` sigue sin tocarse.
- `src/types/spotify.ts`: tipo `SpotifyPlaylist` y campo `defaultPlaylistId` en `SpotifyConnection`.
- `spotifySlice` gana `playlists: { items, status, error }` y `selectedPlaylistId`, con reducers síncronos. Sigue fuera de la `whitelist` de redux-persist.
- `PlaylistPanel`: selector de playlist con buscador, cabecera que muestra el nombre y el número de canciones de la elegida, y estado propio cuando Spotify no está conectado.
- Diálogo "Create new playlist" con un solo campo, el nombre. Al crearla queda elegida como destino.
- `data-testid="refresh-playlist"` deja el `setTimeout` y recarga la lista de playlists.
- El destino se guarda en el servidor al elegirlo, y se recupera de `defaultPlaylistId` al montar Landing.
- El botón "Add to playlist" de `SelectedPanel` queda deshabilitado mientras no haya playlist destino elegida. Sigue llamando al stub `POST /songs/playlist`.
- `e2e/playlists.spec.ts` nuevo, y regeneración de las 8 baselines de Landing.

**NO incluido (specs futuras):**

- **Listar las canciones que ya hay en la playlist destino.** Decisión explícita: una playlist puede tener miles y el panel derecho solo muestra lo que tú mandas.
- **Que el panel derecho refleje lo que hay de verdad en Spotify.** Hoy sigue siendo el movimiento optimista del spec 04. Llega en `specs/08`.
- Buscar en Spotify y decidir qué track corresponde a cada canción → `specs/07`.
- Escribir canciones en la playlist → `specs/08`.
- Paginación o scroll infinito en el selector: se piden las primeras 50 y el buscador filtra sobre esas.
- Renombrar, borrar, editar descripción o cambiar la visibilidad de una playlist.
- Subir imagen de portada.
- Sync del destino entre pestañas. Heredado del spec 05: la pestaña B no se entera hasta recargar.
- Tocar `SearchPanel` ni `UploadPanel`.

## Modelo de datos

### `src/types/spotify.ts` — añadidos

Espejo exacto del `SpotifyPlaylistDTO` del `backend/specs/03`. No se inventan campos.

```ts
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  public: boolean;
  imageUrl: string | null;
  url: string;
}
```

Y `SpotifyConnection` gana un campo, porque `GET /spotify/status` lo devuelve:

```ts
export interface SpotifyConnection {
  // ... campos del spec 05, sin tocar
  defaultPlaylistId: string | null;
}
```

### `src/store/features/spotifySlice.ts` — estado añadido

```ts
interface SpotifyState {
  connection: { /* spec 05, sin cambios */ };

  playlists: {
    items: SpotifyPlaylist[];
    status: 'idle' | 'loading' | 'ready' | 'error';
    error: string | null;
  };
  selectedPlaylistId: string | null;
  creating: 'idle' | 'saving' | 'error';
}
```

Reducers nuevos, todos síncronos siguiendo la convención que el spec 04 fijó y el spec 05 confirmó: `setPlaylistsLoading`, `setPlaylists`, `setPlaylistsError`, `addPlaylist`, `setSelectedPlaylistId`, `setCreating`. La lógica async vive en los componentes y en `src/store/spotifyPlaylists.ts`, igual que `spotifyStatus.ts`.

`resetSpotify` (spec 05, despachado en logout) limpia también estos tres campos.

Convenciones:

- **`selectedPlaylistId` es un espejo local de `defaultPlaylistId`; el servidor manda.** Al montar Landing se toma del status. Al elegir en el selector se escribe primero en el slice (respuesta inmediata) y se manda el `PUT` después; si el `PUT` falla, se revierte al valor del servidor.
- **Un `defaultPlaylistId` que no esté en `items` deja el selector vacío y no se borra en el servidor.** El usuario elige otra y el `PUT` lo sobrescribe.
- El slice sigue **fuera** de la `whitelist` de redux-persist. `defaultPlaylistId` ya persiste, pero en el servidor.

## Plan de implementación

1. **Tipos.** Añadir `SpotifyPlaylist` a `src/types/spotify.ts` y `defaultPlaylistId` a `SpotifyConnection`. Prueba: `npm run build` en verde.

2. **`spotify.service.ts`.** Las tres funciones nuevas sobre el `apiClient` existente. Prueba: llamarlas desde la consola del navegador contra el backend levantado y ver tus playlists reales.

3. **`spotifySlice`.** Estado y reducers síncronos nuevos, y que `resetSpotify` limpie los tres campos. Prueba: el slice se ve completo en Redux DevTools y el logout lo vacía.

4. **`src/store/spotifyPlaylists.ts`.** Funciones async de módulo, hermanas de `spotifyStatus.ts`: `loadPlaylists`, `createPlaylist`, `chooseDefaultPlaylist`. El 409 `SPOTIFY_REAUTH_REQUIRED` se enruta a `setSpotifyNeedsReconnect`, reutilizando `isSpotifyReauthRequired` del spec 05.

5. **Selector en `PlaylistPanel`.** `Autocomplete` de MUI —no `Select`, que no trae buscador— con la cabecera mostrando el nombre y el `trackCount` de la elegida. Carga la lista al montar si Spotify está conectado. Prueba manual: elegir una y ver la cabecera cambiar.

6. **Estado no conectado.** Con Spotify desconectado el panel muestra "Connect Spotify to choose a destination playlist" en vez del selector. Prueba: desconectar desde el banner y ver el panel cambiar sin recargar.

7. **Diálogo de creación.** Un campo, el nombre. Al crear, la playlist se añade a `items` y queda elegida. Prueba manual: crearla y verla privada en el cliente de Spotify.

8. **`refresh-playlist` real.** Sustituir el `setTimeout(1200)` por `loadPlaylists`, conservando el giro del icono mientras la petición está en vuelo. Prueba: crear una playlist desde el móvil, pulsar refresh, verla aparecer.

9. **Persistencia del destino.** Al montar Landing, `selectedPlaylistId` se toma del `defaultPlaylistId` del status. Al elegir en el selector se manda el `PUT`, con reversión si falla. Prueba: elegir, recargar, sigue elegida.

10. **`SelectedPanel`.** El botón "Add to playlist" se deshabilita si no hay destino, con un `title` que diga por qué. Sigue llamando al stub.

11. **Tests.** `e2e/playlists.spec.ts` nuevo, helper `mockSpotifyPlaylistsApi` en `e2e/helpers.ts`, y ajuste de los tests del spec 04 que pulsan "Add to playlist" (ahora necesitan un destino sembrado).

12. **Regenerar las 8 baselines de Landing**, revisando cada diff una a una, en un commit aislado.

## Criterios de aceptación

- [ ] Con Spotify desconectado, `PlaylistPanel` muestra "Connect Spotify to choose a destination playlist" y ningún selector, y **no** llama a `GET /spotify/playlists`.
- [ ] Al conectar Spotify sin recargar, el panel pasa a mostrar el selector.
- [ ] El selector lista las playlists que devuelve el backend, con su nombre y su número de canciones.
- [ ] Escribir en el buscador del selector filtra sobre las playlists ya cargadas y no dispara ninguna petición.
- [ ] Elegir una playlist manda un `PUT /spotify/default-playlist` con su id (verificable en la pestaña Network).
- [ ] Recargar la página conserva la playlist elegida, tomándola del `defaultPlaylistId` de `GET /spotify/status`.
- [ ] Si el `PUT` falla, el selector vuelve al valor anterior y aparece un mensaje de error.
- [ ] Si el `defaultPlaylistId` del servidor no está entre las playlists cargadas, el selector aparece vacío, se puede elegir cualquiera de las listadas, y no se manda ningún `PUT` hasta que el usuario elija.
- [ ] "Create new playlist…" abre un diálogo con un solo campo.
- [ ] Crear con el nombre vacío deja el botón de confirmar deshabilitado.
- [ ] Al crear, la playlist aparece en el selector, queda elegida, y en el cliente real de Spotify es privada.
- [ ] `refresh-playlist` dispara `GET /spotify/playlists` y ya no usa `setTimeout`. Una playlist creada fuera de Totify aparece tras pulsarlo.
- [ ] El botón "Add to playlist" de `SelectedPanel` está deshabilitado sin destino elegido, y habilitado en cuanto hay uno.
- [ ] `GET /spotify/playlists` se dispara exactamente una vez por carga de página, pese a `StrictMode`.
- [ ] Un `409 SPOTIFY_REAUTH_REQUIRED` en cualquiera de las tres llamadas nuevas pone el banner en "needs reconnection" y **no** dispara `POST /renew-tokens`.
- [ ] El logout limpia `playlists`, `selectedPlaylistId` y `creating`.
- [ ] `src/api/client.ts` sigue sin modificarse (`git diff --stat` lo confirma).
- [ ] `npm run build` (`tsc -b`) sin errores ni `any`.
- [ ] `npm run lint` limpio.
- [ ] La suite de Playwright pasa. Las únicas baselines regeneradas son estas ocho, y cada diff se revisó a mano: `landing.png`, `landing-busqueda-vacia.png`, `landing-busqueda-resultados.png`, `landing-cancion-anadida.png`, `landing-paginacion-p2.png`, `landing-spotify-conectado.png`, `landing-tab-upload.png`, `landing-upload-detectadas.png`.

## Decisiones tomadas y descartadas

- **Requisito aplazado, ya recogido en `specs/08`: el panel derecho debe mostrar solo canciones confirmadas en Spotify.** Es lo que el usuario pidió al especificar este trabajo. No se puede cumplir aquí porque nada escribe todavía en Spotify; hasta el `specs/08` el panel sigue con el movimiento optimista que el spec 04 documentó y aceptó. El requisito vive en `specs/08-spotify-anadir-tracks-bulk.md`, no solo en esta sección, para que no dependa de que alguien lea las Decisiones de otro spec.

- **`Autocomplete` de MUI, no `Select`.** El `Select` de MUI no trae buscador; el componente con filtrado incorporado es `Autocomplete`. Elegir `Select` obligaría a hand-rollear un `TextField` dentro del desplegable, que es exactamente lo que `CLAUDE.md` prohíbe.

- **Un buscador sobre las primeras 50, no scroll infinito.** Cubre el caso normal con una sola llamada. Descartado el scroll infinito: obliga a gestionar `offset`, estados de carga por página y el caso de que el `total` de Spotify no descuente el filtro por `owner` — complejidad real a cambio de un caso raro. Si alguien con más de 50 playlists propias se queja, la solución es paginar, y eso va en su propia spec.

- **`selectedPlaylistId` se escribe optimista y se revierte si el `PUT` falla.** Un selector que tarda medio segundo en reflejar el clic se siente roto. Descartado esperar la respuesta antes de pintar.

- **Un `defaultPlaylistId` que no está en la lista cargada deja el selector vacío.** El usuario elige entre las que sí se muestran. Sin aviso ni tratamiento especial: el caso es raro (la playlist se borró en Spotify, o quedó fuera de las primeras 50) y un mensaje de error para algo que se arregla eligiendo otra playlist es ruido. Descartado mandar un `PUT` con `null` para limpiar la columna: no hace falta, porque en cuanto el usuario elija se sobrescribe sola.

- **Reducers síncronos más un módulo async.** Es la convención real del repo, fijada por `songsSlice` en el spec 04 y confirmada por `spotifySlice` en el 05. Descartado `createAsyncThunk`, que es lo que el plan original asumía.

- **Este spec toca `SelectedPanel`, que es territorio del spec 04.** El spec 05 mantuvo esa frontera intacta; este la cruza a propósito, con un cambio de una línea. La razón: elegir un destino que la app luego ignora al mandar canciones deja el selector como decoración. Se acota a deshabilitar el botón; ninguna otra parte de `SelectedPanel`, `UploadPanel` ni `SearchPanel` se toca.

- **`refresh-playlist` recarga la lista de playlists.** Descartado esconder el botón hasta el spec 08: el caso "creé una playlist en el móvil y no aparece" es real y es justo lo que un botón de refresco debe resolver. Descartado también que lea los tracks de la playlist elegida — ese endpoint no existe, por decisión del `backend/specs/03`.

- **El diálogo de creación pide solo el nombre.** Es lo que el usuario pidió ("lo más sencillo posible"). La visibilidad no se ofrece: el backend fuerza `public: false` porque el default de la API de Spotify es público. La descripción se edita desde Spotify si hace falta.

- **Crear una playlist la deja elegida.** Nadie crea una playlist destino para luego no usarla. Descartado dejar el selector como estaba tras crear: obliga a un segundo clic que no aporta nada.

- **El destino se guarda en el servidor, no en `localStorage`.** Sobrevive al cambio de dispositivo, y evita un segundo origen de verdad que pueda contradecir al servidor — el problema exacto que el spec 05 resolvió con `isSpotifyConnected`.

- **Estar conectado a Spotify sigue sin condicionar el resto de la app.** Se puede subir screenshots, detectar canciones y usar "Selected" sin conexión. Lo único que ahora exige un destino es el botón de mandar. Descartado bloquear Landing entera: heredado del spec 05, donde el banner es informativo.

- **Las ocho baselines se regeneran, nombradas una a una en los criterios.** `PlaylistPanel` sale en las ocho capturas de Landing. Descartado "regenerar lo que diffee": el spec 05 documentó que una baseline puede pasar por margen de tolerancia sin ser correcta, así que un diff inesperado tiene que poder leerse como alarma y no como trámite.

## Riesgos identificados

- **La dependencia del backend es dura y todavía no está implementada.** `backend/specs/03` está Approved pero sin código. Arrancar `/spec-impl 06` antes de que esos tres endpoints existan y estén mergeados deja toda la verificación en manos de `page.route`, que es exactamente lo que el spec 05 demostró que no basta: allí el bug del `StrictMode` solo apareció mirando el Network tab de un navegador real contra un backend real.

- **`StrictMode` puede duplicar la carga de playlists.** El spec 05 encontró y arregló ese bug para `GET /spotify/status` con un `useRef` en `Landing.tsx`. `PlaylistPanel` va a montar su propio efecto de carga, así que el mismo bug puede reaparecer en `GET /spotify/playlists`. Aplicar el mismo guard y cubrirlo con un test que cuente peticiones, como `e2e/spotify.spec.ts` ya hace.

- **Los tests del spec 04 que pulsan "Add to playlist" se rompen.** Tras deshabilitar el botón sin destino, cualquier test que lo pulse falla. No es una regresión: es el cambio funcionando. Hay que sembrarles un destino, y está escrito como paso propio del plan para que no aparezca por sorpresa mientras se regeneran baselines.

- **Las ocho baselines se mueven a la vez.** `PlaylistPanel` sale en todas. El spec 05 documentó que `maxDiffPixelRatio: 0.02` sobre un lienzo de 1440×900 mayormente oscuro deja pasar diferencias de texto reales, así que "la suite está verde" no prueba que las capturas sean correctas. Revisar cada diff a mano y hacerlo en un commit aislado.

- **El panel derecho sigue afirmando "added" sin que nada esté en Spotify.** Heredado del spec 04 y sin arreglo hasta el `specs/08`. Este spec lo empeora ligeramente: ahora hay una playlist destino con nombre real en la cabecera, así que la afirmación es más creíble y por tanto más engañosa. Es el precio de entregar por fases, y el motivo de que el requisito esté ya escrito en el 08.

- **Un selector vacío no explica por qué.** Coste asumido de la decisión de simplificar: si la playlist guardada quedó fuera de las primeras 50, el usuario ve el selector vacío sin motivo aparente. Se arregla eligiendo otra.

- **El destino no se sincroniza entre pestañas.** Elegir una playlist en la pestaña A no cambia nada en la pestaña B hasta recargar. Heredado del spec 03 y del 05; no se ataca aquí.

## Lo que **no** entra en esta spec

- Listar las canciones que ya hay en la playlist destino.
- Que el panel derecho refleje lo que hay de verdad en Spotify.
- Buscar canciones en Spotify y decidir qué track corresponde a cada una.
- Escribir canciones en la playlist.
- Paginación o scroll infinito en el selector.
- Renombrar, borrar o editar playlists, y subir portada.
- Sync del destino entre pestañas.
- Tocar `SearchPanel` ni `UploadPanel`.

Cada uno, cuando llegue, en su propia spec.
