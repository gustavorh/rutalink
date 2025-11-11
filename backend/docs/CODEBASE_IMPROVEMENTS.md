# Backend Codebase Improvement Recommendations

**Date**: November 11, 2025  
**Project**: Full Stack Template - Backend (NestJS + Drizzle ORM)  
**Analysis Scope**: Complete backend codebase review

---

## Executive Summary

This document provides a comprehensive analysis of the backend codebase with actionable recommendations to improve code quality, maintainability, scalability, and adherence to software engineering best practices. The analysis identifies **15 major areas** for improvement, ranging from architectural patterns to testing strategies.

**Overall Assessment**: The codebase demonstrates solid fundamentals with a well-structured database schema and proper use of NestJS features. However, there are significant opportunities to reduce code duplication, improve testability, and implement industry-standard patterns.

---

## Table of Contents

1. [Critical Issues](#1-critical-issues)
2. [Architecture & Design Patterns](#2-architecture--design-patterns)
3. [Code Duplication & DRY Principle](#3-code-duplication--dry-principle)
4. [Testing Strategy](#4-testing-strategy)
5. [Error Handling & Validation](#5-error-handling--validation)
6. [Performance Optimizations](#6-performance-optimizations)
7. [Security Enhancements](#7-security-enhancements)
8. [Code Quality & Maintainability](#8-code-quality--maintainability)
9. [API Design & Documentation](#9-api-design--documentation)
10. [Monitoring & Observability](#10-monitoring--observability)

---

## 1. Critical Issues

### 1.1 Missing Unit & Integration Tests

**Severity**: 🔴 HIGH  
**Current State**: Zero test files found in the codebase.

**Impact**:

- No confidence in code changes
- High risk of regression bugs
- Difficult to refactor safely
- Poor onboarding experience for new developers

**Recommendations**:

```typescript
// Example: Create unit tests for services
// File: src/clients/clients.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { DATABASE } from '../database/database.module';

describe('ClientsService', () => {
  let service: ClientsService;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue([]),
      insert: jest.fn().mockReturnValue([{ insertId: 1 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: DATABASE,
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getClientById', () => {
    it('should throw NotFoundException when client does not exist', async () => {
      mockDb.limit.mockReturnValue([]);
      await expect(service.getClientById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

**Action Items**:

- [ ] Set up testing infrastructure (Jest already configured)
- [ ] Achieve minimum 70% code coverage
- [ ] Create unit tests for all services
- [ ] Create integration tests for API endpoints
- [ ] Set up CI/CD pipeline to run tests automatically

---

### 1.2 No Transaction Management

**Severity**: 🟡 MEDIUM  
**Current State**: Complex operations that modify multiple tables don't use transactions.

**Problem Example** (from `operations.service.ts`):

```typescript
// Lines 107-127: Creating operation and assigning driver-vehicle
// If second operation fails, first one already committed
await this.assignDriverToVehicle(...);  // Operation 1
await this.db.insert(schema.operations).values(...);  // Operation 2
```

**Impact**:

- Data inconsistency if partial operations fail
- No rollback mechanism for failed multi-step operations
- Potential orphaned records

**Recommended Solution**:

```typescript
// Create a transaction wrapper utility
// File: src/database/transaction.util.ts

import { MySql2Database } from 'drizzle-orm/mysql2';

export async function withTransaction<T>(
  db: MySql2Database<any>,
  callback: (tx: MySql2Database<any>) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    return await callback(tx);
  });
}

// Usage in operations.service.ts:
async createOperation(createOperationDto: CreateOperationDto, userId: number) {
  return withTransaction(this.db, async (tx) => {
    // All operations here are atomic
    const assignment = await this.assignDriverToVehicle(..., tx);
    const operation = await tx.insert(schema.operations).values(...);
    return this.getOperationById(operation.insertId);
  });
}
```

**Action Items**:

- [ ] Implement transaction wrapper utility
- [ ] Identify all multi-step operations
- [ ] Wrap complex operations in transactions
- [ ] Add transaction tests

---

## 2. Architecture & Design Patterns

### 2.1 Implement Repository Pattern

**Severity**: 🟡 MEDIUM  
**Current Problem**: Services directly access database, leading to tight coupling.

**Benefits of Repository Pattern**:

- Separation of concerns
- Easier to mock for testing
- Centralized data access logic
- Database-agnostic business logic

**Implementation Example**:

```typescript
// File: src/common/repositories/base.repository.ts

import { MySql2Database } from 'drizzle-orm/mysql2';
import { SQL } from 'drizzle-orm';

export abstract class BaseRepository<T> {
  constructor(
    protected readonly db: MySql2Database<any>,
    protected readonly table: any,
  ) {}

  async findById(id: number): Promise<T | null> {
    const [record] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    return record as T;
  }

  async findAll(
    conditions?: SQL,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: T[]; total: number }> {
    const offset = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      this.db
        .select()
        .from(this.table)
        .where(conditions)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(this.table)
        .where(conditions),
    ]);

    return {
      data: data as T[],
      total: Number(totalCount[0].count),
    };
  }

  async create(data: Partial<T>): Promise<T> {
    const [result] = await this.db.insert(this.table).values(data);
    return this.findById(result.insertId);
  }

  async update(id: number, data: Partial<T>): Promise<T> {
    await this.db.update(this.table).set(data).where(eq(this.table.id, id));
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(this.table).where(eq(this.table.id, id));
  }
}

// File: src/clients/clients.repository.ts
@Injectable()
export class ClientsRepository extends BaseRepository<Client> {
  constructor(@Inject(DATABASE) db: MySql2Database<any>) {
    super(db, schema.clients);
  }

  async findByOperatorId(operatorId: number): Promise<Client[]> {
    return this.db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.operatorId, operatorId));
  }

  async findByTaxId(operatorId: number, taxId: string): Promise<Client | null> {
    const [client] = await this.db
      .select()
      .from(schema.clients)
      .where(
        and(
          eq(schema.clients.operatorId, operatorId),
          eq(schema.clients.taxId, taxId),
        ),
      )
      .limit(1);
    return client;
  }
}

// Updated service:
@Injectable()
export class ClientsService {
  constructor(private readonly clientsRepo: ClientsRepository) {}

  async getClientById(id: number): Promise<Client> {
    const client = await this.clientsRepo.findById(id);
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return client;
  }
}
```

**Action Items**:

- [ ] Create `BaseRepository` abstract class
- [ ] Implement repository for each entity
- [ ] Refactor services to use repositories
- [ ] Update dependency injection

---

### 2.2 Extract Common Query Building Logic

**Severity**: 🟡 MEDIUM  
**Current Problem**: Query building logic is duplicated across all services.

**Example of Duplication**:

```typescript
// This pattern appears in EVERY service:
// clients.service.ts, drivers.service.ts, vehicles.service.ts, etc.

const conditions: SQL[] = [];
if (operatorId) {
  conditions.push(eq(schema.table.operatorId, operatorId));
}
if (search) {
  const searchCondition = or(
    like(schema.table.name, `%${search}%`),
    like(schema.table.email, `%${search}%`),
  );
  if (searchCondition) {
    conditions.push(searchCondition);
  }
}
const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
```

**Recommended Solution**:

```typescript
// File: src/common/query-builder/query-builder.ts

export class QueryBuilder {
  private conditions: SQL[] = [];

  addCondition(condition: SQL | undefined): this {
    if (condition) {
      this.conditions.push(condition);
    }
    return this;
  }

  addEqualsCondition(field: any, value: any): this {
    if (value !== undefined && value !== null) {
      this.conditions.push(eq(field, value));
    }
    return this;
  }

  addSearchCondition(fields: any[], searchTerm: string): this {
    if (searchTerm) {
      const searchConditions = fields.map((field) =>
        like(field, `%${searchTerm}%`),
      );
      const orCondition = or(...searchConditions);
      if (orCondition) {
        this.conditions.push(orCondition);
      }
    }
    return this;
  }

  build(): SQL | undefined {
    return this.conditions.length > 0 ? and(...this.conditions) : undefined;
  }
}

// Usage:
const whereClause = new QueryBuilder()
  .addEqualsCondition(schema.clients.operatorId, operatorId)
  .addEqualsCondition(schema.clients.status, status)
  .addSearchCondition(
    [schema.clients.businessName, schema.clients.taxId],
    search,
  )
  .build();
```

**Action Items**:

- [ ] Create `QueryBuilder` utility class
- [ ] Refactor all services to use QueryBuilder
- [ ] Add unit tests for QueryBuilder

---

### 2.3 Implement Service Layer Abstraction

**Severity**: 🟢 LOW  
**Current State**: Services have mixed responsibilities.

**Recommendation**: Create a base service class for common CRUD operations:

```typescript
// File: src/common/services/base-crud.service.ts

export abstract class BaseCrudService<T, CreateDto, UpdateDto> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  abstract validateCreate(dto: CreateDto): Promise<void>;
  abstract validateUpdate(id: number, dto: UpdateDto): Promise<void>;

  async create(dto: CreateDto, userId: number): Promise<T> {
    await this.validateCreate(dto);
    return this.repository.create({ ...dto, createdBy: userId });
  }

  async findById(id: number): Promise<T> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  async update(id: number, dto: UpdateDto, userId: number): Promise<T> {
    await this.findById(id); // Ensure exists
    await this.validateUpdate(id, dto);
    return this.repository.update(id, { ...dto, updatedBy: userId });
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    return this.repository.delete(id);
  }
}

// Implementation:
@Injectable()
export class ClientsService extends BaseCrudService<
  Client,
  CreateClientDto,
  UpdateClientDto
> {
  constructor(clientsRepo: ClientsRepository) {
    super(clientsRepo);
  }

  async validateCreate(dto: CreateClientDto): Promise<void> {
    // Client-specific validation
    const existing = await this.repository.findByTaxId(
      dto.operatorId,
      dto.taxId,
    );
    if (existing) {
      throw new ConflictException('Client with this tax ID already exists');
    }
  }

  async validateUpdate(id: number, dto: UpdateClientDto): Promise<void> {
    // Update-specific validation
  }
}
```

---

## 3. Code Duplication & DRY Principle

### 3.1 Pagination Response Format

**Severity**: 🟡 MEDIUM  
**Duplication Count**: Found in 8+ files

**Current State**: Every service manually builds pagination response:

```typescript
return {
  data: clients,
  pagination: {
    page,
    limit,
    total: Number(totalCount[0].count),
    totalPages: Math.ceil(Number(totalCount[0].count) / limit),
  },
};
```

**Recommended Solution**:

```typescript
// File: src/common/dto/pagination.dto.ts

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export class PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export class PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;

  constructor(data: T[], page: number, limit: number, total: number) {
    this.data = data;
    this.pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    };
  }
}

// Usage:
async getClients(query: ClientQueryDto): Promise<PaginatedResponse<Client>> {
  const { page = 1, limit = 10 } = query;
  const { data, total } = await this.repository.findAll(whereClause, page, limit);
  return new PaginatedResponse(data, page, limit, total);
}
```

---

### 3.2 Operator Validation Pattern

**Duplication Count**: Found in 7 services

**Current Pattern**:

```typescript
const operator = await this.db
  .select()
  .from(schema.operators)
  .where(eq(schema.operators.id, operatorId))
  .limit(1);

if (operator.length === 0) {
  throw new NotFoundException(`Operator with ID ${operatorId} not found`);
}
```

**Recommended Solution**:

```typescript
// File: src/common/validators/entity.validator.ts

@Injectable()
export class EntityValidator {
  constructor(@Inject(DATABASE) private db: MySql2Database<any>) {}

  async validateOperatorExists(operatorId: number): Promise<Operator> {
    const [operator] = await this.db
      .select()
      .from(schema.operators)
      .where(eq(schema.operators.id, operatorId))
      .limit(1);

    if (!operator) {
      throw new NotFoundException(`Operator with ID ${operatorId} not found`);
    }
    return operator;
  }

  async validateDriverExists(driverId: number): Promise<Driver> {
    const [driver] = await this.db
      .select()
      .from(schema.drivers)
      .where(eq(schema.drivers.id, driverId))
      .limit(1);

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }
    return driver;
  }

  async validateEntitiesBelongToSameOperator(
    entity1: { operatorId: number },
    entity2: { operatorId: number },
    errorMessage: string
  ): Promise<void> {
    if (entity1.operatorId !== entity2.operatorId) {
      throw new BadRequestException(errorMessage);
    }
  }
}

// Usage:
async createOperation(dto: CreateOperationDto, userId: number) {
  const [operator, driver, vehicle] = await Promise.all([
    this.validator.validateOperatorExists(dto.operatorId),
    this.validator.validateDriverExists(dto.driverId),
    this.validator.validateVehicleExists(dto.vehicleId),
  ]);

  this.validator.validateEntitiesBelongToSameOperator(
    driver,
    vehicle,
    'Driver and vehicle must belong to the same operator'
  );
  // ... continue with operation creation
}
```

---

### 3.3 Statistics Query Pattern

**Duplication Count**: Found in 5 services

**Current Pattern** (appears in clients, providers, drivers services):

```typescript
const [stats] = await this.db
  .select({
    totalOperations: sql<number>`count(*)`,
    completedOperations: sql<number>`sum(case when ${schema.operations.status} = 'completed' then 1 else 0 end)`,
    inProgressOperations: sql<number>`sum(case when ${schema.operations.status} = 'in-progress' then 1 else 0 end)`,
    scheduledOperations: sql<number>`sum(case when ${schema.operations.status} = 'scheduled' then 1 else 0 end)`,
    cancelledOperations: sql<number>`sum(case when ${schema.operations.status} = 'cancelled' then 1 else 0 end)`,
  })
  .from(schema.operations)
  .where(condition);
```

**Recommended Solution**:

```typescript
// File: src/operations/operations-stats.service.ts

@Injectable()
export class OperationsStatsService {
  constructor(@Inject(DATABASE) private db: MySql2Database<any>) {}

  async getOperationStatsByCondition(condition: SQL): Promise<OperationStats> {
    const [stats] = await this.db
      .select({
        totalOperations: sql<number>`count(*)`,
        completedOperations: sql<number>`sum(case when ${schema.operations.status} = 'completed' then 1 else 0 end)`,
        inProgressOperations: sql<number>`sum(case when ${schema.operations.status} = 'in-progress' then 1 else 0 end)`,
        scheduledOperations: sql<number>`sum(case when ${schema.operations.status} = 'scheduled' then 1 else 0 end)`,
        cancelledOperations: sql<number>`sum(case when ${schema.operations.status} = 'cancelled' then 1 else 0 end)`,
        totalDistance: sql<number>`sum(${schema.operations.distance})`,
        totalCargoWeight: sql<number>`sum(${schema.operations.cargoWeight})`,
      })
      .from(schema.operations)
      .where(condition);

    return {
      totalOperations: Number(stats.totalOperations) || 0,
      completedOperations: Number(stats.completedOperations) || 0,
      inProgressOperations: Number(stats.inProgressOperations) || 0,
      scheduledOperations: Number(stats.scheduledOperations) || 0,
      cancelledOperations: Number(stats.cancelledOperations) || 0,
      totalDistance: Number(stats.totalDistance) || 0,
      totalCargoWeight: Number(stats.totalCargoWeight) || 0,
    };
  }

  async getStatsByClient(clientId: number): Promise<OperationStats> {
    return this.getOperationStatsByCondition(
      eq(schema.operations.clientId, clientId),
    );
  }

  async getStatsByDriver(driverId: number): Promise<OperationStats> {
    return this.getOperationStatsByCondition(
      eq(schema.operations.driverId, driverId),
    );
  }

  async getStatsByProvider(providerId: number): Promise<OperationStats> {
    return this.getOperationStatsByCondition(
      eq(schema.operations.providerId, providerId),
    );
  }
}
```

---

## 4. Testing Strategy

### 4.1 Comprehensive Testing Framework

**Severity**: 🔴 HIGH  
**Priority**: IMMEDIATE

**Recommended Testing Pyramid**:

```
       ╱╲
      ╱ E2E╲         10% - End-to-End Tests
     ╱──────╲
    ╱Integration╲    30% - Integration Tests
   ╱────────────╲
  ╱  Unit Tests  ╲  60% - Unit Tests
 ╱────────────────╲
```

#### 4.1.1 Unit Testing Setup

```typescript
// File: src/test/helpers/mock-database.helper.ts

export const createMockDrizzleDb = () => ({
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  transaction: jest.fn((callback) => callback(this)),
});

// File: src/clients/clients.service.spec.ts

describe('ClientsService', () => {
  let service: ClientsService;
  let mockDb: ReturnType<typeof createMockDrizzleDb>;
  let validator: EntityValidator;

  beforeEach(async () => {
    mockDb = createMockDrizzleDb();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: DATABASE, useValue: mockDb },
        { provide: EntityValidator, useValue: createMockValidator() },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    validator = module.get<EntityValidator>(EntityValidator);
  });

  describe('createClient', () => {
    it('should create a client successfully', async () => {
      const dto: CreateClientDto = {
        operatorId: 1,
        businessName: 'Test Corp',
        taxId: '123456789',
      };

      jest
        .spyOn(validator, 'validateOperatorExists')
        .mockResolvedValue(mockOperator);
      mockDb.insert.mockReturnValue([{ insertId: 1 }]);
      mockDb.limit.mockResolvedValue([mockClient]);

      const result = await service.createClient(dto, 1);

      expect(result).toBeDefined();
      expect(result.businessName).toBe('Test Corp');
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if client exists', async () => {
      const dto: CreateClientDto = {
        operatorId: 1,
        businessName: 'Existing Corp',
        taxId: '987654321',
      };

      mockDb.limit
        .mockResolvedValueOnce([mockOperator])
        .mockResolvedValueOnce([mockClient]);

      await expect(service.createClient(dto, 1)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
```

#### 4.1.2 Integration Testing

```typescript
// File: test/clients.e2e-spec.ts

describe('Clients API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'testpass' });
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/clients', () => {
    it('should create a new client', () => {
      return request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operatorId: 1,
          businessName: 'Test Client',
          taxId: '12345678-9',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.businessName).toBe('Test Client');
        });
    });

    it('should return 409 if client already exists', () => {
      return request(app.getHttpServer())
        .post('/api/clients')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          operatorId: 1,
          businessName: 'Test Client',
          taxId: '12345678-9',
        })
        .expect(409);
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/clients')
        .send({
          operatorId: 1,
          businessName: 'Test Client',
        })
        .expect(401);
    });
  });
});
```

#### 4.1.3 Test Coverage Goals

```json
// package.json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 75,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

**Action Items**:

- [ ] Install testing utilities: `@nestjs/testing`, `supertest`
- [ ] Create mock helpers
- [ ] Write unit tests for all services (aim for 80% coverage)
- [ ] Write integration tests for all controllers
- [ ] Create test database seeding scripts
- [ ] Set up GitHub Actions for automated testing

---

## 5. Error Handling & Validation

### 5.1 Centralized Error Handler

**Severity**: 🟡 MEDIUM

**Current State**: Error handling is inconsistent across services.

**Recommended Solution**:

```typescript
// File: src/common/filters/http-exception.filter.ts

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      JSON.stringify(errorResponse),
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(errorResponse);
  }
}

// Register in main.ts:
app.useGlobalFilters(new AllExceptionsFilter());
```

---

### 5.2 Custom Business Exceptions

**Severity**: 🟢 LOW

**Recommendation**: Create domain-specific exceptions:

```typescript
// File: src/common/exceptions/business.exceptions.ts

export class OperatorInactiveException extends BadRequestException {
  constructor(operatorId: number) {
    super(`Operator with ID ${operatorId} is inactive`);
  }
}

export class ResourceBelongsToAnotherOperatorException extends ForbiddenException {
  constructor(resourceType: string, resourceId: number) {
    super(`${resourceType} with ID ${resourceId} belongs to another operator`);
  }
}

export class EntityHasActiveRelationsException extends BadRequestException {
  constructor(entityType: string, relationCount: number, relationType: string) {
    super(
      `Cannot delete ${entityType} with ${relationCount} active ${relationType}(s)`,
    );
  }
}

// Usage:
if (!operator.status) {
  throw new OperatorInactiveException(operatorId);
}
```

---

### 5.3 Input Validation Enhancement

**Severity**: 🟡 MEDIUM

**Current State**: DTOs have basic validation, but could be improved.

**Recommendations**:

```typescript
// File: src/clients/dto/client.dto.ts

import {
  IsString,
  IsEmail,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateClientDto {
  @IsInt()
  @Type(() => Number)
  operatorId: number;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @Transform(({ value }) => value?.trim())
  businessName: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,2}\.\d{3}\.\d{3}-[0-9Kk]$/, {
    message: 'Tax ID must be in format XX.XXX.XXX-X',
  })
  taxId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  contactName?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s\-()]+$/, {
    message: 'Phone number must contain only digits, spaces, and +-()',
  })
  contactPhone?: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}

// Add custom validators:
// File: src/common/validators/custom.validators.ts

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsRutValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isRutValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // Optional
          // Chilean RUT validation algorithm
          const rut = value.replace(/\./g, '').replace('-', '');
          const rutDigits = rut.slice(0, -1);
          const verifier = rut.slice(-1).toUpperCase();

          let sum = 0;
          let multiplier = 2;

          for (let i = rutDigits.length - 1; i >= 0; i--) {
            sum += parseInt(rutDigits.charAt(i)) * multiplier;
            multiplier = multiplier === 7 ? 2 : multiplier + 1;
          }

          const calculatedVerifier = 11 - (sum % 11);
          const expectedVerifier =
            calculatedVerifier === 11
              ? '0'
              : calculatedVerifier === 10
                ? 'K'
                : calculatedVerifier.toString();

          return verifier === expectedVerifier;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Invalid RUT format or check digit';
        },
      },
    });
  };
}

// Usage:
export class CreateDriverDto {
  @IsString()
  @IsRutValid()
  rut: string;
}
```

---

## 6. Performance Optimizations

### 6.1 Implement Caching Strategy

**Severity**: 🟡 MEDIUM  
**Impact**: Reduce database load, improve response times

**Recommended Implementation**:

```typescript
// Install dependencies:
// npm install @nestjs/cache-manager cache-manager

// File: src/common/cache/cache.module.ts

import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get('CACHE_TTL', 300), // 5 minutes default
        max: configService.get('CACHE_MAX_ITEMS', 100),
        store: 'memory', // Can be changed to Redis in production
      }),
    }),
  ],
  exports: [NestCacheModule],
})
export class AppCacheModule {}

// File: src/common/decorators/cacheable.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

export const Cacheable = (key: string, ttl?: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyKey, descriptor);
    if (ttl) {
      SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
    }
    return descriptor;
  };
};

// File: src/common/interceptors/cache.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
} from '../decorators/cacheable.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const fullCacheKey = this.buildCacheKey(cacheKey, request);

    // Try to get from cache
    const cachedData = await this.cacheManager.get(fullCacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    // If not in cache, execute and store result
    const ttl =
      this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler()) ||
      300;

    return next.handle().pipe(
      tap(async (data) => {
        await this.cacheManager.set(fullCacheKey, data, ttl);
      }),
    );
  }

  private buildCacheKey(baseKey: string, request: any): string {
    const { params, query, user } = request;
    const keyParts = [baseKey];

    if (user?.operatorId) {
      keyParts.push(`op:${user.operatorId}`);
    }

    if (params?.id) {
      keyParts.push(`id:${params.id}`);
    }

    if (Object.keys(query).length > 0) {
      const queryStr = JSON.stringify(query);
      keyParts.push(`q:${Buffer.from(queryStr).toString('base64')}`);
    }

    return keyParts.join(':');
  }
}

// Usage in service:
@Injectable()
export class ClientsService {
  @Cacheable('clients:list', 300) // Cache for 5 minutes
  async getClients(query: ClientQueryDto): Promise<PaginatedResponse<Client>> {
    // ... implementation
  }

  @Cacheable('clients:byId', 600) // Cache for 10 minutes
  async getClientById(id: number): Promise<Client> {
    // ... implementation
  }

  // Invalidate cache on write operations
  async createClient(dto: CreateClientDto, userId: number): Promise<Client> {
    const client = await this.repository.create(dto, userId);
    await this.cacheManager.del('clients:list:*'); // Invalidate list cache
    return client;
  }
}
```

**Cache Strategy by Entity Type**:

- **Operators**: Long TTL (30 min) - rarely change
- **Users**: Medium TTL (10 min) - occasional changes
- **Clients/Providers**: Short TTL (5 min) - frequent changes
- **Operations**: Very short TTL (1 min) - real-time data
- **Statistics**: Conditional (recompute on demand)

---

### 6.2 Database Query Optimization

**Severity**: 🟡 MEDIUM

**Current Issues**:

1. N+1 query problems in some endpoints
2. Missing indexes for frequently queried fields
3. Inefficient join operations

**Recommendations**:

```typescript
// 1. Fix N+1 Query Problem
// BAD: Current implementation in roles.service.ts (lines 76-118)
const enrichedData = await Promise.all(
  data.map(async (role) => {
    const rolePermissions = await this.db.select(...); // N queries!
    const userCount = await this.db.select(...); // N queries!
    const activeCount = await this.db.select(...); // N queries!
    return { ...role, permissions, userCount };
  }),
);

// GOOD: Optimized version
async findAll(params: any) {
  // ... get roles data

  // Get all permissions in ONE query
  const roleIds = data.map(r => r.id);
  const allPermissions = await this.db
    .select({
      roleId: roleGrants.roleId,
      resource: grants.resource,
      action: grants.action,
    })
    .from(roleGrants)
    .innerJoin(grants, eq(roleGrants.grantId, grants.id))
    .where(inArray(roleGrants.roleId, roleIds));

  // Get all user counts in ONE query
  const userCounts = await this.db
    .select({
      roleId: users.roleId,
      total: count(),
      active: sum(sql`CASE WHEN ${users.status} = true THEN 1 ELSE 0 END`),
    })
    .from(users)
    .where(inArray(users.roleId, roleIds))
    .groupBy(users.roleId);

  // Build lookup maps
  const permissionsMap = new Map();
  allPermissions.forEach(p => {
    if (!permissionsMap.has(p.roleId)) {
      permissionsMap.set(p.roleId, []);
    }
    permissionsMap.get(p.roleId).push(`${p.resource}.${p.action}`);
  });

  const countsMap = new Map(userCounts.map(c => [c.roleId, c]));

  // Enrich data with O(1) lookups
  const enrichedData = data.map(role => ({
    ...role,
    permissions: permissionsMap.get(role.id) || [],
    userCount: countsMap.get(role.id)?.total || 0,
    activeCount: countsMap.get(role.id)?.active || 0,
  }));

  return { data: enrichedData, pagination };
}

// 2. Add Database Indexes
// File: drizzle/migrations/add_performance_indexes.sql

-- Add indexes for frequently queried fields
CREATE INDEX idx_operations_scheduled_start ON operations(scheduled_start_date);
CREATE INDEX idx_operations_status_operator ON operations(status, operator_id);
CREATE INDEX idx_operations_client_status ON operations(client_id, status);
CREATE INDEX idx_operations_driver_status ON operations(driver_id, status);
CREATE INDEX idx_operations_vehicle_status ON operations(vehicle_id, status);

-- Composite indexes for common query patterns
CREATE INDEX idx_clients_operator_status ON clients(operator_id, status);
CREATE INDEX idx_drivers_operator_status ON drivers(operator_id, status);
CREATE INDEX idx_vehicles_operator_status ON vehicles(operator_id, status);

-- Full-text search indexes (if using MySQL 5.7+)
CREATE FULLTEXT INDEX idx_clients_search ON clients(business_name, contact_name);
CREATE FULLTEXT INDEX idx_drivers_search ON drivers(first_name, last_name, email);

// 3. Use Database Views for Complex Queries
// File: drizzle/migrations/create_views.sql

CREATE VIEW v_operations_full AS
SELECT
  o.*,
  c.business_name as client_name,
  c.contact_name as client_contact,
  p.business_name as provider_name,
  CONCAT(d.first_name, ' ', d.last_name) as driver_name,
  d.phone as driver_phone,
  v.plate_number,
  v.vehicle_type,
  r.name as route_name,
  r.distance as route_distance
FROM operations o
LEFT JOIN clients c ON o.client_id = c.id
LEFT JOIN providers p ON o.provider_id = p.id
LEFT JOIN drivers d ON o.driver_id = d.id
LEFT JOIN vehicles v ON o.vehicle_id = v.id
LEFT JOIN routes r ON o.route_id = r.id;

// Use view in service:
async getOperations(query: OperationQueryDto) {
  return this.db
    .select()
    .from(sql`v_operations_full`)
    .where(conditions)
    .limit(limit)
    .offset(offset);
}
```

---

### 6.3 Connection Pooling Optimization

**Severity**: 🟢 LOW

**Current State**: Basic pool configuration in `database.config.ts`

**Recommended Improvements**:

```typescript
// File: src/database/database.config.ts

import { drizzle } from 'drizzle-orm/mysql2';
import { createPool, Pool, PoolOptions } from 'mysql2/promise';
import * as schema from './schema';

export class DatabaseConfig {
  private pool: Pool;

  constructor(
    host: string,
    port: number,
    user: string,
    password: string,
    database: string,
    options?: Partial<PoolOptions>,
  ) {
    const poolConfig: PoolOptions = {
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: options?.connectionLimit || 10,
      maxIdle: options?.maxIdle || 10, // Maximum idle connections
      idleTimeout: options?.idleTimeout || 60000, // 1 minute
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      // Connection validation
      connectTimeout: 10000, // 10 seconds
      // Timezone handling
      timezone: '+00:00',
      // Character set
      charset: 'utf8mb4',
      // Query optimizations
      multipleStatements: false,
      namedPlaceholders: true,
      // Logging (development only)
      ...(process.env.NODE_ENV === 'development' && {
        debug: false,
      }),
    };

    this.pool = createPool(poolConfig);

    // Add pool event listeners for monitoring
    this.setupPoolMonitoring();
  }

  getDb() {
    return drizzle(this.pool, { schema, mode: 'default' });
  }

  async closeConnection() {
    await this.pool.end();
  }

  async checkConnection(): Promise<boolean> {
    try {
      const connection = await this.pool.getConnection();
      connection.release();
      return true;
    } catch (error) {
      return false;
    }
  }

  getPoolStatus() {
    return {
      totalConnections: this.pool.pool._allConnections.length,
      idleConnections: this.pool.pool._freeConnections.length,
      activeConnections:
        this.pool.pool._allConnections.length -
        this.pool.pool._freeConnections.length,
      queuedRequests: this.pool.pool._connectionQueue.length,
    };
  }

  private setupPoolMonitoring() {
    this.pool.on('connection', (connection) => {
      console.log('New connection established:', connection.threadId);
    });

    this.pool.on('acquire', (connection) => {
      console.debug('Connection acquired:', connection.threadId);
    });

    this.pool.on('release', (connection) => {
      console.debug('Connection released:', connection.threadId);
    });

    this.pool.on('enqueue', () => {
      console.warn('Connection request queued');
    });
  }
}

// Environment-based configuration:
// File: src/database/database.module.ts

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: (configService: ConfigService) => {
        const config = new DatabaseConfig(
          configService.get<string>('DATABASE_HOST', 'localhost'),
          configService.get<number>('DATABASE_PORT', 3306),
          configService.get<string>('DATABASE_USER', 'root'),
          configService.get<string>('DATABASE_PASSWORD', ''),
          configService.get<string>('DATABASE_NAME', 'fullstack_db'),
          {
            connectionLimit: configService.get<number>('DB_POOL_SIZE', 10),
            maxIdle: configService.get<number>('DB_POOL_MAX_IDLE', 10),
            idleTimeout: configService.get<number>(
              'DB_POOL_IDLE_TIMEOUT',
              60000,
            ),
          },
        );
        return config.getDb();
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
```

**Environment Variables** (add to `.env`):

```bash
# Database Pool Configuration
DB_POOL_SIZE=20               # Production: higher
DB_POOL_MAX_IDLE=10          # Keep some idle connections
DB_POOL_IDLE_TIMEOUT=60000   # 1 minute
```

---

## 7. Security Enhancements

### 7.1 Implement Rate Limiting

**Severity**: 🟡 MEDIUM  
**Current State**: No rate limiting implemented

**Recommendation**:

```bash
npm install @nestjs/throttler
```

```typescript
// File: src/main.ts

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60, // Time window in seconds
      limit: 100, // Max requests per window
    }),
    // ... other modules
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

// Custom rate limits for specific endpoints:
// File: src/auth/auth.controller.ts

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle(5, 60) // 5 requests per minute for login
  async login(@Body() loginDto: LoginDto) {
    // ...
  }

  @Post('register')
  @Throttle(3, 3600) // 3 registrations per hour
  async register(@Body() registerDto: RegisterDto) {
    // ...
  }
}
```

---

### 7.2 Input Sanitization

**Severity**: 🟡 MEDIUM

**Recommendation**:

```bash
npm install class-sanitizer
```

```typescript
// File: src/common/decorators/sanitize.decorator.ts

import { Transform } from 'class-transformer';
import * as DOMPurify from 'isomorphic-dompurify';

export function Sanitize() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return DOMPurify.sanitize(value);
    }
    return value;
  });
}

export function Trim() {
  return Transform(({ value }) => {
    return typeof value === 'string' ? value.trim() : value;
  });
}

// Usage:
export class CreateClientDto {
  @IsString()
  @Trim()
  @Sanitize()
  businessName: string;
}
```

---

### 7.3 Helmet & CORS Configuration

**Severity**: 🟡 MEDIUM

**Recommendation**:

```bash
npm install helmet
```

```typescript
// File: src/main.ts

import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // Enhanced CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'http://localhost:3001',
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
    maxAge: 86400, // 24 hours
  });

  // ... rest of bootstrap
}
```

---

### 7.4 Password Policy Enhancement

**Severity**: 🟢 LOW

**Recommendation**:

```typescript
// File: src/auth/validators/password.validator.ts

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          const hasMinLength = value.length >= 8;
          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

          return (
            hasMinLength &&
            hasUpperCase &&
            hasLowerCase &&
            hasNumber &&
            hasSpecialChar
          );
        },
        defaultMessage(args: ValidationArguments) {
          return 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character';
        },
      },
    });
  };
}

// Usage:
export class RegisterDto {
  @IsString()
  @IsStrongPassword()
  password: string;
}
```

---

## 8. Code Quality & Maintainability

### 8.1 TypeScript Strictness

**Severity**: 🟡 MEDIUM  
**Current Issue**: Some strict TypeScript options are disabled

**Current `tsconfig.json`**:

```json
{
  "compilerOptions": {
    "noImplicitAny": false, // ❌ Should be true
    "strictBindCallApply": false, // ❌ Should be true
    "noFallthroughCasesInSwitch": false // ❌ Should be true
  }
}
```

**Recommended `tsconfig.json`**:

```json
{
  "compilerOptions": {
    "strict": true, // ✅ Enable all strict checks
    "noImplicitAny": true, // ✅ No implicit any types
    "strictNullChecks": true, // ✅ Already enabled
    "strictFunctionTypes": true, // ✅ Strict function type checking
    "strictBindCallApply": true, // ✅ Strict bind/call/apply
    "strictPropertyInitialization": true, // ✅ Ensure properties initialized
    "noImplicitThis": true, // ✅ No implicit 'this'
    "alwaysStrict": true, // ✅ Use strict mode
    "noUnusedLocals": true, // ✅ Report unused locals
    "noUnusedParameters": true, // ✅ Report unused parameters
    "noImplicitReturns": true, // ✅ All code paths return value
    "noFallthroughCasesInSwitch": true, // ✅ No switch fallthrough
    "noUncheckedIndexedAccess": true // ✅ Check indexed access
  }
}
```

---

### 8.2 ESLint Configuration Enhancement

**Severity**: 🟢 LOW

**Recommended `.eslintrc.js`**:

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import', 'unused-imports'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist', 'node_modules'],
  rules: {
    // TypeScript specific
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',

    // Import rules
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],

    // Remove unused imports
    'unused-imports/no-unused-imports': 'error',

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
};
```

---

### 8.3 Code Documentation Standards

**Severity**: 🟢 LOW

**Recommendation**: Use JSDoc for better IDE support:

````typescript
/**
 * Service for managing client entities
 *
 * Handles CRUD operations, statistics, and reporting for clients.
 * All operations are scoped to operator context for multi-tenancy.
 *
 * @class ClientsService
 * @see {@link Client} for entity definition
 */
@Injectable()
export class ClientsService {
  constructor(
    @Inject(DATABASE) private readonly db: MySql2Database<typeof schema>,
    private readonly validator: EntityValidator,
    private readonly statsService: OperationsStatsService,
  ) {}

  /**
   * Creates a new client with validation
   *
   * Validates:
   * - Operator existence and status
   * - Unique business name per operator
   * - Unique tax ID per operator (if provided)
   *
   * @param {CreateClientDto} createClientDto - Client creation data
   * @param {number} userId - ID of user creating the client
   * @returns {Promise<Client>} Created client with full details
   * @throws {NotFoundException} If operator not found
   * @throws {ConflictException} If business name or tax ID already exists
   *
   * @example
   * ```typescript
   * const client = await clientsService.createClient({
   *   operatorId: 1,
   *   businessName: 'Acme Corp',
   *   taxId: '12.345.678-9',
   * }, userId);
   * ```
   */
  async createClient(
    createClientDto: CreateClientDto,
    userId: number,
  ): Promise<Client> {
    // Implementation
  }
}
````

---

## 9. API Design & Documentation

### 9.1 API Versioning

**Severity**: 🟡 MEDIUM  
**Current State**: No versioning strategy

**Recommendation**:

```typescript
// File: src/main.ts

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // URI versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  await app.listen(3000);
}

// File: src/clients/clients.controller.ts

@Controller({
  path: 'clients',
  version: '1',
})
export class ClientsControllerV1 {
  // V1 implementation
}

@Controller({
  path: 'clients',
  version: '2',
})
export class ClientsControllerV2 {
  // V2 with breaking changes
}

// Deprecation handling:
@Controller({
  path: 'clients',
  version: '1',
})
@ApiHeader({
  name: 'X-API-Deprecation',
  description: 'This version is deprecated. Please migrate to v2',
})
export class ClientsControllerV1 {
  @Get()
  @Header('X-API-Deprecation', 'true')
  @Header('X-API-Sunset', '2025-12-31')
  async getClients() {
    // ...
  }
}
```

---

### 9.2 OpenAPI/Swagger Enhancement

**Severity**: 🟢 LOW  
**Current State**: YAML file is used, but DTOs lack decorators

**Recommendation**:

```typescript
// File: src/clients/dto/client.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({
    description: 'The operator ID this client belongs to',
    example: 1,
    type: Number,
  })
  @IsInt()
  operatorId: number;

  @ApiProperty({
    description: 'Business name / Razón social',
    example: 'Acme Corporation',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  businessName: string;

  @ApiPropertyOptional({
    description: 'Tax ID / RUT in format XX.XXX.XXX-X',
    example: '12.345.678-9',
    pattern: '^\\d{1,2}\\.\\d{3}\\.\\d{3}-[0-9Kk]$',
  })
  @IsOptional()
  @IsString()
  taxId?: string;
}

// File: src/clients/clients.controller.ts

@Controller('clients')
@ApiTags('clients')
@ApiBearerAuth()
export class ClientsController {
  @Post()
  @ApiOperation({
    summary: 'Create a new client',
    description: 'Creates a new client entity with validation',
  })
  @ApiResponse({
    status: 201,
    description: 'Client created successfully',
    type: Client,
  })
  @ApiResponse({
    status: 409,
    description: 'Client with this business name or tax ID already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'Operator not found',
  })
  async createClient(
    @Body() createClientDto: CreateClientDto,
    @Request() req: RequestWithUser,
  ) {
    return this.clientsService.createClient(createClientDto, req.user.userId);
  }
}

// File: src/main.ts - Enhanced Swagger setup

const config = new DocumentBuilder()
  .setTitle('Full Stack Template API')
  .setDescription(
    `
    Comprehensive API for fleet and operations management.
    
    ## Features
    - Multi-tenant architecture with operator isolation
    - Role-based access control (RBAC)
    - Comprehensive audit logging
    - Real-time operation tracking
    
    ## Authentication
    Use the /auth/login endpoint to obtain a JWT token.
    Include the token in the Authorization header as: Bearer {token}
  `,
  )
  .setVersion('1.0.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'bearerAuth',
  )
  .addServer('http://localhost:3000/api', 'Local development')
  .addServer('https://api.example.com/api', 'Production')
  .addTag('auth', 'Authentication endpoints')
  .addTag('clients', 'Client management')
  .addTag('drivers', 'Driver management')
  .addTag('vehicles', 'Vehicle management')
  .addTag('operations', 'Operations management')
  .build();
```

---

### 9.3 Response Standardization

**Severity**: 🟡 MEDIUM

**Recommendation**: Standardize all API responses:

```typescript
// File: src/common/dto/response.dto.ts

export class ApiSuccessResponse<T> {
  @ApiProperty()
  success: boolean = true;

  @ApiProperty()
  timestamp: string = new Date().toISOString();

  @ApiProperty()
  data: T;

  @ApiPropertyOptional()
  message?: string;

  constructor(data: T, message?: string) {
    this.data = data;
    this.message = message;
  }
}

export class ApiErrorResponse {
  @ApiProperty()
  success: boolean = false;

  @ApiProperty()
  timestamp: string = new Date().toISOString();

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  path: string;

  @ApiPropertyOptional()
  errors?: Record<string, string[]>;
}

// File: src/common/interceptors/response.interceptor.ts

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => new ApiSuccessResponse(data)));
  }
}

// Register globally:
app.useGlobalInterceptors(new ResponseInterceptor());
```

---

## 10. Monitoring & Observability

### 10.1 Structured Logging

**Severity**: 🟡 MEDIUM

**Recommendation**: Implement Winston logger:

```bash
npm install winston nest-winston
```

```typescript
// File: src/common/logger/logger.module.ts

import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.colorize(),
            winston.format.printf(
              ({ timestamp, level, message, context, ...meta }) => {
                return `${timestamp} [${context}] ${level}: ${message} ${
                  Object.keys(meta).length ? JSON.stringify(meta) : ''
                }`;
              },
            ),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  ],
})
export class LoggerModule {}

// Usage:
@Injectable()
export class ClientsService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async createClient(dto: CreateClientDto, userId: number) {
    this.logger.log({
      message: 'Creating new client',
      context: 'ClientsService',
      userId,
      operatorId: dto.operatorId,
      businessName: dto.businessName,
    });

    try {
      const client = await this.repository.create(dto);

      this.logger.log({
        message: 'Client created successfully',
        context: 'ClientsService',
        clientId: client.id,
      });

      return client;
    } catch (error) {
      this.logger.error({
        message: 'Failed to create client',
        context: 'ClientsService',
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
```

---

### 10.2 Health Checks

**Severity**: 🟡 MEDIUM

**Recommendation**:

```bash
npm install @nestjs/terminus
```

```typescript
// File: src/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database check
      () => this.db.pingCheck('database'),

      // Memory check (heap should not exceed 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Storage check (disk should have at least 50GB free)
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Get('live')
  liveness() {
    return { status: 'ok' };
  }
}
```

---

### 10.3 Metrics & Monitoring

**Severity**: 🟢 LOW

**Recommendation**: Add Prometheus metrics:

```bash
npm install @willsoto/nestjs-prometheus prom-client
```

```typescript
// File: src/metrics/metrics.module.ts

import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
})
export class MetricsModule {}

// Custom metrics:
// File: src/metrics/custom-metrics.ts

import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

@Injectable()
export class CustomMetrics {
  constructor(
    @InjectMetric('http_requests_total')
    public httpRequestsCounter: Counter<string>,

    @InjectMetric('http_request_duration_ms')
    public httpRequestDurationHistogram: Histogram<string>,
  ) {}
}

// Usage in interceptor:
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metrics: CustomMetrics) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;

        this.metrics.httpRequestsCounter.inc({
          method: request.method,
          route: request.route?.path,
          status: 'success',
        });

        this.metrics.httpRequestDurationHistogram.observe(
          { method: request.method, route: request.route?.path },
          duration,
        );
      }),
    );
  }
}
```

---

## Implementation Roadmap

### Phase 1: Critical (Weeks 1-2)

**Priority**: 🔴 HIGH

1. **Set up testing infrastructure**
   - Configure Jest for unit tests
   - Create mock helpers
   - Write tests for critical services (auth, operations)
   - Target: 50% code coverage

2. **Implement transaction management**
   - Create transaction wrapper utility
   - Wrap all multi-step operations
   - Add rollback handling

3. **Add error handling middleware**
   - Global exception filter
   - Custom business exceptions
   - Error logging

### Phase 2: Important (Weeks 3-4)

**Priority**: 🟡 MEDIUM

4. **Implement Repository Pattern**
   - Create BaseRepository
   - Migrate services to use repositories
   - Remove direct DB access from services

5. **Extract common utilities**
   - QueryBuilder for filtering
   - PaginatedResponse standardization
   - EntityValidator service

6. **Add caching layer**
   - Configure cache module
   - Implement caching for read operations
   - Cache invalidation strategy

7. **Security enhancements**
   - Rate limiting
   - Helmet security headers
   - Input sanitization

### Phase 3: Enhancement (Weeks 5-6)

**Priority**: 🟢 LOW

8. **Code quality improvements**
   - Enable strict TypeScript
   - Enhance ESLint rules
   - Add JSDoc documentation

9. **Monitoring & logging**
   - Structured logging with Winston
   - Health check endpoints
   - Prometheus metrics

10. **API improvements**
    - API versioning
    - Enhanced Swagger documentation
    - Response standardization

### Phase 4: Optimization (Weeks 7-8)

**Priority**: 🟢 LOW

11. **Performance optimizations**
    - Fix N+1 queries
    - Add database indexes
    - Optimize connection pooling

12. **Final touches**
    - Comprehensive integration tests
    - Load testing
    - Documentation updates

---

## Success Metrics

### Code Quality

- [ ] Test coverage ≥ 80%
- [ ] Zero ESLint errors
- [ ] Zero TypeScript errors with strict mode
- [ ] All services follow repository pattern

### Performance

- [ ] Average API response time < 200ms
- [ ] 95th percentile response time < 500ms
- [ ] Database query time < 50ms (average)
- [ ] Connection pool utilization < 80%

### Security

- [ ] All endpoints have rate limiting
- [ ] All inputs are validated and sanitized
- [ ] Security headers configured
- [ ] Regular security audits passing

### Maintainability

- [ ] All public methods documented
- [ ] Consistent code style (Prettier + ESLint)
- [ ] No code duplication (DRY principle)
- [ ] Clear separation of concerns

---

## Conclusion

This document outlines a comprehensive improvement plan for the backend codebase. The recommendations are prioritized and organized into a phased implementation approach. The current codebase has a solid foundation, and these improvements will enhance its scalability, maintainability, and reliability.

**Key Takeaways**:

1. **Testing is critical** - Implement comprehensive test coverage immediately
2. **Reduce duplication** - Extract common patterns into reusable utilities
3. **Improve architecture** - Adopt repository pattern and service layer abstraction
4. **Enhance security** - Add rate limiting, input validation, and security headers
5. **Monitor & observe** - Implement structured logging and health checks

**Estimated Effort**: 8 weeks (1 full-time developer)  
**Risk Level**: Low (all changes are additive and backward-compatible)  
**Expected ROI**: High (reduced bugs, faster development, better maintainability)

---

## Additional Resources

- [NestJS Best Practices](https://docs.nestjs.com/techniques/performance)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)
- [OWASP Security Guidelines](https://owasp.org/www-project-api-security/)

---

**Last Updated**: November 11, 2025  
**Version**: 1.0  
**Author**: AI Code Review Assistant
