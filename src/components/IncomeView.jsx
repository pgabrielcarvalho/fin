import React, { useState, useMemo } from 'react';
import { Plus, Trash2, RotateCcw, TrendingUp, Settings2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import MonthTabs from './MonthTabs';

import MonthlyNotes from './MonthlyNotes';
import CategoryPicker from './CategoryPicker';
import CategoryManager from './CategoryManager';
import { SortableList, SortableItem, DragHandle } from './SortableList';
import EditableValue from './EditableValue';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { validateIncome, getMonthlyIncome } from '../services/calculations';
import { useReorder } from '../hooks/useReorder';
import { useDragReorder } from '../hooks/useDragReorder';

const IncomeView = ({
  selectedMonth,
  onMonthChange,
  incomes,
  onSave,
  onBatchSave,
  onDelete,
  notes,
  onSaveNotes,
  categories = [],
  onSaveCategories
}) => {
  const toast = useToast();
  const [newIncome, setNewIncome] = useState({
    name: '',
    value: '',
    type: 'fixed',
    month: selectedMonth,
    categoryId: '',
    extraordinary: false
  });
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Filtrar receitas por tipo
  const fixedIncomes = useMemo(() => incomes.filter(i => i.type === 'fixed'), [incomes]);
  const variableIncomes = useMemo(
    () => incomes.filter(i => i.type === 'variable' && i.month === selectedMonth),
    [incomes, selectedMonth]
  );

  // Usar hooks de reordenação para cada lista
  const {
    sortedItems: sortedFixedIncomes
  } = useReorder(fixedIncomes, (updatedItem) => onSave('incomes', updatedItem));

  const {
    sortedItems: sortedVariableIncomes
  } = useReorder(variableIncomes, (updatedItem) => onSave('incomes', updatedItem));

  const { handleDragReorder: handleDragReorderFixed } = useDragReorder('incomes', sortedFixedIncomes, onBatchSave);
  const { handleDragReorder: handleDragReorderVariable } = useDragReorder('incomes', sortedVariableIncomes, onBatchSave);

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

    const incomeData = {
      name: newIncome.name,
      value: parseFloat(newIncome.value),
      type: newIncome.type,
      month: newIncome.type === 'variable' ? parseInt(newIncome.month) : null,
      overrides: {},
      order: maxOrder + 1
    };

    if (newIncome.categoryId) {
      incomeData.categoryId = newIncome.categoryId;
    }

    if (newIncome.extraordinary) {
      incomeData.extraordinary = true;
    }

    const result = await onSave('incomes', incomeData);

    if (result.success) {
      toast.success('Receita adicionada com sucesso!');
      setNewIncome({ name: '', value: '', type: 'fixed', month: selectedMonth, categoryId: '', extraordinary: false });
    } else {
      toast.error(`Erro ao adicionar receita: ${result.error}`);
    }
  };

  const toggleExtraordinary = async (income) => {
    await onSave('incomes', { ...income, extraordinary: !income.extraordinary });
  };

  const handleCategoryChange = async (income, categoryId) => {
    const updated = { ...income };
    if (categoryId) {
      updated.categoryId = categoryId;
    } else {
      delete updated.categoryId;
    }
    await onSave('incomes', updated);
  };

  const updateOverride = async (income, newValue) => {
    const newOverrides = { ...income.overrides };

    if (newValue === income.value) {
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
    const batchItems = [];

    // 1. Copiar overrides de receitas fixas
    for (const income of fixedIncomes) {
      const sourceValue = income.overrides?.[sourceMonth] !== undefined
        ? income.overrides[sourceMonth]
        : income.value;

      const newOverrides = { ...income.overrides, [selectedMonth]: sourceValue };
      batchItems.push({ collectionName: 'incomes', item: { ...income, overrides: newOverrides } });
    }

    // 2. Copiar receitas variáveis do mês de origem
    const sourceVariableIncomes = incomes.filter(
      i => i.type === 'variable' && i.month === sourceMonth
    );

    let maxOrder = incomes.reduce((max, inc) =>
      Math.max(max, inc.order !== undefined ? inc.order : 0), 0
    );

    for (const income of sourceVariableIncomes) {
      maxOrder++;
      batchItems.push({
        collectionName: 'incomes',
        item: {
          name: income.name,
          value: income.value,
          type: 'variable',
          month: selectedMonth,
          overrides: {},
          order: maxOrder
        }
      });
    }

    if (batchItems.length > 0) {
      await onBatchSave(batchItems);
    }

    toast.success(`${batchItems.length} ${batchItems.length === 1 ? 'receita copiada' : 'receitas copiadas'} de ${MONTHS[sourceMonth]}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Gestão de Receitas</h2>
      </div>
      <MonthTabs selectedMonth={selectedMonth} onChange={onMonthChange} />

      {/* Toggle Resumo */}
      <button
        onClick={() => setShowSummary(!showSummary)}
        className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      >
        {showSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Resumo
      </button>

      {showSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card de Receitas Fixas */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <TrendingUp size={60} />
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs mb-1 font-medium">
              Receitas Fixas
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(totals.fixedTotal)}
            </div>
          </div>

          {/* Card de Receitas Variáveis */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <TrendingUp size={60} />
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs mb-1 font-medium">
              Receitas Variáveis
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
              {formatCurrency(totals.variableTotal)}
            </div>
          </div>

          {/* Card de Total */}
          <div className="bg-emerald-600 dark:bg-emerald-700 text-white p-4 rounded-xl shadow-sm border relative overflow-hidden">
            <div className="text-white/80 text-xs mb-1 font-medium">Total de Receitas</div>
            <div className="text-2xl font-bold">
              {formatCurrency(totals.totalIncome)}
            </div>
          </div>
        </div>
      )}

      {/* Formulário de Adição */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Plus size={16} className="text-emerald-500 dark:text-emerald-400" /> Adicionar Nova Receita
        </h3>

        {/* Toggle de Tipo */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setNewIncome({ ...newIncome, type: 'fixed' })}
            className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-colors ${
              newIncome.type === 'fixed'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Fixo
          </button>
          <button
            onClick={() => setNewIncome({ ...newIncome, type: 'variable' })}
            className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-colors ${
              newIncome.type === 'variable'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Variável
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
              placeholder={newIncome.type === 'fixed' ? "Descrição (Ex: Salário, Aluguel)" : "Descrição (Ex: Freelance, Bônus)"}
              value={newIncome.name}
              onChange={e => setNewIncome({ ...newIncome, name: e.target.value })}
            />
            <input
              className="w-full sm:w-32 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
              type="number"
              placeholder="Valor"
              value={newIncome.value}
              onChange={e => setNewIncome({ ...newIncome, value: e.target.value })}
            />

            {/* Select de mês para receitas variáveis */}
            {newIncome.type === 'variable' && (
              <select
                className="w-full sm:w-36 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
                value={newIncome.month}
                onChange={e => setNewIncome({ ...newIncome, month: parseInt(e.target.value) })}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            )}

            {/* Select de categoria */}
            <select
              className="w-full sm:w-36 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200 text-sm"
              value={newIncome.categoryId}
              onChange={e => setNewIncome({ ...newIncome, categoryId: e.target.value })}
            >
              <option value="">Categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <button
              onClick={handleAdd}
              className="bg-emerald-600 text-white px-4 py-2 rounded font-bold hover:bg-emerald-700 transition-colors whitespace-nowrap"
            >
              Adicionar
            </button>
          </div>

          {/* Checkbox extraordinária + Dica */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newIncome.extraordinary}
                onChange={e => setNewIncome({ ...newIncome, extraordinary: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">Receita extraordinária</span>
            </label>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {newIncome.type === 'fixed'
                ? "Fixas aparecem todos os meses"
                : "Variáveis aparecem apenas no mês selecionado"}
            </div>
          </div>
        </div>
      </div>

      {/* Listagem */}
      <div className="space-y-6">
          {/* Receitas Fixas */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
              <span>Receitas Fixas</span>
              <button
                onClick={() => setShowCategoryManager(true)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                title="Gerenciar categorias"
              >
                <Settings2 size={14} />
                <span className="hidden sm:inline">Categorias</span>
              </button>
            </div>
            <div className="divide-y dark:divide-slate-700">
              <SortableList items={sortedFixedIncomes} onReorder={handleDragReorderFixed}>
                {sortedFixedIncomes.map((item) => {
                  const isOverridden =
                    item.overrides && item.overrides[selectedMonth] !== undefined;
                  const currentValue = isOverridden
                    ? item.overrides[selectedMonth]
                    : item.value;

                  return (
                    <SortableItem key={item.id} id={item.id}>
                      {({ dragHandleProps }) => (
                        <div className="p-4 flex justify-between items-center bg-white dark:bg-slate-800">
                          <div className="flex items-center gap-2">
                            <DragHandle {...dragHandleProps} />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleExtraordinary(item); }}
                                  className={`px-1.5 py-0.5 rounded-md transition-colors ${
                                    item.extraordinary
                                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                                      : 'text-slate-300 dark:text-slate-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-400 dark:hover:text-purple-500'
                                  }`}
                                  title={item.extraordinary ? 'Remover marcação extraordinária' : 'Marcar como extraordinária'}
                                >
                                  <Sparkles size={12} />
                                </button>
                                <CategoryPicker
                                  categoryId={item.categoryId}
                                  categories={categories}
                                  onChange={(catId) => handleCategoryChange(item, catId)}
                                />
                              </div>
                              <div className="text-xs text-slate-400 dark:text-slate-500">
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
                              <EditableValue
                                value={currentValue}
                                onSave={(val) => updateOverride(item, val)}
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
                      )}
                    </SortableItem>
                  );
                })}
              </SortableList>
            </div>
          </div>

          {/* Receitas Variáveis */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300">
              Extras ({MONTHS[selectedMonth]})
            </div>
            <div className="divide-y dark:divide-slate-700">
              {sortedVariableIncomes.length === 0 ? (
                <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-sm">
                  Nenhuma receita extra neste mês
                </div>
              ) : (
                <SortableList items={sortedVariableIncomes} onReorder={handleDragReorderVariable}>
                  {sortedVariableIncomes.map((item) => (
                    <SortableItem key={item.id} id={item.id}>
                      {({ dragHandleProps }) => (
                        <div className="p-4 flex justify-between items-center bg-white dark:bg-slate-800">
                          <div className="flex items-center gap-2">
                            <DragHandle {...dragHandleProps} />
                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleExtraordinary(item); }}
                              className={`px-1.5 py-0.5 rounded-md transition-colors ${
                                item.extraordinary
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                                  : 'text-slate-300 dark:text-slate-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-400 dark:hover:text-purple-500'
                              }`}
                              title={item.extraordinary ? 'Remover marcação extraordinária' : 'Marcar como extraordinária'}
                            >
                              <Sparkles size={12} />
                            </button>
                            <CategoryPicker
                              categoryId={item.categoryId}
                              categories={categories}
                              onChange={(catId) => handleCategoryChange(item, catId)}
                            />
                          </div>
                          <div className="flex gap-4 items-center">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
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
                      )}
                    </SortableItem>
                  ))}
                </SortableList>
              )}
            </div>
          </div>
      </div>

      {/* Anotações do Mês */}
      <MonthlyNotes
        selectedMonth={selectedMonth}
        notes={notes}
        onSave={onSaveNotes}
      />

      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onSave={onSaveCategories}
          onClose={() => setShowCategoryManager(false)}
        />
      )}
    </div>
  );
};

export default IncomeView;
