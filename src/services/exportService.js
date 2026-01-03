import { formatCurrency, MONTHS } from '../utils/formatters';
import {
  getMonthlyIncome,
  getMonthlyFixedExpenses,
  getMonthlyCardTotal,
  getMonthlyBalance
} from './calculations';

/**
 * Exporta dados financeiros em formato JSON
 */
export const exportToJSON = (data) => {
  const exportData = {
    exportDate: new Date().toISOString(),
    version: '2.0.0',
    ...data
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backup-financeiro-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporta dados financeiros em formato CSV
 */
export const exportToCSV = (data, selectedMonth = null) => {
  const { incomes, expenses, creditCardExpenses, invoiceTotals } = data;

  let csv = '';

  if (selectedMonth !== null) {
    // Exportar dados de um mês específico
    csv = `Relatório Financeiro - ${MONTHS[selectedMonth]}\n\n`;

    // Receitas
    csv += 'RECEITAS\n';
    csv += 'Nome,Valor,Status\n';
    incomes.forEach(income => {
      const value = income.overrides?.[selectedMonth] ?? income.value;
      const status = income.paidStatus?.[selectedMonth] ? 'Recebido' : 'Pendente';
      csv += `"${income.name}",${value},${status}\n`;
    });

    csv += '\n';

    // Despesas Fixas
    csv += 'DESPESAS FIXAS\n';
    csv += 'Nome,Valor,Status\n';
    expenses.forEach(expense => {
      const value = expense.overrides?.[selectedMonth] ?? expense.value;
      const status = expense.paidStatus?.[selectedMonth] ? 'Pago' : 'Pendente';
      csv += `"${expense.name}",${value},${status}\n`;
    });

    csv += '\n';

    // Cartão de Crédito
    csv += 'CARTÃO DE CRÉDITO\n';
    csv += 'Nome,Valor,Categoria,Status\n';
    creditCardExpenses.forEach(expense => {
      if (expense.monthsActive?.[selectedMonth]) {
        const value = expense.overrides?.[selectedMonth] ?? expense.value;
        const category = expense.category || 'Geral';
        const status = expense.paidStatus?.[selectedMonth] ? 'Pago' : 'Pendente';
        csv += `"${expense.name}",${value},"${category}",${status}\n`;
      }
    });

    csv += '\n';

    // Resumo
    const income = getMonthlyIncome(incomes, selectedMonth);
    const fixedExpenses = getMonthlyFixedExpenses(expenses, selectedMonth);
    const cardExpenses = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, selectedMonth);
    const balance = getMonthlyBalance(income, fixedExpenses, cardExpenses);

    csv += 'RESUMO\n';
    csv += `Total Receitas,${income}\n`;
    csv += `Total Despesas Fixas,${fixedExpenses}\n`;
    csv += `Total Cartão,${cardExpenses}\n`;
    csv += `Total Despesas,${fixedExpenses + cardExpenses}\n`;
    csv += `Saldo,${balance}\n`;

  } else {
    // Exportar dados anuais
    csv = 'Relatório Anual\n\n';
    csv += 'Mês,Receitas,Despesas Fixas,Cartão,Total Despesas,Saldo\n';

    for (let month = 0; month < 12; month++) {
      const income = getMonthlyIncome(incomes, month);
      const fixedExpenses = getMonthlyFixedExpenses(expenses, month);
      const cardExpenses = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, month);
      const totalExpenses = fixedExpenses + cardExpenses;
      const balance = getMonthlyBalance(income, fixedExpenses, cardExpenses);

      csv += `${MONTHS[month]},${income},${fixedExpenses},${cardExpenses},${totalExpenses},${balance}\n`;
    }
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const filename = selectedMonth !== null
    ? `relatorio-${MONTHS[selectedMonth].toLowerCase()}-${new Date().getFullYear()}.csv`
    : `relatorio-anual-${new Date().getFullYear()}.csv`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporta dados financeiros em formato PDF (HTML para impressão)
 */
export const exportToPDF = (data, selectedMonth) => {
  const { incomes, expenses, creditCardExpenses, invoiceTotals } = data;

  const income = getMonthlyIncome(incomes, selectedMonth);
  const fixedExpenses = getMonthlyFixedExpenses(expenses, selectedMonth);
  const cardExpenses = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, selectedMonth);
  const balance = getMonthlyBalance(income, fixedExpenses, cardExpenses);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório Financeiro - ${MONTHS[selectedMonth]}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          color: #333;
        }
        h1 {
          color: #059669;
          border-bottom: 3px solid #059669;
          padding-bottom: 10px;
        }
        h2 {
          color: #475569;
          margin-top: 30px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background-color: #f1f5f9;
          font-weight: bold;
          color: #475569;
        }
        .summary {
          background-color: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-top: 30px;
        }
        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .summary-item:last-child {
          border-bottom: none;
          font-weight: bold;
          font-size: 1.2em;
          color: ${balance >= 0 ? '#059669' : '#dc2626'};
        }
        .paid { color: #059669; }
        .pending { color: #f59e0b; }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <h1>Relatório Financeiro - ${MONTHS[selectedMonth]} ${new Date().getFullYear()}</h1>
      <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>

      <h2>Receitas</h2>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Valor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${incomes.map(income => {
            const value = income.overrides?.[selectedMonth] ?? income.value;
            const isPaid = income.paidStatus?.[selectedMonth];
            return `
              <tr>
                <td>${income.name}</td>
                <td>${formatCurrency(value)}</td>
                <td class="${isPaid ? 'paid' : 'pending'}">${isPaid ? 'Recebido' : 'Pendente'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <h2>Despesas Fixas</h2>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Valor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${expenses.map(expense => {
            const value = expense.overrides?.[selectedMonth] ?? expense.value;
            const isPaid = expense.paidStatus?.[selectedMonth];
            return `
              <tr>
                <td>${expense.name}</td>
                <td>${formatCurrency(value)}</td>
                <td class="${isPaid ? 'paid' : 'pending'}">${isPaid ? 'Pago' : 'Pendente'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <h2>Cartão de Crédito</h2>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Valor</th>
            <th>Categoria</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${creditCardExpenses
            .filter(expense => expense.monthsActive?.[selectedMonth])
            .map(expense => {
              const value = expense.overrides?.[selectedMonth] ?? expense.value;
              const isPaid = expense.paidStatus?.[selectedMonth];
              const category = expense.category || 'Geral';
              return `
                <tr>
                  <td>${expense.name}</td>
                  <td>${formatCurrency(value)}</td>
                  <td>${category}</td>
                  <td class="${isPaid ? 'paid' : 'pending'}">${isPaid ? 'Pago' : 'Pendente'}</td>
                </tr>
              `;
            }).join('')}
          <tr style="font-weight: bold; background-color: #eff6ff;">
            <td colspan="3">Total do Cartão</td>
            <td>${formatCurrency(cardExpenses)}</td>
          </tr>
        </tbody>
      </table>

      <div class="summary">
        <h2 style="margin-top: 0;">Resumo Financeiro</h2>
        <div class="summary-item">
          <span>Total de Receitas:</span>
          <span>${formatCurrency(income)}</span>
        </div>
        <div class="summary-item">
          <span>Total de Despesas Fixas:</span>
          <span>${formatCurrency(fixedExpenses)}</span>
        </div>
        <div class="summary-item">
          <span>Total do Cartão:</span>
          <span>${formatCurrency(cardExpenses)}</span>
        </div>
        <div class="summary-item">
          <span>Total de Despesas:</span>
          <span>${formatCurrency(fixedExpenses + cardExpenses)}</span>
        </div>
        <div class="summary-item">
          <span>Saldo:</span>
          <span>${formatCurrency(balance)}</span>
        </div>
      </div>

      <script>
        window.onload = () => window.print();
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Importa dados de backup JSON
 */
export const importFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        // Validação básica
        if (!data.incomes && !data.expenses && !data.creditCardExpenses) {
          reject(new Error('Arquivo JSON inválido'));
          return;
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo JSON'));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
};
