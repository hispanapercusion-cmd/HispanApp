import { AudioSourceMode, PalmaTone, RhythmDefinition } from '../types';
import { JORDAN_AGUDA_PCM, JORDAN_SORDA_PCM, SAMPLE_RATE } from './jordanSamplesPcm';

function createAudioBufferFromBase64Pcm(
  ctx: AudioContext,
  base64Pcm: string,
  sampleRate = 44100
): AudioBuffer {
  const binaryString = window.atob(base64Pcm);
  const len = binaryString.length;
  const numSamples = Math.floor(len / 2);
  const buffer = ctx.createBuffer(1, numSamples, sampleRate);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const byteIndex = i * 2;
    const low = binaryString.charCodeAt(byteIndex);
    const high = binaryString.charCodeAt(byteIndex + 1);
    let int16 = (high << 8) | low;
    if (int16 >= 32768) int16 -= 65536;
    channelData[i] = int16 / 32768.0;
  }
  return buffer;
}

interface ScheduledEvent {
  step: number; // >= 0 for pattern steps, <= -100 for count-in steps
  time: number;
}

export interface CountInBeat {
  num: string;
}

// Mapeo exacto 1-a-1 de los 14 golpes de la partitura de Ritmo I (compás de 12) a las 14 tomas del video de Jordan Migues
// Partitura Oficial Pt. 2 (Ebook I - Compás de 12):
// Compás 1: Tiempo 12 [negra], Tiempo 1 [silencio corchea + corchea], Tiempo 2 [negra]
// Compás 2: Tiempo 3 [negra], Tiempo 4 [negra], Tiempo 5 [negra]
// Compás 3: Tiempo 6 [negra], Tiempo 7 [dos corcheas], Tiempo 8 [negra]
// Compás 4: Tiempo 9 [dos corcheas], Tiempo 10 [negra], Tiempo 1 [negra de cierre]
const RITMO_I_STEP_TO_HIT_INDEX: Record<number, number> = {
  0: 0,   // Golpe 01 (t=0.99s) -> Tiempo 12 ('2' negra)
  3: 1,   // Golpe 02 (t=1.83s) -> Tiempo 1  ('1' corchea a contratiempo)
  4: 2,   // Golpe 03 (t=2.12s) -> Tiempo 2  ('2' negra)
  6: 3,   // Golpe 04 (t=2.67s) -> Tiempo 3  ('3' negra con acento)
  8: 4,   // Golpe 05 (t=3.20s) -> Tiempo 4  ('4' negra)
  10: 5,  // Golpe 06 (t=3.74s) -> Tiempo 5  ('5' negra)
  12: 6,  // Golpe 07 (t=4.29s) -> Tiempo 6  ('6' negra)
  14: 7,  // Golpe 08 (t=4.81s) -> Tiempo 7  ('7' primera corchea)
  15: 8,  // Golpe 09 (t=5.08s) -> Tiempo 7  ('y' segunda corchea)
  16: 9,  // Golpe 10 (t=5.36s) -> Tiempo 8  ('8' negra con acento)
  18: 10, // Golpe 11 (t=5.89s) -> Tiempo 9  ('9' primera corchea)
  19: 11, // Golpe 12 (t=6.16s) -> Tiempo 9  ('y' segunda corchea)
  20: 12, // Golpe 13 (t=6.43s) -> Tiempo 10 ('10' negra remate con acento)
  22: 13, // Golpe 14 (t=6.96s) -> Tiempo 1  ('1' negra remate y cierre)
};

// Mapeo exacto 1-a-1 de los 6 golpes de la partitura de Ritmo VII (Tientos/Farruca en 4/4) a las tomas del video oficial de Jordan Migues
// Partitura Oficial Pt. 2 (Ebook III - Ritmos en 4/4):
// Compás 1: Tiempo 1 [negra acentuada], Tiempo 2 [silencio corchea + corchea], Tiempo 3 [negra acentuada], Tiempo 4 [silencio de negra]
// Compás 2: Tiempo 1 [negra acentuada], Tiempo 2 [silencio corchea + corchea], Tiempo 3 [negra remate final acentuada], Tiempo 4 [silencio de negra]
const RITMO_VII_STEP_TO_HIT_INDEX: Record<number, number> = {
  0: 0,   // Golpe 01 (t=1.14s) -> Compás 1, Tiempo 1 (negra acentuada)
  3: 1,   // Golpe 02 (t=2.64s) -> Compás 1, Tiempo 2 a contratiempo (corchea)
  4: 2,   // Golpe 03 (t=3.17s) -> Compás 1, Tiempo 3 (negra acentuada)
  8: 3,   // Golpe 04 (t=5.64s) -> Compás 2, Tiempo 1 (negra acentuada)
  11: 4,  // Golpe 05 (t=6.14s) -> Compás 2, Tiempo 2 a contratiempo (corchea)
  12: 5,  // Golpe 06 (t=7.11s) -> Compás 2, Tiempo 3 (negra remate final acentuada)
};

export class FlamencoAudioEngine {
  private ctx: AudioContext | null = null;
  private timerId: number | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private bpm: number = 92;
  private rhythm: RhythmDefinition;
  private palmaTone: PalmaTone = 'secas';
  private audioSourceMode: AudioSourceMode = 'jordan';

  // Samples de audio real extraídos directamente de los videos oficiales de Jordan Migues:
  // - jordanAgudaBuffers: 14 muestras de Palma Aguda / Seca (Ritmo I Pt. 2)
  // - jordanSordaBuffers: 6 muestras de Palma Sorda acústica (Ritmo VII Pt. 2)
  private jordanAgudaBuffers: AudioBuffer[] = [];
  private jordanSordaBuffers: AudioBuffer[] = [];
  private isAgudaBuffersLoaded: boolean = false;
  private isSordaBuffersLoaded: boolean = false;
  private isLoadingBuffers: boolean = false;

  // Buffers de ruido pre-generados para síntesis de cero asignaciones de memoria (zero-GC)
  private cachedNoiseSecas: AudioBuffer[] = [];
  private cachedNoiseSordas: AudioBuffer[] = [];
  private cachedNoiseClicks: AudioBuffer[] = [];
  private isSyntheticNoiseReady: boolean = false;

  // Acceso retrocompatible
  private get jordanBuffers(): AudioBuffer[] {
    return this.palmaTone === 'sordas' && this.jordanSordaBuffers.length > 0
      ? this.jordanSordaBuffers
      : this.jordanAgudaBuffers;
  }

  private get isBuffersLoaded(): boolean {
    return this.isAgudaBuffersLoaded || this.isSordaBuffersLoaded;
  }

  // Count-in state (Cuenta previa con voz en español Web Speech API)
  private countInEnabled: boolean = true;
  private isCountingIn: boolean = false;
  private countInIndex: number = 0;
  private countInBeats: CountInBeat[] = [];
  private runId: number = 0;

  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  private cycleCount: number = 1;
  private visualQueue: ScheduledEvent[] = [];

  private onStepCallback?: (step: number, cycle: number) => void;
  private onCycleCallback?: (cycle: number) => void;
  private onCountInStepCallback?: (num: string, beatIndex: number, totalBeats: number) => void;
  private onSamplesLoadedCallback?: (loaded: boolean) => void;

  constructor(rhythm: RhythmDefinition, bpm: number = 92) {
    this.rhythm = rhythm;
    this.bpm = bpm;
    // Iniciar precarga de buffers de forma silenciosa
    this.preloadSamples();
  }

  // En iPhone, el audio web se silencia con el interruptor de silencio. Marcarlo como "reproducción"
  // (como una app de música) hace que suene igual. Solo existe en Safari reciente; en el resto no hace nada.
  private configureAudioSession() {
    try {
      const nav = navigator as unknown as { audioSession?: { type: string } };
      if (nav.audioSession && nav.audioSession.type !== 'playback') {
        nav.audioSession.type = 'playback';
      }
    } catch {
      // Ignorar
    }
  }

  public init() {
    this.configureAudioSession();
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass({ latencyHint: 'interactive' });
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.buildSyntheticNoiseBuffers();
    if (!this.isBuffersLoaded && !this.isLoadingBuffers) {
      this.loadJordanSamples();
    }
  }

  // Desbloqueo universal de audio para móviles (iOS Safari / Android Chrome)
  public unlockAudio() {
    this.configureAudioSession();
    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass({ latencyHint: 'interactive' });
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    try {
      const buf = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.ctx.destination);
      src.start(0);
    } catch {
      // Ignorar
    }
    this.buildSyntheticNoiseBuffers();
    if (!this.isBuffersLoaded && !this.isLoadingBuffers) {
      this.loadJordanSamples();
    }
  }

  // Precalcula y almacena en memoria los buffers de ruido para síntesis instantánea sin sobrecarga de Garbage Collection
  private buildSyntheticNoiseBuffers() {
    if (this.isSyntheticNoiseReady || !this.ctx) return;
    const sampleRate = this.ctx.sampleRate || 44100;

    // 4 variaciones orgánicas para Palma Seca
    this.cachedNoiseSecas = [];
    const secaDur = 0.068;
    const secaSize = Math.floor(sampleRate * secaDur);
    for (let v = 0; v < 4; v++) {
      const buf = this.ctx.createBuffer(1, secaSize, sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < secaSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.011));
      }
      this.cachedNoiseSecas.push(buf);
    }

    // 4 variaciones orgánicas para Palma Sorda
    this.cachedNoiseSordas = [];
    const sordaDur = 0.088;
    const sordaSize = Math.floor(sampleRate * sordaDur);
    for (let v = 0; v < 4; v++) {
      const buf = this.ctx.createBuffer(1, sordaSize, sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < sordaSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.019));
      }
      this.cachedNoiseSordas.push(buf);
    }

    // 2 variaciones para ataque transitorio de clicks
    this.cachedNoiseClicks = [];
    const clickDur = 0.016;
    const clickSize = Math.floor(sampleRate * clickDur);
    for (let v = 0; v < 2; v++) {
      const buf = this.ctx.createBuffer(1, clickSize, sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < clickSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.0022));
      }
      this.cachedNoiseClicks.push(buf);
    }

    this.isSyntheticNoiseReady = true;
  }

  private async preloadSamples() {
    if (typeof window === 'undefined') return;
    try {
      this.init();
    } catch {
      // Ignorar hasta interacción de usuario
    }
  }

  // Carga inmediata y 100% síncrona de muestras reales de Jordan Migues desde PCM base64 (cero dependencias de red ni fallos de decodeAudioData)
  public loadJordanSamples() {
    if (this.isBuffersLoaded) return;

    try {
      if (!this.ctx) {
        const AudioCtxClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtxClass({ latencyHint: 'interactive' });
      }

      this.jordanAgudaBuffers = JORDAN_AGUDA_PCM.map((pcm) =>
        createAudioBufferFromBase64Pcm(this.ctx!, pcm, SAMPLE_RATE)
      );
      this.jordanSordaBuffers = JORDAN_SORDA_PCM.map((pcm) =>
        createAudioBufferFromBase64Pcm(this.ctx!, pcm, SAMPLE_RATE)
      );

      this.isAgudaBuffersLoaded = this.jordanAgudaBuffers.length > 0;
      this.isSordaBuffersLoaded = this.jordanSordaBuffers.length > 0;

      if (this.isBuffersLoaded) {
        this.onSamplesLoadedCallback?.(true);
      }
    } catch (err) {
      console.warn('Error loading PCM audio samples:', err);
    }
  }

  public setRhythm(rhythm: RhythmDefinition) {
    this.rhythm = rhythm;
    this.currentStep = 0;
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(35, Math.min(250, bpm));
  }

  public getBpm(): number {
    return this.bpm;
  }

  public setCountInEnabled(enabled: boolean) {
    this.countInEnabled = enabled;
  }

  public setPalmaTone(tone: PalmaTone) {
    this.palmaTone = tone;
  }

  public setAudioSourceMode(mode: AudioSourceMode) {
    this.audioSourceMode = mode;
  }

  public getAudioSourceMode(): AudioSourceMode {
    return this.audioSourceMode;
  }

  public areSamplesReady(): boolean {
    return this.isBuffersLoaded && this.jordanBuffers.length > 0;
  }

  public setCallbacks(
    onStep: (step: number, cycle: number) => void,
    onCycle: (cycle: number) => void,
    onCountInStep?: (num: string, beatIndex: number, totalBeats: number) => void,
    onSamplesLoaded?: (loaded: boolean) => void
  ) {
    this.onStepCallback = onStep;
    this.onCycleCallback = onCycle;
    this.onCountInStepCallback = onCountInStep;
    this.onSamplesLoadedCallback = onSamplesLoaded;
  }

  // Cuenta regresiva universal de 3 pulsos para todos los ritmos: 3, 2, 1
  private getRhythmCountInBeats(): CountInBeat[] {
    return [
      { num: '3' },
      { num: '2' },
      { num: '1' },
    ];
  }

  public start(withCountIn: boolean = true) {
    this.init();
    if (this.isRunning) return;

    this.runId++;
    this.isRunning = true;
    this.cycleCount = 1;
    this.currentStep = 0;
    this.visualQueue = [];
    this.nextNoteTime = (this.ctx?.currentTime || 0) + 0.05;

    // Check count-in
    if (withCountIn && this.countInEnabled) {
      this.isCountingIn = true;
      this.countInIndex = 0;
      this.countInBeats = this.getRhythmCountInBeats();
    } else {
      this.isCountingIn = false;
      this.countInIndex = 0;
      this.countInBeats = [];
    }

    this.timerId = window.setInterval(() => this.schedulerTick(), 25);
    this.animFrameId = requestAnimationFrame(() => this.renderLoop());

    this.onCycleCallback?.(this.cycleCount);
  }

  public stop() {
    this.runId++;
    this.isRunning = false;
    this.isCountingIn = false;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Silencioso
      }
    }

    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.visualQueue = [];
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }

  public getIsCountingIn(): boolean {
    return this.isCountingIn;
  }

  private getStepDurationSeconds(): number {
    const beatSeconds = 60.0 / this.bpm;
    return beatSeconds / this.rhythm.stepsPerBeat;
  }

  private schedulerTick() {
    if (!this.ctx || !this.isRunning) return;

    const countInBeatDuration = 60.0 / this.bpm;
    const totalSteps = this.rhythm.steps.length;

    // Si la pestaña estuvo en segundo plano, el navegador frena el temporizador y quedan notas atrasadas.
    // En vez de tocarlas todas de golpe, se saltan en silencio para retomar el compás en su sitio.
    while (!this.isCountingIn && this.nextNoteTime < this.ctx.currentTime - 0.05) {
      this.nextNoteTime += this.getStepDurationSeconds();
      this.currentStep++;
      if (this.currentStep >= totalSteps) {
        this.currentStep = 0;
        this.cycleCount++;
        this.onCycleCallback?.(this.cycleCount);
      }
    }

    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      if (this.isCountingIn) {
        // Schedule Count-In beat
        const currentIdx = this.countInIndex;
        const time = this.nextNoteTime;
        this.scheduleCountInAudio(currentIdx, time);

        this.visualQueue.push({ step: -100 - currentIdx, time });
        this.nextNoteTime += countInBeatDuration;
        this.countInIndex++;

        if (this.countInIndex >= this.countInBeats.length) {
          // Transition to main pattern seamlessly on the very next beat
          this.isCountingIn = false;
          this.currentStep = 0;
        }
      } else {
        // Schedule pattern step
        this.scheduleStepAudio(this.currentStep, this.nextNoteTime);
        this.visualQueue.push({ step: this.currentStep, time: this.nextNoteTime });

        this.nextNoteTime += this.getStepDurationSeconds();
        this.currentStep++;

        if (this.currentStep >= totalSteps) {
          this.currentStep = 0;
          this.cycleCount++;
          this.onCycleCallback?.(this.cycleCount);
        }
      }
    }
  }

  private scheduleCountInAudio(countIndex: number, time: number) {
    if (!this.ctx) return;
    const isLastCount = countIndex === this.countInBeats.length - 1; // true on final count-in pulse

    // Sonido de click limpio y definido en cada pulso de la cuenta
    this.synthesizeClick(time, isLastCount);
  }

  // Click percusivo de metrónomo nítido y profesional (optimizado sin re-alocación de memoria)
  public synthesizeClick(time: number, isAccent: boolean = false) {
    if (!this.ctx) return;

    // Resonador percusivo tipo woodblock de metrónomo acústico (toque seco de madera sin pitido electrónico)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 880, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + 0.015);

    gain.gain.setValueAtTime(isAccent ? 0.45 : 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.018);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.02);

    // Ataque transitorio acústico (usando buffer de ruido precalculado para 0-GC)
    const dur = 0.016;
    let buffer: AudioBuffer | null = null;
    if (this.cachedNoiseClicks.length > 0) {
      buffer = this.cachedNoiseClicks[Math.floor(Math.random() * this.cachedNoiseClicks.length)];
    } else {
      const bufferSize = Math.floor(this.ctx.sampleRate * dur);
      buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.0022));
      }
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(isAccent ? 2400 : 1700, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(isAccent ? 0.65 : 0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(time);
    noise.stop(time + dur + 0.005);
  }

  // Reproduce una muestra de audio real de Jordan Migues (sin filtros artificiales para preservar el timbre acústico real)
  private playJordanSample(buffer: AudioBuffer, time: number, isAccent: boolean) {
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.ctx.createGain();
    const volume = isAccent ? 1.05 : 0.95;
    const scheduleTime = Math.max(time, this.ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, scheduleTime);

    source.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    source.start(scheduleTime);
  }

  private scheduleStepAudio(stepIdx: number, time: number) {
    if (!this.ctx) return;
    const hit = this.rhythm.steps[stepIdx];
    if (hit === 'R') return;

    const isAccent = hit === 'A';

    // Siempre priorizar las muestras acústicas reales de Jordan Migues
    if (this.audioSourceMode === 'jordan' && (this.jordanAgudaBuffers.length > 0 || this.jordanSordaBuffers.length > 0)) {
      const isSorda = this.palmaTone === 'sordas';

      // --- MODO PALMA SORDA (Grabación real acústica de Jordan Migues de Ritmo VII) ---
      if (isSorda && this.jordanSordaBuffers.length > 0) {
        // En Ritmo VII (Tientos/Farruca en 4/4), mapeo exacto 1-a-1 idéntico a la partitura y video
        if (this.rhythm.id === 'r7') {
          const hitIdx = RITMO_VII_STEP_TO_HIT_INDEX[stepIdx];
          if (hitIdx !== undefined && this.jordanSordaBuffers[hitIdx]) {
            const isCompasAccent = hitIdx === 0 || hitIdx === 2 || hitIdx === 3 || hitIdx === 5;
            this.playJordanSample(this.jordanSordaBuffers[hitIdx], time, isAccent || isCompasAccent);
            return;
          }
        }

        // Para acentos sordos en cualquier compás, usamos los golpes acentuados reales (1, 3, 6)
        if (isAccent) {
          const accentIndices = [0, 2, 5];
          const chosen = accentIndices[Math.floor(Math.random() * accentIndices.length)];
          if (this.jordanSordaBuffers[chosen]) {
            this.playJordanSample(this.jordanSordaBuffers[chosen], time, true);
            return;
          }
        }

        // Para golpes sordos regulares, variaciones humanas naturales (golpes 2, 4, 5)
        const normalIndices = [1, 3, 4];
        const chosen = normalIndices[Math.floor(Math.random() * normalIndices.length)];
        if (this.jordanSordaBuffers[chosen]) {
          this.playJordanSample(this.jordanSordaBuffers[chosen], time, false);
          return;
        }

        // Respaldo de muestra sorda
        this.playJordanSample(this.jordanSordaBuffers[0], time, isAccent);
        return;
      }

      // --- MODO PALMA AGUDA / SECA (Grabación real de Jordan Migues de Ritmo I) ---
      if (!isSorda && this.jordanAgudaBuffers.length > 0) {
        // En Ritmo I (compás de 12), mapeo exacto 1-a-1 idéntico a la partitura y video
        if (this.rhythm.id === 'r1') {
          const hitIdx = RITMO_I_STEP_TO_HIT_INDEX[stepIdx];
          if (hitIdx !== undefined && this.jordanAgudaBuffers[hitIdx]) {
            const isCompasAccent = hitIdx === 0 || hitIdx === 3 || hitIdx === 6 || hitIdx === 9 || hitIdx === 12 || hitIdx === 13;
            this.playJordanSample(this.jordanAgudaBuffers[hitIdx], time, isAccent || isCompasAccent);
            return;
          }
        }

        // Para acentos agudos en cualquier compás, usamos los golpes acentuados reales (1, 4, 7, 10, 13, 14)
        if (isAccent) {
          const accentIndices = [0, 3, 6, 9, 12, 13];
          const chosen = accentIndices[Math.floor(Math.random() * accentIndices.length)];
          if (this.jordanAgudaBuffers[chosen]) {
            this.playJordanSample(this.jordanAgudaBuffers[chosen], time, true);
            return;
          }
        }

        // Para golpes agudos regulares, variaciones humanas naturales (golpes 2, 3, 5, 6, 8, 9, 11, 12)
        const normalIndices = [1, 2, 4, 5, 7, 8, 10, 11];
        const chosen = normalIndices[Math.floor(Math.random() * normalIndices.length)];
        if (this.jordanAgudaBuffers[chosen]) {
          this.playJordanSample(this.jordanAgudaBuffers[chosen], time, false);
          return;
        }

        // Respaldo de muestra aguda
        this.playJordanSample(this.jordanAgudaBuffers[0], time, isAccent);
        return;
      }

      // Si por alguna razón se pidió secas pero sólo hay sordas cargadas o viceversa, usar la real disponible
      const fallbackPool = this.jordanAgudaBuffers.length > 0 ? this.jordanAgudaBuffers : this.jordanSordaBuffers;
      if (fallbackPool.length > 0) {
        const pick = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        this.playJordanSample(pick, time, isAccent);
        return;
      }
    }

    // Fallback acústico puramente percusivo sin osciladores de tono artificial
    this.synthesizePalma(time, isAccent);
  }

  private renderLoop() {
    if (!this.isRunning || !this.ctx) return;

    const currentTime = this.ctx.currentTime;

    // Protección anti-desincronización si la pestaña estuvo en segundo plano
    if (this.visualQueue.length > 50) {
      this.visualQueue = this.visualQueue.filter((evt) => evt.time >= currentTime - 0.1);
    }

    while (this.visualQueue.length > 0 && this.visualQueue[0].time <= currentTime + 0.015) {
      const evt = this.visualQueue.shift();
      if (evt) {
        if (evt.step <= -100) {
          // Count-in event
          const countIdx = -100 - evt.step;
          const beat = this.countInBeats[countIdx];
          if (beat) {
            this.onCountInStepCallback?.(beat.num, countIdx, this.countInBeats.length);
          }
        } else {
          // Normal pattern step
          this.onStepCallback?.(evt.step, this.cycleCount);
        }
      }
    }

    this.animFrameId = requestAnimationFrame(() => this.renderLoop());
  }

  // Síntesis acústica orgánica de palma (ruido multicapa resonante, CERO pitidos de oscilador sintético)
  public synthesizePalma(time: number, isAccent: boolean) {
    if (!this.ctx) return;
    const isSeca = this.palmaTone === 'secas';
    const microClaps = [0, 0.005, 0.01];
    const pool = isSeca ? this.cachedNoiseSecas : this.cachedNoiseSordas;
    const dur = isSeca ? 0.068 : 0.088;

    microClaps.forEach((offset, idx) => {
      if (!this.ctx) return;
      let buffer: AudioBuffer | null = null;
      if (pool.length > 0) {
        buffer = pool[idx % pool.length];
      } else {
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        const decay = isSeca ? 0.011 : 0.019;
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * decay));
        }
      }

      const src = this.ctx.createBufferSource();
      src.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const baseFreq = isSeca ? (isAccent ? 1850 : 1400) : (isAccent ? 940 : 750);
      filter.frequency.setValueAtTime(baseFreq, time + offset);
      filter.Q.setValueAtTime(isSeca ? 2.2 : 3.0, time + offset);

      const gain = this.ctx.createGain();
      const volume = (isAccent ? 0.95 : 0.45) / (idx * 0.45 + 1);
      gain.gain.setValueAtTime(volume, time + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, time + offset + dur);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(time + offset);
      src.stop(time + offset + dur + 0.01);
    });
  }

  // Interactive beat / group preview
  public previewBeatGroup(startStep: number, length: number) {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const stepDur = this.getStepDurationSeconds();

    for (let i = 0; i < length; i++) {
      this.scheduleStepAudio(startStep + i, now + i * stepDur);
    }
  }

  // Single tap for Tap Tempo button
  public tapSound() {
    this.init();
    if (!this.ctx) return;

    if (this.audioSourceMode === 'jordan') {
      if (this.palmaTone === 'sordas' && this.jordanSordaBuffers.length > 0) {
        const normalIndices = [1, 3, 4];
        const chosen = normalIndices[Math.floor(Math.random() * normalIndices.length)];
        this.playJordanSample(this.jordanSordaBuffers[chosen], this.ctx.currentTime, false);
        return;
      }
      if (this.palmaTone === 'secas' && this.jordanAgudaBuffers.length > 0) {
        const normalIndices = [1, 2, 4, 5, 7, 8, 10, 11];
        const chosen = normalIndices[Math.floor(Math.random() * normalIndices.length)];
        this.playJordanSample(this.jordanAgudaBuffers[chosen], this.ctx.currentTime, false);
        return;
      }
    }

    this.synthesizePalma(this.ctx.currentTime, false);
  }
}
