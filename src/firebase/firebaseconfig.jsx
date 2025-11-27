// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from "firebase/firestore"
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCj7gVxzbcQTsqlxKdqPYaAUef-bREvsQw",
  authDomain: "gedarstore.firebaseapp.com",
  projectId: "gedarstore",
  storageBucket: "gedarstore.firebasestorage.app", 
  messagingSenderId: "44328477535",
  appId: "1:44328477535:web:9f8ce885a202f4590c4cea",
  measurementId: "G-XHCLTKZ3BN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const auth = getAuth(app);
