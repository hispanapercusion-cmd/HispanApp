export type PalmaHit = 'P' | 'A' | 'R'; // P = Palma regular, A = Acento (>), R = Silencio / Rest

export interface RhythmDefinition {
  id: string;
  roman: string;
  ebook: 'EBOOK I' | 'EBOOK II' | 'EBOOK III';
  shortTitle: string;
  scoreTitle: string;
  palos: string;
  timeSignature: string;
  bpmRange: { min: number; max: number; default: number };
  has12CountToggle: boolean;
  countsPhon: string[];
  countsTrad: string[];
  clockAccents: number[];
  stepsPerBeat: number;
  steps: PalmaHit[];
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

