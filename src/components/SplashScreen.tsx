import React, { useState, useEffect } from 'react';
import { UserProfile, UserFlamencoRole, UserFlamencoLevel } from '../types';
import { APP_CONFIG } from '../config';
import { saveLeadToFirestore } from '../services/firebase';

interface SplashScreenProps {
  onFinish: () => void;
  onUserEnter: () => void;
  audioReady: boolean;
  onProfileSave: (profile: UserProfile) => void;
}

const ROLES: UserFlamencoRole[] = [
  'Guitarrista 🎸',
  'Percusionista 🥁',
  'Cantaor/a 🎤',
  'Bailaora 💃',
];

const LEVELS: UserFlamencoLevel[] = ['Bajo', 'Medio', 'Alto'];

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  onUserEnter,
  audioReady: _audioReady,
  onProfileSave,
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mode, setMode] = useState<
    'initial_check' | 'welcome_cinematic' | 'step1_name_email' | 'step2_role_level'
  >('initial_check');
  const [welcomePhase, setWelcomePhase] = useState<1 | 2>(1);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // Datos de registro en 2 pasos
  const [formName, setFormName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formRole, setFormRole] = useState<UserFlamencoRole | null>(null);
  const [formLevel, setFormLevel] = useState<UserFlamencoLevel | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Verificación de Perfil en localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('hispanapp_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        if (parsed && parsed.name) {
          setProfile(parsed);
          setFormName(parsed.name);
          if (parsed.contact) setFormEmail(parsed.contact);
          if (parsed.role) setFormRole(parsed.role);
          if (parsed.level) setFormLevel(parsed.level);
          setMode('welcome_cinematic');
          return;
        }
      }

      const legacyName = localStorage.getItem('hispanapp_username');
      if (legacyName && legacyName.trim()) {
        const fallbackProfile: UserProfile = {
          name: legacyName.trim(),
          contact: '',
          role: 'Percusionista 🥁',
          level: 'Medio',
          createdAt: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        setFormName(fallbackProfile.name);
        setMode('welcome_cinematic');
        return;
      }

      // Si ya está registrado por lead magnet previo, nunca volver a mostrar registro
      const isRegistered = localStorage.getItem('hispanapp_registered') === 'true';
      if (isRegistered) {
        const storedName = localStorage.getItem('hispanapp_username') || 'Amigo';
        const fallbackProfile: UserProfile = {
          name: storedName,
          contact: '',
          role: 'Percusionista 🥁',
          level: 'Medio',
          createdAt: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        setFormName(storedName);
        setMode('welcome_cinematic');
        return;
      }

      // Si no hay perfil ni registro previo, iniciar con el onboarding de primera vez
      setMode('step1_name_email');
    } catch {
      setMode('step1_name_email');
    }
  }, []);

  // 2. Orquestación cinemática de bienvenida (Logo entra grande -> se desplaza a la izquierda -> texto Bienvenido, [nombre] -> entra directo a la app con fade suave)
  useEffect(() => {
    if (mode === 'welcome_cinematic') {
      setWelcomePhase(1);

      // Fase 2: Tras 1.1s el logo se desplaza a la izquierda y se despliega "Bienvenido, [nombre]"
      const timerPhase2 = setTimeout(() => {
        setWelcomePhase(2);
      }, 1100);

      // Fase 3: Tras 3.1s, desvanece suavemente con transición de opacidad (700ms) y entra directo a la app
      const timerFadeOut = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          onUserEnter();
          onFinish();
        }, 700);
      }, 3100);

      return () => {
        clearTimeout(timerPhase2);
        clearTimeout(timerFadeOut);
      };
    }
  }, [mode]);

  // Paso 1: Valida nombre y email y pasa a la página 2
  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanEmail = formEmail.trim();

    if (!cleanName || !cleanEmail) {
      setErrorMsg('Por favor ingresa tu nombre y tu email.');
      return;
    }
    setErrorMsg(null);
    setMode('step2_role_level');
  };

  // Paso 2: Guarda todo el perfil y activa la animación cinemática de bienvenida
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanEmail = formEmail.trim();

    if (!formRole || !formLevel) {
      setErrorMsg('Por favor selecciona qué eres y qué nivel tienes para continuar.');
      return;
    }
    setErrorMsg(null);

    const newProfile: UserProfile = {
      name: cleanName,
      contact: cleanEmail,
      role: formRole,
      level: formLevel,
      createdAt: profile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('hispanapp_user_profile', JSON.stringify(newProfile));
    localStorage.setItem('hispanapp_registered', 'true');
    localStorage.setItem('hispanapp_username', cleanName);

    // Guardado en Firebase Firestore
    try {
      saveLeadToFirestore({
        name: cleanName,
        email: cleanEmail,
        role: formRole || undefined,
        level: formLevel || undefined,
        source: 'onboarding_splash',
      });
    } catch (err) {
      console.warn('Firebase error in splash onboarding:', err);
    }

    if (APP_CONFIG.leadWebhookUrl) {
      try {
        fetch(APP_CONFIG.leadWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newProfile,
            source: 'hispanapp_onboarding',
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
      } catch {
        // silencioso
      }
    }

    setProfile(newProfile);
    onProfileSave(newProfile);

    // Iniciar la animación cinemática de bienvenida con su nuevo nombre
    setMode('welcome_cinematic');
  };

  const displayName = profile?.name || formName.trim() || 'Amigo';

  return (
    <div
      id="welcomeSplashScreen"
      className={`fixed inset-0 z-50 bg-[#14151F] flex flex-col justify-between items-center p-6 sm:p-8 select-none overflow-y-auto transition-opacity duration-700 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Spacer superior para equilibrio vertical */}
      <div className="h-4 sm:h-6 shrink-0" />

      {/* CONTENIDO CENTRAL */}
      <div className="max-w-xl w-full flex flex-col items-center justify-center my-auto py-2">
        {/* ======================================================== */}
        {/* PANTALLA DE BIENVENIDA CINEMÁTICA (USUARIO REGISTRADO)   */}
        {/* ======================================================== */}
        {mode === 'welcome_cinematic' && (
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7 transition-all duration-800 ease-out px-4 py-8">
            {/* LOGO: ENTRA GRANDE EN FADE IN Y LUEGO SE DESPLAZA A LA IZQUIERDA */}
            <div
              className={`shrink-0 flex items-center justify-center text-white transition-all duration-800 ease-out ${
                welcomePhase === 1
                  ? 'w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 animate-slow-fade-in'
                  : 'w-24 h-24 sm:w-32 sm:h-32 -translate-x-0 sm:-translate-x-3 drop-shadow-[0_12px_40px_rgba(0,0,0,0.6)]'
              }`}
            >
              <svg
                viewBox="0 0 100 95"
                className="w-full h-full drop-shadow-[0_14px_45px_rgba(0,0,0,0.6)]"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.2"
                strokeLinecap="square"
                strokeLinejoin="miter"
              >
                {/* Marco trasero superior derecho */}
                <path d="M 43 15 L 43 6 L 82 6 L 82 56 L 73 56" />
                {/* Cajón frontal principal */}
                <rect x="24" y="21" width="42" height="50" fill="none" />
                {/* Pared lateral izquierda sólida en perspectiva */}
                <polygon points="24,21 43,21 43,56 24,71" fill="#FFFFFF" />
                {/* Línea horizontal interior */}
                <line x1="43" y1="56" x2="66" y2="56" />
                {/* Línea diagonal exterior inferior izquierda */}
                <line x1="24" y1="71" x2="14" y2="81" strokeWidth="3.2" />
              </svg>
            </div>

            {/* TEXTO DESPLEGADO: BIENVENIDO, (NOMBRE DE USUARIO) EN UN SOLO TEXTO GRANDE */}
            {welcomePhase === 2 && (
              <div className="text-center sm:text-left animate-fadeIn">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-xl leading-tight">
                  Bienvenido, {displayName}
                </h2>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* PASO 1: NOMBRE Y EMAIL (PRIMERA VEZ)                     */}
        {/* ======================================================== */}
        {mode === 'step1_name_email' && (
          <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center">
            {/* Logo */}
            <div className="shrink-0 flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 text-white animate-splash-fade">
              <svg
                viewBox="0 0 100 95"
                className="w-full h-full drop-shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.2"
                strokeLinecap="square"
                strokeLinejoin="miter"
              >
                <path d="M 43 15 L 43 6 L 82 6 L 82 56 L 73 56" />
                <rect x="24" y="21" width="42" height="50" fill="none" />
                <polygon points="24,21 43,21 43,56 24,71" fill="#FFFFFF" />
                <line x1="43" y1="56" x2="66" y2="56" />
                <line x1="24" y1="71" x2="14" y2="81" strokeWidth="3.2" />
              </svg>
            </div>

            {/* Nombre de HispanApp */}
            <div className="text-center mt-4 animate-splash-fade">
              <h1 className="font-brand text-3xl sm:text-4xl font-extrabold tracking-wider text-white leading-none">
                Hispan<span className="text-[#C83214]">App</span>
              </h1>
              <p className="font-brand text-[10px] sm:text-xs tracking-[0.28em] uppercase text-gray-300 mt-1.5">
                LOS RITM<span className="text-[#C83214] font-bold">8</span>S DEL FLAMENCO
              </p>
            </div>

            {/* Formulario */}
            <div id="firstTimeForm" className="w-full space-y-4 animate-fadeIn mt-5">
              <form onSubmit={handleNextToStep2} className="space-y-4">
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-[#C83214]/15 border border-[#C83214]/40 text-[#FF6B4A] text-xs font-sans text-center">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block font-brand text-[10px] tracking-wider text-gray-400 uppercase mb-1.5 font-bold">
                    1. TU NOMBRE O APODO: <span className="text-[#C83214]">*</span>
                  </label>
                  <input
                    type="text"
                    id="registerName"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ej. Carmen, Marcos, Ana..."
                    className="w-full bg-[#1C1E2C] border border-[#2B2E42] rounded-xl px-4 py-3 text-sm font-medium text-white placeholder-gray-500 focus:outline-none focus:border-[#C83214] transition"
                  />
                </div>

                <div>
                  <label className="block font-brand text-[10px] tracking-wider text-gray-400 uppercase mb-1.5 font-bold">
                    2. TU EMAIL: <span className="text-[#C83214]">*</span>
                  </label>
                  <input
                    type="email"
                    id="registerEmail"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="ej. nombre@correo.com"
                    className="w-full bg-[#1C1E2C] border border-[#2B2E42] rounded-xl px-4 py-3 text-sm font-medium text-white placeholder-gray-500 focus:outline-none focus:border-[#C83214] transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#C83214] hover:bg-[#E84A27] text-white font-brand font-bold text-xs uppercase tracking-wider shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <span>Continuar</span>
                  <span>→</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASO 2: ERES Y NIVEL (UNA SOLA VEZ)                      */}
        {/* ======================================================== */}
        {mode === 'step2_role_level' && (
          <div className="w-full max-w-sm sm:max-w-md space-y-5 animate-fadeIn mt-2">
            <form onSubmit={handleFinalSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-[#C83214]/15 border border-[#C83214]/40 text-[#FF6B4A] text-xs font-sans text-center">
                  {errorMsg}
                </div>
              )}

              {/* Pregunta 1: ¿Eres? */}
              <div>
                <label className="block font-brand text-[11px] tracking-wider text-gray-400 uppercase mb-2 font-bold">
                  ¿ERES? <span className="text-[#C83214]">*</span>
                </label>
                <div className="flex flex-col gap-2.5">
                  {ROLES.map((r) => {
                    const isSelected = formRole === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setFormRole(r);
                          setErrorMsg(null);
                        }}
                        className={`w-full py-3.5 px-4 rounded-xl text-sm sm:text-base font-sans font-medium text-center transition cursor-pointer border flex items-center justify-center gap-2 active:scale-98 ${
                          isSelected
                            ? 'bg-[#C83214] text-white border-[#C83214] shadow-[0_0_15px_rgba(200,50,20,0.45)]'
                            : 'bg-[#1C1E2C] text-gray-300 border-[#2B2E42] hover:border-gray-500 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pregunta 2: ¿Qué nivel tienes? */}
              <div>
                <label className="block font-brand text-[11px] tracking-wider text-gray-400 uppercase mb-2 font-bold">
                  ¿QUÉ NIVEL TIENES? <span className="text-[#C83214]">*</span>
                </label>
                <div className="flex flex-col gap-2.5">
                  {LEVELS.map((lvl) => {
                    const isSelected = formLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setFormLevel(lvl);
                          setErrorMsg(null);
                        }}
                        className={`w-full py-3 px-4 rounded-xl text-sm sm:text-base font-sans font-medium text-center transition cursor-pointer border active:scale-98 ${
                          isSelected
                            ? 'bg-[#C83214] text-white border-[#C83214] shadow-[0_0_15px_rgba(200,50,20,0.45)]'
                            : 'bg-[#1C1E2C] text-gray-300 border-[#2B2E42] hover:border-gray-500 hover:text-white'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón Guardar y Comenzar */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl bg-[#C83214] hover:bg-[#E84A27] text-white font-brand font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 mt-3"
              >
                Guardar y Comenzar a Practicar
              </button>
            </form>
          </div>
        )}
      </div>

      {/* FOOTER INFERIOR MINIMALISTA ELEGANTE */}
      <div className="pb-3 text-center animate-fadeIn shrink-0">
        <p className="font-sans text-[11px] sm:text-xs tracking-[0.28em] text-gray-400 uppercase font-medium">
          de hispana percusión
        </p>
      </div>
    </div>
  );
};
