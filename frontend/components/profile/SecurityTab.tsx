"use client";

import { useState } from "react";
import type { User } from "@/types/users";
import type { UpdateUserDto } from "@/lib/api-types";

interface SecurityTabProps {
  user: User;
  onUpdate: (data: UpdateUserDto) => Promise<User | undefined>;
}

export function SecurityTab({ user, onUpdate }: SecurityTabProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSavePassword = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Validate passwords
      if (!passwordData.newPassword || !passwordData.confirmPassword) {
        setError("Por favor completa todos los campos");
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }

      await onUpdate({
        password: passwordData.newPassword,
      });

      setSuccess("Contraseña actualizada correctamente");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating password:", err);
      setError(
        err instanceof Error ? err.message : "Error al actualizar la contraseña"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsChangingPassword(false);
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

      {/* Password Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground">
              Contraseña
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Actualiza tu contraseña para mantener tu cuenta segura
            </p>
          </div>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
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
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              Cambiar Contraseña
            </button>
          )}
        </div>

        {isChangingPassword ? (
          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Contraseña Actual
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  handlePasswordChange("currentPassword", e.target.value)
                }
                className="w-full px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                placeholder="Ingresa tu contraseña actual"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  handlePasswordChange("newPassword", e.target.value)
                }
                className="w-full px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                placeholder="Ingresa tu nueva contraseña"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mínimo 6 caracteres
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  handlePasswordChange("confirmPassword", e.target.value)
                }
                className="w-full px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                placeholder="Confirma tu nueva contraseña"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSavePassword}
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
                    Actualizar Contraseña
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
          </div>
        ) : (
          <div className="px-4 py-3 bg-ui-surface border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">••••••••••••</p>
          </div>
        )}
      </div>

      {/* Security Recommendations */}
      <div className="border-t border-border pt-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">
          Recomendaciones de Seguridad
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-ui-surface rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h5 className="font-medium text-foreground">
                Usa una contraseña segura
              </h5>
              <p className="text-sm text-muted-foreground mt-1">
                Combina letras mayúsculas, minúsculas, números y símbolos
                especiales.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-ui-surface rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h5 className="font-medium text-foreground">
                Cambia tu contraseña regularmente
              </h5>
              <p className="text-sm text-muted-foreground mt-1">
                Se recomienda actualizar tu contraseña cada 3-6 meses.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-ui-surface rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h5 className="font-medium text-foreground">
                No compartas tu contraseña
              </h5>
              <p className="text-sm text-muted-foreground mt-1">
                Mantén tu contraseña privada y no la compartas con nadie.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Session Information */}
      <div className="border-t border-border pt-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">
          Información de Sesión
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-ui-surface rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Última Actividad
                </p>
                <p className="font-medium text-foreground">
                  {user.lastActivityAt
                    ? new Date(user.lastActivityAt).toLocaleString("es-ES")
                    : "No disponible"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-ui-surface rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Miembro desde</p>
                <p className="font-medium text-foreground">
                  {new Date(user.createdAt).toLocaleDateString("es-ES")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
