import { useState, useMemo } from 'react';
import { Plus, Trash2, RotateCcw, TrendingUp, Settings2, Sparkles, ChevronDown, ChevronUp, X, DollarSign, ArrowUp } from 'lucide-react';
import MonthTabs from './MonthTabs';

import MonthlyNotes from './MonthlyNotes';
import CategoryPicker from './CategoryPicker';
import CategoryManager from './CategoryManager';
import { SortableList, SortableItem, DragHandle } from './SortableList';
import EditableValue from './EditableValue';
import TypeSelector from './TypeSelector';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { validateIncome } from '../services/calculations';
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
  const [showSummary, setShowSummary] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null); // { item, type: 'fixed'|'variable' }
  const [readjustModal, setReadjustModal] = useState(false);
  const [readjustValues, setReadjustValues] = useState({}); // { [incomeId]: novoValorString }

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

  const updateVariableValue = async (income, newValue) => {
    const result = await onSave('incomes', { ...income, value: newValue });
    if (result?.success === false) toast.error('Erro ao atualizar receita');
  };

  const saveIncomeOverrides = async (item, overrides, successMessage) => {
    try {
      const result = await onSave('incomes', { ...item, overrides });
      if (result?.success === false) {
        toast.error('Erro ao salvar alteração');
        return;
      }
      toast.success(successMessage);
    } catch {
      toast.error('Erro ao salvar alteração');
    }
  };

  const handleDelete = (item, type) => {
    setDeleteModal({ item, type });
  };

  const confirmDelete = async (mode) => {
    const { item, type } = deleteModal;
    setDeleteModal(null);

    if (type === 'variable') {
      const result = await onDelete('incomes', item.id);
      if (result.success) toast.success('Receita excluída');
      else toast.error('Erro ao excluir receita');
      return;
    }

    // fixed — modo determina o que fazer
    if (mode === 'all') {
      const result = await onDelete('incomes', item.id);
      if (result.success) toast.success('Receita excluída de todos os meses');
      else toast.error('Erro ao excluir receita');
    } else if (mode === 'this') {
      const newOverrides = { ...item.overrides, [selectedMonth]: 0 };
      await saveIncomeOverrides(item, newOverrides, `Receita zerada em ${MONTHS[selectedMonth]}`);
    } else if (mode === 'future') {
      const newOverrides = { ...item.overrides };
      for (let m = selectedMonth; m <= 11; m++) newOverrides[m] = 0;
      await saveIncomeOverrides(item, newOverrides, `Receita zerada de ${MONTHS[selectedMonth]} em diante`);
    }
  };

  const _handleCopyFromMonth = async (sourceMonth) => {
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

  const openReadjustModal = () => {
    // Pré-preenche cada receita com o valor vigente no mês atual
    const initial = {};
    for (const income of fixedIncomes) {
      const currentValue = income.overrides?.[selectedMonth] !== undefined
        ? income.overrides[selectedMonth]
        : income.value;
      initial[income.id] = String(currentValue);
    }
    setReadjustValues(initial);
    setReadjustModal(true);
  };

  // Aplica novos valores de selectedMonth até dezembro (overrides), preservando
  // os meses anteriores no valor base. Só grava receitas cujo valor mudou.
  const applyReadjustment = async () => {
    const batchItems = [];

    for (const income of fixedIncomes) {
      const raw = readjustValues[income.id];
      if (raw === undefined || raw === '') continue;

      const newValue = parseFloat(raw);
      if (isNaN(newValue) || newValue < 0) continue;

      // Valor atualmente vigente no mês selecionado — se não mudou, ignora
      const currentValue = income.overrides?.[selectedMonth] !== undefined
        ? income.overrides[selectedMonth]
        : income.value;
      if (newValue === currentValue) continue;

      const newOverrides = { ...income.overrides };
      for (let m = selectedMonth; m <= 11; m++) {
        if (newValue === income.value) {
          // Volta ao valor base: remove o override em vez de duplicá-lo
          delete newOverrides[m];
        } else {
          newOverrides[m] = newValue;
        }
      }

      batchItems.push({ collectionName: 'incomes', item: { ...income, overrides: newOverrides } });
    }

    if (batchItems.length === 0) {
      toast.info('Nenhum valor alterado');
      setReadjustModal(false);
      return;
    }

    const result = await onBatchSave(batchItems);

    if (result?.success === false) {
      toast.error('Erro ao aplicar reajuste');
      return;
    }

    setReadjustModal(false);
    toast.success(
      `Reajuste aplicado a ${batchItems.length} ${batchItems.length === 1 ? 'receita' : 'receitas'} a partir de ${MONTHS[selectedMonth]}`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in overflow-x-hidden">
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

        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <TypeSelector
              options={[
                { label: 'Fixo', value: 'fixed' },
                { label: 'Variável', value: 'variable' },
              ]}
              value={newIncome.type}
              onChange={(type) => setNewIncome({ ...newIncome, type })}
              activeColor="emerald"
            />
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
              <div className="flex items-center gap-1.5">
                <button
                  onClick={openReadjustModal}
                  disabled={fixedIncomes.length === 0}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={`Aplicar novos valores a partir de ${MONTHS[selectedMonth]}`}
                >
                  <ArrowUp size={13} strokeWidth={2.5} />
                  <DollarSign size={13} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Reajustar</span>
                </button>
                <button
                  onClick={() => setShowCategoryManager(true)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                  title="Gerenciar categorias"
                >
                  <Settings2 size={14} />
                  <span className="hidden sm:inline">Categorias</span>
                </button>
              </div>
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
                        <div className="p-2.5 md:p-4 flex justify-between items-center gap-1.5 md:gap-4 bg-white dark:bg-slate-800">
                          <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                            <DragHandle {...dragHandleProps} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
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
                          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                            <EditableValue
                              value={currentValue}
                              onSave={(val) => updateOverride(item, val)}
                              className={`w-16 md:w-24 bg-transparent text-right text-xs md:text-base font-mono font-bold outline-none ${
                                isOverridden ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            />
                            {isOverridden ? (
                              <button
                                onClick={() => resetOverride(item)}
                                title="Restaurar valor original"
                                className="flex-shrink-0 w-4 md:w-[18px]"
                              >
                                <RotateCcw
                                  size={12}
                                  className="md:w-4 md:h-4 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                                />
                              </button>
                            ) : (
                              <span className="w-4 md:w-[18px]" />
                            )}
                            <button onClick={() => handleDelete(item, 'fixed')} className="flex-shrink-0">
                              <Trash2
                                size={14}
                                className="md:w-[18px] md:h-[18px] text-slate-300 hover:text-red-500"
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
                        <div className="p-2.5 md:p-4 flex justify-between items-center gap-1.5 md:gap-4 bg-white dark:bg-slate-800">
                          <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                            <DragHandle {...dragHandleProps} />
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleExtraordinary(item); }}
                              className={`flex-shrink-0 px-1.5 py-0.5 rounded-md transition-colors ${
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
                          <div className="flex gap-2 md:gap-4 items-center flex-shrink-0">
                            <EditableValue
                              value={item.value}
                              onSave={(val) => updateVariableValue(item, val)}
                              className="w-16 md:w-24 bg-transparent text-right text-xs md:text-base font-mono font-bold outline-none text-blue-600 dark:text-blue-400"
                            />
                            <button onClick={() => handleDelete(item, 'variable')} className="flex-shrink-0">
                              <Trash2
                                size={14}
                                className="md:w-[18px] md:h-[18px] text-slate-300 hover:text-red-500"
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

      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Tratar receita</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[220px]">{deleteModal.item.name}</p>
              </div>
              <button onClick={() => setDeleteModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={18} />
              </button>
            </div>

            {deleteModal.type === 'fixed' ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Como deseja tratar esta receita?</p>
                <button
                  onClick={() => confirmDelete('this')}
                  className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">Só em {MONTHS[selectedMonth]}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Zera o valor neste mês. Meses anteriores e posteriores não mudam.</div>
                </button>
                <button
                  onClick={() => confirmDelete('future')}
                  className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                >
                  <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">Zerar de {MONTHS[selectedMonth]} em diante</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Zera do mês atual até dezembro. Meses anteriores mantidos.</div>
                </button>
                <button
                  onClick={() => confirmDelete('all')}
                  className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <div className="font-medium text-red-600 dark:text-red-400 text-sm">Todos os meses</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Remove o registro permanentemente de todos os meses.</div>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">Esta receita extra aparece apenas em <strong>{MONTHS[selectedMonth]}</strong>. Confirma remover este lançamento?</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setDeleteModal(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={() => confirmDelete('all')} className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {readjustModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start p-5 border-b dark:border-slate-700">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200">Reajustar receitas</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Novos valores valem de <strong>{MONTHS[selectedMonth]}</strong> em diante. Meses anteriores ficam com o valor base.
                </p>
              </div>
              <button onClick={() => setReadjustModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0 ml-2">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-2 flex-1">
              {fixedIncomes.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">Nenhuma receita fixa.</p>
              ) : (
                fixedIncomes.map((income) => (
                  <div key={income.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{income.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">Base: {formatCurrency(income.value)}</div>
                    </div>
                    <input
                      type="number"
                      value={readjustValues[income.id] ?? ''}
                      onChange={(e) => setReadjustValues({ ...readjustValues, [income.id]: e.target.value })}
                      className="w-28 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-right font-mono text-sm text-slate-800 dark:text-slate-200"
                      placeholder="Novo valor"
                    />
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 justify-end p-5 border-t dark:border-slate-700">
              <button
                onClick={() => setReadjustModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={applyReadjustment}
                disabled={fixedIncomes.length === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Aplicar a partir de {MONTHS[selectedMonth]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeView;
