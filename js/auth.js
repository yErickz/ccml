// Arquivo exclusivo para cuidar de Login/Cadastro
import { auth, provider } from './firebase-config.js';
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user; // Retorna os dados do usuário (nome, email, foto)
    } catch (error) {
        console.error("Erro no login:", error);
        throw error;
    }
}