"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";
import {
  getUsers,
  deleteUser,
  createUser,
  updateUser,
  getRoles,
} from "@/lib/api";
import type { User } from "@/types/users";
import type {
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from "@/lib/api-types";
import type { Role } from "@/types/roles";
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
} from "lucide-react";
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
  const [formData, setFormData] = useState<CreateUserDto | UpdateUserDto>({
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

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setMounted(true);
    fetchUsers();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const user = getUser();
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const params: UserQueryDto = {
        page,
        limit: pagination.limit,
      };

      if (search) params.search = search;

      const response = await getUsers(token, params);
      setUsers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = getToken();
      const user = getUser();
      if (!token || !user) return;

      const response = await getRoles(token, {
        status: true,
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
      const token = getToken();
      if (!token) return;
      await deleteUser(token, userToDelete.id);
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
    const token = getToken();
    const user = getUser();
    if (!token || !user) return;

    try {
      setFormLoading(true);
      setError(null);

      if (editDialogOpen && userToEdit) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...updateData } = formData as CreateUserDto;
        await updateUser(token, userToEdit.id, updateData as UpdateUserDto);
        setEditDialogOpen(false);
        setUserToEdit(null);
      } else {
        await createUser(token, formData as CreateUserDto);
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
                  placeholder="Buscar por nombre, email, usuario..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                  className="pl-10 bg-ui-surface-elevated border-border text-foreground"
                />
              </div>
              <Button
                onClick={fetchUsers}
                className="bg-primary hover:bg-primary-dark"
              >
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Listado de Usuarios
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Total de {total} usuarios registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-muted-foreground mt-4">
                  Cargando usuarios...
                </p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">{error}</p>
              </div>
            ) : users.length === 0 ? (
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
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground">
                        Nombre
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Usuario
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Email
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        Rol
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
                    {users.map((u) => (
                      <TableRow
                        key={u.id}
                        className="border-b border-border hover:bg-ui-surface-elevated"
                      >
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {u.firstName} {u.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {u.id}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {u.username}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-primary/50 text-primary"
                          >
                            {u.role?.name || "Sin rol"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={u.status ? "default" : "outline"}
                            className={
                              u.status
                                ? "bg-success/10 text-success border-success/50"
                                : "border-slate-500/50 text-muted-foreground"
                            }
                          >
                            {u.status ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                router.push(`/administration/users/${u.id}`)
                              }
                              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(u)}
                              className="text-muted-foreground hover:text-secondary hover:bg-secondary/10"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(u)}
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

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    de {pagination.total} usuarios
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
                  value={(formData as CreateUserDto).password}
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
