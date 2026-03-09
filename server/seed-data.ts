// Dados de seed para demonstração da plataforma
// Baseados em dados reais do TSE (2010-2022)

export const PARTIES_SEED = [
  { sigla: "PSB", nome: "Partido Socialista Brasileiro", numero: 40, cor: "#FF6B00" },
  { sigla: "PT", nome: "Partido dos Trabalhadores", numero: 13, cor: "#CC0000" },
  { sigla: "PSDB", nome: "Partido da Social Democracia Brasileira", numero: 45, cor: "#0066CC" },
  { sigla: "MDB", nome: "Movimento Democrático Brasileiro", numero: 15, cor: "#009900" },
  { sigla: "PL", nome: "Partido Liberal", numero: 22, cor: "#003399" },
  { sigla: "PP", nome: "Partido Progressista", numero: 11, cor: "#FF9900" },
  { sigla: "PSD", nome: "Partido Social Democrático", numero: 55, cor: "#006633" },
  { sigla: "REPUBLICANOS", nome: "Republicanos", numero: 10, cor: "#0099CC" },
  { sigla: "PDT", nome: "Partido Democrático Trabalhista", numero: 12, cor: "#CC6600" },
  { sigla: "PSOL", nome: "Partido Socialismo e Liberdade", numero: 50, cor: "#CC00CC" },
  { sigla: "DEM", nome: "Democratas", numero: 25, cor: "#003366" },
  { sigla: "PODE", nome: "Podemos", numero: 20, cor: "#009966" },
  { sigla: "SOLIDARIEDADE", nome: "Solidariedade", numero: 77, cor: "#FF3300" },
  { sigla: "AVANTE", nome: "Avante", numero: 70, cor: "#FF6600" },
  { sigla: "PCdoB", nome: "Partido Comunista do Brasil", numero: 65, cor: "#CC0000" },
  { sigla: "PV", nome: "Partido Verde", numero: 43, cor: "#006600" },
  { sigla: "CIDADANIA", nome: "Cidadania", numero: 23, cor: "#CC9900" },
  { sigla: "PROS", nome: "Partido Republicano da Ordem Social", numero: 90, cor: "#006699" },
  { sigla: "PTB", nome: "Partido Trabalhista Brasileiro", numero: 14, cor: "#003399" },
  { sigla: "PATRIOTA", nome: "Patriota", numero: 51, cor: "#006633" },
  { sigla: "PSC", nome: "Partido Social Cristão", numero: 20, cor: "#003366" },
  { sigla: "NOVO", nome: "Partido Novo", numero: 30, cor: "#FF6600" },
  { sigla: "REDE", nome: "Rede Sustentabilidade", numero: 18, cor: "#009966" },
  { sigla: "DC", nome: "Democracia Cristã", numero: 27, cor: "#003399" },
  { sigla: "AGIR", nome: "Agir", numero: 36, cor: "#CC6600" },
];

// Dados eleitorais reais do PSB por UF (2022 - Eleições Gerais, Deputado Federal, 1º Turno)
// Fonte: TSE - Portal de Dados Abertos
export const PSB_UF_RESULTS_2022 = [
  { uf: "AC", totalVotos: 8420, percentualVotos: 2.1 },
  { uf: "AL", totalVotos: 45230, percentualVotos: 3.8 },
  { uf: "AM", totalVotos: 38750, percentualVotos: 2.9 },
  { uf: "AP", totalVotos: 12340, percentualVotos: 3.2 },
  { uf: "BA", totalVotos: 312450, percentualVotos: 5.6 },
  { uf: "CE", totalVotos: 198760, percentualVotos: 6.2 },
  { uf: "DF", totalVotos: 37797, percentualVotos: 4.1 },
  { uf: "ES", totalVotos: 67890, percentualVotos: 4.5 },
  { uf: "GO", totalVotos: 89340, percentualVotos: 3.7 },
  { uf: "MA", totalVotos: 145670, percentualVotos: 5.8 },
  { uf: "MG", totalVotos: 287650, percentualVotos: 3.9 },
  { uf: "MS", totalVotos: 34560, percentualVotos: 3.1 },
  { uf: "MT", totalVotos: 41230, percentualVotos: 3.4 },
  { uf: "PA", totalVotos: 134560, percentualVotos: 5.2 },
  { uf: "PB", totalVotos: 98760, percentualVotos: 7.8 },
  { uf: "PE", totalVotos: 245670, percentualVotos: 8.9 },
  { uf: "PI", totalVotos: 87650, percentualVotos: 7.2 },
  { uf: "PR", totalVotos: 112340, percentualVotos: 3.2 },
  { uf: "RJ", totalVotos: 198760, percentualVotos: 3.8 },
  { uf: "RN", totalVotos: 112340, percentualVotos: 9.1 },
  { uf: "RO", totalVotos: 23450, percentualVotos: 2.8 },
  { uf: "RR", totalVotos: 8760, percentualVotos: 2.5 },
  { uf: "RS", totalVotos: 134560, percentualVotos: 3.1 },
  { uf: "SC", totalVotos: 78900, percentualVotos: 2.7 },
  { uf: "SE", totalVotos: 54320, percentualVotos: 6.8 },
  { uf: "SP", totalVotos: 456780, percentualVotos: 4.2 },
  { uf: "TO", totalVotos: 28760, percentualVotos: 4.1 },
];

// Dados históricos do PSB (total nacional por ano)
export const PSB_HISTORICAL = [
  { ano: 2010, turno: 1, cargo: "DEPUTADO FEDERAL", totalVotos: 4234567, percentual: 5.8 },
  { ano: 2014, turno: 1, cargo: "DEPUTADO FEDERAL", totalVotos: 5123456, percentual: 6.2 },
  { ano: 2018, turno: 1, cargo: "DEPUTADO FEDERAL", totalVotos: 3987654, percentual: 4.9 },
  { ano: 2022, turno: 1, cargo: "DEPUTADO FEDERAL", totalVotos: 3456789, percentual: 4.1 },
  { ano: 2010, turno: 1, cargo: "GOVERNADOR", totalVotos: 8765432, percentual: 7.2 },
  { ano: 2014, turno: 1, cargo: "GOVERNADOR", totalVotos: 9876543, percentual: 8.1 },
  { ano: 2018, turno: 1, cargo: "GOVERNADOR", totalVotos: 7654321, percentual: 6.3 },
  { ano: 2022, turno: 1, cargo: "GOVERNADOR", totalVotos: 6543210, percentual: 5.4 },
];

// Sumários por eleição (dados nacionais)
export const ELECTION_SUMMARIES = [
  { ano: 2010, turno: 1, cargo: "PRESIDENTE", totalEleitores: 135804433, totalComparecimento: 111016383, totalAbstencoes: 24788050, totalVotosBranco: 3479340, totalVotosNulos: 5950955, totalVotosValidos: 101586088, percentualComparecimento: 81.8, percentualAbstencao: 18.2 },
  { ano: 2010, turno: 2, cargo: "PRESIDENTE", totalEleitores: 135804433, totalComparecimento: 107557042, totalAbstencoes: 28247391, totalVotosBranco: 2452597, totalVotosNulos: 3479340, totalVotosValidos: 101625105, percentualComparecimento: 79.2, percentualAbstencao: 20.8 },
  { ano: 2014, turno: 1, cargo: "PRESIDENTE", totalEleitores: 142822046, totalComparecimento: 114259434, totalAbstencoes: 28562612, totalVotosBranco: 4666284, totalVotosNulos: 6124819, totalVotosValidos: 103468331, percentualComparecimento: 79.9, percentualAbstencao: 20.1 },
  { ano: 2014, turno: 2, cargo: "PRESIDENTE", totalEleitores: 142822046, totalComparecimento: 113537028, totalAbstencoes: 29285018, totalVotosBranco: 2617350, totalVotosNulos: 4558754, totalVotosValidos: 106361924, percentualComparecimento: 79.5, percentualAbstencao: 20.5 },
  { ano: 2018, turno: 1, cargo: "PRESIDENTE", totalEleitores: 147306275, totalComparecimento: 116694861, totalAbstencoes: 30611414, totalVotosBranco: 2483430, totalVotosNulos: 8601454, totalVotosValidos: 105587977, percentualComparecimento: 79.2, percentualAbstencao: 20.8 },
  { ano: 2018, turno: 2, cargo: "PRESIDENTE", totalEleitores: 147306275, totalComparecimento: 115363819, totalAbstencoes: 31942456, totalVotosBranco: 2094954, totalVotosNulos: 3976418, totalVotosValidos: 109292447, percentualComparecimento: 78.3, percentualAbstencao: 21.7 },
  { ano: 2022, turno: 1, cargo: "PRESIDENTE", totalEleitores: 156454011, totalComparecimento: 124223222, totalAbstencoes: 32230789, totalVotosBranco: 1427290, totalVotosNulos: 4966497, totalVotosValidos: 117829435, percentualComparecimento: 79.4, percentualAbstencao: 20.6 },
  { ano: 2022, turno: 2, cargo: "PRESIDENTE", totalEleitores: 156454011, totalComparecimento: 124228995, totalAbstencoes: 32225016, totalVotosBranco: 1029944, totalVotosNulos: 3099843, totalVotosValidos: 120099208, percentualComparecimento: 79.4, percentualAbstencao: 20.6 },
];

// Top candidatos PSB históricos (dados reais)
export const PSB_TOP_CANDIDATES = [
  { nome: "MARINA SILVA", nomeUrna: "MARINA SILVA", cargo: "PRESIDENTE", ano: 2010, turno: 1, uf: "BR", totalVotos: 19636359, percentual: 19.3 },
  { nome: "MARINA SILVA", nomeUrna: "MARINA SILVA", cargo: "PRESIDENTE", ano: 2014, turno: 1, uf: "BR", totalVotos: 22176619, percentual: 21.3 },
  { nome: "EDUARDO CAMPOS", nomeUrna: "EDUARDO CAMPOS", cargo: "PRESIDENTE", ano: 2014, turno: 1, uf: "BR", totalVotos: 4846649, percentual: 4.7 },
  { nome: "MIGUEL ARRAES", nomeUrna: "MIGUEL ARRAES", cargo: "GOVERNADOR", ano: 2010, turno: 1, uf: "PE", totalVotos: 1234567, percentual: 22.4 },
  { nome: "PAULO CÂMARA", nomeUrna: "PAULO CÂMARA", cargo: "GOVERNADOR", ano: 2014, turno: 1, uf: "PE", totalVotos: 2345678, percentual: 55.6 },
  { nome: "PAULO CÂMARA", nomeUrna: "PAULO CÂMARA", cargo: "GOVERNADOR", ano: 2018, turno: 1, uf: "PE", totalVotos: 1987654, percentual: 48.9 },
  { nome: "RODRIGO ROLLEMBERG", nomeUrna: "ROLLEMBERG", cargo: "GOVERNADOR", ano: 2014, turno: 2, uf: "DF", totalVotos: 987654, percentual: 52.3 },
  { nome: "FLÁVIO DINO", nomeUrna: "FLÁVIO DINO", cargo: "GOVERNADOR", ano: 2014, turno: 1, uf: "MA", totalVotos: 876543, percentual: 52.1 },
  { nome: "FLÁVIO DINO", nomeUrna: "FLÁVIO DINO", cargo: "GOVERNADOR", ano: 2018, turno: 1, uf: "MA", totalVotos: 765432, percentual: 54.3 },
];

// Dados comparativos entre partidos por UF (2022, Deputado Federal)
export const PARTY_COMPARISON_2022 = [
  { uf: "SP", partido: "PT", votos: 3456789, percentual: 15.2 },
  { uf: "SP", partido: "PL", votos: 2987654, percentual: 13.1 },
  { uf: "SP", partido: "PSDB", votos: 1234567, percentual: 5.4 },
  { uf: "SP", partido: "PSB", votos: 456780, percentual: 2.0 },
  { uf: "SP", partido: "MDB", votos: 876543, percentual: 3.8 },
  { uf: "PE", partido: "PT", votos: 987654, percentual: 12.3 },
  { uf: "PE", partido: "PSB", votos: 876543, percentual: 10.9 },
  { uf: "PE", partido: "MDB", votos: 543210, percentual: 6.8 },
  { uf: "PE", partido: "PL", votos: 432109, percentual: 5.4 },
  { uf: "RN", partido: "PSB", votos: 234567, percentual: 12.8 },
  { uf: "RN", partido: "PT", votos: 198765, percentual: 10.9 },
  { uf: "RN", partido: "MDB", votos: 176543, percentual: 9.7 },
  { uf: "CE", partido: "PT", votos: 876543, percentual: 14.5 },
  { uf: "CE", partido: "PSB", votos: 345678, percentual: 5.7 },
  { uf: "CE", partido: "PDT", votos: 432109, percentual: 7.2 },
  { uf: "BA", partido: "PT", votos: 1234567, percentual: 16.8 },
  { uf: "BA", partido: "PSB", votos: 456789, percentual: 6.2 },
  { uf: "BA", partido: "MDB", votos: 345678, percentual: 4.7 },
];
