"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import { getDrivers, deleteDriver } from "@/lib/api";
import type { Driver, DriverQueryParams } from "@/types/drivers";
import { LICENSE_TYPES } from "@/types/drivers";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isExternalFilter, setIsExternalFilter] = useState<string>("all");
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, isExternalFilter, licenseTypeFilter]);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const user = getUser();
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const params: DriverQueryParams = {
        operatorId: user.operatorId,
        page,
        limit,
      };

      if (search) params.search = search;
      if (statusFilter !== "all")
        params.status = statusFilter === "active" ? true : false;
      if (isExternalFilter !== "all")
        params.isExternal = isExternalFilter === "external" ? true : false;
      if (licenseTypeFilter !== "all") params.licenseType = licenseTypeFilter;

      const response = await getDrivers(token, params);
      setDrivers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar choferes");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchDrivers();
  };

  const handleDeleteClick = (driver: Driver) => {
    setDriverToDelete(driver);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!driverToDelete) return;

    try {
      const token = getToken();
      if (!token) return;

      await deleteDriver(token, driverToDelete.id);
      setDeleteDialogOpen(false);
      setDriverToDelete(null);
      fetchDrivers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar chofer");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-CL");
  };

  const isLicenseExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Choferes</h1>
            <p className="text-slate-600 mt-1">
              Administra la información de los choferes y su documentación
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard/drivers/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Chofer
          </Button>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Busca y filtra choferes según tus criterios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Buscar por nombre, RUT, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={isExternalFilter}
                onValueChange={setIsExternalFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="external">Externo</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={licenseTypeFilter}
                onValueChange={setLicenseTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Licencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las licencias</SelectItem>
                  {LICENSE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Drivers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Choferes ({total})</CardTitle>
            <CardDescription>
              Lista de todos los choferes registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">{error}</div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No se encontraron choferes
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RUT</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Licencia</TableHead>
                      <TableHead>Vigencia Licencia</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell className="font-medium">
                          {driver.rut}
                        </TableCell>
                        <TableCell>
                          {driver.firstName} {driver.lastName}
                          {driver.isExternal && driver.externalCompany && (
                            <div className="text-xs text-slate-500">
                              {driver.externalCompany}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{driver.licenseType}</Badge>
                        </TableCell>
                        <TableCell>
                          {isLicenseExpired(driver.licenseExpirationDate) ? (
                            <Badge variant="destructive">
                              Vencida -{" "}
                              {formatDate(driver.licenseExpirationDate)}
                            </Badge>
                          ) : (
                            <span>
                              {formatDate(driver.licenseExpirationDate)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={driver.isExternal ? "warning" : "info"}
                          >
                            {driver.isExternal ? "Externo" : "Interno"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={driver.status ? "success" : "secondary"}
                          >
                            {driver.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(`/dashboard/drivers/${driver.id}`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(
                                  `/dashboard/drivers/${driver.id}/edit`
                                )
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(driver)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-slate-500">
                    Página {page} de {totalPages} ({total} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar al chofer{" "}
                <strong>
                  {driverToDelete?.firstName} {driverToDelete?.lastName}
                </strong>
                ? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
