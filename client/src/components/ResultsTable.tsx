import { useFilters } from "@/contexts/FiltersContext";
import { PARTY_COLORS, PSB_COLOR, UFS, formatPercent, formatVotes } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ChevronDown, ChevronUp, Table2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

type SortKey = "uf" | "totalVotos" | "percentualVotos";
type SortDir = "asc" | "desc";

export function ResultsTable() {
  const { filters, setFilters } = useFilters();
  const [sortKey, setSortKey] = useState<SortKey>("totalVotos");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

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

  return (
    <Card className="border-border">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Table2 className="w-4 h-4 text-primary" />
          Resultados por Estado — {filters.partidoSigla} · {filters.cargo} · {filters.ano}
        </CardTitle>
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
            Sem dados disponíveis. Carregue os dados do TSE.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
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
                {sorted.map((row, i) => {
                  const ufInfo = UFS.find((u) => u.value === row.uf);
                  const isSelected = filters.uf === row.uf;
                  const pct = (Number(row.totalVotos) / maxVotes) * 100;
                  return (
                    <tr
                      key={row.uf}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors",
                        isSelected && "bg-primary/5"
                      )}
                      onClick={() => setFilters({ uf: isSelected ? null : row.uf, viewLevel: isSelected ? "nacional" : "uf" })}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5 py-0 font-bold", isSelected && "border-primary text-primary")}
                          >
                            {row.uf}
                          </Badge>
                          <span className="text-foreground hidden sm:inline">{ufInfo?.label ?? row.uf}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                        {formatVotes(Number(row.totalVotos))}
                      </td>
                      <td className="px-4 py-2.5 text-right hidden sm:table-cell" style={{ color: PSB_COLOR }}>
                        {formatPercent(row.percentualVotos)}
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden w-24">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: PARTY_COLORS[filters.partidoSigla] ?? PSB_COLOR,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
