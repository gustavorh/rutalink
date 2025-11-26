"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Filter,
  XCircle,
  RefreshCw,
  Download,
  AlertTriangle,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableFilter {
  id: string;
  label: string;
  type: "select" | "text";
  options?: { value: string; label: string }[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}

export interface DataTableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: "ghost" | "outline" | "default" | "destructive";
  className?: string;
  title?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DataTableProps<T> {
  // Data
  data: T[];
  columns: DataTableColumn<T>[];
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;

  // Search
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onSearchSubmit?: () => void;

  // Filters
  filters?: DataTableFilter[];
  showFilters?: boolean;
  onToggleFilters?: () => void;
  onClearFilters?: () => void;

  // Actions
  actions?: DataTableAction<T>[];
  headerActions?: React.ReactNode;

  // Row interaction
  onRowClick?: (row: T) => void;

  // Loading & Error States
  loading?: boolean;
  error?: string | null;
  emptyState?: React.ReactNode;

  // Card Props
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;

  // Additional
  lastUpdate?: Date | null;
  onRefresh?: () => void;
  onExport?: () => void;
  className?: string;
  getRowKey?: (row: T) => string | number;
}

// ============================================================================
// TOOLBAR COMPONENT
// ============================================================================

interface DataTableToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  onSearchSubmit?: () => void;
  filters?: DataTableFilter[];
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

function DataTableToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Buscar...",
  onSearchSubmit,
  filters = [],
  showFilters = false,
  onToggleFilters,
}: DataTableToolbarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <label htmlFor="search-table" className="sr-only">
          Buscar
        </label>
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <div className="flex gap-2">
          <Input
            id="search-table"
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-12 pr-4 py-3 bg-ui-surface-elevated border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
            aria-describedby="search-help"
          />
          {onSearchSubmit && (
            <Button
              onClick={onSearchSubmit}
              className="bg-primary hover:bg-primary-dark px-4"
              aria-label="Ejecutar búsqueda"
            >
              Buscar
            </Button>
          )}
          {filters.length > 0 && onToggleFilters && (
            <Button
              variant="outline"
              onClick={onToggleFilters}
              className="border-border text-foreground hover:bg-ui-surface-elevated"
              aria-label={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
              aria-expanded={showFilters}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          )}
        </div>
        <span id="search-help" className="sr-only">
          Ingrese términos de búsqueda para filtrar resultados en tiempo real
        </span>
      </div>

      {/* Filter Options */}
      {showFilters && filters.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          role="region"
          aria-label="Filtros de búsqueda"
        >
          {filters.map((filter) => (
            <div key={filter.id}>
              <label
                htmlFor={filter.id}
                className="block text-sm font-medium text-muted-foreground mb-2"
              >
                {filter.label}
              </label>
              {filter.type === "select" && filter.options ? (
                <Select
                  value={filter.value || undefined}
                  onValueChange={filter.onChange}
                >
                  <SelectTrigger
                    id={filter.id}
                    className="w-full px-4 py-3 bg-ui-surface-elevated border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    aria-label={filter.ariaLabel || filter.label}
                  >
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options
                      .filter((option) => option.value !== "") // Filter out empty string values
                      .map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={filter.id}
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  placeholder={filter.placeholder}
                  className="w-full px-4 py-3 bg-ui-surface-elevated border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  aria-label={filter.ariaLabel || filter.label}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PAGINATION COMPONENT
// ============================================================================

interface DataTablePaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

function DataTablePagination({
  pagination,
  onPageChange,
  itemLabel = "elementos",
}: DataTablePaginationProps) {
  const { page, limit, total, totalPages } = pagination;

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de{" "}
        {total} {itemLabel}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="border-border text-foreground hover:bg-ui-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Página anterior"
        >
          Anterior
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (p) =>
              p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)
          )
          .map((p, index, array) => (
            <div key={p} className="flex items-center">
              {index > 0 && array[index - 1] !== p - 1 && (
                <span className="text-muted-foreground px-2">...</span>
              )}
              <Button
                variant={p === page ? "default" : "outline"}
                onClick={() => onPageChange(p)}
                className={
                  p === page
                    ? "bg-primary hover:bg-primary-dark text-white"
                    : "border-border text-foreground hover:bg-ui-surface-elevated"
                }
                aria-label={`Ir a página ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Button>
            </div>
          ))}
        <Button
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="border-border text-foreground hover:bg-ui-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Página siguiente"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN DATA TABLE COMPONENT
// ============================================================================

export function DataTable<T>({
  data,
  columns,
  pagination,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onSearchSubmit,
  filters,
  showFilters,
  onToggleFilters,
  onClearFilters,
  actions,
  headerActions,
  onRowClick,
  loading = false,
  error = null,
  emptyState,
  title,
  description,
  icon,
  lastUpdate,
  onRefresh,
  onExport,
  className,
  getRowKey,
}: DataTableProps<T>) {
  const defaultGetRowKey = (row: T, index: number): string | number => {
    if (getRowKey) return getRowKey(row);
    const record = row as Record<string, unknown>;
    return typeof record.id === "string" || typeof record.id === "number"
      ? record.id
      : index;
  };

  // Count active filters (exclude empty strings and "all" values)
  const activeFiltersCount = filters
    ? filters.filter((f) => f.value && f.value !== "" && f.value !== "all")
        .length
    : 0;

  return (
    <Card className={`bg-card border-border shadow-lg ${className || ""}`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              {title && (
                <CardTitle className="text-foreground text-xl flex items-center gap-2">
                  {icon}
                  {title}
                  {description && typeof description === "string" && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({description})
                    </span>
                  )}
                  {activeFiltersCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
                      {activeFiltersCount} filtros
                    </span>
                  )}
                </CardTitle>
              )}
            </div>

            {/* Actions Row */}
            <div className="flex items-center gap-3">
              {/* Last Update Timestamp */}
              {lastUpdate && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-ui-surface-elevated px-3 py-2 rounded-lg border border-border">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Última actualización:{" "}
                    {lastUpdate.toLocaleTimeString("es-CL", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              )}

              {/* Clear Filters Button */}
              {activeFiltersCount > 0 && onClearFilters && (
                <button
                  onClick={onClearFilters}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg border border-border hover:border-primary transition-all duration-200"
                  aria-label="Limpiar todos los filtros"
                >
                  <XCircle className="w-4 h-4" />
                  Limpiar
                </button>
              )}

              {/* Refresh Button */}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="flex items-center gap-2 text-sm text-primary hover:text-purple-300 px-4 py-2 rounded-lg border border-primary hover:border-purple-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Actualizar lista"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>
              )}

              {/* Export Button */}
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  className="border-border text-foreground hover:bg-ui-surface-elevated"
                  aria-label="Exportar datos"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              )}

              {headerActions}
            </div>
          </div>

          {/* Toolbar */}
          {(searchValue !== undefined || filters) && (
            <div className="mt-4">
              <DataTableToolbar
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                searchPlaceholder={searchPlaceholder}
                onSearchSubmit={onSearchSubmit}
                filters={filters}
                showFilters={showFilters}
                onToggleFilters={onToggleFilters}
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error}</p>
          </div>
        ) : data.length === 0 ? (
          emptyState || (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron datos</p>
            </div>
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className={`text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-4 pr-4 ${
                          column.headerClassName || ""
                        }`}
                      >
                        {column.header}
                      </TableHead>
                    ))}
                    {actions && actions.length > 0 && (
                      <TableHead className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-4">
                        Acciones
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow
                      key={defaultGetRowKey(row, index)}
                      className={`border-b border-border hover:bg-ui-surface-elevated ${
                        onRowClick ? "cursor-pointer" : ""
                      }`}
                      onClick={() => onRowClick?.(row)}
                    >
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={column.className}
                        >
                          {column.accessor
                            ? column.accessor(row)
                            : String(
                                (row as Record<string, unknown>)[column.key] ??
                                  ""
                              )}
                        </TableCell>
                      ))}
                      {actions && actions.length > 0 && (
                        <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {actions.map((action, actionIndex) => (
                              <button
                                key={actionIndex}
                                onClick={() => action.onClick(row)}
                                className={`p-2 hover:bg-ui-surface-elevated rounded-lg transition-colors ${
                                  action.className ||
                                  "text-muted-foreground hover:text-primary"
                                }`}
                                title={action.title || action.label}
                                aria-label={action.label}
                              >
                                {action.icon}
                              </button>
                            ))}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && onPageChange && (
              <DataTablePagination
                pagination={pagination}
                onPageChange={onPageChange}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export { DataTableToolbar, DataTablePagination };
