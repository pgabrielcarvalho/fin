# 🚀 DEPLOY IMEDIATO - Siga estes passos

## ✅ O QUE JÁ FOI FEITO AUTOMATICAMENTE

- ✅ Projeto configurado com Firebase (suas credenciais reais)
- ✅ Git inicializado
- ✅ Primeiro commit criado
- ✅ .gitignore protegendo suas credenciais
- ✅ Código testado e funcionando localmente

---

## 📋 O QUE VOCÊ PRECISA FAZER (3 passos simples)

### **PASSO 1: Criar repositório no GitHub** (2 minutos)

1. Abra o navegador e acesse: https://github.com/new
2. Preencha:
   - **Repository name:** `despesas-2026` (ou o nome que preferir)
   - **Description:** Sistema de Gestão Financeira 2026
   - **Visibilidade:** ✅ Private (recomendado) ou Public
   - ⚠️ **NÃO marque** "Add a README file"
   - ⚠️ **NÃO marque** "Add .gitignore"
3. Clique em **"Create repository"**

4. **Copie o link que aparece** (algo como: `https://github.com/seu-usuario/despesas-2026.git`)

---

### **PASSO 2: Enviar código para o GitHub** (1 minuto)

Volte para o terminal e execute estes comandos (substitua o link pelo seu):

```bash
# Adicionar o repositório remoto (USE SEU LINK AQUI)
git remote add origin https://github.com/SEU-USUARIO/despesas-2026.git

# Enviar o código
git branch -M main
git push -u origin main
```

**Digite suas credenciais do GitHub se solicitado.**

✅ Pronto! Código está no GitHub.

---

### **PASSO 3: Deploy na Vercel** (3 minutos)

#### 3.1 - Importar do GitHub

1. Acesse: https://vercel.com
2. Clique em **"Add New"** → **"Project"**
3. Se pedir para conectar GitHub:
   - Clique em **"Connect Git Provider"**
   - Escolha **GitHub**
   - Autorize a Vercel
4. Procure seu repositório `despesas-2026`
5. Clique em **"Import"**

#### 3.2 - Configurar Variáveis de Ambiente

**IMPORTANTE**: Antes de fazer deploy, adicione as variáveis:

1. Na tela de configuração, role até **"Environment Variables"**
2. Adicione **UMA POR UMA** as seguintes variáveis:

| Nome da Variável | Valor |
|------------------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyBo85fOEKZzAIshCAPIKCs4LTrnuCnRbvg` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `planejamento-2026-82a96.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `planejamento-2026-82a96` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `planejamento-2026-82a96.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `161920317938` |
| `VITE_FIREBASE_APP_ID` | `1:161920317938:web:51b0677afb1a16de23936b` |
| `VITE_APP_ID` | `planejamento-2026` |

**Como adicionar:**
- Clique em **"Add"** ou no campo de variável
- Cole o **nome exato** (com VITE_ na frente)
- Cole o **valor**
- Repita para todas as 7 variáveis

#### 3.3 - Deploy

1. Depois de adicionar todas as variáveis, clique em **"Deploy"**
2. Aguarde 2-3 minutos (a Vercel vai buildar seu projeto)
3. ✅ Quando terminar, você verá: **"Congratulations!"**

#### 3.4 - Copiar o Link

1. Copie o link que aparece (algo como: `despesas-2026.vercel.app`)
2. **GUARDE ESTE LINK** - é o endereço do seu sistema!

---

## 🔒 PASSO 4: Configurar Firebase (OBRIGATÓRIO)

Sem este passo, o login NÃO vai funcionar!

1. Acesse: https://console.firebase.google.com/
2. Selecione o projeto: **planejamento-2026-82a96**

### 4.1 - Adicionar Domínio Autorizado

1. No menu lateral, clique em **"Authentication"**
2. Clique na aba **"Settings"**
3. Role até **"Authorized domains"**
4. Clique em **"Add domain"**
5. Cole seu link da Vercel (ex: `despesas-2026.vercel.app`)
6. Clique em **"Add"**

### 4.2 - Configurar Security Rules

1. No menu lateral, clique em **"Firestore Database"**
2. Clique na aba **"Rules"**
3. **Copie TODO o conteúdo** do arquivo `firestore.rules` que está na pasta do projeto
4. **Cole** no editor de regras (substitua tudo que está lá)
5. Clique em **"Publish"**

---

## ✅ TESTAR O SISTEMA

1. Abra seu link da Vercel no navegador
2. Clique em **"Entrar com Google"**
3. Faça login com sua conta Google
4. Adicione algumas receitas/despesas
5. Verifique se os dados são salvos

---

## 🎉 PRONTO!

Seu sistema está no ar! Compartilhe o link da Vercel para acessar de qualquer lugar.

---

## 📝 RESUMO DO QUE VOCÊ FEZ

✅ Criou repositório no GitHub
✅ Enviou código para o GitHub
✅ Importou projeto na Vercel
✅ Configurou variáveis de ambiente
✅ Fez deploy
✅ Autorizou domínio no Firebase
✅ Configurou Security Rules

---

## 🆘 PROBLEMAS COMUNS

### "Permission denied" no Firebase
→ Verifique se configurou as Security Rules (Passo 4.2)

### Login não funciona
→ Verifique se adicionou o domínio da Vercel no Firebase (Passo 4.1)

### Site não carrega
→ Verifique se adicionou TODAS as 7 variáveis de ambiente na Vercel

### Erro "Firebase not configured"
→ Verifique se os nomes das variáveis começam com `VITE_`

---

## 🔄 ATUALIZAR O SITE (depois do primeiro deploy)

Sempre que você fizer mudanças no código:

```bash
git add .
git commit -m "descrição da mudança"
git push
```

A Vercel vai atualizar automaticamente em 2-3 minutos!

---

**Qualquer dúvida, consulte o arquivo DEPLOY.md para mais detalhes.**
