"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import { getRoles, deleteRole, createRole, updateRole } from "@/lib/api";
import type { Role } from "@/types/roles";
import type {
  RoleCreateDto,
  RoleUpdateDto,
  RoleQueryDto,
} from "@/lib/api-types";
import { PERMISSIONS } from "@/types/roles";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle,
  Filter,
  Lock,
} from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { StatisticsCard } from "@/components/ui/statistics-card";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingState } from "@/components/ui/loading-state";
import { FormDialog } from "@/components/ui/form-dialog";
import { FormSection } from "@/components/ui/form-section";
import { usePagination } from "@/lib/hooks/use-pagination";

export default function RolesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleCreateDto | RoleUpdateDto>({
    name: "",
    permissions: [],
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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const user = getUser();
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const params: RoleQueryDto = {
        page,
        limit: pagination.limit,
      };

      if (search) params.search = search;

      const response = await getRoles(token, params);
      setRoles(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar roles");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    try {
      const token = getToken();
      if (!token) return;
      await deleteRole(token, roleToDelete.id);
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
      fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar rol");
    }
  };

  const handleCreateClick = () => {
    setFormData({
      name: "",
      permissions: [],
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (role: Role) => {
    setRoleToEdit(role);
    setFormData({
      name: role.name,
      permissions: role.permissions || [],
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

      if (editDialogOpen && roleToEdit) {
        await updateRole(token, roleToEdit.id, formData as RoleUpdateDto);
        setEditDialogOpen(false);
        setRoleToEdit(null);
      } else {
        await createRole(token, formData as RoleCreateDto);
        setCreateDialogOpen(false);
      }
      fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar rol");
    } finally {
      setFormLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    const permissions = formData.permissions || [];
    if (permissions.includes(permission)) {
      setFormData({
        ...formData,
        permissions: permissions.filter((p: string) => p !== permission),
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...permissions, permission],
      });
    }
  };

  if (!mounted) {
    return <LoadingState />;
  }

  const user = getUser();
  if (!user) return null;

  const activeRoles = roles.filter((r) => r.status).length;
  const systemRoles = roles.filter((r) => r.isSystemRole).length;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <PageHeader
          title="Gestión de Roles"
          description="Administración de roles y permisos"
          icon={<Shield className="w-6 h-6" />}
          actionLabel={
            <>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Rol
            </>
          }
          onAction={handleCreateClick}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatisticsCard
            value={total}
            label="Total Roles"
            icon={<Shield className="w-6 h-6" />}
            iconBgColor="bg-primary/10"
            iconColor="text-primary"
          />
          <StatisticsCard
            value={activeRoles}
            label="Roles Activos"
            icon={<CheckCircle className="w-6 h-6" />}
            iconBgColor="bg-success/10"
            iconColor="text-success"
          />
          <StatisticsCard
            value={systemRoles}
            label="Roles del Sistema"
            icon={<Lock className="w-6 h-6" />}
            iconBgColor="bg-orange-500/10"
            iconColor="text-orange-400"
          />
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o descripción..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchRoles()}
                  className="pl-10 bg-ui-surface-elevated border-border text-foreground"
                />
              </div>
              <Button
                onClick={fetchRoles}
                className="bg-primary hover:bg-primary-dark"
              >
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Listado de Roles</CardTitle>
            <CardDescription className="text-muted-foreground">
              Total de {total} roles registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-muted-foreground mt-4">Cargando roles...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">{error}</p>
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron roles</p>
                <Button
                  onClick={handleCreateClick}
                  className="mt-4 bg-primary hover:bg-primary-dark"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primer Rol
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Nombre
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Descripción
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Permisos
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
                    {roles.map((role) => (
                      <TableRow
                        key={role.id}
                        className="border-b border-border hover:bg-ui-surface-elevated"
                      >
                        <TableCell className="font-medium text-foreground">
                          {role.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                          ID: {role.id} | Operator: {role.operatorId}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-primary/50 text-primary"
                          >
                            {role.permissions?.length || 0} permisos
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {role.isSystemRole ? (
                            <Badge
                              variant="outline"
                              className="border-orange-500/50 text-orange-400"
                            >
                              Sistema
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-blue-500/50 text-blue-400"
                            >
                              Personalizado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={role.status ? "default" : "outline"}
                            className={
                              role.status
                                ? "bg-success/10 text-success border-success/50"
                                : "border-slate-500/50 text-muted-foreground"
                            }
                          >
                            {role.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(role)}
                              className="text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                              disabled={role.isSystemRole}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(role)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              disabled={role.isSystemRole}
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

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    de {pagination.total} roles
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="border-border text-foreground hover:bg-ui-surface-elevated"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="border-border text-foreground hover:bg-ui-surface-elevated"
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

      {/* Delete Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        itemName={roleToDelete?.name}
        itemType="rol"
      />

      {/* Create/Edit Dialog */}
      <FormDialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setRoleToEdit(null);
          }
        }}
        title={editDialogOpen ? "Editar Rol" : "Nuevo Rol"}
        description={
          editDialogOpen
            ? "Actualiza la información del rol"
            : "Completa la información del nuevo rol"
        }
        onSubmit={handleFormSubmit}
        loading={formLoading}
        submitLabel={editDialogOpen ? "Actualizar Rol" : "Crear Rol"}
        maxWidth="4xl"
        onCancel={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setRoleToEdit(null);
        }}
      >
        <FormSection title="Información del Rol">
          <div>
            <Label htmlFor="name" className="text-foreground">
              Nombre del Rol *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="bg-ui-surface-elevated border-border text-foreground mt-1"
              placeholder="Ej: Administrador de Operaciones"
            />
          </div>

          <div>
            <Label className="text-foreground mb-3 block">
              Permisos ({formData.permissions?.length || 0} seleccionados)
            </Label>
            <div className="max-h-[400px] overflow-auto border border-border rounded-lg bg-ui-surface-elevated">
              <table className="w-full">
                <thead className="bg-ui-surface-elevated">
                  <tr className="border-b border-border">
                    <th className="sticky top-0 bg-ui-surface-elevated text-left px-4 py-3 text-foreground font-semibold z-10 border-b border-border">
                      Recurso
                    </th>
                    <th className="sticky top-0 bg-ui-surface-elevated text-center px-4 py-3 text-foreground font-semibold z-10 border-b border-border">
                      Ver
                    </th>
                    <th className="sticky top-0 bg-ui-surface-elevated text-center px-4 py-3 text-foreground font-semibold z-10 border-b border-border">
                      Crear
                    </th>
                    <th className="sticky top-0 bg-ui-surface-elevated text-center px-4 py-3 text-foreground font-semibold z-10 border-b border-border">
                      Actualizar
                    </th>
                    <th className="sticky top-0 bg-ui-surface-elevated text-center px-4 py-3 text-foreground font-semibold z-10 border-b border-border">
                      Eliminar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: "users", label: "Usuarios" },
                    { key: "roles", label: "Roles" },
                    { key: "clients", label: "Clientes" },
                    { key: "drivers", label: "Choferes" },
                    { key: "vehicles", label: "Vehículos" },
                    { key: "operations", label: "Operaciones" },
                    { key: "routes", label: "Rutas" },
                    { key: "providers", label: "Proveedores" },
                    { key: "reports", label: "Reportes" },
                    { key: "analytics", label: "Analíticas" },
                  ].map((resource) => {
                    const hasRead = PERMISSIONS.find(
                      (p) => p.value === `${resource.key}.read`
                    );
                    const hasCreate = PERMISSIONS.find(
                      (p) => p.value === `${resource.key}.create`
                    );
                    const hasUpdate = PERMISSIONS.find(
                      (p) => p.value === `${resource.key}.update`
                    );
                    const hasDelete = PERMISSIONS.find(
                      (p) => p.value === `${resource.key}.delete`
                    );

                    return (
                      <tr
                        key={resource.key}
                        className="border-b border-border hover:bg-ui-surface-elevated/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {resource.label}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasRead && (
                            <input
                              type="checkbox"
                              id={`${resource.key}.read`}
                              checked={formData.permissions?.includes(
                                `${resource.key}.read`
                              )}
                              onChange={() =>
                                togglePermission(`${resource.key}.read`)
                              }
                              className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-primary focus:ring-offset-0 w-4 h-4 cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasCreate && (
                            <input
                              type="checkbox"
                              id={`${resource.key}.create`}
                              checked={formData.permissions?.includes(
                                `${resource.key}.create`
                              )}
                              onChange={() =>
                                togglePermission(`${resource.key}.create`)
                              }
                              className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-primary focus:ring-offset-0 w-4 h-4 cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasUpdate && (
                            <input
                              type="checkbox"
                              id={`${resource.key}.update`}
                              checked={formData.permissions?.includes(
                                `${resource.key}.update`
                              )}
                              onChange={() =>
                                togglePermission(`${resource.key}.update`)
                              }
                              className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-primary focus:ring-offset-0 w-4 h-4 cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasDelete && (
                            <input
                              type="checkbox"
                              id={`${resource.key}.delete`}
                              checked={formData.permissions?.includes(
                                `${resource.key}.delete`
                              )}
                              onChange={() =>
                                togglePermission(`${resource.key}.delete`)
                              }
                              className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-primary focus:ring-offset-0 w-4 h-4 cursor-pointer"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Los permisos se almacenan en la tabla de grants y roleGrants
            </p>
          </div>
        </FormSection>
      </FormDialog>
    </main>
  );
}
