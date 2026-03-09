export const ANOS_ELEICAO = [2010, 2014, 2018, 2022] as const;

export const CARGOS = [
  // Eleições gerais (anos pares terminados em 2: 2010, 2014, 2018, 2022)
  { value: "PRESIDENTE", label: "Presidente", tipo: "geral" },
  { value: "GOVERNADOR", label: "Governador", tipo: "geral" },
  { value: "SENADOR", label: "Senador", tipo: "geral" },
  { value: "DEPUTADO FEDERAL", label: "Deputado Federal", tipo: "geral" },
  { value: "DEPUTADO ESTADUAL", label: "Deputado Estadual", tipo: "geral" },
  { value: "DEPUTADO DISTRITAL", label: "Deputado Distrital", tipo: "geral" },
  // Eleições municipais (anos pares terminados em 0: 2020, 2016, 2012)
  { value: "PREFEITO", label: "Prefeito", tipo: "municipal" },
  { value: "VICE-PREFEITO", label: "Vice-Prefeito", tipo: "municipal" },
  { value: "VEREADOR", label: "Vereador", tipo: "municipal" },
] as const;

export const UFS = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AM", label: "Amazonas" },
  { value: "AP", label: "Amapá" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MG", label: "Minas Gerais" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MT", label: "Mato Grosso" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "PR", label: "Paraná" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SE", label: "Sergipe" },
  { value: "SP", label: "São Paulo" },
  { value: "TO", label: "Tocantins" },
] as const;

export const REGIOES = [
  { value: "NORTE", label: "Norte", ufs: ["AC","AM","AP","PA","RO","RR","TO"] },
  { value: "NORDESTE", label: "Nordeste", ufs: ["AL","BA","CE","MA","PB","PE","PI","RN","SE"] },
  { value: "CENTRO-OESTE", label: "Centro-Oeste", ufs: ["DF","GO","MS","MT"] },
  { value: "SUDESTE", label: "Sudeste", ufs: ["ES","MG","RJ","SP"] },
  { value: "SUL", label: "Sul", ufs: ["PR","RS","SC"] },
] as const;

export const PARTY_COLORS: Record<string, string> = {
  PSB: "#FF6B00",
  PT: "#CC0000",
  PSDB: "#0066CC",
  MDB: "#009900",
  PL: "#003399",
  PP: "#FF9900",
  PSD: "#006633",
  REPUBLICANOS: "#0099CC",
  PDT: "#CC6600",
  PSOL: "#CC00CC",
  DEM: "#003366",
  PODE: "#009966",
  PCdoB: "#990000",
  PV: "#006600",
  CIDADANIA: "#CC9900",
  PTB: "#003399",
  NOVO: "#FF6600",
  REDE: "#009966",
  DEFAULT: "#888888",
};

export const PSB_COLOR = "#FF6B00";

// GeoJSON URL do Brasil por UF (fonte: IBGE via GitHub)
export const BRAZIL_UF_GEOJSON_URL =
  "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

// Intensidade de cores para mapa coroplético
export const MAP_COLOR_SCALE = [
  "#FFF5E6",
  "#FFD9A8",
  "#FFBC6B",
  "#FF9F2E",
  "#FF8200",
  "#CC6800",
  "#994E00",
];

export const formatVotes = (n: number | null | undefined): string => {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("pt-BR");
};

export const formatPercent = (n: number | string | null | undefined): string => {
  if (n == null) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  return `${num.toFixed(1)}%`;
};
