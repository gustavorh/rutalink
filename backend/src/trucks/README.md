# Módulo de Mantenedor de Camiones (Trucks)

## Descripción

El módulo de Trucks gestiona la información técnica y operativa de la flota de camiones utilizada para el traslado de maquinaria, incluyendo vehículos de terceros.

## Características Principales

### 1. Registro Completo de Camiones

- **Información Básica**: Patente, marca, modelo, año
- **Características Técnicas**: Tipo de vehículo, capacidad, VIN, color
- **Gestión de Estado**: Activo/Inactivo

### 2. Control de Documentación Vigente

- **Tipos de Documentos**:
  - Permiso de circulación (`circulation_permit`)
  - Revisión técnica (`technical_review`)
  - Seguro (`insurance`)
  - Certificado de propiedad (`ownership`)
  - Certificación de gas (`gas_certification`)
  - Otros (`other`)

- **Información de Documentos**:
  - Nombre y tipo de documento
  - Archivo adjunto (ruta, tamaño, tipo MIME)
  - Fecha de emisión y vencimiento
  - Información específica de seguros (compañía, póliza, cobertura)
  - Alertas de vencimiento

### 3. Trazabilidad Operativa

- Asociación con operaciones pasadas
- Seguimiento de operaciones futuras
- Historial completo de uso

### 4. Estado Operativo

- **ACTIVE**: Vehículo disponible para operaciones
- **MAINTENANCE**: En mantenimiento
- **OUT_OF_SERVICE**: Fuera de servicio
- **RESERVED**: Reservado para operación

## Estructura de la Base de Datos

### Tabla `vehicles` (Existente, extendida)

```typescript
{
  id: number;
  operatorId: number;
  plateNumber: string;        // Patente (única por operador)
  brand?: string;             // Marca
  model?: string;             // Modelo
  year?: number;              // Año
  vehicleType: string;        // Tipo de vehículo
  capacity?: number;          // Capacidad
  capacityUnit?: string;      // Unidad (kg, tons, m3)
  vin?: string;               // Número VIN
  color?: string;             // Color
  status: boolean;            // Activo/Inactivo
  notes?: string;             // Notas
  createdAt: Date;
  updatedAt: Date;
}
```

### Tabla `vehicle_documents` (Nueva)

```typescript
{
  id: number;
  vehicleId: number;
  documentType: string;       // Tipo de documento
  documentName: string;       // Nombre del documento
  fileName?: string;          // Nombre del archivo
  filePath?: string;          // Ruta del archivo
  fileSize?: number;          // Tamaño en bytes
  mimeType?: string;          // Tipo MIME
  issueDate?: Date;           // Fecha de emisión
  expirationDate?: Date;      // Fecha de vencimiento
  insuranceCompany?: string;  // Compañía aseguradora
  policyNumber?: string;      // Número de póliza
  coverageAmount?: number;    // Monto de cobertura
  notes?: string;             // Notas
  createdAt: Date;
  updatedAt: Date;
}
```

## Endpoints API

### CRUD de Camiones

#### `POST /trucks`

Crear un nuevo camión.

**Permisos requeridos**: `trucks:create`

**Body**:

```json
{
  "plateNumber": "ABCD12",
  "brand": "Mercedes-Benz",
  "model": "Actros 2646",
  "year": 2023,
  "vehicleType": "truck",
  "capacity": 25000,
  "capacityUnit": "kg",
  "vin": "WDB9640331L123456",
  "color": "Blanco",
  "status": true,
  "notes": "Camión para transporte de maquinaria pesada"
}
```

#### `GET /trucks`

Obtener todos los camiones con filtros y paginación.

**Permisos requeridos**: `trucks:read`

**Query Parameters**:

- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
- `search`: Búsqueda por patente, marca o modelo
- `vehicleType`: Filtrar por tipo de vehículo
- `status`: Filtrar por estado (true/false)
- `includeDocuments`: Incluir documentos (true/false)
- `includeStats`: Incluir estadísticas (true/false)

**Ejemplo**:

```
GET /trucks?page=1&limit=10&search=ABCD&vehicleType=truck&includeDocuments=true
```

#### `GET /trucks/:id`

Obtener un camión por ID.

**Permisos requeridos**: `trucks:read`

**Query Parameters**:

- `includeRelations`: Incluir relaciones (documentos, estadísticas)

#### `PUT /trucks/:id`

Actualizar un camión.

**Permisos requeridos**: `trucks:update`

**Body**: Similar a POST, todos los campos opcionales.

#### `DELETE /trucks/:id`

Eliminar un camión.

**Permisos requeridos**: `trucks:delete`

**Nota**: No se puede eliminar si tiene operaciones activas.

### Gestión de Documentos

#### `POST /trucks/documents`

Agregar un documento a un camión.

**Permisos requeridos**: `trucks:update`

**Body**:

```json
{
  "vehicleId": 1,
  "documentType": "technical_review",
  "documentName": "Revisión Técnica 2024",
  "fileName": "revision_tecnica_2024.pdf",
  "filePath": "/uploads/vehicles/1/revision_tecnica_2024.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf",
  "issueDate": "2024-01-15",
  "expirationDate": "2025-01-15",
  "notes": "Revisión técnica aprobada"
}
```

#### `GET /trucks/:id/documents`

Obtener todos los documentos de un camión.

**Permisos requeridos**: `trucks:read`

#### `PUT /trucks/documents/:documentId`

Actualizar un documento.

**Permisos requeridos**: `trucks:update`

#### `DELETE /trucks/documents/:documentId`

Eliminar un documento.

**Permisos requeridos**: `trucks:delete`

#### `GET /trucks/documents/expiring?days=30`

Obtener documentos próximos a vencer.

**Permisos requeridos**: `trucks:read`

**Query Parameters**:

- `days`: Días de anticipación (default: 30)

### Estado Operativo

#### `GET /trucks/:id/operational-status`

Obtener estado operativo de un camión.

**Permisos requeridos**: `trucks:read`

**Response**:

```json
{
  "vehicleId": 1,
  "operationalStatus": "active"
}
```

### Historial de Operaciones

#### `GET /trucks/:id/operations/history?limit=10`

Obtener historial de operaciones de un camión.

**Permisos requeridos**: `trucks:read`

**Query Parameters**:

- `limit`: Número de operaciones a retornar (default: 10)

#### `GET /trucks/:id/operations/upcoming`

Obtener próximas operaciones de un camión.

**Permisos requeridos**: `trucks:read`

## Tipos de Vehículos

```typescript
enum VehicleType {
  TRUCK = 'truck',
  VAN = 'van',
  PICKUP = 'pickup',
  FLATBED = 'flatbed',
  TRAILER = 'trailer',
  DUMP_TRUCK = 'dump_truck',
  CRANE_TRUCK = 'crane_truck',
  OTHER = 'other',
}
```

## Unidades de Capacidad

```typescript
enum CapacityUnit {
  KG = 'kg',
  TONS = 'tons',
  M3 = 'm3',
  PASSENGERS = 'passengers',
}
```

## Estados Operativos

```typescript
enum OperationalStatus {
  ACTIVE = 'active', // Activo y disponible
  MAINTENANCE = 'maintenance', // En mantenimiento
  OUT_OF_SERVICE = 'out_of_service', // Fuera de servicio
  RESERVED = 'reserved', // Reservado para operación
}
```

## Tipos de Documentos

```typescript
enum DocumentType {
  CIRCULATION_PERMIT = 'circulation_permit', // Permiso de circulación
  TECHNICAL_REVIEW = 'technical_review', // Revisión técnica
  INSURANCE = 'insurance', // Seguro
  OWNERSHIP = 'ownership', // Certificado de propiedad
  GAS_CERTIFICATION = 'gas_certification', // Certificación de gas
  OTHER = 'other', // Otro
}
```

## Permisos

El módulo utiliza los siguientes permisos:

- `trucks:create` - Crear camiones
- `trucks:read` - Leer información de camiones
- `trucks:update` - Actualizar camiones
- `trucks:delete` - Eliminar camiones
- `trucks:documents:create` - Crear documentos
- `trucks:documents:read` - Leer documentos
- `trucks:documents:update` - Actualizar documentos
- `trucks:documents:delete` - Eliminar documentos
- `trucks:status:read` - Leer estado operativo
- `trucks:status:update` - Actualizar estado operativo
- `trucks:operations:read` - Leer historial de operaciones
- `trucks:stats:read` - Leer estadísticas de flota

## Validaciones

1. **Patente única**: No pueden existir dos camiones con la misma patente en el mismo operador.
2. **Operaciones activas**: No se puede eliminar un camión con operaciones activas (scheduled o in-progress).
3. **Estado operativo automático**: Se calcula basándose en:
   - Estado del vehículo (status)
   - Operaciones activas
   - Documentos vencidos

## Campos Calculados

### En TruckResponseDto:

- `operationalStatus`: Estado operativo calculado
- `totalOperations`: Número total de operaciones
- `upcomingOperations`: Número de operaciones futuras
- `lastOperationDate`: Fecha de la última operación completada

### En VehicleDocumentResponseDto:

- `isExpired`: Indica si el documento está vencido
- `daysUntilExpiration`: Días hasta el vencimiento

## Ejemplos de Uso

### Crear un camión

```bash
curl -X POST http://localhost:3000/trucks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "ABCD12",
    "brand": "Mercedes-Benz",
    "model": "Actros 2646",
    "year": 2023,
    "vehicleType": "truck",
    "capacity": 25000,
    "capacityUnit": "kg"
  }'
```

### Listar camiones con filtros

```bash
curl -X GET "http://localhost:3000/trucks?page=1&limit=10&search=Mercedes&includeDocuments=true" \
  -H "Authorization: Bearer $TOKEN"
```

### Agregar documento

```bash
curl -X POST http://localhost:3000/trucks/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": 1,
    "documentType": "technical_review",
    "documentName": "Revisión Técnica 2024",
    "expirationDate": "2025-01-15"
  }'
```

### Consultar documentos por vencer

```bash
curl -X GET "http://localhost:3000/trucks/documents/expiring?days=30" \
  -H "Authorization: Bearer $TOKEN"
```

## Migraciones

Para aplicar las migraciones de la base de datos:

```bash
# Generar migración
npm run db:generate

# Aplicar migración
npm run db:push
```

## Seeds

Para crear los permisos del módulo:

```bash
npm run seed:permissions
```

## Próximas Mejoras

1. Integración con sistema de archivos para almacenar documentos
2. Notificaciones automáticas de documentos por vencer
3. Reportes y estadísticas avanzadas de la flota
4. Integración con módulo de mantenimiento
5. Dashboard de estado de la flota
6. Geolocalización de vehículos (GPS)
7. Asignación automática de vehículos a operaciones
