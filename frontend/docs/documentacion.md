# Documentación Técnica - RutaLink Frontend

## Tabla de Contenidos

1. [Arquitectura de la Aplicación](#arquitectura-de-la-aplicación)
2. [Patrones de Diseño Utilizados](#patrones-de-diseño-utilizados)
3. [Comunicación con el Backend](#comunicación-con-el-backend)
4. [Flujo de Peticiones](#flujo-de-peticiones)
5. [Middleware](#middleware)

---

## Arquitectura de la Aplicación

### Visión General

RutaLink Frontend es una aplicación construida con **Next.js 15** utilizando el **App Router**, diseñada como una plataforma de gestión de flotas de transporte. La aplicación implementa una arquitectura moderna con separación clara de responsabilidades y comunicación segura con el backend.

### Estructura de Directorios

```
frontend/
├── app/                          # Rutas y páginas (App Router)
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   ├── login/
│   │   └── register/
│   ├── (main)/                   # Grupo de rutas protegidas
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── drivers/
│   │   ├── trucks/
│   │   ├── operations/
│   │   ├── routes/
│   │   ├── providers/
│   │   ├── administration/
│   │   └── profile/
│   ├── api/                      # API Routes (BFF)
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── drivers/
│   │   ├── operations/
│   │   └── ...
│   └── layout.tsx                # Layout raíz
├── components/                   # Componentes React
│   ├── dashboard/                # Componentes del dashboard
│   ├── profile/                  # Componentes del perfil
│   ├── providers/                # Context providers
│   └── ui/                       # Componentes UI reutilizables
├── lib/                          # Utilidades y lógica compartida
│   ├── api.ts                    # Cliente API para SSR
│   ├── client-api.ts             # Cliente API para cliente
│   ├── api-types.ts              # Definiciones de tipos (DTOs)
│   ├── auth.ts                   # Utilidades de autenticación
│   ├── error-handler.ts          # Manejo global de errores
│   ├── server-api-utils.ts       # Utilidades para API routes
│   └── hooks/                    # Custom hooks
├── types/                        # Definiciones de tipos TypeScript
└── middleware.ts                 # Middleware de Next.js
```

### Grupos de Rutas (Route Groups)

La aplicación utiliza **Route Groups** de Next.js para organizar las rutas:

#### Grupo `(auth)`
Contiene las páginas de autenticación (login y registro). Estas rutas son públicas y accesibles sin autenticación.

#### Grupo `(main)`
Contiene todas las rutas protegidas de la aplicación. Este grupo comparte un layout común que incluye:
- Barra lateral de navegación (Sidebar)
- Encabezado con información del usuario
- Pie de página

### Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    Capa de Presentación                      │
│  (Componentes React, Páginas, Layouts)                       │
├─────────────────────────────────────────────────────────────┤
│                    Capa de Estado                            │
│  (Context API - AuthProvider, Custom Hooks)                  │
├─────────────────────────────────────────────────────────────┤
│                    Capa de Servicios                         │
│  (client-api.ts, api.ts, server-api-utils.ts)               │
├─────────────────────────────────────────────────────────────┤
│                    API Routes (BFF)                          │
│  (Next.js API Routes como proxy al backend)                  │
├─────────────────────────────────────────────────────────────┤
│                    Backend (NestJS)                          │
│  (API REST externa)                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Patrones de Diseño Utilizados

### 1. Backend For Frontend (BFF) Pattern

La aplicación implementa el patrón **BFF** utilizando las API Routes de Next.js como intermediario entre el cliente y el backend real.

**Ventajas:**
- El token de autenticación se almacena en cookies HTTP-only (no accesible desde JavaScript)
- El backend interno no está expuesto directamente al cliente
- Permite transformar las respuestas del backend antes de enviarlas al cliente
- Facilita el cacheo de respuestas a nivel de servidor

**Implementación:**

```typescript
// app/api/clients/route.ts
export async function GET(request: NextRequest) {
  try {
    const response = await proxyRequest(`/api/clients?${params}`);
    const backendData = await response.json();
    
    // Transformación de datos
    if (backendData.success && backendData.data) {
      return NextResponse.json({
        data: backendData.data.items,
        pagination: backendData.data.pagination,
      });
    }
    
    return NextResponse.json(backendData);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 2. Proxy Pattern

Las API Routes actúan como **proxies** que reenvían las peticiones al backend, agregando autenticación y transformando respuestas.

**Implementación (`server-api-utils.ts`):**

```typescript
export async function proxyRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeaders();
  const url = `${INTERNAL_API_URL}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}
```

### 3. Context Pattern (Provider Pattern)

Se utiliza el **Context API** de React para manejar el estado de autenticación global.

**Implementación (`auth-provider.tsx`):**

```typescript
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ... lógica de autenticación

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

### 4. Custom Hooks Pattern

Se utilizan **custom hooks** para encapsular lógica reutilizable de fetching y manejo de estado.

**Hooks disponibles:**
- `useApi`: Fetching de datos con caché y deduplicación
- `useFilters`: Manejo de filtros de búsqueda
- `usePagination`: Manejo de paginación

**Ejemplo (`use-api.ts`):**

```typescript
export function useApi<T, P = void>(
  fetcher: (params: P) => Promise<T>,
  params: P,
  options: UseApiOptions<T> = {}
): UseApiReturn<T, P> {
  // Implementación con:
  // - Caché de datos
  // - Deduplicación de peticiones
  // - Revalidación al enfocar la ventana
  // - Manejo de estados de carga y error
}
```

### 5. DTO Pattern (Data Transfer Objects)

Se utilizan **DTOs** tipados en TypeScript para garantizar la consistencia de datos entre frontend y backend.

**Ubicación:** `lib/api-types.ts`

```typescript
export interface CreateClientDto {
  operatorId: number;
  businessName: string;
  taxId?: string;
  contactName?: string;
  // ... más campos
}

export interface UpdateClientDto {
  businessName?: string;
  taxId?: string;
  // ... campos opcionales para actualización
}
```

### 6. Repository/Service Pattern (Abstracción de API)

La clase `ClientApi` en `client-api.ts` encapsula todas las operaciones de API en módulos organizados por entidad.

```typescript
class ClientApi {
  clients = {
    list: (params?: ClientQueryDto) => this.request<PaginatedClients>(`/clients?...`),
    get: (id: number) => this.request<Client>(`/clients/${id}`),
    create: (data: CreateClientDto) => this.request<Client>("/clients", { method: "POST", ... }),
    update: (id: number, data: UpdateClientDto) => this.request<Client>(`/clients/${id}`, { method: "PUT", ... }),
    delete: (id: number) => this.request<{ message: string }>(`/clients/${id}`, { method: "DELETE" }),
  };

  drivers = { /* ... */ };
  operations = { /* ... */ };
  // ... más entidades
}

export const api = new ClientApi();
```

### 7. Error Boundary Pattern

Se implementa un manejo centralizado de errores con funciones específicas para diferentes tipos de error.

**Implementación (`error-handler.ts`):**

```typescript
export function handleApiError(error: unknown): void {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      handleSessionExpired();
      return;
    }
    console.error(`API Error (${error.status}):`, error.message);
  }
}

export function handleSessionExpired(): void {
  clearAuth();
  sessionStorage.setItem("redirectAfterLogin", currentPath);
  window.location.href = "/login";
}
```

---

## Comunicación con el Backend

### Arquitectura de Comunicación

La comunicación con el backend sigue una arquitectura de **dos capas**:

```
┌──────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Cliente    │───▶│  Next.js API     │───▶│   Backend   │
│  (Browser)   │    │  Routes (BFF)    │    │  (NestJS)   │
└──────────────┘    └──────────────────┘    └─────────────┘
       │                     │                      │
       │  fetch /api/...     │  fetch INTERNAL_URL  │
       │  (con cookies)      │  (con Bearer token)  │
```

### Clientes API

#### 1. Cliente para uso en el navegador (`client-api.ts`)

Se utiliza desde componentes del cliente (Client Components) para hacer peticiones a las API Routes de Next.js.

```typescript
import { api } from "@/lib/client-api";

// Uso en un componente
const clients = await api.clients.list({ page: 1, limit: 10 });
const client = await api.clients.get(1);
await api.clients.create({ businessName: "Empresa X", operatorId: 1 });
```

**Características:**
- Hace peticiones a `/api/...` (API Routes de Next.js)
- Incluye cookies automáticamente (`credentials: "include"`)
- Maneja errores 401 redirigiendo al login
- No necesita token explícito (usa cookies HTTP-only)

#### 2. Cliente para uso en servidor (`api.ts`)

Se utiliza principalmente en Server Components y API Routes para comunicarse directamente con el backend.

```typescript
import { authenticatedRequest } from "@/lib/api";

// Uso en un Server Component o API Route
const clients = await authenticatedRequest<PaginatedClients>(
  "/api/clients",
  token
);
```

**Características:**
- Requiere token de autenticación explícito
- Puede comunicarse directamente con el backend
- Usado internamente por las API Routes

### Manejo de Autenticación

#### Flujo de Login

```
1. Usuario ingresa credenciales
2. Cliente envía POST /api/auth/login
3. API Route envía credenciales al backend
4. Backend valida y retorna token + datos de usuario
5. API Route:
   - Guarda token en cookie HTTP-only (auth_token)
   - Guarda datos de usuario en cookie accesible (user_info)
   - Retorna datos de usuario al cliente
6. Cliente actualiza estado de autenticación
```

**Implementación del Login (`app/api/auth/login/route.ts`):**

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const response = await fetch(`${INTERNAL_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  const res = NextResponse.json({ user: data.user, message: "Login successful" });

  // Cookie HTTP-only para el token (segura)
  res.cookies.set("auth_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });

  // Cookie accesible para datos de usuario (UI)
  res.cookies.set("user_info", JSON.stringify(data.user), {
    httpOnly: false,
    // ... mismas opciones
  });

  return res;
}
```

### URLs de Backend

La aplicación soporta diferentes URLs para el backend:

- **`INTERNAL_API_URL`**: URL interna para comunicación servidor-servidor (usada en API Routes)
- **`NEXT_PUBLIC_API_URL`**: URL pública del backend (fallback)

Esta configuración permite usar URLs internas en entornos containerizados (ej: Docker, Kubernetes) donde el backend es accesible via red interna.

---

## Flujo de Peticiones

### Flujo General de una Petición Autenticada

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DE PETICIÓN                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Componente React                                                         │
│     │                                                                        │
│     │ const clients = await api.clients.list()                              │
│     ▼                                                                        │
│  2. ClientApi (client-api.ts)                                               │
│     │                                                                        │
│     │ fetch("/api/clients", { credentials: "include" })                     │
│     ▼                                                                        │
│  3. Next.js API Route (app/api/clients/route.ts)                            │
│     │                                                                        │
│     │ - Extrae token de cookie "auth_token"                                 │
│     │ - Agrega header Authorization: Bearer <token>                         │
│     ▼                                                                        │
│  4. Backend (NestJS)                                                        │
│     │                                                                        │
│     │ - Valida token JWT                                                    │
│     │ - Procesa petición                                                    │
│     │ - Retorna respuesta                                                   │
│     ▼                                                                        │
│  5. API Route procesa respuesta                                             │
│     │                                                                        │
│     │ - Transforma formato si es necesario                                  │
│     │ - Maneja errores                                                      │
│     ▼                                                                        │
│  6. Componente recibe datos                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Ejemplo Detallado: Obtener Lista de Clientes

#### Paso 1: Componente solicita datos

```typescript
// En un componente de página
"use client";
import { api } from "@/lib/client-api";

export default function ClientsPage() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    const fetchClients = async () => {
      const response = await api.clients.list({ page: 1, limit: 10 });
      setClients(response.data);
    };
    fetchClients();
  }, []);
}
```

#### Paso 2: ClientApi hace la petición

```typescript
// En client-api.ts
clients = {
  list: (params?: ClientQueryDto) => {
    const queryParams = new URLSearchParams();
    // ... construye query string
    return this.request<PaginatedClients>(`/clients?${queryString}`);
  },
}

private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    credentials: "include", // Envía cookies
  });
  return response.json();
}
```

#### Paso 3: API Route procesa la petición

```typescript
// En app/api/clients/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // proxyRequest agrega el token del cookie al header
  const response = await proxyRequest(`/api/clients?${searchParams}`);
  const backendData = await response.json();
  
  // Transforma la respuesta
  return NextResponse.json({
    data: backendData.data.items,
    pagination: backendData.data.pagination,
  });
}
```

#### Paso 4: Utilidades de servidor extraen token

```typescript
// En server-api-utils.ts
export async function getAuthHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
```

### Flujo de Errores

```
┌─────────────────────────────────────────────────────────────┐
│                    MANEJO DE ERRORES                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Error 401 (No autorizado)                                  │
│  ├── API Route detecta error                                │
│  ├── Retorna 401 al cliente                                 │
│  └── ClientApi detecta 401 → Redirige a /login              │
│                                                              │
│  Error 4xx/5xx (Otros errores)                              │
│  ├── API Route captura error                                │
│  ├── Transforma a formato estándar                          │
│  └── Cliente muestra mensaje de error                       │
│                                                              │
│  Error de Red                                               │
│  ├── ClientApi captura excepción                            │
│  └── Lanza ApiError con status 0                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Middleware

### Ubicación y Propósito

El middleware de Next.js se encuentra en `middleware.ts` en la raíz del proyecto frontend. Su propósito principal es:

1. **Proteger rutas** que requieren autenticación
2. **Redirigir usuarios** según su estado de autenticación
3. **Ejecutarse en el Edge** para respuestas rápidas

### Implementación

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas que requieren autenticación
const protectedRoutes = [
  "/dashboard",
  "/clients",
  "/drivers",
  "/trucks",
  "/providers",
  "/routes",
  "/operations",
  "/administration",
  "/profile",
];

// Rutas de autenticación
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Verificar si es ruta protegida sin token
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    // Redirigir a login guardando la URL original
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Redirigir usuarios autenticados fuera de páginas de auth
  if (authRoutes.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}
```

### Configuración del Matcher

```typescript
export const config = {
  matcher: [
    /*
     * Excluye rutas que no necesitan verificación:
     * - api (API routes)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - public (archivos públicos)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
```

### Flujo del Middleware

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DEL MIDDLEWARE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Petición entrante                                          │
│         │                                                    │
│         ▼                                                    │
│  ¿Coincide con matcher?                                     │
│         │                                                    │
│    ┌────┴────┐                                              │
│    │ No      │ Sí                                           │
│    ▼         ▼                                              │
│  Continuar   Verificar cookie "auth_token"                  │
│              │                                               │
│         ┌────┴────────┐                                     │
│         │             │                                      │
│     Sin token     Con token                                  │
│         │             │                                      │
│    ┌────┴────┐   ┌────┴────┐                                │
│    │         │   │         │                                 │
│  Ruta      Ruta  Ruta     Ruta                              │
│  protegida pública auth   protegida                         │
│    │         │   │         │                                 │
│    ▼         ▼   ▼         ▼                                 │
│  Redirect  Next  Redirect  Next                              │
│  /login          /dashboard                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Características del Middleware

| Característica | Descripción |
|---------------|-------------|
| **Ubicación de ejecución** | Edge Runtime (cerca del usuario) |
| **Verificación** | Solo verifica existencia del token, no su validez |
| **Redirección con callback** | Guarda URL original para redirigir después del login |
| **Rutas excluidas** | API routes, archivos estáticos, imágenes |

### Consideraciones de Seguridad

1. **El middleware solo verifica existencia del token**: La validación real del JWT ocurre en el backend
2. **Tokens en cookies HTTP-only**: No son accesibles desde JavaScript del cliente
3. **Protección en capas**: Middleware + API Routes + Backend

---

## Resumen de Tecnologías

| Tecnología | Uso |
|------------|-----|
| **Next.js 15** | Framework React con App Router |
| **TypeScript** | Tipado estático |
| **React 19** | Librería de UI |
| **Tailwind CSS** | Estilos utilitarios |
| **Cookies HTTP-only** | Almacenamiento seguro de tokens |
| **Fetch API** | Comunicación HTTP |

---

## Glosario

- **BFF (Backend For Frontend)**: Patrón arquitectónico donde el frontend tiene su propio backend dedicado
- **API Routes**: Endpoints serverless de Next.js que actúan como backend
- **DTO (Data Transfer Object)**: Objeto que define la estructura de datos para transferencia
- **Edge Runtime**: Entorno de ejecución de Next.js optimizado para baja latencia
- **HTTP-only Cookie**: Cookie que no puede ser accedida desde JavaScript del cliente
- **Route Groups**: Forma de organizar rutas en Next.js sin afectar la URL

---

*Documentación generada para RutaLink Frontend v1.0*

