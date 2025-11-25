"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { LiveOperation } from "@/types/dashboard";
import type { FilterOption } from "@/types/dashboard";
import type { UpdateOperationDto } from "@/lib/api-types";
import { api } from "@/lib/client-api";

interface EditOperationModalProps {
  operation: LiveOperation | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: FilterOption[];
  providers: FilterOption[];
  routes: FilterOption[];
  vehicles: FilterOption[];
}

export function EditOperationModal({
  operation,
  isOpen,
  onClose,
  onSuccess,
  clients,
  providers,
  routes,
  vehicles,
}: EditOperationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    clientId: number | null;
    providerId: number | null;
    routeId: number | null;
    vehicleId: number;
  }>({
    clientId: null,
    providerId: null,
    routeId: null,
    vehicleId: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (operation) {
      setFormData({
        clientId: operation.operation.clientId || null,
        providerId: operation.operation.providerId || null,
        routeId: operation.operation.routeId || null,
        vehicleId: operation.operation.vehicleId,
      });
    }
  }, [operation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operation) return;

    setLoading(true);
    setError(null);

    try {
      const updateData: UpdateOperationDto = {
        clientId: formData.clientId || undefined,
        providerId: formData.providerId || undefined,
        routeId: formData.routeId || undefined,
        vehicleId: formData.vehicleId,
      };

      await api.operations.update(operation.operation.id, updateData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating operation:", err);
      setError(
        err instanceof Error ? err.message : "Error al actualizar operación"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value ? Number(value) : null,
    }));
  };

  if (!operation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">
            Editar Operación #{operation.operation.operationNumber}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Actualizar asignaciones de la operación
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Operation Info Display */}
          <div className="bg-ui-surface-elevated p-4 rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Información de la Operación
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Estado:</span>
                <span className="ml-2 text-foreground font-medium">
                  {operation.operation.status === "scheduled"
                    ? "Programada"
                    : operation.operation.status === "confirmed"
                    ? "Confirmada"
                    : operation.operation.status === "in-progress"
                    ? "En Progreso"
                    : operation.operation.status === "completed"
                    ? "Completada"
                    : "Cancelada"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <span className="ml-2 text-foreground font-medium">
                  {operation.operation.operationType}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Ruta:</span>
                <span className="ml-2 text-foreground font-medium">
                  {operation.operation.origin} →{" "}
                  {operation.operation.destination}
                </span>
              </div>
            </div>
          </div>

          {/* Client Selection */}
          <div>
            <Label htmlFor="clientId" className="text-foreground font-medium">
              Cliente
            </Label>
            <select
              id="clientId"
              value={formData.clientId || ""}
              onChange={(e) => handleChange("clientId", e.target.value)}
              className="w-full mt-2 px-4 py-3 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              disabled={loading}
            >
              <option value="">Sin cliente</option>
              {clients.map((client) => (
                <option key={client.value} value={client.value}>
                  {client.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Asignar o cambiar el cliente de esta operación
            </p>
          </div>

          {/* Provider Selection */}
          <div>
            <Label htmlFor="providerId" className="text-foreground font-medium">
              Proveedor
            </Label>
            <select
              id="providerId"
              value={formData.providerId || ""}
              onChange={(e) => handleChange("providerId", e.target.value)}
              className="w-full mt-2 px-4 py-3 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              disabled={loading}
            >
              <option value="">Sin proveedor</option>
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Asignar o cambiar el proveedor de esta operación
            </p>
          </div>

          {/* Route Selection */}
          <div>
            <Label htmlFor="routeId" className="text-foreground font-medium">
              Ruta
            </Label>
            <select
              id="routeId"
              value={formData.routeId || ""}
              onChange={(e) => handleChange("routeId", e.target.value)}
              className="w-full mt-2 px-4 py-3 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              disabled={loading}
            >
              <option value="">Sin ruta predefinida</option>
              {routes.map((route) => (
                <option key={route.value} value={route.value}>
                  {route.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Asignar o cambiar la ruta predefinida de esta operación
            </p>
          </div>

          {/* Vehicle Selection */}
          <div>
            <Label htmlFor="vehicleId" className="text-foreground font-medium">
              Vehículo / Maquinaria <span className="text-red-500">*</span>
            </Label>
            <select
              id="vehicleId"
              value={formData.vehicleId || ""}
              onChange={(e) => handleChange("vehicleId", e.target.value)}
              className="w-full mt-2 px-4 py-3 bg-ui-surface-elevated border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              disabled={loading}
              required
            >
              <option value="">Seleccionar vehículo</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.value} value={vehicle.value}>
                  {vehicle.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Asignar o cambiar el vehículo de esta operación
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !formData.vehicleId}>
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
