import React from 'react';
import { Database, UploadCloud, LayoutDashboard, HelpCircle, CheckCircle2, Landmark } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studies' | 'import' | 'explore' | 'ask';
  setActiveTab: (tab: 'studies' | 'import' | 'explore' | 'ask') => void;
  activeStudyTitle?: string;
  onOpenTests: () => void;
  onOpenLegislative: () => void;
  testPassRate?: { passed: number; total: number };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeStudyTitle,
  onOpenTests,
  onOpenLegislative,
  testPassRate
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <span className="font-bold text-sm tracking-wider">CI</span>
          </div>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveTab('studies'); }}
            className="text-lg font-bold tracking-tight text-white hover:text-blue-400 transition-colors whitespace-nowrap"
          >
            Compar Intelligence
          </a>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('studies')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'studies'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            1. Meus estudos
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'import'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            2. Importar e conferir dados
          </button>

          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'explore'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            3. Explorar e dashboards
          </button>

          <button
            onClick={() => setActiveTab('ask')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'ask'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            4. Pergunte aos dados
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenLegislative}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            title="Consulta ao vivo das APIs da Câmara e Senado"
          >
            <Landmark className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Congresso</span> Nacional
          </button>

          <button
            onClick={onOpenTests}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/30 rounded-lg shadow-sm transition-colors whitespace-nowrap"
            title="Executar bateria de testes da Prova de Conceito"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-200" />
            <span>Testes POC</span>
            {testPassRate && (
              <span className="ml-1 text-[11px] font-mono bg-blue-800/80 px-1.5 py-0.2 rounded text-blue-100">
                {testPassRate.passed}/{testPassRate.total}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
