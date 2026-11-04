import React from 'react';
import { Check } from 'lucide-react';
import { legalUrl } from '../config';
import { useLang } from '../i18n';

/** Casilla con el estilo de la app (la casilla real queda oculta pero accesible) */
export const CheckRow: React.FC<{
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  required?: boolean;
  /** Resaltar en naranja (p. ej. si falta marcar la casilla obligatoria) */
  highlight?: boolean;
}> = ({ id, checked, onChange, children, required, highlight }) => (
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
      className={`mt-0.5 w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition ${
        checked
          ? 'btn-primary'
          : highlight
            ? 'bg-[#E84A27]/15 border-2 border-[#FF6B4A] shadow-[0_0_0_3px_rgba(232,74,39,0.25)]'
            : 'bg-white/[0.08] border-2 border-white/70'
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
  /** Resaltar la casilla obligatoria si se intentó continuar sin marcarla */
  highlightAccept?: boolean;
}> = ({ value, onChange, idPrefix, highlightAccept }) => {
  const { lang, L } = useLang();
  return (
  <div className="space-y-2.5">
    <CheckRow
      id={`${idPrefix}-accept`}
      checked={value.accepted}
      onChange={(accepted) => onChange({ ...value, accepted })}
      highlight={highlightAccept && !value.accepted}
    >
      {L('Acepto la', 'I accept the')}{' '}
      <a href={legalUrl('privacy', lang)} target="_blank" rel="noopener" className="text-[#FF6B4A] underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
        {L('Política de privacidad', 'Privacy Policy')}
      </a>{' '}
      {L('y los', 'and the')}{' '}
      <a href={legalUrl('terms', lang)} target="_blank" rel="noopener" className="text-[#FF6B4A] underline underline-offset-2" onClick={(e) => e.stopPropagation()}>
        {L('Términos y condiciones', 'Terms and Conditions')}
      </a>
      . <span className="text-[#FF6B4A]">*</span>
    </CheckRow>
    <CheckRow
      id={`${idPrefix}-marketing`}
      checked={value.marketing}
      onChange={(marketing) => onChange({ ...value, marketing })}
    >
      {L('Quiero recibir novedades, clases y ofertas por email', 'Send me news, lessons and offers by email')} <span className="text-gray-500">({L('opcional', 'optional')})</span>.
    </CheckRow>
    <CheckRow
      id={`${idPrefix}-analytics`}
      checked={value.analytics}
      onChange={(analytics) => onChange({ ...value, analytics })}
    >
      {L('Permitir estadísticas anónimas de uso para mejorar la app', 'Allow anonymous usage statistics to improve the app')} <span className="text-gray-500">({L('opcional', 'optional')})</span>.
    </CheckRow>
  </div>
  );
};
