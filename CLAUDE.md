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
  código.** Las claves viejas de Lemon (UUID) y los códigos de alumno siguen funcionando. **Cupón FLAMENCO** (Navidad,
  −10 USD fijos → 14,99 USD; en Polar, solo HispanApp PRO, del 1/12 00:00 al 31/12 23:59 hora de Argentina): lo
  añade solo `proCheckoutUrl()` al enlace de compra en diciembre, no hay que quitarlo en enero. Para el método hay otro
  descuento, `NAVIDAD` (−39,91 USD → 59,99 USD). Links con el descuento ya aplicado (ManyChat, redes): «Navidad 40% – …»
  en Polar → Checkout Links.
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
- **Patrones de palmas del ritmo I** (22/11/2026): el ritmo I tiene 3 patrones de palmas sobre la misma cuenta y los mismos acentos
  (12, 3, 6, 8 y 10). Patrón 1 = el oficial (el del video y el de las muestras grabadas por Jordan); Patrón 2 = silencio +
  corchea (contratiempo) en los tiempos 1, 4, 7, 9 y 1 final; Patrón 3 = dos corcheas en los tiempos 1, 4, 7 y 9. Están en
  `patterns` del ritmo (`rhythms.ts`; `rhythmWithPattern` / `patternCount`). Selector «Patrón de palmas 1·2·3» bajo los botones
  de ritmos (solo aparece en ritmos con más de un patrón), se recuerda en la sesión (`pattern`) y vuelve al 1 al cambiar de ritmo.
  La partitura del ritmo I se dibuja desde los pasos (`MonogramScore.tsx`). **Los patrones 2 y 3 suenan con palmas sueltas de las
  muestras de Jordan** (no hay grabación propia de esos patrones; solo el patrón 1 usa el mapeo exacto). El video sigue siendo el
  del patrón 1. Las imágenes de Jordan no traían acentos: se pusieron los mismos del ritmo I.
- **Cajón del ritmo I** (22/11/2026): capa de sonido nueva «🪘 Cajón» (en «Ajustes de sonido», solo en ritmos con cajón; por ahora el I;
  apagada por defecto y se recuerda en `hispanapp_cajon`), independiente de Palmas y Metrónomo (siempre queda al menos una
  capa activa; si se pasa a un ritmo sin cajón y solo sonaba el cajón, vuelven las palmas). Partitura y video de Jordan
  (`ritmo_I_base_2.mov`): 4 compases de 3/4, 24 corcheas D-I-D-I… con **bajo** (nota de abajo), **agudo** (nota de arriba) y
  **fantasma** (✕). Patrón en `cajon` del ritmo (`rhythms.ts`, `CajonHit` B/A/G/R): B G G A G G | B G G A G G | G A B G B G | G A B G A G.
  Sonido: los **24 golpes cortados del video** (a ~74 BPM de negra, tempo algo irregular: se siguió cada golpe) en
  `public/audio/cajon.bin` (577 KB, PCM 16 bits mono 44,1 kHz; índice en `src/audio/cajonIndex.ts`). Cada paso suena con SU golpe
  grabado; los volúmenes por clase se igualaron (bajo ≈0,65 · agudo ≈0,50 · fantasma ≈0,18, los fantasmas subidos para que se
  oigan en el celular). Se descarga solo al activar la capa y el service worker lo guarda. Partitura propia (`CajonScore.tsx`)
  que se ve en las vistas con partitura (Menú → Vista) cuando la capa está activa. `CAJON_REQUIRES_PRO` (en `App.tsx`) está en
  `false`: el cajón es gratis en el ritmo I; ponerlo en `true` lo deja solo para PRO. Para ampliar: más patrones o ritmos de
  cajón necesitan sus propias grabaciones (el motor ya elige un golpe del mismo tipo si falta la grabación exacta).
  **Cajón del ritmo II (Seguiriyas)** (22/11/2026, solo con la partitura de Jordan, sin video): compases 2/4, 2/4, 3/4, 3/4, 2/4
  (`cajonBars: [2,2,3,3,2]`), B G A G | B G A G | B G G A G G | B G G A G G | B G A G. **Suena con golpes grabados del ritmo I
  elegidos al azar según su tipo** (bajo, agudo, fantasma; sin repetir el anterior): no es una grabación exacta. Si Jordan
  manda el video, se cortan sus 24 golpes como en el I. `CajonScore` ya dibuja compases de 2 y 3 tiempos y los cambios de compás.
  **Cajón del ritmo III (Bulerías)** (22/11/2026, partitura + video `ritmo_III_pt._1.mov`): 2 compases de 3/4 en **semicorcheas** (24 golpes,
  D-I-D-I…, `cajonBars: [3,3]`): B G G A G G A G G A G G, dos veces. Los 24 golpes se cortaron del video (una vuelta, ~0,28 s por
  semicorchea) y están en `public/audio/cajon-r3.bin` (500 KB). **Bancos de muestras** (`CAJON_BANKS` en `cajonIndex.ts`, uno por ritmo con
  video): cada ritmo con banco toca sus golpes exactos; los demás (el II) eligen al azar golpes del mismo tipo de cualquier banco. Se
  descargan todos al activar la capa (~1,1 MB). El motor admite un cajón más fino que las palmas (`cajon.length / steps.length` golpes por
  paso: 2 en el III) y `CajonScore` dibuja corcheas (1 barra) o semicorcheas (2 barras); con semicorcheas se iluminan 2 golpes por paso.
  **Segundo patrón de cajón de las bulerías (III)** (22/11/2026, solo partitura, sin video): `cajonPatterns` del ritmo (`rhythms.ts`; helpers
  `cajonPatternCount` / `rhythmWithCajonPattern` / `rhythmWithPatterns`): B G G A G G B G G A G G | G A B A B G G A G G G A (bajos en
  el 12, 3, 7 y 8; el patrón 1 tiene bajos en el 12 y el 6). Selector «🪘 Patrón de cajón 1·2» bajo el de palmas, solo con el cajón
  activo y en ritmos con más de un patrón; se recuerda (`cajonPattern` en la sesión) y vuelve al 1 al cambiar de ritmo. **Suena con golpes
  grabados al azar según su tipo** (los golpes exactos del video valen solo para el patrón 1). Si Jordan manda el video, se cortan sus
  golpes como en el patrón 1 (otro banco).
  **Cajón del ritmo IV (Jaleos / Abandolaos)** (22/11/2026, base de Jordan, solo partitura, sin video): 2 compases de 3/4 en semicorcheas
  (`cajonBars: [3,3]`; los pasos de este ritmo ya son semicorcheas): B G G A G G G A G G B G, dos veces. Suena con golpes grabados al
  azar según su tipo (no hay banco propio). Si Jordan manda el video, se corta como los bancos del I y el III.
  **Cajón del ritmo V (Fandangos / Sevillanas)** (22/11/2026, base de Jordan, solo partitura, sin video): 4 compases de 3/4 en corcheas
  (`cajonBars: [3,3,3,3]`; 2 golpes de cajón por cada paso de las palmas): B G G A G G, cuatro veces. Suena con golpes grabados al azar
  según su tipo. La partitura del cajón muestra los números 1 2 3 de cada compás aunque la imagen de Jordan no los traía (coherente con
  la partitura de las palmas).
  **Cajón del ritmo VI (Tangos / Rumbas)** (24/11/2026, partitura + video `ritmo_VI_base_2.mov`): 2 compases de **4/4** en corcheas (16 golpes,
  D-I-D-I…, `cajonBars: [4,4]`): G G A B G G B G, dos veces. Los 16 golpes se cortaron del video (una vuelta, ~0,27 s por corchea, tempo algo
  irregular: se siguió cada golpe) y están en `public/audio/cajon-r6.bin` (332 KB, banco `r6` de `CAJON_BANKS`): suena **exacto**. La partitura
  une las corcheas **de a 4** (medio compás) como en la imagen de Jordan: `cajonBeamNotes: 4` (por defecto se unen las de un tiempo). Ahora los
  ritmos con cajón exacto son I, III (patrón 1) y VI; el II, el IV, el V y el patrón 2 del III suenan al azar. Se descargan todos los bancos
  al activar el cajón (~1,4 MB, una sola vez; el service worker los guarda).
  **Cajón del ritmo VIII (Tanguillos)** (23/11/2026, partitura + video `ritmo_VIII_base_1.mov`): 2 compases de **6/8** (2 tiempos de 3 corcheas,
  `cajonBars: [2,2]`, `cajonSig: '6/8'` dibuja la cifra 6/8 y el número 1 2 cada 3 golpes): B A G | G A G | B A G | A B G. **Desde el 24/11/2026 suena con los golpes del ritmo I** (`cajonSamplesFrom: 'r1'`, al azar según su tipo): los 12 golpes cortados del video `ritmo_VIII_base_1` sonaban con clics y Jordan pidió usar los del compás de 12 (se quitó el banco `r8`).
  Ritmos con cajón exacto (video propio): I, III (patrón 1) y VI. Al azar con golpes del I: el II, IV, V, VII, VIII y el patrón 2 del III.
  **Cajón del ritmo VII (Tientos / Farruca)** (23/11/2026, base de Jordan, solo partitura, sin video): 2 compases de 4/4 en semicorcheas (32 golpes,
  `cajonBars: [4,4]`): B G G G | A G B G | B G G G | A G G G, dos veces. **Desde el 24/11/2026 suena con los golpes del ritmo I** (`cajonSamplesFrom: 'r1'`: Jordan probó cortar los 32 golpes de su video `ritmo_VII_base_1` y sonaba mal; prefirió los del compás de 12, que suenan orgánicos; al azar según su tipo). `CajonScore` pone un número de la cuenta cada `cajon.length / counts.length` golpes
  (2 en I–VI, 3 en el 6/8, 4 en los Tientos). Con esto **todos los ritmos tienen cajón**.
- **Bulerías (III) — ajustes del 23/11/2026**: los círculos rojos del reloj están solo en el 12 (arriba) y el 6 (abajo), donde cae el bajo (`clockAccents: [0, 6]`);
  los acentos de las palmas (1, 3, 7 y 9) siguen en los pasos y en la partitura, sin círculo rojo. Comprobado con el audio real: metrónomo fuerte y bajo del cajón en
  el 12 y el 6, acentos de palma en 1, 3, 7 y 9. Lo que SÍ estaba corrido era la **partitura del cajón con semicorcheas**: iluminaba a la vez los 2 golpes de cada paso
  aunque el segundo suena media corchea después. Ahora el motor avisa cada golpe de cajón a su hora (`sub` en `onStep`, `activeSub` en `App.tsx`/`CajonScore`).
- **Patrones de palmas de las bulerías (III)** (24/11/2026, partituras de Jordan): ahora hay 3 («Patrón de palmas 1·2·3»): el 1 es el oficial (el del video); el 2 tiene
  acentos en el 12, 2, 4, 6, 8 y 10 (corcheas en el 12 y el 1, negras acentuadas en el 2 y el 4; igual en el 2.º compás); el 3 es el patrón 1 **más una contrapalma** en una segunda
  línea de la partitura. La contra va en `contra` del patrón (`rhythms.ts`, una posición por MEDIO paso): golpe **suave** (semicorchea, a mitad de la corchea del 1 y del 7) y golpe **fuerte**
  (corchea acentuada, en el 3 y el 9). Suena con palma de timbre contrario al elegido (sorda si las palmas son brillantes y al revés) para distinguirla: `scheduleContraAudio` en `engine.ts`.
  `MonogramScore` dibuja el ritmo III desde los pasos y la contra en una 2.ª línea; el motor avisa los medios pasos (`sub`) también cuando hay contra, para iluminarla a su hora.
- **Más patrones de palmas** (24/11/2026, partituras de Jordan): **Bulerías (III) patrón 4**: sin acentos, `R P P R P P` dos veces; la partitura dibuja corchea + silencio de corchea
  (no negra) gracias a `eighthRests: true` del patrón. **Fandangos / Sevillanas (V) patrón 2** («1 y», «2 y»): va a 2 pasos por tiempo (`stepsPerBeat: 2` dentro del patrón, 24 pasos;
  `rhythmWithPattern` lo aplica), con acento solo en el 1 de cada compás; el cajón del V sigue igual (24 golpes, 1 por paso). `MonogramScore` dibuja el V desde los pasos cuando va a 2 pasos por tiempo.
- **Jaleos / Abandolaos (IV)** (24/11/2026): igual que las bulerías, los círculos rojos del reloj están solo en el 12 (arriba) y el 6 (abajo) (`clockAccents: [0, 6]`; antes 8 círculos).
- **Limitador de salida** (24/11/2026, «clics en los graves» del Abandolaos): cuando coinciden palma acentuada + bajo del cajón + «tum» del metrónomo, la suma pasaba de 1 y el audio se
  recortaba (clic). Ahora todo el sonido sale por `out()` en `engine.ts`: un limitador suave (`tanh`, `WaveShaper`) que redondea los picos (máximo ~0,92) y casi no cambia nada por debajo de 0,5.
  Si se añade un sonido nuevo al motor, conectarlo a `this.out()` y no a `ctx.destination`.
- **Ícono del cajón** (24/11/2026): el emoji 🪘 se cambió por la imagen del cajón de Hispana (`public/cajon-emoji.png`, fondo transparente, 149×192) con el componente `CajonIcon`
  (botón «Cajón» de Ajustes de sonido, «Patrón de cajón» y el título de la partitura del cajón). El 🥁 del perfil y del rol «Percusionista» no se tocó.
- **Pantalla más minimalista** (24/11/2026): los selectores «Patrón de palmas» y «Patrón de cajón» están dentro de «Ajustes de sonido» (plegado), al final, y se quitaron los textos que explicaban cada
  patrón («Patrón oficial, el del video», etc.). Los textos `note`/`noteEn`/`cajonNote` siguen en `rhythms.ts` pero ya no se muestran.
- **Promoción de Navidad del método** (24/11/2026): del 1 al 31 de diciembre de 2026 (hora de Argentina) el menú dice «Método: Los Ritmos del Flamenco 40% OFF 🎄» (en inglés «Method: … 40% OFF 🎄»)
  y **todos** los enlaces al método (`methodUrl()` en `config.ts`) llevan `?discount_code=NAVIDAD`. Fuera de esas fechas no sale ni el texto ni el código (no hay que tocar nada en enero;
  `isChristmasPromo()` decide). Comprobar en Polar que el código `NAVIDAD` esté activo para el método en esas fechas y en los dos idiomas (ES y EN).
- **Nombre del método en inglés** (24/11/2026): en inglés el método se llama **«The Rhythm of Flamenco»** (como en el libro) en la app (menú, banner, Comunidad, recorrido, texto de compartir) y en los
  términos en inglés; en español sigue «Los Ritmos del Flamenco». El nombre de la app (`HispanApp — Los Ritmos del Flamenco`: título, manifest, vista previa) se dejó en español.
- **Entrenador progresivo** (`TrainerModal.tsx`, 23/11/2026, queja de alumnos: «los números quedaban clavados»): el campo se reponía solo
  al borrar y no se podía escribir otro valor. Ahora cada campo se puede **borrar y escribir** (se aplica en cuanto es un número
  válido y se ajusta al rango al salir), con botones − y +. Rangos: subir **1–10 BPM**, cada **1–16 vueltas** (una vuelta
  = el ritmo completo una vez), límite máximo **50–270 BPM** (de 5 en 5 con los botones). Frase resumen debajo («Cada 4 vueltas del ritmo
  sube 5 BPM, hasta 180 BPM»). Valores por defecto: +5 BPM cada 4 vueltas hasta 180. **Desde el 23/11 se quitaron los valores rápidos de la
  subida y de las vueltas** (solo − / + y el número); el máximo conserva valores rápidos 100·120·150·180·270. **El tope general de tempo de
  la app es ahora 270 BPM** (antes 250; en `App.tsx`, `engine.ts` y `session.ts`).
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
- [x] **iPhone real probado por Jordan (22/11/2026)**: registro y activación, app guardada en la pantalla de inicio y llamadas (Polar) funcionan.
- [ ] Falta probar en **Android real** (compra + app guardada) y la entrada **desde un enlace de Instagram** (navegador interno de Instagram).
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
