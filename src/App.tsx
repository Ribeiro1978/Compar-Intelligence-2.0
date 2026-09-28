import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { StudiesArea } from './components/StudiesArea';
import { ImportArea } from './components/ImportArea';
import { ExploreArea } from './components/ExploreArea';
import { AskDataArea } from './components/AskDataArea';
import { DataDrilldownModal } from './components/DataDrilldownModal';
import { TestResultsModal } from './components/TestResultsModal';
import { LegislativeModal } from './components/LegislativeModal';
import { StudyDataset } from './types';
import { createSampleStudies } from './utils/sampleData';
import { runAutomatedTests, TestSuiteSummary } from './utils/testSuite';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studies' | 'import' | 'explore' | 'ask'>('studies');
  const [studies, setStudies] = useState<StudyDataset[]>(() => createSampleStudies());
  const [activeStudyId, setActiveStudyId] = useState<string>(() => studies[0]?.id || '');

  // Modals state
  const [drilldownState, setDrilldownState] = useState<{
    isOpen: boolean;
    title: string;
    rows: Record<string, any>[];
    subtitle?: string;
  }>({
    isOpen: false,
    title: '',
    rows: []
  });

  const [isTestsModalOpen, setIsTestsModalOpen] = useState(false);
  const [isLegislativeModalOpen, setIsLegislativeModalOpen] = useState(false);
  const [testSummary, setTestSummary] = useState<TestSuiteSummary>(() => runAutomatedTests());

  useEffect(() => {
    // Run automated verification test suite on boot
    const result = runAutomatedTests();
    setTestSummary(result);
  }, []);

  const handleStudyImported = (newStudy: StudyDataset) => {
    setStudies(prev => [newStudy, ...prev]);
    setActiveStudyId(newStudy.id);
  };

  const handleOpenDrilldown = (title: string, rows: Record<string, any>[], subtitle?: string) => {
    setDrilldownState({
      isOpen: true,
      title,
      rows,
      subtitle
    });
  };

  const handleRerunTests = () => {
    const updated = runAutomatedTests();
    setTestSummary(updated);
  };

  const activeStudy = studies.find(s => s.id === activeStudyId) || studies[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header compliant with Design Constitution */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeStudyTitle={activeStudy?.title}
        onOpenTests={() => setIsTestsModalOpen(true)}
        onOpenLegislative={() => setIsLegislativeModalOpen(true)}
        testPassRate={{ passed: testSummary.passed, total: testSummary.total }}
      />

      {/* Main Viewport Content Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'studies' && (
          <StudiesArea
            studies={studies}
            activeStudyId={activeStudyId}
            onSelectStudy={(id) => setActiveStudyId(id)}
            onNavigateToImport={() => setActiveTab('import')}
            onNavigateToExplore={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'import' && (
          <ImportArea
            onStudyImported={handleStudyImported}
            onNavigateToExplore={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'explore' && activeStudy && (
          <ExploreArea
            study={activeStudy}
            onDrilldown={handleOpenDrilldown}
          />
        )}

        {activeTab === 'ask' && activeStudy && (
          <AskDataArea
            study={activeStudy}
            onDrilldown={handleOpenDrilldown}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-5 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            <strong>Compar Intelligence 2.0</strong> — Plataforma Universal de Inteligência Legislativa & Dados
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Mecanismo universal sem dependência de regras fixas</span>
            <span aria-hidden="true">·</span>
            <span>Processamento 100% local com fidelidade auditável</span>
          </div>
        </div>
      </footer>

      {/* Drill-down Modal for Underlying Records */}
      <DataDrilldownModal
        isOpen={drilldownState.isOpen}
        onClose={() => setDrilldownState(prev => ({ ...prev, isOpen: false }))}
        title={drilldownState.title}
        subtitle={drilldownState.subtitle}
        rows={drilldownState.rows}
      />

      {/* POC Automated Test Results Modal */}
      <TestResultsModal
        isOpen={isTestsModalOpen}
        onClose={() => setIsTestsModalOpen(false)}
        summary={testSummary}
        onRerun={handleRerunTests}
      />

      {/* Brazilian Congress Official APIs Modal */}
      <LegislativeModal
        isOpen={isLegislativeModalOpen}
        onClose={() => setIsLegislativeModalOpen(false)}
        activeStudy={activeStudy}
      />
    </div>
  );
}
