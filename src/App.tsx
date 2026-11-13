import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PALMAS_METHOD, rhythmTitle, rhythmName, rhythmPalos } from './data/rhythms';
import { useLang, LangSwitch } from './i18n';
import { FlamencoAudioEngine } from './audio/engine';
import { HispanaLogo } from './components/HispanaLogo';
import { FlamencoClock } from './components/FlamencoClock';
import { MonogramScore } from './components/MonogramScore';
import { TrainerModal } from './components/TrainerModal';
import { CommunityModal } from './components/CommunityModal';
import { VocabularioModal } from './components/VocabularioModal';
import { RegistrationModal } from './components/RegistrationModal';
import { ProUnlockModal } from './components/ProUnlockModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { AtrilLandscapeMode } from './components/AtrilLandscapeMode';
import { SplashScreen } from './components/SplashScreen';
import { EditNameModal } from './components/EditNameModal';
import { AppTour, TourStep } from './components/AppTour';
import { ConsentGateModal } from './components/ConsentGateModal';
import { InstallWelcome } from './components/InstallWelcome';
import { isStandalone } from './services/install';
import { FeedbackModal } from './components/FeedbackModal';
import { track } from './services/analytics';
import { hasValidConsent, onConsentChange, saveConsent, CONSENT_VERSION } from './services/consent';
import { CountMode, PalmaTone, TrainerConfig, ViewMode, UserProfile } from './types';
import { APP_CONFIG, methodUrl } from './config';
import { verifyProCode, ProCheckResult } from './services/pro';
import { Play, Square, Lock, CheckCircle2, Maximize2, User } from 'lucide-react';
import { saveLeadToFirestore } from './services/firebase';
import { enableKeepAwake, disableKeepAwake, onKeepAwakeChange } from './services/keepAwake';
import { loadSession, saveSession } from './services/session';
import { addPracticeSeconds, getPracticeStats, PracticeStats } from './services/practice';
import { PracticeStreak } from './components/PracticeStreak';

// Última sesión guardada en este dispositivo (ritmo, velocidad, palmas…): se retoma al abrir la app.
// Un ritmo PRO solo se recupera si el acceso PRO sigue activo.
const SAVED = loadSession();
const SAVED_RHYTHM_INDEX = (() => {
  const idx = PALMAS_METHOD.findIndex((r) => r.id === SAVED.rhythmId);
  if (idx < 0) return 0;
  let pro = false;
  try {
    pro = localStorage.getItem('hispanapp_pro') === 'true';
  } catch {
    pro = false;
  }
  return pro || idx === 0 || idx === 5 ? idx : 0;
})();
const SAVED_BPM =
  SAVED.bpm && PALMAS_METHOD[SAVED_RHYTHM_INDEX].id === SAVED.rhythmId
    ? SAVED.bpm
    : PALMAS_METHOD[SAVED_RHYTHM_INDEX].bpmRange.default;

export default function App() {
  const { lang, L } = useLang();
  const [rhythmIndex, setRhythmIndex] = useState<number>(SAVED_RHYTHM_INDEX);
  const [bpm, setBpmState] = useState<number>(SAVED_BPM);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>(SAVED.viewMode ?? 'split');
  const [countMode, setCountMode] = useState<CountMode>(SAVED.countMode ?? 'phonetic');
  const [palmaTone, setPalmaToneState] = useState<PalmaTone>(SAVED.palmaTone ?? 'secas');

  // Embudo de negocio: Estado de Registro y Alumno PRO
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hispanapp_registered') === 'true';
  });
  const [isPro, setIsPro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('hispanapp_pro') === 'true';
  });
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState<boolean>(false);
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);
  const [proModalNotice, setProModalNotice] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [showWelcomeProToast, setShowWelcomeProToast] = useState<boolean>(false);

  // Modo Espejo / Atril a Distancia (Pantalla Gigante Horizontal)
  const [isAtrilMode, setIsAtrilMode] = useState<boolean>(false);

  // Cuenta Previa (Count-In) state (activo por defecto sincronizado con click percusivo sin voz humana)
  const [countInEnabled, setCountInEnabled] = useState<boolean>(SAVED.countIn ?? true);

  // Guardar la sesión cada vez que cambia algo
  useEffect(() => {
    saveSession({ rhythmId: PALMAS_METHOD[rhythmIndex].id, bpm, palmaTone, countMode, viewMode, countIn: countInEnabled });
  }, [rhythmIndex, bpm, palmaTone, countMode, viewMode, countInEnabled]);

  // Racha de práctica: se suma el tiempo que suena el ritmo (cada 10 s y al parar)
  const [practice, setPractice] = useState<PracticeStats>(() => getPracticeStats());
  useEffect(() => {
    if (!isPlaying) return;
    let last = Date.now();
    const flush = () => {
      const now = Date.now();
      setPractice(addPracticeSeconds((now - last) / 1000));
      last = now;
    };
    const id = window.setInterval(flush, 10000);
    return () => {
      window.clearInterval(id);
      flush();
    };
  }, [isPlaying]);
  // Metrónomo de fondo (activo por defecto; se recuerda en este dispositivo)
  const [metronomeOn, setMetronomeOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hispanapp_metronome') !== 'off';
    } catch {
      return true;
    }
  });
  const toggleMetronome = () => {
    const next = !metronomeOn;
    setMetronomeOn(next);
    engineRef.current?.setMetronomeEnabled(next);
    try {
      localStorage.setItem('hispanapp_metronome', next ? 'on' : 'off');
    } catch {
      // Ignorar
    }
  };
  const [countInText, setCountInText] = useState<string | null>(null);

  // Screen Wake Lock API state & ref
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  // Pantalla de Inicio y Carga (Splash Screen) + Perfil de Usuario Inteligente
  const [showSplash, setShowSplash] = useState<boolean>(true);
  // Llegada desde la web con ?instalar: abrir la ventana para guardar la app en el móvil
  // Con ?instalar&compra (botón de Lemon Squeezy tras pagar) el texto habla de la compra y, al cerrar, se abre la
  // ventana para pegar la clave del email.
  const purchaseArrivalRef = useRef<boolean>(false);
  const [showInstallWelcome, setShowInstallWelcome] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const wantsInstall = params.has('instalar');
      const fromPurchase = params.has('compra');
      if (!wantsInstall && !fromPurchase) return false;
      purchaseArrivalRef.current = fromPurchase;
      params.delete('instalar');
      params.delete('compra');
      const q = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState(null, '', `${window.location.pathname}${q}${window.location.hash}`);
      return !isStandalone();
    } catch {
      return false;
    }
  });

  // Si el PRO se activa mientras la ventana PRO está abierta (p. ej. el código del enlace tardó en comprobarse), cerrarla
  useEffect(() => {
    if (isPro) {
      setIsProModalOpen(false);
      setProModalNotice(null);
    }
  }, [isPro]);

  // Llegada tras la compra: si ya está instalada (o no hay que instalar), ir directo a pegar la clave
  useEffect(() => {
    if (!purchaseArrivalRef.current || showInstallWelcome) return;
    if (localStorage.getItem('hispanapp_pro') === 'true') return;
    // (si el código del enlace falló, se conserva ese aviso, más concreto)
    setProModalNotice((prev) => prev ?? L('¡Gracias por tu compra! Pega aquí la clave de licencia que te llegó por email.', 'Thank you for your purchase! Paste here the license key you received by email.'));
    setIsProModalOpen(true);
    purchaseArrivalRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInstallWelcome]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('hispanapp_user_profile');
      if (stored) {
        return JSON.parse(stored) as UserProfile;
      }
      const legacy = localStorage.getItem('hispanapp_username');
      if (legacy && legacy.trim()) {
        return {
          name: legacy.trim(),
          contact: '',
          role: 'Percusionista 🥁',
          level: 'Medio',
        };
      }
    } catch {
      //
    }
    return null;
  });
  const [username, setUsername] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const stored = localStorage.getItem('hispanapp_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name) return parsed.name;
      }
    } catch {}
    return localStorage.getItem('hispanapp_username') || '';
  });
  const [isEditNameOpen, setIsEditNameOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  // Consentimiento de privacidad (se pide una vez a quien ya estaba registrado sin haberlo aceptado)
  const [consentOk, setConsentOk] = useState<boolean>(() => hasValidConsent());
  useEffect(() => onConsentChange((c) => setConsentOk(!!c && c.version === CONSENT_VERSION)), []);

  const handleConsentGateAccept = (prefs: { marketing: boolean; analytics: boolean }) => {
    saveConsent(prefs);
    if (userProfile) {
      saveLeadToFirestore({
        name: userProfile.name,
        email: userProfile.contact,
        role: userProfile.role,
        level: userProfile.level,
        source: 'consentimiento',
        consentVersion: CONSENT_VERSION,
        marketingOptIn: prefs.marketing,
        analyticsOptIn: prefs.analytics,
      });
    }
  };
  const [audioReady, setAudioReady] = useState<boolean>(false);

  // Trainer Modal
  const [isTrainerOpen, setIsTrainerOpen] = useState<boolean>(false);
  const [trainerConfig, setTrainerConfig] = useState<TrainerConfig>({
    enabled: false,
    stepBpm: 5,
    everyCycles: 4,
    maxBpm: 180,
  });
  const trainerConfigRef = useRef(trainerConfig);
  trainerConfigRef.current = trainerConfig;

  // Modales divididos: Comunidad/Método/WhatsApp y Explicaciones de Flamenco
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState<boolean>(false);
  const [isTheoryModalOpen, setIsTheoryModalOpen] = useState<boolean>(false);

  // ¿Hay alguna ventana abierta encima de la app? (para no reaccionar a los atajos de teclado)
  const anyModalOpenRef = useRef(false);
  anyModalOpenRef.current =
    showSplash || isProModalOpen || isVideoModalOpen || isRegistrationModalOpen || isEditNameOpen ||
    isFeedbackOpen || isTrainerOpen || isCommunityModalOpen || isTheoryModalOpen || isTourOpen || showInstallWelcome;

  // Tap tempo state
  const tapTimesRef = useRef<number[]>([]);

  // Current Rhythm
  const currentRhythm = useMemo(() => PALMAS_METHOD[rhythmIndex], [rhythmIndex]);

  // Audio Engine reference
  const engineRef = useRef<FlamencoAudioEngine | null>(null);

  // 1. Activación desde la dirección: QR físico (?acceso=CODIGO), enlace con licencia (?license_key=...)
  //    o vuelta desde la compra en Lemon Squeezy (?checkout=success). Todo se comprueba con verifyProCode.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let params: URLSearchParams;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      return;
    }
    const codeFromUrl =
      params.get('acceso') || params.get('pro') || params.get('codigo') || params.get('license_key');
    const cameFromCheckout =
      params.has('order_id') ||
      params.has('order_key') ||
      params.get('checkout') === 'success' ||
      params.get('status') === 'paid' ||
      params.get('lemon_squeezy') === 'success';

    if (!codeFromUrl && !cameFromCheckout) return;

    // Quitar los parámetros de la dirección para que el código no quede a la vista
    ['acceso', 'pro', 'codigo', 'order_id', 'order_key', 'license_key', 'checkout', 'status', 'lemon_squeezy'].forEach((p) =>
      params.delete(p)
    );
    const newQuery = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState(null, '', `${window.location.pathname}${newQuery}${window.location.hash}`);

    if (codeFromUrl) {
      handleActivateProCode(codeFromUrl).then((result) => {
        if (!result.ok) {
          setProModalNotice(
            result.reason === 'unavailable'
              ? L('No se pudo comprobar el código del enlace. Revisa tu conexión y escríbelo aquí.', 'The code in the link could not be checked. Check your connection and type it in here.')
              : L('El código del enlace no es válido. Escríbelo a mano o escríbenos por WhatsApp.', 'The code in the link is not valid. Type it in by hand or message us on WhatsApp.')
          );
          setIsProModalOpen(true);
        }
      });
    } else if (!localStorage.getItem('hispanapp_pro')) {
      setProModalNotice(L('¡Gracias por tu compra! Pega aquí la clave de licencia que te llegó por email.', 'Thank you for your purchase! Paste here the license key you received by email.'));
      setIsProModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desbloqueo universal de audio para móviles (iOS Safari / Android Chrome) en el primer gesto
  useEffect(() => {
    const unlockOnGesture = () => {
      engineRef.current?.unlockAudio();
    };

    window.addEventListener('touchstart', unlockOnGesture, { passive: true, once: true });
    window.addEventListener('touchend', unlockOnGesture, { passive: true, once: true });
    window.addEventListener('pointerdown', unlockOnGesture, { passive: true, once: true });
    window.addEventListener('click', unlockOnGesture, { passive: true, once: true });

    return () => {
      window.removeEventListener('touchstart', unlockOnGesture);
      window.removeEventListener('touchend', unlockOnGesture);
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('click', unlockOnGesture);
    };
  }, []);

  // Initialize engine once
  useEffect(() => {
    const engine = new FlamencoAudioEngine(currentRhythm, bpm);
    engine.setPalmaTone(palmaTone);
    engine.setAudioSourceMode('jordan');
    engine.setCountInEnabled(countInEnabled);
    engine.setMetronomeEnabled(metronomeOn);

    engine.setCallbacks(
      (step, cycle) => {
        setActiveStep(step);
        setCycleCount(cycle);
        setCountInText(null);
      },
      (newCycle) => {
        setCycleCount(newCycle);
        const cfg = trainerConfigRef.current;
        // Valores del entrenador dentro de límites sensatos (el alumno puede escribir cualquier número)
        const every = Math.max(1, Math.min(64, Math.round(cfg.everyCycles) || 4));
        const stepUp = Math.max(1, Math.min(40, Math.round(cfg.stepBpm) || 5));
        const maxBpm = Math.max(40, Math.min(250, Math.round(cfg.maxBpm) || 180));
        if (cfg.enabled && newCycle > 1 && (newCycle - 1) % every === 0) {
          setBpmState((prevBpm) => {
            if (prevBpm >= maxBpm) return prevBpm;
            const nextBpm = Math.min(maxBpm, prevBpm + stepUp);
            engine.setBpm(nextBpm);
            return nextBpm;
          });
        }
      },
      (num) => {
        setCountInText(num);
        setActiveStep(-1);
      },
      (loaded) => {
        setAudioReady(loaded);
      }
    );

    engineRef.current = engine;

    return () => {
      engine.stop();
    };
  }, []);

  // Estadísticas: qué ventanas se abren (solo si el alumno permitió las estadísticas)
  useEffect(() => { if (isProModalOpen) track('open_pro_modal', { rhythm: currentRhythm.id }); }, [isProModalOpen]);
  useEffect(() => { if (isCommunityModalOpen) track('open_community'); }, [isCommunityModalOpen]);
  useEffect(() => { if (isTheoryModalOpen) track('open_vocabulary'); }, [isTheoryModalOpen]);
  useEffect(() => { if (isVideoModalOpen) track('open_video', { rhythm: currentRhythm.id }); }, [isVideoModalOpen]);
  useEffect(() => { if (isTrainerOpen) track('open_trainer'); }, [isTrainerOpen]);
  useEffect(() => { if (isAtrilMode) track('open_atril'); }, [isAtrilMode]);

  // Al salir de la app (cambiar de app, bloquear el teléfono o cambiar de pestaña) se para la reproducción:
  // en segundo plano el navegador frena el temporizador y los golpes sonarían desordenados.
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  useEffect(() => {
    const stopPlayback = () => {
      if (!isPlayingRef.current) return;
      engineRef.current?.stop();
      setIsPlaying(false);
      setActiveStep(-1);
      setCountInText(null);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stopPlayback();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', stopPlayback);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', stopPlayback);
    };
  }, []);

  // Pantalla siempre encendida mientras suena o en el Atril (Wake Lock, con respaldo: ver keepAwake.ts)
  useEffect(() => onKeepAwakeChange(setIsWakeLockActive), []);
  const requestWakeLock = () => {
    enableKeepAwake();
  };
  const releaseWakeLock = () => {
    disableKeepAwake();
  };

  // Sync wake lock with isPlaying state and isAtrilMode (mantiene pantalla encendida en el atril)
  useEffect(() => {
    if (isPlaying || isAtrilMode) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
  }, [isPlaying, isAtrilMode]);

  // Handle document visibility change to re-acquire Wake Lock if user leaves and returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && (isPlaying || isAtrilMode)) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, isAtrilMode]);

  // Soltar la pantalla solo al cerrar la app. (Antes se soltaba y se volvía a pedir en cada Play, fuera del
  // toque del usuario: en iPhone eso impedía arrancar el respaldo que mantiene la pantalla encendida.)
  useEffect(() => () => disableKeepAwake(), []);

  // Modo atril automático solo en móviles y tablets: se abre al girar a horizontal y se cierra al volver a vertical.
  // Solo reacciona cuando la orientación cambia de verdad (no en cada "resize", que en móvil ocurre
  // al mostrarse u ocultarse la barra del navegador). En ordenador se abre con el botón "Atril".
  const lastOrientationRef = useRef<'portrait' | 'landscape' | null>(null);
  useEffect(() => {
    const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

    const handleOrientation = () => {
      const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
      if (orientation === lastOrientationRef.current) return;
      lastOrientationRef.current = orientation;
      if (!isTouchDevice()) return;
      setIsAtrilMode(orientation === 'landscape');
    };

    handleOrientation();
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Keyboard shortcuts (Space to Play/Pause, Arrow keys for BPM)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // No usar los atajos mientras se escribe (opinión, perfil, código PRO…)
      const t = e.target as HTMLElement | null;
      if (t && (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement || t.isContentEditable)) return;
      // Con una ventana abierta (Comunidad, PRO, perfil…) los atajos no deben arrancar el ritmo por detrás
      if (anyModalOpenRef.current) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowUp' || e.code === 'ArrowRight') {
        e.preventDefault();
        adjustBpm(1);
      } else if (e.code === 'ArrowDown' || e.code === 'ArrowLeft') {
        e.preventDefault();
        adjustBpm(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, bpm, countInEnabled]);

  // Verificación de desbloqueo de ritmo:
  // En la versión libre solo están disponibles el ritmo I (índice 0) y el ritmo VI (índice 5).
  // Los demás están bloqueados y se desbloquean en la versión PRO.
  const isRhythmUnlocked = (idx: number) => {
    if (isPro) return true;
    return idx === 0 || idx === 5;
  };

  // Handle rhythm selection con muro PRO
  const handleRhythmSelect = (newRhythmIdx: number) => {
    if (!isRhythmUnlocked(newRhythmIdx)) {
      setIsProModalOpen(true);
      return;
    }
    setRhythmIndex(newRhythmIdx);
    const nextRhythm = PALMAS_METHOD[newRhythmIdx];
    track('select_rhythm', { rhythm: nextRhythm.id });
    const defaultBpm = nextRhythm.bpmRange.default;
    setBpmState(defaultBpm);
    setActiveStep(-1);
    setCountInText(null);
    setCycleCount(1);

    if (engineRef.current) {
      engineRef.current.setRhythm(nextRhythm);
      engineRef.current.setBpm(defaultBpm);
    }
  };

  const handlePrevRhythm = () => {
    const prevIdx = (rhythmIndex - 1 + PALMAS_METHOD.length) % PALMAS_METHOD.length;
    handleRhythmSelect(prevIdx);
  };

  const handleNextRhythm = () => {
    const nextIdx = (rhythmIndex + 1) % PALMAS_METHOD.length;
    handleRhythmSelect(nextIdx);
  };

  // Sync BPM changes
  const updateBpm = (newBpm: number) => {
    const clamped = Math.max(35, Math.min(250, newBpm));
    setBpmState(clamped);
    if (engineRef.current) {
      engineRef.current.setBpm(clamped);
    }
  };

  const adjustBpm = (delta: number) => {
    updateBpm(bpm + delta);
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!engineRef.current) return;
    engineRef.current.unlockAudio();
    if (isPlaying) {
      engineRef.current.stop();
      setIsPlaying(false);
      setActiveStep(-1);
      setCountInText(null);
    } else {
      // Dentro del toque de Play: así puede arrancar el respaldo que mantiene la pantalla encendida
      enableKeepAwake();
      engineRef.current.setCountInEnabled(countInEnabled);
      engineRef.current.start(countInEnabled);
      setIsPlaying(true);
      track('play', { rhythm: currentRhythm.id, bpm });
    }
  };

  // Tap Tempo
  const handleTapTempo = () => {
    const now = performance.now();
    engineRef.current?.tapSound();

    if (tapTimesRef.current.length > 0 && now - tapTimesRef.current[tapTimesRef.current.length - 1] > 2200) {
      tapTimesRef.current = [];
    }

    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 4) {
      tapTimesRef.current.shift();
    }

    if (tapTimesRef.current.length >= 2) {
      let intervalSum = 0;
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervalSum += tapTimesRef.current[i] - tapTimesRef.current[i - 1];
      }
      const avgInterval = intervalSum / (tapTimesRef.current.length - 1);
      const calculatedBpm = Math.round(60000 / avgInterval);
      updateBpm(calculatedBpm);
    }
  };

  // Preview beat group
  const previewTimersRef = useRef<number[]>([]);
  const handlePreviewBeatGroup = (startStep: number, length: number) => {
    engineRef.current?.previewBeatGroup(startStep, length);
    // Mientras suena el ritmo, la iluminación la lleva el motor: aquí solo se escucha el compás tocado
    if (isPlayingRef.current) return;
    previewTimersRef.current.forEach((id) => window.clearTimeout(id));
    previewTimersRef.current = [];
    setActiveStep(startStep);
    const stepDurMs = (60000 / bpm) / (currentRhythm.stepsPerBeat || 2);
    for (let i = 1; i < length; i++) {
      previewTimersRef.current.push(
        window.setTimeout(() => {
          if (!isPlayingRef.current) setActiveStep(startStep + i);
        }, i * stepDurMs)
      );
    }
    // Al terminar, apagar la nota iluminada (antes se quedaba encendida)
    previewTimersRef.current.push(
      window.setTimeout(() => {
        if (!isPlayingRef.current) setActiveStep(-1);
      }, length * stepDurMs + 250)
    );
  };

  // Set Palma Tone
  const handleToneChange = (tone: PalmaTone) => {
    setPalmaToneState(tone);
    engineRef.current?.setPalmaTone(tone);
  };

  // Apertura de videos oficiales
  const handleOpenVideo = () => {
    if (isPro) {
      if (isPlaying) {
        engineRef.current?.stop();
        setIsPlaying(false);
        setActiveStep(-1);
        setCountInText(null);
      }
      setIsVideoModalOpen(true);
    } else {
      setIsProModalOpen(true);
    }
  };

  // Apertura de entrenador progresivo (exclusivo PRO)
  const handleOpenTrainer = () => {
    if (!isPro) {
      setIsProModalOpen(true);
    } else {
      setIsTrainerOpen(true);
    }
  };

  // Validación de códigos PRO: licencias de Lemon Squeezy y códigos de alumno en Firebase
  const handleActivateProCode = async (code: string): Promise<ProCheckResult> => {
    const result = await verifyProCode(code);
    if (result.ok) {
      localStorage.setItem('hispanapp_pro', 'true');
      localStorage.setItem('hispanapp_pro_code', code.trim());
      track('pro_activated', { method: result.source });
      localStorage.setItem('hispanapp_registered', 'true');
      setIsPro(true);
      setIsRegistered(true);
      setShowWelcomeProToast(true);
      setTimeout(() => setShowWelcomeProToast(false), 5000);
    }
    return result;
  };

  // Registro exitoso desde el lead magnet
  const handleRegistrationSuccess = (regName?: string, regEmail?: string) => {
    localStorage.setItem('hispanapp_registered', 'true');
    if (regName && regName.trim()) {
      const cleanName = regName.trim();
      const cleanEmail = (regEmail || '').trim();
      localStorage.setItem('hispanapp_username', cleanName);
      const newProf: UserProfile = {
        name: cleanName,
        contact: cleanEmail,
        role: 'Percusionista 🥁',
        level: 'Medio',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('hispanapp_user_profile', JSON.stringify(newProf));
      setUserProfile(newProf);
      setUsername(cleanName);
    }
    setIsRegistered(true);
    setIsRegistrationModalOpen(false);
  };

  // Edición del perfil desde la cabecera: si cambian nombre o email, se registra también en Firebase
  const handleProfileEdit = (newProfile: UserProfile) => {
    const changed =
      !userProfile ||
      userProfile.name !== newProfile.name ||
      userProfile.contact !== newProfile.contact ||
      userProfile.role !== newProfile.role ||
      userProfile.level !== newProfile.level;
    handleProfileSave(newProfile);
    if (changed) {
      saveLeadToFirestore({
        name: newProfile.name,
        email: newProfile.contact,
        role: newProfile.role,
        level: newProfile.level,
        source: 'perfil_actualizado',
      });
    }
  };

  // ===== Mini recorrido por la app =====
  const tourSteps: TourStep[] = [
    {
      target: 'ritmos',
      icon: '🎵',
      title: L('Los 8 ritmos del método', 'The 8 rhythms of the method'),
      text: isPro
        ? L('Aquí eliges el ritmo. Debajo ajustas la cuenta y el tipo de palmas: brillantes o sordas.', 'Choose the rhythm here. Below you set the count and the type of palmas: brillantes (bright) or sordas (muted).')
        : L('Aquí eliges el ritmo. Los que tienen candado se desbloquean con la versión PRO. Debajo ajustas la cuenta y el tipo de palmas.', 'Choose the rhythm here. The ones with a lock are unlocked with the PRO version. Below you set the count and the type of palmas (claps).'),
    },
    {
      target: 'reloj',
      icon: '🕐',
      title: L('Reloj de compás y partitura', 'Compás clock and score'),
      text: L('El reloj muestra cada tiempo del compás mientras suena: el número grande es el tiempo que suena. Debajo está la partitura; toca cualquier compás para escucharlo.', 'The clock shows each beat of the compás (rhythmic cycle) as it plays. The score is below it: tap any bar to hear it.'),
    },
    {
      target: 'metronomo',
      icon: '▶️',
      title: L('Metrónomo con palmas reales', 'Metronome with real palmas'),
      text: L('Dale a Play para practicar con las palmas de Jordan. Cambia la velocidad con −/+ o marca tu pulso con TAP.', "Press Play to practise with Jordan's real hand claps. Change the speed with −/+ or tap your own pulse with TAP."),
    },
    {
      target: 'entrenador',
      icon: '🥁',
      title: L('Entrenador progresivo', 'Progressive trainer'),
      text: isPro
        ? L('Sube la velocidad sola cada pocas vueltas para que ganes soltura sin parar a tocar botones.', 'It raises the speed by itself every few cycles, so you build fluency without stopping to press buttons.')
        : L('Sube la velocidad sola cada pocas vueltas para que ganes soltura. Es una función de la versión PRO.', 'It raises the speed by itself every few cycles so you build fluency. It is a PRO feature.'),
    },
    {
      target: 'atril',
      icon: '🖥️',
      title: L('Modo Atril', 'Music stand mode (Atril)'),
      text: L('Pantalla grande para tocar a distancia o proyectar en clase. En el móvil también se abre al girarlo.', 'A big screen to play from a distance or project in class. On a phone it also opens when you turn it sideways.'),
    },
    {
      target: 'comunidad',
      icon: '🤝',
      title: L('Comunidad y Vocabulario', 'Community and Vocabulary'),
      text: L('En Comunidad: compartir la app con tus alumnos o compañeros, clases, el método completo y tu código PRO. En Vocabulario: los términos del flamenco explicados.', 'In Community: share the app with your students or bandmates, lessons, the full method and your PRO code. In Vocabulary: flamenco terms explained.'),
    },
  ];

  const startTour = () => {
    setIsCommunityModalOpen(false);
    setViewMode('split');
    if (isPlaying) togglePlay();
    setIsTourOpen(true);
  };

  const finishTour = () => {
    setIsTourOpen(false);
    track('tour_closed');
    try {
      localStorage.setItem('hispanapp_tour_done', 'true');
    } catch {
      // Ignorar
    }
  };

  // Primera vez: al terminar la bienvenida, lanzar el recorrido (si no hay otra ventana abierta)
  useEffect(() => {
    if (showSplash || isAtrilMode || !consentOk || showInstallWelcome) return;
    let done = false;
    try {
      done = localStorage.getItem('hispanapp_tour_done') === 'true';
    } catch {
      done = true;
    }
    if (done) return;
    const t = setTimeout(() => {
      if (!isProModalOpen && !isCommunityModalOpen && !isTheoryModalOpen && !isTrainerOpen) startTour();
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSplash, isAtrilMode, consentOk, showInstallWelcome]);

  // Si se abre el Atril (por ejemplo al girar el móvil), cerrar el recorrido sin marcarlo como visto
  useEffect(() => {
    if (isAtrilMode && isTourOpen) setIsTourOpen(false);
  }, [isAtrilMode, isTourOpen]);

  // Manejo de entrada y actualización de usuario desde Splash / Perfil
  const handleUserEnterFromSplash = () => {
    engineRef.current?.init();
  };

  const handleProfileSave = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    setUsername(newProfile.name);
    localStorage.setItem('hispanapp_user_profile', JSON.stringify(newProfile));
    localStorage.setItem('hispanapp_username', newProfile.name);
    localStorage.setItem('hispanapp_registered', 'true');
    setIsRegistered(true);
  };

  return (
    <div className="min-h-screen app-backdrop text-white flex flex-col justify-between selection:bg-[#E84A27] selection:text-white pb-32 sm:pb-28">
      {/* Toast flotante de bienvenida PRO */}
      {showWelcomeProToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#1C1E2C] border border-emerald-500/60 shadow-[0_8px_30px_rgba(16,185,129,0.35)] rounded-2xl px-4 py-2.5 flex items-center gap-2.5 text-white text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{L('¡Acceso PRO de Hispana Percusión activado!', 'Hispana Percusión PRO access activated!')}</span>
        </div>
      )}

      {/* HEADER COMPACTO Y MINIMALISTA */}
      <header className="border-b border-white/[0.06] bg-[#0B0D12]/85 backdrop-blur-2xl sticky top-0 z-30 shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <a
              href="https://hispanapercusion.com"
              target="_blank"
              rel="noopener noreferrer"
              className="select-none"
              title={L('Ir a la web de Hispana Percusión', 'Visit the Hispana Percusión website')}
              aria-label={L('Ir a la web de Hispana Percusión', 'Visit the Hispana Percusión website')}
            >
              <HispanaLogo size="md" />
            </a>

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-brand text-lg sm:text-xl font-extrabold tracking-tight text-white leading-none">
                Hispan<span className="text-[#E84A27]">App</span>
              </span>
              {isPro && (
                <span className="text-[9px] font-brand font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-[#E84A27]/20 text-[#FF5533] border border-[#E84A27]/40 leading-none">
                  PRO
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 min-[380px]:gap-1.5 sm:gap-2 shrink-0">
            {/* Idioma (en el móvil no cabe en la cabecera: está en el registro, Comunidad y Tu perfil) */}
            <LangSwitch className="hidden sm:inline-flex" />

            {/* Botón Perfil: ver y cambiar nombre, email, rol y nivel */}
            <button
              onClick={() => setIsEditNameOpen(true)}
              className="h-8.5 max-w-[9rem] flex items-center gap-1.5 px-2.5 sm:px-3 rounded-full btn-3d text-gray-200 hover:text-white text-xs font-medium tracking-wide cursor-pointer select-none"
              title={L('Tu perfil', 'Your profile')}
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline truncate">{username || L('Perfil', 'Profile')}</span>
            </button>

            {/* Botón Modo Atril (pantalla grande, útil para proyectar en clase) */}
            <button
              data-tour="atril"
              onClick={() => setIsAtrilMode(true)}
              className="h-8.5 flex items-center gap-1.5 px-2.5 sm:px-3 rounded-full btn-3d text-gray-200 hover:text-white text-xs font-medium tracking-wide cursor-pointer select-none"
              title={L('Modo Atril: pantalla grande para tocar a distancia', 'Music stand mode: big screen to play from a distance')}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{L('Atril', 'Stand')}</span>
            </button>

            {/* Botón Entrenador Progresivo */}
            <button
              data-tour="entrenador"
              onClick={handleOpenTrainer}
              className={`h-8.5 flex items-center gap-1 px-2 min-[380px]:gap-1.5 min-[380px]:px-3 rounded-full border text-xs font-medium tracking-wide transition shadow-sm active:scale-95 cursor-pointer select-none ${
                trainerConfig.enabled
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'btn-3d text-gray-200 hover:text-white'
              }`}
              title={isPro ? L('Entrenador Progresivo de Velocidad', 'Progressive speed trainer') : L('Entrenador Progresivo (Función Alumno PRO)', 'Progressive trainer (PRO feature)')}
            >
              <span className="relative flex h-1.5 w-1.5">
                {trainerConfig.enabled && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                    trainerConfig.enabled ? 'bg-emerald-400' : 'bg-gray-500'
                  }`}
                />
              </span>
              <span className="text-xs sm:text-sm leading-none">🥁💪</span>
              {!isPro && <Lock className="w-2.5 h-2.5 text-gray-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-5xl w-full mx-auto px-3.5 pt-3.5 space-y-3.5 flex-1">
        {/* 1. SELECTOR DE LOS 8 RITMOS EN EL ORDEN DEL LIBRO */}
        <section data-tour="ritmos" className="glass-card rounded-3xl p-3.5 sm:p-4 space-y-3">
          {/* Botones rápidos I al VIII */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto -mx-2.5 px-2.5 py-2.5 -my-2">
            <span className="font-sans text-[11px] tracking-wider uppercase text-gray-400 mr-1.5 shrink-0 hidden sm:inline font-semibold">
              {L('Ritmos:', 'Rhythms:')}
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
              {PALMAS_METHOD.map((r, idx) => {
                const active = idx === rhythmIndex;
                const locked = !isRhythmUnlocked(idx);
                return (
                  <button
                    key={r.id}
                    onClick={() => handleRhythmSelect(idx)}
                    className={`relative min-w-[2rem] h-8 px-2 sm:px-2.5 rounded-full font-serif text-xs font-bold transition shrink-0 cursor-pointer flex items-center justify-center ${
                      active ? 'orb-active orb-tight scale-105' : 'btn-3d text-gray-400 hover:text-white'
                    }`}
                    title={locked ? `${rhythmTitle(r, lang)} (PRO)` : rhythmTitle(r, lang)}
                  >
                    <span>{r.roman}</span>
                    {locked && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#1B1F29] border border-white/[0.12] flex items-center justify-center shadow">
                        <Lock className="w-2 h-2 text-gray-400" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector Desplegable + Timbre, Cuenta y Cuenta Previa */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-white/[0.06]">
            <div className="flex-1">
              <select
                value={rhythmIndex}
                onChange={(e) => handleRhythmSelect(parseInt(e.target.value, 10))}
                className="w-full inset-field rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-[#E84A27]/60 cursor-pointer"
              >
                {PALMAS_METHOD.map((r, idx) => (
                  <option key={r.id} value={idx} className="bg-[#141821] text-white">
                    {!isRhythmUnlocked(idx) ? '🔒 ' : ''}{rhythmTitle(r, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end gap-2 shrink-0">
              {/* Botón Toggle Cuenta Previa (Activo por defecto) */}
              <button
                onClick={() => {
                  const nextVal = !countInEnabled;
                  setCountInEnabled(nextVal);
                  engineRef.current?.setCountInEnabled(nextVal);
                }}
                className={`px-3 py-2 rounded-full text-[13px] font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  countInEnabled ? 'btn-3d text-white' : 'segmented text-gray-400 hover:text-white'
                }`}
                aria-pressed={countInEnabled}
                title={L('Cuenta previa: antes de empezar suenan unos clics de preparación (3, 2, 1)', 'Count-in: a few preparation clicks (3, 2, 1) before the rhythm starts')}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${countInEnabled ? 'bg-[#FF5533] shadow-[0_0_6px_rgba(255,85,51,0.9)]' : 'bg-gray-500'}`} />
                <span>⏳ {L('Cuenta previa', 'Count-in')}</span>
              </button>

              {/* Metrónomo de fondo: "tac" en cada tiempo y "tum" grave en el primero del ritmo */}
              <button
                onClick={toggleMetronome}
                aria-pressed={metronomeOn}
                className={`px-3 py-2 rounded-full text-[13px] font-medium transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  metronomeOn ? 'btn-3d text-white' : 'segmented text-gray-400 hover:text-white'
                }`}
                title={L('Metrónomo de fondo: marca cada tiempo y un golpe grave en el primero del ritmo para ubicarte', 'Background metronome: a click on every beat and a low click on the first beat of the rhythm, to help you find your place')}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${metronomeOn ? 'bg-[#FF5533] shadow-[0_0_6px_rgba(255,85,51,0.9)]' : 'bg-gray-500'}`} />
                <span>⏱️ {L('Metrónomo', 'Metronome')}</span>
              </button>

              {/* Selector Cuenta 2 vs 12 (para ritmos de 12 tiempos) */}
              {currentRhythm.has12CountToggle && (
                <div className="col-span-2 sm:col-span-1 flex items-center gap-1 segmented p-1 rounded-full">
                  <span className="text-[13px] text-gray-400 px-2 shrink-0">{L('Cuenta:', 'Count:')}</span>
                  <button
                    onClick={() => setCountMode('phonetic')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-full text-[13px] font-sans transition cursor-pointer ${
                      countMode === 'phonetic'
                        ? 'seg-active text-white font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    2, 1, 2
                  </button>
                  <button
                    onClick={() => setCountMode('traditional')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-full text-[13px] font-sans transition cursor-pointer ${
                      countMode === 'traditional'
                        ? 'seg-active text-white font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    12, 1, 2
                  </button>
                </div>
              )}

              {/* Selector Timbre de Palmas */}
              <div className="col-span-2 sm:col-span-1 flex items-center gap-1 segmented p-1 rounded-full">
                <span className="text-[13px] text-gray-400 px-2 shrink-0" title={L('Palmas: palmadas flamencas', 'Palmas: flamenco hand claps')}>Palmas:</span>
                <button
                  onClick={() => handleToneChange('secas')}
                  title={L('Palmas brillantes: sonido agudo y fuerte', 'Palmas brillantes: bright, loud claps')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-full text-[13px] font-sans transition cursor-pointer ${
                    palmaTone === 'secas'
                      ? 'seg-active text-white font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Brillantes
                </button>
                <button
                  onClick={() => handleToneChange('sordas')}
                  title={L('Palmas sordas: sonido grave y suave', 'Palmas sordas: soft, muted claps')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-full text-[13px] font-sans transition cursor-pointer ${
                    palmaTone === 'sordas'
                      ? 'seg-active text-white font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sordas
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Racha de práctica */}
        <PracticeStreak stats={practice} />

        {/* Selector de Vista (Ambos / Reloj / Partitura) */}
        <div className="flex segmented p-1 rounded-full text-sm">
          <button
            onClick={() => setViewMode('split')}
            className={`flex-1 py-2.5 rounded-full font-sans transition cursor-pointer ${
              viewMode === 'split' ? 'seg-active text-white font-semibold' : 'text-gray-200 hover:text-white'
            }`}
          >
            {L('Ambos', 'Both')}
          </button>
          <button
            onClick={() => setViewMode('clock')}
            className={`flex-1 py-2.5 rounded-full font-sans transition cursor-pointer ${
              viewMode === 'clock' ? 'seg-active text-white font-semibold' : 'text-gray-200 hover:text-white'
            }`}
          >
            🕐 {L('Reloj', 'Clock')}
          </button>
          <button
            onClick={() => setViewMode('staff')}
            className={`flex-1 py-2.5 rounded-full font-sans transition cursor-pointer ${
              viewMode === 'staff' ? 'seg-active text-white font-semibold' : 'text-gray-200 hover:text-white'
            }`}
          >
            🎼 {L('Partitura', 'Score')}
          </button>
        </div>

        {/* 2. VISUALIZADOR: primero el RELOJ DE COMPÁS (más visual para quien no lee música) y debajo la PARTITURA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* A. RELOJ DE COMPÁS (lleva el título del ritmo y el botón de Video) */}
          {(viewMode === 'split' || viewMode === 'clock') && (
            <div
              data-tour="reloj"
              className={`${
                viewMode === 'clock' ? 'lg:col-span-12' : 'lg:col-span-5'
              } glass-card rounded-3xl p-4 sm:p-5 flex flex-col items-center space-y-3`}
            >
              <div className="w-full">
                {/* Encabezado limpio con título del ritmo en blanco, botón de Video PRO y badge de compás */}
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-serif text-xs sm:text-sm font-bold text-[#E84A27] px-2 py-0.5 rounded-lg bg-[#E84A27]/10">
                      {currentRhythm.roman}
                    </span>
                    <h2 className="font-sans text-sm sm:text-base font-semibold text-white tracking-tight truncate">
                      {rhythmName(currentRhythm)}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Botón destacado ▶ Video (Exclusivo Alumnos PRO) */}
                    <button
                      onClick={handleOpenVideo}
                      className={`px-3 py-1 rounded-full text-xs font-sans font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm ${
                        isPro
                          ? 'orb-active hover:brightness-110'
                          : 'btn-3d text-amber-300 border-amber-400/30'
                      }`}
                      title={isPro ? L('Ver video demostrativo PRO', 'Watch the PRO demo video') : L('Video exclusivo Alumnos PRO', 'Video for PRO students only')}
                    >
                      <span>▶ Video</span>
                      {!isPro && <Lock className="w-3 h-3 text-amber-300" />}
                    </button>
                  </div>
                </div>

              </div>
              <div className="w-full flex items-center justify-between">
                <span className="font-sans text-[11px] tracking-wider uppercase text-gray-400 font-semibold">
                  {L('Ciclo de Compás', 'Compás cycle')}
                </span>
                <span className="text-xs font-sans text-gray-300 font-medium px-2 py-0.5 rounded-full bg-white/[0.05]">
                  {L('Vuelta:', 'Cycle:')} <span className="text-white font-semibold tabular-nums">{cycleCount}</span>
                </span>
              </div>

              <FlamencoClock
                rhythm={currentRhythm}
                activeStep={activeStep}
                countMode={countMode}
                countInText={countInText}
                onBeatClick={(b) => handlePreviewBeatGroup(b * currentRhythm.stepsPerBeat, currentRhythm.stepsPerBeat)}
              />

              <div className="w-full flex items-center justify-center gap-6 pt-2 border-t border-white/[0.04] text-[12px] text-gray-400 font-sans">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E84A27] inline-block shadow-[0_0_6px_rgba(232,74,39,0.5)]" /> {L('Acento', 'Accent')} (&gt;)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/30 inline-block" /> {L('Pulso', 'Pulse')}
                </span>
              </div>
              {viewMode === 'clock' && <div className="w-full">
              {/* Sección limpia de palos que se acompañan con tipografía Inter moderna */}
              <div className="py-0.5">
                <span className="font-sans text-[11px] uppercase tracking-wider text-gray-400 font-semibold block mb-1">
                  {L('Palos que se acompañan', 'Palos (flamenco styles) it accompanies')}
                </span>
                <p className="font-sans text-sm text-gray-200 font-medium leading-relaxed">
                  {rhythmPalos(currentRhythm, lang)}
                </p>
              </div>

              </div>}
            </div>
          )}

          {/* B. PARTITURA MONOGRAMA (debajo del reloj, como apoyo para quien lee música) */}
          {(viewMode === 'split' || viewMode === 'staff') && (
            <div
              data-tour="partitura"
              className={`${
                viewMode === 'staff' ? 'lg:col-span-12' : 'lg:col-span-7'
              } glass-card rounded-3xl p-4 sm:p-5 space-y-3.5 overflow-hidden`}
            >
              {viewMode === 'staff' ? (
                <>
              {/* Encabezado limpio con título del ritmo en blanco, botón de Video PRO y badge de compás */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-serif text-xs sm:text-sm font-bold text-[#E84A27] px-2 py-0.5 rounded-lg bg-[#E84A27]/10">
                    {currentRhythm.roman}
                  </span>
                  <h2 className="font-sans text-sm sm:text-base font-semibold text-white tracking-tight truncate">
                    {rhythmName(currentRhythm)}
                  </h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Botón destacado ▶ Video (Exclusivo Alumnos PRO) */}
                  <button
                    onClick={handleOpenVideo}
                    className={`px-3 py-1 rounded-full text-xs font-sans font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm ${
                      isPro
                        ? 'orb-active hover:brightness-110'
                        : 'btn-3d text-amber-300 border-amber-400/30'
                    }`}
                    title={isPro ? L('Ver video demostrativo PRO', 'Watch the PRO demo video') : L('Video exclusivo Alumnos PRO', 'Video for PRO students only')}
                  >
                    <span>▶ Video</span>
                    {!isPro && <Lock className="w-3 h-3 text-amber-300" />}
                  </button>
                </div>
              </div>

                </>
              ) : (
                <span className="font-sans text-[11px] tracking-wider uppercase text-gray-400 font-semibold block">
                  {L('Partitura', 'Score')}
                </span>
              )}

              {/* Lienzo Oscuro con el Monograma Exacto del Libro en una sola tira horizontal continua */}
              <div>
                <MonogramScore
                  rhythm={currentRhythm}
                  activeStep={activeStep}
                  countMode={countMode}
                  onPreviewBeat={handlePreviewBeatGroup}
                />
              </div>

              {/* Banner hacia el método LRDF (Lemon Squeezy, en el idioma de la app) */}
              <a
                href={methodUrl(lang)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl btn-3d border-[#E84A27]/30 hover:border-[#E84A27]/70 text-xs text-gray-200 hover:text-white transition shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">📘</span>
                  <span className="font-sans font-semibold text-xs text-gray-200 group-hover:text-white transition">
                    {L('Consigue el método LRDF aquí', 'Get the LRDF method here')}
                  </span>
                </div>
                <span className="text-sm shrink-0 group-hover:scale-110 group-hover:-translate-x-0.5 transition-transform">
                  👈
                </span>
              </a>

              <div className="flex items-center justify-between text-[12px] text-gray-400 pt-1 border-t border-white/[0.04] font-sans">
                <span className="flex items-center gap-1.5">
                  <strong className="text-[#FF5533] font-serif text-sm">&gt;</strong>
                  <span>{L('Acento de Palma', 'Clap accent')}</span>
                </span>
                <span className="text-[12px] text-gray-400">
                  {L('Toca cualquier compás para escucharlo', 'Tap any bar to hear it')}
                </span>
              </div>
              {/* Sección limpia de palos que se acompañan con tipografía Inter moderna */}
              <div className="py-0.5">
                <span className="font-sans text-[11px] uppercase tracking-wider text-gray-400 font-semibold block mb-1">
                  {L('Palos que se acompañan', 'Palos (flamenco styles) it accompanies')}
                </span>
                <p className="font-sans text-sm text-gray-200 font-medium leading-relaxed">
                  {rhythmPalos(currentRhythm, lang)}
                </p>
              </div>

            </div>
          )}
        </div>
      </main>

      {/* 3. DOCK INFERIOR: METRÓNOMO Y ACCESOS A COMUNIDAD / EXPLICACIONES DE FLAMENCO */}
      <footer className="fixed bottom-0 inset-x-0 dock-glass z-30">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col gap-2">
          {/* Fila 1: Metrónomo Centrado (Menos - a la izquierda, Play y BPM al centro, Más + a la derecha) */}
          <div data-tour="metronomo" className="flex items-center justify-between sm:justify-center sm:gap-6 w-full max-w-lg mx-auto">
            {/* Botones de disminución (Menos -) a la izquierda */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => adjustBpm(-5)}
                className="w-8.5 sm:w-9 h-9 rounded-full btn-3d text-gray-200 hover:text-white font-sans font-bold text-xs cursor-pointer flex items-center justify-center"
                title={L('Restar 5 BPM', '5 BPM slower')}
              >
                -5
              </button>
              <button
                onClick={() => adjustBpm(-1)}
                className="w-8.5 sm:w-9 h-9 rounded-full btn-3d text-gray-200 hover:text-white font-sans font-bold text-xs cursor-pointer flex items-center justify-center"
                title={L('Restar 1 BPM', '1 BPM slower')}
              >
                -1
              </button>
            </div>

            {/* Centro: Botón Play / Stop + Indicador BPM + Tap Tempo */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
              {/* Botón Play / Stop circular destacado */}
              <button
                onClick={togglePlay}
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full orb-active flex items-center justify-center hover:brightness-110 active:scale-95 transition shrink-0 cursor-pointer"
                title={isPlaying ? L('Pausar (Espacio)', 'Pause (Space)') : L('Reproducir (Espacio)', 'Play (Space)')}
              >
                {isPlaying ? (
                  <Square className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5 fill-white" />
                )}
              </button>

              {/* Indicador BPM numérico */}
              <div className="flex flex-col items-center justify-center min-w-[62px] text-center">
                <div className="flex items-baseline gap-1">
                  <span className="font-sans text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tight leading-none">
                    {bpm}
                  </span>
                  <span className="font-sans text-[11px] tracking-wider uppercase text-gray-400 font-semibold">
                    BPM
                  </span>
                </div>
              </div>

              {/* Botón Tap Tempo */}
              <button
                onClick={handleTapTempo}
                className="px-2.5 sm:px-3 h-8.5 rounded-full btn-3d text-white text-[10.5px] sm:text-xs font-sans font-bold tracking-wider uppercase cursor-pointer"
                title={L('Marcar pulso al ritmo deseado (Tap Tempo)', 'Tap the pulse you want (Tap Tempo)')}
              >
                Tap
              </button>
            </div>

            {/* Botones de aumento (Más +) a la derecha */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => adjustBpm(1)}
                className="w-8.5 sm:w-9 h-9 rounded-full btn-3d text-gray-200 hover:text-white font-sans font-bold text-xs cursor-pointer flex items-center justify-center"
                title={L('Sumar 1 BPM', '1 BPM faster')}
              >
                +1
              </button>
              <button
                onClick={() => adjustBpm(5)}
                className="w-8.5 sm:w-9 h-9 rounded-full btn-3d text-gray-200 hover:text-white font-sans font-bold text-xs cursor-pointer flex items-center justify-center"
                title={L('Sumar 5 BPM', '5 BPM faster')}
              >
                +5
              </button>
            </div>
          </div>

          {/* Fila 2: Accesos directos inferiores (Comunidad y Vocabulario) */}
          <div data-tour="comunidad" className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/[0.06]">
            <button
              onClick={() => setIsCommunityModalOpen(true)}
              className="py-1.5 sm:py-2 px-3 rounded-2xl btn-3d text-gray-200 hover:text-white flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-xs font-sans font-medium"
            >
              <span className="text-sm">🤝</span>
              <span className="truncate">{L('Comunidad', 'Community')}</span>
            </button>

            <button
              onClick={() => setIsTheoryModalOpen(true)}
              className="py-1.5 sm:py-2 px-3 rounded-2xl btn-3d text-gray-200 hover:text-white flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-xs font-sans font-medium"
            >
              <span className="text-sm">📖</span>
              <span className="truncate">{L('Vocabulario', 'Vocabulary')}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <TrainerModal
        isOpen={isTrainerOpen}
        onClose={() => setIsTrainerOpen(false)}
        config={trainerConfig}
        onChange={setTrainerConfig}
      />

      <CommunityModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
        isPro={isPro}
        onActivateProCode={handleActivateProCode}
        onStartTour={startTour}
        onOpenFeedback={() => {
          setIsCommunityModalOpen(false);
          setIsFeedbackOpen(true);
        }}
      />

      <VocabularioModal
        isOpen={isTheoryModalOpen}
        onClose={() => setIsTheoryModalOpen(false)}
      />

      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        onSuccess={handleRegistrationSuccess}
        onOpenProModal={() => {
          setIsRegistrationModalOpen(false);
          setIsProModalOpen(true);
        }}
      />

      <ProUnlockModal
        isOpen={isProModalOpen}
        notice={proModalNotice}
        onClose={() => {
          setIsProModalOpen(false);
          setProModalNotice(null);
        }}
        onActivate={handleActivateProCode}
        onSuccess={() => {
          setIsProModalOpen(false);
          setProModalNotice(null);
        }}
      />

      <VideoPlayerModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        rhythm={currentRhythm}
      />

      <EditNameModal
        isOpen={isEditNameOpen}
        profile={userProfile}
        onClose={() => setIsEditNameOpen(false)}
        onSave={handleProfileEdit}
      />

      {showInstallWelcome && <InstallWelcome purchase={purchaseArrivalRef.current} activated={isPro} onClose={() => setShowInstallWelcome(false)} />}

      {/* AVISO DE PRIVACIDAD (una vez, para quien se registró antes de existir las casillas) */}
      {!showSplash && isRegistered && !consentOk && <ConsentGateModal onAccept={handleConsentGateAccept} />}

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        name={userProfile?.name || username}
        email={userProfile?.contact || ''}
        rhythm={currentRhythm.id}
      />

      {/* MINI RECORRIDO POR LA APP */}
      {isTourOpen && !showSplash && !isAtrilMode && <AppTour steps={tourSteps} onFinish={finishTour} />}

      {/* PANTALLA DE INICIO Y CARGA (SPLASH SCREEN) */}
      {showSplash && (
        <SplashScreen
          onFinish={() => setShowSplash(false)}
          onUserEnter={handleUserEnterFromSplash}
          audioReady={audioReady}
          onProfileSave={handleProfileSave}
        />
      )}

      {/* CUENTA REGRESIVA 3, 2, 1 EN EL CENTRO DE LA PANTALLA GRANDE (MODO ESTÁNDAR) */}
      {!isAtrilMode && countInText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[4px] pointer-events-none transition-all duration-150 select-none">
          <div className="flex flex-col items-center justify-center text-center">
            {/* Número grande en color blanco con animación pop */}
            <div
              key={countInText}
              className="font-sans font-black text-white text-[130px] sm:text-[180px] md:text-[220px] leading-none tracking-tighter drop-shadow-[0_12px_45px_rgba(0,0,0,0.95)] animate-countdown-pop tabular-nums"
            >
              {countInText}
            </div>

            <div className="mt-2 sm:mt-4 flex flex-col items-center gap-2">
              <span className="font-sans text-xs sm:text-sm font-bold tracking-[0.35em] uppercase text-white/80 drop-shadow-sm">
                {L('Cuenta Regresiva', 'Count-in')}
              </span>
              <div className="flex items-center gap-2.5 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                    countInText === '3'
                      ? 'bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                      : 'bg-white/30'
                  }`}
                />
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                    countInText === '2'
                      ? 'bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                      : 'bg-white/30'
                  }`}
                />
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                    countInText === '1'
                      ? 'bg-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                      : 'bg-white/30'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODO ESPEJO / ATRIL A DISTANCIA (PANTALLA GIGANTE HORIZONTAL) */}
      {isAtrilMode && !showSplash && (
        <AtrilLandscapeMode
          rhythm={currentRhythm}
          bpm={bpm}
          isPlaying={isPlaying}
          activeStep={activeStep}
          cycleCount={cycleCount}
          countMode={countMode}
          countInText={countInText}
          isWakeLockActive={isWakeLockActive}
          onTogglePlay={togglePlay}
          onAdjustBpm={adjustBpm}
          onUpdateBpm={updateBpm}
          onTapTempo={handleTapTempo}
          onPrevRhythm={handlePrevRhythm}
          onNextRhythm={handleNextRhythm}
          onExit={() => setIsAtrilMode(false)}
          onPreviewBeat={handlePreviewBeatGroup}
        />
      )}
    </div>
  );
}
