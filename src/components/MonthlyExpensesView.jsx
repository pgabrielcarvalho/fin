import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, RotateCcw, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import MonthTabs from './MonthTabs';
import CopyFromMonthDropdown from './CopyFromMonthDropdown';
import MonthlyNotes from './MonthlyNotes';
import ReorderButtons from './ReorderButtons';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { validateExpense, getMonthlyCardTotal, getMonthlyIncome, getMonthlyFixedExpenses, getMonthlyBalance } from '../services/calculations';
import { useReorder } from '../hooks/useReorder';

const MonthlyExpensesView = ({
  selectedMonth,
  onMonthChange,
  expenses,
  incomes,
  creditCardExpenses,
  invoiceTotals,
  onSave,
  onDelete,
  onNavigate,
  notes,
  onSaveNotes
}) => {
  const toast = useToast();
  const [newExpense, setNewExpense] = useState({ name: '', value: '' });

  const finalCardTotal = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, selectedMonth);

  // Cálculos do resumo (Dashboard)
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

  // Usar o hook de reordenação
  const { sortedItems: sortedExpenses, moveItem } = useReorder(expenses, (updatedItem) =>
    onSave('expenses', updatedItem)
  );

  const handleAdd = async () => {
    const validation = validateExpense({
      ...newExpense,
      value: parseFloat(newExpense.value)
    });

    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const maxOrder = expenses.reduce((max, exp) =>
      Math.max(max, exp.order !== undefined ? exp.order : 0), 0
    );

    const result = await onSave('expenses', {
      name: newExpense.name,
      value: parseFloat(newExpense.value),
      paidStatus: Array(12).fill(false),
      overrides: {},
      order: maxOrder + 1
    });

    if (result.success) {
      toast.success('Despesa adicionada!');
      setNewExpense({ name: '', value: '' });
    } else {
      toast.error(`Erro: ${result.error}`);
    }
  };

  const handleMove = async (expense, direction) => {
    const result = await moveItem(expense, direction);
    if (result.success) {
      toast.success('Ordem atualizada!');
    } else if (result.message) {
      // Mensagem informativa, não erro
    } else if (result.error) {
      toast.error('Erro ao reordenar');
    }
  };

  const togglePaid = async (expense) => {
    const newStatus = [...expense.paidStatus];
    newStatus[selectedMonth] = !newStatus[selectedMonth];
    await onSave('expenses', { ...expense, paidStatus: newStatus });
  };

  const updateOverride = async (expense, newValueStr) => {
    const newValue = parseFloat(newValueStr);
    const newOverrides = { ...expense.overrides } || {};

    if (isNaN(newValue) || newValue === expense.value) {
      delete newOverrides[selectedMonth];
    } else {
      newOverrides[selectedMonth] = newValue;
    }

    await onSave('expenses', { ...expense, overrides: newOverrides });
  };

  const resetOverride = async (expense) => {
    const newOverrides = { ...expense.overrides };
    delete newOverrides[selectedMonth];
    await onSave('expenses', { ...expense, overrides: newOverrides });
    toast.info('Valor restaurado');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      const result = await onDelete('expenses', id);
      if (result.success) {
        toast.success('Despesa excluída');
      }
    }
  };

  const handleCopyFromMonth = async (sourceMonth) => {
    let copiedCount = 0;

    // Copiar overrides de despesas fixas
    for (const expense of expenses) {
      // Pegar o valor efetivo do mês de origem (override ou valor base)
      const sourceValue = expense.overrides?.[sourceMonth] !== undefined
        ? expense.overrides[sourceMonth]
        : expense.value;

      // Criar override para o mês de destino com o valor efetivo do mês de origem
      const newOverrides = { ...expense.overrides, [selectedMonth]: sourceValue };
      await onSave('expenses', { ...expense, overrides: newOverrides });
      copiedCount++;
    }

    toast.success(`${copiedCount} ${copiedCount === 1 ? 'despesa copiada' : 'despesas copiadas'} de ${MONTHS[sourceMonth]}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Despesas</h2>
          <CopyFromMonthDropdown
            selectedMonth={selectedMonth}
            onCopy={handleCopyFromMonth}
          />
        </div>
        <MonthTabs selectedMonth={selectedMonth} onChange={onMonthChange} />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card de Receita */}
        <div
          className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-700 transition-colors cursor-pointer"
          onClick={() => onNavigate?.('incomes')}
        >
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingUp size={60} />
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs mb-1 font-medium">
            Receita Prevista
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            {formatCurrency(stats.income)}
          </div>
        </div>

        {/* Card de Despesas */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-red-500 dark:text-red-400">
            <TrendingDown size={60} />
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs mb-1 font-medium">
            Total Despesas
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(stats.totalExpenses)}
          </div>
          <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
            Fixo: {formatCurrency(stats.fixedExpenses)} | Cartão:{' '}
            {formatCurrency(stats.cardExpenses)}
          </div>
        </div>

        {/* Card de Saldo */}
        <div
          className={`p-4 rounded-xl shadow-sm border relative overflow-hidden ${
            stats.balance >= 0
              ? 'bg-emerald-600 dark:bg-emerald-700 text-white'
              : 'bg-red-600 dark:bg-red-700 text-white'
          }`}
        >
          <div className="text-white/80 text-xs mb-1 font-medium">Resultado</div>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.balance)}
          </div>
        </div>
      </div>

      {/* Formulário de Adição */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-2">
          <Plus size={16} /> Adicionar Nova Despesa (Fixa/Recorrente)
        </h3>
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
            placeholder="Nome (Ex: Clube, Curso)"
            value={newExpense.name}
            onChange={e => setNewExpense({ ...newExpense, name: e.target.value })}
          />
          <input
            className="w-32 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
            type="number"
            placeholder="Valor Base"
            value={newExpense.value}
            onChange={e => setNewExpense({ ...newExpense, value: e.target.value })}
          />
          <button
            onClick={handleAdd}
            className="bg-emerald-600 text-white px-4 rounded font-bold hover:bg-emerald-700 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>

      {/* Checklist de Pagamentos */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 flex justify-between">
          <span>Checklist de Pagamentos</span>
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
            Edite o valor se variar este mês
          </span>
        </div>
        <div className="divide-y">
          {sortedExpenses.map((expense, index) => {
            const isPaid = expense.paidStatus[selectedMonth];
            const isOverridden =
              expense.overrides && expense.overrides[selectedMonth] !== undefined;
            const currentValue = isOverridden
              ? expense.overrides[selectedMonth]
              : expense.value;

            return (
              <div
                key={expense.id}
                className={`p-4 flex flex-col sm:flex-row justify-between items-center gap-4 ${
                  isPaid ? 'bg-emerald-50/30' : ''
                }`}
              >
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Botões de reordenação */}
                  <ReorderButtons
                    index={index}
                    totalItems={sortedExpenses.length}
                    onMoveUp={() => handleMove(expense, 'up')}
                    onMoveDown={() => handleMove(expense, 'down')}
                  />

                  <button
                    onClick={() => togglePaid(expense)}
                    className={`p-2 rounded-full transition-all ${
                      isPaid
                        ? 'bg-emerald-500 text-white scale-110'
                        : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {isPaid ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  <div
                    className={`font-medium ${
                      isPaid ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {expense.name}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-2 p-1 px-2 rounded border ${
                      isOverridden
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'border-transparent hover:border-slate-200'
                    }`}
                  >
                    <span className="text-xs text-slate-400">R$</span>
                    <input
                      type="number"
                      value={currentValue}
                      onChange={e => updateOverride(expense, e.target.value)}
                      className={`w-24 bg-transparent text-right font-mono font-bold outline-none ${
                        isOverridden
                          ? 'text-yellow-700'
                          : isPaid
                          ? 'text-emerald-600'
                          : 'text-slate-700'
                      }`}
                    />
                  </div>
                  {isOverridden && (
                    <button
                      onClick={() => resetOverride(expense)}
                      title="Voltar ao valor original"
                    >
                      <RotateCcw
                        size={16}
                        className="text-slate-400 hover:text-emerald-600"
                      />
                    </button>
                  )}
                  <button onClick={() => handleDelete(expense.id)}>
                    <Trash2 size={18} className="text-slate-300 hover:text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Total do Cartão */}
          <div className="p-4 flex justify-between bg-indigo-50 border-l-4 border-indigo-400">
            <div className="flex items-center gap-2 pl-2">
              <CreditCard size={20} className="text-indigo-500" />
              <div className="font-bold text-slate-800">Cartão de Crédito (Total)</div>
            </div>
            <div className="font-mono font-bold text-indigo-700 text-lg">
              {formatCurrency(finalCardTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Anotações do Mês */}
      <MonthlyNotes
        selectedMonth={selectedMonth}
        notes={notes}
        onSave={onSaveNotes}
      />
    </div>
  );
};

export default MonthlyExpensesView;
