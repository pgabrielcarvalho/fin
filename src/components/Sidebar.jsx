import React from 'react';
import {
  PieChart,
  Wallet,
  Banknote,
  Calendar,
  CreditCard,
  BarChart3,
  Plane,
  LogOut
} from 'lucide-react';

const Sidebar = ({ activeTab, onTabChange, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', icon: PieChart, label: 'Visão Geral' },
    { id: 'incomes', icon: Banknote, label: 'Receitas' },
    { id: 'monthly', icon: Calendar, label: 'Despesas Mensais' },
    { id: 'credit', icon: CreditCard, label: 'Gestão Cartão' },
    { id: 'yearly', icon: BarChart3, label: 'Visão Anual' },
    { id: 'vacation', icon: Plane, label: 'Fundo Férias' },
  ];

  return (
    <div className="w-full md:w-64 bg-slate-900 text-white flex flex-col p-4 md:h-screen sticky top-0 z-10">
      <div className="mb-8 p-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Wallet className="text-emerald-400" /> Finanças 2026
        </h1>
        <div className="text-[10px] text-slate-500 mt-1 truncate">
          {user?.email}
        </div>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
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

      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full p-3 rounded-lg flex items-center gap-3 text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
        >
          <LogOut size={20} /> Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
