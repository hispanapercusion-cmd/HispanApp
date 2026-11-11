// Si el navegador bloquea el almacenamiento (modo muy restringido, cookies desactivadas), usar uno en memoria:
// la app funciona igual durante la visita en vez de quedarse en blanco.
try {
  window.localStorage.getItem('hispanapp_test');
} catch {
  const mem = new Map<string, string>();
  const fake: Storage = {
    get length() {
      return mem.size;
    },
    clear: () => mem.clear(),
    getItem: (k) => (mem.has(k) ? mem.get(k)! : null),
    key: (i) => Array.from(mem.keys())[i] ?? null,
    removeItem: (k) => void mem.delete(k),
    setItem: (k, v) => void mem.set(k, String(v)),
  };
  try {
    Object.defineProperty(window, 'localStorage', { value: fake, configurable: true });
  } catch {
    // Sin remedio: la app intentará seguir
  }
}

export {};
