import React from 'react';
import { Database, Plus, FileSpreadsheet, ArrowRight, Download, Check, Sparkles, AlertTriangle, Layers, GitFork } from 'lucide-react';
import { StudyDataset } from '../types';
import { downloadSampleAsExcel } from '../utils/sampleData';

interface StudiesAreaProps {
  studies: StudyDataset[];
  activeStudyId: string;
  onSelectStudy: (id: string) => void;
  onNavigateToImport: () => void;
  onNavigateToExplore: () => void;
}

export const StudiesArea: React.FC<StudiesAreaProps> = ({
  studies,
  activeStudyId,
  onSelectStudy,
  onNavigateToImport,
  onNavigateToExplore
}) => {
  const activeStudy = studies.find(s => s.id === activeStudyId) || studies[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Hero */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 p-6 lg:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-950/60 border border-blue-500/30 px-2.5 py-1 rounded-md mb-3">
            <span>Inteligência de Dados & Consultoria Governamental</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Plataforma Universal de Análise Legislativa & Planilhas
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Mecanismo universal orientado à fidelidade dos dados. O sistema se adapta rigorosamente à estrutura de qualquer planilha Excel ou CSV, sem regras engessadas por proposição ou modelo prévio.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToImport}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/30 rounded-lg shadow-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Importar Nova Planilha</span>
            </button>

            {activeStudy && (
              <button
                onClick={onNavigateToExplore}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              >
                <span>Explorar Estudo Ativo</span>
                <ArrowRight className="h-4 w-4 text-blue-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Proof of Concept (POC) Pre-Loaded Studies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Estudos Disponíveis para Prova de Conceito
            </h2>
            <p className="text-xs text-slate-400">
              Três planilhas com estruturas, abas e colunas completamente diferentes testadas sob o mesmo motor universal.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            {studies.length} estudos no catálogo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {studies.map((study) => {
            const isActive = study.id === activeStudyId;
            const totalRows = study.sheets.reduce((acc, s) => acc + s.rows.length, 0);
            const totalCols = study.sheets.reduce((acc, s) => acc + s.columns.length, 0);

            return (
              <div
                key={study.id}
                className={`relative flex flex-col justify-between rounded-xl border p-5 transition-all ${
                  isActive
                    ? 'border-blue-500 bg-slate-900 shadow-lg shadow-blue-950/50 ring-1 ring-blue-500/50'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-950 border border-blue-500/30 px-2 py-0.5 rounded">
                        <Check className="h-3 w-3" />
                        Estudo Ativo
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-mono">
                        {study.fileSize || 'Excel .xlsx'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">
                    {study.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {study.description}
                  </p>

                  {/* Sheets Breakdown */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="h-3 w-3 text-blue-400" />
                      <span>{study.sheets.length} abas identificadas:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {study.sheets.map(sheet => (
                        <span
                          key={sheet.id}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                        >
                          {sheet.name} ({sheet.rows.length} lins)
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Relations hint if exists */}
                  {study.detectedRelations.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-blue-300/80 font-mono">
                      <GitFork className="h-3 w-3 text-blue-400 shrink-0" />
                      <span className="truncate">Vínculo inter-abas: {study.detectedRelations[0].sourceColumn}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => downloadSampleAsExcel(study)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                    title="Baixar arquivo .xlsx original para testar upload manual"
                  >
                    <Download className="h-3 w-3" />
                    <span>Baixar .xlsx</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectStudy(study.id);
                      onNavigateToExplore();
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {isActive ? 'Explorar' : 'Carregar Estudo'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Study Deep View */}
      {activeStudy && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">Detalhamento do Estudo Ativo</span>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">{activeStudy.title}</h3>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Importado em: {activeStudy.importedAt}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-xs text-slate-400">Total de Abas</span>
              <p className="text-xl font-bold font-mono text-slate-100 tabular-nums mt-1">
                {activeStudy.sheets.length}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-xs text-slate-400">Total de Linhas</span>
              <p className="text-xl font-bold font-mono text-slate-100 tabular-nums mt-1">
                {activeStudy.sheets.reduce((a, s) => a + s.rows.length, 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-xs text-slate-400">Colunas Analisadas</span>
              <p className="text-xl font-bold font-mono text-slate-100 tabular-nums mt-1">
                {activeStudy.sheets.reduce((a, s) => a + s.columns.length, 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
              <span className="text-xs text-slate-400">Relações Inter-Abas</span>
              <p className="text-xl font-bold font-mono text-blue-400 tabular-nums mt-1">
                {activeStudy.detectedRelations.length}
              </p>
            </div>
          </div>

          {/* Relations Details */}
          {activeStudy.detectedRelations.length > 0 && (
            <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-950/20">
              <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GitFork className="h-3.5 w-3.5 text-blue-400" />
                <span>Relações de Chaves Detectadas Entre as Abas</span>
              </h4>
              <div className="space-y-2 text-xs">
                {activeStudy.detectedRelations.map((rel, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300">
                    <div>
                      <span className="font-semibold text-slate-200">{rel.sourceSheet}</span> [{rel.sourceColumn}] 
                      <span className="mx-2 text-blue-400">⟷</span> 
                      <span className="font-semibold text-slate-200">{rel.targetSheet}</span> [{rel.targetColumn}]
                    </div>
                    <span className="font-mono text-blue-400 text-[11px] tabular-nums">
                      {rel.matchedValuesCount} valores comuns ({Math.round(rel.confidenceScore * 100)}% confiança)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
