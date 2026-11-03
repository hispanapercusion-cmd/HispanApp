import React, { useEffect, useState } from 'react';
import { Download, CheckCircle2, Share, PlusSquare, MoreVertical } from 'lucide-react';
import { canPromptInstall, detectPlatform, isStandalone, onInstallChange, promptInstall } from '../services/install';
import { track } from '../services/analytics';
import { useLang } from '../i18n';

/** Tarjeta "Instala HispanApp": explica qué es instalar y ofrece el botón o los pasos según el dispositivo */
export const InstallCard: React.FC = () => {
  const { L } = useLang();
  const [, force] = useState(0);
  const [showSteps, setShowSteps] = useState(false);
  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);

  const installed = isStandalone();
  const platform = detectPlatform();
  const canPrompt = canPromptInstall();

  if (installed) {
    return (
      <div className="sub-card p-4 rounded-2xl flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <p className="text-[12px] text-gray-300">{L('Ya estás usando HispanApp instalada en tu dispositivo. ¡Perfecto!', 'You are already using HispanApp installed on your device. Perfect!')}</p>
      </div>
    );
  }

  const onClick = async () => {
    if (canPrompt) {
      const accepted = await promptInstall();
      track('install_prompt', { accepted });
    } else {
      setShowSteps((s) => !s);
      track('install_steps', { platform });
    }
  };

  return (
    <div className="sub-card p-4 rounded-2xl space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white">📲 {L('Instala HispanApp en tu', 'Install HispanApp on your')} {platform === 'desktop' ? L('ordenador', 'computer') : L('móvil', 'phone')}</p>
          <p className="text-[11.5px] text-gray-400 leading-snug mt-0.5">
            {L('Tendrás HispanApp como una app más en tu pantalla de inicio: se abre a pantalla completa, más rápido y', 'HispanApp will sit on your home screen like any other app: it opens full screen, faster and')}
            <strong className="text-gray-200"> {L('funciona sin internet', 'works offline')}</strong>.{' '}
            {L('Ocupa muy poco espacio y no necesitas ninguna tienda de apps.', 'It takes very little space and you do not need any app store.')}
          </p>
        </div>
      </div>

      <button
        onClick={onClick}
        className="w-full py-2.5 rounded-xl btn-primary text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>{canPrompt ? L('Instalar HispanApp', 'Install HispanApp') : showSteps ? L('Ocultar los pasos', 'Hide the steps') : L('Cómo instalarla', 'How to install it')}</span>
      </button>

      {showSteps && !canPrompt && (
        <ol className="space-y-2 text-[12px] text-gray-300 leading-snug animate-fadeIn">
          {platform === 'ios' ? (
            <>
              <li className="flex items-start gap-2">
                <span className="step-num">1</span>
                <span>{L('Abre HispanApp en', 'Open HispanApp in')} <strong className="text-white">Safari</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="step-num">2</span>
                <span>
                  {L('Toca el botón', 'Tap the')} <strong className="text-white">{L('Compartir', 'Share')}</strong>{' '}
                  <Share className="inline w-3.5 h-3.5 -mt-0.5 text-[#4DA3FF]" /> {L('(abajo o arriba de la pantalla).', 'button (at the bottom or top of the screen).')}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="step-num">3</span>
                <span>
                  {L('Elige', 'Choose')} <strong className="text-white">{L('«Añadir a pantalla de inicio»', '“Add to Home Screen”')}</strong>{' '}
                  <PlusSquare className="inline w-3.5 h-3.5 -mt-0.5" /> {L('y pulsa', 'and tap')} <strong className="text-white">{L('Añadir', 'Add')}</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="step-num">4</span>
                <span>
                  {L(
                    'Abre HispanApp desde el icono nuevo. Si eres PRO, escribe ahí tu clave o código una vez más (el iPhone guarda los datos de la app instalada aparte de Safari).',
                    'Open HispanApp from the new icon. If you are PRO, enter your key or code there once more (the iPhone keeps the installed app’s data separate from Safari).'
                  )}
                </span>
              </li>
            </>
          ) : platform === 'android' ? (
            <>
              <li className="flex items-start gap-2">
                <span className="step-num">1</span>
                <span>{L('Abre HispanApp en', 'Open HispanApp in')} <strong className="text-white">Chrome</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="step-num">2</span>
                <span>
                  {L('Toca el menú', 'Tap the menu')} <MoreVertical className="inline w-3.5 h-3.5 -mt-0.5" /> {L('(arriba a la derecha).', '(top right).')}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="step-num">3</span>
                <span>
                  {L('Elige', 'Choose')} <strong className="text-white">{L('«Instalar aplicación»', '“Install app”')}</strong> {L('o', 'or')} <strong className="text-white">{L('«Añadir a pantalla de inicio»', '“Add to Home screen”')}</strong>.
                </span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-2">
                <span className="step-num">1</span>
                <span>{L('Abre HispanApp en', 'Open HispanApp in')} <strong className="text-white">Chrome</strong> {L('o', 'or')} <strong className="text-white">Edge</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="step-num">2</span>
                <span>
                  {L('Pulsa el icono de instalar', 'Click the install icon')} <Download className="inline w-3.5 h-3.5 -mt-0.5" /> {L('en la barra de direcciones, o el menú', 'in the address bar, or the menu')}{' '}
                  <MoreVertical className="inline w-3.5 h-3.5 -mt-0.5" /> → <strong className="text-white">{L('«Instalar HispanApp»', '“Install HispanApp”')}</strong>.
                </span>
              </li>
            </>
          )}
        </ol>
      )}
    </div>
  );
};
