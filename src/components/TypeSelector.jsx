
const TypeSelector = ({ options, value, onChange, activeColor = 'indigo' }) => {
  const colorMap = {
    indigo: 'bg-indigo-600 text-white shadow-sm',
    emerald: 'bg-emerald-600 text-white shadow-sm',
    amber: 'bg-amber-600 text-white shadow-sm',
  };

  const activeClass = colorMap[activeColor] || colorMap.indigo;

  return (
    <div className="inline-flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 gap-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
            value === option.value
              ? activeClass
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default TypeSelector;
