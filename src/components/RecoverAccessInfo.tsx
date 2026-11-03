import React, { useState } from 'react';
import { ChevronDown, LifeBuoy } from 'lucide-react';
import { APP_CONFIG } from '../config';
import { useLang } from '../i18n';

const LEMON_ORDERS_URL = 'https://app.lemonsqueezy.com/my-orders';

/** Explicación desplegable: cómo recuperar el acceso PRO en otro móvil o navegador */
export const RecoverAccessInfo: React.FC<{ defaultOpen?: boolean }> = ({ defaultOpen = false }) => {
  const { L } = useLang();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sub-card rounded-2xl text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 cursor-pointer"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-gray-200">
          <LifeBuoy className="w-4 h-4 text-[#FF6B4A]" />
          {L('¿Ya eras PRO? Recupera tu acceso', 'Already PRO? Recover your access')}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3.5 pb-3 space-y-2 text-[11.5px] text-gray-300 leading-relaxed animate-fadeIn">
          <p>
            {L(
              'El acceso PRO se guarda en el navegador de cada dispositivo. Si cambiaste de móvil, usas otro navegador o borraste los datos, solo tienes que',
              'PRO access is saved in the browser of each device. If you changed phones, use another browser or cleared your data, you just need to'
            )}{' '}
            <strong className="text-white">{L('volver a escribir tu clave', 'enter your key again')}</strong>:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>
              <strong className="text-white">{L('Si compraste en la tienda:', 'If you bought it in the store:')}</strong>{' '}
              {L(
                'tu clave de licencia está en el email de Lemon Squeezy (busca «HispanApp» en tu correo) o en',
                'your license key is in the Lemon Squeezy email (search your inbox for “HispanApp”) or in'
              )}{' '}
              <a href={LEMON_ORDERS_URL} target="_blank" rel="noopener noreferrer" className="text-[#FF6B4A] underline underline-offset-2">
                {L('tus pedidos de Lemon Squeezy', 'your Lemon Squeezy orders')}
              </a>
              .
            </li>
            <li>
              <strong className="text-white">{L('Si eres alumno:', 'If you are a student:')}</strong>{' '}
              {L('el código que te dio Jordan (por ejemplo ALUMNO-XXXX-XXXX).', 'the code Jordan gave you (for example ALUMNO-XXXX-XXXX).')}
            </li>
          </ul>
          <p>
            {L('¿No la encuentras?', 'Can’t find it?')}{' '}
            <a href={APP_CONFIG.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline underline-offset-2">
              {L('Escríbenos por WhatsApp', 'Message us on WhatsApp')}
            </a>{' '}
            {L('con tu email de compra y te ayudamos.', 'with your purchase email and we will help you.')}
          </p>
        </div>
      )}
    </div>
  );
};

/** Clave o código PRO guardado en este dispositivo (para que el alumno pueda apuntarlo) */
export const SavedProCode: React.FC = () => {
  const { L } = useLang();
  const [copied, setCopied] = useState(false);
  let code = '';
  try {
    code = localStorage.getItem('hispanapp_pro_code') || '';
  } catch {
    code = '';
  }
  if (!code) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignorar
    }
  };
  return (
    <div className="space-y-1">
      <p className="text-[11px] text-gray-400">{L('Tu clave o código (guárdalo para otros dispositivos):', 'Your key or code (keep it for other devices):')}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate inset-field rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-gray-200">{code}</code>
        <button type="button" onClick={copy} className="px-3 py-1.5 rounded-lg btn-3d text-[11px] text-gray-200 cursor-pointer shrink-0">
          {copied ? L('Copiado ✓', 'Copied ✓') : L('Copiar', 'Copy')}
        </button>
      </div>
    </div>
  );
};
