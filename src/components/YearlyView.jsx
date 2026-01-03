import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { getYearlyData } from '../services/calculations';
import { MonthlyComparisonChart, BalanceTrendChart } from './Charts';

const YearlyView = ({ incomes, expenses, creditCardExpenses, invoiceTotals }) => {
  const yearData = useMemo(
    () => getYearlyData(incomes, expenses, creditCardExpenses, invoiceTotals),
    [incomes, expenses, creditCardExpenses, invoiceTotals]
  );

  const yearlyTotals = useMemo(() => {
    return {
      income: yearData.reduce((a, b) => a + b.income, 0),
      total: yearData.reduce((a, b) => a + b.total, 0),
      balance: yearData.reduce((a, b) => a + b.balance, 0)
    };
  }, [yearData]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Visão Anual 2026</h2>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyComparisonChart
          incomes={incomes}
          expenses={expenses}
          creditCardExpenses={creditCardExpenses}
          invoiceTotals={invoiceTotals}
        />
        <BalanceTrendChart
          incomes={incomes}
          expenses={expenses}
          creditCardExpenses={creditCardExpenses}
          invoiceTotals={invoiceTotals}
        />
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Mês</th>
              <th className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">Receita</th>
              <th className="px-4 py-3 text-right">Fixas</th>
              <th className="px-4 py-3 text-right">Cartão</th>
              <th className="px-4 py-3 text-right text-red-600 dark:text-red-400">Total Saídas</th>
              <th className="px-4 py-3 text-right font-bold">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {yearData.map((d, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{d.month}</td>
                <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(d.income)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                  {formatCurrency(d.fixed)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(d.card)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-red-600 dark:text-red-400 font-bold">
                  {formatCurrency(d.total)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono font-bold ${
                    d.balance >= 0
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  {formatCurrency(d.balance)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 dark:bg-slate-700 font-bold text-slate-800 dark:text-slate-200">
            <tr>
              <td className="px-4 py-3">TOTAL</td>
              <td className="px-4 py-3 text-right">{formatCurrency(yearlyTotals.income)}</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right">-</td>
              <td className="px-4 py-3 text-right">{formatCurrency(yearlyTotals.total)}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(yearlyTotals.balance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default YearlyView;
