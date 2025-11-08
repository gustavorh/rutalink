# Módulo de Clientes - Documentación de Implementación

## Resumen

Se ha implementado exitosamente el **Módulo de Mantenedor de Clientes** para el backend de la aplicación, permitiendo la administración completa de la información comercial y operativa de los clientes que solicitan el traslado de maquinaria.

## Características Implementadas

### 1. **Estructura de Datos (Database Schema)**

Se agregó la tabla `clients` en el schema de la base de datos con los siguientes campos:

- **Información Comercial:**
  - `businessName` (razón social) - Requerido
  - `taxId` (RUT de la empresa) - Opcional
- **Información de Contacto:**
  - `contactName` - Nombre del contacto principal
  - `contactEmail` - Email de contacto
  - `contactPhone` - Teléfono de contacto
- **Información de Ubicación:**
  - `address` - Dirección completa
  - `city` - Ciudad
  - `region` - Región
  - `country` - País (default: Chile)
- **Clasificación y Observaciones:**
  - `industry` (rubro) - Clasificación por industria:
    - minería
    - construcción
    - industrial
    - agricultura
    - transporte
    - energía
    - forestal
    - pesca
    - retail
    - servicios
    - manufactura
    - tecnología
    - otro
  - `observations` - Observaciones generales del cliente
  - `notes` - Notas adicionales
- **Metadata:**
  - `status` - Estado activo/inactivo
  - `operatorId` - Relación con el operador
  - `createdAt`, `updatedAt`, `createdBy`, `updatedBy` - Auditoría

### 2. **Relaciones con Operaciones**

- Se agregó el campo `clientId` a la tabla `operations` para asociar operaciones con clientes
- Relación opcional (nullable) - las operaciones pueden existir sin cliente asignado
- Delete restrict - no se puede eliminar un cliente con operaciones asociadas

### 3. **API Endpoints**

#### **CRUD Básico de Clientes**

- **POST /clients** - Crear nuevo cliente
  - Requiere permiso: `clients:create`
  - Valida duplicados por razón social y RUT
- **GET /clients** - Listar clientes con filtros
  - Requiere permiso: `clients:read`
  - Filtros disponibles:
    - `operatorId` - Filtrar por operador
    - `search` - Búsqueda por nombre, contacto, email, RUT
    - `status` - Filtrar por estado (activo/inactivo)
    - `industry` - Filtrar por rubro
    - `city` - Filtrar por ciudad
    - `region` - Filtrar por región
    - `page` y `limit` - Paginación
- **GET /clients/:id** - Obtener cliente por ID
  - Requiere permiso: `clients:read`
- **PUT /clients/:id** - Actualizar cliente
  - Requiere permiso: `clients:update`
  - Valida duplicados al actualizar razón social o RUT
- **DELETE /clients/:id** - Desactivar cliente (soft delete)
  - Requiere permiso: `clients:delete`
  - Cambia el status a `false`
  - No permite eliminar clientes con operaciones activas o programadas
- **DELETE /clients/:id/permanent** - Eliminar permanentemente
  - Requiere permiso: `clients:delete`
  - Solo permite si NO tiene operaciones asociadas

#### **Historial de Servicios**

- **GET /clients/:id/operations** - Historial completo de operaciones
  - Requiere permiso: `clients:read`
  - Filtros disponibles:
    - `status` - Estado de operación
    - `operationType` - Tipo de operación
    - `startDate` y `endDate` - Rango de fechas
    - `page` y `limit` - Paginación
  - Incluye información del chofer y vehículo asociado
- **GET /clients/:id/statistics** - Estadísticas del cliente
  - Requiere permiso: `clients:read`
  - Retorna:
    - Total de operaciones
    - Operaciones completadas
    - Operaciones en progreso
    - Operaciones programadas
    - Operaciones canceladas
    - Distancia total recorrida
    - Peso total de carga transportada
- **GET /clients/:id/recent-operations** - Operaciones recientes
  - Requiere permiso: `clients:read`
  - Parámetro `limit` opcional (default: 5)

#### **Analytics y Reportes**

- **GET /clients/analytics/by-industry** - Análisis por rubro
  - Requiere permiso: `clients:read`
  - Parámetro `operatorId` opcional
  - Retorna por cada rubro:
    - Total de clientes
    - Clientes activos
- **GET /clients/analytics/top-clients** - Top clientes
  - Requiere permiso: `clients:read`
  - Parámetros opcionales:
    - `operatorId` - Filtrar por operador
    - `limit` - Cantidad de resultados (default: 10)
  - Retorna clientes ordenados por cantidad de operaciones

## Archivos Creados

```
backend/src/clients/
├── dto/
│   └── client.dto.ts          # DTOs de validación
├── clients.controller.ts       # Controlador REST
├── clients.service.ts          # Lógica de negocio
├── clients.module.ts           # Módulo NestJS
└── index.ts                    # Exports
```

## Archivos Modificados

- `backend/src/database/schema.ts` - Agregada tabla `clients` y relación con `operations`
- `backend/src/app.module.ts` - Registrado `ClientsModule`
- `backend/src/drivers/dto/driver.dto.ts` - Agregado campo `clientId` a DTOs de operaciones
- `backend/src/drivers/drivers.service.ts` - Actualizado para incluir cliente en queries de operaciones

## Validaciones Implementadas

### Creación de Cliente:

- ✅ Operador debe existir
- ✅ Razón social no duplicada por operador
- ✅ RUT no duplicado por operador (si se proporciona)

### Actualización de Cliente:

- ✅ Cliente debe existir
- ✅ Razón social no duplicada (excepto el mismo cliente)
- ✅ RUT no duplicado (excepto el mismo cliente)

### Eliminación de Cliente:

- ✅ No permite eliminar con operaciones activas o programadas (soft delete)
- ✅ No permite eliminar permanentemente si tiene operaciones asociadas

## Seguridad y Permisos

Todos los endpoints requieren autenticación JWT y permisos específicos:

- `clients:create` - Crear clientes
- `clients:read` - Leer información de clientes
- `clients:update` - Actualizar clientes
- `clients:delete` - Eliminar/desactivar clientes

## Auditoría

Todos los cambios registran:

- `createdBy` - Usuario que creó el registro
- `updatedBy` - Usuario que actualizó el registro
- `createdAt` - Fecha de creación
- `updatedAt` - Fecha de última actualización

## Índices de Base de Datos

Para optimizar queries:

- `client_operator_id_idx` - Índice en operatorId
- `client_business_name_idx` - Índice en businessName
- `client_tax_id_idx` - Índice compuesto en (operatorId, taxId)
- `client_industry_idx` - Índice en industry
- `client_status_idx` - Índice en status
- `operation_client_id_idx` - Índice en clientId en tabla operations

## Próximos Pasos Sugeridos

1. **Crear migración de base de datos:**

   ```bash
   cd backend
   npm run drizzle:generate
   npm run drizzle:migrate
   ```

2. **Agregar permisos en el seed:**
   Actualizar `backend/src/database/seeds/permissions.seed.ts` para incluir:
   - `clients:create`
   - `clients:read`
   - `clients:update`
   - `clients:delete`

3. **Testing:**
   - Crear tests unitarios para el servicio
   - Crear tests e2e para los endpoints

4. **Frontend:**
   - Crear componentes de UI para gestión de clientes
   - Implementar formularios de creación/edición
   - Agregar visualizaciones de analytics

## Ejemplo de Uso

### Crear Cliente

```typescript
POST /clients
{
  "operatorId": 1,
  "businessName": "Minera Los Andes S.A.",
  "taxId": "76.123.456-7",
  "contactName": "Juan Pérez",
  "contactEmail": "juan.perez@minera.cl",
  "contactPhone": "+56912345678",
  "address": "Av. Principal 123",
  "city": "Antofagasta",
  "region": "Antofagasta",
  "industry": "minería",
  "observations": "Cliente preferencial con contrato anual",
  "status": true
}
```

### Listar Clientes por Rubro

```typescript
GET /clients?industry=minería&status=true&page=1&limit=10
```

### Obtener Estadísticas

```typescript
GET /clients/1/statistics

Response:
{
  "totalOperations": 150,
  "completedOperations": 140,
  "inProgressOperations": 5,
  "scheduledOperations": 3,
  "cancelledOperations": 2,
  "totalDistance": 45000,
  "totalCargoWeight": 1250000
}
```

## Notas Técnicas

- El código sigue los patrones establecidos en el módulo de drivers
- Utiliza Drizzle ORM para queries type-safe
- Implementa validación con class-validator
- Paginación por defecto: 10 registros por página
- Soft delete por defecto para preservar historial
