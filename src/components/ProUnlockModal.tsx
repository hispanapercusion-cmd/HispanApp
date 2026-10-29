import React, { useState } from 'react';
import { X, ExternalLink, Sparkles, AlertCircle, MessageCircle } from 'lucide-react';
import { HispanaLogo } from './HispanaLogo';
import { APP_CONFIG } from '../config';
import { ProCheckResult, proErrorMessage } from '../services/pro';
import { RecoverAccessInfo } from './RecoverAccessInfo';
import { LegalLinks } from './LegalLinks';
import { track } from '../services/analytics';

interface ProUnlockModalProps {
  isOpen: boolean;
  /** Mensaje opcional encima del formulario (p. ej. al volver de la compra) */
  notice?: string | null;
  onClose: () => void;
  onActivate: (code: string) => Promise<ProCheckResult>;
  onSuccess: () => void;
}

export const ProUnlockModal: React.FC<ProUnlockModalProps> = ({
  isOpen,
  notice,
  onClose,
  onActivate,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (!isOpen) return null;

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || checking) return;
    setChecking(true);
    setError(null);
    const result = await onActivate(code);
    setChecking(false);
    if (result.ok) {
      setCode('');
      onSuccess();
    } else {
      setError(proErrorMessage(result));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="modal-panel rounded-3xl max-w-sm w-full max-h-[92vh] overflow-y-auto p-5 shadow-2xl text-white space-y-4 relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 icon-btn btn-3d text-gray-400 hover:text-white cursor-pointer"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado Minimalista */}
        <div className="flex items-center gap-3">
          <HispanaLogo size="md" />
          <div>
            <span className="font-brand text-[9.5px] tracking-[0.2em] uppercase text-[#E84A27] font-bold block flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Versión PRO
            </span>
            <h3 className="font-serif text-lg font-bold leading-tight text-white">
              Desbloquea los 8 Ritmos
            </h3>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed font-sans">
          Accede a la colección completa de compases del método, videos demostrativos y el entrenador progresivo.
        </p>

        {notice && (
          <div className="text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 leading-relaxed">
            {notice}
          </div>
        )}

        {/* Opción 1: Unirse adquiriendo la versión PRO */}
        <div className="space-y-2">
          <a
            href={APP_CONFIG.lemonSqueezyUrl}
            onClick={() => track('click_checkout')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl btn-primary text-white font-sans text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <span>Conseguir Versión PRO</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Divisor minimalista */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/[0.08]"></div>
          <span className="flex-shrink mx-3 text-[11px] text-gray-400 uppercase tracking-wider font-sans">
            o activa tu acceso
          </span>
          <div className="flex-grow border-t border-white/[0.08]"></div>
        </div>

        {/* Opción 2: Formulario de código sin ejemplos en el placeholder */}
        <form onSubmit={handleValidateCode} className="space-y-2.5">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              placeholder="Clave de licencia o código"
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
            {checking ? 'Comprobando…' : 'Validar Código'}
          </button>
          <p className="text-[10.5px] text-gray-500 text-center leading-relaxed">
            Si compraste en la tienda, usa la clave de licencia que te llegó por email.
          </p>
        </form>

        <p className="text-[10.5px] text-gray-500 text-center leading-relaxed -mt-1">
          Pago único, sin suscripción. Al comprar aceptas los Términos y condiciones; tienes 10 días para arrepentirte.
        </p>

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
            <span>¿Dudas con tu acceso? Escríbenos por WhatsApp</span>
          </a>
        </div>

        <LegalLinks />
      </div>
    </div>
  );
};
