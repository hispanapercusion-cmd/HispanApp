import React from 'react';
import { APP_CONFIG } from '../config';

/** Enlaces legales: privacidad, términos y botón de arrepentimiento */
export const LegalLinks: React.FC<{ className?: string }> = ({ className = '' }) => (
  <nav className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-gray-500 ${className}`} aria-label="Información legal">
    <a href={APP_CONFIG.privacyUrl} target="_blank" rel="noopener" className="hover:text-gray-300 underline underline-offset-2">
      Privacidad
    </a>
    <span aria-hidden="true">·</span>
    <a href={APP_CONFIG.termsUrl} target="_blank" rel="noopener" className="hover:text-gray-300 underline underline-offset-2">
      Términos y condiciones
    </a>
    <span aria-hidden="true">·</span>
    <a href={APP_CONFIG.withdrawalUrl} target="_blank" rel="noopener" className="hover:text-gray-300 underline underline-offset-2">
      Botón de arrepentimiento
    </a>
  </nav>
);
