"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { isAuthenticated, getUser, logout } from "@/lib/auth";
import { api } from "@/lib/client-api";
import type { Truck } from "@/types/trucks";
import type { UpdateVehicleDto } from "@/lib/api-types";
import {
  VEHICLE_TYPES,
  CAPACITY_UNITS,
  VehicleType,
  CapacityUnit,
} from "@/types/trucks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, TruckIcon } from "lucide-react";
import { DashboardSidebar, DashboardHeader } from "@/components/dashboard";

export default function EditTruckPage() {
  const router = useRouter();
  const params = useParams();
  const truckId = params?.id ? parseInt(params.id as string) : null;

  const [truck, setTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateVehicleDto>({
    plateNumber: "",
    brand: "",
    model: "",
    year: undefined,
    vehicleType: VehicleType.TRUCK,
    capacity: undefined,
    capacityUnit: CapacityUnit.TONS,
    vin: "",
    color: "",
    status: true,
    notes: "",
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    if (truckId) {
      fetchTruck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [truckId]);

  const fetchTruck = async () => {
    if (!truckId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await api.vehicles.get(truckId);
      setTruck(data);
      setFormData({
        plateNumber: data.plateNumber,
        brand: data.brand,
        model: data.model,
        year: data.year,
        vehicleType: data.vehicleType,
        capacity: data.capacity,
        capacityUnit: data.capacityUnit,
        vin: data.vin,
        color: data.color,
        status: data.status,
        notes: data.notes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar camión");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckId) return;

    try {
      setSaving(true);
      setError(null);

      await api.vehicles.update(truckId, formData);
      router.push(`/dashboard/trucks/${truckId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar camión"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ui-surface-elevated">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-foreground mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  const user = getUser();
  if (!user || !truck) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-ui-surface-elevated">
      <DashboardSidebar
        currentPath="/dashboard/trucks"
        onNavigate={(path) => router.push(path)}
      />

      <div className="flex-1 flex flex-col">
        <DashboardHeader user={user} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[900px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/trucks/${truckId}`)}
                className="border-border text-foreground hover:bg-card"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <TruckIcon className="w-6 h-6 text-primary" />
                  Editar Camión: {truck.plateNumber}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Actualiza la información del camión
                </p>
              </div>
            </div>

            {error && (
              <Card className="bg-destructive/10 border-destructive/50">
                <CardContent className="p-4">
                  <p className="text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Información del Camión
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Modifica los datos del camión
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="plateNumber" className="text-foreground">
                        Patente <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="plateNumber"
                        value={formData.plateNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            plateNumber: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="AB-1234"
                        required
                        className="bg-ui-surface-elevated border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vehicleType" className="text-foreground">
                        Tipo de Vehículo{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.vehicleType}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            vehicleType: value as VehicleType,
                          })
                        }
                      >
                        <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand" className="text-foreground">
                        Marca
                      </Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) =>
                          setFormData({ ...formData, brand: e.target.value })
                        }
                        placeholder="Mercedes-Benz, Volvo, etc."
                        className="bg-ui-surface-elevated border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model" className="text-foreground">
                        Modelo
                      </Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) =>
                          setFormData({ ...formData, model: e.target.value })
                        }
                        placeholder="Actros, FH16, etc."
                        className="bg-ui-surface-elevated border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-foreground">
                        Año
                      </Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            year: parseInt(e.target.value) || undefined,
                          })
                        }
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        className="bg-ui-surface-elevated border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color" className="text-foreground">
                        Color
                      </Label>
                      <Input
                        id="color"
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        placeholder="Blanco, Rojo, etc."
                        className="bg-ui-surface-elevated border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capacity" className="text-foreground">
                        Capacidad
                      </Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            capacity: parseInt(e.target.value) || undefined,
                          })
                        }
                        min="0"
                        placeholder="20"
                        className="bg-ui-surface-elevated border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capacityUnit" className="text-foreground">
                        Unidad de Capacidad
                      </Label>
                      <Select
                        value={formData.capacityUnit}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            capacityUnit: value as CapacityUnit,
                          })
                        }
                      >
                        <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CAPACITY_UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="vin" className="text-foreground">
                        VIN (Número de Identificación)
                      </Label>
                      <Input
                        id="vin"
                        value={formData.vin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            vin: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="1HGBH41JXMN109186"
                        maxLength={50}
                        className="bg-ui-surface-elevated border-border text-foreground"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="notes" className="text-foreground">
                        Notas
                      </Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Información adicional sobre el camión..."
                        rows={4}
                        className="bg-ui-surface-elevated border-border text-foreground"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        router.push(`/dashboard/trucks/${truckId}`)
                      }
                      disabled={saving}
                      className="border-border text-foreground hover:bg-ui-surface-elevated"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving || !formData.plateNumber}
                      className="bg-primary hover:bg-primary-dark text-white"
                    >
                      {saving ? (
                        <>Guardando...</>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
