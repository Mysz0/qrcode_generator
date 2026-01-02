// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDl1NfXjShEbrvkwafbW8bGJyAp89ceVR8",
  authDomain: "qrcode-generator-16535.firebaseapp.com",
  projectId: "qrcode-generator-16535",
  storageBucket: "qrcode-generator-16535.firebasestorage.app",
  messagingSenderId: "448969259756",
  appId: "1:448969259756:web:a11fc0aafbcaebca0683c9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const signInWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);
