import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD6dti95SJBxgRPt2u1O2pfGRrECjTXzKY",
  authDomain: "ponto-af926.firebaseapp.com",
  projectId: "ponto-af926",
  storageBucket: "ponto-af926.firebasestorage.app",
  messagingSenderId: "880185927479",
  appId: "1:880185927479:web:53df9ce864718bf6501cb2",
  measurementId: "G-F54Y68RLRW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);

// Use 'default' (without parentheses) as database ID if (default) is not found
// In many modern projects the ID might be 'default' instead of '(default)'
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, "default"); 

const googleProvider = new GoogleAuthProvider();

export { app, auth, db, analytics, googleProvider };
