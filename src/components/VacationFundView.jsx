import React, { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import ReorderButtons from './ReorderButtons';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { getVacationTotals } from '../services/calculations';
import { useReorder } from '../hooks/useReorder';

const VacationFundView = ({ vacationFund, onSave, onDelete }) => {
  const toast = useToast();
  const [newVacationIncome, setNewVacationIncome] = useState({ name: '', value: '' });
  const [newVacationExpense, setNewVacationExpense] = useState({ name: '', value: '' });

  // Usar hooks de reordenação para entradas e saídas
  const {
    sortedItems: sortedIncomes,
    moveItem: moveIncome
  } = useReorder(vacationFund.incomes, (updatedItem) => onSave('vacation_incomes', updatedItem));

  const {
    sortedItems: sortedExpenses,
    moveItem: moveExpense
  } = useReorder(vacationFund.expenses, (updatedItem) => onSave('vacation_expenses', updatedItem));

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

  const handleMoveIncome = async (item, direction) => {
    const result = await moveIncome(item, direction);
    if (result.success) {
      toast.success('Ordem atualizada!');
    } else if (result.error) {
      toast.error('Erro ao reordenar');
    }
  };

  const handleMoveExpense = async (item, direction) => {
    const result = await moveExpense(item, direction);
    if (result.success) {
      toast.success('Ordem atualizada!');
    } else if (result.error) {
      toast.error('Erro ao reordenar');
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Fundo de Férias</h2>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card de Entradas */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-600">
            <TrendingUp size={60} />
          </div>
          <div className="text-slate-500 text-xs mb-1 font-medium">
            Total de Entradas
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totals.incomeTotal)}
          </div>
        </div>

        {/* Card de Saídas */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-red-500">
            <TrendingDown size={60} />
          </div>
          <div className="text-slate-500 text-xs mb-1 font-medium">
            Total de Saídas
          </div>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totals.expenseTotal)}
          </div>
        </div>

        {/* Card de Saldo */}
        <div className={`p-4 rounded-xl shadow-sm border relative overflow-hidden ${
          totals.balance >= 0
            ? 'bg-blue-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          <div className="text-white/80 text-xs mb-1 font-medium">Saldo Disponível</div>
          <div className="text-2xl font-bold">
            {formatCurrency(totals.balance)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
        {/* Entradas */}
        <div className="bg-white rounded-xl shadow-sm border flex flex-col">
          <div className="p-3 bg-emerald-50 border-b font-bold text-emerald-800">
            Entradas
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {sortedIncomes.map((item, index) => (
              <div key={item.id} className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-2 flex-1">
                  <ReorderButtons
                    index={index}
                    totalItems={sortedIncomes.length}
                    onMoveUp={() => handleMoveIncome(item, 'up')}
                    onMoveDown={() => handleMoveIncome(item, 'down')}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="flex gap-2 font-mono font-bold text-emerald-600 items-center">
                  {formatCurrency(item.value)}
                  <button onClick={() => handleDelete('vacation_incomes', item.id)}>
                    <Trash2 size={14} className="text-slate-300 hover:text-red-500" />
                  </button>
                </span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t bg-slate-50 flex gap-2">
            <input
              placeholder="Desc"
              value={newVacationIncome.name}
              onChange={e => setNewVacationIncome({ ...newVacationIncome, name: e.target.value })}
              className="flex-1 text-sm p-1 rounded border focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <input
              placeholder="R$"
              type="number"
              value={newVacationIncome.value}
              onChange={e => setNewVacationIncome({ ...newVacationIncome, value: e.target.value })}
              className="w-20 text-sm p-1 rounded border focus:ring-2 focus:ring-emerald-500 outline-none"
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
        <div className="bg-white rounded-xl shadow-sm border flex flex-col">
          <div className="p-3 bg-red-50 border-b font-bold text-red-800">Saídas</div>
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {sortedExpenses.map((item, index) => (
              <div key={item.id} className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-2 flex-1">
                  <ReorderButtons
                    index={index}
                    totalItems={sortedExpenses.length}
                    onMoveUp={() => handleMoveExpense(item, 'up')}
                    onMoveDown={() => handleMoveExpense(item, 'down')}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="flex gap-2 font-mono font-bold text-red-600 items-center">
                  {formatCurrency(item.value)}
                  <button onClick={() => handleDelete('vacation_expenses', item.id)}>
                    <Trash2 size={14} className="text-slate-300 hover:text-red-500" />
                  </button>
                </span>
              </div>
            ))}
          </div>
          <div className="p-3 border-t bg-slate-50 flex gap-2">
            <input
              placeholder="Desc"
              value={newVacationExpense.name}
              onChange={e => setNewVacationExpense({ ...newVacationExpense, name: e.target.value })}
              className="flex-1 text-sm p-1 rounded border focus:ring-2 focus:ring-red-500 outline-none"
            />
            <input
              placeholder="R$"
              type="number"
              value={newVacationExpense.value}
              onChange={e => setNewVacationExpense({ ...newVacationExpense, value: e.target.value })}
              className="w-20 text-sm p-1 rounded border focus:ring-2 focus:ring-red-500 outline-none"
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
    </div>
  );
};

export default VacationFundView;
