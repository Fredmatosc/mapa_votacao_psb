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

## Ajustes Sprint Atual

- [x] Ajuste 1: Remover pré-seleção do PSB (partido começa sem seleção)
- [x] Ajuste 1: Reordenar filtros: Ano > Turno > Cargo > UF > Cidade
- [x] Ajuste 2: Cargos dinâmicos: municipais (prefeito/vereador) para anos pares não federais; federais (dep.estadual/federal/governador/senador/presidente) para anos federais
- [x] Ajuste 2: Opção "Todos os estados" para cargo Presidente (UF oculta quando Presidente selecionado)
- [x] Ajuste 2: Município opcional — sem seleção mostra todos do estado; com seleção filtra por município
- [x] Ajuste 2: Municípios disponíveis para todos os estados (não só capital) — 5.709 municípios populados
- [x] Ajuste 3: Corrigir scroll na lista de candidatos no painel lateral (container flex-col correto)

## Ajustes Sprint 3

- [x] Remover mapa de calor e gráficos — manter apenas tabela de candidatos como visualização única
- [x] Corrigir sincronização: município selecionado na sidebar deve atualizar automaticamente o painel de candidatos
- [x] Botão PSB: remover destaque especial (borda laranja) quando não selecionado — igual aos outros partidos
- [x] Tabela: exibir por UF > Cidade > Candidato (hierarquia correta quando sem filtro de UF)

## Ajustes Sprint 4

- [x] Tabela: hierarquia UF → Municípios → Candidatos (clicar no estado abre municípios; clicar no município abre candidatos)
- [x] Corrigir filtro de partido na tabela (partido selecionado deve filtrar os resultados exibidos)
- [x] Toggle de partido: botão deve poder ser desligado clicando novamente (on/off)
- [x] Corrigir duplicatas de candidatos (613.762 registros duplicados removidos, 532.778 únicos restantes)

## Ajustes Sprint 5

- [x] Remover tabela de resultados por estado da página inicial
- [x] Painel contextual eleitoral como única visualização principal (abaixo dos KPI cards)
- [x] Corrigir detalhamento por zona eleitoral ao clicar em candidato (todos os cargos: prefeito, vereador, governador, senador, deputado, presidente)

## Ajustes Sprint 6

- [x] Corrigir scroll da lista de candidatos (painel contextual não permite rolar para ver mais)
- [x] Drill-down de zona por município: ao clicar em um município no detalhamento, mostrar as zonas eleitorais daquele município
- [x] Georreferenciamento de zonas eleitorais: 3.039 zonas importadas com bairro/localidade (ex: Zona 1 · Asa Sul, Zona 3 · Taguatinga Norte)

## Bugs Sprint 7

- [x] BUG: Scroll da lista de candidatos não funciona (mostra só 9 resultados, não rola) — corrigido substituindo React Fragment por div com flex-col flex-1 min-h-0 overflow-hidden
- [x] BUG: Filtro de partido não altera a lista de candidatos exibida (só muda os KPI cards) — corrigido adicionando useEffect que sincroniza filterPartido com filters.partidoSigla

## Bugs Sprint 8

- [x] BUG: Scroll da lista corrigido — ScrollArea do Radix substituído por div overflow-y-auto nativo
- [x] BUG: Zonas eleitorais duplicadas — 1.695.103 duplicatas removidas de candidate_zone_results
- [x] BUG: Nome da zona eleitoral — "Santa Clara" é o bairro real do cartório no TSE; agora exibimos o município (Santarém) como rótulo principal e o bairro entre parênteses como complemento

## Ajustes Sprint 8 (continuação)

- [x] Scroll: substituir ScrollArea do Radix por div overflow-y-auto nativo em toda a lista de candidatos
- [x] Deduplicar candidate_zone_results (1.695.103 duplicatas removidas)
- [x] Exibição de zonas: mostrar "Zona X · NomeMunicipio" em vez de bairro do cartório
- [x] Exibição de zonas: endereço do cartório exibido como informação secundária entre parênteses
