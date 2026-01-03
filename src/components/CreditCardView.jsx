import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import MonthSelector from './MonthSelector';
import ReorderButtons from './ReorderButtons';
import { formatCurrency, MONTHS } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { validateCardExpense, getActiveCardExpenses, getMiscellaneousCardExpenses } from '../services/calculations';
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
    installments: 1,
    startMonth: selectedMonth
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
    const validation = validateCardExpense({
      ...newCardExpense,
      value: parseFloat(newCardExpense.value),
      installments: parseInt(newCardExpense.installments),
      startMonth: parseInt(newCardExpense.startMonth)
    });

    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    const maxOrder = creditCardExpenses.reduce(
      (max, exp) => Math.max(max, exp.order !== undefined ? exp.order : 0),
      0
    );

    const result = await onSave('credit_expenses', {
      name: newCardExpense.name,
      value: parseFloat(newCardExpense.value),
      installments: parseInt(newCardExpense.installments),
      startMonth: parseInt(newCardExpense.startMonth),
      order: maxOrder + 1
    });

    if (result.success) {
      toast.success('Compra adicionada!');
      setNewCardExpense({ name: '', value: '', installments: 1, startMonth: selectedMonth });
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

      {/* Adicionar Compra */}
      <div className="bg-slate-800 p-6 rounded-xl text-white">
        <h3 className="font-bold mb-4 flex gap-2">
          <Plus size={20} className="text-emerald-400" /> Adicionar Compra
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
          <input
            className="sm:col-span-2 p-2 rounded bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            placeholder="Descrição"
            value={newCardExpense.name}
            onChange={e => setNewCardExpense({ ...newCardExpense, name: e.target.value })}
          />
          <input
            className="p-2 rounded bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            type="number"
            placeholder="Valor"
            value={newCardExpense.value}
            onChange={e => setNewCardExpense({ ...newCardExpense, value: e.target.value })}
          />
          <input
            className="p-2 rounded bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            type="number"
            placeholder="Parc."
            value={newCardExpense.installments}
            onChange={e => setNewCardExpense({ ...newCardExpense, installments: e.target.value })}
          />
          <select
            className="p-2 rounded bg-slate-700 border-slate-600 text-white"
            value={newCardExpense.startMonth}
            onChange={e => setNewCardExpense({ ...newCardExpense, startMonth: e.target.value })}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAdd}
          className="mt-4 w-full bg-emerald-600 py-2 rounded font-bold hover:bg-emerald-700 transition-colors"
        >
          Adicionar
        </button>
      </div>

      {/* Itens Cadastrados */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-bold mb-4">Itens Cadastrados</h3>
        <div className="divide-y max-h-60 overflow-auto">
          {sortedCreditExpenses.map((item, index) => (
            <div key={item.id} className="py-3 flex justify-between items-center">
              <div className="flex items-center gap-2 flex-1">
                {/* Botões de reordenação */}
                <ReorderButtons
                  index={index}
                  totalItems={sortedCreditExpenses.length}
                  onMoveUp={() => handleMove(item, 'up')}
                  onMoveDown={() => handleMove(item, 'down')}
                />
                <div>
                  <div className="font-bold">{item.name}</div>
                  <div className="text-xs text-slate-500">
                    {item.installments}x de {formatCurrency(item.value)} - Inicia em {MONTHS[item.startMonth]}
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(item.id)}>
                <Trash2 size={18} className="text-slate-300 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreditCardView;
