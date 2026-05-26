import { useState } from 'react';
import { Copy, ChevronDown } from 'lucide-react';
import { MONTHS } from '../utils/formatters';

const CopyFromMonthDropdown = ({ selectedMonth, onCopy, loading = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = (sourceMonth) => {
    setIsOpen(false);

    // Alerta de confirmação com aviso de alteração definitiva
    const confirmMessage = `⚠️ ATENÇÃO: Esta ação é DEFINITIVA!\n\nVocê está prestes a copiar todos os dados de ${MONTHS[sourceMonth]} para ${MONTHS[selectedMonth]}.\n\nIsso irá:\n• Sobrescrever valores existentes em ${MONTHS[selectedMonth]}\n• Criar novas entradas variáveis/eventuais\n• Esta ação NÃO pode ser desfeita\n\nDeseja realmente continuar?`;

    if (window.confirm(confirmMessage)) {
      onCopy(sourceMonth);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
      >
        <Copy size={16} />
        <span>Copiar de...</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 py-2 min-w-[200px] z-20 max-h-[400px] overflow-y-auto">
            {MONTHS.map((month, index) => (
              <button
                key={index}
                onClick={() => handleCopy(index)}
                disabled={index === selectedMonth}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  index === selectedMonth
                    ? 'text-slate-400 cursor-not-allowed bg-slate-50'
                    : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {month}
                {index === selectedMonth && ' (mês atual)'}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CopyFromMonthDropdown;
