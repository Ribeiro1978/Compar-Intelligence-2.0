import { SheetData, FilterCondition, AggregationResult, CrossTabResult, CrossTabCell } from '../types';
import { parseNumericValue } from './importer';

/**
 * Universal Data Analyzer & Aggregator
 * Preserves exact raw rows for every metric and aggregated point for drill-down fidelity.
 */

export function applyFilters(rows: Record<string, any>[], filters: FilterCondition[]): Record<string, any>[] {
  if (!filters || filters.length === 0) return rows;

  return rows.filter(row => {
    return filters.every(f => {
      const cellVal = row[f.column];
      
      if (f.operator === 'is_empty') {
        return cellVal === null || cellVal === undefined || String(cellVal).trim() === '';
      }
      if (f.operator === 'is_not_empty') {
        return cellVal !== null && cellVal !== undefined && String(cellVal).trim() !== '';
      }

      const stringCell = cellVal !== null && cellVal !== undefined ? String(cellVal).trim() : '';
      const filterStr = String(f.value || '').trim();

      switch (f.operator) {
        case 'equals':
          return stringCell.toLowerCase() === filterStr.toLowerCase();
        case 'not_equals':
          return stringCell.toLowerCase() !== filterStr.toLowerCase();
        case 'contains':
          return stringCell.toLowerCase().includes(filterStr.toLowerCase());
        case 'in':
          if (Array.isArray(f.value)) {
            return f.value.map(v => String(v).toLowerCase()).includes(stringCell.toLowerCase());
          }
          return stringCell.toLowerCase() === filterStr.toLowerCase();
        case 'greater_than': {
          const numCell = parseNumericValue(cellVal);
          const numFilter = parseNumericValue(f.value);
          return numCell !== null && numFilter !== null && numCell > numFilter;
        }
        case 'less_than': {
          const numCell = parseNumericValue(cellVal);
          const numFilter = parseNumericValue(f.value);
          return numCell !== null && numFilter !== null && numCell < numFilter;
        }
        default:
          return true;
      }
    });
  });
}

/**
 * Universal Group By and Distribution
 * Never blurs or groups into arbitrary histograms when exact categories/values matter.
 */
export function aggregateByColumn(
  rows: Record<string, any>[],
  dimensionCol: string,
  metricCol?: string
): AggregationResult[] {
  const groups: Map<string, Record<string, any>[]> = new Map();

  for (const row of rows) {
    const rawVal = row[dimensionCol];
    const key = rawVal === null || rawVal === undefined || String(rawVal).trim() === ''
      ? '(Vazio / Não informado)'
      : String(rawVal).trim();

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  }

  const totalRowsCount = rows.length;
  const results: AggregationResult[] = [];

  for (const [groupValue, groupRows] of groups.entries()) {
    const count = groupRows.length;
    const percentage = totalRowsCount > 0 ? (count / totalRowsCount) * 100 : 0;

    let sum: number | undefined;
    let avg: number | undefined;
    let min: number | undefined;
    let max: number | undefined;

    if (metricCol) {
      const numericValues = groupRows
        .map(r => parseNumericValue(r[metricCol]))
        .filter((v): v is number => v !== null);

      if (numericValues.length > 0) {
        sum = numericValues.reduce((a, b) => a + b, 0);
        avg = sum / numericValues.length;
        min = Math.min(...numericValues);
        max = Math.max(...numericValues);
      }
    }

    results.push({
      groupValue,
      count,
      percentage,
      sum,
      avg,
      min,
      max,
      rows: groupRows // Backing data preserved in full
    });
  }

  // Sort descending by count or sum
  results.sort((a, b) => {
    if (metricCol && a.sum !== undefined && b.sum !== undefined) {
      return b.sum - a.sum;
    }
    return b.count - a.count;
  });

  return results;
}

/**
 * Cross-Tabulation Matrix (Tabela de Contingência / Cruzamento de Variáveis)
 * Example: Row = "Partido", Col = "Posicionamento"
 */
export function generateCrossTab(
  rows: Record<string, any>[],
  rowDimension: string,
  colDimension: string
): CrossTabResult {
  const rowValSet = new Set<string>();
  const colValSet = new Set<string>();

  // Extract labels
  for (const row of rows) {
    const rRaw = row[rowDimension];
    const rKey = rRaw === null || rRaw === undefined || String(rRaw).trim() === '' ? '(Vazio)' : String(rRaw).trim();
    rowValSet.add(rKey);

    const cRaw = row[colDimension];
    const cKey = cRaw === null || cRaw === undefined || String(cRaw).trim() === '' ? '(Vazio)' : String(cRaw).trim();
    colValSet.add(cKey);
  }

  const rowValues = Array.from(rowValSet).sort();
  const colValues = Array.from(colValSet).sort();

  const matrix: Record<string, Record<string, CrossTabCell>> = {};
  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  let grandTotal = 0;

  // Initialize matrix
  for (const r of rowValues) {
    matrix[r] = {};
    rowTotals[r] = 0;
    for (const c of colValues) {
      if (!colTotals[c]) colTotals[c] = 0;
      matrix[r][c] = {
        rowVal: r,
        colVal: c,
        count: 0,
        percentageOfTotal: 0,
        percentageOfRow: 0,
        rows: []
      };
    }
  }

  // Populate counts and row arrays
  for (const row of rows) {
    const rRaw = row[rowDimension];
    const rKey = rRaw === null || rRaw === undefined || String(rRaw).trim() === '' ? '(Vazio)' : String(rRaw).trim();

    const cRaw = row[colDimension];
    const cKey = cRaw === null || cRaw === undefined || String(cRaw).trim() === '' ? '(Vazio)' : String(cRaw).trim();

    if (matrix[rKey] && matrix[rKey][cKey]) {
      matrix[rKey][cKey].count++;
      matrix[rKey][cKey].rows.push(row);
      rowTotals[rKey]++;
      colTotals[cKey]++;
      grandTotal++;
    }
  }

  // Calculate percentages
  for (const r of rowValues) {
    const rTotal = rowTotals[r] || 0;
    for (const c of colValues) {
      const cell = matrix[r][c];
      cell.percentageOfTotal = grandTotal > 0 ? (cell.count / grandTotal) * 100 : 0;
      cell.percentageOfRow = rTotal > 0 ? (cell.count / rTotal) * 100 : 0;
    }
  }

  return {
    rowDimension,
    colDimension,
    rowValues,
    colValues,
    matrix,
    rowTotals,
    colTotals,
    grandTotal
  };
}

/**
 * Universal CSV Exporter
 */
export function exportToCSV(data: Array<Record<string, any>>, filename: string = 'export.csv') {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header line
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(';'));

  // Data lines
  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '""';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(';'));
  }

  const csvString = '\uFEFF' + csvRows.join('\r\n'); // Add BOM for Excel UTF-8 compliance
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
