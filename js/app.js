import { db, auth, provider } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
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

// Variável para rastrear o ID do lead (matrícula incompleta)
let currentLeadId = null;

// --- 1.1 Configuração de Inputs (Data) ---
const dateInput = document.getElementById('dataNascimento');
if (dateInput) {
    const today = new Date().toISOString().split("T")[0];
    dateInput.max = today; // Impede datas futuras no calendário
    dateInput.min = "1900-01-01"; // Impede anos muito antigos

    // Validação visual e bloqueio imediato ao alterar
    dateInput.addEventListener('change', (e) => {
        const value = e.target.value;

        // Verifica se o navegador detectou uma data inválida (ex: 30 de Fevereiro)
        if (!value && e.target.validity.badInput) {
            e.target.style.borderColor = "red";
            e.target.style.backgroundColor = "#ffebee";
            if (typeof showError === 'function') showError("Data inválida. Verifique se o dia e o mês existem.");
            e.target.value = "";
            return;
        }

        if (!value) return; // Campo limpo ou incompleto

        if (value > today) {
            e.target.style.borderColor = "red";
            e.target.style.backgroundColor = "#ffebee";
            // Usa o modal de erro se disponível, senão alerta padrão
            if (typeof showError === 'function') showError("A data de nascimento não pode ser no futuro.");
            else alert("A data de nascimento não pode ser no futuro.");
            e.target.value = ""; // Limpa o valor inválido
        } else if (value < "1900-01-01") {
            e.target.style.borderColor = "red";
            e.target.style.backgroundColor = "#ffebee";
            if (typeof showError === 'function') showError("Data muito antiga. Verifique o ano de nascimento.");
            e.target.value = "";
        } else {
            e.target.style.borderColor = "green";
            e.target.style.backgroundColor = "#e8f5e9";
        }

        // Lógica de Menor de Idade
        const age = calculateAge(value);
        
        // Preencher campo de idade visualmente
        const idadeInput = document.getElementById('idade');
        if (idadeInput) idadeInput.value = age + " anos";

        const checkResp = document.getElementById('checkMesmoResponsavel');
        if (age < 18) {
            checkResp.checked = false;
            checkResp.disabled = true;
            toggleResponsavel(); // Força mostrar campos vazios
        } else {
            checkResp.disabled = false;
        }
    });
}

// --- 1.2 Máscara e Validação de CPF ---
const cpfInput = document.getElementById('cpf');
if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        e.target.value = value;

        // Validação visual imediata ao completar o CPF
        if (value.length === 14) {
            if (validarCPF(value)) {
                e.target.style.borderColor = "green";
                e.target.style.backgroundColor = "#e8f5e9";
            } else {
                e.target.style.borderColor = "red";
                e.target.style.backgroundColor = "#ffebee";
                if (typeof showError === 'function') showError("CPF inválido. Verifique os números digitados.");
            }
        } else {
            e.target.style.borderColor = "";
            e.target.style.backgroundColor = "";
        }
    });
}

// Máscara para CPF do Responsável (Reutilizando lógica)
const cpfRespInput = document.getElementById('cpfResponsavel');
if (cpfRespInput) {
    cpfRespInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        e.target.value = value;
    });
}

// --- 1.3 Controle do Campo "Outro Curso" ---
const cursoSelect = document.getElementById('curso');
const outroCursoInput = document.getElementById('outroCurso');

if (cursoSelect && outroCursoInput) {
    cursoSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Outro') {
            outroCursoInput.style.display = 'block';
            outroCursoInput.required = true;
        } else {
            outroCursoInput.style.display = 'none';
            outroCursoInput.required = false;
            outroCursoInput.value = '';
        }
    });
}

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

    const cpfValue = document.getElementById('cpf').value;
    if (!validarCPF(cpfValue)) {
        showError("O CPF informado parece inválido. Por favor, verifique os números e tente novamente.");
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    // Validação CPF Responsável (se preenchido)
    const cpfRespValue = document.getElementById('cpfResponsavel').value;
    if (cpfRespValue && !validarCPF(cpfRespValue)) {
        showError("O CPF do Responsável Financeiro é inválido.");
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    let cursoSelecionado = document.getElementById('curso').value;
    if (cursoSelecionado === 'Outro') {
        cursoSelecionado = document.getElementById('outroCurso').value;
    }

    // Captura as preferências de horário (Checkboxes)
    const diasPref = Array.from(document.querySelectorAll('input[name="diasPref"]:checked')).map(el => el.value);
    const turnosPref = Array.from(document.querySelectorAll('input[name="turnosPref"]:checked')).map(el => el.value);
    const diasExp = Array.from(document.querySelectorAll('input[name="diasExp"]:checked')).map(el => el.value);
    const turnosExp = Array.from(document.querySelectorAll('input[name="turnosExp"]:checked')).map(el => el.value);

    try {
        const dados = {
            // 1. Identificação
            nome: document.getElementById('nomeAluno').value,
            nascimento: document.getElementById('dataNascimento').value,
            idade: document.getElementById('idade').value,
            cpf: cpfValue,
            endereco: document.getElementById('endereco').value,
            email: document.getElementById('email').value,
            
            // 2. Financeiro
            responsavel_financeiro: document.getElementById('nomeResponsavel').value,
            cpf_responsavel: document.getElementById('cpfResponsavel').value,
            whatsapp_cobranca: document.getElementById('whatsappCobranca').value,
            dia_vencimento: document.getElementById('diaVencimento').value,

            // 3. Pedagógico
            curso: cursoSelecionado,
            nivel: document.getElementById('nivel').value,
            instrumento_proprio: document.getElementById('instrumentoProprio').value,
            objetivo: document.getElementById('objetivo').value,
            disponibilidade_dias: diasPref,
            disponibilidade_turnos: turnosPref,
            experimental_dias: diasExp,
            experimental_turnos: turnosExp,

            // 4. Segurança
            necessidades_especiais: document.getElementById('necessidades').value,
            autorizacao_imagem: document.getElementById('autorizacaoImagem').checked,
            
            status: "completo", // Marca como finalizado
            data_registro: new Date().toISOString()
        };

        // Se já temos um ID de lead (salvo na etapa 1), atualizamos ele. Senão, cria novo.
        if (currentLeadId) {
            const docRef = doc(db, "matriculas", currentLeadId);
            await updateDoc(docRef, dados);
            console.log("Matrícula finalizada (atualizada):", currentLeadId);
        } else {
            await addDoc(collection(db, "matriculas"), dados);
        }

        document.getElementById('formMatricula').style.display = 'none';
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
const APP_VERSION = "1.0.12";
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
                <p>&copy; 2025 CCML. Todos os direitos reservados. <span style="opacity: 0.7; font-size: 0.85em;">v${APP_VERSION}</span></p>
                <div class="social-icons">
                    <a href="#"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#"><i class="fa-brands fa-facebook"></i></a>
                    <a href="#"><i class="fa-brands fa-youtube"></i></a>
                </div>
            </div>
        </div>
    </footer>`;
}

// --- 6. Funções do Modal de Erro ---
window.showError = (msg) => {
    const modal = document.getElementById('errorModal');
    if (modal) {
        document.getElementById('errorText').innerText = msg;
        modal.classList.add('show');
    } else {
        alert(msg); // Fallback caso o modal não exista na página
    }
};

window.closeErrorModal = () => {
    const modal = document.getElementById('errorModal');
    if (modal) modal.classList.remove('show');
};

// --- 7. Funções Auxiliares de Matrícula ---
window.calculateAge = (dobString) => {
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
};

window.toggleResponsavel = () => {
    const isStudentResp = document.getElementById('checkMesmoResponsavel').checked;
    const nomeAluno = document.getElementById('nomeAluno').value;
    const cpfAluno = document.getElementById('cpf').value;
    const zapAluno = document.getElementById('telefone').value; // Assumindo que telefone do aluno serve

    if (isStudentResp) {
        document.getElementById('nomeResponsavel').value = nomeAluno;
        document.getElementById('cpfResponsavel').value = cpfAluno;
        document.getElementById('whatsappCobranca').value = zapAluno;
        // Opcional: Bloquear edição para garantir consistência
        // document.getElementById('nomeResponsavel').readOnly = true;
    } else {
        document.getElementById('nomeResponsavel').value = "";
        document.getElementById('cpfResponsavel').value = "";
        document.getElementById('whatsappCobranca').value = "";
        // document.getElementById('nomeResponsavel').readOnly = false;
    }
};

// --- 8. Lógica do Wizard (Passo a Passo) ---
let currentTab = 0; // Começa na primeira etapa (índice 0)

window.showTab = (n) => {
    const x = document.getElementsByClassName("form-step");
    if (x.length === 0) return; // Proteção caso não esteja na página de matrícula

    // Esconde todas as abas
    for (let i = 0; i < x.length; i++) {
        x[i].style.display = "none";
        x[i].classList.remove("active");
    }
    // Mostra a atual
    x[n].style.display = "block";
    x[n].classList.add("active");

    // Controle dos botões
    if (n == 0) {
        document.getElementById("prevBtn").style.display = "none";
    } else {
        document.getElementById("prevBtn").style.display = "inline";
    }

    if (n == (x.length - 1)) {
        document.getElementById("nextBtn").style.display = "none";
        document.getElementById("submitBtn").style.display = "inline";
    } else {
        document.getElementById("nextBtn").style.display = "inline";
        document.getElementById("submitBtn").style.display = "none";
        document.getElementById("nextBtn").innerHTML = "Avançar";
    }

    // Atualiza Barra de Progresso
    const progress = ((n + 1) / x.length) * 100;
    document.getElementById("progressBar").style.width = progress + "%";
}

window.nextPrev = (n) => {
    const x = document.getElementsByClassName("form-step");
    // Se estiver avançando, valida os campos da etapa atual
    if (n == 1 && !validateFormStep()) return false;

    // --- CAPTURA DE LEAD (Salvar passo 1) ---
    if (n == 1 && currentTab == 0) {
        saveLead();
    }

    // Oculta a aba atual
    x[currentTab].style.display = "none";
    currentTab = currentTab + n;

    showTab(currentTab);
}

function validateFormStep() {
    const x = document.getElementsByClassName("form-step");
    const inputs = x[currentTab].querySelectorAll("input[required], select[required]");
    let valid = true;

    for (let i = 0; i < inputs.length; i++) {
        if (!inputs[i].checkValidity()) {
            inputs[i].reportValidity(); // Mostra o balãozinho nativo do navegador
            valid = false;
            break; // Para no primeiro erro
        }
    }
    
    // Validação extra de CPF se estiver na etapa 1
    if (currentTab === 0 && valid) {
        const cpfVal = document.getElementById('cpf').value;
        if (!validarCPF(cpfVal)) {
            showError("CPF inválido na etapa de identificação.");
            valid = false;
        }
    }

    return valid;
}

// Inicializa o Wizard se estiver na página
document.addEventListener("DOMContentLoaded", () => {
    if(document.getElementsByClassName("form-step").length > 0) {
        showTab(currentTab);
    }
});

// Função auxiliar de validação de CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf == '') return false;
    // Elimina CPFs invalidos conhecidos (ex: 111.111.111-11)
    if (cpf.length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    // Valida 1o digito
    let add = 0;
    for (let i = 0; i < 9; i++)
        add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(9))) return false;
    
    // Valida 2o digito
    add = 0;
    for (let i = 0; i < 10; i++)
        add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(10))) return false;
    
    return true;
}

// Função para salvar dados parciais (Lead)
async function saveLead() {
    const dadosLead = {
        nome: document.getElementById('nomeAluno').value,
        nascimento: document.getElementById('dataNascimento').value,
        idade: document.getElementById('idade').value,
        cpf: document.getElementById('cpf').value,
        endereco: document.getElementById('endereco').value,
        email: document.getElementById('email').value,
        status: "incompleto", // Marcador para saber que desistiu no meio
        data_registro: new Date().toISOString()
    };

    try {
        if (!currentLeadId) {
            const docRef = await addDoc(collection(db, "matriculas"), dadosLead);
            currentLeadId = docRef.id;
            console.log("Lead capturado: ", currentLeadId);
        } else {
            const docRef = doc(db, "matriculas", currentLeadId);
            await updateDoc(docRef, dadosLead);
            console.log("Lead atualizado: ", currentLeadId);
        }
    } catch (e) {
        console.error("Erro ao salvar lead:", e);
    }
}