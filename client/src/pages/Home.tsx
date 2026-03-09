import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { ElectionMap } from "@/components/ElectionMap";
import { FilterPanel } from "@/components/FilterPanel";
import { KpiPanel } from "@/components/KpiPanel";
import { ResultsTable } from "@/components/ResultsTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFilters } from "@/contexts/FiltersContext";
import { CARGOS, UFS } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { BarChart3, Database, ExternalLink, Map, Menu, PanelLeftClose, PanelLeftOpen, RefreshCw, Table2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ActiveView = "map" | "charts" | "table";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>("map");
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
  const ufLabel = UFS.find((u) => u.value === filters.uf)?.label;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 h-14 border-b border-border bg-white flex items-center px-4 gap-3 z-50">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FF6B00" }}>
              <Map className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-sm font-display text-foreground">Mapa de Votação</span>
              <span className="text-muted-foreground text-xs ml-1.5">Hub PSB</span>
            </div>
          </div>
        </div>

        {/* Breadcrumb / Context */}
        <div className="flex items-center gap-1.5 ml-2">
          <Badge variant="outline" className="text-xs font-semibold" style={{ borderColor: "#FF6B00", color: "#FF6B00" }}>
            {filters.partidoSigla}
          </Badge>
          <span className="text-muted-foreground text-xs hidden sm:inline">·</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">{cargoLabel}</span>
          <span className="text-muted-foreground text-xs hidden sm:inline">·</span>
          <span className="text-xs font-medium hidden sm:inline">{filters.ano}</span>
          <span className="text-muted-foreground text-xs hidden sm:inline">·</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">{filters.turno}º Turno</span>
          {ufLabel && (
            <>
              <span className="text-muted-foreground text-xs">·</span>
              <Badge variant="secondary" className="text-xs">{ufLabel}</Badge>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* View switcher */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setActiveView("map")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              activeView === "map" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mapa</span>
          </button>
          <button
            onClick={() => setActiveView("charts")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              activeView === "charts" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gráficos</span>
          </button>
          <button
            onClick={() => setActiveView("table")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
              activeView === "table" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tabela</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
          >
            {seedMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {seedMutation.isPending ? "Carregando..." : "Carregar Dados"}
            </span>
          </Button>
          <a
            href="https://dadosabertos.tse.jus.br"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            TSE
          </a>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <FilterPanel collapsed={!sidebarOpen} />

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 space-y-4">
          {/* KPIs */}
          <KpiPanel />

          {/* Map view */}
          {activeView === "map" && (
            <div className="h-[calc(100vh-14rem)] min-h-[400px]">
              <ElectionMap />
            </div>
          )}

          {/* Charts view */}
          {activeView === "charts" && (
            <AnalyticsCharts />
          )}

          {/* Table view */}
          {activeView === "table" && (
            <ResultsTable />
          )}
        </main>
      </div>
    </div>
  );
}
