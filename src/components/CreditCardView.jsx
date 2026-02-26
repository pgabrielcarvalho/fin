import React, { useState, useMemo } from 'react';
import { Plus, Trash2, RotateCcw, Settings2, AlertTriangle, PartyPopper, Layers, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import MonthTabs from './MonthTabs';

import MonthlyNotes from './MonthlyNotes';
import CategoryPicker from './CategoryPicker';
import CategoryManager from './CategoryManager';
import { SortableList, SortableItem, DragHandle } from './SortableList';
import EditableValue from './EditableValue';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { validateCardExpense, getActiveCardExpenses, getMiscellaneousCardExpenses, isCardExpenseActive } from '../services/calculations';
import { useReorder } from '../hooks/useReorder';
import { useDragReorder } from '../hooks/useDragReorder';

const CreditCardView = ({
  selectedMonth,
  onMonthChange,
  creditCardExpenses,
  invoiceTotals,
  onSave,
  onBatchSave,
  onDelete,
  onSaveInvoiceTotal,
  notes,
  onSaveNotes,
  categories = [],
  onSaveCategories,
  selectedYear
}) => {
  const toast = useToast();
  const [newCardExpense, setNewCardExpense] = useState({
    name: '',
    value: '',
    type: 'fixed', // 'fixed', 'installment' ou 'eventual'
    installments: 2,
    startMonth: selectedMonth,
    month: selectedMonth,
    categoryId: '',
    extraordinary: false
  });
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Usar hook de reordenação para todos os itens cadastrados
  const { sortedItems: sortedCreditExpenses } = useReorder(
    creditCardExpenses,
    (updatedItem) => onSave('credit_expenses', updatedItem)
  );

  const currentYear = selectedYear || new Date().getFullYear();

  const activeItems = useMemo(
    () => getActiveCardExpenses(sortedCreditExpenses, selectedMonth, currentYear),
    [sortedCreditExpenses, selectedMonth, currentYear]
  );

  const { handleDragReorder } = useDragReorder('credit_expenses', activeItems, onBatchSave, sortedCreditExpenses);

  const plannedCardTotal = useMemo(
    () => activeItems.reduce((acc, item) => {
      const monthValue = item.overrides?.[selectedMonth] !== undefined
        ? item.overrides[selectedMonth]
        : item.value;
      return acc + monthValue;
    }, 0),
    [activeItems, selectedMonth]
  );

  // Parcelas que terminam neste mês
  const endingInstallments = useMemo(() => {
    return sortedCreditExpenses.filter(item =>
      item.type === 'installment' &&
      item.lastMonth === selectedMonth &&
      (item.lastYear || currentYear) === currentYear
    );
  }, [sortedCreditExpenses, selectedMonth, currentYear]);

  // Parcelas que terminam no mês seguinte (aviso antecipado)
  const endingNextMonth = useMemo(() => {
    const nextMonth = (selectedMonth + 1) % 12;
    const nextYear = selectedMonth === 11 ? currentYear + 1 : currentYear;
    return sortedCreditExpenses.filter(item =>
      item.type === 'installment' &&
      item.lastMonth === nextMonth &&
      (item.lastYear || currentYear) === nextYear
    );
  }, [sortedCreditExpenses, selectedMonth, currentYear]);

  const manualInvoiceTotal = invoiceTotals?.[selectedMonth] || 0;
  const finalCardTotal = manualInvoiceTotal > 0 ? manualInvoiceTotal : plannedCardTotal;
  const miscellaneousExpenses = getMiscellaneousCardExpenses(plannedCardTotal, manualInvoiceTotal);

  // Agrupar despesas por categoria
  const groupedItems = useMemo(() => {
    if (!groupByCategory) return null;

    const groups = {};
    const uncategorized = [];

    activeItems.forEach(item => {
      const value = item.overrides?.[selectedMonth] !== undefined
        ? item.overrides[selectedMonth]
        : item.value;
      if (item.categoryId) {
        if (!groups[item.categoryId]) {
          const cat = categories.find(c => c.id === item.categoryId);
          groups[item.categoryId] = {
            category: cat || { id: item.categoryId, name: 'Desconhecida', color: '#94a3b8' },
            items: [],
            total: 0
          };
        }
        groups[item.categoryId].items.push(item);
        groups[item.categoryId].total += value;
      } else {
        uncategorized.push(item);
      }
    });

    const sorted = Object.values(groups).sort((a, b) => (a.category.order || 99) - (b.category.order || 99));

    if (uncategorized.length > 0) {
      const uncatTotal = uncategorized.reduce((sum, item) => {
        const val = item.overrides?.[selectedMonth] !== undefined ? item.overrides[selectedMonth] : item.value;
        return sum + val;
      }, 0);
      sorted.push({
        category: { id: '_uncategorized', name: 'Sem Categoria', color: '#94a3b8' },
        items: uncategorized,
        total: uncatTotal
      });
    }

    return sorted;
  }, [activeItems, groupByCategory, categories, selectedMonth]);

  const handleAdd = async () => {
    let lastMonth = null;
    let lastYear = null;
    if (newCardExpense.type === 'installment') {
      const startMonth = parseInt(newCardExpense.startMonth);
      const installments = parseInt(newCardExpense.installments);
      const totalMonths = startMonth + installments - 1;
      lastMonth = totalMonths % 12;
      lastYear = currentYear + Math.floor(totalMonths / 12);
    }

    const expenseData = {
      name: newCardExpense.name,
      value: parseFloat(newCardExpense.value),
      type: newCardExpense.type,
      installments: newCardExpense.type === 'installment' ? parseInt(newCardExpense.installments) : null,
      lastMonth: lastMonth,
      lastYear: lastYear,
      month: newCardExpense.type === 'eventual' ? parseInt(newCardExpense.month) : null
    };

    if (newCardExpense.categoryId) {
      expenseData.categoryId = newCardExpense.categoryId;
    }

    if (newCardExpense.extraordinary) {
      expenseData.extraordinary = true;
    }

    const validation = validateCardExpense(expenseData);

    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const maxOrder = creditCardExpenses.reduce(
      (max, exp) => Math.max(max, exp.order !== undefined ? exp.order : 0),
      0
    );

    const result = await onSave('credit_expenses', {
      ...expenseData,
      overrides: {},
      order: maxOrder + 1
    });

    if (result.success) {
      toast.success('Despesa adicionada!');
      setNewCardExpense({
        name: '',
        value: '',
        type: 'fixed',
        installments: 2,
        startMonth: selectedMonth,
        month: selectedMonth,
        categoryId: '',
        extraordinary: false
      });
    }
  };

  const updateOverride = async (expense, newValue) => {
    const newOverrides = { ...expense.overrides };

    if (newValue === expense.value) {
      delete newOverrides[selectedMonth];
    } else {
      newOverrides[selectedMonth] = newValue;
    }

    await onSave('credit_expenses', { ...expense, overrides: newOverrides });
  };

  const resetOverride = async (expense) => {
    const newOverrides = { ...expense.overrides };
    delete newOverrides[selectedMonth];
    await onSave('credit_expenses', { ...expense, overrides: newOverrides });
    toast.info('Valor restaurado');
  };

  const handleInvoiceChange = (value) => {
    const newTotals = [...(invoiceTotals || Array(12).fill(0))];
    newTotals[selectedMonth] = value;
    onSaveInvoiceTotal(newTotals);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir esta compra?')) {
      await onDelete('credit_expenses', id);
      toast.success('Compra excluída');
    }
  };

  const handleCategoryChange = async (item, categoryId) => {
    const updated = { ...item };
    if (categoryId) {
      updated.categoryId = categoryId;
    } else {
      delete updated.categoryId;
    }
    // Limpar campo legado se existir
    delete updated.category;
    await onSave('credit_expenses', updated);
  };

  const toggleExtraordinary = async (item) => {
    await onSave('credit_expenses', { ...item, extraordinary: !item.extraordinary });
  };

  // Helper: resolve nome da categoria (suporta categoryId novo e category legado)
  const getCategoryName = (item) => {
    if (item.categoryId) {
      const cat = categories.find(c => c.id === item.categoryId);
      return cat ? cat.name : null;
    }
    return item.category || null;
  };

  // Helper: calcula parcela atual de uma despesa parcelada
  const getCurrentParcel = (item) => {
    if (item.type !== 'installment') return null;
    const lastYear = item.lastYear || currentYear;
    const lastMonth = item.lastMonth;
    // Meses restantes = distância do mês atual até o último mês
    const monthsRemaining = (lastYear - currentYear) * 12 + (lastMonth - selectedMonth);
    return item.installments - monthsRemaining;
  };

  const handleCopyFromMonth = async (sourceMonth) => {
    const batchItems = [];

    // 1. Copiar valores efetivos de despesas fixas do cartão
    const fixedExpenses = creditCardExpenses.filter(exp => !exp.type || exp.type === 'fixed');

    for (const expense of fixedExpenses) {
      const sourceValue = expense.overrides?.[sourceMonth] !== undefined
        ? expense.overrides[sourceMonth]
        : expense.value;

      const newOverrides = { ...expense.overrides, [selectedMonth]: sourceValue };
      batchItems.push({ collectionName: 'credit_expenses', item: { ...expense, overrides: newOverrides } });
    }

    // 2. Copiar despesas eventuais do mês de origem
    const sourceEventualExpenses = creditCardExpenses.filter(
      exp => exp.type === 'eventual' && exp.month === sourceMonth
    );

    let maxOrder = creditCardExpenses.reduce(
      (max, exp) => Math.max(max, exp.order !== undefined ? exp.order : 0),
      0
    );

    for (const expense of sourceEventualExpenses) {
      maxOrder++;
      batchItems.push({
        collectionName: 'credit_expenses',
        item: {
          name: expense.name,
          value: expense.value,
          type: 'eventual',
          month: selectedMonth,
          overrides: {},
          order: maxOrder
        }
      });
    }

    if (batchItems.length > 0) {
      await onBatchSave(batchItems);
    }

    let copiedCount = batchItems.length;

    // 3. Copiar o valor manual da fatura (se houver) - documento separado, não vai no batch
    const sourceInvoiceTotal = invoiceTotals?.[sourceMonth];
    if (sourceInvoiceTotal && sourceInvoiceTotal > 0) {
      const newTotals = [...(invoiceTotals || Array(12).fill(0))];
      newTotals[selectedMonth] = sourceInvoiceTotal;
      await onSaveInvoiceTotal(newTotals);
      copiedCount++;
    }

    toast.success(`${copiedCount} ${copiedCount === 1 ? 'item copiado' : 'itens copiados'} de ${MONTHS[sourceMonth]}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Cartão de Crédito</h2>
        </div>
        <MonthTabs selectedMonth={selectedMonth} onChange={onMonthChange} />
      </div>

      {/* Toggle Resumo */}
      <button
        onClick={() => setShowSummary(!showSummary)}
        className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      >
        {showSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Resumo
      </button>

      {showSummary && <>
      {/* Card de Fatura */}
      <div className="bg-indigo-600 dark:bg-indigo-700 p-6 rounded-xl shadow-lg text-white">
        <h3 className="font-bold mb-4">Fechamento da Fatura ({MONTHS[selectedMonth]})</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-indigo-200 block mb-2">Valor Real (App do Banco)</label>
            <div className="flex items-center bg-indigo-700 p-3 rounded border border-indigo-500">
              <span className="mr-2 text-lg">R$</span>
              <EditableValue
                value={manualInvoiceTotal}
                onSave={(val) => handleInvoiceChange(val)}
                placeholder={plannedCardTotal.toFixed(2)}
                emptyAsZero
                className="bg-transparent text-white font-bold text-2xl w-full outline-none placeholder-indigo-300"
              />
            </div>
          </div>
          <div className="bg-white/10 p-3 rounded">
            <div className="text-xs text-indigo-200 mb-1">Previsto (Fixas + Parceladas)</div>
            <div className="font-bold text-2xl">{formatCurrency(plannedCardTotal)}</div>
          </div>
          <div className="bg-white text-indigo-900 p-3 rounded">
            <div className="text-xs font-bold mb-1">Avulsos (Calc)</div>
            <div className="font-bold text-2xl">{formatCurrency(miscellaneousExpenses)}</div>
          </div>
        </div>
      </div>

      {/* Alertas de Parcelas Finalizando */}
      {endingInstallments.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <PartyPopper size={18} className="text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
              {endingInstallments.length === 1 ? 'Parcela finalizando' : 'Parcelas finalizando'} neste mês!
            </span>
          </div>
          <div className="space-y-1">
            {endingInstallments.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-emerald-700 dark:text-emerald-300">
                  {item.name} ({item.installments}x) — última parcela
                </span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              Valor liberado a partir do próximo mês: {formatCurrency(endingInstallments.reduce((sum, i) => sum + i.value, 0))}
            </div>
          </div>
        </div>
      )}

      {endingNextMonth.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
            <span className="font-bold text-amber-800 dark:text-amber-300 text-sm">
              {endingNextMonth.length === 1 ? 'Parcela finalizando' : 'Parcelas finalizando'} no próximo mês
            </span>
          </div>
          <div className="space-y-1">
            {endingNextMonth.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-amber-700 dark:text-amber-300">
                  {item.name} ({item.installments}x) — penúltima parcela
                </span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      </>}

      {/* Adicionar Despesa */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Plus size={16} className="text-indigo-500 dark:text-indigo-400" /> Adicionar Despesa do Cartão
        </h3>

        {/* Toggle de Tipo */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setNewCardExpense({ ...newCardExpense, type: 'fixed' })}
            className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-colors ${
              newCardExpense.type === 'fixed'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Fixa
          </button>
          <button
            type="button"
            onClick={() => setNewCardExpense({ ...newCardExpense, type: 'installment' })}
            className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-colors ${
              newCardExpense.type === 'installment'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Parcelada
          </button>
          <button
            type="button"
            onClick={() => setNewCardExpense({ ...newCardExpense, type: 'eventual' })}
            className={`flex-1 px-3 py-2 rounded font-medium text-sm transition-colors ${
              newCardExpense.type === 'eventual'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Eventual
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200"
              placeholder="Descrição (Ex: Netflix, Compra do Notebook)"
              value={newCardExpense.name}
              onChange={e => setNewCardExpense({ ...newCardExpense, name: e.target.value })}
            />
            <input
              className="w-full sm:w-32 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200"
              type="number"
              placeholder="Valor (R$)"
              value={newCardExpense.value}
              onChange={e => setNewCardExpense({ ...newCardExpense, value: e.target.value })}
            />

            {/* Campos condicionais para Parcelada */}
            {newCardExpense.type === 'installment' && (
              <>
                <select
                  className="w-full sm:w-24 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200 text-sm"
                  value={newCardExpense.installments}
                  onChange={e => setNewCardExpense({ ...newCardExpense, installments: e.target.value })}
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24].map(num => (
                    <option key={num} value={num}>{num}x</option>
                  ))}
                </select>
                <select
                  className="w-full sm:w-36 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200 text-sm"
                  value={newCardExpense.startMonth}
                  onChange={e => setNewCardExpense({ ...newCardExpense, startMonth: parseInt(e.target.value) })}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>Início: {m}/{String(currentYear).slice(-2)}</option>
                  ))}
                </select>
              </>
            )}

            {/* Campo condicional para Eventual */}
            {newCardExpense.type === 'eventual' && (
              <select
                className="w-full sm:w-36 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200 text-sm"
                value={newCardExpense.month}
                onChange={e => setNewCardExpense({ ...newCardExpense, month: parseInt(e.target.value) })}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            )}

            {/* Categoria */}
            <select
              className="w-full sm:w-36 p-2 rounded bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200 text-sm"
              value={newCardExpense.categoryId}
              onChange={e => setNewCardExpense({ ...newCardExpense, categoryId: e.target.value })}
            >
              <option value="">Categoria</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <button
              onClick={handleAdd}
              className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              Adicionar
            </button>
          </div>

          {/* Checkbox extraordinária + Dica */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newCardExpense.extraordinary}
                onChange={e => setNewCardExpense({ ...newCardExpense, extraordinary: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">Despesa extraordinária</span>
            </label>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {newCardExpense.type === 'fixed'
                ? "Fixas aparecem todos os meses"
                : newCardExpense.type === 'installment'
                ? (() => {
                    const sm = parseInt(newCardExpense.startMonth);
                    const inst = parseInt(newCardExpense.installments);
                    const total = sm + inst - 1;
                    const lm = total % 12;
                    const ly = currentYear + Math.floor(total / 12);
                    return `Última parcela: ${MONTHS[lm]}/${String(ly).slice(-2)}`;
                  })()
                : "Eventuais aparecem apenas no mês selecionado"}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Despesas */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
          <span>Despesas Cadastradas</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              {activeItems.length} ativas de {sortedCreditExpenses.length} {sortedCreditExpenses.length === 1 ? 'item' : 'itens'}
            </span>
            <button
              onClick={() => setGroupByCategory(!groupByCategory)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                groupByCategory
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-500'
              }`}
              title="Agrupar por categoria"
            >
              <Layers size={14} />
              <span className="hidden sm:inline">Agrupar</span>
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
          {sortedCreditExpenses.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Nenhuma despesa cadastrada
            </div>
          ) : groupByCategory && groupedItems ? (
            groupedItems.map(group => (
              <div key={group.category.id}>
                <div
                  className="px-3 md:px-4 py-2 flex justify-between items-center"
                  style={{ backgroundColor: group.category.color + '15', borderLeft: `3px solid ${group.category.color}` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: group.category.color }}
                    />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {group.category.name}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      ({group.items.length})
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold text-slate-600 dark:text-slate-400">
                    {formatCurrency(group.total)}
                  </span>
                </div>
                <div className="divide-y dark:divide-slate-700">
                  {group.items.map((item) => {
                    const isFixed = !item.type || item.type === 'fixed';
                    const isInstallment = item.type === 'installment';
                    const isEditable = isFixed || isInstallment;
                    const isOverridden = isEditable && item.overrides && item.overrides[selectedMonth] !== undefined;
                    const currentValue = isOverridden ? item.overrides[selectedMonth] : item.value;
                    const parcel = isInstallment ? getCurrentParcel(item) : null;

                    return (
                      <div key={item.id} className="p-3 md:p-4 flex justify-between items-center bg-white dark:bg-slate-800">
                        <div className="flex items-center gap-2 md:gap-3 flex-1">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                            <div className="text-[10px] md:text-xs mt-0.5 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                              {isFixed && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Fixa</span>}
                              {isInstallment && (
                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                  {parcel}/{item.installments}x &middot; Total {formatCurrency(item.value * item.installments)}
                                </span>
                              )}
                              {item.type === 'eventual' && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  Eventual &middot; {MONTHS[item.month]}
                                </span>
                              )}
                              <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                              <CategoryPicker
                                categoryId={item.categoryId}
                                categories={categories}
                                onChange={(catId) => handleCategoryChange(item, catId)}
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleExtraordinary(item); }}
                                className={`transition-colors ${
                                  item.extraordinary
                                    ? 'text-purple-500 dark:text-purple-400'
                                    : 'text-slate-300 dark:text-slate-600 hover:text-purple-400 dark:hover:text-purple-500'
                                }`}
                                title={item.extraordinary ? 'Remover marcação extraordinária' : 'Marcar como extraordinária'}
                              >
                                <Sparkles size={11} />
                              </button>
                            </div>
                          </div>

                          {isEditable ? (
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center gap-2 p-1 rounded border ${
                                isOverridden ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700' : 'border-transparent'
                              }`}>
                                <span className="text-xs text-slate-400 dark:text-slate-500">{MONTHS[selectedMonth]}:</span>
                                <EditableValue
                                  value={currentValue}
                                  onSave={(val) => updateOverride(item, val)}
                                  className={`w-24 bg-transparent text-right font-mono font-bold outline-none ${
                                    isOverridden ? 'text-yellow-700 dark:text-yellow-400' : 'text-indigo-700 dark:text-indigo-400'
                                  }`}
                                />
                              </div>
                              {isOverridden && (
                                <button onClick={() => resetOverride(item)} title="Restaurar valor original">
                                  <RotateCcw size={16} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="text-right">
                              <div className="font-mono font-bold text-indigo-700 dark:text-indigo-400 text-lg">
                                {formatCurrency(item.value)}
                              </div>
                            </div>
                          )}

                          <button onClick={() => handleDelete(item.id)}>
                            <Trash2 size={18} className="text-slate-300 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <SortableList items={activeItems} onReorder={handleDragReorder}>
              {activeItems.map((item) => {
                const isFixed = !item.type || item.type === 'fixed';
                const isInstallment = item.type === 'installment';
                const isEditable = isFixed || isInstallment;
                const isOverridden = isEditable && item.overrides && item.overrides[selectedMonth] !== undefined;
                const currentValue = isOverridden
                  ? item.overrides[selectedMonth]
                  : item.value;
                const category = categories.find(c => c.id === item.categoryId);
                const parcel = isInstallment ? getCurrentParcel(item) : null;

                return (
                  <SortableItem key={item.id} id={item.id}>
                    {({ dragHandleProps }) => (
                      <div
                        className="p-3 md:p-4 flex justify-between items-center bg-white dark:bg-slate-800"
                        style={category ? { borderLeft: `3px solid ${category.color}` } : undefined}
                      >
                        <div className="flex items-center gap-2 md:gap-3 flex-1">
                          <DragHandle {...dragHandleProps} />

                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                            <div className="text-[10px] md:text-xs mt-0.5 flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                              {isFixed && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Fixa</span>}
                              {isInstallment && (
                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                  {parcel}/{item.installments}x &middot; Total {formatCurrency(item.value * item.installments)}
                                </span>
                              )}
                              {item.type === 'eventual' && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  Eventual &middot; {MONTHS[item.month]}
                                </span>
                              )}
                              <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                              <CategoryPicker
                                categoryId={item.categoryId}
                                categories={categories}
                                onChange={(catId) => handleCategoryChange(item, catId)}
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleExtraordinary(item); }}
                                className={`transition-colors ${
                                  item.extraordinary
                                    ? 'text-purple-500 dark:text-purple-400'
                                    : 'text-slate-300 dark:text-slate-600 hover:text-purple-400 dark:hover:text-purple-500'
                                }`}
                                title={item.extraordinary ? 'Remover marcação extraordinária' : 'Marcar como extraordinária'}
                              >
                                <Sparkles size={11} />
                              </button>
                            </div>
                          </div>

                          {isEditable ? (
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex items-center gap-2 p-1 rounded border ${
                                  isOverridden
                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                                    : 'border-transparent'
                                }`}
                              >
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {MONTHS[selectedMonth]}:
                                </span>
                                <EditableValue
                                  value={currentValue}
                                  onSave={(val) => updateOverride(item, val)}
                                  className={`w-24 bg-transparent text-right font-mono font-bold outline-none ${
                                    isOverridden ? 'text-yellow-700 dark:text-yellow-400' : 'text-indigo-700 dark:text-indigo-400'
                                  }`}
                                />
                              </div>
                              {isOverridden && (
                                <button onClick={() => resetOverride(item)} title="Restaurar valor original">
                                  <RotateCcw size={16} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="text-right">
                              <div className="font-mono font-bold text-indigo-700 dark:text-indigo-400 text-lg">
                                {formatCurrency(item.value)}
                              </div>
                            </div>
                          )}

                          <button onClick={() => handleDelete(item.id)}>
                            <Trash2 size={18} className="text-slate-300 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    )}
                  </SortableItem>
                );
              })}
            </SortableList>
          )}
        </div>
      </div>

      {/* Anotações do Mês */}
      <MonthlyNotes
        selectedMonth={selectedMonth}
        notes={notes}
        onSave={onSaveNotes}
      />

      {/* Modal de Gerenciamento de Categorias */}
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

export default CreditCardView;
