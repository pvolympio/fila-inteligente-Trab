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
  authDomain: "fila-inteligente-a7251.firebaseapp.com",
  databaseURL: "https://fila-inteligente-a7251-default-rtdb.firebaseio.com",
  projectId: "fila-inteligente-a7251",
  storageBucket: "fila-inteligente-a7251.appspot.com",
  messagingSenderId: "770758592321",
  appId: "1:770758592321:web:b8df20c086edfbddddc3c0",
  measurementId: "G-FXVH080HPY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const database = getDatabase(app);