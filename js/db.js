// Arquivo exclusivo para Salvar/Ler dados
import { db } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

export async function saveEnrollment(data) {
    try {
        // Cria um documento na coleção "matriculas"
        const docRef = await addDoc(collection(db, "matriculas"), data);
        console.log("Matrícula salva com ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Erro ao adicionar documento: ", e);
        throw e;
    }
}