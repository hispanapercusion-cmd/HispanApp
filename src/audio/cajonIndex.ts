// Índice de public/audio/cajon.bin: los 24 golpes del cajón del ritmo I, cortados del video de Jordan Migues
// (ritmo_I_base_2). PCM 16 bits, mono, 44,1 kHz (little-endian), uno detrás de otro, en el orden de la partitura.
// Tipos: B = bajo, A = agudo, G = fantasma. Volumen ya equilibrado: bajo ≈0,65 · agudo ≈0,50 · fantasma ≈0,18.
export const CAJON_SAMPLE_RATE = 44100;
export const CAJON_URL = `${import.meta.env.BASE_URL}audio/cajon.bin`;
export const CAJON_LENGTHS = [18158, 9702, 9702, 14112, 9702, 9702, 18022, 9702, 9702, 14112, 9702, 9702, 9702, 14112, 17992, 9702, 17205, 9702, 9702, 14112, 17605, 9702, 14112, 9702];
export const CAJON_TYPES = 'BGGAGGBGGAGGGABGBGGABGAG';
