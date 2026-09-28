import { ParliamentarianInfo } from '../types';

/**
 * Direct Integration with Brazilian Congress Open Data APIs
 * - Câmara dos Deputados API v2
 * - Senado Federal Dados Abertos
 */

const CAMARA_API_URL = 'https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome';
const SENADO_API_URL = 'https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json';

// In-memory cache for fast lookup during user session
let cachedDeputados: ParliamentarianInfo[] | null = null;
let cachedSenadores: ParliamentarianInfo[] | null = null;

// Built-in official baseline fallback in case of network CORS / offline environments
const BASELINE_DEPUTADOS: ParliamentarianInfo[] = [
  { id: 160538, nome: "Arthur Lira", siglaPartido: "PP", siglaUf: "AL", email: "dep.arthurlira@camara.leg.br", casa: "Câmara" },
  { id: 74847, nome: "Aguinaldo Ribeiro", siglaPartido: "PP", siglaUf: "PB", email: "dep.aguinaldoribeiro@camara.leg.br", casa: "Câmara" },
  { id: 73434, nome: "Baleia Rossi", siglaPartido: "MDB", siglaUf: "SP", email: "dep.baleiarossi@camara.leg.br", casa: "Câmara" },
  { id: 74212, nome: "Aécio Neves", siglaPartido: "PSDB", siglaUf: "MG", email: "dep.aecioneves@camara.leg.br", casa: "Câmara" },
  { id: 220593, nome: "Nikolas Ferreira", siglaPartido: "PL", siglaUf: "MG", email: "dep.nikolasferreira@camara.leg.br", casa: "Câmara" },
  { id: 220590, nome: "Guilherme Boulos", siglaPartido: "PSOL", siglaUf: "SP", email: "dep.guilhermeboulos@camara.leg.br", casa: "Câmara" },
  { id: 204526, nome: "Tabata Amaral", siglaPartido: "PSB", siglaUf: "SP", email: "dep.tabataamaral@camara.leg.br", casa: "Câmara" },
  { id: 204560, nome: "Erika Hilton", siglaPartido: "PSOL", siglaUf: "SP", email: "dep.erikahilton@camara.leg.br", casa: "Câmara" },
  { id: 92887, nome: "Eduardo Bolsonaro", siglaPartido: "PL", siglaUf: "SP", email: "dep.eduardobolsonaro@camara.leg.br", casa: "Câmara" },
  { id: 204536, nome: "Kim Kataguiri", siglaPartido: "UNIÃO", siglaUf: "SP", email: "dep.kimkataguiri@camara.leg.br", casa: "Câmara" },
  { id: 160531, nome: "Elmar Nascimento", siglaPartido: "UNIÃO", siglaUf: "BA", email: "dep.elmarnascimento@camara.leg.br", casa: "Câmara" },
  { id: 160553, nome: "Hugo Motta", siglaPartido: "REPUBLICANOS", siglaUf: "PB", email: "dep.hugomotta@camara.leg.br", casa: "Câmara" },
  { id: 204515, nome: "Gleisi Hoffmann", siglaPartido: "PT", siglaUf: "PR", email: "dep.gleisihoffmann@camara.leg.br", casa: "Câmara" },
  { id: 160569, nome: "Altineu Côrtes", siglaPartido: "PL", siglaUf: "RJ", email: "dep.altineucortes@camara.leg.br", casa: "Câmara" },
  { id: 178966, nome: "Marcel van Hattem", siglaPartido: "NOVO", siglaUf: "RS", email: "dep.marcelvanhattem@camara.leg.br", casa: "Câmara" }
];

const BASELINE_SENADORES: ParliamentarianInfo[] = [
  { id: 5979, nome: "Rodrigo Pacheco", siglaPartido: "PSD", siglaUf: "MG", email: "rodrigo.pacheco@senado.leg.br", casa: "Senado" },
  { id: 5008, nome: "Eduardo Braga", siglaPartido: "MDB", siglaUf: "AM", email: "eduardo.braga@senado.leg.br", casa: "Senado" },
  { id: 5936, nome: "Jaques Wagner", siglaPartido: "PT", siglaUf: "BA", email: "jaques.wagner@senado.leg.br", casa: "Senado" },
  { id: 5982, nome: "Flávio Bolsonaro", siglaPartido: "PL", siglaUf: "RJ", email: "flavio.bolsonaro@senado.leg.br", casa: "Senado" },
  { id: 3830, nome: "Ciro Nogueira", siglaPartido: "PP", siglaUf: "PI", email: "ciro.nogueira@senado.leg.br", casa: "Senado" },
  { id: 5012, nome: "Randolfe Rodrigues", siglaPartido: "PT", siglaUf: "AP", email: "randolfe.rodrigues@senado.leg.br", casa: "Senado" },
  { id: 6012, nome: "Rogério Marinho", siglaPartido: "PL", siglaUf: "RN", email: "rogerio.marinho@senado.leg.br", casa: "Senado" },
  { id: 5988, nome: "Tereza Cristina", siglaPartido: "PP", siglaUf: "MS", email: "tereza.cristina@senado.leg.br", casa: "Senado" },
  { id: 4988, nome: "Davi Alcolumbre", siglaPartido: "UNIÃO", siglaUf: "AP", email: "davi.alcolumbre@senado.leg.br", casa: "Senado" },
  { id: 5022, nome: "Otto Alencar", siglaPartido: "PSD", siglaUf: "BA", email: "otto.alencar@senado.leg.br", casa: "Senado" },
  { id: 5953, nome: "Oriovisto Guimarães", siglaPartido: "PODEMOS", siglaUf: "PR", email: "oriovisto.guimaraes@senado.leg.br", casa: "Senado" }
];

export async function fetchDeputados(forceRefresh = false): Promise<ParliamentarianInfo[]> {
  if (cachedDeputados && !forceRefresh) {
    return cachedDeputados;
  }

  try {
    const res = await fetch(CAMARA_API_URL, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok) {
      const json = await res.json();
      if (json.dados && Array.isArray(json.dados)) {
        const mapped: ParliamentarianInfo[] = json.dados.map((d: any) => ({
          id: d.id,
          nome: d.nome,
          siglaPartido: d.siglaPartido,
          siglaUf: d.siglaUf,
          urlFoto: d.urlFoto,
          email: d.email,
          casa: 'Câmara'
        }));
        cachedDeputados = mapped;
        return mapped;
      }
    }
  } catch (err) {
    console.warn('API Câmara indisponível ou bloqueada por CORS, usando lista base oficial.', err);
  }

  cachedDeputados = BASELINE_DEPUTADOS;
  return BASELINE_DEPUTADOS;
}

export async function fetchSenadores(forceRefresh = false): Promise<ParliamentarianInfo[]> {
  if (cachedSenadores && !forceRefresh) {
    return cachedSenadores;
  }

  try {
    const res = await fetch(SENADO_API_URL, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok) {
      const json = await res.json();
      const parlamentares = json?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar;
      if (Array.isArray(parlamentares)) {
        const mapped: ParliamentarianInfo[] = parlamentares.map((p: any) => {
          const ident = p.IdentificacaoParlamentar;
          return {
            id: ident.CodigoParlamentar,
            nome: ident.NomeParlamentar,
            nomeEleitoral: ident.NomeCompletoParlamentar,
            siglaPartido: ident.SiglaPartidoParlamentar,
            siglaUf: ident.SiglaUfParlamentar,
            urlFoto: ident.UrlFotoParlamentar,
            email: ident.EmailParlamentar,
            casa: 'Senado'
          };
        });
        cachedSenadores = mapped;
        return mapped;
      }
    }
  } catch (err) {
    console.warn('API Senado indisponível ou bloqueada por CORS, usando lista base oficial.', err);
  }

  cachedSenadores = BASELINE_SENADORES;
  return BASELINE_SENADORES;
}

/**
 * Cross-match a dataset's records with official parliamentary roster
 */
export function matchWithOfficialRoster(
  rows: Record<string, any>[],
  nameCol: string,
  officialRoster: ParliamentarianInfo[]
): {
  matchedRows: Array<{ row: Record<string, any>; official: ParliamentarianInfo }>;
  unmatchedRows: Array<Record<string, any>>;
  matchRate: number;
} {
  const matchedRows: Array<{ row: Record<string, any>; official: ParliamentarianInfo }> = [];
  const unmatchedRows: Array<Record<string, any>> = [];

  const rosterMap = new Map<string, ParliamentarianInfo>();
  for (const p of officialRoster) {
    rosterMap.set(normalizeName(p.nome), p);
    if (p.nomeEleitoral) {
      rosterMap.set(normalizeName(p.nomeEleitoral), p);
    }
  }

  for (const row of rows) {
    const rawName = String(row[nameCol] || '').trim();
    const norm = normalizeName(rawName);
    
    // Strict exact match on normalized name (NEVER fuzzy combine different people!)
    if (rosterMap.has(norm)) {
      matchedRows.push({ row, official: rosterMap.get(norm)! });
    } else {
      unmatchedRows.push(row);
    }
  }

  const matchRate = rows.length > 0 ? (matchedRows.length / rows.length) * 100 : 0;

  return { matchedRows, unmatchedRows, matchRate };
}

function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(dep\.|deputado|deputada|sen\.|senador|senadora)\s+/i, '')
    .trim();
}
