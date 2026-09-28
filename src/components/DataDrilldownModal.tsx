import React, { useState } from 'react';
import { X, Download, Search, Table, FileSpreadsheet } from 'lucide-react';
import { exportToCSV } from '../utils/analyzer';

interface DataDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  rows: Record<string, any>[];
}

export const DataDrilldownModal: React.FC<DataDrilldownModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  rows
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const rowsPerPage = 12;

  if (!isOpen) return null;

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  // Filter rows by search term
  const filteredRows = rows.filter(row => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some(v => String(v || '').toLowerCase().includes(term));
  });

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleExport = () => {
    exportToCSV(filteredRows, `recorte_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Table className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">{title}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Registros originais auditáveis</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-blue-400 font-medium tabular-nums">{rows.length} registros</span>
                {subtitle && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{subtitle}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-blue-400" />
              <span>Exportar CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-900/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar nestes registros..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-mono tabular-nums">
            Exibindo {Math.min(filteredRows.length, (page - 1) * rowsPerPage + 1)}–{Math.min(filteredRows.length, page * rowsPerPage)} de {filteredRows.length} linhas
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6">
          {filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
              <FileSpreadsheet className="h-10 w-10 stroke-1 mb-2 text-slate-600" />
              <p className="text-sm">Nenhum registro encontrado com os critérios pesquisados.</p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300">
                    <th className="py-2.5 px-3 font-semibold text-slate-400 font-mono w-12 text-center">#</th>
                    {columns.map(col => (
                      <th key={col} className="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {paginatedRows.map((row, idx) => {
                    const rowNum = (page - 1) * rowsPerPage + idx + 1;
                    return (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-500 font-mono tabular-nums">
                          {rowNum}
                        </td>
                        {columns.map(col => {
                          const val = row[col];
                          const isNull = val === null || val === undefined || String(val).trim() === '';
                          return (
                            <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-300">
                              {isNull ? (
                                <span className="text-slate-600 italic font-mono text-[11px]">—</span>
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer / Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3 bg-slate-950/60">
            <span className="text-xs text-slate-400">
              Página <span className="font-mono text-slate-200 tabular-nums">{page}</span> de <span className="font-mono text-slate-200 tabular-nums">{totalPages}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 text-xs font-medium rounded border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
              >
                Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 text-xs font-medium rounded border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
