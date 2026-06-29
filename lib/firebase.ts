import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfigData from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
  authDomain: firebaseConfigData.authDomain || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-domain.firebaseapp.com",
  projectId: firebaseConfigData.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: firebaseConfigData.storageBucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-bucket.appspot.com",
  messagingSenderId: firebaseConfigData.messagingSenderId || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: firebaseConfigData.appId || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:mock123"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app, firebaseConfigData.firestoreDatabaseId || "(default)");
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
