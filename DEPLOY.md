# 🚀 Guia Rápido de Deploy

## Checklist Pré-Deploy

- [ ] Código funcionando localmente (`npm run dev`)
- [ ] Variáveis de ambiente configuradas no `.env.local`
- [ ] Firebase configurado com Security Rules
- [ ] Autenticação Google ativada no Firebase
- [ ] Build de produção testado (`npm run build && npm run preview`)

## Deploy na Vercel (Recomendado)

### Opção 1: Via Dashboard (Mais Fácil)

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **"Add New Project"**
4. Importe o repositório do GitHub
5. Configure as variáveis de ambiente:
   - Vá em **Environment Variables**
   - Adicione todas as variáveis do `.env.local`:
     ```
     VITE_FIREBASE_API_KEY
     VITE_FIREBASE_AUTH_DOMAIN
     VITE_FIREBASE_PROJECT_ID
     VITE_FIREBASE_STORAGE_BUCKET
     VITE_FIREBASE_MESSAGING_SENDER_ID
     VITE_FIREBASE_APP_ID
     VITE_APP_ID
     ```
6. Clique em **Deploy**
7. Aguarde o build completar

### Opção 2: Via CLI

```bash
# Instalar Vercel CLI (apenas uma vez)
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Seguir prompts para configurar variáveis de ambiente
# Deploy para produção
vercel --prod
```

## Configurar Domínio Customizado (Opcional)

1. No dashboard da Vercel, vá em **Settings** > **Domains**
2. Adicione seu domínio
3. Configure os DNS conforme instruções da Vercel

## Atualizar Security Rules do Firebase

Após o primeiro deploy, configure o domínio da Vercel no Firebase:

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Authentication** > **Settings** > **Authorized domains**
3. Adicione o domínio da Vercel (ex: `seu-app.vercel.app`)

## Monitoramento Pós-Deploy

### Verificar se tudo está funcionando:

- [ ] Site abre sem erros
- [ ] Login com Google funciona
- [ ] Dados são salvos e carregados corretamente
- [ ] Todas as abas funcionam (Dashboard, Receitas, Despesas, etc.)
- [ ] Interface responsiva no mobile

### Logs e Debug:

- **Vercel**: Dashboard > Project > Deployments > Ver logs
- **Firebase**: Console > Analytics / Authentication / Firestore

## Redeploy (Atualizar o site)

### Via Git (Automático)

A Vercel faz deploy automático quando você faz push para a branch principal:

```bash
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

### Via CLI

```bash
vercel --prod
```

## Variáveis de Ambiente na Vercel

**IMPORTANTE**: Sempre que adicionar/modificar variáveis de ambiente:

1. Vá no Dashboard da Vercel
2. Settings > Environment Variables
3. Adicione/edite as variáveis
4. Faça um **Redeploy** do projeto

## Troubleshooting Deploy

### Erro: "Build failed"
- Verifique os logs no dashboard da Vercel
- Teste o build localmente: `npm run build`
- Verifique se todas as dependências estão no `package.json`

### Erro: "Firebase not configured"
- Confirme que as variáveis de ambiente foram adicionadas na Vercel
- Verifique se os nomes começam com `VITE_`
- Faça um redeploy após adicionar variáveis

### Login não funciona
- Adicione o domínio da Vercel nos "Authorized domains" do Firebase
- Verifique se a autenticação Google está ativada

### Dados não salvam
- Verifique as Security Rules do Firestore
- Confirme que o usuário está autenticado
- Verifique os logs do console do navegador (F12)

## Performance

### Otimizações Automáticas da Vercel:

✅ Compressão Gzip/Brotli
✅ CDN Global
✅ HTTPS automático
✅ Cache de assets estáticos

### Monitorar Performance:

- [PageSpeed Insights](https://pagespeed.web.dev/)
- Vercel Analytics (Dashboard > Analytics)

## Custos

### Vercel (Hobby Plan - Gratuito)

- ✅ 100 GB de bandwidth/mês
- ✅ Builds ilimitados
- ✅ HTTPS incluído
- ✅ Domínio `.vercel.app` grátis

### Firebase (Spark Plan - Gratuito)

- ✅ 1 GB de armazenamento
- ✅ 10 GB de transferência/mês
- ✅ 50K leituras/dia
- ✅ 20K escritas/dia

Para uso pessoal, o plano gratuito é suficiente.

## Backups

### Exportar dados do Firestore:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Exportar
firebase firestore:export backup-$(date +%Y%m%d)
```

## Rollback (Voltar versão anterior)

No dashboard da Vercel:
1. Vá em **Deployments**
2. Encontre o deploy anterior que funcionava
3. Clique nos três pontos (...) > **Promote to Production**

---

**Dúvidas?** Consulte a documentação oficial:
- [Vercel Docs](https://vercel.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
