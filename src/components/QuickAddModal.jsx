import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import TypeSelector from './TypeSelector';
import InstallmentPreview from './InstallmentPreview';
import { MONTHS } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { validateIncome, validateExpense, validateCardExpense, getDefaultInvoiceMonth } from '../services/calculations';

const TABS = [
  { key: 'incomes', label: 'Receita', color: 'emerald' },
  { key: 'expenses', label: 'Despesa', color: 'emerald' },
  { key: 'credit_expenses', label: 'Cartão', color: 'indigo' },
];

const QuickAddModal = ({
  onClose,
  onSave,
  selectedMonth,
  selectedYear,
  expenseCategories = [],
  incomeCategories = [],
  cardSettings,
  creditCardExpenses = [],
}) => {
  const toast = useToast();
  const nameRef = useRef(null);
  const currentYear = selectedYear || new Date().getFullYear();

  const [activeCollection, setActiveCollection] = useState('expenses');
  const [form, setForm] = useState({
    name: '',
    value: '',
    type: 'fixed',
    month: selectedMonth,
    installments: 2,
    startMonth: selectedMonth,
    categoryId: '',
    extraordinary: false,
  });

  useEffect(() => {
    nameRef.current?.focus();
  }, [activeCollection]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const categories = activeCollection === 'incomes' ? incomeCategories : expenseCategories;

  const handleTabChange = (key) => {
    setActiveCollection(key);
    const closingDates = cardSettings?.closingDates || Array(12).fill(10);
    const autoMonth = getDefaultInvoiceMonth(closingDates, currentYear);
    setForm({
      name: '',
      value: '',
      type: 'fixed',
      month: key === 'credit_expenses' ? autoMonth : selectedMonth,
      installments: 2,
      startMonth: key === 'credit_expenses' ? autoMonth : selectedMonth,
      categoryId: '',
      extraordinary: false,
    });
  };

  const handleSubmit = async () => {
    const value = parseFloat(form.value);

    if (activeCollection === 'incomes') {
      const validation = validateIncome({ ...form, value });
      if (!validation.isValid) { toast.error(validation.errors[0]); return; }

      await onSave('incomes', {
        name: form.name,
        value,
        type: form.type,
        month: form.type === 'variable' ? parseInt(form.month) : null,
        overrides: {},
        ...(form.categoryId && { categoryId: form.categoryId }),
        ...(form.extraordinary && { extraordinary: true }),
      });
    } else if (activeCollection === 'expenses') {
      const validation = validateExpense({ ...form, value });
      if (!validation.isValid) { toast.error(validation.errors[0]); return; }

      await onSave('expenses', {
        name: form.name,
        value,
        type: form.type,
        paidStatus: Array(12).fill(false),
        overrides: {},
        ...(form.type === 'eventual' && { month: parseInt(form.month) }),
        ...(form.categoryId && { categoryId: form.categoryId }),
        ...(form.extraordinary && { extraordinary: true }),
      });
    } else if (activeCollection === 'credit_expenses') {
      let lastMonth = null;
      let lastYear = null;
      if (form.type === 'installment') {
        const sm = parseInt(form.startMonth);
        const inst = parseInt(form.installments);
        const total = sm + inst - 1;
        lastMonth = total % 12;
        lastYear = currentYear + Math.floor(total / 12);
      }

      const installmentsCount = form.type === 'installment' ? parseInt(form.installments) : null;
      const perInstallmentValue = form.type === 'installment'
        ? Math.round((value / installmentsCount) * 100) / 100
        : value;

      const expenseData = {
        name: form.name,
        value: perInstallmentValue,
        type: form.type,
        installments: installmentsCount,
        lastMonth,
        lastYear,
        month: form.type === 'eventual' ? parseInt(form.month) : null,
        overrides: {},
        ...(form.categoryId && { categoryId: form.categoryId }),
        ...(form.extraordinary && { extraordinary: true }),
      };

      const validation = validateCardExpense(expenseData);
      if (!validation.isValid) { toast.error(validation.errors[0]); return; }

      const maxOrder = creditCardExpenses.reduce(
        (max, exp) => Math.max(max, exp.order !== undefined ? exp.order : 0), 0
      );
      expenseData.order = maxOrder + 1;

      await onSave('credit_expenses', expenseData);
    }

    toast.success('Item adicionado!');
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const activeTab = TABS.find(t => t.key === activeCollection);
  const accentColor = activeTab?.color || 'emerald';

  const typeOptions = activeCollection === 'incomes'
    ? [{ label: 'Fixo', value: 'fixed' }, { label: 'Variável', value: 'variable' }]
    : activeCollection === 'expenses'
    ? [{ label: 'Fixa', value: 'fixed' }, { label: 'Eventual', value: 'eventual' }]
    : [{ label: 'Fixa', value: 'fixed' }, { label: 'Parcelada', value: 'installment' }, { label: 'Eventual', value: 'eventual' }];

  const showMonthSelect =
    (activeCollection === 'incomes' && form.type === 'variable') ||
    (activeCollection === 'expenses' && form.type === 'eventual') ||
    (activeCollection === 'credit_expenses' && form.type === 'eventual');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Adicionar</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex gap-1 p-3 bg-slate-50 dark:bg-slate-700/50">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeCollection === tab.key
                  ? tab.color === 'indigo'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <TypeSelector
              options={typeOptions}
              value={form.type}
              onChange={(type) => {
                const updates = { ...form, type };
                if (activeCollection === 'credit_expenses' && (type === 'eventual' || type === 'installment')) {
                  const closingDates = cardSettings?.closingDates || Array(12).fill(10);
                  const autoMonth = getDefaultInvoiceMonth(closingDates, currentYear);
                  if (type === 'eventual') updates.month = autoMonth;
                  if (type === 'installment') updates.startMonth = autoMonth;
                }
                setForm(updates);
              }}
              activeColor={accentColor}
            />
          </div>

          <input
            ref={nameRef}
            className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
            placeholder="Descrição"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            onKeyDown={handleKeyDown}
          />

          <div className="flex gap-2">
            <input
              className="flex-1 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-200"
              type="number"
              placeholder={activeCollection === 'credit_expenses' && form.type === 'installment' ? 'Valor Total (R$)' : 'Valor (R$)'}
              value={form.value}
              onChange={e => setForm({ ...form, value: e.target.value })}
              onKeyDown={handleKeyDown}
            />

            {showMonthSelect && (
              <select
                className="w-36 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 text-sm text-slate-800 dark:text-slate-200"
                value={form.month}
                onChange={e => setForm({ ...form, month: parseInt(e.target.value) })}
              >
                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            )}
          </div>

          {/* Installment fields */}
          {activeCollection === 'credit_expenses' && form.type === 'installment' && (
            <div className="flex gap-2">
              <select
                className="w-24 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 text-sm text-slate-800 dark:text-slate-200"
                value={form.installments}
                onChange={e => setForm({ ...form, installments: e.target.value })}
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24].map(num => (
                  <option key={num} value={num}>{num}x</option>
                ))}
              </select>
              <select
                className="flex-1 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 text-sm text-slate-800 dark:text-slate-200"
                value={form.startMonth}
                onChange={e => setForm({ ...form, startMonth: parseInt(e.target.value) })}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i}>Início: {m}/{String(currentYear).slice(-2)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Installment preview */}
          {activeCollection === 'credit_expenses' && form.type === 'installment' && parseFloat(form.value) > 0 && (
            <InstallmentPreview
              totalValue={parseFloat(form.value)}
              installments={parseInt(form.installments)}
              startMonth={parseInt(form.startMonth)}
              currentYear={currentYear}
            />
          )}

          {/* Category */}
          {categories.length > 0 && (
            <select
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border dark:border-slate-600 text-sm text-slate-800 dark:text-slate-200"
              value={form.categoryId}
              onChange={e => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Categoria (opcional)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          )}

          {/* Extraordinary checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.extraordinary}
              onChange={e => setForm({ ...form, extraordinary: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs text-slate-600 dark:text-slate-400">Extraordinária</span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-slate-700">
          <button
            onClick={handleSubmit}
            className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${
              accentColor === 'indigo'
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModal;
