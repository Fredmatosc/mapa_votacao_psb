import { useFilters } from "@/contexts/FiltersContext";
import { CARGOS, PARTY_COLORS, PSB_COLOR, formatVotes } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const CHART_COLORS = [PSB_COLOR, "#CC0000", "#003399", "#009900", "#CC6600", "#CC00CC", "#0099CC", "#006600"];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg p-3 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">{formatVotes(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Comparação entre Partidos ───────────────────────────────────────────────
function PartyComparisonChart() {
  const { filters } = useFilters();
  const { data, isLoading } = trpc.analytics.partyComparison.useQuery({
    ano: filters.ano,
    turno: filters.turno,
    cargo: filters.cargo,
    uf: filters.uf ?? undefined,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data?.length) return <EmptyChart />;

  const chartData = data.slice(0, 10).map((d) => ({
    partido: d.partidoSigla,
    votos: Number(d.totalVotos),
    percentual: Number(d.percentualVotos).toFixed(1),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="partido" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => formatVotes(v)} tick={{ fontSize: 10 }} width={50} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="votos" name="Votos" radius={[3, 3, 0, 0]}>
          {chartData.map((entry) => (
            <Cell
              key={entry.partido}
              fill={PARTY_COLORS[entry.partido] ?? PARTY_COLORS.DEFAULT}
              opacity={entry.partido === filters.partidoSigla ? 1 : 0.7}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Evolução Temporal ───────────────────────────────────────────────────────
function TemporalEvolutionChart() {
  const { filters } = useFilters();
  const [selectedCargo, setSelectedCargo] = useState(filters.cargo);

  const { data: psbData, isLoading: psbLoading } = trpc.analytics.temporalEvolution.useQuery({
    cargo: selectedCargo,
    partidoSigla: filters.partidoSigla || undefined,
    uf: filters.uf ?? undefined,
  });

  const { data: ptData } = trpc.analytics.temporalEvolution.useQuery({
    cargo: selectedCargo,
    partidoSigla: "PT",
    uf: filters.uf ?? undefined,
  });

  const { data: plData } = trpc.analytics.temporalEvolution.useQuery({
    cargo: selectedCargo,
    partidoSigla: "PL",
    uf: filters.uf ?? undefined,
  });

  if (psbLoading) return <Skeleton className="h-64 w-full" />;

  // Merge data by year
  const years = [2010, 2014, 2018, 2022];
  const chartData = years.map((ano) => {
    const psb = psbData?.find((d) => d.ano === ano && d.turno === 1);
    const pt = ptData?.find((d) => d.ano === ano && d.turno === 1);
    const pl = plData?.find((d) => d.ano === ano && d.turno === 1);
    return {
      ano: String(ano),
      [filters.partidoSigla || "PSB"]: Number(psb?.totalVotos ?? 0),
      PT: Number(pt?.totalVotos ?? 0),
      PL: Number(pl?.totalVotos ?? 0),
    };
  });

  return (
    <div className="space-y-3">
      <Select value={selectedCargo} onValueChange={setSelectedCargo}>
        <SelectTrigger className="h-7 text-xs w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CARGOS.map((c) => (
            <SelectItem key={c.value} value={c.value} className="text-xs">
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="ano" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => formatVotes(v)} tick={{ fontSize: 10 }} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey={filters.partidoSigla || "PSB"}
            stroke={PSB_COLOR}
            strokeWidth={2.5}
            dot={{ fill: PSB_COLOR, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line type="monotone" dataKey="PT" stroke="#CC0000" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 3 }} />
          <Line type="monotone" dataKey="PL" stroke="#003399" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Distribuição por Partido (Pizza) ────────────────────────────────────────
function PartyDistributionPie() {
  const { filters } = useFilters();
  const { data, isLoading } = trpc.analytics.partyComparison.useQuery({
    ano: filters.ano,
    turno: filters.turno,
    cargo: filters.cargo,
    uf: filters.uf ?? undefined,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data?.length) return <EmptyChart />;

  const top8 = data.slice(0, 8);
  const others = data.slice(8);
  const othersTotal = others.reduce((s, d) => s + Number(d.totalVotos), 0);

  const pieData = [
    ...top8.map((d) => ({
      name: d.partidoSigla,
      value: Number(d.totalVotos),
    })),
    ...(othersTotal > 0 ? [{ name: "Outros", value: othersTotal }] : []),
  ];

  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="50%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            strokeWidth={1}
            stroke="#fff"
          >
            {pieData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={PARTY_COLORS[entry.name] ?? CHART_COLORS[index % CHART_COLORS.length]}
                opacity={entry.name === filters.partidoSigla ? 1 : 0.75}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              `${formatVotes(value)} (${((value / total) * 100).toFixed(1)}%)`,
              "Votos",
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-1.5">
        {pieData.slice(0, 8).map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: PARTY_COLORS[d.name] ?? CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className={cn("font-medium flex-1", d.name === filters.partidoSigla && "text-primary")}>
              {d.name}
            </span>
            <span className="text-muted-foreground">{((d.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Ranking de Candidatos ───────────────────────────────────────────────────
function CandidateRanking() {
  const { filters } = useFilters();
  const { data, isLoading } = trpc.map.resultsByUf.useQuery({
    ano: filters.ano,
    turno: filters.turno,
    cargo: filters.cargo,
    partidoSigla: filters.partidoSigla || undefined,
    uf: filters.uf ?? undefined,
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data?.length) return <EmptyChart message="Selecione um estado para ver o ranking de candidatos" />;

  type CandRow = { candidatoNome?: string | null; totalVotos: number | bigint; partidoSigla?: string | null; uf?: string | null; };
  const ranked = (data as CandRow[])
    .filter((d) => d.candidatoNome)
    .sort((a: CandRow, b: CandRow) => Number(b.totalVotos) - Number(a.totalVotos))
    .slice(0, 10);

  const maxVotes = Math.max(...ranked.map((d: CandRow) => Number(d.totalVotos)), 1);

  return (
    <div className="space-y-2">
      {ranked.map((d, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="w-5 text-right font-bold text-muted-foreground">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-medium text-foreground truncate">{d.candidatoNome}</span>
              <span className="font-semibold text-foreground ml-2 flex-shrink-0">{formatVotes(Number(d.totalVotos))}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(Number(d.totalVotos) / maxVotes) * 100}%`,
                  backgroundColor: PARTY_COLORS[d.partidoSigla ?? ''] ?? PSB_COLOR,
                }}
              />
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
            {d.uf}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ message = "Sem dados para esta seleção" }: { message?: string }) {
  return (
    <div className="h-40 flex items-center justify-center text-center">
      <div>
        <p className="text-sm text-muted-foreground">{message}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Carregue os dados do TSE para visualizar</p>
      </div>
    </div>
  );
}

// ─── Painel Principal de Análises ────────────────────────────────────────────
export function AnalyticsCharts() {
  const { filters } = useFilters();

  return (
    <div className="space-y-4">
      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid grid-cols-4 h-8">
          <TabsTrigger value="comparison" className="text-xs">Partidos</TabsTrigger>
          <TabsTrigger value="temporal" className="text-xs">Evolução</TabsTrigger>
          <TabsTrigger value="distribution" className="text-xs">Distribuição</TabsTrigger>
          <TabsTrigger value="ranking" className="text-xs">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="mt-3">
          <Card className="border-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold">
                Comparação entre Partidos — {filters.cargo} {filters.ano}
                {filters.uf && ` · ${filters.uf}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <PartyComparisonChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temporal" className="mt-3">
          <Card className="border-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold">
                Evolução Temporal 2010–2022
                {filters.uf && ` · ${filters.uf}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <TemporalEvolutionChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="mt-3">
          <Card className="border-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold">
                Distribuição por Partido — {filters.cargo} {filters.ano}
                {filters.uf && ` · ${filters.uf}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <PartyDistributionPie />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking" className="mt-3">
          <Card className="border-border">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm font-semibold">
                Ranking de Candidatos — {filters.partidoSigla} {filters.ano}
                {filters.uf ? ` · ${filters.uf}` : " · Brasil"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <CandidateRanking />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
