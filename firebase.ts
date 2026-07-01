import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// @ts-expect-error - getReactNativePersistence é exportado pelo entry point
// React Native do Firebase Auth, resolvido corretamente pelo Metro bundler
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from "./firebase.credentials";

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
