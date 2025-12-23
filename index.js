// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, collection, addDoc } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCwVHchu1YDYU1lq8fgg2BXe1mTEpFZX_E",
  authDomain: "ccml-14df7.firebaseapp.com",
  projectId: "ccml-14df7",
  storageBucket: "ccml-14df7.firebasestorage.app",
  messagingSenderId: "628928118924",
  appId: "1:628928118924:web:0bc6ef97dd420982cf3ba9",
  measurementId: "G-C12JQGGPRY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Analytics só funciona no navegador, então verificamos antes de iniciar
if (typeof window !== "undefined") {
  const analytics = getAnalytics(app);
} else {
  console.log("Firebase inicializado com sucesso! (Analytics ignorado no Node.js)");
}

// Função para salvar um documento de teste no Firestore
async function salvarTeste() {
  try {
    const docRef = await addDoc(collection(db, "testes"), {
      mensagem: "Olá, Firestore!",
      data: new Date().toISOString(),
      usuario: "Eric"
    });
    console.log("✅ Documento salvo com sucesso! ID:", docRef.id);
  } catch (e) {
    console.error("❌ Falha ao salvar:", e.code, "-", e.message);
    
    if (e.code === 'permission-denied') {
      console.log("\n⚠️  SOLUÇÃO (Permissão):");
      console.log("   Vá no Console Firebase > Firestore Database > Aba 'Regras'.");
      console.log("   Mude para: allow read, write: if true; (apenas para testes).");
      console.log("   Clique em 'Publicar' e tente novamente.");
    }
  }
}

salvarTeste();