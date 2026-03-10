import { ElectionContextPanel } from "@/components/ElectionContextPanel";
import { FilterPanel } from "@/components/FilterPanel";
import { KpiPanel } from "@/components/KpiPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useFilters } from "@/contexts/FiltersContext";
import { CARGOS, UFS } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  ChevronRight,
  Database,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
  const hasRealData = filters.ano === 2020 || filters.ano === 2022;
  const isMunicipal = [2012, 2016, 2020, 2024].includes(filters.ano);

  const dataStatus = hasRealData
    ? { label: "Dados reais TSE", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" }
    : { label: "Dados estimados", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };

  // Dummy close handler — painel contextual é sempre visível, não fecha
  const handleClosePanel = () => {};

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
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-sm leading-tight text-foreground">Análise Eleitoral</div>
              <div className="text-[10px] text-muted-foreground leading-tight">Hub PSB · Módulo 2</div>
            </div>
          </div>

          <div className="hidden md:block w-px h-6 bg-border mx-1 flex-shrink-0" />

          {/* Breadcrumb context */}
          <div className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 px-2.5 py-1 bg-muted/50 rounded-full border border-border/60 text-xs overflow-hidden max-w-full">
              {filters.partidoSigla ? (
                <Badge
                  variant="outline"
                  className="text-xs font-bold px-1.5 py-0 h-5 border-orange-400 text-orange-600 bg-orange-50 flex-shrink-0"
                >
                  {filters.partidoSigla}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-[10px] flex-shrink-0">Todos os partidos</span>
              )}
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
          {filters.partidoSigla ? (
            <span className="font-semibold text-orange-600">{filters.partidoSigla}</span>
          ) : (
            <span>Todos os partidos</span>
          )}
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

        {/* Main content — KPIs + painel contextual como visualização principal */}
        <main className="flex-1 overflow-hidden min-w-0 bg-background flex flex-col">
          {/* KPIs */}
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <KpiPanel />
          </div>

          {/* Painel contextual eleitoral — visualização principal */}
          <div className="flex-1 overflow-hidden px-4 pb-4">
            {filters.uf ? (
              <ElectionContextPanel
                uf={filters.uf}
                nomeUf={ufInfo?.label ?? filters.uf}
                onClose={handleClosePanel}
                embedded
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground max-w-sm">
                  <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Selecione um Estado para começar
                  </h3>
                  <p className="text-sm">
                    Use os filtros na barra lateral para escolher o ano, turno, cargo e estado.
                    Os resultados eleitorais com candidatos, votos e situação eleitoral serão exibidos aqui.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
