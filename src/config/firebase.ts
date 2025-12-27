import { initializeApp } from "firebase/app";
import { 
  initializeAuth, 
  // @ts-ignore: в некоторых версиях Firebase типы не видят этот экспорт, но он есть
  getReactNativePersistence, 
  getAuth 
} from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDowhUyFI0pmNUwFvH9fMos3CwLU44sVjA",
  authDomain: "destinymatrix-ec390.firebaseapp.com",
  projectId: "destinymatrix-ec390",
  storageBucket: "destinymatrix-ec390.firebasestorage.app",
  messagingSenderId: "155834953603",
  appId: "1:155834953603:web:c41b5c82050cf6125c50b6",
  measurementId: "G-B7EFCCB8V2"
};

const app = initializeApp(firebaseConfig);

// Инициализируем Auth правильно для React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);