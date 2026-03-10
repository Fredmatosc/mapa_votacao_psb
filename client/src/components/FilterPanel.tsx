import { useFilters } from "@/contexts/FiltersContext";
import { CARGOS, PARTY_COLORS, UFS } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Building2, ChevronDown, Filter, MapPin, RotateCcw, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const [municipioSearch, setMunicipioSearch] = useState("");
  const [showMunicipioDropdown, setShowMunicipioDropdown] = useState(false);

  // Determine election type
  const isMunicipal = [2012, 2016, 2020, 2024].includes(filters.ano);
  const isPresidente = filters.cargo === "PRESIDENTE";

  // When year changes, reset cargo to a valid one for that election type
  useEffect(() => {
    const validCargos = CARGOS.filter(c => isMunicipal ? c.tipo === "municipal" : c.tipo === "geral");
    const isCurrentCargoValid = validCargos.some(c => c.value === filters.cargo);
    if (!isCurrentCargoValid) {
      setFilters({ cargo: validCargos[0]?.value ?? "DEPUTADO FEDERAL", codigoMunicipio: null, nomeMunicipio: null });
    }
  }, [filters.ano]);

  // When cargo changes to PRESIDENTE, clear UF selection
  useEffect(() => {
    if (isPresidente && filters.uf) {
      setFilters({ uf: null, codigoMunicipio: null, nomeMunicipio: null, viewLevel: "nacional" });
    }
  }, [filters.cargo]);

  const { data: parties } = trpc.parties.list.useQuery();

  const { data: candidateResults } = trpc.candidates.search.useQuery(
    { query: candidateSearch, ano: filters.ano, cargo: filters.cargo, uf: filters.uf ?? undefined },
    { enabled: candidateSearch.length >= 2 }
  );

  // Use municipalitiesWithData (filtered by ano+cargo) instead of static municipalities table
  const { data: municipiosWithData } = trpc.candidates.municipalitiesWithData.useQuery(
    { ano: filters.ano, cargo: filters.cargo, uf: filters.uf! },
    { enabled: !!filters.uf && !isPresidente }
  );

  const filteredMunicipios = useMemo(() => {
    if (!municipiosWithData) return [];
    if (!municipioSearch.trim()) return municipiosWithData;
    const q = municipioSearch.toLowerCase();
    return municipiosWithData.filter((m) => (m.nomeMunicipio ?? "").toLowerCase().includes(q));
  }, [municipiosWithData, municipioSearch]);

  const topParties = ["PSB", "PT", "PL", "MDB", "PSDB", "PDT", "PP", "PSD", "PSOL", "PCdoB"];
  const displayedParties = parties
    ? showAllParties
      ? parties
      : parties.filter((p) => topParties.includes(p.sigla))
    : [];

  const activeFilterCount = [
    filters.uf,
    filters.codigoMunicipio,
    filters.cargo !== (isMunicipal ? "VEREADOR" : "DEPUTADO FEDERAL"),
    filters.turno !== 1,
    filters.partidoSigla !== "",
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border flex-shrink-0">
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

          {/* 1. Ano */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
              Eleição
            </Label>
            <div className="space-y-1.5">
              <div className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider">Gerais</div>
              <div className="grid grid-cols-4 gap-1">
                {[2010, 2014, 2018, 2022].map((ano) => (
                  <button
                    key={ano}
                    onClick={() => setFilters({ ano })}
                    className={cn(
                      "py-1.5 text-xs rounded font-medium transition-colors relative",
                      filters.ano === ano
                        ? "bg-primary text-primary-foreground"
                        : "bg-sidebar-accent text-sidebar-foreground/70 hover:bg-sidebar-accent/80"
                    )}
                  >
                    {ano}
                    {(ano === 2022) && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-sidebar-foreground/40 uppercase tracking-wider mt-1">Municipais</div>
              <div className="grid grid-cols-4 gap-1">
                {[2012, 2016, 2020, 2024].map((ano) => (
                  <button
                    key={ano}
                    onClick={() => setFilters({ ano })}
                    className={cn(
                      "py-1.5 text-xs rounded font-medium transition-colors relative",
                      filters.ano === ano
                        ? "bg-primary text-primary-foreground"
                        : "bg-sidebar-accent text-sidebar-foreground/70 hover:bg-sidebar-accent/80"
                    )}
                  >
                    {ano}
                    {ano === 2020 && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-[10px] text-sidebar-foreground/40">Dados reais do TSE disponíveis</span>
              </div>
            </div>
          </div>

          {/* 2. Turno */}
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

          {/* 3. Cargo */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
              Cargo
            </Label>
            <Select value={filters.cargo} onValueChange={(v) => setFilters({ cargo: v })}>
              <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CARGOS.filter(c => isMunicipal ? c.tipo === "municipal" : c.tipo === "geral").map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isPresidente && (
              <p className="text-[10px] text-sidebar-foreground/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                Presidente: exibe resultado nacional (todos os estados)
              </p>
            )}
          </div>

          <Separator className="bg-sidebar-border" />

          {/* 4. UF — oculto para Presidente */}
          {!isPresidente && (
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
          )}

          {/* 5. Município — aparece quando UF selecionada e não é Presidente */}
          {filters.uf && !isPresidente && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                Município
                {municipiosWithData && (
                  <span className="text-[10px] text-sidebar-foreground/40 font-normal normal-case tracking-normal">
                    ({municipiosWithData.length} disponíveis)
                  </span>
                )}
              </Label>

              {/* Dropdown customizado com busca */}
              <div className="relative">
                <button
                  onClick={() => setShowMunicipioDropdown(!showMunicipioDropdown)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 rounded border text-xs transition-colors text-left",
                    filters.codigoMunicipio
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-sidebar-border bg-sidebar-accent text-sidebar-foreground/70 hover:border-sidebar-foreground/30"
                  )}
                >
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span className="flex-1 truncate">
                    {filters.nomeMunicipio ?? "Todos os municípios"}
                  </span>
                  {filters.codigoMunicipio ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters({ codigoMunicipio: null, nomeMunicipio: null, viewLevel: "uf" });
                        setMunicipioSearch("");
                      }}
                      className="p-0.5 hover:bg-primary/20 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : (
                    <ChevronDown className={cn("w-3 h-3 transition-transform", showMunicipioDropdown && "rotate-180")} />
                  )}
                </button>

                {showMunicipioDropdown && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <input
                          autoFocus
                          value={municipioSearch}
                          onChange={(e) => setMunicipioSearch(e.target.value)}
                          placeholder="Buscar município..."
                          className="w-full pl-7 pr-2 py-1 text-xs bg-background border border-border rounded outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      <button
                        onClick={() => {
                          setFilters({ codigoMunicipio: null, nomeMunicipio: null, viewLevel: "uf" });
                          setShowMunicipioDropdown(false);
                          setMunicipioSearch("");
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors",
                          !filters.codigoMunicipio && "bg-primary/10 text-primary font-medium"
                        )}
                      >
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        Todos os municípios
                      </button>
                      {filteredMunicipios.map((m) => (
                        <button
                          key={m.codigoMunicipio}
                          onClick={() => {
                            setFilters({
                              codigoMunicipio: m.codigoMunicipio ?? null,
                              nomeMunicipio: m.nomeMunicipio ?? null,
                              viewLevel: "municipio",
                            });
                            setShowMunicipioDropdown(false);
                            setMunicipioSearch("");
                          }}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors",
                            filters.codigoMunicipio === m.codigoMunicipio && "bg-primary/10 text-primary font-medium"
                          )}
                        >
                          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{m.nomeMunicipio}</span>
                        </button>
                      ))}
                      {filteredMunicipios.length === 0 && municipiosWithData && (
                        <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                          Nenhum município encontrado
                        </div>
                      )}
                      {!municipiosWithData && (
                        <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                          Carregando municípios...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Chip do município selecionado */}
              {filters.nomeMunicipio && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded border border-primary/20 text-xs text-primary">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate flex-1">{filters.nomeMunicipio}</span>
                  <button
                    onClick={() => setFilters({ codigoMunicipio: null, nomeMunicipio: null, viewLevel: "uf" })}
                    className="hover:bg-primary/20 rounded p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          <Separator className="bg-sidebar-border" />

          {/* 6. Partido (opcional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
                Partido
              </Label>
              {filters.partidoSigla && (
                <button
                  onClick={() => setFilters({ partidoSigla: "" })}
                  className="text-[10px] text-sidebar-foreground/50 hover:text-sidebar-foreground flex items-center gap-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                  Limpar
                </button>
              )}
            </div>
            {!filters.partidoSigla && (
              <p className="text-[10px] text-sidebar-foreground/40">
                Nenhum partido selecionado — exibindo todos
              </p>
            )}
            <div className="grid grid-cols-3 gap-1">
              {displayedParties.map((party) => {
                const isPSB = party.sigla === "PSB";
                const isSelected = filters.partidoSigla === party.sigla;
                const color = PARTY_COLORS[party.sigla] ?? PARTY_COLORS.DEFAULT;
                return (
                  <button
                    key={party.sigla}
                    onClick={() => setFilters({ partidoSigla: isSelected ? "" : party.sigla })}
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

          {/* 7. Busca de candidatos */}
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
              {candidateSearch && (
                <button
                  onClick={() => setCandidateSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {candidateResults && candidateResults.length > 0 && (
              <div className="bg-sidebar-accent rounded border border-sidebar-border overflow-hidden">
                {candidateResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (c.uf) setFilters({ uf: c.uf, viewLevel: "uf" });
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-sidebar-border/50 border-b border-sidebar-border/50 last:border-0 transition-colors"
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
