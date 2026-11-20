import React, { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { ProCheckResult, proErrorMessage, extractLicenseKey } from '../services/pro';
import { APP_CONFIG } from '../config';
import { useLang } from '../i18n';

/**
 * «¿Ya compraste HispanApp PRO?» en la primera pantalla (registro).
 *
 * Por qué existe: en iPhone, la app guardada en la pantalla de inicio tiene su propia memoria, separada de
 * Safari. Quien compra en Safari y luego abre la app desde el ícono llega aquí sin nada guardado. Con esta
 * tarjeta pega su clave en el primer paso; si es de Polar, se rellenan solos su nombre y su email y solo le
 * queda aceptar la privacidad y continuar.
 *
 * `highlight`: se muestra abierta y destacada (app abierta desde el ícono, donde casi seguro es un comprador).
 */
export const BuyerActivateCard: React.FC<{
  highlight: boolean;
  onActivate: (code: string) => Promise<ProCheckResult>;
  onBuyer: (name: string, email: string) => void;
}> = ({ highlight, onActivate, onBuyer }) => {
  const { L } = useLang();
  const [open, setOpen] = useState(highlight);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canPaste = typeof navigator !== 'undefined' && !!navigator.clipboard && typeof navigator.clipboard.readText === 'function';

  const validate = async (value: string) => {
    if (!value.trim() || checking) return;
    setChecking(true);
    setError(null);
    const result = await onActivate(value);
    setChecking(false);
    if (result.ok) {
      setDone(true);
      if (result.buyer) onBuyer(result.buyer.name, result.buyer.email);
    } else {
      setError(proErrorMessage(result));
    }
  };

  const pasteAndActivate = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      const value = (extractLicenseKey(text) || text).slice(0, 90);
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

  if (done) {
    return (
      <div data-testid="buyer-pro-done" className="w-full rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-[13px] text-gray-200 leading-snug flex items-start gap-2.5 animate-fadeIn">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-white">{L('¡PRO activado! 🎉', 'PRO activated! 🎉')}</strong>{' '}
          {L('Revisa tu nombre y tu email, acepta la privacidad y toca Continuar.', 'Check your name and email, accept the privacy terms and tap Continue.')}
        </span>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 text-[12.5px] text-[#FF6B4A] font-semibold underline underline-offset-2 cursor-pointer py-1"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {L('¿Ya compraste HispanApp PRO? Actívalo aquí', 'Already bought HispanApp PRO? Activate it here')}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div data-testid="buyer-pro-card" className={`w-full rounded-2xl p-3.5 space-y-2.5 text-left animate-fadeIn ${highlight ? 'border-2 border-[#E84A27]/70 bg-[#E84A27]/10' : 'border border-white/10 bg-white/[0.04]'}`}>
      <p className="font-brand text-[11px] font-bold uppercase tracking-[0.14em] text-[#FF6B4A] flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        {L('¿Ya compraste HispanApp PRO?', 'Already bought HispanApp PRO?')}
      </p>
      <ol className="space-y-1 text-[12.5px] text-gray-300 leading-snug">
        <li className="flex items-start gap-2">
          <span className="step-num">1</span>
          <span>
            {L('Abre el email de tu compra, toca', 'Open your purchase email, tap')} <strong className="text-white">«Access purchase»</strong>{' '}
            {L('y copia tu clave (empieza por HISPANAPP-).', 'and copy your key (it starts with HISPANAPP-).')}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="step-num">2</span>
          <span>{L('Vuelve aquí y toca el botón:', 'Come back here and tap the button:')}</span>
        </li>
      </ol>
      {canPaste && (
        <button
          type="button"
          onClick={pasteAndActivate}
          disabled={checking}
          className="w-full py-3 rounded-xl btn-primary disabled:opacity-60 text-white font-sans font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <span aria-hidden="true">📋</span>
          {checking ? L('Comprobando…', 'Checking…') : L('Pegar mi clave y activar PRO', 'Paste my key and activate PRO')}
        </button>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          aria-label={L('Clave de licencia o código', 'License key or code')}
          placeholder={L('O escríbela aquí', 'Or type it here')}
          className="flex-1 min-w-0 inset-field focus:border-[#E84A27] rounded-xl px-3 py-2.5 text-[13px] text-white placeholder-gray-500 font-mono outline-none transition"
        />
        <button
          type="button"
          onClick={() => validate(code)}
          disabled={!code.trim() || checking}
          className="px-3.5 rounded-xl btn-3d disabled:opacity-40 text-gray-200 text-[12px] font-semibold cursor-pointer shrink-0"
        >
          {L('Activar', 'Activate')}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-rose-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <p className="text-[11px] text-gray-500 leading-snug">
        {L('¿No encuentras el email? Busca «HispanApp» en tu correo o entra a', 'Can’t find the email? Search your inbox for “HispanApp” or go to')}{' '}
        <a href={APP_CONFIG.polarPortalUrl} target="_blank" rel="noopener noreferrer" className="text-[#FF6B4A] underline underline-offset-2">
          {L('tus compras', 'your purchases')}
        </a>{' '}
        {L('con el email que usaste al pagar.', 'with the email you used to pay.')}
      </p>
    </div>
  );
};
