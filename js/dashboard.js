import { db } from "./firebase-config.js";
import { collection, addDoc, deleteDoc, query, orderBy, limit, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";
import { currentUserRole, currentUserEmail } from "./auth-manager.js";
import { customAlert, customConfirm } from "./utils.js";

let currentTags = [];
let teachersList = []; // Lista dinâmica do banco

export function initDashboard() {
    // Expor funções globais
    window.switchView = switchView;
    window.openManagementView = openManagementView;
    window.closeManagementView = closeManagementView;
    window.saveManagementData = saveManagementData;
    window.addTimelineItem = addTimelineItem;
    window.removeTag = removeTag;
    window.filterStudents = filterStudents;
    window.toggleSidebar = toggleSidebar;
    window.selectPlan = selectPlan;
    window.addTeacher = addTeacher;
    window.removeTeacher = removeTeacher;
    window.startClass = startClass;
    window.exportData = exportData;
    window.sendCharge = sendCharge;
    window.toggleTheme = toggleTheme;

    // Listener para Tags
    const tagInput = document.getElementById('newTagInput');
    if (tagInput) {
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
    }

    // Lógica de Automação do Checkbox de Pagamento
    const paymentCheck = document.getElementById('managePagamento');
    if (paymentCheck) {
        paymentCheck.addEventListener('change', (e) => {
            const statusSelect = document.getElementById('manageStatus');
            if (e.target.checked && statusSelect && statusSelect.value === 'aguardando_pagamento') {
                customConfirm("Pagamento verificado! 💰\nDeseja alterar o status do aluno para 'Ativo' agora?", () => {
                    statusSelect.value = 'ativo';
                });
            }
        });
    }

    // Carregar professores ao iniciar
    loadTeachers();

    // Carregar Tema Salvo
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        // Pequeno delay para garantir que o DOM atualizou
        setTimeout(() => {
            const checkbox = document.getElementById('themeToggleCheckbox');
            if (checkbox) checkbox.checked = true;
        }, 50);
    }
}

export function updateDashboardUI() {
    const title = document.getElementById('dashTitle');
    const desc = document.getElementById('dashDesc');
    if (currentUserRole === 'admin') {
        title.innerHTML = 'Olá, Diretor(a)! 🎓';
        desc.innerHTML = 'Painel Administrativo - Acesso Total';
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
    } else {
        title.innerHTML = 'Olá, Professor(a)! 🎼';
        desc.innerHTML = 'Painel Pedagógico - Visualização de Alunos';
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
}

export async function loadDashboardData() {
    const list = document.getElementById('enrollmentList');
    if (!list) return;
    list.innerHTML = "";
    
    try {
        let q;
        if (currentUserRole === 'admin') {
            q = query(collection(db, "matriculas"), orderBy("data_registro", "desc"), limit(50));
        } else {
            q = query(collection(db, "matriculas"), where("professor_atribuido", "==", currentUserEmail));
        }
        
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            document.getElementById('loadingMsg').innerText = "Nenhuma matrícula recente.";
            return;
        }
        document.getElementById('loadingMsg').style.display = 'none';

        querySnapshot.forEach((doc) => {
            const d = doc.data();
            const docId = doc.id;
            const date = new Date(d.data_registro).toLocaleDateString('pt-BR');
            
            const nivelMap = {
                'iniciante': { label: 'Iniciante', class: 'nivel-iniciante' },
                'basico': { label: 'Básico', class: 'nivel-basico' },
                'intermediario': { label: 'Intermediário', class: 'nivel-intermediario' },
                'avancado': { label: 'Avançado', class: 'nivel-avancado' }
            };
            const nivelData = nivelMap[d.nivel] || { label: d.nivel || 'N/A', class: 'nivel-padrao' };
            
            const statusMap = {
                'pendente': { label: 'Pendente', class: 'status-pendente' },
                'aguardando_pagamento': { label: 'Aguardando Pagto', class: 'status-pagamento' },
                'ativo': { label: 'Ativo', class: 'status-ativo' },
                'inativo': { label: 'Inativo', class: 'status-inativo' }
            };
            const currentStatus = d.status_matricula || (d.status === 'completo' ? 'aguardando_pagamento' : 'pendente');
            const statusInfo = statusMap[currentStatus] || statusMap['pendente'];

            const respInfo = (currentUserRole === 'admin' && d.responsavel_financeiro) 
                ? `<br><small class="text-muted">Resp: ${d.responsavel_financeiro}</small>` : '';

            const actionBtn = (currentUserRole === 'admin') 
                ? `<td class="admin-only"><button class="btn-manage" onclick="openManagementView('${docId}')"><i class="fa-solid fa-pen-to-square"></i> Gerenciar</button></td>` : '';

            // Botão de Cobrança Rápida (WhatsApp) para pendentes
            let chargeBtn = "";
            if (currentStatus === 'pendente' || currentStatus === 'aguardando_pagamento') {
                const phone = (d.whatsapp_cobranca || d.telefone || "").replace(/\D/g, '');
                chargeBtn = `<button onclick="sendCharge('${d.nome}', '${phone}')" title="Enviar Cobrança" class="btn-whatsapp-charge"><i class="fa-brands fa-whatsapp"></i></button>`;
            }

            const row = `
                <tr class="student-row" data-name="${d.nome.toLowerCase()}" data-status="${currentStatus}" data-professor="${d.professor_atribuido || ''}">
                    <td>${date}</td>
                    <td><strong>${d.nome}</strong>${respInfo}</td>
                    <td><span class="badge-curso">${d.curso}</span></td>
                    <td><a href="https://wa.me/55${(d.whatsapp_cobranca || d.telefone || "").replace(/\D/g,'')}" target="_blank" class="link-gold"><i class="fa-brands fa-whatsapp"></i> Contatar</a>${chargeBtn}</td>
                    <td><span class="badge-nivel ${nivelData.class}">${nivelData.label}</span></td>
                    <td><span class="status-badge ${statusInfo.class}">${statusInfo.label}</span></td>
                    ${actionBtn}
                </tr>
            `;
            list.innerHTML += row;
        });
    } catch (e) {
        console.error("Erro ao carregar lista:", e);
        document.getElementById('loadingMsg').innerText = "Erro de permissão ou conexão.";
    }
}

function switchView(viewName, navElement) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active');

    if (navElement) {
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        navElement.classList.add('active');
    }
    
    if (viewName === 'students') loadDashboardData(); // Carrega tabela
    if (viewName === 'overview') loadOverviewData(); // Carrega Dashboard Piloto
    
    document.getElementById('managementView').style.display = 'none';
}

function filterStudents() {
    const text = document.getElementById('studentSearch').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const professor = document.getElementById('professorFilter') ? document.getElementById('professorFilter').value : 'all';
    const rows = document.querySelectorAll('.student-row');

    rows.forEach(row => {
        const name = row.getAttribute('data-name');
        const rowStatus = row.getAttribute('data-status');
        const rowProf = row.getAttribute('data-professor');
        const matchesText = name.includes(text);
        const matchesStatus = status === 'all' || rowStatus === status;
        const matchesProf = professor === 'all' || rowProf === professor;
        row.style.display = (matchesText && matchesStatus && matchesProf) ? '' : 'none';
    });
}

// --- LÓGICA DO DASHBOARD PILOTO (Overview) ---

export async function loadOverviewData() {
    // Atualiza data
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    const todayStr = new Date().toLocaleDateString('pt-BR', options);
    const dateDisplay = document.getElementById('currentDateDisplay');
    if(dateDisplay) dateDisplay.innerText = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

    try {
        // Busca todas as matrículas para calcular KPIs
        let q;
        if (currentUserRole === 'admin') {
            q = query(collection(db, "matriculas"));
        } else {
            q = query(collection(db, "matriculas"), where("professor_atribuido", "==", currentUserEmail));
        }
        const snapshot = await getDocs(q);
        
        let activeCount = 0;
        let revenue = 0;
        let delinquencyCount = 0;
        let students = [];
        let courseCounts = {};

        snapshot.forEach(doc => {
            const d = doc.data();
            students.push({ id: doc.id, ...d });

            // KPI: Alunos Ativos
            if (d.status_matricula === 'ativo') {
                activeCount++;
                
                // KPI: Faturamento (Estimativa baseada no plano)
                if (d.plano_escolhido === 'Turma') revenue += 189.90;
                else if (d.plano_escolhido === 'Musicalizacao') revenue += 199.90;
                else revenue += 250.00; // Individual/Inglês
            }

            // KPI: Inadimplência (Simplificado: status pendente ou aguardando)
            if (d.status_matricula === 'pendente' || d.status_matricula === 'aguardando_pagamento') {
                delinquencyCount++;
            }

            // Contagem de Cursos
            if (d.curso) courseCounts[d.curso] = (courseCounts[d.curso] || 0) + 1;
        });

        // Atualiza UI dos Cards Vitais
        animateValue("kpiActiveStudents", 0, activeCount, 1000);
        animateValue("kpiDelinquency", 0, delinquencyCount, 1000);
        
        // Atualiza Badge do Sidebar (Alunos Pendentes)
        const sidebarBadge = document.getElementById('sidebarPendingCount');
        if (sidebarBadge) {
            const prevCount = parseInt(sidebarBadge.innerText) || 0;
            sidebarBadge.innerText = delinquencyCount;
            sidebarBadge.style.display = delinquencyCount > 0 ? 'inline-block' : 'none';
            
            if (delinquencyCount > prevCount) {
                sidebarBadge.classList.remove('pulse');
                void sidebarBadge.offsetWidth; // Força o reflow para reiniciar a animação
                sidebarBadge.classList.add('pulse');
            }
        }
        
        // Se for admin, mostra financeiro. Se for professor, esconde ou adapta.
        if (currentUserRole === 'admin') {
            const revenueFormatted = revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            document.getElementById('kpiRevenue').innerText = revenueFormatted;
            const revPercent = Math.min((revenue / 25000) * 100, 100);
            document.getElementById('progRevenue').style.width = revPercent + "%";
        } else {
            document.getElementById('kpiRevenue').innerText = "---";
            document.getElementById('progRevenue').style.width = "0%";
        }

        // Barra de Alunos (Meta ajustada para professor)
        const metaAlunos = currentUserRole === 'admin' ? 150 : 40;
        const activePercent = Math.min((activeCount / metaAlunos) * 100, 100);
        document.getElementById('progActive').style.width = activePercent + "%";

        // Confetti se atingir a meta (Ex: 150 alunos)
        if (activeCount >= 150) {
            triggerConfetti();
        }

        // Gera Agenda e Widgets
        generateSmartAgenda(students);
        generateChurnRisk(students);
        generateBirthdays(students);
        generateHallOfFame(students);
        generateCourseChart(courseCounts);
        generateRevenueChart(students);

    } catch (e) {
        console.error("Erro ao carregar overview:", e);
    }
}

function generateCourseChart(counts) {
    const container = document.getElementById('courseChart');
    if (!container) return;
    container.innerHTML = "";

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5); // Top 5
    const max = sorted[0] ? sorted[0][1] : 1;

    sorted.forEach(([course, count]) => {
        const percent = (count / max) * 100;
        container.innerHTML += `
            <div class="chart-row">
                <div class="chart-label" title="${course}">${course}</div>
                <div class="chart-bar-bg"><div class="chart-bar-fill" style="width: ${percent}%"></div></div>
                <div class="chart-val">${count}</div>
            </div>
        `;
    });
}

function generateRevenueChart(students) {
    const container = document.getElementById('revenueChartContainer');
    if (!container) return;
    
    // 1. Preparar Dados (Últimos 6 meses)
    const months = [];
    const revenues = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });
        months.push(monthName);
        
        // Calcula receita acumulada até este mês
        // (Simplificação: considera ativo quem entrou antes ou neste mês)
        let monthRevenue = 0;
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
        
        students.forEach(s => {
            const regDate = new Date(s.data_registro);
            if (regDate <= endOfMonth && s.status_matricula === 'ativo') {
                if (s.plano_escolhido === 'Turma') monthRevenue += 189.90;
                else if (s.plano_escolhido === 'Musicalizacao') monthRevenue += 199.90;
                else monthRevenue += 250.00;
            }
        });
        revenues.push(monthRevenue);
    }

    // 2. Gerar SVG
    const maxVal = Math.max(...revenues, 1000); // Min 1000 pra não ficar zerado
    const width = container.clientWidth;
    const height = container.clientHeight;
    const padding = 40;
    
    // Pontos da linha
    const points = revenues.map((val, i) => {
        const x = padding + (i * (width - 2 * padding) / (revenues.length - 1));
        const y = height - padding - ((val / maxVal) * (height - 2 * padding));
        return `${x},${y}`;
    }).join(' ');

    // Labels X
    const labelsX = months.map((m, i) => {
        const x = padding + (i * (width - 2 * padding) / (revenues.length - 1));
        return `<text x="${x}" y="${height - 10}" text-anchor="middle" class="chart-svg-label" fill="#888" font-size="12">${m}</text>`;
    }).join('');

    // SVG Template
    const svg = `
        <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
            <!-- Grid Lines -->
            <line x1="${padding}" y1="${padding}" x2="${width-padding}" y2="${padding}" stroke="#eee" stroke-dasharray="4" />
            <line x1="${padding}" y1="${height/2}" x2="${width-padding}" y2="${height/2}" stroke="#eee" stroke-dasharray="4" />
            <line x1="${padding}" y1="${height-padding}" x2="${width-padding}" y2="${height-padding}" stroke="#eee" />
            
            <!-- Line -->
            <polyline points="${points}" fill="none" stroke="var(--gold)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            
            <!-- Dots -->
            ${revenues.map((val, i) => {
                const x = padding + (i * (width - 2 * padding) / (revenues.length - 1));
                const y = height - padding - ((val / maxVal) * (height - 2 * padding));
                return `<circle cx="${x}" cy="${y}" r="5" fill="#fff" stroke="var(--gold)" stroke-width="2" />
                        <text x="${x}" y="${y - 10}" text-anchor="middle" class="chart-svg-text" fill="#555" font-size="10" font-weight="bold">R$ ${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}</text>`;
            }).join('')}
            
            <!-- Labels -->
            ${labelsX}
        </svg>
    `;
    
    container.innerHTML = svg;
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }
}

function generateSmartAgenda(students) {
    const container = document.getElementById('timelineAgenda');
    if (!container) return;
    container.innerHTML = "";

    // Filtra apenas ativos para a agenda
    const activeStudents = students.filter(s => s.status_matricula === 'ativo');
    
    // Simula horários para demonstração (Em produção, usaria uma collection 'aulas')
    const hours = ["09:00", "10:00", "14:00", "15:00", "16:00", "18:00"];
    const currentHour = new Date().getHours();
    
    let classesCount = 0;

    // Pega até 5 alunos aleatórios para preencher a agenda do dia
    const todaysClasses = activeStudents.sort(() => 0.5 - Math.random()).slice(0, 5);

    todaysClasses.forEach((s, index) => {
        const time = hours[index % hours.length];
        const hourInt = parseInt(time.split(':')[0]);
        
        let statusClass = "future";
        let statusText = "Agendada";
        
        if (hourInt < currentHour) { statusClass = "done"; statusText = "Concluída"; }
        else if (hourInt === currentHour) { statusClass = "now"; statusText = "Em andamento"; }
        
        // Simula uma falta aleatória
        if (index === 3) { statusClass = "issue"; statusText = "Aluno Faltou"; }

        // Botão de Ação para o Professor
        let actionBtn = "";
        if (currentUserRole === 'professor' && (statusClass === 'now' || statusClass === 'future')) {
             actionBtn = `<button class="btn-action-agenda" onclick="startClass('${s.nome}')"><i class="fa-solid fa-play"></i> Iniciar Aula</button>`;
        }

        const html = `
            <div class="v-item ${statusClass}">
                <div class="v-time">${time}</div>
                <div class="v-content">
                    <div class="v-title">${s.nome} <span class="v-course">(${s.curso})</span></div>
                    <div class="v-subtitle">
                        <span><i class="fa-solid fa-chalkboard-user"></i> ${s.professor_atribuido ? s.professor_atribuido.split('@')[0] : 'Prof. Indefinido'}</span>
                        <span style="font-size:0.75rem; text-transform:uppercase; font-weight:bold;">${statusText}</span>
                    </div>
                    ${actionBtn}
                </div>
            </div>
        `;
        container.innerHTML += html;
        classesCount++;
    });

    document.getElementById('kpiClassesToday').innerText = classesCount;
}

function startClass(studentName) {
    customAlert(`Aula com <b>${studentName}</b> iniciada! 🎵\nO sistema registrou o horário de início.`, "Bom trabalho!");
}

function sendCharge(name, phone) {
    const msg = `Olá ${name.split(' ')[0]}, tudo bem? Passando para lembrar sobre a mensalidade do CCML. Podemos ajudar com o boleto ou Pix?`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function exportData() {
    const rows = document.querySelectorAll('.student-row');
    if (rows.length === 0) {
        customAlert("Não há dados para exportar.");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data,Nome,Curso,Telefone,Nivel,Status\n";

    rows.forEach(row => {
        if (row.style.display === 'none') return; // Pula linhas filtradas
        
        const cols = row.querySelectorAll('td');
        // Extração segura dos dados
        const data = cols[0].innerText.trim();
        const nome = cols[1].innerText.replace('Resp:', '').trim(); // Remove label de resp
        const curso = cols[2].innerText.trim();
        // Tenta pegar o número limpo do link do WhatsApp
        const phoneLink = cols[3].querySelector('a');
        const phone = phoneLink ? phoneLink.getAttribute('href').replace('https://wa.me/55', '').split('?')[0] : '';
        const nivel = cols[4].innerText.trim();
        const status = cols[5].innerText.trim();

        csvContent += `${data},"${nome}",${curso},${phone},${nivel},${status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "alunos_ccml.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateChurnRisk(students) {
    const list = document.getElementById('churnList');
    if (!list) return;
    
    // Simula risco: Alunos pendentes há muito tempo ou sem professor
    const riskyStudents = students.filter(s => s.status_matricula === 'pendente' || !s.professor_atribuido).slice(0, 3);
    
    if (riskyStudents.length > 0) {
        list.innerHTML = "";
        riskyStudents.forEach(s => {
            const phone = (s.whatsapp_cobranca || s.telefone || "").replace(/\D/g, '');
            list.innerHTML += `
                <div class="risk-item">
                    <div>
                        <div class="risk-name">${s.nome.split(' ')[0]}</div>
                        <div class="risk-reason">${!s.professor_atribuido ? 'Sem professor' : 'Pagamento pendente'}</div>
                    </div>
                    <button class="btn-whatsapp-mini" onclick="window.open('https://wa.me/55${phone}?text=Olá ${s.nome.split(' ')[0]}, tudo bem? Sentimos sua falta!', '_blank')"><i class="fa-brands fa-whatsapp"></i></button>
                </div>
            `;
        });
    }
}

function generateBirthdays(students) {
    // Lógica simplificada: Pega alunos aleatórios para demo, pois nem todos têm data válida
    // Em produção: filtrar por month === currentMonth
    const list = document.getElementById('bdayList');
    if(!list) return;
    list.innerHTML = "";
    
    const bdayStudents = students.slice(0, 2); // Pega 2 para exemplo
    bdayStudents.forEach(s => {
        const phone = (s.whatsapp_cobranca || s.telefone || "").replace(/\D/g, '');
        list.innerHTML += `
            <div class="bday-item">
                <div class="bday-date">HOJE</div>
                <div style="flex:1; font-size:0.9rem;">${s.nome}</div>
                <button class="btn-whatsapp-mini" style="background:#e91e63;" onclick="window.open('https://wa.me/55${phone}?text=Parabéns ${s.nome.split(' ')[0]}! Feliz aniversário! 🎂', '_blank')"><i class="fa-solid fa-gift"></i></button>
            </div>
        `;
    });
}

function generateHallOfFame(students) {
    const active = students.filter(s => s.status_matricula === 'ativo');
    if (active.length > 0) {
        const star = active[Math.floor(Math.random() * active.length)];
        document.getElementById('starStudentName').innerText = star.nome.split(' ')[0];
        document.getElementById('starStudentReason').innerText = `Destaque em ${star.curso}`;
    }
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// --- Gestão de Matrícula ---
async function openManagementView(id) {
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('managementView').style.display = 'block';
    document.getElementById('manageId').value = id;
    
    // Reset Fields
    ['manageNome', 'manageCurso', 'manageEmail', 'manageTelefone', 'manageCpf', 'manageNascimento', 'manageRespNome', 'manageRespCpf', 'managePlano', 'newTimelineNote'].forEach(id => document.getElementById(id).value = "");
    document.getElementById('manageNome').value = "Carregando...";
    
    currentTags = [];
    renderTags();
    renderTimeline([]);
    populateTeacherSelect();

    try {
        const docSnap = await getDoc(doc(db, "matriculas", id));
        if (docSnap.exists()) {
            const data = docSnap.data();
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
        } else {
            customAlert("Matrícula não encontrada.");
            closeManagementView();
        }
    } catch (e) {
        console.error("Erro ao carregar:", e);
        closeManagementView();
    }
}

function closeManagementView() {
    document.getElementById('managementView').style.display = 'none';
}

async function saveManagementData() {
    const id = document.getElementById('manageId').value;
    const btn = document.querySelector('button[onclick="saveManagementData()"]');
    if(btn) { btn.innerText = "Salvando..."; btn.disabled = true; }

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

    try {
        await updateDoc(doc(db, "matriculas", id), updates);
        customAlert("Dados atualizados com sucesso!", "Sucesso");
        closeManagementView();
        loadDashboardData();
    } catch (e) {
        customAlert("Erro ao salvar alterações.");
    } finally {
        if(btn) { btn.innerText = "Salvar Alterações"; btn.disabled = false; }
    }
}

// --- Gestão de Professores (Firebase) ---

async function loadTeachers() {
    try {
        const q = query(collection(db, "professores"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        teachersList = [];
        
        querySnapshot.forEach((doc) => {
            teachersList.push({ id: doc.id, ...doc.data() });
        });

        populateTeacherSelect();
        renderTeachersSettings();
    } catch (e) {
        console.error("Erro ao carregar professores:", e);
    }
}

async function addTeacher() {
    const name = document.getElementById('newTeacherName').value.trim();
    const email = document.getElementById('newTeacherEmail').value.trim();
    
    if (!name || !email) return customAlert("Por favor, preencha nome e e-mail.");

    try {
        await addDoc(collection(db, "professores"), { name, email });
        document.getElementById('newTeacherName').value = "";
        document.getElementById('newTeacherEmail').value = "";
        customAlert("Professor adicionado com sucesso!", "Sucesso");
        loadTeachers();
    } catch (e) {
        console.error(e);
        customAlert("Erro ao adicionar professor.");
    }
}

async function removeTeacher(id, email) {
    // Validação: Verificar se tem alunos ativos
    try {
        const q = query(collection(db, "matriculas"), where("professor_atribuido", "==", email), where("status_matricula", "==", "ativo"));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            customAlert(`Não é possível remover este professor.\n\nEle possui ${snapshot.size} aluno(s) ativo(s) vinculado(s). Transfira os alunos antes de excluir.`, "Ação Bloqueada");
            return;
        }

        customConfirm(`Tem certeza que deseja remover ${email} da equipe?`, async () => {
            await deleteDoc(doc(db, "professores", id));
            loadTeachers();
        });
    } catch (e) {
        console.error(e);
        customAlert("Erro ao verificar vínculos do professor.");
    }
}

// --- Auxiliares de UI ---

function populateTeacherSelect() {
    ['editProfessor', 'manageProfessor', 'professorFilter'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            // Mantém apenas a primeira opção (-- Selecione --)
            const defaultText = id === 'professorFilter' ? 'Todos os Professores' : '-- Selecione --';
            const defaultValue = id === 'professorFilter' ? 'all' : '';
            
            select.innerHTML = `<option value="${defaultValue}">${defaultText}</option>`;
            teachersList.forEach(t => {
                select.innerHTML += `<option value="${t.email}">${t.name}</option>`;
            });
        }
    });
}

function toggleTheme() {
    const checkbox = document.getElementById('themeToggleCheckbox');
    if (!checkbox) return; // Sai da função se o checkbox não existir

    const isDark = checkbox.checked;
    document.body.classList.toggle('dark-mode', isDark);
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function renderTags() {
    const container = document.getElementById('tagContainer');
    const input = document.getElementById('newTagInput');
    if (!container || !input) return;

    Array.from(container.getElementsByClassName('tag-badge')).forEach(el => el.remove());

    currentTags.forEach((tag, index) => {
        const badge = document.createElement('span');
        badge.className = 'tag-badge';
        badge.innerHTML = `${tag} <i class="fa-solid fa-xmark" onclick="removeTag(${index})"></i>`;
        container.insertBefore(badge, input);
    });
}

function removeTag(index) {
    currentTags.splice(index, 1);
    renderTags();
}

function renderTeachersSettings() {
    const list = document.getElementById('teachersListSettings');
    if (!list) return;
    list.innerHTML = "";
    
    teachersList.forEach(t => {
        list.innerHTML += `
            <li class="teacher-item">
                <span><strong>${t.name}</strong> <br><small>${t.email}</small></span>
                <button onclick="removeTeacher('${t.id}', '${t.email}')" class="btn-remove-teacher"><i class="fa-solid fa-trash"></i> Remover</button>
            </li>
        `;
    });
}

function renderTimeline(timelineData) {
    const list = document.getElementById('timelineList');
    list.innerHTML = "";
    if (!timelineData || timelineData.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; font-size: 0.8rem; padding: 20px;">Nenhum registro encontrado.</p>';
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
    const id = document.getElementById('manageId').value;
    if (!text) return;
    try {
        const docRef = doc(db, "matriculas", id);
        await updateDoc(docRef, {
            timeline: arrayUnion({
                text: text,
                date: new Date().toISOString(),
                author: currentUserRole === 'admin' ? 'Diretoria' : 'Professor'
            })
        });
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) renderTimeline(docSnap.data().timeline || []);
        document.getElementById('newTimelineNote').value = "";
    } catch (e) { console.error(e); }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    if (window.innerWidth > 992) sidebar.classList.toggle('collapsed');
    else sidebar.classList.toggle('active');
}

function selectPlan(planName) {
    customAlert(`Ótima escolha! O plano "${planName}" é excelente. Redirecionando para o WhatsApp...`, "Plano Selecionado");
    window.open(`https://wa.me/5594999999999?text=Olá, tenho interesse no plano ${planName}`, '_blank');
}