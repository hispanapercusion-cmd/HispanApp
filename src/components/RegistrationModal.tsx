import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { HispanaLogo } from './HispanaLogo';
import { APP_CONFIG } from '../config';
import { saveLeadToFirestore } from '../services/firebase';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (name: string, email: string) => void;
  onOpenProModal: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenProModal,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);

    // Guardado en Firebase Firestore
    try {
      await saveLeadToFirestore({
        name: name.trim(),
        email: email.trim(),
        source: 'registration_modal'
      });
    } catch (err) {
      console.warn('Firebase lead capture error:', err);
    }

    // Envío opcional a webhook de leads si está configurado
    if (APP_CONFIG.leadWebhookUrl) {
      try {
        await fetch(APP_CONFIG.leadWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            timestamp: new Date().toISOString(),
            source: 'hispanapp_lead_magnet',
          }),
        });
      } catch {
        // Fallback silencioso
      }
    }

    setIsSubmitting(false);
    onSuccess(name.trim(), email.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="modal-panel rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl text-white space-y-4 relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 icon-btn btn-3d text-gray-400 hover:text-white cursor-pointer"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-3.5">
          <HispanaLogo size="md" />
          <div>
            <span className="font-brand text-[9px] tracking-[0.25em] uppercase text-[#E84A27] font-bold block">
              Acceso Gratuito · Método Oficial
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight text-white">
              Desbloquea los 8 Ritmos
            </h3>
          </div>
        </div>

        {/* Beneficios */}
        <div className="sub-card p-3 rounded-2xl space-y-2 text-xs text-gray-300">
          <p className="font-medium text-white">
            Accede sin costo a la colección completa de compases del método:
          </p>
          <ul className="space-y-1 text-gray-400">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Seguiriyas, Bulerías, Fandangos, Abandolaos y Tanguillos</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Monogramas de palmas y reloj circular interactivo</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Sonido real acústico de palmas agudas y sordas</span>
            </li>
          </ul>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-sans font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full inset-field focus:border-[#E84A27] rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-sans font-semibold text-gray-300 uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full inset-field focus:border-[#E84A27] rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl btn-primary text-white font-sans font-bold text-xs uppercase tracking-wider cursor-pointer mt-1"
          >
            {isSubmitting ? 'Desbloqueando...' : 'Desbloquear los 8 Ritmos →'}
          </button>
        </form>

        {/* Enlace a Código PRO */}
        <div className="pt-2 text-center border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenProModal();
            }}
            className="text-xs text-[#E84A27] hover:text-[#FF6B4A] underline font-medium transition cursor-pointer"
          >
            ¿Ya tienes tu Código PRO? Ingrésalo aquí
          </button>
        </div>
      </div>
    </div>
  );
};
