import React, { useEffect, useRef } from 'react';
import { CajonHit, RhythmDefinition } from '../types';
import { useLang } from '../i18n';

// Partitura del cajón: 4 compases de 3/4, ocho corcheas por compás, siempre mano derecha (D) e izquierda (I) alternadas.
//   Bajo = nota de abajo · Agudo = nota de arriba · Fantasma = cabeza de cruz (✕).
const BEAT_W = 64;
const BAR_W = BEAT_W * 3;
const LEFT = 52;
const GAP = 14;
const H = 112;
const LINES = [42, 49, 56, 63, 70]; // pentagrama de 5 líneas
const Y_AGUDO = 42;
const Y_FANTASMA = 56;
const Y_BAJO = 77;
const BEAM_Y = 24;
const LETTER_Y = 100;
const COUNT_Y = 15;
const INK = '#F3F4F6';
const ACTIVE = '#FF5533';
const LINE = 'rgba(255,255,255,0.28)';

interface CajonScoreProps {
  rhythm: RhythmDefinition;
  activeStep: number;
  countMode: 'phonetic' | 'traditional';
}

const CajonScoreComponent: React.FC<CajonScoreProps> = ({ rhythm, activeStep, countMode }) => {
  const { L } = useLang();
  const boxRef = useRef<HTMLDivElement>(null);
  const steps = rhythm.cajon;

  // En pantallas angostas la partitura se desplaza sola para seguir el golpe que suena
  useEffect(() => {
    const box = boxRef.current;
    if (!box || activeStep < 0) return;
    const beat = Math.floor(activeStep / 2);
    const x = 12 + LEFT + Math.floor(beat / 3) * (BAR_W + GAP) + (beat % 3) * BEAT_W + 32; // centro del tiempo
    if (x < box.scrollLeft + 60 || x > box.scrollLeft + box.clientWidth - 60) {
      box.scrollTo({ left: Math.max(0, x - box.clientWidth / 2), behavior: 'smooth' });
    }
  }, [activeStep]);

  if (!steps) return null;
  const counts = rhythm.has12CountToggle && countMode === 'traditional' ? rhythm.countsTrad : rhythm.countsPhon;
  const totalW = LEFT + 4 * (BAR_W + GAP) + 6;

  const headY = (hit: string) => (hit === 'B' ? Y_BAJO : hit === 'A' ? Y_AGUDO : Y_FANTASMA);

  const nodes: React.ReactNode[] = [];
  for (let beat = 0; beat < 12; beat++) {
    const bar = Math.floor(beat / 3);
    const x0 = LEFT + bar * (BAR_W + GAP) + (beat % 3) * BEAT_W;
    const xs = [x0 + 18, x0 + 46];
    const hits: CajonHit[] = [steps[beat * 2], steps[beat * 2 + 1]];
    const active = [activeStep === beat * 2, activeStep === beat * 2 + 1];
    const anyActive = active[0] || active[1];

    // Número del tiempo (se ilumina con el golpe)
    nodes.push(
      <text key={`c${beat}`} x={xs[0]} y={COUNT_Y} textAnchor="middle" fontFamily="Lora, serif" fontSize={anyActive ? 16 : 13.5} fontWeight={anyActive ? 800 : 600}
        fill={anyActive ? '#FFFFFF' : 'rgba(243,244,246,0.92)'} style={anyActive ? { filter: 'drop-shadow(0 0 5px rgba(255,85,51,0.95))' } : undefined}>
        {counts[beat]}
      </text>
    );

    // Dos corcheas unidas: plicas hacia arriba y una barra
    const both = hits[0] !== 'R' && hits[1] !== 'R';
    xs.forEach((x, i) => {
      const hit = hits[i];
      if (hit === 'R') return;
      const col = active[i] ? ACTIVE : INK;
      const y = headY(hit);
      nodes.push(<line key={`s${beat}-${i}`} x1={x + 4.2} y1={y - 1} x2={x + 4.2} y2={BEAM_Y} stroke={col} strokeWidth={1.6} />);
      if (hit === 'G') {
        nodes.push(
          <g key={`h${beat}-${i}`} stroke={col} strokeWidth={1.9} strokeLinecap="round">
            <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} />
            <line x1={x - 4} y1={y + 4} x2={x + 4} y2={y - 4} />
          </g>
        );
      } else {
        nodes.push(<ellipse key={`h${beat}-${i}`} cx={x} cy={y} rx={5.4} ry={3.9} fill={col} transform={`rotate(-18 ${x} ${y})`} style={active[i] ? { filter: 'drop-shadow(0 0 5px rgba(255,85,51,0.9))' } : undefined} />);
      }
      // Mano: D (derecha) en los pasos pares, I (izquierda) en los impares
      nodes.push(
        <text key={`l${beat}-${i}`} x={x} y={LETTER_Y} textAnchor="middle" fontFamily="Lora, serif" fontSize={active[i] ? 17 : 15} fontWeight={active[i] ? 800 : 500} fill={active[i] ? ACTIVE : INK}>
          {i === 0 ? 'D' : 'I'}
        </text>
      );
    });
    if (both) {
      nodes.push(<rect key={`b${beat}`} x={xs[0] + 3.4} y={BEAM_Y} width={xs[1] - xs[0] + 1.6} height={4.2} fill={anyActive ? ACTIVE : INK} />);
    } else {
      // Una sola corchea: bandera sencilla
      const i = hits[0] !== 'R' ? 0 : 1;
      if (hits[i] !== 'R') nodes.push(<path key={`f${beat}`} d={`M ${xs[i] + 4.2} ${BEAM_Y} q 9 4 6 16`} fill="none" stroke={active[i] ? ACTIVE : INK} strokeWidth={2.2} />);
    }
  }

  return (
    <div ref={boxRef} className="score-panel text-white rounded-2xl p-3 sm:p-4 overflow-x-auto select-none" data-testid="cajon-score">
      <div className="min-w-max flex justify-center">
        <svg width={totalW} height={H} viewBox={`0 0 ${totalW} ${H}`} role="img" aria-label={L('Partitura del cajón', 'Cajón score')}>
          {/* Pentagrama */}
          {LINES.map((y) => (
            <line key={y} x1={0} y1={y} x2={totalW - 2} y2={y} stroke={LINE} strokeWidth={1.2} />
          ))}
          {/* Clave de percusión y compás */}
          <rect x={6} y={LINES[1]} width={3.2} height={LINES[3] - LINES[1]} fill={INK} />
          <rect x={12} y={LINES[1]} width={3.2} height={LINES[3] - LINES[1]} fill={INK} />
          <text x={32} y={LINES[2] - 1} textAnchor="middle" fontFamily="Lora, serif" fontSize={19} fontWeight={700} fill={INK}>3</text>
          <text x={32} y={LINES[4] - 1} textAnchor="middle" fontFamily="Lora, serif" fontSize={19} fontWeight={700} fill={INK}>4</text>
          {nodes}
          {/* Barras de compás */}
          {[0, 1, 2].map((b) => {
            const x = LEFT + (b + 1) * (BAR_W + GAP) - GAP / 2 - 2;
            return <line key={b} x1={x} y1={LINES[0]} x2={x} y2={LINES[4]} stroke={LINE} strokeWidth={1.5} />;
          })}
          <line x1={totalW - 9} y1={LINES[0]} x2={totalW - 9} y2={LINES[4]} stroke={LINE} strokeWidth={1.5} />
          <rect x={totalW - 6} y={LINES[0]} width={3.6} height={LINES[4] - LINES[0]} fill={INK} />
        </svg>
      </div>
      <p className="mt-1 text-center text-[11.5px] leading-snug text-gray-400 font-sans">
        {L(
          'Bajo: nota de abajo · Agudo: nota de arriba · Fantasma: cabeza de cruz (✕, muy suave) · D = mano derecha, I = mano izquierda',
          'Bass: bottom note · High: top note · Ghost: cross head (✕, very soft) · D = right hand, I = left hand'
        )}
      </p>
    </div>
  );
};

export const CajonScore = React.memo(CajonScoreComponent);
