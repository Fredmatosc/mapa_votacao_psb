import { CandidateComparisonModal } from "@/components/CandidateComparisonModal";
import { useFilters } from "@/contexts/FiltersContext";
import { PARTY_COLORS } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Award,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GitCompare,
  MapPin,
  Medal,
  Search,
  Trophy,
  Users,
  Vote,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type SortKey = "votos" | "nome" | "partido" | "situacao";
type SituacaoFilter = "todos" | "eleitos" | "nao_eleitos" | "suplentes";

interface ElectionContextPanelProps {
  uf: string;
  nomeUf: string;
  onClose: () => void;
  embedded?: boolean; // quando true, ocupa toda a área disponível sem borda lateral
}

function getSituacaoBadge(situacao: string | null, eleito: boolean | null) {
  if (eleito) {
    const s = (situacao ?? "").toUpperCase();
    if (s.includes("MÉDIA")) return { label: "ELEITO MÉDIA", color: "bg-blue-500 text-white", icon: "🥈" };
    if (s.includes("QP") || s.includes("QUOCIENTE")) return { label: "ELEITO QP", color: "bg-emerald-500 text-white", icon: "🏆" };
    return { label: "ELEITO", color: "bg-emerald-600 text-white", icon: "✅" };
  }
  const s = (situacao ?? "").toUpperCase();
  if (s.includes("SUPLENTE")) return { label: "SUPLENTE", color: "bg-amber-500 text-white", icon: "⚡" };
  if (s.includes("2º TURNO") || s.includes("2 TURNO")) return { label: "2º TURNO", color: "bg-blue-400 text-white", icon: "🔄" };
  return { label: "NÃO ELEITO", color: "bg-slate-500 text-white", icon: "❌" };
}

function formatVotes(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("pt-BR");
}

type CandidateRow = {
  candidatoSequencial: string;
  candidatoNome: string;
  candidatoNomeUrna: string | null;
  candidatoNumero: string | null;
  partidoSigla: string;
  totalVotos: number | null;
  situacao: string | null;
  eleito: boolean | null;
  percentualSobrePartido: string | null;
};

export function ElectionContextPanel({ uf, nomeUf, onClose, embedded }: ElectionContextPanelProps) {
  const { filters } = useFilters();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("votos");
  const [sortAsc, setSortAsc] = useState(false);
  // Sync with global party filter — if a party is selected globally, pre-filter the panel
  const [filterPartido, setFilterPartido] = useState<string | null>(
    filters.partidoSigla ? filters.partidoSigla : null
  );
  const [filterSituacao, setFilterSituacao] = useState<SituacaoFilter>("todos");
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [showPartyBreakdown, setShowPartyBreakdown] = useState(false);
  const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(
    filters.nomeMunicipio ?? null
  );
  const [municipioSearch, setMunicipioSearch] = useState("");
  const [showMunicipioDropdown, setShowMunicipioDropdown] = useState(false);
  // Drill-down: município selecionado no detalhamento de votos por município
  const [drillMunicipio, setDrillMunicipio] = useState<{ nome: string; codigo: string | null } | null>(null);

  // ── Comparação de candidatos ──────────────────────────────────────────────
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<CandidateRow[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Keep selectedMunicipio in sync with the global filter
  useEffect(() => {
    setSelectedMunicipio(filters.nomeMunicipio ?? null);
  }, [filters.nomeMunicipio]);

  // Keep filterPartido in sync with the global party filter
  useEffect(() => {
    setFilterPartido(filters.partidoSigla ? filters.partidoSigla : null);
  }, [filters.partidoSigla]);

  // Reset comparison when filters change
  useEffect(() => {
    setSelectedForCompare([]);
    setShowComparison(false);
    setCompareMode(false);
  }, [filters.ano, filters.turno, filters.cargo, uf]);

  // Load list of municipalities with data for this UF/ano/cargo
  const { data: municipiosData } = trpc.candidates.municipalitiesWithData.useQuery({
    ano: filters.ano,
    cargo: filters.cargo,
    uf,
  }, { enabled: !!uf });

  const municipios = municipiosData ?? [];
  const filteredMunicipios = useMemo(() => {
    if (!municipioSearch.trim()) return municipios;
    const q = municipioSearch.toLowerCase();
    return municipios.filter(m => (m.nomeMunicipio ?? "").toLowerCase().includes(q));
  }, [municipios, municipioSearch]);

  // Load candidates by UF (when no municipality selected)
  const { data: ufData, isLoading: ufLoading } = trpc.candidates.contextSummary.useQuery({
    ano: filters.ano,
    turno: filters.turno,
    cargo: filters.cargo,
    uf,
    limit: 1000,
  }, { enabled: !!uf && !selectedMunicipio });

  // Load candidates by municipality (when municipality is selected)
  const { data: munData, isLoading: munLoading } = trpc.candidates.contextByMunicipality.useQuery({
    ano: filters.ano,
    turno: filters.turno,
    cargo: filters.cargo,
    uf,
    nomeMunicipio: selectedMunicipio!,
    limit: 1000,
  }, { enabled: !!uf && !!selectedMunicipio });

  const data = selectedMunicipio ? munData : ufData;
  const isLoading = selectedMunicipio ? munLoading : ufLoading;

  // Zone detail for expanded candidate
  // When no municipality is selected: show breakdown by municipality (votos por município)
  const { data: zoneByMunData } = trpc.candidates.zoneByMunicipality.useQuery(
    { candidatoSequencial: expandedCandidate!, ano: filters.ano, turno: filters.turno, uf },
    { enabled: !!expandedCandidate && !selectedMunicipio }
  );
  // When a municipality is selected (via selector or drill-down): show breakdown by zone
  const activeMunicipioForZone = selectedMunicipio ?? drillMunicipio?.nome ?? null;
  const { data: zoneDetailData } = trpc.candidates.zoneDetail.useQuery(
    { candidatoSequencial: expandedCandidate!, ano: filters.ano, turno: filters.turno, uf },
    { enabled: !!expandedCandidate && !!activeMunicipioForZone }
  );
  // Filter zone detail to only the active municipality
  const zoneDetailFiltered = zoneDetailData?.filter(
    (z) => !activeMunicipioForZone || (z.nomeMunicipio ?? "").toUpperCase() === activeMunicipioForZone.toUpperCase()
  ) ?? [];

  // Compute totals for zone percentage display
  const zoneTotal = useMemo(() => zoneDetailFiltered.reduce((sum, z) => sum + (z.totalVotos ?? 0), 0), [zoneDetailFiltered]);

  // Fetch zone info (bairro/localidade) for the zones in the detail
  const zonaNumbers = useMemo(() => Array.from(new Set(zoneDetailFiltered.map(z => z.numeroZona))), [zoneDetailFiltered.map(z => z.numeroZona).join(',')]);
  const { data: zoneInfoData } = trpc.candidates.zoneInfo.useQuery(
    { uf, zonas: zonaNumbers },
    { enabled: zonaNumbers.length > 0 }
  );
  const zoneInfoMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (zoneInfoData) {
      for (const z of zoneInfoData) {
        if (z.bairro) map[z.numeroZona] = z.bairro;
      }
    }
    return map;
  }, [zoneInfoData]);

  // Normalize candidates from both endpoints to a common shape
  const rawCandidates = data?.candidates ?? [];
  const candidates: CandidateRow[] = rawCandidates.map((c) => ({
    candidatoSequencial: c.candidatoSequencial,
    candidatoNome: c.candidatoNome,
    candidatoNomeUrna: c.candidatoNomeUrna ?? null,
    candidatoNumero: c.candidatoNumero ?? null,
    partidoSigla: c.partidoSigla,
    totalVotos: c.totalVotos ?? null,
    situacao: c.situacao ?? null,
    eleito: c.eleito ?? null,
    percentualSobrePartido: c.percentualSobrePartido ?? null,
  }));
  const summary = data?.summary;

  const filteredAndSorted = useMemo(() => {
    let list = candidates;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.candidatoNomeUrna ?? c.candidatoNome).toLowerCase().includes(q) ||
        (c.candidatoNumero ?? "").includes(q) ||
        c.partidoSigla.toLowerCase().includes(q)
      );
    }
    if (filterPartido) list = list.filter(c => c.partidoSigla === filterPartido);
    if (filterSituacao === "eleitos") list = list.filter(c => c.eleito);
    else if (filterSituacao === "nao_eleitos") list = list.filter(c => !c.eleito && !(c.situacao ?? "").toUpperCase().includes("SUPLENTE"));
    else if (filterSituacao === "suplentes") list = list.filter(c => (c.situacao ?? "").toUpperCase().includes("SUPLENTE"));

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "votos") cmp = (a.totalVotos ?? 0) - (b.totalVotos ?? 0);
      else if (sortKey === "nome") cmp = (a.candidatoNomeUrna ?? a.candidatoNome).localeCompare(b.candidatoNomeUrna ?? b.candidatoNome);
      else if (sortKey === "partido") cmp = a.partidoSigla.localeCompare(b.partidoSigla);
      else if (sortKey === "situacao") {
        const sa = a.eleito ? 0 : (a.situacao ?? "").includes("SUPLENTE") ? 1 : 2;
        const sb = b.eleito ? 0 : (b.situacao ?? "").includes("SUPLENTE") ? 1 : 2;
        cmp = sa - sb;
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [candidates, search, filterPartido, filterSituacao, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (sortAsc ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />) : null;

  const psbColor = PARTY_COLORS["PSB"] ?? "#F97316";

  // Comparison handlers
  const toggleCompareSelect = (c: CandidateRow) => {
    setSelectedForCompare(prev => {
      const exists = prev.find(p => p.candidatoSequencial === c.candidatoSequencial);
      if (exists) return prev.filter(p => p.candidatoSequencial !== c.candidatoSequencial);
      if (prev.length >= 2) return prev; // max 2
      return [...prev, c];
    });
  };

  const isSelectedForCompare = (seq: string) =>
    selectedForCompare.some(c => c.candidatoSequencial === seq);

  return (
    <div className={embedded ? "flex flex-col flex-1 min-h-0 bg-card rounded-xl border border-border shadow-sm" : "flex flex-col h-full bg-card border-l border-border shadow-2xl"} style={embedded ? {} : { minWidth: 420, maxWidth: 520 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          <Vote className="w-4 h-4 text-primary shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-sm font-display truncate">
              {nomeUf}
              {selectedMunicipio && <span className="text-primary"> · {selectedMunicipio}</span>}
            </div>
            <div className="text-xs text-muted-foreground">
              {filters.cargo} · {filters.ano} · {filters.turno}º Turno
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Compare mode toggle */}
          <Button
            variant={compareMode ? "default" : "ghost"}
            size="sm"
            className={cn("h-7 px-2 text-xs gap-1", compareMode && "bg-primary text-primary-foreground")}
            onClick={() => {
              setCompareMode(!compareMode);
              if (compareMode) setSelectedForCompare([]);
            }}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Comparar</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Compare mode banner */}
      {compareMode && (
        <div className={cn(
          "px-4 py-2 border-b border-border text-xs flex items-center justify-between",
          selectedForCompare.length === 2 ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-200"
        )}>
          <div className="flex items-center gap-2 min-w-0">
            <GitCompare className={cn("w-3.5 h-3.5 shrink-0", selectedForCompare.length === 2 ? "text-emerald-600" : "text-blue-600")} />
            {selectedForCompare.length === 0 && (
              <span className="text-blue-700">Selecione 2 candidatos para comparar</span>
            )}
            {selectedForCompare.length === 1 && (
              <span className="text-blue-700 truncate">
                <strong>{selectedForCompare[0].candidatoNomeUrna ?? selectedForCompare[0].candidatoNome}</strong> selecionado — escolha mais 1
              </span>
            )}
            {selectedForCompare.length === 2 && (
              <span className="text-emerald-700 truncate">
                2 candidatos selecionados
              </span>
            )}
          </div>
          {selectedForCompare.length === 2 && (
            <Button
              size="sm"
              className="h-6 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              onClick={() => setShowComparison(true)}
            >
              Ver comparação
            </Button>
          )}
        </div>
      )}

      {/* Municipality selector */}
      {municipios.length > 0 && (
        <div className="px-4 py-2 border-b border-border">
          <div className="relative">
            <button
              onClick={() => setShowMunicipioDropdown(!showMunicipioDropdown)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 rounded border text-xs transition-colors",
                selectedMunicipio
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              )}
            >
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="flex-1 text-left truncate">
                {selectedMunicipio ?? `Todos os municípios (${municipios.length})`}
              </span>
              {selectedMunicipio ? (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedMunicipio(null); setMunicipioSearch(""); setExpandedCandidate(null); }}
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
                <div className="max-h-48 overflow-y-auto">
                  <button
                    onClick={() => { setSelectedMunicipio(null); setShowMunicipioDropdown(false); setMunicipioSearch(""); setExpandedCandidate(null); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors",
                      !selectedMunicipio && "bg-muted/50 font-medium"
                    )}
                  >
                    <Building2 className="w-3 h-3 text-muted-foreground" />
                    Todos os municípios
                  </button>
                  {filteredMunicipios.map((m) => (
                    <button
                      key={m.nomeMunicipio}
                      onClick={() => { setSelectedMunicipio(m.nomeMunicipio); setShowMunicipioDropdown(false); setMunicipioSearch(""); setExpandedCandidate(null); }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors",
                        selectedMunicipio === m.nomeMunicipio && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="truncate">{m.nomeMunicipio}</span>
                    </button>
                  ))}
                  {filteredMunicipios.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground text-center">Nenhum município encontrado</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm">Carregando candidatos...</p>
          </div>
        </div>
      ) : !summary || summary.totalCandidatos === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Sem dados para esta seleção</p>
            <p className="text-xs mt-1">Ajuste os filtros ou aguarde a importação dos dados do TSE</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Summary Cards */}
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{summary.totalCandidatos.toLocaleString("pt-BR")}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Candidatos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-500">{summary.totalEleitos}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Eleitos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{formatVotes(summary.totalVotos)}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Votos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{summary.totalPartidos}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Partidos</div>
              </div>
            </div>

            {/* Party breakdown toggle */}
            <button
              onClick={() => setShowPartyBreakdown(!showPartyBreakdown)}
              className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 justify-center py-0.5"
            >
              <ChevronDown className={cn("w-3 h-3 transition-transform", showPartyBreakdown && "rotate-180")} />
              {showPartyBreakdown ? "Ocultar" : "Ver"} distribuição por partido
            </button>

            {showPartyBreakdown && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {summary.byParty.slice(0, 20).map((p) => {
                  const pct = summary.totalVotos > 0 ? (p.totalVotos / summary.totalVotos) * 100 : 0;
                  const color = PARTY_COLORS[p.sigla] ?? PARTY_COLORS.DEFAULT;
                  const isPSB = p.sigla === "PSB";
                  return (
                    <button
                      key={p.sigla}
                      onClick={() => setFilterPartido(filterPartido === p.sigla ? null : p.sigla)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-muted/50 transition-colors",
                        filterPartido === p.sigla && "bg-muted"
                      )}
                    >
                      <span className="font-semibold w-12 text-left shrink-0" style={{ color: isPSB ? psbColor : color }}>
                        {p.sigla}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isPSB ? psbColor : color }} />
                      </div>
                      <span className="text-muted-foreground w-10 text-right">{formatVotes(p.totalVotos)}</span>
                      {p.eleitos > 0 && <span className="text-emerald-500 w-12 text-right">+{p.eleitos} el.</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filters Row */}
          <div className="px-4 py-2 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar candidato, número ou partido..."
                className="pl-8 h-7 text-xs"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {(["todos", "eleitos", "suplentes", "nao_eleitos"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSituacao(s)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                    filterSituacao === s
                      ? s === "eleitos" ? "bg-emerald-600 text-white"
                        : s === "suplentes" ? "bg-amber-500 text-white"
                        : s === "nao_eleitos" ? "bg-slate-500 text-white"
                        : "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {s === "todos" ? "Todos" : s === "eleitos" ? "✅ Eleitos" : s === "suplentes" ? "⚡ Suplentes" : "❌ Não Eleitos"}
                </button>
              ))}
              {filterPartido && (
                <button
                  onClick={() => setFilterPartido(null)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary hover:bg-primary/30 flex items-center gap-1"
                >
                  {filterPartido} <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table Header */}
          <div className="px-4 py-1.5 border-b border-border bg-muted/20">
            <div className={cn("grid gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider", compareMode ? "grid-cols-13" : "grid-cols-12")}>
              {compareMode && <div className="col-span-1 text-center" />}
              <div className={cn("text-center", compareMode ? "col-span-1" : "col-span-1")}>#</div>
              <button className={cn("text-left hover:text-foreground transition-colors", compareMode ? "col-span-4" : "col-span-5")} onClick={() => toggleSort("nome")}>
                Candidato <SortIcon k="nome" />
              </button>
              <button className="col-span-2 text-left hover:text-foreground transition-colors" onClick={() => toggleSort("partido")}>
                Partido <SortIcon k="partido" />
              </button>
              <button className="col-span-2 text-right hover:text-foreground transition-colors" onClick={() => toggleSort("votos")}>
                Votos <SortIcon k="votos" />
              </button>
              <button className="col-span-2 text-center hover:text-foreground transition-colors" onClick={() => toggleSort("situacao")}>
                Sit. <SortIcon k="situacao" />
              </button>
            </div>
          </div>

          {/* Candidate List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="divide-y divide-border/50">
              {filteredAndSorted.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">Nenhum candidato encontrado</div>
              ) : (
                filteredAndSorted.map((c, idx) => {
                  const badge = getSituacaoBadge(c.situacao, c.eleito);
                  const isPSB = c.partidoSigla === "PSB";
                  const partyColor = PARTY_COLORS[c.partidoSigla] ?? PARTY_COLORS.DEFAULT;
                  const isExpanded = expandedCandidate === c.candidatoSequencial;
                  const displayName = c.candidatoNomeUrna ?? c.candidatoNome;
                  const isSelectedCompare = isSelectedForCompare(c.candidatoSequencial);

                  return (
                    <div key={`${c.candidatoSequencial}-${idx}`}>
                      <div className={cn(
                        "flex items-stretch",
                        isExpanded && "bg-muted/60",
                        isPSB && "border-l-2 border-l-orange-500"
                      )}>
                        {/* Compare checkbox */}
                        {compareMode && (
                          <button
                            onClick={() => toggleCompareSelect(c)}
                            className={cn(
                              "w-8 flex items-center justify-center shrink-0 transition-colors",
                              isSelectedCompare
                                ? "bg-primary/20 text-primary"
                                : selectedForCompare.length >= 2 && !isSelectedCompare
                                  ? "opacity-30 cursor-not-allowed"
                                  : "hover:bg-muted/40 text-muted-foreground"
                            )}
                            disabled={selectedForCompare.length >= 2 && !isSelectedCompare}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
                              isSelectedCompare ? "border-primary bg-primary" : "border-muted-foreground"
                            )}>
                              {isSelectedCompare && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </button>
                        )}
                        <button
                          className="flex-1 px-4 py-2 hover:bg-muted/40 transition-colors text-left"
                          onClick={() => {
                            if (!compareMode) {
                              setExpandedCandidate(isExpanded ? null : c.candidatoSequencial);
                              if (isExpanded) setDrillMunicipio(null);
                            }
                          }}
                        >
                          <div className={cn("grid gap-1 items-center", compareMode ? "grid-cols-11" : "grid-cols-12")}>
                            <div className="col-span-1 text-center">
                              {idx === 0 ? <Trophy className="w-3.5 h-3.5 text-yellow-500 mx-auto" /> :
                               idx === 1 ? <Medal className="w-3.5 h-3.5 text-slate-400 mx-auto" /> :
                               idx === 2 ? <Award className="w-3.5 h-3.5 text-amber-600 mx-auto" /> :
                               <span className="text-[10px] text-muted-foreground">{idx + 1}</span>}
                            </div>
                            <div className={cn("min-w-0", compareMode ? "col-span-4" : "col-span-5")}>
                              <div className="text-xs font-medium truncate text-foreground">{displayName}</div>
                              {c.candidatoNumero && <div className="text-[10px] text-muted-foreground">Nº {c.candidatoNumero}</div>}
                            </div>
                            <div className="col-span-2">
                              <span
                                className="text-[10px] font-bold px-1 py-0.5 rounded"
                                style={{ backgroundColor: `${partyColor}20`, color: partyColor }}
                              >
                                {c.partidoSigla}
                              </span>
                            </div>
                            <div className="col-span-2 text-right">
                              <div className="text-xs font-semibold text-foreground">{formatVotes(c.totalVotos ?? 0)}</div>
                              {c.percentualSobrePartido && (
                                <div className="text-[10px] text-muted-foreground">{parseFloat(c.percentualSobrePartido).toFixed(1)}%</div>
                              )}
                            </div>
                            <div className="col-span-2 flex items-center justify-center gap-0.5">
                              <span className="text-sm">{badge.icon}</span>
                              {!compareMode && (
                                <ChevronRight className={cn("w-3 h-3 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                              )}
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Expanded zone detail */}
                      {isExpanded && !compareMode && (
                        <div className="bg-muted/30 border-t border-border/50 px-4 py-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-semibold text-foreground">{displayName}</span>
                            <Badge className={cn("text-[10px] px-1.5 py-0", badge.color)}>{badge.label}</Badge>
                          </div>
                          {/* Caso 1: Município selecionado (via selector ou drill-down) → mostrar zonas */}
                          {activeMunicipioForZone ? (
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                {drillMunicipio && !selectedMunicipio && (
                                  <button
                                    onClick={() => setDrillMunicipio(null)}
                                    className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                                  >
                                    <ChevronRight className="w-3 h-3 rotate-180" />
                                    Voltar aos municípios
                                  </button>
                                )}
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                  Zonas Eleitorais — {activeMunicipioForZone}
                                </span>
                                {zoneTotal > 0 && (
                                  <span className="text-[10px] text-muted-foreground ml-auto">
                                    Total: {formatVotes(zoneTotal)} votos
                                  </span>
                                )}
                              </div>
                              {zoneDetailFiltered.length > 0 ? (
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                  {zoneDetailFiltered.map((z, zi) => {
                                    const maxV = zoneDetailFiltered[0]?.totalVotos ?? 1;
                                    const pct = ((z.totalVotos ?? 0) / maxV) * 100;
                                    // Percentual sobre total de votos do candidato naquele município
                                    const pctTotal = zoneTotal > 0 ? ((z.totalVotos ?? 0) / zoneTotal) * 100 : 0;
                                    return (
                                      <div key={zi} className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground w-4 text-right">{zi + 1}</span>
                                        <span className="text-[10px] text-foreground shrink-0" style={{minWidth: '3.5rem'}}>
                                          Zona {z.numeroZona}
                                          <span className="ml-1 text-muted-foreground">· {z.nomeMunicipio ?? activeMunicipioForZone}</span>
                                          {zoneInfoMap[z.numeroZona] && (
                                            <span className="ml-1 text-muted-foreground text-[9px]">({zoneInfoMap[z.numeroZona]})</span>
                                          )}
                                        </span>
                                        <div className="flex-1 bg-muted rounded-full h-1 overflow-hidden">
                                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: partyColor }} />
                                        </div>
                                        <span className="text-[10px] font-medium text-foreground w-12 text-right">{formatVotes(z.totalVotos ?? 0)}</span>
                                        <span className="text-[9px] text-muted-foreground w-10 text-right">{pctTotal.toFixed(1)}%</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[10px] text-muted-foreground">Zonas não disponíveis para {activeMunicipioForZone}.</p>
                              )}
                            </div>
                          ) : zoneByMunData && zoneByMunData.length > 0 ? (
                            /* Caso 2: Sem município selecionado → mostrar lista de municípios clicavéis */
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                  Votos por Município — clique para ver zonas
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  {zoneByMunData.length} municípios
                                </span>
                              </div>
                              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                                {zoneByMunData.map((z, zi) => {
                                  const maxV = zoneByMunData[0]?.totalVotos ?? 1;
                                  const pct = ((z.totalVotos ?? 0) / maxV) * 100;
                                  // Percentual sobre total de votos do candidato
                                  const totalCandVotos = c.totalVotos ?? 0;
                                  const pctTotal = totalCandVotos > 0 ? ((z.totalVotos ?? 0) / totalCandVotos) * 100 : 0;
                                  return (
                                    <button
                                      key={zi}
                                      onClick={() => setDrillMunicipio({ nome: z.nomeMunicipio ?? z.codigoMunicipio ?? "", codigo: z.codigoMunicipio ?? null })}
                                      className="w-full flex items-center gap-2 px-1 py-0.5 rounded hover:bg-muted/60 transition-colors group"
                                    >
                                      <span className="text-[10px] text-muted-foreground w-4 text-right">{zi + 1}</span>
                                      <span className="text-[10px] text-foreground truncate flex-1 group-hover:text-primary">{z.nomeMunicipio ?? z.codigoMunicipio}</span>
                                      <div className="w-16 bg-muted rounded-full h-1 overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: partyColor }} />
                                      </div>
                                      <span className="text-[10px] font-medium text-foreground w-12 text-right">{formatVotes(z.totalVotos ?? 0)}</span>
                                      <span className="text-[9px] text-muted-foreground w-8 text-right">{pctTotal.toFixed(1)}%</span>
                                      <span className="text-[10px] text-muted-foreground w-6 text-right">{z.zonas}z</span>
                                      <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">Detalhamento por zona não disponível para este candidato.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground flex items-center justify-between">
            <span>{filteredAndSorted.length} candidatos exibidos</span>
            {compareMode && selectedForCompare.length > 0 && (
              <span className="text-primary font-medium">
                {selectedForCompare.length}/2 selecionados para comparar
              </span>
            )}
            <span>Fonte: TSE · {filters.ano}</span>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && selectedForCompare.length === 2 && (
        <CandidateComparisonModal
          candidateA={selectedForCompare[0]}
          candidateB={selectedForCompare[1]}
          ano={filters.ano}
          turno={filters.turno}
          uf={uf}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
