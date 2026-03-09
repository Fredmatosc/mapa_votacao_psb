import { useFilters } from "@/contexts/FiltersContext";
import { BRAZIL_UF_GEOJSON_URL, MAP_COLOR_SCALE, PSB_COLOR, formatPercent, formatVotes } from "@/lib/constants";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ChevronRight, Layers, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface UfMapData {
  uf: string;
  totalVotos: number;
  totalVotosValidos: number;
  percentualVotos: number;
}

function getColor(value: number, max: number): string {
  if (max === 0 || value === 0) return MAP_COLOR_SCALE[0];
  const ratio = value / max;
  const idx = Math.min(Math.floor(ratio * (MAP_COLOR_SCALE.length - 1)), MAP_COLOR_SCALE.length - 1);
  return MAP_COLOR_SCALE[idx];
}

interface ElectionMapProps {
  onUFClick?: (uf: string, nome: string) => void;
}

export function ElectionMap({ onUFClick }: ElectionMapProps = {}) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  // Use ref to avoid stale closure in useCallback
  const onUFClickRef = useRef(onUFClick);
  onUFClickRef.current = onUFClick;
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);
  const [hoveredUf, setHoveredUf] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { filters, setFilters } = useFilters();

  const { data: mapData, isLoading: dataLoading } = trpc.map.byUf.useQuery({
    ano: filters.ano,
    turno: filters.turno,
    cargo: filters.cargo,
    partidoSigla: filters.partidoSigla || undefined,
  });

  // Build lookup map
  const dataByUf: Record<string, UfMapData> = {};
  if (mapData) {
    for (const row of mapData) {
      dataByUf[row.uf] = {
        uf: row.uf,
        totalVotos: Number(row.totalVotos),
        totalVotosValidos: Number(row.totalVotosValidos),
        percentualVotos: Number(row.percentualVotos),
      };
    }
  }

  const maxVotes = Math.max(...Object.values(dataByUf).map((d) => d.totalVotos), 1);

  // Load GeoJSON
  useEffect(() => {
    setGeoLoading(true);
    fetch(BRAZIL_UF_GEOJSON_URL)
      .then((r) => r.json())
      .then((data) => {
        setGeoData(data);
        setGeoLoading(false);
      })
      .catch(() => setGeoLoading(false));
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: [-14.5, -51.0],
      zoom: 4.5,
      minZoom: 3,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft", prefix: "© TSE · IBGE" }).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update choropleth layer
  const updateLayer = useCallback(() => {
    if (!mapRef.current || !geoData) return;

    if (geoLayerRef.current) {
      geoLayerRef.current.remove();
      geoLayerRef.current = null;
    }

    const layer = L.geoJSON(geoData, {
      style: (feature) => {
        const uf = feature?.properties?.sigla ?? feature?.properties?.UF_05 ?? feature?.properties?.name;
        const d = dataByUf[uf];
        const fillColor = d ? getColor(d.totalVotos, maxVotes) : MAP_COLOR_SCALE[0];
        const isSelected = filters.uf === uf;
        return {
          fillColor,
          fillOpacity: isSelected ? 0.9 : 0.75,
          color: isSelected ? PSB_COLOR : "#ffffff",
          weight: isSelected ? 2.5 : 1,
          opacity: 1,
        };
      },
      onEachFeature: (feature, lyr) => {
        const uf = feature?.properties?.sigla ?? feature?.properties?.UF_05 ?? feature?.properties?.name;
        const nome = feature.properties?.name ?? feature.properties?.NM_ESTADO ?? uf;
        
        lyr.on({
          mouseover: (e) => {
            setHoveredUf(uf);
            const containerPoint = mapRef.current!.latLngToContainerPoint(e.latlng);
            setTooltipPos({ x: containerPoint.x, y: containerPoint.y });
            (e.target as L.Path).setStyle({ fillOpacity: 0.95, weight: 2, color: PSB_COLOR });
          },
          mouseout: (e) => {
            setHoveredUf(null);
            layer.resetStyle(e.target as L.Path);
            if (filters.uf === uf) {
              (e.target as L.Path).setStyle({ color: PSB_COLOR, weight: 2.5, fillOpacity: 0.9 });
            }
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            setFilters({
              uf: filters.uf === uf ? null : uf,
              viewLevel: filters.uf === uf ? "nacional" : "uf",
              codigoMunicipio: null,
              nomeMunicipio: null,
            });
            console.log('[ElectionMap] click on UF:', uf, nome, 'callback:', !!onUFClickRef.current);
            if (onUFClickRef.current) onUFClickRef.current(uf, nome);
          },
        });

        // Also attach native DOM click for touch/proxy environments
        const el = (lyr as L.Path).getElement?.();
        if (el) {
          el.addEventListener('click', (ev) => {
            ev.stopPropagation();
            console.log('[ElectionMap] native DOM click on UF:', uf);
            setFilters({
              uf: filters.uf === uf ? null : uf,
              viewLevel: filters.uf === uf ? "nacional" : "uf",
              codigoMunicipio: null,
              nomeMunicipio: null,
            });
            if (onUFClickRef.current) onUFClickRef.current(uf, nome);
          });
        }
      },
    });

    layer.addTo(mapRef.current);
    geoLayerRef.current = layer;

    // After adding to map, attach native DOM click listeners (for touch/proxy environments)
    layer.eachLayer((lyr) => {
      const f = (lyr as L.GeoJSON).feature as GeoJSON.Feature;
      const uf = f?.properties?.sigla ?? f?.properties?.UF_05 ?? f?.properties?.name;
      const nome = f?.properties?.name ?? f?.properties?.NM_ESTADO ?? uf;
      const el = (lyr as L.Path).getElement?.();
      if (el) {
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          console.log('[ElectionMap] native DOM click on UF:', uf);
          if (onUFClickRef.current) onUFClickRef.current(uf, nome);
        });
      }
    });
  }, [geoData, dataByUf, maxVotes, filters.uf, setFilters]);

  useEffect(() => {
    updateLayer();
  }, [updateLayer]);

  // Fit to selected UF
  useEffect(() => {
    if (!mapRef.current || !geoLayerRef.current) return;
    if (filters.uf) {
      geoLayerRef.current.eachLayer((lyr) => {
        const f = (lyr as L.GeoJSON).feature as GeoJSON.Feature;
        const uf = f?.properties?.sigla ?? f?.properties?.UF_05 ?? f?.properties?.name;
        if (uf === filters.uf) {
          mapRef.current!.fitBounds((lyr as unknown as L.Polyline).getBounds(), { padding: [40, 40] });
        }
      });
    } else {
      mapRef.current.setView([-14.235, -51.925], 4);
    }
  }, [filters.uf]);

  const hoveredData = hoveredUf ? dataByUf[hoveredUf] : null;

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-border">
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {(geoLoading || dataLoading) && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-[1000]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-border text-xs font-medium">
        <button
          onClick={() => setFilters({ uf: null, codigoMunicipio: null, nomeMunicipio: null, viewLevel: "nacional" })}
          className="text-primary hover:underline"
        >
          Brasil
        </button>
        {filters.uf && (
          <>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <button
              onClick={() => setFilters({ codigoMunicipio: null, nomeMunicipio: null, viewLevel: "uf" })}
              className="text-primary hover:underline"
            >
              {filters.uf}
            </button>
          </>
        )}
        {filters.nomeMunicipio && (
          <>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <span className="text-foreground">{filters.nomeMunicipio}</span>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-border">
        <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-primary" />
          Intensidade de votos
        </div>
        <div className="flex items-center gap-1">
          {MAP_COLOR_SCALE.map((color, i) => (
            <div
              key={i}
              className="w-5 h-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Menor</span>
          <span>Maior</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredUf && hoveredData && (
        <div
          className="absolute z-[1001] pointer-events-none bg-white rounded-lg shadow-lg border border-border p-3 min-w-[160px]"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 80,
            transform: tooltipPos.x > 400 ? "translateX(-100%)" : "none",
          }}
        >
          <div className="font-semibold text-sm text-foreground mb-1.5">{hoveredUf}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Votos {filters.partidoSigla}</span>
              <span className="font-medium text-foreground">{formatVotes(hoveredData.totalVotos)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">% dos válidos</span>
              <span className="font-medium" style={{ color: PSB_COLOR }}>
                {formatPercent(hoveredData.percentualVotos)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* No data notice */}
      {!dataLoading && !geoLoading && Object.keys(dataByUf).length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white/95 rounded-lg p-4 shadow-sm border border-border text-center">
          <ZoomIn className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Sem dados para esta seleção</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ajuste os filtros ou carregue os dados do TSE
          </p>
          <Badge variant="outline" className="mt-2 text-xs">
            Use o botão "Carregar Dados" no painel
          </Badge>
        </div>
      )}
    </div>
  );
}
