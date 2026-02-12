import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Componente de botões de reordenação reutilizável
 *
 * @param {number} index - Posição atual do item (0-indexed)
 * @param {number} totalItems - Total de itens na lista
 * @param {Function} onMoveUp - Callback para mover para cima
 * @param {Function} onMoveDown - Callback para mover para baixo
 */
const ReorderButtons = ({ index, totalItems, onMoveUp, onMoveDown }) => {
  const isFirst = index === 0;
  const isLast = index === totalItems - 1;

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={onMoveUp}
        disabled={isFirst}
        className={`p-0.5 rounded transition-colors ${
          isFirst
            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        title="Mover para cima"
      >
        <ChevronUp size={14} />
      </button>
      <button
        onClick={onMoveDown}
        disabled={isLast}
        className={`p-0.5 rounded transition-colors ${
          isLast
            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
        }`}
        title="Mover para baixo"
      >
        <ChevronDown size={14} />
      </button>
    </div>
  );
};

export default ReorderButtons;
