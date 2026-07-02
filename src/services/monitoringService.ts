import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { MonitoringState } from '../types';

function estadoRef(userId: string) {
  return doc(db, 'usuarios', userId, 'estadoMonitoramento', 'estado');
}

export function subscribeMonitoringState(
  userId: string,
  callback: (state: MonitoringState | null) => void
): Unsubscribe {
  const ref = estadoRef(userId);
  return onSnapshot(ref, snapshot => {
    if (snapshot.exists()) {
      callback(snapshot.data() as MonitoringState);
    } else {
      callback(null);
    }
  });
}

export async function getMonitoringState(
  userId: string
): Promise<MonitoringState | null> {
  const snap = await getDoc(estadoRef(userId));
  return snap.exists() ? (snap.data() as MonitoringState) : null;
}

export async function setActiveAppliance(
  userId: string,
  aparelhoId: string
): Promise<void> {
  await setDoc(
    estadoRef(userId),
    {
      aparelhoAtivoId: aparelhoId,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function clearActiveAppliance(userId: string): Promise<void> {
  await setDoc(
    estadoRef(userId),
    {
      aparelhoAtivoId: null,
      atualizadoEm: serverTimestamp(),
    },
    { merge: true }
  );
}
