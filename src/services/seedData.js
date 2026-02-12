/**
 * Dados iniciais para popular o sistema na primeira vez
 */

export const INITIAL_EXPENSES = [
  { name: "Condomínio", value: 2500.00, type: 'fixed', paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Escola Crianças", value: 4500.00, type: 'fixed', paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Energia Elétrica", value: 600.00, type: 'fixed', paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Água / Saneamento", value: 180.00, type: 'fixed', paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Gás", value: 120.00, type: 'fixed', paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Internet / TV / Tel", value: 350.00, type: 'fixed', paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Supermercado (Mensal)", value: 3000.00, type: 'fixed', paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Feira / Açougue", value: 800.00, type: 'fixed', paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Combustível", value: 800.00, type: 'fixed', paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Seguro Auto", value: 450.00, type: 'fixed', paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Plano de Saúde", value: 1200.00, type: 'fixed', paidStatus: Array(12).fill(false), overrides: {} },
  { name: "Empregada / Diarista", value: 1800.00, type: 'fixed', paidStatus: Array(12).fill(false), overrides: {} },
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

export const DEFAULT_INCOME_CATEGORIES = [
  { id: "icat_1", name: "PGE", color: "#3b82f6", order: 1 },
  { id: "icat_2", name: "CES", color: "#10b981", order: 2 },
  { id: "icat_3", name: "Escritório", color: "#8b5cf6", order: 3 },
  { id: "icat_4", name: "Outros", color: "#64748b", order: 4 }
];

export const DEFAULT_CATEGORIES = [
  { id: "cat_1", name: "Moradia", color: "#3b82f6", order: 1 },
  { id: "cat_2", name: "Alimentação", color: "#10b981", order: 2 },
  { id: "cat_3", name: "Transporte", color: "#f59e0b", order: 3 },
  { id: "cat_4", name: "Saúde", color: "#ef4444", order: 4 },
  { id: "cat_5", name: "Educação", color: "#8b5cf6", order: 5 },
  { id: "cat_6", name: "Lazer", color: "#ec4899", order: 6 },
  { id: "cat_7", name: "Compras", color: "#6366f1", order: 7 },
  { id: "cat_8", name: "Serviços", color: "#14b8a6", order: 8 },
  { id: "cat_9", name: "Pets", color: "#f97316", order: 9 },
  { id: "cat_10", name: "Outros", color: "#64748b", order: 10 }
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
