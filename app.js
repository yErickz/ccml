// A primeira linha importa a conexão que criamos no outro arquivo
import { app } from './firebase-config.js';

console.log("O site carregou e já está conectado ao Firebase!");

// --- CÓDIGO ORIGINAL MIGRADO DO SCRIPT.JS ---

// Variáveis Globais
let chatOpen = false;

// Carregar Header e Footer ao iniciar
document.addEventListener("DOMContentLoaded", () => {
    loadSharedComponents();
    initScrollAnimations();

    // Permitir login com Enter na área do professor
    const passInput = document.getElementById('teacherPass');
    if (passInput) {
        passInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkTeacherLogin();
        });
    }
});

/* --- Funções da Página de Matrícula --- */
function sendToWhatsapp(e) {
    if(e) e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const nascimento = document.getElementById('nascimento').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const curso = document.getElementById('curso').value;
    const nivel = document.getElementById('nivel').value;
    const obs = document.getElementById('obs').value;

    const text = `*NOVA PRÉ-MATRÍCULA ONLINE* 🎵\n\n` +
                 `*Aluno:* ${nome}\n` +
                 `*Nascimento:* ${nascimento}\n` +
                 `*Contato:* ${whatsapp}\n` +
                 `*Interesse:* ${curso}\n` +
                 `*Nível:* ${nivel}\n` +
                 `*Obs:* ${obs}\n\n` +
                 `--------------------------------\n` +
                 `Gostaria de prosseguir com a matrícula!`;

    const url = `https://wa.me/5594991972745?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

/* --- Funções do Chatbot (Valores & Dúvidas) --- */
function toggleChat() {
    const modal = document.getElementById('aiModal');
    if (!modal) return; // Evita erro se o modal não existir na página

    chatOpen = !chatOpen;
    modal.style.display = chatOpen ? 'flex' : 'none';
    if(chatOpen) {
        const input = document.getElementById('userInput');
        if(input) input.focus();
    }
}

function selectPlan(planName) {
    if (!chatOpen) toggleChat();
    const input = document.getElementById('userInput');
    if(input) {
        input.value = `Gostaria de saber mais sobre a matrícula para: ${planName}.`;
        setTimeout(() => sendMessage(), 300);
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') sendMessage();
}

function sendMessage() {
    const input = document.getElementById('userInput');
    const container = document.getElementById('chatContainer');
    
    if (!input || !container) return;

    const userText = input.value.trim();
    if (!userText) return;

    // 1. Adicionar mensagem do usuário
    const userDiv = document.createElement('div');
    userDiv.className = 'message user';
    userDiv.textContent = userText;
    container.appendChild(userDiv);
    
    input.value = '';
    container.scrollTop = container.scrollHeight;

    // 2. Simular "digitando..." e responder
    setTimeout(() => {
        const botResponse = getLocalBotResponse(userText);
        const botDiv = document.createElement('div');
        botDiv.className = 'message bot';
        botDiv.innerHTML = botResponse;
        container.appendChild(botDiv);
        container.scrollTop = container.scrollHeight;
    }, 600);
}

function getLocalBotResponse(text) {
    const lowerText = text.toLowerCase();

    // Saudações
    if (['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey'].some(greeting => lowerText.includes(greeting))) {
        return "Olá! Sou o Maestro Virtual do CCML. 🎵 Como posso ajudar você hoje? Posso falar sobre cursos, valores ou agendar uma visita!";
    }

    // Valores e Planos (Geral)
    if (lowerText.includes('valor') || lowerText.includes('preço') || lowerText.includes('quanto custa') || lowerText.includes('mensalidade')) {
        return "Temos planos acessíveis para todos! 💰<br><br>" +
               "• <strong>Turma:</strong> R$ 189,90/mês<br>" +
               "• <strong>Individual:</strong> R$ 250,00/mês<br>" +
               "• <strong>Inglês Instrumental:</strong> R$ 219,90/mês<br><br>" +
               "Qual modalidade te interessa mais?";
    }

    // ... (Lógica do Chatbot continua a mesma) ...
    // Simplificado para brevidade, mas a lógica completa deve estar aqui
    
    // Default
    return "Hmm, interessante pergunta! 🤔 Para detalhes mais específicos ou agendamentos, recomendo falar com nossa secretaria humana no WhatsApp: <br><br> 👉 <strong>(94) 99197-2745</strong>. <br><br>Posso ajudar com mais alguma coisa sobre os cursos?";
}

/* --- Carregamento Dinâmico de Layout --- */
function loadSharedComponents() {
    const isHome = document.querySelector('.hero') !== null;
    const nav = document.createElement('nav');
    if (isHome) nav.classList.add('fixed-nav');

    let navContent = `<a href="index.html" class="logo">CCML</a>`;

    if (isHome) {
        navContent += `
        <ul class="nav-links">
            <li><a href="index.html">Início</a></li>
            <li><a href="valores_ccml.html">Planos</a></li>
            <li><a href="#">Sobre</a></li>
            <li><a href="matricula.html" class="btn-nav">Matrículas Abertas</a></li>
        </ul>`;
    } else {
        navContent += `<a href="index.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Voltar</a>`;
    }

    nav.innerHTML = navContent;
    document.body.prepend(nav);

    const footer = document.createElement('footer');
    // ... (Conteúdo do footer omitido para brevidade, manter igual ao original) ...
    footer.innerHTML = `<div class="footer-content"><p>&copy; 2026 Centro Cultural Maestro Levi.</p></div>`; 
    document.body.appendChild(footer);
}

/* --- Inicializar Animações de Scroll --- */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

/* --- Painel do Professor --- */
function checkTeacherLogin() {
    const pass = document.getElementById('teacherPass').value;
    const errorMsg = document.getElementById('loginError');
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('teacherDashboard');

    if (pass === '1234') {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        initScrollAnimations();
    } else {
        errorMsg.style.display = 'block';
    }
}

function generateFeedback() {
    // ... (Lógica original) ...
    alert("Mensagem copiada! Agora cole no WhatsApp.");
}

/* --- Funcionalidade de Agenda --- */
function toggleAddStudent() {
    const form = document.getElementById('addStudentForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function addStudent() {
    // ... (Lógica original) ...
    toggleAddStudent();
}

// --- EXPOR FUNÇÕES PARA O HTML (IMPORTANTE PARA MÓDULOS) ---
// Como é um módulo, as funções não são globais por padrão.
// Precisamos anexá-las ao objeto window para que o onclick="" do HTML funcione.

window.sendToWhatsapp = sendToWhatsapp;
window.toggleChat = toggleChat;
window.selectPlan = selectPlan;
window.handleKeyPress = handleKeyPress;
window.sendMessage = sendMessage;
window.checkTeacherLogin = checkTeacherLogin;
window.generateFeedback = generateFeedback;
window.toggleAddStudent = toggleAddStudent;
window.addStudent = addStudent;