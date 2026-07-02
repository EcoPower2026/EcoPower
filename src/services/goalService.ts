import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Goal } from '../types';

function metasRef(userId: string) {
  return collection(db, 'usuarios', userId, 'metas');
}

function metaRef(userId: string, metaId: string) {
  return doc(db, 'usuarios', userId, 'metas', metaId);
}

export function subscribeGoals(
  userId: string,
  callback: (goals: Goal[]) => void
): Unsubscribe {
  const q = query(metasRef(userId), orderBy('dataInicio', 'desc'));
  return onSnapshot(q, snapshot => {
    const list = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as Goal[];
    callback(list);
  });
}

export async function createGoal(
  userId: string,
  data: Omit<Goal, 'id' | 'progresso'>
): Promise<string> {
  const ref = await addDoc(metasRef(userId), {
    ...data,
    progresso: 0,
  });
  return ref.id;
}

export async function updateGoal(
  userId: string,
  metaId: string,
  data: Partial<Omit<Goal, 'id'>>
): Promise<void> {
  await updateDoc(metaRef(userId, metaId), data);
}

export async function deleteGoal(
  userId: string,
  metaId: string
): Promise<void> {
  await deleteDoc(metaRef(userId, metaId));
}
