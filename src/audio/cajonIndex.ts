// Índices de las muestras de cajón de Jordan Migues: golpes cortados de sus videos, en el orden de cada partitura.
// PCM 16 bits, mono, 44,1 kHz (little-endian), uno detrás de otro. Tipos: B = bajo, A = agudo, G = fantasma.
// Volumen ya equilibrado: bajo ≈0,65 · agudo ≈0,50 · fantasma ≈0,18.
// Cada banco es de UN ritmo (el id es el del ritmo): sus golpes suenan "exactos" en ese ritmo; los ritmos sin banco
// propio usan golpes de cualquier banco, elegidos al azar según su tipo.
export const CAJON_SAMPLE_RATE = 44100;

export interface CajonBank {
  url: string;
  lengths: number[];
  types: string;
}

export const CAJON_BANKS: Record<string, CajonBank> = {
  // Ritmo I (video ritmo_I_base_2): 24 corcheas
  r1: {
    url: `${import.meta.env.BASE_URL}audio/cajon.bin`,
    lengths: [18158, 9702, 9702, 14112, 9702, 9702, 18022, 9702, 9702, 14112, 9702, 9702, 9702, 14112, 17992, 9702, 17205, 9702, 9702, 14112, 17605, 9702, 14112, 9702],
    types: 'BGGAGGBGGAGGGABGBGGABGAG',
  },
  // Ritmo VI (video ritmo_VI_base_2): 16 corcheas
  r6: {
    url: `${import.meta.env.BASE_URL}audio/cajon-r6.bin`,
    lengths: [9702, 9702, 12092, 11618, 9702, 9702, 12131, 9702, 9702, 9702, 12488, 11778, 9702, 9702, 12865, 9702],
    types: 'GGABGGBGGGABGGBG',
  },
  // Ritmo III (video ritmo_III_pt._1): 24 semicorcheas
  r3: {
    url: `${import.meta.env.BASE_URL}audio/cajon-r3.bin`,
    lengths: [11935, 9702, 9702, 13108, 9702, 9702, 12415, 9702, 9702, 12881, 9702, 9702, 12223, 9702, 9702, 12670, 9702, 9702, 12357, 9702, 9702, 12951, 9702, 9702],
    types: 'BGGAGGAGGAGGBGGAGGAGGAGG',
  },
  // Ritmo VIII (video ritmo_VIII_base_1): 12 corcheas en 6/8
  r8: {
    url: `${import.meta.env.BASE_URL}audio/cajon-r8-v2.bin`,
    lengths: [11724, 10519, 10585, 12699, 10909, 12222, 13204, 10546, 11798, 14141, 10604, 17640],
    types: 'BAGGAGBAGABG',
  },
  // Ritmo VII (video ritmo_VII_base_1): 32 semicorcheas en 4/4
  r7: {
    url: `${import.meta.env.BASE_URL}audio/cajon-r7-v1.bin`,
    lengths: [10845,  11316,  11323,  12869,  11543,  11314,  11634,  13140,  10471,  12042,  11544,  12863,  11849,  11277,  11493,  12548,  10916,  12759,  11093,  12839,  11670,  11608,  11645,  12460,  11265,  11359,  11292,  12335,  11359,  12425,  12099,  13230],
    types: 'BGGGAGBGBGGGAGGGBGGGAGBGBGGGAGGG',
  },
};
