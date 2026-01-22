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
  const [newExpense, setNewExpense] = useState({
    name: '',
    value: '',
    type: 'fixed',
    month: selectedMonth
  });

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

  // Filtrar despesas ativas no mês selecionado
  const activeExpenses = useMemo(() => {
    return sortedExpenses.filter(expense => {
      const expenseType = expense.type || 'fixed';
      if (expenseType === 'fixed') return true;
      if (expenseType === 'eventual') return expense.month === selectedMonth;
      return false;
    });
  }, [sortedExpenses, selectedMonth]);

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

    const expenseData = {
      name: newExpense.name,
      value: parseFloat(newExpense.value),
      type: newExpense.type,
      paidStatus: Array(12).fill(false),
      overrides: {},
      order: maxOrder + 1
    };

    // Adicionar o campo 'month' apenas se for eventual
    if (newExpense.type === 'eventual') {
      expenseData.month = newExpense.month;
    }

    const result = await onSave('expenses', expenseData);

    if (result.success) {
      toast.success('Despesa adicionada!');
      setNewExpense({ name: '', value: '', type: 'fixed', month: selectedMonth });
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
            Receita
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
          {stats.income > 0 && (
            <div className="mt-1 text-xs text-white/70">
              {((stats.balance / stats.income) * 100).toFixed(1)}% economizado
            </div>
          )}
        </div>
      </div>

      {/* Formulário de Adição */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Plus size={16} /> Adicionar Nova Despesa
        </h3>

        {/* Toggle de Tipo */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setNewExpense({ ...newExpense, type: 'fixed' })}
            className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-colors ${
              newExpense.type === 'fixed'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Fixa/Recorrente
          </button>
          <button
            onClick={() => setNewExpense({ ...newExpense, type: 'eventual' })}
            className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-colors ${
              newExpense.type === 'eventual'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Eventual
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
              placeholder={newExpense.type === 'fixed' ? "Nome (Ex: Condomínio, Clube)" : "Nome (Ex: IPVA, Material Escolar)"}
              value={newExpense.name}
              onChange={e => setNewExpense({ ...newExpense, name: e.target.value })}
            />
            <input
              className="w-full sm:w-32 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
              type="number"
              placeholder={newExpense.type === 'fixed' ? "Valor Base" : "Valor"}
              value={newExpense.value}
              onChange={e => setNewExpense({ ...newExpense, value: e.target.value })}
            />

            {/* Select de mês para despesas eventuais */}
            {newExpense.type === 'eventual' && (
              <select
                className="w-full sm:w-36 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
                value={newExpense.month}
                onChange={e => setNewExpense({ ...newExpense, month: parseInt(e.target.value) })}
              >
                {MONTHS.map((monthName, index) => (
                  <option key={index} value={index}>
                    {monthName}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleAdd}
              className="bg-emerald-600 text-white px-4 py-2 rounded font-bold hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              Salvar
            </button>
          </div>

          {/* Dica sobre tipo de despesa */}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {newExpense.type === 'fixed'
              ? "Despesas fixas aparecem todos os meses"
              : "Despesas eventuais aparecem apenas no mês selecionado"}
          </div>
        </div>
      </div>

      {/* Checklist de Pagamentos */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-3 md:p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700 font-bold text-sm md:text-base text-slate-700 dark:text-slate-300 flex justify-between items-center">
          <span>Checklist de Pagamentos</span>
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400 hidden sm:inline">
            Edite o valor se variar este mês
          </span>
        </div>
        <div className="divide-y">
          {activeExpenses.map((expense, index) => {
            const isPaid = expense.paidStatus[selectedMonth];
            const isOverridden =
              expense.overrides && expense.overrides[selectedMonth] !== undefined;
            const currentValue = isOverridden
              ? expense.overrides[selectedMonth]
              : expense.value;

            return (
              <div
                key={expense.id}
                className={`p-2.5 md:p-4 flex flex-row justify-between items-center gap-1.5 md:gap-4 ${
                  isPaid ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''
                }`}
              >
                <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
                  {/* Botões de reordenação - mostrar apenas para despesas fixas */}
                  {(!expense.type || expense.type === 'fixed') && (
                    <div className="flex-shrink-0">
                      <ReorderButtons
                        index={sortedExpenses.findIndex(e => e.id === expense.id)}
                        totalItems={sortedExpenses.length}
                        onMoveUp={() => handleMove(expense, 'up')}
                        onMoveDown={() => handleMove(expense, 'down')}
                      />
                    </div>
                  )}
                  {expense.type === 'eventual' && (
                    <div className="flex-shrink-0 w-[28px]" />
                  )}

                  <button
                    onClick={() => togglePaid(expense)}
                    className={`p-1.5 md:p-2 rounded-full transition-all flex-shrink-0 ${
                      isPaid
                        ? 'bg-emerald-500 text-white scale-110'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {isPaid ? <CheckCircle2 size={18} className="md:w-6 md:h-6" /> : <Circle size={18} className="md:w-6 md:h-6" />}
                  </button>
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`text-xs md:text-base font-medium truncate ${
                          isPaid ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {expense.name}
                      </div>
                      {expense.type === 'eventual' && (
                        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] md:text-xs font-medium rounded-md whitespace-nowrap">
                          {MONTHS[expense.month]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                  <div
                    className={`flex items-center gap-0.5 md:gap-2 p-1 px-1.5 md:px-2 rounded border ${
                      isOverridden
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline">R$</span>
                    <input
                      type="number"
                      value={currentValue}
                      onChange={e => updateOverride(expense, e.target.value)}
                      className={`w-16 md:w-24 bg-transparent text-right text-xs md:text-base font-mono font-bold outline-none ${
                        isOverridden
                          ? 'text-yellow-700 dark:text-yellow-400'
                          : isPaid
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    />
                  </div>
                  {isOverridden && (
                    <button
                      onClick={() => resetOverride(expense)}
                      title="Voltar ao valor original"
                      className="flex-shrink-0"
                    >
                      <RotateCcw
                        size={12}
                        className="md:w-4 md:h-4 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                      />
                    </button>
                  )}
                  <button onClick={() => handleDelete(expense.id)} className="flex-shrink-0">
                    <Trash2 size={14} className="md:w-[18px] md:h-[18px] text-slate-300 hover:text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Total do Cartão */}
          <div className="p-3 md:p-4 flex justify-between bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-400 dark:border-indigo-600">
            <div className="flex items-center gap-2 pl-2">
              <CreditCard size={18} className="md:w-5 md:h-5 text-indigo-500 dark:text-indigo-400" />
              <div className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-200">Cartão de Crédito (Total)</div>
            </div>
            <div className="text-base md:text-lg font-mono font-bold text-indigo-700 dark:text-indigo-400">
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
