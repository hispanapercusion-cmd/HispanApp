// Índice de public/audio/palmas.bin: muestras reales de palmas de Jordan Migues
// en PCM 16 bits, mono, 44,1 kHz (little-endian), una detrás de otra.
// Primero las 14 de palma brillante (Ritmo I) y después las 6 de palma sorda (Ritmo VII).
export const SAMPLE_RATE = 44100;
export const PALMAS_URL = `${import.meta.env.BASE_URL}audio/palmas.bin`;
export const AGUDA_LENGTHS = [14112, 12587, 14112, 14112, 14112, 14112, 14112, 11984, 11937, 14112, 11772, 11903, 14112, 16758];
export const SORDA_LENGTHS = [15876, 15876, 15876, 15876, 15876, 15876];
