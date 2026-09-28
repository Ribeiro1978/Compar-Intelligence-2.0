import * as XLSX from 'xlsx';
import { StudyDataset, SheetData } from '../types';
import { analyzeColumn, detectSheetIssues, detectRelations } from './importer';

/**
 * Creates 3 distinct realistic sample study datasets with different schemas, tabs, and columns.
 */

export function createSampleStudies(): StudyDataset[] {
  // --- STUDY 1: Votação PEC 45/2019 (Câmara dos Deputados) ---
  const rowsVotacaoNominal = [
    { "Nome do Parlamentar": "Arthur Lira", "Partido": "PP", "UF": "AL", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Independente", "Relevância Política": "Muito Alta", "Data Última Declaração": "2024-07-08" },
    { "Nome do Parlamentar": "Aguinaldo Ribeiro", "Partido": "PP", "UF": "PB", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Base Aliada", "Relevância Política": "Muito Alta", "Data Última Declaração": "2024-07-09" },
    { "Nome do Parlamentar": "Baleia Rossi", "Partido": "MDB", "UF": "SP", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Base Aliada", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-05" },
    { "Nome do Parlamentar": "Reginaldo Lopes", "Partido": "PT", "UF": "MG", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Governo", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-09" },
    { "Nome do Parlamentar": "Zeca Dirceu", "Partido": "PT", "UF": "PR", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Governo", "Relevância Política": "Média", "Data Última Declaração": "2024-07-06" },
    { "Nome do Parlamentar": "Gleisi Hoffmann", "Partido": "PT", "UF": "PR", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Governo", "Relevância Política": "Muito Alta", "Data Última Declaração": "2024-07-07" },
    { "Nome do Parlamentar": "Lindbergh Farias", "Partido": "PT", "UF": "RJ", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Governo", "Relevância Política": "Média", "Data Última Declaração": "2024-07-04" },
    { "Nome do Parlamentar": "Tabata Amaral", "Partido": "PSB", "UF": "SP", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Independente", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-07" },
    { "Nome do Parlamentar": "Pedro Paulo", "Partido": "PSD", "UF": "RJ", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Base Aliada", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-08" },
    { "Nome do Parlamentar": "Antonio Brito", "Partido": "PSD", "UF": "BA", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Base Aliada", "Relevância Política": "Muito Alta", "Data Última Declaração": "2024-07-08" },
    { "Nome do Parlamentar": "Altineu Côrtes", "Partido": "PL", "UF": "RJ", "Posicionamento": "Contrário", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Oposição", "Relevância Política": "Muito Alta", "Data Última Declaração": "2024-07-09" },
    { "Nome do Parlamentar": "Nikolas Ferreira", "Partido": "PL", "UF": "MG", "Posicionamento": "Contrário", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Oposição", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-09" },
    { "Nome do Parlamentar": "Eduardo Bolsonaro", "Partido": "PL", "UF": "SP", "Posicionamento": "Contrário", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Oposição", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-08" },
    { "Nome do Parlamentar": "Bia Kicis", "Partido": "PL", "UF": "DF", "Posicionamento": "Contrário", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Oposição", "Relevância Política": "Média", "Data Última Declaração": "2024-07-07" },
    { "Nome do Parlamentar": "Ricardo Salles", "Partido": "NOVO", "UF": "SP", "Posicionamento": "Contrário", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Oposição", "Relevância Política": "Média", "Data Última Declaração": "2024-07-06" },
    { "Nome do Parlamentar": "Marcel van Hattem", "Partido": "NOVO", "UF": "RS", "Posicionamento": "Contrário", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Oposição", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-08" },
    { "Nome do Parlamentar": "Adriana Ventura", "Partido": "NOVO", "UF": "SP", "Posicionamento": "Contrário", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Oposição", "Relevância Política": "Média", "Data Última Declaração": "2024-07-05" },
    { "Nome do Parlamentar": "Elmar Nascimento", "Partido": "UNIÃO", "UF": "BA", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Base Aliada", "Relevância Política": "Muito Alta", "Data Última Declaração": "2024-07-09" },
    { "Nome do Parlamentar": "Danilo Forte", "Partido": "UNIÃO", "UF": "CE", "Posicionamento": "Indeciso", "Tendência Mapeada": "Negociação de Emenda", "Alinhamento Governo": "Independente", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-03" },
    { "Nome do Parlamentar": "Kim Kataguiri", "Partido": "UNIÃO", "UF": "SP", "Posicionamento": "Contrário", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Oposição", "Relevância Política": "Média", "Data Última Declaração": "2024-07-07" },
    { "Nome do Parlamentar": "Hugo Motta", "Partido": "REPUBLICANOS", "UF": "PB", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Base Aliada", "Relevância Política": "Muito Alta", "Data Última Declaração": "2024-07-08" },
    { "Nome do Parlamentar": "Marcos Pereira", "Partido": "REPUBLICANOS", "UF": "SP", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Base Aliada", "Relevância Política": "Muito Alta", "Data Última Declaração": "2024-07-09" },
    { "Nome do Parlamentar": "Silas Câmara", "Partido": "REPUBLICANOS", "UF": "AM", "Posicionamento": "Indeciso", "Tendência Mapeada": "Pauta Setorial/Zona Franca", "Alinhamento Governo": "Independente", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-05" },
    { "Nome do Parlamentar": "Capitão Alberto Neto", "Partido": "PL", "UF": "AM", "Posicionamento": "Contrário", "Tendência Mapeada": "Defesa Zona Franca", "Alinhamento Governo": "Oposição", "Relevância Política": "Média", "Data Última Declaração": "2024-07-06" },
    { "Nome do Parlamentar": "Amom Mandel", "Partido": "CIDADANIA", "UF": "AM", "Posicionamento": "Indeciso", "Tendência Mapeada": "Aguardando Redação", "Alinhamento Governo": "Independente", "Relevância Política": "Média", "Data Última Declaração": "2024-07-04" },
    { "Nome do Parlamentar": "Sâmia Bomfim", "Partido": "PSOL", "UF": "SP", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto com Restrições", "Alinhamento Governo": "Independente", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-06" },
    { "Nome do Parlamentar": "Guilherme Boulos", "Partido": "PSOL", "UF": "SP", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Governo", "Relevância Política": "Muito Alta", "Data Última Declaração": "2024-07-08" },
    { "Nome do Parlamentar": "Erika Hilton", "Partido": "PSOL", "UF": "SP", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Governo", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-07" },
    { "Nome do Parlamentar": "Renildo Calheiros", "Partido": "PCdoB", "UF": "PE", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Governo", "Relevância Política": "Média", "Data Última Declaração": "2024-07-05" },
    { "Nome do Parlamentar": "Jandira Feghali", "Partido": "PCdoB", "UF": "RJ", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Governo", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-07" },
    { "Nome do Parlamentar": "Aécio Neves", "Partido": "PSDB", "UF": "MG", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto com Destaques", "Alinhamento Governo": "Oposição", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-08" },
    { "Nome do Parlamentar": "Adolfo Viana", "Partido": "PSDB", "UF": "BA", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Independente", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-07" },
    { "Nome do Parlamentar": "Rodrigo de Castro", "Partido": "UNIÃO", "UF": "MG", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Base Aliada", "Relevância Política": "Média", "Data Última Declaração": "2024-07-06" },
    { "Nome do Parlamentar": "Soraya Santos", "Partido": "PL", "UF": "RJ", "Posicionamento": "Favorável", "Tendência Mapeada": "Dissidência Partidária", "Alinhamento Governo": "Independente", "Relevância Política": "Alta", "Data Última Declaração": "2024-07-08" },
    { "Nome do Parlamentar": "Jilmar Tatto", "Partido": "PT", "UF": "SP", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Governo", "Relevância Política": "Média", "Data Última Declaração": "2024-07-07" },
    { "Nome do Parlamentar": "Isnaldo Bulhões Jr.", "Partido": "MDB", "UF": "AL", "Posicionamento": "Favorável", "Tendência Mapeada": "Voto Consolidado", "Alinhamento Governo": "Base Aliada", "Relevância Política": "Muito Alta", "Data Última Declaração": "2024-07-09" }
  ];

  const rowsBancadas = [
    { "Partido": "PL", "Total Bancada": 96, "Orientação Partidária": "Contrário", "Líder da Bancada": "Altineu Côrtes", "Percentual Alinhamento Oposição": "88%" },
    { "Partido": "PT", "Total Bancada": 68, "Orientação Partidária": "Favorável", "Líder da Bancada": "Odair Cunha", "Percentual Alinhamento Oposição": "2%" },
    { "Partido": "UNIÃO", "Total Bancada": 59, "Orientação Partidária": "Favorável", "Líder da Bancada": "Elmar Nascimento", "Percentual Alinhamento Oposição": "25%" },
    { "Partido": "PP", "Total Bancada": 50, "Orientação Partidária": "Favorável", "Líder da Bancada": "Dr. Luizinho", "Percentual Alinhamento Oposição": "20%" },
    { "Partido": "PSD", "Total Bancada": 44, "Orientação Partidária": "Favorável", "Líder da Bancada": "Antonio Brito", "Percentual Alinhamento Oposição": "15%" },
    { "Partido": "MDB", "Total Bancada": 44, "Orientação Partidária": "Favorável", "Líder da Bancada": "Isnaldo Bulhões Jr.", "Percentual Alinhamento Oposição": "10%" },
    { "Partido": "REPUBLICANOS", "Total Bancada": 41, "Orientação Partidária": "Favorável", "Líder da Bancada": "Hugo Motta", "Percentual Alinhamento Oposição": "22%" },
    { "Partido": "PSOL", "Total Bancada": 13, "Orientação Partidária": "Favorável", "Líder da Bancada": "Erika Hilton", "Percentual Alinhamento Oposição": "5%" },
    { "Partido": "PSDB", "Total Bancada": 12, "Orientação Partidária": "Favorável", "Líder da Bancada": "Adolfo Viana", "Percentual Alinhamento Oposição": "45%" },
    { "Partido": "NOVO", "Total Bancada": 4, "Orientação Partidária": "Contrário", "Líder da Bancada": "Marcel van Hattem", "Percentual Alinhamento Oposição": "95%" }
  ];

  const sheet1A = buildSheetData("Votação Nominal", rowsVotacaoNominal);
  const sheet1B = buildSheetData("Bancadas Partidárias", rowsBancadas);
  const rel1 = detectRelations([sheet1A, sheet1B]);

  const study1: StudyDataset = {
    id: 'estudo-pec-tributaria-camara',
    title: 'Mapa de Votação - PEC da Reforma Tributária (Câmara)',
    description: 'Acompanhamento nominal de votos, tendências declaradas e alinhamento político de deputados federais.',
    fileName: 'mapa_votacao_pec_tributaria.xlsx',
    fileSize: '48.2 KB',
    importedAt: '2026-09-25 10:30',
    sheets: [sheet1A, sheet1B],
    detectedRelations: rel1,
    isSample: true
  };

  // --- STUDY 2: Tramitação de Emendas no Senado (PLP 68/2024) ---
  const rowsEmendasSenado = [
    { "Código Emenda": "EMD-01/CCJ", "Senador Autor": "Eduardo Braga", "Partido": "MDB", "UF": "AM", "Tipo de Emenda": "Supressiva", "Dispositivo Afetado": "Art. 24 - Alíquota Padrão", "Impacto Estimado R$ Mi": 1450.0, "Parecer Preliminar": "Aprovado com Ajuste", "Urgência Setorial": "Alta" },
    { "Código Emenda": "EMD-02/CAE", "Senador Autor": "Oriovisto Guimarães", "Partido": "PODEMOS", "UF": "PR", "Tipo de Emenda": "Modificativa", "Dispositivo Afetado": "Art. 12 - Cashback de Bens", "Impacto Estimado R$ Mi": 820.5, "Parecer Preliminar": "Em Análise", "Urgência Setorial": "Média" },
    { "Código Emenda": "EMD-03/CCJ", "Senador Autor": "Flávio Bolsonaro", "Partido": "PL", "UF": "RJ", "Tipo de Emenda": "Substitutiva", "Dispositivo Afetado": "Art. 5º - Transição CBS/IBS", "Impacto Estimado R$ Mi": 3200.0, "Parecer Preliminar": "Rejeitado", "Urgência Setorial": "Muito Alta" },
    { "Código Emenda": "EMD-04/CAE", "Senador Autor": "Ciro Nogueira", "Partido": "PP", "UF": "PI", "Tipo de Emenda": "Aditiva", "Dispositivo Afetado": "Art. 33 - Regime Combustíveis", "Impacto Estimado R$ Mi": 2100.0, "Parecer Preliminar": "Em Negociação", "Urgência Setorial": "Alta" },
    { "Código Emenda": "EMD-05/CCJ", "Senador Autor": "Tereza Cristina", "Partido": "PP", "UF": "MS", "Tipo de Emenda": "Modificativa", "Dispositivo Afetado": "Art. 18 - Cesta Básica Nacional", "Impacto Estimado R$ Mi": 4500.0, "Parecer Preliminar": "Aprovado", "Urgência Setorial": "Muito Alta" },
    { "Código Emenda": "EMD-06/CAE", "Senador Autor": "Randolfe Rodrigues", "Partido": "PT", "UF": "AP", "Tipo de Emenda": "Aditiva", "Dispositivo Afetado": "Art. 41 - Fundo Desenvolvimento", "Impacto Estimado R$ Mi": 1800.0, "Parecer Preliminar": "Aprovado", "Urgência Setorial": "Alta" },
    { "Código Emenda": "EMD-07/CCJ", "Senador Autor": "Rogério Marinho", "Partido": "PL", "UF": "RN", "Tipo de Emenda": "Supressiva", "Dispositivo Afetado": "Art. 29 - Imposto Seletivo", "Impacto Estimado R$ Mi": 5100.0, "Parecer Preliminar": "Rejeitado", "Urgência Setorial": "Muito Alta" },
    { "Código Emenda": "EMD-08/CAE", "Senador Autor": "Jaques Wagner", "Partido": "PT", "UF": "BA", "Tipo de Emenda": "Modificativa", "Dispositivo Afetado": "Art. 52 - Conselho Federativo", "Impacto Estimado R$ Mi": 950.0, "Parecer Preliminar": "Aprovado", "Urgência Setorial": "Alta" },
    { "Código Emenda": "EMD-09/CCJ", "Senador Autor": "Carlos Portinho", "Partido": "PL", "UF": "RJ", "Tipo de Emenda": "Aditiva", "Dispositivo Afetado": "Art. 60 - Setor de Serviços", "Impacto Estimado R$ Mi": 3800.0, "Parecer Preliminar": "Em Análise", "Urgência Setorial": "Alta" },
    { "Código Emenda": "EMD-10/CAE", "Senador Autor": "Otto Alencar", "Partido": "PSD", "UF": "BA", "Tipo de Emenda": "Modificativa", "Dispositivo Afetado": "Art. 15 - Saúde e Medicamentos", "Impacto Estimado R$ Mi": 2700.0, "Parecer Preliminar": "Aprovado", "Urgência Setorial": "Muito Alta" },
    { "Código Emenda": "EMD-11/CCJ", "Senador Autor": "Marcos do Val", "Partido": "PODEMOS", "UF": "ES", "Tipo de Emenda": "Supressiva", "Dispositivo Afetado": "Art. 77 - Sanções Fiscais", "Impacto Estimado R$ Mi": 400.0, "Parecer Preliminar": "Rejeitado", "Urgência Setorial": "Baixa" },
    { "Código Emenda": "EMD-12/CAE", "Senador Autor": "Eliziane Gama", "Partido": "PSD", "UF": "MA", "Tipo de Emenda": "Aditiva", "Dispositivo Afetado": "Art. 22 - Proteção Ambiental", "Impacto Estimado R$ Mi": 1150.0, "Parecer Preliminar": "Aprovado", "Urgência Setorial": "Média" }
  ];

  const rowsComissoes = [
    { "Comissão": "Comissão de Constituição e Justiça", "Sigla": "CCJ", "Presidente": "Davi Alcolumbre", "Partido Presidente": "UNIÃO", "Total Emendas Recebidas": 42 },
    { "Comissão": "Comissão de Assuntos Econômicos", "Sigla": "CAE", "Presidente": "Vanderlan Cardoso", "Partido Presidente": "PSD", "Total Emendas Recebidas": 38 },
    { "Comissão": "Comissão de Desenvolvimento Regional", "Sigla": "CDR", "Presidente": "Marcelo Castro", "Partido Presidente": "MDB", "Total Emendas Recebidas": 19 }
  ];

  const sheet2A = buildSheetData("Emendas Parlamentares", rowsEmendasSenado);
  const sheet2B = buildSheetData("Comissões Temáticas", rowsComissoes);
  const rel2 = detectRelations([sheet2A, sheet2B]);

  const study2: StudyDataset = {
    id: 'estudo-emendas-senado',
    title: 'Tramitação e Emendas no Senado (PLP 68/2024)',
    description: 'Monitoramento de emendas supressivas, modificativas e aditivas, autores, impacto financeiro e pareceres.',
    fileName: 'tramitacao_emendas_senado.xlsx',
    fileSize: '36.8 KB',
    importedAt: '2026-09-25 11:15',
    sheets: [sheet2A, sheet2B],
    detectedRelations: rel2,
    isSample: true
  };

  // --- STUDY 3: Mapeamento de Stakeholders e Articulação Setorial ---
  const rowsStakeholders = [
    { "Entidade / Liderança": "Confederação Nacional da Indústria (CNI)", "Setor Econômico": "Indústria", "Região de Atuação": "Nacional", "Posicionamento Atual": "Favorável com Ressalvas", "Grau de Influência": 5, "Canal de Contato": "Presidência Institucional", "Data Último Diálogo": "2026-08-14", "Status Articulação": "Alinhado" },
    { "Entidade / Liderança": "Confederação da Agricultura e Pecuária (CNA)", "Setor Econômico": "Agronegócio", "Região de Atuação": "Centro-Oeste / Sul", "Posicionamento Atual": "Favorável", "Grau de Influência": 5, "Canal de Contato": "Diretoria Relações Governamentais", "Data Último Diálogo": "2026-08-20", "Status Articulação": "Alinhado" },
    { "Entidade / Liderança": "Federação Brasileira de Bancos (Febraban)", "Setor Econômico": "Financeiro", "Região de Atuação": "Sudeste", "Posicionamento Atual": "Neutro", "Grau de Influência": 5, "Canal de Contato": "Comitê Jurídico Tributário", "Data Último Diálogo": "2026-08-02", "Status Articulação": "Em Negociação" },
    { "Entidade / Liderança": "Associação Brasileira de Supermercados (ABRAS)", "Setor Econômico": "Comércio", "Região de Atuação": "Nacional", "Posicionamento Atual": "Favorável", "Grau de Influência": 4, "Canal de Contato": "Assessoria Parlamentar", "Data Último Diálogo": "2026-08-18", "Status Articulação": "Alinhado" },
    { "Entidade / Liderança": "Associação das Empresas de TI (Brasscom)", "Setor Econômico": "Tecnologia", "Região de Atuação": "Sudeste / Sul", "Posicionamento Atual": "Contrário", "Grau de Influência": 4, "Canal de Contato": "Grupo de Trabalho Brasília", "Data Último Diálogo": "2026-08-11", "Status Articulação": "Ponto de Atenção" },
    { "Entidade / Liderança": "Associação Brasileira de Bares e Restaurantes (Abrasel)", "Setor Econômico": "Serviços", "Região de Atuação": "Nacional", "Posicionamento Atual": "Contrário", "Grau de Influência": 4, "Canal de Contato": "Presidência Executiva", "Data Último Diálogo": "2026-08-09", "Status Articulação": "Ponto de Atenção" },
    { "Entidade / Liderança": "Sindicato Nacional da Indústria de Medicamentos (Sindusfarma)", "Setor Econômico": "Saúde", "Região de Atuação": "Nacional", "Posicionamento Atual": "Favorável com Ressalvas", "Grau de Influência": 3, "Canal de Contato": "Comitê Regulatório", "Data Último Diálogo": "2026-07-28", "Status Articulação": "Em Negociação" },
    { "Entidade / Liderança": "Associação Nacional dos Transportadores de Cargas (NTC)", "Setor Econômico": "Logística e Transporte", "Região de Atuação": "Nacional", "Posicionamento Atual": "Neutro", "Grau de Influência": 3, "Canal de Contato": "Relações Institucionais", "Data Último Diálogo": "2026-08-05", "Status Articulação": "Mapeamento Inicial" },
    { "Entidade / Liderança": "Frente Parlamentar da Agropecuária (FPA)", "Setor Econômico": "Agronegócio", "Região de Atuação": "Congresso Nacional", "Posicionamento Atual": "Favorável", "Grau de Influência": 5, "Canal de Contato": "Secretaria Executiva", "Data Último Diálogo": "2026-08-22", "Status Articulação": "Alinhado" },
    { "Entidade / Liderança": "Frente Parlamentar do Empreendedorismo (FPE)", "Setor Econômico": "Comércio e Serviços", "Região de Atuação": "Congresso Nacional", "Posicionamento Atual": "Favorável com Ressalvas", "Grau de Influência": 4, "Canal de Contato": "Coordenação Política", "Data Último Diálogo": "2026-08-15", "Status Articulação": "Em Negociação" }
  ];

  const rowsPautas = [
    { "Tema Regulatório": "Alíquota Zero da Cesta Básica Nacional", "Setor Principal": "Agronegócio e Comércio", "Nível de Urgência": "Crítica", "Impacto Estimado": "Muito Alto", "Data Audiência Pública": "2026-08-25" },
    { "Tema Regulatório": "Crédito Tributário na Cadeia de Serviços", "Setor Principal": "Serviços e Tecnologia", "Nível de Urgência": "Alta", "Impacto Estimado": "Alto", "Data Audiência Pública": "2026-09-02" },
    { "Tema Regulatório": "Regime Diferenciado para Inovação e P&D", "Setor Principal": "Tecnologia", "Nível de Urgência": "Média", "Impacto Estimado": "Médio", "Data Audiência Pública": "2026-09-10" }
  ];

  const sheet3A = buildSheetData("Atores e Entidades", rowsStakeholders);
  const sheet3B = buildSheetData("Pautas Prioritárias", rowsPautas);
  const rel3 = detectRelations([sheet3A, sheet3B]);

  const study3: StudyDataset = {
    id: 'estudo-stakeholders-articulacao',
    title: 'Mapeamento de Stakeholders e Articulação Setorial',
    description: 'Diagnóstico de entidades econômicas, grau de influência política, posições frente à regulação e histórico de diálogos.',
    fileName: 'mapeamento_stakeholders_setoriais.xlsx',
    fileSize: '32.1 KB',
    importedAt: '2026-09-25 11:40',
    sheets: [sheet3A, sheet3B],
    detectedRelations: rel3,
    isSample: true
  };

  return [study1, study2, study3];
}

function buildSheetData(name: string, rows: Record<string, any>[]): SheetData {
  const originalRows = rows.map(r => ({ ...r }));
  const headerKeys = Object.keys(rows[0] || {});

  const columns = headerKeys.map(colName => {
    return analyzeColumn(colName, rows);
  });

  const issues = detectSheetIssues(rows, columns);

  return {
    id: `sheet-${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    columns,
    rows,
    originalRows,
    totalRows: rows.length,
    emptyRowsCount: 0,
    duplicateRowsCount: 0,
    hasInconsistencies: false,
    issues
  };
}

/**
 * Generates an actual Excel file download Blob for testing the real drag-and-drop upload
 */
export function downloadSampleAsExcel(study: StudyDataset) {
  const wb = XLSX.utils.book_new();

  study.sheets.forEach(sheet => {
    const ws = XLSX.utils.json_to_sheet(sheet.originalRows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31)); // Excel tab name max 31 chars
  });

  XLSX.writeFile(wb, study.fileName);
}
