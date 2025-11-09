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
      <div className="min-h-screen flex items-center justify-center bg-ui-surface-elevated">
        <p className="text-foreground">Cargando...</p>
      </div>
    );
  }

  const user = getUser();
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-ui-surface-elevated">
        <DashboardSidebar
          currentPath="/dashboard/drivers"
          onNavigate={(path) => router.push(path)}
        />
        <div className="flex-1 flex flex-col">
          <DashboardHeader user={user} onLogout={handleLogout} />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-foreground">
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
      <div className="flex min-h-screen bg-ui-surface-elevated">
        <DashboardSidebar
          currentPath="/dashboard/drivers"
          onNavigate={(path) => router.push(path)}
        />
        <div className="flex-1 flex flex-col">
          <DashboardHeader user={user} onLogout={handleLogout} />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive">{error || "Chofer no encontrado"}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ui-surface-elevated">
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
                  className="border-border text-foreground hover:bg-card"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <User className="w-6 h-6 text-secondary" />
                    {driver.firstName} {driver.lastName}
                  </h1>
                  <p className="text-muted-foreground mt-1">RUT: {driver.rut}</p>
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
                    ? "bg-success/10 text-success border-success/50"
                    : "border-slate-500/50 text-muted-foreground"
                }
              >
                {driver.status ? "Activo" : "Inactivo"}
              </Badge>
              <Badge
                variant="outline"
                className={
                  driver.isExternal
                    ? "border-orange-500/50 text-orange-400"
                    : "border-primary/50 text-primary"
                }
              >
                {driver.isExternal ? "Externo" : "Interno"}
              </Badge>
              {isExpired(driver.licenseExpirationDate) && (
                <Badge
                  variant="outline"
                  className="border-destructive/50 text-destructive"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Licencia Vencida
                </Badge>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
              <Button
                variant={activeTab === "info" ? "default" : "ghost"}
                onClick={() => setActiveTab("info")}
                className={
                  activeTab === "info"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "text-foreground hover:bg-card"
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
                    : "text-foreground hover:bg-card"
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
                    : "text-foreground hover:bg-card"
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
                    : "text-foreground hover:bg-card"
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
                    : "text-foreground hover:bg-card"
                }
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Estadísticas
              </Button>
            </div>

            {/* Tab Content: Information */}
            {activeTab === "info" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Información Personal
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Nombre Completo
                      </p>
                      <p className="text-lg text-foreground">
                        {driver.firstName} {driver.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">RUT</p>
                      <p className="text-lg text-foreground">{driver.rut}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Email
                      </p>
                      <p className="text-lg text-foreground">
                        {driver.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Teléfono
                      </p>
                      <p className="text-lg text-foreground">
                        {driver.phone || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Fecha de Nacimiento
                      </p>
                      <p className="text-lg text-foreground">
                        {formatDate(driver.dateOfBirth)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Dirección
                      </p>
                      <p className="text-lg text-foreground">
                        {driver.address || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Ciudad
                      </p>
                      <p className="text-lg text-foreground">
                        {driver.city || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Región
                      </p>
                      <p className="text-lg text-foreground">
                        {driver.region || "N/A"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Información de Licencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Tipo de Licencia
                      </p>
                      <div className="text-lg">
                        <Badge
                          variant="outline"
                          className="border-secondary/50 text-secondary"
                        >
                          {driver.licenseType}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Número de Licencia
                      </p>
                      <p className="text-lg text-foreground">
                        {driver.licenseNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Fecha de Vencimiento
                      </p>
                      <div className="flex items-center gap-2">
                        {isExpired(driver.licenseExpirationDate) ? (
                          <>
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                            <span className="text-lg text-destructive">
                              {formatDate(driver.licenseExpirationDate)} -
                              Vencida
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span className="text-lg text-success">
                              {formatDate(driver.licenseExpirationDate)} -
                              Vigente
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Contacto de Emergencia
                      </p>
                      <p className="text-lg text-foreground">
                        {driver.emergencyContactName || "N/A"}
                      </p>
                      {driver.emergencyContactPhone && (
                        <p className="text-sm text-muted-foreground">
                          {driver.emergencyContactPhone}
                        </p>
                      )}
                    </div>
                    {driver.isExternal && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Empresa Externa
                        </p>
                        <p className="text-lg text-foreground">
                          {driver.externalCompany || "N/A"}
                        </p>
                      </div>
                    )}
                    {driver.notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Notas
                        </p>
                        <p className="text-sm text-foreground">{driver.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab Content: Documents */}
            {activeTab === "documents" && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Documentos</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Documentación asociada al chofer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay documentos registrados
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Tipo</TableHead>
                          <TableHead className="text-muted-foreground">
                            Nombre
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Fecha de Emisión
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Fecha de Vencimiento
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Estado
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow
                            key={doc.id}
                            className="border-b border-border hover:bg-ui-surface-elevated"
                          >
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-primary/50 text-primary"
                              >
                                {getDocumentTypeLabel(doc.documentType)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-foreground">
                              {doc.documentName}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(doc.issueDate)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(doc.expirationDate)}
                            </TableCell>
                            <TableCell>
                              {doc.expirationDate &&
                              isExpired(doc.expirationDate) ? (
                                <Badge
                                  variant="outline"
                                  className="border-destructive/50 text-destructive"
                                >
                                  Vencido
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-success/50 text-success"
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
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Asignaciones de Vehículos
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Historial de vehículos asignados al chofer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {assignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay asignaciones registradas
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground">
                            Vehículo
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Patente
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Fecha de Asignación
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Fecha de Desasignación
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Estado
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((assignment) => (
                          <TableRow
                            key={assignment.assignment.id}
                            className="border-b border-border hover:bg-ui-surface-elevated"
                          >
                            <TableCell className="text-foreground">
                              {assignment.vehicle.brand}{" "}
                              {assignment.vehicle.model}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {assignment.vehicle.plateNumber}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDateTime(assignment.assignment.assignedAt)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDateTime(
                                assignment.assignment.unassignedAt
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  assignment.assignment.isActive
                                    ? "border-success/50 text-success"
                                    : "border-slate-500/50 text-muted-foreground"
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
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Historial de Operaciones
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Últimas operaciones realizadas por el chofer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {operations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay operaciones registradas
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground">
                            N° Operación
                          </TableHead>
                          <TableHead className="text-muted-foreground">Tipo</TableHead>
                          <TableHead className="text-muted-foreground">
                            Origen
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Destino
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Fecha Programada
                          </TableHead>
                          <TableHead className="text-muted-foreground">
                            Estado
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {operations.map((op) => (
                          <TableRow
                            key={op.operation.id}
                            className="border-b border-border hover:bg-ui-surface-elevated"
                          >
                            <TableCell className="font-medium text-foreground">
                              {op.operation.operationNumber}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="border-secondary/50 text-secondary"
                              >
                                {op.operation.operationType}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-foreground">
                              {op.operation.origin}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-foreground">
                              {op.operation.destination}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
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
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Total de Operaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-foreground">
                      {statistics.totalOperations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Operaciones Completadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-success">
                      {statistics.completedOperations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Operaciones en Progreso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-warning">
                      {statistics.inProgressOperations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Operaciones Programadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-primary">
                      {statistics.scheduledOperations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Operaciones Canceladas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-destructive">
                      {statistics.cancelledOperations}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">
                      Distancia Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-4xl font-bold text-foreground">
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
