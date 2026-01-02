/**
 * Calcula a receita total de um mês específico
 */
export const getMonthlyIncome = (incomes, monthIndex) => {
  return incomes.reduce((acc, item) => {
    // Receitas fixas (aparecem em todos os meses)
    if (item.type === 'fixed') {
      const monthValue = item.overrides?.[monthIndex] !== undefined
        ? item.overrides[monthIndex]
        : item.value;
      return acc + monthValue;
    }

    // Receitas variáveis (apenas no mês especificado)
    if (item.type === 'variable' && item.month === monthIndex) {
      return acc + item.value;
    }

    return acc;
  }, 0);
};

/**
 * Calcula as despesas fixas de um mês específico
 */
export const getMonthlyFixedExpenses = (expenses, monthIndex) => {
  return expenses.reduce((acc, item) => {
    const monthValue = item.overrides?.[monthIndex] !== undefined
      ? item.overrides[monthIndex]
      : item.value;
    return acc + monthValue;
  }, 0);
};

/**
 * Calcula o total do cartão de crédito para um mês
 * Prioriza valor manual da fatura, senão calcula baseado nos parcelamentos
 */
export const getMonthlyCardTotal = (creditCardExpenses, invoiceTotals, monthIndex) => {
  // Se há valor manual (fatura real), usa ele
  const manualTotal = invoiceTotals?.[monthIndex] || 0;
  if (manualTotal > 0) {
    return manualTotal;
  }

  // Senão, calcula baseado nas parcelas ativas
  const activeItems = creditCardExpenses.filter(item => {
    const endMonth = item.startMonth + item.installments;
    return monthIndex >= item.startMonth && monthIndex < endMonth;
  });

  return activeItems.reduce((acc, item) => acc + item.value, 0);
};

/**
 * Calcula as despesas de cartão ativas em um mês específico
 */
export const getActiveCardExpenses = (creditCardExpenses, monthIndex) => {
  return creditCardExpenses
    .filter(item => {
      const endMonth = item.startMonth + item.installments;
      return monthIndex >= item.startMonth && monthIndex < endMonth;
    })
    .map(item => ({
      ...item,
      currentParcel: monthIndex - item.startMonth + 1
    }));
};

/**
 * Calcula o total de despesas avulsas no cartão
 * (diferença entre fatura real e parcelas planejadas)
 */
export const getMiscellaneousCardExpenses = (plannedCardTotal, manualInvoiceTotal) => {
  return Math.max(0, (manualInvoiceTotal || 0) - plannedCardTotal);
};

/**
 * Calcula o saldo de um mês (receitas - despesas)
 */
export const getMonthlyBalance = (income, fixedExpenses, cardExpenses) => {
  return income - fixedExpenses - cardExpenses;
};

/**
 * Calcula dados consolidados de todos os meses do ano
 */
export const getYearlyData = (incomes, expenses, creditCardExpenses, invoiceTotals) => {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return months.map((monthName, index) => {
    const income = getMonthlyIncome(incomes, index);
    const fixed = getMonthlyFixedExpenses(expenses, index);
    const card = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, index);
    const total = fixed + card;
    const balance = income - total;

    return {
      month: monthName,
      income,
      fixed,
      card,
      total,
      balance
    };
  });
};

/**
 * Calcula totais do fundo de férias
 */
export const getVacationTotals = (vacationFund) => {
  const incomeTotal = vacationFund.incomes.reduce((acc, item) => acc + item.value, 0);
  const expenseTotal = vacationFund.expenses.reduce((acc, item) => acc + item.value, 0);
  const balance = incomeTotal - expenseTotal;

  return {
    incomeTotal,
    expenseTotal,
    balance
  };
};

/**
 * Valida dados de entrada antes de salvar
 */
export const validateExpense = (expense) => {
  const errors = [];

  if (!expense.name || expense.name.trim() === '') {
    errors.push('Nome é obrigatório');
  }

  if (expense.value === undefined || expense.value === null || expense.value < 0) {
    errors.push('Valor deve ser maior ou igual a zero');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateIncome = (income) => {
  const errors = [];

  if (!income.name || income.name.trim() === '') {
    errors.push('Nome é obrigatório');
  }

  if (income.value === undefined || income.value === null || income.value <= 0) {
    errors.push('Valor deve ser maior que zero');
  }

  if (income.type === 'variable' && (income.month === undefined || income.month < 0 || income.month > 11)) {
    errors.push('Mês inválido para receita variável');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCardExpense = (cardExpense) => {
  const errors = [];

  if (!cardExpense.name || cardExpense.name.trim() === '') {
    errors.push('Nome é obrigatório');
  }

  if (cardExpense.value === undefined || cardExpense.value === null || cardExpense.value <= 0) {
    errors.push('Valor deve ser maior que zero');
  }

  if (!cardExpense.installments || cardExpense.installments < 1 || cardExpense.installments > 24) {
    errors.push('Número de parcelas deve estar entre 1 e 24');
  }

  if (cardExpense.startMonth === undefined || cardExpense.startMonth < 0 || cardExpense.startMonth > 11) {
    errors.push('Mês de início inválido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
