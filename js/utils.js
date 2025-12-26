// --- Configuração Global ---
export const DEV_MODE = false; // ⚠️ TRUE = Pula validações. FALSE = Modo normal.

// --- Animações de Scroll ---
export function initScrollAnimations() {
    const observerOptions = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// --- Sons do Sistema ---
export function playErrorSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
}

export function playSuccessSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
}

// --- Sistema de Pop-ups (Modais) ---
function initCustomModal() {
    if (!document.getElementById('customModal')) {
        const modalHTML = `
        <div id="customModal" class="custom-modal-overlay">
            <div class="custom-modal-box">
                <div id="modalIcon" style="font-size: 3rem; margin-bottom: 15px;"></div>
                <h3 id="modalTitle" style="margin-bottom: 10px; color: #333; font-size: 1.2rem;"></h3>
                <p id="modalMessage" style="color: #666; margin-bottom: 25px; line-height: 1.5; font-size: 0.95rem;"></p>
                <div id="modalActions" style="display: flex; gap: 10px; justify-content: center;"></div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const style = document.createElement('style');
        style.textContent = `
            .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 99999; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(3px); opacity: 0; visibility: hidden; transition: all 0.3s; }
            .custom-modal-overlay.active { opacity: 1; visibility: visible; }
            .custom-modal-box { background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 400px; text-align: center; transform: scale(0.9); transition: transform 0.3s; box-shadow: 0 10px 25px rgba(0,0,0,0.2); font-family: 'Montserrat', sans-serif; }
            .custom-modal-overlay.active .custom-modal-box { transform: scale(1); }
            .btn-modal { padding: 10px 24px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: 0.2s; }
            .btn-modal:hover { opacity: 0.9; transform: translateY(-1px); }
            .btn-primary { background: #C5A059; color: white; }
            .btn-secondary { background: #f0f0f0; color: #555; }
            .btn-danger { background: #e53935; color: white; }
        `;
        document.head.appendChild(style);
    }
}

export function showPopup({ title, message, icon = 'fa-circle-info', iconColor = '#C5A059', buttons = [] }) {
    initCustomModal();
    const modal = document.getElementById('customModal');
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalMessage').innerHTML = message.replace(/\n/g, '<br>');
    
    const iconEl = document.getElementById('modalIcon');
    iconEl.innerHTML = `<i class="fa-solid ${icon}"></i>`;
    iconEl.style.color = iconColor;

    const actionsEl = document.getElementById('modalActions');
    actionsEl.innerHTML = '';
    
    if (buttons.length === 0) {
        buttons.push({ text: 'OK', class: 'btn-primary', onClick: () => closePopup() });
    }

    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `btn-modal ${btn.class || 'btn-primary'}`;
        button.innerText = btn.text;
        button.onclick = () => {
            if (btn.onClick) btn.onClick();
            if (btn.close !== false) closePopup();
        };
        actionsEl.appendChild(button);
    });

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

export function closePopup() {
    const modal = document.getElementById('customModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

// Wrappers para substituir alert/confirm
export function customAlert(message, title = "Atenção") {
    showPopup({ title, message });
}

export function customConfirm(message, onConfirm, title = "Confirmação") {
    showPopup({
        title,
        message,
        icon: 'fa-circle-question',
        buttons: [
            { text: 'Cancelar', class: 'btn-secondary' },
            { text: 'Confirmar', class: 'btn-primary', onClick: onConfirm }
        ]
    });
}

export function showError(msg) {
    playErrorSound();
    showPopup({
        title: "Ops!",
        message: msg,
        icon: "fa-circle-exclamation",
        iconColor: "#d32f2f",
        buttons: [{ text: "Entendi", class: "btn-danger" }]
    });
}

// --- Validações e Formatações ---
export function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf == '') return false;
    if (cpf.length != 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev == 10 || rev == 11) rev = 0;
    if (rev != parseInt(cpf.charAt(10))) return false;
    return true;
}

export function formatName(name) {
    if (!name) return "";
    const exceptions = ["da", "de", "do", "dos", "e"];
    return name.toLowerCase().split(' ').map((word, index) => {
        if (index > 0 && exceptions.includes(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}

export function calculateAge(dobString) {
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
}

// --- Comportamentos de Formulário (Máscaras e Lógica Visual) ---
export function initFormBehaviors() {
    // Máscara CPF
    ['cpf', 'cpfResponsavel', 'manageCpf', 'manageRespCpf'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, "");
                if (value.length > 11) value = value.slice(0, 11);
                value = value.replace(/(\d{3})(\d)/, "$1.$2");
                value = value.replace(/(\d{3})(\d)/, "$1.$2");
                value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                e.target.value = value;
                
                // Validação visual imediata (apenas para o CPF principal da matrícula)
                if (id === 'cpf' && value.length === 14) {
                    if (validarCPF(value)) {
                        e.target.style.borderColor = "green";
                        e.target.style.backgroundColor = "#e8f5e9";
                    } else {
                        e.target.style.borderColor = "red";
                        e.target.style.backgroundColor = "#ffebee";
                        showError("CPF inválido.");
                    }
                }
            });
        }
    });

    // Máscara Telefone
    ['telefone', 'whatsappCobranca', 'manageTelefone'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, "");
                if (value.length > 11) value = value.slice(0, 11);
                value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
                value = value.replace(/(\d)(\d{4})$/, "$1-$2");
                e.target.value = value;
            });
        }
    });

    // Formatação de Nomes
    ['nomeAluno', 'nomeResponsavel'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', (e) => e.target.value = formatName(e.target.value));
        }
    });

    // Lógica de Data de Nascimento (Idade e Musicalização)
    const dateInput = document.getElementById('dataNascimento');
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.max = today;
        dateInput.min = "1900-01-01";

        dateInput.addEventListener('change', (e) => {
            const value = e.target.value;
            if (!value) return;
            
            if (value > today || value < "1900-01-01") {
                showError("Data de nascimento inválida.");
                e.target.value = "";
                return;
            }

            const age = calculateAge(value);
            const idadeInput = document.getElementById('idade');
            if (idadeInput) idadeInput.value = age + " anos";

            // Controle de Responsável
            const checkResp = document.getElementById('checkMesmoResponsavel');
            if (checkResp) {
                if (age < 18) {
                    checkResp.checked = false;
                    checkResp.disabled = true;
                    toggleResponsavel();
                } else {
                    checkResp.disabled = false;
                }
            }

            // Controle de Musicalização Infantil
            const cursoSelect = document.getElementById('curso');
            const aviso = document.getElementById('avisoMusicalizacao');
            if (cursoSelect && aviso) {
                if (age <= 6) {
                    cursoSelect.value = 'musicalizacao';
                    cursoSelect.style.pointerEvents = 'none';
                    cursoSelect.style.backgroundColor = '#f0f0f0';
                    aviso.style.display = 'block';
                    cursoSelect.dispatchEvent(new Event('change'));
                } else {
                    if (cursoSelect.value === 'musicalizacao' && cursoSelect.style.pointerEvents === 'none') {
                        cursoSelect.value = '';
                    }
                    cursoSelect.style.pointerEvents = 'auto';
                    cursoSelect.style.backgroundColor = 'white';
                    aviso.style.display = 'none';
                }
            }
        });
    }
}

export function toggleResponsavel() {
    const isStudentResp = document.getElementById('checkMesmoResponsavel').checked;
    const nomeAluno = document.getElementById('nomeAluno').value;
    const cpfAluno = document.getElementById('cpf').value;
    const zapAluno = document.getElementById('telefone').value;

    const nomeResp = document.getElementById('nomeResponsavel');
    const cpfResp = document.getElementById('cpfResponsavel');
    const zapResp = document.getElementById('whatsappCobranca');

    if (isStudentResp) {
        nomeResp.value = nomeAluno;
        cpfResp.value = cpfAluno;
        zapResp.value = zapAluno;
        nomeResp.readOnly = cpfResp.readOnly = zapResp.readOnly = true;
    } else {
        nomeResp.value = cpfResp.value = zapResp.value = "";
        nomeResp.readOnly = cpfResp.readOnly = zapResp.readOnly = false;
    }
}

export function toggleMenu() {
    const nav = document.querySelector('.nav-links');
    if (nav) nav.classList.toggle('active');
}

// --- Detector Offline ---
export function initOfflineDetector() {
    const handleStatusChange = () => {
        if (!navigator.onLine) showOfflineBanner();
        else hideOfflineBanner();
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    if (!navigator.onLine) showOfflineBanner();
}

function showOfflineBanner() {
    let banner = document.getElementById('offline-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; background-color: #2c3e50; color: #fff; text-align: center; padding: 12px; z-index: 99999; font-family: 'Montserrat', sans-serif; font-size: 0.9rem; box-shadow: 0 2px 10px rgba(0,0,0,0.2); transition: transform 0.3s ease-in-out; border-bottom: 3px solid #C5A059;`;
        banner.innerHTML = '<i class="fa-solid fa-cloud-arrow-down" style="color: #ffcc00; margin-right: 8px;"></i> <strong>Você está offline.</strong> Progresso salvo localmente.';
        document.body.appendChild(banner);
    }
    banner.style.transform = 'translateY(0)';
}

function hideOfflineBanner() {
    const banner = document.getElementById('offline-banner');
    if (banner) {
        banner.style.backgroundColor = '#27ae60';
        banner.innerHTML = '<i class="fa-solid fa-wifi" style="margin-right: 8px;"></i> Conexão restabelecida!';
        setTimeout(() => {
            banner.style.transform = 'translateY(-100%)';
            setTimeout(() => banner.remove(), 300);
        }, 4000);
    }
}

// Expor funções globais necessárias para o HTML
window.showError = showError;
window.customAlert = customAlert;
window.customConfirm = customConfirm;
window.calculateAge = calculateAge;
window.toggleResponsavel = toggleResponsavel;
window.toggleMenu = toggleMenu;