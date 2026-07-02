import {
  collection,
  doc,
  addDoc,
  query,
  orderBy,
  where,
  limit,
  onSnapshot,
  Unsubscribe,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { EnergyReading } from '../types';

function leiturasRef(userId: string) {
  return collection(db, 'usuarios', userId, 'leituras');
}

export async function createReading(
  userId: string,
  data: Omit<EnergyReading, 'id'>
): Promise<string> {
  const ref = await addDoc(leiturasRef(userId), data);
  return ref.id;
}

export function subscribeReadings(
  userId: string,
  callback: (readings: EnergyReading[]) => void
): Unsubscribe {
  const q = query(leiturasRef(userId), orderBy('timestamp', 'desc'), limit(500));
  return onSnapshot(q, snapshot => {
    const list = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as EnergyReading[];
    callback(list);
  });
}

export async function getReadingsInRange(
  userId: string,
  start: string,
  end: string
): Promise<EnergyReading[]> {
  const q = query(
    leiturasRef(userId),
    where('timestamp', '>=', start),
    where('timestamp', '<=', end),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as EnergyReading[];
}

export async function getDailyReadings(
  userId: string
): Promise<EnergyReading[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  return getReadingsInRange(userId, start.toISOString(), end.toISOString());
}

export async function getWeeklyReadings(
  userId: string
): Promise<EnergyReading[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  return getReadingsInRange(userId, start.toISOString(), end.toISOString());
}

export async function getMonthlyReadings(
  userId: string
): Promise<EnergyReading[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  return getReadingsInRange(userId, start.toISOString(), end.toISOString());
}

export async function getReadingsByAppliance(
  userId: string,
  applianceId: string
): Promise<EnergyReading[]> {
  const q = query(
    leiturasRef(userId),
    where('applianceId', '==', applianceId),
    orderBy('timestamp', 'desc'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as EnergyReading[];
}
