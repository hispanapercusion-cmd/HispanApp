import React, { useState } from 'react';
import { X, ExternalLink, Sparkles, Heart, MessageCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { HispanaLogo } from './HispanaLogo';
import { APP_CONFIG } from '../config';
import { ProCheckResult, proErrorMessage } from '../services/pro';

interface CommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro?: boolean;
  onActivateProCode?: (code: string) => Promise<ProCheckResult>;
  onStartTour?: () => void;
}

export const CommunityModal: React.FC<CommunityModalProps> = ({
  isOpen,
  onClose,
  isPro = false,
  onActivateProCode,
  onStartTour,
}) => {
  const [proInput, setProInput] = useState('');
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeMessage, setCodeMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proInput.trim() || !onActivateProCode || checkingCode) return;
    setCheckingCode(true);
    setCodeMessage('Comprobando…');
    const result = await onActivateProCode(proInput.trim());
    setCheckingCode(false);
    if (result.ok) {
      setCodeMessage('¡Código activado con éxito! Tienes acceso PRO.');
      setProInput('');
    } else {
      setCodeMessage(proErrorMessage(result));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="modal-panel rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-4 sm:p-6 shadow-2xl text-white space-y-4">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2.5">
            <HispanaLogo size="md" />
            <div>
              <span className="font-brand text-[9.5px] tracking-[0.22em] uppercase text-[#E84A27] font-bold block">
                Hispana Percusión · Jordan Migues
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight text-white">
                Comunidad
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn btn-3d text-gray-400 hover:text-white cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. TARJETA COMUNIDAD PATREON */}
        <div className="sub-card p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-brand text-[9.5px] uppercase tracking-widest text-[#FF5533] font-bold flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-[#E84A27] text-[#E84A27]" />
              Estudio Semanal
            </span>
            <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-white/[0.08] text-gray-300">
              Patreon
            </span>
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm sm:text-base text-white">
              Comunidad en Patreon
            </h4>
            <p className="text-xs text-gray-300 font-sans leading-relaxed mt-0.5">
              Lecciones exclusivas de percusión flamenca semana a semana, clases de cajón y resolución directa de dudas con Jordan Migues.
            </p>
          </div>
          <a
            href={APP_CONFIG.patreonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-3d text-white font-sans text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <span>Unirme a Patreon →</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 2. TARJETA PACK COMPLETO MÉTODO (HOTMART) */}
        <div className="sub-card sub-card-accent p-4 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-brand text-[9.5px] uppercase tracking-widest text-[#FF5533] font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Método Oficial
            </span>
            <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-[#E84A27]/20 text-[#FF6B4A]">
              Hotmart
            </span>
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm sm:text-base text-white">
              Pack Completo: Los Ritmos del Flamenco
            </h4>
            <p className="text-xs text-gray-300 font-sans leading-relaxed mt-0.5">
              Incluye los 3 volúmenes completos (Compás de 12, 3/4, y 4/4 - 6/8 en cajón y palmas con demostraciones en video) y acceso a HispanApp PRO.
            </p>
          </div>
          <a
            href={APP_CONFIG.hotmartPackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl btn-primary text-white font-sans text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <span>Obtener Pack Completo en Hotmart</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 3. TARJETA WHATSAPP DIRECTO */}
        <div className="sub-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Contacto Directo WhatsApp</span>
            </div>
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              Consultas sobre cajones artesanales, clases particulares o soporte.
            </p>
          </div>
          <a
            href={APP_CONFIG.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl btn-3d border-emerald-500/40 text-emerald-300 font-sans text-xs font-bold uppercase tracking-wider transition active:scale-95 shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Abrir WhatsApp</span>
          </a>
        </div>

        {/* 4. CÓDIGO ALUMNO PRO */}
        <div className="sub-card p-3.5 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#E84A27]" />
              <span>Código Alumno PRO</span>
            </span>
            {isPro ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
                <CheckCircle2 className="w-3 h-3" />
                <span>Activado</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-gray-300 text-[11px]">
                Estándar
              </span>
            )}
          </div>

          {!isPro ? (
            <form onSubmit={handleApplyCode} className="space-y-1.5 pt-0.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={proInput}
                  onChange={(e) => {
                    setProInput(e.target.value);
                    setCodeMessage(null);
                  }}
                  placeholder="Clave de licencia o código"
                  className="flex-1 min-w-0 inset-field focus:border-[#E84A27] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 uppercase tracking-wider font-mono outline-none"
                />
                <button
                  type="submit"
                  disabled={!proInput.trim() || checkingCode}
                  className="disabled:opacity-50 px-3 py-1.5 rounded-lg btn-primary text-white font-sans text-xs font-semibold uppercase tracking-wider cursor-pointer shrink-0"
                >
                  Activar
                </button>
              </div>
              {codeMessage && (
                <p className={`text-[11px] ${checkingCode ? 'text-gray-400' : codeMessage.includes('éxito') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {codeMessage}
                </p>
              )}
            </form>
          ) : (
            <p className="text-gray-400 text-[11px]">
              Tienes acceso ilimitado a los 8 ritmos, videos oficiales y entrenador.
            </p>
          )}
        </div>

        {/* Repetir el recorrido de la app */}
        {onStartTour && (
          <button
            onClick={onStartTour}
            className="w-full py-2.5 rounded-2xl btn-3d text-gray-200 hover:text-white text-xs font-sans font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span aria-hidden="true">🧭</span>
            <span>Ver el recorrido de la app</span>
          </button>
        )}

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl btn-3d text-white text-xs font-brand tracking-[0.18em] uppercase font-bold cursor-pointer"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
