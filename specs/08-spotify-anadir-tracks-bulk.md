# 08 — Añadir canciones a la playlist de Spotify

**Estado:** Draft — semilla
**Depende de:** `specs/06-spotify-playlist-destino.md` (Draft), `specs/07-spotify-matching-de-tracks.md` (sin escribir) y `backend/specs/05` (sin escribir)
**Fecha:** 2026-08-24

**Objetivo:** Escribir en la playlist destino de Spotify las canciones que el usuario seleccionó, y hacer que el panel derecho refleje únicamente lo que Spotify confirmó.

## Qué es este archivo

Una **semilla**, no una spec terminada. Existe porque hay un requisito acordado con el usuario que se decidió en la sesión del `specs/06` y que no se puede cumplir hasta esta fase. Guardarlo aquí evita que viva solo en la sección de Decisiones de otro spec, donde nadie lo va a buscar.

El resto de secciones (modelo de datos, plan, criterios, riesgos) se desarrollan con `/spec 08-spotify-anadir-tracks-bulk` cuando el `specs/07` esté cerrado. **No implementar desde este archivo.**

## Requisito heredado — el panel derecho solo muestra lo confirmado

Acordado con el usuario el 2026-08-24, durante la definición del `specs/06`.

Hoy, `PlaylistPanel` muestra las canciones en cuanto el stub `POST /songs/playlist` responde 202. Ese movimiento optimista lo introdujo el `specs/04` de forma consciente y documentada, porque en aquel momento no existía ninguna playlist real que consultar. La consecuencia asumida entonces: **durante un rato la interfaz afirma algo que no es cierto en Spotify.**

Este spec elimina esa mentira. Reglas acordadas:

1. Una canción aparece en `PlaylistPanel` **solo** cuando Spotify ha confirmado que está en la playlist destino. Nada de movimiento optimista.
2. El panel muestra **solo las canciones que el usuario mandó**, no el contenido de la playlist. Una playlist puede tener miles de canciones y descargarla entera para pintar el panel es innecesario. Esta es la razón por la que el `backend/specs/03` decidió **no** exponer un endpoint que lea los tracks de una playlist.
3. Las canciones en vuelo y las fallidas son visibles con su propio estado. El `DestinationStatus` de `src/types/song.ts` ya modela `queued`, `adding` y `added`; falta añadir `failed` y su variante en `StatusPill`.
4. Un fallo parcial (Spotify acepta 40 de 50) se muestra como tal: 40 en `added`, 10 en `failed` con su motivo. No es un error todo-o-nada.

## Otros requisitos ya conocidos

Vienen del plan de integración (`docs/spotify-integration-plan.md`, fase 5) y de decisiones tomadas en specs anteriores. Se listan para que la sesión de `/spec` no los redescubra desde cero.

- **La deduplicación es nuestra.** Spotify añade el mismo track dos veces sin quejarse.
- **Máximo 100 URIs por petición a Spotify.** Hay que trocear y secuenciar.
- **Nunca reintentar a ciegas un 429 sobre una escritura** sin haber deduplicado antes: se duplicarían canciones.
- **`defaultPlaylistId` puede estar huérfano.** Si Spotify devuelve 404 al escribir, hay que traducirlo a "la playlist destino ya no existe, elige otra" y limpiar la columna, en vez de mostrar un error genérico. Acordado en `backend/specs/03`, sección Riesgos.
- **Nunca autoañadir un match no confirmado.** Meter en silencio una versión karaoke o un "sped up" en la playlist de alguien es el riesgo reputacional del proyecto. El umbral y la confirmación los define el `specs/07`.

## Pendiente de especificar

- Contrato del endpoint de escritura y su reporte de fallo parcial.
- Cómo se representa el progreso `queued → adding → added/failed` en la UI.
- Qué pasa si el usuario cierra la pestaña a mitad de una alta masiva.
- Si el panel derecho sobrevive a un refresh, y a costa de qué.
- Qué baselines visuales se regeneran.
