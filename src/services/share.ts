/**
 * Compartir HispanApp.
 * Por seguridad, el enlace es siempre el de la app "limpio": se quitan todos los parámetros
 * de la dirección actual (como ?acceso= o ?license_key=), así nunca se comparte un código PRO.
 */

export function getShareUrl(): string {
  const { origin, pathname } = window.location;
  // Quedarse con la carpeta de la app (p. ej. /HispanApp/), sin páginas internas ni parámetros
  const base = pathname.replace(/[^/]*$/, '');
  return `${origin}${base}?utm_source=compartir&utm_medium=app`;
}

export const SHARE_TITLE = 'HispanApp — Los Ritmos del Flamenco';

export function getShareText(): string {
  return (
    '🎶 Te recomiendo HispanApp, la app para practicar palmas y compás flamenco con el método ' +
    '«Los Ritmos del Flamenco» de Jordan Migues: partituras, metrónomo y palmas reales. ' +
    'Ideal para guitarristas, bailaoras, cantaores y percusionistas. Es gratis para empezar:'
  );
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/** Abre el menú de compartir del móvil. Devuelve false si el usuario lo cancela o no está disponible. */
export async function nativeShare(): Promise<boolean> {
  if (!canUseNativeShare()) return false;
  try {
    await navigator.share({ title: SHARE_TITLE, text: getShareText(), url: getShareUrl() });
    return true;
  } catch {
    return false;
  }
}

export function whatsappShareUrl(): string {
  return `https://wa.me/?text=${encodeURIComponent(`${getShareText()} ${getShareUrl()}`)}`;
}

export async function copyShareLink(): Promise<boolean> {
  const text = `${getShareText()} ${getShareUrl()}`;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
