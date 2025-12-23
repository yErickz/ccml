// Este arquivo só serve para conectar. Ele não faz nada na tela.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "Sua-Chave-Gigante-Aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
};

// Aqui "exportamos" a conexão para ser usada nos outros arquivos
export const app = initializeApp(firebaseConfig);