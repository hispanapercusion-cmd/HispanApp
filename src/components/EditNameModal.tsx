import React, { useState, useEffect } from 'react';
import { X, User, Check, ShieldCheck, ChevronDown } from 'lucide-react';
import { APP_CONFIG, legalUrl } from '../config';
import { useLang, LangSwitch, roleLabel, levelLabel } from '../i18n';
import { getConsent, saveConsent, CONSENT_VERSION } from '../services/consent';
import { saveLeadToFirestore } from '../services/firebase';
import { CheckRow } from './ConsentChecks';
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
  const { lang, L } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserFlamencoRole>('Percusionista 🥁');
  const [level, setLevel] = useState<UserFlamencoLevel>('Medio');
  const [error, setError] = useState<string | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.contact || '');
      if (profile.role) setRole(profile.role);
      if (profile.level) setLevel(profile.level);
    }
    const c = getConsent();
    setMarketing(!!c?.marketing);
    setAnalytics(!!c?.analytics);
    setConfirmWipe(false);
  }, [profile, isOpen]);

  // Cambiar las opciones voluntarias se aplica al momento (no hace falta pulsar Guardar)
  const updatePrefs = (next: { marketing: boolean; analytics: boolean }) => {
    setMarketing(next.marketing);
    setAnalytics(next.analytics);
    saveConsent(next);
    if (profile) {
      saveLeadToFirestore({
        name: profile.name,
        email: profile.contact,
        role: profile.role,
        level: profile.level,
        source: 'preferencias_privacidad',
        consentVersion: CONSENT_VERSION,
        marketingOptIn: next.marketing,
        analyticsOptIn: next.analytics,
      });
    }
  };

  const deletionMailto = () => {
    const subject = L('Solicitud de borrado de datos - HispanApp', 'Data deletion request - HispanApp');
    const body = L(
      `Hola,\n\nQuiero que borren mis datos personales de HispanApp.\n\nNombre: ${profile?.name || ''}\nEmail registrado: ${profile?.contact || ''}\n\nGracias.`,
      `Hello,\n\nPlease delete my personal data from HispanApp.\n\nName: ${profile?.name || ''}\nRegistered email: ${profile?.contact || ''}\n\nThank you.`
    );
    return `mailto:${APP_CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Borra todo lo que la app guarda en este dispositivo (perfil, ajustes y acceso PRO) y vuelve a empezar
  const wipeDevice = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('hispanapp_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // Ignorar
    }
    window.location.reload();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName || !cleanEmail) {
      setError(L('Por favor ingresa tu nombre y tu email.', 'Please enter your name and your email.'));
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
          title={L('Cerrar', 'Close')}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3">
          <div className="w-9 h-9 rounded-xl bg-[#E84A27]/15 border border-[#E84A27]/35 flex items-center justify-center text-[#FF5533]">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="font-brand text-[9px] uppercase tracking-widest text-[#FF5533] font-bold block">
              {L('Tu Perfil', 'Your profile')}
            </span>
            <h3 className="font-serif font-bold text-base text-white">
              {L('Datos de Usuario', 'Your details')}
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
              {L('1. TU NOMBRE O APODO:', '1. YOUR NAME OR NICKNAME:')} <span className="text-[#C83214]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={L('ej. Carmen, Marcos, Ana...', 'e.g. Carmen, Mark, Anna...')}
              className="w-full inset-field focus:border-[#E84A27] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-brand font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              {L('2. TU EMAIL:', '2. YOUR EMAIL:')} <span className="text-[#C83214]">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={L('ej. nombre@correo.com', 'e.g. name@email.com')}
              className="w-full inset-field focus:border-[#E84A27] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-brand font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              {L('¿ERES?', 'WHAT DO YOU PLAY?')}
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
                  {roleLabel(r, lang)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-brand font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              {L('NIVEL', 'LEVEL')}
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
                  {levelLabel(lvl, lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Idioma */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-brand font-bold text-gray-400 uppercase tracking-wider">
              {L('IDIOMA', 'LANGUAGE')}
            </span>
            <LangSwitch />
          </div>

          {/* Privacidad y datos */}
          <div className="sub-card rounded-2xl">
            <button
              type="button"
              onClick={() => setPrivacyOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left cursor-pointer"
              aria-expanded={privacyOpen}
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-gray-200">
                <ShieldCheck className="w-4 h-4 text-[#FF6B4A]" />
                {L('Privacidad y datos', 'Privacy and data')}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${privacyOpen ? 'rotate-180' : ''}`} />
            </button>

            {privacyOpen && (
              <div className="px-3.5 pb-3.5 space-y-3 animate-fadeIn">
                <CheckRow id="prof-marketing" checked={marketing} onChange={(v) => updatePrefs({ marketing: v, analytics })}>
                  {L('Recibir novedades, clases y ofertas por email.', 'Receive news, lessons and offers by email.')}
                </CheckRow>
                <CheckRow id="prof-analytics" checked={analytics} onChange={(v) => updatePrefs({ marketing, analytics: v })}>
                  {L('Permitir estadísticas anónimas de uso.', 'Allow anonymous usage statistics.')}
                </CheckRow>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px]">
                  <a href={legalUrl('privacy', lang)} target="_blank" rel="noopener" className="text-[#FF6B4A] underline underline-offset-2">{L('Política de privacidad', 'Privacy Policy')}</a>
                  <a href={legalUrl('terms', lang)} target="_blank" rel="noopener" className="text-[#FF6B4A] underline underline-offset-2">{L('Términos y condiciones', 'Terms and Conditions')}</a>
                </div>

                <a
                  href={deletionMailto()}
                  className="block w-full text-center py-2 rounded-xl btn-3d text-gray-200 text-[11.5px] font-semibold"
                >
                  {L('Solicitar el borrado de mis datos', 'Request deletion of my data')}
                </a>
                <p className="text-[10.5px] text-gray-500 leading-relaxed -mt-1">
                  {L('Se abrirá tu correo con la solicitud lista. Respondemos en un máximo de 5 días hábiles.', 'Your email app will open with the request ready. We reply within 5 business days.')}
                </p>

                {!confirmWipe ? (
                  <button
                    type="button"
                    onClick={() => setConfirmWipe(true)}
                    className="w-full py-2 rounded-xl text-[11.5px] text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    {L('Borrar los datos de este dispositivo', 'Delete the data on this device')}
                  </button>
                ) : (
                  <div className="rounded-xl bg-[#E84A27]/12 border border-[#E84A27]/35 p-2.5 space-y-2">
                    <p className="text-[11.5px] text-[#FFB4A2] leading-relaxed">
                      {L('Se borrarán tu perfil, tus ajustes y tu acceso PRO de este dispositivo. Para volver a ser PRO tendrás que escribir otra vez tu clave o código.', 'Your profile, settings and PRO access will be deleted from this device. To get PRO back you will need to enter your key or code again.')}
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setConfirmWipe(false)} className="flex-1 py-1.5 rounded-lg btn-3d text-[11px] text-gray-300 cursor-pointer">
                        {L('Cancelar', 'Cancel')}
                      </button>
                      <button type="button" onClick={wipeDevice} className="flex-1 py-1.5 rounded-lg btn-primary text-[11px] font-bold cursor-pointer">
                        {L('Sí, borrar', 'Yes, delete')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl btn-3d text-gray-300 text-xs font-semibold cursor-pointer"
            >
              {L('Cancelar', 'Cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl btn-primary text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{L('Guardar', 'Save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
