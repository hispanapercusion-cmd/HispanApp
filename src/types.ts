export type PalmaHit = 'P' | 'A' | 'R'; // P = Palma regular, A = Acento (>), R = Silencio / Rest

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

