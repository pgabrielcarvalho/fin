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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <FileText size={20} className="text-blue-500" />
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
        className="w-full h-32 p-3 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
      />
      {hasChanges && (
        <p className="text-xs text-amber-600 mt-2">
          ⚠️ Você tem alterações não salvas
        </p>
      )}
    </div>
  );
};

export default MonthlyNotes;
