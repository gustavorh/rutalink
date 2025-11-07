"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, isAuthenticated } from "@/lib/auth";
import {
  getDriverById,
  getDriverDocuments,
  getDriverVehicleAssignments,
  getDriverOperations,
  getDriverStatistics,
} from "@/lib/api";
import type {
  Driver,
  DriverDocument,
  DriverVehicleAssignmentWithVehicle,
  OperationWithDetails,
  DriverStatistics as Stats,
} from "@/types/drivers";
import { DOCUMENT_TYPES, OPERATION_STATUSES } from "@/types/drivers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  FileText,
  Truck,
  ClipboardList,
  BarChart3,
} from "lucide-react";

export default function DriverDetailPage() {
  const router = useRouter();
  const params = useParams();
  const driverId = Number(params.id);

  const [driver, setDriver] = useState<Driver | null>(null);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [assignments, setAssignments] = useState<
    DriverVehicleAssignmentWithVehicle[]
  >([]);
  const [operations, setOperations] = useState<OperationWithDetails[]>([]);
  const [statistics, setStatistics] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "info" | "documents" | "assignments" | "operations" | "statistics"
  >("info");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchDriverData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId]);

  const fetchDriverData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const [
        driverData,
        documentsData,
        assignmentsData,
        operationsData,
        statisticsData,
      ] = await Promise.all([
        getDriverById(token, driverId),
        getDriverDocuments(token, driverId),
        getDriverVehicleAssignments(token, driverId),
        getDriverOperations(token, driverId, { limit: 10 }),
        getDriverStatistics(token, driverId),
      ]);

      setDriver(driverData);
      setDocuments(documentsData);
      setAssignments(assignmentsData);
      setOperations(operationsData.data);
      setStatistics(statisticsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar datos del chofer"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL");
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("es-CL");
  };

  const isExpired = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getOperationStatusBadge = (status: string) => {
    const statusConfig = OPERATION_STATUSES.find((s) => s.value === status);
    if (!statusConfig) return <Badge>{status}</Badge>;

    const variantMap: Record<
      string,
      "default" | "warning" | "success" | "destructive"
    > = {
      blue: "default",
      yellow: "warning",
      green: "success",
      red: "destructive",
    };

    return (
      <Badge variant={variantMap[statusConfig.color] || "default"}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (!isAuthenticated()) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Cargando...</div>
        </div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-red-600">
            {error || "Chofer no encontrado"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
                {driver.firstName} {driver.lastName}
              </h1>
              <p className="text-slate-600 mt-1">RUT: {driver.rut}</p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/dashboard/drivers/${driverId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2">
          <Badge variant={driver.status ? "success" : "secondary"}>
            {driver.status ? "Activo" : "Inactivo"}
          </Badge>
          <Badge variant={driver.isExternal ? "warning" : "info"}>
            {driver.isExternal ? "Externo" : "Interno"}
          </Badge>
          {isExpired(driver.licenseExpirationDate) && (
            <Badge variant="destructive">Licencia Vencida</Badge>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === "info" ? "default" : "ghost"}
            onClick={() => setActiveTab("info")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Información
          </Button>
          <Button
            variant={activeTab === "documents" ? "default" : "ghost"}
            onClick={() => setActiveTab("documents")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Documentos ({documents.length})
          </Button>
          <Button
            variant={activeTab === "assignments" ? "default" : "ghost"}
            onClick={() => setActiveTab("assignments")}
          >
            <Truck className="mr-2 h-4 w-4" />
            Asignaciones ({assignments.length})
          </Button>
          <Button
            variant={activeTab === "operations" ? "default" : "ghost"}
            onClick={() => setActiveTab("operations")}
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Operaciones ({operations.length})
          </Button>
          <Button
            variant={activeTab === "statistics" ? "default" : "ghost"}
            onClick={() => setActiveTab("statistics")}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Estadísticas
          </Button>
        </div>

        {/* Tab Content: Information */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Nombre Completo
                  </p>
                  <p className="text-lg">
                    {driver.firstName} {driver.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">RUT</p>
                  <p className="text-lg">{driver.rut}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Email</p>
                  <p className="text-lg">{driver.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Teléfono</p>
                  <p className="text-lg">{driver.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Fecha de Nacimiento
                  </p>
                  <p className="text-lg">{formatDate(driver.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Dirección
                  </p>
                  <p className="text-lg">{driver.address || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Ciudad</p>
                  <p className="text-lg">{driver.city || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Región</p>
                  <p className="text-lg">{driver.region || "N/A"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información de Licencia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Tipo de Licencia
                  </p>
                  <p className="text-lg">
                    <Badge variant="outline">{driver.licenseType}</Badge>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Número de Licencia
                  </p>
                  <p className="text-lg">{driver.licenseNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Fecha de Vencimiento
                  </p>
                  <p className="text-lg">
                    {formatDate(driver.licenseExpirationDate)}
                    {isExpired(driver.licenseExpirationDate) && (
                      <Badge variant="destructive" className="ml-2">
                        Vencida
                      </Badge>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Contacto de Emergencia
                  </p>
                  <p className="text-lg">
                    {driver.emergencyContactName || "N/A"}
                  </p>
                  {driver.emergencyContactPhone && (
                    <p className="text-sm text-slate-600">
                      {driver.emergencyContactPhone}
                    </p>
                  )}
                </div>
                {driver.isExternal && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Empresa Externa
                    </p>
                    <p className="text-lg">{driver.externalCompany || "N/A"}</p>
                  </div>
                )}
                {driver.notes && (
                  <div>
                    <p className="text-sm font-medium text-slate-500">Notas</p>
                    <p className="text-sm text-slate-600">{driver.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Content: Documents */}
        {activeTab === "documents" && (
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>
                Documentación asociada al chofer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No hay documentos registrados
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Fecha de Emisión</TableHead>
                      <TableHead>Fecha de Vencimiento</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {getDocumentTypeLabel(doc.documentType)}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.documentName}</TableCell>
                        <TableCell>{formatDate(doc.issueDate)}</TableCell>
                        <TableCell>{formatDate(doc.expirationDate)}</TableCell>
                        <TableCell>
                          {doc.expirationDate &&
                          isExpired(doc.expirationDate) ? (
                            <Badge variant="destructive">Vencido</Badge>
                          ) : (
                            <Badge variant="success">Vigente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab Content: Assignments */}
        {activeTab === "assignments" && (
          <Card>
            <CardHeader>
              <CardTitle>Asignaciones de Vehículos</CardTitle>
              <CardDescription>
                Historial de vehículos asignados al chofer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No hay asignaciones registradas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehículo</TableHead>
                      <TableHead>Patente</TableHead>
                      <TableHead>Fecha de Asignación</TableHead>
                      <TableHead>Fecha de Desasignación</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.assignment.id}>
                        <TableCell>
                          {assignment.vehicle.brand} {assignment.vehicle.model}
                        </TableCell>
                        <TableCell className="font-medium">
                          {assignment.vehicle.plateNumber}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(assignment.assignment.assignedAt)}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(assignment.assignment.unassignedAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignment.assignment.isActive
                                ? "success"
                                : "secondary"
                            }
                          >
                            {assignment.assignment.isActive
                              ? "Activa"
                              : "Finalizada"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab Content: Operations */}
        {activeTab === "operations" && (
          <Card>
            <CardHeader>
              <CardTitle>Historial de Operaciones</CardTitle>
              <CardDescription>
                Últimas operaciones realizadas por el chofer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {operations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No hay operaciones registradas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Operación</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Fecha Programada</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.map((op) => (
                      <TableRow key={op.operation.id}>
                        <TableCell className="font-medium">
                          {op.operation.operationNumber}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {op.operation.operationType}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {op.operation.origin}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {op.operation.destination}
                        </TableCell>
                        <TableCell>
                          {formatDateTime(op.operation.scheduledStartDate)}
                        </TableCell>
                        <TableCell>
                          {getOperationStatusBadge(op.operation.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab Content: Statistics */}
        {activeTab === "statistics" && statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total de Operaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">
                  {statistics.totalOperations}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operaciones Completadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">
                  {statistics.completedOperations}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operaciones en Progreso</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-yellow-600">
                  {statistics.inProgressOperations}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operaciones Programadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-blue-600">
                  {statistics.scheduledOperations}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operaciones Canceladas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-red-600">
                  {statistics.cancelledOperations}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distancia Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold">
                  {statistics.totalDistance?.toLocaleString() || 0} km
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
