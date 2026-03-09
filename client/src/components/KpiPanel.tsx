import { useFilters } from "@/contexts/FiltersContext";
import { PSB_COLOR, formatPercent, formatVotes } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Activity, BarChart3, MapPin, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
}

function KpiCard({ label, value, sub, icon, trend, highlight }: KpiCardProps) {
  return (
    <Card className={cn("border-border", highlight && "border-l-4")} style={highlight ? { borderLeftColor: PSB_COLOR } : {}}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{label}</p>
            <p className={cn("text-xl font-bold font-display truncate", highlight && "text-primary")}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
          </div>
          <div className={cn("p-2 rounded-lg ml-3 flex-shrink-0", highlight ? "bg-primary/10" : "bg-muted")}>
            <div className={cn("w-4 h-4", highlight ? "text-primary" : "text-muted-foreground")}>
              {icon}
            </div>
          </div>
        </div>
        {trend && (
          <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground")}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : trend === "down" ? <TrendingDown className="w-3 h-3" /> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
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

  // PSB total
  const psbVotos = mapData?.reduce((s, r) => s + Number(r.totalVotos), 0) ?? 0;
  const psbPercent = totalVotosValidos > 0 ? (psbVotos / totalVotosValidos) * 100 : 0;
  const psbUfsCount = mapData?.filter((r) => Number(r.totalVotos) > 0).length ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-border">
            <CardContent className="p-4">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
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
        value={formatVotes(psbVotos)}
        sub={`${formatPercent(psbPercent)} dos válidos`}
        icon={<BarChart3 className="w-4 h-4" />}
        highlight
      />
      <KpiCard
        label="UFs com votos"
        value={String(psbUfsCount)}
        sub={`de 27 estados`}
        icon={<MapPin className="w-4 h-4" />}
        highlight
      />
      <KpiCard
        label="Eleitores"
        value={formatVotes(totalEleitores)}
        sub={`${filters.ano} · ${filters.turno}º turno`}
        icon={<Users className="w-4 h-4" />}
      />
      <KpiCard
        label="Comparecimento"
        value={formatPercent(percComparecimento)}
        sub={formatVotes(totalComparecimento)}
        icon={<Activity className="w-4 h-4" />}
        trend={percComparecimento > 75 ? "up" : "down"}
      />
      <KpiCard
        label="Abstenção"
        value={formatPercent(percAbstencao)}
        sub={formatVotes(totalAbstencoes)}
        icon={<TrendingDown className="w-4 h-4" />}
        trend={percAbstencao < 20 ? "up" : "down"}
      />
      <KpiCard
        label="Votos Brancos/Nulos"
        value={formatVotes(totalVotosBranco + totalVotosNulos)}
        sub={`${formatPercent(totalComparecimento > 0 ? ((totalVotosBranco + totalVotosNulos) / totalComparecimento) * 100 : 0)} do total`}
        icon={<TrendingDown className="w-4 h-4" />}
      />
    </div>
  );
}
