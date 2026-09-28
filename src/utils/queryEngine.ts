import { SheetData, NaturalQueryOutput, FilterCondition } from '../types';
import { aggregateByColumn, generateCrossTab, applyFilters } from './analyzer';

/**
 * Deterministic Natural Language Query Engine for Brazilian Portuguese
 * Interprets questions deterministically, extracts columns and filters, executes exact queries,
 * and preserves the exact backing records without ever inventing data or hallucinations.
 */

export function executeNaturalLanguageQuery(
  rawQuestion: string,
  sheets: SheetData[],
  activeSheetName?: string
): NaturalQueryOutput {
  const qClean = rawQuestion.trim();
  const qNorm = normalize(qClean);

  if (!qClean) {
    return {
      understoodQuestion: rawQuestion,
      isAmbiguous: true,
      ambiguityReason: 'Por favor, digite uma pergunta sobre os dados da planilha.',
      interpretedIntent: 'summary',
      targetSheet: activeSheetName || (sheets[0]?.name ?? ''),
      appliedFilters: [],
      answerSummary: 'Nenhuma pergunta informada.',
      recordCount: 0,
      underlyingRows: [],
      confidence: 0
    };
  }

  // 1. Determine Target Sheet
  let targetSheet = sheets.find(s => s.name === activeSheetName) || sheets[0];
  for (const s of sheets) {
    if (qNorm.includes(normalize(s.name))) {
      targetSheet = s;
      break;
    }
  }

  if (!targetSheet || targetSheet.rows.length === 0) {
    return {
      understoodQuestion: qClean,
      isAmbiguous: true,
      ambiguityReason: 'Nenhuma aba com dados disponível para consulta.',
      interpretedIntent: 'summary',
      targetSheet: '',
      appliedFilters: [],
      answerSummary: 'Planilha sem dados para consulta.',
      recordCount: 0,
      underlyingRows: [],
      confidence: 0
    };
  }

  // 2. Detect Intent: Cross-Sheet Comparison
  if (qNorm.includes('compar') && (qNorm.includes('aba') || qNorm.includes('planilha') || sheets.length > 1 && qNorm.includes('entre'))) {
    return handleCrossSheetComparison(qClean, sheets);
  }

  // Find matching columns in the target sheet
  const availableColumns = targetSheet.columns;

  // 3. Detect Intent: Cross-Tabulation (cruzamento de 2 variáveis: e.g. "distribuição por partido e estado", "cruze X com Y")
  const crossTabMatch = detectCrossTabIntent(qNorm, availableColumns);
  if (crossTabMatch) {
    const { col1, col2 } = crossTabMatch;
    const crossRes = generateCrossTab(targetSheet.rows, col1.name, col2.name);

    // Build tabular matrix for presentation
    const resultsTable: Record<string, any>[] = crossRes.rowValues.map(rVal => {
      const rowItem: Record<string, any> = { [col1.name]: rVal };
      for (const cVal of crossRes.colValues) {
        rowItem[cVal] = crossRes.matrix[rVal][cVal]?.count || 0;
      }
      rowItem['Total Linha'] = crossRes.rowTotals[rVal] || 0;
      return rowItem;
    });

    return {
      understoodQuestion: `Cruzamento de dados entre "${col1.name}" e "${col2.name}" na aba "${targetSheet.name}"`,
      isAmbiguous: false,
      interpretedIntent: 'cross_tab',
      targetSheet: targetSheet.name,
      primaryColumn: col1.name,
      secondaryColumn: col2.name,
      appliedFilters: [],
      answerSummary: `Cruzamento completo realizado entre as variáveis "${col1.name}" (${crossRes.rowValues.length} categorias) e "${col2.name}" (${crossRes.colValues.length} categorias) sobre um total de ${crossRes.grandTotal} registros analisados.`,
      recordCount: crossRes.grandTotal,
      resultsTable,
      underlyingRows: targetSheet.rows,
      confidence: 0.95
    };
  }

  // 4. Extract Explicit Filters from Question
  const { filters, detectedFilterPhrases } = extractFiltersFromQuestion(qNorm, targetSheet);

  // 5. Detect Intent: Filter and List (e.g. "quais parlamentares constam na categoria X", "mostre os registros que...")
  const isListingQuery = qNorm.startsWith('quais') || qNorm.startsWith('quem') || qNorm.includes('mostre') || qNorm.includes('liste') || qNorm.includes('relacione');

  // Filter rows
  const filteredRows = applyFilters(targetSheet.rows, filters);

  if (isListingQuery) {
    // If listing query
    const nameCol = availableColumns.find(c => c.legislativeRole === 'parliamentarian_name') || availableColumns[0];
    const resultsTable = filteredRows.map(r => ({ ...r }));

    let summaryText = `Foram encontrados ${filteredRows.length} registros`;
    if (filters.length > 0) {
      summaryText += ` que atendem às condições solicitadas (${filters.map(f => `"${f.column}" = "${f.value}"`).join(' e ')})`;
    }
    summaryText += ` na aba "${targetSheet.name}".`;

    return {
      understoodQuestion: qClean,
      isAmbiguous: false,
      interpretedIntent: 'filter_and_list',
      targetSheet: targetSheet.name,
      primaryColumn: nameCol?.name,
      appliedFilters: filters,
      answerSummary: summaryText,
      recordCount: filteredRows.length,
      resultsTable,
      underlyingRows: filteredRows,
      confidence: 0.92
    };
  }

  // 6. Detect Group / Distribution queries (e.g. "quantos registros pertencem a cada categoria", "distribuição por partido")
  const groupCol = detectGroupingColumn(qNorm, availableColumns);

  if (groupCol) {
    const agg = aggregateByColumn(filteredRows, groupCol.name);
    const resultsTable = agg.map(a => ({
      [groupCol.name]: a.groupValue,
      'Quantidade de Registros': a.count,
      'Proporção (%)': `${a.percentage.toFixed(1)}%`
    }));

    const topCategory = agg[0];
    const topSummary = topCategory ? ` A maior concentração é "${topCategory.groupValue}" com ${topCategory.count} registros (${topCategory.percentage.toFixed(1)}%).` : '';

    return {
      understoodQuestion: `Distribuição de registros por "${groupCol.name}" na aba "${targetSheet.name}"`,
      isAmbiguous: false,
      interpretedIntent: 'count_by_group',
      targetSheet: targetSheet.name,
      primaryColumn: groupCol.name,
      appliedFilters: filters,
      answerSummary: `Distribuição calculada por "${groupCol.name}" com ${agg.length} categorias identificadas sobre ${filteredRows.length} registros.${topSummary}`,
      recordCount: filteredRows.length,
      resultsTable,
      underlyingRows: filteredRows,
      confidence: 0.94
    };
  }

  // 7. General summary query (e.g. "quantos registros", "total", "resumo")
  if (qNorm.includes('quantos') || qNorm.includes('total') || qNorm.includes('resumo') || qNorm.includes('visao geral')) {
    const mainCategorical = availableColumns.find(c => c.inferredType === 'categorical') || availableColumns[0];
    const agg = mainCategorical ? aggregateByColumn(filteredRows, mainCategorical.name) : [];
    
    return {
      understoodQuestion: `Visão geral e totalização da aba "${targetSheet.name}"`,
      isAmbiguous: false,
      interpretedIntent: 'summary',
      targetSheet: targetSheet.name,
      appliedFilters: filters,
      answerSummary: `A aba "${targetSheet.name}" contém um total de ${targetSheet.rows.length} registros originais distribuídos em ${availableColumns.length} colunas (${availableColumns.map(c => c.name).join(', ')}).`,
      recordCount: filteredRows.length,
      resultsTable: agg.map(a => ({
        [mainCategorical?.name || 'Item']: a.groupValue,
        'Registros': a.count,
        '%': `${a.percentage.toFixed(1)}%`
      })),
      underlyingRows: filteredRows,
      confidence: 0.90
    };
  }

  // 8. If unclear, prompt user for clarification without hallucinating
  return {
    understoodQuestion: qClean,
    isAmbiguous: true,
    ambiguityReason: `Não foi possível identificar com exatidão qual coluna ou cruzamento você deseja analisar na aba "${targetSheet.name}". As colunas disponíveis são: ${availableColumns.map(c => `"${c.name}"`).join(', ')}.`,
    interpretedIntent: 'summary',
    targetSheet: targetSheet.name,
    appliedFilters: filters,
    answerSummary: `Por favor, especifique a coluna desejada (exemplo: "Qual a distribuição por ${availableColumns[1]?.name || 'Partido'}?" ou "Mostre os registros onde ${availableColumns[0]?.name || 'Status'} é...")`,
    recordCount: targetSheet.rows.length,
    underlyingRows: targetSheet.rows,
    confidence: 0.4
  };
}

/**
 * Handle cross-sheet comparison
 */
function handleCrossSheetComparison(qClean: string, sheets: SheetData[]): NaturalQueryOutput {
  if (sheets.length < 2) {
    return {
      understoodQuestion: qClean,
      isAmbiguous: true,
      ambiguityReason: 'O estudo atual possui apenas uma aba, impossibilitando comparação entre abas.',
      interpretedIntent: 'compare_sheets',
      targetSheet: sheets[0]?.name || '',
      appliedFilters: [],
      answerSummary: 'Apenas uma aba presente no estudo.',
      recordCount: sheets[0]?.rows.length || 0,
      underlyingRows: sheets[0]?.rows || [],
      confidence: 0.5
    };
  }

  const comparisonTable = sheets.map(s => ({
    'Aba': s.name,
    'Total de Linhas': s.rows.length,
    'Total de Colunas': s.columns.length,
    'Colunas Presentes': s.columns.map(c => c.name).join(', '),
    'Linhas Duplicadas': s.duplicateRowsCount,
    'Alertas de Validação': s.issues.length
  }));

  const allRows = sheets.flatMap(s => s.rows);

  return {
    understoodQuestion: `Comparação estrutural entre as abas do estudo: ${sheets.map(s => s.name).join(' vs ')}`,
    isAmbiguous: false,
    interpretedIntent: 'compare_sheets',
    targetSheet: 'Todas as abas',
    appliedFilters: [],
    answerSummary: `Comparativo entre ${sheets.length} abas identificadas no arquivo. Foram mapeadas ${sheets.reduce((acc, s) => acc + s.rows.length, 0)} linhas totais entre as fontes de dados.`,
    recordCount: allRows.length,
    resultsTable: comparisonTable,
    underlyingRows: allRows,
    confidence: 0.95
  };
}

/**
 * Detect cross-tabulation intent (2 variables to cross)
 */
function detectCrossTabIntent(qNorm: string, columns: any[]) {
  // Looks for patterns like "por X e Y", "entre X e Y", "cruzar X com Y", "partido e estado"
  const connectors = [' e ', ' com ', ' por ', ' x '];

  for (let i = 0; i < columns.length; i++) {
    for (let j = 0; j < columns.length; j++) {
      if (i === j) continue;
      const colA = columns[i];
      const colB = columns[j];

      const normA = normalize(colA.name);
      const normB = normalize(colB.name);

      // Check if both column names or synonyms are in question
      const hasA = qNorm.includes(normA) || matchColumnSynonym(qNorm, colA);
      const hasB = qNorm.includes(normB) || matchColumnSynonym(qNorm, colB);

      if (hasA && hasB) {
        return { col1: colA, col2: colB };
      }
    }
  }

  // Common legislative cross check shortcut: "partido e estado" or "partido e voto"
  const partyCol = columns.find(c => c.legislativeRole === 'party');
  const ufCol = columns.find(c => c.legislativeRole === 'state_uf');
  const voteCol = columns.find(c => c.legislativeRole === 'vote_position');

  if (partyCol && ufCol && (qNorm.includes('partido') && (qNorm.includes('estado') || qNorm.includes('uf')))) {
    return { col1: partyCol, col2: ufCol };
  }
  if (partyCol && voteCol && (qNorm.includes('partido') && (qNorm.includes('voto') || qNorm.includes('posicionamento')))) {
    return { col1: partyCol, col2: voteCol };
  }

  return null;
}

/**
 * Detect grouping column
 */
function detectGroupingColumn(qNorm: string, columns: any[]) {
  // Check exact column names first
  for (const col of columns) {
    if (qNorm.includes(normalize(col.name))) {
      return col;
    }
  }

  // Check synonyms
  for (const col of columns) {
    if (matchColumnSynonym(qNorm, col)) {
      return col;
    }
  }

  // If question says "categoria" and there's a categorical column
  if (qNorm.includes('categoria') || qNorm.includes('tipo') || qNorm.includes('posicionamento')) {
    const candidate = columns.find(c => c.inferredType === 'categorical' || c.legislativeRole === 'vote_position');
    if (candidate) return candidate;
  }

  return null;
}

function matchColumnSynonym(qNorm: string, col: any): boolean {
  const role = col.legislativeRole;
  if (role === 'party' && (qNorm.includes('partido') || qNorm.includes('legenda') || qNorm.includes('sigla'))) return true;
  if (role === 'state_uf' && (qNorm.includes('estado') || qNorm.includes('uf') || qNorm.includes('regiao'))) return true;
  if (role === 'vote_position' && (qNorm.includes('voto') || qNorm.includes('posicao') || qNorm.includes('posicionamento') || qNorm.includes('parecer'))) return true;
  if (role === 'parliamentarian_name' && (qNorm.includes('parlamentar') || qNorm.includes('deputado') || qNorm.includes('senador') || qNorm.includes('nome'))) return true;
  return false;
}

/**
 * Extract filters mentioned in question
 */
function extractFiltersFromQuestion(qNorm: string, sheet: SheetData): { filters: FilterCondition[]; detectedFilterPhrases: string[] } {
  const filters: FilterCondition[] = [];
  const detectedFilterPhrases: string[] = [];

  // Check unique values in categorical columns to see if user mentions them directly!
  for (const col of sheet.columns) {
    if (col.inferredType === 'categorical' || col.legislativeRole === 'vote_position' || col.legislativeRole === 'party' || col.legislativeRole === 'state_uf') {
      // Get all unique values in this column
      const uniqueVals = Array.from(new Set(sheet.rows.map(r => r[col.name]).filter(v => v !== null && v !== undefined)));
      for (const val of uniqueVals) {
        const strVal = String(val).trim();
        const normVal = normalize(strVal);
        if (normVal.length >= 2) {
          // Word boundary or containment check
          const regex = new RegExp(`\\b${escapeRegExp(normVal)}\\b`, 'i');
          if (regex.test(qNorm)) {
            // Found a filter!
            filters.push({
              id: `f-${col.name}-${strVal}`,
              column: col.name,
              operator: 'equals',
              value: strVal
            });
            detectedFilterPhrases.push(`"${col.name}" = ${strVal}`);
            break; // One per column to avoid conflicts
          }
        }
      }
    }
  }

  return { filters, detectedFilterPhrases };
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
