// A primeira linha importa a conexão que criamos no outro arquivo
import { saveEnrollment, getEnrollments } from './db.js';
import { loginWithGoogle } from './auth.js';

const APP_VERSION = '1.0.1'; // Versão Atual do Sistema

console.log(`CCML App v${APP_VERSION} - O site carregou e já está conectado ao Firebase!`);

// --- CÓDIGO ORIGINAL MIGRADO DO SCRIPT.JS ---

// Variáveis Globais
let chatOpen = false;

// Função de inicialização
function init() {
    loadSharedComponents();
    initScrollAnimations();
    checkProgressMode();
    
    // Inicializar EmailJS (Substitua pela sua Public Key do painel)
    if(window.emailjs) emailjs.init("SUA_PUBLIC_KEY_AQUI");

    // Permitir login com Enter na área do professor
    const passInput = document.getElementById('teacherPass');
    if (passInput) {
        passInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkTeacherLogin();
        });
    }

    // Máscara de WhatsApp (Formatação Automática)
    const whatsappInput = document.getElementById('whatsapp');
    if (whatsappInput) {
        whatsappInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
            if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos
            
            if (value.length > 2) value = value.replace(/^(\d{2})(\d)/, '($1) $2'); // Adiciona DDD
            if (value.length > 7) value = value.replace(/(\d{5})(\d)/, '$1-$2'); // Adiciona hífen
            
            e.target.value = value;
        });
    }
}

// Garantir que o código rode mesmo se o evento já passou (comum em módulos)
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

/* --- Funções da Página de Matrícula --- */
async function handleEnrollment(e) {
    if(e) e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const nascimento = document.getElementById('nascimento').value;
    const whatsapp = document.getElementById('whatsapp').value;
    const curso = document.getElementById('curso').value;
    const nivel = document.getElementById('nivel').value;
    const obs = document.getElementById('obs').value;

    // --- Validação de Segurança (Anti-Malfeitores) ---
    // 1. Verifica se o nome tem pelo menos 3 letras e não é só espaço
    if (nome.trim().length < 3) {
        alert("Por favor, digite o nome completo do aluno.");
        return;
    }

    // 2. Verifica se o telefone tem o tamanho correto (10 ou 11 dígitos)
    const cleanPhone = whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        alert("Por favor, digite um número de WhatsApp válido com DDD.");
        return;
    }

    // 1. Criar objeto com os dados para o Banco
    const matriculaData = {
        nome,
        nascimento,
        whatsapp,
        curso,
        nivel,
        obs,
        data_criacao: new Date().toISOString()
    };

    // 2. Tentar salvar no Firebase
    try {
        await saveEnrollment(matriculaData);

        // 3. Enviar E-mail de Aviso (EmailJS)
        if(window.emailjs) {
            const templateParams = {
                nome: nome,
                curso: curso,
                whatsapp: whatsapp,
                nivel: nivel,
                obs: obs
            };
            // Substitua pelos IDs do seu painel EmailJS
            emailjs.send("SEU_SERVICE_ID", "SEU_TEMPLATE_ID", templateParams);
        }
        
        // Esconder formulário e mostrar mensagem de sucesso
        const form = document.getElementById('enrollmentForm');
        const successMsg = document.getElementById('successMessage');
        
        if(form) form.style.display = 'none';
        if(successMsg) successMsg.style.display = 'block';

    } catch (error) {
        alert("Houve um erro ao enviar sua matrícula. Por favor, tente novamente.");
        console.error(error);
    }
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

    // Detalhes dos Planos
    if (lowerText.includes('turma')) return "A aula em <strong>Turma</strong> (R$ 189,90) é excelente para socializar e aprender em grupo. As turmas são reduzidas para garantir a qualidade!";
    
    if (lowerText.includes('individual')) return "A aula <strong>Individual</strong> (R$ 250,00) oferece foco total no seu desenvolvimento, com o professor dedicado 100% a você.";
    
    if (lowerText.includes('inglês') || lowerText.includes('ingles')) return "O curso de <strong>Inglês Instrumental</strong> (R$ 219,90) é único! Você aprende a ler partituras e termos técnicos em inglês, essencial para músicos globais. 🌍";
    
    if (lowerText.includes('matrícula') || lowerText.includes('matricula')) return "Boa notícia: <strong>Não cobramos taxa de matrícula!</strong> 🎉 Você paga apenas a primeira mensalidade para começar.";

    // Instrumentos
    if (lowerText.includes('violão') || lowerText.includes('guitarra')) return "O Violão é um dos nossos cursos mais populares! 🎸 Ensinamos desde acordes básicos até fingerstyle avançado.";
    if (lowerText.includes('piano') || lowerText.includes('teclado')) return "Piano e Teclado são ótimos para base musical. 🎹 Temos instrumentos no local para as aulas!";
    if (lowerText.includes('bateria')) return "Quer fazer barulho (com ritmo)? 🥁 Nossas aulas de Bateria trabalham coordenação e estilos variados.";
    if (lowerText.includes('violino') || lowerText.includes('cello') || lowerText.includes('viola')) return "As cordas friccionadas trazem elegância e emoção. 🎻 Temos professores especialistas em Violino, Viola e Violoncelo.";
    if (lowerText.includes('canto') || lowerText.includes('voz') || lowerText.includes('vocal')) return "Solte a voz! 🎤 Nas aulas de Canto, trabalhamos respiração, afinação e interpretação.";
    if (lowerText.includes('sax') || lowerText.includes('flauta') || lowerText.includes('clarinete') || lowerText.includes('trompete')) return "Os sopros têm uma energia incrível! 🎷 Ensinamos Saxofone, Flauta, Clarinete e Trompete.";

    // Localização e Contato
    if (lowerText.includes('onde') || lowerText.includes('fica') || lowerText.includes('endereço') || lowerText.includes('local')) {
        return "Estamos localizados no coração da cidade! 📍 Em breve estaremos no novo espaço no <strong>Residencial Unique</strong>. Venha nos visitar!";
    }

    if (lowerText.includes('whatsapp') || lowerText.includes('telefone') || lowerText.includes('contato') || lowerText.includes('falar com')) {
        return "Você pode falar direto com nossa secretaria pelo WhatsApp: <br><br>📱 <strong>(94) 99197-2745</strong>";
    }

    // Agradecimentos
    if (lowerText.includes('obrigado') || lowerText.includes('valeu') || lowerText.includes('grato')) {
        return "Por nada! A música é para todos. 🎶 Se tiver mais dúvidas, é só chamar!";
    }

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
    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-grid">
                <div class="footer-col">
                    <h3>CCML</h3>
                    <p>Aulas presenciais e online para todas as idades. Venha conhecer o CCML — mais visível, mais som, mais arte.</p>
                    <p>
                        <strong>Contato:</strong><br>
                        <a href="tel:+5594991972745" style="color:var(--gold);text-decoration:none;">(94) 99197-2745</a><br>
                        <a href="mailto:contato@ccml.com.br" style="color:var(--gold);text-decoration:none;">contato@ccml.com.br</a>
                    </p>
                </div>

                <div class="footer-col">
                    <h4>Links Rápidos</h4>
                    <ul class="footer-links">
                        <li><a href="matricula.html">Matrículas</a></li>
                        <li><a href="valores_ccml.html">Investimento</a></li>
                        <li><a href="progresso.html">Acompanhar Progresso</a></li>
                        <li><a href="painel_professor.html">Área do Professor</a></li>
                        <li><a href="#">Eventos</a></li>
                        <li><a href="#">Sobre</a></li>
                    </ul>
                </div>

                <div class="footer-col">
                    <h4>Receba Novidades</h4>
                    <p>Siga-nos nas redes para ver apresentações e novidades.</p>
                    <form class="newsletter-form" onsubmit="event.preventDefault(); alert('Obrigado! Você foi inscrito.');">
                        <input type="email" class="newsletter-input" placeholder="Seu melhor e-mail" required>
                        <button type="submit" class="btn-newsletter">Inscrever</button>
                    </form>
                </div>
            </div>

            <div class="footer-bottom">
                <p>&copy; 2026 Centro Cultural Maestro Levi. Todos os direitos reservados. <span style="opacity: 0.5; font-size: 0.8em; margin-left: 10px;">v${APP_VERSION}</span></p>
                <div class="social-icons">
                    <a href="#"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#"><i class="fa-brands fa-whatsapp"></i></a>
                    <a href="#"><i class="fa-brands fa-youtube"></i></a>
                </div>
            </div>
        </div>
    `;
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
async function handleGoogleLogin() {
    const errorMsg = document.getElementById('loginError');
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('teacherDashboard');

    try {
        const user = await loginWithGoogle();
        console.log("Professor logado:", user.displayName);
        
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        loadDashboardData(); // <--- Carrega a tabela
        initScrollAnimations();
    } catch (error) {
        errorMsg.style.display = 'block';
        errorMsg.textContent = "Erro ao conectar com Google. Tente novamente.";
    }
}

function checkTeacherLogin() {
    const pass = document.getElementById('teacherPass').value;
    const errorMsg = document.getElementById('loginError');
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('teacherDashboard');

    if (pass === '1234') {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        loadDashboardData(); // <--- Carrega a tabela
        initScrollAnimations();
    } else {
        errorMsg.style.display = 'block';
        errorMsg.textContent = "Senha incorreta!";
    }
}

async function loadDashboardData() {
    const list = document.getElementById('enrollmentList');
    const loading = document.getElementById('loadingMsg');
    
    if (!list) return;

    const enrollments = await getEnrollments();
    if(loading) loading.style.display = 'none';

    if (enrollments.length === 0) {
        list.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Nenhuma matrícula encontrada.</td></tr>';
        return;
    }

    list.innerHTML = enrollments.map(aluno => {
        const dataFormatada = aluno.data_criacao ? new Date(aluno.data_criacao).toLocaleDateString('pt-BR') : '-';
        return `
            <tr>
                <td>${dataFormatada}</td>
                <td style="font-weight:bold;">${aluno.nome}</td>
                <td>${aluno.curso}</td>
                <td><a href="https://wa.me/55${aluno.whatsapp.replace(/\D/g, '')}" target="_blank" style="color:var(--gold); text-decoration:none;"><i class="fa-brands fa-whatsapp"></i> ${aluno.whatsapp}</a></td>
                <td>${aluno.nivel}</td>
            </tr>
        `;
    }).join('');
}

function generateFeedback() {
    const name = document.getElementById('fbName').value;
    const topic = document.getElementById('fbTopic').value;
    const rating = document.getElementById('fbRating').value;
    const homework = document.getElementById('fbHomework').value;

    if(!name) { alert("Preencha o nome do aluno!"); return; }

    const text = `🎵 *Feedback da Aula - CCML*\n\n` +
                 `👤 *Aluno:* ${name}\n` +
                 `🎼 *Tema:* ${topic}\n` +
                 `📊 *Desempenho:* ${rating}\n` +
                 `🏠 *Para Casa:* ${homework}\n\n` +
                 `Até a próxima aula! 👋`;

    navigator.clipboard.writeText(text);
    alert("Mensagem copiada! Agora cole no WhatsApp.");
}

/* --- Funções da Página de Progresso --- */
function generateShareLink() {
    const name = document.getElementById('studentName').value;
    if(!name) { alert("Por favor, digite seu nome."); return; }

    const checks = document.querySelectorAll('.skill-check:checked');
    const skills = Array.from(checks).map(c => c.value);

    if(skills.length === 0) { alert("Marque pelo menos uma conquista!"); return; }

    // Criar URL com parâmetros
    const params = new URLSearchParams();
    params.set('name', name);
    params.set('skills', JSON.stringify(skills));
    params.set('date', new Date().toLocaleDateString('pt-BR'));

    const baseUrl = window.location.href.split('?')[0];
    const shareUrl = `${baseUrl}?${params.toString()}`;

    document.getElementById('shareUrl').value = shareUrl;
    document.getElementById('shareResult').style.display = 'block';
}

function copyLink() {
    const copyText = document.getElementById("shareUrl");
    copyText.select();
    copyText.setSelectionRange(0, 99999); // Para mobile
    navigator.clipboard.writeText(copyText.value);
    alert("Link copiado!");
}

function checkProgressMode() {
    // Verifica se há parâmetros na URL (Modo Visualização)
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const skills = params.get('skills');
    const date = params.get('date');

    if(name && skills) {
        const editMode = document.getElementById('editMode');
        const viewMode = document.getElementById('viewMode');
        
        if(editMode && viewMode) {
            editMode.style.display = 'none';
            viewMode.style.display = 'block';
            
            document.getElementById('viewName').textContent = name;
            document.getElementById('viewDate').textContent = date || 'Data desconhecida';
            
            const skillsList = JSON.parse(skills);
            const ul = document.getElementById('viewSkills');
            ul.innerHTML = skillsList.map(s => `<li><i class="fa-solid fa-check" style="color:var(--gold); margin-right:10px;"></i> ${s}</li>`).join('');
        }
    }
}

/* --- Funcionalidade de Agenda --- */
function toggleAddStudent() {
    const form = document.getElementById('addStudentForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function addStudent() {
    const time = document.getElementById('newTime').value;
    const name = document.getElementById('newStudent').value;
    const list = document.querySelector('.agenda-list');

    if(!time || !name) { alert("Preencha horário e nome!"); return; }

    const li = document.createElement('li');
    li.innerHTML = `<span class="time">${time}</span><span class="student">${name}</span>`;
    
    const freeSlot = list.querySelector('.free-slot');
    if(freeSlot) list.insertBefore(li, freeSlot);
    else list.appendChild(li);
    
    document.getElementById('newStudent').value = '';
    toggleAddStudent();
}

// --- EXPOR FUNÇÕES PARA O HTML (IMPORTANTE PARA MÓDULOS) ---
// Como é um módulo, as funções não são globais por padrão.
// Precisamos anexá-las ao objeto window para que o onclick="" do HTML funcione.

window.handleEnrollment = handleEnrollment;
window.toggleChat = toggleChat;
window.selectPlan = selectPlan;
window.handleKeyPress = handleKeyPress;
window.sendMessage = sendMessage;
window.handleGoogleLogin = handleGoogleLogin;
window.checkTeacherLogin = checkTeacherLogin;
window.generateFeedback = generateFeedback;
window.toggleAddStudent = toggleAddStudent;
window.addStudent = addStudent;
window.generateShareLink = generateShareLink;
window.copyLink = copyLink;