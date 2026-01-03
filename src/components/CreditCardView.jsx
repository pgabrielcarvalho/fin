import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import MonthSelector from './MonthSelector';
import ReorderButtons from './ReorderButtons';
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
  onSaveInvoiceTotal
}) => {
  const toast = useToast();
  const [newCardExpense, setNewCardExpense] = useState({
    name: '',
    value: '',
    type: 'fixed', // 'fixed' ou 'installment'
    installments: 2,
    lastMonth: selectedMonth
  });

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
    () => activeItems.reduce((acc, item) => acc + item.value, 0),
    [activeItems]
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
      lastYear: newCardExpense.type === 'installment' ? currentYear : null
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
      order: maxOrder + 1
    });

    if (result.success) {
      toast.success('Despesa adicionada!');
      setNewCardExpense({
        name: '',
        value: '',
        type: 'fixed',
        installments: 2,
        lastMonth: selectedMonth
      });
    }
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Gestão de Cartão</h2>
        <MonthSelector selectedMonth={selectedMonth} onChange={onMonthChange} />
      </div>

      {/* Card de Fatura */}
      <div className="bg-indigo-600 p-6 rounded-xl shadow-lg text-white">
        <h3 className="font-bold mb-4">Fechamento da Fatura ({MONTHS[selectedMonth]})</h3>
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-indigo-200">Valor Real (App do Banco)</label>
            <div className="flex items-center bg-indigo-700 p-3 rounded border border-indigo-500">
              <span className="mr-2">R$</span>
              <input
                type="number"
                value={manualInvoiceTotal || ''}
                onChange={e => handleInvoiceChange(e.target.value)}
                placeholder={plannedCardTotal.toFixed(2)}
                className="bg-transparent text-white font-bold text-2xl w-full outline-none"
              />
            </div>
          </div>
          <div className="bg-white/10 p-3 rounded flex-1 min-w-[150px]">
            <div className="text-xs text-indigo-200">Previsto (Fixos)</div>
            <div className="font-bold text-lg">{formatCurrency(plannedCardTotal)}</div>
          </div>
          <div className="bg-white text-indigo-900 p-3 rounded flex-1 min-w-[150px]">
            <div className="text-xs font-bold">Avulsos (Calc)</div>
            <div className="font-bold text-lg">{formatCurrency(miscellaneousExpenses)}</div>
          </div>
        </div>
      </div>

      {/* Adicionar Despesa */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-700 mb-4 flex gap-2">
          <Plus size={20} className="text-indigo-500" /> Adicionar Despesa do Cartão
        </h3>

        {/* Linha 1: Nome e Valor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <input
            className="p-2 rounded bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Descrição (Ex: Netflix, Compra do Notebook)"
            value={newCardExpense.name}
            onChange={e => setNewCardExpense({ ...newCardExpense, name: e.target.value })}
          />
          <input
            className="p-2 rounded bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            type="number"
            placeholder="Valor da parcela (R$)"
            value={newCardExpense.value}
            onChange={e => setNewCardExpense({ ...newCardExpense, value: e.target.value })}
          />
        </div>

        {/* Linha 2: Tipo (Botões Toggle) */}
        <div className="mb-4">
          <label className="text-xs text-slate-500 block mb-2">Tipo de Despesa</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setNewCardExpense({ ...newCardExpense, type: 'fixed' })}
              className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                newCardExpense.type === 'fixed'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Fixa (todo mês)
            </button>
            <button
              type="button"
              onClick={() => setNewCardExpense({ ...newCardExpense, type: 'installment' })}
              className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
                newCardExpense.type === 'installment'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Parcelada
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

        <button
          onClick={handleAdd}
          className="w-full bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Adicionar
        </button>
      </div>

      {/* Lista de Despesas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b bg-slate-50 font-bold text-slate-700 flex justify-between">
          <span>Despesas Cadastradas</span>
          <span className="text-xs font-normal text-slate-500">
            {sortedCreditExpenses.length} {sortedCreditExpenses.length === 1 ? 'item' : 'itens'}
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

              return (
                <div
                  key={item.id}
                  className={`p-4 flex justify-between items-center ${
                    !isActive ? 'opacity-40' : ''
                  }`}
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
                      <div className="font-medium text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-500">
                        {item.type === 'fixed' && 'Fixa'}
                        {item.type === 'installment' &&
                          `${item.installments}x (última: ${MONTHS[item.lastMonth]}/26)`}
                      </div>
                    </div>

                    {/* Valor destacado */}
                    <div className="text-right">
                      <div className="font-mono font-bold text-indigo-700 text-lg">
                        {formatCurrency(item.value)}
                      </div>
                    </div>

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
    </div>
  );
};

export default CreditCardView;
