import { auth, provider } from "./firebase-config.js";
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { ADMIN_EMAILS } from "./config.js";
import { customAlert, showError } from "./utils.js";

export let currentUserRole = "professor";
export let currentUserEmail = "";

export function initAuth(callbacks = {}) {
    // Monitorar Auth State
    onAuthStateChanged(auth, (user) => {
        if (user) {
            if (ADMIN_EMAILS.includes(user.email) || user.email.startsWith('admin')) {
                currentUserRole = "admin";
            } else {
                currentUserRole = "professor";
            }
            currentUserEmail = user.email;

            // UI Updates
            const loginScreen = document.getElementById('loginScreen');
            const dashboard = document.getElementById('teacherDashboard');
            const nav = document.querySelector('nav');
            
            if (loginScreen) loginScreen.style.display = 'none';
            if (dashboard) dashboard.style.display = 'block';
            if (nav) nav.style.display = 'none';

            if (callbacks.onLogin) callbacks.onLogin();
        } else {
            const loginScreen = document.getElementById('loginScreen');
            const dashboard = document.getElementById('teacherDashboard');
            
            if (dashboard) dashboard.style.display = 'none';
            if (loginScreen) loginScreen.style.display = 'flex';
        }
    });

    // Carregar e-mail salvo
    const emailInput = document.getElementById('teacherEmail');
    if (emailInput) {
        const savedEmail = localStorage.getItem('teacherEmail');
        if (savedEmail) {
            emailInput.value = savedEmail;
            const rememberCheck = document.getElementById('rememberMe');
            if (rememberCheck) rememberCheck.checked = true;
        }
    }

    // Expor funções globais
    window.handleGoogleLogin = handleGoogleLogin;
    window.handleLogout = handleLogout;
    window.checkTeacherLogin = (e) => checkTeacherLogin(e, callbacks.onLogin);
    window.handleForgotPassword = handleForgotPassword;
    window.togglePasswordVisibility = togglePasswordVisibility;
}

async function handleGoogleLogin() {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Erro Google:", error);
        showError("Erro no login: " + error.message);
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
    } catch (e) { console.log("Logout local"); }
    
    // Reset UI
    document.getElementById('teacherDashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    document.querySelector('nav').style.display = 'flex';
    document.getElementById('teacherPass').value = '';
}

async function checkTeacherLogin(e, onLoginSuccess) {
    const email = document.getElementById('teacherEmail').value;
    const pass = document.getElementById('teacherPass').value;
    const errorMsg = document.getElementById('loginError');
    const remember = document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : false;

    if (email && pass) {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            if (remember) localStorage.setItem('teacherEmail', email);
            else localStorage.removeItem('teacherEmail');
            if (errorMsg) errorMsg.style.display = 'none';
        } catch (error) {
            if (errorMsg) {
                errorMsg.innerText = "Senha incorreta ou usuário não encontrado.";
                errorMsg.style.display = 'block';
            }
        }
        return;
    }

    // Fallback: Login Simples (Demo)
    // ⚠️ ATENÇÃO: Remova este bloco em produção para segurança!
    if (!email && (pass === "admin123" || pass === "maestro")) {
        currentUserRole = (pass === "admin123") ? "admin" : "professor";
        currentUserEmail = (pass === "admin123") ? "admin@ccml.com.br" : "professor@ccml.com.br";
        
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('teacherDashboard').style.display = 'block';
        document.querySelector('nav').style.display = 'none';
        
        if (onLoginSuccess) onLoginSuccess();
        if (errorMsg) errorMsg.style.display = 'none';
    } else {
        if (errorMsg) {
            errorMsg.innerText = "Senha incorreta!";
            errorMsg.style.display = 'block';
        }
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('teacherEmail').value;
    if (!email) {
        customAlert("Preencha o e-mail para recuperar a senha.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        customAlert("E-mail de redefinição enviado!", "Sucesso");
    } catch (error) {
        showError("Erro: " + error.message);
    }
}

function togglePasswordVisibility() {
    const passInput = document.getElementById('teacherPass');
    const icon = document.querySelector('.toggle-password');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}