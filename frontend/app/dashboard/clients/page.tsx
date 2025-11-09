"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import {
  getClients,
  deleteClient,
  createClient,
  updateClient,
} from "@/lib/api";
import type {
  Client,
  ClientQueryParams,
  CreateClientInput,
  UpdateClientInput,
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
  Building,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ClientsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [formData, setFormData] = useState<
    CreateClientInput | UpdateClientInput
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
    industry: undefined,
    status: true,
    observations: "",
    notes: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
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
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter, industryFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const user = getUser();
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const params: ClientQueryParams = {
        operatorId: user.operatorId,
        page,
        limit,
      };

      if (search) params.search = search;
      if (statusFilter !== "all")
        params.status = statusFilter === "active" ? true : false;
      if (industryFilter !== "all") params.industry = industryFilter;

      const response = await getClients(token, params);
      setClients(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchClients();
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      const token = getToken();
      if (!token) return;

      await deleteClient(token, clientToDelete.id);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      fetchClients();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar cliente"
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
      industry: undefined,
      status: true,
      observations: "",
      notes: "",
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (client: Client) => {
    setClientToEdit(client);
    setFormData({
      businessName: client.businessName,
      taxId: client.taxId || "",
      contactName: client.contactName || "",
      contactEmail: client.contactEmail || "",
      contactPhone: client.contactPhone || "",
      address: client.address || "",
      city: client.city || "",
      region: client.region || "",
      country: client.country || "Chile",
      industry: (client.industry || undefined) as
        | (typeof INDUSTRIES)[number]["value"]
        | undefined,
      status: client.status,
      observations: client.observations || "",
      notes: client.notes || "",
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

      if (editDialogOpen && clientToEdit) {
        // Update existing client
        await updateClient(
          token,
          clientToEdit.id,
          formData as UpdateClientInput
        );
        setEditDialogOpen(false);
        setClientToEdit(null);
      } else {
        // Create new client
        const createData: CreateClientInput = {
          ...(formData as CreateClientInput),
          operatorId: user.operatorId,
        };
        await createClient(token, createData);
        setCreateDialogOpen(false);
      }

      fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar cliente");
    } finally {
      setFormLoading(false);
    }
  };

  const getIndustryLabel = (industry?: string | null) => {
    if (!industry) return "N/A";
    const found = INDUSTRIES.find((i) => i.value === industry);
    return found ? found.label : industry;
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

  // Calculate statistics
  const activeClients = clients.filter((c) => c.status).length;
  const clientsByIndustry = clients.reduce((acc, client) => {
    const industry = client.industry || "Sin clasificar";
    acc[industry] = (acc[industry] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topIndustry = Object.entries(clientsByIndustry).sort(
    (a, b) => b[1] - a[1]
  )[0];

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Page Header with Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              Mantenedor de Clientes
            </h1>
            <p className="text-slate-400 mt-1">
              Gestión de información comercial y operativa de clientes
            </p>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#23262f] border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Total Clientes
                  </p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">
                    {total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#23262f] border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Clientes Activos
                  </p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">
                    {activeClients}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#23262f] border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Rubros Registrados
                  </p>
                  <p className="text-2xl font-bold text-slate-100 mt-1">
                    {Object.keys(clientsByIndustry).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#23262f] border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Rubro Principal
                  </p>
                  <p className="text-sm font-bold text-slate-100 mt-1">
                    {topIndustry ? getIndustryLabel(topIndustry[0]) : "N/A"}
                  </p>
                  {topIndustry && (
                    <p className="text-xs text-slate-500 mt-1">
                      {topIndustry[1]} cliente
                      {topIndustry[1] !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="bg-[#23262f] border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-400" />
                Filtros de Búsqueda
              </CardTitle>
              <CardDescription className="text-slate-400">
                Filtra y busca clientes según tus criterios
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a]"
            >
              {showFilters ? "Ocultar" : "Mostrar"} Filtros
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar - Always Visible */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Buscar por razón social, RUT, contacto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 bg-[#2a2d3a] border-slate-600 text-slate-300 placeholder-slate-500 focus:border-blue-500"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Buscar
                </Button>
              </div>

              {/* Additional Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-2 block">
                      Estado
                    </label>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300">
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
                    <label className="text-xs font-medium text-slate-400 mb-2 block">
                      Rubro / Industria
                    </label>
                    <Select
                      value={industryFilter}
                      onValueChange={setIndustryFilter}
                    >
                      <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300">
                        <SelectValue placeholder="Rubro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los rubros</SelectItem>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem
                            key={industry.value}
                            value={industry.value}
                          >
                            {industry.label}
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

        {/* Clients Table */}
        <Card className="bg-[#23262f] border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Listado de Clientes
              </CardTitle>
              <CardDescription className="text-slate-400">
                Total de {total} clientes registrados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a]"
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
                <p className="text-slate-400 mt-4">Cargando clientes...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">{error}</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500">No se encontraron clientes</p>
                <Button
                  onClick={handleCreateClick}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primer Cliente
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-700 hover:bg-transparent">
                        <TableHead className="text-slate-400">
                          Razón Social
                        </TableHead>
                        <TableHead className="text-slate-400">RUT</TableHead>
                        <TableHead className="text-slate-400">
                          Contacto
                        </TableHead>
                        <TableHead className="text-slate-400">
                          Ubicación
                        </TableHead>
                        <TableHead className="text-slate-400">Rubro</TableHead>
                        <TableHead className="text-slate-400">Estado</TableHead>
                        <TableHead className="text-right text-slate-400">
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow
                          key={client.id}
                          className="border-b border-slate-700 hover:bg-[#2a2d3a]"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-slate-200">
                                {client.businessName}
                              </div>
                              {client.observations && (
                                <div className="text-xs text-slate-500 mt-1 truncate max-w-[200px]">
                                  {client.observations}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-300">
                            {client.taxId || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              {client.contactName && (
                                <div className="text-slate-300">
                                  {client.contactName}
                                </div>
                              )}
                              {client.contactEmail && (
                                <div className="text-slate-400 text-xs">
                                  {client.contactEmail}
                                </div>
                              )}
                              {client.contactPhone && (
                                <div className="text-slate-400 text-xs">
                                  {client.contactPhone}
                                </div>
                              )}
                              {!client.contactName &&
                                !client.contactEmail &&
                                !client.contactPhone && (
                                  <div className="text-slate-500 text-xs">
                                    Sin contacto
                                  </div>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              {client.city && (
                                <div className="text-slate-300">
                                  {client.city}
                                </div>
                              )}
                              {client.region && (
                                <div className="text-slate-400 text-xs">
                                  {client.region}
                                </div>
                              )}
                              {!client.city && !client.region && (
                                <div className="text-slate-500 text-xs">
                                  N/A
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.industry ? (
                              <Badge
                                variant="outline"
                                className="border-blue-500/50 text-blue-400"
                              >
                                {getIndustryLabel(client.industry)}
                              </Badge>
                            ) : (
                              <span className="text-slate-500 text-xs">
                                Sin clasificar
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={client.status ? "default" : "outline"}
                              className={
                                client.status
                                  ? "bg-green-500/10 text-green-400 border-green-500/50"
                                  : "border-slate-500/50 text-slate-500"
                              }
                            >
                              {client.status ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  router.push(`/dashboard/clients/${client.id}`)
                                }
                                className="text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                                title="Ver detalles"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(client)}
                                className="text-slate-400 hover:text-purple-400 hover:bg-purple-500/10"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(client)}
                                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
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
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    Mostrando {(page - 1) * limit + 1} a{" "}
                    {Math.min(page * limit, total)} de {total} clientes
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a] disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <span className="text-slate-500 px-2">...</span>
                          )}
                          <Button
                            variant={p === page ? "default" : "outline"}
                            onClick={() => setPage(p)}
                            className={
                              p === page
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "border-slate-600 text-slate-300 hover:bg-[#2a2d3a]"
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
                      className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a] disabled:opacity-50 disabled:cursor-not-allowed"
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
        <DialogContent className="bg-[#23262f] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              ¿Estás seguro de que deseas eliminar al cliente{" "}
              <strong className="text-slate-200">
                {clientToDelete?.businessName}
              </strong>
              ? Esta acción marcará el cliente como inactivo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a]"
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

      {/* Create/Edit Client Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setClientToEdit(null);
          }
        }}
      >
        <DialogContent className="bg-[#23262f] border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              {editDialogOpen ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editDialogOpen
                ? "Actualiza la información del cliente"
                : "Completa la información del nuevo cliente"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">
                Información Comercial
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="businessName" className="text-slate-300">
                    Razón Social *
                  </Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                    required
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="Ej: Constructora ABC S.A."
                  />
                </div>

                <div>
                  <Label htmlFor="taxId" className="text-slate-300">
                    RUT
                  </Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) =>
                      setFormData({ ...formData, taxId: e.target.value })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="Ej: 76.123.456-7"
                  />
                </div>

                <div>
                  <Label htmlFor="industry" className="text-slate-300">
                    Rubro / Industria
                  </Label>
                  <Select
                    value={formData.industry || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        industry: value as (typeof INDUSTRIES)[number]["value"],
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1">
                      <SelectValue placeholder="Seleccionar rubro" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">
                Información de Contacto
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="contactName" className="text-slate-300">
                    Nombre de Contacto
                  </Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) =>
                      setFormData({ ...formData, contactName: e.target.value })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail" className="text-slate-300">
                    Email de Contacto
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="contacto@empresa.cl"
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone" className="text-slate-300">
                    Teléfono de Contacto
                  </Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPhone: e.target.value })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">
                Ubicación
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="address" className="text-slate-300">
                    Dirección
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="Ej: Av. Principal 123"
                  />
                </div>

                <div>
                  <Label htmlFor="city" className="text-slate-300">
                    Ciudad
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="Ej: Santiago"
                  />
                </div>

                <div>
                  <Label htmlFor="region" className="text-slate-300">
                    Región
                  </Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) =>
                      setFormData({ ...formData, region: e.target.value })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="Ej: Metropolitana"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">
                Información Adicional
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="observations" className="text-slate-300">
                    Observaciones
                  </Label>
                  <Textarea
                    id="observations"
                    value={formData.observations}
                    onChange={(e) =>
                      setFormData({ ...formData, observations: e.target.value })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="Observaciones generales del cliente..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-slate-300">
                    Notas Internas
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="bg-[#2a2d3a] border-slate-600 text-slate-300 mt-1"
                    placeholder="Notas internas sobre el cliente..."
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
                    className="rounded border-slate-600 bg-[#2a2d3a] text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="status"
                    className="text-slate-300 cursor-pointer"
                  >
                    Cliente Activo
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
                  setClientToEdit(null);
                }}
                className="border-slate-600 text-slate-300 hover:bg-[#2a2d3a]"
                disabled={formLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : editDialogOpen ? (
                  "Actualizar Cliente"
                ) : (
                  "Crear Cliente"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
