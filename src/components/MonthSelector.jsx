import { MONTHS } from '../utils/formatters';

const MonthSelector = ({ selectedMonth, onChange }) => {
  return (
    <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <span className="text-slate-500 dark:text-slate-400 text-sm font-medium pl-2">Mês:</span>
      <select
        value={selectedMonth}
        onChange={(e) => onChange(Number(e.target.value))}
        className="p-2 border-none bg-transparent font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
        aria-label="Selecionar mês"
      >
        {MONTHS.map((month, index) => (
          <option key={index} value={index}>
            {month}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MonthSelector;
