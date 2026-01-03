import React from 'react';
import { Copy } from 'lucide-react';
import { MONTHS } from '../utils/formatters';

const CopyFromPreviousMonthButton = ({ selectedMonth, onCopy, loading = false }) => {
  // Não mostra o botão em Janeiro (mês 0)
  if (selectedMonth === 0) {
    return null;
  }

  const previousMonth = selectedMonth - 1;

  return (
    <button
      onClick={onCopy}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      title={`Copiar dados de ${MONTHS[previousMonth]}`}
    >
      <Copy size={16} />
      <span>Copiar de {MONTHS[previousMonth]}</span>
    </button>
  );
};

export default CopyFromPreviousMonthButton;
