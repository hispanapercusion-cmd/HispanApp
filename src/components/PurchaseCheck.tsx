import React, { useEffect, useState } from 'react';
import { useLang } from '../i18n';

/** Pantalla breve al volver de pagar: la app confirma la compra y activa el PRO sola */
export const PurchaseCheck: React.FC<{ onSkip: () => void }> = ({ onSkip }) => {
  const { L } = useLang();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 9000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed inset-0 z-[250] flex flex-col items-center justify-center gap-5 bg-[#0A0C11] px-8 text-center" role="status" data-testid="purchase-check">
      <div className="h-12 w-12 rounded-full border-4 border-white/15 border-t-[#E84A27] animate-spin" aria-hidden="true" />
      <div>
        <p className="font-sans text-lg font-bold text-white">{L('Confirmando tu compra…', 'Confirming your purchase…')}</p>
        <p className="mt-1.5 font-sans text-sm text-gray-400">
          {L('Estamos activando tu HispanApp PRO. Son unos segundos.', 'We are activating your HispanApp PRO. It takes a few seconds.')}
        </p>
      </div>
      {slow && (
        <button
          onClick={onSkip}
          className="mt-2 rounded-xl btn-3d px-4 py-2.5 font-sans text-xs font-semibold text-gray-200 hover:text-white cursor-pointer"
        >
          {L('Tarda mucho: pegar mi clave a mano', 'Taking long: paste my key by hand')}
        </button>
      )}
    </div>
  );
};
