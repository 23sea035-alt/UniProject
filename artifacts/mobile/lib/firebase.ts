import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCyifI2F6K0aCOSkfKpwPMyA6NLjvz2pkw',
  authDomain: 'simple-4b447.firebaseapp.com',
  databaseURL: 'https://simple-4b447-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'simple-4b447',
  storageBucket: 'simple-4b447.firebasestorage.app',
  messagingSenderId: '767295346015',
  appId: '1:767295346015:web:a8a858edaf89a8feddd2ea',
  measurementId: 'G-0ZPF42THDX',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
