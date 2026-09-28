import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Info, ArrowRight, Eye, RefreshCw, Layers, ShieldCheck, HelpCircle } from 'lucide-react';
import { SheetData, SheetRelation, ColumnDataType, StudyDataset } from '../types';
import { parseSpreadsheetFile } from '../utils/importer';

interface ImportAreaProps {
  onStudyImported: (study: StudyDataset) => void;
  onNavigateToExplore: () => void;
}

export const ImportArea: React.FC<ImportAreaProps> = ({
  onStudyImported,
  onNavigateToExplore
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedSheets, setParsedSheets] = useState<SheetData[]>([]);
  const [detectedRelations, setDetectedRelations] = useState<SheetRelation[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [studyTitle, setStudyTitle] = useState('');
  const [studyDesc, setStudyDesc] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (selectedFile: File) => {
    setErrorMessage(null);
    setFile(selectedFile);
    setIsProcessing(true);
    setIsConfirmed(false);

    try {
      const { sheets, detectedRelations } = await parseSpreadsheetFile(selectedFile);
      if (sheets.length === 0) {
        throw new Error('Nenhuma aba válida encontrada no arquivo selecionado.');
      }
      setParsedSheets(sheets);
      setDetectedRelations(detectedRelations);
      setActiveSheetIndex(0);
      setStudyTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      setStudyDesc(`Importação universal de "${selectedFile.name}" com ${sheets.length} abas identificadas.`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao processar o arquivo. Verifique se o formato é .xlsx, .xls ou .csv válido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Change user interpretation type without touching raw rows
  const handleTypeOverride = (sheetIdx: number, colId: string, newType: ColumnDataType) => {
    setParsedSheets(prev => {
      const updated = [...prev];
      const sheet = updated[sheetIdx];
      sheet.columns = sheet.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            userType: newType,
            isNumeric: newType === 'number' || newType === 'percentage' || newType === 'currency'
          };
        }
        return col;
      });
      return updated;
    });
  };

  // Confirm import and create active study
  const handleConfirmImport = () => {
    if (parsedSheets.length === 0) return;

    const newStudy: StudyDataset = {
      id: `study-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: studyTitle || (file ? file.name : 'Estudo Importado'),
      description: studyDesc || 'Estudo importado via mecanismo universal.',
      fileName: file ? file.name : 'dados_importados.xlsx',
      fileSize: file ? `${(file.size / 1024).toFixed(1)} KB` : undefined,
      importedAt: new Date().toLocaleString('pt-BR'),
      sheets: parsedSheets,
      detectedRelations,
      isSample: false
    };

    onStudyImported(newStudy);
    setIsConfirmed(true);
  };

  const activeSheet = parsedSheets[activeSheetIndex];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Importação Universal & Conferência de Dados
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Carregue qualquer arquivo Excel (.xlsx, .xls) ou CSV com uma ou múltiplas abas. Os dados são lidos localmente no navegador preservando integralmente cabeçalhos e valores originais.
        </p>
      </div>

      {/* File Upload Zone */}
      {!parsedSheets.length && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-900/40 hover:bg-slate-900/80 p-12 text-center transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
            <UploadCloud className="h-7 w-7" />
          </div>

          <h3 className="text-base font-semibold text-slate-200">
            Arraste e solte sua planilha aqui, ou clique para selecionar
          </h3>
          <p className="mt-1.5 text-xs text-slate-400">
            Formatos suportados: Excel (.xlsx, .xls) e CSV. Reconhecimento automático de abas, tipos e relações.
          </p>

          {isProcessing && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-400 font-medium">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analisando estrutura, cabeçalhos e tipos de dados...</span>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Conference Screen when file is parsed */}
      {parsedSheets.length > 0 && (
        <div className="space-y-6">
          {/* File Summary Bar */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">{file?.name || 'Planilha Carregada'}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-mono text-blue-400">{parsedSheets.length} abas identificadas</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{parsedSheets.reduce((a, s) => a + s.rows.length, 0)} linhas totais</span>
                  {file && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{(file.size / 1024).toFixed(1)} KB</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setParsedSheets([]);
                  setFile(null);
                  setIsConfirmed(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Trocar Arquivo
              </button>

              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/30 rounded-lg shadow-md transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirmar Importação Definitiva</span>
              </button>
            </div>
          </div>

          {/* Success Banner if confirmed */}
          {isConfirmed && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 flex items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-emerald-200">
                    Planilha importada com sucesso no Compar Intelligence!
                  </h4>
                  <p className="text-xs text-emerald-300/80">
                    O estudo já está ativo para exploração, geração de gráficos, cruzamentos de variáveis e perguntas aos dados.
                  </p>
                </div>
              </div>

              <button
                onClick={onNavigateToExplore}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shadow"
              >
                <span>Avançar para Dashboards</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Detected Inter-Sheet Relations Alert */}
          {detectedRelations.length > 0 && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-300 mb-2">
                <Layers className="h-4 w-4 text-blue-400" />
                <span>Relações e Chaves em Comum Detectadas Entre as Abas</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                {detectedRelations.map((rel, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span>
                      Chave comum detectada entre <strong>{rel.sourceSheet}</strong> [{rel.sourceColumn}] e <strong>{rel.targetSheet}</strong> [{rel.targetColumn}]:
                      <span className="text-slate-400 ml-1.5">{rel.reason}</span>
                    </span>
                    <span className="text-[11px] font-mono text-blue-400 font-semibold tabular-nums shrink-0">
                      {Math.round(rel.confidenceScore * 100)}% confiança
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Navigation for Sheets */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            {parsedSheets.map((sheet, idx) => (
              <button
                key={sheet.id}
                onClick={() => setActiveSheetIndex(idx)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeSheetIndex === idx
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>{sheet.name}</span>
                <span className="font-mono text-[11px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
                  {sheet.rows.length} linhas
                </span>
                {sheet.issues.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" title="Possui alertas de validação" />
                )}
              </button>
            ))}
          </div>

          {/* Sheet Anomaly & Validation Alerts */}
          {activeSheet && activeSheet.issues.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Alertas de Consistência e Qualidade dos Dados na Aba "{activeSheet.name}"</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                {activeSheet.issues.map((issue, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className={issue.severity === 'warning' ? 'text-amber-300' : 'text-slate-300'}>
                      {issue.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Schema & Column Interpretation Override Table */}
          {activeSheet && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Interpretação Universal de Colunas — Aba: {activeSheet.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Você pode alterar a interpretação de qualquer coluna sem modificar o arquivo original.
                  </p>
                </div>
                <div className="text-xs font-mono text-slate-400 tabular-nums">
                  {activeSheet.columns.length} colunas identificadas
                </div>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300">
                      <th className="py-2.5 px-3 font-semibold">Nome Original</th>
                      <th className="py-2.5 px-3 font-semibold">Tipo Inferido</th>
                      <th className="py-2.5 px-3 font-semibold">Tipo Aplicado (Ajuste)</th>
                      <th className="py-2.5 px-3 font-semibold">Papel Legislativo</th>
                      <th className="py-2.5 px-3 font-semibold">Células Vazias</th>
                      <th className="py-2.5 px-3 font-semibold">Exemplos Amostrais</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {activeSheet.columns.map((col) => (
                      <tr key={col.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 px-3 font-semibold text-slate-200">
                          {col.originalName}
                        </td>
                        <td className="py-2 px-3 text-slate-400 font-mono">
                          {col.inferredType}
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={col.userType}
                            onChange={(e) => handleTypeOverride(activeSheetIndex, col.id, e.target.value as ColumnDataType)}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-blue-300 font-medium focus:outline-none focus:border-blue-500"
                          >
                            <option value="text">text (texto geral)</option>
                            <option value="categorical">categorical (categorias/rótulos)</option>
                            <option value="number">number (numérico exato)</option>
                            <option value="percentage">percentage (porcentagem)</option>
                            <option value="currency">currency (moeda/R$)</option>
                            <option value="date">date (data/tempo)</option>
                            <option value="boolean">boolean (sim/não/binário)</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-mono text-[11px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {col.legislativeRole}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-slate-400">
                          {col.emptyCount > 0 ? (
                            <span className="text-amber-400">{col.emptyCount} vazias</span>
                          ) : (
                            <span className="text-emerald-400">0 (100% preenchida)</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-400 truncate max-w-xs font-mono text-[11px]">
                          {col.sampleValues.map(s => String(s)).join(' · ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Raw Data Preview */}
          {activeSheet && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Prévia dos Registros Originais (Primeiras 10 Linhas)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Conferência fiel dos valores exatos conforme constam no arquivo.
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  Aba: {activeSheet.name}
                </span>
              </div>

              <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300">
                      <th className="py-2 px-3 font-mono text-slate-500 w-12 text-center">#</th>
                      {activeSheet.columns.map(col => (
                        <th key={col.id} className="py-2 px-3 font-semibold text-slate-200 whitespace-nowrap">
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {activeSheet.rows.slice(0, 10).map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 px-3 text-center text-slate-500 font-mono tabular-nums">
                          {rIdx + 1}
                        </td>
                        {activeSheet.columns.map(col => (
                          <td key={col.id} className="py-2 px-3 whitespace-nowrap text-slate-300">
                            {row[col.name] !== null && row[col.name] !== undefined ? String(row[col.name]) : (
                              <span className="text-slate-600 italic">—</span>
                            )}
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
  );
};
