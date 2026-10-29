import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ConsentChecks, ConsentValues } from './ConsentChecks';

/**
 * Aviso único para quien ya estaba registrado antes de que existieran las casillas de consentimiento
 * (o cuando cambia la versión de la política). Hay que aceptar para seguir usando la app.
 */
export const ConsentGateModal: React.FC<{
  onAccept: (prefs: { marketing: boolean; analytics: boolean }) => void;
}> = ({ onAccept }) => {
  const [value, setValue] = useState<ConsentValues>({ accepted: false, marketing: false, analytics: false });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="modal-panel rounded-3xl max-w-sm w-full max-h-[92vh] overflow-y-auto p-5 text-white space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl btn-3d flex items-center justify-center text-[#FF6B4A] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-brand text-[9.5px] tracking-[0.2em] uppercase text-[#FF6B4A] font-bold block">
              Privacidad
            </span>
            <h3 className="font-serif text-lg font-bold leading-tight">Tu privacidad, clara</h3>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          Hemos publicado nuestra Política de privacidad y los Términos y condiciones de HispanApp. Para seguir usando la app,
          léelos y acéptalos. Las otras dos opciones son voluntarias y puedes cambiarlas cuando quieras desde <strong>Tu perfil</strong>.
        </p>

        <ConsentChecks idPrefix="gate" value={value} onChange={setValue} />

        <button
          onClick={() => onAccept({ marketing: value.marketing, analytics: value.analytics })}
          disabled={!value.accepted}
          className="w-full py-3 rounded-2xl btn-primary text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:cursor-not-allowed"
        >
          Aceptar y continuar
        </button>
      </div>
    </div>
  );
};
