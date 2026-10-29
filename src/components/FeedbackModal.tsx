import React, { useEffect, useState } from 'react';
import { X, MessageSquareHeart, CheckCircle2 } from 'lucide-react';
import { saveFeedback, FeedbackData } from '../services/firebase';
import { track } from '../services/analytics';

const TYPES: { id: FeedbackData['type']; label: string }[] = [
  { id: 'sugerencia', label: '💡 Sugerencia' },
  { id: 'error', label: '🐞 Algo falla' },
  { id: 'otro', label: '💬 Otro' },
];

export const FeedbackModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  name: string;
  email: string;
  rhythm: string;
}> = ({ isOpen, onClose, name, email, rhythm }) => {
  const [type, setType] = useState<FeedbackData['type']>('sugerencia');
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || status === 'sending') return;
    setStatus('sending');
    try {
      // Si no hay conexión, Firebase no responde: se corta a los 12 s para avisar
      await Promise.race([
        saveFeedback({ type, rating, message: message.trim(), name, email, rhythm }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000)),
      ]);
      setStatus('sent');
      track('feedback_sent', { type });
      setMessage('');
      setRating(0);
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="modal-panel rounded-3xl max-w-sm w-full max-h-[92vh] overflow-y-auto p-5 text-white space-y-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 icon-btn btn-3d text-gray-400 hover:text-white cursor-pointer" title="Cerrar">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-10">
          <div className="w-10 h-10 rounded-2xl btn-3d flex items-center justify-center text-[#FF6B4A] shrink-0">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <div>
            <span className="font-brand text-[9.5px] tracking-[0.2em] uppercase text-[#FF6B4A] font-bold block">Tu opinión</span>
            <h3 className="font-serif text-lg font-bold leading-tight">¿Qué te parece HispanApp?</h3>
          </div>
        </div>

        {status === 'sent' ? (
          <div className="sub-card rounded-2xl p-4 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="font-semibold text-sm">¡Gracias por tu mensaje!</p>
            <p className="text-xs text-gray-400">Lo leeremos con atención para seguir mejorando la app.</p>
            <button onClick={onClose} className="mt-2 px-5 py-2 rounded-full btn-primary text-xs font-bold cursor-pointer">Cerrar</button>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-3.5">
            <div className="flex gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`flex-1 py-2 rounded-full text-[11.5px] font-medium cursor-pointer transition ${
                    type === t.id ? 'btn-primary text-white' : 'btn-3d text-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div>
              <p className="text-[11px] text-gray-400 mb-1.5">Valoración (opcional)</p>
              <div className="flex gap-1" role="radiogroup" aria-label="Valoración de 1 a 5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    onClick={() => setRating(rating === n ? 0 : n)}
                    className={`text-2xl leading-none px-0.5 cursor-pointer transition ${n <= rating ? 'opacity-100' : 'opacity-30 grayscale'}`}
                    title={`${n} de 5`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={5}
              required
              placeholder={type === 'error' ? 'Cuéntanos qué pasó y en qué ritmo o pantalla…' : 'Escribe aquí tu idea, comentario o sugerencia…'}
              className="w-full inset-field rounded-2xl px-3.5 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-[#E84A27] resize-none"
            />

            {status === 'error' && (
              <p className="text-[11.5px] text-[#FF8A70]">No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.</p>
            )}

            <button
              type="submit"
              disabled={!message.trim() || status === 'sending'}
              className="w-full py-3 rounded-2xl btn-primary text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              {status === 'sending' ? 'Enviando…' : 'Enviar opinión'}
            </button>
            <p className="text-[10.5px] text-gray-500 text-center">Se enviará con tu nombre y email para poder responderte.</p>
          </form>
        )}
      </div>
    </div>
  );
};
