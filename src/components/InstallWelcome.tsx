import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, MoreVertical, X } from 'lucide-react';
import { HispanaLogo } from './HispanaLogo';
import { canPromptInstall, detectPlatform, onInstallChange, promptInstall } from '../services/install';
import { track } from '../services/analytics';
import { useLang } from '../i18n';

/**
 * Ventana de bienvenida para instalar la app. Se abre al llegar desde la web con `?instalar`.
 * - Android / Chrome: un solo botón que abre el aviso nativo de instalación.
 * - iPhone: Safari no deja instalar por código, así que una flecha señala el botón Compartir.
 */

type Browser = 'ios-safari' | 'ios-otro' | 'en-app' | 'android' | 'desktop';

function detectBrowser(): Browser {
  const ua = navigator.userAgent || '';
  if (/Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance|Line\//i.test(ua)) return 'en-app';
  const p = detectPlatform();
  if (p === 'ios') return /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua) ? 'ios-otro' : 'ios-safari';
  return p;
}

export const InstallWelcome: React.FC<{ onClose: () => void; purchase?: boolean; activated?: boolean }> = ({ onClose, purchase = false, activated = false }) => {
  const { L } = useLang();
  const [, force] = useState(0);
  const [waited, setWaited] = useState(false);
  const browser = detectBrowser();
  const canPrompt = canPromptInstall();

  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);
  // El aviso de Chrome puede tardar unos segundos; si no llega, mostrar los pasos a mano
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 4000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    track('install_welcome', { browser });
  }, [browser]);

  const install = async () => {
    const accepted = await promptInstall();
    track('install_prompt', { accepted, from: 'welcome' });
    if (accepted) onClose();
  };

  const isAndroidLike = browser === 'android' || browser === 'desktop';
  const showIosArrow = browser === 'ios-safari';
  const showTopArrow = browser === 'ios-otro';

  return (
    <div className={`fixed inset-0 z-[200] flex ${showIosArrow ? 'items-center pb-16' : 'items-end sm:items-center'} justify-center bg-black/75 backdrop-blur-sm animate-fadeIn px-0`} role="dialog" aria-modal="true" aria-labelledby="install-welcome-title">
      <div className={`relative w-full sm:max-w-md bg-[#14161C] border border-white/10 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl ${showIosArrow ? 'rounded-3xl mx-3' : 'rounded-t-3xl sm:rounded-3xl'}`}>
        <button onClick={onClose} aria-label={L('Cerrar', 'Close')} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 cursor-pointer">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-10">
          <div className="w-14 h-14 rounded-2xl bg-[#1C1E26] border border-white/10 flex items-center justify-center shrink-0">
            <HispanaLogo size="md" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E84A27]">{purchase ? (activated ? L('¡PRO activado! 🎉', 'PRO activated! 🎉') : L('¡Gracias por tu compra!', 'Thank you for your purchase!')) : L('Gratis para empezar', 'Free to start')}</p>
            <h2 id="install-welcome-title" className="font-brand text-xl font-extrabold text-white leading-tight">
              {purchase
                ? activated
                  ? L('Guárdala en tu pantalla (opcional)', 'Save it on your screen (optional)')
                  : L('Último paso: guarda la app', 'Last step: save the app')
                : L('Guarda HispanApp en tu móvil', 'Save HispanApp on your phone')}
            </h2>
          </div>
        </div>
        <p className="text-[13px] text-gray-400 leading-snug mt-3">
          {L(
            'Así la tienes en tu pantalla de inicio como cualquier app, se abre más rápido y funciona sin internet.',
            'It will sit on your home screen like any other app, open faster and work offline.'
          )}
        </p>

        {/* ANDROID / ORDENADOR: un solo botón */}
        {isAndroidLike && (
          <div className="mt-5 space-y-3">
            {canPrompt ? (
              <button onClick={install} className="w-full py-4 rounded-2xl btn-primary text-white text-base font-bold flex items-center justify-center gap-2 cursor-pointer">
                <Download className="w-5 h-5" />
                {L('Instalar HispanApp', 'Install HispanApp')}
              </button>
            ) : !waited ? (
              <div className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm font-semibold text-center">
                {L('Preparando la instalación…', 'Getting the install ready…')}
              </div>
            ) : (
              <ol className="space-y-2 text-[13px] text-gray-300 leading-snug">
                <li className="flex items-start gap-2">
                  <span className="step-num">1</span>
                  <span>
                    {L('Toca el menú', 'Tap the menu')} <MoreVertical className="inline w-4 h-4 -mt-0.5" /> {L('de arriba a la derecha.', 'at the top right.')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="step-num">2</span>
                  <span>
                    {L('Elige', 'Choose')} <strong className="text-white">{L('«Instalar aplicación»', '“Install app”')}</strong> {L('o', 'or')}{' '}
                    <strong className="text-white">{L('«Añadir a pantalla de inicio»', '“Add to Home screen”')}</strong>.
                  </span>
                </li>
              </ol>
            )}
            {canPrompt && (
              <p className="text-[11.5px] text-gray-500 text-center">{L('Después confirma con «Instalar».', 'Then confirm with “Install”.')}</p>
            )}
          </div>
        )}

        {/* IPHONE EN SAFARI: dos pasos y una flecha al botón Compartir */}
        {(showIosArrow || showTopArrow) && (
          <ol className="mt-5 space-y-2.5 text-[14px] text-gray-200 leading-snug">
            <li className="flex items-start gap-3 sub-card p-3 rounded-2xl">
              <span className="step-num">1</span>
              <span>
                {L('Toca el botón', 'Tap the')} <strong className="text-white">{L('Compartir', 'Share')}</strong>{' '}
                <Share className="inline w-4 h-4 -mt-1 text-[#4DA3FF]" />{' '}
                {showTopArrow
                  ? L('arriba a la derecha.', 'button at the top right.')
                  : L('de la barra de abajo. Si no lo ves, toca primero ••• o ≡.', 'button in the bottom bar. If you don’t see it, tap ••• or ≡ first.')}
              </span>
            </li>
            <li className="flex items-start gap-3 sub-card p-3 rounded-2xl">
              <span className="step-num">2</span>
              <span>
                {L('Elige', 'Choose')} <strong className="text-white">{L('«Agregar a inicio»', '“Add to Home Screen”')}</strong>{L(' (o «Añadir a pantalla de inicio»)', '')}{' '}
                <PlusSquare className="inline w-4 h-4 -mt-1" /> {L('y toca', 'and tap')} <strong className="text-white">{L('Agregar', 'Add')}</strong>.
              </span>
            </li>
          </ol>
        )}

        {/* DENTRO DE INSTAGRAM U OTRA APP: primero abrir en el navegador */}
        {browser === 'en-app' && (
          <div className="mt-5 rounded-2xl border border-[#E84A27]/50 bg-[#E84A27]/10 p-4 text-[13.5px] text-gray-200 leading-snug">
            <p className="font-bold text-white mb-1">{L('Primero, ábrela en tu navegador', 'First, open it in your browser')}</p>
            {L(
              'Desde Instagram no se puede guardar. Toca ••• arriba a la derecha y elige «Abrir en el navegador» (o «Abrir en Safari»).',
              'It can’t be saved from inside Instagram. Tap ••• at the top right and choose “Open in browser” (or “Open in Safari”).'
            )}
          </div>
        )}

        {/* Tras una compra: qué hacer después de guardar la app (en iPhone la clave se pega dentro de la app guardada) */}
        {purchase && !activated && (
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-[13px] text-gray-200 leading-snug">
            <p className="font-bold text-white mb-1.5">{L('Después de guardarla:', 'After saving it:')}</p>
            <ol className="space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="step-num">1</span>
                <span>{L('Ábrela desde el ícono nuevo de tu pantalla.', 'Open it from the new icon on your screen.')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="step-num">2</span>
                <span>
                  {L('Toca un ritmo con candado 🔒 y pega la clave que te llegó por email. ', 'Tap a rhythm with a lock 🔒 and paste the key you received by email. ')}
                  <strong className="text-white">{L('Tip: cópiala antes en tu correo (mantén pulsada la clave → Copiar).', 'Tip: copy it first in your email (press and hold the key → Copy).')}</strong>
                </span>
              </li>
            </ol>
          </div>
        )}

        {/* Ya activado con el botón del email: guardar la app es opcional. En iPhone la app guardada empieza vacía. */}
        {purchase && activated && (browser === 'ios-safari' || browser === 'ios-otro') && (
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-[12.5px] text-gray-300 leading-snug">
            {L(
              'Ya puedes usar HispanApp PRO aquí mismo. Si la guardas en tu pantalla, al abrirla desde el ícono te pedirá la clave de tu email. Si prefieres no complicarte, sigue en el navegador: si algún día se desactiva, toca otra vez el botón de tu email.',
              'You can use HispanApp PRO right here. If you save it on your screen, opening it from the icon will ask for the key from your email. If you’d rather keep it simple, stay in the browser: if it ever turns off, tap the button in your email again.'
            )}
          </p>
        )}

        <button onClick={onClose} className="mt-4 w-full py-2.5 text-[13px] font-semibold text-gray-400 cursor-pointer">
          {purchase && !activated ? L('Ahora no, pegar mi clave aquí', 'Not now, paste my key here') : purchase ? L('Ahora no, seguir en el navegador', 'Not now, keep using the browser') : L('Ahora no, usar en el navegador', 'Not now, use it in the browser')}
        </button>
      </div>

      {/* Flechas que señalan el botón Compartir */}
      {showIosArrow && (
        <div className="install-arrow fixed left-1/2 -translate-x-1/2 bottom-[calc(4px+env(safe-area-inset-bottom,0px))] z-[201] pointer-events-none" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#E84A27" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v16M5 12l7 7 7-7" />
          </svg>
        </div>
      )}
      {showTopArrow && (
        <div className="install-arrow-up fixed right-4 top-[calc(4px+env(safe-area-inset-top,0px))] z-[201] pointer-events-none" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E84A27" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21V5M5 12l7-7 7 7" />
          </svg>
        </div>
      )}
    </div>
  );
};
