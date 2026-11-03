import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen } from 'lucide-react';
import { HispanaLogo } from './HispanaLogo';
import { useLang } from '../i18n';

interface VocabularioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TermItem {
  term: string;
  category: 'Concepto' | 'Notación' | 'Percusión' | 'Estructura';
  definition: string;
  highlight?: string;
  /** Traducción corta del término (en inglés el término se deja en español con esta explicación) */
  gloss: string;
  definitionEn: string;
  highlightEn?: string;
}

const VOCABULARIO_DATA: TermItem[] = [
  {
    term: 'Palo',
    category: 'Concepto',
    definition: 'Subgénero o variedad estilística del flamenco. Lo define primordialmente el cante y la armonía de la guitarra, no el ritmo.',
    highlight: 'Con un mismo ritmo se pueden acompañar varios palos distintos (ej. Tangos, Rumbas, Garrotín).',
    gloss: 'flamenco style',
    definitionEn: 'A flamenco sub-genre or style. It is defined mainly by the singing (cante) and the guitar harmony, not by the rhythm.',
    highlightEn: 'The same rhythm can accompany several different palos (e.g. Tangos, Rumbas, Garrotín).',
  },
  {
    term: 'Compás',
    category: 'Concepto',
    definition: 'Ciclo métrico y patrón rítmico recurrente sobre el que se construye la música flamenca (12 tiempos, 3/4, 4/4 o 6/8).',
    gloss: 'rhythmic cycle',
    definitionEn: 'The metric cycle and recurring rhythmic pattern on which flamenco music is built (12 beats, 3/4, 4/4 or 6/8).',
  },
  {
    term: 'Monograma',
    category: 'Notación',
    definition: 'Pauta musical de una sola línea horizontal para la escritura de instrumentos de percusión sin altura tonal definida (cajón, palmas).',
    gloss: 'one-line staff',
    definitionEn: 'A single-line staff used to write percussion instruments without a defined pitch (cajón, palmas).',
  },
  {
    term: 'Cuenta Fonética (2, 1, 2...)',
    category: 'Notación',
    definition: 'Convención práctica que reemplaza el «12» por «2» y el «11» por «1» para agilizar el conteo mental a velocidades altas.',
    gloss: 'phonetic count',
    definitionEn: 'A practical convention that replaces “12” with “2” and “11” with “1” to make counting easier at high speeds.',
  },
  {
    term: 'Palmas Brillantes',
    category: 'Percusión',
    definition: 'Toque agudo, nítido y penetrante de los dedos sobre la palma abierta. Se utiliza en momentos de clímax, aceleraciones y remates.',
    gloss: 'bright claps',
    definitionEn: 'A high, sharp, piercing clap of the fingers on the open palm. Used at climaxes, accelerations and remates.',
  },
  {
    term: 'Palmas Sordas',
    category: 'Percusión',
    definition: 'Toque ahuecado, cálido y mate de palma contra palma. Acompaña el cante y la guitarra con volumen controlado sin restarles protagonismo.',
    gloss: 'muted claps',
    definitionEn: 'A hollow, warm, muted palm-on-palm clap. It accompanies the singing and the guitar at a controlled volume without overpowering them.',
  },
  {
    term: 'Acento',
    category: 'Percusión',
    definition: 'Pulso ejecutado con mayor intensidad dinámica que marca los puntos de apoyo y anclaje característicos de cada compás.',
    gloss: 'accent',
    definitionEn: 'A beat played with more intensity that marks the characteristic support points of each compás.',
  },
  {
    term: 'Llamada',
    category: 'Estructura',
    definition: 'Frase rítmica distintiva que ejecuta el cajón, las palmas o el bailaor para avisar al grupo el cambio de sección o la entrada del cante.',
    gloss: 'call',
    definitionEn: 'A distinctive rhythmic phrase played by the cajón, the palmas or the dancer to signal a change of section or the entrance of the singing.',
  },
  {
    term: 'Cierre / Remate',
    category: 'Estructura',
    definition: 'Fórmula rítmica conclusiva y enérgica que marca el final de una estrofa, copla, falseta o fragmento del baile.',
    gloss: 'ending / final flourish',
    definitionEn: 'An energetic closing rhythmic formula that marks the end of a verse, a falseta (guitar phrase) or a section of the dance.',
  },
  {
    term: 'Silencio',
    category: 'Estructura',
    definition: 'Sección lírica y solemne en tonalidad menor (típica en las Alegrías) donde la percusión acompaña con sutileza y contención.',
    gloss: 'lyrical section',
    definitionEn: 'A lyrical, solemn section in a minor key (typical of Alegrías) where the percussion accompanies subtly and with restraint.',
  },
  {
    term: 'Escobilla',
    category: 'Estructura',
    definition: 'Momento del baile donde el zapateado continuo es el protagonista absoluto, acompañado por un patrón percusivo progresivo en velocidad.',
    gloss: 'footwork section',
    definitionEn: 'The part of the dance where continuous footwork (zapateado) takes centre stage, with a percussion pattern that speeds up progressively.',
  },
  {
    term: 'Subdivisión',
    category: 'Notación',
    definition: 'División interna de cada tiempo del compás en partes iguales (binaria en corcheas o ternaria en tresillos/amalgama).',
    gloss: 'subdivision',
    definitionEn: 'The internal division of each beat into equal parts (binary in eighth notes or ternary in triplets/amalgam).',
  },
];

const CATEGORIES = ['Todos', 'Concepto', 'Notación', 'Percusión', 'Estructura'] as const;
const CATEGORY_EN: Record<string, string> = { Todos: 'All', Concepto: 'Concept', Notación: 'Notation', Percusión: 'Percussion', Estructura: 'Structure' };

export const VocabularioModal: React.FC<VocabularioModalProps> = ({ isOpen, onClose }) => {
  const { lang, L } = useLang();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const filteredTerms = useMemo(() => {
    return VOCABULARIO_DATA.filter((item) => {
      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      const q = search.trim().toLowerCase();
      const texts = [item.term, item.gloss, item.definition, item.definitionEn, item.highlight || '', item.highlightEn || ''];
      const matchesSearch = !q || texts.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);
  const catLabel = (c: string) => (lang === 'en' ? CATEGORY_EN[c] || c : c);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="modal-panel rounded-3xl max-w-xl w-full max-h-[88vh] flex flex-col shadow-2xl text-white overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-4 sm:p-5 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <HispanaLogo size="md" />
            <div className="min-w-0">
              <span className="font-brand text-[9.5px] tracking-[0.22em] uppercase text-[#E84A27] font-bold flex items-center gap-1.5 leading-none mb-1">
                <BookOpen className="w-3.5 h-3.5 text-[#E84A27]" />
                {L('Glosario del Método', 'Method glossary')}
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight text-white truncate">
                {L('Vocabulario Flamenco', 'Flamenco vocabulary')}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn btn-3d text-gray-400 hover:text-white cursor-pointer"
            title={L('Cerrar', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Buscador y Filtros Minimalistas */}
        <div className="p-3.5 sm:p-4 border-b border-white/[0.06] bg-black/20 space-y-2.5 shrink-0">
          {/* Input de búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={L('Buscar término o concepto...', 'Search a term or concept...')}
              className="w-full inset-field focus:border-[#E84A27]/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Chips de categorías */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 -my-1 px-0.5 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-sans font-medium transition shrink-0 cursor-pointer ${
                    active
                      ? 'btn-primary text-white'
                      : 'btn-3d text-gray-400 hover:text-white'
                  }`}
                >
                  {catLabel(cat)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Términos (Minimalista y Limpia) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredTerms.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              {L(`No se encontraron términos para «${search}».`, `No terms found for “${search}”.`)}
            </div>
          ) : (
            filteredTerms.map((item) => (
              <div
                key={item.term}
                className="sub-card rounded-2xl p-3.5 sm:p-4 space-y-1.5 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-serif font-bold text-sm sm:text-base text-white tracking-tight">
                    {item.term}
                    {lang === 'en' && <span className="font-sans font-normal text-xs text-gray-400"> — {item.gloss}</span>}
                  </h4>
                  <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-300 shrink-0">
                    {catLabel(item.category)}
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  {lang === 'en' ? item.definitionEn : item.definition}
                </p>
                {item.highlight && (
                  <p className="text-[11px] text-gray-400 italic bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/[0.04] mt-1.5 leading-relaxed">
                    💡 {lang === 'en' && item.highlightEn ? item.highlightEn : item.highlight}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Modal */}
        <div className="p-3 border-t border-white/[0.06] bg-black/20 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl btn-3d text-white text-xs font-brand tracking-[0.18em] uppercase font-bold cursor-pointer"
          >
            {L('Cerrar', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
