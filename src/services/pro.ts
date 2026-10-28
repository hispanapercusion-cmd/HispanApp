import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { APP_CONFIG } from '../config';

/**
 * Comprueba un código PRO de verdad, sin listas guardadas dentro de la app:
 * - Las claves de licencia de Lemon Squeezy (formato XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
 *   se validan con la License API de Lemon.
 * - El resto se busca en Firestore, en la colección "codigos_pro" (un documento por código,
 *   con el código en MAYÚSCULAS como ID). Las reglas de Firestore solo permiten leer un
 *   código concreto, nunca la lista entera.
 */

export type ProCheckResult =
  | { ok: true; source: 'lemon' | 'alumno' }
  | { ok: false; reason: 'invalid' | 'unavailable' };

const LEMON_KEY_PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

export function isLemonLicenseKey(code: string): boolean {
  return LEMON_KEY_PATTERN.test(code.trim());
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
  return isLemonLicenseKey(code) ? verifyLemonLicense(code) : verifyStudentCode(code);
}

export function proErrorMessage(result: ProCheckResult): string {
  if (result.ok) return '';
  return result.reason === 'unavailable'
    ? 'No se pudo comprobar el código. Revisa tu conexión e inténtalo de nuevo.'
    : 'Código no válido. Revisa que esté bien escrito.';
}
