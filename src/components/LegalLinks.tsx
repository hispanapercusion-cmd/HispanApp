import React from 'react';
import { legalUrl } from '../config';
import { useLang } from '../i18n';

/** Enlaces legales: privacidad, términos y botón de arrepentimiento */
export const LegalLinks: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, L } = useLang();
  return (
  <nav className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-gray-500 ${className}`} aria-label={L('Información legal', 'Legal information')}>
    <a href={legalUrl('privacy', lang)} target="_blank" rel="noopener" className="hover:text-gray-300 underline underline-offset-2">
      {L('Privacidad', 'Privacy')}
    </a>
    <span aria-hidden="true">·</span>
    <a href={legalUrl('terms', lang)} target="_blank" rel="noopener" className="hover:text-gray-300 underline underline-offset-2">
      {L('Términos y condiciones', 'Terms and conditions')}
    </a>
    <span aria-hidden="true">·</span>
    <a href={legalUrl('withdrawal', lang)} target="_blank" rel="noopener" className="hover:text-gray-300 underline underline-offset-2">
      {L('Botón de arrepentimiento', 'Cancel / withdraw a purchase')}
    </a>
  </nav>
  );
};
