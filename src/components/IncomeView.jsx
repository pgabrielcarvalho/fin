import React, { useState } from 'react';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import MonthSelector from './MonthSelector';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { validateIncome } from '../services/calculations';

const IncomeView = ({
  selectedMonth,
  onMonthChange,
  incomes,
  onSave,
  onDelete
}) => {
  const toast = useToast();
  const [newIncome, setNewIncome] = useState({
    name: '',
    value: '',
    type: 'fixed',
    month: selectedMonth
  });

  const handleAdd = async () => {
    const validation = validateIncome({
      ...newIncome,
      value: parseFloat(newIncome.value)
    });

    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const result = await onSave('incomes', {
      name: newIncome.name,
      value: parseFloat(newIncome.value),
      type: newIncome.type,
      month: newIncome.type === 'variable' ? parseInt(newIncome.month) : null,
      overrides: {}
    });

    if (result.success) {
      toast.success('Receita adicionada com sucesso!');
      setNewIncome({ name: '', value: '', type: 'fixed', month: selectedMonth });
    } else {
      toast.error(`Erro ao adicionar receita: ${result.error}`);
    }
  };

  const updateOverride = async (income, newValueStr) => {
    const newValue = parseFloat(newValueStr);
    const newOverrides = { ...income.overrides };

    if (isNaN(newValue) || newValue === income.value) {
      delete newOverrides[selectedMonth];
    } else {
      newOverrides[selectedMonth] = newValue;
    }

    await onSave('incomes', { ...income, overrides: newOverrides });
  };

  const resetOverride = async (income) => {
    const newOverrides = { ...income.overrides };
    delete newOverrides[selectedMonth];
    await onSave('incomes', { ...income, overrides: newOverrides });
    toast.info('Valor restaurado');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      const result = await onDelete('incomes', id);
      if (result.success) {
        toast.success('Receita excluída');
      } else {
        toast.error('Erro ao excluir receita');
      }
    }
  };

  const fixedIncomes = incomes.filter(i => i.type === 'fixed');
  const variableIncomes = incomes.filter(
    i => i.type === 'variable' && i.month === selectedMonth
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Gestão de Receitas</h2>
        <MonthSelector selectedMonth={selectedMonth} onChange={onMonthChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Adição */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Plus size={20} className="text-emerald-500" /> Nova Entrada
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Descrição"
              value={newIncome.name}
              onChange={e => setNewIncome({ ...newIncome, name: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <input
              type="number"
              placeholder="Valor"
              value={newIncome.value}
              onChange={e => setNewIncome({ ...newIncome, value: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setNewIncome({ ...newIncome, type: 'fixed' })}
                className={`flex-1 py-2 rounded font-medium transition-colors ${
                  newIncome.type === 'fixed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Fixo
              </button>
              <button
                onClick={() => setNewIncome({ ...newIncome, type: 'variable' })}
                className={`flex-1 py-2 rounded font-medium transition-colors ${
                  newIncome.type === 'variable'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Variável
              </button>
            </div>
            {newIncome.type === 'variable' && (
              <select
                value={newIncome.month}
                onChange={e => setNewIncome({ ...newIncome, month: parseInt(e.target.value) })}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleAdd}
              className="w-full bg-emerald-600 text-white font-bold py-2 rounded hover:bg-emerald-700 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>

        {/* Listagem */}
        <div className="lg:col-span-2 space-y-6">
          {/* Receitas Fixas */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b bg-slate-50 font-bold text-slate-700">
              Receitas Fixas
            </div>
            <div className="divide-y">
              {fixedIncomes.map(item => {
                const isOverridden =
                  item.overrides && item.overrides[selectedMonth] !== undefined;
                const currentValue = isOverridden
                  ? item.overrides[selectedMonth]
                  : item.value;

                return (
                  <div key={item.id} className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-400">
                        Base: {formatCurrency(item.value)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-2 p-1 rounded border ${
                          isOverridden
                            ? 'bg-yellow-50 border-yellow-300'
                            : 'border-transparent'
                        }`}
                      >
                        <span className="text-xs text-slate-400">
                          {MONTHS[selectedMonth]}:
                        </span>
                        <input
                          type="number"
                          value={currentValue}
                          onChange={e => updateOverride(item, e.target.value)}
                          className={`w-24 bg-transparent text-right font-mono font-bold outline-none ${
                            isOverridden ? 'text-yellow-700' : 'text-emerald-600'
                          }`}
                        />
                      </div>
                      {isOverridden && (
                        <button
                          onClick={() => resetOverride(item)}
                          title="Restaurar valor original"
                        >
                          <RotateCcw
                            size={16}
                            className="text-slate-400 hover:text-emerald-600"
                          />
                        </button>
                      )}
                      <button onClick={() => handleDelete(item.id)}>
                        <Trash2
                          size={18}
                          className="text-slate-300 hover:text-red-500"
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Receitas Variáveis */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b bg-slate-50 font-bold text-slate-700">
              Extras ({MONTHS[selectedMonth]})
            </div>
            <div className="divide-y">
              {variableIncomes.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">
                  Nenhuma receita extra neste mês
                </div>
              ) : (
                variableIncomes.map(item => (
                  <div key={item.id} className="p-4 flex justify-between items-center">
                    <span className="font-medium">{item.name}</span>
                    <div className="flex gap-4 items-center">
                      <span className="font-mono font-bold text-blue-600">
                        {formatCurrency(item.value)}
                      </span>
                      <button onClick={() => handleDelete(item.id)}>
                        <Trash2
                          size={18}
                          className="text-slate-300 hover:text-red-500"
                        />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeView;
