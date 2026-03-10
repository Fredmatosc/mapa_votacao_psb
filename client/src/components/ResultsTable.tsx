import { useFilters } from "@/contexts/FiltersContext";
import { PARTY_COLORS, PSB_COLOR, UFS, formatPercent, formatVotes } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowUpDown,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  MapPin,
  Table2,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

type SortKey = "uf" | "totalVotos" | "percentualVotos";
type SortDir = "asc" | "desc";

interface ResultsTableProps {
  onUFClick?: (uf: string, nome: string) => void;
}

// ─── Situação badge ────────────────────────────────────────────────────────
function SituacaoBadge({ situacao, eleito }: { situacao: string | null; eleito: boolean | null }) {
  if (eleito) {
    const s = (situacao ?? "").toUpperCase();
    if (s.includes("MÉDIA")) return <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 h-4 shrink-0">MÉDIA</Badge>;
    if (s.includes("QP") || s.includes("QUOCIENTE")) return <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0 h-4 shrink-0">QP</Badge>;
    return <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4 shrink-0">ELEITO</Badge>;
  }
  const s = (situacao ?? "").toUpperCase();
  if (s.includes("SUPLENTE")) return <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4 shrink-0">SUPLENTE</Badge>;
  if (s.includes("2º TURNO") || s.includes("2 TURNO")) return <Badge className="bg-blue-400 text-white text-[10px] px-1.5 py-0 h-4 shrink-0">2º TURNO</Badge>;
  return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 text-muted-foreground">NÃO ELEITO</Badge>;
}

// ─── Candidates table inside a municipality ────────────────────────────────
function MunicipioCandidates({
  uf, nomeMunicipio, ano, turno, cargo, partidoSigla,
}: {
  uf: string; nomeMunicipio: string; ano: number; turno: number; cargo: string; partidoSigla?: string;
}) {
  const { data, isLoading } = trpc.candidates.contextByMunicipality.useQuery({
    uf, nomeMunicipio, ano, turno, cargo, partidoSigla, limit: 200,
  });

  if (isLoading) return (
    <div className="p-3 space-y-1.5">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" />)}
    </div>
  );

  if (!data?.candidates?.length) return (
    <div className="p-3 text-center text-xs text-muted-foreground">
      Sem candidatos disponíveis para este município com os filtros selecionados.
    </div>
  );

  const maxVotos = Math.max(...data.candidates.map(c => c.totalVotos ?? 0), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/40 border-b border-border/50">
            <th className="text-center px-3 py-1.5 font-medium text-muted-foreground w-8">#</th>
            <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Candidato</th>
            <th className="text-left px-3 py-1.5 font-medium text-muted-foreground hidden sm:table-cell">Partido</th>
            <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Votos</th>
            <th className="text-right px-3 py-1.5 font-medium text-muted-foreground hidden md:table-cell">%</th>
            <th className="px-3 py-1.5 hidden lg:table-cell w-24">
              <span className="text-muted-foreground">Proporção</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.candidates.map((c, idx) => {
            const pct = maxVotos > 0 ? ((c.totalVotos ?? 0) / maxVotos * 100) : 0;
            return (
              <tr
                key={c.candidatoSequencial ?? idx}
                className={cn(
                  "border-t border-border/30 transition-colors",
                  c.eleito ? "bg-emerald-50/40" : "hover:bg-muted/20"
                )}
              >
                <td className="px-3 py-2 text-center">
                  <span className={cn("text-xs font-bold", idx < 3 ? "text-amber-500" : "text-muted-foreground")}>
                    {idx < 3 ? ["🥇", "🥈", "🥉"][idx] : idx + 1}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-foreground">
                      {c.candidatoNomeUrna || c.candidatoNome}
                    </span>
                    <SituacaoBadge situacao={c.situacao} eleito={c.eleito} />
                  </div>
                  {c.candidatoNumero && (
                    <span className="text-[10px] text-muted-foreground">Nº {c.candidatoNumero}</span>
                  )}
                </td>
                <td className="px-3 py-2 hidden sm:table-cell">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {c.partidoSigla}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-right font-bold text-foreground">
                  {(c.totalVotos ?? 0).toLocaleString("pt-BR")}
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground hidden md:table-cell">
                  {pct.toFixed(1)}%
                </td>
                <td className="px-3 py-2 hidden lg:table-cell">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden w-20">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: PARTY_COLORS[c.partidoSigla ?? ""] ?? PSB_COLOR,
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border bg-muted/30">
            <td colSpan={3} className="px-3 py-1.5 text-xs font-bold text-foreground">
              Total ({data.candidates.length} candidatos
              {data.candidates.filter(c => c.eleito).length > 0 && (
                <span className="text-emerald-600 ml-1">
                  · {data.candidates.filter(c => c.eleito).length} eleito{data.candidates.filter(c => c.eleito).length > 1 ? "s" : ""}
                </span>
              )})
            </td>
            <td className="px-3 py-1.5 text-right text-xs font-bold text-primary">
              {data.candidates.reduce((s, c) => s + (c.totalVotos ?? 0), 0).toLocaleString("pt-BR")}
            </td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Municipalities list inside a UF ──────────────────────────────────────
function UfMunicipios({
  uf, ano, turno, cargo, partidoSigla,
}: {
  uf: string; ano: number; turno: number; cargo: string; partidoSigla?: string;
}) {
  const [expandedMun, setExpandedMun] = useState<string | null>(null);

  const { data: municipios, isLoading } = trpc.candidates.municipalitiesWithData.useQuery({
    ano, cargo, uf,
  }, { enabled: !!uf });

  if (isLoading) return (
    <div className="p-3 space-y-1.5">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-7 w-full" />)}
    </div>
  );

  if (!municipios?.length) return (
    <div className="p-4 text-center text-xs text-muted-foreground">
      Nenhum município encontrado para este estado com os filtros selecionados.
    </div>
  );

  return (
    <div className="divide-y divide-border/30">
      {municipios.map((mun) => {
        const isOpen = expandedMun === mun.nomeMunicipio;
        return (
          <div key={mun.nomeMunicipio}>
            {/* Linha do município */}
            <div
              className={cn(
                "flex items-center gap-2 px-6 py-2 cursor-pointer hover:bg-muted/30 transition-colors",
                isOpen && "bg-blue-50/40"
              )}
              onClick={() => setExpandedMun(isOpen ? null : (mun.nomeMunicipio ?? ""))}
            >
              {isOpen
                ? <ChevronDown className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
              }
              <MapPin className="w-3 h-3 text-muted-foreground/60 shrink-0" />
              <span className={cn("text-xs font-medium", isOpen ? "text-blue-700" : "text-foreground")}>
                {mun.nomeMunicipio}
              </span>

            </div>

            {/* Candidatos do município */}
            {isOpen && (
              <div className="ml-6 border-l-2 border-blue-200 bg-white/50">
                <MunicipioCandidates
                  uf={uf}
                  nomeMunicipio={mun.nomeMunicipio ?? ""}
                  ano={ano}
                  turno={turno}
                  cargo={cargo}
                  partidoSigla={partidoSigla}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ResultsTable ─────────────────────────────────────────────────────
export function ResultsTable({ onUFClick }: ResultsTableProps = {}) {
  const { filters } = useFilters();
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

  function handleRowClick(uf: string, nome: string) {
    if (expandedUf === uf) {
      setExpandedUf(null);
    } else {
      setExpandedUf(uf);
      onUFClick?.(uf, nome);
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
  const accentColor = PARTY_COLORS[filters.partidoSigla ?? ""] ?? PSB_COLOR;

  return (
    <Card className="border-border">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Table2 className="w-4 h-4 text-primary" />
            Resultados por Estado — {filters.partidoSigla || "Todos os partidos"} · {filters.cargo} · {filters.ano}
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
          <Building2 className="w-3 h-3" />
          Clique em um estado para ver os municípios · Clique no município para ver os candidatos
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
                  const pct = (Number(row.totalVotos) / maxVotes) * 100;

                  return (
                    <>
                      {/* Linha do estado */}
                      <tr
                        key={row.uf}
                        className={cn(
                          "border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors",
                          isExpanded && "bg-primary/5 border-primary/20"
                        )}
                        onClick={() => handleRowClick(row.uf, ufInfo?.label ?? row.uf)}
                      >
                        <td className="px-3 py-2.5 w-6">
                          {isExpanded
                            ? <ChevronDown className="w-3.5 h-3.5 text-primary" />
                            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                          }
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 font-bold",
                                isExpanded && "border-primary text-primary bg-primary/5"
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
                        <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                          {formatVotes(Number(row.totalVotos))}
                        </td>
                        <td className="px-4 py-2.5 text-right hidden sm:table-cell" style={{ color: accentColor }}>
                          {formatPercent(row.percentualVotos)}
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden w-24">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: accentColor }}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Municípios expandidos */}
                      {isExpanded && (
                        <tr key={`${row.uf}-municipios`}>
                          <td colSpan={5} className="bg-slate-50/60 border-b border-border/50">
                            <div className="py-1">
                              <div className="flex items-center gap-1.5 px-6 py-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide border-b border-border/30">
                                <MapPin className="w-3 h-3" />
                                Municípios — {ufInfo?.label ?? row.uf}
                              </div>
                              <UfMunicipios
                                uf={row.uf}
                                ano={filters.ano}
                                turno={filters.turno}
                                cargo={filters.cargo}
                                partidoSigla={filters.partidoSigla || undefined}
                              />
                            </div>
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

        {sorted.length > 0 && (
          <div className="px-4 py-2 border-t border-border/50 bg-muted/20 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {sorted.length} estado{sorted.length !== 1 ? "s" : ""} · Total:{" "}
              <strong>{formatVotes(sorted.reduce((s, r) => s + Number(r.totalVotos), 0))}</strong> votos
            </span>
            <span className="text-[10px] text-muted-foreground">
              ▶ Estado → Municípios → Candidatos
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
