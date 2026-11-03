import React, { useEffect, useState } from 'react';

// Idiomas de HispanApp. Cada texto se escribe con sus dos versiones juntas: L('Hola', 'Hello').
// El idioma se elige solo según el del teléfono (español si empieza por "es"; si no, inglés)
// y se puede cambiar con el botón ES/EN. La elección queda guardada en este dispositivo.

export type Lang = 'es' | 'en';

const STORAGE_KEY = 'hispanapp_lang';

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch {
    // Sin almacenamiento: seguir con el idioma del navegador
  }
  const nav = (typeof navigator !== 'undefined' && (navigator.languages?.[0] || navigator.language)) || 'es';
  return nav.toLowerCase().startsWith('es') ? 'es' : 'en';
}

let current: Lang = typeof window !== 'undefined' ? detectLang() : 'es';
if (typeof document !== 'undefined') document.documentElement.lang = current;

const listeners = new Set<(lang: Lang) => void>();

export const getLang = (): Lang => current;

/** Texto según el idioma actual (para usar fuera de los componentes, p. ej. en servicios) */
export function L<T>(es: T, en: T): T {
  return current === 'en' ? en : es;
}

export function setLang(lang: Lang) {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Ignorar
  }
  document.documentElement.lang = lang;
  listeners.forEach((fn) => fn(lang));
}

/** Idioma actual dentro de un componente: se vuelve a dibujar al cambiarlo */
export function useLang() {
  const [lang, setLangState] = useState<Lang>(current);
  useEffect(() => {
    const fn = (l: Lang) => setLangState(l);
    listeners.add(fn);
    // Por si cambió entre el primer dibujo y este efecto
    setLangState(current);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  const tr = <T,>(es: T, en: T): T => (lang === 'en' ? en : es);
  return { lang, setLang, L: tr };
}

/** Botón ES / EN */
export const LangSwitch: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang } = useLang();
  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className={`${/\bhidden\b/.test(className) ? '' : 'inline-flex '}items-center gap-0.5 segmented p-0.5 rounded-full text-[10.5px] font-sans font-bold ${className}`}
    >
      {(['es', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2 py-1 rounded-full uppercase tracking-wider transition cursor-pointer ${
            lang === l ? 'seg-active text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
};

// Rol y nivel del alumno: se guardan siempre en español (así llegan a Firebase) y se muestran traducidos
const ROLE_EN: Record<string, string> = {
  'Guitarrista 🎸': 'Guitarist 🎸',
  'Percusionista 🥁': 'Percussionist 🥁',
  'Cantaor/a 🎤': 'Singer (cantaor/a) 🎤',
  'Bailaora 💃': 'Dancer (bailaor/a) 💃',
};
const LEVEL_EN: Record<string, string> = { Bajo: 'Beginner', Medio: 'Intermediate', Alto: 'Advanced' };

export const roleLabel = (role: string, lang: Lang) => (lang === 'en' ? ROLE_EN[role] || role : role);
export const levelLabel = (level: string, lang: Lang) => (lang === 'en' ? LEVEL_EN[level] || level : level);
