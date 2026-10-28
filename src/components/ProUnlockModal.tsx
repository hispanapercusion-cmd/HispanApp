import React, { useState } from 'react';
import { X, ExternalLink, Sparkles, AlertCircle, MessageCircle } from 'lucide-react';
import { HispanaLogo } from './HispanaLogo';
import { APP_CONFIG } from '../config';

interface ProUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProUnlockModal: React.FC<ProUnlockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleValidateCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    const isDirectMatch = APP_CONFIG.proSecretCodes.some((c) => c.toUpperCase() === cleanCode);
    const isLemonOrderOrLicense =
      cleanCode.startsWith('LS-') ||
      cleanCode.startsWith('ORD-') ||
      cleanCode.startsWith('ORDER-') ||
      (cleanCode.length >= 6 && /^[A-Z0-9_-]+$/.test(cleanCode) && (cleanCode.includes('-') || cleanCode.includes('_')));

    if (isDirectMatch || isLemonOrderOrLicense) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#141821] border border-white/[0.08] rounded-2xl max-w-sm w-full p-5 shadow-2xl text-white space-y-4 relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
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

        {/* Opción 1: Unirse adquiriendo la versión PRO */}
        <div className="space-y-2">
          <a
            href={APP_CONFIG.lemonSqueezyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-[#E84A27] hover:bg-[#FF5533] active:scale-98 text-white font-sans text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#E84A27]/25 transition cursor-pointer"
          >
            <span>Conseguir Versión PRO</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Divisor minimalista */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/[0.08]"></div>
          <span className="flex-shrink mx-3 text-[11px] text-gray-400 uppercase tracking-wider font-sans">
            o ingresa tu código
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
                setError(false);
              }}
              placeholder="Código"
              className="w-full bg-black/40 border border-white/[0.1] focus:border-[#E84A27] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 uppercase tracking-widest font-mono outline-none transition text-center"
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs text-center">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Código no válido</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] active:scale-98 disabled:opacity-40 disabled:pointer-events-none text-gray-200 hover:text-white font-sans font-semibold text-xs uppercase tracking-wider transition border border-white/[0.08] cursor-pointer"
          >
            Validar Código
          </button>
        </form>

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
      </div>
    </div>
  );
};
