# 03 — Persistencia del estado de Redux (redux-persist)

**Estado:** Approved
**Depende de:** `specs/02-migracion-material-ui.md` (Implementado)
**Fecha:** 2026-08-01

**Objetivo:** Persistir el slice `user` de Redux en `localStorage` con redux-persist, de modo que un refresh o una tab nueva rehidraten el estado en lugar de volver al estado inicial.

## Context

El store (`src/store/store.ts`) vive solo en memoria: cualquier refresh borra `user` (`name`, `email`, `isSpotifyConnected`) y el usuario queda como recién llegado. Con auth real y OAuth de Spotify pendientes, esto se vuelve bloqueante en cuanto exista un token: sin persistencia, cada F5 obligaría a rehacer el login.

Este spec cubre únicamente la capa de persistencia y el campo `token` que la justifica. La lógica de auth (obtener el token, validarlo, refrescarlo, expirarlo) sigue fuera de alcance desde el spec 01.

## Scope

**Incluido:**
- Instalar `redux-persist` y montar `persistReducer` + `persistStore` en `src/store/store.ts`.
- Storage: `localStorage` (`redux-persist/lib/storage`), clave raíz `persist:totify`.
- `whitelist: ['user']`. Ningún otro slice se persiste, ni ahora ni por defecto en el futuro.
- `version: 0` + función `migrate` declarada (aunque arranque sin migraciones), para que specs posteriores puedan subir la versión sin refactor.
- Ignorar las acciones internas de redux-persist (`PERSIST`, `REHYDRATE`, `PURGE`, `FLUSH`, `PAUSE`, `REGISTER`) en `serializableCheck` del middleware por defecto de RTK.
- `<PersistGate loading={null}>` en `src/main.tsx`, dentro de `<Provider>` y envolviendo el resto del árbol.
- Campo `token: string` (default `''`) añadido a `userSlice` y a la interfaz `User` de `src/types/user.ts`; `setUser` lo acepta.
- `clearUser` acompañado de `persistor.purge()` para que el logout no deje rastro en `localStorage`.
- Tests funcionales de Playwright: refresh conserva el estado, tab nueva lo lee, logout lo borra.
- Tipos `RootState`/`AppDispatch` y hooks tipados (`useAppSelector`, `useAppDispatch`) si hacen falta para escribir los tests sin `any`.

**NO incluido:**
- **Sync en vivo entre tabs.** Un cambio en la tab A no se refleja en la tab B hasta que B recargue. Nada de `redux-state-sync` ni de listeners del evento `storage`.
- **Lógica de auth real:** obtener el token, validarlo, refrescarlo o descartarlo por expirado. El campo `token` se persiste tal cual, sin `expiresAt` ni comprobación de caducidad.
- Persistir estado de UI (tab activa de Landing, contenido de los paneles, resultados de búsqueda).
- Migrar el token a cookie `httpOnly`; se evaluará en el spec de auth real, cuando exista backend.
- Cifrar el contenido persistido (`redux-persist-transform-encrypt`).
- Guards de rutas basados en el estado rehidratado — Landing sigue accesible directamente, igual que en el spec 01.
- Nuevas baselines visuales de Playwright; las 14 existentes se conservan sin cambios.

## Data model

### `UserState` — estado del slice (`src/store/features/userSlice.ts`)

Hoy el `initialState` es un objeto literal sin tipar. Se declara explícito para que `token` y `RootState` no se infieran mal:

```ts
export interface UserState {
  name: string;
  email: string;
  isSpotifyConnected: boolean;
  token: string;        // NUEVO — '' cuando no hay sesión
}

const initialState: UserState = {
  name: '',
  email: '',
  isSpotifyConnected: false,
  token: '',
}
```

- `setUser: (state, action: PayloadAction<UserState>)` — payload completo y tipado. Obliga a actualizar los 3 call sites actuales (`Login.tsx:26`, `Landing.tsx:35`, `Landing.tsx:44`) para que pasen `token`.
- `clearUser: () => initialState`. `Landing.tsx:44` pasa a usarlo en vez de `setUser` con campos vacíos.

### Origen de `name`

`name` es el nombre real del usuario, tal como lo devuelva el endpoint de login (`{ name, email, token }`). **No** se deriva del email. El stub actual `name: email.split('@')[0]` (`Login.tsx:26`) queda marcado con `// MOCK — quitar`, siguiendo la convención del proyecto, y muere en el spec de auth real junto con el `token` hardcodeado. Este spec no llama a ninguna API: solo deja el campo listo para recibir ese valor y sobrevivir al refresh.

### `User` — entidad de dominio (`src/types/user.ts`)

```ts
export interface User {
  email: string;
  name: string;
  lastName: string;
  token: string;        // NUEVO
}
```

**Divergencia conocida, que este spec no resuelve:** `User` tiene `lastName` y el slice no; el slice tiene `isSpotifyConnected` y `User` no. Se dejan así a propósito — unificarlas es trabajo del spec de auth real, que sabrá qué devuelve el backend. Este spec solo añade `token` a ambas para que no nazcan desalineadas también en ese campo.

### Forma de lo persistido en `localStorage`

Una sola clave, `persist:totify`, en el formato de redux-persist (cada slice serializado por separado):

```json
{
  "user": "{\"name\":\"Alejandro\",\"email\":\"a@b.com\",\"isSpotifyConnected\":false,\"token\":\"abc\"}",
  "_persist": "{\"version\":0,\"rehydrated\":true}"
}
```

`_persist.version` es lo que compara `migrate` al arrancar: si la versión guardada es menor que la del código, corre la migración correspondiente; si no existe entrada para esa versión, redux-persist descarta el estado y usa `initialState`.

## Implementation Plan

Cada paso deja la app funcionando y tipando (`npm run build`).

1. **Dependencia.** `npm i redux-persist`. Sin cambios de comportamiento todavía; `npm run build`, `npm run lint` y los 23 tests de Playwright siguen verdes.

2. **Tipar el slice y añadir `token`.** En `src/store/features/userSlice.ts`: declarar `UserState`, tipar `initialState`, `setUser` con `PayloadAction<UserState>`, `clearUser` devolviendo `initialState`. Añadir `token: string` a `User` en `src/types/user.ts`. Actualizar los 3 call sites (`Login.tsx:26` con `token: ''` y el `// MOCK — quitar` sobre el `email.split('@')[0]`; `Landing.tsx:35` propagando el `token` actual; `Landing.tsx:44` cambiado a `clearUser()`). Todavía sin persistencia: `tsc -b` es aquí quien verifica que no quedó ningún call site sin token.

3. **Persistir el store.** Reescribir `src/store/store.ts`:
   - `rootReducer = combineReducers({ user: userReducer })`.
   - `persistConfig = { key: 'totify', version: 0, storage, whitelist: ['user'], migrate }`, con `migrate` creado por `createMigrate({}, { debug: false })`.
   - `configureStore` con el reducer persistido y `middleware: (gDM) => gDM({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } })`.
   - Exportar `persistor = persistStore(store)`, `RootState` y `AppDispatch`.

4. **`PersistGate`.** En `src/main.tsx`, dentro de `<Provider store={store}>`, envolver el árbol con `<PersistGate loading={null} persistor={persistor}>`. El orden respecto a `StyledEngineProvider`/`ThemeProvider` no cambia. Verificación manual: login, F5, el estado sigue ahí.

5. **Purge en logout.** El handler de logout de `Landing.tsx` despacha `clearUser()` y llama `persistor.purge()`. Tras un logout, `localStorage.getItem('persist:totify')` no contiene datos de usuario.

6. **Hooks tipados.** `src/store/hooks.ts` con `useAppDispatch`/`useAppSelector` tipados sobre `RootState`/`AppDispatch`. Migrar los `useSelector((state: RootState) => ...)` de `Landing.tsx` para quitar la anotación manual.

7. **Tests de Playwright.** Nuevo `e2e/persistence.spec.ts`, sin baselines visuales:
   - Login → `page.reload()` → la navbar sigue mostrando el usuario.
   - Login → nueva página del mismo `context` → el estado aparece sin repetir login.
   - Toggle de Spotify → reload → el estado del banner se conserva.
   - Logout → reload → vuelve a `/login` sin datos; `persist:totify` sin usuario.
   - Estado corrupto: escribir basura en `persist:totify` antes de cargar → la app arranca con `initialState` en vez de romperse.

8. **Verificación final.** `npm run lint`, `npm run build`, `npx playwright test` completo (23 previos + los nuevos). Los 14 baselines visuales deben pasar **sin regenerarse**: si alguno cambia, es que `PersistGate` introdujo un flash y hay que investigarlo, no actualizar el snapshot.

## Acceptance Criteria

- [ ] `npm run build` (`tsc -b` + `vite build`) pasa sin errores.
- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] `npx playwright test` pasa completo: los 23 tests previos + los nuevos de `e2e/persistence.spec.ts`.
- [ ] Los 14 baselines de `e2e/__screenshots__/` pasan **sin regenerarse**.
- [ ] Tras un login y `page.reload()`, la navbar sigue mostrando el nombre del usuario.
- [ ] Abrir una segunda página en el mismo contexto de navegador muestra el estado ya rehidratado, sin repetir login.
- [ ] Tras hacer toggle de la conexión de Spotify y recargar, `isSpotifyConnected` conserva su valor.
- [ ] Tras logout, `localStorage.getItem('persist:totify')` no contiene `name`, `email` ni `token` del usuario.
- [ ] Con `persist:totify` conteniendo JSON inválido, la app arranca con `initialState` y no lanza excepción.
- [ ] `localStorage` contiene exactamente una clave de persistencia: `persist:totify`.
- [ ] `UserState` está exportado y tipado con los 4 campos; `setUser` usa `PayloadAction<UserState>`.
- [ ] `token: string` existe en `UserState` y en la interfaz `User` de `src/types/user.ts`.
- [ ] Ningún call site de `setUser` omite `token` (lo garantiza `tsc -b`).
- [ ] `Landing.tsx` usa `clearUser()` para el logout; ya no despacha `setUser` con campos vacíos.
- [ ] `Login.tsx` conserva el `// MOCK — quitar` sobre `email.split('@')[0]`.
- [ ] `persistConfig` declara `version: 0`, `whitelist: ['user']` y una función `migrate`.
- [ ] La consola no muestra el warning `A non-serializable value was detected` de RTK al arrancar ni al rehidratar.
- [ ] `src/main.tsx` monta `PersistGate` con `loading={null}` dentro de `<Provider>`.
- [ ] Ningún slice fuera de `user` queda persistido.
- [ ] Cero llamadas reales a APIs: el spec no introduce lógica de auth.

## Decisiones tomadas y descartadas

- **`redux-persist` en vez de middleware propio**: trae `PersistGate`, `purge`, versionado y `migrate` ya resueltos, y es el estándar que cualquiera que llegue al repo reconoce. Contra: el repo tiene mantenimiento lento y obliga a ignorar sus 6 acciones internas en `serializableCheck`. Descartado el middleware casero (~30 líneas con `store.subscribe` + debounce de lodash): más barato de escribir, pero habría que reimplementar a mano el gate de rehidratación, el purge y las migraciones — justo las partes con aristas.

- **`localStorage`, no `sessionStorage`**: `sessionStorage` está aislado por tab y muere al cerrarla, lo que rompe el requisito de que una tab nueva vea el estado. `localStorage` es compartido entre tabs del mismo origen y sobrevive al cierre del navegador.

- **Solo rehidratación, sin sync en vivo entre tabs**: el problema real es el refresh, y la rehidratación al montar lo resuelve por completo. El sync activo (`redux-state-sync` o listener del evento `storage`) añade una dependencia más, riesgo de bucles de acciones entre tabs y decisiones de conflicto que ahora mismo no hay con qué contestar. Se descarta a propósito; si aparece la necesidad, es su propio spec.

- **`whitelist: ['user']` en vez de persistir el root**: persistir todo hace que cualquier slice futuro nazca persistido por defecto, incluido estado efímero de UI. La whitelist obliga a que cada spec decida explícitamente si su slice sobrevive al refresh. Descartada también la `blacklist`, que tiene el mismo defecto por omisión.

- **`version: 0` + `migrate` desde el día uno**: cuesta tres líneas ahora y evita el refactor cuando el spec de auth real cambie la forma de `UserState`. Sin él, redux-persist mergea el estado viejo y deja campos nuevos en `undefined` en usuarios que ya tenían datos guardados — un bug que solo se ve en producción, nunca en local con `localStorage` limpio. Descartado el purge total en cada cambio de forma: simple, pero desloguea a todo el mundo en cada release.

- **`PersistGate` con `loading={null}`**: `localStorage` es síncrono, así que la espera es de un frame y no justifica un spinner. Un spinner de MUI además aparecería en las capturas de Playwright y podría mover los 14 baselines. Descartado no usar `PersistGate`: la app pintaría con el estado inicial y luego saltaría al rehidratado, con parpadeo visible de "deslogueado → logueado".

- **`purge()` en logout, no solo reset del slice**: resetear el slice deja a redux-persist escribiendo el estado vacío encima, lo cual funciona, pero el borrado explícito es lo que se puede afirmar y testear ("no queda rastro"). Es también lo correcto para un token.

- **`setUser` con payload completo (`PayloadAction<UserState>`)**: obliga a que todo call site pase `token`, y es `tsc -b` quien lo verifica en vez de un review. Descartado el payload parcial con merge: más cómodo, pero deja pasar en silencio un login que se olvide de guardar el token.

- **`token` persistido, pese al riesgo de XSS**: cualquier JavaScript que corra en la página puede leer `localStorage`, incluido código inyectado o una dependencia comprometida — a diferencia de una cookie `httpOnly`, el navegador no lo protege. El riesgo se asume porque el token será de corta duración y porque no hay backend con el que negociar cookies todavía. La alternativa de mantener el token solo en memoria se descarta por contradecir directamente el objetivo del spec: el refresh volvería a dejar al usuario deslogueado. Revisar en el spec de auth real, junto con el refresh token.

- **`name` viene del backend, no del email**: el `email.split('@')[0]` actual es un stub del scaffold. Se marca `// MOCK — quitar` para que el spec de auth real lo sustituya por el `name` de la respuesta de login.

- **No se unifican `User` y `UserState`**: sus divergencias (`lastName` vs `isSpotifyConnected`) solo se pueden resolver bien conociendo la respuesta real del backend. Alinearlas ahora sería adivinar.

## Riesgos identificados

- **Token en `localStorage` legible por cualquier script.** Un XSS o una dependencia comprometida puede exfiltrar la sesión. Mitigación parcial: token de corta duración y `purge()` en logout. Mitigación real (cookie `httpOnly`): fuera de alcance hasta que haya backend. Es el riesgo con más peso del spec y está asumido conscientemente.

- **Estado obsoleto entre tabs.** Sin sync en vivo, la tab A puede hacer logout y la tab B seguir mostrando la sesión hasta que recargue. Impacto real cuando exista auth: la tab B llamará a la API con un token ya revocado y recibirá 401. El spec de auth real debe manejar el 401 o añadir el sync.

- **Rehidratar un token expirado.** Se persiste el token sin `expiresAt`, así que tras días sin usar la app la rehidratación devuelve un usuario que se ve logueado pero cuyo token ya no vale. Igual que arriba: el manejo del 401 es del spec de auth.

- **`localStorage` no disponible.** Modo privado con cuota cero, o navegador con almacenamiento bloqueado, hacen fallar la escritura. redux-persist loguea el error y la app sigue funcionando en memoria (degradación aceptable), pero conviene verificarlo a mano y no dar por hecho que nunca lanza.

- **Estado persistido corrupto o de una forma vieja.** Cubierto por `migrate` + un test explícito con JSON inválido. Riesgo residual: una forma intermedia válida como JSON pero incoherente con `UserState` (por ejemplo un `token: null` escrito por una versión anterior) pasa el parseo y llega a los componentes. Se acota subiendo `version` en cuanto cambie la forma.

- **Flash en el primer render que mueva los baselines.** `PersistGate` con `loading={null}` significa un frame sin árbol. Si Playwright captura ahí, los 14 baselines diffean. Por eso el criterio de aceptación exige que pasen sin regenerarse: un diff aquí es señal a investigar, no snapshot a actualizar.

- **Warning de serializabilidad de RTK.** Si los `ignoredActions` quedan incompletos, la consola se llena de `A non-serializable value was detected` en cada arranque, y el ruido acaba tapando warnings reales. Tiene criterio de aceptación propio.

- **Crecimiento silencioso de lo persistido.** Cualquier spec futuro puede añadir su slice a la whitelist sin medir el tamaño. Con `user` no hay problema, pero resultados de búsqueda o imágenes en base64 revientan la cuota de ~5MB. La whitelist explícita es justamente lo que fuerza esa decisión a ser consciente.
