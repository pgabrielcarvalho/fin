import React from 'react';
import { formatCurrency, MONTHS } from '../utils/formatters';

const InstallmentPreview = ({ totalValue, installments, startMonth, currentYear }) => {
  if (!totalValue || !installments || installments < 2) return null;

  const perInstallment = Math.round((totalValue / installments) * 100) / 100;

  const pills = [];
  for (let i = 0; i < installments; i++) {
    const monthIndex = (startMonth + i) % 12;
    const year = currentYear + Math.floor((startMonth + i) / 12);
    pills.push({
      month: monthIndex,
      year,
      label: `${MONTHS[monthIndex].slice(0, 3)}/${String(year).slice(-2)}`,
      isFirst: i === 0,
      isLast: i === installments - 1,
      number: i + 1,
    });
  }

  return (
    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {installments}x de {formatCurrency(perInstallment)}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          Total: {formatCurrency(totalValue)}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {pills.map((pill) => (
          <span
            key={`${pill.month}-${pill.year}`}
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${
              pill.isFirst
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-300 dark:ring-indigo-700'
                : pill.isLast
                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-300 dark:ring-emerald-700'
                : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
            }`}
          >
            {pill.number}. {pill.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default InstallmentPreview;
