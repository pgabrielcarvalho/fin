import React from 'react';
import { MONTHS } from '../utils/formatters';

const MonthTabs = ({ selectedMonth, onChange }) => {
  return (
    <div className="sticky top-[57px] md:top-0 z-10 bg-slate-50 dark:bg-slate-900 py-2 -mx-4 px-4 md:-mx-8 md:px-8">
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        {MONTHS.map((month, index) => (
          <button
            key={index}
            onClick={() => onChange(index)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              selectedMonth === index
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {month}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MonthTabs;
