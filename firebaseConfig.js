// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from 'firebase/database';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBM_EEp_E33Bf2ShUwLtwrHrXlzHk3xBLc",
  authDomain: "filla-inteligente-trab.firebaseapp.com",
  databaseURL: "https://filla-inteligente-trab-default-rtdb.firebaseio.com",
  projectId: "filla-inteligente-trab",
  storageBucket: "filla-inteligente-trab.firebasestorage.app",
  messagingSenderId: "770758592321",
  appId: "1:770758592321:web:b8df20c086edfbddddc3c0",
  measurementId: "G-FXVH080HPY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const database = getDatabase(app);