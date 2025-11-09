"use client";

import { useState } from "react";
import type { User } from "@/types/users";

interface HelpTabProps {
  user: User;
}

export function HelpTab({ user }: HelpTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [supportRequest, setSupportRequest] = useState({
    category: "general",
    subject: "",
    message: "",
  });

  const categories = [
    { id: "general", label: "Consulta General", icon: "💬" },
    { id: "technical", label: "Soporte Técnico", icon: "🔧" },
    { id: "account", label: "Problemas de Cuenta", icon: "👤" },
    { id: "billing", label: "Facturación", icon: "💳" },
    { id: "feature", label: "Solicitud de Funcionalidad", icon: "✨" },
    { id: "bug", label: "Reportar un Error", icon: "🐛" },
  ];

  const faqs = [
    {
      question: "¿Cómo cambio mi contraseña?",
      answer:
        'Ve a la pestaña "Seguridad" en tu perfil y haz clic en "Cambiar Contraseña". Ingresa tu nueva contraseña y confirma los cambios.',
    },
    {
      question: "¿Cómo actualizo mi información personal?",
      answer:
        'En la pestaña "Detalles Personales", haz clic en el botón "Editar", modifica tu información y guarda los cambios.',
    },
    {
      question: "¿Qué hago si olvido mi contraseña?",
      answer:
        'Utiliza la opción "¿Olvidaste tu contraseña?" en la página de inicio de sesión para recibir un enlace de recuperación en tu correo electrónico.',
    },
    {
      question: "¿Cómo puedo ver mi historial de actividades?",
      answer:
        "Tu administrador puede consultar el historial completo de actividades desde el panel de administración de usuarios.",
    },
    {
      question: "¿Puedo cambiar mi nombre de usuario?",
      answer:
        "Sí, puedes cambiar tu nombre de usuario desde la pestaña de Detalles Personales. Asegúrate de que el nuevo nombre no esté en uso.",
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setSupportRequest((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      // Validate form
      if (!supportRequest.subject.trim()) {
        setError("Por favor ingresa un asunto");
        return;
      }

      if (!supportRequest.message.trim()) {
        setError("Por favor describe tu consulta");
        return;
      }

      // TODO: Implement actual API call to submit support request
      // For now, we'll simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(
        "¡Solicitud enviada con éxito! Nos pondremos en contacto contigo pronto."
      );
      setSupportRequest({
        category: "general",
        subject: "",
        message: "",
      });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Error submitting request:", err);
      setError("Error al enviar la solicitud. Por favor intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Centro de Ayuda
        </h3>
        <p className="text-sm text-muted-foreground">
          Encuentra respuestas a tus preguntas o contáctanos para soporte
        </p>
      </div>

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

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="mailto:support@example.com"
          className="p-4 bg-ui-surface border border-border rounded-lg hover:bg-ui-surface-hover transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-foreground">Email</h4>
              <p className="text-sm text-muted-foreground">
                ayuda@helpdesk.bilix.cl
              </p>
            </div>
          </div>
        </a>

        <div className="p-4 bg-ui-surface border border-border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary"
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
              <h4 className="font-medium text-foreground">Horario</h4>
              <p className="text-sm text-muted-foreground">Lun - Vie 9am-6pm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Request Form */}
      <div className="border-t border-border pt-8">
        <h4 className="text-lg font-semibold text-foreground mb-4">
          Solicitar Soporte
        </h4>
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Categoría
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    handleInputChange("category", category.id);
                  }}
                  className={`p-3 rounded-lg border transition-colors text-left ${
                    supportRequest.category === category.id
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-ui-surface border-border text-foreground hover:bg-ui-surface-hover"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm font-medium">
                      {category.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Asunto
            </label>
            <input
              type="text"
              value={supportRequest.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              className="w-full px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
              placeholder="Describe brevemente tu consulta"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Mensaje
            </label>
            <textarea
              value={supportRequest.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              className="w-full px-4 py-2 bg-ui-surface border border-border rounded-lg text-foreground focus:outline-none focus:border-primary resize-none"
              rows={6}
              placeholder="Proporciona más detalles sobre tu consulta..."
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Enviar Solicitud
              </>
            )}
          </button>
        </form>
      </div>

      {/* FAQs */}
      <div className="border-t border-border pt-8">
        <h4 className="text-lg font-semibold text-foreground mb-4">
          Preguntas Frecuentes
        </h4>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-ui-surface border border-border rounded-lg overflow-hidden"
            >
              <summary className="px-4 py-3 cursor-pointer hover:bg-ui-surface-hover transition-colors flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {faq.question}
                </span>
                <svg
                  className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="px-4 py-3 border-t border-border bg-ui-surface">
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* User Information for Support */}
      <div className="border-t border-border pt-8">
        <h4 className="text-lg font-semibold text-foreground mb-4">
          Tu Información de Cuenta
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-ui-surface rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">ID de Usuario</p>
            <p className="font-mono text-sm text-foreground">#{user.id}</p>
          </div>
          <div className="p-4 bg-ui-surface rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <p className="text-sm text-foreground">{user.email}</p>
          </div>
          <div className="p-4 bg-ui-surface rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Operador</p>
            <p className="text-sm text-foreground">
              {user.operator?.name || "No asignado"}
            </p>
          </div>
          <div className="p-4 bg-ui-surface rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Rol</p>
            <p className="text-sm text-foreground">
              {user.role?.name || "No asignado"}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Esta información puede ser útil al contactar con soporte técnico.
        </p>
      </div>
    </div>
  );
}
