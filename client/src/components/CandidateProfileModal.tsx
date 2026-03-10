import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  User,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Calendar,
  Award,
} from "lucide-react";

interface CandidateProfileModalProps {
  open: boolean;
  onClose: () => void;
  candidatoSequencial: string;
  ano: number;
  turno: number;
  candidatoNome?: string;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatVotes(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR").format(value);
}

function SituacaoBadge({ situacao, eleito }: { situacao?: string | null; eleito?: boolean | null }) {
  if (eleito) {
    return (
      <Badge className="bg-emerald-600 text-white gap-1">
        <CheckCircle2 className="w-3 h-3" />
        Eleito
      </Badge>
    );
  }
  const s = (situacao ?? "").toUpperCase();
  if (s.includes("NÃO ELEITO") || s.includes("NAO ELEITO")) {
    return (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="w-3 h-3" />
        Não eleito
      </Badge>
    );
  }
  if (s.includes("2º TURNO") || s.includes("2 TURNO")) {
    return (
      <Badge className="bg-amber-500 text-white gap-1">
        <Clock className="w-3 h-3" />
        2º Turno
      </Badge>
    );
  }
  if (s.includes("INAPTO") || s.includes("INDEFERIDO")) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="w-3 h-3" />
        Inapto
      </Badge>
    );
  }
  return <Badge variant="outline">{situacao ?? "—"}</Badge>;
}

export function CandidateProfileModal({
  open,
  onClose,
  candidatoSequencial,
  ano,
  turno,
  candidatoNome,
}: CandidateProfileModalProps) {
  const { data: profile, isLoading } = trpc.candidates.getProfile.useQuery(
    { candidatoSequencial, ano, turno },
    { enabled: open && !!candidatoSequencial, staleTime: 5 * 60 * 1000 }
  );

  const displayName = profile?.candidatoNomeUrna ?? profile?.candidatoNome ?? candidatoNome ?? "Candidato";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header com foto */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-6 text-white rounded-t-lg">
          <div className="flex items-start gap-4">
            {/* Foto do candidato */}
            <div className="flex-shrink-0">
              {profile?.fotoUrl && profile.fotoPublicavel ? (
                <img
                  src={profile.fotoUrl}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/40 bg-white/10"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/40">
                  <User className="w-10 h-10 text-white/70" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <DialogHeader>
                <DialogTitle className="text-white text-xl font-bold leading-tight">
                  {displayName}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-1 text-orange-100 text-sm">
                {profile?.candidatoNome !== profile?.candidatoNomeUrna && profile?.candidatoNome && (
                  <p className="text-orange-200 text-xs mb-1">{profile.candidatoNome}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {profile?.partidoSigla ?? "—"}
                  </Badge>
                  <span className="text-orange-100">·</span>
                  <span className="text-orange-100">{profile?.cargo ?? "—"}</span>
                  <span className="text-orange-100">·</span>
                  <span className="text-orange-100">{profile?.uf ?? "—"} {profile?.ano}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile && (
                    <SituacaoBadge situacao={profile.situacao} eleito={profile.eleito} />
                  )}
                  {profile?.isCandidatoInapto && (
                    <Badge variant="destructive" className="text-xs">Inapto</Badge>
                  )}
                  {profile?.genero && (
                    <Badge className="bg-white/15 text-white border-white/20 text-xs">
                      {profile.genero}
                    </Badge>
                  )}
                  {profile?.orientacao && (
                    <Badge className="bg-white/15 text-white border-white/20 text-xs">
                      {profile.orientacao}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="p-8 text-center text-muted-foreground">
            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
            Carregando perfil...
          </div>
        )}

        {!isLoading && profile && (
          <div className="p-6 space-y-6">
            {/* Métricas principais */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MetricCard
                icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
                label="Votos obtidos"
                value={formatVotes(profile.totalVotos)}
              />
              <MetricCard
                icon={<DollarSign className="w-4 h-4 text-orange-500" />}
                label="Limite de gastos"
                value={formatCurrency(profile.gastoTotal)}
                sub={
                  profile.gastoCampanha2T
                    ? `1T: ${formatCurrency(profile.gastoCampanha1T)} · 2T: ${formatCurrency(profile.gastoCampanha2T)}`
                    : undefined
                }
              />
              <MetricCard
                icon={<Award className="w-4 h-4 text-orange-500" />}
                label="Custo por voto"
                value={
                  profile.custoPorVoto != null
                    ? new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(profile.custoPorVoto)
                    : "—"
                }
                highlight={profile.custoPorVoto != null}
              />
            </div>

            {/* Coligação */}
            {profile.nomeColigacao && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Coligação / Federação</p>
                <p className="text-sm font-medium">{profile.nomeColigacao}</p>
              </div>
            )}

            <Separator />

            {/* Histórico de eleições */}
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-orange-500" />
                Histórico Eleitoral
              </h3>

              {profile.historico.length > 0 ? (
                <div className="space-y-2">
                  {profile.historico.map((e, i) => {
                    // Buscar votos do banco local para essa eleição
                    const localData = profile.eleicoesNoBanco.find(
                      (le) =>
                        le.ano === e.ano &&
                        le.cargo?.toUpperCase() === e.cargo?.toUpperCase()
                    );
                    const votos = localData?.totalVotos ?? e.votos;
                    const isCurrentElection = e.ano === profile.ano && e.cargo?.toUpperCase() === profile.cargo?.toUpperCase();

                    return (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                          isCurrentElection
                            ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800"
                            : "border-border bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-bold text-base w-12 text-center shrink-0 text-foreground">
                            {e.ano}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{e.cargo}</p>
                            <p className="text-xs text-muted-foreground">
                              {e.partido} · {e.uf}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {votos != null && (
                            <span className="text-xs text-muted-foreground">
                              {formatVotes(votos)} votos
                            </span>
                          )}
                          <ElectionResultBadge situacao={e.situacao} />
                          {e.txLink && (
                            <a
                              href={`https://divulgacandcontas.tse.jus.br/divulga/#${e.txLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-orange-500 transition-colors"
                              title="Ver no TSE"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : profile.eleicoesNoBanco.length > 0 ? (
                // Fallback: mostrar apenas dados do banco local
                <div className="space-y-2">
                  {profile.eleicoesNoBanco.map((e, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-base w-12 text-center shrink-0">{e.ano}</span>
                        <div>
                          <p className="font-medium">{e.cargo}</p>
                          <p className="text-xs text-muted-foreground">{e.partido} · {e.uf}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatVotes(e.totalVotos)} votos</span>
                        <SituacaoBadge situacao={e.situacao} eleito={e.eleito} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Histórico não disponível para este candidato.
                </p>
              )}
            </div>
          </div>
        )}

        {!isLoading && !profile && (
          <div className="p-8 text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-orange-400" />
            <p>Perfil não encontrado para este candidato.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-lg border ${
        highlight ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800" : "border-border bg-muted/30"
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-bold text-base text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function ElectionResultBadge({ situacao }: { situacao?: string | null }) {
  const s = (situacao ?? "").toUpperCase();
  if (s.includes("ELEITO") && !s.includes("NÃO") && !s.includes("NAO")) {
    return <Badge className="bg-emerald-600 text-white text-xs px-1.5 py-0">Eleito</Badge>;
  }
  if (s.includes("NÃO ELEITO") || s.includes("NAO ELEITO")) {
    return <Badge variant="secondary" className="text-xs px-1.5 py-0">Não eleito</Badge>;
  }
  if (s.includes("2º TURNO") || s.includes("2 TURNO")) {
    return <Badge className="bg-amber-500 text-white text-xs px-1.5 py-0">2º Turno</Badge>;
  }
  return <Badge variant="outline" className="text-xs px-1.5 py-0">{situacao ?? "—"}</Badge>;
}
