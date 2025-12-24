# Histórico de Versões - CCML

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.17] - 2025-12-24 - "Segurança & Notificações"
### Adicionado
- **Segurança:** Dados salvos localmente (Auto-Save) agora expiram automaticamente após 30 minutos de inatividade para proteger informações em computadores compartilhados.
- **UX:** Aviso visual (Pop-up) informando quando o rascunho é limpo por inatividade.
### Alterado
- **WhatsApp:** A mensagem de confirmação agora é enviada para o **Responsável Financeiro** (Cliente) em vez da Secretaria.

## [1.0.16] - 2025-12-24 - "Validação de Disponibilidade"
### Adicionado
- **Regras de Negócio:** Validação cruzada que impede a seleção simultânea de "Sábado" e turno "Noite".
- **UX:** Feedback visual (opacidade e desabilitação) para combinações de horário inválidas.
### Corrigido
- **Layout:** Correção na estrutura de tags do Wizard (`fieldset`) que ocultava os botões de navegação.

## [1.0.15] - 2025-12-24 - "Refinamento de Planos"
### Alterado
- **Precificação:** Ajuste no valor da "Musicalização Infantil" para **R$ 199,90**.
- **Interface:** Padronização da descrição do plano de Inglês para "Aprendizado em grupo".
- **Lógica:** Aprimoramento no bloqueio automático de planos exclusivos (Inglês e Musicalização) ao selecionar o curso.

## [1.0.14] - 2025-12-23 - "Polimento & Robustez"
### Adicionado
- **UX/UI:**
  - **Animações:** Transições deslizantes entre etapas e efeito "Shake" (tremer) em erros.
  - **Feedback Sonoro:** Sons de erro e sucesso (Web Audio API).
  - **Visual:** Novo cabeçalho do formulário com ícone e design aprimorado.
  - **Feedback:** Spinner de carregamento no botão de avançar.
- **Funcionalidade:**
  - **Auto-Save:** Persistência automática de dados no `LocalStorage`.
  - **Offline Mode:** Detecção de queda de conexão com banner de aviso.
  - **Formatação:** Capitalização automática de nomes (Title Case).
- **Regras de Negócio:**
  - **Musicalização:** Bloqueio automático do curso para crianças ≤ 6 anos.
- **Desenvolvimento:**
  - **DEV_MODE:** Variável para pular validações em testes.

## [1.0.13] - 2025-12-23 - "Planos & UX"
### Adicionado
- **Matrícula:** Nova etapa de "Escolha de Plano" substituindo a Aula Experimental.
- **Lógica:** Seleção automática e bloqueio de plano quando o curso "Inglês com Música" é escolhido.
- **UX:** Máscara automática para campos de telefone/WhatsApp `(XX) XXXXX-XXXX`.
### Alterado
- **Planos:** Ajuste de valor do curso "Inglês com Música" para R$ 250,00 (Aula em Grupo).
### Removido
- **Matrícula:** Removida seção de agendamento de aula experimental.

## [1.0.12] - 2025-12-23 - "Lead Capture & Disponibilidade"
### Adicionado
- **Lead Capture:** Salvamento automático dos dados de contato (passo 1) para recuperação de matrículas incompletas.
- **Cursos:** Adicionado "Inglês com Música" à lista de opções.
- **Disponibilidade:** Novo sistema de seleção de preferência de horários (Dias e Turnos) substituindo agendamento fixo.
- **Aula Experimental:** Agendamento alterado para sistema de preferência (Dias/Turnos) para facilitar encaixe.
### Alterado
- **UX/UI:** Checkboxes de disponibilidade estilizados como "chips" (botões) para melhor usabilidade mobile.
- **Texto:** Seção de saúde reescrita com tom mais acolhedor e empático ("Saúde e Bem-estar").

## [1.0.11] - 2025-12-23 - "Detalhamento de Níveis"
### Alterado
- **Matrícula:** Descrições dos níveis musicais detalhadas com tempo de experiência estimado (ex: Básico = Até 6 meses).

## [1.0.10] - 2025-12-23 - "Ajustes de Curso"
### Alterado
- **Matrícula:** Substituído "Saxofone" por "Flauta Doce" na lista de cursos.
- **Funcionalidade:** Adicionado campo de texto para especificar o curso quando selecionado "Outro".

## [1.0.9-exp] - 2025-12-23 - "Matrícula Experimental"
### Adicionado
- **Matrícula:** Reformulação completa com sistema de "Passo a Passo" (Wizard).
- **Funcionalidade:** Barra de progresso, validação por etapas e novos campos detalhados (Saúde, Pedagógico, Financeiro).

## [1.0.7] - 2025-12-23 - "Atualização de Matrícula"
### Alterado
- **Matrícula:** Formulário atualizado para incluir campos administrativos (CPF, Dia da Aula, Horário, Valor).
- **Backend:** Ajuste no script de salvamento para corresponder aos novos campos do formulário.

## [1.0.6] - 2025-12-23 - "Remoção de Hosting"
### Removido
- **Configuração:** Arquivos `firebase.json` e `.firebaserc` excluídos, pois o Firebase Hosting não será mais utilizado.

## [1.0.5] - 2025-12-23 - "Organização de Arquivos"
### Refatorado
- **Estrutura:** Arquivo `style.css` movido para a pasta `css/` para melhor organização do projeto.

## [1.0.4] - 2025-12-23 - "Mobile & Responsividade"
### Adicionado
- **Mobile:** Menu hambúrguer implementado para navegação em dispositivos móveis.
- **Responsividade:** Tabelas agora possuem rolagem horizontal em telas pequenas (`.table-responsive`).
- **Estilo:** Ajustes de CSS para melhor visualização em smartphones.
- **Rodapé:** Exibição dinâmica da versão do sistema.
### Corrigido
- **Layout:** Removido rodapé estático duplicado na página inicial (`index.html`).

## [1.0.3] - 2025-12-23 - "Refatoração Estrutural"
### Refatorado
- **Estrutura:** Criação de `js/firebase-config.js` para centralizar credenciais e separar lógica de frontend/backend.
- **Página Inicial:** `index.html` atualizado para Landing Page institucional; login removido e centralizado no Painel do Professor.

## [1.0.2] - 2025-12-23 - "Dashboard & Matrícula"
### Adicionado
- **Painel do Professor:** Dashboard com "Analytics Visual" (gráficos de alunos e cursos) e lista de solicitações de matrícula.
- **Matrícula:** Suporte para cadastro de responsáveis por alunos menores de idade.
- **Navegação:** Menu principal unificado em todas as páginas.
- **Core:** Implementação do `js/app.js` gerenciando interatividade e conexão com Firebase.

## [1.0.1] - 2025-12-23 - "Correção de Cache"
### Corrigido
- **Cache:** Implementado "Cache Busting" (`?v=1.0.1`) nos arquivos HTML para forçar o navegador a baixar a versão mais recente do CSS e JS após o deploy.

## [1.0.0] - 2025-12-23 - "Lançamento Oficial"
### Adicionado
- **Identificação de Versão:** Adicionada constante `APP_VERSION` no `app.js` e exibição no rodapé.
- **Segurança:** Validação no formulário de matrícula (nome mínimo de 3 letras, telefone válido).
- **Máscara de Input:** Formatação automática do WhatsApp `(99) 99999-9999` enquanto digita.
- **EmailJS:** Integração para envio de e-mail automático ao receber nova matrícula.
- **Painel do Professor:**
  - Login com Google e Senha.
  - Tabela de visualização de matrículas puxadas do Firestore.
  - Animações de entrada.
- **Página de Progresso:** Sistema de geração de link compartilhável com conquistas do aluno.

### Corrigido
- **Deploy:** Correção do `firebase.json` para apontar para a pasta pública correta (`.`).
- **Estrutura:** Remoção de arquivos duplicados (`script.js`) e pastas temporárias.
- **Matrícula:** O formulário agora salva no banco de dados sem redirecionar obrigatoriamente para o WhatsApp.

---

## [0.9.0] - Versão Beta
### Adicionado
- Estrutura inicial do site (HTML/CSS).
- Conexão básica com Firebase.
- Estilização responsiva.

---

### Legenda de Tipos
- **Adicionado:** para novos recursos.
- **Alterado:** para mudanças em funcionalidades existentes.
- **Corrigido:** para correção de bugs.
- **Removido:** para recursos excluídos.