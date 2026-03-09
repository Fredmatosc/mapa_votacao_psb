import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ChevronDown, ChevronRight, MapPin, Trophy, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CandidateDrillDownProps {
  uf: string;
  ano: number;
  turno: number;
  cargo: string;
  partidoSigla?: string;
  onClose?: () => void;
}

function getSituacaoBadge(situacao: string | null) {
  if (!situacao) return null;
  const sit = situacao.toUpperCase();
  if (sit.includes("ELEITO") && !sit.includes("NÃO")) {
    return (
      <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 h-4 shrink-0">
        {sit === "ELEITO" ? "ELEITO" : sit === "ELEITO POR QP" ? "QP" : sit === "ELEITO POR MÉDIA" ? "MÉDIA" : "ELEITO"}
      </Badge>
    );
  }
  if (sit === "SUPLENTE") {
    return (
      <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4 shrink-0">
        SUPLENTE
      </Badge>
    );
  }
  if (sit === "2º TURNO") {
    return (
      <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 h-4 shrink-0">
        2º TURNO
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 text-muted-foreground">
      NÃO ELEITO
    </Badge>
  );
}

interface ZoneDetailProps {
  candidatoSequencial: string;
  candidatoNome: string;
  ano: number;
  turno: number;
  uf: string;
  onClose: () => void;
}

function ZoneDetail({ candidatoSequencial, candidatoNome, ano, turno, uf, onClose }: ZoneDetailProps) {
  const { data: municipios, isLoading } = trpc.candidates.zoneByMunicipality.useQuery({
    candidatoSequencial,
    ano,
    turno,
    uf,
  });

  const { data: zonas } = trpc.candidates.zoneDetail.useQuery({
    candidatoSequencial,
    ano,
    turno,
    uf,
  });

  const totalVotos = municipios?.reduce((sum, m) => sum + (m.totalVotos as number), 0) ?? 0;

  return (
    <div className="mt-2 ml-8 border border-border/50 rounded-lg bg-muted/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b border-border/50">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Votos por Município — {candidatoNome}
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="p-3 space-y-1.5">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-5 w-full" />)}
        </div>
      ) : !municipios?.length ? (
        <div className="p-3 text-center text-xs text-muted-foreground">
          Dados por zona não disponíveis para este candidato
        </div>
      ) : (
        <div className="max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/60">
              <tr>
                <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">Município</th>
                <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Zonas</th>
                <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Votos</th>
                <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">%</th>
              </tr>
            </thead>
            <tbody>
              {municipios.map((mun, idx) => {
                const votos = mun.totalVotos as number;
                const pct = totalVotos > 0 ? ((votos / totalVotos) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={idx} className="border-t border-border/30 hover:bg-muted/30">
                    <td className="px-3 py-1 text-foreground font-medium">{mun.nomeMunicipio}</td>
                    <td className="px-3 py-1 text-right text-muted-foreground">{mun.zonas as number}</td>
                    <td className="px-3 py-1 text-right font-semibold text-foreground">
                      {votos.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-3 py-1 text-right text-muted-foreground">{pct}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-border sticky bottom-0 bg-muted/60">
              <tr>
                <td className="px-3 py-1.5 text-xs font-bold text-foreground" colSpan={2}>
                  Total ({municipios.length} municípios)
                </td>
                <td className="px-3 py-1.5 text-right text-xs font-bold text-primary">
                  {totalVotos.toLocaleString("pt-BR")}
                </td>
                <td className="px-3 py-1.5 text-right text-xs font-bold text-muted-foreground">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

interface CandidateRowProps {
  candidate: {
    id: number;
    candidatoSequencial: string;
    candidatoNome: string;
    candidatoNomeUrna: string | null;
    candidatoNumero: string | null;
    partidoSigla: string;
    uf: string;
    cargo: string;
    ano: number;
    turno: number;
    totalVotos: number;
    totalVotosPartido: number | null;
    percentualSobrePartido: string | null;
    situacao: string | null;
    eleito: boolean | null;
  };
  rank: number;
  isPsb: boolean;
}

function CandidateRow({ candidate, rank, isPsb }: CandidateRowProps) {
  const [showZone, setShowZone] = useState(false);
  const pct = candidate.percentualSobrePartido
    ? parseFloat(candidate.percentualSobrePartido).toFixed(1)
    : "—";

  return (
    <>
      <tr
        className={`border-t border-border/30 hover:bg-muted/30 transition-colors cursor-pointer ${
          candidate.eleito ? "bg-emerald-50/30 dark:bg-emerald-950/10" : ""
        } ${isPsb && candidate.eleito ? "bg-orange-50/30 dark:bg-orange-950/10" : ""}`}
        onClick={() => setShowZone(v => !v)}
      >
        {/* Rank */}
        <td className="px-3 py-2 text-center">
          <span className={`text-xs font-bold ${rank <= 3 ? "text-amber-500" : "text-muted-foreground"}`}>
            {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
          </span>
        </td>

        {/* Nome */}
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            {showZone
              ? <ChevronDown className="h-3 w-3 text-primary shrink-0" />
              : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            }
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-foreground truncate">
                  {candidate.candidatoNomeUrna || candidate.candidatoNome}
                </span>
                {getSituacaoBadge(candidate.situacao)}
              </div>
              {candidate.candidatoNumero && (
                <span className="text-[10px] text-muted-foreground">
                  Nº {candidate.candidatoNumero}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Votos */}
        <td className="px-3 py-2 text-right">
          <span className="text-xs font-bold text-foreground">
            {candidate.totalVotos.toLocaleString("pt-BR")}
          </span>
        </td>

        {/* % do partido */}
        <td className="px-3 py-2 text-right">
          <span className="text-xs text-muted-foreground">{pct}%</span>
        </td>

        {/* Barra */}
        <td className="px-3 py-2 w-24 hidden sm:table-cell">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isPsb ? "bg-orange-500" : "bg-primary"}`}
              style={{ width: `${Math.min(parseFloat(pct) || 0, 100)}%` }}
            />
          </div>
        </td>
      </tr>

      {/* Zona detail expandida */}
      {showZone && (
        <tr>
          <td colSpan={5} className="px-3 pb-2">
            <ZoneDetail
              candidatoSequencial={candidate.candidatoSequencial}
              candidatoNome={candidate.candidatoNomeUrna || candidate.candidatoNome}
              ano={candidate.ano}
              turno={candidate.turno}
              uf={candidate.uf}
              onClose={() => setShowZone(false)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export function CandidateDrillDown({
  uf,
  ano,
  turno,
  cargo,
  partidoSigla,
  onClose,
}: CandidateDrillDownProps) {
  const isPsb = partidoSigla === "PSB";

  const { data: candidates, isLoading } = trpc.candidates.byUf.useQuery({
    uf,
    ano,
    turno,
    cargo,
    partidoSigla,
    limit: 100,
  });

  const totalVotos = candidates?.reduce((sum, c) => sum + c.totalVotos, 0) ?? 0;
  const eleitos = candidates?.filter(c => c.eleito).length ?? 0;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 ${isPsb ? "bg-orange-500/10 border-b border-orange-500/20" : "bg-primary/5 border-b border-border"}`}>
        <div className="flex items-center gap-3">
          <User className={`h-4 w-4 ${isPsb ? "text-orange-500" : "text-primary"}`} />
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Candidatos — {partidoSigla ?? "Todos"} · {uf} · {ano}
            </h3>
            <p className="text-xs text-muted-foreground">
              {cargo} · {candidates?.length ?? 0} candidatos
              {eleitos > 0 && (
                <span className="ml-2 text-emerald-600 font-semibold">
                  · {eleitos} eleito{eleitos > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-foreground">
              {totalVotos.toLocaleString("pt-BR")}
            </div>
            <div className="text-[10px] text-muted-foreground">votos totais</div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabela de candidatos */}
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      ) : !candidates?.length ? (
        <div className="p-8 text-center">
          <User className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhum candidato encontrado para os filtros selecionados.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Os dados reais do TSE estão sendo importados. Tente novamente em alguns minutos.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wide w-10">#</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Candidato</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Votos</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">% Partido</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Distribuição</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, idx) => (
                <CandidateRow
                  key={c.id}
                  candidate={c}
                  rank={idx + 1}
                  isPsb={isPsb}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legenda */}
      <div className="px-4 py-2 border-t border-border/50 bg-muted/20 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-600" />
          <span className="text-[10px] text-muted-foreground">Eleito</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] text-muted-foreground">Suplente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
          <span className="text-[10px] text-muted-foreground">Não eleito</span>
        </div>
        <span className="text-[10px] text-muted-foreground ml-auto">
          Clique em um candidato para ver votos por município/zona
        </span>
      </div>
    </div>
  );
}
