# Módulo de Mantenedor de Choferes - Documentación API

## Descripción General

El módulo de mantenedor de choferes proporciona una solución completa para gestionar choferes, vehículos, documentación y operaciones de transporte en un sistema multi-tenant.

## Características Principales

### 1. Gestión de Choferes

- ✅ Registro completo de choferes (datos personales, licencias, contactos de emergencia)
- ✅ Soporte para choferes internos y externos
- ✅ Validación de RUT único por operador
- ✅ Control de vigencia de licencias
- ✅ Estado activo/inactivo

### 2. Gestión de Documentación

- ✅ Carga de documentos digitales (licencias, certificados, etc.)
- ✅ Control de fechas de emisión y vencimiento
- ✅ Múltiples tipos de documentos soportados
- ✅ Historial completo de documentación

### 3. Gestión de Vehículos

- ✅ Registro de vehículos con información completa
- ✅ Control de capacidad y tipo de vehículo
- ✅ Validación de patente única por operador
- ✅ Estado activo/inactivo

### 4. Asignación Chofer-Vehículo

- ✅ Asignación y desasignación de vehículos a choferes
- ✅ Control de asignaciones activas
- ✅ Historial de asignaciones
- ✅ Validación de pertenencia al mismo operador

### 5. Gestión de Operaciones

- ✅ Programación de operaciones/viajes
- ✅ Asignación directa de chofer y vehículo
- ✅ Control de estados (programado, en progreso, completado, cancelado)
- ✅ Registro de origen, destino y carga
- ✅ Fechas programadas vs reales

### 6. Historial y Estadísticas

- ✅ Historial completo de viajes por chofer
- ✅ Estadísticas de operaciones
- ✅ Filtros avanzados de búsqueda

---

## Endpoints API

### CHOFERES

#### 1. Crear Chofer

```http
POST /drivers
Authorization: Bearer {token}
Content-Type: application/json

{
  "operatorId": 1,
  "rut": "12.345.678-9",
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan.perez@example.com",
  "phone": "+56912345678",
  "emergencyContactName": "María Pérez",
  "emergencyContactPhone": "+56987654321",
  "licenseType": "D",
  "licenseNumber": "12345678",
  "licenseExpirationDate": "2025-12-31",
  "dateOfBirth": "1985-05-15",
  "address": "Av. Principal 123",
  "city": "Santiago",
  "region": "Región Metropolitana",
  "status": true,
  "isExternal": false,
  "notes": "Chofer con 10 años de experiencia"
}
```

**Respuesta exitosa (201):**

```json
{
  "id": 1,
  "operatorId": 1,
  "rut": "12.345.678-9",
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan.perez@example.com",
  "phone": "+56912345678",
  "emergencyContactName": "María Pérez",
  "emergencyContactPhone": "+56987654321",
  "licenseType": "D",
  "licenseNumber": "12345678",
  "licenseExpirationDate": "2025-12-31T00:00:00.000Z",
  "dateOfBirth": "1985-05-15T00:00:00.000Z",
  "address": "Av. Principal 123",
  "city": "Santiago",
  "region": "Región Metropolitana",
  "status": true,
  "isExternal": false,
  "externalCompany": null,
  "notes": "Chofer con 10 años de experiencia",
  "lastActivityAt": null,
  "createdAt": "2025-11-06T10:00:00.000Z",
  "updatedAt": "2025-11-06T10:00:00.000Z",
  "createdBy": 1,
  "updatedBy": 1
}
```

#### 2. Listar Choferes

```http
GET /drivers?operatorId=1&status=true&page=1&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**

- `operatorId` (opcional): ID del operador
- `search` (opcional): Búsqueda por nombre, RUT o email
- `status` (opcional): true/false - filtrar por estado
- `isExternal` (opcional): true/false - filtrar choferes externos
- `licenseType` (opcional): Tipo de licencia (A1, A2, B, C, D, E, F)
- `page` (opcional, default: 1): Número de página
- `limit` (opcional, default: 10): Elementos por página

**Respuesta exitosa (200):**

```json
{
  "data": [
    {
      "id": 1,
      "operatorId": 1,
      "rut": "12.345.678-9",
      "firstName": "Juan",
      "lastName": "Pérez",
      "email": "juan.perez@example.com",
      "licenseType": "D",
      "status": true,
      "isExternal": false,
      "createdAt": "2025-11-06T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### 3. Obtener Chofer por ID

```http
GET /drivers/1
Authorization: Bearer {token}
```

#### 4. Actualizar Chofer

```http
PUT /drivers/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone": "+56998765432",
  "licenseExpirationDate": "2026-12-31",
  "status": true
}
```

#### 5. Eliminar Chofer

```http
DELETE /drivers/1
Authorization: Bearer {token}
```

**Nota:** No se puede eliminar un chofer con operaciones activas o programadas.

---

### DOCUMENTACIÓN DE CHOFERES

#### 1. Agregar Documento a Chofer

```http
POST /drivers/1/documents
Authorization: Bearer {token}
Content-Type: application/json

{
  "documentType": "license",
  "documentName": "Licencia de Conducir Clase D",
  "fileName": "licencia_juan_perez.pdf",
  "filePath": "/uploads/drivers/1/licencia_juan_perez.pdf",
  "fileSize": 524288,
  "mimeType": "application/pdf",
  "issueDate": "2020-01-15",
  "expirationDate": "2025-12-31",
  "notes": "Licencia vigente hasta fin de 2025"
}
```

**Tipos de documentos soportados:**

- `license`: Licencia de conducir
- `certificate`: Certificados varios
- `medical`: Examen médico
- `psychotechnical`: Examen psicotécnico
- `training`: Certificados de capacitación
- `insurance`: Seguros
- `other`: Otros documentos

#### 2. Listar Documentos de un Chofer

```http
GET /drivers/1/documents
Authorization: Bearer {token}
```

#### 3. Obtener Documento por ID

```http
GET /drivers/documents/1
Authorization: Bearer {token}
```

#### 4. Actualizar Documento

```http
PUT /drivers/documents/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "expirationDate": "2026-12-31",
  "notes": "Renovada por 1 año más"
}
```

#### 5. Eliminar Documento

```http
DELETE /drivers/documents/1
Authorization: Bearer {token}
```

---

### VEHÍCULOS

#### 1. Crear Vehículo

```http
POST /drivers/vehicles
Authorization: Bearer {token}
Content-Type: application/json

{
  "operatorId": 1,
  "plateNumber": "AB-CD-12",
  "brand": "Mercedes-Benz",
  "model": "Actros 2651",
  "year": 2020,
  "vehicleType": "truck",
  "capacity": 25000,
  "capacityUnit": "kg",
  "vin": "WDB9634321K123456",
  "color": "Blanco",
  "status": true,
  "notes": "Camión de carga pesada"
}
```

#### 2. Listar Vehículos

```http
GET /drivers/vehicles?operatorId=1&status=true&page=1&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**

- `operatorId` (opcional): ID del operador
- `search` (opcional): Búsqueda por patente, marca o modelo
- `status` (opcional): true/false
- `vehicleType` (opcional): Tipo de vehículo
- `page` (opcional, default: 1)
- `limit` (opcional, default: 10)

#### 3. Obtener Vehículo por ID

```http
GET /drivers/vehicles/1
Authorization: Bearer {token}
```

#### 4. Actualizar Vehículo

```http
PUT /drivers/vehicles/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": false,
  "notes": "Vehículo en mantención"
}
```

#### 5. Eliminar Vehículo

```http
DELETE /drivers/vehicles/1
Authorization: Bearer {token}
```

---

### ASIGNACIÓN CHOFER-VEHÍCULO

#### 1. Asignar Vehículo a Chofer

```http
POST /drivers/1/assign-vehicle
Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleId": 1,
  "notes": "Asignación para ruta Santiago-Valparaíso"
}
```

**Validaciones:**

- Chofer y vehículo deben pertenecer al mismo operador
- Chofer debe estar activo
- Vehículo debe estar activo
- Si el chofer tiene otra asignación activa, se desactiva automáticamente

#### 2. Desasignar Vehículo de Chofer

```http
PUT /drivers/assignments/1/unassign
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "Fin de turno"
}
```

#### 3. Ver Asignaciones de un Chofer

```http
GET /drivers/1/assignments
Authorization: Bearer {token}
```

**Respuesta:**

```json
[
  {
    "assignment": {
      "id": 1,
      "driverId": 1,
      "vehicleId": 1,
      "assignedAt": "2025-11-06T08:00:00.000Z",
      "unassignedAt": null,
      "isActive": true,
      "notes": "Asignación para ruta Santiago-Valparaíso"
    },
    "vehicle": {
      "id": 1,
      "plateNumber": "AB-CD-12",
      "brand": "Mercedes-Benz",
      "model": "Actros 2651",
      "vehicleType": "truck"
    }
  }
]
```

#### 4. Ver Asignación Activa de un Chofer

```http
GET /drivers/1/active-assignment
Authorization: Bearer {token}
```

---

### OPERACIONES / VIAJES

#### 1. Crear Operación

```http
POST /drivers/operations
Authorization: Bearer {token}
Content-Type: application/json

{
  "operatorId": 1,
  "driverId": 1,
  "vehicleId": 1,
  "operationNumber": "OP-2025-001",
  "operationType": "delivery",
  "origin": "Bodega Central, Santiago",
  "destination": "Puerto Valparaíso",
  "scheduledStartDate": "2025-11-07T08:00:00",
  "scheduledEndDate": "2025-11-07T14:00:00",
  "distance": 120,
  "cargoDescription": "Contenedores de electrónica",
  "cargoWeight": 15000,
  "notes": "Entrega urgente"
}
```

**Tipos de operación comunes:**

- `delivery`: Entrega
- `pickup`: Retiro
- `transfer`: Traslado
- `return`: Devolución

**Estados de operación:**

- `scheduled`: Programado
- `in-progress`: En progreso
- `completed`: Completado
- `cancelled`: Cancelado

#### 2. Listar Operaciones

```http
GET /drivers/operations?operatorId=1&status=scheduled&page=1&limit=10
Authorization: Bearer {token}
```

**Query Parameters:**

- `operatorId` (opcional): ID del operador
- `driverId` (opcional): ID del chofer
- `vehicleId` (opcional): ID del vehículo
- `status` (opcional): Estado de la operación
- `operationType` (opcional): Tipo de operación
- `startDate` (opcional): Fecha inicio (ISO 8601)
- `endDate` (opcional): Fecha fin (ISO 8601)
- `page` (opcional, default: 1)
- `limit` (opcional, default: 10)

**Respuesta:**

```json
{
  "data": [
    {
      "operation": {
        "id": 1,
        "operationNumber": "OP-2025-001",
        "operationType": "delivery",
        "origin": "Bodega Central, Santiago",
        "destination": "Puerto Valparaíso",
        "scheduledStartDate": "2025-11-07T08:00:00.000Z",
        "scheduledEndDate": "2025-11-07T14:00:00.000Z",
        "status": "scheduled",
        "distance": 120,
        "cargoWeight": 15000
      },
      "driver": {
        "id": 1,
        "firstName": "Juan",
        "lastName": "Pérez",
        "rut": "12.345.678-9"
      },
      "vehicle": {
        "id": 1,
        "plateNumber": "AB-CD-12",
        "brand": "Mercedes-Benz",
        "model": "Actros 2651"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### 3. Obtener Operación por ID

```http
GET /drivers/operations/1
Authorization: Bearer {token}
```

#### 4. Actualizar Operación

```http
PUT /drivers/operations/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "in-progress",
  "actualStartDate": "2025-11-07T08:15:00"
}
```

**Ejemplo: Completar una operación**

```json
{
  "status": "completed",
  "actualEndDate": "2025-11-07T13:45:00",
  "distance": 125,
  "notes": "Entrega completada sin novedades"
}
```

#### 5. Eliminar Operación

```http
DELETE /drivers/operations/1
Authorization: Bearer {token}
```

**Nota:** No se puede eliminar una operación en progreso.

---

### HISTORIAL Y ESTADÍSTICAS DE CHOFER

#### 1. Ver Historial de Operaciones del Chofer

```http
GET /drivers/1/operations?status=completed&page=1&limit=10
Authorization: Bearer {token}
```

**Query Parameters:** (mismos que listar operaciones)

#### 2. Ver Estadísticas del Chofer

```http
GET /drivers/1/statistics
Authorization: Bearer {token}
```

**Respuesta:**

```json
{
  "totalOperations": 150,
  "completedOperations": 145,
  "inProgressOperations": 1,
  "scheduledOperations": 3,
  "cancelledOperations": 1,
  "totalDistance": 18500
}
```

---

## Permisos Requeridos

El módulo utiliza el sistema de permisos de la aplicación. Los siguientes permisos son necesarios:

### Choferes:

- `drivers:create` - Crear choferes
- `drivers:read` - Leer/consultar choferes
- `drivers:update` - Actualizar choferes y sus documentos
- `drivers:delete` - Eliminar choferes

### Vehículos:

- `vehicles:create` - Crear vehículos
- `vehicles:read` - Leer/consultar vehículos
- `vehicles:update` - Actualizar vehículos
- `vehicles:delete` - Eliminar vehículos

### Operaciones:

- `operations:create` - Crear operaciones
- `operations:read` - Leer/consultar operaciones
- `operations:update` - Actualizar operaciones
- `operations:delete` - Eliminar operaciones

---

## Modelos de Datos

### Driver (Chofer)

```typescript
{
  id: number;
  operatorId: number;
  rut: string;                    // Formato: 12.345.678-9
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  licenseType: string;            // A1, A2, A3, A4, A5, B, C, D, E, F
  licenseNumber: string;
  licenseExpirationDate: Date;
  dateOfBirth?: Date;
  address?: string;
  city?: string;
  region?: string;
  status: boolean;
  isExternal: boolean;
  externalCompany?: string;
  notes?: string;
  lastActivityAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
}
```

### DriverDocument

```typescript
{
  id: number;
  driverId: number;
  documentType: string;           // license, certificate, medical, etc.
  documentName: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  issueDate?: Date;
  expirationDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
}
```

### Vehicle

```typescript
{
  id: number;
  operatorId: number;
  plateNumber: string;
  brand?: string;
  model?: string;
  year?: number;
  vehicleType: string;            // truck, van, car, etc.
  capacity?: number;
  capacityUnit?: string;          // kg, tons, passengers
  vin?: string;
  color?: string;
  status: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
}
```

### Operation

```typescript
{
  id: number;
  operatorId: number;
  driverId: number;
  vehicleId: number;
  operationNumber: string;
  operationType: string;
  origin: string;
  destination: string;
  scheduledStartDate: Date;
  scheduledEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  distance?: number;              // km
  status: string;                 // scheduled, in-progress, completed, cancelled
  cargoDescription?: string;
  cargoWeight?: number;           // kg
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
}
```

---

## Códigos de Error Comunes

- `400 Bad Request`: Datos inválidos o violación de reglas de negocio
- `401 Unauthorized`: Token no proporcionado o inválido
- `403 Forbidden`: Usuario sin permisos suficientes
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Duplicación de datos únicos (RUT, patente, número de operación)

---

## Próximos Pasos

Para comenzar a usar el módulo:

1. **Generar y aplicar la migración:**

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

2. **Crear permisos en la base de datos:**
   - Ejecutar seed de permisos para drivers, vehicles y operations

3. **Asignar permisos a roles:**
   - Configurar qué roles tienen acceso a cada recurso

4. **Iniciar el servidor:**

   ```bash
   npm run start:dev
   ```

5. **Probar endpoints:**
   - Usar Postman, Insomnia o similar
   - Autenticarse primero para obtener el token JWT

---

## Soporte y Mantenimiento

- Las tablas incluyen auditoría completa (createdBy, updatedBy, createdAt, updatedAt)
- Todas las eliminaciones incluyen validaciones de integridad referencial
- El sistema es multi-tenant: todos los datos están aislados por operador
- Índices optimizados para consultas frecuentes
