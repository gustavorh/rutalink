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
} from "@/types/clients";
import type {
  CreateClientDto,
  UpdateClientDto,
  ClientQueryDto,
} from "@/lib/api-types";
import { INDUSTRIES } from "@/types/clients";
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
  Edit,
  Trash2,
  Eye,
  Building2,
  CheckCircle,
  TrendingUp,
  Building,
  FileText,
} from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { StatisticsCard } from "@/components/ui/statistics-card";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormSection } from "@/components/ui/form-section";
import { usePagination } from "@/lib/hooks/use-pagination";
import { useFilters } from "@/lib/hooks/use-filters";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableAction,
} from "@/components/ui/data-table";

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
    CreateClientDto | UpdateClientDto
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
  const {
    filters: filterState,
    setFilter,
    showFilters,
    toggleFilters,
    clearFilters: clearAllFilters,
  } = useFilters({
    initialFilters: {
      status: "all",
      industry: "all",
    },
  });

  // Pagination
  const {
    page,
    setPage,
    total,
    setTotal,
    totalPages,
    setTotalPages,
    pagination,
  } = usePagination({ initialLimit: 10 });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterState.status, filterState.industry]);

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

      const params: ClientQueryDto = {
        operatorId: user.operatorId,
        page,
        limit: pagination.limit,
      };

      if (search) params.search = search;
      if (filterState.status !== "all")
        params.status = filterState.status === "active" ? true : false;
      if (filterState.industry !== "all")
        params.industry = filterState.industry;

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
          formData as UpdateClientDto
        );
        setEditDialogOpen(false);
        setClientToEdit(null);
      } else {
        // Create new client
        const createData: CreateClientDto = {
          ...(formData as CreateClientDto),
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

  const handleClearFilters = () => {
    setSearch("");
    clearAllFilters();
    setPage(1);
  };

  // Define table columns
  const columns: DataTableColumn<Client>[] = [
    {
      key: "businessName",
      header: "Razón Social",
      accessor: (client) => (
        <div>
          <div className="font-medium text-foreground">
            {client.businessName}
          </div>
          {client.observations && (
            <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
              {client.observations}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "taxId",
      header: "RUT",
      accessor: (client) => (
        <span className="font-mono text-sm text-foreground">
          {client.taxId || "N/A"}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contacto",
      accessor: (client) => (
        <div className="text-sm space-y-1">
          {client.contactName && (
            <div className="text-foreground">{client.contactName}</div>
          )}
          {client.contactEmail && (
            <div className="text-muted-foreground text-xs">
              {client.contactEmail}
            </div>
          )}
          {client.contactPhone && (
            <div className="text-muted-foreground text-xs">
              {client.contactPhone}
            </div>
          )}
          {!client.contactName &&
            !client.contactEmail &&
            !client.contactPhone && (
              <div className="text-muted-foreground text-xs">Sin contacto</div>
            )}
        </div>
      ),
    },
    {
      key: "location",
      header: "Ubicación",
      accessor: (client) => (
        <div className="text-sm space-y-1">
          {client.city && <div className="text-foreground">{client.city}</div>}
          {client.region && (
            <div className="text-muted-foreground text-xs">{client.region}</div>
          )}
          {!client.city && !client.region && (
            <div className="text-muted-foreground text-xs">N/A</div>
          )}
        </div>
      ),
    },
    {
      key: "industry",
      header: "Rubro",
      accessor: (client) =>
        client.industry ? (
          <Badge variant="outline" className="border-primary/50 text-primary">
            {getIndustryLabel(client.industry)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Sin clasificar</span>
        ),
    },
    {
      key: "status",
      header: "Estado",
      accessor: (client) => (
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
      ),
    },
  ];

  // Define table filters
  const filters: DataTableFilter[] = [
    {
      id: "status",
      label: "Estado",
      type: "select",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "active", label: "Activo" },
        { value: "inactive", label: "Inactivo" },
      ],
      value: filterState.status,
      onChange: (value) => setFilter("status", value),
      ariaLabel: "Filtrar por estado",
    },
    {
      id: "industry",
      label: "Rubro / Industria",
      type: "select",
      options: [
        { value: "all", label: "Todos los rubros" },
        ...INDUSTRIES.map((industry) => ({
          value: industry.value,
          label: industry.label,
        })),
      ],
      value: filterState.industry,
      onChange: (value) => setFilter("industry", value),
      ariaLabel: "Filtrar por rubro",
    },
  ];

  // Define row actions
  const actions: DataTableAction<Client>[] = [
    {
      label: "Ver detalles",
      icon: <Eye className="h-4 w-4" />,
      onClick: (client) => router.push(`/clients/${client.id}`),
      variant: "ghost",
      className: "text-muted-foreground hover:text-primary hover:bg-primary/10",
      title: "Ver detalles",
    },
    {
      label: "Editar",
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditClick,
      variant: "ghost",
      className:
        "text-muted-foreground hover:text-secondary hover:bg-secondary/10",
      title: "Editar",
    },
    {
      label: "Eliminar",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteClick,
      variant: "ghost",
      className:
        "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
      title: "Eliminar",
    },
  ];

  if (!mounted) {
    return <LoadingState />;
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
        {/* Page Header */}
        <PageHeader
          title="Mantenedor de Clientes"
          description="Gestión de información comercial y operativa de clientes"
          icon={<Building2 className="w-6 h-6" />}
          actionLabel={
            <>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </>
          }
          onAction={handleCreateClick}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatisticsCard
            value={total}
            label="Total Clientes"
            icon={<Building2 className="w-6 h-6" />}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
          />
          <StatisticsCard
            value={activeClients}
            label="Clientes Activos"
            icon={<CheckCircle className="w-6 h-6" />}
            iconBgColor="bg-success/10"
            iconColor="text-success"
          />
          <StatisticsCard
            value={Object.keys(clientsByIndustry).length}
            label="Rubros Registrados"
            icon={<Building className="w-6 h-6" />}
            iconBgColor="bg-secondary/10"
            iconColor="text-secondary"
          />
          <StatisticsCard
            value={
              topIndustry
                ? `${getIndustryLabel(topIndustry[0])} (${topIndustry[1]})`
                : "N/A"
            }
            label="Rubro Principal"
            icon={<TrendingUp className="w-6 h-6" />}
            iconBgColor="bg-orange-500/10"
            iconColor="text-orange-400"
          />
        </div>

        {/* Clients DataTable */}
        <DataTable
          data={clients}
          columns={columns}
          pagination={pagination}
          onPageChange={setPage}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por razón social, RUT, contacto..."
          onSearchSubmit={handleSearch}
          filters={filters}
          showFilters={showFilters}
          onToggleFilters={toggleFilters}
          onClearFilters={handleClearFilters}
          actions={actions}
          loading={loading}
          error={error}
          emptyState={
            <EmptyState
              icon={<Building2 className="w-12 h-12 text-slate-600" />}
              title="No se encontraron clientes"
              actionLabel={
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primer Cliente
                </>
              }
              onAction={handleCreateClick}
            />
          }
          title={
            <>
              <FileText className="w-5 h-5 text-primary" />
              Listado de Clientes
            </>
          }
          description={`Total de ${total} clientes registrados`}
          getRowKey={(client) => client.id}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={clientToDelete?.businessName}
        itemType="cliente"
        description={`¿Estás seguro de que deseas eliminar al cliente ${clientToDelete?.businessName}? Esta acción marcará el cliente como inactivo.`}
      />

      {/* Create/Edit Client Dialog */}
      <FormDialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setClientToEdit(null);
          }
        }}
        title={editDialogOpen ? "Editar Cliente" : "Nuevo Cliente"}
        description={
          editDialogOpen
            ? "Actualiza la información del cliente"
            : "Completa la información del nuevo cliente"
        }
        onSubmit={handleFormSubmit}
        loading={formLoading}
        submitLabel={editDialogOpen ? "Actualizar Cliente" : "Crear Cliente"}
        maxWidth="2xl"
        onCancel={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setClientToEdit(null);
        }}
      >
        <FormSection title="Información Comercial">

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
                    placeholder="Ej: Constructora ABC S.A."
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
                  <Label htmlFor="industry" className="text-foreground">
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
                    <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
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
        </FormSection>

        <FormSection title="Información de Contacto">

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
        </FormSection>

        <FormSection title="Ubicación">

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
        </FormSection>

        <FormSection title="Información Adicional">

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
                    placeholder="Observaciones generales del cliente..."
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
                    className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="status"
                    className="text-foreground cursor-pointer"
                  >
                    Cliente Activo
                  </Label>
                </div>
              </div>
        </FormSection>
      </FormDialog>
    </main>
  );
}
