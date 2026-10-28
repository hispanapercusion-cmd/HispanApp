import React from 'react';
import { TrainerConfig } from '../types';
import { X, TrendingUp, Zap } from 'lucide-react';

interface TrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TrainerConfig;
  onChange: (config: TrainerConfig) => void;
}

export const TrainerModal: React.FC<TrainerModalProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#141821] border border-white/[0.08] rounded-3xl max-w-sm w-full p-6 shadow-2xl text-white space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#E84A27]/15 text-[#E84A27]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="font-brand text-[10px] tracking-[0.25em] uppercase text-[#E84A27] font-bold block">
                HispanApp Trainer
              </span>
              <h3 className="font-serif text-lg font-bold leading-tight">Entrenador Progresivo</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-300 font-serif leading-relaxed italic">
          Entrena la constancia del compás y las palmas aumentando la velocidad automáticamente de forma progresiva.
        </p>

        <div className="space-y-3.5 text-sm">
          {/* Toggle Enabled */}
          <label className="flex items-center justify-between bg-[#0B0D12] p-3.5 rounded-2xl border border-white/[0.06] cursor-pointer hover:border-white/[0.15] transition">
            <div className="flex items-center gap-2.5">
              <Zap className={`w-4 h-4 ${config.enabled ? 'text-[#E84A27]' : 'text-gray-500'}`} />
              <span className="font-medium text-xs sm:text-sm">Subida Automática de Tempo</span>
            </div>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
              className="w-5 h-5 accent-[#E84A27] rounded cursor-pointer"
            />
          </label>

          {/* Settings Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0B0D12] p-3 rounded-2xl border border-white/[0.06]">
              <label className="block text-[11px] text-gray-400 font-brand uppercase tracking-wider mb-1">
                Aumentar (+BPM)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={config.stepBpm}
                onChange={(e) => onChange({ ...config, stepBpm: parseInt(e.target.value, 10) || 5 })}
                className="w-full bg-transparent font-sans font-bold text-lg text-white tabular-nums focus:outline-none"
              />
            </div>

            <div className="bg-[#0B0D12] p-3 rounded-2xl border border-white/[0.06]">
              <label className="block text-[11px] text-gray-400 font-brand uppercase tracking-wider mb-1">
                Cada (N Vueltas)
              </label>
              <input
                type="number"
                min="1"
                max="32"
                value={config.everyCycles}
                onChange={(e) => onChange({ ...config, everyCycles: parseInt(e.target.value, 10) || 4 })}
                className="w-full bg-transparent font-sans font-bold text-lg text-white tabular-nums focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-[#0B0D12] p-3 rounded-2xl border border-white/[0.06]">
            <label className="block text-[11px] text-gray-400 font-brand uppercase tracking-wider mb-1">
              BPM Límite Máximo
            </label>
            <input
              type="number"
              min="50"
              max="240"
              value={config.maxBpm}
              onChange={(e) => onChange({ ...config, maxBpm: parseInt(e.target.value, 10) || 180 })}
              className="w-full bg-transparent font-sans font-bold text-lg text-white tabular-nums focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-[#E84A27] hover:brightness-110 text-white text-xs font-brand tracking-[0.2em] uppercase font-bold shadow-lg transition active:scale-98 cursor-pointer"
        >
          Aplicar y Continuar
        </button>
      </div>
    </div>
  );
};
