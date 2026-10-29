import type { Analytics } from 'firebase/analytics';
import { app } from './firebase';
import { getConsent, onConsentChange } from './consent';

/**
 * Estadísticas de uso (Google Analytics de Firebase).
 * Solo se activan si el alumno lo permite (casilla "estadísticas" del registro o de Tu perfil),
 * y solo en la versión publicada. Sin permiso no se envía nada.
 */

let analytics: Analytics | null = null;
let starting: Promise<void> | null = null;
let mod: typeof import('firebase/analytics') | null = null;
// Eventos que llegan mientras las estadísticas se están activando
const queue: [string, Record<string, string | number | boolean> | undefined][] = [];

async function start() {
  if (analytics || starting) return starting ?? undefined;
  starting = (async () => {
    try {
      mod = await import('firebase/analytics');
      if (!(await mod.isSupported())) return;
      mod.setConsent({
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      analytics = mod.initializeAnalytics(app, { config: { anonymize_ip: true } });
      queue.splice(0).forEach(([n, p]) => track(n, p));
    } catch (err) {
      console.warn('[Estadísticas] No se pudieron activar:', err);
    }
  })();
  return starting;
}

function stop() {
  if (!analytics || !mod) return;
  try {
    mod.setAnalyticsCollectionEnabled(analytics, false);
    mod.setConsent({ analytics_storage: 'denied' });
  } catch {
    // Ignorar
  }
}

function resume() {
  if (!analytics || !mod) return;
  try {
    mod.setConsent({ analytics_storage: 'granted' });
    mod.setAnalyticsCollectionEnabled(analytics, true);
  } catch {
    // Ignorar
  }
}

/** Llamar una vez al arrancar la app */
export function initAnalytics() {
  if (!import.meta.env.PROD) return;
  if (getConsent()?.analytics) start();
  onConsentChange((c) => {
    if (c?.analytics) {
      if (analytics) resume();
      else start();
    } else {
      stop();
    }
  });
}

/** Registra un evento (no hace nada si las estadísticas no están permitidas) */
export function track(name: string, params?: Record<string, string | number | boolean>) {
  if (!getConsent()?.analytics) return;
  if (!analytics || !mod) {
    if (starting && queue.length < 30) queue.push([name, params]);
    return;
  }
  try {
    mod.logEvent(analytics, name, params);
  } catch {
    // Ignorar
  }
}
