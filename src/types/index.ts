export type ColumnDataType = 'text' | 'number' | 'percentage' | 'currency' | 'date' | 'categorical' | 'boolean';

export type LegislativeFieldRole = 
  | 'parliamentarian_name'
  | 'party'
  | 'state_uf'
  | 'vote_position'
  | 'research_classification'
  | 'numerical_estimate'
  | 'documented_fact'
  | 'general';

export interface ColumnMetadata {
  id: string;
  name: string;
  originalName: string;
  inferredType: ColumnDataType;
  userType: ColumnDataType; // Allows user override without mutating raw data
  sampleValues: (string | number | boolean | null)[];
  uniqueCount: number;
  emptyCount: number;
  totalCount: number;
  legislativeRole: LegislativeFieldRole;
  isNumeric: boolean;
}

export interface SheetData {
  id: string;
  name: string;
  columns: ColumnMetadata[];
  rows: Record<string, any>[];
  originalRows: Record<string, any>[];
  totalRows: number;
  emptyRowsCount: number;
  duplicateRowsCount: number;
  hasInconsistencies: boolean;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  type: 'duplicate' | 'empty_cells' | 'mixed_types' | 'ambiguous';
  column?: string;
  severity: 'warning' | 'info' | 'error';
  message: string;
  count?: number;
}

export interface SheetRelation {
  sourceSheet: string;
  sourceColumn: string;
  targetSheet: string;
  targetColumn: string;
  matchedValuesCount: number;
  confidenceScore: number; // 0 to 1
  reason: string;
}

export interface StudyDataset {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileSize?: string;
  importedAt: string;
  sheets: SheetData[];
  detectedRelations: SheetRelation[];
  isSample?: boolean;
}

export interface FilterCondition {
  id: string;
  column: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'is_empty' | 'is_not_empty';
  value: any;
}

export type ChartType = 'bar' | 'bar_horizontal' | 'stacked' | 'donut' | 'cross_table' | 'metric_cards';

export interface AggregationResult {
  groupValue: string;
  count: number;
  percentage: number;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  rows: Record<string, any>[];
}

export interface CrossTabCell {
  rowVal: string;
  colVal: string;
  count: number;
  percentageOfTotal: number;
  percentageOfRow: number;
  rows: Record<string, any>[];
}

export interface CrossTabResult {
  rowDimension: string;
  colDimension: string;
  rowValues: string[];
  colValues: string[];
  matrix: Record<string, Record<string, CrossTabCell>>;
  rowTotals: Record<string, number>;
  colTotals: Record<string, number>;
  grandTotal: number;
}

export interface NaturalQueryOutput {
  understoodQuestion: string;
  isAmbiguous: boolean;
  ambiguityReason?: string;
  interpretedIntent: 'count_by_group' | 'filter_and_list' | 'cross_tab' | 'compare_sheets' | 'top_rank' | 'summary';
  targetSheet: string;
  primaryColumn?: string;
  secondaryColumn?: string;
  metricColumn?: string;
  appliedFilters: FilterCondition[];
  answerSummary: string;
  recordCount: number;
  resultsTable?: Array<Record<string, any>>;
  underlyingRows: Record<string, any>[];
  confidence: number;
}

export interface ParliamentarianInfo {
  id: number | string;
  nome: string;
  nomeEleitoral?: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto?: string;
  email?: string;
  casa: 'Câmara' | 'Senado';
  situacao?: string;
  legislatura?: number;
}
