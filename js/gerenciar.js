import { db } from "./firebase-config.js";
import { doc, getDoc, updateDoc, arrayUnion, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { initAuth, currentUserRole } from "./auth-manager.js";
import { customAlert } from "./utils.js";

// --- DADOS MOCK (Cópia para compatibilidade) ---
const mockStudents = [
    {
        id: "1",
        data_registro: "2024-02-15",
        nome: "Ana Silva",
        curso: "Piano/Teclado",
        telefone: "(11) 99999-9999",
        whatsapp_cobranca: "11999999999",
        nivel: "iniciante",
        status_matricula: "ativo",
        professor_atribuido: "prof.joao@ccml.com",
        plano_escolhido: "Mensal",
        responsavel_financeiro: "Carlos Silva",
        cpf: "123.456.789-00",
        email: "ana@email.com",
        nascimento: "2010-05-15",
        pagamento_verificado: true
    },
    {
        id: "2",
        data_registro: "2024-03-10",
        nome: "Bruno Souza",
        curso: "Violão",
        telefone: "(11) 98888-8888",
        whatsapp_cobranca: "11988888888",
        nivel: "intermediario",
        status_matricula: "pendente",
        professor_atribuido: "prof.maria@ccml.com",
        plano_escolhido: "Trimestral",
        responsavel_financeiro: "Julia Souza",
        cpf: "222.333.444-55",
        email: "bruno@email.com",
        nascimento: "2008-08-20",
        pagamento_verificado: false
    }
];

let currentTags = [];
let currentId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializa autenticação para garantir que currentUserRole esteja correto
    initAuth();

    const urlParams = new URLSearchParams(window.location.search);
    currentId = urlParams.get('id');

    if (!currentId) {
        alert("ID da matrícula não fornecido.");
        window.close();
        return;
    }

    document.getElementById('manageId').value = currentId;

    // Listeners
    const btnBack = document.querySelector('.btn-back');
    if (btnBack) {
        btnBack.addEventListener('click', (e) => {
            e.preventDefault();
            // Se a janela foi aberta por script (opener), fecha. Senão, volta para index.
            if (window.opener) window.close();
            else window.location.href = 'index.html';
        });
    }
    document.getElementById('btnSave').addEventListener('click', saveManagementData);
    document.getElementById('btnAddTimeline').addEventListener('click', addTimelineItem);
    
    const tagInput = document.getElementById('newTagInput');
    tagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.target.value.trim();
            if (val && !currentTags.includes(val)) {
                currentTags.push(val);
                renderTags();
                e.target.value = '';
            }
        }
    });

    await loadTeachers();
    await loadData(currentId);
});

async function loadTeachers() {
    try {
        const select = document.getElementById('manageProfessor');
        const q = query(collection(db, "professores"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        
        // Limpa opções anteriores mantendo a padrão
        select.innerHTML = '<option value="">-- Selecione --</option>';
        
        querySnapshot.forEach((doc) => {
            const t = doc.data();
            select.innerHTML += `<option value="${t.email}">${t.name}</option>`;
        });
    } catch (e) {
        console.error("Erro ao carregar professores:", e);
    }
}

async function loadData(id) {
    let data = null;

    // 1. Tenta buscar dados reais no Firebase (Prioridade)
    try {
        const docSnap = await getDoc(doc(db, "matriculas", id));
        if (docSnap.exists()) {
            data = docSnap.data();
        }
    } catch (e) {
        console.error("Erro ao carregar do Firebase:", e);
    }

    // 2. Se não encontrou no Firebase, verifica se é um dado Mock (Fallback)
    if (!data) {
        data = mockStudents.find(s => s.id === id);
    }

    if (!data) {
        alert("Matrícula não encontrada.");
        window.close();
        return;
    }

    // Preencher campos
    document.getElementById('manageNome').value = data.nome || "";
    document.getElementById('manageCurso').value = data.curso || "";
    document.getElementById('manageEmail').value = data.email || "";
    document.getElementById('manageTelefone').value = data.telefone || "";
    document.getElementById('manageCpf').value = data.cpf || "";
    document.getElementById('manageNascimento').value = data.nascimento || "";
    document.getElementById('manageNivel').value = data.nivel || "iniciante";
    document.getElementById('managePlano').value = data.plano_escolhido || "";
    document.getElementById('manageStatus').value = data.status_matricula || (data.status === 'completo' ? 'aguardando_pagamento' : 'pendente');
    document.getElementById('manageProfessor').value = data.professor_atribuido || "";
    document.getElementById('managePagamento').checked = data.pagamento_verificado || false;
    document.getElementById('manageRespNome').value = data.responsavel_financeiro || "";
    document.getElementById('manageRespCpf').value = data.cpf_responsavel || "";
    
    currentTags = data.tags || [];
    renderTags();
    renderTimeline(data.timeline || []);

    document.getElementById('loadingOverlay').style.display = 'none';
}

async function saveManagementData() {
    const btn = document.getElementById('btnSave');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    btn.disabled = true;

    const updates = {
        nome: document.getElementById('manageNome').value,
        curso: document.getElementById('manageCurso').value,
        email: document.getElementById('manageEmail').value,
        telefone: document.getElementById('manageTelefone').value,
        cpf: document.getElementById('manageCpf').value,
        nascimento: document.getElementById('manageNascimento').value,
        nivel: document.getElementById('manageNivel').value,
        plano_escolhido: document.getElementById('managePlano').value,
        status_matricula: document.getElementById('manageStatus').value,
        professor_atribuido: document.getElementById('manageProfessor').value,
        pagamento_verificado: document.getElementById('managePagamento').checked,
        responsavel_financeiro: document.getElementById('manageRespNome').value,
        cpf_responsavel: document.getElementById('manageRespCpf').value,
        tags: currentTags
    };

    // 1. Tenta salvar no Firebase (Prioridade)
    try {
        await updateDoc(doc(db, "matriculas", currentId), updates);
        alert("Dados atualizados com sucesso!");
        
        // Opcional: Recarregar a página pai se estiver aberta
        if (window.opener && window.opener.loadDashboardData) {
            window.opener.loadDashboardData();
        }
        window.close();
    } catch (e) {
        // 2. Se falhar no Firebase, verifica se é Mock para simular
        if (mockStudents.find(s => s.id === currentId)) {
            setTimeout(() => {
                alert("Dados salvos (Simulação Mock)!");
                btn.innerHTML = '<i class="fa-solid fa-save"></i> Salvar Alterações';
                btn.disabled = false;
                // Atualiza o mock localmente
                const idx = mockStudents.findIndex(s => s.id === currentId);
                if(idx !== -1) mockStudents[idx] = { ...mockStudents[idx], ...updates };
            }, 500);
        } else {
            console.error(e);
            alert("Erro ao salvar alterações: " + e.message);
            btn.innerHTML = '<i class="fa-solid fa-save"></i> Salvar Alterações';
            btn.disabled = false;
        }
    } finally {
        // O finally é tratado dentro dos blocos para evitar reativar botão antes de fechar
    }
}

function renderTags() {
    const container = document.getElementById('tagContainer');
    container.innerHTML = "";
    currentTags.forEach((tag, index) => {
        const badge = document.createElement('span');
        badge.className = 'tag-badge';
        badge.innerHTML = `${tag} <i class="fa-solid fa-xmark"></i>`;
        badge.querySelector('i').onclick = () => removeTag(index);
        container.appendChild(badge);
    });
}

function removeTag(index) {
    currentTags.splice(index, 1);
    renderTags();
}

function renderTimeline(timelineData) {
    const list = document.getElementById('timelineList');
    list.innerHTML = "";
    if (!timelineData || timelineData.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; font-size: 0.9rem;">Nenhum histórico registrado.</p>';
        return;
    }
    const sorted = [...timelineData].sort((a, b) => new Date(b.date) - new Date(a.date));
    sorted.forEach(item => {
        const dateObj = new Date(item.date);
        const dateStr = dateObj.toLocaleDateString('pt-BR') + ' às ' + dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
        list.innerHTML += `
            <div class="timeline-entry">
                <div class="timeline-meta"><strong>${item.author || 'Sistema'}</strong><span>${dateStr}</span></div>
                <div class="timeline-text">${item.text}</div>
            </div>`;
    });
}

async function addTimelineItem() {
    const text = document.getElementById('newTimelineNote').value.trim();
    if (!text) return;
    
    // 1. Tenta salvar no Firebase
    try {
        const docRef = doc(db, "matriculas", currentId);
        await updateDoc(docRef, {
            timeline: arrayUnion({
                text: text,
                date: new Date().toISOString(),
                author: currentUserRole === 'admin' ? 'Diretoria' : 'Professor' // Simplificação
            })
        });
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) renderTimeline(docSnap.data().timeline || []);
        document.getElementById('newTimelineNote').value = "";
    } catch (e) { 
        // 2. Fallback para Mock
        if (mockStudents.find(s => s.id === currentId)) {
            const mockItem = { text, date: new Date().toISOString(), author: 'Você (Mock)' };
            renderTimeline([mockItem]); // Apenas visual
            document.getElementById('newTimelineNote').value = "";
        } else {
            console.error(e);
        }
    }
}