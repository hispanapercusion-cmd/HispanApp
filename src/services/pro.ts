import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { APP_CONFIG } from '../config';
import { L } from '../i18n';

/**
 * Comprueba un código PRO de verdad, sin listas guardadas dentro de la app:
 * - Las claves de licencia de Polar (empiezan por HISPANAPP-, p. ej. HISPANAPP-XXXXXXXX-XXXX-…) se validan con la
 *   API pública de licencias de Polar (no lleva ningún token secreto: solo la clave y el ID de la organización).
 * - Las claves antiguas de Lemon Squeezy (formato UUID XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX) se siguen aceptando
 *   mientras Lemon exista (cierra el 31/3/2027).
 * - El resto se busca en Firestore, en la colección "codigos_pro" (un documento por código,
 *   con el código en MAYÚSCULAS como ID). Las reglas de Firestore solo permiten leer un
 *   código concreto, nunca la lista entera.
 */

export type ProCheckResult =
  | { ok: true; source: 'polar' | 'lemon' | 'alumno'; buyer?: { name: string; email: string } | null }
  | { ok: false; reason: 'invalid' | 'unavailable' };

const LEMON_KEY_PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

export function isLemonLicenseKey(code: string): boolean {
  return LEMON_KEY_PATTERN.test(code.trim());
}

/** Clave de Polar: el prefijo de HispanApp PRO seguido de un guion y el resto (letras, números y guiones) */
export function isPolarLicenseKey(code: string): boolean {
  const prefix = APP_CONFIG.polarKeyPrefix.toUpperCase();
  return new RegExp(`^${prefix}-[A-Z0-9][A-Z0-9-]{5,80}$`, 'i').test(code.trim());
}

/** Saca la clave de un texto pegado (por si se copió de más): primero la de Polar, luego la UUID de Lemon */
export function extractLicenseKey(text: string): string | null {
  const prefix = APP_CONFIG.polarKeyPrefix.toUpperCase();
  const polar = text.match(new RegExp(`${prefix}-[A-Z0-9][A-Z0-9-]{5,80}`, 'i'));
  if (polar) return polar[0];
  const lemon = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return lemon ? lemon[0] : null;
}

async function verifyPolarLicense(key: string): Promise<ProCheckResult> {
  let res: Response;
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
  try {
    res = await fetch(APP_CONFIG.polarLicenseApiUrl, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, organization_id: APP_CONFIG.polarOrganizationId }),
      signal: ctrl?.signal,
    });
  } catch (err) {
    console.warn('[PRO] No se pudo contactar con Polar:', err);
    return { ok: false, reason: 'unavailable' };
  } finally {
    if (timer) clearTimeout(timer);
  }

  // Polar responde 404 cuando la clave no existe (o no es de esta organización) y 422 si el formato es raro
  if (res.status === 404 || res.status === 422) return { ok: false, reason: 'invalid' };
  // Cualquier otro fallo (límite de uso, caída del servicio…) no es culpa de la clave: pedir reintentar
  if (!res.ok) return { ok: false, reason: 'unavailable' };

  let data: any;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  const granted = data?.status === 'granted';
  const notExpired = !data?.expires_at || new Date(data.expires_at).getTime() > Date.now();
  const sameOrg = !data?.organization_id || data.organization_id === APP_CONFIG.polarOrganizationId;
  // Solo claves del beneficio de HispanApp PRO (no las de otro producto de la tienda, si algún día las hay)
  const sameBenefit = !APP_CONFIG.polarProBenefitId || !data?.benefit_id || data.benefit_id === APP_CONFIG.polarProBenefitId;
  if (!(granted && notExpired && sameOrg && sameBenefit)) return { ok: false, reason: 'invalid' };
  // Polar devuelve también el nombre y el email del comprador: sirven para rellenar el registro (app recién guardada)
  const name = typeof data?.customer?.name === 'string' ? data.customer.name.trim() : '';
  const email = typeof data?.customer?.email === 'string' ? data.customer.email.trim() : '';
  return { ok: true, source: 'polar', buyer: name || email ? { name, email } : null };
}

async function verifyLemonLicense(key: string): Promise<ProCheckResult> {
  let data: any;
  try {
    const res = await fetch(APP_CONFIG.lemonLicenseApiUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ license_key: key }).toString(),
    });
    data = await res.json();
  } catch (err) {
    console.warn('[PRO] No se pudo contactar con Lemon Squeezy:', err);
    return { ok: false, reason: 'unavailable' };
  }

  const status = data?.license_key?.status;
  const statusOk = status === 'active' || status === 'inactive';
  const storeOk = !APP_CONFIG.lemonStoreId || data?.meta?.store_id === APP_CONFIG.lemonStoreId;

  if (data?.valid === true && statusOk && storeOk) {
    return { ok: true, source: 'lemon' };
  }
  return { ok: false, reason: 'invalid' };
}

async function verifyStudentCode(code: string): Promise<ProCheckResult> {
  const id = code.trim().toUpperCase();
  // Los IDs de Firestore no admiten "/" y no tiene sentido buscar códigos vacíos o enormes
  if (!id || id.length > 64 || id.includes('/')) {
    return { ok: false, reason: 'invalid' };
  }

  try {
    const snap = await getDoc(doc(db, 'codigos_pro', id));
    if (snap.exists() && snap.data()?.activo !== false) {
      return { ok: true, source: 'alumno' };
    }
    return { ok: false, reason: 'invalid' };
  } catch (err) {
    console.warn('[PRO] No se pudo comprobar el código en Firebase:', err);
    return { ok: false, reason: 'unavailable' };
  }
}

export async function verifyProCode(raw: string): Promise<ProCheckResult> {
  const code = raw.trim();
  if (!code) return { ok: false, reason: 'invalid' };
  if (isPolarLicenseKey(code)) return verifyPolarLicense(code);
  if (isLemonLicenseKey(code)) return verifyLemonLicense(code);
  return verifyStudentCode(code);
}

export function proErrorMessage(result: ProCheckResult): string {
  if (result.ok) return '';
  return result.reason === 'unavailable'
    ? L('No se pudo comprobar el código. Revisa tu conexión e inténtalo de nuevo.', 'The code could not be checked. Check your connection and try again.')
    : L('Código no válido. Revisa que esté bien escrito.', 'Invalid code. Check that it is typed correctly.');
}
