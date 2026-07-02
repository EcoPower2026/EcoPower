import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export type UserProfile = {
  nome: string;
  email: string;
  tarifaKwh: number;
  dataCadastro?: any;
};

function usuarioRef(userId: string) {
  return doc(db, 'usuarios', userId);
}

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const snap = await getDoc(usuarioRef(userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export function subscribeUserProfile(
  userId: string,
  callback: (profile: UserProfile | null) => void
): Unsubscribe {
  return onSnapshot(usuarioRef(userId), snapshot => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserProfile);
    } else {
      callback(null);
    }
  });
}

export async function createUserProfile(
  userId: string,
  data: { nome: string; email: string }
): Promise<void> {
  await setDoc(usuarioRef(userId), {
    ...data,
    tarifaKwh: 0.95,
    dataCadastro: serverTimestamp(),
  });
}

export async function updateUserProfile(
  userId: string,
  data: Partial<UserProfile>
): Promise<void> {
  await setDoc(usuarioRef(userId), data, { merge: true });
}
