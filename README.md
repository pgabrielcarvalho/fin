# 💰 Planejamento Financeiro 2026

Sistema completo de gestão financeira pessoal desenvolvido com React, Firebase e Tailwind CSS.

## ✨ Funcionalidades

- 📊 **Dashboard**: Visão geral de receitas, despesas e saldo mensal
- 💵 **Gestão de Receitas**: Receitas fixas e variáveis com edição por mês
- 📅 **Despesas Mensais**: Checklist de pagamentos com controle de status
- 💳 **Cartão de Crédito**: Gestão de parcelamentos e fatura real
- 📈 **Visão Anual**: Planejamento completo dos 12 meses
- ✈️ **Fundo de Férias**: Controle separado de entradas e saídas

## 🚀 Tecnologias

- **React 18** - Framework JavaScript
- **Firebase** - Autenticação e banco de dados
- **Tailwind CSS** - Estilização
- **Vite** - Build tool
- **Vercel** - Deploy

## 📋 Pré-requisitos

- Node.js 18+
- Conta Firebase
- Conta Vercel (para deploy)

## 🔧 Instalação Local

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd Despesas
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite o `.env.local` e adicione suas credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
VITE_APP_ID=planejamento-2026
```

### 4. Execute o projeto

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

## 🔐 Configuração do Firebase

### 1. Crie um projeto no Firebase Console

Acesse [Firebase Console](https://console.firebase.google.com/) e crie um novo projeto.

### 2. Ative a Autenticação

- Vá em **Authentication** > **Sign-in method**
- Ative o provedor **Google**

### 3. Crie um banco Firestore

- Vá em **Firestore Database**
- Clique em **Criar banco de dados**
- Escolha **Modo de produção**

### 4. Configure as Security Rules

Vá em **Firestore** > **Regras** e cole o conteúdo do arquivo `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    match /artifacts/{appId}/users/{userId}/{document=**} {
      allow read, write: if isOwner(userId);
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 5. Obtenha as credenciais

- Vá em **Configurações do projeto** (ícone de engrenagem)
- Role até **Seus apps** e clique no ícone web `</>`
- Copie as credenciais e cole no `.env.local`

## 🌐 Deploy na Vercel

### 1. Instale a CLI da Vercel

```bash
npm i -g vercel
```

### 2. Faça login

```bash
vercel login
```

### 3. Deploy

```bash
vercel
```

### 4. Configure as variáveis de ambiente na Vercel

No dashboard da Vercel:
- Vá em **Settings** > **Environment Variables**
- Adicione todas as variáveis do `.env.local`
- Importante: use os mesmos nomes com o prefixo `VITE_`

### 5. Redeploy

```bash
vercel --prod
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── Dashboard.jsx
│   ├── IncomeView.jsx
│   ├── MonthlyExpensesView.jsx
│   ├── CreditCardView.jsx
│   ├── YearlyView.jsx
│   ├── VacationFundView.jsx
│   ├── LoginScreen.jsx
│   ├── Sidebar.jsx
│   └── MonthSelector.jsx
├── contexts/            # Context API
│   └── ToastContext.jsx
├── hooks/               # Custom Hooks
│   ├── useAuth.js
│   └── useFirestore.js
├── services/            # Lógica de negócio
│   ├── firebase.js
│   ├── calculations.js
│   └── seedData.js
├── utils/               # Funções utilitárias
│   └── formatters.js
├── App.jsx              # Componente principal
├── main.jsx             # Entry point
└── index.css            # Estilos globais
```

## 🔒 Segurança

### ⚠️ IMPORTANTE: Nunca commite credenciais

O arquivo `.env.local` está no `.gitignore` por motivos de segurança. **NUNCA** commite este arquivo ou qualquer credencial do Firebase no Git.

### Boas práticas implementadas:

✅ Variáveis de ambiente para credenciais
✅ Security Rules do Firestore configuradas
✅ Validação de dados antes de salvar
✅ Autenticação obrigatória
✅ Isolamento de dados por usuário

## 🎨 Personalização

### Alterar dados iniciais

Edite o arquivo `src/services/seedData.js` para personalizar as despesas e receitas iniciais.

### Alterar tema/cores

Edite `tailwind.config.js` para customizar as cores do sistema.

## 🐛 Troubleshooting

### Erro: "Firebase config incompleta"
- Verifique se todas as variáveis de ambiente estão preenchidas no `.env.local`
- Confirme que os nomes começam com `VITE_`

### Erro: "Permission denied" no Firestore
- Verifique se as Security Rules foram configuradas corretamente
- Confirme que você está autenticado

### Deploy não funciona na Vercel
- Verifique se as variáveis de ambiente estão configuradas no dashboard da Vercel
- Faça um novo deploy com `vercel --prod`

## 📊 Funcionalidades Técnicas

### Hooks Customizados

- `useAuth`: Gerencia autenticação (login, logout, estado do usuário)
- `useCollection`: Sincroniza coleções do Firestore em tempo real
- `useDocument`: Sincroniza documentos individuais
- `useFirestoreOperations`: CRUD operations (Create, Read, Update, Delete)

### Context API

- `ToastContext`: Sistema de notificações toast para feedback visual

### Serviços

- `firebase.js`: Configuração centralizada do Firebase
- `calculations.js`: Lógica de cálculos financeiros e validações
- `seedData.js`: Dados iniciais para novos usuários

## 📝 Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview da build de produção
npm run lint     # Lint do código
```

## 🤝 Contribuindo

Este é um projeto pessoal, mas sugestões são bem-vindas via Issues.

## 📄 Licença

Projeto pessoal - uso livre para fins educacionais.

---

**Desenvolvido com React + Firebase + Tailwind CSS** 🚀
