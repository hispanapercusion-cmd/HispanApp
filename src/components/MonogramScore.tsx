import React, { useRef, useEffect } from 'react';
import { RhythmDefinition } from '../types';

interface MonogramScoreProps {
  rhythm: RhythmDefinition;
  activeStep: number;
  countMode: 'phonetic' | 'traditional';
  onPreviewBeat?: (startStep: number, length: number) => void;
}

const MonogramScoreComponent: React.FC<MonogramScoreProps> = ({
  rhythm,
  activeStep,
  countMode,
  onPreviewBeat,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeStep < 0 || !containerRef.current) return;
    const activeEl = containerRef.current.querySelector('.active-beat') as HTMLElement | null;
    if (activeEl) {
      const container = containerRef.current;
      const cRect = container.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      // Solo hacer scroll suave si la nota está fuera o a menos de 40px del borde
      // Se desplaza solo la tira de la partitura (no la página entera, para no "saltar" en el móvil)
      if (elRect.left < cRect.left + 40 || elRect.right > cRect.right - 40) {
        const target = container.scrollLeft + (elRect.left - cRect.left) - (cRect.width - elRect.width) / 2;
        container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      }
    }
  }, [activeStep]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [rhythm.id]);

  const counts = rhythm.has12CountToggle && countMode === 'traditional'
    ? rhythm.countsTrad
    : rhythm.countsPhon;

  // Helper SVG functions
  const ClefAndTimeSig = ({ num, den, includeClef = true }: { num: string; den: string; includeClef?: boolean }) => (
    <svg viewBox="0 0 38 92" className="w-9 h-22 shrink-0 select-none block">
      <line x1="0" y1="54" x2="38" y2="54" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
      {includeClef && (
        <>
          <rect x="6" y="46" width="2.8" height="16" fill="#F3F4F6" />
          <rect x="11.5" y="46" width="2.8" height="16" fill="#F3F4F6" />
        </>
      )}
      <text x="26" y="51" textAnchor="middle" fontFamily="Lora, serif" fontSize="18" fontWeight="700" fill="#F3F4F6">
        {num}
      </text>
      <text x="26" y="68" textAnchor="middle" fontFamily="Lora, serif" fontSize="18" fontWeight="700" fill="#F3F4F6">
        {den}
      </text>
    </svg>
  );

  const Barline = ({ isFinal = false }: { isFinal?: boolean }) => (
    <svg viewBox="0 0 16 92" className="w-4 h-22 shrink-0 select-none block">
      <line x1="0" y1="54" x2="16" y2="54" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
      {isFinal ? (
        <>
          <line x1="9" y1="36" x2="9" y2="72" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" />
          <line x1="13.5" y1="36" x2="13.5" y2="72" stroke="#F3F4F6" strokeWidth="3.2" />
        </>
      ) : (
        <line x1="8" y1="36" x2="8" y2="72" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      )}
    </svg>
  );

  // 1. Quarter Note
  const QuarterNote = ({ stepIdx, label, accent = false }: { stepIdx: number; label: string; accent?: boolean }) => {
    const isActive = activeStep === stepIdx;
    return (
      <div
        id={`beatBox-${stepIdx}`}
        onClick={() => onPreviewBeat?.(stepIdx, 1)}
        className={`beat-group cursor-pointer rounded-lg transition-all px-0.5 ${
          isActive ? 'active-beat bg-[#E84A27]/[0.18]' : 'hover:bg-white/[0.04]'
        }`}
        title={`Paso ${stepIdx + 1} - Clic para escuchar`}
      >
        <svg viewBox="0 0 48 92" className="w-11 sm:w-12 h-22 shrink-0 block overflow-visible">
          <line x1="0" y1="54" x2="48" y2="54" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
          {label && (
            <text x="24" y="20" textAnchor="middle" fontFamily="Lora, serif" fontSize="14" fontWeight="600" fill={isActive ? '#FF5533' : '#F3F4F6'}>
              {label}
            </text>
          )}
          <ellipse
            id={`noteStep-${stepIdx}`}
            cx="24"
            cy="54"
            rx="5.4"
            ry="4"
            transform="rotate(-18 24 54)"
            fill={isActive ? '#FF5533' : '#F3F4F6'}
            style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(232, 74, 39, 0.65))' } : undefined}
          />
          <line
            x1="28.5"
            y1="54"
            x2="28.5"
            y2="25"
            stroke={isActive ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          {accent && (
            <text x="24" y="75" textAnchor="middle" fontFamily="Lora, serif" fontSize="15" fontWeight="700" fill={isActive ? '#FF5533' : 'rgba(255,255,255,0.7)'}>
              &gt;
            </text>
          )}
        </svg>
      </div>
    );
  };

  // 2. Quarter Rest
  const QuarterRest = ({ stepIdx, label }: { stepIdx: number; label: string }) => {
    const isActive = activeStep === stepIdx;
    return (
      <div
        id={`beatBox-${stepIdx}`}
        onClick={() => onPreviewBeat?.(stepIdx, 1)}
        className={`beat-group cursor-pointer rounded-lg transition-all px-0.5 ${
          isActive ? 'active-beat bg-[#E84A27]/[0.18]' : 'hover:bg-white/[0.04]'
        }`}
        title={`Paso ${stepIdx + 1} - Silencio`}
      >
        <svg viewBox="0 0 48 92" className="w-11 sm:w-12 h-22 shrink-0 block overflow-visible">
          <line x1="0" y1="54" x2="48" y2="54" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
          {label && (
            <text x="24" y="20" textAnchor="middle" fontFamily="Lora, serif" fontSize="14" fontWeight="600" fill={isActive ? '#FF5533' : '#F3F4F6'}>
              {label}
            </text>
          )}
          <path
            d="M 22 43 L 27 49 L 22 54 L 27 60 Q 22 61 21 65"
            stroke={isActive ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.8"
            fill="none"
            style={isActive ? { filter: 'drop-shadow(0 0 5px rgba(232, 74, 39, 0.6))' } : undefined}
          />
        </svg>
      </div>
    );
  };

  // 3. Two Beamed Eighth Notes
  const TwoBeamedEighths = ({
    step1,
    step2,
    label1,
    label2 = '',
    accent1 = false,
    accent2 = false,
  }: {
    step1: number;
    step2: number;
    label1: string;
    label2?: string;
    accent1?: boolean;
    accent2?: boolean;
  }) => {
    const isAct1 = activeStep === step1;
    const isAct2 = activeStep === step2;
    const isGroupActive = isAct1 || isAct2;

    return (
      <div
        id={`beatBox-${step1}`}
        onClick={() => onPreviewBeat?.(step1, 2)}
        className={`beat-group cursor-pointer rounded-lg transition-all px-0.5 ${
          isGroupActive ? 'active-beat bg-[#E84A27]/[0.18]' : 'hover:bg-white/[0.04]'
        }`}
        title={`Corcheas ${step1 + 1}-${step2 + 1}`}
      >
        <svg viewBox="0 0 60 92" className="w-14 sm:w-15 h-22 shrink-0 block overflow-visible">
          <line x1="0" y1="54" x2="60" y2="54" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
          {label1 && (
            <text x="18" y="20" textAnchor="middle" fontFamily="Lora, serif" fontSize="14" fontWeight="600" fill={isAct1 ? '#FF5533' : '#F3F4F6'}>
              {label1}
            </text>
          )}
          {label2 && (
            <text x="42" y="20" textAnchor="middle" fontFamily="Lora, serif" fontSize="14" fontWeight="600" fill={isAct2 ? '#FF5533' : '#F3F4F6'}>
              {label2}
            </text>
          )}
          <ellipse
            cx="18"
            cy="54"
            rx="5"
            ry="3.8"
            transform="rotate(-18 18 54)"
            fill={isAct1 ? '#FF5533' : '#F3F4F6'}
            style={isAct1 ? { filter: 'drop-shadow(0 0 6px rgba(232, 74, 39, 0.65))' } : undefined}
          />
          <line
            x1="22.5"
            y1="54"
            x2="22.5"
            y2="26"
            stroke={isAct1 ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            style={isAct1 ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          <ellipse
            cx="42"
            cy="54"
            rx="5"
            ry="3.8"
            transform="rotate(-18 42 54)"
            fill={isAct2 ? '#FF5533' : '#F3F4F6'}
            style={isAct2 ? { filter: 'drop-shadow(0 0 6px rgba(232, 74, 39, 0.65))' } : undefined}
          />
          <line
            x1="46.5"
            y1="54"
            x2="46.5"
            y2="26"
            stroke={isAct2 ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            style={isAct2 ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          <rect x="21.8" y="25" width="25.4" height="3.8" fill={isGroupActive ? '#FF5533' : '#F3F4F6'} />
          {accent1 && (
            <text x="18" y="75" textAnchor="middle" fontFamily="Lora, serif" fontSize="15" fontWeight="700" fill={isAct1 ? '#FF5533' : 'rgba(255,255,255,0.7)'}>
              &gt;
            </text>
          )}
          {accent2 && (
            <text x="42" y="75" textAnchor="middle" fontFamily="Lora, serif" fontSize="15" fontWeight="700" fill={isAct2 ? '#FF5533' : 'rgba(255,255,255,0.7)'}>
              &gt;
            </text>
          )}
        </svg>
      </div>
    );
  };

  // 4. Eighth Rest + Eighth Note with Flag
  const EighthRestAndEighth = ({
    stepRest,
    stepNote,
    label1,
    label2 = '',
    accentNote = false,
  }: {
    stepRest: number;
    stepNote: number;
    label1: string;
    label2?: string;
    accentNote?: boolean;
  }) => {
    const isActRest = activeStep === stepRest;
    const isActNote = activeStep === stepNote;
    const isGroupActive = isActRest || isActNote;

    return (
      <div
        id={`beatBox-${stepRest}`}
        onClick={() => onPreviewBeat?.(stepRest, 2)}
        className={`beat-group cursor-pointer rounded-lg transition-all px-0.5 ${
          isGroupActive ? 'active-beat bg-[#E84A27]/[0.18]' : 'hover:bg-white/[0.04]'
        }`}
        title={`Contratiempo ${stepRest + 1}-${stepNote + 1}`}
      >
        <svg viewBox="0 0 60 92" className="w-14 sm:w-15 h-22 shrink-0 block overflow-visible">
          <line x1="0" y1="54" x2="60" y2="54" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
          {label1 && (
            <text x="16" y="20" textAnchor="middle" fontFamily="Lora, serif" fontSize="14" fontWeight="600" fill={isActRest ? '#FF5533' : '#F3F4F6'}>
              {label1}
            </text>
          )}
          {label2 && (
            <text x="40" y="20" textAnchor="middle" fontFamily="Lora, serif" fontSize="14" fontWeight="600" fill={isActNote ? '#FF5533' : '#F3F4F6'}>
              {label2}
            </text>
          )}
          {/* Rest */}
          <circle cx="15" cy="50" r="2" fill={isActRest ? '#FF5533' : '#F3F4F6'} />
          <path
            d="M 16 50 Q 20 51 17 61"
            stroke={isActRest ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            fill="none"
            style={isActRest ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          {/* Note */}
          <ellipse
            cx="40"
            cy="54"
            rx="5"
            ry="3.8"
            transform="rotate(-18 40 54)"
            fill={isActNote ? '#FF5533' : '#F3F4F6'}
            style={isActNote ? { filter: 'drop-shadow(0 0 6px rgba(232, 74, 39, 0.65))' } : undefined}
          />
          <line
            x1="44.5"
            y1="54"
            x2="44.5"
            y2="25"
            stroke={isActNote ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            style={isActNote ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          <path
            d="M 44.5 25 Q 52 31 49 41"
            stroke={isActNote ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.6"
            fill="none"
            style={isActNote ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          {accentNote && (
            <text x="40" y="75" textAnchor="middle" fontFamily="Lora, serif" fontSize="15" fontWeight="700" fill={isActNote ? '#FF5533' : 'rgba(255,255,255,0.7)'}>
              &gt;
            </text>
          )}
        </svg>
      </div>
    );
  };

  // 5. Dotted Eighth + Sixteenth (Specific to Ritmo IV - Jaleos / Abandolaos)
  const DottedEighthAndSixteenth = ({
    stepStart,
    label1,
    label2,
  }: {
    stepStart: number;
    label1: string;
    label2: string;
  }) => {
    const stepSixteenth = stepStart + 3;
    const isAct1 = activeStep === stepStart;
    const isAct2 = activeStep === stepSixteenth;
    const isGroupActive = activeStep >= stepStart && activeStep <= stepStart + 3;

    return (
      <div
        id={`beatBox-${stepStart}`}
        onClick={() => onPreviewBeat?.(stepStart, 4)}
        className={`beat-group cursor-pointer rounded-lg transition-all px-0.5 ${
          isGroupActive ? 'active-beat bg-[#E84A27]/[0.18]' : 'hover:bg-white/[0.04]'
        }`}
        title={`Corchea con puntillo + semicorchea`}
      >
        <svg viewBox="0 0 64 92" className="w-15 sm:w-16 h-22 shrink-0 block overflow-visible">
          <line x1="0" y1="54" x2="64" y2="54" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
          <text x="16" y="20" textAnchor="middle" fontFamily="Lora, serif" fontSize="14" fontWeight="600" fill={isAct1 ? '#FF5533' : '#F3F4F6'}>
            {label1}
          </text>
          <text x="44" y="20" textAnchor="middle" fontFamily="Lora, serif" fontSize="14" fontWeight="600" fill={isAct2 ? '#FF5533' : '#F3F4F6'}>
            {label2}
          </text>
          {/* Dotted Eighth */}
          <ellipse
            cx="16"
            cy="54"
            rx="5"
            ry="3.8"
            transform="rotate(-18 16 54)"
            fill={isAct1 ? '#FF5533' : '#F3F4F6'}
            style={isAct1 ? { filter: 'drop-shadow(0 0 6px rgba(232, 74, 39, 0.65))' } : undefined}
          />
          <circle cx="24.5" cy="51" r="1.8" fill={isAct1 ? '#FF5533' : '#F3F4F6'} />
          <line
            x1="20.5"
            y1="54"
            x2="20.5"
            y2="26"
            stroke={isAct1 ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            style={isAct1 ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          {/* Sixteenth */}
          <ellipse
            cx="46"
            cy="54"
            rx="5"
            ry="3.8"
            transform="rotate(-18 46 54)"
            fill={isAct2 ? '#FF5533' : '#F3F4F6'}
            style={isAct2 ? { filter: 'drop-shadow(0 0 6px rgba(232, 74, 39, 0.65))' } : undefined}
          />
          <line
            x1="50.5"
            y1="54"
            x2="50.5"
            y2="26"
            stroke={isAct2 ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            style={isAct2 ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          {/* Beams */}
          <rect x="19.8" y="25" width="31.4" height="3.6" fill={isGroupActive ? '#FF5533' : '#F3F4F6'} />
          <rect x="41.2" y="31" width="10" height="3.2" fill={isGroupActive ? '#FF5533' : '#F3F4F6'} />
          <text x="16" y="75" textAnchor="middle" fontFamily="Lora, serif" fontSize="15" fontWeight="700" fill={isAct1 ? '#FF5533' : 'rgba(255,255,255,0.7)'}>
            &gt;
          </text>
        </svg>
      </div>
    );
  };

  // 6. 6/8 Groups for Ritmo VIII (Tanguillos)
  const TanguilloBeat1 = ({ stepStart, label }: { stepStart: number; label: string }) => {
    const isActRest = activeStep === stepStart;
    const isActNote1 = activeStep === stepStart + 1;
    const isActNote2 = activeStep === stepStart + 2;
    const isGroupActive = isActRest || isActNote1 || isActNote2;

    return (
      <div
        id={`beatBox-${stepStart}`}
        onClick={() => onPreviewBeat?.(stepStart, 3)}
        className={`beat-group cursor-pointer rounded-lg transition-all px-0.5 ${
          isGroupActive ? 'active-beat bg-[#E84A27]/[0.18]' : 'hover:bg-white/[0.04]'
        }`}
        title={`Tanguillo Pulso 1`}
      >
        <svg viewBox="0 0 82 92" className="w-20 h-22 shrink-0 block overflow-visible">
          <line x1="0" y1="54" x2="82" y2="54" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
          <text x="15" y="20" textAnchor="middle" fontFamily="Lora, serif" fontSize="14" fontWeight="600" fill={isGroupActive ? '#FF5533' : '#F3F4F6'}>
            {label}
          </text>
          {/* Rest */}
          <circle cx="14" cy="50" r="2" fill={isActRest ? '#FF5533' : '#F3F4F6'} />
          <path
            d="M 15 50 Q 19 51 16 61"
            stroke={isActRest ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            fill="none"
            style={isActRest ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          {/* Two Beamed Notes */}
          <ellipse
            cx="42"
            cy="54"
            rx="5"
            ry="3.8"
            transform="rotate(-18 42 54)"
            fill={isActNote1 ? '#FF5533' : '#F3F4F6'}
            style={isActNote1 ? { filter: 'drop-shadow(0 0 6px rgba(232, 74, 39, 0.65))' } : undefined}
          />
          <line
            x1="46.5"
            y1="54"
            x2="46.5"
            y2="26"
            stroke={isActNote1 ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            style={isActNote1 ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          <ellipse
            cx="66"
            cy="54"
            rx="5"
            ry="3.8"
            transform="rotate(-18 66 54)"
            fill={isActNote2 ? '#FF5533' : '#F3F4F6'}
            style={isActNote2 ? { filter: 'drop-shadow(0 0 6px rgba(232, 74, 39, 0.65))' } : undefined}
          />
          <line
            x1="70.5"
            y1="54"
            x2="70.5"
            y2="26"
            stroke={isActNote2 ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            style={isActNote2 ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          <rect x="45.8" y="25" width="25.4" height="3.6" fill={isGroupActive ? '#FF5533' : '#F3F4F6'} />
          <text x="42" y="75" textAnchor="middle" fontFamily="Lora, serif" fontSize="15" fontWeight="700" fill={isActNote1 ? '#FF5533' : 'rgba(255,255,255,0.7)'}>
            &gt;
          </text>
        </svg>
      </div>
    );
  };

  const TanguilloBeat2 = ({ stepStart, label }: { stepStart: number; label: string }) => {
    const isActNote1 = activeStep === stepStart;
    const isActNote2 = activeStep === stepStart + 1;
    const isActRest = activeStep === stepStart + 2;
    const isGroupActive = isActNote1 || isActNote2 || isActRest;

    return (
      <div
        id={`beatBox-${stepStart}`}
        onClick={() => onPreviewBeat?.(stepStart, 3)}
        className={`beat-group cursor-pointer rounded-lg transition-all px-0.5 ${
          isGroupActive ? 'active-beat bg-[#E84A27]/[0.18]' : 'hover:bg-white/[0.04]'
        }`}
        title={`Tanguillo Pulso 2`}
      >
        <svg viewBox="0 0 82 92" className="w-20 h-22 shrink-0 block overflow-visible">
          <line x1="0" y1="54" x2="82" y2="54" stroke="rgba(255,255,255,0.25)" strokeWidth="1.3" />
          <text x="18" y="20" textAnchor="middle" fontFamily="Lora, serif" fontSize="14" fontWeight="600" fill={isGroupActive ? '#FF5533' : '#F3F4F6'}>
            {label}
          </text>
          {/* Two Beamed Notes */}
          <ellipse
            cx="18"
            cy="54"
            rx="5"
            ry="3.8"
            transform="rotate(-18 18 54)"
            fill={isActNote1 ? '#FF5533' : '#F3F4F6'}
            style={isActNote1 ? { filter: 'drop-shadow(0 0 6px rgba(232, 74, 39, 0.65))' } : undefined}
          />
          <line
            x1="22.5"
            y1="54"
            x2="22.5"
            y2="26"
            stroke={isActNote1 ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            style={isActNote1 ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          <ellipse
            cx="42"
            cy="54"
            rx="5"
            ry="3.8"
            transform="rotate(-18 42 54)"
            fill={isActNote2 ? '#FF5533' : '#F3F4F6'}
            style={isActNote2 ? { filter: 'drop-shadow(0 0 6px rgba(232, 74, 39, 0.65))' } : undefined}
          />
          <line
            x1="46.5"
            y1="54"
            x2="46.5"
            y2="26"
            stroke={isActNote2 ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            style={isActNote2 ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
          <rect x="21.8" y="25" width="25.4" height="3.6" fill={isGroupActive ? '#FF5533' : '#F3F4F6'} />
          <text x="42" y="75" textAnchor="middle" fontFamily="Lora, serif" fontSize="15" fontWeight="700" fill={isActNote2 ? '#FF5533' : 'rgba(255,255,255,0.7)'}>
            &gt;
          </text>
          {/* Final Rest */}
          <circle cx="66" cy="50" r="2" fill={isActRest ? '#FF5533' : '#F3F4F6'} />
          <path
            d="M 67 50 Q 71 51 68 61"
            stroke={isActRest ? '#FF5533' : '#F3F4F6'}
            strokeWidth="1.5"
            fill="none"
            style={isActRest ? { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.5))' } : undefined}
          />
        </svg>
      </div>
    );
  };

  return (
    <div
      id="monogramSheetContainer"
      ref={containerRef}
      className="bg-[#181C26] text-white rounded-[16px] border border-white/[0.07] p-3 sm:p-4 shadow-xl overflow-x-auto select-none scroll-smooth"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="min-w-max flex flex-nowrap items-center justify-center mx-auto">
        {rhythm.id === 'r1' && (
          // RITMO I: 4 compases de 3/4 (Alegrías / Soleá por Bulería)
          <>
            <div className="flex items-center shrink-0">
              <ClefAndTimeSig num="3" den="4" includeClef={true} />
              <QuarterNote stepIdx={0} label={counts[0]} accent={false} />
              <EighthRestAndEighth stepRest={2} stepNote={3} label1={counts[1]} label2="" accentNote={false} />
              <QuarterNote stepIdx={4} label={counts[2]} accent={false} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <QuarterNote stepIdx={6} label={counts[3]} accent={false} />
              <QuarterNote stepIdx={8} label={counts[4]} accent={false} />
              <QuarterNote stepIdx={10} label={counts[5]} accent={false} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <QuarterNote stepIdx={12} label={counts[6]} accent={false} />
              <TwoBeamedEighths step1={14} step2={15} label1={counts[7]} label2="" accent1={false} accent2={false} />
              <QuarterNote stepIdx={16} label={counts[8]} accent={false} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <TwoBeamedEighths step1={18} step2={19} label1={counts[9]} label2="" accent1={false} accent2={false} />
              <QuarterNote stepIdx={20} label={counts[10]} accent={false} />
              <QuarterNote stepIdx={22} label={counts[11]} accent={false} />
              <Barline isFinal={true} />
            </div>
          </>
        )}

        {rhythm.id === 'r2' && (
          // RITMO II: Seguiriyas / Martinetes (2/4 | 2/4 | 3/4 | 3/4 | 2/4)
          <>
            <div className="flex items-center shrink-0">
              <ClefAndTimeSig num="2" den="4" includeClef={true} />
              <QuarterNote stepIdx={0} label="1" accent={true} />
              <TwoBeamedEighths step1={2} step2={3} label1="" label2="" accent1={false} accent2={false} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <QuarterNote stepIdx={4} label="2" accent={true} />
              <TwoBeamedEighths step1={6} step2={7} label1="" label2="" accent1={false} accent2={false} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <ClefAndTimeSig num="3" den="4" includeClef={false} />
              <QuarterNote stepIdx={8} label="3" accent={true} />
              <EighthRestAndEighth stepRest={10} stepNote={11} label1="" label2="" accentNote={false} />
              <QuarterNote stepIdx={12} label="" accent={false} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <QuarterNote stepIdx={14} label="4" accent={true} />
              <EighthRestAndEighth stepRest={16} stepNote={17} label1="" label2="" accentNote={false} />
              <QuarterNote stepIdx={18} label="" accent={false} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <ClefAndTimeSig num="2" den="4" includeClef={false} />
              <QuarterNote stepIdx={20} label="5" accent={true} />
              <TwoBeamedEighths step1={22} step2={23} label1="" label2="" accent1={false} accent2={false} />
              <Barline isFinal={true} />
            </div>
          </>
        )}

        {rhythm.id === 'r3' && (
          // RITMO III: Bulerías de Jerez (2 compases de 3/4)
          <>
            <div className="flex items-center shrink-0">
              <ClefAndTimeSig num="3" den="4" includeClef={true} />
              <EighthRestAndEighth stepRest={0} stepNote={1} label1={counts[0]} label2={counts[1]} accentNote={true} />
              <TwoBeamedEighths step1={2} step2={3} label1={counts[2]} label2={counts[3]} accent1={false} accent2={true} />
              <TwoBeamedEighths step1={4} step2={5} label1={counts[4]} label2={counts[5]} accent1={false} accent2={false} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <EighthRestAndEighth stepRest={6} stepNote={7} label1={counts[6]} label2={counts[7]} accentNote={true} />
              <TwoBeamedEighths step1={8} step2={9} label1={counts[8]} label2={counts[9]} accent1={false} accent2={true} />
              <TwoBeamedEighths step1={10} step2={11} label1={counts[10]} label2={counts[11]} accent1={false} accent2={false} />
              <Barline isFinal={true} />
            </div>
          </>
        )}

        {rhythm.id === 'r4' && (
          // RITMO IV: Jaleos / Abandolaos (2 compases de 3/4)
          <>
            <div className="flex items-center shrink-0">
              <ClefAndTimeSig num="3" den="4" includeClef={true} />
              <DottedEighthAndSixteenth stepStart={0} label1={counts[0]} label2={counts[1]} />
              <DottedEighthAndSixteenth stepStart={4} label1={counts[2]} label2={counts[3]} />
              <TwoBeamedEighths step1={8} step2={10} label1={counts[4]} label2={counts[5]} accent1={true} accent2={true} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <DottedEighthAndSixteenth stepStart={12} label1={counts[6]} label2={counts[7]} />
              <DottedEighthAndSixteenth stepStart={16} label1={counts[8]} label2={counts[9]} />
              <TwoBeamedEighths step1={20} step2={22} label1={counts[10]} label2={counts[11]} accent1={true} accent2={true} />
              <Barline isFinal={true} />
            </div>
          </>
        )}

        {rhythm.id === 'r5' && (
          // RITMO V: Fandangos / Sevillanas (4 compases de 3/4)
          <>
            <div className="flex items-center shrink-0">
              <ClefAndTimeSig num="3" den="4" includeClef={true} />
              <QuarterNote stepIdx={0} label="1" accent={true} />
              <QuarterNote stepIdx={1} label="2" accent={false} />
              <QuarterNote stepIdx={2} label="3" accent={false} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <QuarterNote stepIdx={3} label="1" accent={true} />
              <QuarterNote stepIdx={4} label="2" accent={false} />
              <QuarterNote stepIdx={5} label="3" accent={false} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <QuarterNote stepIdx={6} label="1" accent={true} />
              <QuarterNote stepIdx={7} label="2" accent={false} />
              <QuarterNote stepIdx={8} label="3" accent={false} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <QuarterNote stepIdx={9} label="1" accent={true} />
              <QuarterNote stepIdx={10} label="2" accent={true} />
              <QuarterRest stepIdx={11} label="3" />
              <Barline isFinal={true} />
            </div>
          </>
        )}

        {rhythm.id === 'r6' && (
          // RITMO VI: Tangos / Rumbas (2 compases de 4/4)
          <>
            <div className="flex items-center shrink-0">
              <ClefAndTimeSig num="4" den="4" includeClef={true} />
              <QuarterRest stepIdx={0} label="1" />
              <TwoBeamedEighths step1={2} step2={3} label1="2" label2="" accent1={true} accent2={false} />
              <QuarterNote stepIdx={4} label="3" accent={false} />
              <QuarterNote stepIdx={6} label="4" accent={true} />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <QuarterRest stepIdx={8} label="1" />
              <TwoBeamedEighths step1={10} step2={11} label1="2" label2="" accent1={true} accent2={false} />
              <QuarterNote stepIdx={12} label="3" accent={false} />
              <QuarterNote stepIdx={14} label="4" accent={true} />
              <Barline isFinal={true} />
            </div>
          </>
        )}

        {rhythm.id === 'r7' && (
          // RITMO VII: Tientos / Farruca (2 compases de 4/4)
          <>
            <div className="flex items-center shrink-0">
              <ClefAndTimeSig num="4" den="4" includeClef={true} />
              <QuarterNote stepIdx={0} label="1" accent={false} />
              <EighthRestAndEighth stepRest={2} stepNote={3} label1="2" label2="y" accentNote={false} />
              <QuarterNote stepIdx={4} label="3" accent={false} />
              <QuarterRest stepIdx={6} label="4" />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <QuarterNote stepIdx={8} label="1" accent={false} />
              <EighthRestAndEighth stepRest={10} stepNote={11} label1="2" label2="y" accentNote={false} />
              <QuarterNote stepIdx={12} label="3" accent={false} />
              <QuarterRest stepIdx={14} label="4" />
              <Barline isFinal={true} />
            </div>
          </>
        )}

        {rhythm.id === 'r8' && (
          // RITMO VIII: Tanguillos (2 compases de 6/8)
          <>
            <div className="flex items-center shrink-0">
              <ClefAndTimeSig num="6" den="8" includeClef={true} />
              <TanguilloBeat1 stepStart={0} label="1" />
              <TanguilloBeat2 stepStart={3} label="2" />
              <Barline />
            </div>
            <div className="flex items-center shrink-0">
              <TanguilloBeat1 stepStart={6} label="1" />
              <TanguilloBeat2 stepStart={9} label="2" />
              <Barline isFinal={true} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const MonogramScore = React.memo(MonogramScoreComponent);
