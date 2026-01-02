# 📤 Como Publicar Alterações via GitHub Desktop

## 🎯 Passo a Passo Simples

### **1. Abrir o GitHub Desktop**

- Abra o aplicativo **GitHub Desktop**
- Se não estiver logado, faça login com sua conta GitHub

---

### **2. Adicionar o Repositório (só na primeira vez)**

Se ainda não adicionou o repositório:

1. Clique em **File** → **Add Local Repository**
2. Clique em **Choose...**
3. Navegue até: `/Users/pg/Projetos/Despesas`
4. Clique em **Add Repository**

---

### **3. Ver as Alterações**

No GitHub Desktop você verá:
- **Lado esquerdo**: Lista de arquivos modificados
- **Lado direito**: O que foi alterado em cada arquivo (verde = adicionado, vermelho = removido)

As alterações que você verá agora são:
- ✅ `src/components/MonthlyExpensesView.jsx` (botões de reordenação)
- ✅ `src/components/IncomeView.jsx` (botões de reordenação)

---

### **4. Fazer o Commit**

1. Na parte inferior esquerda, você verá:
   - **Summary** (obrigatório): Digite uma mensagem curta
   - **Description** (opcional): Descrição mais detalhada

2. **Digite no Summary:**
   ```
   feat: adicionar reordenação manual de despesas e receitas
   ```

3. **Digite na Description (opcional):**
   ```
   - Botões de seta (↑ ↓) para reordenar despesas
   - Botões de seta para reordenar receitas fixas e variáveis
   - Ordem salva automaticamente no Firebase
   ```

4. Clique no botão azul **"Commit to main"**

---

### **5. Enviar para o GitHub (Push)**

1. Após fazer o commit, você verá um botão no topo:
   **"Push origin"** ou **"Publish branch"**

2. Clique neste botão

3. Aguarde alguns segundos até aparecer uma mensagem de sucesso

---

### **6. Vercel vai fazer Deploy Automático**

1. A Vercel detecta automaticamente as mudanças no GitHub
2. Em 2-3 minutos, seu site será atualizado automaticamente
3. Você receberá um email (se configurado) quando o deploy terminar

---

## ✅ Verificar se Funcionou

### No GitHub Desktop:
- ✅ Não deve haver mais alterações pendentes
- ✅ Deve mostrar "No local changes"

### Na Vercel:
1. Acesse: https://vercel.com/dashboard
2. Clique no seu projeto `controle26`
3. Vá na aba **Deployments**
4. Você verá um novo deploy com status "Building" → "Ready"

### No Site:
1. Aguarde 2-3 minutos
2. Acesse seu site (controle26.vercel.app ou seu domínio)
3. Pressione **Ctrl+Shift+R** (ou Cmd+Shift+R no Mac) para atualizar forçado
4. Vá em "Despesas Mensais" ou "Receitas"
5. Você verá as setinhas (↑ ↓) ao lado de cada item!

---

## 🔄 Fluxo Completo Resumido

```
Alterações Locais
     ↓
GitHub Desktop (Commit)
     ↓
Push para GitHub
     ↓
Vercel detecta mudança
     ↓
Deploy automático
     ↓
Site atualizado! 🎉
```

---

## 🆘 Problemas Comuns

### "No repository found"
→ Você precisa fazer "Add Local Repository" primeiro (passo 2)

### "Authentication failed"
→ Faça login no GitHub Desktop novamente

### "Push failed"
→ Clique em "Pull origin" primeiro, depois tente "Push" novamente

### Site não atualiza
→ Aguarde 3-5 minutos e limpe o cache (Ctrl+Shift+R)

---

## 📝 Resumo Visual

**No GitHub Desktop:**
1. ✅ Ver alterações (lado esquerdo)
2. ✅ Escrever mensagem de commit (embaixo)
3. ✅ Clicar "Commit to main"
4. ✅ Clicar "Push origin"

**Pronto!** Em poucos minutos seu site estará atualizado com a nova funcionalidade de reordenação!

---

## 💡 Dica Pro

Para próximas alterações, você só precisa repetir os passos 4 e 5:
1. Fazer alterações no código
2. Abrir GitHub Desktop
3. Commit
4. Push
5. Aguardar deploy automático

É isso! Super simples! 🚀
