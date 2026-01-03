import React, { useState, useMemo } from 'react';
import { Plus, Trash2, RotateCcw, TrendingUp } from 'lucide-react';
import MonthTabs from './MonthTabs';
import CopyFromMonthDropdown from './CopyFromMonthDropdown';
import MonthlyNotes from './MonthlyNotes';
import ReorderButtons from './ReorderButtons';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { validateIncome, getMonthlyIncome } from '../services/calculations';
import { useReorder } from '../hooks/useReorder';

const IncomeView = ({
  selectedMonth,
  onMonthChange,
  incomes,
  onSave,
  onDelete,
  notes,
  onSaveNotes
}) => {
  const toast = useToast();
  const [newIncome, setNewIncome] = useState({
    name: '',
    value: '',
    type: 'fixed',
    month: selectedMonth
  });

  // Filtrar receitas por tipo
  const fixedIncomes = useMemo(() => incomes.filter(i => i.type === 'fixed'), [incomes]);
  const variableIncomes = useMemo(
    () => incomes.filter(i => i.type === 'variable' && i.month === selectedMonth),
    [incomes, selectedMonth]
  );

  // Usar hooks de reordenação para cada lista
  const {
    sortedItems: sortedFixedIncomes,
    moveItem: moveFixedItem
  } = useReorder(fixedIncomes, (updatedItem) => onSave('incomes', updatedItem));

  const {
    sortedItems: sortedVariableIncomes,
    moveItem: moveVariableItem
  } = useReorder(variableIncomes, (updatedItem) => onSave('incomes', updatedItem));

  // Calcular totais para os cards de resumo
  const totals = useMemo(() => {
    const fixedTotal = sortedFixedIncomes.reduce((acc, income) => {
      const monthValue = income.overrides?.[selectedMonth] !== undefined
        ? income.overrides[selectedMonth]
        : income.value;
      return acc + monthValue;
    }, 0);

    const variableTotal = sortedVariableIncomes.reduce((acc, income) => acc + income.value, 0);
    const totalIncome = fixedTotal + variableTotal;

    return { fixedTotal, variableTotal, totalIncome };
  }, [sortedFixedIncomes, sortedVariableIncomes, selectedMonth]);

  const handleAdd = async () => {
    const validation = validateIncome({
      ...newIncome,
      value: parseFloat(newIncome.value)
    });

    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const maxOrder = incomes.reduce((max, inc) =>
      Math.max(max, inc.order !== undefined ? inc.order : 0), 0
    );

    const result = await onSave('incomes', {
      name: newIncome.name,
      value: parseFloat(newIncome.value),
      type: newIncome.type,
      month: newIncome.type === 'variable' ? parseInt(newIncome.month) : null,
      overrides: {},
      order: maxOrder + 1
    });

    if (result.success) {
      toast.success('Receita adicionada com sucesso!');
      setNewIncome({ name: '', value: '', type: 'fixed', month: selectedMonth });
    } else {
      toast.error(`Erro ao adicionar receita: ${result.error}`);
    }
  };

  const handleMoveFixed = async (income, direction) => {
    const result = await moveFixedItem(income, direction);
    if (result.success) {
      toast.success('Ordem atualizada!');
    } else if (result.error) {
      toast.error('Erro ao reordenar');
    }
  };

  const handleMoveVariable = async (income, direction) => {
    const result = await moveVariableItem(income, direction);
    if (result.success) {
      toast.success('Ordem atualizada!');
    } else if (result.error) {
      toast.error('Erro ao reordenar');
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

  const handleCopyFromMonth = async (sourceMonth) => {
    let copiedCount = 0;

    // 1. Copiar overrides de receitas fixas
    for (const income of fixedIncomes) {
      // Pegar o valor efetivo do mês de origem (override ou valor base)
      const sourceValue = income.overrides?.[sourceMonth] !== undefined
        ? income.overrides[sourceMonth]
        : income.value;

      // Criar override para o mês de destino com o valor efetivo do mês de origem
      const newOverrides = { ...income.overrides, [selectedMonth]: sourceValue };
      await onSave('incomes', { ...income, overrides: newOverrides });
      copiedCount++;
    }

    // 2. Copiar receitas variáveis do mês de origem
    const sourceVariableIncomes = incomes.filter(
      i => i.type === 'variable' && i.month === sourceMonth
    );

    for (const income of sourceVariableIncomes) {
      const maxOrder = incomes.reduce((max, inc) =>
        Math.max(max, inc.order !== undefined ? inc.order : 0), 0
      );

      await onSave('incomes', {
        name: income.name,
        value: income.value,
        type: 'variable',
        month: selectedMonth,
        overrides: {},
        order: maxOrder + 1
      });
      copiedCount++;
    }

    toast.success(`${copiedCount} ${copiedCount === 1 ? 'receita copiada' : 'receitas copiadas'} de ${MONTHS[sourceMonth]}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Gestão de Receitas</h2>
          <CopyFromMonthDropdown
            selectedMonth={selectedMonth}
            onCopy={handleCopyFromMonth}
          />
        </div>
        <MonthTabs selectedMonth={selectedMonth} onChange={onMonthChange} />
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card de Receitas Fixas */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingUp size={60} />
          </div>
          <div className="text-slate-500 text-xs mb-1 font-medium">
            Receitas Fixas
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {formatCurrency(totals.fixedTotal)}
          </div>
        </div>

        {/* Card de Receitas Variáveis */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <TrendingUp size={60} />
          </div>
          <div className="text-slate-500 text-xs mb-1 font-medium">
            Receitas Variáveis
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {formatCurrency(totals.variableTotal)}
          </div>
        </div>

        {/* Card de Total */}
        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-sm border relative overflow-hidden">
          <div className="text-white/80 text-xs mb-1 font-medium">Total de Receitas</div>
          <div className="text-2xl font-bold">
            {formatCurrency(totals.totalIncome)}
          </div>
        </div>
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
              {sortedFixedIncomes.map((item, index) => {
                const isOverridden =
                  item.overrides && item.overrides[selectedMonth] !== undefined;
                const currentValue = isOverridden
                  ? item.overrides[selectedMonth]
                  : item.value;

                return (
                  <div key={item.id} className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {/* Botões de reordenação */}
                      <ReorderButtons
                        index={index}
                        totalItems={sortedFixedIncomes.length}
                        onMoveUp={() => handleMoveFixed(item, 'up')}
                        onMoveDown={() => handleMoveFixed(item, 'down')}
                      />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-slate-400">
                          Base: {formatCurrency(item.value)}
                        </div>
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
              {sortedVariableIncomes.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-sm">
                  Nenhuma receita extra neste mês
                </div>
              ) : (
                sortedVariableIncomes.map((item, index) => (
                  <div key={item.id} className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {/* Botões de reordenação */}
                      <ReorderButtons
                        index={index}
                        totalItems={sortedVariableIncomes.length}
                        onMoveUp={() => handleMoveVariable(item, 'up')}
                        onMoveDown={() => handleMoveVariable(item, 'down')}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
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

      {/* Anotações do Mês */}
      <MonthlyNotes
        selectedMonth={selectedMonth}
        notes={notes}
        onSave={onSaveNotes}
      />
    </div>
  );
};

export default IncomeView;
