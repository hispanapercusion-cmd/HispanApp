import React from 'react';
import { RhythmDefinition } from '../types';

interface StepWaveformTimelineProps {
  rhythm: RhythmDefinition;
  activeStep: number;
  isPlaying?: boolean;
}

export const StepWaveformTimeline: React.FC<StepWaveformTimelineProps> = ({
  rhythm,
  activeStep,
}) => {
  return (
    <div className="w-full bg-[#0B0D12] border border-white/[0.06] rounded-xl px-2.5 py-2 flex items-center justify-between relative overflow-hidden shadow-inner select-none">
      <div className="w-full flex items-center justify-between gap-1 z-10">
        {rhythm.steps.map((hit, idx) => {
          const isCurrent = activeStep === idx;
          const isBeatStart = idx % rhythm.stepsPerBeat === 0;
          const beatIndex = Math.floor(idx / rhythm.stepsPerBeat);
          const isCompasAccent = isBeatStart && rhythm.clockAccents.includes(beatIndex);

          let heightClass = 'h-3';
          let bgClass = 'bg-white/10';
          let dot = false;

          if (hit === 'A') {
            heightClass = 'h-5';
            bgClass = isCurrent ? 'bg-[#FF5533] shadow-[0_0_8px_#E84A27]' : isCompasAccent ? 'bg-[#E84A27]' : 'bg-[#E84A27]/80';
          } else if (hit === 'P') {
            heightClass = 'h-3.5';
            bgClass = isCurrent ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-white/25';
          } else {
            heightClass = 'h-1.5';
            bgClass = isCurrent ? 'bg-white' : 'bg-white/[0.08]';
            dot = true;
          }

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-center py-0.5 transition-all duration-75"
              title={`Paso ${idx + 1}: ${hit === 'A' ? 'Acento (>)' : hit === 'P' ? 'Palma' : 'Silencio'}`}
            >
              {dot ? (
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    isCurrent ? 'bg-white scale-125' : 'bg-[#2B2E42]'
                  }`}
                />
              ) : (
                <span
                  className={`w-1.5 rounded-full transition-all ${heightClass} ${bgClass} ${
                    isCurrent ? 'scale-115' : ''
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
