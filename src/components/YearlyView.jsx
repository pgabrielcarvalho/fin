import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { getYearlyData } from '../services/calculations';

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
      <h2 className="text-2xl font-bold text-slate-800">Visão Anual 2026</h2>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Mês</th>
              <th className="px-4 py-3 text-right text-emerald-600">Receita</th>
              <th className="px-4 py-3 text-right">Fixas</th>
              <th className="px-4 py-3 text-right">Cartão</th>
              <th className="px-4 py-3 text-right text-red-600">Total Saídas</th>
              <th className="px-4 py-3 text-right font-bold">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yearData.map((d, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{d.month}</td>
                <td className="px-4 py-3 text-right font-mono text-emerald-600">
                  {formatCurrency(d.income)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-600">
                  {formatCurrency(d.fixed)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-indigo-600">
                  {formatCurrency(d.card)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-red-600 font-bold">
                  {formatCurrency(d.total)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono font-bold ${
                    d.balance >= 0
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-red-600 bg-red-50'
                  }`}
                >
                  {formatCurrency(d.balance)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 font-bold text-slate-800">
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
