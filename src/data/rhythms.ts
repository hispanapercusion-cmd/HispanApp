import { RhythmDefinition } from '../types';
import type { Lang } from '../i18n';

export const PALMAS_METHOD: RhythmDefinition[] = [
  {
    id: 'r1',
    roman: 'I',
    ebook: 'EBOOK I',
    shortTitle: 'Ritmo I — Alegrías / Soleá por Bulería',
    scoreTitle: 'Ritmo I — Alegrías / Soleá por Bulería',
    palos: 'Cantiñas (Alegrías, Romera, Mirabrás, Caracoles, Cantiñas Personales), familia de la Soleá (Soleá, Soleá por Bulerías, Bamberas) y Guajiras.',
    palosEn: 'Cantiñas (Alegrías, Romera, Mirabrás, Caracoles, Cantiñas Personales), the Soleá family (Soleá, Soleá por Bulerías, Bamberas) and Guajiras.',
    timeSignature: '3/4',
    bpmRange: { min: 60, max: 220, default: 115 },
    has12CountToggle: true,
    countsPhon: ['2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '1'],
    countsTrad: ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    clockAccents: [0, 3, 6, 8, 10],
    stepsPerBeat: 2, // 12 negras = 24 pasos de corchea
    // Acentos en los tiempos 12, 3, 6, 8 y 10 (pasos 0, 6, 12, 16 y 20)
    steps: [
      'A', 'R', 'R', 'P', 'P', 'R',
      'A', 'R', 'P', 'R', 'P', 'R',
      'A', 'R', 'P', 'P', 'A', 'R',
      'P', 'P', 'A', 'R', 'P', 'R',
    ],
    // Cajón del ritmo I (partitura y video de Jordan): 24 corcheas, siempre D-I-D-I…
    // B = bajo · A = agudo · G = fantasma
    cajon: [
      'B', 'G', 'G', 'A', 'G', 'G',
      'B', 'G', 'G', 'A', 'G', 'G',
      'G', 'A', 'B', 'G', 'B', 'G',
      'G', 'A', 'B', 'G', 'A', 'G',
    ],
    cajonBars: [3, 3, 3, 3],
    // Otros patrones de palmas del ritmo I (mismos acentos en 12, 3, 6, 8 y 10; el patrón 1 es el de arriba, con video)
    patterns: [
      {
        // Patrón 2: en los tiempos 1, 4, 7, 9 y 1 final, silencio de corchea + corchea (a contratiempo)
        note: 'Contratiempos: silencio + corchea',
        noteEn: 'Off-beats: rest + eighth note',
        steps: [
          'A', 'R', 'R', 'P', 'P', 'R',
          'A', 'R', 'R', 'P', 'P', 'R',
          'A', 'R', 'R', 'P', 'A', 'R',
          'R', 'P', 'A', 'R', 'R', 'P',
        ],
      },
      {
        // Patrón 3: en los tiempos 1, 4, 7 y 9, dos corcheas seguidas
        note: 'Dos corcheas en los tiempos 1, 4, 7 y 9',
        noteEn: 'Two eighth notes on beats 1, 4, 7 and 9',
        steps: [
          'A', 'R', 'P', 'P', 'P', 'R',
          'A', 'R', 'P', 'P', 'P', 'R',
          'A', 'R', 'P', 'P', 'A', 'R',
          'P', 'P', 'A', 'R', 'P', 'R',
        ],
      },
    ],
    videoUrl: 'https://youtu.be/V4eKkZvdvCw?si=UrHBMB2lleHJAlT5',
    videoEmbedUrl: 'https://www.youtube.com/embed/V4eKkZvdvCw',
  },
  {
    id: 'r2',
    roman: 'II',
    ebook: 'EBOOK I',
    shortTitle: 'Ritmo II — Seguiriyas / Martinetes',
    scoreTitle: 'Ritmo II — Seguiriyas / Martinetes',
    palos: 'Seguiriyas, Martinetes y Serranas.',
    palosEn: 'Seguiriyas, Martinetes and Serranas.',
    timeSignature: '2/4 y 3/4',
    bpmRange: { min: 60, max: 200, default: 90 },
    has12CountToggle: false,
    countsPhon: ['1', '·', '2', '·', '3', '·', '·', '4', '·', '·', '5', '·'],
    countsTrad: ['1', '·', '2', '·', '3', '·', '·', '4', '·', '·', '5', '·'],
    clockAccents: [0, 2, 4, 7, 10],
    stepsPerBeat: 2, // 12 negras = 24 pasos de corchea
    steps: [
      'A', 'R', 'P', 'P',
      'A', 'R', 'P', 'P',
      'A', 'R', 'R', 'P', 'P', 'R',
      'A', 'R', 'R', 'P', 'P', 'R',
      'A', 'R', 'P', 'P',
    ],
    // Cajón del ritmo II (partitura de Jordan): compases de 2/4, 2/4, 3/4, 3/4 y 2/4; siempre D-I-D-I…
    // B = bajo · A = agudo · G = fantasma
    cajon: [
      'B', 'G', 'A', 'G',
      'B', 'G', 'A', 'G',
      'B', 'G', 'G', 'A', 'G', 'G',
      'B', 'G', 'G', 'A', 'G', 'G',
      'B', 'G', 'A', 'G',
    ],
    cajonBars: [2, 2, 3, 3, 2],
    videoUrl: 'https://youtu.be/UXdjVTvbJGE?si=WH6MR8lCup6KDtzq',
    videoEmbedUrl: 'https://www.youtube.com/embed/UXdjVTvbJGE',
  },
  {
    id: 'r3',
    roman: 'III',
    ebook: 'EBOOK II',
    shortTitle: 'Ritmo III — Bulerías de Jerez / Cádiz',
    scoreTitle: 'Ritmo III — Bulerías de Jerez',
    palos: 'Bulerías de Jerez y Bulerías de Cádiz.',
    palosEn: 'Bulerías de Jerez and Bulerías de Cádiz.',
    timeSignature: '3/4',
    bpmRange: { min: 60, max: 260, default: 185 },
    has12CountToggle: true,
    countsPhon: ['2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '1'],
    countsTrad: ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    metroDownbeats: [0, 6], // Bulería: referencia en el 12 y en el 6
    clockAccents: [0, 6], // círculos rojos solo arriba (12) y abajo (6), donde cae el bajo; los acentos de palma (1, 3, 7, 9) van en la partitura
    stepsPerBeat: 1, // 12 corcheas = 12 pasos
    steps: [
      'R', 'A', 'P', 'A', 'P', 'P',
      'R', 'A', 'P', 'A', 'P', 'P',
    ],
    // Cajón del ritmo III (partitura y video de Jordan): 2 compases de 3/4 en SEMICORCHEAS (24 golpes, 2 por cada paso de arriba),
    // siempre D-I-D-I… B = bajo · A = agudo · G = fantasma
    cajon: [
      'B', 'G', 'G', 'A', 'G', 'G', 'A', 'G', 'G', 'A', 'G', 'G',
      'B', 'G', 'G', 'A', 'G', 'G', 'A', 'G', 'G', 'A', 'G', 'G',
    ],
    cajonBars: [3, 3],
    cajonNote: 'Patrón oficial, el del video: bajos en el 12 y el 6',
    cajonNoteEn: 'Official pattern, the one in the video: bass on 12 and 6',
    // Segundo patrón de cajón de las bulerías (partitura de Jordan, sin video): bajos en el 12, 3, 7 y 8
    cajonPatterns: [
      {
        note: 'Bajos en el 12, el 3, el 7 y el 8',
        noteEn: 'Bass notes on 12, 3, 7 and 8',
        cajon: [
          'B', 'G', 'G', 'A', 'G', 'G', 'B', 'G', 'G', 'A', 'G', 'G',
          'G', 'A', 'B', 'A', 'B', 'G', 'G', 'A', 'G', 'G', 'G', 'A',
        ],
      },
    ],
    // Otros patrones de palmas de las bulerías (partituras de Jordan; el patrón 1 es el de arriba, el del video)
    patterns: [
      {
        // Patrón 2: corcheas en el 12 y el 1 (y 6 y 7), y negras acentuadas en el 2, 4, 8 y 10
        note: 'Acentos en el 12, 2, 4, 6, 8 y 10',
        noteEn: 'Accents on 12, 2, 4, 6, 8 and 10',
        steps: [
          'A', 'P', 'A', 'R', 'A', 'R',
          'A', 'P', 'A', 'R', 'A', 'R',
        ],
      },
      {
        // Patrón 3: la palma del patrón 1 más una contrapalma (segunda línea): un golpe suave a mitad de la corchea del 1
        // (y del 7) y uno fuerte en el 3 (y el 9). La contra tiene una posición por medio paso.
        note: 'Dos palmas: la del patrón 1 y una contrapalma (el 2.º golpe es el fuerte)',
        noteEn: 'Two claps: the pattern 1 clap plus a counter-clap (the 2nd hit is the strong one)',
        steps: [
          'R', 'A', 'P', 'A', 'P', 'P',
          'R', 'A', 'P', 'A', 'P', 'P',
        ],
        contra: [
          'R', 'R', 'R', 'P', 'R', 'R', 'A', 'R', 'R', 'R', 'R', 'R',
          'R', 'R', 'R', 'P', 'R', 'R', 'A', 'R', 'R', 'R', 'R', 'R',
        ],
      },
      {
        // Patrón 4 (partitura de Jordan): sin acentos; silencio + corchea en el 12 y el 1, corchea + silencio en el 2 y el 3, y dos corcheas en el 4 y el 5
        note: 'Sin acentos: corcheas con silencios, y dos corcheas en el 4-5 y el 10-1',
        noteEn: 'No accents: eighth notes with rests, and two eighth notes on 4-5 and 10-1',
        eighthRests: true,
        steps: [
          'R', 'P', 'P', 'R', 'P', 'P',
          'R', 'P', 'P', 'R', 'P', 'P',
        ],
      },
    ],
    videoUrl: 'https://youtu.be/CxFXWZDFj5s?si=yMOrdph4YnijL6Ph',
    videoEmbedUrl: 'https://www.youtube.com/embed/CxFXWZDFj5s',
  },
  {
    id: 'r4',
    roman: 'IV',
    ebook: 'EBOOK II',
    shortTitle: 'Ritmo IV — Jaleos / Abandolaos',
    scoreTitle: 'Ritmo IV — Jaleos / Abandolaos',
    palos: 'Jaleos y Abandolaos.',
    palosEn: 'Jaleos and Abandolaos.',
    timeSignature: '3/4',
    bpmRange: { min: 60, max: 180, default: 120 },
    has12CountToggle: true,
    countsPhon: ['2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '1'],
    countsTrad: ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    metroDownbeats: [0, 6], // Abandolaos: referencia en el 12 y en el 6
    clockAccents: [0, 6], // círculos rojos solo arriba (12) y abajo (6)
    stepsPerBeat: 2, // 24 pasos de semicorchea
    steps: [
      'A', 'R', 'R', 'P', 'A', 'R', 'R', 'P', 'A', 'R', 'A', 'R',
      'A', 'R', 'R', 'P', 'A', 'R', 'R', 'P', 'A', 'R', 'A', 'R',
    ],
    // Cajón del ritmo IV (base de Jaleos, partitura de Jordan, sin video): 2 compases de 3/4 en semicorcheas, D-I-D-I…
    // B = bajo · A = agudo · G = fantasma
    cajon: [
      'B', 'G', 'G', 'A', 'G', 'G', 'G', 'A', 'G', 'G', 'B', 'G',
      'B', 'G', 'G', 'A', 'G', 'G', 'G', 'A', 'G', 'G', 'B', 'G',
    ],
    cajonBars: [3, 3],
    videoUrl: 'https://youtu.be/jeM-teScoIY?si=wBp3aPBCbyyyWA6j',
    videoEmbedUrl: 'https://www.youtube.com/embed/jeM-teScoIY',
  },
  {
    id: 'r5',
    roman: 'V',
    ebook: 'EBOOK II',
    shortTitle: 'Ritmo V — Fandangos / Sevillanas',
    scoreTitle: 'Ritmo V — Fandangos / Sevillanas',
    palos: 'Fandangos y Sevillanas.',
    palosEn: 'Fandangos and Sevillanas.',
    timeSignature: '3/4',
    bpmRange: { min: 60, max: 180, default: 125 },
    has12CountToggle: false,
    countsPhon: ['1', '2', '3', '1', '2', '3', '1', '2', '3', '1', '2', '3'],
    countsTrad: ['1', '2', '3', '1', '2', '3', '1', '2', '3', '1', '2', '3'],
    clockAccents: [0, 3, 6, 9, 10],
    stepsPerBeat: 1, // 12 pasos
    steps: [
      'A', 'P', 'P',
      'A', 'P', 'P',
      'A', 'P', 'P',
      'A', 'A', 'R',
    ],
    // Cajón del ritmo V (base de Fandangos / Sevillanas, partitura de Jordan, sin video): 4 compases de 3/4 en corcheas,
    // D-I-D-I… (2 golpes de cajón por cada paso de las palmas). B = bajo · A = agudo · G = fantasma
    cajon: [
      'B', 'G', 'G', 'A', 'G', 'G',
      'B', 'G', 'G', 'A', 'G', 'G',
      'B', 'G', 'G', 'A', 'G', 'G',
      'B', 'G', 'G', 'A', 'G', 'G',
    ],
    cajonBars: [3, 3, 3, 3],
    // Otro patrón de palmas (partitura de Jordan): con corcheas («1 y», «2 y»). Va a 2 pasos por tiempo (24 pasos de corchea);
    // el cajón (24 golpes) sigue sonando igual. El patrón 1 (arriba) sigue siendo el oficial.
    patterns: [
      {
        note: 'Con corcheas («1 y» en los compases 1 y 3, «2 y» en los 2 y 4); acento en el 1 de cada compás',
        noteEn: 'With eighth notes («1 &» in bars 1 and 3, «2 &» in bars 2 and 4); accent on beat 1 of each bar',
        stepsPerBeat: 2,
        steps: [
          'A', 'P', 'P', 'R', 'P', 'R',
          'A', 'R', 'P', 'P', 'P', 'R',
          'A', 'P', 'P', 'R', 'P', 'R',
          'A', 'R', 'P', 'P', 'P', 'R',
        ],
      },
    ],
    videoUrl: 'https://youtu.be/475btji9NK0?si=7a1A29jM8botFRuv',
    videoEmbedUrl: 'https://www.youtube.com/embed/475btji9NK0',
  },
  {
    id: 'r6',
    roman: 'VI',
    ebook: 'EBOOK III',
    shortTitle: 'Ritmo VI — Tangos / Rumbas',
    scoreTitle: 'Ritmo VI — Tangos / Rumbas',
    palos: 'Tangos (Cádiz, Triana, Jerez, Granada, Extremeños), Rumbas, Garrotín y Colombianas.',
    palosEn: 'Tangos (Cádiz, Triana, Jerez, Granada, Extremeños), Rumbas, Garrotín and Colombianas.',
    timeSignature: '4/4',
    bpmRange: { min: 60, max: 220, default: 110 },
    has12CountToggle: false,
    countsPhon: ['1', '2', '3', '4', '1', '2', '3', '4'],
    countsTrad: ['1', '2', '3', '4', '1', '2', '3', '4'],
    metroDownbeats: [0, 4], // Tangos: en el 1 de cada compás
    clockAccents: [1, 3, 5, 7],
    stepsPerBeat: 2, // 16 pasos de corchea
    steps: [
      'R', 'R', 'A', 'P', 'P', 'R', 'A', 'R',
      'R', 'R', 'A', 'P', 'P', 'R', 'A', 'R',
    ],
    // Cajón del ritmo VI (base de Tangos; partitura y video `ritmo_VI_base_2` de Jordan): 2 compases de 4/4 en corcheas,
    // D-I-D-I… B = bajo · A = agudo · G = fantasma
    cajon: [
      'G', 'G', 'A', 'B', 'G', 'G', 'B', 'G',
      'G', 'G', 'A', 'B', 'G', 'G', 'B', 'G',
    ],
    cajonBars: [4, 4],
    cajonBeamNotes: 4, // las corcheas se unen de a 4 (medio compás)
    videoUrl: 'https://youtu.be/7wStNQX9tJ8?si=tR5_Zn5kvHsAJxdj',
    videoEmbedUrl: 'https://www.youtube.com/embed/7wStNQX9tJ8',
  },
  {
    id: 'r7',
    roman: 'VII',
    ebook: 'EBOOK III',
    shortTitle: 'Ritmo VII — Tientos / Farruca',
    scoreTitle: 'Ritmo VII — Tientos / Farruca',
    palos: 'Tientos, Farrucas y Tarantos.',
    palosEn: 'Tientos, Farrucas and Tarantos.',
    timeSignature: '4/4',
    bpmRange: { min: 40, max: 100, default: 60 },
    has12CountToggle: false,
    countsPhon: ['1', '2', '3', '4', '1', '2', '3', '4'],
    countsTrad: ['1', '2', '3', '4', '1', '2', '3', '4'],
    metroDownbeats: [0, 4], // Tientos: en el 1 de cada compás
    clockAccents: [0, 2, 4, 6],
    stepsPerBeat: 2, // 16 pasos de corchea
    steps: [
      'A', 'R', 'R', 'P', 'A', 'R', 'R', 'R',
      'A', 'R', 'R', 'P', 'A', 'R', 'R', 'R',
    ],
    // Cajón (base de Jordan, solo partitura, sin video): 2 compases de 4/4 en semicorcheas
    cajon: [
      'B','G','G','G', 'A','G','B','G', 'B','G','G','G', 'A','G','G','G',
      'B','G','G','G', 'A','G','B','G', 'B','G','G','G', 'A','G','G','G',
    ],
    cajonBars: [4, 4],
    cajonSamplesFrom: 'r1', // suena con los golpes del compás de 12 (ritmo I), que Jordan prefirió a los de su video de los Tientos
    videoUrl: 'https://youtu.be/rpXWQAUOjCA?si=kfIQ1N8aKdiZv_4Y',
    videoEmbedUrl: 'https://www.youtube.com/embed/rpXWQAUOjCA',
  },
  {
    id: 'r8',
    roman: 'VIII',
    ebook: 'EBOOK III',
    shortTitle: 'Ritmo VIII — Tanguillos',
    scoreTitle: 'Ritmo VIII — Tanguillos',
    palos: 'Tanguillos de Cádiz.',
    palosEn: 'Tanguillos de Cádiz.',
    timeSignature: '6/8',
    bpmRange: { min: 60, max: 140, default: 85 },
    has12CountToggle: false,
    countsPhon: ['1', '2', '1', '2'],
    countsTrad: ['1', '2', '1', '2'],
    metroDownbeats: [0, 2], // Tanguillos: en el 1 de cada compás
    clockAccents: [0, 1, 2, 3],
    stepsPerBeat: 3, // 12 pasos de corchea
    steps: [
      'R', 'A', 'P', 'P', 'A', 'R',
      'R', 'A', 'P', 'P', 'A', 'R',
    ],
    // Cajón (base de Jordan, video ritmo_VIII_base_1): 2 compases de 6/8 (2 tiempos de 3 corcheas)
    cajon: ['B', 'A', 'G', 'G', 'A', 'G', 'B', 'A', 'G', 'A', 'B', 'G'],
    cajonBars: [2, 2],
    cajonSig: '6/8',
    videoUrl: 'https://youtu.be/OWfJ0ujVU8c?si=aRw1DQTpQz17vZgz',
    videoEmbedUrl: 'https://www.youtube.com/embed/OWfJ0ujVU8c',
  },
];

// Alias exportado para compatibilidad
export const RHYTHMS_DATA = PALMAS_METHOD;

// Textos según el idioma. Los nombres de los palos se dejan en español (así se usan en todo el mundo).
const ROMAN_PREFIX = /^Ritmo\s+[IVXLCDM]+\s*[—–-]\s*/;

/** "Ritmo I — Alegrías / Soleá por Bulería" o "Rhythm I — …" */
export const rhythmTitle = (r: RhythmDefinition, lang: Lang): string =>
  lang === 'en' ? r.shortTitle.replace(/^Ritmo/, 'Rhythm') : r.shortTitle;

/** Solo el nombre, sin "Ritmo I —": "Alegrías / Soleá por Bulería" */
export const rhythmName = (r: RhythmDefinition): string => r.shortTitle.replace(ROMAN_PREFIX, '');

/** Palos que se acompañan con este ritmo */
export const rhythmPalos = (r: RhythmDefinition, lang: Lang): string =>
  lang === 'en' && r.palosEn ? r.palosEn : r.palos;

// Nombre corto del palo (para el globito sobre los botones I, II, III…). Los nombres se dejan en español.
const PALO_SHORT: Record<string, string> = {
  r1: 'Alegrías · Soleá',
  r2: 'Seguiriyas',
  r3: 'Bulerías',
  r4: 'Jaleos',
  r5: 'Fandangos · Sevillanas',
  r6: 'Tangos',
  r7: 'Tientos',
  r8: 'Tanguillos',
};
export const rhythmPaloShort = (r: RhythmDefinition): string => PALO_SHORT[r.id] || rhythmName(r);

/** Cuántos patrones de palmas tiene un ritmo (el oficial más las variantes) */
export const patternCount = (r: RhythmDefinition): number => 1 + (r.patterns?.length ?? 0);

/** El ritmo con el patrón elegido (0 = el oficial). El resto de datos (cuenta, acentos del reloj, video…) es el mismo. */
export const rhythmWithPattern = (r: RhythmDefinition, patternIndex: number): RhythmDefinition => {
  const alt = patternIndex > 0 ? r.patterns?.[patternIndex - 1] : undefined;
  return alt ? { ...r, steps: alt.steps, contra: alt.contra, stepsPerBeat: alt.stepsPerBeat ?? r.stepsPerBeat, eighthRests: alt.eighthRests, patternIndex } : r;
};

/** Cuántos patrones de cajón tiene un ritmo (el oficial más las variantes) */
export const cajonPatternCount = (r: RhythmDefinition): number => (r.cajon ? 1 + (r.cajonPatterns?.length ?? 0) : 0);

/** El ritmo con el patrón de cajón elegido (0 = el oficial). */
export const rhythmWithCajonPattern = (r: RhythmDefinition, cajonPatternIndex: number): RhythmDefinition => {
  const alt = cajonPatternIndex > 0 ? r.cajonPatterns?.[cajonPatternIndex - 1] : undefined;
  return alt ? { ...r, cajon: alt.cajon, cajonPatternIndex } : r;
};

/** El ritmo con el patrón de palmas y el de cajón elegidos */
export const rhythmWithPatterns = (r: RhythmDefinition, patternIndex: number, cajonPatternIndex: number): RhythmDefinition =>
  rhythmWithCajonPattern(rhythmWithPattern(r, patternIndex), cajonPatternIndex);
