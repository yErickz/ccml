import { auth, provider } from "./firebase-config.js";
import { signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { ADMIN_EMAILS } from "./config.js";
import { customAlert, showError } from "./utils.js";

export let currentUserRole = "professor";
export let currentUserEmail = "";

export function initAuth(callbacks = {}) {
    // Monitorar Auth State
    onAuthStateChanged(auth, (user) => {
        const isLoginPage = window.location.pathname.includes('login.html');

        if (user) {
            // User is signed in.
            currentUserEmail = user.email;
            currentUserRole = ADMIN_EMAILS.includes(user.email) ? "admin" : "professor";

            if (isLoginPage) {
                // If on login page, redirect to dashboard.
                window.location.href = 'painel_professor.html';
            }

            if (callbacks.onLogin) callbacks.onLogin();
        } else {
            // User is signed out.
            currentUserEmail = "";
            currentUserRole = "";
            
            // The onLogout callback in app.js handles redirecting from the dashboard.
            if (callbacks.onLogout) callbacks.onLogout();
        }
    });

    // Carregar e-mail salvo
    const emailInput = document.getElementById('emailInput');
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
    window.checkTeacherLogin = checkTeacherLogin;
    window.handleForgotPassword = handleForgotPassword;
}

async function handleGoogleLogin() {
    const loginButton = document.getElementById('loginButton');
    const googleButton = document.getElementById('googleLoginButton');

    if (loginButton) loginButton.disabled = true;
    if (googleButton) {
        googleButton.innerHTML = '<span class="spinner"></span> Verificando...';
        googleButton.disabled = true;
    }

    try {
        await signInWithPopup(auth, provider);
        // onAuthStateChanged will handle the redirect.
    } catch (error) {
        console.error("Erro Google:", error);
        showError("Falha no login com Google. Tente novamente.");
        if (loginButton) loginButton.disabled = false;
        if (googleButton) {
            googleButton.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google Logo"> Entrar com o Google';
            googleButton.disabled = false;
        }
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        // onAuthStateChanged will trigger the onLogout callback which redirects.
    } catch (e) { 
        console.error("Erro no logout:", e);
        window.location.href = 'login.html'; // Force redirect
    }
}

async function checkTeacherLogin() {
    const emailInput = document.getElementById('emailInput');
    const passInput = document.getElementById('passwordInput');
    const email = emailInput ? emailInput.value : '';
    const pass = passInput ? passInput.value : '';
    const errorMsg = document.getElementById('loginError');
    const loginButton = document.getElementById('loginButton');
    const remember = document.getElementById('rememberMe') ? document.getElementById('rememberMe').checked : false;

    if (!email || !pass) {
        if (errorMsg) {
            errorMsg.innerText = "Por favor, preencha e-mail e senha.";
            errorMsg.style.display = 'block';
        }
        return;
    }

    if (loginButton) {
        loginButton.innerHTML = '<span class="spinner"></span> Entrando...';
        loginButton.disabled = true;
    }
    if (errorMsg) errorMsg.style.display = 'none';

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        if (remember) localStorage.setItem('teacherEmail', email);
        else localStorage.removeItem('teacherEmail');
        // onAuthStateChanged handles success and redirect.
    } catch (error) {
        const loginBox = document.querySelector('.login-box');
        if (loginBox) {
            loginBox.classList.add('shake');
            setTimeout(() => loginBox.classList.remove('shake'), 500);
        }
        if (errorMsg) errorMsg.innerText = "E-mail ou senha inválidos. Tente novamente.";
        if (errorMsg) errorMsg.style.display = 'block';
        if (loginButton) loginButton.innerHTML = 'Entrar';
        if (loginButton) loginButton.disabled = false;
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('emailInput').value;
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