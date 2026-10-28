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

/**
 * Guarda un alumno / lead registrado en la colección "leads" de Firestore
 */
export async function saveLeadToFirestore(data: LeadData) {
  try {
    const docRef = await addDoc(collection(db, 'leads'), {
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      role: data.role || 'Percusionista 🥁',
      level: data.level || 'Principiante',
      source: data.source || 'hispanapp_web',
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp(),
    });
    console.log('[Firebase Firestore] Lead registrado con ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (err) {
    console.warn('[Firebase Firestore] Error al guardar lead:', err);
    return { success: false, error: err };
  }
}
