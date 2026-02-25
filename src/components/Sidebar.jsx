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

const SIDEBAR_WIDTH = 256; // w-64 = 16rem = 256px
const EDGE_ZONE = 30; // pixels da borda esquerda para iniciar swipe
const SWIPE_THRESHOLD = 0.3; // 30% do width para decidir abrir/fechar

const Sidebar = ({ activeTab, onTabChange, user, onLogout, onExport, darkMode, onToggleDarkMode, pinEnabled, onTogglePin, obligations = [], selectedMonth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0); // 0 = fechado, SIDEBAR_WIDTH = aberto
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const swipeDirection = useRef(null); // 'horizontal' | 'vertical' | null
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

  // --- Swipe com transição visual em tempo real ---
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    swipeDirection.current = null;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchStartX.current === null) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Decidir direção no primeiro movimento significativo
    if (swipeDirection.current === null) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        swipeDirection.current = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
      }
      if (swipeDirection.current !== 'horizontal') return;

      // Só inicia swipe se: abrindo da borda esquerda, ou fechando com sidebar aberta
      const startX = touchStartX.current;
      if (!isOpen && startX > EDGE_ZONE) {
        swipeDirection.current = 'vertical'; // cancela
        return;
      }
    }

    if (swipeDirection.current !== 'horizontal') return;

    setIsSwiping(true);

    if (isOpen) {
      // Fechando: offset vai de SIDEBAR_WIDTH até 0
      const offset = Math.max(0, Math.min(SIDEBAR_WIDTH, SIDEBAR_WIDTH + deltaX));
      setSwipeOffset(offset);
    } else {
      // Abrindo: offset vai de 0 até SIDEBAR_WIDTH
      const offset = Math.max(0, Math.min(SIDEBAR_WIDTH, deltaX));
      setSwipeOffset(offset);
    }
  }, [isOpen]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    // Decidir se abre ou fecha baseado na posição
    const shouldOpen = swipeOffset > SIDEBAR_WIDTH * SWIPE_THRESHOLD;
    setIsOpen(shouldOpen);
    setSwipeOffset(0);
    setIsSwiping(false);
    touchStartX.current = null;
    touchStartY.current = null;
    swipeDirection.current = null;
  }, [isSwiping, swipeOffset]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    if (!mediaQuery.matches) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calcular transform da sidebar no mobile
  const getSidebarStyle = () => {
    // Desktop: sem transform inline
    if (typeof window !== 'undefined' && window.innerWidth >= 768) return {};

    if (isSwiping) {
      // Durante swipe: seguir o dedo sem transition
      const translateX = swipeOffset - SIDEBAR_WIDTH;
      return {
        transform: `translateX(${translateX}px)`,
        transition: 'none',
      };
    }

    // Sem swipe: usar CSS classes (isOpen controla via classes)
    return {};
  };

  // Overlay opacity proporcional ao swipe
  const getOverlayStyle = () => {
    if (isSwiping) {
      return { opacity: swipeOffset / SIDEBAR_WIDTH };
    }
    return {};
  };

  const showOverlay = isOpen || (isSwiping && swipeOffset > 0);

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
      {showOverlay && (
        <div
          className={`md:hidden fixed inset-0 bg-black z-40 ${isSwiping ? '' : 'transition-opacity duration-300'}`}
          style={{ opacity: isSwiping ? swipeOffset / SIDEBAR_WIDTH * 0.5 : 0.5 }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          fixed md:relative top-0 left-0 h-screen md:h-full
          bg-white dark:bg-slate-900
          text-slate-800 dark:text-white
          flex flex-col p-4 z-40
          border-r border-slate-200 dark:border-slate-800
          md:translate-x-0 md:w-64 md:flex-shrink-0
          w-64
          ${!isSwiping ? 'transition-transform duration-300 ease-in-out' : ''}
          ${!isSwiping && isOpen ? 'translate-x-0 shadow-xl' : ''}
          ${!isSwiping && !isOpen ? '-translate-x-full md:translate-x-0' : ''}
        `}
        style={getSidebarStyle()}
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
