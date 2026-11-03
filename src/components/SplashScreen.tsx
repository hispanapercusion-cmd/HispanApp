import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { UserProfile, UserFlamencoRole, UserFlamencoLevel } from '../types';
import { APP_CONFIG } from '../config';
import { saveLeadToFirestore } from '../services/firebase';
import { HispanaMark } from './HispanaLogo';
import { ConsentChecks, ConsentValues } from './ConsentChecks';
import { saveConsent, CONSENT_VERSION } from '../services/consent';
import { track } from '../services/analytics';
import { useLang, LangSwitch, roleLabel, levelLabel } from '../i18n';

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
  const { lang, L } = useLang();
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
  const [consent, setConsent] = useState<ConsentValues>({ accepted: false, marketing: false, analytics: false });

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

      // Fase 2: tras 1,2 s el logo se reduce y se aparta mientras se despliega "Bienvenido, [nombre]"
      const timerPhase2 = setTimeout(() => {
        setWelcomePhase(2);
      }, 1200);

      // Fase 3: tras 3,3 s la pantalla se desvanece (700 ms) y entra a la app
      const timerFadeOut = setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
          onUserEnter();
          onFinish();
        }, 700);
      }, 3300);

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
      setErrorMsg(L('Por favor ingresa tu nombre y tu email.', 'Please enter your name and your email.'));
      return;
    }
    if (!consent.accepted) {
      setErrorMsg(L('Para continuar, acepta la Política de privacidad y los Términos y condiciones.', 'To continue, please accept the Privacy Policy and the Terms and Conditions.'));
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
      setErrorMsg(L('Por favor selecciona qué eres y qué nivel tienes para continuar.', 'Please choose what you play and your level to continue.'));
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
    saveConsent({ marketing: consent.marketing, analytics: consent.analytics });

    // Guardado en Firebase Firestore
    try {
      saveLeadToFirestore({
        name: cleanName,
        email: cleanEmail,
        role: formRole || undefined,
        level: formLevel || undefined,
        source: 'onboarding_splash',
        consentVersion: CONSENT_VERSION,
        marketingOptIn: consent.marketing,
        analyticsOptIn: consent.analytics,
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
    track('sign_up', { role: formRole || '', level: formLevel || '' });

    // Iniciar la animación cinemática de bienvenida con su nuevo nombre
    setMode('welcome_cinematic');
  };

  const displayName = profile?.name || formName.trim() || L('Amigo', 'friend');

  // Medidas del texto de bienvenida para abrir su hueco con precisión (sin saltos)
  const welcomeTextRef = useRef<HTMLDivElement>(null);
  const [welcomeTextSize, setWelcomeTextSize] = useState({ w: 0, h: 0 });
  const [isWideLayout, setIsWideLayout] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
  );
  useLayoutEffect(() => {
    if (mode !== 'welcome_cinematic') return;
    const measure = () => {
      setIsWideLayout(window.matchMedia('(min-width: 640px)').matches);
      const el = welcomeTextRef.current;
      // Un pequeño margen evita que se corte la última letra por redondeos
      if (el) setWelcomeTextSize({ w: Math.ceil(el.scrollWidth) + 6, h: Math.ceil(el.scrollHeight) + 4 });
    };
    measure();
    window.addEventListener('resize', measure);
    // La tipografía puede terminar de cargar después y cambiar el ancho: volver a medir
    document.fonts?.ready.then(measure).catch(() => {});
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (observer && welcomeTextRef.current) observer.observe(welcomeTextRef.current);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [mode, displayName]);

  return (
    <div
      id="welcomeSplashScreen"
      className={`fixed inset-0 z-50 app-backdrop flex flex-col justify-between items-center p-6 sm:p-8 select-none overflow-y-auto splash-exit ${
        isFadingOut ? 'is-leaving pointer-events-none' : ''
      }`}
    >
      {/* Spacer superior para equilibrio vertical */}
      <div className="h-4 sm:h-6 shrink-0" />

      {/* CONTENIDO CENTRAL */}
      <div className={`${mode === 'welcome_cinematic' ? 'max-w-5xl' : 'max-w-xl'} w-full flex flex-col items-center justify-center my-auto py-2`}>
        {/* ======================================================== */}
        {/* PANTALLA DE BIENVENIDA CINEMÁTICA (USUARIO REGISTRADO)   */}
        {/* ======================================================== */}
        {mode === 'welcome_cinematic' && (
          <div
            className={`welcome-stage w-full flex flex-col sm:flex-row items-center justify-center px-4 py-8 ${
              welcomePhase === 2 ? 'is-revealed' : ''
            }`}
          >
            {/* LOGO: aparece grande y luego se reduce y se aparta, con la misma curva que el texto */}
            <div className="welcome-logo shrink-0 text-white">
              <HispanaMark className="w-full h-full" />
            </div>

            {/* TEXTO: el hueco se abre a la medida exacta del texto, a la vez que el logo se aparta */}
            <div
              className="welcome-text-track shrink-0"
              style={
                isWideLayout
                  ? { width: welcomePhase === 2 ? welcomeTextSize.w : 0, marginLeft: welcomePhase === 2 ? 28 : 0 }
                  : { height: welcomePhase === 2 ? welcomeTextSize.h : 0, marginTop: welcomePhase === 2 ? 22 : 0 }
              }
            >
              <div ref={welcomeTextRef} className="welcome-text">
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight text-center sm:text-left sm:whitespace-nowrap sm:overflow-hidden sm:text-ellipsis">
                  {L('Bienvenido', 'Welcome')}, {displayName}
                </h2>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASO 1: NOMBRE Y EMAIL (PRIMERA VEZ)                     */}
        {/* ======================================================== */}
        {mode === 'step1_name_email' && (
          <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center">
            {/* Logo */}
            <div className="shrink-0 flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 text-white animate-splash-fade">
              <HispanaMark className="w-full h-full drop-shadow-[0_12px_40px_rgba(0,0,0,0.6)]" />
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

            <LangSwitch className="mt-4 animate-splash-fade" />

            {/* Formulario */}
            <div id="firstTimeForm" className="w-full space-y-4 animate-fadeIn mt-5">
              <form onSubmit={handleNextToStep2} className="space-y-4">
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-[#E84A27]/12 border border-[#E84A27]/35 text-[#FF6B4A] text-xs font-sans text-center">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block font-brand text-[10px] tracking-wider text-gray-400 uppercase mb-1.5 font-bold">
                    {L('1. TU NOMBRE O APODO:', '1. YOUR NAME OR NICKNAME:')} <span className="text-[#C83214]">*</span>
                  </label>
                  <input
                    type="text"
                    id="registerName"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={L('ej. Carmen, Marcos, Ana...', 'e.g. Carmen, Mark, Anna...')}
                    className="w-full inset-field rounded-xl px-4 py-3 text-sm font-medium text-white placeholder-gray-500 focus:outline-none focus:border-[#E84A27] transition"
                  />
                </div>

                <div>
                  <label className="block font-brand text-[10px] tracking-wider text-gray-400 uppercase mb-1.5 font-bold">
                    {L('2. TU EMAIL:', '2. YOUR EMAIL:')} <span className="text-[#C83214]">*</span>
                  </label>
                  <input
                    type="email"
                    id="registerEmail"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder={L('ej. nombre@correo.com', 'e.g. name@email.com')}
                    className="w-full inset-field rounded-xl px-4 py-3 text-sm font-medium text-white placeholder-gray-500 focus:outline-none focus:border-[#E84A27] transition"
                  />
                </div>

                <div className="pt-1">
                  <ConsentChecks idPrefix="reg" value={consent} onChange={(v) => { setConsent(v); setErrorMsg(null); }} />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl btn-primary text-white font-brand font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <span>{L('Continuar', 'Continue')}</span>
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
                <div className="p-2.5 rounded-xl bg-[#E84A27]/12 border border-[#E84A27]/35 text-[#FF6B4A] text-xs font-sans text-center">
                  {errorMsg}
                </div>
              )}

              {/* Pregunta 1: ¿Eres? */}
              <div>
                <label className="block font-brand text-[11px] tracking-wider text-gray-400 uppercase mb-2 font-bold">
                  {L('¿ERES?', 'WHAT DO YOU PLAY?')} <span className="text-[#C83214]">*</span>
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
                            ? 'btn-primary text-white'
                            : 'btn-3d text-gray-300 hover:text-white'
                        }`}
                      >
                        {roleLabel(r, lang)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pregunta 2: ¿Qué nivel tienes? */}
              <div>
                <label className="block font-brand text-[11px] tracking-wider text-gray-400 uppercase mb-2 font-bold">
                  {L('¿QUÉ NIVEL TIENES?', 'WHAT IS YOUR LEVEL?')} <span className="text-[#C83214]">*</span>
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
                            ? 'btn-primary text-white'
                            : 'btn-3d text-gray-300 hover:text-white'
                        }`}
                      >
                        {levelLabel(lvl, lang)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón Guardar y Comenzar */}
              <button
                type="submit"
                className="w-full py-4 rounded-xl btn-primary text-white font-brand font-bold text-xs sm:text-sm uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 mt-3"
              >
                {L('Guardar y Comenzar a Practicar', 'Save and start practising')}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* FOOTER INFERIOR MINIMALISTA ELEGANTE */}
      <div className="pb-3 text-center animate-fadeIn shrink-0">
        <p className="font-sans text-[11px] sm:text-xs tracking-[0.28em] text-gray-400 uppercase font-medium">
          {L('de hispana percusión', 'by hispana percusión')}
        </p>
      </div>
    </div>
  );
};
