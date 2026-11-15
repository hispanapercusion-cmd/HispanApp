import React, { useEffect, useMemo, useState } from 'react';
import { useLang } from '../i18n';

// Celebración de la racha al abrir la app: fuego animado, chispas que suben y el número de días en grande.
// Se cierra sola a los pocos segundos o al tocar la pantalla.

const Flame: React.FC<{ className?: string; style?: React.CSSProperties; id: string }> = ({ className = '', style, id }) => (
  <svg viewBox="0 0 100 140" className={className} style={style} aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-o`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#E8230A" />
        <stop offset="55%" stopColor="#FF5A1F" />
        <stop offset="100%" stopColor="#FF9A3C" />
      </linearGradient>
      <linearGradient id={`${id}-m`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#FF6A1A" />
        <stop offset="100%" stopColor="#FFC13D" />
      </linearGradient>
      <linearGradient id={`${id}-i`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#FFD84A" />
        <stop offset="100%" stopColor="#FFF4B0" />
      </linearGradient>
    </defs>
    <g className="sc-flame-outer">
      <path
        d="M50 2 C56 26 90 46 90 88 C90 120 68 138 50 138 C32 138 10 120 10 88 C10 62 30 52 34 30 C40 40 45 22 50 2 Z"
        fill={`url(#${id}-o)`}
      />
    </g>
    <g className="sc-flame-mid">
      <path
        d="M50 34 C55 52 76 64 76 94 C76 118 62 132 50 132 C38 132 24 118 24 94 C24 76 38 70 40 54 C44 60 47 46 50 34 Z"
        fill={`url(#${id}-m)`}
      />
    </g>
    <g className="sc-flame-in">
      <path
        d="M50 70 C54 82 64 90 64 106 C64 122 56 130 50 130 C44 130 36 122 36 106 C36 96 44 92 45 82 C48 85 49 78 50 70 Z"
        fill={`url(#${id}-i)`}
      />
    </g>
  </svg>
);

export const StreakCelebration: React.FC<{ streak: number; todayDone: boolean; onClose: () => void }> = ({
  streak,
  todayDone,
  onClose,
}) => {
  const { L } = useLang();
  const [shown, setShown] = useState(0);

  // El número sube contando hasta los días de racha
  useEffect(() => {
    const start = performance.now() + 450;
    const dur = Math.min(1100, 350 + streak * 60);
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / dur));
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(eased * streak));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [streak]);

  // Chispas: posiciones y tiempos fijos para toda la animación
  const embers = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: 8 + ((i * 37) % 84),
        size: 3 + ((i * 5) % 6),
        delay: ((i * 0.23) % 2.6).toFixed(2),
        dur: (2.2 + ((i * 0.37) % 1.8)).toFixed(2),
        drift: ((i % 2 ? 1 : -1) * (10 + ((i * 7) % 40))).toString(),
      })),
    []
  );

  const label = streak === 1 ? L('día de racha', 'day streak') : L('días de racha', 'day streak');

  return (
    <div
      className="sc-overlay fixed inset-0 z-[60] flex items-center justify-center overflow-hidden cursor-pointer select-none"
      role="status"
      data-testid="streak-toast"
      onClick={onClose}
    >
      {/* Brillo de fondo que respira */}
      <div className="sc-glow absolute left-1/2 top-1/2 w-[130vmin] h-[130vmin] -translate-x-1/2 -translate-y-1/2 rounded-full" />

      {/* Chispas */}
      {embers.map((e, i) => (
        <span
          key={i}
          className="sc-ember absolute bottom-[12%] rounded-full"
          style={
            {
              left: `${e.left}%`,
              width: e.size,
              height: e.size,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.dur}s`,
              '--drift': `${e.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}

      <div className="sc-stage relative flex flex-col items-center text-center px-6">
        {/* Hoguera: llama grande y dos más pequeñas a los lados */}
        <div className="relative w-[230px] h-[250px] sm:w-[280px] sm:h-[300px]">
          <Flame id="fl" className="sc-fire sc-fire-main absolute left-1/2 bottom-0 -translate-x-1/2 w-[78%] h-auto" />
          <Flame id="fr" className="sc-fire sc-fire-left absolute left-0 bottom-0 w-[44%] h-auto" />
          <Flame id="fs" className="sc-fire sc-fire-right absolute right-0 bottom-0 w-[40%] h-auto" />
          <div className="sc-fire-base absolute left-1/2 bottom-[-6px] -translate-x-1/2 w-[70%] h-4 rounded-full" />
        </div>

        <div className="sc-number font-sans font-black leading-none tabular-nums text-[120px] sm:text-[160px] -mt-3">
          {shown}
        </div>
        <div className="sc-label font-sans font-extrabold uppercase tracking-[0.18em] text-white text-xl sm:text-2xl mt-1">
          {label}
        </div>
        <p className="sc-sub font-sans text-sm sm:text-base text-orange-100/90 mt-3 max-w-xs">
          {todayDone
            ? L('¡Hoy ya practicaste! Sigue así 💪', 'You already practised today! Keep it up 💪')
            : L('Practica hoy para no perderla 🔥', 'Practise today to keep it 🔥')}
        </p>
      </div>
    </div>
  );
};
