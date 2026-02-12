import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatCurrency, MONTHS } from '../utils/formatters';
import {
  getMonthlyIncome,
  getMonthlyFixedExpenses,
  getMonthlyCardTotal,
  getMonthlyBalance
} from '../services/calculations';

const COLORS = {
  income: '#10b981',
  expenses: '#ef4444',
  balance: '#3b82f6',
  card: '#8b5cf6',
  fixed: '#f59e0b'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const MonthlyComparisonChart = ({ incomes, expenses, creditCardExpenses, invoiceTotals }) => {
  const data = MONTHS.map((month, index) => ({
    name: month.substring(0, 3),
    receitas: getMonthlyIncome(incomes, index),
    despesas: getMonthlyFixedExpenses(expenses, index) + getMonthlyCardTotal(creditCardExpenses, invoiceTotals, index),
    saldo: getMonthlyBalance(
      getMonthlyIncome(incomes, index),
      getMonthlyFixedExpenses(expenses, index),
      getMonthlyCardTotal(creditCardExpenses, invoiceTotals, index)
    )
  }));

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
        Comparação Mensal
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="receitas" name="Receitas" fill={COLORS.income} />
          <Bar dataKey="despesas" name="Despesas" fill={COLORS.expenses} />
          <Bar dataKey="saldo" name="Saldo" fill={COLORS.balance} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const BalanceTrendChart = ({ incomes, expenses, creditCardExpenses, invoiceTotals }) => {
  const data = MONTHS.map((month, index) => ({
    name: month.substring(0, 3),
    receitas: getMonthlyIncome(incomes, index),
    despesas: getMonthlyFixedExpenses(expenses, index) + getMonthlyCardTotal(creditCardExpenses, invoiceTotals, index),
    saldo: getMonthlyBalance(
      getMonthlyIncome(incomes, index),
      getMonthlyFixedExpenses(expenses, index),
      getMonthlyCardTotal(creditCardExpenses, invoiceTotals, index)
    )
  }));

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
        Evolução Mensal
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="receitas"
            name="Receitas"
            stroke={COLORS.income}
            strokeWidth={2}
            dot={{ fill: COLORS.income, r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="despesas"
            name="Despesas"
            stroke={COLORS.expenses}
            strokeWidth={2}
            dot={{ fill: COLORS.expenses, r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="saldo"
            name="Saldo"
            stroke={COLORS.balance}
            strokeWidth={3}
            dot={{ fill: COLORS.balance, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ExpenseBreakdownPie = ({ expenses, creditCardExpenses, invoiceTotals, selectedMonth }) => {
  const fixedExpenses = getMonthlyFixedExpenses(expenses, selectedMonth);
  const cardExpenses = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, selectedMonth);

  const data = [
    { name: 'Despesas Fixas', value: fixedExpenses },
    { name: 'Cartão de Crédito', value: cardExpenses }
  ];

  const CHART_COLORS = [COLORS.fixed, COLORS.card];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
        Distribuição de Despesas
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const DONUT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#64748b',
  '#06b6d4', '#84cc16', '#e11d48', '#7c3aed'
];

export const ConsolidatedCategoryDonut = ({ expenses, creditCardExpenses, invoiceTotals, selectedMonth, categories = [] }) => {
  const categoryTotals = {};

  // Despesas fixas/eventuais
  expenses.forEach(expense => {
    const expenseType = expense.type || 'fixed';
    const isActive = expenseType === 'fixed' || (expenseType === 'eventual' && expense.month === selectedMonth);
    if (!isActive) return;

    const value = expense.overrides?.[selectedMonth] !== undefined ? expense.overrides[selectedMonth] : expense.value;
    let catName = 'Sem Categoria';
    let catColor = '#94a3b8';
    if (expense.categoryId) {
      const cat = categories.find(c => c.id === expense.categoryId);
      if (cat) { catName = cat.name; catColor = cat.color; }
    }
    if (!categoryTotals[catName]) categoryTotals[catName] = { value: 0, color: catColor };
    categoryTotals[catName].value += value;
  });

  // Despesas do cartão
  creditCardExpenses.forEach(expense => {
    const value = expense.overrides?.[selectedMonth] !== undefined ? expense.overrides[selectedMonth] : expense.value;
    let catName = 'Sem Categoria';
    let catColor = '#94a3b8';
    if (expense.categoryId) {
      const cat = categories.find(c => c.id === expense.categoryId);
      if (cat) { catName = cat.name; catColor = cat.color; }
    } else if (expense.category) {
      catName = expense.category;
      catColor = DONUT_COLORS[Object.keys(categoryTotals).length % DONUT_COLORS.length];
    }
    if (!categoryTotals[catName]) categoryTotals[catName] = { value: 0, color: catColor };
    categoryTotals[catName].value += value;
  });

  const data = Object.entries(categoryTotals)
    .map(([name, { value, color }]) => ({ name, value, color }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
          Despesas por Categoria
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
          Nenhuma despesa neste mês
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
        Despesas por Categoria
      </h3>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 dark:text-slate-400 flex-1 truncate">{item.name}</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CategoryBreakdownChart = ({ creditCardExpenses, selectedMonth, categories = [] }) => {
  const categoryTotals = {};

  creditCardExpenses.forEach(expense => {
    // Resolver nome da categoria: categoryId (novo) ou category (legado)
    let categoryName = 'Sem Categoria';
    if (expense.categoryId) {
      const cat = categories.find(c => c.id === expense.categoryId);
      categoryName = cat ? cat.name : 'Desconhecida';
    } else if (expense.category) {
      categoryName = expense.category;
    }

    const value = expense.overrides?.[selectedMonth] ?? expense.value;
    categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + value;
  });

  const data = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
          Gastos por Categoria
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
          Nenhuma despesa neste mês
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
        Gastos por Categoria
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis type="number" stroke="#64748b" />
          <YAxis dataKey="name" type="category" width={100} stroke="#64748b" />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Valor" fill={COLORS.card} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
