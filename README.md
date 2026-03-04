# Team Up - App de Gestão Educacional

## 🎯 Objetivo do Projeto
O **Team Up** é uma aplicação voltada para a gestão e organização de equipes ou grupos em contextos educacionais, facilitando a colaboração e o acompanhamento de atividades.

## 🛠️ Stack Tecnológica
- **Core**: React 19 (Vite)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS (UI Pro Max / Glassmorphism)
- **Gerenciamento de Estado/Dados**: TanStack Query (React Query)
- **Exportação**: jsPDF & jsPDF-AutoTable
- **PWA**: Suporte a Progressive Web App (Service Workers & Manifest)
- **Deployment**: Surge.sh

## 🚀 Como Rodar Localmente

1. **Clone ou Baixe** o projeto.
2. **Instale as dependências**:
   ```bash
   npm install
   ```
3. **Configure as Variáveis de Ambiente**:
   - Crie um arquivo `.env.local` (se não existir).
   - Adicione sua chave de API: `VITE_GEMINI_API_KEY=sua_chave_aqui` (se aplicável).
4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

## 🌐 Deployment
O app está disponível online em:
**URL**: [https://team-up-edu.surge.sh](https://team-up-edu.surge.sh)

> *Nota: O domínio original `team-up.surge.sh` já estava ocupado, então o deploy foi realizado em `team-up-edu.surge.sh`.*

## 📜 Histórico de Modificações (Changelog)
- **v1.0.0 (2026-02-12)**: 
  - Build de produção gerado com Vite.
  - Implementação de suporte a SPA (200.html) para Surge.
  - Deploy realizado com sucesso em `team-up-edu.surge.sh`.
  - Atualização do README com documentação completa.
- **v1.1.0 (2026-02-12)**:
  - Adicionado "Auditório" à lista de equipamentos disponíveis.
  - Atribuição de ícone (🏛️) e cor (Cyan) exclusiva para o Auditório.
  - Rebuild da aplicação para produção.

