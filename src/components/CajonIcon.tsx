import React from 'react';

// Ícono del cajón de HispanApp (reemplaza al emoji 🪘): imagen con fondo transparente que escala con el texto
export const CajonIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src={`${import.meta.env.BASE_URL}cajon-emoji.png`}
    alt=""
    aria-hidden="true"
    draggable={false}
    className={`inline-block h-[1.25em] w-auto align-[-0.25em] ${className}`}
  />
);
