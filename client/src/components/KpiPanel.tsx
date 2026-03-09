import { useFilters } from "@/contexts/FiltersContext";
import { PARTY_COLORS, PSB_COLOR, formatPercent, formatVotes } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Activity, BarChart3, CheckCircle2, MapPin, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
  tooltip?: string;
  accentColor?: string;
}

function KpiCard({ label, value, sub, icon, trend, highlight, tooltip, accentColor }: KpiCardProps) {
  const color = accentColor ?? PSB_COLOR;
  const card = (
    <Card
      className={cn("border-border transition-shadow hover:shadow-md", highlight && "border-l-4")}
      style={highlight ? { borderLeftColor: color } : {}}
    >
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 flex-1 min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">{label}</p>
            <p
              className={cn("text-xl font-bold font-display truncate leading-tight")}
              style={highlight ? { color } : {}}
            >
              {value}
            </p>
            {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
          </div>
          <div
            className={cn("p-2 rounded-lg flex-shrink-0")}
            style={highlight ? { backgroundColor: `${color}18` } : { backgroundColor: "hsl(var(--muted))" }}
          >
            <div
              className="w-4 h-4"
              style={highlight ? { color } : { color: "hsl(var(--muted-foreground))" }}
            >
              {icon}
            </div>
          </div>
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 mt-1.5 text-[10px] font-medium",
              trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }
  return card;
}

export function KpiPanel() {
  const { filters } = useFilters();

  const { data: summary, isLoading: summaryLoading } = trpc.analytics.summary.useQuery({
    ano: filters.ano,
    turno: filters.turno,
    cargo: filters.cargo,
    uf: filters.uf ?? undefined,
  });

  const { data: mapData, isLoading: mapLoading } = trpc.map.byUf.useQuery({
    ano: filters.ano,
    turno: filters.turno,
    cargo: filters.cargo,
    partidoSigla: filters.partidoSigla || undefined,
  });

  // Candidatos eleitos do partido selecionado
  const { data: eleitosData, isLoading: eleitosLoading } = trpc.candidates.countEleitos.useQuery({
    ano: filters.ano,
    turno: filters.turno,
    cargo: filters.cargo,
    partidoSigla: filters.partidoSigla || undefined,
    uf: filters.uf ?? undefined,
  });

  const isLoading = summaryLoading || mapLoading;

  // Aggregate summary
  const totalEleitores = summary?.reduce((s, r) => s + Number(r.totalEleitores ?? 0), 0) ?? 0;
  const totalComparecimento = summary?.reduce((s, r) => s + Number(r.totalComparecimento ?? 0), 0) ?? 0;
  const totalAbstencoes = summary?.reduce((s, r) => s + Number(r.totalAbstencoes ?? 0), 0) ?? 0;
  const totalVotosBranco = summary?.reduce((s, r) => s + Number(r.totalVotosBranco ?? 0), 0) ?? 0;
  const totalVotosNulos = summary?.reduce((s, r) => s + Number(r.totalVotosNulos ?? 0), 0) ?? 0;
  const totalVotosValidos = summary?.reduce((s, r) => s + Number(r.totalVotosValidos ?? 0), 0) ?? 0;
  const percComparecimento = totalEleitores > 0 ? (totalComparecimento / totalEleitores) * 100 : 0;
  const percAbstencao = totalEleitores > 0 ? (totalAbstencoes / totalEleitores) * 100 : 0;

  // Partido selecionado
  const partyColor = PARTY_COLORS[filters.partidoSigla] ?? PSB_COLOR;
  const partyVotos = mapData?.reduce((s, r) => s + Number(r.totalVotos), 0) ?? 0;
  const partyPercent = totalVotosValidos > 0 ? (partyVotos / totalVotosValidos) * 100 : 0;
  const partyUfsCount = mapData?.filter((r) => Number(r.totalVotos) > 0).length ?? 0;

  // Eleitos
  const totalEleitos = eleitosData?.total ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-3.5">
              <Skeleton className="h-2.5 w-20 mb-2" />
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-2.5 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KpiCard
        label={`Votos ${filters.partidoSigla}`}
        value={formatVotes(partyVotos)}
        sub={`${formatPercent(partyPercent)} dos válidos`}
        icon={<BarChart3 className="w-4 h-4" />}
        highlight
        accentColor={partyColor}
        tooltip={`Total de votos nominais válidos recebidos pelo ${filters.partidoSigla} em ${filters.ano}`}
      />
      <KpiCard
        label="UFs com votos"
        value={String(partyUfsCount)}
        sub={`de 27 estados`}
        icon={<MapPin className="w-4 h-4" />}
        highlight
        accentColor={partyColor}
        tooltip={`Número de estados onde o ${filters.partidoSigla} obteve votos`}
      />
      {!eleitosLoading && (
        <KpiCard
          label="Candidatos Eleitos"
          value={String(totalEleitos)}
          sub={`${filters.cargo.toLowerCase()}`}
          icon={<CheckCircle2 className="w-4 h-4" />}
          highlight
          accentColor="#10b981"
          tooltip={`Candidatos do ${filters.partidoSigla} eleitos para ${filters.cargo} em ${filters.ano}`}
        />
      )}
      {eleitosLoading && (
        <Card className="border-border border-l-4" style={{ borderLeftColor: "#10b981" }}>
          <CardContent className="p-3.5">
            <Skeleton className="h-2.5 w-20 mb-2" />
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-2.5 w-24" />
          </CardContent>
        </Card>
      )}
      <KpiCard
        label="Eleitores"
        value={formatVotes(totalEleitores)}
        sub={`${filters.ano} · ${filters.turno}º turno`}
        icon={<Users className="w-4 h-4" />}
        tooltip="Total de eleitores aptos a votar"
      />
      <KpiCard
        label="Comparecimento"
        value={formatPercent(percComparecimento)}
        sub={formatVotes(totalComparecimento)}
        icon={<Activity className="w-4 h-4" />}
        trend={percComparecimento > 75 ? "up" : "down"}
        tooltip={`Taxa de comparecimento às urnas em ${filters.ano}`}
      />
      <KpiCard
        label="Abstenção"
        value={formatPercent(percAbstencao)}
        sub={formatVotes(totalAbstencoes)}
        icon={<TrendingDown className="w-4 h-4" />}
        trend={percAbstencao < 20 ? "up" : "down"}
        tooltip="Percentual de eleitores que não compareceram"
      />
    </div>
  );
}
