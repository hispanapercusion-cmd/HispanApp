import React from 'react';
import { Check } from 'lucide-react';
import { APP_CONFIG } from '../config';

/** Casilla con el estilo de la app (la casilla real queda oculta pero accesible) */
export const CheckRow: React.FC<{
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  required?: boolean;
}> = ({ id, checked, onChange, children, required }) => (
  <label htmlFor={id} className="flex items-start gap-2.5 cursor-pointer select-none text-left">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only"
      required={required}
    />
    <span
      aria-hidden="true"
      className={`mt-0.5 w-[18px] h-[18px] rounded-md shrink-0 flex items-center justify-center transition ${
        checked ? 'btn-primary' : 'segmented ring-1 ring-inset ring-white/30'
      }`}
    >
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </span>
    <span className="text-[12px] leading-snug text-gray-300">{children}</span>
  </label>
);

export interface ConsentValues {
  accepted: boolean;
  marketing: boolean;
  analytics: boolean;
}

/** Bloque de consentimiento: aceptación obligatoria + dos opciones voluntarias */
export const ConsentChecks: React.FC<{
  value: ConsentValues;
  onChange: (v: ConsentValues) => void;
  idPrefix: string;
}> = ({ value, onChange, idPrefix }) => (
  <div className="space-y-2.5">
    <CheckRow
      id={`${idPrefix}-accept`}
      checked={value.accepted}
      onChange={(accepted) => onChange({ ...value, accepted })}
    >
      Acepto la{' '}
      <a href={APP_CONFIG.privacyUrl} target="_blank" rel="noopener" className="text-[#FF6B4A] underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
        Política de privacidad
      </a>{' '}
      y los{' '}
      <a href={APP_CONFIG.termsUrl} target="_blank" rel="noopener" className="text-[#FF6B4A] underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
        Términos y condiciones
      </a>
      . <span className="text-[#FF6B4A]">*</span>
    </CheckRow>
    <CheckRow
      id={`${idPrefix}-marketing`}
      checked={value.marketing}
      onChange={(marketing) => onChange({ ...value, marketing })}
    >
      Quiero recibir novedades, clases y ofertas por email <span className="text-gray-500">(opcional)</span>.
    </CheckRow>
    <CheckRow
      id={`${idPrefix}-analytics`}
      checked={value.analytics}
      onChange={(analytics) => onChange({ ...value, analytics })}
    >
      Permitir estadísticas anónimas de uso para mejorar la app <span className="text-gray-500">(opcional)</span>.
    </CheckRow>
  </div>
);
