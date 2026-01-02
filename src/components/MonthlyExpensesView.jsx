import React, { useState } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, RotateCcw, CreditCard } from 'lucide-react';
import MonthSelector from './MonthSelector';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { validateExpense, getMonthlyCardTotal } from '../services/calculations';

const MonthlyExpensesView = ({
  selectedMonth,
  onMonthChange,
  expenses,
  creditCardExpenses,
  invoiceTotals,
  onSave,
  onDelete
}) => {
  const toast = useToast();
  const [newExpense, setNewExpense] = useState({ name: '', value: '' });

  const finalCardTotal = getMonthlyCardTotal(creditCardExpenses, invoiceTotals, selectedMonth);

  const handleAdd = async () => {
    const validation = validateExpense({
      ...newExpense,
      value: parseFloat(newExpense.value)
    });

    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const result = await onSave('expenses', {
      name: newExpense.name,
      value: parseFloat(newExpense.value),
      paidStatus: Array(12).fill(false),
      overrides: {}
    });

    if (result.success) {
      toast.success('Despesa adicionada!');
      setNewExpense({ name: '', value: '' });
    } else {
      toast.error(`Erro: ${result.error}`);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Despesas Mensais</h2>
        <MonthSelector selectedMonth={selectedMonth} onChange={onMonthChange} />
      </div>

      {/* Formulário de Adição */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
          <Plus size={16} /> Adicionar Nova Despesa (Fixa/Recorrente)
        </h3>
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 rounded bg-slate-50 border focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Nome (Ex: Clube, Curso)"
            value={newExpense.name}
            onChange={e => setNewExpense({ ...newExpense, name: e.target.value })}
          />
          <input
            className="w-32 p-2 rounded bg-slate-50 border focus:ring-2 focus:ring-emerald-500 outline-none"
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b bg-slate-50 font-bold text-slate-700 flex justify-between">
          <span>Checklist de Pagamentos</span>
          <span className="text-xs font-normal text-slate-500">
            Edite o valor se variar este mês
          </span>
        </div>
        <div className="divide-y">
          {expenses.map(expense => {
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
                <div className="flex items-center gap-4 w-full sm:w-auto">
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
                      isPaid ? 'text-slate-400 line-through' : 'text-slate-800'
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
    </div>
  );
};

export default MonthlyExpensesView;
