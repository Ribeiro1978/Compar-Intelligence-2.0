import * as XLSX from 'xlsx';
import { ColumnMetadata, ColumnDataType, SheetData, ValidationIssue, SheetRelation, LegislativeFieldRole } from '../types';

/**
 * Universal Importer for Excel (.xlsx, .xls) and CSV
 * Preserves original data faithfully while detecting structure, data types, anomalies, and inter-sheet relations.
 */

export async function parseSpreadsheetFile(file: File): Promise<{ sheets: SheetData[]; detectedRelations: SheetRelation[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: 'array',
    cellDates: true,
    raw: false,
    dateNF: 'yyyy-mm-dd'
  });

  const sheets: SheetData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert to JSON with original headers
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
      defval: null,
      raw: false,
    });

    if (rawRows.length === 0) {
      // Empty sheet
      sheets.push({
        id: `sheet-${sheetName}-${Date.now()}`,
        name: sheetName,
        columns: [],
        rows: [],
        originalRows: [],
        totalRows: 0,
        emptyRowsCount: 0,
        duplicateRowsCount: 0,
        hasInconsistencies: false,
        issues: [{
          type: 'empty_cells',
          severity: 'warning',
          message: 'Aba vazia ou sem linhas detectadas.'
        }]
      });
      continue;
    }

    // Extract all unique header keys present in the rows
    const headerSet = new Set<string>();
    rawRows.forEach(row => {
      Object.keys(row).forEach(key => headerSet.add(key.trim()));
    });
    const headerKeys = Array.from(headerSet);

    // Deep clone original rows to ensure raw fidelity is never mutated
    const originalRows = rawRows.map(r => ({ ...r }));

    // Cleaned rows (trimmed keys, preserve original values)
    const cleanedRows = rawRows.map(row => {
      const newRow: Record<string, any> = {};
      for (const key of headerKeys) {
        newRow[key] = row[key] !== undefined ? row[key] : null;
      }
      return newRow;
    });

    // Analyze each column
    const columns: ColumnMetadata[] = headerKeys.map(colName => {
      return analyzeColumn(colName, cleanedRows);
    });

    // Detect sheet-level validation issues
    const issues = detectSheetIssues(cleanedRows, columns);
    const duplicateCount = countDuplicates(cleanedRows);
    const emptyRowsCount = cleanedRows.filter(r => Object.values(r).every(v => v === null || v === '' || v === undefined)).length;

    sheets.push({
      id: `sheet-${sheetName}-${Math.random().toString(36).substring(2, 9)}`,
      name: sheetName,
      columns,
      rows: cleanedRows,
      originalRows,
      totalRows: cleanedRows.length,
      emptyRowsCount,
      duplicateRowsCount: duplicateCount,
      hasInconsistencies: issues.some(i => i.severity === 'warning' || i.severity === 'error'),
      issues
    });
  }

  // Detect inter-sheet relations
  const detectedRelations = detectRelations(sheets);

  return { sheets, detectedRelations };
}

/**
 * Analyze a single column to detect type, sample values, uniqueness, empty counts and legislative role
 */
export function analyzeColumn(colName: string, rows: Record<string, any>[]): ColumnMetadata {
  const totalCount = rows.length;
  const values: any[] = [];
  let emptyCount = 0;

  for (const row of rows) {
    const val = row[colName];
    if (val === null || val === undefined || String(val).trim() === '') {
      emptyCount++;
    } else {
      values.push(val);
    }
  }

  const uniqueValues = Array.from(new Set(values));
  const inferredType = inferDataType(values, colName);
  const sampleValues = uniqueValues.slice(0, 5);
  const legislativeRole = detectLegislativeRole(colName, sampleValues, inferredType);

  return {
    id: `col-${colName.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${Math.random().toString(36).substring(2, 5)}`,
    name: colName,
    originalName: colName,
    inferredType,
    userType: inferredType, // Defaults to inferred, user can override in conference screen
    sampleValues,
    uniqueCount: uniqueValues.length,
    emptyCount,
    totalCount,
    legislativeRole,
    isNumeric: inferredType === 'number' || inferredType === 'percentage' || inferredType === 'currency'
  };
}

/**
 * Intelligent type inference engine supporting Brazilian numeric conventions, currencies, and dates
 */
export function inferDataType(values: any[], colName: string): ColumnDataType {
  if (values.length === 0) return 'text';

  const lowerName = colName.toLowerCase();

  // Check if Boolean
  const booleanValues = new Set(['sim', 'não', 'nao', 'true', 'false', 's', 'n', 'v', 'f', '1', '0']);
  const isBoolCandidate = values.every(v => booleanValues.has(String(v).trim().toLowerCase()));
  if (isBoolCandidate && values.length > 0) return 'boolean';

  // Check if Percentage
  const percentagePatterns = values.filter(v => {
    const s = String(v).trim();
    return s.endsWith('%') || lowerName.includes('porcent') || lowerName.includes('taxa') || lowerName.includes('percent');
  });
  if (percentagePatterns.length > values.length * 0.7) {
    return 'percentage';
  }

  // Check if Currency
  const currencyPatterns = values.filter(v => {
    const s = String(v).trim();
    return s.startsWith('R$') || s.startsWith('$') || lowerName.includes('valor') || lowerName.includes('orcamento') || lowerName.includes('orçamento') || lowerName.includes('custo');
  });
  if (currencyPatterns.length > values.length * 0.7 && values.some(v => parseNumericValue(v) !== null)) {
    return 'currency';
  }

  // Check if Date
  let dateMatches = 0;
  for (const v of values.slice(0, 50)) {
    if (isDateValue(v)) dateMatches++;
  }
  if (dateMatches > (values.slice(0, 50).length * 0.75)) {
    return 'date';
  }

  // Check if Numeric
  let numericMatches = 0;
  for (const v of values) {
    if (parseNumericValue(v) !== null) {
      numericMatches++;
    }
  }
  if (numericMatches > values.length * 0.85) {
    return 'number';
  }

  // Check if Categorical (low cardinality text)
  const uniqueCount = new Set(values.map(String)).size;
  if (uniqueCount <= 25 && uniqueCount < values.length * 0.6) {
    return 'categorical';
  }

  return 'text';
}

/**
 * Helper to safely extract float/number from raw text with Brazilian comma decimal support
 */
export function parseNumericValue(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;

  let s = String(val).trim();
  // Strip currency prefixes and spaces
  s = s.replace(/^[R$€£\s]+/, '').replace(/%$/, '').trim();

  // Brazilian format: 1.250,50 -> 1250.50
  if (/^\d{1,3}(\.\d{3})*,\d+$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+,\d+$/.test(s)) {
    s = s.replace(',', '.');
  }

  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}

function isDateValue(val: any): boolean {
  if (val instanceof Date && !isNaN(val.getTime())) return true;
  const s = String(val).trim();
  // DD/MM/YYYY or YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return true;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return true;
  const parsed = Date.parse(s);
  return !isNaN(parsed) && s.length >= 8 && /\d/.test(s);
}

/**
 * Recognizes legislative domain roles without hardcoding any specific PEC or project
 */
export function detectLegislativeRole(name: string, samples: any[], type: ColumnDataType): LegislativeFieldRole {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (n.includes('deputad') || n.includes('senador') || n.includes('parlamentar') || (n.includes('nome') && (n.includes('polit') || n.includes('autor') || n.includes('lider')))) {
    return 'parliamentarian_name';
  }
  if (n.includes('partido') || n.includes('sigla_partido') || n === 'legenda' || n === 'sigla') {
    return 'party';
  }
  if (n.includes('uf') || n.includes('estado') || n.includes('siglauf') || n === 'regiao') {
    return 'state_uf';
  }
  if (n.includes('voto') || n.includes('posicionamento') || n.includes('posicao') || n.includes('orientacao') || n.includes('parecer')) {
    return 'vote_position';
  }
  if (n.includes('tendencia') || n.includes('classificacao') || n.includes('alinhamento') || n.includes('governismo') || n.includes('perfil') || n.includes('influencia')) {
    return 'research_classification';
  }
  if (n.includes('probabilidade') || n.includes('estimativa') || n.includes('peso') || n.includes('chance') || n.includes('score') || n.includes('impacto')) {
    return 'numerical_estimate';
  }
  if (n.includes('proposicao') || n.includes('projeto') || n.includes('comissao') || n.includes('emenda') || n.includes('data') || n.includes('protocolo')) {
    return 'documented_fact';
  }

  return 'general';
}

/**
 * Check for duplicate rows, empty cells, and ambiguous classifications
 */
export function detectSheetIssues(rows: Record<string, any>[], columns: ColumnMetadata[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1. Duplicate rows
  const dupCount = countDuplicates(rows);
  if (dupCount > 0) {
    issues.push({
      type: 'duplicate',
      severity: 'warning',
      message: `${dupCount} linha(s) completamente idêntica(s) detectada(s) nesta aba.`,
      count: dupCount
    });
  }

  // 2. High empty cell columns
  for (const col of columns) {
    if (col.emptyCount > 0) {
      const pct = (col.emptyCount / col.totalCount) * 100;
      if (pct > 40) {
        issues.push({
          type: 'empty_cells',
          column: col.name,
          severity: 'warning',
          message: `Coluna "${col.name}" possui ${col.emptyCount} células vazias (${pct.toFixed(1)}% do total).`,
          count: col.emptyCount
        });
      } else if (pct > 0) {
        issues.push({
          type: 'empty_cells',
          column: col.name,
          severity: 'info',
          message: `Coluna "${col.name}" possui ${col.emptyCount} células vazias.`,
          count: col.emptyCount
        });
      }
    }
  }

  // 3. Ambiguous classifications
  for (const col of columns) {
    if (col.inferredType === 'categorical' || col.inferredType === 'text') {
      const samples = col.sampleValues.map(s => String(s).trim().toLowerCase());
      const hasSimNaoAndText = samples.some(s => s === 'sim' || s === 'não') && samples.some(s => s === 'indeciso' || s === 'ausente');
      if (hasSimNaoAndText) {
        issues.push({
          type: 'ambiguous',
          column: col.name,
          severity: 'info',
          message: `Coluna "${col.name}" mistura respostas binárias com termos condicionais ou ausências.`
        });
      }
    }
  }

  return issues;
}

function countDuplicates(rows: Record<string, any>[]): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const row of rows) {
    const serialized = JSON.stringify(row);
    if (seen.has(serialized)) {
      duplicates++;
    } else {
      seen.add(serialized);
    }
  }
  return duplicates;
}

/**
 * Detect relationships across sheets based on identifier, common names or foreign keys
 * Strictly adheres to rule: NEVER combine records of different people by simple fuzzy name.
 */
export function detectRelations(sheets: SheetData[]): SheetRelation[] {
  const relations: SheetRelation[] = [];

  for (let i = 0; i < sheets.length; i++) {
    for (let j = i + 1; j < sheets.length; j++) {
      const sheetA = sheets[i];
      const sheetB = sheets[j];

      for (const colA of sheetA.columns) {
        for (const colB of sheetB.columns) {
          const nameA = colA.name.toLowerCase().trim();
          const nameB = colB.name.toLowerCase().trim();

          const exactNameMatch = nameA === nameB;
          const legislativeKeyMatch = 
            (colA.legislativeRole === 'parliamentarian_name' && colB.legislativeRole === 'parliamentarian_name') ||
            (colA.legislativeRole === 'party' && colB.legislativeRole === 'party') ||
            (colA.legislativeRole === 'state_uf' && colB.legislativeRole === 'state_uf');

          if (exactNameMatch || legislativeKeyMatch) {
            // Check value overlap
            const setA = new Set(sheetA.rows.map(r => String(r[colA.name] || '').trim().toLowerCase()).filter(Boolean));
            const setB = new Set(sheetB.rows.map(r => String(r[colB.name] || '').trim().toLowerCase()).filter(Boolean));

            let matchCount = 0;
            setA.forEach(val => {
              if (setB.has(val)) matchCount++;
            });

            if (matchCount > 0) {
              const minSize = Math.min(setA.size, setB.size);
              const confidence = minSize > 0 ? matchCount / minSize : 0;

              if (confidence >= 0.25 || exactNameMatch) {
                relations.push({
                  sourceSheet: sheetA.name,
                  sourceColumn: colA.name,
                  targetSheet: sheetB.name,
                  targetColumn: colB.name,
                  matchedValuesCount: matchCount,
                  confidenceScore: parseFloat(confidence.toFixed(2)),
                  reason: exactNameMatch 
                    ? `Mesmo nome de coluna ("${colA.name}") com ${matchCount} valores em comum entre as abas.`
                    : `Correspondência semântica de ${colA.legislativeRole} com ${matchCount} valores idênticos compartilhados.`
                });
              }
            }
          }
        }
      }
    }
  }

  return relations;
}
