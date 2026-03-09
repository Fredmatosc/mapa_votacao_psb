# Mapa de Votação PSB - TODO

## Backend / Schema

- [x] Schema: tabela `election_results_by_uf` com campos de partido, UF, cargo, ano, turno, votos
- [x] Schema: tabela `election_results_by_municipality` com dados por município
- [x] Schema: tabela `election_results_by_zone` com dados por zona eleitoral
- [x] Schema: tabela `candidates` com dados de candidatos
- [x] Schema: tabela `parties` com dados de partidos
- [x] Schema: tabela `municipalities` com dados de municípios e códigos IBGE
- [x] Schema: tabela `election_summary` com sumários eleitorais
- [x] Endpoint: listagem de resultados com filtros (ano, turno, cargo, partido, UF, município)
- [x] Endpoint: agregação por UF (total de votos por partido/candidato por estado)
- [x] Endpoint: agregação por município
- [x] Endpoint: agregação por zona eleitoral
- [x] Endpoint: ranking de candidatos
- [x] Endpoint: ranking de partidos
- [x] Endpoint: evolução temporal (comparação entre eleições)
- [x] Endpoint: busca de candidatos com autocomplete
- [x] Endpoint: indicadores-chave (votos em branco, nulos, abstenção)
- [x] Seed: dados de amostra realistas baseados em dados TSE (3456 registros por UF)

## Frontend / Layout

- [x] Design system: paleta de cores laranja/escuro, tipografia Inter + Space Grotesk
- [x] Layout principal com sidebar de filtros e área de visualização
- [x] Header com logo Hub PSB e navegação
- [x] Sidebar de filtros colapsável (mobile-first)
- [x] Componente de filtros: partido (destaque PSB), cargo, ano, turno, UF, município
- [x] Busca de candidatos com autocomplete
- [x] Painel de indicadores-chave (KPIs): votos, UFs, eleitores, comparecimento, abstenção, votos brancos

## Mapa Interativo

- [x] Instalar e configurar Leaflet.js + react-leaflet
- [x] Carregar GeoJSON do Brasil (limites de UF via API pública)
- [x] Mapa coroplético com cores por intensidade de votos
- [x] Hover tooltip com dados da UF
- [x] Clique para drill-down: Brasil → UF → Município
- [x] Legenda do mapa com escala de cores
- [x] Controles de zoom e navegação
- [x] Destaque automático para PSB (cor laranja)
- [x] Breadcrumb de navegação (Brasil / UF)

## Gráficos e Análises

- [x] Gráfico de barras: comparação entre partidos
- [x] Gráfico de linha: evolução temporal 2010-2022 (PSB vs PT vs PL)
- [x] Gráfico de distribuição regional (pizza/barras)
- [x] Ranking dinâmico de candidatos por estado
- [x] Tabela de resultados por estado com ordenação e proporção visual

## Integração TSE

- [x] Botão "Carregar Dados" para popular banco via seed
- [x] Link direto para Portal de Dados Abertos do TSE
- [ ] Script de importação de CSV real do TSE (dados reais 2010-2022)
- [ ] Upload de GeoJSON para S3 (otimização de carregamento)
- [ ] Cache Redis para dados agregados

## Qualidade

- [x] Interface responsiva (mobile, tablet, desktop)
- [x] Loading states e empty states em todos os componentes
- [x] Testes unitários: 11 testes passando (auth + election endpoints)
- [x] TypeScript sem erros de compilação
- [ ] Acessibilidade: navegação por teclado, screen readers (parcial)
