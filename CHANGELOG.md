# Histórico de Versões - CCML

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

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