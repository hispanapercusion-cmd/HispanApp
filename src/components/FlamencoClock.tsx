import React from 'react';
import { RhythmDefinition } from '../types';

interface FlamencoClockProps {
  rhythm: RhythmDefinition;
  activeStep: number;
  countMode: 'phonetic' | 'traditional';
  onBeatClick?: (beatIndex: number) => void;
  countInText?: string | null;
  countInWord?: string | null;
}

const FlamencoClockComponent: React.FC<FlamencoClockProps> = ({
  rhythm,
  activeStep,
  countMode,
  onBeatClick,
  countInText,
  countInWord,
}) => {
  const counts = rhythm.has12CountToggle && countMode === 'traditional'
    ? rhythm.countsTrad
    : rhythm.countsPhon;

  const totalBeats = counts.length;
  const currentBeatIdx = activeStep >= 0 ? Math.floor(activeStep / rhythm.stepsPerBeat) : -1;

  const cx = 130;
  const cy = 130;
  const radius = 98;

  return (
    <div className="relative w-60 h-60 sm:w-64 sm:h-64 my-1 flex items-center justify-center select-none mx-auto">
      <svg viewBox="0 0 260 260" className="w-full h-full overflow-visible">
        <defs>
          <radialGradient id="clockCenterGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#181C26" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0B0D12" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer and Inner Circle Tracks */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.8" />
        <circle
          cx={cx}
          cy={cy}
          r={radius - 24}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Center ambient fill */}
        <circle cx={cx} cy={cy} r={radius - 26} fill="url(#clockCenterGlow)" />

        {/* Beats */}
        {counts.map((label, i) => {
          const angle = (i / totalBeats) * (2 * Math.PI) - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          const isAccent = rhythm.clockAccents.includes(i);
          const isActive = !countInText && currentBeatIdx === i;

          const nodeRadius = isAccent ? 14 : 11.5;
          let fill = '#141821';
          if (isActive) {
            fill = isAccent ? '#E84A27' : 'rgba(255,255,255,0.22)';
          }
          const stroke = isAccent
            ? '#E84A27'
            : isActive
            ? 'rgba(255,255,255,0.6)'
            : 'rgba(255,255,255,0.18)';
          const strokeWidth = isAccent ? 2.2 : 1.4;

          return (
            <g
              key={i}
              className="cursor-pointer transition-transform duration-100 ease-out"
              onClick={() => onBeatClick?.(i)}
              style={{
                transformOrigin: `${x}px ${y}px`,
                transform: isActive ? 'scale(1.2)' : 'scale(1)',
                filter: isActive && isAccent ? 'drop-shadow(0 0 8px rgba(232,74,39,0.7))' : undefined,
              }}
            >
              <circle
                cx={x}
                cy={y}
                r={nodeRadius}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize={isAccent ? '11.5' : '10.5'}
                fontWeight="700"
                fill={isActive || isAccent ? '#FFFFFF' : 'rgba(255,255,255,0.75)'}
                className="select-none pointer-events-none"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Center Display - Número grande de cuenta previa o pulso actual */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        {countInText ? (
          <>
            <span
              key={countInText}
              className="font-sans text-5xl sm:text-6xl font-black text-white leading-none drop-shadow-[0_4px_16px_rgba(232,74,39,0.6)] animate-countdown-pop tabular-nums"
            >
              {countInText}
            </span>
            <span className="font-sans text-[10px] uppercase tracking-widest text-[#FF5533] mt-1.5 font-bold drop-shadow-sm">
              Cuenta Previa
            </span>
          </>
        ) : (
          <span className="font-sans text-4xl sm:text-5xl font-extrabold text-white leading-none tracking-tight tabular-nums drop-shadow-md">
            {currentBeatIdx >= 0 && counts[currentBeatIdx] !== undefined ? counts[currentBeatIdx] : '—'}
          </span>
        )}
      </div>
    </div>
  );
};

export const FlamencoClock = React.memo(FlamencoClockComponent);
