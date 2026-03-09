import { useFilters } from "@/contexts/FiltersContext";
import { ANOS_ELEICAO, CARGOS, PARTY_COLORS, UFS } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ChevronDown, Filter, RotateCcw, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";

interface FilterPanelProps {
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function FilterPanel({ className, collapsed, onToggle }: FilterPanelProps) {
  const { filters, setFilters, resetFilters } = useFilters();
  const [candidateSearch, setCandidateSearch] = useState("");
  const [showAllParties, setShowAllParties] = useState(false);

  const { data: parties } = trpc.parties.list.useQuery();

  const { data: candidateResults } = trpc.candidates.search.useQuery(
    { query: candidateSearch, ano: filters.ano, cargo: filters.cargo, uf: filters.uf ?? undefined },
    { enabled: candidateSearch.length >= 2 }
  );

  const { data: municipalities } = trpc.municipalities.byUf.useQuery(
    { uf: filters.uf! },
    { enabled: !!filters.uf }
  );

  const topParties = ["PSB", "PT", "PL", "MDB", "PSDB", "PDT", "PP", "PSD", "PSOL", "PCdoB"];
  const displayedParties = parties
    ? showAllParties
      ? parties
      : parties.filter((p) => topParties.includes(p.sigla))
    : [];

  const activeFilterCount = [
    filters.uf,
    filters.codigoMunicipio,
    filters.cargo !== "DEPUTADO FEDERAL",
    filters.turno !== 1,
  ].filter(Boolean).length;

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-0 overflow-hidden" : "w-72",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm font-display">Filtros</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs px-1.5 py-0">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground h-7 px-2 text-xs"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Limpar
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Ano */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
              Eleição
            </Label>
            <div className="grid grid-cols-4 gap-1">
              {ANOS_ELEICAO.map((ano) => (
                <button
                  key={ano}
                  onClick={() => setFilters({ ano })}
                  className={cn(
                    "py-1.5 text-xs rounded font-medium transition-colors",
                    filters.ano === ano
                      ? "bg-primary text-primary-foreground"
                      : "bg-sidebar-accent text-sidebar-foreground/70 hover:bg-sidebar-accent/80"
                  )}
                >
                  {ano}
                </button>
              ))}
            </div>
          </div>

          {/* Turno */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
              Turno
            </Label>
            <div className="grid grid-cols-2 gap-1">
              {[1, 2].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilters({ turno: t })}
                  className={cn(
                    "py-1.5 text-xs rounded font-medium transition-colors",
                    filters.turno === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-sidebar-accent text-sidebar-foreground/70 hover:bg-sidebar-accent/80"
                  )}
                >
                  {t}º Turno
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Cargo */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
              Cargo
            </Label>
            <Select value={filters.cargo} onValueChange={(v) => setFilters({ cargo: v })}>
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARGOS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Partido */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
              Partido
            </Label>
            <div className="grid grid-cols-3 gap-1">
              {displayedParties.map((party) => {
                const isPSB = party.sigla === "PSB";
                const isSelected = filters.partidoSigla === party.sigla;
                const color = PARTY_COLORS[party.sigla] ?? PARTY_COLORS.DEFAULT;
                return (
                  <button
                    key={party.sigla}
                    onClick={() => setFilters({ partidoSigla: party.sigla })}
                    title={party.nome}
                    className={cn(
                      "py-1.5 text-xs rounded font-semibold transition-all border",
                      isSelected
                        ? "text-white border-transparent shadow-sm"
                        : "bg-sidebar-accent text-sidebar-foreground/70 border-sidebar-border hover:border-sidebar-foreground/30",
                      isPSB && !isSelected && "border-orange-500/50 text-orange-400"
                    )}
                    style={isSelected ? { backgroundColor: color, borderColor: color } : {}}
                  >
                    {party.sigla}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowAllParties(!showAllParties)}
              className="text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground/80 flex items-center gap-1 mt-1"
            >
              <ChevronDown className={cn("w-3 h-3 transition-transform", showAllParties && "rotate-180")} />
              {showAllParties ? "Ver menos" : "Ver todos os partidos"}
            </button>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* UF */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
              Estado (UF)
            </Label>
            <Select
              value={filters.uf ?? "all"}
              onValueChange={(v) =>
                setFilters({
                  uf: v === "all" ? null : v,
                  codigoMunicipio: null,
                  nomeMunicipio: null,
                  viewLevel: v === "all" ? "nacional" : "uf",
                })
              }
            >
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-sm h-8">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {UFS.map((uf) => (
                  <SelectItem key={uf.value} value={uf.value}>
                    {uf.value} — {uf.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Município (só aparece quando UF selecionada) */}
          {filters.uf && municipalities && municipalities.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
                Município
              </Label>
              <Select
                value={filters.codigoMunicipio ?? "all"}
                onValueChange={(v) => {
                  if (v === "all") {
                    setFilters({ codigoMunicipio: null, nomeMunicipio: null, viewLevel: "uf" });
                  } else {
                    const mun = municipalities.find((m) => m.codigoIbge === v);
                    setFilters({
                      codigoMunicipio: v,
                      nomeMunicipio: mun?.nome ?? null,
                      viewLevel: "municipio",
                    });
                  }
                }}
              >
                <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-sm h-8">
                  <SelectValue placeholder="Todos os municípios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os municípios</SelectItem>
                  {municipalities.map((m) => (
                    <SelectItem key={m.codigoIbge} value={m.codigoIbge}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator className="bg-sidebar-border" />

          {/* Busca de candidatos */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
              Buscar Candidato
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/40" />
              <Input
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Nome do candidato..."
                className="pl-8 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 text-sm h-8"
              />
            </div>
            {candidateResults && candidateResults.length > 0 && (
              <div className="bg-sidebar-accent rounded border border-sidebar-border overflow-hidden">
                {candidateResults.map((c) => (
                  <button
                    key={c.id}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-sidebar-border/50 border-b border-sidebar-border/50 last:border-0"
                  >
                    <div className="font-medium text-sidebar-foreground">{c.nomeUrna ?? c.nome}</div>
                    <div className="text-sidebar-foreground/50">
                      {c.partidoSigla} · {c.cargo} · {c.uf ?? "BR"} · {c.ano}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {candidateSearch.length >= 2 && candidateResults?.length === 0 && (
              <p className="text-xs text-sidebar-foreground/40 text-center py-2">
                Nenhum candidato encontrado
              </p>
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
