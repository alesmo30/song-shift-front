# 04 — Pestaña "Selected" y subida real de screenshots

**Estado:** Implementado
**Depende de:** `specs/03-redux-persist-estado-usuario.md` (Approved) y `backend/specs/01-extraccion-canciones-screenshot.md` (Draft)
**Fecha:** 2026-08-24

**Objetivo:** Sustituir el mock de "Upload Photo" por la llamada real a `POST /songs/extract` y añadir una tercera pestaña "Selected" donde el usuario hace la selección final antes de mandarla a la playlist.

## Context

`src/pages/Landing/UploadPanel.tsx` finge la detección: llama a `onValidateWithAI`, ignora el resultado y tras `setTimeout(1200)` pinta `MOCK_DETECTED_SONGS`. `PlaylistPanel` también es mock y muestra siempre "1 of 3 songs added". Las canciones añadidas viven en un `useState<Set<string>>` local de cada panel, así que cambiar de pestaña las pierde.

Con el backend de la spec 01 en pie, esta spec conecta el flujo real y arregla el problema de estado: las canciones seleccionadas pasan a un slice de Redux compartido, y la interfaz gana una etapa explícita de revisión ("Selected") entre "la IA detectó esto" y "esto va a la playlist".

`PlaylistPanel` deja de ser mock y pasa a mostrar lo que ya se mandó. Como Spotify todavía no existe, el traspaso de Selected a PlaylistPanel es optimista y local: al recibir el 202 del stub, las canciones se mueven. Un refresh lo borra, y es lo esperado.

## Scope

**Incluido:**

- `src/api/songs.service.ts`: `extractSongs(files: File[])` y `sendToPlaylist(songs: Song[])` sobre el `apiClient` existente.
- `src/store/features/songsSlice.ts`: estado `detected`, `selected`, `playlist`, con `setDetected`, `toggleSelected`, `removeSelected`, `commitSelected`, `clearDetected`. Registrado en `src/store/store.ts` y **fuera** de la `whitelist` de redux-persist.
- `UploadPanel`: input `multiple`, hasta 5 ficheros, miniaturas de cada uno, borrado individual, llamada real, estados de carga y error. Se eliminan el `setTimeout` y el import de `MOCK_DETECTED_SONGS`.
- Tercera pestaña "Selected" en `src/pages/Landing/Landing.tsx` con contador, y `src/pages/Landing/SelectedPanel.tsx`: lista, quitar canción, vaciar, y botón "Add to playlist".
- `PlaylistPanel` deja de leer `mockData` y lee `state.songs.playlist`; estado vacío cuando no hay nada.
- El "Add" de `SearchPanel` y el de `UploadPanel` despachan ambos `toggleSelected`. Los resultados de búsqueda siguen mock, marcados `// MOCK — quitar`.
- `src/types/song.ts`: `duration` pasa a `string | null`.
- Tests de Playwright del flujo: subir, detectar, seleccionar, pestaña Selected, mandar, y aparece en PlaylistPanel.

**NO incluido:**

- **Búsqueda real en Apple Music.** `SearchPanel` sigue con `MOCK_SEARCH_RESULTS`; solo se le cambia a dónde manda el "Add".
- **Spotify:** el botón "Connect Spotify" sigue siendo el toggle local de la spec 01 y no condiciona el envío.
- Persistir `songs` entre refrescos. Decisión explícita: el slice es efímero.
- Edición manual del título o del artista de una canción detectada.
- Reordenar la lista de Selected.
- Reintentar un screenshot suelto que haya fallado.
- Barra de progreso por fichero. Se muestra un único estado de carga para el lote.
- Rediseño visual. Se reutilizan las clases de `Landing.module.css` que ya existen.

## Modelo de datos

```ts
// src/types/song.ts — cambio
export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string | null; // antes: string
}

// src/store/features/songsSlice.ts — nuevo
interface SongsState {
  detected: DetectedSong[];   // última respuesta de /songs/extract
  selected: Song[];           // staging: lo que el usuario marcó, desde Search o Upload
  playlist: Song[];           // ya enviado (movimiento optimista tras el 202)
  status: 'idle' | 'extracting' | 'sending';
  error: string | null;
}
```

Convenciones:

- `id` lo genera el backend y es determinista; se usa tal cual como key de React y para saber si una canción ya está seleccionada.
- Una canción nunca está a la vez en `selected` y en `playlist`: `commitSelected` la mueve.
- El slice **no** entra en la `whitelist` de redux-persist de la spec 03.

## Plan de implementación

1. Cambiar `duration` a `string | null` en `src/types/song.ts` y ajustar `mockData.ts` y los sitios donde se pinta. Prueba: `npm run build` en verde.
2. Crear `src/store/features/songsSlice.ts` con estado inicial y reducers síncronos. Registrarlo en `src/store/store.ts` sin tocar la `whitelist`. Prueba: la app arranca y el slice se ve en Redux DevTools.
3. Crear `src/api/songs.service.ts` con las dos funciones. Prueba: llamarlas desde la consola del navegador contra el backend levantado.
4. Reescribir `UploadPanel` para múltiples ficheros y llamada real. Prueba manual: subir dos screenshots y ver las canciones reales.
5. Cablear el "Add" de `UploadPanel` y el de `SearchPanel` a `toggleSelected`. Prueba: añadir desde ambas pestañas y verlo en DevTools.
6. Crear `SelectedPanel.tsx` y añadir la tercera pestaña en `Landing.tsx` con su contador.
7. Cablear "Add to playlist" a `sendToPlaylist` más `commitSelected`, y hacer que `PlaylistPanel` lea del slice.
8. Añadir el test de Playwright del flujo completo con la respuesta de `/songs/extract` interceptada, y regenerar solo las baselines que cambien por la tercera pestaña.

## Criterios de aceptación

- [x] La pestaña "Upload Photo" acepta varios ficheros de una vez y muestra una miniatura por cada uno.
- [x] Seleccionar 6 ficheros muestra un error en el cliente y no llega a llamar al backend.
- [x] "Validate with AI" llama a `POST /songs/extract` con `multipart/form-data` (verificable en la pestaña Network) y no a un `setTimeout`.
- [x] `MOCK_DETECTED_SONGS` ya no se importa en ningún sitio.
- [x] Mientras la petición está en vuelo el botón queda deshabilitado y muestra "Validating…".
- [x] Un 502 del backend muestra un mensaje de error en el panel y deja las imágenes cargadas para reintentar.
- [x] Añadir una canción desde "Search" y otra desde "Upload Photo" hace que el contador de la pestaña "Selected" marque 2.
- [x] Cambiar de pestaña y volver conserva la lista de Selected.
- [x] Quitar una canción en "Selected" decrementa el contador y no la devuelve a `detected` como no seleccionada.
- [x] Añadir dos veces la misma canción detectada no la duplica en Selected.
- [x] "Add to playlist" con la lista vacía está deshabilitado.
- [x] Tras un 202, las canciones desaparecen de "Selected" y aparecen en `PlaylistPanel`, y el contador vuelve a 0.
- [x] `PlaylistPanel` no importa `mockData` y muestra un estado vacío cuando no se ha enviado nada.
- [x] Un refresh vacía `detected`, `selected` y `playlist`, y el estado de `user` sigue persistido (la spec 03 no se rompe).
- [x] `npm run build` (`tsc -b`) sin errores ni `any`.
- [x] La suite de Playwright pasa; las únicas baselines regeneradas son las que contienen la barra de pestañas.

## Decisiones tomadas y descartadas

- **Un slice `songs` en Redux, no estado local por panel.** El `useState<Set<string>>` de `UploadPanel` y `SearchPanel` se pierde al cambiar de pestaña, que es justamente lo que la pestaña "Selected" necesita que sobreviva. Descartado subir el estado a `Landing` con props: funciona, pero deja a `Landing` haciendo de store con prop drilling hasta tres niveles, y el repo ya tiene Redux montado desde la spec 01.

- **El slice `songs` NO se persiste.** La whitelist de la spec 03 es `['user']` y se mantiene. Un lote de canciones detectadas es efímero por naturaleza; persistirlo obliga a decidir cuándo caduca y a migrar su forma en cada cambio. El coste de un refresh es volver a subir el screenshot.

- **"Selected" es una etapa explícita, no un atajo a la playlist.** El usuario pidió una revisión final antes de mover nada. Descartado que "Add" mande directo a la playlist: la lectura de la IA no es fiable al 100% y sin etapa de revisión el error solo se ve cuando ya está escrito.

- **Movimiento optimista a `PlaylistPanel` tras el 202.** Con Spotify fuera de alcance no hay una playlist real que consultar, así que la alternativa era dejar la mitad derecha de la pantalla muerta hasta la siguiente spec. El movimiento optimista deja el flujo completo demostrable hoy y desaparece con el refresh, lo cual es coherente con no persistir. Contra: durante un rato la interfaz afirma algo que no es cierto en Spotify. Se acota con el `status: 'not-implemented'` que devuelve el stub y con el estado del banner de Spotify.

- **`Search` sigue mock pero ya alimenta a `Selected`.** Cablear las dos fuentes ahora hace que `Selected` nazca agnóstico del origen: cuando llegue la spec de búsqueda real, solo cambia de dónde salen los datos, no a dónde van. Descartado dejar el "Add" de Search como `console.log`: obligaría a recablear después.

- **`multiple` en el mismo input, no varios inputs.** Es lo que el usuario pidió (añadir varios screenshots) y lo que el endpoint acepta en una sola petición.

- **Se mantiene el `FileReader`, pero solo para las miniaturas.** Lo que se manda son los `File` dentro de un `FormData`; el data URL ya no viaja a ningún sitio. Descartado quitarlo del todo: sin él no hay previsualización.

- **Hay que sobrescribir el `Content-Type` del `apiClient`.** `src/api/client.ts` fija `'Content-Type': 'application/json'` por defecto; si no se anula, axios no pone el `boundary` del multipart y `multer` recibe un cuerpo vacío. Es la trampa más probable de esta spec y por eso está escrita aquí. Descartado crear un cliente axios aparte: se perderían los interceptores de token y de refresh 401.

- **Un solo estado de carga para todo el lote.** El progreso por fichero exige o N peticiones o streaming de progreso desde el servidor; ninguna de las dos está en el backend de la spec 01.

- **Sin edición manual de título ni artista.** Es la respuesta obvia a un OCR imperfecto, pero abre validación, normalización y el caso de que el usuario invente una canción que no existe. Merece su propia spec, probablemente junto a la búsqueda real.

## Riesgos identificados

- **El `Content-Type` por defecto rompe la subida en silencio.** El backend responde 400 "Validation Error" (sin ficheros) y parece un bug del servidor. Cubierto con un criterio de aceptación que exige verificar el `multipart/form-data` en la pestaña Network.

- **Las baselines de Playwright se mueven.** Añadir una tercera pestaña cambia el ancho de las anteriores, así que las capturas que incluyan la barra diffean. Se regeneran solo esas; un diff en cualquier otra es señal a investigar, no snapshot a actualizar.

- **La interfaz afirma "added" cuando no hay nada en Spotify.** Consecuencia asumida del movimiento optimista. Riesgo de que un usuario dé por hecho que la canción está en su playlist. Se acota mientras el banner diga "Spotify not connected"; la spec de Spotify debe eliminarlo del todo.

- **Un lote de screenshots grande tarda.** Cinco llamadas a Groq pueden ser decenas de segundos sin ningún progreso intermedio en pantalla, y el usuario puede pensar que se colgó. Mitigación mínima: botón deshabilitado con "Validating…". Si se vuelve molesto, la solución es una petición por fichero, y eso cambia el backend.

- **`detected` y `selected` pueden desincronizarse.** Si el usuario selecciona canciones y luego vuelve a validar otro lote, `setDetected` reemplaza `detected` pero `selected` se mantiene — que es lo correcto (acumular entre lotes), pero significa que en `Selected` habrá canciones que ya no están en pantalla en la pestaña de subida. Es intencionado y no hay que "arreglarlo" luego por error.

- **Nada avisa de que un refresh borra el trabajo.** Con `songs` sin persistir, un F5 con veinte canciones seleccionadas las pierde sin previo aviso. Aceptado en esta versión; un `beforeunload` es candidato a spec futura.

## Lo que **no** entra en esta spec

- Búsqueda real en Apple Music.
- OAuth de Spotify y escritura real en playlist.
- Persistir el slice `songs`.
- Edición manual de canciones detectadas y reordenación de Selected.
- Progreso por fichero y reintento individual.

Cada una, si llega, en su propia spec.
