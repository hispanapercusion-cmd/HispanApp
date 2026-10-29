/**
 * Consentimiento del usuario (privacidad, novedades por email y estadísticas).
 * Se guarda en el dispositivo y se envía junto con el registro a Firebase.
 * Si cambian la Política de privacidad o los Términos, subir CONSENT_VERSION
 * para que la app vuelva a pedir la aceptación.
 */
export const CONSENT_VERSION = '2026-10';
const KEY = 'hispanapp_consent';

export interface ConsentState {
  version: string;
  acceptedAt: string;
  marketing: boolean;
  analytics: boolean;
}

type Listener = (c: ConsentState | null) => void;
const listeners = new Set<Listener>();

export function getConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch {
    return null;
  }
}

export function hasValidConsent(): boolean {
  return getConsent()?.version === CONSENT_VERSION;
}

export function saveConsent(prefs: { marketing: boolean; analytics: boolean }): ConsentState {
  const c: ConsentState = {
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    marketing: prefs.marketing,
    analytics: prefs.analytics,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(c));
  } catch {
    // Almacenamiento bloqueado: se usa solo durante esta sesión
  }
  listeners.forEach((l) => l(c));
  return c;
}

export function onConsentChange(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
