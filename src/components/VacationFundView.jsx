import React, { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Keyboard } from 'lucide-react';
import MonthlyNotes from './MonthlyNotes';
import { SortableList, SortableItem, DragHandle } from './SortableList';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { getVacationTotals } from '../services/calculations';
import { useReorder } from '../hooks/useReorder';
import { useDragReorder } from '../hooks/useDragReorder';

const VacationFundView = ({ vacationFund, onSave, onBatchSave, onDelete, notes, onSaveNotes }) => {
  const toast = useToast();
  const [newVacationIncome, setNewVacationIncome] = useState({ name: '', value: '' });
  const [newVacationExpense, setNewVacationExpense] = useState({ name: '', value: '' });
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Usar hooks de reordenação para entradas e saídas
  const {
    sortedItems: sortedIncomes
  } = useReorder(vacationFund.incomes, (updatedItem) => onSave('vacation_incomes', updatedItem));

  const {
    sortedItems: sortedExpenses
  } = useReorder(vacationFund.expenses, (updatedItem) => onSave('vacation_expenses', updatedItem));

  const { handleDragReorder: handleDragReorderIncomes } = useDragReorder('vacation_incomes', sortedIncomes, onBatchSave);
  const { handleDragReorder: handleDragReorderExpenses } = useDragReorder('vacation_expenses', sortedExpenses, onBatchSave);

  const totals = useMemo(
    () => getVacationTotals({ incomes: sortedIncomes, expenses: sortedExpenses }),
    [sortedIncomes, sortedExpenses]
  );

  const addIncome = async () => {
    if (!newVacationIncome.name || !newVacationIncome.value) {
      toast.error('Preencha todos os campos');
      return;
    }

    const maxOrder = vacationFund.incomes.reduce(
      (max, inc) => Math.max(max, inc.order !== undefined ? inc.order : 0),
      0
    );

    const result = await onSave('vacation_incomes', {
      name: newVacationIncome.name,
      value: parseFloat(newVacationIncome.value),
      order: maxOrder + 1
    });

    if (result.success) {
      toast.success('Entrada adicionada!');
      setNewVacationIncome({ name: '', value: '' });
    }
  };

  const addExpense = async () => {
    if (!newVacationExpense.name || !newVacationExpense.value) {
      toast.error('Preencha todos os campos');
      return;
    }

    const maxOrder = vacationFund.expenses.reduce(
      (max, exp) => Math.max(max, exp.order !== undefined ? exp.order : 0),
      0
    );

    const result = await onSave('vacation_expenses', {
      name: newVacationExpense.name,
      value: parseFloat(newVacationExpense.value),
      order: maxOrder + 1
    });

    if (result.success) {
      toast.success('Saída adicionada!');
      setNewVacationExpense({ name: '', value: '' });
    }
  };

  const handleDelete = async (collection, id) => {
    if (window.confirm('Excluir este item?')) {
      await onDelete(collection, id);
      toast.success('Item excluído');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Fundo de Férias</h2>
        {/* Botão discreto para atalhos - apenas desktop */}
        <button
          onClick={() => setShowShortcuts(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Ver atalhos de teclado"
        >
          <Keyboard size={14} />
          <span>Atalhos</span>
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card de Entradas */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={60} />
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs mb-1 font-medium">
            Total de Entradas
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totals.incomeTotal)}
          </div>
        </div>

        {/* Card de Saídas */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-red-500 dark:text-red-400">
            <TrendingDown size={60} />
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs mb-1 font-medium">
            Total de Saídas
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totals.expenseTotal)}
          </div>
        </div>

        {/* Card de Saldo */}
        <div className={`p-4 rounded-xl shadow-sm border relative overflow-hidden ${
          totals.balance >= 0
            ? 'bg-blue-600 dark:bg-blue-700 text-white'
            : 'bg-red-600 dark:bg-red-700 text-white'
        }`}>
          <div className="text-white/80 text-xs mb-1 font-medium">Saldo Disponível</div>
          <div className="text-2xl font-bold">
            {formatCurrency(totals.balance)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:h-[500px]">
        {/* Entradas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 flex flex-col">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border-b dark:border-slate-700 font-bold text-emerald-800 dark:text-emerald-300">
            Entradas
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-2">
            <SortableList items={sortedIncomes} onReorder={handleDragReorderIncomes}>
              {sortedIncomes.map((item) => (
                <SortableItem key={item.id} id={item.id}>
                  {({ dragHandleProps }) => (
                    <div className="flex justify-between text-sm items-center bg-white dark:bg-slate-800 py-1">
                      <div className="flex items-center gap-2 flex-1">
                        <DragHandle {...dragHandleProps} />
                        <span className="text-slate-800 dark:text-slate-200">{item.name}</span>
                      </div>
                      <span className="flex gap-2 font-mono font-bold text-emerald-600 dark:text-emerald-400 items-center">
                        {formatCurrency(item.value)}
                        <button onClick={() => handleDelete('vacation_incomes', item.id)}>
                          <Trash2 size={14} className="text-slate-300 hover:text-red-500" />
                        </button>
                      </span>
                    </div>
                  )}
                </SortableItem>
              ))}
            </SortableList>
          </div>
          <div className="p-3 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-700 flex gap-2">
            <input
              placeholder="Desc"
              value={newVacationIncome.name}
              onChange={e => setNewVacationIncome({ ...newVacationIncome, name: e.target.value })}
              className="flex-1 text-sm p-1 rounded border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200"
            />
            <input
              placeholder="R$"
              type="number"
              value={newVacationIncome.value}
              onChange={e => setNewVacationIncome({ ...newVacationIncome, value: e.target.value })}
              className="w-20 text-sm p-1 rounded border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200"
            />
            <button
              onClick={addIncome}
              className="bg-emerald-600 text-white p-1 rounded hover:bg-emerald-700"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Saídas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 flex flex-col">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b dark:border-slate-700 font-bold text-red-800 dark:text-red-300">Saídas</div>
          <div className="flex-1 overflow-auto p-4 space-y-2">
            <SortableList items={sortedExpenses} onReorder={handleDragReorderExpenses}>
              {sortedExpenses.map((item) => (
                <SortableItem key={item.id} id={item.id}>
                  {({ dragHandleProps }) => (
                    <div className="flex justify-between text-sm items-center bg-white dark:bg-slate-800 py-1">
                      <div className="flex items-center gap-2 flex-1">
                        <DragHandle {...dragHandleProps} />
                        <span className="text-slate-800 dark:text-slate-200">{item.name}</span>
                      </div>
                      <span className="flex gap-2 font-mono font-bold text-red-600 dark:text-red-400 items-center">
                        {formatCurrency(item.value)}
                        <button onClick={() => handleDelete('vacation_expenses', item.id)}>
                          <Trash2 size={14} className="text-slate-300 hover:text-red-500" />
                        </button>
                      </span>
                    </div>
                  )}
                </SortableItem>
              ))}
            </SortableList>
          </div>
          <div className="p-3 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-700 flex gap-2">
            <input
              placeholder="Desc"
              value={newVacationExpense.name}
              onChange={e => setNewVacationExpense({ ...newVacationExpense, name: e.target.value })}
              className="flex-1 text-sm p-1 rounded border dark:border-slate-600 focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200"
            />
            <input
              placeholder="R$"
              type="number"
              value={newVacationExpense.value}
              onChange={e => setNewVacationExpense({ ...newVacationExpense, value: e.target.value })}
              className="w-20 text-sm p-1 rounded border dark:border-slate-600 focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200"
            />
            <button
              onClick={addExpense}
              className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Anotações */}
      <MonthlyNotes
        notes={notes}
        onSave={onSaveNotes}
        title="Anotações do Fundo de Férias"
      />
    </div>
  );
};

export default VacationFundView;
