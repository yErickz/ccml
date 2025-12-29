import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, collection, getDocs, arrayUnion } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id');
let currentStudent = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!studentId) {
        alert("ID do aluno não fornecido.");
        window.close();
        return;
    }

    await loadTeachers();
    await loadStudentData(studentId);

    // Event Listeners
    document.getElementById('btnSave').addEventListener('click', saveStudentData);
    document.getElementById('btnAddTimeline').addEventListener('click', addTimelineNote);
    document.getElementById('newTagInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTag(e.target.value);
    });
});

async function loadStudentData(id) {
    const overlay = document.getElementById('loadingOverlay');
    try {
        const docRef = doc(db, "matriculas", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            currentStudent = docSnap.data();
            populateForm(currentStudent);
        } else {
            alert("Aluno não encontrado!");
            window.close();
        }
    } catch (error) {
        console.error("Erro ao carregar aluno:", error);
        alert("Erro ao carregar dados.");
    } finally {
        overlay.style.display = 'none';
    }
}

function populateForm(data) {
    // Campos de Texto e Selects
    const fields = [
        'manageNome', 'manageCurso', 'manageEmail', 'manageTelefone', 
        'manageCpf', 'manageNascimento', 'manageNivel', 'managePlano', 
        'manageStatus', 'manageProfessor', 'manageRespNome', 'manageRespCpf'
    ];

    fields.forEach(field => {
        const el = document.getElementById(field);
        // Mapeia o ID do input para a chave do objeto (ex: manageNome -> nome)
        const key = field.replace('manage', '').toLowerCase(); 
        // Ajustes manuais de chaves que não batem direto
        const dataKey = mapFieldToKey(key);
        
        if (el && data[dataKey] !== undefined) {
            el.value = data[dataKey];
        }
    });

    // Checkbox
    const checkPag = document.getElementById('managePagamento');
    if (checkPag) checkPag.checked = data.pagamento_verificado || false;

    // Tags
    renderTags(data.tags || []);

    // Timeline
    renderTimeline(data.historico || []);
}

function mapFieldToKey(key) {
    const map = {
        'respnome': 'responsavel_financeiro',
        'respcpf': 'cpf_responsavel',
        'nascimento': 'data_nascimento', // ou 'nascimento' dependendo de como salvou
        'professor': 'professor_atribuido',
        'status': 'status_matricula'
    };
    return map[key] || key;
}

async function loadTeachers() {
    const select = document.getElementById('manageProfessor');
    try {
        const q = collection(db, "professores");
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            const t = doc.data();
            const opt = document.createElement('option');
            opt.value = t.email;
            opt.text = t.name;
            select.add(opt);
        });
    } catch (e) {
        console.error("Erro ao carregar professores:", e);
    }
}

async function saveStudentData() {
    const btn = document.getElementById('btnSave');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

    try {
        const updates = {
            nome: document.getElementById('manageNome').value,
            curso: document.getElementById('manageCurso').value,
            email: document.getElementById('manageEmail').value,
            telefone: document.getElementById('manageTelefone').value,
            cpf: document.getElementById('manageCpf').value,
            data_nascimento: document.getElementById('manageNascimento').value,
            nivel: document.getElementById('manageNivel').value,
            plano_escolhido: document.getElementById('managePlano').value,
            status_matricula: document.getElementById('manageStatus').value,
            professor_atribuido: document.getElementById('manageProfessor').value,
            responsavel_financeiro: document.getElementById('manageRespNome').value,
            cpf_responsavel: document.getElementById('manageRespCpf').value,
            pagamento_verificado: document.getElementById('managePagamento').checked
        };

        const docRef = doc(db, "matriculas", studentId);
        await updateDoc(docRef, updates);

        alert("Dados atualizados com sucesso!");
        
        // Tenta atualizar a janela pai (Dashboard) se estiver aberta
        if (window.opener && window.opener.loadDashboardData) {
            window.opener.loadDashboardData();
        }
        
        window.close();
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar alterações.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-save"></i> Salvar Alterações';
    }
}

// --- Tags System ---
function renderTags(tags) {
    const container = document.getElementById('tagContainer');
    container.innerHTML = '';
    tags.forEach(tag => {
        container.innerHTML += `<span class="tag-badge">${tag} <i class="fa-solid fa-times" onclick="removeTag('${tag}')"></i></span>`;
    });
}

window.addTag = async (tag) => {
    if (!tag) return;
    const docRef = doc(db, "matriculas", studentId);
    await updateDoc(docRef, { tags: arrayUnion(tag) });
    document.getElementById('newTagInput').value = '';
    loadStudentData(studentId); // Recarrega para atualizar visual
};

// --- Timeline System ---
function renderTimeline(items) {
    const list = document.getElementById('timelineList');
    list.innerHTML = '';
    if (!items || items.length === 0) {
        list.innerHTML = '<p style="color:#999; text-align:center;">Nenhum histórico.</p>';
        return;
    }
    // Ordena do mais recente para o mais antigo
    items.reverse().forEach(item => {
        list.innerHTML += `
            <div class="timeline-entry">
                <div class="timeline-meta">
                    <span>${item.data || 'Hoje'}</span>
                    <span>${item.autor || 'Sistema'}</span>
                </div>
                <div class="timeline-text">${item.texto}</div>
            </div>
        `;
    });
}

async function addTimelineNote() {
    const note = document.getElementById('newTimelineNote').value;
    if (!note) return;

    const newEntry = {
        texto: note,
        data: new Date().toLocaleDateString('pt-BR'),
        autor: 'Admin' // Idealmente pegar do auth
    };

    const docRef = doc(db, "matriculas", studentId);
    await updateDoc(docRef, { historico: arrayUnion(newEntry) });
    
    document.getElementById('newTimelineNote').value = '';
    loadStudentData(studentId);
}