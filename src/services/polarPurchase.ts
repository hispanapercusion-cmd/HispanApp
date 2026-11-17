import { APP_CONFIG } from '../config';
import { isPolarLicenseKey } from './pro';

/**
 * Tras pagar, Polar devuelve al comprador a la app con un pase temporal suyo (`customer_session_token`).
 * Con ese pase (que es del comprador, no un secreto nuestro) se leen, en su nombre, su clave de licencia y sus datos:
 * así la app puede activar el PRO y saludarlo sin que tenga que copiar nada del email.
 * La clave tarda unos segundos en generarse después del pago, por eso se reintenta.
 */

export interface PolarPurchase {
  key: string | null;
  name: string;
  email: string;
  /** 'ok' = clave encontrada · 'pending' = no apareció a tiempo · 'unauthorized' = el pase no sirve · 'error' = fallo de red */
  status: 'ok' | 'pending' | 'unauthorized' | 'error';
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      resolve();
    });
  });

async function getJson(path: string, token: string, signal?: AbortSignal): Promise<{ status: number; data: any }> {
  const res = await fetch(`${APP_CONFIG.polarApiUrl}${path}`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    signal,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // Sin cuerpo
  }
  return { status: res.status, data };
}

export async function fetchPolarPurchase(
  token: string,
  opts: { signal?: AbortSignal; attempts?: number; delayMs?: number } = {}
): Promise<PolarPurchase> {
  const { signal, attempts = 10, delayMs = 1500 } = opts;
  const out: PolarPurchase = { key: null, name: '', email: '', status: 'pending' };

  // Datos del comprador (si falla, no pasa nada: solo no se le saluda por su nombre)
  try {
    const me = await getJson('/customer-portal/customers/me', token, signal);
    if (me.status === 401 || me.status === 403) return { ...out, status: 'unauthorized' };
    if (me.status === 200) {
      out.name = typeof me.data?.name === 'string' ? me.data.name.trim() : '';
      out.email = typeof me.data?.email === 'string' ? me.data.email.trim() : '';
    }
  } catch {
    // Seguir: lo importante es la clave
  }

  for (let i = 0; i < attempts; i++) {
    if (signal?.aborted) return out;
    try {
      const r = await getJson('/customer-portal/license-keys/?limit=20', token, signal);
      if (r.status === 401 || r.status === 403) return { ...out, status: 'unauthorized' };
      if (r.status === 200) {
        const items: any[] = Array.isArray(r.data?.items) ? r.data.items : [];
        const found = items.find((k) => k?.status === 'granted' && typeof k?.key === 'string' && isPolarLicenseKey(k.key));
        if (found) return { ...out, key: found.key, status: 'ok' };
      }
    } catch {
      if (signal?.aborted) return out;
      out.status = 'error';
    }
    if (i < attempts - 1) await sleep(delayMs, signal);
  }
  return out;
}
