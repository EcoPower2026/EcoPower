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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Appliance } from '../types';

function aparelhosRef(userId: string) {
  return collection(db, 'usuarios', userId, 'aparelhos');
}

function aparelhoRef(userId: string, aparelhoId: string) {
  return doc(db, 'usuarios', userId, 'aparelhos', aparelhoId);
}

export function subscribeAppliances(
  userId: string,
  callback: (appliances: Appliance[]) => void
): Unsubscribe {
  const q = query(aparelhosRef(userId), orderBy('dataCadastro', 'desc'));
  return onSnapshot(q, snapshot => {
    const list = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as Appliance[];
    callback(list);
  });
}

export async function createAppliance(
  userId: string,
  data: { nome: string; descricao: string }
): Promise<string> {
  const ref = await addDoc(aparelhosRef(userId), {
    ...data,
    dataCadastro: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAppliance(
  userId: string,
  aparelhoId: string,
  data: { nome: string; descricao: string }
): Promise<void> {
  await updateDoc(aparelhoRef(userId, aparelhoId), data);
}

export async function deleteAppliance(
  userId: string,
  aparelhoId: string
): Promise<void> {
  await deleteDoc(aparelhoRef(userId, aparelhoId));
}
