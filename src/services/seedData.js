/**
 * Dados iniciais para popular o sistema na primeira vez
 */

// Coleções de dados iniciam vazias — o usuário cadastra seus próprios itens
export const INITIAL_EXPENSES = null;
export const INITIAL_INCOMES = null;
export const INITIAL_CREDIT_EXPENSES = null;

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

export const INITIAL_VACATION_INCOMES = null;
export const INITIAL_VACATION_EXPENSES = null;
export const INITIAL_OBLIGATIONS = null;

export const getSeedDataForCollection = () => {
  // Seed data desabilitado — coleções iniciam vazias
  return null;
};
