"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUser } from "@/lib/auth";
import { api } from "@/lib/client-api";
import type { User } from "@/types/users";
import type {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from "@/lib/api-types";
import type { Role } from "@/types/roles";

// Form data type that includes all fields used in the form
interface UserFormData {
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  operatorId?: number;
  roleId?: number;
  status?: boolean;
}
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Users as UsersIcon,
  AlertTriangle,
  Filter,
  UserCheck,
  FileText,
} from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
  type DataTableAction,
  type DataTableFilter,
} from "@/components/ui/data-table";
import { useFilters } from "@/lib/hooks/use-filters";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { StatisticsCard } from "@/components/ui/statistics-card";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormSection } from "@/components/ui/form-section";
import { usePagination } from "@/lib/hooks/use-pagination";

export default function UsersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    status: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
  const {
    page,
    setPage,
    total,
    setTotal,
    totalPages,
    setTotalPages,
    pagination,
  } = usePagination({ initialLimit: 10 });
  const {
    filters: filterState,
    setFilter,
    showFilters,
    toggleFilters,
    clearFilters: clearAllFilters,
  } = useFilters({
    initialFilters: {
      status: "all",
    },
  });

  // Last update timestamp
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchUsers();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterState.status]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const params: UserQueryDto = {
        page,
        limit: pagination.limit,
      };

      if (search) params.search = search;
      if (filterState.status !== "all")
        params.status = filterState.status === "active" ? true : false;

      const response = await api.users.list(params);
      setUsers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const user = getUser();
      if (!user) return;

      const response = await api.roles.list({
        limit: 100,
      });
      setRoles(response.data);
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      await api.users.delete(userToDelete.id);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar usuario"
      );
    }
  };

  const handleCreateClick = () => {
    const user = getUser();
    if (!user) return;
    setFormData({
      operatorId: user.operatorId, // Add operatorId from current user
      roleId: roles[0]?.id || 0,
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      status: true,
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (user: User) => {
    setUserToEdit(user);
    setFormData({
      roleId: user.roleId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
    });
    setEditDialogOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getUser();
    if (!user) return;

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && userToEdit) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, username, ...updateData } = formData;
        await api.users.update(userToEdit.id, updateData as UpdateUserDto);
        setEditDialogOpen(false);
        setUserToEdit(null);
      } else {
        await api.users.create(formData as unknown as CreateUserDto);
        setCreateDialogOpen(false);
      }
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar usuario");
    } finally {
      setFormLoading(false);
    }
  };

  if (!mounted) {
    return <LoadingState />;
  }

  const user = getUser();
  if (!user) return null;

  const activeUsers = users?.filter((u) => u.status).length ?? 0;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <PageHeader
          title="Gestión de Usuarios"
          description="Administración de usuarios de la organización"
          icon={<UsersIcon className="w-6 h-6" />}
          actionLabel={
            <>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </>
          }
          onAction={handleCreateClick}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatisticsCard
            value={total}
            label="Total Usuarios"
            icon={<UsersIcon className="w-6 h-6" />}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
          />
          <StatisticsCard
            value={activeUsers}
            label="Usuarios Activos"
            icon={<UserCheck className="w-6 h-6" />}
            iconBgColor="bg-success/10"
            iconColor="text-success"
          />
        </div>

        {(() => {
          // Define table columns
          const columns: DataTableColumn<User>[] = [
            {
              key: "name",
              header: "Nombre",
              accessor: (user) => (
                <div>
                  <div className="font-medium text-foreground">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ID: {user.id}
                  </div>
                </div>
              ),
            },
            {
              key: "username",
              header: "Usuario",
              accessor: (user) => (
                <span className="text-foreground">{user.username}</span>
              ),
            },
            {
              key: "email",
              header: "Email",
              accessor: (user) => (
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
              ),
            },
            {
              key: "role",
              header: "Rol",
              accessor: (user) => (
                <Badge
                  variant="outline"
                  className="border-primary/50 text-primary"
                >
                  {user.role?.name || "Sin rol"}
                </Badge>
              ),
            },
            {
              key: "status",
              header: "Estado",
              accessor: (user) => (
                <Badge
                  variant={user.status ? "default" : "outline"}
                  className={
                    user.status
                      ? "bg-success/10 text-success border-success/50"
                      : "border-slate-500/50 text-muted-foreground"
                  }
                >
                  {user.status ? "Activo" : "Inactivo"}
                </Badge>
              ),
            },
          ];

          // Define table actions
          const actions: DataTableAction<User>[] = [
            {
              label: "Ver detalles",
              icon: <Eye className="h-4 w-4" />,
              onClick: (user) =>
                router.push(`/administration/users/${user.id}`),
              className:
                "text-muted-foreground hover:text-primary hover:bg-primary/10",
              title: "Ver detalles",
            },
            {
              label: "Editar",
              icon: <Edit className="h-4 w-4" />,
              onClick: handleEditClick,
              className:
                "text-muted-foreground hover:text-secondary hover:bg-secondary/10",
              title: "Editar",
            },
            {
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: handleDeleteClick,
              className:
                "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
              title: "Eliminar",
            },
          ];

          const handleSearch = () => {
            setPage(1);
            fetchUsers();
          };

          const handleClearFilters = () => {
            setSearch("");
            clearAllFilters();
            setPage(1);
          };

          // Define filters
          const filters: DataTableFilter[] = [
            {
              id: "status-filter",
              label: "Estado",
              type: "select",
              value: filterState.status,
              onChange: (value) => setFilter("status", value),
              options: [
                { value: "all", label: "Todos los estados" },
                { value: "active", label: "Activo" },
                { value: "inactive", label: "Inactivo" },
              ],
              ariaLabel: "Filtrar por estado del usuario",
            },
          ];

          return (
            <DataTable
              data={users}
              columns={columns}
              pagination={pagination}
              onPageChange={setPage}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar por nombre, email, usuario..."
              onSearchSubmit={handleSearch}
              filters={filters}
              showFilters={showFilters}
              onToggleFilters={toggleFilters}
              onClearFilters={handleClearFilters}
              actions={actions}
              loading={loading}
              error={error}
              lastUpdate={lastUpdate}
              onRefresh={fetchUsers}
              onExport={() => {
                /* TODO: Implement export functionality */
              }}
              title="Listado de Usuarios"
              description={`Total de ${total} usuarios registrados`}
              icon={<FileText className="w-5 h-5 text-primary" />}
              getRowKey={(user) => user.id}
              emptyState={
                <div className="text-center py-12">
                  <UsersIcon className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No se encontraron usuarios
                  </p>
                  <Button
                    onClick={handleCreateClick}
                    className="mt-4 bg-primary hover:bg-primary-dark"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Primer Usuario
                  </Button>
                </div>
              }
            />
          );
        })()}
      </div>

      {/* Delete Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={
          userToDelete
            ? `${userToDelete.firstName} ${userToDelete.lastName}`
            : undefined
        }
        itemType="usuario"
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setUserToEdit(null);
          }
        }}
        title={editDialogOpen ? "Editar Usuario" : "Nuevo Usuario"}
        description={
          editDialogOpen
            ? "Actualiza la información del usuario"
            : "Completa la información del nuevo usuario"
        }
        onSubmit={handleFormSubmit}
        loading={formLoading}
        submitLabel={editDialogOpen ? "Actualizar Usuario" : "Crear Usuario"}
        maxWidth="2xl"
        onCancel={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setUserToEdit(null);
        }}
      >
        <FormSection title="Información del Usuario">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-foreground">
                Nombre *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-foreground">
                Apellido *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label htmlFor="username" className="text-foreground">
                Usuario *
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-foreground">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="bg-ui-surface-elevated border-border text-foreground mt-1"
              />
            </div>
            {!editDialogOpen && (
              <div className="col-span-2">
                <Label htmlFor="password" className="text-foreground">
                  Contraseña *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="bg-ui-surface-elevated border-border text-foreground mt-1"
                />
              </div>
            )}
            <div className="col-span-2">
              <Label htmlFor="roleId" className="text-foreground">
                Rol *
              </Label>
              <Select
                value={formData.roleId?.toString() || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, roleId: parseInt(value) })
                }
              >
                <SelectTrigger className="bg-ui-surface-elevated border-border text-foreground mt-1">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                Usuario Activo
              </Label>
            </div>
          </div>
        </FormSection>
      </FormDialog>
    </main>
  );
}
