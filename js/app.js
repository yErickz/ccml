import { db, auth, provider } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, where } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";

// --- 0. CONFIGURAÇÃO DE DESENVOLVIMENTO ---
const DEV_MODE = true; // ⚠️ TRUE = Pula validações para testar. FALSE = Modo normal.

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

        // --- LÓGICA DE MUSICALIZAÇÃO INFANTIL ---
        const cursoSelectJS = document.getElementById('curso');
        const avisoMusicalizacao = document.getElementById('avisoMusicalizacao');

        if (cursoSelectJS && avisoMusicalizacao) {
            if (age <= 6) {
                cursoSelectJS.value = 'musicalizacao';
                cursoSelectJS.style.pointerEvents = 'none';
                cursoSelectJS.style.backgroundColor = '#f0f0f0';
                avisoMusicalizacao.style.display = 'block';
                // Dispara o evento change para que a lógica de planos (Inglês com Música) seja reavaliada
                cursoSelectJS.dispatchEvent(new Event('change')); 
            } else {
                // Se a idade for maior que 6 e o curso travado era musicalização, reseta para o usuário escolher.
                if (cursoSelectJS.value === 'musicalizacao' && cursoSelectJS.style.pointerEvents === 'none') {
                    cursoSelectJS.value = ''; 
                }
                cursoSelectJS.style.pointerEvents = 'auto';
                cursoSelectJS.style.backgroundColor = 'white';
                avisoMusicalizacao.style.display = 'none';
            }
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

// --- 1.4 Máscara de Telefone (WhatsApp) ---
const phoneInputs = ['telefone', 'whatsappCobranca'];
phoneInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos
            
            // Formata (XX) XXXXX-XXXX
            value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
            value = value.replace(/(\d)(\d{4})$/, "$1-$2");
            
            e.target.value = value;
        });
    }
});

// --- 1.5 Formatação Automática de Nomes ---
const nameInputsToFormat = ['nomeAluno', 'nomeResponsavel'];
nameInputsToFormat.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
        // Usando 'change' para formatar quando o usuário sai do campo
        input.addEventListener('change', (e) => {
            e.target.value = formatName(e.target.value);
        });
    }
});

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

        // Controle Automático de Planos
        const planRadios = document.querySelectorAll('input[name="plano"]');
        if (planRadios.length > 0) {
            const curso = e.target.value;

            if (curso === 'Inglês com Música') {
                // Trava no plano de Inglês
                planRadios.forEach(r => {
                    if (r.value === 'Ingles') {
                        r.checked = true;
                        r.disabled = false;
                    } else {
                        r.disabled = true;
                        r.checked = false;
                    }
                });
            } else if (curso === 'musicalizacao') {
                // Trava no plano de Musicalização
                planRadios.forEach(r => {
                    if (r.value === 'Musicalizacao') {
                        r.checked = true;
                        r.disabled = false;
                    } else {
                        r.disabled = true;
                        r.checked = false;
                    }
                });
            } else {
                // Libera Turma/Individual e bloqueia Planos Especiais
                planRadios.forEach(r => {
                    if (r.value === 'Ingles' || r.value === 'Musicalizacao') {
                        r.disabled = true;
                        r.checked = false;
                    } else {
                        r.disabled = false;
                    }
                });
            }
            updateSummary(); // Atualiza o resumo visualmente
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
    if (!DEV_MODE && !validarCPF(cpfValue)) {
        showError("O CPF informado parece inválido. Por favor, verifique os números e tente novamente.");
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    // Validação CPF Responsável (se preenchido)
    const cpfRespValue = document.getElementById('cpfResponsavel').value;
    if (!DEV_MODE && cpfRespValue && !validarCPF(cpfRespValue)) {
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

    // Validação Final: Plano Obrigatório
    const planoEl = document.querySelector('input[name="plano"]:checked');
    if (!DEV_MODE && !planoEl) {
        showError("Por favor, selecione um plano de ensino para concluir a matrícula.");
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    try {
        const dados = {
            // 1. Identificação
            nome: document.getElementById('nomeAluno').value,
            nascimento: document.getElementById('dataNascimento').value,
            idade: document.getElementById('idade').value,
            cpf: cpfValue,
            endereco: document.getElementById('endereco').value,
            telefone: document.getElementById('telefone').value,
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
            plano_escolhido: planoEl ? planoEl.value : "DEV_MODE_TEST",

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

        localStorage.removeItem('matriculaProgress'); // Limpa o progresso salvo
        playSuccessSound();
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
const APP_VERSION = "1.0.15";
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
        
        // Bloqueia edição para não precisar preencher
        document.getElementById('nomeResponsavel').readOnly = true;
        document.getElementById('cpfResponsavel').readOnly = true;
        document.getElementById('whatsappCobranca').readOnly = true;
    } else {
        document.getElementById('nomeResponsavel').value = "";
        document.getElementById('cpfResponsavel').value = "";
        document.getElementById('whatsappCobranca').value = "";
        
        document.getElementById('nomeResponsavel').readOnly = false;
        document.getElementById('cpfResponsavel').readOnly = false;
        document.getElementById('whatsappCobranca').readOnly = false;
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

    // Se for a última etapa (índice 4), atualiza o resumo
    if (n === 4) {
        updateSummary();
    }
}

window.nextPrev = async (n) => {
    const x = document.getElementsByClassName("form-step");
    // Se estiver avançando, valida os campos da etapa atual
    if (n == 1 && !DEV_MODE && !validateFormStep()) {
        playErrorSound();
        x[currentTab].classList.add('shake');
        setTimeout(() => x[currentTab].classList.remove('shake'), 500);
        return false;
    }

    // --- CAPTURA DE LEAD (Salvar passo 1) ---
    if (n == 1 && currentTab == 0 && !DEV_MODE) {
        const btnNext = document.getElementById("nextBtn");
        const originalText = btnNext.innerText;
        
        // Feedback visual e bloqueio
        btnNext.innerHTML = '<span class="spinner"></span> Verificando...';
        btnNext.disabled = true;

        try {
            const cpf = document.getElementById('cpf').value;
            const isDuplicate = await checkDuplicateEnrollment(cpf);
            
            if (isDuplicate) {
                showError("Este CPF já possui uma matrícula registrada ou em andamento.");
                playErrorSound();
                x[currentTab].classList.add('shake');
                setTimeout(() => x[currentTab].classList.remove('shake'), 500);
                return false; // Impede o avanço
            }
            await saveLead();
        } finally {
            btnNext.innerHTML = "Avançar"; // Restaura o texto original
            btnNext.disabled = false;
        }
    }

    // Oculta a aba atual
    x[currentTab].style.display = "none";
    currentTab = currentTab + n;

    showTab(currentTab);
}

function validateFormStep() {
    if (DEV_MODE) return true; // ⚠️ Pula validação se estiver em modo DEV

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
    
    // Validação de CPF do Responsável (Etapa 2 - índice 1)
    if (currentTab === 1 && valid) {
        const cpfResp = document.getElementById('cpfResponsavel').value;
        if (!validarCPF(cpfResp)) {
            showError("CPF do Responsável inválido.");
            valid = false;
        }
    }

    // Validação de Disponibilidade (Etapa 3 - índice 2)
    if (currentTab === 2 && valid) {
        const dias = document.querySelectorAll('input[name="diasPref"]:checked');
        const turnos = document.querySelectorAll('input[name="turnosPref"]:checked');
        if (dias.length === 0 || turnos.length === 0) {
            showError("Por favor, selecione pelo menos um dia e um turno de preferência.");
            valid = false;
        }
    }

    return valid;
}

// Inicializa o Wizard se estiver na página
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementsByClassName("form-step").length > 0) {
        loadFormProgress(); // Restaura dados salvos
        showTab(currentTab);
        
        // Adiciona listeners para salvar progresso automaticamente
        const form = document.getElementById('formMatricula');
        if (form) {
            form.addEventListener('input', saveFormProgress);
            form.addEventListener('change', saveFormProgress);
        }
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
        telefone: document.getElementById('telefone').value,
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

// Função para atualizar o Resumo Final
window.updateSummary = () => {
    const resumoDiv = document.getElementById('resumoFinal');
    if (!resumoDiv) return;

    const nome = document.getElementById('nomeAluno').value || "Aluno";
    let curso = document.getElementById('curso').value;
    if (curso === 'Outro') curso = document.getElementById('outroCurso').value;
    
    const planoEl = document.querySelector('input[name="plano"]:checked');
    let plano = "Nenhum plano selecionado";
    let valor = "R$ 0,00";

    if (planoEl) {
        const val = planoEl.value;
        if (val === 'Turma') { plano = "Aula em Turma"; valor = "R$ 189,90"; }
        if (val === 'Individual') { plano = "Aula Individual"; valor = "R$ 250,00"; }
        if (val === 'Ingles') { plano = "Inglês com Música"; valor = "R$ 250,00"; }
        if (val === 'Musicalizacao') { plano = "Musicalização Infantil"; valor = "R$ 199,90"; }
    }

    document.getElementById('resumoNome').innerText = nome;
    document.getElementById('resumoCurso').innerText = curso;
    document.getElementById('resumoPlano').innerText = plano;
    document.getElementById('resumoValor').innerText = valor;
    
    resumoDiv.style.display = 'block';
};

// Adiciona listener para mudança manual nos planos também
document.addEventListener('change', (e) => {
    if (e.target.name === 'plano') updateSummary();
});

// Função para verificar duplicidade no banco
async function checkDuplicateEnrollment(cpf) {
    // Remove formatação para busca se necessário, mas aqui buscamos exato como salvo
    const q = query(collection(db, "matriculas"), where("cpf", "==", cpf));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        // Se encontrou registro, verifica se não é o próprio lead atual (caso esteja editando)
        for (const doc of querySnapshot.docs) {
            if (doc.id !== currentLeadId) {
                return true; // Encontrou OUTRO registro com mesmo CPF
            }
        }
    }
    return false;
}

// Função para formatar nomes (Capitaliza a primeira letra de cada palavra)
function formatName(name) {
    if (!name) return "";
    const exceptions = ["da", "de", "do", "dos", "e"];
    return name
        .toLowerCase()
        .split(' ')
        .map((word, index) => {
            if (index > 0 && exceptions.includes(word)) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

// --- 10. Monitoramento de Conectividade (Offline/Online) ---
function initOfflineDetector() {
    const handleStatusChange = () => {
        if (!navigator.onLine) {
            showOfflineBanner();
        } else {
            hideOfflineBanner();
        }
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    
    // Verifica estado inicial
    if (!navigator.onLine) showOfflineBanner();
}

function showOfflineBanner() {
    let banner = document.getElementById('offline-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%;
            background-color: #2c3e50; color: #fff; text-align: center;
            padding: 12px; z-index: 99999; font-family: 'Montserrat', sans-serif; font-size: 0.9rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2); transition: transform 0.3s ease-in-out;
            border-bottom: 3px solid #C5A059;
        `;
        banner.innerHTML = '<i class="fa-solid fa-cloud-arrow-down" style="color: #ffcc00; margin-right: 8px;"></i> <strong>Você está offline.</strong> Não se preocupe, seu progresso está sendo salvo neste dispositivo.';
        document.body.appendChild(banner);
    }
    banner.style.transform = 'translateY(0)';
}

function hideOfflineBanner() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
        banner.style.backgroundColor = '#27ae60'; // Verde sucesso
        banner.style.borderBottomColor = '#2ecc71';
        banner.innerHTML = '<i class="fa-solid fa-wifi" style="margin-right: 8px;"></i> Conexão restabelecida! Você já pode enviar sua matrícula.';
        setTimeout(() => {
            banner.style.transform = 'translateY(-100%)'; // Desliza para cima
            setTimeout(() => banner.remove(), 300);
        }, 4000);
    }
}

// Inicializa o detector
initOfflineDetector();

// Função para tocar som de erro (Beep curto)
function playErrorSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return; // Navegador não suporta

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth'; // Timbre mais "áspero" para erro
        osc.frequency.setValueAtTime(220, ctx.currentTime); // Frequência grave (A3)
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1); // Cai a frequência (efeito "uóóón")

        gain.gain.setValueAtTime(0.1, ctx.currentTime); // Volume baixo
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15); // Fade out

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
        // Ignora erros de áudio (ex: interação do usuário necessária)
    }
}

// Função para tocar som de sucesso (Plim)
function playSuccessSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine'; // Som mais suave
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // Nota Dó (C5)
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // Sobe uma oitava (C6)

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); // Fade out

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
        // Ignora erros
    }
}

// --- 9. Persistência Local (LocalStorage) ---
function saveFormProgress() {
    const formData = {};
    const inputs = document.querySelectorAll('#formMatricula input, #formMatricula select, #formMatricula textarea');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            if (input.checked) {
                if (!formData[input.name]) formData[input.name] = [];
                formData[input.name].push(input.value);
            }
        } else {
            if (input.id) formData[input.id] = input.value;
        }
    });

    // Salva estado do sistema
    formData['currentTab'] = currentTab;
    formData['currentLeadId'] = currentLeadId;
    
    localStorage.setItem('matriculaProgress', JSON.stringify(formData));
}

function loadFormProgress() {
    const savedData = localStorage.getItem('matriculaProgress');
    if (!savedData) return;

    const formData = JSON.parse(savedData);

    // Restaura variáveis de controle
    if (formData.currentLeadId) currentLeadId = formData.currentLeadId;
    if (formData.currentTab !== undefined) currentTab = parseInt(formData.currentTab);

    // Restaura inputs
    for (const key in formData) {
        // Tenta encontrar por ID (Inputs de texto, selects)
        const inputById = document.getElementById(key);
        if (inputById) {
            inputById.value = formData[key];
            inputById.dispatchEvent(new Event('change')); // Dispara eventos dependentes (ex: idade)
        }

        // Tenta encontrar por Name (Checkboxes/Radios)
        const inputsByName = document.querySelectorAll(`input[name="${key}"]`);
        if (inputsByName.length > 0) {
            const values = Array.isArray(formData[key]) ? formData[key] : [formData[key]];
            inputsByName.forEach(input => {
                if (values.includes(input.value)) input.checked = true;
            });
        }
    }
}