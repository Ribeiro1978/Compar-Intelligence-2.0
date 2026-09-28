import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Table, 
  PieChart, 
  Filter as FilterIcon, 
  Download, 
  Plus, 
  X, 
  Layers, 
  ChevronRight, 
  ArrowUpDown, 
  TrendingUp, 
  Search,
  Grid,
  FileSpreadsheet
} from 'lucide-react';
import { StudyDataset, FilterCondition, ChartType, AggregationResult } from '../types';
import { aggregateByColumn, generateCrossTab, applyFilters, exportToCSV } from '../utils/analyzer';

interface ExploreAreaProps {
  study: StudyDataset;
  onDrilldown: (title: string, rows: Record<string, any>[], subtitle?: string) => void;
}

export const ExploreArea: React.FC<ExploreAreaProps> = ({ study, onDrilldown }) => {
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const currentSheet = study.sheets[selectedSheetIndex] || study.sheets[0];

  // Dimension & Metric configuration
  const defaultDimension = currentSheet?.columns.find(c => c.inferredType === 'categorical' || c.legislativeRole === 'party' || c.legislativeRole === 'vote_position')?.name 
    || currentSheet?.columns[0]?.name 
    || '';

  const [dimensionCol, setDimensionCol] = useState<string>(defaultDimension);
  const [crossTabCol, setCrossTabCol] = useState<string>(''); // Optional 2nd variable
  const [metricCol, setMetricCol] = useState<string>(''); // Optional numeric measure
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Filters state
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [newFilterCol, setNewFilterCol] = useState('');
  const [newFilterVal, setNewFilterVal] = useState('');

  // Table search & sort state
  const [tableSearch, setTableSearch] = useState('');
  const [tableSortCol, setTableSortCol] = useState<string>('');
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('asc');
  const [tablePage, setTablePage] = useState(1);
  const pageSize = 10;

  // When sheet changes, reset dimension to suitable column
  const handleSheetChange = (idx: number) => {
    setSelectedSheetIndex(idx);
    const sheet = study.sheets[idx];
    if (sheet) {
      const best = sheet.columns.find(c => c.inferredType === 'categorical' || c.legislativeRole === 'party' || c.legislativeRole === 'vote_position')?.name || sheet.columns[0]?.name || '';
      setDimensionCol(best);
      setCrossTabCol('');
      setMetricCol('');
      setFilters([]);
      setTablePage(1);
    }
  };

  // Apply filters to current sheet rows
  const filteredRows = useMemo(() => {
    if (!currentSheet) return [];
    return applyFilters(currentSheet.rows, filters);
  }, [currentSheet, filters]);

  // Aggregate by dimension
  const aggregations: AggregationResult[] = useMemo(() => {
    if (!dimensionCol || filteredRows.length === 0) return [];
    return aggregateByColumn(filteredRows, dimensionCol, metricCol || undefined);
  }, [filteredRows, dimensionCol, metricCol]);

  // Generate cross-tabulation if crossTabCol is active
  const crossTabResult = useMemo(() => {
    if (!dimensionCol || !crossTabCol || filteredRows.length === 0) return null;
    return generateCrossTab(filteredRows, dimensionCol, crossTabCol);
  }, [filteredRows, dimensionCol, crossTabCol]);

  // Add filter handler
  const handleAddFilter = () => {
    if (!newFilterCol || !newFilterVal) return;
    setFilters(prev => [
      ...prev,
      {
        id: `f-${Date.now()}`,
        column: newFilterCol,
        operator: 'equals',
        value: newFilterVal
      }
    ]);
    setNewFilterVal('');
  };

  const handleRemoveFilter = (id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  };

  // Sorted & paginated table rows
  const displayedRows = useMemo(() => {
    let result = [...filteredRows];

    if (tableSearch) {
      const s = tableSearch.toLowerCase();
      result = result.filter(r => Object.values(r).some(v => String(v || '').toLowerCase().includes(s)));
    }

    if (tableSortCol) {
      result.sort((a, b) => {
        const valA = a[tableSortCol];
        const valB = b[tableSortCol];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        const res = String(valA).localeCompare(String(valB), undefined, { numeric: true });
        return tableSortDir === 'asc' ? res : -res;
      });
    }

    return result;
  }, [filteredRows, tableSearch, tableSortCol, tableSortDir]);

  const totalPages = Math.ceil(displayedRows.length / pageSize);
  const paginatedRows = displayedRows.slice((tablePage - 1) * pageSize, tablePage * pageSize);

  // Numeric columns available for metrics
  const numericColumns = currentSheet?.columns.filter(c => c.isNumeric) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sheet Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {study.sheets.map((sheet, idx) => (
            <button
              key={sheet.id}
              onClick={() => handleSheetChange(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedSheetIndex === idx
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{sheet.name}</span>
              <span className="font-mono text-[11px] bg-slate-950/60 px-1.5 py-0.5 rounded opacity-80">
                {sheet.rows.length} lins
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => exportToCSV(filteredRows, `${study.title}_${currentSheet?.name}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          title="Exportar dados filtrados em CSV"
        >
          <Download className="h-3.5 w-3.5 text-blue-400" />
          <span>Exportar Dados (CSV)</span>
        </button>
      </div>

      {/* Control Panel: Dimensions, Cross-Tab & Metrics */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Dimension 1 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              1. Coluna Principal (Dimensão)
            </label>
            <select
              value={dimensionCol}
              onChange={(e) => setDimensionCol(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
            >
              {currentSheet?.columns.map(col => (
                <option key={col.id} value={col.name}>
                  {col.name} ({col.userType})
                </option>
              ))}
            </select>
          </div>

          {/* Cross-Tab Dimension 2 (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              2. Cruzar com 2ª Variável (Opcional)
            </label>
            <select
              value={crossTabCol}
              onChange={(e) => {
                setCrossTabCol(e.target.value);
                if (e.target.value) setChartType('cross_table');
              }}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="">Nenhum (Visualização Unidimensional)</option>
              {currentSheet?.columns.filter(c => c.name !== dimensionCol).map(col => (
                <option key={col.id} value={col.name}>
                  {col.name} ({col.userType})
                </option>
              ))}
            </select>
          </div>

          {/* Metric / Numeric Calculation (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              3. Métrica de Valor (Opcional)
            </label>
            <select
              value={metricCol}
              onChange={(e) => setMetricCol(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="">Contagem de Registros (Frequência)</option>
              {numericColumns.map(col => (
                <option key={col.id} value={col.name}>
                  Soma de {col.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chart / View Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              4. Formato de Apresentação
            </label>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setChartType('bar')}
                title="Gráfico de Barras Verticais"
                className={`flex-1 flex items-center justify-center p-1.5 rounded transition-colors ${
                  chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('bar_horizontal')}
                title="Barras Horizontais (Ideal para partidos e categorias longas)"
                className={`flex-1 flex items-center justify-center p-1.5 rounded transition-colors ${
                  chartType === 'bar_horizontal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="h-4 w-4 rotate-90" />
              </button>
              <button
                onClick={() => setChartType('donut')}
                title="Distribuição Proporcional"
                className={`flex-1 flex items-center justify-center p-1.5 rounded transition-colors ${
                  chartType === 'donut' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PieChart className="h-4 w-4" />
              </button>
              <button
                onClick={() => setChartType('cross_table')}
                title="Tabela de Cruzamento / Matriz de Contingência"
                className={`flex-1 flex items-center justify-center p-1.5 rounded transition-colors ${
                  chartType === 'cross_table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Toggle & Applied Badges */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            >
              <FilterIcon className="h-3.5 w-3.5 text-blue-400" />
              <span>{isFilterPanelOpen ? 'Fechar Filtros' : 'Filtrar Dados'}</span>
              {filters.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-blue-600 text-white rounded text-[10px] font-mono">
                  {filters.length}
                </span>
              )}
            </button>

            {filters.map(f => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-blue-950/60 border border-blue-500/30 text-blue-300"
              >
                <span>{f.column} = "{f.value}"</span>
                <button
                  onClick={() => handleRemoveFilter(f.id)}
                  className="hover:text-white p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-mono tabular-nums">
            Analisando <strong className="text-blue-400">{filteredRows.length}</strong> de {currentSheet?.rows.length} registros
          </div>
        </div>

        {/* Filter Creation Form if expanded */}
        {isFilterPanelOpen && (
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-3 animate-in fade-in">
            <span className="text-xs font-semibold text-slate-300">Novo Filtro:</span>
            <select
              value={newFilterCol}
              onChange={(e) => setNewFilterCol(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200"
            >
              <option value="">Selecione a coluna...</option>
              {currentSheet?.columns.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>

            <span className="text-xs text-slate-400 font-mono">é igual a</span>

            <input
              type="text"
              placeholder="Valor a filtrar..."
              value={newFilterVal}
              onChange={(e) => setNewFilterVal(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 placeholder:text-slate-500"
            />

            <button
              onClick={handleAddFilter}
              disabled={!newFilterCol || !newFilterVal}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Aplicar</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards (Clickable for drill-down!) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => onDrilldown(`Total de Registros (${currentSheet?.name})`, filteredRows)}
          className="cursor-pointer p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-blue-500/50 hover:bg-slate-900 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total de Registros</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-100 tabular-nums">
            {filteredRows.length}
          </p>
          <span className="text-[11px] text-blue-400 mt-1 block">Clique para ver registros</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-400">Categorias Únicas</span>
          <p className="mt-2 text-2xl font-bold font-mono text-slate-100 tabular-nums">
            {aggregations.length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block truncate">na coluna {dimensionCol}</span>
        </div>

        {aggregations.length > 0 && (
          <div
            onClick={() => onDrilldown(`Registros de "${aggregations[0].groupValue}"`, aggregations[0].rows)}
            className="cursor-pointer p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-blue-500/50 hover:bg-slate-900 transition-all group"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Maior Concentração</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
            </div>
            <p className="mt-2 text-lg font-bold text-slate-100 truncate">
              {aggregations[0].groupValue}
            </p>
            <span className="text-[11px] font-mono text-blue-400 mt-1 block tabular-nums">
              {aggregations[0].count} registros ({aggregations[0].percentage.toFixed(1)}%)
            </span>
          </div>
        )}

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-400">Fidelidade aos Dados</span>
          <p className="mt-2 text-base font-bold text-emerald-400">
            Valores Exatos
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Sem aproximações ou histogramas
          </span>
        </div>
      </div>

      {/* Main Visualizations Area */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {crossTabCol 
                ? `Cruzamento de Variáveis: ${dimensionCol} × ${crossTabCol}` 
                : `Distribuição por ${dimensionCol}`
              }
            </h3>
            <p className="text-xs text-slate-400">
              Clique em qualquer barra, fatia ou célula para inspecionar os registros originais que compõem o indicador.
            </p>
          </div>

          <span className="text-xs font-mono text-blue-400 bg-blue-950/60 border border-blue-500/30 px-2.5 py-1 rounded-md">
            {filteredRows.length} registros analisados
          </span>
        </div>

        {/* 1. Bar Chart Vertical */}
        {chartType === 'bar' && !crossTabCol && (
          <div className="space-y-4">
            <div className="h-72 w-full flex items-end gap-3 pt-6 pb-2 px-2 overflow-x-auto border-b border-slate-800">
              {aggregations.map((item, idx) => {
                const maxCount = Math.max(...aggregations.map(a => a.count), 1);
                const heightPct = Math.max(12, (item.count / maxCount) * 100);

                return (
                  <div
                    key={idx}
                    onClick={() => onDrilldown(`Registros: ${dimensionCol} = "${item.groupValue}"`, item.rows)}
                    className="group relative flex-1 min-w-[50px] max-w-[90px] h-full flex flex-col justify-end items-center cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-[11px] font-mono px-2 py-1 rounded shadow-lg border border-slate-800 pointer-events-none whitespace-nowrap z-10">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full rounded-t-md bg-blue-600 group-hover:bg-blue-400 transition-all relative overflow-hidden flex items-end justify-center pb-2 shadow-sm"
                    >
                      <span className="text-[11px] font-mono font-bold text-white tabular-nums drop-shadow">
                        {item.count}
                      </span>
                    </div>

                    {/* Label below bar */}
                    <div className="mt-2 text-center w-full">
                      <span className="text-[11px] font-semibold text-slate-300 block truncate group-hover:text-blue-400 transition-colors" title={item.groupValue}>
                        {item.groupValue}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block tabular-nums">
                        {item.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Eixo horizontal: Categorias de "{dimensionCol}"</span>
              <span>Eixo vertical: Quantidade exata de ocorrências</span>
            </div>
          </div>
        )}

        {/* 2. Bar Chart Horizontal */}
        {chartType === 'bar_horizontal' && !crossTabCol && (
          <div className="space-y-3">
            {aggregations.map((item, idx) => {
              const maxCount = Math.max(...aggregations.map(a => a.count), 1);
              const widthPct = Math.max(5, (item.count / maxCount) * 100);

              return (
                <div
                  key={idx}
                  onClick={() => onDrilldown(`Registros: ${dimensionCol} = "${item.groupValue}"`, item.rows)}
                  className="group cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                      {item.groupValue}
                    </span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      <strong className="text-slate-200 font-semibold">{item.count}</strong> registros ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 group-hover:from-blue-500 group-hover:to-blue-300 rounded-full transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. Donut / Proportional Breakdown */}
        {chartType === 'donut' && !crossTabCol && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Donut representation */}
            <div className="flex flex-col items-center justify-center p-4">
              <div className="relative w-48 h-48 rounded-full border-8 border-slate-800 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-xs text-slate-400">Total</span>
                  <p className="text-2xl font-bold font-mono text-slate-100 tabular-nums">{filteredRows.length}</p>
                  <span className="text-[11px] text-blue-400 font-mono">100% dos dados</span>
                </div>
              </div>
            </div>

            {/* Category breakdown table */}
            <div className="space-y-2">
              {aggregations.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => onDrilldown(`Registros de "${item.groupValue}"`, item.rows)}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold text-slate-200">{item.groupValue}</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-slate-300">
                    <strong>{item.count}</strong> ({item.percentage.toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Cross-Tabulation Matrix (Tabela de Contingência) */}
        {(chartType === 'cross_table' || crossTabCol) && crossTabResult && (
          <div className="space-y-3">
            <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300">
                    <th className="py-2.5 px-3 font-bold text-blue-400 border-r border-slate-800">
                      {crossTabResult.rowDimension} ↓ \ {crossTabResult.colDimension} →
                    </th>
                    {crossTabResult.colValues.map(cVal => (
                      <th key={cVal} className="py-2.5 px-3 font-semibold text-slate-200 text-center whitespace-nowrap">
                        {cVal}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 font-bold text-slate-100 text-center border-l border-slate-800 bg-slate-900">
                      Total Linha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {crossTabResult.rowValues.map(rVal => {
                    const rowTotal = crossTabResult.rowTotals[rVal] || 0;
                    return (
                      <tr key={rVal} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-200 border-r border-slate-800 whitespace-nowrap">
                          {rVal}
                        </td>
                        {crossTabResult.colValues.map(cVal => {
                          const cell = crossTabResult.matrix[rVal][cVal];
                          const hasValue = cell && cell.count > 0;
                          return (
                            <td
                              key={cVal}
                              onClick={() => {
                                if (hasValue) {
                                  onDrilldown(
                                    `Cruzamento: ${dimensionCol} = "${rVal}" e ${crossTabCol} = "${cVal}"`,
                                    cell.rows,
                                    `Proporção: ${cell.percentageOfRow.toFixed(1)}% da linha`
                                  );
                                }
                              }}
                              className={`py-2 px-3 text-center font-mono tabular-nums ${
                                hasValue
                                  ? 'cursor-pointer font-bold text-blue-400 hover:bg-blue-600/20 hover:text-white transition-colors'
                                  : 'text-slate-600'
                              }`}
                            >
                              {hasValue ? cell.count : '—'}
                            </td>
                          );
                        })}
                        <td
                          onClick={() => {
                            const rowRows = crossTabResult.colValues.flatMap(c => crossTabResult.matrix[rVal][c].rows);
                            onDrilldown(`Todos os registros da linha: ${rVal}`, rowRows);
                          }}
                          className="py-2 px-3 text-center font-mono tabular-nums font-bold text-slate-100 border-l border-slate-800 bg-slate-900/40 cursor-pointer hover:bg-blue-600/20"
                        >
                          {rowTotal}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Column Totals Row */}
                  <tr className="border-t-2 border-slate-800 bg-slate-900/90 font-bold">
                    <td className="py-2.5 px-3 text-slate-100 border-r border-slate-800">
                      Total Coluna
                    </td>
                    {crossTabResult.colValues.map(cVal => (
                      <td
                        key={cVal}
                        onClick={() => {
                          const colRows = crossTabResult.rowValues.flatMap(r => crossTabResult.matrix[r][cVal].rows);
                          onDrilldown(`Todos os registros da coluna: ${cVal}`, colRows);
                        }}
                        className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-100 cursor-pointer hover:bg-blue-600/20"
                      >
                        {crossTabResult.colTotals[cVal] || 0}
                      </td>
                    ))}
                    <td
                      onClick={() => onDrilldown('Total Geral do Cruzamento', filteredRows)}
                      className="py-2.5 px-3 text-center font-mono tabular-nums text-blue-400 border-l border-slate-800 bg-slate-900 cursor-pointer hover:bg-blue-600/20"
                    >
                      {crossTabResult.grandTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 italic">
              Clique em qualquer número da matriz para abrir a lista detalhada de registros daquela interseção.
            </p>
          </div>
        )}
      </div>

      {/* Complete Data Table of Current Sheet */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Registros da Aba: {currentSheet?.name}
            </h3>
            <p className="text-xs text-slate-400">
              Tabela completa navegável com busca e ordenação.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar em todas as colunas..."
              value={tableSearch}
              onChange={(e) => { setTableSearch(e.target.value); setTablePage(1); }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300">
                <th className="py-2.5 px-3 font-mono text-slate-500 w-12 text-center">#</th>
                {currentSheet?.columns.map(col => (
                  <th
                    key={col.id}
                    onClick={() => {
                      if (tableSortCol === col.name) {
                        setTableSortDir(d => d === 'asc' ? 'desc' : 'asc');
                      } else {
                        setTableSortCol(col.name);
                        setTableSortDir('asc');
                      }
                    }}
                    className="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap cursor-pointer hover:text-blue-400 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.name}</span>
                      <ArrowUpDown className="h-3 w-3 text-slate-500" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {paginatedRows.map((row, rIdx) => {
                const rowNum = (tablePage - 1) * pageSize + rIdx + 1;
                return (
                  <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-500 font-mono tabular-nums">
                      {rowNum}
                    </td>
                    {currentSheet.columns.map(col => {
                      const val = row[col.name];
                      const isNull = val === null || val === undefined || String(val).trim() === '';
                      return (
                        <td key={col.id} className="py-2 px-3 whitespace-nowrap text-slate-300">
                          {isNull ? (
                            <span className="text-slate-600 italic">—</span>
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

        {/* Table Footer / Pagination */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
          <span>
            Exibindo <span className="font-mono text-slate-200 tabular-nums">{Math.min(displayedRows.length, (tablePage - 1) * pageSize + 1)}–{Math.min(displayedRows.length, tablePage * pageSize)}</span> de <span className="font-mono text-slate-200 tabular-nums">{displayedRows.length}</span> registros
          </span>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={tablePage <= 1}
                onClick={() => setTablePage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 text-xs font-medium rounded border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                disabled={tablePage >= totalPages}
                onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 text-xs font-medium rounded border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
