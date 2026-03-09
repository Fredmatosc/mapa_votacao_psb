import { useFilters } from "@/contexts/FiltersContext";
import { PARTY_COLORS, PSB_COLOR, UFS, formatPercent, formatVotes } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ChevronDown, ChevronRight, ChevronUp, Table2, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { CandidateDrillDown } from "./CandidateDrillDown";

type SortKey = "uf" | "totalVotos" | "percentualVotos";
type SortDir = "asc" | "desc";

interface ResultsTableProps {
  onUFClick?: (uf: string, nome: string) => void;
}

export function ResultsTable({ onUFClick }: ResultsTableProps = {}) {
  const { filters, setFilters } = useFilters();
  const [sortKey, setSortKey] = useState<SortKey>("totalVotos");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedUf, setExpandedUf] = useState<string | null>(null);

  const { data, isLoading } = trpc.map.resultsByUf.useQuery({
    ano: filters.ano,
    turno: filters.turno,
    cargo: filters.cargo,
    partidoSigla: filters.partidoSigla || undefined,
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function handleRowClick(uf: string) {
    // Toggle expanded drill-down
    if (expandedUf === uf) {
      setExpandedUf(null);
    } else {
      setExpandedUf(uf);
      // Also update map filter
      setFilters({ uf, viewLevel: "uf" });
    }
  }

  const sorted = data
    ? [...data].sort((a, b) => {
        let va: string | number = 0;
        let vb: string | number = 0;
        if (sortKey === "uf") { va = a.uf; vb = b.uf; }
        else if (sortKey === "totalVotos") { va = Number(a.totalVotos); vb = Number(b.totalVotos); }
        else if (sortKey === "percentualVotos") { va = Number(a.percentualVotos); vb = Number(b.percentualVotos); }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      })
    : [];

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  const maxVotes = Math.max(...(sorted.map((d) => Number(d.totalVotos))), 1);
  const isPsb = filters.partidoSigla === "PSB";

  return (
    <Card className="border-border">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Table2 className="w-4 h-4 text-primary" />
            Resultados por Estado — {filters.partidoSigla || "Todos"} · {filters.cargo} · {filters.ano}
          </CardTitle>
          {expandedUf && (
            <button
              onClick={() => setExpandedUf(null)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Fechar detalhe
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
          <Users className="w-3 h-3" />
          Clique em um estado para ver os candidatos individuais com votos e situação eleitoral
        </p>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {isLoading ? (
          <div className="px-4 pb-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="px-4 pb-6 text-center text-sm text-muted-foreground">
            Sem dados disponíveis para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground w-6" />
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => handleSort("uf")}>
                      Estado <SortIcon col="uf" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-2 font-semibold text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-foreground ml-auto" onClick={() => handleSort("totalVotos")}>
                      Votos <SortIcon col="totalVotos" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-2 font-semibold text-muted-foreground hidden sm:table-cell">
                    <button className="flex items-center gap-1 hover:text-foreground ml-auto" onClick={() => handleSort("percentualVotos")}>
                      % <SortIcon col="percentualVotos" />
                    </button>
                  </th>
                  <th className="px-4 py-2 hidden md:table-cell">
                    <span className="text-muted-foreground">Proporção</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const ufInfo = UFS.find((u) => u.value === row.uf);
                  const isExpanded = expandedUf === row.uf;
                  const isSelected = filters.uf === row.uf;
                  const pct = (Number(row.totalVotos) / maxVotes) * 100;

                  return (
                    <>
                      {/* Linha do estado */}
                      <tr
                        key={row.uf}
                        className={cn(
                          "border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors",
                          isExpanded && "bg-primary/5 border-primary/20",
                          isSelected && !isExpanded && "bg-muted/20"
                        )}
                        onClick={() => handleRowClick(row.uf)}
                      >
                        {/* Expand icon */}
                        <td className="px-3 py-2.5 w-6">
                          {isExpanded
                            ? <ChevronDown className="w-3.5 h-3.5 text-primary" />
                            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                          }
                        </td>

                        {/* Estado */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 font-bold",
                                isExpanded && "border-primary text-primary bg-primary/5",
                                isPsb && isExpanded && "border-orange-500 text-orange-600 bg-orange-50/50"
                              )}
                            >
                              {row.uf}
                            </Badge>
                            <span className={cn(
                              "hidden sm:inline",
                              isExpanded ? "text-foreground font-medium" : "text-foreground"
                            )}>
                              {ufInfo?.label ?? row.uf}
                            </span>
                          </div>
                        </td>

                        {/* Votos */}
                        <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                          {formatVotes(Number(row.totalVotos))}
                        </td>

                        {/* % */}
                        <td className="px-4 py-2.5 text-right hidden sm:table-cell" style={{ color: isPsb ? "#f97316" : PSB_COLOR }}>
                          {formatPercent(row.percentualVotos)}
                        </td>

                        {/* Barra */}
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden w-24">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: PARTY_COLORS[filters.partidoSigla ?? ""] ?? PSB_COLOR,
                              }}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Drill-down de candidatos */}
                      {isExpanded && (
                        <tr key={`${row.uf}-drilldown`}>
                          <td colSpan={5} className="px-4 py-3 bg-muted/10 border-b border-border/50">
                            <CandidateDrillDown
                              uf={row.uf}
                              ano={filters.ano ?? 2022}
                              turno={filters.turno ?? 1}
                              cargo={filters.cargo ?? "DEPUTADO FEDERAL"}
                              partidoSigla={filters.partidoSigla || undefined}
                              onClose={() => setExpandedUf(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer com legenda */}
        {sorted.length > 0 && (
          <div className="px-4 py-2 border-t border-border/50 bg-muted/20 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {sorted.length} estado{sorted.length !== 1 ? "s" : ""} · Total:{" "}
              <strong>{formatVotes(sorted.reduce((s, r) => s + Number(r.totalVotos), 0))}</strong> votos
            </span>
            <span className="text-[10px] text-muted-foreground">
              ↕ Clique no cabeçalho para ordenar · ▶ Clique no estado para ver candidatos
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
