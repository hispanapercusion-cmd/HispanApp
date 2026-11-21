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
  Dirección actual: **https://hispanapp.hispanapercusion.com/** (dominio propio en Cloudflare, CNAME a
  `hispanapercusion-cmd.github.io`; puesto en GitHub → Settings → Pages → Custom domain el 2/11/2026).
  La antigua `hispanapercusion-cmd.github.io/HispanApp/` redirige sola a la nueva.
  (`netlify.toml` existe por si se usa Netlify, pero la publicación oficial es GitHub Pages).
- **Sin conexión**: `public/sw.js` (service worker, registrado en `src/main.tsx` solo en producción).
  La página va "red primero"; manifest, icono y fuentes, "caché primero". Si se cambia algo del shell,
  subir la versión de `CACHE` en `sw.js`.
- **Audio**: `src/audio/engine.ts`. Muestras reales de palmas de Jordan en `public/audio/palmas.bin`
  (PCM 16 bits, 44,1 kHz; índice en `src/audio/palmasIndex.ts`). Se descargan en segundo plano durante la
  bienvenida (mientras tanto suena una palma sintetizada) y el service worker las guarda para usar sin conexión.
- **Firebase** (proyecto `hispanapp`, plan Spark, Firestore en `southamerica-east1`):
  - `leads`: registros de alumnos (`src/services/firebase.ts`). Si no hay conexión quedan en
    `localStorage` (`hispanapp_pending_leads`) y se reenvían solos. Al editar el perfil se añade un lead
    con `source: perfil_actualizado`.
  - `codigos_pro`: un documento por código de alumno; el **ID del documento es el código en mayúsculas**
    y lleva el campo `activo: true` (`false` para quitar el acceso). Formato usado: `ALUMNO-XXXX-XXXX`.
    No escribir códigos reales en este archivo ni en el código.
  - `opiniones`: mensajes del botón "Enviar opinión" (Comunidad).
  - Reglas en `firestore.rules` (publicadas a mano en la consola de Firebase): `leads` y `opiniones` solo
    `create` con campos y tamaños validados, `codigos_pro` solo `get` (nunca `list`). Si se añade un campo
    nuevo a un lead u opinión, añadirlo también a la lista `hasOnly` de las reglas y volver a publicarlas.
- **⚠️ Cambio de plataforma de cobro (17/11/2026): Lemon Squeezy cierra el 31/3/2027 → HispanApp PRO se vende en
  Polar (polar.sh).** Datos públicos en `src/config.ts` (`polarCheckoutUrl`, `polarOrganizationId`, `polarLicenseApiUrl`,
  `polarKeyPrefix`): producto 3b90e47d-31b5-4d2a-9b6c-b8e182f94b51, organización c37ce4bd-247b-4a69-89ae-4993bac1a594,
  pago único 24,99 USD, claves con prefijo `HISPANAPP-`, sin vencimiento ni límite de activaciones. **Vuelta tras
  pagar (como con Lemon, sin copiar nada)**: Polar devuelve al comprador a `https://hispanapp.hispanapercusion.com/?compra…`
  y, según el código fuente de Polar (**sin confirmar con una compra real**), añade `customer_session_token`, un pase
  temporal del comprador. `src/services/polarPurchase.ts` lo usa (`GET /customer-portal/customers/me` y
  `/customer-portal/license-keys/`, con reintentos porque la clave tarda unos segundos) para leer el nombre, el email y la
  clave; la app muestra «Confirmando tu compra…» (`PurchaseCheck.tsx`), guarda el perfil, activa el PRO y sigue como con
  Lemon (saludo por nombre, guía «¡PRO activado!», recorrido). **Respaldo**: si no llega el pase, es inválido, falla la red
  o la clave no aparece (a los 9 s sale «pegar mi clave a mano»), se abre «Activa tu PRO» con el botón «Pegar la clave
  copiada y activar» (la clave también llega por email). Quien ya era cliente de Polar puede no recibir el pase (usa el
  respaldo). Conviene poner la URL de éxito `…/?compra&checkout_id={CHECKOUT_ID}` (la app lo ignora; sirve para diagnosticar).
  La validación llama a
  `POST https://api.polar.sh/v1/customer-portal/license-keys/validate` con `{key, organization_id}` (sin token secreto;
  comprobado el 17/11: CORS abierto, clave falsa → 404). Se acepta solo `status: "granted"`, sin vencer y de nuestra
  organización; 404/422 = no válida; 5xx, límite o sin red = «no se pudo comprobar». **Nunca poner tokens de Polar en el
  código.** Las claves viejas de Lemon (UUID) y los códigos de alumno siguen funcionando. **Cupón FLAMENCO (40 %)**: lo
  añade solo `proCheckoutUrl()` al enlace de compra del 1 al 31/12/2026 (hora de Argentina), no hay que quitarlo en enero.
  Método LRDF: desde el 20/11/2026 `METHOD_URL_ES`/`METHOD_URL_EN` apuntan a Polar. Legales actualizados a Polar el 21/11/2026
  (`CONSENT_VERSION` = 2026-11-21). Solo se aceptan claves del beneficio de HispanApp PRO (`polarProBenefitId`); la validación devuelve
  también nombre y email del comprador. Portal del cliente (sus compras y su clave): `polarPortalUrl`.
- **iPhone: la app guardada tiene su propia memoria** (20/11/2026, visto en la primera compra de prueba con Polar): lo que
  se activa o registra en Safari NO pasa a la app guardada en la pantalla de inicio (regla de Apple). Por eso:
  1. Tras una compra en iPhone, `InstallWelcome` sale **primero, encima del registro**. Si el PRO ya se activó en Safari,
     muestra «📋 Copiar mi clave» → guardar la app → abrirla desde el ícono → pegar. Si no, explica que la clave llega por
     email («Access purchase» en el email de Polar).
  2. La primera pantalla (`SplashScreen`) tiene `BuyerActivateCard` «¿Ya compraste HispanApp PRO?»: **abierta y encima
     del formulario** si la app se abrió desde el ícono (`isStandalone`) o tras una compra; plegada debajo en el resto.
     Con una clave de Polar rellena nombre y email; solo queda aceptar la privacidad y continuar.
  3. Si llega de la compra sin activar, la ventana «Activa tu PRO» se abre al terminar el registro (no por debajo).
  Android y ordenador comparten memoria entre navegador y app instalada: ahí no hace falta.
- **Acceso PRO** (`src/services/pro.ts`): se guarda en `localStorage` (`hispanapp_pro`), ligado a la
  dirección web. Se activa con:
  - una **license key de Polar** (`HISPANAPP-…`), validada con la API pública de licencias de Polar;
  - una clave antigua de **Lemon Squeezy** (formato UUID), validada con la License API de Lemon (solo hasta que cierre);
  - un **código de alumno** de Firestore.
  También desde enlaces/QR `?acceso=CODIGO` o `?license_key=CLAVE`. Volver del checkout
  (`?checkout=success`) NO activa PRO: pide la clave del email.
  - ⚠️ **Sin comprobar con una clave real**: si Lemon bloquea la llamada desde el navegador (CORS),
    saldrá "No se pudo comprobar el código". Arreglo: un intermediario y cambiar `lemonLicenseApiUrl`
    en `src/config.ts`.
  - `lemonStoreId` en `src/config.ts` está en `null`. Conviene poner el ID de la tienda.
- **Recorrido guiado** (`src/components/AppTour.tsx`): 6 pasos que iluminan elementos marcados con
  `data-tour="..."` en `App.tsx` (ritmos, reloj, metronomo, entrenador, atril, comunidad). Sale una vez
  tras la bienvenida (`localStorage` `hispanapp_tour_done`) y se puede repetir desde Comunidad.
- **Legal y privacidad**: páginas estáticas en `public/legal/` (`privacidad.html`, `terminos.html`,
  `arrepentimiento.html`), enlazadas desde Comunidad, la ventana PRO, el registro y Tu perfil.
  Contacto legal: `contactEmail` en `src/config.ts`. Consentimiento en `src/services/consent.ts`
  (`CONSENT_VERSION`; si cambian los textos legales, subirla para que la app pida aceptar de nuevo).
  Registro: casilla obligatoria + novedades y estadísticas opcionales; a quien ya estaba registrado se le
  muestra un aviso único (`ConsentGateModal`). Tu perfil → "Privacidad y datos": cambiar opciones,
  pedir borrado por email y borrar los datos del dispositivo.
- **Estadísticas** (`src/services/analytics.ts`): Firebase Analytics solo si el alumno las permite y solo en
  producción. Eventos: sign_up, select_rhythm, play, open_pro_modal, click_checkout, pro_activated,
  open_community/vocabulary/video/trainer/atril, tour_closed, feedback_sent, install_prompt/steps, install_welcome.
- **Instalar app** (`src/services/install.ts` + `InstallCard` en Comunidad): botón nativo en Android/Chrome,
  pasos para iPhone. **Llegada desde la web** (`?instalar`, lo usa el botón "Empezar gratis" de
  hispanapercusion.com): `InstallWelcome` se abre encima de todo (antes del recorrido). Android/Chrome: un solo botón
  "Instalar HispanApp" (si el aviso de Chrome no llega en 4 s, muestra los pasos del menú ⋮). iPhone/Safari: dos pasos
  y una flecha animada hacia la barra de abajo (Apple no deja instalar por código). Dentro de Instagram: pide abrir en
  el navegador. No sale si la app ya está instalada. **Vista previa al compartir**: `public/og-image.jpg` + metas `og:*` en `index.html`
  (con la dirección completa: actualizarlas al cambiar de dominio).
- **Entradas a la app** (ordenadas el 13/11/2026):
  1. **Gratis** (enlace común, «Empezar gratis» de la web, compartir): registro (nombre, email, rol, nivel) y app gratis.
  2. **Comprador** (botón de Lemon, pantalla de confirmación y email de recibo): el **Button link** debe ser
     `https://hispanapp.hispanapercusion.com/?compra&license_key=[license_key]&email=[email]&name=[name]`
     (variables oficiales de Lemon). `ARRIVAL` en `App.tsx` guarda nombre (solo el primero) y email como perfil, la
     app saluda «¡Hola, Nombre!», valida la clave y activa el PRO sola; sigue el aviso de privacidad, la guía opcional
     «¡PRO activado! Guárdala en tu pantalla» (en iPhone la app guardada empieza vacía y pide la clave del email:
     botón «Pegar la clave copiada y activar» de la ventana PRO) y el recorrido. Sin clave en el enlace: guía
     «¡Gracias por tu compra!» y ventana PRO para pegarla. Mantener la clave visible en el email de recibo.
     Si el enlace llega **sin clave** (botón de Lemon sin las variables, o sin sustituir), la ventana PRO se abre en modo
     «Activa tu PRO» (sin botón de comprar, con el botón de pegar) y el recorrido de la app espera a que se cierre
     (antes se superponían). Si el comprador ve esa ventana, el enlace de Lemon no trae la clave: revisar el Button link.
     **Página de prueba del enlace** (`public/diagnostico.html`): poner temporalmente el Button link de Lemon en
     `https://hispanapp.hispanapercusion.com/diagnostico.html?compra&license_key=[license_key]&email=[email]&name=[name]`,
     hacer una compra de prueba y tocar el botón: muestra qué datos llegaron (clave enmascarada) y tiene el botón
     «Continuar a HispanApp» que conserva los datos. No guarda ni envía nada. Los enlaces del email pasan por un
     enlace de seguimiento de Lemon (`lemonsqueezy-mail.com/ls/click…`) que oculta el destino.
  3. **Alumno con enlace de acceso** (`?acceso=CODIGO`) en un móvil nuevo: el PRO se activa, pero **no cuenta como
     registro**: pide nombre y email y luego saluda por el nombre. Antes marcaba «registrado» y saludaba «¡Hola,
     amigo!» sin guardar al alumno. Un móvil «registrado» sin nombre también pide nombre y email.
- **Contacto por WhatsApp** (15/11/2026): en Comunidad la tarjeta ahora es «Ayuda y soporte» (sin verde) y todos los
  enlaces usan `whatsappLink(lang, 'support' | 'access')` de `config.ts`, que abre WhatsApp con el **mensaje ya escrito**
  (en el idioma de la app; el de acceso pide el email de compra). El número está en `APP_CONFIG.whatsappUrl`.
  Pendiente de Jordan: pasar ese número a **WhatsApp Business** (nombre, logo, horario, mensajes automáticos). Se descartó
  por ahora un email propio `soporte@hispanapercusion.com`.
- **Compartir la app** (`src/services/share.ts` + `ShareCard`, primera tarjeta de Comunidad): menú nativo del
  móvil o WhatsApp + copiar. El enlace es siempre la app limpia (sin `?acceso=` ni claves) con
  `utm_source=compartir`. Para dar PRO a un alumno se usa a mano `?acceso=CODIGO`, un código por alumno.
- **Recuperar el acceso PRO**: explicación desplegable en la ventana PRO y en Comunidad; la clave o código
  activado se guarda en `hispanapp_pro_code` y se muestra en Comunidad para copiarlo.
- **Idiomas (español / inglés)** (`src/i18n.tsx`): cada texto lleva sus dos versiones juntas, `L('Hola', 'Hello')`
  (en componentes con `const { L } = useLang()`; en servicios, `import { L } from '../i18n'`). El idioma sale del
  teléfono (español si empieza por "es"; si no, inglés) y se cambia con el botón ES/EN (`LangSwitch`: en la cabecera en
  pantallas grandes, en el registro, Comunidad y Tu perfil). Se guarda en `hispanapp_lang`. Los nombres de los palos y
  términos flamencos se dejan en español con explicación en inglés (`palosEn` en `rhythms.ts`, `gloss` en el Vocabulario).
  Rol y nivel se guardan siempre en español en Firebase (`roleLabel`/`levelLabel` solo cambian lo que se ve).
  Páginas legales en inglés en `public/legal/en/` (`legalUrl()` en `config.ts` elige según el idioma).
  **Al añadir un texto nuevo, escribirlo siempre en los dos idiomas.** Los vídeos y el método (libros) están en español.
- **Pantalla principal = solo el reloj** (15/11/2026): se quitó el selector Ambos/Reloj/Partitura. La partitura se ve desde
  Menú → Vista (Reloj / Partitura / Ambos; se recuerda solo si el alumno la cambia, `hispanapp_view_set`). El recorrido
  muestra temporalmente reloj y partitura y luego vuelve a la vista de antes. Antes (vista «Ambos»): el reloj arriba (con el título del ritmo y el botón Video) y debajo la
  partitura, los palos y el banner del método; en pantallas grandes, reloj a la izquierda y partitura a la derecha.
  El banner del método ya solo está en el menú y en Comunidad si se ve solo el reloj.
- **Última sesión** (`src/services/session.ts`, `hispanapp_session`): al abrir la app se retoman el último ritmo,
  velocidad, tipo de palmas, cuenta, vista y cuenta previa. Un ritmo PRO solo se recupera si el PRO sigue activo.
- **Racha de práctica** (`src/services/practice.ts` + `PracticeStreak`, `hispanapp_practice`): se suman los segundos que
  suena el ritmo; un día cuenta con 1 minuto. Muestra días seguidos, los últimos 7 días y los minutos de la semana.
  Solo se guarda en el dispositivo (mencionado en la política de privacidad).
  **Pantalla minimalista** (15/11/2026): la tarjeta de la racha ya no está en la pantalla principal. Al abrir la app
  (sin otra ventana, tras bienvenida/consentimiento/recorrido) sale una **celebración a pantalla completa estilo juego** (`StreakCelebration.tsx`: hoguera animada con llamas que se mueven, chispas, el número que sube contando y «DÍAS DE RACHA»; dura ~5 s o se cierra tocando)
  (solo si la racha es ≥ 1); el contador completo está en Menú → «Mi racha». Los controles de sonido (Cuenta previa,
  Palmas, Metrónomo, Cuenta, tipo de palmas) están plegados en «⚙️ Ajustes de sonido» (se despliegan despacio, ~0,55 s, con alto animado `grid-rows 0fr→1fr`; el menú ☰ también entra suave y sus opciones aparecen escalonadas) y se quitó el selector desplegable
  de ritmos (repetía los botones I–VIII).
- **Pantalla encendida** (`src/services/keepAwake.ts`): Wake Lock del navegador y, si no existe o el sistema lo
  niega, respaldo con un vídeo diminuto, negro y en silencio, en bucle. Se activa dentro del toque de Play (necesario
  para el respaldo) y en el Atril; solo se suelta al cerrar la app. Sin probar todavía en un iPhone real.
- **Controles** (cambios pedidos por un alumno, 11/11/2026): botón "⏳ Cuenta previa" (antes "Cuenta"), controles a
  todo el ancho en el móvil, textos más grandes, selector "Ambos / 🕐 Reloj / 🎼 Partitura" más visible y el logo de la
  cabecera enlaza a hispanapercusion.com.
- **Cambios de la lista de usabilidad** (15/11/2026, tras probar con alumnos): (1) la **cuenta previa 3-2-1 solo sale al
  arrancar desde cero**; el botón Play/Pausa ahora **pausa y reanuda donde quedó** sin cuenta previa (`atStart` /
  `resetPosition()` en `engine.ts`; botón «↺ Reiniciar» junto a «Vuelta» cuando hay pausa a medias; cambiar de ritmo
  también vuelve a cero). El botón «⏳ Cuenta previa» sigue siendo la opción para desactivarla. (2) **Menú desplegable**
  abajo (☰ Menú): «Método: Los Ritmos del Flamenco» (abre la tienda; ya no se escribe «LRDF» en la app), Vocabulario, Comunidad, Ver el recorrido y la opción «Marca roja en la
  partitura» (`hispanapp_guide`); el recorrido ya no está dentro de Comunidad. (3) Quitado «Toca cualquier compás…».
  (4) **Globito con el nombre del palo** sobre los botones I–VIII (`rhythmPaloShort` en `rhythms.ts`). (5) Un solo
  término: «Reloj de compás» / «Compás clock». (6) **Ayudas «i»** (`Hint.tsx`, se tocan) en Acento, Acento de palma y
  Modo Espejo; se quitó «Pulso» de la leyenda del reloj. (7) La marca roja de la partitura es más suave (opcional) y el
  **número del golpe** se agranda y se ilumina. (8) **Palmas y metrónomo son capas independientes**: botón «👏 Palmas»
  (`hispanapp_palmas`); siempre queda al menos una capa activa. Para más adelante: vídeos en bucle con más ciclos, cajón
  como capa combinable, abrir la app a cantaores/bailaoras/guitarristas. A confirmar con 2-3 alumnos más: el Modo Espejo y
  los términos confusos, y que Vocabulario/Comunidad no pierdan uso al esconderse en el menú.
- **Metrónomo de fondo** (botón "⏱️ Metrónomo", activo por defecto, se recuerda en `hispanapp_metronome`):
  `scheduleMetronome` en `engine.ts` da un "tac" en cada tiempo con número en la cuenta y un "tum" grave en los
  tiempos de `metroDownbeats` del ritmo, definidos por Jordan (6/11/2026): compás de 12 (I) y Seguiriyas (II) solo en el
  primero; Bulería (III) y Jaleos/Abandolaos (IV) en el 12 y el 6; Tangos (VI) y Tientos (VII) en el 1 de cada compás
  `[0, 4]`; Tanguillos (VIII) en los dos 1 `[0, 2]`; Fandangos/Sevillanas (V) solo en el primero (sin confirmar).
  En Seguiriyas el tac suena solo en sus 5 pulsos. Ritmo I lleva acentos en 12, 3, 6, 8 y 10 (partitura y sonido).
- **Dinámica de las palmas** (`ACCENT_GAIN` 1,3 / `NORMAL_GAIN` 0,7 en `engine.ts`): los acentos suenan bastante más
  fuertes que el resto para que se note el groove (las muestras llegan al 65 % de la escala: no saturan).
- **Método LRDF a la venta** (7/11/2026): en Lemon Squeezy, un producto por idioma (`METHOD_URL_ES` / `METHOD_URL_EN`
  y `methodUrl(lang)` en `config.ts`). Lo usan el banner bajo la partitura y la tarjeta "Método completo" de Comunidad.
  Antes apuntaban al Pack de Hotmart (`hotmartPackUrl`, ya sin uso en la app).
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

- [x] **Dominio propio** `hispanapp.hispanapercusion.com` funcionando (2/11/2026): CNAME `hispanapp` →
  `hispanapercusion-cmd.github.io` en Cloudflare con **nube gris (DNS only)**, DNS check OK y Enforce HTTPS activado.
  Se quitó el dominio del Worker `hispanapp` de Cloudflare (copia vieja de la app, sigue conectado al repo y comenta
  en los PR: se puede desconectar en Workers → hispanapp → Settings → Builds).
- [x] Botón "Abrir HispanApp" del email de recibo de Lemon apunta a la dirección nueva (3/11/2026).
- [x] Cuenta de Polar aprobada (20/11/2026). Primera compra de prueba de HispanApp PRO (código 100 %): pago y email OK,
  pero la app publicada aún no tenía Polar y en iPhone la app guardada empezó vacía → arreglado en el PR de Polar.
- [ ] **Repetir la compra de prueba en iPhone con este PR publicado**: ¿llega `customer_session_token` y se activa solo?
  Guardar la app → abrir desde el ícono → «Pegar mi clave y activar PRO». Y en Android.
- [x] Páginas legales (ES/EN) pasadas de Lemon Squeezy a Polar y `CONSENT_VERSION` subida (21/11/2026): la app pide aceptar de nuevo.
- [ ] Quitar el código `lemon*` de `pro.ts`/`config.ts` después del 31/3/2027.
- [ ] (antiguo, ya no aplica si se migra a Polar) **La tienda de Lemon está en revisión** ("Your application has been received"): sin aprobación solo funciona en
  modo prueba. Tiene que estar aprobada antes del 1/12.
- [x] Verificación en 2 pasos de la cuenta de Google activada (3/11/2026).
- [x] Compra de **prueba** (modo test) de punta a punta funcionando (14/11/2026): clave, email y nombre llegan en el
  enlace del botón, la app saluda por el nombre y activa el PRO sola. Lo que faltaba era activar **«Generate license
  keys» en la variante** del producto en Lemon (se configura por variante; sin eso `[license_key]` llega vacío).
- [ ] Repetir la compra con el Button link **definitivo** (sin `diagnostico.html`) y, cuando Lemon apruebe la tienda,
  una compra real con reembolso.
- [x] Botón "Enviar opinión", vista previa al compartir, política de privacidad, términos, arrepentimiento,
  consentimiento, borrado de datos, estadísticas, instalar app y carga más rápida (octubre 2026).
- [ ] **Revisión legal** de los textos de `public/legal/` por un profesional en Argentina (privacidad ya revisada con Gemini el 12/11; faltan términos y arrepentimiento).
- [x] Base de datos de alumnos registrada en la AAIP por Jordan (12/11/2026); la política de privacidad lo dice y cita el art. 9 de la Ley 25.326 (versión 2026-11).
- [x] Reglas nuevas de `firestore.rules` publicadas en Firebase y probadas con una opinión real (3/11/2026).
- [ ] Comprobar que los 4 códigos de alumno de la prueba (más el de Jordan) estén creados en `codigos_pro`.
- [ ] Activar Google Analytics en Firebase si no está activado (Configuración del proyecto → Integraciones).
- [ ] Borrar de `leads` los registros de prueba con emails `@example.com` creados en las pruebas de octubre.
- [x] Recordar la última sesión y racha de práctica (11/11/2026).
- [ ] Confirmar con Jordan el tiempo de referencia del metrónomo de Fandangos/Sevillanas (ritmo V).
- [ ] Modo "Ahora tú" (silenciar palmas y dejar el reloj/click).
- [ ] Plan de marketing y textos de la campaña.
- [x] Versión en inglés de la app y de las páginas legales (noviembre 2026). Falta: que alguien nativo revise los textos
  y que el abogado revise las páginas legales en inglés.
- [ ] Más adelante: App Store y Google Play.

## Trucos del entorno

- Para parar el servidor de pruebas no uses `pkill -f vite`: el patrón coincide con la propia orden y
  mata la shell.
- `git fetch` o `git push` a veces se quedan colgados: usa `timeout` y reintenta.
- **En las pruebas con Playwright, bloquear Firebase** (`ctx.route(/firestore\.googleapis\.com|google-analytics|googletagmanager|firebaseinstallations/, r => r.abort())`):
  este entorno puede llegar a Firebase y los registros de prueba acabarían en la base real.
