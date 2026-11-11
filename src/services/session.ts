import type { CountMode, PalmaTone, ViewMode } from '../types';

/** Última sesión de práctica: se guarda en el dispositivo para retomarla al volver a abrir la app */
export interface SavedSession {
  rhythmId?: string;
  bpm?: number;
  palmaTone?: PalmaTone;
  countMode?: CountMode;
  viewMode?: ViewMode;
  countIn?: boolean;
}

const KEY = 'hispanapp_session';

export function loadSession(): SavedSession {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const s: SavedSession = {};
    if (typeof raw.rhythmId === 'string') s.rhythmId = raw.rhythmId;
    if (typeof raw.bpm === 'number' && raw.bpm >= 35 && raw.bpm <= 250) s.bpm = Math.round(raw.bpm);
    if (raw.palmaTone === 'secas' || raw.palmaTone === 'sordas') s.palmaTone = raw.palmaTone;
    if (raw.countMode === 'phonetic' || raw.countMode === 'traditional') s.countMode = raw.countMode;
    if (raw.viewMode === 'split' || raw.viewMode === 'staff' || raw.viewMode === 'clock') s.viewMode = raw.viewMode;
    if (typeof raw.countIn === 'boolean') s.countIn = raw.countIn;
    return s;
  } catch {
    return {};
  }
}

export function saveSession(s: SavedSession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Ignorar
  }
}
