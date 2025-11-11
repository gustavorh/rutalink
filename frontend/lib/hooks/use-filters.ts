"use client";

import { useState, useCallback } from "react";

interface FilterState {
  [key: string]: string;
}

interface UseFiltersProps {
  initialFilters?: FilterState;
  initialShowFilters?: boolean;
}

interface UseFiltersReturn<T extends FilterState> {
  filters: T;
  setFilter: (key: keyof T, value: string) => void;
  setFilters: (filters: Partial<T>) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  toggleFilters: () => void;
  clearFilters: () => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export function useFilters<T extends FilterState>({
  initialFilters = {} as T,
  initialShowFilters = false,
}: UseFiltersProps = {}): UseFiltersReturn<T> {
  const [filters, setFiltersState] = useState<T>(initialFilters as T);
  const [showFilters, setShowFilters] = useState(initialShowFilters);

  const setFilter = useCallback((key: keyof T, value: string) => {
    setFiltersState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const setFilters = useCallback((newFilters: Partial<T>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const clearFilters = useCallback(() => {
    const clearedFilters = Object.keys(filters).reduce((acc, key) => {
      acc[key] = "all";
      return acc;
    }, {} as Record<string, string>);
    setFiltersState(clearedFilters as T);
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters as T);
  }, [initialFilters]);

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== "all" && value !== ""
  );

  return {
    filters,
    setFilter,
    setFilters,
    showFilters,
    setShowFilters,
    toggleFilters,
    clearFilters,
    resetFilters,
    hasActiveFilters,
  };
}

