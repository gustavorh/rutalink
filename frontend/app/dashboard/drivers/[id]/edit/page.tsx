"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import { createDriver, updateDriver, getDriverById } from "@/lib/api";
import type { CreateDriverInput, UpdateDriverInput } from "@/types/drivers";
import { LICENSE_TYPES } from "@/types/drivers";
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
import { ArrowLeft, Save } from "lucide-react";

export default function DriverFormPage() {
  const router = useRouter();
  const params = useParams();
  const isEdit = !!params.id;
  const driverId = isEdit ? Number(params.id) : null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateDriverInput>({
    operatorId: 0,
    rut: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    licenseType: "B",
    licenseNumber: "",
    licenseExpirationDate: "",
    dateOfBirth: "",
    address: "",
    city: "",
    region: "",
    status: true,
    isExternal: false,
    externalCompany: "",
    notes: "",
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    const user = getUser();
    if (user) {
      setFormData((prev) => ({ ...prev, operatorId: user.operatorId }));
    }

    if (isEdit && driverId) {
      fetchDriver();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId, isEdit]);

  const fetchDriver = async () => {
    if (!driverId) return;

    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const driver = await getDriverById(token, driverId);
      
      // Format dates for input fields
      const formatDateForInput = (dateString?: string) => {
        if (!dateString) return "";
        return new Date(dateString).toISOString().split("T")[0];
      };

      setFormData({
        operatorId: driver.operatorId,
        rut: driver.rut,
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email || "",
        phone: driver.phone || "",
        emergencyContactName: driver.emergencyContactName || "",
        emergencyContactPhone: driver.emergencyContactPhone || "",
        licenseType: driver.licenseType,
        licenseNumber: driver.licenseNumber,
        licenseExpirationDate: formatDateForInput(driver.licenseExpirationDate),
        dateOfBirth: formatDateForInput(driver.dateOfBirth),
        address: driver.address || "",
        city: driver.city || "",
        region: driver.region || "",
        status: driver.status,
        isExternal: driver.isExternal,
        externalCompany: driver.externalCompany || "",
        notes: driver.notes || "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar datos del chofer"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof CreateDriverInput,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // Validate required fields
      if (!formData.rut || !formData.firstName || !formData.lastName) {
        setError("Por favor, complete todos los campos requeridos");
        return;
      }

      if (!formData.licenseNumber || !formData.licenseExpirationDate) {
        setError("La información de licencia es requerida");
        return;
      }

      if (isEdit && driverId) {
        const updateData: UpdateDriverInput = { ...formData };
        // Remove fields that shouldn't be updated
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { operatorId, rut, ...cleanData } = updateData as CreateDriverInput;
        await updateDriver(token, driverId, cleanData);
      } else {
        await createDriver(token, formData);
      }

      router.push("/dashboard/drivers");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Error al ${isEdit ? "actualizar" : "crear"} el chofer`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/dashboard/drivers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEdit ? "Editar Chofer" : "Nuevo Chofer"}
            </h1>
            <p className="text-slate-600 mt-1">
              {isEdit
                ? "Actualiza la información del chofer"
                : "Registra un nuevo chofer en el sistema"}
            </p>
          </div>
        </div>

        {error && (
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Datos básicos del chofer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rut">RUT *</Label>
                  <Input
                    id="rut"
                    value={formData.rut}
                    onChange={(e) => handleChange("rut", e.target.value)}
                    placeholder="12.345.678-9"
                    required
                    disabled={isEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Región</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => handleChange("region", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* License Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Licencia</CardTitle>
              <CardDescription>
                Datos de la licencia de conducir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseType">Tipo de Licencia *</Label>
                  <Select
                    value={formData.licenseType}
                    onValueChange={(value) => handleChange("licenseType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Número de Licencia *</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      handleChange("licenseNumber", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseExpirationDate">
                    Fecha de Vencimiento *
                  </Label>
                  <Input
                    id="licenseExpirationDate"
                    type="date"
                    value={formData.licenseExpirationDate}
                    onChange={(e) =>
                      handleChange("licenseExpirationDate", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto de Emergencia</CardTitle>
              <CardDescription>
                Información del contacto en caso de emergencia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Nombre</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={(e) =>
                      handleChange("emergencyContactName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Teléfono</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={(e) =>
                      handleChange("emergencyContactPhone", e.target.value)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
              <CardDescription>
                Estado y clasificación del chofer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status ? "active" : "inactive"}
                    onValueChange={(value) =>
                      handleChange("status", value === "active")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isExternal">Tipo de Chofer</Label>
                  <Select
                    value={formData.isExternal ? "external" : "internal"}
                    onValueChange={(value) =>
                      handleChange("isExternal", value === "external")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Interno</SelectItem>
                      <SelectItem value="external">Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.isExternal && (
                <div className="space-y-2">
                  <Label htmlFor="externalCompany">Empresa Externa</Label>
                  <Input
                    id="externalCompany"
                    value={formData.externalCompany}
                    onChange={(e) =>
                      handleChange("externalCompany", e.target.value)
                    }
                    placeholder="Nombre de la empresa"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  placeholder="Información adicional sobre el chofer"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/drivers")}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading
                ? "Guardando..."
                : isEdit
                ? "Actualizar Chofer"
                : "Crear Chofer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
