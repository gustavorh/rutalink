"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import { getRoles, deleteRole, createRole, updateRole } from "@/lib/api";
import type {
  Role,
  RoleQueryParams,
  CreateRoleInput,
  UpdateRoleInput,
} from "@/types/roles";
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
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [formData, setFormData] = useState<CreateRoleInput | UpdateRoleInput>({
    name: "",
    description: "",
    permissions: [],
    status: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState("");
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

      const params: RoleQueryParams = {
        page,
        limit,
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
    const user = getUser();
    if (!user) return;
    setFormData({
      name: "",
      description: "",
      permissions: [],
      status: true,
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (role: Role) => {
    setRoleToEdit(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: role.permissions,
      status: role.status,
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
        await updateRole(token, roleToEdit.id, formData as UpdateRoleInput);
        setEditDialogOpen(false);
        setRoleToEdit(null);
      } else {
        await createRole(token, formData as CreateRoleInput);
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
        permissions: permissions.filter((p) => p !== permission),
      });
    } else {
      setFormData({
        ...formData,
        permissions: [...permissions, permission],
      });
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
  if (!user) return null;

  const activeRoles = roles.filter((r) => r.status).length;
  const systemRoles = roles.filter((r) => r.isSystemRole).length;

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Gestión de Roles
            </h1>
            <p className="text-muted-foreground mt-1">
              Administración de roles y permisos
            </p>
          </div>
          <Button
            onClick={handleCreateClick}
            className="bg-primary hover:bg-primary-dark text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Rol
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Roles
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Roles Activos
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {activeRoles}
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
                    Roles del Sistema
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {systemRoles}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Lock className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
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
                          {role.description || "Sin descripción"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-primary/50 text-primary"
                          >
                            {role.permissions.length} permisos
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
                    Mostrando {(page - 1) * limit + 1} a{" "}
                    {Math.min(page * limit, total)} de {total} roles
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
                      disabled={page === totalPages}
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
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              ¿Estás seguro de que deseas eliminar el rol{" "}
              <strong className="text-foreground">{roleToDelete?.name}</strong>?
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

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setRoleToEdit(null);
          }
        }}
      >
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editDialogOpen ? "Editar Rol" : "Nuevo Rol"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editDialogOpen
                ? "Actualiza la información del rol"
                : "Completa la información del nuevo rol"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-4">
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
                  placeholder="Descripción del rol y sus responsabilidades..."
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-foreground mb-3 block">
                  Permisos ({formData.permissions?.length || 0} seleccionados)
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto border border-border rounded-lg p-4 bg-ui-surface-elevated">
                  {PERMISSIONS.map((permission) => (
                    <div
                      key={permission.value}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={permission.value}
                        checked={formData.permissions?.includes(
                          permission.value
                        )}
                        onChange={() => togglePermission(permission.value)}
                        className="rounded border-border bg-ui-surface-elevated text-primary focus:ring-blue-500"
                      />
                      <Label
                        htmlFor={permission.value}
                        className="text-sm text-foreground cursor-pointer"
                      >
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
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
                  Rol Activo
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                  setRoleToEdit(null);
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
                  "Actualizar Rol"
                ) : (
                  "Crear Rol"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
