import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import MonthSelector from './MonthSelector';
import GoalsAndAlerts from './GoalsAndAlerts';
import { MonthlyComparisonChart, BalanceTrendChart, ConsolidatedCategoryDonut } from './Charts';
import { formatCurrency } from '../utils/formatters';
import {
  getMonthlyIncome,
  getMonthlyFixedExpenses,
  getMonthlyCardTotal,
  getMonthlyBalance
} from '../services/calculations';

const Dashboard = ({
  selectedMonth,
  onMonthChange,
  incomes,
  expenses,
  creditCardExpenses,
  invoiceTotals,
  onNavigate,
  goals,
  onSaveGoals,
  categories = []
}) => {
  const [hideExtraordinary, setHideExtraordinary] = useState(false);

  const stats = useMemo(() => {
    const income = getMonthlyIncome(incomes, selectedMonth);
    const fixedExpenses = getMonthlyFixedExpenses(expenses, selectedMonth, hideExtraordinary);
    const cardExpenses = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, selectedMonth, undefined, hideExtraordinary);
    const totalExpenses = fixedExpenses + cardExpenses;
    const balance = getMonthlyBalance(income, fixedExpenses, cardExpenses);

    return {
      income,
      fixedExpenses,
      cardExpenses,
      totalExpenses,
      balance
    };
  }, [selectedMonth, incomes, expenses, creditCardExpenses, invoiceTotals, hideExtraordinary]);

  // Calcular info das extraordinárias excluídas
  const extraInfo = useMemo(() => {
    if (!hideExtraordinary) return null;
    const extraExpenses = expenses.filter(e => e.extraordinary);
    const extraCards = creditCardExpenses.filter(e => e.extraordinary);
    const count = extraExpenses.length + extraCards.length;
    if (count === 0) return null;

    const fixedFull = getMonthlyFixedExpenses(expenses, selectedMonth, false);
    const fixedFiltered = getMonthlyFixedExpenses(expenses, selectedMonth, true);
    const cardFull = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, selectedMonth, undefined, false);
    const cardFiltered = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, selectedMonth, undefined, true);
    const excludedValue = (fixedFull - fixedFiltered) + (cardFull - cardFiltered);

    return { count, excludedValue };
  }, [hideExtraordinary, expenses, creditCardExpenses, invoiceTotals, selectedMonth]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Dashboard</h2>
        <div className="flex items-center gap-2">
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
          <MonthSelector selectedMonth={selectedMonth} onChange={onMonthChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Receita */}
        <div
          className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors cursor-pointer"
          onClick={() => onNavigate('incomes')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={100} />
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-sm mb-1 font-medium">
            Receita
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-200">
            {formatCurrency(stats.income)}
          </div>
        </div>

        {/* Card de Despesas */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500 dark:text-red-400">
            <TrendingDown size={100} />
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-sm mb-1 font-medium">
            Total Despesas
          </div>
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(stats.totalExpenses)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Fixo: {formatCurrency(stats.fixedExpenses)} | Cartão:{' '}
            {formatCurrency(stats.cardExpenses)}
          </div>
          {extraInfo && (
            <div className="mt-1 text-[10px] text-purple-600 dark:text-purple-400">
              Excluindo {extraInfo.count} extraordinária{extraInfo.count > 1 ? 's' : ''} ({formatCurrency(extraInfo.excludedValue)})
            </div>
          )}
        </div>

        {/* Card de Saldo */}
        <div
          className={`p-6 rounded-xl shadow-sm border relative overflow-hidden ${
            stats.balance >= 0
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <div className="text-white/80 text-sm mb-1 font-medium">Resultado</div>
          <div className="text-3xl font-bold">
            {formatCurrency(stats.balance)}
          </div>
          {stats.income > 0 && (
            <div className="mt-2 text-sm text-white/70">
              {((stats.balance / stats.income) * 100).toFixed(1)}% economizado
            </div>
          )}
        </div>
      </div>

      {/* Metas e Alertas */}
      <GoalsAndAlerts
        selectedMonth={selectedMonth}
        incomes={incomes}
        expenses={expenses}
        creditCardExpenses={creditCardExpenses}
        invoiceTotals={invoiceTotals}
        goals={goals}
        onSaveGoals={onSaveGoals}
      />

      {/* Gráfico de Categorias */}
      <ConsolidatedCategoryDonut
        expenses={expenses}
        creditCardExpenses={creditCardExpenses}
        invoiceTotals={invoiceTotals}
        selectedMonth={selectedMonth}
        categories={categories}
        excludeExtraordinary={hideExtraordinary}
      />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyComparisonChart
          incomes={incomes}
          expenses={expenses}
          creditCardExpenses={creditCardExpenses}
          invoiceTotals={invoiceTotals}
          excludeExtraordinary={hideExtraordinary}
        />
        <BalanceTrendChart
          incomes={incomes}
          expenses={expenses}
          creditCardExpenses={creditCardExpenses}
          invoiceTotals={invoiceTotals}
          excludeExtraordinary={hideExtraordinary}
        />
      </div>
    </div>
  );
};

export default Dashboard;
