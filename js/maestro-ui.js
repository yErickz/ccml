// --- Configuração da IA (ChatGPT) ---
const OPENAI_API_KEY = ""; // Chave removida por segurança. Insira apenas localmente ou use variáveis de ambiente.

async function getChatGPTResponse(userText) {
    if (!OPENAI_API_KEY) return null;

    const url = "https://api.openai.com/v1/chat/completions";
    const systemPrompt = `Você é o Maestro Virtual do Centro Cultural Maestro Levi. 
    Seu tom é acolhedor, musical e educado. Use emojis relacionados a música. 
    Responda dúvidas sobre aulas de música, instrumentos e teoria musical. Mantenha as respostas curtas (máximo 3 frases).`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userText }
                ],
                max_tokens: 200
            })
        });
        const data = await response.json();
        
        if (data.error) {
            console.error("⚠️ Erro da API OpenAI:", data.error.message);
            return null;
        }
        
        return data.choices?.[0]?.message?.content;
    } catch (e) {
        console.error("Erro na IA:", e);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Correção: Previne erro de favicon 404 injetando um ícone vazio se não existir
    if (!document.querySelector("link[rel*='icon']")) {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = 'data:image/x-icon;base64,';
        document.head.appendChild(link);
    }

    // HTML do componente Maestro AI
    const aiComponent = `
    <style>
        .typing-indicator { display: flex; align-items: center; gap: 4px; padding: 12px 16px !important; width: fit-content; min-height: 24px; }
        .typing-indicator span {
            width: 6px; height: 6px; background-color: currentColor; opacity: 0.7; border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
    </style>
    <!-- AI Chat Floating Button -->
    <button class="ai-fab" onclick="toggleChat()">
        <i class="fa-solid fa-wand-magic-sparkles"></i> Fale com o Maestro IA
    </button>

    <!-- AI Chat Modal -->
    <div id="aiModal" class="ai-modal">
        <div class="ai-header">
            <span>Maestro Virtual - Centro Cultural Maestro Levi</span>
            <div style="display: flex; gap: 10px;">
                <button class="ai-clear" onclick="clearChat()" style="background:none; border:none; color:white; cursor:pointer;" title="Limpar Conversa"><i class="fa-solid fa-trash"></i></button>
                <button class="ai-minimize" onclick="minimizeChat()" style="background:none; border:none; color:white; cursor:pointer;"><i class="fa-solid fa-minus"></i></button>
                <button class="ai-close" onclick="toggleChat()"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </div>
        <div class="chat-container" id="chatContainer">
            <div class="message bot">
                Olá! Sou a IA do Centro Cultural Maestro Levi. 🎵<br>Posso te ajudar a escolher um instrumento ou tirar dúvidas sobre os cursos. O que gostaria de saber?
            </div>
        </div>
        <div class="input-area">
            <input type="text" id="userInput" placeholder="Digite sua dúvida..." onkeypress="handleKeyPress(event)">
            <button onclick="sendMessage()"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
    </div>
    `;

    // Injeta o HTML no final do body se ainda não existir
    if (!document.querySelector('.ai-fab')) {
        document.body.insertAdjacentHTML('beforeend', aiComponent);
    }

    // --- Correção: Renderiza Sidebar se estiver vazia (Fallback) ---
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer && !sidebarContainer.innerHTML.trim()) {
        sidebarContainer.innerHTML = `
            <div class="sidebar" style="width: 250px; background: #1a1a1a; color: white; height: 100vh; position: fixed; display: flex; flex-direction: column; z-index: 999;">
                <div class="sidebar-header" style="padding: 20px; border-bottom: 1px solid #333; color: #C5A059; font-weight: bold; font-size: 1.2rem; display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-music"></i> <span>Centro Cultural Maestro Levi</span>
                </div>
                <ul style="list-style: none; padding: 10px; flex: 1;">
                    <li class="nav-item active" onclick="switchView('overview')">
                        <a href="#" style="padding: 12px; display: flex; align-items: center; gap: 10px; color: #aaa; text-decoration: none;"><i class="fa-solid fa-chart-pie" style="width: 20px;"></i> Visão Geral</a>
                    </li>
                    <li class="nav-item" onclick="switchView('students')">
                        <a href="#" style="padding: 12px; display: flex; align-items: center; gap: 10px; color: #aaa; text-decoration: none;"><i class="fa-solid fa-users" style="width: 20px;"></i> Alunos</a>
                    </li>
                    <li class="nav-item" onclick="switchView('financial')">
                        <a href="#" style="padding: 12px; display: flex; align-items: center; gap: 10px; color: #aaa; text-decoration: none;"><i class="fa-solid fa-coins" style="width: 20px;"></i> Financeiro</a>
                    </li>
                    <li class="nav-item" onclick="switchView('settings')">
                        <a href="#" style="padding: 12px; display: flex; align-items: center; gap: 10px; color: #aaa; text-decoration: none;"><i class="fa-solid fa-gear" style="width: 20px;"></i> Configurações</a>
                    </li>
                </ul>
            </div>
        `;
    }
});

// --- Lógica do Chatbot (Movida do app.js) ---
window.toggleChat = () => {
    const modal = document.getElementById('aiModal');
    if (modal) {
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }
};

window.minimizeChat = () => {
    const container = document.getElementById('chatContainer');
    const inputArea = document.querySelector('.input-area');
    const btnIcon = document.querySelector('.ai-minimize i');

    if (container.style.display === 'none') {
        // Restaurar
        container.style.display = '';
        inputArea.style.display = '';
        if(btnIcon) btnIcon.className = "fa-solid fa-minus";
    } else {
        // Minimizar
        container.style.display = 'none';
        inputArea.style.display = 'none';
        if(btnIcon) btnIcon.className = "fa-solid fa-expand";
    }
};

window.clearChat = () => {
    const container = document.getElementById('chatContainer');
    if (confirm("Deseja limpar o histórico da conversa?")) {
        container.innerHTML = `
            <div class="message bot">
                Histórico limpo! 🧹<br>Como posso te ajudar agora?
            </div>
        `;
    }
};

window.sendMessage = async () => {
    const input = document.getElementById('userInput');
    const container = document.getElementById('chatContainer');
    const text = input.value.trim();
    
    if (text) {
        // Mensagem do Usuário
        container.innerHTML += `<div class="message user">${text}</div>`;
        input.value = '';
        container.scrollTop = container.scrollHeight;

        // Indicador de Digitando
        const typingId = 'typing-' + Date.now();
        container.insertAdjacentHTML('beforeend', `<div class="message bot typing-indicator" id="${typingId}"><span></span><span></span><span></span></div>`);
        container.scrollTop = container.scrollHeight;
        
        const lowerText = text.toLowerCase();
        let reply = "";

        // Delay mínimo para UX (para ver a animação de digitando)
        const minDelay = new Promise(resolve => setTimeout(resolve, 1000));

        // 1. Prioridade: Links Rápidos (Hardcoded para precisão)
        if (lowerText.match(/preço|valor|quanto custa|mensalidade/)) {
            reply = "Nossos planos começam a partir de **R$ 189,90** mensais. <br><a href='valores_ccml.html' style='color: var(--gold); text-decoration: underline;'>Ver Tabela Completa</a>.";
        } else if (lowerText.match(/matricula|inscrever|vaga/)) {
            reply = "As matrículas estão abertas! <br><a href='matricula.html' style='color: var(--gold); text-decoration: underline;'>Fazer Matrícula Online</a>";
        } else if (lowerText.match(/onde|endereço|local/)) {
            reply = "Estamos na Rua da Música, 123 - Centro. Venha nos visitar! 📍";
        }

        // 2. Inteligência Artificial (Se não for comando básico)
        if (!reply) {
            reply = await getChatGPTResponse(text);
        }

        // 3. Fallback (Se IA falhar ou não tiver chave)
        if (!reply) {
            if (lowerText.match(/oi|olá|bom dia/)) reply = "Olá! Como posso ajudar você hoje? 🎶";
            else if (lowerText.match(/piano|teclado/)) reply = "O curso de Piano é excelente! Trabalhamos leitura e percepção.";
            else reply = "Que interessante! Para essa dúvida específica, recomendo falar com nossa secretaria. <br><a href='https://wa.me/5594999999999' target='_blank' style='color: var(--gold); font-weight: bold;'><i class='fa-brands fa-whatsapp'></i> Chamar no WhatsApp</a>";
        }

        await minDelay; // Aguarda o tempo mínimo da animação

        // Remove indicador
        const typingEl = document.getElementById(typingId);
        if (typingEl) typingEl.remove();

        // Formata Markdown simples (**negrito**) para HTML
        reply = reply.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        container.innerHTML += `<div class="message bot">${reply}</div>`;
        container.scrollTop = container.scrollHeight;
        if (window.playNotificationSound) window.playNotificationSound();
    }
};

window.handleKeyPress = (e) => {
    if (e.key === 'Enter') window.sendMessage();
};

// --- Som de Notificação (Web Audio API) ---
window.playNotificationSound = () => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine'; // Onda senoidal (som suave)
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // Nota Dó (C5)
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // Sobe para Sol (G5)

        gain.gain.setValueAtTime(0.05, ctx.currentTime); // Volume baixo (5%)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4); // Fade out

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
        // Ignora erros caso o navegador bloqueie o áudio automático
    }
};