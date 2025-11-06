import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, like, or, desc, gte, lte, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../database/database.module';
import * as schema from '../database/schema';
import {
  CreateDriverDto,
  UpdateDriverDto,
  DriverQueryDto,
  CreateDriverDocumentDto,
  UpdateDriverDocumentDto,
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleQueryDto,
  AssignDriverToVehicleDto,
  UnassignDriverFromVehicleDto,
  CreateOperationDto,
  UpdateOperationDto,
  OperationQueryDto,
} from './dto/driver.dto';

@Injectable()
export class DriversService {
  constructor(
    @Inject(DATABASE)
    private db: MySql2Database<typeof schema>,
  ) {}

  // ============================================================================
  // DRIVERS CRUD
  // ============================================================================

  async createDriver(createDriverDto: CreateDriverDto, userId: number) {
    // Verificar que el operador existe
    const operator = await this.db
      .select()
      .from(schema.operators)
      .where(eq(schema.operators.id, createDriverDto.operatorId))
      .limit(1);

    if (operator.length === 0) {
      throw new NotFoundException(
        `Operator with ID ${createDriverDto.operatorId} not found`,
      );
    }

    // Verificar que el RUT no esté duplicado en el mismo operador
    const existingDriver = await this.db
      .select()
      .from(schema.drivers)
      .where(
        and(
          eq(schema.drivers.operatorId, createDriverDto.operatorId),
          eq(schema.drivers.rut, createDriverDto.rut),
        ),
      )
      .limit(1);

    if (existingDriver.length > 0) {
      throw new ConflictException(
        `Driver with RUT ${createDriverDto.rut} already exists for this operator`,
      );
    }

    const [newDriver] = await this.db.insert(schema.drivers).values({
      ...createDriverDto,
      licenseExpirationDate: new Date(createDriverDto.licenseExpirationDate),
      dateOfBirth: createDriverDto.dateOfBirth
        ? new Date(createDriverDto.dateOfBirth)
        : undefined,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.getDriverById(newDriver.insertId);
  }

  async getDrivers(query: DriverQueryDto) {
    const {
      operatorId,
      search,
      status,
      isExternal,
      licenseType,
      page = 1,
      limit = 10,
    } = query;

    const conditions: any[] = [];

    if (operatorId) {
      conditions.push(eq(schema.drivers.operatorId, operatorId));
    }

    if (search) {
      conditions.push(
        or(
          like(schema.drivers.firstName, `%${search}%`),
          like(schema.drivers.lastName, `%${search}%`),
          like(schema.drivers.rut, `%${search}%`),
          like(schema.drivers.email, `%${search}%`),
        ),
      );
    }

    if (status !== undefined) {
      conditions.push(eq(schema.drivers.status, status));
    }

    if (isExternal !== undefined) {
      conditions.push(eq(schema.drivers.isExternal, isExternal));
    }

    if (licenseType) {
      conditions.push(eq(schema.drivers.licenseType, licenseType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (page - 1) * limit;

    const [drivers, totalCount] = await Promise.all([
      this.db
        .select()
        .from(schema.drivers)
        .where(whereClause)
        .orderBy(desc(schema.drivers.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.drivers)
        .where(whereClause),
    ]);

    return {
      data: drivers,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0].count),
        totalPages: Math.ceil(Number(totalCount[0].count) / limit),
      },
    };
  }

  async getDriverById(id: number) {
    const [driver] = await this.db
      .select()
      .from(schema.drivers)
      .where(eq(schema.drivers.id, id))
      .limit(1);

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }

    return driver;
  }

  async updateDriver(
    id: number,
    updateDriverDto: UpdateDriverDto,
    userId: number,
  ) {
    await this.getDriverById(id);

    await this.db
      .update(schema.drivers)
      .set({
        ...updateDriverDto,
        licenseExpirationDate: updateDriverDto.licenseExpirationDate
          ? new Date(updateDriverDto.licenseExpirationDate)
          : undefined,
        dateOfBirth: updateDriverDto.dateOfBirth
          ? new Date(updateDriverDto.dateOfBirth)
          : undefined,
        updatedBy: userId,
      })
      .where(eq(schema.drivers.id, id));

    return this.getDriverById(id);
  }

  async deleteDriver(id: number) {
    await this.getDriverById(id);

    // Verificar que no tenga operaciones activas
    const activeOperations = await this.db
      .select()
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.driverId, id),
          or(
            eq(schema.operations.status, 'scheduled'),
            eq(schema.operations.status, 'in-progress'),
          ),
        ),
      )
      .limit(1);

    if (activeOperations.length > 0) {
      throw new BadRequestException(
        'Cannot delete driver with active or scheduled operations',
      );
    }

    await this.db.delete(schema.drivers).where(eq(schema.drivers.id, id));

    return { message: 'Driver deleted successfully' };
  }

  // ============================================================================
  // DRIVER DOCUMENTS
  // ============================================================================

  async createDriverDocument(
    createDocumentDto: CreateDriverDocumentDto,
    userId: number,
  ) {
    // Verificar que el chofer existe
    await this.getDriverById(createDocumentDto.driverId);

    const [newDocument] = await this.db.insert(schema.driverDocuments).values({
      ...createDocumentDto,
      issueDate: createDocumentDto.issueDate
        ? new Date(createDocumentDto.issueDate)
        : undefined,
      expirationDate: createDocumentDto.expirationDate
        ? new Date(createDocumentDto.expirationDate)
        : undefined,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.getDriverDocumentById(newDocument.insertId);
  }

  async getDriverDocuments(driverId: number) {
    await this.getDriverById(driverId);

    return this.db
      .select()
      .from(schema.driverDocuments)
      .where(eq(schema.driverDocuments.driverId, driverId))
      .orderBy(desc(schema.driverDocuments.createdAt));
  }

  async getDriverDocumentById(id: number) {
    const [document] = await this.db
      .select()
      .from(schema.driverDocuments)
      .where(eq(schema.driverDocuments.id, id))
      .limit(1);

    if (!document) {
      throw new NotFoundException(`Driver document with ID ${id} not found`);
    }

    return document;
  }

  async updateDriverDocument(
    id: number,
    updateDocumentDto: UpdateDriverDocumentDto,
    userId: number,
  ) {
    await this.getDriverDocumentById(id);

    await this.db
      .update(schema.driverDocuments)
      .set({
        ...updateDocumentDto,
        issueDate: updateDocumentDto.issueDate
          ? new Date(updateDocumentDto.issueDate)
          : undefined,
        expirationDate: updateDocumentDto.expirationDate
          ? new Date(updateDocumentDto.expirationDate)
          : undefined,
        updatedBy: userId,
      })
      .where(eq(schema.driverDocuments.id, id));

    return this.getDriverDocumentById(id);
  }

  async deleteDriverDocument(id: number) {
    await this.getDriverDocumentById(id);

    await this.db
      .delete(schema.driverDocuments)
      .where(eq(schema.driverDocuments.id, id));

    return { message: 'Driver document deleted successfully' };
  }

  // ============================================================================
  // VEHICLES CRUD
  // ============================================================================

  async createVehicle(createVehicleDto: CreateVehicleDto, userId: number) {
    // Verificar que el operador existe
    const operator = await this.db
      .select()
      .from(schema.operators)
      .where(eq(schema.operators.id, createVehicleDto.operatorId))
      .limit(1);

    if (operator.length === 0) {
      throw new NotFoundException(
        `Operator with ID ${createVehicleDto.operatorId} not found`,
      );
    }

    // Verificar que la patente no esté duplicada en el mismo operador
    const existingVehicle = await this.db
      .select()
      .from(schema.vehicles)
      .where(
        and(
          eq(schema.vehicles.operatorId, createVehicleDto.operatorId),
          eq(schema.vehicles.plateNumber, createVehicleDto.plateNumber),
        ),
      )
      .limit(1);

    if (existingVehicle.length > 0) {
      throw new ConflictException(
        `Vehicle with plate number ${createVehicleDto.plateNumber} already exists for this operator`,
      );
    }

    const [newVehicle] = await this.db.insert(schema.vehicles).values({
      ...createVehicleDto,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.getVehicleById(newVehicle.insertId);
  }

  async getVehicles(query: VehicleQueryDto) {
    const {
      operatorId,
      search,
      status,
      vehicleType,
      page = 1,
      limit = 10,
    } = query;

    const conditions: any[] = [];

    if (operatorId) {
      conditions.push(eq(schema.vehicles.operatorId, operatorId));
    }

    if (search) {
      conditions.push(
        or(
          like(schema.vehicles.plateNumber, `%${search}%`),
          like(schema.vehicles.brand, `%${search}%`),
          like(schema.vehicles.model, `%${search}%`),
        ),
      );
    }

    if (status !== undefined) {
      conditions.push(eq(schema.vehicles.status, status));
    }

    if (vehicleType) {
      conditions.push(eq(schema.vehicles.vehicleType, vehicleType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (page - 1) * limit;

    const [vehicles, totalCount] = await Promise.all([
      this.db
        .select()
        .from(schema.vehicles)
        .where(whereClause)
        .orderBy(desc(schema.vehicles.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.vehicles)
        .where(whereClause),
    ]);

    return {
      data: vehicles,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0].count),
        totalPages: Math.ceil(Number(totalCount[0].count) / limit),
      },
    };
  }

  async getVehicleById(id: number) {
    const [vehicle] = await this.db
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, id))
      .limit(1);

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  async updateVehicle(
    id: number,
    updateVehicleDto: UpdateVehicleDto,
    userId: number,
  ) {
    await this.getVehicleById(id);

    await this.db
      .update(schema.vehicles)
      .set({
        ...updateVehicleDto,
        updatedBy: userId,
      })
      .where(eq(schema.vehicles.id, id));

    return this.getVehicleById(id);
  }

  async deleteVehicle(id: number) {
    await this.getVehicleById(id);

    // Verificar que no tenga operaciones activas
    const activeOperations = await this.db
      .select()
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.vehicleId, id),
          or(
            eq(schema.operations.status, 'scheduled'),
            eq(schema.operations.status, 'in-progress'),
          ),
        ),
      )
      .limit(1);

    if (activeOperations.length > 0) {
      throw new BadRequestException(
        'Cannot delete vehicle with active or scheduled operations',
      );
    }

    await this.db.delete(schema.vehicles).where(eq(schema.vehicles.id, id));

    return { message: 'Vehicle deleted successfully' };
  }

  // ============================================================================
  // DRIVER-VEHICLE ASSIGNMENTS
  // ============================================================================

  async assignDriverToVehicle(
    assignDto: AssignDriverToVehicleDto,
    userId: number,
  ) {
    const { driverId, vehicleId, notes } = assignDto;

    // Verificar que el chofer y vehículo existen
    const [driver, vehicle] = await Promise.all([
      this.getDriverById(driverId),
      this.getVehicleById(vehicleId),
    ]);

    // Verificar que pertenecen al mismo operador
    if (driver.operatorId !== vehicle.operatorId) {
      throw new BadRequestException(
        'Driver and vehicle must belong to the same operator',
      );
    }

    // Verificar que el chofer está activo
    if (!driver.status) {
      throw new BadRequestException('Driver is not active');
    }

    // Verificar que el vehículo está activo
    if (!vehicle.status) {
      throw new BadRequestException('Vehicle is not active');
    }

    // Desactivar cualquier asignación activa previa del chofer
    await this.db
      .update(schema.driverVehicles)
      .set({
        isActive: false,
        unassignedAt: new Date(),
        updatedBy: userId,
      })
      .where(
        and(
          eq(schema.driverVehicles.driverId, driverId),
          eq(schema.driverVehicles.isActive, true),
        ),
      );

    // Crear nueva asignación
    const [newAssignment] = await this.db.insert(schema.driverVehicles).values({
      driverId,
      vehicleId,
      notes,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.getDriverVehicleAssignmentById(newAssignment.insertId);
  }

  async unassignDriverFromVehicle(
    assignmentId: number,
    unassignDto: UnassignDriverFromVehicleDto,
    userId: number,
  ) {
    const assignment = await this.getDriverVehicleAssignmentById(assignmentId);

    if (!assignment.isActive) {
      throw new BadRequestException('Assignment is already inactive');
    }

    await this.db
      .update(schema.driverVehicles)
      .set({
        isActive: false,
        unassignedAt: new Date(),
        notes: unassignDto.notes || assignment.notes,
        updatedBy: userId,
      })
      .where(eq(schema.driverVehicles.id, assignmentId));

    return this.getDriverVehicleAssignmentById(assignmentId);
  }

  async getDriverVehicleAssignments(driverId: number) {
    await this.getDriverById(driverId);

    return this.db
      .select({
        assignment: schema.driverVehicles,
        vehicle: schema.vehicles,
      })
      .from(schema.driverVehicles)
      .leftJoin(
        schema.vehicles,
        eq(schema.driverVehicles.vehicleId, schema.vehicles.id),
      )
      .where(eq(schema.driverVehicles.driverId, driverId))
      .orderBy(desc(schema.driverVehicles.assignedAt));
  }

  async getActiveDriverVehicleAssignment(driverId: number) {
    await this.getDriverById(driverId);

    const [assignment] = await this.db
      .select({
        assignment: schema.driverVehicles,
        vehicle: schema.vehicles,
      })
      .from(schema.driverVehicles)
      .leftJoin(
        schema.vehicles,
        eq(schema.driverVehicles.vehicleId, schema.vehicles.id),
      )
      .where(
        and(
          eq(schema.driverVehicles.driverId, driverId),
          eq(schema.driverVehicles.isActive, true),
        ),
      )
      .limit(1);

    return assignment || null;
  }

  async getDriverVehicleAssignmentById(id: number) {
    const [assignment] = await this.db
      .select()
      .from(schema.driverVehicles)
      .where(eq(schema.driverVehicles.id, id))
      .limit(1);

    if (!assignment) {
      throw new NotFoundException(
        `Driver-vehicle assignment with ID ${id} not found`,
      );
    }

    return assignment;
  }

  // ============================================================================
  // OPERATIONS CRUD
  // ============================================================================

  async createOperation(
    createOperationDto: CreateOperationDto,
    userId: number,
  ) {
    // Verificar que el operador, chofer y vehículo existen
    const [operator, driver, vehicle] = await Promise.all([
      this.db
        .select()
        .from(schema.operators)
        .where(eq(schema.operators.id, createOperationDto.operatorId))
        .limit(1),
      this.getDriverById(createOperationDto.driverId),
      this.getVehicleById(createOperationDto.vehicleId),
    ]);

    if (operator.length === 0) {
      throw new NotFoundException(
        `Operator with ID ${createOperationDto.operatorId} not found`,
      );
    }

    // Verificar que el número de operación no esté duplicado
    const existingOperation = await this.db
      .select()
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.operatorId, createOperationDto.operatorId),
          eq(
            schema.operations.operationNumber,
            createOperationDto.operationNumber,
          ),
        ),
      )
      .limit(1);

    if (existingOperation.length > 0) {
      throw new ConflictException(
        `Operation with number ${createOperationDto.operationNumber} already exists for this operator`,
      );
    }

    // Verificar que el chofer y vehículo pertenecen al mismo operador
    if (
      driver.operatorId !== createOperationDto.operatorId ||
      vehicle.operatorId !== createOperationDto.operatorId
    ) {
      throw new BadRequestException(
        'Driver and vehicle must belong to the specified operator',
      );
    }

    const [newOperation] = await this.db.insert(schema.operations).values({
      ...createOperationDto,
      scheduledStartDate: new Date(createOperationDto.scheduledStartDate),
      scheduledEndDate: createOperationDto.scheduledEndDate
        ? new Date(createOperationDto.scheduledEndDate)
        : undefined,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.getOperationById(newOperation.insertId);
  }

  async getOperations(query: OperationQueryDto) {
    const {
      operatorId,
      driverId,
      vehicleId,
      status,
      operationType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;

    const conditions: any[] = [];

    if (operatorId) {
      conditions.push(eq(schema.operations.operatorId, operatorId));
    }

    if (driverId) {
      conditions.push(eq(schema.operations.driverId, driverId));
    }

    if (vehicleId) {
      conditions.push(eq(schema.operations.vehicleId, vehicleId));
    }

    if (status) {
      conditions.push(eq(schema.operations.status, status));
    }

    if (operationType) {
      conditions.push(eq(schema.operations.operationType, operationType));
    }

    if (startDate) {
      conditions.push(
        gte(schema.operations.scheduledStartDate, new Date(startDate)),
      );
    }

    if (endDate) {
      conditions.push(
        lte(schema.operations.scheduledStartDate, new Date(endDate)),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (page - 1) * limit;

    const [operations, totalCount] = await Promise.all([
      this.db
        .select({
          operation: schema.operations,
          driver: schema.drivers,
          vehicle: schema.vehicles,
        })
        .from(schema.operations)
        .leftJoin(
          schema.drivers,
          eq(schema.operations.driverId, schema.drivers.id),
        )
        .leftJoin(
          schema.vehicles,
          eq(schema.operations.vehicleId, schema.vehicles.id),
        )
        .where(whereClause)
        .orderBy(desc(schema.operations.scheduledStartDate))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.operations)
        .where(whereClause),
    ]);

    return {
      data: operations,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0].count),
        totalPages: Math.ceil(Number(totalCount[0].count) / limit),
      },
    };
  }

  async getOperationById(id: number) {
    const [operation] = await this.db
      .select({
        operation: schema.operations,
        driver: schema.drivers,
        vehicle: schema.vehicles,
      })
      .from(schema.operations)
      .leftJoin(
        schema.drivers,
        eq(schema.operations.driverId, schema.drivers.id),
      )
      .leftJoin(
        schema.vehicles,
        eq(schema.operations.vehicleId, schema.vehicles.id),
      )
      .where(eq(schema.operations.id, id))
      .limit(1);

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${id} not found`);
    }

    return operation;
  }

  async updateOperation(
    id: number,
    updateOperationDto: UpdateOperationDto,
    userId: number,
  ) {
    await this.getOperationById(id);

    await this.db
      .update(schema.operations)
      .set({
        ...updateOperationDto,
        scheduledStartDate: updateOperationDto.scheduledStartDate
          ? new Date(updateOperationDto.scheduledStartDate)
          : undefined,
        scheduledEndDate: updateOperationDto.scheduledEndDate
          ? new Date(updateOperationDto.scheduledEndDate)
          : undefined,
        actualStartDate: updateOperationDto.actualStartDate
          ? new Date(updateOperationDto.actualStartDate)
          : undefined,
        actualEndDate: updateOperationDto.actualEndDate
          ? new Date(updateOperationDto.actualEndDate)
          : undefined,
        updatedBy: userId,
      })
      .where(eq(schema.operations.id, id));

    return this.getOperationById(id);
  }

  async deleteOperation(id: number) {
    const operation = await this.getOperationById(id);

    // Solo permitir eliminar operaciones que no están en progreso
    if (operation.operation.status === 'in-progress') {
      throw new BadRequestException('Cannot delete operation in progress');
    }

    await this.db.delete(schema.operations).where(eq(schema.operations.id, id));

    return { message: 'Operation deleted successfully' };
  }

  // ============================================================================
  // DRIVER HISTORY & STATISTICS
  // ============================================================================

  async getDriverOperationHistory(driverId: number, query: OperationQueryDto) {
    await this.getDriverById(driverId);

    return this.getOperations({
      ...query,
      driverId,
    });
  }

  async getDriverStatistics(driverId: number) {
    await this.getDriverById(driverId);

    const [stats] = await this.db
      .select({
        totalOperations: sql<number>`count(*)`,
        completedOperations: sql<number>`sum(case when ${schema.operations.status} = 'completed' then 1 else 0 end)`,
        inProgressOperations: sql<number>`sum(case when ${schema.operations.status} = 'in-progress' then 1 else 0 end)`,
        scheduledOperations: sql<number>`sum(case when ${schema.operations.status} = 'scheduled' then 1 else 0 end)`,
        cancelledOperations: sql<number>`sum(case when ${schema.operations.status} = 'cancelled' then 1 else 0 end)`,
        totalDistance: sql<number>`sum(${schema.operations.distance})`,
      })
      .from(schema.operations)
      .where(eq(schema.operations.driverId, driverId));

    return stats;
  }
}
