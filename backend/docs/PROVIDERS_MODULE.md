# Módulo de Proveedores de Transporte

## Descripción

El módulo `providers` gestiona toda la información de los proveedores externos que participan en el ciclo operativo del traslado de maquinaria. Este módulo cumple con el **Requerimiento 3.5** del Product Owner.

## Funcionalidades

### ✅ CRUD Completo de Proveedores

- **Crear proveedor**: Registro completo con validación de datos
- **Listar proveedores**: Con filtros avanzados y paginación
- **Ver detalle**: Información completa de un proveedor
- **Actualizar proveedor**: Modificación de datos
- **Eliminar proveedor**: Con validación de operaciones asociadas

### ✅ Asociación con Operaciones

- Relación entre proveedores y operaciones
- Historial de operaciones por proveedor
- Estadísticas de desempeño

### ✅ Filtros y Búsquedas

- Por operador (multi-tenancy)
- Por nombre o razón social
- Por RUT/Tax ID
- Por tipo de negocio
- Por estado (activo/inactivo)
- Por calificación mínima

## Estructura del Módulo

```
src/providers/
├── dto/
│   └── provider.dto.ts          # DTOs de validación
├── providers.controller.ts      # Endpoints REST
├── providers.service.ts         # Lógica de negocio
├── providers.module.ts          # Módulo NestJS
└── index.ts                     # Exports públicos
```

## Campos de la Tabla `providers`

| Campo          | Tipo          | Descripción                                    |
| -------------- | ------------- | ---------------------------------------------- |
| `id`           | int           | ID único del proveedor                         |
| `operatorId`   | int           | ID del operador (multi-tenancy)                |
| `businessName` | varchar(255)  | Razón social ⚠️ **Requerido**                  |
| `taxId`        | varchar(20)   | RUT de la empresa                              |
| `contactName`  | varchar(200)  | Nombre del contacto                            |
| `contactEmail` | varchar(255)  | Email del contacto                             |
| `contactPhone` | varchar(20)   | Teléfono de contacto                           |
| `address`      | varchar(500)  | Dirección                                      |
| `city`         | varchar(100)  | Ciudad                                         |
| `region`       | varchar(100)  | Región                                         |
| `country`      | varchar(100)  | País (default: Chile)                          |
| `businessType` | varchar(100)  | Tipo de servicio (transporte, logística, etc.) |
| `serviceTypes` | varchar(500)  | Tipos de servicios ofrecidos                   |
| `fleetSize`    | int           | Tamaño de la flota                             |
| `status`       | boolean       | Activo/Inactivo (default: true)                |
| `rating`       | int           | Calificación del proveedor (1-5)               |
| `observations` | varchar(1000) | Observaciones generales                        |
| `notes`        | varchar(1000) | Notas adicionales                              |
| `createdAt`    | timestamp     | Fecha de creación                              |
| `updatedAt`    | timestamp     | Fecha de última actualización                  |
| `createdBy`    | int           | Usuario que creó el registro                   |
| `updatedBy`    | int           | Usuario que actualizó el registro              |

## Endpoints API

### Endpoints Principales

```http
POST   /providers                    # Crear proveedor
GET    /providers                    # Listar proveedores
GET    /providers/:id                # Obtener proveedor por ID
PUT    /providers/:id                # Actualizar proveedor
DELETE /providers/:id                # Eliminar proveedor
```

### Endpoints de Estadísticas

```http
GET    /providers/:id/statistics     # Estadísticas del proveedor
GET    /providers/:id/operations     # Operaciones del proveedor
```

## Ejemplos de Uso

### Crear un Proveedor

```json
POST /providers
{
  "operatorId": 1,
  "businessName": "Transportes Rápidos S.A.",
  "taxId": "76.123.456-7",
  "contactName": "Juan Pérez",
  "contactEmail": "contacto@transportesrapidos.cl",
  "contactPhone": "+56 9 8765 4321",
  "address": "Av. Principal 123",
  "city": "Santiago",
  "region": "Metropolitana",
  "businessType": "transporte",
  "serviceTypes": "transporte pesado, logística",
  "fleetSize": 25,
  "status": true,
  "rating": 4
}
```

### Listar Proveedores con Filtros

```http
GET /providers?operatorId=1&status=true&businessType=transporte&page=1&limit=10
```

### Obtener Estadísticas de un Proveedor

```http
GET /providers/1/statistics
```

**Respuesta:**

```json
{
  "totalOperations": 150,
  "completedOperations": 145,
  "inProgressOperations": 3,
  "scheduledOperations": 2,
  "cancelledOperations": 0
}
```

### Obtener Operaciones de un Proveedor

```http
GET /providers/1/operations?page=1&limit=10
```

## Validaciones y Reglas de Negocio

### ✅ Validaciones al Crear

1. El `operatorId` debe existir
2. El `businessName` es obligatorio
3. Si se proporciona `taxId`, debe ser único por operador
4. El `rating` debe estar entre 1 y 5

### ✅ Validaciones al Actualizar

1. El proveedor debe existir
2. Si se cambia el `taxId`, debe ser único por operador

### ✅ Validaciones al Eliminar

1. El proveedor debe existir
2. No debe tener operaciones asociadas

## Permisos Requeridos

Todos los endpoints requieren autenticación JWT y los siguientes permisos:

| Acción                 | Permiso            |
| ---------------------- | ------------------ |
| Crear proveedor        | `providers:create` |
| Listar/Ver proveedores | `providers:read`   |
| Actualizar proveedor   | `providers:update` |
| Eliminar proveedor     | `providers:delete` |

## Relaciones con Otros Módulos

### 📦 Módulo `operations`

- Un proveedor puede tener múltiples operaciones
- Campo: `operations.providerId` → `providers.id`
- Relación: One-to-Many

### 🏢 Módulo `operators`

- Un proveedor pertenece a un operador (multi-tenancy)
- Campo: `providers.operatorId` → `operators.id`
- Relación: Many-to-One

## Integración con el Sistema

### En el Módulo de Operaciones

Al crear una operación, ahora se puede especificar el proveedor de transporte:

```json
POST /operations
{
  "operatorId": 1,
  "clientId": 5,
  "providerId": 3,  // ← Nuevo campo
  "driverId": 10,
  "vehicleId": 8,
  "operationNumber": "OP-2025-001",
  "operationType": "delivery",
  "origin": "Bodega Central",
  "destination": "Faena Minera Norte",
  "scheduledStartDate": "2025-11-10T08:00:00Z"
}
```

### Filtrar Operaciones por Proveedor

```http
GET /operations?providerId=3
```

## Próximos Pasos

Este módulo está listo para:

1. ✅ Integración con el frontend
2. ✅ Creación de proveedores desde la interfaz
3. ✅ Asignación de proveedores a operaciones
4. ✅ Visualización de estadísticas
5. ⏳ Sistema de calificaciones (puede ser ampliado)
6. ⏳ Documentos del proveedor (similar a drivers y vehicles)

---

**Última actualización:** 8 de noviembre de 2025
