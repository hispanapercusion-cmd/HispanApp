# HispanApp — notas del proyecto

Léelo antes de empezar. Resume cómo está montada la app, las decisiones tomadas y lo que queda pendiente.
Actualízalo cada vez que cambie algo importante (decisiones, servicios, fechas, pendientes).

## Quién y cómo trabajar

- Dueño: **Jordan Migues** (Hispana Percusión). App basada en su método *Los Ritmos del Flamenco* (LRDF).
- Escribe en **español**, no es técnico y suele usar el **móvil**: respuestas cortas, resultado primero,
  pasos numerados y sin jerga. Pide capturas cuando haga falta guiarle por una web.
- Flujo: cambios en la rama `claude/hispanapp-funcionalidades-h86184` → pull request → **él pulsa Merge**.
  Nunca subir directo a `main`. Si el PR anterior ya está fusionado, recrear la rama desde `origin/main`.
- Antes de cada PR: `npm run lint`, `npm run build` y probar en Chromium (Playwright) con vista móvil
  (390×844, táctil) y portátil (1366×768).

## Cómo está montada

- **Código**: React 19 + Vite + Tailwind 4 + Web Audio. Se compila a un único `dist/index.html`
  (`vite-plugin-singlefile`). El código fuente vino de Google AI Studio; **ya no se edita allí**.
- **Publicación**: GitHub Pages con GitHub Actions (`.github/workflows/deploy.yml`) en cada push a `main`.
  Dirección actual: https://hispanapercusion-cmd.github.io/HispanApp/
  (`netlify.toml` existe por si se usa Netlify, pero la publicación oficial es GitHub Pages).
- **Sin conexión**: `public/sw.js` (service worker, registrado en `src/main.tsx` solo en producción).
  La página va "red primero"; manifest, icono y fuentes, "caché primero". Si se cambia algo del shell,
  subir la versión de `CACHE` en `sw.js`.
- **Audio**: `src/audio/engine.ts`. Muestras reales de palmas de Jordan en base64 dentro de
  `src/audio/jordanSamplesPcm.ts` (~760 KB, por eso la app pesa ~1,6 MB).
- **Firebase** (proyecto `hispanapp`, plan Spark, Firestore en `southamerica-east1`):
  - `leads`: registros de alumnos (`src/services/firebase.ts`). Si no hay conexión quedan en
    `localStorage` (`hispanapp_pending_leads`) y se reenvían solos. Al editar el perfil se añade un lead
    con `source: perfil_actualizado`.
  - `codigos_pro`: un documento por código de alumno; el **ID del documento es el código en mayúsculas**
    y lleva el campo `activo: true` (`false` para quitar el acceso). Formato usado: `ALUMNO-XXXX-XXXX`.
    No escribir códigos reales en este archivo ni en el código.
  - Reglas en `firestore.rules` (publicadas a mano en la consola de Firebase): `leads` solo `create`,
    `codigos_pro` solo `get` (nunca `list`).
- **Acceso PRO** (`src/services/pro.ts`): se guarda en `localStorage` (`hispanapp_pro`), ligado a la
  dirección web. Se activa con:
  - una **license key de Lemon Squeezy** (formato UUID), validada con la License API de Lemon;
  - un **código de alumno** de Firestore.
  También desde enlaces/QR `?acceso=CODIGO` o `?license_key=CLAVE`. Volver del checkout
  (`?checkout=success`) NO activa PRO: pide la clave del email.
  - ⚠️ **Sin comprobar con una clave real**: si Lemon bloquea la llamada desde el navegador (CORS),
    saldrá "No se pudo comprobar el código". Arreglo: un intermediario y cambiar `lemonLicenseApiUrl`
    en `src/config.ts`.
  - `lemonStoreId` en `src/config.ts` está en `null`. Conviene poner el ID de la tienda.
- **Recorrido guiado** (`src/components/AppTour.tsx`): 6 pasos que iluminan elementos marcados con
  `data-tour="..."` en `App.tsx` (ritmos, partitura, metronomo, entrenador, atril, comunidad). Sale una vez
  tras la bienvenida (`localStorage` `hispanapp_tour_done`) y se puede repetir desde Comunidad.
- **Gratis vs PRO**: gratis los ritmos I y VI; PRO desbloquea los 8 ritmos, los vídeos
  (YouTube **no listados**, solo accesibles desde la app) y el entrenador progresivo.

## Decisiones de negocio

- PRO es **pago único** (no suscripción) en Lemon Squeezy, en **USD**. Precio normal **24,99 USD**.
- Lanzamiento: cupón **`FLAMENCO`** (−10 USD → 14,99), activo del **1 al 31 de diciembre de 2026**.
  El enlace del botón "Conseguir Versión PRO" ya lleva el cupón (`lemonSqueezyUrl` en `src/config.ts`).
  **Quitarlo en enero de 2027.**
- Lemon: "Generate license keys" activado, límite de activaciones ilimitado. El email de recibo tiene
  instrucciones y un botón "Abrir HispanApp" que apunta a la dirección de la app (actualizarlo si cambia).
- **Hotmart**: el Pack Completo dice que incluye HispanApp PRO, pero no hay integración; a esos
  compradores hay que mandarles un código a mano. Se resolverá en la fase de marketing.
- Noviembre de 2026: **prueba con alumnos** usando códigos de alumno. Diciembre: lanzamiento.

## Calendario y recordatorios

Hay recordatorios programados en el chat original de Claude: 2/11 (inicio de la prueba), 16/11 (probar
una compra real con Lemon), 23/11 (congelar cambios y preparar campaña), 30/11 (lista de la víspera),
1/12 (lanzamiento), 2/1/2027 (quitar el cupón).

## Pendientes

- [ ] **Dominio propio** (ej. `app.hispanapercusion.com` o `hispanapp.com`). Hacerlo **antes de la prueba
  de noviembre**: cambiar de dirección borra el PRO guardado en los navegadores. Pasos: comprar el dominio →
  registro DNS (CNAME a `hispanapercusion-cmd.github.io` si es subdominio, o los 4 A de GitHub Pages si es el
  dominio raíz) → GitHub Settings → Pages → Custom domain + Enforce HTTPS → ajustar `start_url` en
  `public/manifest.json` y el botón del email de Lemon.
- [ ] Probar una compra real de Lemon y la validación de la license key.
- [ ] Botón "Enviar opinión" (colección `opiniones` en Firestore + regla `create`).
- [ ] Imagen de vista previa al compartir (`og:image`) para WhatsApp e Instagram.
- [ ] Política de privacidad y términos.
- [ ] Recordar el último ritmo, BPM y tipo de palma.
- [ ] Modo "Ahora tú" (silenciar palmas y dejar el reloj/click) y progreso/racha de práctica.
- [ ] Botón "Instalar app" con instrucciones para iPhone y Android.
- [ ] Carga más rápida (pasar las muestras a audio comprimido).
- [ ] Estadísticas (Firebase Analytics) para medir la campaña.
- [ ] Plan de marketing y textos de la campaña.
- [ ] Más adelante: versión en inglés; App Store y Google Play.

## Trucos del entorno

- Para parar el servidor de pruebas no uses `pkill -f vite`: el patrón coincide con la propia orden y
  mata la shell.
- `git fetch` o `git push` a veces se quedan colgados: usa `timeout` y reintenta.
