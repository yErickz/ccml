// Este arquivo só serve para conectar. Ele não faz nada na tela.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

const firebaseConfig = {
  // COLE AQUI O CÓDIGO QUE O FIREBASE TE DEU
  apiKey: "AIzaSyD...", 
  authDomain: "ccml-projeto.firebaseapp.com",
  projectId: "ccml-projeto",
  storageBucket: "ccml-projeto.appspot.com",
  messagingSenderId: "123456...",
  appId: "1:123456..."
};

// Aqui "exportamos" a conexão para ser usada nos outros arquivos
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();