"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/client-api";
import Link from "next/dist/client/link";

// Form validation schema
const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState<string | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Check for session expiration message
  useEffect(() => {
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
    if (redirectPath) {
      setSessionExpiredMsg(
        "Tu sesión ha expirado por inactividad. Por favor inicia sesión nuevamente."
      );
    }

    // Clear the message after 10 seconds
    const timer = setTimeout(() => {
      setSessionExpiredMsg(null);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.auth.login(data);

      // Authentication is now handled via HTTP-only cookies
      // User info is stored in a non-HTTP-only cookie for UI access

      // Check if there's a redirect path stored from session expiration
      const redirectPath = sessionStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        sessionStorage.removeItem("redirectAfterLogin");
        router.push(redirectPath);
      } else {
        // Redirect to dashboard or home
        router.push("/dashboard");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Usuario o contraseña inválidos");
        } else if (err.status === 0) {
          setError(
            "No se puede conectar al servidor. Por favor intenta más tarde."
          );
        } else {
          setError(
            err.message || "Ocurrió un error durante el inicio de sesión"
          );
        }
      } else {
        setError("Ocurrió un error inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
        <div
          className="absolute inset-0 bg-[url('/api/placeholder/800/1200')] bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #1e293b 0%, #334155 50%, #1e293b 100%)",
          }}
        ></div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-bilix.png"
              alt="RutaLink Logo"
              width={40}
              height={40}
              className="brightness-0 invert"
            />
            <span className="text-2xl font-bold">RutaLink</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              Gestiona tu flota
              <br />
              con confianza
            </h1>
            <p className="text-slate-300 text-lg">
              Plataforma completa de logística para transporte moderno
            </p>
          </div>
          <div className="text-sm text-slate-400 text-center">
            ©{" "}
            <Link
              href="https://www.bilix.cl/"
              className="font-bold text-slate-300 underline hover:text-white transition-colors"
            >
              Bilix Ingeniería
            </Link>{" "}
            | {new Date().getFullYear()}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Image
              src="/logo-bilix.png"
              alt="RutaLink Logo"
              width={40}
              height={40}
            />
            <span className="text-2xl font-bold text-slate-900">RutaLink</span>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <p className="text-sm text-slate-600 uppercase tracking-wide">
              RutaLink
            </p>
            <p className="text-xs text-slate-500">
              Plataforma de Gestión de Flotas
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-4xl font-normal text-slate-900">
              Bienvenido, inicia sesión
            </h2>
            <h2 className="text-4xl font-normal text-slate-900">
              en tu cuenta.
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {sessionExpiredMsg && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">{sessionExpiredMsg}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm text-slate-700">
                Nombre de Usuario o Correo Electrónico:
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="nombre@dominio.com"
                disabled={isLoading}
                {...register("username")}
                className={`h-12 bg-slate-50 border-slate-200 rounded-full px-6 placeholder:text-slate-400 ${
                  errors.username ? "border-red-500" : ""
                }`}
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-slate-700">
                Contraseña:
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                disabled={isLoading}
                {...register("password")}
                className={`h-12 bg-slate-50 border-slate-200 rounded-full px-6 placeholder:text-slate-400 ${
                  errors.password ? "border-red-500" : ""
                }`}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-medium"
              >
                {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
              <a
                href="/forgot-password"
                className="text-sm text-slate-600 hover:text-slate-900 underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>

          {/* Footer Link 
          <div className="pt-6 text-center text-sm text-slate-500">
            www.rutalink.com
          </div>
          */}
        </div>
      </div>
    </div>
  );
}
