import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { flushPendingLeads } from './services/firebase';

createRoot(document.getElementById('root')!).render(<App />);

// Guardar la app en el dispositivo para usarla sin conexión (solo en la versión publicada)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.warn('[Offline] No se pudo activar el modo sin conexión:', err);
    });
  });
}

// Enviar los registros de alumnos que se hicieron sin conexión
flushPendingLeads();
window.addEventListener('online', () => flushPendingLeads());
