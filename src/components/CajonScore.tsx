import React, { useEffect, useRef } from 'react';
import { CajonHit, RhythmDefinition } from '../types';
import { useLang } from '../i18n';

// Partitura del cajón: compases de 2 o 3 tiempos, con 2 corcheas o 4 semicorcheas por tiempo, siempre mano derecha (D)
// e izquierda (I) alternadas.
//   Bajo = nota de abajo · Agudo = nota de arriba · Fantasma = cabeza de cruz (✕).
const NOTE_SP = 28; // separación entre golpes
const LEFT = 52;
const GAP = 14;
const SIG_W = 30; // lugar para el cambio de compás (2/4 ↔ 3/4)
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
  const barsDef = rhythm.cajonBars ?? [3, 3, 3, 3];
  const totalBeats = barsDef.reduce((a, b) => a + b, 0);
  const notesPerBeat = steps ? Math.max(1, Math.round(steps.length / totalBeats)) : 2; // 2 = corcheas · 4 = semicorcheas
  // Golpes de cajón por cada paso del ritmo (con semicorcheas, 2 golpes se iluminan a la vez)
  const sub = steps ? Math.max(1, Math.round(steps.length / rhythm.steps.length)) : 1;
  const beatW = notesPerBeat * NOTE_SP + 8;

  // Posición de cada compás y de cada tiempo
  let cursor = LEFT;
  const bars = barsDef.map((beats, i) => {
    const showSig = i > 0 && beats !== barsDef[i - 1];
    if (showSig) cursor += SIG_W;
    const bar = { start: cursor, beats, showSig };
    cursor += beats * beatW + GAP;
    return bar;
  });
  const beatX: number[] = [];
  bars.forEach((b) => {
    for (let k = 0; k < b.beats; k++) beatX.push(b.start + k * beatW);
  });

  // En pantallas angostas la partitura se desplaza sola para seguir el golpe que suena
  useEffect(() => {
    const box = boxRef.current;
    if (!box || activeStep < 0) return;
    const note = activeStep * sub;
    const bx = beatX[Math.floor(note / notesPerBeat)];
    if (bx === undefined) return;
    const x = 12 + bx + 18 + (note % notesPerBeat) * NOTE_SP; // x del golpe (12 = relleno del panel)
    if (x < box.scrollLeft + 60 || x > box.scrollLeft + box.clientWidth - 60) {
      box.scrollTo({ left: Math.max(0, x - box.clientWidth / 2), behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  if (!steps) return null;
  const counts = rhythm.has12CountToggle && countMode === 'traditional' ? rhythm.countsTrad : rhythm.countsPhon;
  const last = bars[bars.length - 1];
  const totalW = last.start + last.beats * beatW + 6;

  const headY = (hit: string) => (hit === 'B' ? Y_BAJO : hit === 'A' ? Y_AGUDO : Y_FANTASMA);
  const isActive = (noteIdx: number) => activeStep >= 0 && Math.floor(noteIdx / sub) === activeStep;

  const nodes: React.ReactNode[] = [];
  const allNotes: { x: number; hit: CajonHit; idx: number }[] = [];
  for (let beat = 0; beat < beatX.length; beat++) {
    const x0 = beatX[beat];
    const group: { x: number; hit: CajonHit; idx: number }[] = [];
    for (let i = 0; i < notesPerBeat; i++) {
      const idx = beat * notesPerBeat + i;
      group.push({ x: x0 + 18 + i * NOTE_SP, hit: steps[idx], idx });
    }
    allNotes.push(...group);

    group.forEach((n) => {
      const act = isActive(n.idx);
      // Número del tiempo (cada 2 golpes; se ilumina con el golpe)
      if (n.idx % 2 === 0) {
        const raw = counts[n.idx / 2];
        const label = raw === '·' || raw === undefined ? '' : raw;
        const on = act || isActive(n.idx + 1);
        nodes.push(
          <text key={`c${n.idx}`} x={n.x} y={COUNT_Y} textAnchor="middle" fontFamily="Lora, serif" fontSize={on ? 16 : 13.5} fontWeight={on ? 800 : 600}
            fill={on ? '#FFFFFF' : 'rgba(243,244,246,0.92)'} style={on ? { filter: 'drop-shadow(0 0 5px rgba(255,85,51,0.95))' } : undefined}>
            {label}
          </text>
        );
      }
      if (n.hit === 'R') return;
      const col = act ? ACTIVE : INK;
      const y = headY(n.hit);
      nodes.push(<line key={`s${n.idx}`} x1={n.x + 4.2} y1={y - 1} x2={n.x + 4.2} y2={BEAM_Y} stroke={col} strokeWidth={1.6} />);
      if (n.hit === 'G') {
        nodes.push(
          <g key={`h${n.idx}`} stroke={col} strokeWidth={1.9} strokeLinecap="round">
            <line x1={n.x - 4} y1={y - 4} x2={n.x + 4} y2={y + 4} />
            <line x1={n.x - 4} y1={y + 4} x2={n.x + 4} y2={y - 4} />
          </g>
        );
      } else {
        nodes.push(<ellipse key={`h${n.idx}`} cx={n.x} cy={y} rx={5.4} ry={3.9} fill={col} transform={`rotate(-18 ${n.x} ${y})`} style={act ? { filter: 'drop-shadow(0 0 5px rgba(255,85,51,0.9))' } : undefined} />);
      }
      // Mano: D (derecha) en los golpes pares, I (izquierda) en los impares
      nodes.push(
        <text key={`l${n.idx}`} x={n.x} y={LETTER_Y} textAnchor="middle" fontFamily="Lora, serif" fontSize={act ? 17 : 15} fontWeight={act ? 800 : 500} fill={act ? ACTIVE : INK}>
          {n.idx % 2 === 0 ? 'D' : 'I'}
        </text>
      );
    });

  }

  // Barras de unión: una para corcheas, dos para semicorcheas. Se unen de a `beamNotes` golpes
  // (por defecto los de un tiempo; en 4/4 las corcheas se unen de a 4, medio compás).
  const beamNotes = Math.max(2, rhythm.cajonBeamNotes ?? notesPerBeat);
  const beams = notesPerBeat >= 4 ? 2 : 1;
  for (let c = 0; c * beamNotes < allNotes.length; c++) {
    const present = allNotes.slice(c * beamNotes, (c + 1) * beamNotes).filter((n) => n.hit !== 'R');
    const groupActive = present.some((n) => isActive(n.idx));
    if (present.length > 1) {
      const x1 = present[0].x + 3.4;
      const w = present[present.length - 1].x - present[0].x + 1.6;
      for (let b = 0; b < beams; b++) {
        nodes.push(<rect key={`b${c}-${b}`} x={x1} y={BEAM_Y + b * 6} width={w} height={4.2} fill={groupActive ? ACTIVE : INK} />);
      }
    } else if (present.length === 1) {
      // Un solo golpe: bandera sencilla
      nodes.push(<path key={`f${c}`} d={`M ${present[0].x + 4.2} ${BEAM_Y} q 9 4 6 16`} fill="none" stroke={groupActive ? ACTIVE : INK} strokeWidth={2.2} />);
    }
  }

  // Cifra del compás (arriba la cantidad de tiempos, abajo 4)
  const sig = (x: number, beats: number, key: string) => (
    <g key={key} fontFamily="Lora, serif" fontSize={19} fontWeight={700} fill={INK} textAnchor="middle">
      <text x={x} y={LINES[2] - 1}>{beats}</text>
      <text x={x} y={LINES[4] - 1}>4</text>
    </g>
  );

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
          {sig(32, bars[0].beats, 'sig0')}
          {bars.map((b, i) => (b.showSig ? sig(b.start - SIG_W / 2 - 2, b.beats, `sig${i}`) : null))}
          {nodes}
          {/* Barras de compás */}
          {bars.slice(0, -1).map((b, i) => {
            const x = b.start + b.beats * beatW + GAP / 2 - 2;
            return <line key={i} x1={x} y1={LINES[0]} x2={x} y2={LINES[4]} stroke={LINE} strokeWidth={1.5} />;
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
