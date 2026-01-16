import { db } from "./firebase-config.js";
import { collection, addDoc, doc, updateDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { DEV_MODE, showError, playErrorSound, playSuccessSound, validarCPF } from "./utils.js";
import { EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID } from "./config.js";

let currentLeadId = null;
let currentTab = 0;

export function initEnrollment() {
    // Expor funções globais
    window.handleEnrollment = handleEnrollment;
    window.showTab = showTab;
    window.nextPrev = nextPrev;
    window.updateSummary = updateSummary;

    // Inicializar EmailJS
    if (window.emailjs && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }

    // Inicializar Wizard
    if (document.getElementsByClassName("form-step").length > 0) {
        loadFormProgress();
        showTab(currentTab);
        
        const form = document.getElementById('formMatricula');
        if (form) {
            form.addEventListener('input', saveFormProgress);
            form.addEventListener('change', saveFormProgress);
        }
    }

    // Lógica de Curso "Outro" e Planos
    const cursoSelect = document.getElementById('curso');
    const outroCursoInput = document.getElementById('outroCurso');
    if (cursoSelect) {
        cursoSelect.addEventListener('change', (e) => {
            if (e.target.value === 'Outro') {
                outroCursoInput.style.display = 'block';
                outroCursoInput.required = true;
            } else {
                outroCursoInput.style.display = 'none';
                outroCursoInput.required = false;
                outroCursoInput.value = '';
            }
            handlePlanLogic(e.target.value);
        });
    }

    // Validação Sábado/Noite
    const sabadoInput = document.querySelector('input[name="diasPref"][value="Sábado"]');
    const noiteInput = document.querySelector('input[name="turnosPref"][value="Noite"]');
    if (sabadoInput && noiteInput) {
        const validate = () => {
            if (noiteInput.checked) {
                sabadoInput.checked = false;
                sabadoInput.disabled = true;
                sabadoInput.parentElement.style.opacity = "0.5";
            } else {
                sabadoInput.disabled = false;
                sabadoInput.parentElement.style.opacity = "1";
            }
            if (sabadoInput.checked) {
                noiteInput.disabled = true;
                noiteInput.parentElement.style.opacity = "0.5";
            } else if (!noiteInput.checked) {
                noiteInput.disabled = false;
                noiteInput.parentElement.style.opacity = "1";
            }
        };
        sabadoInput.addEventListener('change', validate);
        noiteInput.addEventListener('change', validate);
        validate(); // Run initial check
    }
}

function handlePlanLogic(curso) {
    const planRadios = document.querySelectorAll('input[name="plano"]');
    if (planRadios.length === 0) return;

    if (curso === 'Inglês com Música') {
        planRadios.forEach(r => {
            r.disabled = (r.value !== 'Ingles');
            r.checked = (r.value === 'Ingles');
        });
    } else if (curso === 'musicalizacao') {
        planRadios.forEach(r => {
            r.disabled = (r.value !== 'Musicalizacao');
            r.checked = (r.value === 'Musicalizacao');
        });
    } else {
        planRadios.forEach(r => {
            if (r.value === 'Ingles' || r.value === 'Musicalizacao') {
                r.disabled = true;
                r.checked = false;
            } else {
                r.disabled = false;
            }
        });
    }
    updateSummary();
}

async function handleEnrollment(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "Enviando...";
    btn.disabled = true;

    if (!DEV_MODE && !validarCPF(document.getElementById('cpf').value)) {
        showError("CPF inválido.");
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    let cursoSelecionado = document.getElementById('curso').value;
    if (cursoSelecionado === 'Outro') cursoSelecionado = document.getElementById('outroCurso').value;

    const dados = {
        nome: document.getElementById('nomeAluno').value,
        nascimento: document.getElementById('dataNascimento').value,
        idade: document.getElementById('idade').value,
        cpf: document.getElementById('cpf').value,
        endereco: document.getElementById('endereco').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        responsavel_financeiro: document.getElementById('nomeResponsavel').value,
        cpf_responsavel: document.getElementById('cpfResponsavel').value,
        whatsapp_cobranca: document.getElementById('whatsappCobranca').value,
        dia_vencimento: document.getElementById('diaVencimento').value,
        curso: cursoSelecionado,
        nivel: document.getElementById('nivel').value,
        instrumento_proprio: document.getElementById('instrumentoProprio').value,
        objetivo: document.getElementById('objetivo').value,
        disponibilidade_dias: Array.from(document.querySelectorAll('input[name="diasPref"]:checked')).map(el => el.value),
        disponibilidade_turnos: Array.from(document.querySelectorAll('input[name="turnosPref"]:checked')).map(el => el.value),
        plano_escolhido: document.querySelector('input[name="plano"]:checked')?.value || "N/A",
        necessidades_especiais: document.getElementById('necessidades').value,
        autorizacao_imagem: document.getElementById('autorizacaoImagem').checked,
        tags: [], // Limpa a tag de incompleto ao finalizar
        status: "completo",
        data_registro: new Date().toISOString()
    };

    try {
        if (currentLeadId) {
            await updateDoc(doc(db, "matriculas", currentLeadId), dados);
        } else {
            await addDoc(collection(db, "matriculas"), dados);
        }

        // Enviar e-mail de boas-vindas (sem bloquear o fluxo)
        sendWelcomeEmail(dados);

        localStorage.removeItem('matriculaProgress');
        playSuccessSound();
        document.getElementById('formMatricula').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
    } catch (error) {
        console.error("Erro:", error);
        showError("Erro ao enviar matrícula.");
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

async function saveLead() {
    const dadosLead = {
        nome: document.getElementById('nomeAluno').value,
        cpf: document.getElementById('cpf').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value,
        status: "incompleto",
        tags: ['incompleto'], // Garante que a tag seja salva no rascunho
        data_registro: new Date().toISOString()
    };

    try {
        if (!currentLeadId) {
            const docRef = await addDoc(collection(db, "matriculas"), dadosLead);
            currentLeadId = docRef.id;
        } else {
            await updateDoc(doc(db, "matriculas", currentLeadId), dadosLead);
        }
    } catch (e) { console.error("Erro lead:", e); }
}

async function checkDuplicateEnrollment(cpf) {
    const q = query(collection(db, "matriculas"), where("cpf", "==", cpf));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        for (const doc of querySnapshot.docs) {
            if (doc.id !== currentLeadId) {
                const data = doc.data();
                // Verifica se é incompleto por TAG ou por STATUS
                if ((data.tags && data.tags.includes('incompleto')) || data.status === 'incompleto') {
                    if (!currentLeadId) {
                        currentLeadId = doc.id;
                        localStorage.setItem('ccml_enrollment_id', currentLeadId);
                    }
                    continue;
                }
                return true;
            }
        }
    }
    return false;
}

// --- Wizard Logic ---
function showTab(n) {
    const x = document.getElementsByClassName("form-step");
    if (x.length === 0) return;
    for (let i = 0; i < x.length; i++) {
        x[i].style.display = "none";
        x[i].classList.remove("active");
    }
    x[n].style.display = "block";
    x[n].classList.add("active");
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.getElementById("prevBtn").style.display = n == 0 ? "none" : "inline";
    if (n == (x.length - 1)) {
        document.getElementById("nextBtn").style.display = "none";
        document.getElementById("submitBtn").style.display = "inline";
    } else {
        document.getElementById("nextBtn").style.display = "inline";
        document.getElementById("submitBtn").style.display = "none";
        document.getElementById("nextBtn").innerHTML = "Avançar";
    }
    document.getElementById("progressBar").style.width = ((n + 1) / x.length) * 100 + "%";
    if (n === 4) updateSummary();
}

async function nextPrev(n) {
    const x = document.getElementsByClassName("form-step");
    if (n == 1 && !DEV_MODE && !validateFormStep()) {
        playErrorSound();
        x[currentTab].classList.add('shake');
        setTimeout(() => x[currentTab].classList.remove('shake'), 500);
        return false;
    }

    if (n == 1 && currentTab == 0 && !DEV_MODE) {
        const btnNext = document.getElementById("nextBtn");
        btnNext.innerHTML = '<span class="spinner"></span> Verificando...';
        btnNext.disabled = true;
        try {
            const cpf = document.getElementById('cpf').value;
            if (await checkDuplicateEnrollment(cpf)) {
                showError("CPF já cadastrado.");
                playErrorSound();
                return false;
            }
            await saveLead();
        } finally {
            btnNext.innerHTML = "Avançar";
            btnNext.disabled = false;
        }
    }

    x[currentTab].style.display = "none";
    currentTab = currentTab + n;
    showTab(currentTab);
}

function validateFormStep() {
    if (DEV_MODE) return true;
    const x = document.getElementsByClassName("form-step");
    const inputs = x[currentTab].querySelectorAll("input[required], select[required]");
    let valid = true;
    for (let i = 0; i < inputs.length; i++) {
        if (!inputs[i].checkValidity()) {
            inputs[i].reportValidity();
            valid = false;
            break;
        }
    }
    return valid;
}

function updateSummary() {
    const resumoDiv = document.getElementById('resumoFinal');
    if (!resumoDiv) return;
    document.getElementById('resumoNome').innerText = document.getElementById('nomeAluno').value || "Aluno";
    document.getElementById('resumoCurso').innerText = document.getElementById('curso').value;
    
    const planoEl = document.querySelector('input[name="plano"]:checked');
    let valor = "R$ 0,00";
    if (planoEl) {
        if (planoEl.value === 'Turma') valor = "R$ 189,90";
        if (planoEl.value === 'Individual' || planoEl.value === 'Ingles') valor = "R$ 250,00";
        if (planoEl.value === 'Musicalizacao') valor = "R$ 199,90";
        document.getElementById('resumoPlano').innerText = planoEl.parentElement.querySelector('.plan-title').innerText;
    }
    document.getElementById('resumoValor').innerText = valor;
    resumoDiv.style.display = 'block';
}

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
    formData['currentTab'] = currentTab;
    formData['currentLeadId'] = currentLeadId;
    formData['timestamp'] = new Date().getTime();
    localStorage.setItem('matriculaProgress', JSON.stringify(formData));
}

function loadFormProgress() {
    const savedData = localStorage.getItem('matriculaProgress');
    if (!savedData) return;
    const formData = JSON.parse(savedData);
    if (new Date().getTime() - (formData.timestamp || 0) > 30 * 60 * 1000) {
        localStorage.removeItem('matriculaProgress');
        return;
    }
    if (formData.currentLeadId) currentLeadId = formData.currentLeadId;
    if (formData.currentTab !== undefined) currentTab = parseInt(formData.currentTab);

    for (const key in formData) {
        const inputById = document.getElementById(key);
        if (inputById) {
            inputById.value = formData[key];
            inputById.dispatchEvent(new Event('change'));
        }
        const inputsByName = document.querySelectorAll(`input[name="${key}"]`);
        if (inputsByName.length > 0) {
            const values = Array.isArray(formData[key]) ? formData[key] : [formData[key]];
            inputsByName.forEach(input => {
                if (values.includes(input.value)) {
                    input.checked = true;
                    input.dispatchEvent(new Event('change'));
                }
            });
        }
    }
}

function sendWelcomeEmail(data) {
    if (!window.emailjs || EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
        console.log("EmailJS não configurado ou chaves padrão detectadas. E-mail não enviado.");
        return;
    }

    const templateParams = {
        nome_aluno: data.nome,
        curso: data.curso,
        email_aluno: data.email,
        plano: data.plano_escolhido
    };

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(() => {
            console.log("Email de boas-vindas enviado com sucesso!");
        }, (error) => {
            console.error("Erro ao enviar email:", error);
        });
}