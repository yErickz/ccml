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
    e.preventDefault();
    
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
    // 1. Identificar se é a Home (pela presença da Hero Section)
    const isHome = document.querySelector('.hero') !== null;

    // --- NAVBAR ---
    const nav = document.createElement('nav');
    if (isHome) nav.classList.add('fixed-nav');

    let navContent = `
        <a href="index.html" class="logo">CCML</a>
    `;

    if (isHome) {
        navContent += `
        <ul class="nav-links">
            <li><a href="index.html">Início</a></li>
            <li><a href="valores_ccml.html">Planos</a></li>
            <li><a href="#">Sobre</a></li>
            <li><a href="matricula.html" class="btn-nav">Matrículas Abertas</a></li>
        </ul>`;
    } else {
        navContent += `
        <a href="index.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Voltar</a>
        `;
    }

    nav.innerHTML = navContent;
    document.body.prepend(nav); // Insere no topo do body

    // --- FOOTER ---
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
                <p>&copy; 2026 Centro Cultural Maestro Levi. Todos os direitos reservados.</p>
                <div class="social-icons">
                    <a href="#"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#"><i class="fa-brands fa-whatsapp"></i></a>
                    <a href="#"><i class="fa-brands fa-youtube"></i></a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(footer); // Insere no final do body
}

/* --- Inicializar Animações de Scroll --- */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 }); // Dispara quando 10% do elemento estiver visível

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

/* --- Painel do Professor --- */
function checkTeacherLogin() {
    const pass = document.getElementById('teacherPass').value;
    const errorMsg = document.getElementById('loginError');
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('teacherDashboard');

    // Senha simples para demonstração
    if (pass === '1234') {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        // Recarrega animações pois o conteúdo estava oculto
        initScrollAnimations();
    } else {
        errorMsg.style.display = 'block';
    }
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
    
    // Adiciona antes do item de "Horário Livre" para manter a estética, ou no final
    const freeSlot = list.querySelector('.free-slot');
    if(freeSlot) list.insertBefore(li, freeSlot);
    else list.appendChild(li);
    
    // Limpa e fecha
    document.getElementById('newStudent').value = '';
    toggleAddStudent();
}