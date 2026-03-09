import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { ElectionContextPanel } from "@/components/ElectionContextPanel";
import { ElectionMap } from "@/components/ElectionMap";
import { FilterPanel } from "@/components/FilterPanel";
import { KpiPanel } from "@/components/KpiPanel";
import { ResultsTable } from "@/components/ResultsTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFilters } from "@/contexts/FiltersContext";
import { CARGOS, UFS } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ChevronRight,
  Database,
  ExternalLink,
  Info,
  Map,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Table2,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ActiveView = "map" | "charts" | "table";

interface SelectedUF {
  uf: string;
  nome: string;
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>("map");
  const [selectedUF, setSelectedUF] = useState<SelectedUF | null>(null);
  const { filters } = useFilters();

  const seedMutation = trpc.seed.run.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Dados carregados com sucesso!", { description: result.message });
      } else {
        toast.error("Erro ao carregar dados", { description: result.message });
      }
    },
    onError: (err) => toast.error("Erro ao carregar dados", { description: err.message }),
  });

  const cargoLabel = CARGOS.find((c) => c.value === filters.cargo)?.label ?? filters.cargo;
  const ufInfo = UFS.find((u) => u.value === filters.uf);

  // Abrir painel contextual automaticamente ao selecionar UF no dropdown
  useEffect(() => {
    if (filters.uf) {
      setSelectedUF({ uf: filters.uf, nome: ufInfo?.label ?? filters.uf });
    } else {
      setSelectedUF(null);
    }
  }, [filters.uf]);

  const handleUFClick = (uf: string, nome: string) => {
    setSelectedUF({ uf, nome });
  };

  const handleClosePanel = () => {
    setSelectedUF(null);
  };

  // Determine if we're in municipal election mode
  const isMunicipal = [2012, 2016, 2020, 2024].includes(filters.ano);

  // Determine data availability
  const hasRealData = filters.ano === 2020 || filters.ano === 2022;
  const dataStatus = hasRealData
    ? { label: "Dados reais TSE", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" }
    : { label: "Dados estimados", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };

  const views = [
    { id: "map" as ActiveView, icon: Map, label: "Mapa" },
    { id: "charts" as ActiveView, icon: BarChart3, label: "Gráficos" },
    { id: "table" as ActiveView, icon: Table2, label: "Tabela" },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-border bg-white z-50 shadow-sm">
        <div className="flex items-center h-14 px-3 gap-2">
          {/* Sidebar toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {sidebarOpen ? "Fechar filtros" : "Abrir filtros"}
            </TooltipContent>
          </Tooltip>

          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #FF6B00, #FF8C38)" }}
            >
              <Map className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-sm leading-tight text-foreground">Mapa de Votação</div>
              <div className="text-[10px] text-muted-foreground leading-tight">Hub PSB · Módulo 2</div>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-border mx-1 flex-shrink-0" />

          {/* Breadcrumb context */}
          <div className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-muted/50 rounded-full border border-border/60 text-xs overflow-hidden max-w-full">
              <Badge
                variant="outline"
                className="text-xs font-bold px-1.5 py-0 h-5 border-orange-400 text-orange-600 bg-orange-50 flex-shrink-0"
              >
                {filters.partidoSigla}
              </Badge>
              <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground truncate">{cargoLabel}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="font-semibold text-foreground flex-shrink-0">{filters.ano}</span>
              <span className="text-muted-foreground flex-shrink-0">· {filters.turno}º T</span>
              {isMunicipal && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-0.5 flex-shrink-0">
                  Municipal
                </Badge>
              )}
              {ufInfo && (
                <>
                  <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <Badge variant="secondary" className="text-xs px-2 py-0 h-5 flex-shrink-0">
                    {ufInfo.value} — {ufInfo.label}
                  </Badge>
                </>
              )}
              {filters.nomeMunicipio && (
                <>
                  <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <Badge variant="secondary" className="text-xs px-2 py-0 h-5 flex-shrink-0 max-w-32 truncate">
                    {filters.nomeMunicipio}
                  </Badge>
                </>
              )}
            </div>

            {/* Data status badge */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium flex-shrink-0",
                  dataStatus.bg, dataStatus.color
                )}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", hasRealData ? "bg-emerald-500" : "bg-amber-500")} />
                  {dataStatus.label}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {hasRealData
                  ? "Dados importados diretamente do Portal de Dados Abertos do TSE"
                  : "Dados estimados baseados em tendências históricas. Importe dados reais do TSE para maior precisão."}
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex-1 md:hidden" />

          {/* View switcher */}
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-1 border border-border/60 flex-shrink-0">
            {views.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveView(id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                  activeView === id
                    ? "bg-white text-foreground shadow-sm border border-border/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-1 flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 hidden lg:flex"
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                >
                  {seedMutation.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Database className="w-3.5 h-3.5" />
                  )}
                  {seedMutation.isPending ? "Carregando..." : "Seed"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Carregar dados de amostra do TSE</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://dadosabertos.tse.jus.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center gap-1.5 h-8 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md hover:bg-muted"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">TSE</span>
                </a>
              </TooltipTrigger>
              <TooltipContent>Portal de Dados Abertos do TSE</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Mobile context bar */}
        <div className="md:hidden flex items-center gap-1.5 px-4 py-1.5 bg-muted/30 border-t border-border/40 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
          <span className="font-semibold text-orange-600">{filters.partidoSigla}</span>
          <span>·</span>
          <span>{cargoLabel}</span>
          <span>·</span>
          <span className="font-medium">{filters.ano}</span>
          <span>· {filters.turno}º T</span>
          {ufInfo && <><span>·</span><span className="font-medium">{ufInfo.value}</span></>}
          {filters.nomeMunicipio && <><span>·</span><span>{filters.nomeMunicipio}</span></>}
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (filters) */}
        <FilterPanel collapsed={!sidebarOpen} />

        {/* Main content */}
        <main className="flex-1 overflow-auto min-w-0 bg-background">
          {/* KPIs */}
          <div className="px-4 pt-4 pb-2">
            <KpiPanel />
          </div>

          {/* View content */}
          <div className="px-4 pb-4">
            {activeView === "map" && (
              <div>
                {/* Map header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Distribuição de votos por estado
                    </span>
                    {ufInfo && (
                      <Badge variant="outline" className="text-xs">
                        Zoom: {ufInfo.label}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: "#FFF5E6" }} />
                      <span>Baixo</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: "#FF8200" }} />
                      <span>Médio</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: "#994E00" }} />
                      <span>Alto</span>
                    </div>
                  </div>
                </div>

                {/* Map container */}
                <div
                  className="rounded-xl overflow-hidden border border-border shadow-sm"
                  style={{ height: "calc(100vh - 22rem)" }}
                >
                  <ElectionMap onUFClick={handleUFClick} />
                </div>

                {/* Map hint */}
                <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Info className="w-3 h-3" />
                  <span>
                    Selecione um <strong>Estado (UF)</strong> na sidebar para ver o detalhamento de candidatos
                    {!hasRealData && (
                      <span className="text-amber-600 ml-1">
                        · Dados estimados para {filters.ano} — use 2020 ou 2022 para dados reais do TSE
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {activeView === "charts" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Análises comparativas</span>
                  {!hasRealData && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                      Dados estimados
                    </Badge>
                  )}
                </div>
                <AnalyticsCharts />
              </div>
            )}

            {activeView === "table" && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Table2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Resultados por estado</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    — Clique em um estado para ver os candidatos
                  </span>
                  {!hasRealData && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                      Dados estimados
                    </Badge>
                  )}
                </div>
                <ResultsTable onUFClick={handleUFClick} />
              </div>
            )}
          </div>
        </main>

        {/* ── Context Panel (slides in from right) ───────────────────── */}
        <div
          className={cn(
            "flex-shrink-0 border-l border-border overflow-hidden transition-all duration-300",
            selectedUF ? "w-[460px] max-w-[90vw]" : "w-0"
          )}
        >
          {selectedUF && (
            <ElectionContextPanel
              uf={selectedUF.uf}
              nomeUf={selectedUF.nome}
              onClose={handleClosePanel}
            />
          )}
        </div>
      </div>
    </div>
  );
}
