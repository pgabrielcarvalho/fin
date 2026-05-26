import { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp, FolderPlus, CheckCircle2, Circle } from 'lucide-react';
import MonthlyNotes from './MonthlyNotes';
import { SortableList, SortableItem, DragHandle } from './SortableList';
import EditableValue from './EditableValue';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';
import { useReorder } from '../hooks/useReorder';
import { useDragReorder } from '../hooks/useDragReorder';

const EditableName = ({ value, onSave, className = '' }) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const commit = () => {
    setEditing(false);
    const trimmed = localValue.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    } else {
      setLocalValue(value);
    }
  };

  return editing ? (
    <input
      autoFocus
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') e.target.blur();
        if (e.key === 'Escape') { setLocalValue(value); setEditing(false); }
      }}
      className={`text-sm px-1 py-0.5 rounded border border-slate-300 dark:border-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 ${className}`}
    />
  ) : (
    <span
      onClick={() => { setEditing(true); setLocalValue(value); }}
      className={`cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 px-1 py-0.5 rounded transition-colors ${className}`}
      title="Clique para editar"
    >
      {value}
    </span>
  );
};

const VacationFundView = ({ vacationFund, onSave, onBatchSave, onDelete, notes, onSaveNotes }) => {
  const toast = useToast();
  const [newVacationIncome, setNewVacationIncome] = useState({ name: '', value: '' });
  const [newVacationExpense, setNewVacationExpense] = useState({ name: '', value: '' });
  const [newProjectName, setNewProjectName] = useState('');
  const [newSubItems, setNewSubItems] = useState({}); // { [projectId]: { name, value } }
  const [addMode, setAddMode] = useState('expense'); // 'expense' | 'project'
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  const handleUpdateItem = async (collection, item, updates) => {
    await onSave(collection, { ...item, ...updates });
  };

  const togglePaid = (collection, item) => {
    handleUpdateItem(collection, item, { paid: !item.paid });
  };

  // Hooks de reordenação para entradas
  const {
    sortedItems: sortedIncomes
  } = useReorder(vacationFund.incomes, (updatedItem) => onSave('vacation_incomes', updatedItem));

  const {
    sortedItems: sortedExpenses
  } = useReorder(vacationFund.expenses, (updatedItem) => onSave('vacation_expenses', updatedItem));

  const { handleDragReorder: handleDragReorderIncomes } = useDragReorder('vacation_incomes', sortedIncomes, onBatchSave);

  // Agrupar saídas em projetos, sub-itens e avulsos
  const { subItemsByProject, topLevelItems } = useMemo(() => {
    const projects = [];
    const subItemsByProject = {};
    const standaloneItems = [];

    for (const item of sortedExpenses) {
      if (item.type === 'project') {
        projects.push(item);
        if (!subItemsByProject[item.id]) subItemsByProject[item.id] = [];
      } else if (item.projectId) {
        if (!subItemsByProject[item.projectId]) subItemsByProject[item.projectId] = [];
        subItemsByProject[item.projectId].push(item);
      } else {
        standaloneItems.push(item);
      }
    }

    // Itens de nível superior para drag-and-drop: projetos + avulsos, na ordem original
    const topLevelItems = sortedExpenses.filter(i => i.type === 'project' || (!i.projectId && i.type !== 'project'));

    return { projects, subItemsByProject, standaloneItems, topLevelItems };
  }, [sortedExpenses]);

  const { handleDragReorder: handleDragReorderExpenses } = useDragReorder('vacation_expenses', topLevelItems, onBatchSave);

  const projectTotal = (projectId) => {
    const items = subItemsByProject[projectId] || [];
    return items.reduce((acc, item) => acc + (item.value || 0), 0);
  };

  // Totais com breakdown pago/pendente
  const totals = useMemo(() => {
    const incomeTotal = sortedIncomes.reduce((acc, item) => acc + item.value, 0);
    const incomePaid = sortedIncomes.filter(i => i.paid).reduce((acc, i) => acc + i.value, 0);
    const incomePending = incomeTotal - incomePaid;

    const expenseItems = sortedExpenses.filter(i => i.type !== 'project');
    const expenseTotal = expenseItems.reduce((acc, item) => acc + (item.value || 0), 0);
    const expensePaid = expenseItems.filter(i => i.paid).reduce((acc, i) => acc + (i.value || 0), 0);
    const expensePending = expenseTotal - expensePaid;

    const balance = incomeTotal - expenseTotal;

    return { incomeTotal, incomePaid, incomePending, expenseTotal, expensePaid, expensePending, balance };
  }, [sortedIncomes, sortedExpenses]);

  const toggleProject = (id) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addIncome = async () => {
    if (!newVacationIncome.name || !newVacationIncome.value) {
      toast.error('Preencha todos os campos');
      return;
    }

    const maxOrder = vacationFund.incomes.reduce(
      (max, inc) => Math.max(max, inc.order !== undefined ? inc.order : 0),
      0
    );

    const result = await onSave('vacation_incomes', {
      name: newVacationIncome.name,
      value: parseFloat(newVacationIncome.value),
      order: maxOrder + 1
    });

    if (result.success) {
      toast.success('Entrada adicionada!');
      setNewVacationIncome({ name: '', value: '' });
    }
  };

  const addExpense = async () => {
    if (!newVacationExpense.name || !newVacationExpense.value) {
      toast.error('Preencha todos os campos');
      return;
    }

    const maxOrder = vacationFund.expenses.reduce(
      (max, exp) => Math.max(max, exp.order !== undefined ? exp.order : 0),
      0
    );

    const result = await onSave('vacation_expenses', {
      name: newVacationExpense.name,
      value: parseFloat(newVacationExpense.value),
      order: maxOrder + 1
    });

    if (result.success) {
      toast.success('Saída adicionada!');
      setNewVacationExpense({ name: '', value: '' });
    }
  };

  const addProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Informe o nome do projeto');
      return;
    }

    const maxOrder = vacationFund.expenses.reduce(
      (max, exp) => Math.max(max, exp.order !== undefined ? exp.order : 0),
      0
    );

    const result = await onSave('vacation_expenses', {
      name: newProjectName.trim(),
      type: 'project',
      order: maxOrder + 1
    });

    if (result.success) {
      toast.success('Projeto criado!');
      setNewProjectName('');
    }
  };

  const addSubItem = async (projectId) => {
    const sub = newSubItems[projectId] || { name: '', value: '' };
    if (!sub.name || !sub.value) {
      toast.error('Preencha todos os campos');
      return;
    }

    const siblings = subItemsByProject[projectId] || [];
    const maxOrder = siblings.reduce(
      (max, item) => Math.max(max, item.order !== undefined ? item.order : 0),
      0
    );

    const result = await onSave('vacation_expenses', {
      name: sub.name,
      value: parseFloat(sub.value),
      projectId,
      order: maxOrder + 1
    });

    if (result.success) {
      toast.success('Item adicionado ao projeto!');
      setNewSubItems(prev => ({ ...prev, [projectId]: { name: '', value: '' } }));
    }
  };

  const handleDelete = async (collection, id) => {
    if (window.confirm('Excluir este item?')) {
      await onDelete(collection, id);
      toast.success('Item excluído');
    }
  };

  const handleDeleteProject = async (projectId) => {
    const subItems = subItemsByProject[projectId] || [];
    const count = subItems.length;
    const msg = count > 0
      ? `Excluir este projeto e seus ${count} item(ns)?`
      : 'Excluir este projeto?';

    if (!window.confirm(msg)) return;

    // Deletar sub-itens primeiro, depois o projeto
    for (const sub of subItems) {
      await onDelete('vacation_expenses', sub.id);
    }
    await onDelete('vacation_expenses', projectId);
    toast.success('Projeto excluído');
  };

  const getSubItemState = (projectId) => {
    return newSubItems[projectId] || { name: '', value: '' };
  };

  const updateSubItemState = (projectId, field, val) => {
    setNewSubItems(prev => ({
      ...prev,
      [projectId]: { ...getSubItemState(projectId), [field]: val }
    }));
  };

  // Checkbox de pago/pendente
  const PaidCheckbox = ({ paid, onToggle, variant = 'green' }) => {
    const activeColor = variant === 'green'
      ? 'text-emerald-500 dark:text-emerald-400'
      : 'text-red-500 dark:text-red-400';

    return (
      <button
        onClick={onToggle}
        className={`flex-shrink-0 transition-colors ${
          paid
            ? activeColor
            : 'text-slate-300 dark:text-slate-600 hover:text-slate-400 dark:hover:text-slate-500'
        }`}
        title={paid ? 'Marcar como pendente' : 'Marcar como pago'}
      >
        {paid ? <CheckCircle2 size={16} /> : <Circle size={16} />}
      </button>
    );
  };

  // Renderizar um projeto (colapsado ou expandido)
  const renderProject = (project, dragHandleProps) => {
    const isExpanded = expandedProjects.has(project.id);
    const total = projectTotal(project.id);
    const subItems = subItemsByProject[project.id] || [];
    const subState = getSubItemState(project.id);

    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50/30 dark:bg-red-900/10">
        {/* Header do projeto */}
        <div className="flex items-center gap-2 px-2 py-1.5">
          <DragHandle {...dragHandleProps} />
          <button
            onClick={() => toggleProject(project.id)}
            className="p-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <div className="flex-1 min-w-0">
            <EditableName
              value={project.name}
              onSave={(name) => handleUpdateItem('vacation_expenses', project, { name })}
              className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate"
            />
          </div>
          <span className="font-mono font-bold text-red-600 dark:text-red-400 text-sm flex-shrink-0">
            {formatCurrency(total)}
          </span>
          <button onClick={() => handleDeleteProject(project.id)}>
            <Trash2 size={14} className="text-slate-300 hover:text-red-500" />
          </button>
        </div>

        {/* Sub-itens expandidos */}
        {isExpanded && (
          <div className="border-t border-red-200/60 dark:border-red-800/30">
            <div className="pl-4 border-l-2 border-red-300 dark:border-red-700 ml-4 py-1">
              {subItems.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 py-1 px-2 text-sm">
                  <PaidCheckbox
                    paid={sub.paid}
                    onToggle={() => togglePaid('vacation_expenses', sub)}
                    variant="red"
                  />
                  <div className={`flex-1 min-w-0 ${sub.paid ? 'opacity-50' : ''}`}>
                    <EditableName
                      value={sub.name}
                      onSave={(name) => handleUpdateItem('vacation_expenses', sub, { name })}
                      className={`text-slate-700 dark:text-slate-300 truncate ${sub.paid ? 'line-through' : ''}`}
                    />
                  </div>
                  <EditableValue
                    value={sub.value}
                    onSave={(value) => handleUpdateItem('vacation_expenses', sub, { value })}
                    className={`w-24 text-right text-sm font-mono font-bold bg-transparent border-b border-transparent hover:border-red-300 dark:hover:border-red-600 focus:border-red-500 focus:bg-white dark:focus:bg-slate-700 outline-none rounded px-1 py-0.5 transition-colors ${
                      sub.paid ? 'text-red-400 dark:text-red-500 line-through' : 'text-red-600 dark:text-red-400'
                    }`}
                  />
                  <button onClick={() => handleDelete('vacation_expenses', sub.id)}>
                    <Trash2 size={14} className="text-slate-300 hover:text-red-500" />
                  </button>
                </div>
              ))}
              {/* Formulário inline para adicionar sub-item */}
              <div className="flex gap-2 py-1 px-2 mt-1">
                <input
                  placeholder="Desc"
                  value={subState.name}
                  onChange={e => updateSubItemState(project.id, 'name', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addSubItem(project.id); }}
                  className="flex-1 text-sm p-1 rounded border dark:border-slate-600 focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200"
                />
                <input
                  placeholder="R$"
                  type="number"
                  value={subState.value}
                  onChange={e => updateSubItemState(project.id, 'value', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addSubItem(project.id); }}
                  className="w-20 text-sm p-1 rounded border dark:border-slate-600 focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200"
                />
                <button
                  onClick={() => addSubItem(project.id)}
                  className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar despesa avulsa
  const renderStandaloneExpense = (item, dragHandleProps) => (
    <div className="flex justify-between text-sm items-center bg-white dark:bg-slate-800 py-1">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <DragHandle {...dragHandleProps} />
        <PaidCheckbox
          paid={item.paid}
          onToggle={() => togglePaid('vacation_expenses', item)}
          variant="red"
        />
        <div className={`flex-1 min-w-0 ${item.paid ? 'opacity-50' : ''}`}>
          <EditableName
            value={item.name}
            onSave={(name) => handleUpdateItem('vacation_expenses', item, { name })}
            className={`text-slate-800 dark:text-slate-200 truncate ${item.paid ? 'line-through' : ''}`}
          />
        </div>
      </div>
      <span className="flex gap-2 font-mono font-bold items-center flex-shrink-0">
        <EditableValue
          value={item.value}
          onSave={(value) => handleUpdateItem('vacation_expenses', item, { value })}
          className={`w-24 text-right text-sm font-mono font-bold bg-transparent border-b border-transparent hover:border-red-300 dark:hover:border-red-600 focus:border-red-500 focus:bg-white dark:focus:bg-slate-700 outline-none rounded px-1 py-0.5 transition-colors ${
            item.paid ? 'text-red-400 dark:text-red-500 line-through' : 'text-red-600 dark:text-red-400'
          }`}
        />
        <button onClick={() => handleDelete('vacation_expenses', item.id)}>
          <Trash2 size={14} className="text-slate-300 hover:text-red-500" />
        </button>
      </span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Fundo de Férias</h2>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Card de Entradas */}
        <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={48} />
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs mb-1 font-medium">
            Total de Entradas
          </div>
          <div className="text-lg md:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totals.incomeTotal)}
          </div>
          <div className="mt-1.5 flex flex-col gap-0.5 text-[10px] md:text-xs">
            <span className="text-emerald-700 dark:text-emerald-300">
              Recebido: {formatCurrency(totals.incomePaid)}
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              Previsto: {formatCurrency(totals.incomePending)}
            </span>
          </div>
        </div>

        {/* Card de Saídas */}
        <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10 text-red-500 dark:text-red-400">
            <TrendingDown size={48} />
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs mb-1 font-medium">
            Total de Saídas
          </div>
          <div className="text-lg md:text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totals.expenseTotal)}
          </div>
          <div className="mt-1.5 flex flex-col gap-0.5 text-[10px] md:text-xs">
            <span className="text-red-700 dark:text-red-300">
              Pago: {formatCurrency(totals.expensePaid)}
            </span>
            <span className="text-slate-400 dark:text-slate-500">
              Estimado: {formatCurrency(totals.expensePending)}
            </span>
          </div>
        </div>

        {/* Card de Saldo Real (baseado no que foi efetivamente pago/recebido) */}
        <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
          <div className="text-slate-500 dark:text-slate-400 text-[10px] md:text-xs mb-1 font-medium">
            Saldo Atual
          </div>
          <div className={`text-lg md:text-2xl font-bold ${
            totals.incomePaid - totals.expensePaid >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(totals.incomePaid - totals.expensePaid)}
          </div>
          <div className="mt-1.5 text-[10px] md:text-xs text-slate-400 dark:text-slate-500">
            Recebido - Pago
          </div>
        </div>

        {/* Card de Saldo Projetado */}
        <div className={`p-3 md:p-4 rounded-xl shadow-sm border relative overflow-hidden ${
          totals.balance >= 0
            ? 'bg-blue-600 dark:bg-blue-700 text-white'
            : 'bg-red-600 dark:bg-red-700 text-white'
        }`}>
          <div className="text-white/80 text-[10px] md:text-xs mb-1 font-medium">Saldo Projetado</div>
          <div className="text-lg md:text-2xl font-bold">
            {formatCurrency(totals.balance)}
          </div>
          <div className="mt-1.5 text-[10px] md:text-xs text-white/60">
            Total entradas - saídas
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:h-[500px]">
        {/* Entradas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 flex flex-col">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border-b dark:border-slate-700 font-bold text-emerald-800 dark:text-emerald-300">
            Entradas
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-2">
            <SortableList items={sortedIncomes} onReorder={handleDragReorderIncomes}>
              {sortedIncomes.map((item) => (
                <SortableItem key={item.id} id={item.id}>
                  {({ dragHandleProps }) => (
                    <div className="flex justify-between text-sm items-center bg-white dark:bg-slate-800 py-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <DragHandle {...dragHandleProps} />
                        <PaidCheckbox
                          paid={item.paid}
                          onToggle={() => togglePaid('vacation_incomes', item)}
                          variant="green"
                        />
                        <div className={`flex-1 min-w-0 ${item.paid ? 'opacity-50' : ''}`}>
                          <EditableName
                            value={item.name}
                            onSave={(name) => handleUpdateItem('vacation_incomes', item, { name })}
                            className={`text-slate-800 dark:text-slate-200 truncate ${item.paid ? 'line-through' : ''}`}
                          />
                        </div>
                      </div>
                      <span className="flex gap-2 font-mono font-bold items-center flex-shrink-0">
                        <EditableValue
                          value={item.value}
                          onSave={(value) => handleUpdateItem('vacation_incomes', item, { value })}
                          className={`w-24 text-right text-sm font-mono font-bold bg-transparent border-b border-transparent hover:border-emerald-300 dark:hover:border-emerald-600 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-700 outline-none rounded px-1 py-0.5 transition-colors ${
                            item.paid ? 'text-emerald-400 dark:text-emerald-500 line-through' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        />
                        <button onClick={() => handleDelete('vacation_incomes', item.id)}>
                          <Trash2 size={14} className="text-slate-300 hover:text-red-500" />
                        </button>
                      </span>
                    </div>
                  )}
                </SortableItem>
              ))}
            </SortableList>
          </div>
          <div className="p-3 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-700 flex gap-2">
            <input
              placeholder="Desc"
              value={newVacationIncome.name}
              onChange={e => setNewVacationIncome({ ...newVacationIncome, name: e.target.value })}
              className="flex-1 text-sm p-1 rounded border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200"
            />
            <input
              placeholder="R$"
              type="number"
              value={newVacationIncome.value}
              onChange={e => setNewVacationIncome({ ...newVacationIncome, value: e.target.value })}
              className="w-20 text-sm p-1 rounded border dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200"
            />
            <button
              onClick={addIncome}
              className="bg-emerald-600 text-white p-1 rounded hover:bg-emerald-700"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Saídas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border dark:border-slate-700 flex flex-col">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b dark:border-slate-700 font-bold text-red-800 dark:text-red-300">Saídas</div>
          <div className="flex-1 overflow-auto p-4 space-y-2">
            <SortableList items={topLevelItems} onReorder={handleDragReorderExpenses}>
              {topLevelItems.map((item) => (
                <SortableItem key={item.id} id={item.id}>
                  {({ dragHandleProps }) => (
                    item.type === 'project'
                      ? renderProject(item, dragHandleProps)
                      : renderStandaloneExpense(item, dragHandleProps)
                  )}
                </SortableItem>
              ))}
            </SortableList>
          </div>
          <div className="p-3 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-700 space-y-2">
            {/* Toggle Projeto / Despesa */}
            <div className="flex gap-1 mb-1">
              <button
                onClick={() => setAddMode('expense')}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                  addMode === 'expense'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
                }`}
              >
                Despesa
              </button>
              <button
                onClick={() => setAddMode('project')}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
                  addMode === 'project'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500'
                }`}
              >
                <FolderPlus size={12} />
                Projeto
              </button>
            </div>

            {addMode === 'expense' ? (
              <div className="flex gap-2">
                <input
                  placeholder="Desc"
                  value={newVacationExpense.name}
                  onChange={e => setNewVacationExpense({ ...newVacationExpense, name: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') addExpense(); }}
                  className="flex-1 text-sm p-1 rounded border dark:border-slate-600 focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200"
                />
                <input
                  placeholder="R$"
                  type="number"
                  value={newVacationExpense.value}
                  onChange={e => setNewVacationExpense({ ...newVacationExpense, value: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') addExpense(); }}
                  className="w-20 text-sm p-1 rounded border dark:border-slate-600 focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200"
                />
                <button
                  onClick={addExpense}
                  className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                >
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  placeholder="Nome do projeto"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addProject(); }}
                  className="flex-1 text-sm p-1 rounded border dark:border-slate-600 focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200"
                />
                <button
                  onClick={addProject}
                  className="bg-red-600 text-white p-1 rounded hover:bg-red-700 flex items-center gap-1"
                >
                  <FolderPlus size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Anotações */}
      <MonthlyNotes
        notes={notes}
        onSave={onSaveNotes}
        title="Anotações do Fundo de Férias"
      />
    </div>
  );
};

export default VacationFundView;
