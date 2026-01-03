import { useEffect } from 'react';

/**
 * Hook para gerenciar atalhos de teclado globais
 */
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;
      const alt = event.altKey;

      // Ignora se estiver digitando em input/textarea
      const activeElement = document.activeElement;
      const isTyping = activeElement.tagName === 'INPUT' ||
                       activeElement.tagName === 'TEXTAREA' ||
                       activeElement.isContentEditable;

      shortcuts.forEach(({ keys, action, allowInInput = false }) => {
        if (!allowInInput && isTyping) return;

        const matches = keys.some(keyCombo => {
          const parts = keyCombo.toLowerCase().split('+');
          const keyMatch = parts.includes(key);
          const ctrlMatch = parts.includes('ctrl') === ctrl || parts.includes('cmd') === ctrl;
          const shiftMatch = parts.includes('shift') === shift;
          const altMatch = parts.includes('alt') === alt;

          // Se não especifica modificador, não deve ter o modificador pressionado
          const noCtrl = !parts.includes('ctrl') && !parts.includes('cmd') ? !ctrl : true;
          const noShift = !parts.includes('shift') ? !shift : true;
          const noAlt = !parts.includes('alt') ? !alt : true;

          return keyMatch && ctrlMatch && shiftMatch && altMatch && noCtrl && noShift && noAlt;
        });

        if (matches) {
          event.preventDefault();
          action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

/**
 * Atalhos padrão da aplicação
 */
export const APP_SHORTCUTS = {
  DASHBOARD: ['d'],
  INCOMES: ['r'],
  EXPENSES: ['e'],
  CREDIT_CARD: ['c'],
  YEARLY: ['a'],
  VACATION: ['f'],
  EXPORT: ['ctrl+e', 'cmd+e'],
  DARK_MODE: ['ctrl+d', 'cmd+d'],
  HELP: ['?', 'h'],
  NEXT_MONTH: ['arrowright'],
  PREV_MONTH: ['arrowleft'],
  SEARCH: ['ctrl+k', 'cmd+k']
};
