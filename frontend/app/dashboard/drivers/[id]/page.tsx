"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, isAuthenticated, getUser, logout } from "@/lib/auth";
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
  User,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { DashboardSidebar, DashboardHeader } from "@/components/dashboard";

export default function DriverDetailPage() {
  const router = useRouter();
  const params = useParams();
  const driverId = Number(params.id);

  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
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

  const handleLogout = () => {
    logout();
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#2a2d3a]">
        <p className="text-slate-300">Cargando...</p>
      </div>
    );
  }

  const user = getUser();
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#2a2d3a]">
        <DashboardSidebar
          currentPath="/dashboard/drivers"
          onNavigate={(path) => router.push(path)}
        />
        <div className="flex-1 flex flex-col">
          <DashboardHeader user={user} onLogout={handleLogout} />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-slate-300">
                Cargando información del chofer...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="flex min-h-screen bg-[#2a2d3a]">
        <DashboardSidebar
          currentPath="/dashboard/drivers"
          onNavigate={(path) => router.push(path)}
        />
        <div className="flex-1 flex flex-col">
          <DashboardHeader user={user} onLogout={handleLogout} />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400">{error || "Chofer no encontrado"}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#2a2d3a]">
      {/* Sidebar */}
      <DashboardSidebar
        currentPath="/dashboard/drivers"
        onNavigate={(path) => router.push(path)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <DashboardHeader user={user} onLogout={handleLogout} />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1400px] mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => router.push("/dashboard/drivers")}
                  className="border-slate-600 text-slate-300 hover:bg-[#23262f]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                    <User className="w-6 h-6 text-purple-400" />
                    {driver.firstName} {driver.lastName}
                  </h1>
                  <p className="text-slate-400 mt-1">RUT: {driver.rut}</p>
                </div>
              </div>
              <Button
                onClick={() =>
                  router.push(`/dashboard/drivers/${driverId}/edit`)
                }
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>

            {/* Status Badges */}
            <div className="flex gap-2">
              <Badge
                variant={driver.status ? "default" : "outline"}
                className={
                  driver.status
                    ? "bg-green-500/10 text-green-400 border-green-500/50"
                    : "border-slate-500/50 text-slate-500"
                }
              >
                {driver.status ? "Activo" : "Inactivo"}
              </Badge>
              <Badge
                variant="outline"
                className={
                  driver.isExternal
                    ? "border-orange-500/50 text-orange-400"
                    : "border-blue-500/50 text-blue-400"
                }
              >
                {driver.isExternal ? "Externo" : "Interno"}
              </Badge>
              {isExpired(driver.licenseExpirationDate) && (
                <Badge
                  variant="outline"
                  className="border-red-500/50 text-red-400"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Licencia Vencida
                </Badge>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700">
              <Button
                variant={activeTab === "info" ? "default" : "ghost"}
                onClick={() => setActiveTab("info")}
                className={
                  activeTab === "info"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "text-slate-300 hover:bg-[#23262f]"
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                Información
              </Button>
              <Button
                variant={activeTab === "documents" ? "default" : "ghost"}
                onClick={() => setActiveTab("documents")}
                className={
                  activeTab === "documents"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "text-slate-300 hover:bg-[#23262f]"
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                Documentos ({documents.length})
              </Button>
              <Button
                variant={activeTab === "assignments" ? "default" : "ghost"}
                onClick={() => setActiveTab("assignments")}
                className={
                  activeTab === "assignments"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "text-slate-300 hover:bg-[#23262f]"
                }
              >
                <Truck className="mr-2 h-4 w-4" />
                Asignaciones ({assignments.length})
              </Button>
              <Button
                variant={activeTab === "operations" ? "default" : "ghost"}
                onClick={() => setActiveTab("operations")}
                className={
                  activeTab === "operations"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "text-slate-300 hover:bg-[#23262f]"
                }
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Operaciones ({operations.length})
              </Button>
              <Button
                variant={activeTab === "statistics" ? "default" : "ghost"}
                onClick={() => setActiveTab("statistics")}
                className={
                  activeTab === "statistics"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "text-slate-300 hover:bg-[#23262f]"
                }
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Estadísticas
              </Button>
            </div>

            {/* Tab Content: Information */}
            {activeTab === "info" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[#23262f] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100">
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Nombre Completo
                      </p>
                      <p className="text-lg text-slate-200">
                        {driver.firstName} {driver.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">RUT</p>
                      <p className="text-lg text-slate-200">{driver.rut}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Email
                      </p>
                      <p className="text-lg text-slate-200">
                        {driver.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Teléfono
                      </p>
                      <p className="text-lg text-slate-200">
                        {driver.phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Fecha de Nacimiento
                      </p>
                      <p className="text-lg text-slate-200">
                        {formatDate(driver.dateOfBirth)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Dirección
                      </p>
                      <p className="text-lg text-slate-200">
                        {driver.address || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Ciudad
                      </p>
                      <p className="text-lg text-slate-200">
                        {driver.city || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Región
                      </p>
                      <p className="text-lg text-slate-200">
                        {driver.region || "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#23262f] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100">
                      Información de Licencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Tipo de Licencia
                      </p>
                      <div className="text-lg">
                        <Badge
                          variant="outline"
                          className="border-purple-500/50 text-purple-400"
                        >
                          {driver.licenseType}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Número de Licencia
                      </p>
                      <p className="text-lg text-slate-200">
                        {driver.licenseNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Fecha de Vencimiento
                      </p>
                      <div className="flex items-center gap-2">
                        {isExpired(driver.licenseExpirationDate) ? (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-lg text-red-400">
                              {formatDate(driver.licenseExpirationDate)} -
                              Vencida
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-lg text-green-400">
                              {formatDate(driver.licenseExpirationDate)} -
                              Vigente
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-400">
                        Contacto de Emergencia
                      </p>
                      <p className="text-lg text-slate-200">
                        {driver.emergencyContactName || "N/A"}
                      </p>
                      {driver.emergencyContactPhone && (
                        <p className="text-sm text-slate-400">
                          {driver.emergencyContactPhone}
                        </p>
                      )}
                    </div>
                    {driver.isExternal && (
                      <div>
                        <p className="text-sm font-medium text-slate-400">
                          Empresa Externa
                        </p>
                        <p className="text-lg text-slate-200">
                          {driver.externalCompany || "N/A"}
                        </p>
                      </div>
                    )}
                    {driver.notes && (
                      <div>
                        <p className="text-sm font-medium text-slate-400">
                          Notas
                        </p>
                        <p className="text-sm text-slate-300">{driver.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab Content: Documents */}
            {activeTab === "documents" && (
              <Card className="bg-[#23262f] border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">Documentos</CardTitle>
                  <CardDescription className="text-slate-400">
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
                        <TableRow className="border-b border-slate-700 hover:bg-transparent">
                          <TableHead className="text-slate-400">Tipo</TableHead>
                          <TableHead className="text-slate-400">
                            Nombre
                          </TableHead>
                          <TableHead className="text-slate-400">
                            Fecha de Emisión
                          </TableHead>
                          <TableHead className="text-slate-400">
                            Fecha de Vencimiento
                          </TableHead>
                          <TableHead className="text-slate-400">
                            Estado
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow
                            key={doc.id}
                            className="border-b border-slate-700 hover:bg-[#2a2d3a]"
                          >
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-blue-500/50 text-blue-400"
                              >
                                {getDocumentTypeLabel(doc.documentType)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-300">
                              {doc.documentName}
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {formatDate(doc.issueDate)}
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {formatDate(doc.expirationDate)}
                            </TableCell>
                            <TableCell>
                              {doc.expirationDate &&
                              isExpired(doc.expirationDate) ? (
                                <Badge
                                  variant="outline"
                                  className="border-red-500/50 text-red-400"
                                >
                                  Vencido
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-green-500/50 text-green-400"
                                >
                                  Vigente
                                </Badge>
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
              <Card className="bg-[#23262f] border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">
                    Asignaciones de Vehículos
                  </CardTitle>
                  <CardDescription className="text-slate-400">
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
                        <TableRow className="border-b border-slate-700 hover:bg-transparent">
                          <TableHead className="text-slate-400">
                            Vehículo
                          </TableHead>
                          <TableHead className="text-slate-400">
                            Patente
                          </TableHead>
                          <TableHead className="text-slate-400">
                            Fecha de Asignación
                          </TableHead>
                          <TableHead className="text-slate-400">
                            Fecha de Desasignación
                          </TableHead>
                          <TableHead className="text-slate-400">
                            Estado
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((assignment) => (
                          <TableRow
                            key={assignment.assignment.id}
                            className="border-b border-slate-700 hover:bg-[#2a2d3a]"
                          >
                            <TableCell className="text-slate-300">
                              {assignment.vehicle.brand}{" "}
                              {assignment.vehicle.model}
                            </TableCell>
                            <TableCell className="font-medium text-slate-200">
                              {assignment.vehicle.plateNumber}
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {formatDateTime(assignment.assignment.assignedAt)}
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {formatDateTime(
                                assignment.assignment.unassignedAt
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  assignment.assignment.isActive
                                    ? "border-green-500/50 text-green-400"
                                    : "border-slate-500/50 text-slate-400"
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
              <Card className="bg-[#23262f] border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">
                    Historial de Operaciones
                  </CardTitle>
                  <CardDescription className="text-slate-400">
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
                        <TableRow className="border-b border-slate-700 hover:bg-transparent">
                          <TableHead className="text-slate-400">
                            N° Operación
                          </TableHead>
                          <TableHead className="text-slate-400">Tipo</TableHead>
                          <TableHead className="text-slate-400">
                            Origen
                          </TableHead>
                          <TableHead className="text-slate-400">
                            Destino
                          </TableHead>
                          <TableHead className="text-slate-400">
                            Fecha Programada
                          </TableHead>
                          <TableHead className="text-slate-400">
                            Estado
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {operations.map((op) => (
                          <TableRow
                            key={op.operation.id}
                            className="border-b border-slate-700 hover:bg-[#2a2d3a]"
                          >
                            <TableCell className="font-medium text-slate-200">
                              {op.operation.operationNumber}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-purple-500/50 text-purple-400"
                              >
                                {op.operation.operationType}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-slate-300">
                              {op.operation.origin}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-slate-300">
                              {op.operation.destination}
                            </TableCell>
                            <TableCell className="text-slate-400">
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
            {/* Tab Content: Statistics */}
            {activeTab === "statistics" && statistics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-[#23262f] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100">
                      Total de Operaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-slate-100">
                      {statistics.totalOperations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#23262f] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100">
                      Operaciones Completadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-green-400">
                      {statistics.completedOperations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#23262f] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100">
                      Operaciones en Progreso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-yellow-400">
                      {statistics.inProgressOperations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#23262f] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100">
                      Operaciones Programadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-blue-400">
                      {statistics.scheduledOperations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#23262f] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100">
                      Operaciones Canceladas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-red-400">
                      {statistics.cancelledOperations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-[#23262f] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100">
                      Distancia Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-slate-100">
                      {statistics.totalDistance?.toLocaleString() || 0} km
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
