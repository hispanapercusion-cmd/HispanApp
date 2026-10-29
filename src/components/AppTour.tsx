import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Mini recorrido por la app (primera vez tras registrarse, o a petición desde Comunidad).
 * Oscurece la pantalla, ilumina un elemento cada vez (marcado con data-tour="...")
 * y muestra un cuadro breve con su explicación.
 */

export interface TourStep {
  target: string; // valor de data-tour del elemento a iluminar
  icon: string;
  title: string;
  text: string;
}

interface AppTourProps {
  steps: TourStep[];
  onFinish: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8; // margen del foco alrededor del elemento
const GAP = 14; // separación entre el foco y el cuadro
const CARD_MAX_W = 340;

export const AppTour: React.FC<AppTourProps> = ({ steps, onFinish }) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardH, setCardH] = useState(170);
  const cardRef = useRef<HTMLDivElement>(null);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  const findTarget = useCallback(
    () => document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null,
    [step.target]
  );

  // Al cambiar de paso: llevar el elemento a la vista (si está dentro de la página)
  useEffect(() => {
    const el = findTarget();
    if (!el) return;
    const r = el.getBoundingClientRect();
    const fixedAncestor = el.closest('header, footer');
    if (!fixedAncestor && (r.top < 70 || r.bottom > window.innerHeight - 170)) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [findTarget]);

  // Seguir la posición del elemento en cada fotograma (scroll, giros, cambios de tamaño)
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const el = findTarget();
      if (el) {
        const r = el.getBoundingClientRect();
        setRect((prev) =>
          prev &&
          Math.abs(prev.top - r.top) < 0.5 &&
          Math.abs(prev.left - r.left) < 0.5 &&
          Math.abs(prev.width - r.width) < 0.5 &&
          Math.abs(prev.height - r.height) < 0.5
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height }
        );
      } else {
        setRect(null);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [findTarget]);

  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [index, rect?.width]);

  const next = useCallback(() => {
    if (isLast) onFinish();
    else setIndex((i) => i + 1);
  }, [isLast, onFinish]);
  const prev = () => setIndex((i) => Math.max(0, i - 1));

  // Teclado: Esc salta el recorrido, flechas/Enter avanzan o retroceden
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFinish();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [next, onFinish]);

  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 844;
  const cardW = Math.min(CARD_MAX_W, vw - 32);

  // Foco: el elemento con un pequeño margen, sin salirse de la pantalla
  const spot = rect
    ? {
        top: Math.max(4, rect.top - PAD),
        left: Math.max(4, rect.left - PAD),
        width: Math.min(vw - 8, rect.width + PAD * 2),
        height: Math.min(vh - 8, rect.height + PAD * 2),
      }
    : null;

  // Cuadro: debajo del foco si cabe; si no, encima; si tampoco, centrado abajo
  let cardTop: number;
  let cardLeft: number;
  if (spot) {
    const below = spot.top + spot.height + GAP;
    const above = spot.top - GAP - cardH;
    if (below + cardH <= vh - 12) cardTop = below;
    else if (above >= 12) cardTop = above;
    else cardTop = vh - cardH - 16;
    const center = spot.left + spot.width / 2;
    cardLeft = Math.min(Math.max(16, center - cardW / 2), vw - cardW - 16);
  } else {
    cardTop = (vh - cardH) / 2;
    cardLeft = (vw - cardW) / 2;
  }

  return (
    <div className="fixed inset-0 z-[70] tour-root" role="dialog" aria-modal="true" aria-label="Recorrido por la app">
      {/* Capa que bloquea la app mientras dura el recorrido */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Foco iluminado (la sombra enorme oscurece todo lo demás) */}
      {spot ? (
        <div
          className="tour-spot absolute rounded-2xl pointer-events-none"
          style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/70 pointer-events-none" />
      )}

      {/* Cuadro de explicación */}
      <div
        ref={cardRef}
        key={index}
        className="tour-card modal-panel rounded-2xl p-4 text-white"
        style={{ position: 'absolute', top: cardTop, left: cardLeft, width: cardW }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none shrink-0 mt-0.5" aria-hidden="true">
            {step.icon}
          </span>
          <div className="min-w-0">
            <p className="font-brand text-[9.5px] tracking-[0.22em] uppercase text-[#FF6B4A] font-bold">
              Paso {index + 1} de {steps.length}
            </p>
            <h3 className="font-serif text-base font-bold leading-snug mt-0.5">{step.title}</h3>
            <p className="text-[13px] text-gray-300 leading-relaxed mt-1">{step.text}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-4">
          {/* Puntos de progreso */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-4 bg-[#FF5533]' : 'w-1.5 bg-white/25'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {isLast ? null : (
              <button
                onClick={onFinish}
                className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer"
              >
                Saltar
              </button>
            )}
            {index > 0 && (
              <button
                onClick={prev}
                className="px-3 py-1.5 rounded-full btn-3d text-xs text-gray-200 cursor-pointer"
                aria-label="Paso anterior"
              >
                ←
              </button>
            )}
            <button
              onClick={next}
              className="px-4 py-1.5 rounded-full btn-primary text-xs font-bold cursor-pointer"
            >
              {isLast ? '¡A practicar!' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
