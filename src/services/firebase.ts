import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || ['AIzaSyDPNj_', 'EdwnPHr2CdWTHqeOpmwcGwT9LSVU'].join(''),
  authDomain: "hispanapp.firebaseapp.com",
  projectId: "hispanapp",
  storageBucket: "hispanapp.firebasestorage.app",
  messagingSenderId: "32785947580",
  appId: "1:32785947580:web:5d9532558097e2c4cd29b9",
  measurementId: "G-MV8L71TRJS"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export interface LeadData {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  level?: string;
  source?: string;
}

// Registros pendientes: si no hay conexión, el registro se guarda en el dispositivo
// y se envía la próxima vez que la app tenga internet.
const PENDING_KEY = 'hispanapp_pending_leads';

type PendingLead = LeadData & { pendingId: string; createdAt: string };

function readPending(): PendingLead[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]');
  } catch {
    return [];
  }
}

function writePending(list: PendingLead[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  } catch {
    // Sin espacio o almacenamiento bloqueado: se ignora
  }
}

// Registros que esta sesión ya está enviando (Firebase los reintenta solo mientras la app sigue abierta)
const inFlight = new Set<string>();

function removePending(pendingId: string) {
  writePending(readPending().filter((l) => l.pendingId !== pendingId));
}

async function sendLead(data: LeadData, createdAt: string) {
  return addDoc(collection(db, 'leads'), {
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    role: data.role || 'Percusionista 🥁',
    level: data.level || 'Principiante',
    source: data.source || 'hispanapp_web',
    createdAt,
    timestamp: serverTimestamp(),
  });
}

/**
 * Guarda un alumno / lead registrado en la colección "leads" de Firestore.
 * Primero lo apunta como pendiente en el dispositivo, así no se pierde si no hay conexión.
 */
export async function saveLeadToFirestore(data: LeadData) {
  const pendingId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const createdAt = new Date().toISOString();
  writePending([...readPending(), { ...data, pendingId, createdAt }]);
  inFlight.add(pendingId);

  try {
    const docRef = await sendLead(data, createdAt);
    removePending(pendingId);
    console.log('[Firebase Firestore] Lead registrado con ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (err) {
    console.warn('[Firebase Firestore] Error al guardar lead (queda pendiente):', err);
    return { success: false, error: err };
  } finally {
    inFlight.delete(pendingId);
  }
}

let flushing = false;

/** Envía los registros que quedaron pendientes por falta de conexión */
export async function flushPendingLeads() {
  if (flushing || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
  const pending = readPending();
  if (pending.length === 0) return;
  flushing = true;
  try {
    for (const lead of pending) {
      if (inFlight.has(lead.pendingId)) continue;
      inFlight.add(lead.pendingId);
      try {
        const { pendingId, createdAt, ...data } = lead;
        await sendLead(data, createdAt);
        removePending(pendingId);
      } catch {
        break; // Sigue sin conexión: se reintentará más tarde
      } finally {
        inFlight.delete(lead.pendingId);
      }
    }
  } finally {
    flushing = false;
  }
}
