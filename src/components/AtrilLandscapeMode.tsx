import React, { useState, useEffect } from 'react';
import { RhythmDefinition, CountMode } from '../types';
import { MonogramScore } from './MonogramScore';
import { Play, Square, X, FlipHorizontal, ArrowLeft, ArrowRight, Pause } from 'lucide-react';

interface AtrilLandscapeModeProps {
  rhythm: RhythmDefinition;
  bpm: number;
  isPlaying: boolean;
  activeStep: number;
  cycleCount: number;
  countMode: CountMode;
  countInText: string | null;
  isWakeLockActive?: boolean;
  onTogglePlay: () => void;
  onAdjustBpm: (delta: number) => void;
  onUpdateBpm?: (newBpm: number) => void;
  onTapTempo: () => void;
  onPrevRhythm: () => void;
  onNextRhythm: () => void;
  onExit: () => void;
  onPreviewBeat?: (startStep: number, length: number) => void;
}

export const AtrilLandscapeMode: React.FC<AtrilLandscapeModeProps> = ({
  rhythm,
  bpm,
  isPlaying,
  activeStep,
  cycleCount: _cycleCount,
  countMode,
  countInText,
  isWakeLockActive = false,
  onTogglePlay,
  onAdjustBpm,
  onUpdateBpm,
  onTapTempo,
  onPrevRhythm,
  onNextRhythm,
  onExit,
  onPreviewBeat,
}) => {
  const [isMirror, setIsMirror] = useState<boolean>(false);
  const [tapFeedback, setTapFeedback] = useState<'play' | 'pause' | null>(null);

  // Compute the current beat label and accent status
  const counts = rhythm.has12CountToggle && countMode === 'traditional'
    ? rhythm.countsTrad
    : rhythm.countsPhon;

  const currentBeatIdx = activeStep >= 0 ? Math.floor(activeStep / rhythm.stepsPerBeat) : -1;
  const isOffbeat = activeStep >= 0 && activeStep % rhythm.stepsPerBeat !== 0;
  const isAccent = currentBeatIdx >= 0 && rhythm.clockAccents.includes(currentBeatIdx);
  const currentBeatLabel = currentBeatIdx >= 0 && counts[currentBeatIdx] ? counts[currentBeatIdx] : '';

  // Trigger feedback banner on toggle
  const handleStageClick = () => {
    onTogglePlay();
    setTapFeedback(isPlaying ? 'pause' : 'play');
    setTimeout(() => {
      setTapFeedback(null);
    }, 900);
  };

  // Keyboard controls in Atril Mode (Space, Esc, Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onExit();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setIsMirror((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  return (
    <div
      onClick={handleStageClick}
      className={`fixed inset-0 z-50 bg-[#06080D] text-white flex flex-col justify-between p-3 sm:p-5 pb-20 sm:pb-24 select-none overflow-hidden cursor-pointer transition-transform duration-200 ${
        isMirror ? 'scale-x-[-1]' : ''
      }`}
      style={{ touchAction: 'manipulation' }}
      title="Toca cualquier parte de la pantalla para pausar o reanudar"
    >
      {/* 1. TOP BAR HUD (Minimalista, no invasivo) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex items-center justify-between gap-3 text-xs w-full z-20 ${
          isMirror ? 'scale-x-[-1]' : ''
        }`}
      >
        {/* Selector rápido de ritmos */}
        <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.08] rounded-xl px-2.5 py-1.5 backdrop-blur-md">
          <button
            onClick={onPrevRhythm}
            className="p-1 hover:text-[#FF5533] text-gray-300 transition cursor-pointer active:scale-95"
            title="Ritmo anterior"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-serif font-bold text-[#E84A27] px-1 text-sm">
            {rhythm.roman}
          </span>
          <span className="font-sans font-medium text-gray-200 tracking-tight truncate max-w-[130px] sm:max-w-xs">
            {rhythm.shortTitle.replace(/^Ritmo\s+[IVXLCDM]+\s*[—–-]\s*/, '')}
          </span>
          <button
            onClick={onNextRhythm}
            className="p-1 hover:text-[#FF5533] text-gray-300 transition cursor-pointer active:scale-95"
            title="Siguiente ritmo"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Indicadores centrales y feedback de pausa */}
        <div className="flex items-center gap-2">
          {tapFeedback && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E84A27]/20 border border-[#E84A27]/40 text-[#FF6B4A] text-[11px] font-semibold animate-pulse shadow-[0_0_15px_rgba(232,74,39,0.3)]">
              {tapFeedback === 'play' ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
              <span>{tapFeedback === 'play' ? 'EN MARCHA' : 'PAUSADO'}</span>
            </div>
          )}
        </div>

        {/* Botones de acción derecha: Espejo, Salir */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMirror(!isMirror)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition cursor-pointer ${
              isMirror
                ? 'bg-[#E84A27]/20 border-[#E84A27]/50 text-[#FF6B4A]'
                : 'bg-white/[0.05] border-white/[0.08] text-gray-300 hover:text-white'
            }`}
            title="Invertir horizontalmente para practicar frente a un espejo (Tecla M)"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Modo Espejo</span>
          </button>

          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
            title="Salir del Modo Atril (Esc)"
          >
            <X className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* 2. ZONA CENTRAL: ÚNICAMENTE EL NÚMERO DEL TIEMPO GIGANTE + PARTITURA */}
      <div className="flex-1 flex flex-col justify-center items-center my-auto w-full max-w-6xl mx-auto px-2 relative">
        {/* NÚMERO DEL TIEMPO GIGANTE A TODA PANTALLA (SIN TEXTO EXTRA, SIN '+', SIN '>') */}
        <div
          className={`flex flex-col items-center justify-center my-1 select-none pointer-events-none transition-transform duration-75 ${
            isMirror ? 'scale-x-[-1]' : ''
          }`}
        >
          {countInText ? (
            <span className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black font-brand text-[#FF5533] drop-shadow-[0_0_40px_rgba(232,74,39,0.75)] tracking-tighter leading-none animate-pulse">
              {countInText}
            </span>
          ) : isPlaying && currentBeatIdx >= 0 ? (
            <span
              className={`text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black font-brand tabular-nums tracking-tighter leading-none transition-all duration-75 ${
                isAccent
                  ? 'text-[#FF5533] drop-shadow-[0_0_40px_rgba(232,74,39,0.8)] scale-105'
                  : 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.45)]'
              }`}
            >
              {currentBeatLabel}
            </span>
          ) : (
            <span className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black font-brand text-white/40 tracking-tighter leading-none">
              {currentBeatLabel || counts[0] || '1'}
            </span>
          )}
        </div>

        {/* PARTITURA HORIZONTAL COMPLETA (Intacta) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full mt-2"
        >
          <div className="bg-[#10141D]/90 rounded-2xl border border-white/[0.08] p-2 sm:p-3 shadow-2xl overflow-x-auto">
            <MonogramScore
              rhythm={rhythm}
              activeStep={activeStep}
              countMode={countMode}
              onPreviewBeat={onPreviewBeat}
            />
          </div>
        </div>
      </div>

      {/* 3. DOCK INFERIOR DEL METRÓNOMO (IDÉNTICO EN ESTÉTICA AL MODO VERTICAL) */}
      <footer
        onClick={(e) => e.stopPropagation()}
        className={`fixed bottom-0 inset-x-0 bg-[#141821]/85 backdrop-blur-[16px] border-t border-white/[0.06] z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.6)] ${
          isMirror ? 'scale-x-[-1]' : ''
        }`}
      >
        <div className="max-w-5xl mx-auto px-3.5 py-2.5 flex items-center justify-between gap-3">
          {/* Play / Stop + Indicador BPM */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onTogglePlay}
              className="w-11 h-11 rounded-full bg-[#E84A27] text-white flex items-center justify-center shadow-[0_0_20px_rgba(232,74,39,0.35)] hover:brightness-110 active:scale-95 transition shrink-0 cursor-pointer"
              title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
            >
              {isPlaying ? (
                <Square className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-5 h-5 ml-0.5 fill-white" />
              )}
            </button>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-sans text-2xl sm:text-3xl font-extrabold text-white tabular-nums tracking-tight leading-none">
                  {bpm}
                </span>
                <span className="font-sans text-[10px] tracking-wider uppercase text-gray-400 font-semibold">
                  BPM
                </span>
              </div>
              <span className="text-[10px] font-sans text-gray-400 block leading-tight mt-0.5">
                {rhythm.bpmRange.min}–{rhythm.bpmRange.max} BPM
                {isWakeLockActive && (
                  <span className="ml-1.5 text-amber-400/90 font-sans text-[9.5px]">
                    · Pantalla activa
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Slider en Pantalla Landscape */}
          <input
            type="range"
            min={rhythm.bpmRange.min}
            max={rhythm.bpmRange.max}
            value={bpm}
            onChange={(e) => onUpdateBpm?.(parseInt(e.target.value, 10))}
            className="hidden sm:block flex-1 max-w-xs accent-[#E84A27] cursor-pointer mx-3"
          />

          {/* Botones BPM y TAP en una sola línea */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={() => onAdjustBpm(-5)}
              className="w-8 sm:w-9 h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] active:scale-95 text-gray-200 font-sans font-semibold text-xs border border-white/[0.04] transition cursor-pointer"
            >
              -5
            </button>
            <button
              onClick={() => onAdjustBpm(-1)}
              className="w-8 sm:w-9 h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] active:scale-95 text-gray-200 font-sans font-semibold text-xs border border-white/[0.04] transition cursor-pointer"
            >
              -1
            </button>
            <button
              onClick={() => onAdjustBpm(1)}
              className="w-8 sm:w-9 h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] active:scale-95 text-gray-200 font-sans font-semibold text-xs border border-white/[0.04] transition cursor-pointer"
            >
              +1
            </button>
            <button
              onClick={() => onAdjustBpm(5)}
              className="w-8 sm:w-9 h-9 rounded-lg bg-white/[0.05] hover:bg-white/[0.10] active:scale-95 text-gray-200 font-sans font-semibold text-xs border border-white/[0.04] transition cursor-pointer"
            >
              +5
            </button>
            <button
              onClick={onTapTempo}
              className="px-3 sm:px-4 h-9 rounded-lg bg-white/[0.12] hover:bg-white/[0.18] active:scale-95 text-white text-[11px] font-sans font-bold tracking-wider uppercase transition shadow-sm cursor-pointer"
            >
              Tap
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
