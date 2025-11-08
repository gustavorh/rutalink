# Routes Module (Módulo de Rutas/Tramos)

## Descripción

El módulo `routes` gestiona las rutas o tramos que definen los trayectos entre ubicaciones en el sistema de transporte. Permite registrar información como origen, destino, distancia, duración estimada, tipo de ruta, condiciones del camino, peajes requeridos, y más.

## Estructura del Módulo

```
routes/
├── dto/
│   └── route.dto.ts          # DTOs de validación
├── routes.controller.ts       # Controlador con endpoints REST
├── routes.service.ts          # Lógica de negocio
├── routes.module.ts           # Módulo NestJS
└── index.ts                   # Exportaciones públicas
```

## Tabla de Base de Datos

### `routes`

- **id**: INT PRIMARY KEY AUTO_INCREMENT
- **operator_id**: INT NOT NULL (FK → operators.id)
- **name**: VARCHAR(255) NOT NULL - Nombre descriptivo del tramo
- **code**: VARCHAR(50) - Código interno del tramo
- **origin**: VARCHAR(500) NOT NULL - Ubicación de origen
- **destination**: VARCHAR(500) NOT NULL - Ubicación de destino
- **distance**: INT - Distancia en km
- **estimated_duration**: INT - Duración estimada en minutos
- **route_type**: VARCHAR(50) - Tipo: urbana, interurbana, minera, rural, carretera, montaña, otra
- **difficulty**: VARCHAR(20) - Dificultad: fácil, moderada, difícil
- **road_conditions**: VARCHAR(500) - Condiciones de la ruta
- **tolls_required**: BOOLEAN DEFAULT false - Si requiere peajes
- **estimated_toll_cost**: INT - Costo estimado de peajes
- **status**: BOOLEAN DEFAULT true NOT NULL - Activo/Inactivo
- **observations**: VARCHAR(1000)
- **notes**: VARCHAR(1000)
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
- **created_by**: INT (FK → users.id)
- **updated_by**: INT (FK → users.id)

### Índices

- `route_operator_id_idx` en operator_id
- `route_name_idx` en name
- `route_code_idx` en (operator_id, code)
- `route_type_idx` en route_type
- `route_status_idx` en status

### Relaciones

- **Muchos a Uno**: routes → operators
- **Uno a Muchos**: routes → operations (routeId opcional en operations)

## DTOs

### CreateRouteDto

```typescript
{
  name: string;              // REQUIRED - Nombre descriptivo
  code?: string;             // OPTIONAL - Código interno
  origin: string;            // REQUIRED - Ubicación de origen
  destination: string;       // REQUIRED - Ubicación de destino
  distance?: number;         // OPTIONAL - Distancia en km (>0)
  estimatedDuration?: number;// OPTIONAL - Duración en minutos (>0)
  routeType?: string;        // OPTIONAL - urbana|interurbana|minera|rural|carretera|montaña|otra
  difficulty?: string;       // OPTIONAL - fácil|moderada|difícil
  roadConditions?: string;   // OPTIONAL - Condiciones del camino
  tollsRequired?: boolean;   // OPTIONAL - Si requiere peajes
  estimatedTollCost?: number;// OPTIONAL - Costo de peajes (>=0)
  observations?: string;     // OPTIONAL
  notes?: string;            // OPTIONAL
}
```

### UpdateRouteDto

Todos los campos opcionales, misma estructura que CreateRouteDto más:

```typescript
{
  status?: boolean;          // OPTIONAL - Activar/desactivar ruta
}
```

### RouteQueryDto

```typescript
{
  search?: string;           // Búsqueda en name, code, origin, destination
  routeType?: string;        // Filtrar por tipo de ruta
  difficulty?: string;       // Filtrar por dificultad
  status?: boolean;          // Filtrar por estado activo/inactivo
  tollsRequired?: boolean;   // Filtrar rutas con/sin peajes
  page?: number;             // DEFAULT: 1
  limit?: number;            // DEFAULT: 10
}
```

## Endpoints

### 1. GET /routes

**Descripción**: Listar todas las rutas del operador con filtros y paginación

**Permisos**: `routes:read`

**Query Parameters**:

- search (opcional): Búsqueda por nombre, código, origen o destino
- routeType (opcional): Filtrar por tipo de ruta
- difficulty (opcional): Filtrar por dificultad
- status (opcional): Filtrar por estado (true/false)
- tollsRequired (opcional): Filtrar rutas con/sin peajes
- page (opcional): Número de página (default: 1)
- limit (opcional): Resultados por página (default: 10)

**Response**:

```json
{
  "data": [
    {
      "id": 1,
      "operatorId": 1,
      "name": "Santiago - Valparaíso",
      "code": "SCL-VLP-01",
      "origin": "Santiago Centro",
      "destination": "Puerto Valparaíso",
      "distance": 120,
      "estimatedDuration": 90,
      "routeType": "interurbana",
      "difficulty": "moderada",
      "roadConditions": "Autopista en buen estado",
      "tollsRequired": true,
      "estimatedTollCost": 3500,
      "status": true,
      "observations": "Tráfico pesado en hora punta",
      "notes": null,
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z",
      "createdBy": 1,
      "updatedBy": 1
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 2. GET /routes/:id

**Descripción**: Obtener una ruta específica por ID

**Permisos**: `routes:read`

**Params**:

- id: ID de la ruta

**Response**: Objeto de ruta (ver estructura arriba)

**Errores**:

- 404: Ruta no encontrada

### 3. POST /routes

**Descripción**: Crear una nueva ruta

**Permisos**: `routes:create`

**Body**: CreateRouteDto (ver arriba)

**Validaciones**:

- El código debe ser único por operador (si se proporciona)
- El nombre debe ser único por operador
- La distancia debe ser mayor a 0 (si se proporciona)
- La duración estimada debe ser mayor a 0 (si se proporciona)
- El costo de peajes no puede ser negativo

**Response**: Objeto de ruta creada

**Errores**:

- 409: Ya existe una ruta con ese código o nombre
- 400: Validación fallida (distancia, duración o costo de peajes inválido)

### 4. PUT /routes/:id

**Descripción**: Actualizar una ruta existente

**Permisos**: `routes:update`

**Params**:

- id: ID de la ruta

**Body**: UpdateRouteDto (ver arriba)

**Validaciones**:

- Si se actualiza el código, debe ser único por operador
- Si se actualiza el nombre, debe ser único por operador
- La distancia debe ser mayor a 0 (si se proporciona)
- La duración estimada debe ser mayor a 0 (si se proporciona)
- El costo de peajes no puede ser negativo

**Response**: Objeto de ruta actualizada

**Errores**:

- 404: Ruta no encontrada
- 409: Ya existe otra ruta con ese código o nombre
- 400: Validación fallida

### 5. DELETE /routes/:id

**Descripción**: Eliminar una ruta

**Permisos**: `routes:delete`

**Params**:

- id: ID de la ruta

**Validaciones**:

- No se puede eliminar si está siendo usada en operaciones

**Response**:

```json
{
  "message": "Ruta eliminada correctamente",
  "route": {
    /* objeto de ruta eliminada */
  }
}
```

**Errores**:

- 404: Ruta no encontrada
- 400: La ruta está siendo usada en N operación(es)

### 6. GET /routes/:id/statistics

**Descripción**: Obtener estadísticas de operaciones asociadas a una ruta

**Permisos**: `routes:read`

**Params**:

- id: ID de la ruta

**Response**:

```json
{
  "route": {
    "id": 1,
    "name": "Santiago - Valparaíso"
    // ... otros campos de la ruta
  },
  "statistics": {
    "totalOperations": 150,
    "completedOperations": 120,
    "scheduledOperations": 20,
    "inProgressOperations": 5,
    "cancelledOperations": 5
  }
}
```

**Errores**:

- 404: Ruta no encontrada

## Reglas de Negocio

1. **Multi-tenancy**: Todas las rutas están aisladas por `operatorId`
2. **Unicidad de Código**: El código de ruta debe ser único dentro de un operador (si se proporciona)
3. **Unicidad de Nombre**: El nombre de ruta debe ser único dentro de un operador
4. **Validación de Distancia**: Si se proporciona, debe ser mayor a 0
5. **Validación de Duración**: Si se proporciona, debe ser mayor a 0
6. **Validación de Peajes**: El costo de peajes no puede ser negativo
7. **Protección de Eliminación**: No se puede eliminar una ruta que está siendo usada en operaciones
8. **Estado Activo**: Las rutas pueden desactivarse con `status: false` sin eliminarlas
9. **Auditoría**: Se registra quién creó y modificó cada ruta

## Tipos de Ruta Soportados

- `urbana`: Rutas dentro de zonas urbanas
- `interurbana`: Rutas entre ciudades
- `minera`: Rutas en zonas mineras
- `rural`: Rutas en zonas rurales
- `carretera`: Rutas de carretera principales
- `montaña`: Rutas de montaña
- `otra`: Otros tipos de ruta

## Niveles de Dificultad

- `fácil`: Ruta fácil de transitar
- `moderada`: Ruta con dificultad media
- `difícil`: Ruta con alta dificultad

## Integración con Operations

Las rutas se vinculan opcionalmente con las operaciones mediante el campo `routeId` en la tabla `operations`. Esto permite:

1. **Planificación de Rutas**: Asociar operaciones a rutas predefinidas
2. **Estadísticas**: Analizar frecuencia de uso de cada ruta
3. **Optimización**: Identificar rutas más eficientes
4. **Costos**: Estimar costos de peajes y combustible por ruta

## Ejemplos de Uso

### Crear una ruta urbana

```bash
POST /routes
{
  "name": "Centro - Aeropuerto",
  "code": "URB-001",
  "origin": "Santiago Centro",
  "destination": "Aeropuerto Arturo Merino Benítez",
  "distance": 25,
  "estimatedDuration": 30,
  "routeType": "urbana",
  "difficulty": "fácil",
  "tollsRequired": false
}
```

### Crear una ruta interurbana con peajes

```bash
POST /routes
{
  "name": "Santiago - Valparaíso Vía Autopista",
  "code": "INT-001",
  "origin": "Santiago",
  "destination": "Valparaíso",
  "distance": 120,
  "estimatedDuration": 90,
  "routeType": "interurbana",
  "difficulty": "moderada",
  "roadConditions": "Autopista Ruta 68 en excelente estado",
  "tollsRequired": true,
  "estimatedTollCost": 3500,
  "observations": "Considerar tráfico en hora punta"
}
```

### Buscar rutas con peajes

```bash
GET /routes?tollsRequired=true&page=1&limit=20
```

### Obtener estadísticas de una ruta

```bash
GET /routes/1/statistics
```

## Notas de Implementación

1. **Soft Delete**: Se usa el campo `status` para desactivar rutas en lugar de eliminarlas
2. **Búsqueda Flexible**: El campo `search` busca en nombre, código, origen y destino
3. **Validaciones Estrictas**: TypeScript + class-validator aseguran integridad de datos
4. **Referential Integrity**: Foreign keys con `onDelete: 'restrict'` en operations protegen rutas en uso
5. **Optimización**: Índices en campos frecuentemente consultados (operatorId, name, code, routeType, status)

## Mejoras Futuras

- [ ] Agregar coordenadas GPS (latitud/longitud) para origen y destino
- [ ] Integración con servicios de mapas (Google Maps, OpenStreetMap)
- [ ] Cálculo automático de distancia y duración
- [ ] Waypoints intermedios en la ruta
- [ ] Alertas de condiciones climáticas por ruta
- [ ] Historial de cambios en condiciones de la ruta
- [ ] Rutas alternativas sugeridas
- [ ] Cálculo de emisiones de CO2 por ruta
