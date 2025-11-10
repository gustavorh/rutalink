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
import { Label } from "@/components/ui/label";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
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
  onClearFilters?: () => void;
}

function DataTableToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Buscar...",
  onSearchSubmit,
  filters = [],
  showFilters = false,
  onToggleFilters,
  onClearFilters,
}: DataTableToolbarProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 bg-ui-surface-elevated border-border text-foreground placeholder-muted-foreground focus:border-primary"
            aria-label="Buscar en la tabla"
          />
        </div>
        {onSearchSubmit && (
          <Button
            onClick={onSearchSubmit}
            className="bg-primary hover:bg-primary-dark"
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

      {/* Filter Options */}
      {showFilters && filters.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-ui-surface-elevated rounded-lg border border-border"
          role="region"
          aria-label="Filtros de búsqueda"
        >
          {filters.map((filter) => (
            <div key={filter.id}>
              <Label
                htmlFor={filter.id}
                className="text-xs font-medium text-muted-foreground mb-2 block"
              >
                {filter.label}
              </Label>
              {filter.type === "select" && filter.options ? (
                <Select value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger
                    id={filter.id}
                    className="bg-card border-border text-foreground"
                    aria-label={filter.ariaLabel || filter.label}
                  >
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option) => (
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
                  className="bg-card border-border text-foreground"
                  aria-label={filter.ariaLabel || filter.label}
                />
              )}
            </div>
          ))}

          {/* Clear Filters Button */}
          {onClearFilters && (
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Limpiar todos los filtros"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Limpiar Filtros
              </Button>
            </div>
          )}
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

  return (
    <Card className={`bg-card border-border ${className || ""}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {title && (
              <CardTitle className="text-foreground flex items-center gap-2">
                {icon}
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-muted-foreground">
                {description}
                {lastUpdate && (
                  <span className="ml-2 text-xs">
                    • Última actualización:{" "}
                    {lastUpdate.toLocaleTimeString("es-CL", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                )}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="border-border text-foreground hover:bg-ui-surface-elevated"
                title="Actualizar datos"
                aria-label="Actualizar datos de la tabla"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
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
              onClearFilters={onClearFilters}
            />
          </div>
        )}
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
                        className={`text-muted-foreground ${
                          column.headerClassName || ""
                        }`}
                      >
                        {column.header}
                      </TableHead>
                    ))}
                    {actions && actions.length > 0 && (
                      <TableHead className="text-right text-muted-foreground">
                        Acciones
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow
                      key={defaultGetRowKey(row, index)}
                      className="border-b border-border hover:bg-ui-surface-elevated"
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
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {actions.map((action, actionIndex) => (
                              <Button
                                key={actionIndex}
                                variant={action.variant || "ghost"}
                                size="icon"
                                onClick={() => action.onClick(row)}
                                className={action.className}
                                title={action.title || action.label}
                                aria-label={action.label}
                              >
                                {action.icon}
                              </Button>
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
