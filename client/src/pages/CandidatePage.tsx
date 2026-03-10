import { PARTY_COLORS } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Award,
  BarChart2,
  ChevronLeft,
  DollarSign,
  ExternalLink,
  MapPin,
  Trophy,
  User,
  Vote,
} from "lucide-react";
import { useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR");
}
function fmtBRL(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
}
function fmtBRL2(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function getSituacaoStyle(situacao: string | null | undefined) {
  const s = (situacao ?? "").toLowerCase();
  if (s.includes("eleito") && !s.includes("não") && !s.includes("nao")) {
    return { label: "Eleito", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  }
  if (s.includes("suplente")) return { label: "Suplente", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  if (s.includes("2º turno") || s.includes("2 turno")) return { label: "2º Turno", cls: "bg-blue-100 text-blue-700 border-blue-200" };
  return { label: situacao ?? "Não eleito", cls: "bg-slate-100 text-slate-600 border-slate-200" };
}

export default function CandidatePage() {
  const [, params] = useRoute("/candidato/:sequencial");
  const [location] = useLocation();
  const [, navigate] = useLocation();

  const sequencial = params?.sequencial ?? "";

  // Parse query params
  const searchParams = useMemo(() => {
    const url = new URL(window.location.href);
    return {
      ano: parseInt(url.searchParams.get("ano") ?? "2022"),
      turno: parseInt(url.searchParams.get("turno") ?? "1"),
    };
  }, [location]);

  const { data: profile, isLoading } = trpc.candidates.getProfile.useQuery(
    { candidatoSequencial: sequencial, ano: searchParams.ano, turno: searchParams.turno },
    { enabled: !!sequencial }
  );

  // Votos por município (para o mapa de votos)
  const { data: zoneByMun } = trpc.candidates.zoneByMunicipality.useQuery(
    { candidatoSequencial: sequencial, ano: searchParams.ano, turno: searchParams.turno, uf: profile?.uf ?? "" },
    { enabled: !!sequencial && !!profile?.uf }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="w-16 h-16 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Candidato não encontrado</h2>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
        </div>
      </div>
    );
  }

  const partyColor = PARTY_COLORS[profile.partidoSigla] ?? PARTY_COLORS.DEFAULT;
  const displayName = profile.candidatoNomeUrna ?? profile.candidatoNome;
  const situacaoAtual = getSituacaoStyle(profile.situacao);

  // Ordenar municípios por votos
  const municipiosSorted = useMemo(() => {
    if (!zoneByMun) return [];
    return [...zoneByMun].sort((a, b) => (b.totalVotos ?? 0) - (a.totalVotos ?? 0));
  }, [zoneByMun]);

  const totalVotosMunicipios = useMemo(
    () => municipiosSorted.reduce((s, m) => s + (m.totalVotos ?? 0), 0),
    [municipiosSorted]
  );

  // Combinar histórico do DivulgaCand com eleições no banco
  const historicoCompleto = useMemo(() => {
    const divulgaMap = new Map(
      (profile.historico ?? []).map((h) => [`${h.ano}-${h.cargo?.toUpperCase()?.trim()}`, h])
    );
    const bancoMap = new Map(
      (profile.eleicoesNoBanco ?? []).map((e) => [`${e.ano}-${e.cargo?.toUpperCase()?.trim()}`, e])
    );

    // Unir todas as chaves
    const allKeys = new Set([...Array.from(divulgaMap.keys()), ...Array.from(bancoMap.keys())]);
    const result = Array.from(allKeys).map((key) => {
      const d = divulgaMap.get(key);
      const b = bancoMap.get(key);
      return {
        ano: d?.ano ?? b?.ano ?? 0,
        cargo: d?.cargo ?? b?.cargo ?? "",
        partido: d?.partido ?? b?.partido ?? "",
        uf: d?.uf ?? b?.uf ?? "",
        situacao: d?.situacao ?? b?.situacao ?? null,
        votos: b?.totalVotos ?? d?.votos ?? null,
        eleito: b?.eleito ?? null,
        txLink: d?.txLink ?? null,
      };
    });
    return result.sort((a, b) => b.ano - a.ano);
  }, [profile.historico, profile.eleicoesNoBanco]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base truncate">{displayName}</h1>
            <p className="text-xs text-muted-foreground">
              {profile.cargo} · {profile.uf} · {profile.ano} · {profile.turno}º Turno
            </p>
          </div>
          <span
            className="text-sm font-bold px-2 py-1 rounded"
            style={{ backgroundColor: `${partyColor}20`, color: partyColor }}
          >
            {profile.partidoSigla}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Hero: foto + dados principais */}
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Foto */}
          <div className="shrink-0 flex flex-col items-center gap-3">
            {profile.fotoUrl && profile.fotoPublicavel ? (
              <img
                src={profile.fotoUrl}
                alt={displayName}
                className="w-28 h-28 rounded-full object-cover border-4 shadow-md"
                style={{ borderColor: partyColor }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center border-4 shadow-md"
                style={{ backgroundColor: `${partyColor}15`, borderColor: `${partyColor}40` }}
              >
                <User className="w-14 h-14" style={{ color: partyColor }} />
              </div>
            )}
            <Badge className={cn("text-xs px-2 py-1 border", situacaoAtual.cls)}>
              {situacaoAtual.label}
            </Badge>
            {profile.genero && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {profile.genero}
              </span>
            )}
            {profile.orientacao && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {profile.orientacao}
              </span>
            )}
          </div>

          {/* Dados principais */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Vote className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Total de Votos</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: partyColor }}>
                  {fmt(profile.totalVotos)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {profile.ano} · {profile.turno}º Turno
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Gasto Campanha</span>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {fmtBRL(profile.gastoTotal)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">1º turno declarado</div>
              </CardContent>
            </Card>

            <Card className="col-span-2 sm:col-span-1">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart2 className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Custo por Voto</span>
                </div>
                <div className="text-lg font-bold" style={{ color: partyColor }}>
                  {fmtBRL2(profile.custoPorVoto)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">gasto ÷ votos</div>
              </CardContent>
            </Card>

            {profile.nomeColigacao && (
              <Card className="col-span-2 sm:col-span-3">
                <CardContent className="p-3">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Coligação</div>
                  <div className="text-sm font-medium">{profile.nomeColigacao}</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Histórico Eleitoral */}
        {historicoCompleto.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Histórico Eleitoral Completo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {historicoCompleto.map((h, i) => {
                  const sit = getSituacaoStyle(h.situacao);
                  const hPartyColor = PARTY_COLORS[h.partido] ?? PARTY_COLORS.DEFAULT;
                  const isCurrentElection = h.ano === profile.ano && h.cargo?.toUpperCase() === profile.cargo?.toUpperCase();
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        isCurrentElection && "bg-primary/5 border-l-2 border-l-primary"
                      )}
                    >
                      {/* Ano */}
                      <div className="w-12 shrink-0">
                        <span className="text-sm font-bold text-foreground">{h.ano}</span>
                      </div>

                      {/* Cargo + UF */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{h.cargo}</div>
                        <div className="text-xs text-muted-foreground">{h.uf}</div>
                      </div>

                      {/* Partido */}
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{ backgroundColor: `${hPartyColor}20`, color: hPartyColor }}
                      >
                        {h.partido}
                      </span>

                      {/* Votos */}
                      <div className="text-right shrink-0 w-20">
                        {h.votos != null ? (
                          <>
                            <div className="text-sm font-semibold text-foreground">{fmt(h.votos)}</div>
                            <div className="text-[10px] text-muted-foreground">votos</div>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Situação */}
                      <Badge className={cn("text-[10px] px-1.5 py-0.5 border shrink-0", sit.cls)}>
                        {sit.label}
                      </Badge>

                      {/* Link externo */}
                      {h.txLink && (
                        <a
                          href={h.txLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                          title="Ver no DivulgaCandContas"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Votação por Município */}
        {municipiosSorted.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Votação por Município
                <span className="text-xs font-normal text-muted-foreground ml-auto">
                  {municipiosSorted.length} municípios · {fmt(totalVotosMunicipios)} votos totais
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {municipiosSorted.map((m, i) => {
                  const pct = totalVotosMunicipios > 0 ? ((m.totalVotos ?? 0) / totalVotosMunicipios) * 100 : 0;
                  const isTop = i < 3;
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      {/* Rank */}
                      <div className="w-6 shrink-0 text-center">
                        {i === 0 ? <Trophy className="w-3.5 h-3.5 text-yellow-500 mx-auto" /> :
                         i === 1 ? <Award className="w-3.5 h-3.5 text-slate-400 mx-auto" /> :
                         i === 2 ? <Award className="w-3.5 h-3.5 text-amber-600 mx-auto" /> :
                         <span className="text-[10px] text-muted-foreground">{i + 1}</span>}
                      </div>

                      {/* Nome */}
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-sm truncate", isTop ? "font-semibold" : "font-medium")}>
                          {m.nomeMunicipio}
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      <div className="w-24 shrink-0">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(pct * 3, 100)}%`, backgroundColor: partyColor }}
                          />
                        </div>
                      </div>

                      {/* Votos + % */}
                      <div className="text-right shrink-0 w-24">
                        <div className="text-sm font-semibold">{fmt(m.totalVotos)}</div>
                        <div className="text-[10px] text-muted-foreground">{pct.toFixed(1)}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Situação do registro */}
        {profile.descricaoSituacaoCandidato && (
          <div className="text-xs text-muted-foreground text-center pb-4">
            Situação do registro: <span className="font-medium text-foreground">{profile.descricaoSituacaoCandidato}</span>
            {profile.isCandidatoInapto && (
              <span className="ml-2 text-red-500 font-medium">· Candidato inapto</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
