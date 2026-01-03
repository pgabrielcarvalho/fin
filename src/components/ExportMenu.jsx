import React, { useState } from 'react';
import { Download, FileJson, FileText, Printer, Upload, X } from 'lucide-react';
import { MONTHS } from '../utils/formatters';

const ExportMenu = ({
  isOpen,
  onClose,
  onExport,
  onImport,
  selectedMonth,
  onMonthChange
}) => {
  const [exportType, setExportType] = useState('current'); // 'current' ou 'annual'

  if (!isOpen) return null;

  const handleExport = (format) => {
    const month = exportType === 'current' ? selectedMonth : null;
    onExport(format, month);
    onClose();
  };

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        onImport(file);
        onClose();
      }
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-slate-800">Exportar/Importar Dados</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tipo de Exportação */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Período
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="current"
                  checked={exportType === 'current'}
                  onChange={(e) => setExportType(e.target.value)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700">Mês atual ({MONTHS[selectedMonth]})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="annual"
                  checked={exportType === 'annual'}
                  onChange={(e) => setExportType(e.target.value)}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700">Ano completo</span>
              </label>
            </div>
          </div>

          {/* Botões de Exportação */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Exportar como
            </label>
            <div className="space-y-2">
              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
              >
                <FileJson size={20} />
                <div className="text-left">
                  <div className="font-semibold">Backup JSON</div>
                  <div className="text-xs text-blue-600">Todos os dados para backup completo</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
              >
                <FileText size={20} />
                <div className="text-left">
                  <div className="font-semibold">Relatório CSV</div>
                  <div className="text-xs text-green-600">Planilha para Excel/Google Sheets</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('pdf')}
                disabled={exportType === 'annual'}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  exportType === 'annual'
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-red-50 hover:bg-red-100 text-red-700'
                }`}
              >
                <Printer size={20} />
                <div className="text-left">
                  <div className="font-semibold">Imprimir PDF</div>
                  <div className="text-xs">Relatório formatado para impressão</div>
                </div>
              </button>
            </div>
          </div>

          {/* Importação */}
          <div className="border-t pt-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Importar dados
            </label>
            <button
              onClick={handleImportClick}
              className="w-full flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
            >
              <Upload size={20} />
              <div className="text-left">
                <div className="font-semibold">Restaurar Backup</div>
                <div className="text-xs text-purple-600">Importar arquivo JSON de backup</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportMenu;
