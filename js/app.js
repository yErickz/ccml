import { initScrollAnimations, initOfflineDetector, initFormBehaviors } from "./utils.js";
import { initAuth } from "./auth-manager.js";
import { initEnrollment } from "./enrollment.js";
import { initDashboard, updateDashboardUI, loadDashboardData, loadOverviewData } from "./dashboard.js";
import { APP_VERSION } from "./config.js";
import { customAlert } from "./utils.js";

// --- Carregador de Componentes ---
async function loadComponent(url, containerId) {
    try {
        // Adiciona um parâmetro para evitar cache em componentes
        const response = await fetch(`${url}?v=${APP_VERSION}`);
        const html = await response.text();
        const container = document.getElementById(containerId);

        if (container) {
            // Se for o sidebar, removemos o container wrapper para não quebrar o CSS (Grid/Flex)
            if (containerId === 'sidebar-container') {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const sidebarElement = tempDiv.querySelector('.sidebar'); // Pega o elemento <aside>
                if (sidebarElement) container.replaceWith(sidebarElement);
                else container.innerHTML = html;
            } else {
                container.innerHTML = html;
            }
        }
    } catch (error) {
        console.error(`Erro ao carregar componente: ${url}`, error);
    }
}

// --- Inicialização Global ---
initScrollAnimations();
initOfflineDetector();
initFormBehaviors(); // Máscaras e validações de input

// --- Inicialização de Autenticação ---
initAuth({
    onLogin: () => {
        // Quando o usuário loga, atualiza o dashboard
        if (document.getElementById('teacherDashboard')) {
            updateDashboardUI();
            loadDashboardData();
            loadOverviewData(); // Carrega KPIs e Badge do Sidebar
        }
    }
});

// --- Inicialização Específica por Página ---

// 1. Página de Matrícula
if (document.getElementById('formMatricula')) {
    initEnrollment();
}

// 2. Painel do Professor
if (document.getElementById('teacherDashboard')) {
    loadComponent('sidebar.html', 'sidebar-container').then(() => {
        // Inicializa o dashboard APÓS o sidebar ser carregado
        initDashboard();
    });
}

// 3. Rodapé Dinâmico (Todas as páginas)
const footerContainer = document.getElementById('footer-container');
if (footerContainer) {
    loadComponent('components/footer.html', 'footer-container').then(() => {
        const versionEl = document.getElementById('appVersion');
        if (versionEl) versionEl.innerText = `v${APP_VERSION}`;
    });
}