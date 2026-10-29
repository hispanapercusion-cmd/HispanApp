import React from 'react';

/**
 * Símbolo oficial de Hispana Percusión, calcado del logo original (512×512 px).
 * Dibujado con formas rellenas (no con trazos) para que los grosores y la diagonal
 * coincidan exactamente con el original a cualquier tamaño.
 */
export const HispanaMark: React.FC<{ className?: string; color?: string }> = ({
  className = '',
  color = '#FFFFFF',
}) => (
  <svg
    viewBox="90 91 330 330"
    className={className}
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Hispana Percusión"
  >
    {/* Marco trasero (arriba a la derecha) */}
    <rect x="214" y="97" width="181" height="8" />
    <rect x="214" y="97" width="8" height="42" />
    <rect x="387" y="97" width="8" height="222" />
    <rect x="354" y="311" width="41" height="8" />
    {/* Cajón frontal */}
    <rect x="150" y="161" width="181" height="8" />
    <rect x="322" y="161" width="9" height="222" />
    <rect x="150" y="372" width="181" height="11" />
    {/* Línea interior horizontal */}
    <rect x="221" y="310" width="110" height="8" />
    {/* Cara lateral sólida en perspectiva */}
    <polygon points="150,161 222,161 222,316 166,372 150,372" />
    {/* Diagonal inferior izquierda */}
    <polygon points="150,376 161,376 122,415 116,410" />
  </svg>
);

interface HispanaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const HispanaLogo: React.FC<HispanaLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 p-1 rounded-lg',
    md: 'w-10 h-10 p-1.5 rounded-lg',
    lg: 'w-12 h-12 sm:w-13 sm:h-13 p-1.5 rounded-xl',
    xl: 'w-16 h-16 p-2 rounded-2xl',
  }[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`btn-3d flex items-center justify-center shrink-0 ${sizeClasses}`}
        title="Hispana Percusión"
      >
        <HispanaMark className="w-full h-full" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-brand font-bold text-xs tracking-[0.25em] text-white">HISPANA</span>
          <span className="font-brand font-light text-[9px] tracking-[0.35em] text-gray-400">PERCUSIÓN</span>
        </div>
      )}
    </div>
  );
};
