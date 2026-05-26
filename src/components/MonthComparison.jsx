import { useState } from 'react';
import { ArrowUpDown, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { MONTHS, formatCurrency } from '../utils/formatters';
import { getMonthlyIncome, getMonthlyFixedExpenses, getMonthlyCardTotal, getMonthlyBalance } from '../services/calculations';

const MonthComparison = ({ incomes, expenses, creditCardExpenses, invoiceTotals, selectedYear }) => {
  const [month1, setMonth1] = useState(new Date().getMonth());
  const [month2, setMonth2] = useState(new Date().getMonth() > 0 ? new Date().getMonth() - 1 : 11);
  const [hideExtraordinary, setHideExtraordinary] = useState(false);

  const getMonthStats = (month) => {
    const income = getMonthlyIncome(incomes, month, hideExtraordinary);
    const fixedExpenses = getMonthlyFixedExpenses(expenses, month, hideExtraordinary);
    const cardExpenses = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, month, selectedYear, hideExtraordinary);
    const totalExpenses = fixedExpenses + cardExpenses;
    const balance = getMonthlyBalance(income, fixedExpenses, cardExpenses);

    return { income, fixedExpenses, cardExpenses, totalExpenses, balance };
  };

  const stats1 = getMonthStats(month1);
  const stats2 = getMonthStats(month2);

  const getDiff = (val1, val2) => {
    const diff = val1 - val2;
    const percent = val2 !== 0 ? ((diff / val2) * 100).toFixed(1) : 0;
    return { diff, percent };
  };

  const renderComparison = (label, val1, val2, isInverted = false) => {
    const { diff, percent } = getDiff(val1, val2);
    const isPositive = isInverted ? diff < 0 : diff > 0;

    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{label}</div>
        <div className="grid grid-cols-2 gap-4 mb-2">
          <div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(val1)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{MONTHS[month1]}</div>
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(val2)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{MONTHS[month2]}</div>
          </div>
        </div>
        <div className={`flex items-center gap-2 text-sm ${
          isPositive ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span className="font-semibold">
            {formatCurrency(Math.abs(diff))} ({Math.abs(percent)}%)
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <ArrowUpDown size={28} />
          Comparação entre Meses
        </h2>
        <button
          onClick={() => setHideExtraordinary(!hideExtraordinary)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            hideExtraordinary
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
              : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-500'
          }`}
          title="Excluir despesas extraordinárias dos cálculos"
        >
          <Sparkles size={14} />
          <span className="hidden sm:inline">Sem extras</span>
        </button>
      </div>

      {/* Seletores de Mês */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Primeiro Mês
            </label>
            <select
              value={month1}
              onChange={e => setMonth1(parseInt(e.target.value))}
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
            >
              {MONTHS.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Segundo Mês
            </label>
            <select
              value={month2}
              onChange={e => setMonth2(parseInt(e.target.value))}
              className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
            >
              {MONTHS.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderComparison('Receitas', stats1.income, stats2.income)}
        {renderComparison('Despesas Totais', stats1.totalExpenses, stats2.totalExpenses, true)}
        {renderComparison('Despesas Fixas', stats1.fixedExpenses, stats2.fixedExpenses, true)}
        {renderComparison('Cartão de Crédito', stats1.cardExpenses, stats2.cardExpenses, true)}
      </div>

      {/* Card de Saldo */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
          Saldo Final
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-6 rounded-lg ${
            stats1.balance >= 0 ? 'bg-emerald-600' : 'bg-red-600'
          } text-white`}>
            <div className="text-sm mb-1">{MONTHS[month1]}</div>
            <div className="text-3xl font-bold">{formatCurrency(stats1.balance)}</div>
          </div>
          <div className={`p-6 rounded-lg ${
            stats2.balance >= 0 ? 'bg-emerald-600' : 'bg-red-600'
          } text-white`}>
            <div className="text-sm mb-1">{MONTHS[month2]}</div>
            <div className="text-3xl font-bold">{formatCurrency(stats2.balance)}</div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Diferença de Saldo</div>
          <div className={`text-2xl font-bold ${
            stats1.balance > stats2.balance ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {formatCurrency(Math.abs(stats1.balance - stats2.balance))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthComparison;
