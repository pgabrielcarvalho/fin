import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
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
  const stats = useMemo(() => {
    const income = getMonthlyIncome(incomes, selectedMonth);
    const fixedExpenses = getMonthlyFixedExpenses(expenses, selectedMonth);
    const cardExpenses = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, selectedMonth);
    const totalExpenses = fixedExpenses + cardExpenses;
    const balance = getMonthlyBalance(income, fixedExpenses, cardExpenses);

    return {
      income,
      fixedExpenses,
      cardExpenses,
      totalExpenses,
      balance
    };
  }, [selectedMonth, incomes, expenses, creditCardExpenses, invoiceTotals]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <MonthSelector selectedMonth={selectedMonth} onChange={onMonthChange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Receita */}
        <div
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-emerald-200 transition-colors cursor-pointer"
          onClick={() => onNavigate('incomes')}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={100} />
          </div>
          <div className="text-slate-500 text-sm mb-1 font-medium">
            Receita
          </div>
          <div className="text-3xl font-bold text-slate-800">
            {formatCurrency(stats.income)}
          </div>
        </div>

        {/* Card de Despesas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-red-500">
            <TrendingDown size={100} />
          </div>
          <div className="text-slate-500 text-sm mb-1 font-medium">
            Total Despesas
          </div>
          <div className="text-3xl font-bold text-red-600">
            {formatCurrency(stats.totalExpenses)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Fixo: {formatCurrency(stats.fixedExpenses)} | Cartão:{' '}
            {formatCurrency(stats.cardExpenses)}
          </div>
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
      />

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
    </div>
  );
};

export default Dashboard;
