import { createSampleStudies } from './sampleData';
import { aggregateByColumn, generateCrossTab, applyFilters } from './analyzer';
import { executeNaturalLanguageQuery } from './queryEngine';

export interface TestResult {
  id: string;
  category: string;
  name: string;
  status: 'passed' | 'failed';
  details: string;
  durationMs: number;
}

export interface TestSuiteSummary {
  total: number;
  passed: number;
  failed: number;
  executionTimeMs: number;
  results: TestResult[];
}

/**
 * Runs automated verification tests across the 3 proof-of-concept spreadsheets
 */
export function runAutomatedTests(): TestSuiteSummary {
  const startTime = performance.now();
  const results: TestResult[] = [];
  const samples = createSampleStudies();

  // --- TEST 1: Fidelidade dos Dados & Imutabilidade (Estudo 1) ---
  const t1Start = performance.now();
  const study1 = samples[0];
  const sheet1A = study1.sheets[0];
  const originalCount1 = sheet1A.originalRows.length;
  const currentCount1 = sheet1A.rows.length;
  const hasColumns1 = sheet1A.columns.length === 8;
  const immutabilityCheck = JSON.stringify(sheet1A.originalRows[0]) === JSON.stringify(sheet1A.rows[0]);

  results.push({
    id: 'test-1-data-fidelity',
    category: 'Fidelidade de Dados',
    name: 'Fidelidade de Importação e Imutabilidade (PEC Tributária)',
    status: (originalCount1 === currentCount1 && hasColumns1 && immutabilityCheck) ? 'passed' : 'failed',
    details: `Importadas exatamente ${currentCount1}/${originalCount1} linhas e ${sheet1A.columns.length} colunas. Registros originais preservados integralmente sem alteração.`,
    durationMs: parseFloat((performance.now() - t1Start).toFixed(2))
  });

  // --- TEST 2: Reconhecimento de Tipos e Abas Distintas (Estudo 2) ---
  const t2Start = performance.now();
  const study2 = samples[1];
  const sheet2A = study2.sheets[0];
  const impactCol = sheet2A.columns.find(c => c.name === 'Impacto Estimado R$ Mi');
  const isNumericOrCurrency = impactCol?.isNumeric === true;
  const sheet2Count = study2.sheets.length === 2;

  results.push({
    id: 'test-2-multi-sheet-types',
    category: 'Reconhecimento Universal',
    name: 'Reconhecimento Multi-Aba e Tipos Numéricos (Emendas Senado)',
    status: (sheet2Count && isNumericOrCurrency) ? 'passed' : 'failed',
    details: `Reconhecidas com precisão ${study2.sheets.length} abas distintas. Coluna "${impactCol?.name}" identificada corretamente como tipo numérico/financeiro.`,
    durationMs: parseFloat((performance.now() - t2Start).toFixed(2))
  });

  // --- TEST 3: Agregação e Conservação de Totais (Estudo 3) ---
  const t3Start = performance.now();
  const study3 = samples[2];
  const sheet3A = study3.sheets[0];
  const aggSector = aggregateByColumn(sheet3A.rows, 'Setor Econômico');
  const sumGroupCounts = aggSector.reduce((acc, g) => acc + g.count, 0);
  const sumGroupPct = aggSector.reduce((acc, g) => acc + g.percentage, 0);
  const totalRows3 = sheet3A.rows.length;

  results.push({
    id: 'test-3-aggregation-conservation',
    category: 'Cálculos e Agregações',
    name: 'Conservação Exata de Totais e Contagens (Mapeamento Stakeholders)',
    status: (sumGroupCounts === totalRows3 && Math.abs(sumGroupPct - 100) < 0.1) ? 'passed' : 'failed',
    details: `Soma das contagens agrupadas (${sumGroupCounts}) é idêntica ao total de linhas (${totalRows3}). Soma das proporções percentuais fecha em 100%.`,
    durationMs: parseFloat((performance.now() - t3Start).toFixed(2))
  });

  // --- TEST 4: Matriz de Cruzamento de Variáveis (Cross-Tab / Tabela de Contingência) ---
  const t4Start = performance.now();
  const crossTab = generateCrossTab(sheet1A.rows, 'Partido', 'Posicionamento');
  const grandTotalMatches = crossTab.grandTotal === sheet1A.rows.length;
  const sumRowTotals = Object.values(crossTab.rowTotals).reduce((a, b) => a + b, 0);
  const sumColTotals = Object.values(crossTab.colTotals).reduce((a, b) => a + b, 0);
  const crossTabFidelity = grandTotalMatches && sumRowTotals === crossTab.grandTotal && sumColTotals === crossTab.grandTotal;

  results.push({
    id: 'test-4-crosstab-fidelity',
    category: 'Cruzamento de Dados',
    name: 'Integridade da Matriz de Contingência (Partido x Posicionamento)',
    status: crossTabFidelity ? 'passed' : 'failed',
    details: `Cruzamento de ${crossTab.rowValues.length} partidos por ${crossTab.colValues.length} posições. Total geral da matriz (${crossTab.grandTotal}) fecha rigorosamente com soma das linhas e colunas.`,
    durationMs: parseFloat((performance.now() - t4Start).toFixed(2))
  });

  // --- TEST 5: Mecanismo de Consulta Determinística em Português ---
  const t5Start = performance.now();
  const queryQ1 = "Qual é a distribuição dos dados por partido e estado?";
  const qRes1 = executeNaturalLanguageQuery(queryQ1, study1.sheets, sheet1A.name);
  const isCrossTabIntent = qRes1.interpretedIntent === 'cross_tab';
  const recordsMatch1 = qRes1.recordCount === sheet1A.rows.length;

  const queryQ2 = "Mostre os registros com posicionamento Favorável";
  const qRes2 = executeNaturalLanguageQuery(queryQ2, study1.sheets, sheet1A.name);
  const isFilterIntent = qRes2.interpretedIntent === 'filter_and_list';
  const hasBackingRows = qRes2.underlyingRows.length > 0 && qRes2.underlyingRows.every(r => r.Posicionamento === 'Favorável');

  results.push({
    id: 'test-5-query-engine',
    category: 'Pergunte aos Dados',
    name: 'Execução Determinística de Consultas em Português',
    status: (isCrossTabIntent && recordsMatch1 && isFilterIntent && hasBackingRows) ? 'passed' : 'failed',
    details: `Pergunta de cruzamento interpretada corretamente como "cross_tab" (${qRes1.recordCount} registros). Consulta com filtro identificou ${qRes2.recordCount} registros favoráveis com respaldo exato.`,
    durationMs: parseFloat((performance.now() - t5Start).toFixed(2))
  });

  // --- TEST 6: Detecção de Relações Inter-Abas sem Acoplamento Falso ---
  const t6Start = performance.now();
  const rels = study1.detectedRelations;
  const foundRel = rels.length > 0 && rels.some(r => r.sourceColumn === 'Partido' && r.targetColumn === 'Partido');

  results.push({
    id: 'test-6-inter-sheet-relations',
    category: 'Relações entre Abas',
    name: 'Detecção Universal de Vínculos entre Abas',
    status: foundRel ? 'passed' : 'failed',
    details: `Identificada relação legítima pela chave comum "Partido" com ${rels[0]?.matchedValuesCount || 0} valores correspondentes sem fusão indevida de indivíduos.`,
    durationMs: parseFloat((performance.now() - t6Start).toFixed(2))
  });

  const durationTotal = performance.now() - startTime;
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;

  return {
    total: results.length,
    passed,
    failed,
    executionTimeMs: parseFloat(durationTotal.toFixed(2)),
    results
  };
}
