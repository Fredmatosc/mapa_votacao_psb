import { PARTY_COLORS } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Award,
  BarChart2,
  Building2,
  ChevronRight,
  DollarSign,
  MapPin,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

interface CandidateInfo {
  candidatoSequencial: string;
  candidatoNome: string;
  candidatoNomeUrna: string | null;
  candidatoNumero: string | null;
  partidoSigla: string;
  totalVotos: number | null;
  situacao: string | null;
  eleito: boolean | null;
}

interface CandidateComparisonModalProps {
  candidateA: CandidateInfo;
  candidateB: CandidateInfo;
  ano: number;
  turno: number;
  uf: string;
  onClose: () => void;
}

function formatVotes(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("pt-BR");
}

function getSituacaoBadge(situacao: string | null, eleito: boolean | null) {
  if (eleito) {
    const s = (situacao ?? "").toUpperCase();
    if (s.includes("MÉDIA")) return { label: "ELEITO MÉDIA", color: "bg-blue-500 text-white" };
    if (s.includes("QP") || s.includes("QUOCIENTE")) return { label: "ELEITO QP", color: "bg-emerald-500 text-white" };
    return { label: "ELEITO", color: "bg-emerald-600 text-white" };
  }
  const s = (situacao ?? "").toUpperCase();
  if (s.includes("SUPLENTE")) return { label: "SUPLENTE", color: "bg-amber-500 text-white" };
  return { label: "NÃO ELEITO", color: "bg-slate-500 text-white" };
}

// Sub-component for a single candidate column with zone breakdown
function CandidateColumn({
  candidate,
  ano,
  turno,
  uf,
  isWinner,
  totalVotesOther,
}: {
  candidate: CandidateInfo;
  ano: number;
  turno: number;
  uf: string;
  isWinner: boolean;
  totalVotesOther: number;
}) {
  const partyColor = PARTY_COLORS[candidate.partidoSigla] ?? PARTY_COLORS.DEFAULT;
  const badge = getSituacaoBadge(candidate.situacao, candidate.eleito);
  const displayName = candidate.candidatoNomeUrna ?? candidate.candidatoNome;
  const totalVotos = candidate.totalVotos ?? 0;

  // View mode: municipalities (default) or zones within a municipality
  const [selectedMun, setSelectedMun] = useState<{ nome: string; codigo: string | null } | null>(null);

  // Load profile data from DivulgaCandContas
  const { data: profile } = trpc.candidates.getProfile.useQuery(
    { candidatoSequencial: candidate.candidatoSequencial, ano, turno },
    { staleTime: 5 * 60 * 1000 }
  );

  const gastoTotal = profile?.gastoTotal ?? null;
  const custoPorVoto = profile?.custoPorVoto ?? null;
  const genero = profile?.genero ?? null;
  const orientacao = profile?.orientacao ?? null;
  const fotoUrl = profile?.fotoUrl ?? null;
  const fotoPublicavel = profile?.fotoPublicavel ?? false;

  // Load zone-by-municipality data
  const { data: zoneByMun, isLoading: munLoading } = trpc.candidates.zoneByMunicipality.useQuery({
    candidatoSequencial: candidate.candidatoSequencial,
    ano,
    turno,
    uf,
  });

  // Load zone detail when a municipality is selected
  const { data: zoneDetail, isLoading: zoneLoading } = trpc.candidates.zoneDetail.useQuery(
    { candidatoSequencial: candidate.candidatoSequencial, ano, turno, uf },
    { enabled: !!selectedMun }
  );

  const zoneDetailFiltered = useMemo(
    () => zoneDetail?.filter(z =>
      !selectedMun || (z.nomeMunicipio ?? "").toUpperCase() === selectedMun.nome.toUpperCase()
    ) ?? [],
    [zoneDetail, selectedMun]
  );

  const zoneTotal = useMemo(
    () => zoneDetailFiltered.reduce((s, z) => s + (z.totalVotos ?? 0), 0),
    [zoneDetailFiltered]
  );

  const isLoading = munLoading || (!!selectedMun && zoneLoading);

  return (
    <div className={cn(
      "flex-1 min-w-0 flex flex-col border rounded-lg overflow-hidden",
      isWinner ? "border-emerald-400 shadow-md shadow-emerald-100" : "border-border"
    )}>
      {/* Candidate Header */}
      <div
        className="px-4 py-3 text-white shrink-0"
        style={{ background: `linear-gradient(135deg, ${partyColor}, ${partyColor}cc)` }}
      >
        <div className="flex items-start gap-3">
          {/* Foto */}
          <div className="shrink-0">
            {fotoUrl && fotoPublicavel ? (
              <img
                src={fotoUrl}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white/40 bg-white/10"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40">
                <User className="w-6 h-6 text-white/70" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div className="font-bold text-sm leading-tight truncate">{displayName}</div>
              {isWinner && <Trophy className="w-4 h-4 text-yellow-300 shrink-0" />}
            </div>
            {candidate.candidatoNome !== displayName && (
              <div className="text-[10px] opacity-70 truncate">{candidate.candidatoNome}</div>
            )}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
              >
                {candidate.partidoSigla}
              </span>
              {candidate.candidatoNumero && (
                <span className="text-[10px] opacity-70">Nº {candidate.candidatoNumero}</span>
              )}
              {genero && (
                <span className="text-[10px] opacity-80 bg-white/15 px-1 rounded">{genero}</span>
              )}
              {orientacao && (
                <span className="text-[10px] opacity-80 bg-white/15 px-1 rounded">{orientacao}</span>
              )}
            </div>
          </div>
        </div>

        {/* Gasto e custo/voto */}
        {(gastoTotal != null || custoPorVoto != null) && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {gastoTotal != null && (
              <div className="bg-white/15 rounded px-2 py-1">
                <div className="flex items-center gap-1 mb-0.5">
                  <DollarSign className="w-2.5 h-2.5 opacity-70" />
                  <span className="text-[9px] opacity-70 uppercase tracking-wide">Gasto total</span>
                </div>
                <div className="text-xs font-bold">{formatCurrency(gastoTotal)}</div>
              </div>
            )}
            {custoPorVoto != null && (
              <div className="bg-white/15 rounded px-2 py-1">
                <div className="flex items-center gap-1 mb-0.5">
                  <Award className="w-2.5 h-2.5 opacity-70" />
                  <span className="text-[9px] opacity-70 uppercase tracking-wide">Custo/voto</span>
                </div>
                <div className="text-xs font-bold">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(custoPorVoto)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Vote Stats */}
      <div className="px-4 py-3 bg-muted/20 border-b border-border shrink-0">
        <div className="text-center mb-2">
          <div className="text-2xl font-bold text-foreground">{formatVotes(totalVotos)}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">votos totais</div>
        </div>
        <div className="flex justify-center">
          <Badge className={cn("text-xs px-2 py-0.5", badge.color)}>{badge.label}</Badge>
        </div>
      </div>

      {/* Zone / Municipality Breakdown */}
      <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            {selectedMun ? (
              <>
                <button
                  onClick={() => setSelectedMun(null)}
                  className="flex items-center gap-0.5 text-primary hover:underline"
                >
                  <ChevronRight className="w-3 h-3 rotate-180" />
                  Municípios
                </button>
                <ChevronRight className="w-3 h-3" />
                <span className="truncate max-w-24">{selectedMun.nome}</span>
              </>
            ) : (
              <>
                <MapPin className="w-3 h-3" />
                Votos por Município
              </>
            )}
          </div>
          {selectedMun && zoneTotal > 0 && (
            <span className="text-[10px] text-muted-foreground">{formatVotes(zoneTotal)} total</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : selectedMun ? (
          /* Zone detail for selected municipality */
          zoneDetailFiltered.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-xs">
              Sem dados de zonas para {selectedMun.nome}
            </div>
          ) : (
            <div className="space-y-1">
              {zoneDetailFiltered.map((z, zi) => {
                const maxV = zoneDetailFiltered[0]?.totalVotos ?? 1;
                const pct = ((z.totalVotos ?? 0) / maxV) * 100;
                const pctTotal = zoneTotal > 0 ? ((z.totalVotos ?? 0) / zoneTotal) * 100 : 0;
                return (
                  <div key={zi} className="flex items-center gap-1.5">
                    <span className="text-[9px] text-muted-foreground w-3 text-right shrink-0">{zi + 1}</span>
                    <span className="text-[10px] text-foreground shrink-0 w-14">Zona {z.numeroZona}</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: partyColor }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-foreground w-10 text-right shrink-0">
                      {formatVotes(z.totalVotos ?? 0)}
                    </span>
                    <span className="text-[9px] text-muted-foreground w-9 text-right shrink-0">
                      {pctTotal.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )
        ) : !zoneByMun || zoneByMun.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs">
            <Building2 className="w-6 h-6 mx-auto mb-1 opacity-30" />
            Sem dados de municípios
          </div>
        ) : (
          /* Municipality list — click to drill into zones */
          <div className="space-y-0.5">
            {zoneByMun.slice(0, 30).map((z, zi) => {
              const maxV = zoneByMun[0]?.totalVotos ?? 1;
              const pct = ((z.totalVotos ?? 0) / maxV) * 100;
              const pctTotal = totalVotos > 0 ? ((z.totalVotos ?? 0) / totalVotos) * 100 : 0;
              return (
                <button
                  key={zi}
                  onClick={() => setSelectedMun({ nome: z.nomeMunicipio ?? z.codigoMunicipio ?? "", codigo: z.codigoMunicipio ?? null })}
                  className="w-full flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-muted/60 transition-colors group"
                >
                  <span className="text-[9px] text-muted-foreground w-3 text-right shrink-0">{zi + 1}</span>
                  <span className="text-[10px] text-foreground truncate flex-1 group-hover:text-primary text-left">
                    {z.nomeMunicipio ?? z.codigoMunicipio}
                  </span>
                  <div className="w-14 bg-muted rounded-full h-1.5 overflow-hidden shrink-0">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: partyColor }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-foreground w-10 text-right shrink-0">
                    {formatVotes(z.totalVotos ?? 0)}
                  </span>
                  <span className="text-[9px] text-muted-foreground w-8 text-right shrink-0">
                    {pctTotal.toFixed(1)}%
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0" />
                </button>
              );
            })}
            {zoneByMun.length > 30 && (
              <div className="text-[10px] text-muted-foreground text-center pt-1">
                + {zoneByMun.length - 30} municípios
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CandidateComparisonModal({
  candidateA,
  candidateB,
  ano,
  turno,
  uf,
  onClose,
}: CandidateComparisonModalProps) {
  const votesA = candidateA.totalVotos ?? 0;
  const votesB = candidateB.totalVotos ?? 0;
  const totalVotes = votesA + votesB;
  const pctA = totalVotes > 0 ? (votesA / totalVotes) * 100 : 50;
  const pctB = totalVotes > 0 ? (votesB / totalVotes) * 100 : 50;
  const isAWinner = votesA > votesB;
  const isBWinner = votesB > votesA;

  const colorA = PARTY_COLORS[candidateA.partidoSigla] ?? PARTY_COLORS.DEFAULT;
  const colorB = PARTY_COLORS[candidateB.partidoSigla] ?? PARTY_COLORS.DEFAULT;

  const displayNameA = candidateA.candidatoNomeUrna ?? candidateA.candidatoNome;
  const displayNameB = candidateB.candidatoNomeUrna ?? candidateB.candidatoNome;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-border overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Comparação de Candidatos</span>
            <Badge variant="secondary" className="text-[10px] px-2 py-0">
              {ano} · {turno}º Turno · {uf}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Vote Bar Comparison */}
        <div className="px-5 py-3 border-b border-border bg-muted/10 shrink-0">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-xs font-semibold truncate flex-1 text-right" style={{ color: colorA }}>
              {displayNameA}
            </span>
            <div className="text-xs text-muted-foreground shrink-0 font-medium">vs</div>
            <span className="text-xs font-semibold truncate flex-1 text-left" style={{ color: colorB }}>
              {displayNameB}
            </span>
          </div>
          {/* Proportional bar */}
          <div className="flex h-6 rounded-full overflow-hidden border border-border">
            <div
              className="flex items-center justify-end pr-2 transition-all"
              style={{ width: `${pctA}%`, backgroundColor: colorA }}
            >
              {pctA > 12 && (
                <span className="text-[10px] font-bold text-white">{pctA.toFixed(1)}%</span>
              )}
            </div>
            <div
              className="flex items-center justify-start pl-2 transition-all"
              style={{ width: `${pctB}%`, backgroundColor: colorB }}
            >
              {pctB > 12 && (
                <span className="text-[10px] font-bold text-white">{pctB.toFixed(1)}%</span>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs font-bold" style={{ color: colorA }}>
              {formatVotes(votesA)} votos
            </span>
            <span className="text-xs text-muted-foreground">
              Diferença: <strong>{formatVotes(Math.abs(votesA - votesB))}</strong>
            </span>
            <span className="text-xs font-bold" style={{ color: colorB }}>
              {formatVotes(votesB)} votos
            </span>
          </div>
        </div>

        {/* Side-by-side columns */}
        <div className="flex-1 min-h-0 flex gap-3 p-4 overflow-hidden">
          <CandidateColumn
            candidate={candidateA}
            ano={ano}
            turno={turno}
            uf={uf}
            isWinner={isAWinner}
            totalVotesOther={votesB}
          />
          <CandidateColumn
            candidate={candidateB}
            ano={ano}
            turno={turno}
            uf={uf}
            isWinner={isBWinner}
            totalVotesOther={votesA}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            Dados: TSE · {ano} · Clique em um município para ver as zonas eleitorais
          </span>
          <span>Clique fora ou no X para fechar</span>
        </div>
      </div>
    </div>
  );
}
