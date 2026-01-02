/**
 * Formata um valor numérico para moeda brasileira (BRL)
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

/**
 * Converte string para número, removendo caracteres não numéricos
 */
export const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

/**
 * Valida se um valor é um número válido
 */
export const isValidNumber = (value) => {
  const num = parseNumber(value);
  return !isNaN(num) && isFinite(num);
};

/**
 * Meses do ano
 */
export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

/**
 * Obtém o nome do mês por índice
 */
export const getMonthName = (index) => {
  return MONTHS[index] || '';
};
