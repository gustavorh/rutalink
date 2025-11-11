/**
 * Route Types
 * Types for the Routes (Tramos) module
 */

// ============================================================================
// ROUTE TYPES
// ============================================================================

export const ROUTE_TYPES = [
  { value: "urbana", label: "Urbana" },
  { value: "interurbana", label: "Interurbana" },
  { value: "minera", label: "Minera" },
  { value: "rural", label: "Rural" },
  { value: "carretera", label: "Carretera" },
  { value: "montaña", label: "Montaña" },
  { value: "otra", label: "Otra" },
] as const;

export const DIFFICULTY_LEVELS = [
  { value: "fácil", label: "Fácil" },
  { value: "moderada", label: "Moderada" },
  { value: "difícil", label: "Difícil" },
] as const;

// ============================================================================
// ROUTE INTERFACE
// ============================================================================

export interface Route {
  id: number;
  operatorId: number;
  name: string; // nombre descriptivo del tramo
  code?: string | null; // código interno
  origin: string;
  destination: string;
  distance?: number | null; // km
  estimatedDuration?: number | null; // minutos
  routeType?: string | null; // tipo de ruta
  difficulty?: string | null; // dificultad
  roadConditions?: string | null; // condiciones de la ruta
  tollsRequired?: boolean | null; // requiere peajes
  estimatedTollCost?: number | null; // costo estimado de peajes
  status: boolean;
  observations?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: number | null;
  updatedBy?: number | null;
}

// ============================================================================
// ROUTE INPUT TYPES
// ============================================================================

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginatedRoutes {
  data: Route[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

export interface RouteStatistics {
  route: Route;
  statistics: {
    totalOperations: number;
    completedOperations: number;
    scheduledOperations: number;
    inProgressOperations: number;
    cancelledOperations: number;
  };
}
