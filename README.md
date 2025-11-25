# RutaLink

**RutaLink** es una plataforma integral de gestión de operaciones de transporte diseñada para empresas de logística y transporte en Chile. El sistema permite gestionar de manera centralizada y eficiente todos los aspectos de las operaciones de transporte, desde la administración de recursos hasta el seguimiento completo del ciclo de vida de las operaciones.

## 📋 Descripción General

RutaLink es una solución multi-tenant que permite a múltiples empresas de transporte operar de forma independiente dentro de la misma plataforma, manteniendo un aislamiento completo de datos. El sistema está diseñado para optimizar la gestión de flotas, operaciones, personal y clientes, proporcionando visibilidad completa y herramientas de análisis para la toma de decisiones.

## 🎯 Funcionalidades Principales

### Gestión Multi-Tenant

- Soporte para múltiples operadores (empresas) en una sola instancia
- Aislamiento completo de datos por operador
- Operadores "super" con acceso administrativo global

### Gestión de Recursos Humanos

- **Choferes**: Administración completa de conductores con información personal, licencias, documentación y contactos de emergencia
- **Usuarios y Roles**: Sistema de roles y permisos granulares (RBAC) con 5 roles predefinidos

### Gestión de Flota

- **Vehículos**: Registro completo de la flota con información técnica y documentación vehicular
- **Asignaciones**: Gestión de asignaciones chofer-vehículo
- **Documentación**: Control de permisos de circulación, revisiones técnicas y seguros

### Gestión de Operaciones

- **Ciclo de Vida Completo**: Programación, asignación, seguimiento y cierre de operaciones
- **Estados**: Control de estados (programado, en progreso, completado, cancelado)
- **Reportes**: Generación de reportes en PDF y Excel para análisis y cumplimiento

### Gestión de Relaciones Comerciales

- **Clientes**: Administración de clientes con clasificación por industria y historial de operaciones
- **Proveedores**: Control de proveedores externos de transporte con calificaciones

### Gestión de Infraestructura

- **Rutas/Tramos**: Definición de rutas con origen, destino, distancia, duración y condiciones del camino
- **Peajes**: Registro de costos asociados a rutas

### Seguridad y Auditoría

- **Autenticación JWT**: Sistema seguro de autenticación con tokens
- **Control de Acceso**: Permisos granulares por recurso y acción
- **Auditoría Completa**: Registro automático de todas las acciones para trazabilidad y cumplimiento
- **Control de Inactividad**: Timeout automático de sesiones inactivas

## 🏗️ Arquitectura del Sistema

RutaLink está construido siguiendo una arquitectura moderna de tres capas:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  • Interfaz de usuario React                            │
│  • API Routes como Backend For Frontend (BFF)           │
│  • Autenticación basada en cookies HTTP-only            │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                 Backend (NestJS)                         │
│  • API REST con arquitectura modular por capas          │
│  • Autenticación JWT + RBAC                             │
│  • Multi-tenancy a nivel de fila                        │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Base de Datos (MySQL)                      │
│  • Esquema relacional con Drizzle ORM                   │
│  • Aislamiento de datos por operador                    │
└─────────────────────────────────────────────────────────┘
```

### Principios Arquitectónicos

- **Separación de Responsabilidades**: Cada capa tiene responsabilidades claramente definidas
- **Modularidad**: Sistema organizado en módulos independientes por dominio
- **Seguridad en Capas**: Protección en múltiples niveles (middleware, guards, validación)
- **Escalabilidad**: Diseñado para soportar múltiples tenants y alto volumen de operaciones

## 🛠️ Stack Tecnológico

### Backend

- **Framework**: NestJS 11
- **Lenguaje**: TypeScript 5.7
- **Base de Datos**: MySQL (via mysql2)
- **ORM**: Drizzle ORM
- **Autenticación**: JWT + Passport
- **Validación**: class-validator + class-transformer
- **Documentación API**: Swagger/OpenAPI
- **Reportes**: ExcelJS + Puppeteer (PDF)

### Frontend

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Autenticación**: Cookies HTTP-only
- **Comunicación**: Fetch API con patrón BFF

## 📁 Estructura del Proyecto

```
rutalink/
├── backend/              # Aplicación backend (NestJS)
│   ├── src/             # Código fuente
│   ├── docs/            # Documentación técnica del backend
│   └── drizzle/         # Migraciones de base de datos
│
├── frontend/            # Aplicación frontend (Next.js)
│   ├── app/             # Rutas y páginas (App Router)
│   ├── components/      # Componentes React
│   ├── lib/             # Utilidades y lógica compartida
│   └── docs/            # Documentación técnica del frontend
│
└── README.md            # Este archivo
```

## 🔐 Modelo de Seguridad

RutaLink implementa un modelo de seguridad basado en **RBAC (Role-Based Access Control)** con soporte multi-tenant:

- **Roles Predefinidos**: Administrador, Supervisor, Operador, Chofer, Visualizador
- **Permisos Granulares**: Control a nivel de recurso y acción (ej: `drivers:create`, `operations:read`)
- **Multi-Tenancy**: Aislamiento automático de datos por operador
- **Auditoría**: Registro completo de todas las acciones del sistema
- **Sesiones Seguras**: Tokens JWT con timeout de inactividad (30 minutos)

## 📊 Modelo de Datos

El sistema gestiona las siguientes entidades principales:

- **Operadores** (Tenants)
- **Usuarios y Roles**
- **Choferes y Documentación**
- **Vehículos y Documentación**
- **Clientes**
- **Proveedores**
- **Rutas/Tramos**
- **Operaciones**
- **Asignaciones Chofer-Vehículo**
- **Auditoría**

Para ver el modelo completo de entidad-relación, consulta: [Modelo ER](./backend/docs/Entidad-Relacion.svg)

## 🚀 Enlaces Rápidos

### Aplicaciones Locales (Desarrollo)

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3030/api
- **Documentación API (Swagger)**: http://localhost:3030/docs

### Credenciales Predeterminadas

```
Usuario: admin
Contraseña: A12345678
```

## 📚 Documentación Detallada

Para información técnica detallada sobre cada componente del sistema:

- **[Documentación Backend](./backend/docs/documentacion.md)**: Arquitectura, patrones de diseño, flujos de datos, autenticación y más
- **[Documentación Frontend](./frontend/docs/documentacion.md)**: Arquitectura de la aplicación, comunicación con backend, middleware y patrones utilizados

## 🎨 Características Destacadas

### Multi-Tenancy

Cada operador tiene su propio espacio de datos completamente aislado, permitiendo que múltiples empresas compartan la misma infraestructura sin comprometer la seguridad o privacidad.

### Sistema de Permisos Flexible

Control granular de acceso con permisos configurables por recurso y acción, permitiendo adaptar los roles a las necesidades específicas de cada organización.

### Auditoría Completa

Todas las acciones del sistema se registran automáticamente, proporcionando trazabilidad completa para cumplimiento y análisis.

### Generación de Reportes

Exportación de datos en múltiples formatos (PDF, Excel) para análisis externo y cumplimiento de requisitos regulatorios.

### Interfaz Moderna

Interfaz de usuario intuitiva construida con tecnologías modernas, optimizada para productividad y experiencia de usuario.

## 🔄 Flujo de Operación

1. **Autenticación**: Los usuarios se autentican mediante credenciales y reciben un token JWT
2. **Autorización**: El sistema verifica permisos antes de permitir cualquier acción
3. **Operación**: Las operaciones se ejecutan con validación y transformación de datos
4. **Auditoría**: Todas las acciones se registran automáticamente
5. **Respuesta**: Los datos se devuelven en formato estandarizado con manejo de errores consistente

## 🌟 Beneficios Clave

- **Centralización**: Toda la información de transporte en un solo lugar
- **Eficiencia**: Automatización de procesos manuales y reducción de errores
- **Visibilidad**: Dashboard y reportes para toma de decisiones informada
- **Escalabilidad**: Arquitectura preparada para crecer con el negocio
- **Seguridad**: Múltiples capas de seguridad y cumplimiento normativo
- **Multi-Tenant**: Una sola plataforma para múltiples empresas

---

**RutaLink** - Plataforma de Gestión de Transporte y Logística

Para más información técnica, consulta la documentación detallada en las carpetas `backend/docs` y `frontend/docs`.
