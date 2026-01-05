import React, { useState, useEffect } from 'react';
import { FileText, Save } from 'lucide-react';

const MonthlyNotes = ({ selectedMonth, notes, onSave }) => {
  const [noteText, setNoteText] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar nota do mês atual quando muda o mês
  useEffect(() => {
    const currentNote = notes?.[selectedMonth] || '';
    setNoteText(currentNote);
    setHasChanges(false);
  }, [selectedMonth, notes]);

  const handleChange = (e) => {
    setNoteText(e.target.value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    const newNotes = [...(notes || Array(12).fill(''))];
    newNotes[selectedMonth] = noteText;
    await onSave(newNotes);
    setHasChanges(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <FileText size={20} className="text-blue-500 dark:text-blue-400" />
          Anotações do Mês
        </h3>
        {hasChanges && (
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Save size={16} />
            Salvar
          </button>
        )}
      </div>
      <textarea
        value={noteText}
        onChange={handleChange}
        placeholder="Digite aqui informações adicionais, lembretes ou observações sobre este mês..."
        className="w-full h-32 p-3 border border-slate-200 dark:border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
      />
      {hasChanges && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          ⚠️ Você tem alterações não salvas
        </p>
      )}
    </div>
  );
};

export default MonthlyNotes;
