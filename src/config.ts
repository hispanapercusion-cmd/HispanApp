export interface AppConfig {
  patreonUrl: string;
  hotmartPackUrl: string;
  /** Enlace de compra de HispanApp PRO en Polar (pago único) */
  polarCheckoutUrl: string;
  /** Polar: dirección base de la API pública */
  polarApiUrl: string;
  /** Polar: dirección pública (sin token secreto) para validar claves de licencia */
  polarLicenseApiUrl: string;
  /** Polar: ID de la organización (público). Solo se aceptan claves de esta organización */
  polarOrganizationId: string;
  /** Polar: las claves de HispanApp PRO empiezan con este prefijo (HISPANAPP-xxxxxxxx-…) */
  polarKeyPrefix: string;
  /** Polar: beneficio «clave de licencia» de HispanApp PRO (público). Solo se aceptan claves de este beneficio */
  polarProBenefitId: string;
  /** Polar: portal del cliente (ahí ve sus compras y su clave; entra con su email) */
  polarPortalUrl: string;
  whatsappUrl: string;
  /** Lemon Squeezy (cierra el 31/3/2027): solo para seguir aceptando claves viejas. Dirección para validarlas */
  lemonLicenseApiUrl: string;
  /** ID de tu tienda en Lemon Squeezy: solo se aceptan licencias de esta tienda (null = sin comprobar) */
  lemonStoreId: number | null;
  leadWebhookUrl: string;
  /** Email de contacto para privacidad, borrado de datos y arrepentimiento */
  contactEmail: string;
  /** Páginas legales (relativas a la app) */
  privacyUrl: string;
  termsUrl: string;
  withdrawalUrl: string;
}

import type { Lang } from './i18n';

/** Método «Los Ritmos del Flamenco» en Polar (antes Lemon Squeezy, que cierra), en el idioma de la app */
export const METHOD_URL_ES = 'https://buy.polar.sh/polar_cl_07edvA7aQWmvePFyX5snNynGdxrVyfQclEplo3QB2Cp';
export const METHOD_URL_EN = 'https://buy.polar.sh/polar_cl_lQaF5zQalYUW89kdwtzgyIG9P52RZcwUcc6Te2bisvP';
// Cupón de lanzamiento (40 %: 24,99 → 14,99 USD): del 1 al 31 de diciembre de 2026, hora de Argentina (UTC-3).
// Dentro de esas fechas el enlace de compra lo lleva escrito; fuera de ellas no se añade (así no hace falta
// tocar el código en enero).
const LAUNCH_CODE = 'FLAMENCO';
const LAUNCH_FROM = Date.UTC(2026, 11, 1, 3, 0, 0);
const LAUNCH_TO = Date.UTC(2027, 0, 1, 3, 0, 0);

/** Enlace de compra de HispanApp PRO (con el cupón de lanzamiento solo mientras dura la campaña) */
export const proCheckoutUrl = (now: number = Date.now()): string => {
  if (now < LAUNCH_FROM || now >= LAUNCH_TO) return APP_CONFIG.polarCheckoutUrl;
  const sep = APP_CONFIG.polarCheckoutUrl.includes('?') ? '&' : '?';
  return `${APP_CONFIG.polarCheckoutUrl}${sep}discount_code=${LAUNCH_CODE}`;
};

/** Enlace de WhatsApp con el mensaje ya escrito (así sabemos de qué trata y suena más profesional) */
export const whatsappLink = (lang: Lang, topic: 'support' | 'access' = 'support'): string => {
  const es = {
    support: 'Hola Hispana Percusión 👋 Necesito ayuda con HispanApp.',
    access: 'Hola Hispana Percusión 👋 Necesito ayuda para activar mi acceso PRO de HispanApp. Mi email de compra es: ',
  };
  const en = {
    support: 'Hello Hispana Percusión 👋 I need help with HispanApp.',
    access: 'Hello Hispana Percusión 👋 I need help activating my HispanApp PRO access. My purchase email is: ',
  };
  const text = (lang === 'en' ? en : es)[topic];
  return `${APP_CONFIG.whatsappUrl}?text=${encodeURIComponent(text)}`;
};

/** ¿Estamos en la campaña de Navidad (1 al 31 de diciembre de 2026, hora de Argentina)? */
export const isChristmasPromo = (now: number = Date.now()): boolean => now >= LAUNCH_FROM && now < LAUNCH_TO;

// Descuento del método «Los Ritmos del Flamenco» (40 %: −39,91 USD → 59,99 USD), creado en Polar con el código NAVIDAD
const METHOD_CODE = 'NAVIDAD';

/** Enlace de compra del método en el idioma de la app (con el descuento de Navidad solo mientras dura la campaña) */
export const methodUrl = (lang: Lang, now: number = Date.now()): string => {
  const base = lang === 'en' ? METHOD_URL_EN : METHOD_URL_ES;
  if (!isChristmasPromo(now)) return base;
  return `${base}${base.includes('?') ? '&' : '?'}discount_code=${METHOD_CODE}`;
};

/** Páginas legales en el idioma de la app */
export const legalUrl = (doc: 'privacy' | 'terms' | 'withdrawal', lang: Lang): string => {
  if (lang === 'en') return { privacy: './legal/en/privacy.html', terms: './legal/en/terms.html', withdrawal: './legal/en/withdrawal.html' }[doc];
  return { privacy: APP_CONFIG.privacyUrl, terms: APP_CONFIG.termsUrl, withdrawal: APP_CONFIG.withdrawalUrl }[doc];
};

export const APP_CONFIG: AppConfig = {
  patreonUrl: "https://www.patreon.com/HispanaPercusion?utm_campaign=creatorshare_creator",
  hotmartPackUrl: "https://pay.hotmart.com/R82880037W",
  // HispanApp PRO en Polar (pago único 24,99 USD). El cupón de lanzamiento se añade solo en diciembre: ver proCheckoutUrl().
  polarCheckoutUrl: "https://buy.polar.sh/polar_cl_3r6SACAjkFbKaOOz2VOxPNQr4Dsc5hQMWeoKF3JEOkd",
  polarApiUrl: "https://api.polar.sh/v1",
  polarLicenseApiUrl: "https://api.polar.sh/v1/customer-portal/license-keys/validate",
  polarOrganizationId: "c37ce4bd-247b-4a69-89ae-4993bac1a594",
  polarKeyPrefix: "HISPANAPP",
  polarProBenefitId: "8cdd5159-b54a-41d4-bb4f-3152d6955fe6",
  polarPortalUrl: "https://polar.sh/hispana-percusion/portal",
  whatsappUrl: "https://wa.me/541132025842",
  lemonLicenseApiUrl: "https://api.lemonsqueezy.com/v1/licenses/validate",
  lemonStoreId: null,
  leadWebhookUrl: "",
  contactEmail: "info@hispanapercusion.com",
  privacyUrl: "./legal/privacidad.html",
  termsUrl: "./legal/terminos.html",
  withdrawalUrl: "./legal/arrepentimiento.html",
};

