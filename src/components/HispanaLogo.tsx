import React from 'react';

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
      {/* Official Cajón Symbol in pure white over dark slate surface */}
      <div
        className={`bg-[#141821] shadow-sm flex items-center justify-center shrink-0 border border-white/[0.08] ring-1 ring-white/[0.04] hover:border-white/20 transition-all ${sizeClasses}`}
        title="Hispana Percusión"
      >
        <svg
          viewBox="10 3 76 82"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Back top-right outline */}
          <path
            d="M 43 15 L 43 6 L 82 6 L 82 56 L 73 56"
            stroke="#FFFFFF"
            strokeWidth="4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          {/* Main front frame */}
          <rect
            x="24"
            y="21"
            width="42"
            height="50"
            stroke="#FFFFFF"
            strokeWidth="4.2"
            fill="none"
          />
          {/* Solid 3D perspective left facet */}
          <polygon
            points="24,21 43,21 43,56 24,71"
            fill="#FFFFFF"
          />
          {/* Inner horizontal floor line */}
          <line
            x1="43"
            y1="56"
            x2="66"
            y2="56"
            stroke="#FFFFFF"
            strokeWidth="3.8"
          />
          {/* Bottom left diagonal perspective line */}
          <line
            x1="24"
            y1="71"
            x2="14"
            y2="81"
            stroke="#FFFFFF"
            strokeWidth="4.2"
            strokeLinecap="square"
          />
        </svg>
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
