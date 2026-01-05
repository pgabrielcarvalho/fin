/**
 * Dados iniciais para popular o sistema na primeira vez
 */

export const INITIAL_EXPENSES = [
  { name: "Condomínio", value: 2500.00, paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Escola Crianças", value: 4500.00, paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Energia Elétrica", value: 600.00, paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Água / Saneamento", value: 180.00, paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Gás", value: 120.00, paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Internet / TV / Tel", value: 350.00, paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Supermercado (Mensal)", value: 3000.00, paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Feira / Açougue", value: 800.00, paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Combustível", value: 800.00, paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Seguro Auto", value: 450.00, paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Plano de Saúde", value: 1200.00, paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Empregada / Diarista", value: 1800.00, paidStatus: Array(12).fill(false), overrides: {} },
];

export const INITIAL_INCOMES = [
  { name: "Rendimento Principal (AE13)", value: 51579.93, type: 'fixed', month: null, overrides: {} }
];

export const INITIAL_CREDIT_EXPENSES = [
  { name: "Netflix/Spotify (Recorrente)", value: 59.90, installments: 12, startMonth: 0 },
  { name: "Academia (Recorrente)", value: 120.00, installments: 12, startMonth: 0 },
  { name: "Seguro Celular", value: 89.90, installments: 12, startMonth: 0 },
  { name: "Parcela Eletrodoméstico", value: 250.00, installments: 10, startMonth: 0 },
];

export const INITIAL_VACATION_INCOMES = [
  { name: "Entrada 1", value: 0 },
  { name: "Entrada 2", value: 0 }
];

export const INITIAL_VACATION_EXPENSES = [
  { name: "Saída 1", value: 0 },
  { name: "Saída 2", value: 0 }
];

export const getSeedDataForCollection = (collectionName) => {
  switch (collectionName) {
    case 'expenses':
      return INITIAL_EXPENSES;
    case 'incomes':
      return INITIAL_INCOMES;
    case 'credit_expenses':
      return INITIAL_CREDIT_EXPENSES;
    case 'vacation_incomes':
      return INITIAL_VACATION_INCOMES;
    case 'vacation_expenses':
      return INITIAL_VACATION_EXPENSES;
    default:
      return [];
  }
};
