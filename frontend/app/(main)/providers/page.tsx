"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import {
  getProviders,
  deleteProvider,
  createProvider,
  updateProvider,
} from "@/lib/api";
import type {
  Provider,
  ProviderQueryParams,
  CreateProviderInput,
  UpdateProviderInput,
} from "@/types/providers";
import { BUSINESS_TYPES } from "@/types/providers";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Building2,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  TrendingUp,
  Truck,
  FileText,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProvidersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState<Provider | null>(null);
  const [formData, setFormData] = useState<
    CreateProviderInput | UpdateProviderInput
  >({
    businessName: "",
    taxId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    region: "",
    country: "Chile",
    businessType: undefined,
    serviceTypes: "",
    fleetSize: undefined,
    status: true,
    rating: undefined,
    observations: "",
    notes: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

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
    setMounted(true);
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, businessTypeFilter]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const user = getUser();
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const params: ProviderQueryParams = {
        operatorId: user.operatorId,
        page,
        limit,
      };

      if (search) params.search = search;
      if (statusFilter !== "all")
        params.status = statusFilter === "active" ? true : false;
      if (businessTypeFilter !== "all")
        params.businessType = businessTypeFilter;

      const response = await getProviders(token, params);
      setProviders(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar proveedores"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchProviders();
  };

  const handleDeleteClick = (provider: Provider) => {
    setProviderToDelete(provider);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!providerToDelete) return;

    try {
      const token = getToken();
      if (!token) return;

      await deleteProvider(token, providerToDelete.id);
      setDeleteDialogOpen(false);
      setProviderToDelete(null);
      fetchProviders();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar proveedor"
      );
    }
  };

  const handleCreateClick = () => {
    const user = getUser();
    if (!user) return;

    setFormData({
      businessName: "",
      taxId: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      city: "",
      region: "",
      country: "Chile",
      businessType: undefined,
      serviceTypes: "",
      fleetSize: undefined,
      status: true,
      rating: undefined,
      observations: "",
      notes: "",
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (provider: Provider) => {
    setProviderToEdit(provider);
    setFormData({
      businessName: provider.businessName,
      taxId: provider.taxId || "",
      contactName: provider.contactName || "",
      contactEmail: provider.contactEmail || "",
      contactPhone: provider.contactPhone || "",
      address: provider.address || "",
      city: provider.city || "",
      region: provider.region || "",
      country: provider.country || "Chile",
      businessType: (provider.businessType || undefined) as
        | (typeof BUSINESS_TYPES)[number]["value"]
        | undefined,
      serviceTypes: provider.serviceTypes || "",
      fleetSize: provider.fleetSize || undefined,
      status: provider.status,
      rating: provider.rating || undefined,
      observations: provider.observations || "",
      notes: provider.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    const user = getUser();
    if (!token || !user) return;

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && providerToEdit) {
        // Update existing provider
        await updateProvider(
          token,
          providerToEdit.id,
          formData as UpdateProviderInput
        );
        setEditDialogOpen(false);
        setProviderToEdit(null);
      } else {
        // Create new provider
        const createData: CreateProviderInput = {
          ...(formData as CreateProviderInput),
          operatorId: user.operatorId,
        };
        await createProvider(token, createData);
        setCreateDialogOpen(false);
      }

      fetchProviders();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar proveedor"
      );
    } finally {
      setFormLoading(false);
    }
  };

  const getBusinessTypeLabel = (businessType?: string | null) => {
    if (!businessType) return "N/A";
    const found = BUSINESS_TYPES.find((t) => t.value === businessType);
    return found ? found.label : businessType;
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

  // Calculate statistics
  const activeProviders = providers.filter((p) => p.status).length;
  const providersByType = providers.reduce((acc, provider) => {
    const type = provider.businessType || "Sin clasificar";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topType = Object.entries(providersByType).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const avgRating =
    providers.filter((p) => p.rating).length > 0
      ? (
          providers.reduce((sum, p) => sum + (p.rating || 0), 0) /
          providers.filter((p) => p.rating).length
        ).toFixed(1)
      : "N/A";

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="w-full space-y-6">
        {/* Page Header with Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" />
              Mantenedor de Proveedores de Transporte
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión de proveedores externos y servicios de transporte
            </p>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-primary hover:bg-primary-dark text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proveedor
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Proveedores
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Proveedores Activos
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {activeProviders}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Calificación Promedio
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {avgRating}
                    {avgRating !== "N/A" && (
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        / 5
                      </span>
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Tipo Principal
                  </p>
                  <p className="text-sm font-bold text-foreground mt-1">
                    {topType ? getBusinessTypeLabel(topType[0]) : "N/A"}
                  </p>
                  {topType && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {topType[1]} proveedor
                      {topType[1] !== 1 ? "es" : ""}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                Filtros de Búsqueda
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Filtra y busca proveedores según tus criterios
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-border text-foreground hover:bg-ui-surface-elevated"
            >
              {showFilters ? "Ocultar" : "Mostrar"} Filtros
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar - Always Visible */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por razón social, RUT, contacto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 bg-ui-surface-elevated border-border text-foreground placeholder-muted-foreground focus:border-primary"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="bg-primary hover:bg-primary-dark"
                >
                  Buscar
                </Button>
              </div>

              {/* Additional Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Estado
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Tipo de Servicio
                    </label>
                    <Select
                      value={businessTypeFilter}
                      onValueChange={setBusinessTypeFilter}
                    >
                      <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground">
                        <SelectValue placeholder="Tipo de servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos</SelectItem>
                        {BUSINESS_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Providers Table */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Listado de Proveedores
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Total de {total} proveedores registrados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-ui-surface-elevated"
                onClick={() => {
                  /* TODO: Implement export functionality */
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-muted-foreground mt-4">
                  Cargando proveedores...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">{error}</p>
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron proveedores
                </p>
                <Button
                  onClick={handleCreateClick}
                  className="mt-4 bg-primary hover:bg-primary-dark"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primer Proveedor
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">
                          Razón Social
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          RUT
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Contacto
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Ubicación
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Tipo de Servicio
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Flota
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Calificación
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Estado
                        </TableHead>
                        <TableHead className="text-right text-muted-foreground">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providers.map((provider) => (
                        <TableRow
                          key={provider.id}
                          className="border-b border-border hover:bg-ui-surface-elevated"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-foreground">
                                {provider.businessName}
                              </div>
                              {provider.observations && (
                                <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                                  {provider.observations}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-foreground">
                            {provider.taxId || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              {provider.contactName && (
                                <div className="text-foreground">
                                  {provider.contactName}
                                </div>
                              )}
                              {provider.contactEmail && (
                                <div className="text-muted-foreground text-xs">
                                  {provider.contactEmail}
                                </div>
                              )}
                              {provider.contactPhone && (
                                <div className="text-muted-foreground text-xs">
                                  {provider.contactPhone}
                                </div>
                              )}
                              {!provider.contactName &&
                                !provider.contactEmail &&
                                !provider.contactPhone && (
                                  <div className="text-muted-foreground text-xs">
                                    Sin contacto
                                  </div>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              {provider.city && (
                                <div className="text-foreground">
                                  {provider.city}
                                </div>
                              )}
                              {provider.region && (
                                <div className="text-muted-foreground text-xs">
                                  {provider.region}
                                </div>
                              )}
                              {!provider.city && !provider.region && (
                                <div className="text-muted-foreground text-xs">
                                  N/A
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {provider.businessType ? (
                              <Badge
                                variant="outline"
                                className="border-primary/50 text-primary"
                              >
                                {getBusinessTypeLabel(provider.businessType)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                Sin clasificar
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {provider.fleetSize ? (
                              <div className="text-foreground font-medium">
                                {provider.fleetSize} vehículos
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {provider.rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-warning fill-warning" />
                                <span className="text-foreground font-medium">
                                  {provider.rating}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  / 5
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                Sin calificar
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={provider.status ? "default" : "outline"}
                              className={
                                provider.status
                                  ? "bg-success/10 text-success border-success/50"
                                  : "border-slate-500/50 text-muted-foreground"
                              }
                            >
                              {provider.status ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  router.push(`/providers/${provider.id}`)
                                }
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(provider)}
                                className="text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(provider)}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(page - 1) * limit + 1} a{" "}
                    {Math.min(page * limit, total)} de {total} proveedores
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= page - 1 && p <= page + 1)
                      )
                      .map((p, index, array) => (
                        <div key={p} className="flex items-center">
                          {index > 0 && array[index - 1] !== p - 1 && (
                            <span className="text-muted-foreground px-2">
                              ...
                            </span>
                          )}
                          <Button
                            variant={p === page ? "default" : "outline"}
                            onClick={() => setPage(p)}
                            className={
                              p === page
                                ? "bg-primary hover:bg-primary-dark text-white"
                                : "border-border text-foreground hover:bg-ui-surface-elevated"
                            }
                          >
                            {p}
                          </Button>
                        </div>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Estás seguro de que deseas eliminar al proveedor{" "}
              <strong className="text-foreground">
                {providerToDelete?.businessName}
              </strong>
              ? Esta acción no se puede deshacer.
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

      {/* Create/Edit Provider Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setProviderToEdit(null);
          }
        }}
      >
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editDialogOpen ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editDialogOpen
                ? "Actualiza la información del proveedor"
                : "Completa la información del nuevo proveedor"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Información Comercial
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="businessName" className="text-foreground">
                    Razón Social *
                  </Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                    required
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Ej: Transportes ABC S.A."
                  />
                </div>

                <div>
                  <Label htmlFor="taxId" className="text-foreground">
                    RUT
                  </Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) =>
                      setFormData({ ...formData, taxId: e.target.value })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Ej: 76.123.456-7"
                  />
                </div>

                <div>
                  <Label htmlFor="businessType" className="text-foreground">
                    Tipo de Servicio
                  </Label>
                  <Select
                    value={formData.businessType || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        businessType:
                          value as (typeof BUSINESS_TYPES)[number]["value"],
                      })
                    }
                  >
                    <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="serviceTypes" className="text-foreground">
                    Servicios Ofrecidos
                  </Label>
                  <Input
                    id="serviceTypes"
                    value={formData.serviceTypes}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceTypes: e.target.value })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Ej: Carga seca, refrigerada, contenedores"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separa los servicios con comas
                  </p>
                </div>

                <div>
                  <Label htmlFor="fleetSize" className="text-foreground">
                    Tamaño de Flota
                  </Label>
                  <Input
                    id="fleetSize"
                    type="number"
                    min="0"
                    value={formData.fleetSize || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fleetSize: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Número de vehículos"
                  />
                </div>

                <div>
                  <Label htmlFor="rating" className="text-foreground">
                    Calificación (1-5)
                  </Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.rating || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rating: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="1 a 5 estrellas"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Información de Contacto
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="contactName" className="text-foreground">
                    Nombre de Contacto
                  </Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) =>
                      setFormData({ ...formData, contactName: e.target.value })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail" className="text-foreground">
                    Email de Contacto
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="contacto@empresa.cl"
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone" className="text-foreground">
                    Teléfono de Contacto
                  </Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPhone: e.target.value })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Ubicación
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="address" className="text-foreground">
                    Dirección
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Ej: Av. Principal 123"
                  />
                </div>

                <div>
                  <Label htmlFor="city" className="text-foreground">
                    Ciudad
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Ej: Santiago"
                  />
                </div>

                <div>
                  <Label htmlFor="region" className="text-foreground">
                    Región
                  </Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({ ...formData, region: e.target.value })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Ej: Metropolitana"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Información Adicional
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="observations" className="text-foreground">
                    Observaciones
                  </Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) =>
                      setFormData({ ...formData, observations: e.target.value })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Observaciones generales del proveedor..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-foreground">
                    Notas Internas
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Notas internas sobre el proveedor..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="status"
                    checked={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.checked })
                    }
                    className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="status"
                    className="text-foreground cursor-pointer"
                  >
                    Proveedor Activo
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                  setProviderToEdit(null);
                }}
                className="border-border text-foreground hover:bg-ui-surface-elevated"
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary-dark text-white"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : editDialogOpen ? (
                  "Actualizar Proveedor"
                ) : (
                  "Crear Proveedor"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
