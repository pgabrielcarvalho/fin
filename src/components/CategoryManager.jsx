import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const CategoryManager = ({ categories = [], onSave, onClose }) => {
  const [localCategories, setLocalCategories] = useState([...categories]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const handleAddCategory = () => {
    if (!newName.trim()) return;
    const maxOrder = localCategories.reduce((max, c) => Math.max(max, c.order || 0), 0);
    const newCat = {
      id: `cat_${Date.now()}`,
      name: newName.trim(),
      color: newColor,
      order: maxOrder + 1
    };
    const updated = [...localCategories, newCat];
    setLocalCategories(updated);
    onSave(updated);
    setNewName('');
  };

  const handleDelete = (id) => {
    const updated = localCategories.filter(c => c.id !== id);
    setLocalCategories(updated);
    onSave(updated);
  };

  const handleUpdateName = (id, name) => {
    const updated = localCategories.map(c => c.id === id ? { ...c, name } : c);
    setLocalCategories(updated);
    onSave(updated);
  };

  const handleUpdateColor = (id, color) => {
    const updated = localCategories.map(c => c.id === id ? { ...c, color } : c);
    setLocalCategories(updated);
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Gerenciar Categorias</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {localCategories.map(cat => (
            <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
              <input
                type="color"
                value={cat.color}
                onChange={e => handleUpdateColor(cat.id, e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
              />
              <input
                type="text"
                value={cat.name}
                onChange={e => handleUpdateName(cat.id, e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 outline-none border-b border-transparent focus:border-slate-300 dark:focus:border-slate-500 px-1 py-0.5"
              />
              <button
                onClick={() => handleDelete(cat.id)}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              >
                <Trash2 size={14} className="text-slate-400 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t dark:border-slate-700">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newColor}
              onChange={e => setNewColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
            />
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              placeholder="Nova categoria..."
              className="flex-1 p-2 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleAddCategory}
              disabled={!newName.trim()}
              className="p-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
