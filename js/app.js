import { db, auth, provider } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// --- 1. Animações de Scroll ---
const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

// --- 2. Chatbot IA (Simulado) ---
window.toggleChat = () => {
    const modal = document.getElementById('aiModal');
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
};

window.sendMessage = () => {
    const input = document.getElementById('userInput');
    const container = document.getElementById('chatContainer');
    const text = input.value.trim();
    
    if (text) {
        // Mensagem do Usuário
        container.innerHTML += `<div class="message user">${text}</div>`;
        input.value = '';
        
        // Resposta Automática (Simulação)
        setTimeout(() => {
            let reply = "Que interessante! Para essa questão específica, recomendo agendar uma visita. Nossos professores adorariam te conhecer!";
            if(text.toLowerCase().includes('preço') || text.toLowerCase().includes('valor')) reply = "Temos planos a partir de R$ 189,90. Confira nossa página de Valores!";
            if(text.toLowerCase().includes('piano')) reply = "O curso de Piano é um dos mais procurados! Temos horários flexíveis.";
            
            container.innerHTML += `<div class="message bot">${reply}</div>`;
            container.scrollTop = container.scrollHeight;
        }, 1000);
    }
};

window.handleKeyPress = (e) => {
    if (e.key === 'Enter') window.sendMessage();
};

// --- 3. Matrícula (Salvar no Firebase) ---
window.handleEnrollment = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "Enviando...";
    btn.disabled = true;

    try {
        const dados = {
            nome: document.getElementById('nome').value,
            nascimento: document.getElementById('nascimento').value,
            whatsapp: document.getElementById('whatsapp').value,
            curso: document.getElementById('curso').value,
            nivel: document.getElementById('nivel').value,
            responsavel: document.getElementById('responsavel')?.value || "N/A",
            parentesco: document.getElementById('parentesco')?.value || "N/A",
            obs: document.getElementById('obs').value,
            data_registro: new Date().toISOString()
        };

        await addDoc(collection(db, "matriculas"), dados);

        document.getElementById('enrollmentForm').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        
        // Opcional: Enviar email via EmailJS se configurado
        // emailjs.sendForm('service_id', 'template_id', e.target, 'user_id');

    } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao enviar matrícula. Tente novamente.");
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

// --- 4. Painel do Professor ---

// Login com Google
window.handleGoogleLogin = async () => {
    try {
        await signInWithPopup(auth, provider);
        // O onAuthStateChanged vai lidar com a troca de tela
    } catch (error) {
        alert("Erro no login: " + error.message);
    }
};

// Login com Senha (Simples)
window.checkTeacherLogin = () => {
    const pass = document.getElementById('teacherPass').value;
    if(pass === "admin123" || pass === "maestro") { // Senha simples para demo
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('teacherDashboard').style.display = 'block';
        loadDashboardData();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
};

// Monitorar Auth State
if (window.location.pathname.includes('painel_professor')) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('teacherDashboard').style.display = 'block';
            loadDashboardData();
        }
    });
}

// Carregar Dados do Dashboard
async function loadDashboardData() {
    const list = document.getElementById('enrollmentList');
    if (!list) return;

    list.innerHTML = "";
    
    try {
        const q = query(collection(db, "matriculas"), orderBy("data_registro", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            document.getElementById('loadingMsg').innerText = "Nenhuma matrícula recente.";
            return;
        }

        document.getElementById('loadingMsg').style.display = 'none';

        querySnapshot.forEach((doc) => {
            const d = doc.data();
            const date = new Date(d.data_registro).toLocaleDateString('pt-BR');
            
            const row = `
                <tr>
                    <td>${date}</td>
                    <td>
                        <strong>${d.nome}</strong><br>
                        <small style="color:#777">${d.responsavel !== "N/A" ? 'Resp: ' + d.responsavel : ''}</small>
                    </td>
                    <td><span class="badge-curso">${d.curso}</span></td>
                    <td>
                        <a href="https://wa.me/55${d.whatsapp.replace(/\D/g,'')}" target="_blank" style="color: var(--gold); font-weight:bold;">
                            <i class="fa-brands fa-whatsapp"></i> Contatar
                        </a>
                    </td>
                    <td>${d.nivel}</td>
                </tr>
            `;
            list.innerHTML += row;
        });
    } catch (e) {
        console.error("Erro ao carregar lista:", e);
        document.getElementById('loadingMsg').innerText = "Erro de permissão ou conexão.";
    }
}

// Funções Auxiliares do Painel
window.generateFeedback = () => {
    const name = document.getElementById('fbName').value;
    const topic = document.getElementById('fbTopic').value;
    const rating = document.getElementById('fbRating').value;
    const homework = document.getElementById('fbHomework').value;

    const msg = `Olá! Aqui é do CCML. 🎵\nFeedback da aula de hoje com ${name}:\n\n- Tema: ${topic}\n- Desempenho: ${rating}\n- Para casa: ${homework}\n\nAté a próxima aula!`;
    
    navigator.clipboard.writeText(msg);
    alert("Mensagem copiada! Agora cole no WhatsApp.");
};

window.toggleAddStudent = () => {
    const form = document.getElementById('addStudentForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
};

window.selectPlan = (planName) => {
    alert(`Ótima escolha! O plano "${planName}" é excelente. Redirecionando para o WhatsApp da secretaria...`);
    window.open(`https://wa.me/5594999999999?text=Olá, tenho interesse no plano ${planName}`, '_blank');
};

// --- Menu Mobile ---
window.toggleMenu = () => {
    const nav = document.querySelector('.nav-links');
    nav.classList.toggle('active');
};

// --- 5. Rodapé Dinâmico (Carrega em todas as páginas) ---
const footerContainer = document.getElementById('footer-container');
if (footerContainer) {
    footerContainer.innerHTML = `
    <footer>
        <div class="footer-content">
            <div class="footer-grid">
                <div class="footer-col">
                    <h3>CCML</h3>
                    <p>Centro de Cultura Musical e Linguística. Transformando vidas através da arte e do conhecimento.</p>
                </div>
                <div class="footer-col">
                    <h4>Links Rápidos</h4>
                    <ul class="footer-links">
                        <li><a href="index.html">Início</a></li>
                        <li><a href="matricula.html">Matrícula</a></li>
                        <li><a href="valores_ccml.html">Valores</a></li>
                        <li><a href="painel_professor.html">Área do Professor</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Contato</h4>
                    <ul class="footer-links">
                        <li><i class="fa-brands fa-whatsapp" style="color: var(--gold); margin-right: 10px;"></i> (94) 99999-9999</li>
                        <li><i class="fa-solid fa-envelope" style="color: var(--gold); margin-right: 10px;"></i> contato@ccml.com.br</li>
                        <li><i class="fa-solid fa-location-dot" style="color: var(--gold); margin-right: 10px;"></i> Rua da Música, 123 - Centro</li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2025 CCML. Todos os direitos reservados.</p>
                <div class="social-icons">
                    <a href="#"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#"><i class="fa-brands fa-facebook"></i></a>
                    <a href="#"><i class="fa-brands fa-youtube"></i></a>
                </div>
            </div>
        </div>
    </footer>`;
}