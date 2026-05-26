import { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Briefcase } from 'lucide-react';
import MonthTabs from './MonthTabs';
import MonthlyNotes from './MonthlyNotes';
import { SortableList, SortableItem, DragHandle } from './SortableList';
import { useToast } from '../contexts/ToastContext';
import { useReorder } from '../hooks/useReorder';
import { useDragReorder } from '../hooks/useDragReorder';
import { MONTHS } from '../utils/formatters';

const OfficeView = ({
  selectedMonth,
  onMonthChange,
  obligations,
  onSave,
  onBatchSave,
  onDelete,
  notes,
  onSaveNotes
}) => {
  const toast = useToast();
  const [newObligationName, setNewObligationName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const { sortedItems: sortedObligations } = useReorder(obligations, (updatedItem) =>
    onSave('obligations', updatedItem)
  );

  const { handleDragReorder } = useDragReorder('obligations', sortedObligations, onBatchSave);

  const progress = useMemo(() => {
    const total = sortedObligations.length;
    const done = sortedObligations.filter(o => o.doneStatus[selectedMonth]).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }, [sortedObligations, selectedMonth]);

  const handleAdd = async () => {
    const name = newObligationName.trim();
    if (!name) {
      toast.error('Digite o nome da obrigação');
      return;
    }

    const maxOrder = obligations.reduce((max, o) =>
      Math.max(max, o.order !== undefined ? o.order : 0), 0
    );

    const result = await onSave('obligations', {
      name,
      doneStatus: Array(12).fill(false),
      order: maxOrder + 1
    });

    if (result.success) {
      toast.success('Obrigação adicionada!');
      setNewObligationName('');
    } else {
      toast.error(`Erro: ${result.error}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta obrigação?')) {
      const result = await onDelete('obligations', id);
      if (result.success) {
        toast.success('Obrigação excluída');
      }
    }
  };

  const toggleDone = async (obligation) => {
    const newStatus = [...obligation.doneStatus];
    newStatus[selectedMonth] = !newStatus[selectedMonth];
    await onSave('obligations', { ...obligation, doneStatus: newStatus });
  };

  const startEditing = (obligation) => {
    setEditingId(obligation.id);
    setEditingName(obligation.name);
  };

  const handleUpdateName = async (obligation) => {
    const name = editingName.trim();
    if (!name || name === obligation.name) {
      setEditingId(null);
      return;
    }
    await onSave('obligations', { ...obligation, name });
    setEditingId(null);
    toast.success('Nome atualizado');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Briefcase className="text-purple-500" size={24} />
          Checklist
        </h2>
      </div>
      <MonthTabs selectedMonth={selectedMonth} onChange={onMonthChange} />

      {/* Card de Progresso */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-700 dark:text-slate-200">
            Progresso de {MONTHS[selectedMonth]}
          </h3>
          <span className={`text-sm font-semibold ${
            progress.percent === 100
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}>
            {progress.done} de {progress.total} concluídas
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              progress.percent === 100
                ? 'bg-emerald-500'
                : progress.percent > 0
                ? 'bg-blue-500'
                : 'bg-slate-300 dark:bg-slate-600'
            }`}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        {progress.percent === 100 && progress.total > 0 && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            Todas as obrigações de {MONTHS[selectedMonth]} foram concluídas!
          </p>
        )}
      </div>

      {/* Lista de Obrigações */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-700 dark:text-slate-200">Obrigações Mensais</h3>
        </div>

        <SortableList items={sortedObligations} onReorder={handleDragReorder}>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {sortedObligations.map((obligation) => (
              <SortableItem key={obligation.id} id={obligation.id}>
                {({ dragHandleProps }) => {
                  const isDone = obligation.doneStatus[selectedMonth];
                  return (
                    <div
                      className={`p-2.5 md:p-4 flex items-center gap-1.5 md:gap-3 ${
                        isDone ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <DragHandle {...dragHandleProps} />
                      </div>

                      <button
                        onClick={() => toggleDone(obligation)}
                        className={`p-1.5 md:p-2 rounded-full transition-all flex-shrink-0 ${
                          isDone
                            ? 'bg-emerald-500 text-white scale-110'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {isDone
                          ? <CheckCircle2 size={18} className="md:w-6 md:h-6" />
                          : <Circle size={18} className="md:w-6 md:h-6" />
                        }
                      </button>

                      <div className="flex-1 min-w-0">
                        {editingId === obligation.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleUpdateName(obligation)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateName(obligation);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className="w-full bg-transparent border-b border-blue-400 outline-none text-xs md:text-base font-medium text-slate-800 dark:text-slate-200 py-0.5"
                          />
                        ) : (
                          <span
                            onClick={() => startEditing(obligation)}
                            className={`text-xs md:text-base font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block ${
                              isDone ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {obligation.name}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(obligation.id)}
                        className="flex-shrink-0"
                      >
                        <Trash2 size={14} className="md:w-[18px] md:h-[18px] text-slate-300 hover:text-red-500" />
                      </button>
                    </div>
                  );
                }}
              </SortableItem>
            ))}
          </div>
        </SortableList>

        {sortedObligations.length === 0 && (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500">
            Nenhuma obrigação cadastrada
          </div>
        )}

        {/* Adicionar nova obrigação */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
          <input
            type="text"
            placeholder="Nova obrigação..."
            value={newObligationName}
            onChange={(e) => setNewObligationName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={16} />
            Adicionar
          </button>
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

export default OfficeView;
