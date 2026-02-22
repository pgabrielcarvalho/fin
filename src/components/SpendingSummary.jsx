import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import EditableValue from './EditableValue';
import { formatCurrency } from '../utils/formatters';

const SpendingSummary = ({
  selectedMonth,
  categories = [],
  spendingSummary = {},
  onSaveSpendingSummary,
  onSaveCategories
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const monthData = useMemo(() => {
    const entries = spendingSummary[selectedMonth] || [];
    const map = {};
    for (const entry of entries) {
      map[entry.categoryId] = entry.value;
    }
    return map;
  }, [spendingSummary, selectedMonth]);

  const total = useMemo(() => {
    return Object.values(monthData).reduce((sum, v) => sum + (v || 0), 0);
  }, [monthData]);

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [categories]);

  const handleValueChange = (categoryId, newValue) => {
    const currentEntries = spendingSummary[selectedMonth] || [];
    let updated;
    if (newValue === 0) {
      updated = currentEntries.filter(e => e.categoryId !== categoryId);
    } else {
      const exists = currentEntries.find(e => e.categoryId === categoryId);
      if (exists) {
        updated = currentEntries.map(e =>
          e.categoryId === categoryId ? { ...e, value: newValue } : e
        );
      } else {
        updated = [...currentEntries, { categoryId, value: newValue }];
      }
    }

    const newSummary = { ...spendingSummary, [selectedMonth]: updated };
    // Remove month key if empty array
    if (updated.length === 0) {
      delete newSummary[selectedMonth];
    }
    onSaveSpendingSummary(newSummary);
  };

  const handleClear = () => {
    const newSummary = { ...spendingSummary };
    delete newSummary[selectedMonth];
    onSaveSpendingSummary(newSummary);
  };

  const hasData = Object.keys(monthData).length > 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Resumo de Gastos (BTG)
          </span>
          {!isOpen && hasData && (
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
              {formatCurrency(total)}
            </span>
          )}
        </div>
        {isOpen && hasData && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Limpar valores deste mês"
          >
            <Trash2 size={12} />
            Limpar
          </button>
        )}
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          {sortedCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 w-32 truncate">
                {cat.name}
              </span>
              <div className="flex items-center gap-1 flex-1">
                <span className="text-xs text-slate-400 dark:text-slate-500">R$</span>
                <EditableValue
                  value={monthData[cat.id] || 0}
                  onSave={(v) => handleValueChange(cat.id, v)}
                  emptyAsZero
                  className="w-full text-right text-sm px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-600">
            <div className="w-3 h-3 flex-shrink-0" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 w-32">
              Total
            </span>
            <div className="flex-1 text-right text-sm font-semibold text-slate-800 dark:text-slate-200 pr-2">
              {formatCurrency(total)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpendingSummary;
