# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2.0.0] - 2026-01-02

### 🎉 Refatoração Completa - Fase 1 e 2

#### ✨ Adicionado

- **Arquitetura Modular**: Separação em componentes, hooks, services e utils
- **Hooks Customizados**:
  - `useAuth`: Gerenciamento de autenticação
  - `useCollection`: Sincronização de coleções Firestore
  - `useDocument`: Sincronização de documentos
  - `useFirestoreOperations`: Operações CRUD
- **Sistema de Notificações**: Toast context para feedback visual
- **Validações**: Validação de dados antes de salvar no banco
- **Variáveis de Ambiente**: Credenciais movidas para `.env.local`
- **Security Rules**: Regras de segurança do Firestore implementadas
- **Documentação Completa**: README, DEPLOY e CHANGELOG

#### 🔄 Modificado

- **Componentes Separados**:
  - LoginScreen.jsx
  - Sidebar.jsx
  - Dashboard.jsx
  - IncomeView.jsx
  - MonthlyExpensesView.jsx
  - CreditCardView.jsx
  - YearlyView.jsx
  - VacationFundView.jsx
- **App.jsx**: Refatorado para usar novos componentes e hooks
- **Cálculos**: Extraídos para `services/calculations.js`
- **Formatação**: Funções utilitárias em `utils/formatters.js`

#### 🔒 Segurança

- Credenciais Firebase removidas do código-fonte
- Variáveis de ambiente implementadas
- Security Rules do Firestore configuradas
- Validação de dados implementada
- `.gitignore` atualizado para proteger credenciais

#### 🎨 UI/UX

- Toast notifications para feedback de operações
- Loading states em botões
- Confirmações antes de deletar
- Animações suaves (fade-in, slide-in)
- Scrollbar customizada

#### ⚡ Performance

- Hooks otimizados com useCallback e useMemo
- Componentes separados para evitar re-renders
- Persistência offline habilitada (Firebase)

#### 📁 Estrutura

```
src/
├── components/      # Componentes React
├── contexts/        # Context API (Toast)
├── hooks/           # Custom Hooks
├── services/        # Lógica de negócio
└── utils/           # Funções utilitárias
```

### 🐛 Correções

- Timeout de autenticação adicionado (5s)
- Tratamento de erros melhorado
- Validação de configuração Firebase

---

## [1.0.0] - 2025-12-XX

### Versão Inicial

- Sistema básico de gestão financeira
- Dashboard com visão geral
- Gestão de receitas fixas e variáveis
- Despesas mensais com checklist
- Cartão de crédito com parcelamentos
- Visão anual
- Fundo de férias
- Autenticação Google via Firebase
- Persistência de dados no Firestore
- Deploy na Vercel

---

## Tipos de Mudanças

- ✨ **Adicionado**: para novas funcionalidades
- 🔄 **Modificado**: para mudanças em funcionalidades existentes
- 🗑️ **Removido**: para funcionalidades removidas
- 🐛 **Correções**: para correção de bugs
- 🔒 **Segurança**: para correções de vulnerabilidades
- ⚡ **Performance**: para melhorias de performance
- 📚 **Documentação**: para mudanças na documentação
