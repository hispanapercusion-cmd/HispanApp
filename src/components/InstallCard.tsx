import React, { useEffect, useState } from 'react';
import { Download, CheckCircle2, Share, PlusSquare, MoreVertical } from 'lucide-react';
import { canPromptInstall, detectPlatform, isStandalone, onInstallChange, promptInstall } from '../services/install';
import { track } from '../services/analytics';

/** Tarjeta "Instala HispanApp": explica qué es instalar y ofrece el botón o los pasos según el dispositivo */
export const InstallCard: React.FC = () => {
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
        <p className="text-[12px] text-gray-300">Ya estás usando HispanApp instalada en tu dispositivo. ¡Perfecto!</p>
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
          <p className="text-xs font-semibold text-white">📲 Instala HispanApp en tu {platform === 'desktop' ? 'ordenador' : 'móvil'}</p>
          <p className="text-[11.5px] text-gray-400 leading-snug mt-0.5">
            Tendrás HispanApp como una app más en tu pantalla de inicio: se abre a pantalla completa, más rápido y
            <strong className="text-gray-200"> funciona sin internet</strong>. Ocupa muy poco espacio y no necesitas
            ninguna tienda de apps.
          </p>
        </div>
      </div>

      <button
        onClick={onClick}
        className="w-full py-2.5 rounded-xl btn-primary text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>{canPrompt ? 'Instalar HispanApp' : showSteps ? 'Ocultar los pasos' : 'Cómo instalarla'}</span>
      </button>

      {showSteps && !canPrompt && (
        <ol className="space-y-2 text-[12px] text-gray-300 leading-snug animate-fadeIn">
          {platform === 'ios' ? (
            <>
              <li className="flex items-start gap-2">
                <span className="step-num">1</span>
                <span>Abre HispanApp en <strong className="text-white">Safari</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="step-num">2</span>
                <span>
                  Toca el botón <strong className="text-white">Compartir</strong>{' '}
                  <Share className="inline w-3.5 h-3.5 -mt-0.5 text-[#4DA3FF]" /> (abajo o arriba de la pantalla).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="step-num">3</span>
                <span>
                  Elige <strong className="text-white">«Añadir a pantalla de inicio»</strong>{' '}
                  <PlusSquare className="inline w-3.5 h-3.5 -mt-0.5" /> y pulsa <strong className="text-white">Añadir</strong>.
                </span>
              </li>
            </>
          ) : platform === 'android' ? (
            <>
              <li className="flex items-start gap-2">
                <span className="step-num">1</span>
                <span>Abre HispanApp en <strong className="text-white">Chrome</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="step-num">2</span>
                <span>
                  Toca el menú <MoreVertical className="inline w-3.5 h-3.5 -mt-0.5" /> (arriba a la derecha).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="step-num">3</span>
                <span>
                  Elige <strong className="text-white">«Instalar aplicación»</strong> o <strong className="text-white">«Añadir a pantalla de inicio»</strong>.
                </span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-2">
                <span className="step-num">1</span>
                <span>Abre HispanApp en <strong className="text-white">Chrome</strong> o <strong className="text-white">Edge</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="step-num">2</span>
                <span>
                  Pulsa el icono de instalar <Download className="inline w-3.5 h-3.5 -mt-0.5" /> en la barra de direcciones, o el menú
                  <MoreVertical className="inline w-3.5 h-3.5 -mt-0.5" /> → <strong className="text-white">«Instalar HispanApp»</strong>.
                </span>
              </li>
            </>
          )}
        </ol>
      )}
    </div>
  );
};
