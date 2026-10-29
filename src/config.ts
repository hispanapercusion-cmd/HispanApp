export interface AppConfig {
  patreonUrl: string;
  hotmartPackUrl: string;
  lemonSqueezyUrl: string;
  whatsappUrl: string;
  /** Dirección para validar claves de licencia de Lemon Squeezy */
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

export const APP_CONFIG: AppConfig = {
  patreonUrl: "https://www.patreon.com/HispanaPercusion?utm_campaign=creatorshare_creator",
  hotmartPackUrl: "https://pay.hotmart.com/R82880037W",
  // Campaña de lanzamiento: el cupón FLAMENCO se aplica solo (24,99 → 14,99 USD).
  // Cuando termine la campaña, borrar desde "?checkout" para volver al precio normal.
  lemonSqueezyUrl: "https://hispanapercusion.lemonsqueezy.com/checkout/buy/f3479c51-4a7d-46cf-9326-66280e31926e?checkout%5Bdiscount_code%5D=FLAMENCO",
  whatsappUrl: "https://wa.me/541132025842",
  lemonLicenseApiUrl: "https://api.lemonsqueezy.com/v1/licenses/validate",
  lemonStoreId: null,
  leadWebhookUrl: "",
  contactEmail: "hispanapercusion@gmail.com",
  privacyUrl: "./legal/privacidad.html",
  termsUrl: "./legal/terminos.html",
  withdrawalUrl: "./legal/arrepentimiento.html",
};

