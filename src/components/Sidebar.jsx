import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PieChart,
  Wallet,
  Banknote,
  Calendar,
  CreditCard,
  BarChart3,
  Plane,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  Download,
  Moon,
  Sun,
  LayoutDashboard,
  Lock,
  Unlock
} from 'lucide-react';

const Sidebar = ({ activeTab, onTabChange, user, onLogout, onExport, darkMode, onToggleDarkMode, pinEnabled, onTogglePin, obligations = [], selectedMonth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const sidebarRef = useRef(null);

  const currentMonth = selectedMonth ?? new Date().getMonth();
  const pendingObligations = obligations.filter(o => !o.doneStatus[currentMonth]).length;

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'incomes', icon: Banknote, label: 'Receitas' },
    { id: 'monthly', icon: Calendar, label: 'Despesas' },
    { id: 'credit', icon: CreditCard, label: 'Cartão' },
    { id: 'yearly', icon: BarChart3, label: 'Visão Anual' },
    { id: 'comparison', icon: PieChart, label: 'Comparação' },
    { id: 'vacation', icon: Plane, label: 'Fundo Férias' },
    { id: 'office', icon: ClipboardCheck, label: 'Checklist', badge: pendingObligations > 0 ? pendingObligations : null },
  ];

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  // Swipe gesture: abrir sidebar arrastando do canto esquerdo para a direita
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    const startX = touchStartX.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // Só detectar swipe horizontal (deltaX maior que deltaY)
    if (deltaY > Math.abs(deltaX)) return;

    // Abrir: swipe para direita a partir da borda esquerda (< 30px)
    if (!isOpen && startX < 30 && deltaX > 60) {
      setIsOpen(true);
      return;
    }

    // Fechar: swipe para esquerda estando aberto
    if (isOpen && deltaX < -60) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Só no mobile (< 768px)
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    if (!mediaQuery.matches) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return (
    <>
      {/* Mobile: Header fixo com menu hambúrguer */}
      <div className="md:hidden bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md dark:shadow-lg border-b border-slate-200 dark:border-transparent">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Wallet className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" size={20} />
          <h1 className="text-base font-bold truncate">Finanças {new Date().getFullYear()}</h1>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 ml-2"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile: Menu overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          fixed md:sticky top-0 left-0 h-screen
          bg-white dark:bg-slate-900
          text-slate-800 dark:text-white
          flex flex-col p-4 z-40
          border-r border-slate-200 dark:border-slate-800
          transition-transform duration-300 ease-in-out
          md:translate-x-0 md:w-64
          ${isOpen ? 'translate-x-0 w-64 shadow-xl' : '-translate-x-full w-64'}
        `}
      >
        <div className="mb-8 p-2 hidden md:block">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="text-emerald-600 dark:text-emerald-400" /> Finanças {new Date().getFullYear()}
          </h1>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
            {user?.email}
          </div>
        </div>

        {/* Espaçamento no mobile para não cobrir os botões com o header fixo */}
        <div className="md:hidden h-16" />

        <nav className="flex flex-col gap-1 flex-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeTab === item.id
                  ? 'bg-emerald-600 text-white'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <item.icon size={20} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <button
            onClick={onExport}
            className="w-full p-3 rounded-lg flex items-center gap-3 text-blue-500 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          >
            <Download size={20} /> Exportar
          </button>
          <button
            onClick={onToggleDarkMode}
            className="w-full p-3 rounded-lg flex items-center gap-3 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {darkMode ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          <button
            onClick={onTogglePin}
            className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
              pinEnabled
                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-300'
                : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white'
            }`}
          >
            {pinEnabled ? <Lock size={20} /> : <Unlock size={20} />}
            {pinEnabled ? 'PIN Ativo' : 'Ativar PIN'}
          </button>
          <button
            onClick={onLogout}
            className="w-full p-3 rounded-lg flex items-center gap-3 text-red-500 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-600 dark:hover:text-red-300 transition-colors"
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
