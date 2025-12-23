// Arquivo exclusivo para Salvar/Ler dados
import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

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

export async function getEnrollments() {
    try {
        // Busca na coleção "matriculas" ordenando pela data mais recente
        const q = query(collection(db, "matriculas"), orderBy("data_criacao", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Erro ao buscar matrículas:", e);
        return [];
    }
}