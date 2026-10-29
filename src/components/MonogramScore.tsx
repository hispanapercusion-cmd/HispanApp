import React, { useRef, useEffect } from 'react';
import { RhythmDefinition } from '../types';

// Escala común de todas las figuras y alturas dentro de cada dibujo (unidades del viewBox)
const S = 0.95;
const VIEW_H = 92;
const STAFF_Y = 54;
const STEM_TOP = 23;
const ACCENT_Y = 73;

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

  // ===== Dibujo de la partitura =====
  // Todas las figuras comparten la misma escala (S) y la misma altura de pentagrama (STAFF_Y),
  // así la línea es una sola y continua, dibujada una vez debajo de todo.
  const INK = '#F3F4F6';
  const ACTIVE = '#FF5533';
  const LINE = 'rgba(255,255,255,0.28)';
  const glowHead = { filter: 'drop-shadow(0 0 6px rgba(232, 74, 39, 0.7))' };
  const glowLine = { filter: 'drop-shadow(0 0 4px rgba(232, 74, 39, 0.55))' };
  const ink = (active: boolean) => (active ? ACTIVE : INK);

  const Svg = ({ w, children }: { w: number; children: React.ReactNode }) => (
    <svg
      viewBox={`0 0 ${w} ${VIEW_H}`}
      width={w * S}
      height={VIEW_H * S}
      className="shrink-0 block overflow-visible select-none"
    >
      {children}
    </svg>
  );

  // Cabeza de nota inclinada, como en una partitura impresa
  const Head = ({ cx, active }: { cx: number; active: boolean }) => (
    <ellipse
      cx={cx}
      cy={STAFF_Y}
      rx="5.7"
      ry="4.2"
      transform={`rotate(-20 ${cx} ${STAFF_Y})`}
      fill={ink(active)}
      style={active ? glowHead : undefined}
    />
  );

  // Plica: sale del borde derecho de la cabeza hasta la altura indicada
  const Stem = ({ cx, active, top = STEM_TOP }: { cx: number; active: boolean; top?: number }) => (
    <line
      x1={cx + 5}
      y1={STAFF_Y - 1.5}
      x2={cx + 5}
      y2={top}
      stroke={ink(active)}
      strokeWidth="1.6"
      style={active ? glowLine : undefined}
    />
  );

  // Barra que une corcheas (de la plica de x1 a la plica de x2)
  const Beam = ({ x1, x2, active, y = STEM_TOP, h = 4.4 }: { x1: number; x2: number; active: boolean; y?: number; h?: number }) => (
    <rect x={x1 + 4.2} y={y} width={x2 - x1 + 1.6} height={h} fill={ink(active)} />
  );

  // Banderín de corchea suelta
  const Flag = ({ cx, active }: { cx: number; active: boolean }) => {
    const x = cx + 5;
    const t = STEM_TOP;
    return (
      <path
        d={`M ${x} ${t} C ${x + 0.6} ${t + 6} ${x + 8.5} ${t + 8} ${x + 7.2} ${t + 18} C ${x + 6.8} ${t + 12} ${x + 3} ${t + 10.5} ${x} ${t + 9} Z`}
        fill={ink(active)}
        style={active ? glowLine : undefined}
      />
    );
  };

  // Número de la cuenta sobre la nota
  const Label = ({ x, text, active }: { x: number; text: string; active: boolean }) =>
    text ? (
      <text
        x={x}
        y="17"
        textAnchor="middle"
        fontFamily="Lora, serif"
        fontSize="13.5"
        fontWeight="600"
        fill={active ? ACTIVE : 'rgba(243,244,246,0.92)'}
      >
        {text}
      </text>
    ) : null;

  // Acento (>) bajo la nota, dibujado como trazo para que se vea nítido
  const Accent = ({ x, active }: { x: number; active: boolean }) => (
    <path
      d={`M ${x - 5} ${ACCENT_Y - 3.5} L ${x + 5} ${ACCENT_Y} L ${x - 5} ${ACCENT_Y + 3.5}`}
      stroke={active ? ACTIVE : 'rgba(255,255,255,0.75)'}
      strokeWidth="1.7"
      fill="none"
      strokeLinejoin="miter"
    />
  );

  // Silencio de corchea
  const EighthRestGlyph = ({ cx, active }: { cx: number; active: boolean }) => (
    <g style={active ? glowLine : undefined}>
      <circle cx={cx - 2.2} cy={STAFF_Y - 5} r="2.3" fill={ink(active)} />
      <path
        d={`M ${cx - 2.6} ${STAFF_Y - 3.4} Q ${cx + 1} ${STAFF_Y - 2.2} ${cx + 4.2} ${STAFF_Y - 6.5} L ${cx - 0.2} ${STAFF_Y + 8}`}
        stroke={ink(active)}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );

  // Silencio de negra
  const QuarterRestGlyph = ({ cx, active }: { cx: number; active: boolean }) => (
    <path
      transform={`translate(${cx} ${STAFF_Y - 2}) scale(1.3) translate(${-cx} ${-(STAFF_Y - 2)})`}
      d={`M ${cx - 2.5} ${STAFF_Y - 14} L ${cx + 3.2} ${STAFF_Y - 7.5} Q ${cx - 0.6} ${STAFF_Y - 4} ${cx + 0.2} ${STAFF_Y - 0.5} L ${cx + 3.6} ${STAFF_Y + 3.8} Q ${cx - 2.4} ${STAFF_Y + 2.4} ${cx - 1.2} ${STAFF_Y + 7.4} Q ${cx - 0.4} ${STAFF_Y + 9.6} ${cx + 1.4} ${STAFF_Y + 10.4} Q ${cx - 4.6} ${STAFF_Y + 9.8} ${cx - 3.8} ${STAFF_Y + 4.6} Q ${cx - 3.2} ${STAFF_Y + 1.4} ${cx + 0.2} ${STAFF_Y + 1.2} L ${cx - 3.6} ${STAFF_Y - 3.4} Q ${cx - 0.4} ${STAFF_Y - 6.6} ${cx - 1} ${STAFF_Y - 10} Z`}
      fill={ink(active)}
      style={active ? glowLine : undefined}
    />
  );

  // Caja clicable de cada pulso (mantiene ids, resaltado y vista previa de sonido)
  const BeatBox = ({
    id,
    active,
    title,
    onClick,
    children,
  }: {
    id: string;
    active: boolean;
    title: string;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <div
      id={id}
      onClick={onClick}
      className={`beat-group cursor-pointer rounded-lg transition-colors ${
        active ? 'active-beat bg-[#E84A27]/[0.16]' : 'hover:bg-white/[0.04]'
      }`}
      title={title}
    >
      {children}
    </div>
  );

  const ClefAndTimeSig = ({ num, den, includeClef = true }: { num: string; den: string; includeClef?: boolean }) => (
    <Svg w={includeClef ? 40 : 26}>
      {includeClef && (
        <>
          <rect x="5" y={STAFF_Y - 9} width="3" height="18" fill={INK} />
          <rect x="11" y={STAFF_Y - 9} width="3" height="18" fill={INK} />
        </>
      )}
      <text x={includeClef ? 29 : 14} y={STAFF_Y - 2.5} textAnchor="middle" fontFamily="Lora, serif" fontSize="19" fontWeight="700" fill={INK}>
        {num}
      </text>
      <text x={includeClef ? 29 : 14} y={STAFF_Y + 16.5} textAnchor="middle" fontFamily="Lora, serif" fontSize="19" fontWeight="700" fill={INK}>
        {den}
      </text>
    </Svg>
  );

  const Barline = ({ isFinal = false }: { isFinal?: boolean }) => (
    <Svg w={16}>
      {isFinal ? (
        <>
          <line x1="8.5" y1={STAFF_Y - 16} x2="8.5" y2={STAFF_Y + 16} stroke={LINE} strokeWidth="1.5" />
          <rect x="12" y={STAFF_Y - 16} width="3.4" height="32" fill={INK} />
        </>
      ) : (
        <line x1="8" y1={STAFF_Y - 16} x2="8" y2={STAFF_Y + 16} stroke={LINE} strokeWidth="1.5" />
      )}
    </Svg>
  );

  // 1. Negra
  const QuarterNote = ({ stepIdx, label, accent = false }: { stepIdx: number; label: string; accent?: boolean }) => {
    const a = activeStep === stepIdx;
    return (
      <BeatBox id={`beatBox-${stepIdx}`} active={a} title={`Paso ${stepIdx + 1} - Clic para escuchar`} onClick={() => onPreviewBeat?.(stepIdx, 1)}>
        <Svg w={48}>
          <Label x={22} text={label} active={a} />
          <Head cx={22} active={a} />
          <Stem cx={22} active={a} />
          {accent && <Accent x={22} active={a} />}
        </Svg>
      </BeatBox>
    );
  };

  // 2. Silencio de negra
  const QuarterRest = ({ stepIdx, label }: { stepIdx: number; label: string }) => {
    const a = activeStep === stepIdx;
    return (
      <BeatBox id={`beatBox-${stepIdx}`} active={a} title={`Paso ${stepIdx + 1} - Silencio`} onClick={() => onPreviewBeat?.(stepIdx, 1)}>
        <Svg w={48}>
          <Label x={24} text={label} active={a} />
          <QuarterRestGlyph cx={24} active={a} />
        </Svg>
      </BeatBox>
    );
  };

  // 3. Dos corcheas unidas
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
    const a1 = activeStep === step1;
    const a2 = activeStep === step2;
    return (
      <BeatBox id={`beatBox-${step1}`} active={a1 || a2} title={`Corcheas ${step1 + 1}-${step2 + 1}`} onClick={() => onPreviewBeat?.(step1, 2)}>
        <Svg w={60}>
          <Label x={17} text={label1} active={a1} />
          <Label x={41} text={label2} active={a2} />
          <Head cx={17} active={a1} />
          <Stem cx={17} active={a1} />
          <Head cx={41} active={a2} />
          <Stem cx={41} active={a2} />
          <Beam x1={17} x2={41} active={a1 || a2} />
          {accent1 && <Accent x={17} active={a1} />}
          {accent2 && <Accent x={41} active={a2} />}
        </Svg>
      </BeatBox>
    );
  };

  // 4. Silencio de corchea + corchea con banderín
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
    const aR = activeStep === stepRest;
    const aN = activeStep === stepNote;
    return (
      <BeatBox id={`beatBox-${stepRest}`} active={aR || aN} title={`Contratiempo ${stepRest + 1}-${stepNote + 1}`} onClick={() => onPreviewBeat?.(stepRest, 2)}>
        <Svg w={60}>
          <Label x={16} text={label1} active={aR} />
          <Label x={39} text={label2} active={aN} />
          <EighthRestGlyph cx={16} active={aR} />
          <Head cx={39} active={aN} />
          <Stem cx={39} active={aN} />
          <Flag cx={39} active={aN} />
          {accentNote && <Accent x={39} active={aN} />}
        </Svg>
      </BeatBox>
    );
  };

  // 5. Corchea con puntillo + semicorchea (Ritmo IV - Jaleos / Abandolaos)
  const DottedEighthAndSixteenth = ({
    stepStart,
    label1,
    label2,
  }: {
    stepStart: number;
    label1: string;
    label2: string;
  }) => {
    const a1 = activeStep === stepStart;
    const a2 = activeStep === stepStart + 3;
    const group = activeStep >= stepStart && activeStep <= stepStart + 3;
    return (
      <BeatBox id={`beatBox-${stepStart}`} active={group} title="Corchea con puntillo + semicorchea" onClick={() => onPreviewBeat?.(stepStart, 4)}>
        <Svg w={64}>
          <Label x={15} text={label1} active={a1} />
          <Label x={45} text={label2} active={a2} />
          <Head cx={15} active={a1} />
          <circle cx={26} cy={STAFF_Y - 2.5} r="1.9" fill={ink(a1)} />
          <Stem cx={15} active={a1} />
          <Head cx={45} active={a2} />
          <Stem cx={45} active={a2} />
          <Beam x1={15} x2={45} active={group} />
          {/* Segunda barra, corta, de la semicorchea */}
          <rect x={45 + 5 - 9} y={STEM_TOP + 7} width="9.8" height="4" fill={ink(group)} />
          <Accent x={15} active={a1} />
        </Svg>
      </BeatBox>
    );
  };

  // 6. Pulsos de 6/8 para Ritmo VIII (Tanguillos)
  const TanguilloBeat1 = ({ stepStart, label }: { stepStart: number; label: string }) => {
    const aR = activeStep === stepStart;
    const a1 = activeStep === stepStart + 1;
    const a2 = activeStep === stepStart + 2;
    const group = aR || a1 || a2;
    return (
      <BeatBox id={`beatBox-${stepStart}`} active={group} title="Tanguillo Pulso 1" onClick={() => onPreviewBeat?.(stepStart, 3)}>
        <Svg w={82}>
          <Label x={15} text={label} active={group} />
          <EighthRestGlyph cx={15} active={aR} />
          <Head cx={41} active={a1} />
          <Stem cx={41} active={a1} />
          <Head cx={65} active={a2} />
          <Stem cx={65} active={a2} />
          <Beam x1={41} x2={65} active={group} />
          <Accent x={41} active={a1} />
        </Svg>
      </BeatBox>
    );
  };

  const TanguilloBeat2 = ({ stepStart, label }: { stepStart: number; label: string }) => {
    const a1 = activeStep === stepStart;
    const a2 = activeStep === stepStart + 1;
    const aR = activeStep === stepStart + 2;
    const group = a1 || a2 || aR;
    return (
      <BeatBox id={`beatBox-${stepStart}`} active={group} title="Tanguillo Pulso 2" onClick={() => onPreviewBeat?.(stepStart, 3)}>
        <Svg w={82}>
          <Label x={17} text={label} active={group} />
          <Head cx={17} active={a1} />
          <Stem cx={17} active={a1} />
          <Head cx={41} active={a2} />
          <Stem cx={41} active={a2} />
          <Beam x1={17} x2={41} active={group} />
          <Accent x={41} active={a2} />
          <EighthRestGlyph cx={67} active={aR} />
        </Svg>
      </BeatBox>
    );
  };

  return (
    <div
      id="monogramSheetContainer"
      ref={containerRef}
      className="score-panel text-white rounded-2xl p-3 sm:p-4 overflow-x-auto select-none scroll-smooth"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="min-w-max flex justify-center">
      <div className="relative flex flex-nowrap items-start">
        {/* Línea del pentagrama: una sola, continua, por debajo de todas las figuras */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-[1px] pointer-events-none"
          style={{ top: STAFF_Y * S - 0.65, height: 1.3, background: 'rgba(255,255,255,0.28)' }}
        />
        {rhythm.id === 'r1' && (
          // RITMO I: 4 compases de 3/4 (Alegrías / Soleá por Bulería)
          <>
            <div className="flex items-start shrink-0">
              <ClefAndTimeSig num="3" den="4" includeClef={true} />
              <QuarterNote stepIdx={0} label={counts[0]} accent={false} />
              <EighthRestAndEighth stepRest={2} stepNote={3} label1={counts[1]} label2="" accentNote={false} />
              <QuarterNote stepIdx={4} label={counts[2]} accent={false} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
              <QuarterNote stepIdx={6} label={counts[3]} accent={false} />
              <QuarterNote stepIdx={8} label={counts[4]} accent={false} />
              <QuarterNote stepIdx={10} label={counts[5]} accent={false} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
              <QuarterNote stepIdx={12} label={counts[6]} accent={false} />
              <TwoBeamedEighths step1={14} step2={15} label1={counts[7]} label2="" accent1={false} accent2={false} />
              <QuarterNote stepIdx={16} label={counts[8]} accent={false} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
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
            <div className="flex items-start shrink-0">
              <ClefAndTimeSig num="2" den="4" includeClef={true} />
              <QuarterNote stepIdx={0} label="1" accent={true} />
              <TwoBeamedEighths step1={2} step2={3} label1="" label2="" accent1={false} accent2={false} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
              <QuarterNote stepIdx={4} label="2" accent={true} />
              <TwoBeamedEighths step1={6} step2={7} label1="" label2="" accent1={false} accent2={false} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
              <ClefAndTimeSig num="3" den="4" includeClef={false} />
              <QuarterNote stepIdx={8} label="3" accent={true} />
              <EighthRestAndEighth stepRest={10} stepNote={11} label1="" label2="" accentNote={false} />
              <QuarterNote stepIdx={12} label="" accent={false} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
              <QuarterNote stepIdx={14} label="4" accent={true} />
              <EighthRestAndEighth stepRest={16} stepNote={17} label1="" label2="" accentNote={false} />
              <QuarterNote stepIdx={18} label="" accent={false} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
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
            <div className="flex items-start shrink-0">
              <ClefAndTimeSig num="3" den="4" includeClef={true} />
              <EighthRestAndEighth stepRest={0} stepNote={1} label1={counts[0]} label2={counts[1]} accentNote={true} />
              <TwoBeamedEighths step1={2} step2={3} label1={counts[2]} label2={counts[3]} accent1={false} accent2={true} />
              <TwoBeamedEighths step1={4} step2={5} label1={counts[4]} label2={counts[5]} accent1={false} accent2={false} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
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
            <div className="flex items-start shrink-0">
              <ClefAndTimeSig num="3" den="4" includeClef={true} />
              <DottedEighthAndSixteenth stepStart={0} label1={counts[0]} label2={counts[1]} />
              <DottedEighthAndSixteenth stepStart={4} label1={counts[2]} label2={counts[3]} />
              <TwoBeamedEighths step1={8} step2={10} label1={counts[4]} label2={counts[5]} accent1={true} accent2={true} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
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
            <div className="flex items-start shrink-0">
              <ClefAndTimeSig num="3" den="4" includeClef={true} />
              <QuarterNote stepIdx={0} label="1" accent={true} />
              <QuarterNote stepIdx={1} label="2" accent={false} />
              <QuarterNote stepIdx={2} label="3" accent={false} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
              <QuarterNote stepIdx={3} label="1" accent={true} />
              <QuarterNote stepIdx={4} label="2" accent={false} />
              <QuarterNote stepIdx={5} label="3" accent={false} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
              <QuarterNote stepIdx={6} label="1" accent={true} />
              <QuarterNote stepIdx={7} label="2" accent={false} />
              <QuarterNote stepIdx={8} label="3" accent={false} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
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
            <div className="flex items-start shrink-0">
              <ClefAndTimeSig num="4" den="4" includeClef={true} />
              <QuarterRest stepIdx={0} label="1" />
              <TwoBeamedEighths step1={2} step2={3} label1="2" label2="" accent1={true} accent2={false} />
              <QuarterNote stepIdx={4} label="3" accent={false} />
              <QuarterNote stepIdx={6} label="4" accent={true} />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
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
            <div className="flex items-start shrink-0">
              <ClefAndTimeSig num="4" den="4" includeClef={true} />
              <QuarterNote stepIdx={0} label="1" accent={false} />
              <EighthRestAndEighth stepRest={2} stepNote={3} label1="2" label2="y" accentNote={false} />
              <QuarterNote stepIdx={4} label="3" accent={false} />
              <QuarterRest stepIdx={6} label="4" />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
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
            <div className="flex items-start shrink-0">
              <ClefAndTimeSig num="6" den="8" includeClef={true} />
              <TanguilloBeat1 stepStart={0} label="1" />
              <TanguilloBeat2 stepStart={3} label="2" />
              <Barline />
            </div>
            <div className="flex items-start shrink-0">
              <TanguilloBeat1 stepStart={6} label="1" />
              <TanguilloBeat2 stepStart={9} label="2" />
              <Barline isFinal={true} />
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export const MonogramScore = React.memo(MonogramScoreComponent);
