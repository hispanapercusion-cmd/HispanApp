import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PALMAS_METHOD } from './data/rhythms';
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
import { CountMode, PalmaTone, TrainerConfig, ViewMode, UserProfile } from './types';
import { APP_CONFIG } from './config';
import { verifyProCode, ProCheckResult } from './services/pro';
import { Play, Square, Lock, CheckCircle2, Maximize2, User } from 'lucide-react';
import { saveLeadToFirestore } from './services/firebase';

export default function App() {
  const [rhythmIndex, setRhythmIndex] = useState<number>(0);
  const [bpm, setBpmState] = useState<number>(115);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [countMode, setCountMode] = useState<CountMode>('phonetic');
  const [palmaTone, setPalmaToneState] = useState<PalmaTone>('secas');

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
  const [countInEnabled, setCountInEnabled] = useState<boolean>(true);
  const [countInText, setCountInText] = useState<string | null>(null);

  // Screen Wake Lock API state & ref
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  // Pantalla de Inicio y Carga (Splash Screen) + Perfil de Usuario Inteligente
  const [showSplash, setShowSplash] = useState<boolean>(true);
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
          setProModalNotice('El código del enlace no es válido. Escríbelo a mano o escríbenos por WhatsApp.');
          setIsProModalOpen(true);
        }
      });
    } else if (!localStorage.getItem('hispanapp_pro')) {
      setProModalNotice('¡Gracias por tu compra! Pega aquí la clave de licencia que te llegó por email.');
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

    engine.setCallbacks(
      (step, cycle) => {
        setActiveStep(step);
        setCycleCount(cycle);
        setCountInText(null);
      },
      (newCycle) => {
        setCycleCount(newCycle);
        const cfg = trainerConfigRef.current;
        if (cfg.enabled && newCycle > 1 && (newCycle - 1) % cfg.everyCycles === 0) {
          setBpmState((prevBpm) => {
            const nextBpm = Math.min(cfg.maxBpm, prevBpm + cfg.stepBpm);
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

  // Screen Wake Lock API handlers
  const requestWakeLock = async () => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (!wakeLockRef.current || wakeLockRef.current.released) {
        const lock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = lock;
        setIsWakeLockActive(true);
        lock.addEventListener('release', () => {
          setIsWakeLockActive(false);
        });
      }
    } catch {
      // Graceful silent fallback for browsers that block or lack Wake Lock
      setIsWakeLockActive(false);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // silent
      }
      wakeLockRef.current = null;
      setIsWakeLockActive(false);
    }
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
      releaseWakeLock();
    };
  }, [isPlaying, isAtrilMode]);

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
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
      engineRef.current.setCountInEnabled(countInEnabled);
      engineRef.current.start(countInEnabled);
      setIsPlaying(true);
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
  const handlePreviewBeatGroup = (startStep: number, length: number) => {
    engineRef.current?.previewBeatGroup(startStep, length);
    setActiveStep(startStep);
    if (length > 1) {
      const stepDurMs = (60000 / bpm) / (currentRhythm.stepsPerBeat || 2);
      for (let i = 1; i < length; i++) {
        setTimeout(() => {
          setActiveStep(startStep + i);
        }, i * stepDurMs);
      }
    }
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
    <div className="min-h-screen bg-[#0B0D12] text-white flex flex-col justify-between selection:bg-[#E84A27] selection:text-white pb-32 sm:pb-28">
      {/* Toast flotante de bienvenida PRO */}
      {showWelcomeProToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#1C1E2C] border border-emerald-500/60 shadow-[0_8px_30px_rgba(16,185,129,0.35)] rounded-2xl px-4 py-2.5 flex items-center gap-2.5 text-white text-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">¡Acceso PRO de Hispana Percusión activado!</span>
        </div>
      )}

      {/* HEADER COMPACTO Y MINIMALISTA */}
      <header className="border-b border-white/[0.06] bg-[#0B0D12]/85 backdrop-blur-2xl sticky top-0 z-30 shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="select-none" title="Hispana Percusión">
              <HispanaLogo size="md" />
            </div>

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

          <div className="flex items-center gap-2 shrink-0">
            {/* Botón Perfil: ver y cambiar nombre, email, rol y nivel */}
            <button
              onClick={() => setIsEditNameOpen(true)}
              className="h-8.5 max-w-[9rem] flex items-center gap-1.5 px-3 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.15] text-gray-200 hover:text-white text-xs font-medium tracking-wide transition shadow-sm active:scale-95 cursor-pointer select-none"
              title="Tu perfil"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline truncate">{username || 'Perfil'}</span>
            </button>

            {/* Botón Modo Atril (pantalla grande, útil para proyectar en clase) */}
            <button
              onClick={() => setIsAtrilMode(true)}
              className="h-8.5 flex items-center gap-1.5 px-3 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.15] text-gray-200 hover:text-white text-xs font-medium tracking-wide transition shadow-sm active:scale-95 cursor-pointer select-none"
              title="Modo Atril: pantalla grande para tocar a distancia"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Atril</span>
            </button>

            {/* Botón Entrenador Progresivo */}
            <button
              onClick={handleOpenTrainer}
              className={`h-8.5 flex items-center gap-1.5 px-3 rounded-full border text-xs font-medium tracking-wide transition shadow-sm active:scale-95 cursor-pointer select-none ${
                trainerConfig.enabled
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                  : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.15] text-gray-200 hover:text-white'
              }`}
              title={isPro ? 'Entrenador Progresivo de Velocidad' : 'Entrenador Progresivo (Función Alumno PRO)'}
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
        <section className="bg-[#141821] rounded-2xl border border-white/[0.06] p-3.5 shadow-xl space-y-3">
          {/* Botones rápidos I al VIII */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            <span className="font-sans text-[10px] tracking-wider uppercase text-gray-400 mr-1.5 shrink-0 hidden sm:inline font-semibold">
              Ritmos:
            </span>
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
              {PALMAS_METHOD.map((r, idx) => {
                const active = idx === rhythmIndex;
                const locked = !isRhythmUnlocked(idx);
                return (
                  <button
                    key={r.id}
                    onClick={() => handleRhythmSelect(idx)}
                    className={`px-3 py-1.5 rounded-xl font-serif text-xs font-bold border transition shrink-0 cursor-pointer flex items-center gap-1 ${
                      active
                        ? 'bg-[#E84A27] text-white border-[#E84A27] shadow-[0_0_12px_rgba(232,74,39,0.35)]'
                        : 'bg-black/35 text-gray-400 border-white/[0.04] hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span>{r.roman}</span>
                    {locked && <Lock className="w-2.5 h-2.5 text-gray-500" />}
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
                className="w-full bg-black/35 border border-white/[0.06] rounded-xl px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-[#E84A27]/60 cursor-pointer"
              >
                {PALMAS_METHOD.map((r, idx) => (
                  <option key={r.id} value={idx} className="bg-[#141821] text-white">
                    {!isRhythmUnlocked(idx) ? '🔒 ' : ''}{r.shortTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
              {/* Botón Toggle Cuenta Previa (Activo por defecto) */}
              <button
                onClick={() => {
                  const nextVal = !countInEnabled;
                  setCountInEnabled(nextVal);
                  engineRef.current?.setCountInEnabled(nextVal);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium border transition flex items-center gap-1.5 cursor-pointer ${
                  countInEnabled
                    ? 'bg-white/[0.12] text-white border-white/[0.15] shadow-sm'
                    : 'bg-black/35 text-gray-400 border-white/[0.04] hover:text-white'
                }`}
                title="Cuenta regresiva sincronizada con click antes de iniciar el compás"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${countInEnabled ? 'bg-[#E84A27]' : 'bg-gray-500'}`} />
                <span>🗣️ Cuenta</span>
              </button>

              {/* Selector Cuenta 2 vs 12 (para ritmos de 12 tiempos) */}
              {currentRhythm.has12CountToggle && (
                <div className="flex items-center gap-1 bg-black/35 p-1 rounded-xl border border-white/[0.06]">
                  <span className="text-[11px] text-gray-400 px-1.5">Cuenta:</span>
                  <button
                    onClick={() => setCountMode('phonetic')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-sans transition cursor-pointer ${
                      countMode === 'phonetic'
                        ? 'bg-white/[0.12] text-white shadow-sm font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    2, 1, 2
                  </button>
                  <button
                    onClick={() => setCountMode('traditional')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-sans transition cursor-pointer ${
                      countMode === 'traditional'
                        ? 'bg-white/[0.12] text-white shadow-sm font-semibold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    12, 1, 2
                  </button>
                </div>
              )}

              {/* Selector Timbre de Palmas */}
              <div className="flex items-center gap-1 bg-black/35 p-1 rounded-xl border border-white/[0.06]">
                <span className="text-[11px] text-gray-400 px-1.5">Palmas:</span>
                <button
                  onClick={() => handleToneChange('secas')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-sans transition cursor-pointer ${
                    palmaTone === 'secas'
                      ? 'bg-white/[0.12] text-white shadow-sm font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Brillantes
                </button>
                <button
                  onClick={() => handleToneChange('sordas')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-sans transition cursor-pointer ${
                    palmaTone === 'sordas'
                      ? 'bg-white/[0.12] text-white shadow-sm font-semibold'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sordas
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Selector de Vista (Ambos / Partitura / Reloj) */}
        <div className="flex bg-black/35 p-1 rounded-2xl border border-white/[0.06] text-xs">
          <button
            onClick={() => setViewMode('split')}
            className={`flex-1 py-1.5 rounded-xl font-sans transition cursor-pointer ${
              viewMode === 'split' ? 'bg-white/[0.12] text-white shadow-sm font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Ambos
          </button>
          <button
            onClick={() => setViewMode('staff')}
            className={`flex-1 py-1.5 rounded-xl font-sans transition cursor-pointer ${
              viewMode === 'staff' ? 'bg-white/[0.12] text-white shadow-sm font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Partitura
          </button>
          <button
            onClick={() => setViewMode('clock')}
            className={`flex-1 py-1.5 rounded-xl font-sans transition cursor-pointer ${
              viewMode === 'clock' ? 'bg-white/[0.12] text-white shadow-sm font-semibold' : 'text-gray-400 hover:text-white'
            }`}
          >
            Reloj
          </button>
        </div>

        {/* 2. VISUALIZADOR: PARTITURA CON PALOS + RELOJ DE COMPÁS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* A. PARTITURA MONOGRAMA */}
          {(viewMode === 'split' || viewMode === 'staff') && (
            <div
              className={`${
                viewMode === 'staff' ? 'lg:col-span-12' : 'lg:col-span-7'
              } bg-[#141821] rounded-2xl border border-white/[0.06] p-4 sm:p-5 shadow-xl space-y-3.5 overflow-hidden`}
            >
              {/* Encabezado limpio con título del ritmo en blanco, botón de Video PRO y badge de compás */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-serif text-xs sm:text-sm font-bold text-[#E84A27] px-2 py-0.5 rounded-lg bg-[#E84A27]/10">
                    {currentRhythm.roman}
                  </span>
                  <h2 className="font-sans text-sm sm:text-base font-semibold text-white tracking-tight truncate">
                    {currentRhythm.shortTitle.replace(/^Ritmo\s+[IVXLCDM]+\s*[—–-]\s*/, '')}
                  </h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Botón destacado ▶ Video (Exclusivo Alumnos PRO) */}
                  <button
                    onClick={handleOpenVideo}
                    className={`px-3 py-1 rounded-full text-xs font-sans font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm ${
                      isPro
                        ? 'bg-[#E84A27] hover:bg-[#FF5533] text-white shadow-[0_0_10px_rgba(232,74,39,0.35)]'
                        : 'bg-white/[0.08] hover:bg-white/[0.14] text-amber-300 border border-amber-400/30'
                    }`}
                    title={isPro ? 'Ver video demostrativo PRO' : 'Video exclusivo Alumnos PRO'}
                  >
                    <span>▶ Video</span>
                    {!isPro && <Lock className="w-3 h-3 text-amber-300" />}
                  </button>
                </div>
              </div>

              {/* Sección limpia de palos que se acompañan con tipografía Inter moderna */}
              <div className="py-0.5">
                <span className="font-sans text-[10px] uppercase tracking-wider text-gray-400 font-semibold block mb-1">
                  Palos que se acompañan
                </span>
                <p className="font-sans text-xs sm:text-sm text-gray-200 font-medium leading-relaxed">
                  {currentRhythm.palos}
                </p>
              </div>

              {/* Lienzo Oscuro con el Monograma Exacto del Libro en una sola tira horizontal continua */}
              <MonogramScore
                rhythm={currentRhythm}
                activeStep={activeStep}
                countMode={countMode}
                onPreviewBeat={handlePreviewBeatGroup}
              />

              {/* Banner Clicable hacia el Método en Hotmart */}
              <a
                href={APP_CONFIG.hotmartPackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#1C1E2C]/80 hover:bg-[#1C1E2C] border border-[#E84A27]/30 hover:border-[#E84A27]/70 text-xs text-gray-200 hover:text-white transition shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0">📘</span>
                  <span className="font-sans font-semibold text-xs text-gray-200 group-hover:text-white transition">
                    Consigue el método LRDF aquí
                  </span>
                </div>
                <span className="text-sm shrink-0 group-hover:scale-110 group-hover:-translate-x-0.5 transition-transform">
                  👈
                </span>
              </a>

              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-white/[0.04] font-sans">
                <span className="flex items-center gap-1.5">
                  <strong className="text-[#FF5533] font-serif text-sm">&gt;</strong>
                  <span>Acento de Palma</span>
                </span>
                <span className="text-[11px] text-gray-400">
                  Toca cualquier compás para escucharlo
                </span>
              </div>
            </div>
          )}

          {/* B. RELOJ DE COMPÁS */}
          {(viewMode === 'split' || viewMode === 'clock') && (
            <div
              className={`${
                viewMode === 'clock' ? 'lg:col-span-12' : 'lg:col-span-5'
              } bg-[#141821] rounded-2xl border border-white/[0.06] p-4 sm:p-5 shadow-xl flex flex-col items-center space-y-3`}
            >
              <div className="w-full flex items-center justify-between">
                <span className="font-sans text-[10px] tracking-wider uppercase text-gray-400 font-semibold">
                  Ciclo de Compás
                </span>
                <span className="text-xs font-sans text-gray-300 font-medium px-2 py-0.5 rounded-full bg-white/[0.05]">
                  Vuelta: <span className="text-white font-semibold tabular-nums">{cycleCount}</span>
                </span>
              </div>

              <FlamencoClock
                rhythm={currentRhythm}
                activeStep={activeStep}
                countMode={countMode}
                countInText={countInText}
                onBeatClick={(b) => handlePreviewBeatGroup(b * currentRhythm.stepsPerBeat, currentRhythm.stepsPerBeat)}
              />

              <div className="w-full flex items-center justify-center gap-6 pt-2 border-t border-white/[0.04] text-[11px] text-gray-400 font-sans">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E84A27] inline-block shadow-[0_0_6px_rgba(232,74,39,0.5)]" /> Acento (&gt;)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/30 inline-block" /> Pulso
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. DOCK INFERIOR: METRÓNOMO Y ACCESOS A COMUNIDAD / EXPLICACIONES DE FLAMENCO */}
      <footer className="fixed bottom-0 inset-x-0 bg-[#0E1017]/92 backdrop-blur-2xl border-t border-white/[0.08] z-30 shadow-[0_-6px_28px_rgba(0,0,0,0.7)]">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex flex-col gap-2">
          {/* Fila 1: Metrónomo Centrado (Menos - a la izquierda, Play y BPM al centro, Más + a la derecha) */}
          <div className="flex items-center justify-between sm:justify-center sm:gap-6 w-full max-w-lg mx-auto">
            {/* Botones de disminución (Menos -) a la izquierda */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => adjustBpm(-5)}
                className="w-8.5 sm:w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] active:scale-95 text-gray-200 hover:text-white font-sans font-bold text-xs border border-white/[0.06] transition shadow-sm cursor-pointer flex items-center justify-center"
                title="Restar 5 BPM"
              >
                -5
              </button>
              <button
                onClick={() => adjustBpm(-1)}
                className="w-8.5 sm:w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] active:scale-95 text-gray-200 hover:text-white font-sans font-bold text-xs border border-white/[0.06] transition shadow-sm cursor-pointer flex items-center justify-center"
                title="Restar 1 BPM"
              >
                -1
              </button>
            </div>

            {/* Centro: Botón Play / Stop + Indicador BPM + Tap Tempo */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
              {/* Botón Play / Stop circular destacado */}
              <button
                onClick={togglePlay}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#E84A27] text-white flex items-center justify-center shadow-[0_0_20px_rgba(232,74,39,0.4)] hover:brightness-110 active:scale-95 transition shrink-0 cursor-pointer"
                title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
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
                  <span className="font-sans text-[10px] tracking-wider uppercase text-gray-400 font-semibold">
                    BPM
                  </span>
                </div>
                <span className="text-[9.5px] font-sans text-gray-400 block leading-tight mt-0.5">
                  {currentRhythm.bpmRange.min}–{currentRhythm.bpmRange.max}
                </span>
              </div>

              {/* Botón Tap Tempo */}
              <button
                onClick={handleTapTempo}
                className="px-2.5 sm:px-3 h-8.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] active:scale-95 text-white text-[10.5px] sm:text-xs font-sans font-bold tracking-wider uppercase transition shadow-sm border border-white/[0.06] cursor-pointer"
                title="Marcar pulso al ritmo deseado (Tap Tempo)"
              >
                Tap
              </button>
            </div>

            {/* Botones de aumento (Más +) a la derecha */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => adjustBpm(1)}
                className="w-8.5 sm:w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] active:scale-95 text-gray-200 hover:text-white font-sans font-bold text-xs border border-white/[0.06] transition shadow-sm cursor-pointer flex items-center justify-center"
                title="Sumar 1 BPM"
              >
                +1
              </button>
              <button
                onClick={() => adjustBpm(5)}
                className="w-8.5 sm:w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] active:scale-95 text-gray-200 hover:text-white font-sans font-bold text-xs border border-white/[0.06] transition shadow-sm cursor-pointer flex items-center justify-center"
                title="Sumar 5 BPM"
              >
                +5
              </button>
            </div>
          </div>

          {/* Fila 2: Accesos directos inferiores (Comunidad y Vocabulario) */}
          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/[0.06]">
            <button
              onClick={() => setIsCommunityModalOpen(true)}
              className="py-1.5 sm:py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-98 border border-white/[0.06] hover:border-[#E84A27]/40 text-gray-200 hover:text-white transition shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-xs font-sans font-medium"
            >
              <span className="text-sm">🤝</span>
              <span className="truncate">Comunidad</span>
            </button>

            <button
              onClick={() => setIsTheoryModalOpen(true)}
              className="py-1.5 sm:py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-98 border border-white/[0.06] hover:border-[#E84A27]/40 text-gray-200 hover:text-white transition shadow-sm flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-xs font-sans font-medium"
            >
              <span className="text-sm">📖</span>
              <span className="truncate">Vocabulario</span>
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
                Cuenta Regresiva
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
