import React, { useState, useEffect } from 'react';
import { X, User, Check } from 'lucide-react';
import { UserProfile, UserFlamencoRole, UserFlamencoLevel } from '../types';

interface EditNameModalProps {
  isOpen: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (updatedProfile: UserProfile) => void;
}

const ROLES: UserFlamencoRole[] = [
  'Guitarrista 🎸',
  'Percusionista 🥁',
  'Cantaor/a 🎤',
  'Bailaora 💃',
];

const LEVELS: UserFlamencoLevel[] = ['Bajo', 'Medio', 'Alto'];

export const EditNameModal: React.FC<EditNameModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserFlamencoRole>('Percusionista 🥁');
  const [level, setLevel] = useState<UserFlamencoLevel>('Medio');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.contact || '');
      if (profile.role) setRole(profile.role);
      if (profile.level) setLevel(profile.level);
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail) {
      setError('Por favor ingresa tu nombre y tu email.');
      return;
    }
    setError(null);

    const updated: UserProfile = {
      name: cleanName,
      contact: cleanEmail,
      role,
      level,
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="modal-panel rounded-3xl max-w-sm w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-white space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 icon-btn btn-3d text-gray-400 hover:text-white cursor-pointer"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3">
          <div className="w-9 h-9 rounded-xl bg-[#E84A27]/15 border border-[#E84A27]/35 flex items-center justify-center text-[#FF5533]">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="font-brand text-[9px] uppercase tracking-widest text-[#FF5533] font-bold block">
              Tu Perfil
            </span>
            <h3 className="font-serif font-bold text-base text-white">
              Datos de Usuario
            </h3>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-2 rounded-lg bg-[#E84A27]/12 border border-[#E84A27]/35 text-[#FF6B4A] text-xs font-sans">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-brand font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              1. TU NOMBRE O APODO: <span className="text-[#C83214]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Carmen, Marcos, Ana..."
              className="w-full inset-field focus:border-[#E84A27] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-brand font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              2. TU EMAIL: <span className="text-[#C83214]">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ej. nombre@correo.com"
              className="w-full inset-field focus:border-[#E84A27] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-brand font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              ¿ERES?
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-1.5 rounded-lg text-xs font-sans font-medium text-center transition cursor-pointer border ${
                    role === r
                      ? 'btn-primary text-white'
                      : 'btn-3d text-gray-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-brand font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              NIVEL
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-1.5 rounded-lg text-xs font-sans font-medium text-center transition cursor-pointer border ${
                    level === lvl
                      ? 'btn-primary text-white'
                      : 'btn-3d text-gray-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl btn-3d text-gray-300 text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl btn-primary text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
