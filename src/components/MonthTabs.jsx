import React from 'react';
import { MONTHS } from '../utils/formatters';

const MonthTabs = ({ selectedMonth, onChange }) => {
  return (
    <div className="sticky -top-16 z-20 bg-slate-50 dark:bg-slate-900 pt-[4.5rem] pb-2 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-slate-100 dark:scrollbar-track-slate-800">
        {MONTHS.map((month, index) => (
          <button
            key={index}
            onClick={() => onChange(index)}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              selectedMonth === index
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
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
