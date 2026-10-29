import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen } from 'lucide-react';
import { HispanaLogo } from './HispanaLogo';

interface VocabularioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TermItem {
  term: string;
  category: 'Concepto' | 'Notación' | 'Percusión' | 'Estructura';
  definition: string;
  highlight?: string;
}

const VOCABULARIO_DATA: TermItem[] = [
  {
    term: 'Palo',
    category: 'Concepto',
    definition: 'Subgénero o variedad estilística del flamenco. Lo define primordialmente el cante y la armonía de la guitarra, no el ritmo.',
    highlight: 'Con un mismo ritmo se pueden acompañar varios palos distintos (ej. Tangos, Rumbas, Garrotín).',
  },
  {
    term: 'Compás',
    category: 'Concepto',
    definition: 'Ciclo métrico y patrón rítmico recurrente sobre el que se construye la música flamenca (12 tiempos, 3/4, 4/4 o 6/8).',
  },
  {
    term: 'Monograma',
    category: 'Notación',
    definition: 'Pauta musical de una sola línea horizontal para la escritura de instrumentos de percusión sin altura tonal definida (cajón, palmas).',
  },
  {
    term: 'Cuenta Fonética (2, 1, 2...)',
    category: 'Notación',
    definition: 'Convención práctica que reemplaza el «12» por «2» y el «11» por «1» para agilizar el conteo mental a velocidades altas.',
  },
  {
    term: 'Palmas Brillantes',
    category: 'Percusión',
    definition: 'Toque agudo, nítido y penetrante de los dedos sobre la palma abierta. Se utiliza en momentos de clímax, aceleraciones y remates.',
  },
  {
    term: 'Palmas Sordas',
    category: 'Percusión',
    definition: 'Toque ahuecado, cálido y mate de palma contra palma. Acompaña el cante y la guitarra con volumen controlado sin restarles protagonismo.',
  },
  {
    term: 'Acento',
    category: 'Percusión',
    definition: 'Pulso ejecutado con mayor intensidad dinámica que marca los puntos de apoyo y anclaje característicos de cada compás.',
  },
  {
    term: 'Llamada',
    category: 'Estructura',
    definition: 'Frase rítmica distintiva que ejecuta el cajón, las palmas o el bailaor para avisar al grupo el cambio de sección o la entrada del cante.',
  },
  {
    term: 'Cierre / Remate',
    category: 'Estructura',
    definition: 'Fórmula rítmica conclusiva y enérgica que marca el final de una estrofa, copla, falseta o fragmento del baile.',
  },
  {
    term: 'Silencio',
    category: 'Estructura',
    definition: 'Sección lírica y solemne en tonalidad menor (típica en las Alegrías) donde la percusión acompaña con sutileza y contención.',
  },
  {
    term: 'Escobilla',
    category: 'Estructura',
    definition: 'Momento del baile donde el zapateado continuo es el protagonista absoluto, acompañado por un patrón percusivo progresivo en velocidad.',
  },
  {
    term: 'Subdivisión',
    category: 'Notación',
    definition: 'División interna de cada tiempo del compás en partes iguales (binaria en corcheas o ternaria en tresillos/amalgama).',
  },
];

const CATEGORIES = ['Todos', 'Concepto', 'Notación', 'Percusión', 'Estructura'] as const;

export const VocabularioModal: React.FC<VocabularioModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const filteredTerms = useMemo(() => {
    return VOCABULARIO_DATA.filter((item) => {
      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory;
      const matchesSearch =
        !search.trim() ||
        item.term.toLowerCase().includes(search.toLowerCase()) ||
        item.definition.toLowerCase().includes(search.toLowerCase()) ||
        (item.highlight && item.highlight.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [search, selectedCategory]);

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
                Glosario del Método
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight text-white truncate">
                Vocabulario Flamenco
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="icon-btn btn-3d text-gray-400 hover:text-white cursor-pointer"
            title="Cerrar"
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
              placeholder="Buscar término o concepto..."
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
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Términos (Minimalista y Limpia) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {filteredTerms.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No se encontraron términos para «{search}».
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
                  </h4>
                  <span className="text-[10px] font-sans font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-300 shrink-0">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  {item.definition}
                </p>
                {item.highlight && (
                  <p className="text-[11px] text-gray-400 italic bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/[0.04] mt-1.5 leading-relaxed">
                    💡 {item.highlight}
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
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
