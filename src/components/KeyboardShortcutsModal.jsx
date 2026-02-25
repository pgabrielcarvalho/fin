import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  // Fechar com ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'D', description: 'Dashboard', category: 'Navegação' },
    { key: 'R', description: 'Receitas', category: 'Navegação' },
    { key: 'E', description: 'Despesas', category: 'Navegação' },
    { key: 'C', description: 'Cartão', category: 'Navegação' },
    { key: 'A', description: 'Visão Anual', category: 'Navegação' },
    { key: 'F', description: 'Fundo Férias', category: 'Navegação' },
    { key: 'O', description: 'Checklist', category: 'Navegação' },
    { key: '←', description: 'Mês Anterior', category: 'Navegação' },
    { key: '→', description: 'Próximo Mês', category: 'Navegação' },
    { key: 'Ctrl+E', description: 'Exportar', category: 'Ações', mac: 'Cmd+E' },
    { key: 'Ctrl+D', description: 'Modo Escuro', category: 'Ações', mac: 'Cmd+D' },
    { key: '? ou H', description: 'Ajuda', category: 'Ações' },
  ];

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {});

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none" role="dialog" aria-modal="true" aria-label="Atalhos de teclado">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full pointer-events-auto animate-slide-in-right border border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Keyboard size={24} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                Atalhos de Teclado
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {Object.entries(groupedShortcuts).map(([category, items]) => (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span className="text-slate-700 dark:text-slate-300">
                        {shortcut.description}
                      </span>
                      <div className="flex gap-2">
                        <kbd className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-sm text-slate-700 dark:text-slate-300 font-mono text-sm font-bold">
                          {shortcut.key}
                        </kbd>
                        {shortcut.mac && (
                          <>
                            <span className="text-slate-400 dark:text-slate-500">ou</span>
                            <kbd className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded shadow-sm text-slate-700 dark:text-slate-300 font-mono text-sm font-bold">
                              {shortcut.mac}
                            </kbd>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Pressione <kbd className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 font-mono">ESC</kbd> para fechar
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default KeyboardShortcutsModal;
