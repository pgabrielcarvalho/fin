# 🚀 Início Rápido - 5 minutos

## Passo 1: Instalar dependências

```bash
npm install
```

## Passo 2: Verificar configuração

O arquivo `.env.local` já está configurado com suas credenciais Firebase.

✅ Se você quiser usar outras credenciais, edite o arquivo `.env.local`

## Passo 3: Rodar localmente

```bash
npm run dev
```

O site abrirá automaticamente em `http://localhost:3000`

## Passo 4: Testar

1. Faça login com sua conta Google
2. Navegue pelas abas
3. Adicione algumas receitas/despesas
4. Verifique se os dados são salvos

## Passo 5: Deploy na Vercel

### Opção A: Via GitHub (Recomendado)

1. Crie um repositório no GitHub
2. Faça push do código:

```bash
git init
git add .
git commit -m "Initial commit - Sistema de Despesas v2.0"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-repo.git
git push -u origin main
```

3. Acesse [vercel.com](https://vercel.com)
4. Importe o repositório
5. Configure as variáveis de ambiente (copie do `.env.local`)
6. Deploy!

### Opção B: Via CLI da Vercel

```bash
npm i -g vercel
vercel login
vercel
```

## ⚠️ IMPORTANTE: Security Rules do Firebase

Depois do primeiro deploy, você DEVE configurar as Security Rules:

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Firestore Database** > **Regras**
3. Cole o conteúdo do arquivo `firestore.rules`
4. Clique em **Publicar**

Sem isso, os dados não serão salvos!

## 📱 Testar no celular

Depois do deploy, acesse o link da Vercel no seu celular para testar a responsividade.

## 🆘 Problemas?

### "Firebase config incompleta"
- Verifique o `.env.local`
- Confirme que as variáveis começam com `VITE_`

### "Permission denied" no Firestore
- Configure as Security Rules (veja acima)

### Outros problemas
- Veja o arquivo `DEPLOY.md` para troubleshooting completo
- Ou consulte o `README.md` para documentação detalhada

---

**Pronto!** Seu sistema está funcionando. Agora é só usar e personalizar conforme necessário.
