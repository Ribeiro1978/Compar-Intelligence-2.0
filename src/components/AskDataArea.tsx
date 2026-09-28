import React, { useState } from 'react';
import { 
  HelpCircle, 
  Send, 
  Sparkles, 
  AlertCircle, 
  Table, 
  Download, 
  Layers, 
  ChevronRight, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { StudyDataset, NaturalQueryOutput } from '../types';
import { executeNaturalLanguageQuery } from '../utils/queryEngine';
import { exportToCSV } from '../utils/analyzer';

interface AskDataAreaProps {
  study: StudyDataset;
  onDrilldown: (title: string, rows: Record<string, any>[], subtitle?: string) => void;
}

export const AskDataArea: React.FC<AskDataAreaProps> = ({ study, onDrilldown }) => {
  const [question, setQuestion] = useState('');
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [queryResult, setQueryResult] = useState<NaturalQueryOutput | null>(null);
  const [history, setHistory] = useState<Array<{ q: string; res: NaturalQueryOutput }>>([]);

  const currentSheet = study.sheets[activeSheetIndex] || study.sheets[0];

  // Suggested questions based on the active dataset's real columns
  const suggestedQuestions = [
    "Quantos registros pertencem a cada categoria?",
    "Quais parlamentares constam com posicionamento Favorável?",
    "Qual é a distribuição dos dados por partido e estado?",
    "Mostre os registros com relevância Alta",
    "Compare os resultados das abas selecionadas"
  ];

  const handleExecute = (qText: string) => {
    if (!qText.trim()) return;
    const res = executeNaturalLanguageQuery(qText, study.sheets, currentSheet?.name);
    setQueryResult(res);
    setHistory(prev => [{ q: qText, res }, ...prev.slice(0, 4)]);
  };

  const handleExportResult = () => {
    if (!queryResult) return;
    const dataToExport = queryResult.resultsTable || queryResult.underlyingRows;
    exportToCSV(dataToExport, `consulta_${queryResult.interpretedIntent}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              Pergunte aos Dados
            </h1>
            <p className="text-xs text-slate-400">
              Consultas determinísticas em linguagem natural (português do Brasil). Respostas auditadas com respaldo exato dos dados, sem invenções ou inferências ideológicas.
            </p>
          </div>
        </div>

        {/* Input box */}
        <div className="mt-5 relative">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecute(question);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ex: 'Qual é a distribuição dos dados por partido e estado?' ou 'Quantos registros pertencem a cada categoria?'"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 px-4 py-3 text-sm bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={!question.trim()}
              className="flex items-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl transition-colors shadow-md whitespace-nowrap"
            >
              <span>Consultar</span>
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Suggested Queries */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Sugestões:</span>
          {suggestedQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(sq);
                handleExecute(sq);
              }}
              className="text-xs text-slate-300 hover:text-white bg-slate-950/80 hover:bg-slate-800 border border-slate-800 px-2.5 py-1 rounded-md transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Query Result Card */}
      {queryResult && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 animate-in fade-in">
          {/* Status / Ambiguity Alert */}
          {queryResult.isAmbiguous ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-amber-200">
                  Esclarecimento Necessário
                </h3>
                <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                  {queryResult.ambiguityReason}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {queryResult.answerSummary}
                </p>
              </div>
            </div>
          ) : (
            <div>
              {/* Answer Headline */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                    <span>Consulta Determinística Executada</span>
                    <span aria-hidden="true">·</span>
                    <span>Aba: {queryResult.targetSheet}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-100">
                    {queryResult.understoodQuestion}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDrilldown(
                      `Registros da Consulta: "${queryResult.understoodQuestion}"`,
                      queryResult.underlyingRows,
                      `Total: ${queryResult.recordCount} registros`
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Table className="h-3.5 w-3.5 text-blue-400" />
                    <span>Ver Registros Originais ({queryResult.recordCount})</span>
                  </button>

                  <button
                    onClick={handleExportResult}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Exportar CSV</span>
                  </button>
                </div>
              </div>

              {/* Textual Synthesis Box */}
              <div className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Resposta Estruturada
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {queryResult.answerSummary}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
                  <span>Registros analisados: <strong className="text-blue-400 tabular-nums">{queryResult.recordCount}</strong></span>
                  {queryResult.appliedFilters.length > 0 && (
                    <span>Filtros aplicados: {queryResult.appliedFilters.map(f => `${f.column} = "${f.value}"`).join(', ')}</span>
                  )}
                  <span>Confiança do motor: {Math.round(queryResult.confidence * 100)}%</span>
                </div>
              </div>

              {/* Backing Table */}
              {queryResult.resultsTable && queryResult.resultsTable.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Tabela de Sustentação do Resultado
                    </span>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      {queryResult.resultsTable.length} linhas geradas
                    </span>
                  </div>

                  <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950/80">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300">
                          {Object.keys(queryResult.resultsTable[0]).map(col => (
                            <th key={col} className="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {queryResult.resultsTable.slice(0, 15).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            {Object.keys(queryResult.resultsTable![0]).map(col => (
                              <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-300 font-mono">
                                {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Query History */}
      {history.length > 1 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Consultas Recentes da Sessão
          </h3>
          <div className="space-y-2">
            {history.slice(1).map((item, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setQuestion(item.q);
                  setQueryResult(item.res);
                }}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800/80 bg-slate-950/50 hover:bg-slate-950 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs text-slate-200 font-medium">{item.q}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {item.res.recordCount} registros
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
