import React from 'react';
import { useLang } from '../i18n';
import { DAY_GOAL_SECONDS, PracticeStats } from '../services/practice';

const INITIALS_ES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const INITIALS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Racha de práctica: días seguidos con al menos 1 minuto, los últimos 7 días y los minutos de la semana */
export const PracticeStreak: React.FC<{ stats: PracticeStats }> = ({ stats }) => {
  const { lang, L } = useLang();
  const todayDone = stats.todaySeconds >= DAY_GOAL_SECONDS;
  const initials = lang === 'en' ? INITIALS_EN : INITIALS_ES;

  let title: string;
  if (stats.streak === 0) title = L('Empieza tu racha hoy', 'Start your streak today');
  else if (stats.streak === 1) title = L('1 día de racha', '1-day streak');
  else title = L(`${stats.streak} días seguidos`, `${stats.streak}-day streak`);

  let subtitle: string;
  if (todayDone) subtitle = L(`Hoy ✓ · ${stats.weekMinutes} min esta semana`, `Today ✓ · ${stats.weekMinutes} min this week`);
  else if (stats.streak > 0) subtitle = L('Practica 1 minuto hoy para no perderla', 'Practise 1 minute today to keep it');
  else subtitle = L('Practica 1 minuto para sumar tu primer día', 'Practise 1 minute to earn your first day');

  return (
    <div className="glass-card rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3" data-testid="practice-streak">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`text-xl leading-none ${stats.streak > 0 ? '' : 'grayscale opacity-60'}`} aria-hidden="true">🔥</span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white leading-tight">{title}</p>
          <p className="text-[11.5px] text-gray-400 leading-snug">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" aria-label={L('Últimos 7 días', 'Last 7 days')}>
        {stats.last7.map((d) => (
          <div key={d.date.toDateString()} className="flex flex-col items-center gap-0.5">
            <span
              className={`w-4 h-4 rounded-full ${
                d.done
                  ? 'bg-[#E84A27] shadow-[0_0_6px_rgba(232,74,39,0.6)]'
                  : d.isToday
                    ? 'border-2 border-[#FF6B4A]/70'
                    : 'bg-white/[0.08]'
              }`}
            />
            <span className={`text-[9px] leading-none ${d.isToday ? 'text-white font-bold' : 'text-gray-500'}`}>
              {initials[d.date.getDay()]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
