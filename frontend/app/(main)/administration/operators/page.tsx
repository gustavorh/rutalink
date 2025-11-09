"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import {
  getOperators,
  deleteOperator,
  createOperator,
  updateOperator,
} from "@/lib/api";
import type {
  Operator,
  OperatorQueryParams,
  CreateOperatorInput,
  UpdateOperatorInput,
} from "@/types/operators";
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
  Users,
  Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function OperatorsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(
    null
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [operatorToEdit, setOperatorToEdit] = useState<Operator | null>(null);
  const [formData, setFormData] = useState<
    CreateOperatorInput | UpdateOperatorInput
  >({
    name: "",
    description: "",
    super: false,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    city: "",
    region: "",
    country: "Chile",
    status: true,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
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
    fetchOperators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const user = getUser();
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const params: OperatorQueryParams = {
        page,
        limit,
      };

      if (search) params.search = search;

      const response = await getOperators(token, params);
      setOperators(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar organizaciones"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOperators();
  };

  const handleDeleteClick = (operator: Operator) => {
    setOperatorToDelete(operator);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!operatorToDelete) return;

    try {
      const token = getToken();
      if (!token) return;

      await deleteOperator(token, operatorToDelete.id);
      setDeleteDialogOpen(false);
      setOperatorToDelete(null);
      fetchOperators();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar organización"
      );
    }
  };

  const handleCreateClick = () => {
    setFormData({
      name: "",
      description: "",
      super: false,
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      city: "",
      region: "",
      country: "Chile",
      status: true,
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (operator: Operator) => {
    setOperatorToEdit(operator);
    setFormData({
      name: operator.name,
      description: operator.description || "",
      super: operator.super,
      contactName: operator.contactName || "",
      contactEmail: operator.contactEmail || "",
      contactPhone: operator.contactPhone || "",
      address: operator.address || "",
      city: operator.city || "",
      region: operator.region || "",
      country: operator.country || "Chile",
      status: operator.status,
    });
    setEditDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && operatorToEdit) {
        // Update existing operator
        await updateOperator(
          token,
          operatorToEdit.id,
          formData as UpdateOperatorInput
        );
        setEditDialogOpen(false);
        setOperatorToEdit(null);
      } else {
        // Create new operator
        await createOperator(token, formData as CreateOperatorInput);
        setCreateDialogOpen(false);
      }

      fetchOperators();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar organización"
      );
    } finally {
      setFormLoading(false);
    }
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
  const activeOperators = operators.filter((o) => o.status).length;
  const superOperators = operators.filter((o) => o.super).length;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header with Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Gestión de Organizaciones
            </h1>
            <p className="text-muted-foreground mt-1">
              Administración de organizaciones multi-tenancy
            </p>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-primary hover:bg-primary-dark text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Organización
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Organizaciones
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
                    Organizaciones Activas
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {activeOperators}
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
                    Organizaciones Super
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {superOperators}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-orange-400" />
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
                Filtra y busca organizaciones
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
                    placeholder="Buscar por nombre, contacto, ciudad..."
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
            </div>
          </CardContent>
        </Card>

        {/* Operators Table */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Listado de Organizaciones
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Total de {total} organizaciones registradas
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
                  Cargando organizaciones...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">{error}</p>
              </div>
            ) : operators.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron organizaciones
                </p>
                <Button
                  onClick={handleCreateClick}
                  className="mt-4 bg-primary hover:bg-primary-dark"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primera Organización
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground">
                          Nombre
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Contacto
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Ubicación
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          Tipo
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
                      {operators.map((operator) => (
                        <TableRow
                          key={operator.id}
                          className="border-b border-border hover:bg-ui-surface-elevated"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-foreground flex items-center gap-2">
                                {operator.name}
                                {operator.super && (
                                  <Shield className="w-4 h-4 text-orange-400" />
                                )}
                              </div>
                              {operator.description && (
                                <div className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]">
                                  {operator.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              {operator.contactName && (
                                <div className="text-foreground">
                                  {operator.contactName}
                                </div>
                              )}
                              {operator.contactEmail && (
                                <div className="text-muted-foreground text-xs">
                                  {operator.contactEmail}
                                </div>
                              )}
                              {operator.contactPhone && (
                                <div className="text-muted-foreground text-xs">
                                  {operator.contactPhone}
                                </div>
                              )}
                              {!operator.contactName &&
                                !operator.contactEmail &&
                                !operator.contactPhone && (
                                  <div className="text-muted-foreground text-xs">
                                    Sin contacto
                                  </div>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              {operator.city && (
                                <div className="text-foreground">
                                  {operator.city}
                                </div>
                              )}
                              {operator.region && (
                                <div className="text-muted-foreground text-xs">
                                  {operator.region}
                                </div>
                              )}
                              {!operator.city && !operator.region && (
                                <div className="text-muted-foreground text-xs">
                                  N/A
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {operator.super ? (
                              <Badge
                                variant="outline"
                                className="border-orange-500/50 text-orange-400"
                              >
                                Super Admin
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-primary/50 text-primary"
                              >
                                Estándar
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={operator.status ? "default" : "outline"}
                              className={
                                operator.status
                                  ? "bg-success/10 text-success border-success/50"
                                  : "border-slate-500/50 text-muted-foreground"
                              }
                            >
                              {operator.status ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  router.push(
                                    `/administration/operators/${operator.id}`
                                  )
                                }
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(operator)}
                                className="text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(operator)}
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
                    {Math.min(page * limit, total)} de {total} organizaciones
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
              ¿Estás seguro de que deseas eliminar la organización{" "}
              <strong className="text-foreground">
                {operatorToDelete?.name}
              </strong>
              ? Esta acción marcará la organización como inactiva.
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

      {/* Create/Edit Operator Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setOperatorToEdit(null);
          }
        }}
      >
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editDialogOpen ? "Editar Organización" : "Nueva Organización"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editDialogOpen
                ? "Actualiza la información de la organización"
                : "Completa la información de la nueva organización"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b border-border pb-2">
                Información Básica
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name" className="text-foreground">
                    Nombre de la Organización *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Ej: Transporte ABC Ltda."
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description" className="text-foreground">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Breve descripción de la organización..."
                    rows={3}
                  />
                </div>

                <div className="col-span-2 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="super"
                    checked={formData.super}
                    onChange={(e) =>
                      setFormData({ ...formData, super: e.target.checked })
                    }
                    className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="super"
                    className="text-foreground cursor-pointer"
                  >
                    Organización Super (acceso completo al sistema)
                  </Label>
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
                      setFormData({
                        ...formData,
                        contactEmail: e.target.value,
                      })
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
                      setFormData({
                        ...formData,
                        contactPhone: e.target.value,
                      })
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

                <div className="col-span-2">
                  <Label htmlFor="country" className="text-foreground">
                    País
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    className="bg-ui-surface-elevated border-border text-foreground mt-1"
                    placeholder="Chile"
                  />
                </div>

                <div className="col-span-2 flex items-center space-x-2">
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
                    Organización Activa
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
                  setOperatorToEdit(null);
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
                  "Actualizar Organización"
                ) : (
                  "Crear Organización"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
