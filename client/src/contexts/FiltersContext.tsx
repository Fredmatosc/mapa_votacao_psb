import React, { createContext, useContext, useState, useCallback } from "react";

export interface ElectionFilters {
  ano: number;
  turno: number;
  cargo: string;
  partidoSigla: string;
  uf: string | null;
  codigoMunicipio: string | null;
  nomeMunicipio: string | null;
  viewLevel: "nacional" | "uf" | "municipio" | "zona";
}

interface FiltersContextType {
  filters: ElectionFilters;
  setFilters: (filters: Partial<ElectionFilters>) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: ElectionFilters = {
  ano: 2022,
  turno: 1,
  cargo: "DEPUTADO FEDERAL",
  partidoSigla: "",
  uf: null,
  codigoMunicipio: null,
  nomeMunicipio: null,
  viewLevel: "nacional",
};

const FiltersContext = createContext<FiltersContextType | null>(null);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<ElectionFilters>(DEFAULT_FILTERS);

  const setFilters = useCallback((partial: Partial<ElectionFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  return (
    <FiltersContext.Provider value={{ filters, setFilters, resetFilters }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within FiltersProvider");
  return ctx;
}
