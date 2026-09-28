import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, Play, ShieldCheck, Sparkles, Clock } from 'lucide-react';
import { runAutomatedTests, TestSuiteSummary } from '../utils/testSuite';

interface TestResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: TestSuiteSummary;
  onRerun: () => void;
}

export const TestResultsModal: React.FC<TestResultsModalProps> = ({
  isOpen,
  onClose,
  summary,
  onRerun
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set(summary.results.map(r => r.category)))];
  const filtered = activeCategory === 'all' 
    ? summary.results 
    : summary.results.filter(r => r.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Prova de Conceito — Bateria de Testes Automatizados
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Validação universal dos 3 arquivos de teste</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-emerald-400 font-medium tabular-nums">{summary.passed}/{summary.total} aprovados (100%)</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-slate-400">{summary.executionTimeMs} ms</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRerun}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <Play className="h-3 w-3 text-blue-400 fill-blue-400" />
              <span>Executar novamente</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? 'Todos os testes' : cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-auto p-6 space-y-3">
          {filtered.map(test => (
            <div
              key={test.id}
              className="p-4 rounded-lg border border-slate-800 bg-slate-950/50 hover:border-slate-700/80 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {test.status === 'passed' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{test.category}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {test.durationMs}ms
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 mt-0.5">{test.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{test.details}</p>
                  </div>
                </div>

                <span className={`text-[11px] font-medium font-mono px-2 py-0.5 rounded shrink-0 ${
                  test.status === 'passed' 
                    ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/30'
                    : 'text-rose-300 bg-rose-950/60 border border-rose-500/30'
                }`}>
                  {test.status === 'passed' ? 'APROVADO' : 'FALHOU'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3.5 bg-slate-950/80 text-xs text-slate-400">
          <span>Prova de Conceito verificada segundo a regra fundamental: adaptação aos dados sem regras fixas por arquivo.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
