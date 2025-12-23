// Este arquivo só serve para conectar. Ele não faz nada na tela.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCwVHchu1YDYU1lq8fgg2BXe1mTEpFZX_E",
  authDomain: "ccml-14df7.firebaseapp.com",
  projectId: "ccml-14df7",
  storageBucket: "ccml-14df7.firebasestorage.app",
  messagingSenderId: "628928118924",
  appId: "1:628928118924:web:0bc6ef97dd420982cf3ba9",
  measurementId: "G-C12JQGGPRY"
};
// Aqui "exportamos" a conexão para ser usada nos outros arquivos
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();