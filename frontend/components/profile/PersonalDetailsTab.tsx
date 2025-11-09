"use client";

import { useState } from "react";
import type { User, UpdateUserInput } from "@/types/users";

interface PersonalDetailsTabProps {
  user: User;
  onUpdate: (data: UpdateUserInput) => Promise<User | undefined>;
}

export function PersonalDetailsTab({
  user,
  onUpdate,
}: PersonalDetailsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    username: user.username,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Validate required fields
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError("El nombre y apellido son requeridos");
        return;
      }

      if (!formData.email.trim() || !formData.email.includes("@")) {
        setError("Por favor ingresa un email válido");
        return;
      }

      if (!formData.username.trim()) {
        setError("El nombre de usuario es requerido");
        return;
      }

      await onUpdate({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
      });

      setSuccess("Información actualizada correctamente");
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating user:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al actualizar la información"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            Información Personal
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Administra tu información personal y detalles de contacto
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Editar
          </button>
        )}
      </div>

      {/* Personal Information Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nombre
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              className="w-full px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              placeholder="Ingresa tu nombre"
            />
          ) : (
            <p className="px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground">
              {user.firstName}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Apellido
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              className="w-full px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              placeholder="Ingresa tu apellido"
            />
          ) : (
            <p className="px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground">
              {user.lastName}
            </p>
          )}
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Nombre de Usuario
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              className="w-full px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              placeholder="Ingresa tu nombre de usuario"
            />
          ) : (
            <p className="px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground">
              {user.username}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Correo Electrónico
          </label>
          {isEditing ? (
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              placeholder="tu@email.com"
            />
          ) : (
            <p className="px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground">
              {user.email}
            </p>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="border-t border-border pt-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">
          Información de la Cuenta
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Rol
            </label>
            <p className="px-4 py-2 bg-ui-surface border border-border rounded-lg text-muted-foreground">
              {user.role?.name || "No asignado"}
            </p>
          </div>

          {/* Operator */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Operador
            </label>
            <p className="px-4 py-2 bg-ui-surface border border-border rounded-lg text-muted-foreground">
              {user.operator?.name || "No asignado"}
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Estado
            </label>
            <div className="px-4 py-2 bg-ui-surface border border-border rounded-lg">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.status
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {user.status ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>

          {/* Last Activity */}
          {user.lastActivityAt && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Última Actividad
              </label>
              <p className="px-4 py-2 bg-ui-surface border border-border rounded-lg text-muted-foreground">
                {new Date(user.lastActivityAt).toLocaleString("es-ES")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex items-center gap-3 pt-6 border-t border-border">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Guardar Cambios
              </>
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-6 py-2 bg-ui-surface-elevated text-foreground border border-border rounded-lg hover:bg-ui-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
