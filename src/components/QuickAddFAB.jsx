import React from 'react';
import { Plus } from 'lucide-react';

const QuickAddFAB = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center active:scale-95"
      title="Adicionar item"
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
};

export default QuickAddFAB;
