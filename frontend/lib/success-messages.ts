/**
 * Success message utilities for API operations
 */

export type ResourceType =
  | "client"
  | "driver"
  | "vehicle"
  | "operation"
  | "route"
  | "provider"
  | "operator"
  | "role"
  | "user";

const RESOURCE_NAMES: Record<ResourceType, { singular: string; plural: string }> = {
  client: { singular: "Cliente", plural: "Clientes" },
  driver: { singular: "Chofer", plural: "Choferes" },
  vehicle: { singular: "Vehículo", plural: "Vehículos" },
  operation: { singular: "Operación", plural: "Operaciones" },
  route: { singular: "Ruta", plural: "Rutas" },
  provider: { singular: "Proveedor", plural: "Proveedores" },
  operator: { singular: "Operador", plural: "Operadores" },
  role: { singular: "Rol", plural: "Roles" },
  user: { singular: "Usuario", plural: "Usuarios" },
};

/**
 * Get success message for create operation
 */
export function getCreateSuccessMessage(resourceType: ResourceType): string {
  const resource = RESOURCE_NAMES[resourceType];
  return `${resource.singular} creado exitosamente`;
}

/**
 * Get success message for update operation
 */
export function getUpdateSuccessMessage(resourceType: ResourceType): string {
  const resource = RESOURCE_NAMES[resourceType];
  return `${resource.singular} actualizado exitosamente`;
}

/**
 * Get success message for delete operation
 */
export function getDeleteSuccessMessage(resourceType: ResourceType): string {
  const resource = RESOURCE_NAMES[resourceType];
  return `${resource.singular} eliminado exitosamente`;
}

