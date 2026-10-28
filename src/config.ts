export interface AppConfig {
  patreonUrl: string;
  hotmartPackUrl: string;
  lemonSqueezyUrl: string;
  whatsappUrl: string;
  proSecretCodes: string[];
  leadWebhookUrl: string;
}

export const APP_CONFIG: AppConfig = {
  patreonUrl: "https://www.patreon.com/HispanaPercusion?utm_campaign=creatorshare_creator",
  hotmartPackUrl: "https://pay.hotmart.com/R82880037W",
  lemonSqueezyUrl: "https://hispanapercusion.lemonsqueezy.com/checkout/buy/f3479c51-4a7d-46cf-9326-66280e31926e",
  whatsappUrl: "https://wa.me/541132025842",
  proSecretCodes: [
    "HISPANA-PRO",
    "PRO",
    "JORDAN",
    "FLAMENCO",
    "LRDF",
    "METODO",
    "ALUMNO",
    "VIP",
    "LEMON",
    "COMPAS",
    "HISPANAPP-PRO"
  ],
  leadWebhookUrl: "",
};

