import { PARTY_COLORS } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Award,
  BarChart2,
  Building2,
  MapPin,
  Medal,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

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

function CandidateColumn({
  candidate,
  ano,
  turno,
  uf,
  isWinner,
}: {
  candidate: CandidateInfo;
  ano: number;
  turno: number;
  uf: string;
  isWinner: boolean;
}) {
  const partyColor = PARTY_COLORS[candidate.partidoSigla] ?? PARTY_COLORS.DEFAULT;
  const badge = getSituacaoBadge(candidate.situacao, candidate.eleito);
  const displayName = candidate.candidatoNomeUrna ?? candidate.candidatoNome;

  // Load zone-by-municipality data for this candidate
  const { data: zoneByMun, isLoading: zoneLoading } = trpc.candidates.zoneByMunicipality.useQuery({
    candidatoSequencial: candidate.candidatoSequencial,
    ano,
    turno,
    uf,
  });

  const totalVotos = candidate.totalVotos ?? 0;

  return (
    <div className={cn(
      "flex-1 min-w-0 flex flex-col border rounded-lg overflow-hidden",
      isWinner ? "border-emerald-400 shadow-md shadow-emerald-100" : "border-border"
    )}>
      {/* Candidate Header */}
      <div
        className="px-4 py-3 text-white"
        style={{ background: `linear-gradient(135deg, ${partyColor}, ${partyColor}cc)` }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-sm leading-tight truncate">{displayName}</div>
            <div className="text-xs opacity-80 mt-0.5 truncate">{candidate.candidatoNome}</div>
          </div>
          {isWinner && (
            <Trophy className="w-5 h-5 text-yellow-300 shrink-0 mt-0.5" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
          >
            {candidate.partidoSigla}
          </span>
          {candidate.candidatoNumero && (
            <span className="text-xs opacity-70">Nº {candidate.candidatoNumero}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 bg-muted/20 border-b border-border">
        <div className="text-center mb-2">
          <div className="text-2xl font-bold text-foreground">{formatVotes(totalVotos)}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">votos totais</div>
        </div>
        <div className="flex justify-center">
          <Badge className={cn("text-xs px-2 py-0.5", badge.color)}>{badge.label}</Badge>
        </div>
      </div>

      {/* Zone breakdown */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Votos por Município
        </div>
        {zoneLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !zoneByMun || zoneByMun.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-xs">
            <Building2 className="w-6 h-6 mx-auto mb-1 opacity-30" />
            Sem dados de municípios
          </div>
        ) : (
          <div className="space-y-1">
            {zoneByMun.slice(0, 20).map((z, zi) => {
              const maxV = zoneByMun[0]?.totalVotos ?? 1;
              const pct = ((z.totalVotos ?? 0) / maxV) * 100;
              const pctTotal = totalVotos > 0 ? ((z.totalVotos ?? 0) / totalVotos) * 100 : 0;
              return (
                <div key={zi} className="flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground w-3 text-right shrink-0">{zi + 1}</span>
                  <span className="text-[10px] text-foreground truncate flex-1" title={z.nomeMunicipio ?? ""}>
                    {z.nomeMunicipio ?? z.codigoMunicipio}
                  </span>
                  <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden shrink-0">
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
                </div>
              );
            })}
            {zoneByMun.length > 20 && (
              <div className="text-[10px] text-muted-foreground text-center pt-1">
                + {zoneByMun.length - 20} municípios
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-border overflow-hidden">
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
            <div className="text-xs text-muted-foreground shrink-0">vs</div>
            <span className="text-xs font-semibold truncate flex-1 text-left" style={{ color: colorB }}>
              {displayNameB}
            </span>
          </div>
          {/* Bar */}
          <div className="flex h-5 rounded-full overflow-hidden border border-border">
            <div
              className="flex items-center justify-end pr-2 transition-all"
              style={{ width: `${pctA}%`, backgroundColor: colorA }}
            >
              {pctA > 15 && (
                <span className="text-[10px] font-bold text-white">{pctA.toFixed(1)}%</span>
              )}
            </div>
            <div
              className="flex items-center justify-start pl-2 transition-all"
              style={{ width: `${pctB}%`, backgroundColor: colorB }}
            >
              {pctB > 15 && (
                <span className="text-[10px] font-bold text-white">{pctB.toFixed(1)}%</span>
              )}
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs font-bold" style={{ color: colorA }}>
              {formatVotes(votesA)} votos
            </span>
            <span className="text-xs text-muted-foreground">
              Diferença: {formatVotes(Math.abs(votesA - votesB))}
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
          />
          <CandidateColumn
            candidate={candidateB}
            ano={ano}
            turno={turno}
            uf={uf}
            isWinner={isBWinner}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-border bg-muted/20 text-[10px] text-muted-foreground flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            Dados: TSE · {ano}
          </span>
          <span>Clique fora ou no X para fechar</span>
        </div>
      </div>
    </div>
  );
}
