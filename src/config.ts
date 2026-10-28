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
}

export const APP_CONFIG: AppConfig = {
  patreonUrl: "https://www.patreon.com/HispanaPercusion?utm_campaign=creatorshare_creator",
  hotmartPackUrl: "https://pay.hotmart.com/R82880037W",
  lemonSqueezyUrl: "https://hispanapercusion.lemonsqueezy.com/checkout/buy/f3479c51-4a7d-46cf-9326-66280e31926e",
  whatsappUrl: "https://wa.me/541132025842",
  lemonLicenseApiUrl: "https://api.lemonsqueezy.com/v1/licenses/validate",
  lemonStoreId: null,
  leadWebhookUrl: "",
};

