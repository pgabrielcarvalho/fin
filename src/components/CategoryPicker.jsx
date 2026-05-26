import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const CategoryPicker = ({ categoryId, categories = [], onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const category = categories.find(c => c.id === categoryId);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] md:text-xs font-medium transition-colors whitespace-nowrap"
        style={category ? {
          backgroundColor: category.color + '20',
          color: category.color,
          border: `1px solid ${category.color}40`
        } : {
          backgroundColor: 'transparent',
          color: '#94a3b8',
          border: '1px dashed #cbd5e1'
        }}
      >
        {category ? (
          <>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
            {category.name}
          </>
        ) : (
          '+ Cat'
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg py-1 min-w-[140px] max-h-[200px] overflow-y-auto">
          {categoryId && (
            <button
              onClick={() => { onChange(null); setIsOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
            >
              <X size={12} /> Remover
            </button>
          )}
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => { onChange(cat.id); setIsOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                cat.id === categoryId ? 'bg-slate-50 dark:bg-slate-700 font-bold' : ''
              }`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-slate-700 dark:text-slate-200">{cat.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPicker;
