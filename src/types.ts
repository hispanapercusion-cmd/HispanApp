export type PalmaHit = 'P' | 'A' | 'R'; // P = Palma regular, A = Acento (>), R = Silencio / Rest
export type CajonHit = 'B' | 'A' | 'G' | 'R'; // B = Bajo, A = Agudo, G = Fantasma (cabeza de cruz), R = Silencio

/** Variante de cajón de un ritmo (mismos compases, otro dibujo de bajos, agudos y fantasmas) */
export interface CajonPattern {
  note: string;
  noteEn: string;
  cajon: CajonHit[];
}

/** Variante de palmas de un ritmo (misma cuenta, otro dibujo de golpes y silencios) */
export interface RhythmPattern {
  /** Qué tiene de distinto, para explicarlo en pocas palabras */
  note: string;
  noteEn: string;
  steps: PalmaHit[];
}

export interface RhythmDefinition {
  id: string;
  roman: string;
  ebook: 'EBOOK I' | 'EBOOK II' | 'EBOOK III';
  shortTitle: string;
  scoreTitle: string;
  palos: string;
  /** Palos en inglés */
  palosEn?: string;
  timeSignature: string;
  bpmRange: { min: number; max: number; default: number };
  has12CountToggle: boolean;
  countsPhon: string[];
  countsTrad: string[];
  clockAccents: number[];
  /**
   * Metrónomo de fondo: tiempos (índice de tiempo, desde 0) donde suena el golpe grave de referencia.
   * Por defecto solo el primero del ritmo completo ([0]).
   */
  metroDownbeats?: number[];
  stepsPerBeat: number;
  steps: PalmaHit[];
  /** Patrón de cajón (mismos pasos que las palmas: uno por corchea). Alterna mano derecha (D) e izquierda (I). */
  cajon?: CajonHit[];
  /** Tiempos (negras) de cada compás de la partitura del cajón, p. ej. [3,3,3,3] o [2,2,3,3,2]. Por defecto, compases de 3. */
  cajonBars?: number[];
  /** Cuántos golpes se unen con una misma barra en la partitura del cajón (por defecto, los de un tiempo; p. ej. 4 en 4/4) */
  cajonSamplesFrom?: string; // usar solo los golpes grabados de ese ritmo (id del banco), siempre al azar según su tipo
  cajonSig?: string; // cifra de compás de la partitura del cajón si no es N/4 (p. ej. '6/8')
  cajonBeamNotes?: number;
  /** Otros patrones de cajón del mismo ritmo (el patrón 1 es siempre `cajon`, el oficial con video) */
  cajonPatterns?: CajonPattern[];
  /** Qué tiene el patrón de cajón oficial (para mostrarlo junto al selector de patrones) */
  cajonNote?: string;
  cajonNoteEn?: string;
  /** Patrón de cajón en uso: 0 = el oficial (`cajon`); 1, 2… = `cajonPatterns[n-1]`. Lo rellena rhythmWithCajonPattern */
  cajonPatternIndex?: number;
  /** Otros patrones de palmas sobre el mismo ritmo (el patrón 1 es siempre `steps`, el oficial con video) */
  patterns?: RhythmPattern[];
  /** Patrón en uso: 0 = el oficial (`steps`); 1, 2… = `patterns[n-1]`. Lo rellena rhythmWithPattern */
  patternIndex?: number;
  videoUrl: string;
  videoEmbedUrl: string;
}

export type ViewMode = 'split' | 'staff' | 'clock';
export type CountMode = 'phonetic' | 'traditional';
export type PalmaTone = 'secas' | 'sordas';
export type AudioSourceMode = 'jordan' | 'synth';

export interface TrainerConfig {
  enabled: boolean;
  stepBpm: number;
  everyCycles: number;
  maxBpm: number;
}

export type UserFlamencoRole =
  | 'Guitarrista 🎸'
  | 'Percusionista 🥁'
  | 'Cantaor/a 🎤'
  | 'Bailaora 💃';

export type UserFlamencoLevel = 'Bajo' | 'Medio' | 'Alto';

export interface UserProfile {
  name: string;
  contact: string;
  role?: UserFlamencoRole;
  discipline?: string;
  level?: UserFlamencoLevel;
  createdAt?: string;
  updatedAt?: string;
}

