import React, { useState } from 'react';
import { X, ExternalLink, Sparkles, AlertCircle, MessageCircle } from 'lucide-react';
import { HispanaLogo } from './HispanaLogo';
import { APP_CONFIG } from '../config';
import { ProCheckResult, proErrorMessage } from '../services/pro';
import { RecoverAccessInfo } from './RecoverAccessInfo';
import { LegalLinks } from './LegalLinks';
import { track } from '../services/analytics';
import { useLang } from '../i18n';

interface ProUnlockModalProps {
  isOpen: boolean;
  /** Mensaje opcional encima del formulario (p. ej. al volver de la compra) */
  notice?: string | null;
  /** Se abrió por una compra ya hecha: no ofrecer comprar y centrar todo en pegar la clave */
  purchased?: boolean;
  onClose: () => void;
  onActivate: (code: string) => Promise<ProCheckResult>;
  onSuccess: () => void;
}

export const ProUnlockModal: React.FC<ProUnlockModalProps> = ({
  isOpen,
  notice,
  purchased = false,
  onClose,
  onActivate,
  onSuccess,
}) => {
  const { L } = useLang();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (!isOpen) return null;

  const validate = async (value: string) => {
    if (!value.trim() || checking) return;
    setChecking(true);
    setError(null);
    const result = await onActivate(value);
    setChecking(false);
    if (result.ok) {
      setCode('');
      onSuccess();
    } else {
      setError(proErrorMessage(result));
    }
  };

  const handleValidateCode = (e: React.FormEvent) => {
    e.preventDefault();
    validate(code);
  };

  // "Pegar y activar": lee lo último copiado (la clave del email) y la comprueba en un toque.
  // El teléfono puede mostrar un pequeño aviso «Pegar»: hay que tocarlo.
  const canPaste = typeof navigator !== 'undefined' && !!navigator.clipboard && typeof navigator.clipboard.readText === 'function';
  const pasteAndActivate = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      const uuid = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      const value = (uuid ? uuid[0] : text).slice(0, 64);
      if (!value) {
        setError(L('No hay nada copiado. Copia la clave de tu email y vuelve a tocar el botón.', 'Nothing copied yet. Copy the key from your email and tap the button again.'));
        return;
      }
      setCode(value);
      await validate(value);
    } catch {
      setError(L('No se pudo pegar. Mantén pulsado el cuadro de abajo y elige «Pegar».', 'Could not paste. Press and hold the box below and choose “Paste”.'));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="modal-panel rounded-3xl max-w-sm w-full max-h-[92vh] overflow-y-auto p-5 shadow-2xl text-white space-y-4 relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 icon-btn btn-3d text-gray-400 hover:text-white cursor-pointer"
          title={L('Cerrar', 'Close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado Minimalista */}
        <div className="flex items-center gap-3">
          <HispanaLogo size="md" />
          <div>
            <span className="font-brand text-[9.5px] tracking-[0.2em] uppercase text-[#E84A27] font-bold block flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> {L('Versión PRO', 'PRO version')}
            </span>
            <h3 className="font-serif text-lg font-bold leading-tight text-white">
              {purchased ? L('Activa tu PRO', 'Activate your PRO') : L('Desbloquea los 8 Ritmos', 'Unlock all 8 rhythms')}
            </h3>
          </div>
        </div>

        {!purchased && (
          <p className="text-xs text-gray-300 leading-relaxed font-sans">
            {L('Accede a la colección completa de compases del método, videos demostrativos y el entrenador progresivo.', 'Get the full collection of rhythms from the method, demo videos (in Spanish) and the progressive trainer.')}
          </p>
        )}

        {notice && (
          <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 leading-relaxed">
            {notice}
          </div>
        )}

        {!purchased && (
          <>
        {/* Opción 1: Unirse adquiriendo la versión PRO */}
          <div className="space-y-2">
            <a
              href={APP_CONFIG.lemonSqueezyUrl}
              onClick={() => track('click_checkout')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl btn-primary text-white font-sans text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <span>{L('Conseguir Versión PRO', 'Get the PRO version')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Divisor minimalista */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-white/[0.08]"></div>
            <span className="flex-shrink mx-3 text-[11px] text-gray-400 uppercase tracking-wider font-sans">
              {L('o activa tu acceso', 'or activate your access')}
            </span>
            <div className="flex-grow border-t border-white/[0.08]"></div>
          </div>
          </>
        )}

        {/* Opción 2: Formulario de código sin ejemplos en el placeholder */}
        <form onSubmit={handleValidateCode} className="space-y-2.5">
          {canPaste && (
            <button
              type="button"
              onClick={pasteAndActivate}
              disabled={checking}
              className="w-full py-3 rounded-xl btn-primary disabled:opacity-60 text-white font-sans font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span aria-hidden="true">📋</span>
              {L('Pegar la clave copiada y activar', 'Paste the copied key and activate')}
            </button>
          )}
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              placeholder={L('Clave de licencia o código', 'License key or code')}
              className="w-full inset-field focus:border-[#E84A27] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 uppercase tracking-widest font-mono outline-none transition text-center"
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs text-center">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim() || checking}
            className="w-full py-2 rounded-xl btn-3d disabled:opacity-40 disabled:pointer-events-none text-gray-200 hover:text-white font-sans font-semibold text-xs uppercase tracking-wider transition border border-white/[0.08] cursor-pointer"
          >
            {checking ? L('Comprobando…', 'Checking…') : L('Validar Código', 'Validate code')}
          </button>
          <p className="text-[10.5px] text-gray-500 text-center leading-relaxed">
            {purchased
              ? L('Tu clave está en el email de compra que te mandó Lemon Squeezy. Ábrelo, copia la clave (mantén pulsada → Copiar), vuelve aquí y toca el botón de arriba.', 'Your key is in the purchase email Lemon Squeezy sent you. Open it, copy the key (press and hold → Copy), come back here and tap the button above.')
              : L('Si compraste en la tienda: copia la clave de licencia de tu email (mantén pulsada → Copiar) y toca el botón de arriba.', 'If you bought in the store: copy the license key from your email (press and hold → Copy) and tap the button above.')}
          </p>
        </form>

        {!purchased && (
        <p className="text-[10.5px] text-gray-500 text-center leading-relaxed -mt-1">
          {L('Pago único, sin suscripción. Al comprar aceptas los Términos y condiciones; tienes 10 días para arrepentirte.', 'One-time payment, no subscription. By buying you accept the Terms and Conditions; you have 10 days to withdraw.')}
        </p>
        )}

        <RecoverAccessInfo />

        {/* Enlace discreto a WhatsApp para asistencia */}
        <div className="pt-2 text-center border-t border-white/[0.06]">
          <a
            href={APP_CONFIG.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11.5px] text-gray-400 hover:text-emerald-400 transition"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{L('¿Dudas con tu acceso? Escríbenos por WhatsApp', 'Questions about your access? Message us on WhatsApp')}</span>
          </a>
        </div>

        <LegalLinks />
      </div>
    </div>
  );
};
