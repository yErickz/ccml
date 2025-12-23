# Histórico de Versões - CCML

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [1.0.1] - 2025-12-23
### Corrigido
- **Cache:** Implementado "Cache Busting" (`?v=1.0.1`) nos arquivos HTML para forçar o navegador a baixar a versão mais recente do CSS e JS após o deploy.

## [1.0.0] - 2025-12-23
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