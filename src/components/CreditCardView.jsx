import React, { useState, useMemo } from 'react';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import MonthTabs from './MonthTabs';
import CopyFromMonthDropdown from './CopyFromMonthDropdown';
import MonthlyNotes from './MonthlyNotes';
import ReorderButtons from './ReorderButtons';
import { CategoryBreakdownChart } from './Charts';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { validateCardExpense, getActiveCardExpenses, getMiscellaneousCardExpenses, isCardExpenseActive } from '../services/calculations';
import { useReorder } from '../hooks/useReorder';

const CreditCardView = ({
  selectedMonth,
  onMonthChange,
  creditCardExpenses,
  invoiceTotals,
  onSave,
  onDelete,
  onSaveInvoiceTotal,
  notes,
  onSaveNotes
}) => {
  const toast = useToast();
  const [newCardExpense, setNewCardExpense] = useState({
    name: '',
    value: '',
    type: 'fixed', // 'fixed', 'installment' ou 'eventual'
    installments: 2,
    lastMonth: selectedMonth,
    month: selectedMonth,
    category: 'Geral'
  });

  const categories = [
    'Geral',
    'Alimentação',
    'Transporte',
    'Saúde',
    'Educação',
    'Lazer',
    'Compras',
    'Serviços',
    'Casa',
    'Pets'
  ];

  // Usar hook de reordenação para todos os itens cadastrados
  const { sortedItems: sortedCreditExpenses, moveItem } = useReorder(
    creditCardExpenses,
    (updatedItem) => onSave('credit_expenses', updatedItem)
  );

  const activeItems = useMemo(
    () => getActiveCardExpenses(sortedCreditExpenses, selectedMonth),
    [sortedCreditExpenses, selectedMonth]
  );

  const plannedCardTotal = useMemo(
    () => activeItems.reduce((acc, item) => {
      // Se for despesa fixa, verifica se há override para o mês selecionado
      if (!item.type || item.type === 'fixed') {
        const monthValue = item.overrides?.[selectedMonth] !== undefined
          ? item.overrides[selectedMonth]
          : item.value;
        return acc + monthValue;
      }
      // Parceladas e eventuais usam o valor direto
      return acc + item.value;
    }, 0),
    [activeItems, selectedMonth]
  );

  const manualInvoiceTotal = invoiceTotals?.[selectedMonth] || 0;
  const finalCardTotal = manualInvoiceTotal > 0 ? manualInvoiceTotal : plannedCardTotal;
  const miscellaneousExpenses = getMiscellaneousCardExpenses(plannedCardTotal, manualInvoiceTotal);

  const handleAdd = async () => {
    const currentYear = new Date().getFullYear();

    const expenseData = {
      name: newCardExpense.name,
      value: parseFloat(newCardExpense.value),
      type: newCardExpense.type,
      installments: newCardExpense.type === 'installment' ? parseInt(newCardExpense.installments) : null,
      lastMonth: newCardExpense.type === 'installment' ? parseInt(newCardExpense.lastMonth) : null,
      lastYear: newCardExpense.type === 'installment' ? currentYear : null,
      month: newCardExpense.type === 'eventual' ? parseInt(newCardExpense.month) : null,
      category: newCardExpense.category
    };

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
        lastMonth: selectedMonth,
        month: selectedMonth,
        category: 'Geral'
      });
    }
  };

  const updateOverride = async (expense, newValueStr) => {
    const newValue = parseFloat(newValueStr);
    const newOverrides = { ...expense.overrides };

    if (isNaN(newValue) || newValue === expense.value) {
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

  const handleMove = async (item, direction) => {
    const result = await moveItem(item, direction);
    if (result.success) {
      toast.success('Ordem atualizada!');
    } else if (result.error) {
      toast.error('Erro ao reordenar');
    }
  };

  const handleInvoiceChange = (value) => {
    const newTotals = [...(invoiceTotals || Array(12).fill(0))];
    newTotals[selectedMonth] = parseFloat(value) || 0;
    onSaveInvoiceTotal(newTotals);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Excluir esta compra?')) {
      await onDelete('credit_expenses', id);
      toast.success('Compra excluída');
    }
  };

  const handleCopyFromMonth = async (sourceMonth) => {
    let copiedCount = 0;

    // 1. Copiar valores efetivos de despesas fixas do cartão
    const fixedExpenses = creditCardExpenses.filter(exp => !exp.type || exp.type === 'fixed');

    for (const expense of fixedExpenses) {
      // Pegar o valor efetivo do mês de origem (override ou valor base)
      const sourceValue = expense.overrides?.[sourceMonth] !== undefined
        ? expense.overrides[sourceMonth]
        : expense.value;

      // Criar override para o mês de destino com o valor efetivo do mês de origem
      const newOverrides = { ...expense.overrides, [selectedMonth]: sourceValue };
      await onSave('credit_expenses', { ...expense, overrides: newOverrides });
      copiedCount++;
    }

    // 2. Copiar despesas eventuais do mês de origem
    const sourceEventualExpenses = creditCardExpenses.filter(
      exp => exp.type === 'eventual' && exp.month === sourceMonth
    );

    for (const expense of sourceEventualExpenses) {
      const maxOrder = creditCardExpenses.reduce(
        (max, exp) => Math.max(max, exp.order !== undefined ? exp.order : 0),
        0
      );

      await onSave('credit_expenses', {
        name: expense.name,
        value: expense.value,
        type: 'eventual',
        month: selectedMonth,
        overrides: {},
        order: maxOrder + 1
      });
      copiedCount++;
    }

    // 3. Copiar o valor manual da fatura (se houver)
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
          <CopyFromMonthDropdown
            selectedMonth={selectedMonth}
            onCopy={handleCopyFromMonth}
          />
        </div>
        <MonthTabs selectedMonth={selectedMonth} onChange={onMonthChange} />
      </div>

      {/* Card de Fatura */}
      <div className="bg-indigo-600 dark:bg-indigo-700 p-6 rounded-xl shadow-lg text-white">
        <h3 className="font-bold mb-4">Fechamento da Fatura ({MONTHS[selectedMonth]})</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-indigo-200 block mb-2">Valor Real (App do Banco)</label>
            <div className="flex items-center bg-indigo-700 p-3 rounded border border-indigo-500">
              <span className="mr-2 text-lg">R$</span>
              <input
                type="number"
                value={manualInvoiceTotal || ''}
                onChange={e => handleInvoiceChange(e.target.value)}
                placeholder={plannedCardTotal.toFixed(2)}
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

      {/* Adicionar Despesa */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex gap-2">
          <Plus size={20} className="text-indigo-500 dark:text-indigo-400" /> Adicionar Despesa do Cartão
        </h3>

        {/* Linha 1: Nome e Valor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input
            className="p-2 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200"
            placeholder="Descrição (Ex: Netflix, Compra do Notebook)"
            value={newCardExpense.name}
            onChange={e => setNewCardExpense({ ...newCardExpense, name: e.target.value })}
          />
          <input
            className="p-2 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200"
            type="number"
            placeholder="Valor da parcela (R$)"
            value={newCardExpense.value}
            onChange={e => setNewCardExpense({ ...newCardExpense, value: e.target.value })}
          />
        </div>

        {/* Linha 2: Categoria */}
        <div className="mb-4">
          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-2">Categoria</label>
          <select
            className="w-full p-2 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200"
            value={newCardExpense.category}
            onChange={e => setNewCardExpense({ ...newCardExpense, category: e.target.value })}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Linha 3: Tipo (Botões Toggle) */}
        <div className="mb-4">
          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-2">Tipo de Despesa</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setNewCardExpense({ ...newCardExpense, type: 'fixed' })}
              className={`py-2 px-4 rounded font-medium transition-colors ${
                newCardExpense.type === 'fixed'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300'
              }`}
            >
              Fixa
            </button>
            <button
              type="button"
              onClick={() => setNewCardExpense({ ...newCardExpense, type: 'installment' })}
              className={`py-2 px-4 rounded font-medium transition-colors ${
                newCardExpense.type === 'installment'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300'
              }`}
            >
              Parcelada
            </button>
            <button
              type="button"
              onClick={() => setNewCardExpense({ ...newCardExpense, type: 'eventual' })}
              className={`py-2 px-4 rounded font-medium transition-colors ${
                newCardExpense.type === 'eventual'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300'
              }`}
            >
              Eventual
            </button>
          </div>
        </div>

        {/* Linha 3: Campos condicionais para Parcelada */}
        {newCardExpense.type === 'installment' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Número de Parcelas</label>
              <select
                className="w-full p-2 rounded bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newCardExpense.installments}
                onChange={e => setNewCardExpense({ ...newCardExpense, installments: e.target.value })}
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24].map(num => (
                  <option key={num} value={num}>{num}x</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Última Parcela em</label>
              <select
                className="w-full p-2 rounded bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newCardExpense.lastMonth}
                onChange={e => setNewCardExpense({ ...newCardExpense, lastMonth: parseInt(e.target.value) })}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>{m}/26</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Linha 3: Campo condicional para Eventual */}
        {newCardExpense.type === 'eventual' && (
          <div className="mb-4">
            <label className="text-xs text-slate-500 block mb-1">Mês da Despesa</label>
            <select
              className="w-full p-2 rounded bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={newCardExpense.month}
              onChange={e => setNewCardExpense({ ...newCardExpense, month: parseInt(e.target.value) })}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}/26</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleAdd}
          className="w-full bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Adicionar
        </button>
      </div>

      {/* Lista de Despesas */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 flex justify-between">
          <span>Despesas Cadastradas</span>
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
            {activeItems.length} ativas de {sortedCreditExpenses.length} {sortedCreditExpenses.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
        <div className="divide-y">
          {sortedCreditExpenses.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Nenhuma despesa cadastrada
            </div>
          ) : (
            sortedCreditExpenses.map((item, index) => {
              const isActive = isCardExpenseActive(item, selectedMonth);
              const isFixed = !item.type || item.type === 'fixed';
              const isOverridden = isFixed && item.overrides && item.overrides[selectedMonth] !== undefined;
              const currentValue = isOverridden
                ? item.overrides[selectedMonth]
                : item.value;

              // Não renderizar despesas inativas (parceladas/eventuais passadas)
              if (!isActive) {
                return null;
              }

              return (
                <div
                  key={item.id}
                  className="p-4 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Botões de reordenação */}
                    <ReorderButtons
                      index={index}
                      totalItems={sortedCreditExpenses.length}
                      onMoveUp={() => handleMove(item, 'up')}
                      onMoveDown={() => handleMove(item, 'down')}
                    />

                    {/* Nome e Info */}
                    <div className="flex-1">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.name}</div>
                      <div className="text-xs mt-1 flex flex-wrap gap-1">
                        {item.category && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                            {item.category}
                          </span>
                        )}
                        {isFixed && (
                          <>
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">
                              Fixa
                            </span>
                            {isFixed && (
                              <span className="ml-2 text-slate-400">
                                Base: {formatCurrency(item.value)}
                              </span>
                            )}
                          </>
                        )}
                        {item.type === 'installment' && (
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                            {item.installments}x (última: {MONTHS[item.lastMonth]}/26)
                          </span>
                        )}
                        {item.type === 'eventual' && (
                          <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                            Eventual ({MONTHS[item.month]}/26)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Valor - editável para despesas fixas */}
                    {isFixed ? (
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
                              isOverridden ? 'text-yellow-700' : 'text-indigo-700'
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
                              className="text-slate-400 hover:text-indigo-600"
                            />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-right">
                        <div className="font-mono font-bold text-indigo-700 text-lg">
                          {formatCurrency(item.value)}
                        </div>
                      </div>
                    )}

                    {/* Botão de excluir */}
                    <button onClick={() => handleDelete(item.id)}>
                      <Trash2 size={18} className="text-slate-300 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Gráfico de Categorias */}
      <CategoryBreakdownChart
        creditCardExpenses={creditCardExpenses}
        selectedMonth={selectedMonth}
      />

      {/* Anotações do Mês */}
      <MonthlyNotes
        selectedMonth={selectedMonth}
        notes={notes}
        onSave={onSaveNotes}
      />
    </div>
  );
};

export default CreditCardView;
