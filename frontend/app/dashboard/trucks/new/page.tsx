"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import { createTruck } from "@/lib/api";
import type { CreateTruckInput } from "@/types/trucks";
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

export default function NewTruckPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateTruckInput>({
    plateNumber: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    vehicleType: VehicleType.TRUCK,
    capacity: undefined,
    capacityUnit: CapacityUnit.TONS,
    vin: "",
    color: "",
    status: true,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      await createTruck(token, formData);
      router.push("/dashboard/trucks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear camión");
    } finally {
      setLoading(false);
    }
  };

  const user = getUser();
  if (!user) {
    return null;
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[900px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/trucks")}
            className="border-slate-600 text-slate-300 hover:bg-[#23262f]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <TruckIcon className="w-6 h-6 text-blue-400" />
              Nuevo Camión
            </h1>
            <p className="text-slate-400 mt-1">
              Registra un nuevo camión en la flota
            </p>
          </div>
        </div>

        {error && (
          <Card className="bg-red-500/10 border-red-500/50">
            <CardContent className="p-4">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="bg-[#23262f] border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">
                Información del Camión
              </CardTitle>
              <CardDescription className="text-slate-400">
                Completa los datos del nuevo camión
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="plateNumber" className="text-slate-300">
                    Patente <span className="text-red-400">*</span>
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
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleType" className="text-slate-300">
                    Tipo de Vehículo <span className="text-red-400">*</span>
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
                    <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300">
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
                  <Label htmlFor="brand" className="text-slate-300">
                    Marca
                  </Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    placeholder="Mercedes-Benz, Volvo, etc."
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model" className="text-slate-300">
                    Modelo
                  </Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    placeholder="Actros, FH16, etc."
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year" className="text-slate-300">
                    Año
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value) || undefined,
                      })
                    }
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color" className="text-slate-300">
                    Color
                  </Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="Blanco, Rojo, etc."
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity" className="text-slate-300">
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
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacityUnit" className="text-slate-300">
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
                    <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300">
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
                  <Label htmlFor="vin" className="text-slate-300">
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
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes" className="text-slate-300">
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
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/trucks")}
                  disabled={loading}
                  className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.plateNumber}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>Guardando...</>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Camión
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </main>
  );
}
