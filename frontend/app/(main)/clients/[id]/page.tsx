"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken, isAuthenticated } from "@/lib/auth";
import {
  getClientById,
  getClientOperations,
  getClientStatistics,
  deleteClient,
} from "@/lib/api";
import type {
  Client,
  ClientStatistics,
  ClientOperation,
} from "@/types/clients";
import { INDUSTRIES } from "@/types/clients";
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
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Package,
  Edit,
  Trash2,
  Info,
  BarChart3,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TabType = "info" | "stats" | "operations";

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = parseInt(params.id as string);

  const [mounted, setMounted] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [statistics, setStatistics] = useState<ClientStatistics | null>(null);
  const [operations, setOperations] = useState<ClientOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("info");

  // Pagination for operations
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchClientData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, page]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch client details, statistics, and operations in parallel
      const [clientData, statsData, opsData] = await Promise.all([
        getClientById(token, clientId),
        getClientStatistics(token, clientId),
        getClientOperations(token, clientId, { page, limit }),
      ]);

      setClient(clientData);
      setStatistics(statsData);
      setOperations(opsData.data);
      setTotalPages(opsData.pagination.totalPages);
      setTotal(opsData.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar datos del cliente"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!client) return;

    try {
      const token = getToken();
      if (!token) return;

      await deleteClient(token, client.id);
      router.push("/clients");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar cliente"
      );
    }
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getIndustryLabel = (industry?: string | null) => {
    if (!industry) return "N/A";
    const found = INDUSTRIES.find((i) => i.value === industry);
    return found ? found.label : industry;
  };

  const getOperationStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: {
        label: "Programada",
        className: "bg-primary/10 text-primary border-primary/50",
      },
      "in-progress": {
        label: "En Progreso",
        className: "bg-warning/10 text-warning border-yellow-500/50",
      },
      completed: {
        label: "Completada",
        className: "bg-success/10 text-success border-success/50",
      },
      cancelled: {
        label: "Cancelada",
        className: "bg-destructive/10 text-destructive border-destructive/50",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-slate-500/10 text-muted-foreground border-slate-500/50",
    };

    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (!mounted) {
    return (
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-foreground">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.push("/clients")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Clientes
          </Button>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-muted-foreground mt-4">
                Cargando información...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive">{error}</p>
            </div>
          ) : !client ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cliente no encontrado</p>
            </div>
          ) : (
            <>
              {/* Client Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-primary" />
                    {client.businessName}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    RUT: {client.taxId || "N/A"}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge
                      variant={client.status ? "default" : "outline"}
                      className={
                        client.status
                          ? "bg-success/10 text-success border-success/50"
                          : "border-slate-500/50 text-muted-foreground"
                      }
                    >
                      {client.status ? "Activo" : "Inactivo"}
                    </Badge>
                    {client.industry && (
                      <Badge
                        variant="outline"
                        className="border-primary/50 text-primary"
                      >
                        {getIndustryLabel(client.industry)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push(`/clients/${client.id}/edit`)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    onClick={handleDeleteClick}
                    variant="outline"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-border">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors relative ${
                    activeTab === "info"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Info className="w-4 h-4" />
                  Información
                  {activeTab === "info" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("stats")}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors relative ${
                    activeTab === "stats"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Estadísticas
                  {activeTab === "stats" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("operations")}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors relative ${
                    activeTab === "operations"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  Operaciones ({total})
                  {activeTab === "operations" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "info" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Information */}
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          Información de Contacto
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            RUT
                          </p>
                          <p className="text-foreground font-mono">
                            {client.taxId || "N/A"}
                          </p>
                        </div>
                        {client.contactName && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                              Contacto
                            </p>
                            <p className="text-foreground">
                              {client.contactName}
                            </p>
                          </div>
                        )}
                        {client.contactEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <a
                              href={`mailto:${client.contactEmail}`}
                              className="text-primary hover:text-blue-300"
                            >
                              {client.contactEmail}
                            </a>
                          </div>
                        )}
                        {client.contactPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <a
                              href={`tel:${client.contactPhone}`}
                              className="text-primary hover:text-blue-300"
                            >
                              {client.contactPhone}
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Location Information */}
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-success" />
                          Ubicación
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {client.address && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                              Dirección
                            </p>
                            <p className="text-foreground">{client.address}</p>
                          </div>
                        )}
                        {client.city && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                              Ciudad
                            </p>
                            <p className="text-foreground">{client.city}</p>
                          </div>
                        )}
                        {client.region && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                              Región
                            </p>
                            <p className="text-foreground">{client.region}</p>
                          </div>
                        )}
                        {client.country && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                              País
                            </p>
                            <p className="text-foreground">{client.country}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Information */}
                  {(client.observations || client.notes) && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground">
                          Información Adicional
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {client.observations && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                              Observaciones
                            </p>
                            <p className="text-foreground">
                              {client.observations}
                            </p>
                          </div>
                        )}
                        {client.notes && (
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                              Notas Internas
                            </p>
                            <p className="text-foreground">{client.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Statistics Tab */}
              {activeTab === "stats" && statistics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Total Operaciones
                          </p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {statistics.totalOperations}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Completadas
                          </p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {statistics.completedOperations}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            En Progreso
                          </p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {statistics.inProgressOperations}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-warning" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Programadas
                          </p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {statistics.scheduledOperations}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-secondary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">
                            Canceladas
                          </p>
                          <p className="text-2xl font-bold text-foreground mt-1">
                            {statistics.cancelledOperations}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Operations Tab */}
              {activeTab === "operations" && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Historial de Operaciones
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {total > 0
                        ? `Total de ${total} operaciones registradas`
                        : "No hay operaciones registradas"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {operations.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No hay operaciones para este cliente
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-b border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground">
                                  N° Operación
                                </TableHead>
                                <TableHead className="text-muted-foreground">
                                  Tipo
                                </TableHead>
                                <TableHead className="text-muted-foreground">
                                  Origen → Destino
                                </TableHead>
                                <TableHead className="text-muted-foreground">
                                  Fecha Programada
                                </TableHead>
                                <TableHead className="text-muted-foreground">
                                  Chofer
                                </TableHead>
                                <TableHead className="text-muted-foreground">
                                  Vehículo
                                </TableHead>
                                <TableHead className="text-muted-foreground">
                                  Estado
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {operations.map((operation) => (
                                <TableRow
                                  key={operation.id}
                                  className="border-b border-border hover:bg-ui-surface-elevated cursor-pointer"
                                  onClick={() =>
                                    router.push(`/operations/${operation.id}`)
                                  }
                                >
                                  <TableCell className="font-mono text-sm text-foreground">
                                    {operation.operationNumber}
                                  </TableCell>
                                  <TableCell className="text-foreground capitalize">
                                    {operation.operationType}
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div className="text-foreground">
                                        {operation.origin}
                                      </div>
                                      <div className="text-muted-foreground text-xs mt-1">
                                        → {operation.destination}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-foreground text-sm">
                                    {formatDateTime(
                                      operation.scheduledStartDate
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {operation.driver ? (
                                      <div className="text-sm text-foreground">
                                        {operation.driver.firstName}{" "}
                                        {operation.driver.lastName}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">
                                        N/A
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {operation.vehicle ? (
                                      <div className="text-sm">
                                        <div className="text-foreground font-mono">
                                          {operation.vehicle.plateNumber}
                                        </div>
                                        {operation.vehicle.brand &&
                                          operation.vehicle.model && (
                                            <div className="text-muted-foreground text-xs mt-1">
                                              {operation.vehicle.brand}{" "}
                                              {operation.vehicle.model}
                                            </div>
                                          )}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">
                                        N/A
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {getOperationStatusBadge(operation.status)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                              Mostrando {(page - 1) * limit + 1} a{" "}
                              {Math.min(page * limit, total)} de {total}{" "}
                              operaciones
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className="border-border text-foreground hover:bg-ui-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Anterior
                              </Button>
                              {Array.from(
                                { length: totalPages },
                                (_, i) => i + 1
                              )
                                .filter(
                                  (p) =>
                                    p === 1 ||
                                    p === totalPages ||
                                    (p >= page - 1 && p <= page + 1)
                                )
                                .map((p, index, array) => (
                                  <>
                                    {index > 0 &&
                                      array[index - 1] !== p - 1 && (
                                        <span
                                          key={`ellipsis-${p}`}
                                          className="text-muted-foreground px-2"
                                        >
                                          ...
                                        </span>
                                      )}
                                    <Button
                                      key={p}
                                      variant={
                                        p === page ? "default" : "outline"
                                      }
                                      onClick={() => setPage(p)}
                                      className={
                                        p === page
                                          ? "bg-primary hover:bg-primary-dark text-white"
                                          : "border-border text-foreground hover:bg-ui-surface-elevated"
                                      }
                                    >
                                      {p}
                                    </Button>
                                  </>
                                ))}
                              <Button
                                variant="outline"
                                onClick={() => setPage(page + 1)}
                                disabled={page === totalPages}
                                className="border-border text-foreground hover:bg-ui-surface-elevated disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Siguiente
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Estás seguro de que deseas eliminar al cliente{" "}
              <strong className="text-foreground">
                {client?.businessName}
              </strong>
              ? Esta acción marcará el cliente como inactivo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-border text-foreground hover:bg-ui-surface-elevated"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
