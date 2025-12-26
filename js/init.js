// === INICIALIZAÇÃO DO SISTEMA CCML ===
// Sistema robusto para evitar problemas com módulos ES6

// 1. CONFIGURAÇÕES GLOBAIS
window.APP_VERSION = "1.0.21";
window.DEV_MODE = false;
window.currentUserRole = "professor";
window.currentUserEmail = "";

// 2. CONFIGURAÇÕES DE EMAIL
window.EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
window.EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID"; 
window.EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
window.ADMIN_EMAILS = ["admin@ccml.com.br", "diretoria@ccml.com.br"];

// 3. DEFINIR GLOBAIS SEGURAS (Mocks)
// Garante que o site funcione visualmente mesmo antes do Firebase carregar
function defineSafeGlobals() {
    const funcs = ['collection', 'addDoc', 'doc', 'updateDoc', 'getDocs', 'getDoc', 'deleteDoc', 'query', 'where', 'orderBy', 'limit', 'arrayUnion', 'signInWithPopup', 'signOut', 'onAuthStateChanged', 'signInWithEmailAndPassword', 'sendPasswordResetEmail'];
    
    funcs.forEach(f => {
        if (typeof window[f] === 'undefined') {
            window[f] = () => { 
                console.warn(`Função ${f} chamada antes do Firebase estar pronto.`);
                return Promise.reject("Sistema carregando..."); 
            };
        }
    });
    
    if (!window.db) window.db = null;
    if (!window.auth) window.auth = null;
}

// 4. CARREGAR FIREBASE (CDN) - Em segundo plano
function loadFirebase() {
    const firebaseScript = document.createElement('script');
    firebaseScript.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js';
    firebaseScript.onload = function() {
        const compatScripts = [
            'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth-compat.js',
            'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js'
        ];
        
        let loaded = 0;
        compatScripts.forEach(src => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                loaded++;
                if (loaded === compatScripts.length) {
                    initFirebaseGlobals();
                }
            };
            document.head.appendChild(script);
        });
    };
    firebaseScript.onerror = function() {
        console.error("Modo Offline: Firebase não pôde ser carregado.");
    };
    document.head.appendChild(firebaseScript);
}

// 5. INICIALIZAR VARIÁVEIS GLOBAIS DO FIREBASE
function initFirebaseGlobals() {
    try {
        // Firebase Config
        const firebaseConfig = {
            apiKey: "AIzaSyCwVHchu1YDYU1lq8fgg2BXe1mTEpFZX_E",
            authDomain: "ccml-14df7.firebaseapp.com",
            projectId: "ccml-14df7",
            storageBucket: "ccml-14df7.firebasestorage.app",
            messagingSenderId: "628928118924",
            appId: "1:628928118924:web:0bc6ef97dd420982cf3ba9",
            measurementId: "G-C12JQGGPRY"
        };
        
        // Inicializar Firebase
        const app = firebase.initializeApp(firebaseConfig);
        window.db = firebase.firestore(app);
        window.auth = firebase.auth(app);
        window.provider = new firebase.auth.GoogleAuthProvider();
        
        // Funções de autenticação
        window.signInWithPopup = firebase.auth().signInWithPopup.bind(firebase.auth());
        window.signOut = firebase.auth().signOut.bind(firebase.auth());
        window.onAuthStateChanged = firebase.auth().onAuthStateChanged.bind(firebase.auth());
        window.signInWithEmailAndPassword = firebase.auth().signInWithEmailAndPassword.bind(firebase.auth());
        window.sendPasswordResetEmail = firebase.auth().sendPasswordResetEmail.bind(firebase.auth());
        
        // Funções do Firestore
        window.collection = firebase.firestore().collection.bind(firebase.firestore());
        window.addDoc = firebase.firestore().collection().add.bind(firebase.firestore().collection());
        window.doc = firebase.firestore().doc.bind(firebase.firestore());
        window.updateDoc = firebase.firestore().DocumentReference.prototype.update.bind(firebase.firestore().DocumentReference.prototype);
        window.getDocs = firebase.firestore().Query.prototype.get.bind(firebase.firestore().Query.prototype);
        window.getDoc = firebase.firestore().DocumentReference.prototype.get.bind(firebase.firestore().DocumentReference.prototype);
        window.deleteDoc = firebase.firestore().DocumentReference.prototype.delete.bind(firebase.firestore().DocumentReference.prototype);
        window.query = firebase.firestore().collection().query.bind(firebase.firestore().collection());
        window.where = firebase.firestore().query.bind(firebase.firestore().collection());
        window.orderBy = firebase.firestore().query.orderBy.bind(firebase.firestore().query);
        window.limit = firebase.firestore().query.limit.bind(firebase.firestore().query);
        window.arrayUnion = firebase.firestore.FieldValue.arrayUnion.bind(firebase.firestore.FieldValue);
        
        console.log("✅ Firebase carregado e configurado");
        
        // Re-conectar listeners de autenticação agora que o Firebase existe
        if (window.initAuth) {
            window.initAuth({
                onLogin: () => {
                    if (window.updateDashboardUI) window.updateDashboardUI();
                    if (window.loadDashboardData) window.loadDashboardData();
                    if (window.loadOverviewData) window.loadOverviewData();
                }
            });
        }
        
    } catch (error) {
        console.error("❌ Erro ao inicializar Firebase:", error);
        // Fallback para desenvolvimento sem Firebase
        window.db = null;
        window.auth = null;
        window.provider = null;
        console.log("⚠️ Continuando sem Firebase (modo desenvolvimento)");
    }
}

// 6. FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO
function initApp() {
    console.log("🚀 Iniciando aplicação CCML...");
    startApp();
}

function startApp() {
    try {
        // Carregar todas as funcionalidades
        loadBasicFunctions();
        loadAuthFunctions();
        loadEnrollmentFunctions();
        loadDashboardFunctions();
        
        // Carregar footer dinâmico
        const footerContainer = document.getElementById('footer-container');
        if (footerContainer) {
            loadComponent('footer.html', 'footer-container').then(() => {
                const versionEl = document.getElementById('appVersion');
                if (versionEl) versionEl.innerText = `v${window.APP_VERSION || "1.0.20"}`;
            });
        }
        
        // Carregar sidebar se necessário
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            loadComponent('sidebar.html', 'sidebar-container').then(() => {
                console.log("✅ Sidebar carregado");
            });
        }
        
        // Inicializações específicas por página
        if (document.getElementById('formMatricula')) {
            console.log("📝 Inicializando formulário de matrícula...");
            if (window.initEnrollment) {
                window.initEnrollment();
            }
        }
        
        if (document.getElementById('teacherDashboard')) {
            console.log("🎯 Inicializando dashboard do professor...");
            if (window.initDashboard) {
                window.initDashboard();
            }
            if (window.updateDashboardUI) {
                window.updateDashboardUI();
            }
            if (window.loadDashboardData) {
                window.loadDashboardData();
            }
            if (window.loadOverviewData) {
                window.loadOverviewData();
            }
        }
        
        
        console.log("✅ Aplicação CCML iniciada com sucesso!");
        
    } catch (error) {
        console.error("❌ Erro ao iniciar aplicação:", error);
    }
}

// Carregar funções básicas do sistema
function loadBasicFunctions() {
    // Se as funções básicas não existirem, criar versões simplificadas
    if (typeof initScrollAnimations !== 'function') {
        window.initScrollAnimations = function() {
            console.log("Animações de scroll inicializadas");
            const observerOptions = { threshold: 0.1 };
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, observerOptions);
            document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
        };
    }
    
    if (typeof initOfflineDetector !== 'function') {
        window.initOfflineDetector = function() {
            console.log("Detector offline inicializado");
        };
    }
    
    if (typeof initFormBehaviors !== 'function') {
        window.initFormBehaviors = function() {
            console.log("Comportamentos de formulário inicializados");
            
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
                    });
                }
            });
        };
    }
    
    if (typeof showError !== 'function') {
        window.showError = function(msg) {
            console.error("Erro:", msg);
            alert("Erro: " + msg);
        };
    }
    
    if (typeof customAlert !== 'function') {
        window.customAlert = function(message, title) {
            alert((title || "Aviso") + ": " + message);
        };
    }
}

// Carregar funções de autenticação
function loadAuthFunctions() {
    // Se as funções de auth não existirem, criar versões básicas
    if (typeof initAuth !== 'function') {
        window.initAuth = function(callbacks = {}) {
            console.log("Inicializando autenticação...");
            
            // Monitorar Auth State se Firebase disponível
            if (window.onAuthStateChanged) {
                window.onAuthStateChanged(window.auth, (user) => {
                    if (user) {
                        if (window.ADMIN_EMAILS.includes(user.email) || user.email.startsWith('admin')) {
                            window.currentUserRole = "admin";
                        } else {
                            window.currentUserRole = "professor";
                        }
                        window.currentUserEmail = user.email;

                        // UI Updates
                        const loginScreen = document.getElementById('loginScreen');
                        const dashboard = document.getElementById('teacherDashboard');
                        const nav = document.querySelector('nav');
                        
                        if (loginScreen) loginScreen.style.display = 'none';
                        if (dashboard) dashboard.style.display = 'block';
                        if (nav) nav.style.display = 'none';

                        if (callbacks.onLogin) callbacks.onLogin();
                    } else {
                        const loginScreen = document.getElementById('loginScreen');
                        const dashboard = document.getElementById('teacherDashboard');
                        
                        if (dashboard) dashboard.style.display = 'none';
                        if (loginScreen) loginScreen.style.display = 'flex';
                    }
                });
            }
            
            // Funções globais para o HTML
            window.handleGoogleLogin = window.handleGoogleLogin || function() {
                if (window.signInWithPopup) {
                    window.signInWithPopup(window.auth, window.provider);
                }
            };
            
            window.handleLogout = window.handleLogout || function() {
                if (window.signOut) {
                    window.signOut(window.auth);
                }
                // Reset UI
                if (document.getElementById('teacherDashboard')) {
                    document.getElementById('teacherDashboard').style.display = 'none';
                }
                if (document.getElementById('loginScreen')) {
                    document.getElementById('loginScreen').style.display = 'flex';
                }
                if (document.querySelector('nav')) {
                    document.querySelector('nav').style.display = 'flex';
                }
                if (document.getElementById('teacherPass')) {
                    document.getElementById('teacherPass').value = '';
                }
            };
            
            window.checkTeacherLogin = window.checkTeacherLogin || function(e) {
                const email = document.getElementById('teacherEmail')?.value;
                const pass = document.getElementById('teacherPass')?.value;
                const remember = document.getElementById('rememberMe')?.checked || false;

                if (email && pass && window.signInWithEmailAndPassword) {
                    window.signInWithEmailAndPassword(window.auth, email, pass).then(() => {
                        if (remember) localStorage.setItem('teacherEmail', email);
                        else localStorage.removeItem('teacherEmail');
                    }).catch(error => {
                        window.showError("E-mail ou senha incorretos.");
                    });
                    return;
                }

                // Fallback: Login Simples (Demo)
                if (!email && (pass === "admin123" || pass === "maestro")) {
                    window.currentUserRole = (pass === "admin123") ? "admin" : "professor";
                    window.currentUserEmail = (pass === "admin123") ? "admin@ccml.com.br" : "professor@ccml.com.br";
                    
                    if (document.getElementById('loginScreen')) {
                        document.getElementById('loginScreen').style.display = 'none';
                    }
                    if (document.getElementById('teacherDashboard')) {
                        document.getElementById('teacherDashboard').style.display = 'block';
                    }
                    if (document.querySelector('nav')) {
                        document.querySelector('nav').style.display = 'none';
                    }
                    
                    if (callbacks.onLogin) callbacks.onLogin();
                } else {
                    window.showError("E-mail ou senha incorretos.");
                }
            };
        };
    }
}

// Carregar funções de matrícula
function loadEnrollmentFunctions() {
    if (typeof initEnrollment !== 'function') {
        window.initEnrollment = function() {
            console.log("Inicializando sistema de matrícula...");
            
            // Função de envio de formulário
            window.enviarFormulario = window.enviarFormulario || function() {
                const form = document.getElementById('formMatricula');
                if (form) {
                    // Validação básica
                    const nome = document.getElementById('nomeAluno')?.value;
                    const cpf = document.getElementById('cpf')?.value;
                    const curso = document.getElementById('curso')?.value;
                    
                    if (!nome || !cpf || !curso) {
                        window.showError("Por favor, preencha todos os campos obrigatórios.");
                        return;
                    }
                    
                    // Simular envio
                    window.customAlert("Matrícula enviada com sucesso! Entraremos em contato em breve.", "Sucesso");
                }
            };
            
            // Função para seleção de planos
            window.selectPlan = window.selectPlan || function(plan) {
                console.log("Plano selecionado:", plan);
                window.customAlert(`Plano "${plan}" selecionado! Continue preenchendo o formulário.`, "Plano Selecionado");
            };
        };
    }
}

// Carregar funções do dashboard
function loadDashboardFunctions() {
    if (typeof initDashboard !== 'function') {
        window.initDashboard = function() {
            console.log("Inicializando dashboard...");
        };
    }
    
    if (typeof updateDashboardUI !== 'function') {
        window.updateDashboardUI = function() {
            console.log("Atualizando UI do dashboard...");
            
            // Atualizar informações do usuário
            const userEmailEl = document.getElementById('userEmail');
            if (userEmailEl && window.currentUserEmail) {
                userEmailEl.textContent = window.currentUserEmail;
            }
            
            // Atualizar role
            const userRoleEl = document.getElementById('userRole');
            if (userRoleEl && window.currentUserRole) {
                userRoleEl.textContent = window.currentUserRole === 'admin' ? 'Administrador' : 'Professor';
            }
        };
    }
    
    if (typeof loadDashboardData !== 'function') {
        window.loadDashboardData = function() {
            console.log("Carregando dados do dashboard...");
            
            // Simular dados para demonstração
            setTimeout(() => {
                const totalAlunosEl = document.getElementById('totalAlunos');
                if (totalAlunosEl) totalAlunosEl.textContent = '150';
                
                const totalProfessoresEl = document.getElementById('totalProfessores');
                if (totalProfessoresEl) totalProfessoresEl.textContent = '6';
                
                const totalMatriculasEl = document.getElementById('totalMatriculas');
                if (totalMatriculasEl) totalMatriculasEl.textContent = '280';
            }, 500);
        };
    }
    
    if (typeof loadOverviewData !== 'function') {
        window.loadOverviewData = function() {
            console.log("Carregando dados de overview...");
            
            // Simular dados de overview
            setTimeout(() => {
                const totalAlunosOverview = document.getElementById('totalAlunosOverview');
                if (totalAlunosOverview) totalAlunosOverview.textContent = '150';
                
                const matriculasMes = document.getElementById('matriculasMes');
                if (matriculasMes) matriculasMes.textContent = '23';
            }, 300);
        };
    }
}

// Carregamento de componentes (função simplificada)
async function loadComponent(url, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container ${containerId} não encontrado`);
        return;
    }

    console.log(`Carregando componente: ${url} no container: ${containerId}`);
    
    try {
        // Adiciona um indicador de carregamento
        container.innerHTML = '<div class="component-loader"><i class="fa-solid fa-spinner fa-spin"></i> Carregando...</div>';

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        const html = await response.text();
        
        if (containerId === 'sidebar-container') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const sidebarElement = tempDiv.querySelector('.sidebar');
            if (sidebarElement) {
                // Substituir o container pelo elemento sidebar
                container.parentNode.replaceChild(sidebarElement, container);
                console.log("✅ Sidebar carregado com sucesso");
            } else {
                container.innerHTML = html;
                console.log("✅ Sidebar carregado (fallback)");
            }
        } else {
            container.innerHTML = html;
            console.log(`✅ ${url} carregado com sucesso`);
        }
        
        // Atualizar versão no footer se for o caso
        if (containerId === 'footer-container') {
            const versionEl = document.getElementById('appVersion');
            if (versionEl) {
                versionEl.innerText = `v${window.APP_VERSION || "1.0.20"}`;
            }
        }
        
    } catch (error) {
        console.error(`❌ Erro ao carregar ${url}:`, error);
        container.innerHTML = `<div class="component-error" style="padding: 20px; text-align: center; color: #d32f2f; background: #ffebee; border-radius: 8px; margin: 10px;">
            <i class="fa-solid fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
            <div>Falha ao carregar componente</div>
            <small>Verifique se o arquivo ${url} existe</small>
        </div>`;
    }
}

// === EXECUÇÃO IMEDIATA ===
defineSafeGlobals(); // Previne erros de "undefined"

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initApp();      // Inicia UI imediatamente
        loadFirebase(); // Carrega banco em background
    });
} else {
    initApp();
    loadFirebase();
}
