/**
 * Registro de práctica (solo en este dispositivo): segundos practicados por día.
 * Un día cuenta para la racha cuando se practica al menos 1 minuto.
 */
const KEY = 'hispanapp_practice';
export const DAY_GOAL_SECONDS = 60;
const KEEP_DAYS = 120;

type Days = Record<string, number>;

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const addDays = (d: Date, n: number) => {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  c.setDate(c.getDate() + n);
  return c;
};

function read(): Days {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const days: Days = {};
    if (raw && typeof raw.days === 'object' && raw.days) {
      for (const [k, v] of Object.entries(raw.days)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === 'number' && v > 0) days[k] = v;
      }
    }
    return days;
  } catch {
    return {};
  }
}

export interface PracticeStats {
  /** Días seguidos con al menos 1 minuto (cuenta hoy, o hasta ayer si hoy aún no se practicó) */
  streak: number;
  todaySeconds: number;
  /** Minutos de los últimos 7 días, hoy incluido */
  weekMinutes: number;
  /** Últimos 7 días, del más antiguo a hoy */
  last7: { date: Date; done: boolean; isToday: boolean }[];
}

export function getPracticeStats(now: Date = new Date()): PracticeStats {
  const days = read();
  const done = (d: Date) => (days[dayKey(d)] || 0) >= DAY_GOAL_SECONDS;
  let streak = 0;
  let cursor = done(now) ? now : addDays(now, -1);
  while (done(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(now, i - 6);
    return { date, done: done(date), isToday: i === 6 };
  });
  const weekSeconds = last7.reduce((sum, d) => sum + (days[dayKey(d.date)] || 0), 0);
  return { streak, todaySeconds: days[dayKey(now)] || 0, weekMinutes: Math.round(weekSeconds / 60), last7 };
}

export function addPracticeSeconds(seconds: number, now: Date = new Date()): PracticeStats {
  if (seconds > 0 && seconds < 3600) {
    const days = read();
    const key = dayKey(now);
    days[key] = Math.round(((days[key] || 0) + seconds) * 10) / 10;
    const oldest = dayKey(addDays(now, -KEEP_DAYS));
    for (const k of Object.keys(days)) if (k < oldest) delete days[k];
    try {
      localStorage.setItem(KEY, JSON.stringify({ days }));
    } catch {
      // Ignorar
    }
  }
  return getPracticeStats(now);
}
