# CCML - Centro Cultural Maestro Levi 🎵

Sistema de gestão escolar e website institucional desenvolvido para o Centro Cultural Maestro Levi. O projeto combina uma Landing Page moderna com um sistema de matrículas online inteligente e um painel administrativo para professores.

## 🚀 Funcionalidades

### 🏠 Área Pública
- **Landing Page:** Apresentação da escola, estatísticas e chatbot com IA simulada.
- **Matrícula Online (Wizard):** Formulário passo a passo com:
  - **Captura de Leads:** Salva o contato na primeira etapa para recuperação de matrículas incompletas.
  - **Validação Inteligente:** Verificação de CPF, Data de Nascimento e formatação automática de nomes.
  - **Regras de Negócio:** Direcionamento automático para "Musicalização Infantil" (crianças ≤ 6 anos).
  - **Disponibilidade:** Seleção de preferências de dias e turnos.
  - **Resiliência:**
    - **Auto-Save:** Progresso salvo automaticamente no dispositivo (LocalStorage).
    - **Modo Offline:** Detecção de queda de internet com proteção de dados.
- **Planos e Valores:** Tabela comparativa de preços.

### 👨‍🏫 Área do Professor (Admin)
- **Login Seguro:** Autenticação via Google ou Senha.
- **Dashboard:**
  - Visão geral com gráficos de alunos e crescimento.
  - Lista de solicitações de matrícula em tempo real.
  - Gerador de Feedback para alunos (copia para WhatsApp).
  - Agenda visual.

### ✨ UX/UI (Experiência do Usuário)
- **Feedback Visual:** Animações de transição (slide), efeito "shake" em erros e spinners de carregamento.
- **Feedback Sonoro:** Sons sutis para sucesso e erro (Web Audio API).
- **Responsividade:** Design adaptado para Mobile e Desktop.

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3 (Responsivo), JavaScript (Modules).
- **Backend (BaaS):** Firebase (Google).
  - **Firestore:** Banco de dados NoSQL para matrículas.
  - **Authentication:** Sistema de login.
- **Hospedagem:** GitHub Pages / Vercel (Frontend estático).

## 📂 Estrutura do Projeto

```
/
├── index.html            # Página Inicial
├── matricula.html        # Formulário de Matrícula (Wizard)
├── painel_professor.html # Dashboard Administrativo
├── valores_ccml.html     # Tabela de Preços
├── progresso.html        # Área do Aluno
├── css/
│   └── style.css         # Estilos Globais
├── js/
│   ├── app.js            # Lógica Principal (DOM, Eventos)
│   ├── db.js             # Funções auxiliares de Banco de Dados
│   └── firebase-config.js # Credenciais do Firebase
└── assets/               # Imagens e Ícones
```

## ⚙️ Como Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/yErickz/ccml.git
   cd ccml
   ```

2. **Servidor Local:**
   Como o projeto usa Módulos ES6, é necessário um servidor HTTP local.
   ```bash
   npx serve .
   ```
   Ou utilize a extensão "Live Server" no VS Code.

3. **Acesse:**
   Abra `http://localhost:3000` no seu navegador.

---
Desenvolvido com 💙 para o CCML.