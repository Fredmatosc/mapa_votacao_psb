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
- [x] Script de importação de CSV real do TSE (dados reais 2020 e 2022)
- [ ] Upload de GeoJSON para S3 (otimização de carregamento)
- [ ] Cache Redis para dados agregados

## Qualidade

- [x] Interface responsiva (mobile, tablet, desktop)
- [x] Loading states e empty states em todos os componentes
- [x] Testes unitários: 11 testes passando (auth + election endpoints)
- [x] TypeScript sem erros de compilação
- [ ] Acessibilidade: navegação por teclado, screen readers (parcial)

## Drill-down de Candidatos (nova funcionalidade)

- [ ] Reestruturar tabela `election_results_by_uf`: separar agregado por partido (sem candidato) de individual por candidato
- [ ] Adicionar campo `eleito` (boolean) e `numeroVotos` na tabela de candidatos e resultados
- [ ] Novo endpoint: `map.candidatesByUf` — lista candidatos de um partido/UF/ano/cargo com votos e situação
- [ ] Novo endpoint: `map.candidatesByZone` — votos de um candidato por zona eleitoral
- [ ] Componente de tabela expansível: clicar na linha do partido expande os candidatos abaixo
- [ ] Linha de candidato com: nome, número, votos, % do partido, situação (ELEITO / NÃO ELEITO)
- [ ] Ao clicar no candidato, expandir detalhamento por zona eleitoral
- [ ] Seed com candidatos individuais reais do PSB (nome, número, votos por UF, situação)
- [ ] Seed com votos por zona eleitoral para candidatos PSB selecionados

## Importação de Dados Reais do TSE

- [ ] Explorar estrutura dos CSVs do TSE (votação nominal por município e zona)
- [ ] Baixar dados de candidatos 2022 (boletim de urna / votação nominal)
- [ ] Baixar dados de candidatos 2020 (eleições municipais)
- [ ] Reestruturar schema: nova tabela `candidate_results` (candidato + UF + votos + situação)
- [ ] Reestruturar schema: nova tabela `candidate_zone_results` (candidato + zona + votos)
- [ ] Adicionar campo `eleito` boolean e `situacaoEleitoral` na tabela de candidatos
- [ ] Script de processamento e importação dos CSVs do TSE
- [ ] Importar dados reais 2022: Presidente, Governador, Senador, Dep. Federal, Dep. Estadual
- [ ] Importar dados reais 2020: Prefeito, Vereador
- [ ] Novos endpoints: candidatesByUf, candidateZoneDetail
- [ ] Interface drill-down na tabela: partido → candidatos → zonas

## Painel de Resumo Eleitoral Contextual (Sprint atual)

- [x] Endpoint contextSummary: retorna todos os candidatos + resumo por UF/ano/cargo
- [x] Componente ElectionContextPanel: painel lateral com todos os candidatos
- [x] Painel abre automaticamente ao selecionar UF no dropdown da sidebar (sem depender de clique no mapa)
- [x] Filtro de partido dentro do painel (PSB destacado, mas todos visíveis)
- [x] Busca de candidato dentro do painel contextual
- [ ] Paginação de candidatos no painel (muitos candidatos por estado)
- [x] Ordenação por votos, nome, situação eleitoral dentro do painel

## Melhorias Sprint Atual

- [x] Filtro por município no painel contextual (dropdown + endpoint por município)
- [x] Tabela de resultados: drill-down de candidatos ao clicar em um estado/partido
- [ ] Tabela de resultados: mostrar todos os partidos quando nenhum partido está filtrado
- [ ] Melhorar layout geral: header mais compacto, sidebar mais organizada
- [ ] Melhorar responsividade do mapa e painel contextual
- [ ] Adicionar breadcrumb de navegação (Brasil > UF > Município)
- [ ] Melhorar legibilidade das cores e tipografia

## Melhorias Layout e Filtros (Sprint atual)

- [x] Importação 2022 concluída: 52.520 candidatos de todos os estados
- [x] Endpoint countEleitos: contagem de candidatos eleitos por partido/cargo/ano
- [x] KPI card "Candidatos Eleitos" com cor verde e tooltip
- [x] KPI cards com accentColor dinâmico por partido selecionado
- [x] FilterPanel: filtro de município com dropdown de busca inline
- [x] FilterPanel: indicador de dados reais disponíveis (ponto verde nos anos 2020/2022)
- [x] FilterPanel: contador de filtros ativos no header
- [x] FilterPanel: chip de município selecionado com botão de remoção
- [x] Testes unitários: 21 testes passando (incluindo countEleitos)

## Bug Fix

- [x] Tabela de candidatos: ordenar por votos decrescente (mais votado primeiro), não alfabético
