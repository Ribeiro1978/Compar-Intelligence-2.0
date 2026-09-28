import React, { useState, useEffect } from 'react';
import { X, Landmark, RefreshCw, Search, CheckCircle, AlertCircle, ExternalLink, Filter } from 'lucide-react';
import { ParliamentarianInfo, StudyDataset } from '../types';
import { fetchDeputados, fetchSenadores, matchWithOfficialRoster } from '../utils/legislativeApi';

interface LegislativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudy?: StudyDataset | null;
}

export const LegislativeModal: React.FC<LegislativeModalProps> = ({
  isOpen,
  onClose,
  activeStudy
}) => {
  const [house, setHouse] = useState<'Câmara' | 'Senado'>('Câmara');
  const [deputados, setDeputados] = useState<ParliamentarianInfo[]>([]);
  const [senadores, setSenadores] = useState<ParliamentarianInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [ufFilter, setUfFilter] = useState('');
  const [crossCheckResult, setCrossCheckResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const [deps, sens] = await Promise.all([
        fetchDeputados(force),
        fetchSenadores(force)
      ]);
      setDeputados(deps);
      setSenadores(sens);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentList = house === 'Câmara' ? deputados : senadores;

  // Extract parties and UFs
  const uniqueParties = Array.from(new Set(currentList.map(p => p.siglaPartido).filter(Boolean))).sort();
  const uniqueUfs = Array.from(new Set(currentList.map(p => p.siglaUf).filter(Boolean))).sort();

  // Filtered list
  const filteredList = currentList.filter(p => {
    const matchesSearch = !searchTerm || p.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesParty = !partyFilter || p.siglaPartido === partyFilter;
    const matchesUf = !ufFilter || p.siglaUf === ufFilter;
    return matchesSearch && matchesParty && matchesUf;
  });

  // Cross check with active study
  const handleCrossCheckWithStudy = () => {
    if (!activeStudy || activeStudy.sheets.length === 0) return;
    const sheet = activeStudy.sheets[0];
    const nameCol = sheet.columns.find(c => c.legislativeRole === 'parliamentarian_name') || sheet.columns[0];
    if (!nameCol) return;

    const fullRoster = [...deputados, ...senadores];
    const result = matchWithOfficialRoster(sheet.rows, nameCol.name, fullRoster);
    setCrossCheckResult({
      ...result,
      sheetName: sheet.name,
      columnName: nameCol.name
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Congresso Nacional — Listas Oficiais Atualizadas
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Dados Abertos da Câmara dos Deputados e do Senado Federal</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-blue-400 font-medium tabular-nums">
                  {deputados.length} deputados · {senadores.length} senadores
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Sincronizar APIs</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher: Câmara vs Senado */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setHouse('Câmara'); setPartyFilter(''); setUfFilter(''); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                house === 'Câmara'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Câmara dos Deputados ({deputados.length})
            </button>
            <button
              onClick={() => { setHouse('Senado'); setPartyFilter(''); setUfFilter(''); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                house === 'Senado'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Senado Federal ({senadores.length})
            </button>
          </div>

          {activeStudy && (
            <button
              onClick={handleCrossCheckWithStudy}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/30 rounded-lg transition-colors"
            >
              <CheckCircle className="h-3.5 w-3.5 text-blue-400" />
              <span>Conferir estudo ativo com o Congresso</span>
            </button>
          )}
        </div>

        {/* Cross Check Banner if executed */}
        {crossCheckResult && (
          <div className="mx-6 my-3 p-3.5 rounded-lg border border-blue-500/30 bg-blue-950/40 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-blue-200">Resultado do Cruzamento com o Estudo Ativo</span>
              <span className="font-mono text-blue-400 tabular-nums font-semibold">
                {crossCheckResult.matchRate.toFixed(1)}% correspondência estrita
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Verificados {crossCheckResult.matchedRows.length} parlamentares identificados na coluna "{crossCheckResult.columnName}" da aba "{crossCheckResult.sheetName}". 
              A conferência usa correspondência estrita de nomes normalizados (regra: nunca agrupar indivíduos distintos por mera semelhança).
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 py-3 border-b border-slate-800/80 bg-slate-900/40">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={`Buscar parlamentar na ${house}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos os partidos ({uniqueParties.length})</option>
              {uniqueParties.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={ufFilter}
              onChange={(e) => setUfFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">Todas as UFs ({uniqueUfs.length})</option>
              {uniqueUfs.map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredList.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-lg border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 transition-colors flex items-center gap-3"
              >
                {p.urlFoto ? (
                  <img
                    src={p.urlFoto}
                    alt={p.nome}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-800"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
                    {p.nome.substring(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{p.nome}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono font-medium text-blue-400">{p.siglaPartido}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">{p.siglaUf}</span>
                    <span aria-hidden="true">·</span>
                    <span>{p.casa}</span>
                  </div>
                  {p.email && (
                    <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                      {p.email}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3 bg-slate-950/80 text-xs text-slate-400">
          <span>{filteredList.length} parlamentares listados</span>
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
