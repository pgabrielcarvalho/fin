import React, { useState } from 'react';
import {
  PieChart,
  Wallet,
  Banknote,
  Calendar,
  CreditCard,
  BarChart3,
  Plane,
  LogOut,
  Menu,
  X,
  Download,
  Moon,
  Sun
} from 'lucide-react';

const Sidebar = ({ activeTab, onTabChange, user, onLogout, onExport, darkMode, onToggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: 'incomes', icon: Banknote, label: 'Receitas' },
    { id: 'monthly', icon: Calendar, label: 'Despesas' },
    { id: 'credit', icon: CreditCard, label: 'Cartão' },
    { id: 'yearly', icon: BarChart3, label: 'Visão Anual' },
    { id: 'comparison', icon: PieChart, label: 'Comparação' },
    { id: 'vacation', icon: Plane, label: 'Fundo Férias' },
  ];

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setIsOpen(false); // Fecha o menu no mobile após selecionar
  };

  return (
    <>
      {/* Mobile: Header fixo com menu hambúrguer */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Wallet className="text-emerald-400 flex-shrink-0" size={20} />
          <h1 className="text-base font-bold truncate">Finanças 2026</h1>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 ml-2"
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
        className={`
          fixed md:sticky top-0 left-0 h-screen bg-slate-900 text-white flex flex-col p-4 z-40
          transition-transform duration-300 ease-in-out
          md:translate-x-0 md:w-64
          ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
        `}
      >
        <div className="mb-8 p-2 hidden md:block">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="text-emerald-400" /> Finanças 2026
          </h1>
          <div className="text-[10px] text-slate-500 mt-1 truncate">
            {user?.email}
          </div>
        </div>

        {/* Espaçamento no mobile para não cobrir os botões com o header fixo */}
        <div className="md:hidden h-16" />

        <nav className="flex flex-col gap-2 flex-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`p-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeTab === item.id
                  ? 'bg-emerald-600 text-white'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={onExport}
            className="w-full p-3 rounded-lg flex items-center gap-3 text-blue-400 hover:bg-slate-800 hover:text-blue-300 transition-colors"
          >
            <Download size={20} /> Exportar
          </button>
          <button
            onClick={onToggleDarkMode}
            className="w-full p-3 rounded-lg flex items-center gap-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            {darkMode ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          <button
            onClick={onLogout}
            className="w-full p-3 rounded-lg flex items-center gap-3 text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} /> Sair
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
