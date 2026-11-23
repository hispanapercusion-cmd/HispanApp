import React, { useEffect, useRef, useState } from 'react';
import { TrainerConfig } from '../types';
import { X, TrendingUp, Zap, Minus, Plus } from 'lucide-react';
import { useLang } from '../i18n';

interface TrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TrainerConfig;
  onChange: (config: TrainerConfig) => void;
}

// Campo numérico que se puede borrar y volver a escribir con comodidad (también en el celular):
// mientras se escribe se acepta lo que se ve; se aplica en cuanto es un número dentro del rango y,
// al salir del campo, se ajusta al rango. Con botones − y + y valores rápidos.
interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  presets?: number[];
  onCommit: (v: number) => void;
}

const NumberField: React.FC<NumberFieldProps> = ({ label, value, min, max, step = 1, presets, onCommit }) => {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  // Si el valor cambia desde afuera (botones, valores rápidos) y no se está escribiendo, se actualiza lo que se ve
  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const commit = (n: number) => {
    const v = clamp(Math.round(n));
    onCommit(v);
    setText(String(v));
  };

  return (
    <div className="inset-field p-3 rounded-2xl space-y-2">
      <label className="block text-[11px] text-gray-400 font-brand uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => commit(value - step)}
          disabled={value <= min}
          aria-label="−"
          className="shrink-0 w-9 h-9 rounded-full btn-3d text-white flex items-center justify-center disabled:opacity-35 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={text}
          onFocus={(e) => {
            focused.current = true;
            e.currentTarget.select();
          }}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
            setText(digits);
            const n = parseInt(digits, 10);
            // Se aplica solo cuando ya es un número válido (así se puede borrar y escribir de nuevo sin que se "pise")
            if (!Number.isNaN(n) && n >= min && n <= max) onCommit(n);
          }}
          onBlur={() => {
            focused.current = false;
            const n = parseInt(text, 10);
            commit(Number.isNaN(n) ? value : n);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur();
          }}
          aria-label={label}
          className="min-w-0 flex-1 w-full bg-transparent text-center font-sans font-bold text-xl text-white tabular-nums focus:outline-none"
        />
        <button
          type="button"
          onClick={() => commit(value + step)}
          disabled={value >= max}
          aria-label="+"
          className="shrink-0 w-9 h-9 rounded-full btn-3d text-white flex items-center justify-center disabled:opacity-35 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {presets && (
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => commit(p)}
              aria-pressed={value === p}
              className={`px-2.5 py-1 rounded-full text-xs font-sans font-semibold cursor-pointer transition ${
                value === p ? 'seg-active text-white' : 'segmented text-gray-300 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const TrainerModal: React.FC<TrainerModalProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
}) => {
  const { L } = useLang();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="modal-panel rounded-3xl max-w-sm w-full p-6 shadow-2xl text-white space-y-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#E84A27]/15 text-[#E84A27]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="font-brand text-[10px] tracking-[0.25em] uppercase text-[#E84A27] font-bold block">
                HispanApp Trainer
              </span>
              <h3 className="font-serif text-lg font-bold leading-tight">{L('Entrenador Progresivo', 'Progressive trainer')}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn btn-3d text-gray-400 hover:text-white"
            title={L('Cerrar', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-300 font-serif leading-relaxed italic">
          {L('Entrena la constancia del compás y las palmas aumentando la velocidad automáticamente de forma progresiva.', 'Train a steady compás and palmas: the speed goes up automatically, step by step.')}
        </p>

        <div className="space-y-3.5 text-sm">
          {/* Toggle Enabled */}
          <label className="flex items-center justify-between sub-card p-3.5 rounded-2xl cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Zap className={`w-4 h-4 ${config.enabled ? 'text-[#E84A27]' : 'text-gray-500'}`} />
              <span className="font-medium text-xs sm:text-sm">{L('Subida Automática de Tempo', 'Automatic tempo increase')}</span>
            </div>
            {/* Interruptor (la casilla real queda oculta pero sigue siendo accesible) */}
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <span
              aria-hidden="true"
              className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${config.enabled ? 'btn-primary' : 'segmented'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform duration-200 ${
                  config.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </span>
          </label>

          {/* Ajustes: cuántos BPM sube, cada cuántas vueltas y hasta dónde */}
          <div className="space-y-3">
            <NumberField
              label={L('Aumentar (+BPM)', 'Increase (+BPM)')}
              value={config.stepBpm}
              min={1}
              max={10}
              presets={[1, 2, 3, 5, 10]}
              onCommit={(v) => onChange({ ...config, stepBpm: v })}
            />
            <NumberField
              label={L('Cada (N vueltas)', 'Every (N cycles)')}
              value={config.everyCycles}
              min={1}
              max={16}
              presets={[1, 2, 4, 8, 16]}
              onCommit={(v) => onChange({ ...config, everyCycles: v })}
            />
            <NumberField
              label={L('BPM límite máximo', 'Maximum BPM')}
              value={config.maxBpm}
              min={50}
              max={240}
              step={5}
              presets={[100, 120, 150, 180, 220]}
              onCommit={(v) => onChange({ ...config, maxBpm: v })}
            />
            <p className="text-[11.5px] leading-snug text-gray-400 font-sans" data-testid="trainer-summary">
              {L(
                `Cada ${config.everyCycles} ${config.everyCycles === 1 ? 'vuelta' : 'vueltas'} del ritmo sube ${config.stepBpm} BPM, hasta ${config.maxBpm} BPM. Una vuelta es el ritmo completo, una vez.`,
                `Every ${config.everyCycles} ${config.everyCycles === 1 ? 'cycle' : 'cycles'} of the rhythm the speed goes up ${config.stepBpm} BPM, up to ${config.maxBpm} BPM. One cycle is the whole rhythm, once.`
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl btn-primary text-white text-xs font-brand tracking-[0.2em] uppercase font-bold cursor-pointer"
        >
          {L('Aplicar y Continuar', 'Apply and continue')}
        </button>
      </div>
    </div>
  );
};
