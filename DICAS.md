# 💡 Dicas de Uso e Personalização

## 🎨 Personalizações Comuns

### 1. Alterar Dados Iniciais

Edite `src/services/seedData.js`:

```javascript
export const INITIAL_EXPENSES = [
  { name: "Sua Despesa", value: 100.00, paidStatus: Array(12).fill(false), overrides: {} },
  // Adicione mais despesas aqui
];
```

### 2. Mudar Cores do Sistema

Edite `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#10b981',  // Verde padrão
      secondary: '#3b82f6', // Azul
    }
  }
}
```

Depois substitua as classes no código:
- `bg-emerald-600` → `bg-primary`
- `text-emerald-600` → `text-primary`

### 3. Adicionar Categorias às Despesas

Em `src/services/seedData.js`, adicione campo `category`:

```javascript
{
  name: "Netflix",
  value: 50.00,
  category: "Entretenimento",
  paidStatus: Array(12).fill(false),
  overrides: {}
}
```

Depois atualize os componentes para exibir/filtrar por categoria.

### 4. Alterar Ano do Sistema

1. Atualize o título em `src/components/Sidebar.jsx`
2. Mude `VITE_APP_ID` no `.env.local` para `planejamento-2027`
3. Isso criará uma nova "pasta" no Firebase para os dados do novo ano

## 🔧 Funcionalidades Avançadas

### Adicionar Gráficos

Instale uma biblioteca de gráficos:

```bash
npm install recharts
```

Crie um novo componente `src/components/Charts.jsx`:

```javascript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getYearlyData } from '../services/calculations';

const Charts = ({ incomes, expenses, creditCardExpenses, invoiceTotals }) => {
  const data = getYearlyData(incomes, expenses, creditCardExpenses, invoiceTotals);

  return (
    <LineChart width={800} height={400} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="balance" stroke="#10b981" />
    </LineChart>
  );
};
```

### Exportar para Excel

Instale:

```bash
npm install xlsx
```

Adicione função de export:

```javascript
import * as XLSX from 'xlsx';

const exportToExcel = (data) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  XLSX.writeFile(wb, "financeiro.xlsx");
};
```

### Modo Escuro

Adicione ao `tailwind.config.js`:

```javascript
module.exports = {
  darkMode: 'class',
  // ...
}
```

Crie um hook `useDarkMode.js` e adicione toggle no Sidebar.

## 📊 Relatórios Personalizados

### Criar Relatório Mensal

```javascript
const generateMonthReport = (month, incomes, expenses, creditCardExpenses, invoiceTotals) => {
  const income = getMonthlyIncome(incomes, month);
  const fixedExpenses = getMonthlyFixedExpenses(expenses, month);
  const cardTotal = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, month);

  return {
    month: MONTHS[month],
    income,
    expenses: {
      fixed: fixedExpenses,
      card: cardTotal,
      total: fixedExpenses + cardTotal
    },
    balance: income - (fixedExpenses + cardTotal),
    savingsRate: ((income - (fixedExpenses + cardTotal)) / income * 100).toFixed(1)
  };
};
```

## 🔔 Notificações e Lembretes

### Adicionar Lembretes de Pagamento

Em `src/services/reminders.js`:

```javascript
export const checkDuePayments = (expenses, selectedMonth) => {
  const unpaid = expenses.filter(e => !e.paidStatus[selectedMonth]);

  if (unpaid.length > 0 && new Date().getDate() > 25) {
    return {
      message: `Você tem ${unpaid.length} contas não pagas este mês!`,
      list: unpaid.map(e => e.name)
    };
  }

  return null;
};
```

Use no `Dashboard.jsx`:

```javascript
useEffect(() => {
  const reminder = checkDuePayments(expenses, selectedMonth);
  if (reminder) {
    toast.warning(reminder.message);
  }
}, [expenses, selectedMonth]);
```

## 🎯 Metas Financeiras

### Adicionar Sistema de Metas

Crie `src/components/GoalsView.jsx`:

```javascript
const GoalsView = () => {
  const [goals, setGoals] = useState([
    { name: "Emergência", target: 30000, current: 5000 },
    { name: "Viagem", target: 15000, current: 2000 }
  ]);

  return (
    <div>
      {goals.map(goal => (
        <div key={goal.name}>
          <h3>{goal.name}</h3>
          <ProgressBar
            percentage={(goal.current / goal.target) * 100}
          />
          <p>{formatCurrency(goal.current)} de {formatCurrency(goal.target)}</p>
        </div>
      ))}
    </div>
  );
};
```

## 📱 PWA (Progressive Web App)

Para tornar o app instalável no celular:

1. Instale o plugin:
```bash
npm install vite-plugin-pwa -D
```

2. Configure em `vite.config.js`:
```javascript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Planejamento Financeiro 2026',
        short_name: 'Finanças',
        description: 'Gestão financeira pessoal',
        theme_color: '#10b981',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

## 🔍 Busca e Filtros Avançados

### Adicionar Busca nas Despesas

Em `MonthlyExpensesView.jsx`:

```javascript
const [searchTerm, setSearchTerm] = useState('');

const filteredExpenses = expenses.filter(e =>
  e.name.toLowerCase().includes(searchTerm.toLowerCase())
);

// No JSX:
<input
  type="text"
  placeholder="Buscar despesa..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
```

## 💾 Backup Automático

### Exportar Dados Regularmente

```javascript
const backupData = async () => {
  const data = {
    incomes,
    expenses,
    creditCardExpenses,
    vacationFund,
    invoiceTotals,
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};
```

## 🔒 Segurança Adicional

### Adicionar Confirmação de Email

No Firebase Console:
1. Authentication > Settings
2. Ative "Email enumeration protection"
3. Configure "Email verification"

### Limite de Taxa (Rate Limiting)

Nas Security Rules do Firestore, adicione:

```javascript
match /artifacts/{appId}/users/{userId}/{document=**} {
  allow write: if isOwner(userId)
    && request.time > resource.data.lastUpdate + duration.value(1, 's');
}
```

## 📈 Analytics

### Google Analytics 4

1. Crie propriedade no Google Analytics
2. Adicione ao `index.html`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🐛 Debug e Logs

### Modo Debug

Adicione em `.env.local`:

```env
VITE_DEBUG=true
```

Use no código:

```javascript
const DEBUG = import.meta.env.VITE_DEBUG === 'true';

if (DEBUG) {
  console.log('Debug info:', data);
}
```

---

**Dica Final**: Faça commits frequentes no Git para não perder alterações!

```bash
git add .
git commit -m "feat: adicionar gráficos ao dashboard"
git push
```
