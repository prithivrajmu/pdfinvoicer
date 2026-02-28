import { initializeApp, type FirebaseApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    type User,
    type Auth,
} from "firebase/auth";

// ⚠️ Replace with your own Firebase config from:
// https://console.firebase.google.com → Project Settings → Web App
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export const isFirebaseConfigured =
    !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "your-api-key";

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        authInstance = getAuth(app);
    } catch (err) {
        console.error("Firebase init error:", err);
    }
}

export const auth = authInstance;

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
    if (!auth) throw new Error("Firebase not configured");
    return signInWithPopup(auth, googleProvider);
};

export const signInWithEmail = (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not configured");
    return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not configured");
    return createUserWithEmailAndPassword(auth, email, password);
};

export const signOut = () => {
    if (!auth) throw new Error("Firebase not configured");
    return firebaseSignOut(auth);
};

export { onAuthStateChanged, type User };
