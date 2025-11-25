# Documentación del Sistema RutaLink - Backend

## Índice

1. [Propósito de la Aplicación](#1-propósito-de-la-aplicación)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Estructura de Carpetas](#3-estructura-de-carpetas)
4. [Patrones de Diseño Utilizados](#4-patrones-de-diseño-utilizados)
5. [Flujo de Datos dentro del Sistema](#5-flujo-de-datos-dentro-del-sistema)
6. [Autenticación del Sistema](#6-autenticación-del-sistema)

---

## 1. Propósito de la Aplicación

**RutaLink** es un sistema de gestión de operaciones de transporte diseñado para empresas de logística y transporte en Chile. El sistema permite gestionar de manera integral:

### Funcionalidades Principales

- **Gestión de Operadores (Multi-tenant)**: El sistema soporta múltiples operadores (empresas), cada uno con su propia base de datos lógica aislada. Esto permite que diferentes empresas de transporte utilicen la misma plataforma sin interferir entre sí.

- **Gestión de Choferes**: Administración completa de conductores, incluyendo:
  - Información personal y de contacto
  - Licencias de conducir con fechas de vencimiento
  - Documentación asociada (certificados, exámenes médicos, etc.)
  - Contactos de emergencia

- **Gestión de Vehículos**: Control de la flota vehicular:
  - Registro de vehículos con información técnica
  - Documentación vehicular (permisos de circulación, revisiones técnicas, seguros)
  - Asignaciones chofer-vehículo

- **Gestión de Clientes**: Administración de clientes y sus operaciones:
  - Razón social, RUT y contactos
  - Clasificación por industria (minería, construcción, etc.)
  - Historial de operaciones

- **Gestión de Proveedores**: Control de proveedores de transporte externos:
  - Datos de la empresa
  - Tipos de servicio ofrecidos
  - Calificaciones

- **Gestión de Rutas/Tramos**: Definición de rutas de transporte:
  - Origen y destino
  - Distancia y duración estimada
  - Condiciones del camino y peajes

- **Gestión de Operaciones**: Control completo del ciclo de vida de las operaciones de transporte:
  - Programación de viajes
  - Asignación de chofer y vehículo
  - Seguimiento de estados (programado, en progreso, completado, cancelado)
  - Generación de reportes en PDF y Excel

- **Auditoría**: Registro automático de todas las acciones realizadas en el sistema para trazabilidad y cumplimiento.

### Stack Tecnológico

| Componente          | Tecnología                          |
| ------------------- | ----------------------------------- |
| Framework Backend   | NestJS 11                           |
| Lenguaje            | TypeScript 5.7                      |
| Base de Datos       | MySQL (via mysql2)                  |
| ORM                 | Drizzle ORM                         |
| Autenticación       | JWT + Passport                      |
| Validación          | class-validator + class-transformer |
| Documentación API   | Swagger/OpenAPI                     |
| Generación Reportes | ExcelJS + Puppeteer (PDF)           |

---

## 2. Arquitectura del Sistema

### 2.1 Arquitectura General

El sistema sigue una **arquitectura modular por capas** basada en los principios de NestJS, combinando:

```
┌─────────────────────────────────────────────────────────────────┐
│                      CAPA DE PRESENTACIÓN                       │
│  (Controllers - Endpoints REST API)                              │
├─────────────────────────────────────────────────────────────────┤
│                     CAPA DE APLICACIÓN                          │
│  (Services - Lógica de negocio)                                  │
├─────────────────────────────────────────────────────────────────┤
│                     CAPA DE DOMINIO                             │
│  (DTOs, Entidades, Interfaces)                                   │
├─────────────────────────────────────────────────────────────────┤
│                    CAPA DE PERSISTENCIA                         │
│  (Repositories - Acceso a datos)                                 │
├─────────────────────────────────────────────────────────────────┤
│                    CAPA DE INFRAESTRUCTURA                      │
│  (Database Module, Config, Guards, Filters, Interceptors)        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Arquitectura Multi-Tenant

El sistema implementa **multi-tenancy a nivel de fila** (Row-Level Multi-Tenancy):

```
┌───────────────────────────────────────────────────┐
│                    APLICACIÓN                      │
│                    (Instancia Única)               │
├───────────────────────────────────────────────────┤
│                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ Operador A  │  │ Operador B  │  │Operador C │ │
│  │ (operatorId │  │ (operatorId │  │(operatorId│ │
│  │    = 1)     │  │    = 2)     │  │   = 3)    │ │
│  └─────────────┘  └─────────────┘  └───────────┘ │
│                                                    │
├───────────────────────────────────────────────────┤
│                BASE DE DATOS ÚNICA                 │
│    (Cada registro tiene un `operatorId`)          │
└───────────────────────────────────────────────────┘
```

**Características del Multi-Tenancy:**

- Cada tabla relevante contiene una columna `operatorId` como foreign key
- Los índices están optimizados para consultas por `operatorId`
- El aislamiento de datos se garantiza en la capa de Repository
- Los operadores "super" tienen acceso a datos de todos los operadores

### 2.3 Diagrama de Módulos

```
                         ┌───────────────┐
                         │  AppModule    │
                         │   (Root)      │
                         └───────┬───────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐    ┌───────────────────┐    ┌──────────────────┐
│ ConfigModule  │    │  DatabaseModule   │    │    AuthModule    │
│  (Global)     │    │    (Global)       │    │                  │
└───────────────┘    └───────────────────┘    └──────────────────┘
                                                       │
                                              ┌────────┴────────┐
                                              │                 │
                                              ▼                 ▼
                                     ┌─────────────┐   ┌─────────────┐
                                     │ UsersModule │   │ AuditModule │
                                     └─────────────┘   └─────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      MÓDULOS DE NEGOCIO                          │
│                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐        │
│  │ DriversModule│  │ VehiclesModule│  │ OperationsModule│        │
│  └──────────────┘  └───────────────┘  └────────────────┘        │
│                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐        │
│  │ ClientsModule│  │ProvidersModule│  │  RoutesModule  │        │
│  └──────────────┘  └───────────────┘  └────────────────┘        │
│                                                                  │
│  ┌────────────────┐                                              │
│  │OperatorsModule │                                              │
│  └────────────────┘                                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Estructura de Carpetas

```
backend/
├── src/
│   ├── main.ts                          # Punto de entrada de la aplicación
│   ├── app.module.ts                    # Módulo raíz
│   ├── app.controller.ts                # Controlador raíz (health check)
│   ├── app.service.ts                   # Servicio raíz
│   │
│   ├── auth/                            # 🔐 Módulo de Autenticación
│   │   ├── auth.module.ts               # Definición del módulo
│   │   ├── auth.controller.ts           # Endpoints de auth (login, register)
│   │   ├── auth.service.ts              # Lógica de autenticación
│   │   ├── roles.controller.ts          # Gestión de roles
│   │   ├── roles.service.ts             # Lógica de roles
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts     # Extrae usuario del request
│   │   │   └── require-permission.decorator.ts # Define permisos requeridos
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts        # Validación de JWT
│   │   │   ├── local-auth.guard.ts      # Autenticación local
│   │   │   └── permissions.guard.ts     # Verificación de permisos
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts          # Estrategia JWT de Passport
│   │   │   └── local.strategy.ts        # Estrategia local de Passport
│   │   ├── interceptors/
│   │   │   └── audit.interceptor.ts     # Registro de auditoría
│   │   ├── repositories/
│   │   │   └── roles.repository.ts      # Acceso a datos de roles
│   │   └── dto/
│   │       ├── auth.dto.ts              # DTOs de autenticación
│   │       └── role.dto.ts              # DTOs de roles
│   │
│   ├── users/                           # 👤 Módulo de Usuarios
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── repositories/
│   │   │   └── users.repository.ts
│   │   └── dto/
│   │       └── user.dto.ts
│   │
│   ├── operators/                       # 🏢 Módulo de Operadores (Tenants)
│   │   ├── operators.module.ts
│   │   ├── operators.controller.ts
│   │   ├── operators.service.ts
│   │   ├── repositories/
│   │   │   └── operators.repository.ts
│   │   └── dto/
│   │       └── operator.dto.ts
│   │
│   ├── drivers/                         # 🚗 Módulo de Choferes
│   │   ├── drivers.module.ts
│   │   ├── drivers.controller.ts
│   │   ├── drivers.service.ts
│   │   ├── repositories/
│   │   │   ├── drivers.repository.ts
│   │   │   └── driver-documents.repository.ts
│   │   └── dto/
│   │       └── driver.dto.ts
│   │
│   ├── vehicles/                        # 🚛 Módulo de Vehículos
│   │   ├── vehicles.module.ts
│   │   ├── vehicles.controller.ts
│   │   ├── vehicles.service.ts
│   │   ├── repositories/
│   │   │   ├── vehicles.repository.ts
│   │   │   └── vehicle-documents.repository.ts
│   │   └── dto/
│   │       └── vehicle.dto.ts
│   │
│   ├── clients/                         # 🏭 Módulo de Clientes
│   │   ├── clients.module.ts
│   │   ├── clients.controller.ts
│   │   ├── clients.service.ts
│   │   ├── repositories/
│   │   │   └── clients.repository.ts
│   │   └── dto/
│   │       └── client.dto.ts
│   │
│   ├── providers/                       # 🤝 Módulo de Proveedores
│   │   ├── providers.module.ts
│   │   ├── providers.controller.ts
│   │   ├── providers.service.ts
│   │   ├── repositories/
│   │   │   └── providers.repository.ts
│   │   └── dto/
│   │       └── provider.dto.ts
│   │
│   ├── routes/                          # 🛤️ Módulo de Rutas/Tramos
│   │   ├── routes.module.ts
│   │   ├── routes.controller.ts
│   │   ├── routes.service.ts
│   │   ├── repositories/
│   │   │   └── routes.repository.ts
│   │   └── dto/
│   │       └── route.dto.ts
│   │
│   ├── operations/                      # 📦 Módulo de Operaciones
│   │   ├── operations.module.ts
│   │   ├── operations.controller.ts
│   │   ├── operations.service.ts
│   │   ├── excel.service.ts             # Generación de reportes Excel
│   │   ├── pdf.service.ts               # Generación de reportes PDF
│   │   ├── repositories/
│   │   │   ├── operations.repository.ts
│   │   │   └── driver-vehicles.repository.ts
│   │   └── dto/
│   │       └── operation.dto.ts
│   │
│   ├── audit/                           # 📋 Módulo de Auditoría
│   │   ├── audit.module.ts
│   │   ├── audit.controller.ts
│   │   ├── audit.service.ts
│   │   └── repositories/
│   │       └── audit.repository.ts
│   │
│   ├── common/                          # 🔧 Utilidades Compartidas
│   │   ├── dto/
│   │   │   └── pagination.dto.ts        # DTO base para paginación
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts # Filtro global de excepciones
│   │   ├── pagination/
│   │   │   └── pagination.factory.ts    # Factory para respuestas paginadas
│   │   ├── query-builder/
│   │   │   └── query-builder.ts         # Builder para queries SQL
│   │   ├── repositories/
│   │   │   └── base.repository.ts       # Clase base para repositories
│   │   ├── responses/
│   │   │   └── api-response.ts          # Estructura de respuestas API
│   │   └── types/
│   │       └── request.types.ts         # Tipos de Request extendidos
│   │
│   └── database/                        # 🗄️ Configuración de Base de Datos
│       ├── database.module.ts           # Módulo de conexión a DB
│       ├── database.config.ts           # Configuración de conexión
│       ├── schema.ts                    # Esquema Drizzle (todas las tablas)
│       └── seeds/
│           ├── run-seed.ts              # Ejecutor de seeds
│           ├── default-user.seed.ts     # Seed de usuario por defecto
│           ├── permissions.seed.ts      # Seed de permisos y roles
│           └── sample-data.seed.ts      # Datos de ejemplo
│
├── drizzle/                             # Migraciones de Drizzle
│   └── *.sql                            # Archivos de migración
│
├── docs/
│   └── openapi.yaml                     # Especificación OpenAPI
│
├── test/                                # Tests
│   └── *.spec.ts
│
├── drizzle.config.ts                    # Configuración de Drizzle Kit
├── package.json                         # Dependencias
├── tsconfig.json                        # Configuración TypeScript
├── nest-cli.json                        # Configuración NestJS CLI
└── Dockerfile                           # Configuración Docker
```

---

## 4. Patrones de Diseño Utilizados

### 4.1 Repository Pattern

**Ubicación:** `src/**/repositories/*.repository.ts`

El patrón Repository encapsula la lógica de acceso a datos, separándola de la lógica de negocio.

**Implementación Base:**

```typescript
// src/common/repositories/base.repository.ts
export abstract class BaseRepository<T> {
  constructor(
    protected readonly db: MySql2Database<any>,
    protected readonly table: MySqlTable<any>,
  ) {}

  async findById(id: number): Promise<T | null> {
    /* ... */
  }
  async findByOperatorId(operatorId: number): Promise<T[]> {
    /* ... */
  }
  async create(data: Partial<T>, userId: number): Promise<number> {
    /* ... */
  }
  async update(id: number, data: Partial<T>, userId: number): Promise<void> {
    /* ... */
  }
  async delete(id: number): Promise<void> {
    /* ... */
  }
  async exists(id: number): Promise<boolean> {
    /* ... */
  }
  async count(whereClause?: SQL): Promise<number> {
    /* ... */
  }
}
```

**Implementación Específica:**

```typescript
// src/clients/repositories/clients.repository.ts
@Injectable()
export class ClientsRepository extends BaseRepository<Client> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.clients);
  }

  // Métodos específicos del dominio
  async findByBusinessName(
    operatorId: number,
    businessName: string,
  ): Promise<Client | null> {
    /* ... */
  }
  async findPaginated(/* params */): Promise<PaginatedResponse<Client>> {
    /* ... */
  }
}
```

### 4.2 Builder Pattern (Query Builder)

**Ubicación:** `src/common/query-builder/query-builder.ts`

Proporciona una interfaz fluida para construir cláusulas WHERE complejas de manera declarativa.

```typescript
// Uso típico
const whereClause = new QueryBuilder()
  .addEquals(schema.clients.operatorId, operatorId)
  .addEquals(schema.clients.status, status)
  .addSearch([schema.clients.businessName, schema.clients.taxId], searchTerm)
  .addDateRange(schema.clients.createdAt, startDate, endDate)
  .build();
```

**Métodos disponibles:**

- `addEquals(field, value)` - Condición de igualdad
- `addSearch(fields[], searchTerm)` - Búsqueda LIKE en múltiples campos
- `addDateRange(field, startDate, endDate)` - Rango de fechas
- `addGreaterThanOrEqual(field, value)` - Mayor o igual
- `addLessThanOrEqual(field, value)` - Menor o igual
- `addIn(field, values[])` - Condición IN
- `addOrEquals(fields[], value)` - OR entre campos
- `addCondition(sql)` - Condición SQL personalizada

### 4.3 Factory Pattern (Pagination Factory)

**Ubicación:** `src/common/pagination/pagination.factory.ts`

Estandariza la creación de respuestas paginadas en toda la aplicación.

```typescript
// Creación de respuesta paginada
const response = PaginationFactory.create(items, totalCount, page, limit);

// Respuesta generada:
{
  data: [...],
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10
  }
}
```

### 4.4 Strategy Pattern (Authentication Strategies)

**Ubicación:** `src/auth/strategies/`

Passport utiliza el patrón Strategy para manejar diferentes métodos de autenticación.

```typescript
// JWT Strategy - Valida tokens JWT
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: JwtPayload) {
    // Validación de token y usuario
    return { id, username, email, operatorId, roleId, isSuper };
  }
}

// Local Strategy - Autenticación usuario/contraseña
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  async validate(username: string, password: string) {
    // Validación de credenciales
    return user;
  }
}
```

### 4.5 Decorator Pattern

**Ubicación:** `src/auth/decorators/`

Decoradores personalizados para extender la funcionalidad de los métodos.

```typescript
// Decorador para extraer usuario autenticado
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Decorador para requerir permisos
export const RequirePermission = (resource: string, action: string) =>
  SetMetadata(REQUIRE_PERMISSION, { resource, action });
```

### 4.6 Guard Pattern

**Ubicación:** `src/auth/guards/`

Los Guards implementan la interfaz `CanActivate` para controlar el acceso a rutas.

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<PermissionMetadata>(
      REQUIRE_PERMISSION,
      context.getHandler(),
    );

    // Verificar si el usuario tiene el permiso requerido
    // ...
    return true;
  }
}
```

### 4.7 Interceptor Pattern

**Ubicación:** `src/auth/interceptors/audit.interceptor.ts`

Los Interceptors permiten ejecutar lógica antes y después de la ejecución de handlers.

```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap({
        next: (data) => {
          // Registrar acción exitosa en audit_log
        },
        error: (error) => {
          // Registrar error en audit_log
        },
      }),
    );
  }
}
```

### 4.8 Filter Pattern (Exception Filter)

**Ubicación:** `src/common/filters/http-exception.filter.ts`

Filtro global que captura todas las excepciones y las transforma en respuestas estandarizadas.

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Transformar excepción en respuesta API estándar
    response.status(status).json({
      success: false,
      error: {
        code: 'ERROR_CODE',
        message: 'Error message',
        details: {
          /* ... */
        },
      },
      timestamp: new Date().toISOString(),
    });
  }
}
```

### 4.9 Response Builder Pattern

**Ubicación:** `src/common/responses/api-response.ts`

Builder estático para crear respuestas API estandarizadas.

```typescript
// Respuesta exitosa
return ResponseBuilder.success(data, 'Operación exitosa');

// Respuesta paginada
return ResponseBuilder.paginated(items, pagination, 'Lista obtenida');

// Respuesta de error
return ResponseBuilder.error('NOT_FOUND', 'Recurso no encontrado');
```

### 4.10 Dependency Injection (IoC Container)

Todo el sistema utiliza inyección de dependencias de NestJS:

```typescript
@Injectable()
export class ClientsService {
  constructor(
    private clientsRepository: ClientsRepository, // Inyectado
    private operationsRepository: OperationsRepository, // Inyectado
  ) {}
}
```

---

## 5. Flujo de Datos dentro del Sistema

### 5.1 Diagrama de Flujo de una Request

```
                                    HTTP Request
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GLOBAL MIDDLEWARE                            │
│  • CORS                                                         │
│  • ValidationPipe (whitelist, transform)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       GUARDS                                     │
│                                                                  │
│  1. JwtAuthGuard                                                │
│     • Extrae token del header Authorization                      │
│     • Valida firma y expiración del JWT                         │
│     • Invoca JwtStrategy.validate()                              │
│        - Verifica que el usuario existe y está activo           │
│        - Verifica timeout de inactividad (30 min)               │
│        - Actualiza lastActivityAt                                │
│        - Inyecta user en request                                │
│                                                                  │
│  2. PermissionsGuard                                            │
│     • Lee metadata @RequirePermission del método                │
│     • Si usuario es "super", permite acceso                      │
│     • Consulta role_grants para verificar permiso               │
│     • Lanza ForbiddenException si no tiene permiso              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     INTERCEPTORS                                 │
│                                                                  │
│  AuditInterceptor (Pre-handler)                                 │
│     • Captura información del request                            │
│     • Prepara contexto para logging                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CONTROLLER                                  │
│                                                                  │
│  @Controller('clients')                                         │
│  @UseGuards(JwtAuthGuard, PermissionsGuard)                     │
│  export class ClientsController {                               │
│                                                                  │
│    @Post()                                                      │
│    @RequirePermission('clients', 'create')                      │
│    async createClient(                                          │
│      @Body() dto: CreateClientDto,  // Validado automáticamente │
│      @Request() req: RequestWithUser, // Usuario autenticado    │
│    ) {                                                          │
│      return this.clientsService.createClient(dto, req.user.id); │
│    }                                                            │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICE                                   │
│                                                                  │
│  @Injectable()                                                  │
│  export class ClientsService {                                  │
│    constructor(                                                 │
│      private clientsRepository: ClientsRepository,              │
│      private operationsRepository: OperationsRepository,        │
│    ) {}                                                         │
│                                                                  │
│    async createClient(dto, userId) {                            │
│      // 1. Validaciones de negocio                              │
│      //    - Verificar que el operador existe                   │
│      //    - Verificar duplicados                               │
│                                                                  │
│      // 2. Llamar al repository                                 │
│      const id = await this.clientsRepository.create(dto, userId);│
│                                                                  │
│      // 3. Retornar resultado                                   │
│      return this.getClientById(id);                             │
│    }                                                            │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REPOSITORY                                  │
│                                                                  │
│  @Injectable()                                                  │
│  export class ClientsRepository extends BaseRepository<Client> {│
│                                                                  │
│    async create(data, userId) {                                 │
│      const [result] = await this.db                             │
│        .insert(this.table)                                      │
│        .values({                                                │
│          ...data,                                               │
│          createdBy: userId,                                     │
│          updatedBy: userId,                                     │
│        });                                                      │
│      return result.insertId;                                    │
│    }                                                            │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE                                    │
│                                                                  │
│  Drizzle ORM → MySQL2 Driver → MySQL Database                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼ (Response va hacia arriba)
┌─────────────────────────────────────────────────────────────────┐
│                 INTERCEPTORS (Post-handler)                      │
│                                                                  │
│  AuditInterceptor                                               │
│     • Registra acción en audit_log                              │
│     • Captura: userId, operatorId, action, resource, details    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXCEPTION FILTER (si hay error)                     │
│                                                                  │
│  GlobalExceptionFilter                                          │
│     • Captura HttpException o Error                             │
│     • Transforma en respuesta API estándar                      │
│     • Log del error                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                      HTTP Response
```

### 5.2 Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE LOGIN                                │
└─────────────────────────────────────────────────────────────────┘

    Cliente                    Backend
       │                          │
       │  POST /api/auth/login    │
       │  {username, password}    │
       ├─────────────────────────►│
       │                          │
       │                    ┌─────┴─────┐
       │                    │LocalGuard │
       │                    └─────┬─────┘
       │                          │
       │                    ┌─────┴─────┐
       │                    │LocalStrategy.validate()│
       │                    │  - Buscar usuario      │
       │                    │  - Verificar status    │
       │                    │  - Comparar passwords  │
       │                    └─────┬─────┘
       │                          │
       │                    ┌─────┴─────┐
       │                    │AuthService.login()    │
       │                    │  - Generar JWT        │
       │                    │  - Actualizar lastActivityAt│
       │                    └─────┬─────┘
       │                          │
       │  {                       │
       │    access_token: "...",  │
       │    user: {...}           │
       │  }                       │
       │◄─────────────────────────┤
       │                          │


┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE REQUEST AUTENTICADO                  │
└─────────────────────────────────────────────────────────────────┘

    Cliente                    Backend
       │                          │
       │  GET /api/clients        │
       │  Authorization: Bearer <token>
       ├─────────────────────────►│
       │                          │
       │                    ┌─────┴─────┐
       │                    │JwtAuthGuard│
       │                    │  - Extraer token     │
       │                    └─────┬─────┘
       │                          │
       │                    ┌─────┴─────┐
       │                    │JwtStrategy.validate()│
       │                    │  - Decodificar JWT   │
       │                    │  - Verificar user    │
       │                    │  - Check inactividad │
       │                    │  - Update activity   │
       │                    └─────┬─────┘
       │                          │
       │                    ┌─────┴─────┐
       │                    │PermissionsGuard      │
       │                    │  - Leer @RequirePermission│
       │                    │  - Verificar grants  │
       │                    └─────┬─────┘
       │                          │
       │                    ┌─────┴─────┐
       │                    │ Controller           │
       │                    │  → Service           │
       │                    │    → Repository      │
       │                    │      → Database      │
       │                    └─────┬─────┘
       │                          │
       │  { success: true,        │
       │    data: {...},          │
       │    timestamp: "..."      │
       │  }                       │
       │◄─────────────────────────┤
       │                          │
```

### 5.3 Ciclo de Vida de un Request en NestJS

```
Request → Middleware → Guards → Interceptors (pre) → Pipes → Controller
                                                              ↓
Response ← Exception Filters ← Interceptors (post) ←──────── Handler
```

**Detalle de cada etapa:**

| Etapa                   | Responsabilidad                         | Implementación en RutaLink            |
| ----------------------- | --------------------------------------- | ------------------------------------- |
| **Middleware**          | Procesamiento previo a nivel de Express | CORS, Body Parser                     |
| **Guards**              | Autorización/Autenticación              | JwtAuthGuard, PermissionsGuard        |
| **Interceptors (pre)**  | Lógica antes del handler                | AuditInterceptor (preparación)        |
| **Pipes**               | Transformación/Validación               | ValidationPipe (global), ParseIntPipe |
| **Controller**          | Routing y delegación                    | \*Controller.ts                       |
| **Service**             | Lógica de negocio                       | \*Service.ts                          |
| **Repository**          | Acceso a datos                          | \*Repository.ts                       |
| **Interceptors (post)** | Lógica después del handler              | AuditInterceptor (registro)           |
| **Exception Filters**   | Manejo de errores                       | GlobalExceptionFilter                 |

---

## 6. Autenticación del Sistema

### 6.1 Modelo de Seguridad

El sistema implementa un modelo de seguridad basado en **RBAC (Role-Based Access Control)** con soporte multi-tenant.

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODELO DE PERMISOS                            │
└─────────────────────────────────────────────────────────────────┘

  ┌────────────┐         ┌────────────┐         ┌────────────┐
  │  OPERATOR  │◄────────│    USER    │────────►│    ROLE    │
  │  (Tenant)  │  1:N    └────────────┘   N:1   └────────────┘
  └────────────┘                                      │
                                                      │ N:M
                                                      ▼
                                              ┌────────────┐
                                              │   GRANT    │
                                              │ (Permiso)  │
                                              └────────────┘
```

### 6.2 Estructura de Tablas de Autenticación

```sql
-- Operadores (Tenants)
operators {
  id: int PK
  name: varchar(255)
  rut: varchar(12) UNIQUE        -- Ej: 21.023.531-0
  super: boolean DEFAULT false   -- Operador con acceso total
  expiration: timestamp          -- Fecha de expiración del tenant
  status: boolean DEFAULT true
}

-- Usuarios
users {
  id: int PK
  username: varchar(50) UNIQUE
  email: varchar(255) UNIQUE
  password: varchar(255)         -- Hasheado con bcrypt
  firstName: varchar(100)
  lastName: varchar(100)
  status: boolean DEFAULT true
  lastActivityAt: timestamp      -- Para control de inactividad
  operatorId: int FK → operators.id
  roleId: int FK → roles.id
}

-- Roles (por operador)
roles {
  id: int PK
  name: varchar(100)             -- Ej: Administrador, Operador, Chofer
  operatorId: int FK → operators.id
  UNIQUE(operatorId, name)       -- Nombre único por operador
}

-- Grants (Permisos - Universales)
grants {
  id: int PK
  resource: varchar(100)         -- Ej: users, drivers, operations
  action: varchar(50)            -- Ej: create, read, update, delete
  UNIQUE(resource, action)
}

-- Role-Grants (Asignación de permisos a roles)
role_grants {
  roleId: int FK → roles.id
  grantId: int FK → grants.id
  PRIMARY KEY (roleId, grantId)
}
```

### 6.3 JWT (JSON Web Token)

**Estructura del Payload JWT:**

```typescript
interface JwtPayload {
  sub: number; // User ID
  username: string;
  email: string;
  operatorId: number; // Tenant ID
  roleId: number;
  isSuper: boolean; // Si el operador es "super"
}
```

**Configuración del JWT:**

```typescript
// Extracción del token
jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken();

// Validación
ignoreExpiration: false; // Tokens expirados son rechazados

// Secreto
secretOrKey: process.env.JWT_SECRET;
```

### 6.4 Sistema de Roles Predefinidos

El sistema viene con 5 roles predefinidos:

| Rol               | Descripción            | Permisos                                                    |
| ----------------- | ---------------------- | ----------------------------------------------------------- |
| **Administrador** | Acceso completo        | Todos los permisos                                          |
| **Supervisor**    | Control y seguimiento  | Casi todos excepto eliminación de usuarios/roles/operadores |
| **Operador**      | Gestión de operaciones | CRUD operaciones, lectura de recursos, asignaciones         |
| **Chofer**        | Ejecución en terreno   | Solo lectura de operaciones, rutas, vehículos               |
| **Visualizador**  | Solo lectura           | Dashboard y lectura de todos los recursos                   |

### 6.5 Permisos Disponibles (Grants)

Los permisos siguen el formato `recurso:acción`:

```typescript
// Formato general
{ resource: 'recurso', action: 'acción' }

// Ejemplos de permisos
const permisos = [
  // Usuarios
  { resource: 'users', action: 'create' },
  { resource: 'users', action: 'read' },
  { resource: 'users', action: 'update' },
  { resource: 'users', action: 'delete' },

  // Choferes
  { resource: 'drivers', action: 'create' },
  { resource: 'drivers', action: 'read' },
  { resource: 'drivers:documents', action: 'create' },
  { resource: 'drivers:documents', action: 'read' },

  // Operaciones
  { resource: 'operations', action: 'create' },
  { resource: 'operations', action: 'read' },
  { resource: 'operations', action: 'assign' },
  { resource: 'operations:assignments', action: 'create' },

  // Vehículos
  { resource: 'vehicles', action: 'create' },
  { resource: 'vehicles:documents', action: 'read' },
  { resource: 'vehicles:status', action: 'update' },

  // Reportes y Analytics
  { resource: 'dashboard', action: 'read' },
  { resource: 'analytics', action: 'read' },
  { resource: 'reports', action: 'export' },

  // Auditoría
  { resource: 'audit', action: 'read' },

  // Administración
  { resource: 'roles', action: 'create' },
  { resource: 'operators', action: 'create' },
];
```

### 6.6 Uso de Decoradores de Permisos

```typescript
@Controller('drivers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DriversController {
  // Requiere permiso drivers:create
  @Post()
  @RequirePermission('drivers', 'create')
  async createDriver(@Body() dto: CreateDriverDto) {
    // ...
  }

  // Requiere permiso drivers:read
  @Get()
  @RequirePermission('drivers', 'read')
  async getDrivers() {
    // ...
  }

  // Requiere permiso drivers:documents:create
  @Post(':id/documents')
  @RequirePermission('drivers:documents', 'create')
  async uploadDocument(@Param('id') id: number) {
    // ...
  }
}
```

### 6.7 Multi-Tenant: Aislamiento de Datos

**Principio de aislamiento:**

Cada usuario solo puede acceder a datos de su propio operador (tenant), excepto usuarios de operadores "super".

```typescript
// En JwtStrategy.validate()
return {
  id: payload.sub,
  username: payload.username,
  email: payload.email,
  operatorId: payload.operatorId, // <- Identificador del tenant
  roleId: payload.roleId,
  isSuper: payload.isSuper, // <- Flag de super operador
};
```

**Verificación en Guards:**

```typescript
// PermissionsGuard
async canActivate(context: ExecutionContext): Promise<boolean> {
  const user = request.user;

  // Super operators bypass all permission checks
  if (user.isSuper) {
    return true;
  }

  // Verificar permiso del rol del usuario
  // ...
}
```

**Filtrado en Repositories:**

```typescript
// Los repositorios filtran automáticamente por operatorId
async findByOperatorId(operatorId: number): Promise<T[]> {
  return this.db
    .select()
    .from(this.table)
    .where(eq(tableAny.operatorId, operatorId));
}
```

### 6.8 Control de Inactividad

El sistema implementa un timeout de inactividad de 30 minutos:

```typescript
// JwtStrategy.validate()
const INACTIVITY_TIMEOUT_MINUTES = 30;

// Verificar timeout
if (user.lastActivityAt) {
  const inactiveMinutes = (Date.now() - user.lastActivityAt.getTime()) / 60000;

  if (inactiveMinutes > INACTIVITY_TIMEOUT_MINUTES) {
    throw new UnauthorizedException(
      'Session expired due to inactivity. Please log in again.',
    );
  }
}

// Actualizar actividad
await this.db
  .update(users)
  .set({ lastActivityAt: new Date() })
  .where(eq(users.id, payload.sub));
```

### 6.9 Auditoría de Acciones

Todas las acciones de usuarios autenticados se registran automáticamente:

```typescript
// Estructura del registro de auditoría
audit_log {
  id: int PK
  userId: int FK           -- Usuario que realizó la acción
  operatorId: int FK       -- Operador del usuario
  action: varchar(100)     -- Ej: create_drivers, update_operations
  resource: varchar(100)   -- Ej: drivers, operations
  resourceId: int          -- ID del recurso afectado
  details: varchar(1000)   -- JSON con detalles adicionales
  ipAddress: varchar(45)   -- IP del cliente
  userAgent: varchar(500)  -- User-Agent del navegador
  createdAt: timestamp
}
```

**Acciones que se omiten del log:**

- Endpoints de health check
- Consultas al módulo de auditoría
- Refresh de tokens
- Endpoints de métricas

### 6.10 Flujo Completo de Autenticación

```
1. REGISTRO (POST /api/auth/register)
   ├── Validar que username/email no existan
   ├── Hashear password con bcrypt (10 rounds)
   ├── Crear usuario con operatorId y roleId
   ├── Generar JWT
   └── Retornar token y datos de usuario

2. LOGIN (POST /api/auth/login)
   ├── LocalStrategy valida credenciales
   │   ├── Buscar usuario por username
   │   ├── Verificar status de usuario
   │   ├── Verificar status de operador
   │   └── Comparar passwords con bcrypt
   ├── AuthService genera JWT
   ├── Actualizar lastActivityAt
   └── Retornar token y datos de usuario

3. REQUEST AUTENTICADO
   ├── JwtAuthGuard extrae token del header
   ├── JwtStrategy.validate()
   │   ├── Decodificar y verificar JWT
   │   ├── Verificar que usuario existe y está activo
   │   ├── Verificar timeout de inactividad
   │   ├── Actualizar lastActivityAt
   │   └── Inyectar user en request
   ├── PermissionsGuard
   │   ├── Leer @RequirePermission del método
   │   ├── Si isSuper → permitir
   │   └── Consultar role_grants para verificar permiso
   └── Controller ejecuta lógica de negocio

4. LOGOUT
   └── El cliente simplemente descarta el token
       (No hay invalidación server-side del JWT)
```

---

## Apéndice: Variables de Entorno

```env
# Base de Datos
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=password
DATABASE_NAME=rutalink_db

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Servidor
PORT=3000
FRONTEND_URL=http://localhost:3000

# Auditoría
ENABLE_AUDIT_LOGGING=true
```

---

_Documentación generada para RutaLink Backend v0.1.0_
_Última actualización: Noviembre 2025_
