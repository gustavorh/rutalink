import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../database/database.module';
import * as schema from '../database/schema';
import {
  CreateOperationDto,
  UpdateOperationDto,
  OperationQueryDto,
  AssignDriverToVehicleDto,
  UnassignDriverFromVehicleDto,
  GenerateReportDto,
  BatchUploadOperationsDto,
} from './dto/operation.dto';
import { PdfService } from './pdf.service';
import { ExcelService, ValidationError } from './excel.service';

export interface BatchUploadResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ValidationError[];
  duplicates: string[];
  createdOperations: number[];
  message?: string;
}

@Injectable()
export class OperationsService {
  constructor(
    @Inject(DATABASE)
    private db: MySql2Database<typeof schema>,
    private pdfService: PdfService,
    private excelService: ExcelService,
  ) {}

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
      this.db
        .select()
        .from(schema.drivers)
        .where(eq(schema.drivers.id, createOperationDto.driverId))
        .limit(1),
      this.db
        .select()
        .from(schema.vehicles)
        .where(eq(schema.vehicles.id, createOperationDto.vehicleId))
        .limit(1),
    ]);

    if (operator.length === 0) {
      throw new NotFoundException(
        `Operator with ID ${createOperationDto.operatorId} not found`,
      );
    }

    if (driver.length === 0) {
      throw new NotFoundException(
        `Driver with ID ${createOperationDto.driverId} not found`,
      );
    }

    if (vehicle.length === 0) {
      throw new NotFoundException(
        `Vehicle with ID ${createOperationDto.vehicleId} not found`,
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
      driver[0].operatorId !== createOperationDto.operatorId ||
      vehicle[0].operatorId !== createOperationDto.operatorId
    ) {
      throw new BadRequestException(
        'Driver and vehicle must belong to the specified operator',
      );
    }

    // Asignar el vehículo al chofer para el tracking de disponibilidad
    await this.assignDriverToVehicle(
      {
        driverId: createOperationDto.driverId,
        vehicleId: createOperationDto.vehicleId,
        notes: `Auto-assigned for operation ${createOperationDto.operationNumber}`,
      },
      userId,
    );

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
      clientId,
      providerId,
      driverId,
      vehicleId,
      status,
      operationType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;

    const conditions: SQL[] = [];

    if (operatorId) {
      conditions.push(eq(schema.operations.operatorId, operatorId));
    }

    if (clientId) {
      conditions.push(eq(schema.operations.clientId, clientId));
    }

    if (providerId) {
      conditions.push(eq(schema.operations.providerId, providerId));
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
          client: schema.clients,
          provider: schema.providers,
          driver: schema.drivers,
          vehicle: schema.vehicles,
        })
        .from(schema.operations)
        .leftJoin(
          schema.clients,
          eq(schema.operations.clientId, schema.clients.id),
        )
        .leftJoin(
          schema.providers,
          eq(schema.operations.providerId, schema.providers.id),
        )
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
        client: schema.clients,
        provider: schema.providers,
        driver: schema.drivers,
        vehicle: schema.vehicles,
      })
      .from(schema.operations)
      .leftJoin(
        schema.clients,
        eq(schema.operations.clientId, schema.clients.id),
      )
      .leftJoin(
        schema.providers,
        eq(schema.operations.providerId, schema.providers.id),
      )
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
    const operation = await this.getOperationById(id);

    // Si se está actualizando el chofer o el vehículo, crear nueva asignación
    if (updateOperationDto.driverId && updateOperationDto.vehicleId) {
      // Verificar que el chofer y vehículo existen y pertenecen al mismo operador
      const [driver, vehicle] = await Promise.all([
        this.db
          .select()
          .from(schema.drivers)
          .where(eq(schema.drivers.id, updateOperationDto.driverId))
          .limit(1),
        this.db
          .select()
          .from(schema.vehicles)
          .where(eq(schema.vehicles.id, updateOperationDto.vehicleId))
          .limit(1),
      ]);

      if (driver.length === 0) {
        throw new NotFoundException(
          `Driver with ID ${updateOperationDto.driverId} not found`,
        );
      }

      if (vehicle.length === 0) {
        throw new NotFoundException(
          `Vehicle with ID ${updateOperationDto.vehicleId} not found`,
        );
      }

      // Verificar que pertenecen al mismo operador que la operación
      if (
        driver[0].operatorId !== operation.operation.operatorId ||
        vehicle[0].operatorId !== operation.operation.operatorId
      ) {
        throw new BadRequestException(
          'Driver and vehicle must belong to the same operator as the operation',
        );
      }

      // Asignar el vehículo al chofer
      await this.assignDriverToVehicle(
        {
          driverId: updateOperationDto.driverId,
          vehicleId: updateOperationDto.vehicleId,
          notes: `Auto-assigned for operation ${operation.operation.operationNumber} (updated)`,
        },
        userId,
      );
    } else if (updateOperationDto.driverId || updateOperationDto.vehicleId) {
      // Si solo se actualiza uno de los dos, usar el valor existente para el otro
      const driverId =
        updateOperationDto.driverId || operation.operation.driverId;
      const vehicleId =
        updateOperationDto.vehicleId || operation.operation.vehicleId;

      // Verificar que ambos existen
      const [driver, vehicle] = await Promise.all([
        this.db
          .select()
          .from(schema.drivers)
          .where(eq(schema.drivers.id, driverId))
          .limit(1),
        this.db
          .select()
          .from(schema.vehicles)
          .where(eq(schema.vehicles.id, vehicleId))
          .limit(1),
      ]);

      if (driver.length === 0) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      if (vehicle.length === 0) {
        throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
      }

      // Verificar que pertenecen al mismo operador
      if (
        driver[0].operatorId !== operation.operation.operatorId ||
        vehicle[0].operatorId !== operation.operation.operatorId
      ) {
        throw new BadRequestException(
          'Driver and vehicle must belong to the same operator as the operation',
        );
      }

      // Asignar el vehículo al chofer
      await this.assignDriverToVehicle(
        {
          driverId,
          vehicleId,
          notes: `Auto-assigned for operation ${operation.operation.operationNumber} (updated)`,
        },
        userId,
      );
    }

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
  // DRIVER-VEHICLE ASSIGNMENTS
  // ============================================================================

  async assignDriverToVehicle(
    assignDto: AssignDriverToVehicleDto,
    userId: number,
  ) {
    const { driverId, vehicleId, notes } = assignDto;

    // Verificar que el chofer y vehículo existen
    const [driver] = await this.db
      .select()
      .from(schema.drivers)
      .where(eq(schema.drivers.id, driverId))
      .limit(1);

    const [vehicle] = await this.db
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, vehicleId))
      .limit(1);

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

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
    // Verificar que el driver existe
    const [driver] = await this.db
      .select()
      .from(schema.drivers)
      .where(eq(schema.drivers.id, driverId))
      .limit(1);

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

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
    // Verificar que el driver existe
    const [driver] = await this.db
      .select()
      .from(schema.drivers)
      .where(eq(schema.drivers.id, driverId))
      .limit(1);

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

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
  // DRIVER HISTORY & STATISTICS
  // ============================================================================

  async getDriverOperationHistory(driverId: number, query: OperationQueryDto) {
    // Verificar que el driver existe
    const [driver] = await this.db
      .select()
      .from(schema.drivers)
      .where(eq(schema.drivers.id, driverId))
      .limit(1);

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    return this.getOperations({
      ...query,
      driverId,
    });
  }

  async getDriverStatistics(driverId: number) {
    // Verificar que el driver existe
    const [driver] = await this.db
      .select()
      .from(schema.drivers)
      .where(eq(schema.drivers.id, driverId))
      .limit(1);

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

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

  // ============================================================================
  // BATCH UPLOAD OPERATIONS
  // ============================================================================

  async batchUploadOperations(
    batchUploadDto: BatchUploadOperationsDto,
    userId: number,
  ): Promise<BatchUploadResult> {
    const { operatorId, operations: operationsData } = batchUploadDto;

    // Verify operator exists
    const [operator] = await this.db
      .select()
      .from(schema.operators)
      .where(eq(schema.operators.id, operatorId))
      .limit(1);

    if (!operator) {
      throw new NotFoundException(`Operator with ID ${operatorId} not found`);
    }

    const result: BatchUploadResult = {
      success: true,
      totalRows: operationsData.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
      duplicates: [],
      createdOperations: [],
    };

    // Process each operation
    for (let i = 0; i < operationsData.length; i++) {
      const rowData = operationsData[i];
      const rowNumber = i + 2; // Excel row number (1 is header, so data starts at 2)

      try {
        // Validate and create operation
        await this.processOperationRow(
          operatorId,
          rowData,
          rowNumber,
          userId,
          result,
        );
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          field: 'general',
          message: error.message || 'Error desconocido al procesar la fila',
          value: null,
        });
      }
    }

    result.success = result.errorCount === 0;

    return result;
  }

  private async processOperationRow(
    operatorId: number,
    rowData: any,
    rowNumber: number,
    userId: number,
    result: BatchUploadResult,
  ): Promise<void> {
    // Check for duplicate operation number
    const existingOperation = await this.db
      .select()
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.operatorId, operatorId),
          eq(schema.operations.operationNumber, rowData.operationNumber),
        ),
      )
      .limit(1);

    if (existingOperation.length > 0) {
      result.errorCount++;
      result.duplicates.push(rowData.operationNumber);
      result.errors.push({
        row: rowNumber,
        field: 'operationNumber',
        message: `El número de operación ${rowData.operationNumber} ya existe`,
        value: rowData.operationNumber,
      });
      return;
    }

    // Find driver by RUT
    const [driver] = await this.db
      .select()
      .from(schema.drivers)
      .where(
        and(
          eq(schema.drivers.operatorId, operatorId),
          eq(schema.drivers.rut, rowData.driverRut),
        ),
      )
      .limit(1);

    if (!driver) {
      result.errorCount++;
      result.errors.push({
        row: rowNumber,
        field: 'driverRut',
        message: `No se encontró un chofer con RUT ${rowData.driverRut}`,
        value: rowData.driverRut,
      });
      return;
    }

    if (!driver.status) {
      result.errorCount++;
      result.errors.push({
        row: rowNumber,
        field: 'driverRut',
        message: `El chofer con RUT ${rowData.driverRut} está inactivo`,
        value: rowData.driverRut,
      });
      return;
    }

    // Find vehicle by plate number
    const [vehicle] = await this.db
      .select()
      .from(schema.vehicles)
      .where(
        and(
          eq(schema.vehicles.operatorId, operatorId),
          eq(schema.vehicles.plateNumber, rowData.vehiclePlateNumber),
        ),
      )
      .limit(1);

    if (!vehicle) {
      result.errorCount++;
      result.errors.push({
        row: rowNumber,
        field: 'vehiclePlateNumber',
        message: `No se encontró un vehículo con patente ${rowData.vehiclePlateNumber}`,
        value: rowData.vehiclePlateNumber,
      });
      return;
    }

    if (!vehicle.status) {
      result.errorCount++;
      result.errors.push({
        row: rowNumber,
        field: 'vehiclePlateNumber',
        message: `El vehículo con patente ${rowData.vehiclePlateNumber} está inactivo`,
        value: rowData.vehiclePlateNumber,
      });
      return;
    }

    // Find client if specified
    let clientId: number | undefined = undefined;
    if (rowData.clientName) {
      const [client] = await this.db
        .select()
        .from(schema.clients)
        .where(
          and(
            eq(schema.clients.operatorId, operatorId),
            eq(schema.clients.businessName, rowData.clientName),
          ),
        )
        .limit(1);

      if (!client) {
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          field: 'clientName',
          message: `No se encontró un cliente con el nombre ${rowData.clientName}`,
          value: rowData.clientName,
        });
        return;
      }

      clientId = client.id;
    }

    // Find provider if specified
    let providerId: number | undefined = undefined;
    if (rowData.providerName) {
      const [provider] = await this.db
        .select()
        .from(schema.providers)
        .where(
          and(
            eq(schema.providers.operatorId, operatorId),
            eq(schema.providers.businessName, rowData.providerName),
          ),
        )
        .limit(1);

      if (!provider) {
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          field: 'providerName',
          message: `No se encontró un proveedor con el nombre ${rowData.providerName}`,
          value: rowData.providerName,
        });
        return;
      }

      providerId = provider.id;
    }

    // Find route if specified
    let routeId: number | undefined = undefined;
    if (rowData.routeName) {
      const [route] = await this.db
        .select()
        .from(schema.routes)
        .where(
          and(
            eq(schema.routes.operatorId, operatorId),
            eq(schema.routes.name, rowData.routeName),
          ),
        )
        .limit(1);

      if (!route) {
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          field: 'routeName',
          message: `No se encontró un tramo/ruta con el nombre ${rowData.routeName}`,
          value: rowData.routeName,
        });
        return;
      }

      routeId = route.id;
    }

    // Create the operation
    const createDto: CreateOperationDto = {
      operatorId,
      clientId,
      providerId,
      routeId,
      driverId: driver.id,
      vehicleId: vehicle.id,
      operationNumber: rowData.operationNumber,
      operationType: rowData.operationType,
      origin: rowData.origin,
      destination: rowData.destination,
      scheduledStartDate: rowData.scheduledStartDate,
      scheduledEndDate: rowData.scheduledEndDate,
      distance: rowData.distance,
      cargoDescription: rowData.cargoDescription,
      cargoWeight: rowData.cargoWeight,
      notes: rowData.notes,
    };

    try {
      const newOperation = await this.createOperation(createDto, userId);
      result.successCount++;
      result.createdOperations.push(newOperation.operation.id);
    } catch (error) {
      result.errorCount++;
      result.errors.push({
        row: rowNumber,
        field: 'general',
        message: `Error al crear la operación: ${error.message}`,
        value: null,
      });
    }
  }

  async generateExcelTemplate(): Promise<Buffer> {
    return this.excelService.generateOperationsTemplate();
  }

  async processExcelFile(fileBuffer: Buffer): Promise<{
    data: any[];
    errors: ValidationError[];
  }> {
    return this.excelService.parseOperationsExcel(fileBuffer);
  }

  // ============================================================================
  // PDF REPORT GENERATION
  // ============================================================================

  async generateOperationReport(
    id: number,
    options: GenerateReportDto = {},
  ): Promise<Buffer> {
    // Get full operation data
    const operationData = await this.getOperationById(id);

    if (!operationData.operation) {
      throw new NotFoundException(`Operation with ID ${id} not found`);
    }

    if (!operationData.driver) {
      throw new NotFoundException(
        `Driver information not found for operation ${id}`,
      );
    }

    if (!operationData.vehicle) {
      throw new NotFoundException(
        `Vehicle information not found for operation ${id}`,
      );
    }

    // Get operator information
    const [operator] = await this.db
      .select()
      .from(schema.operators)
      .where(eq(schema.operators.id, operationData.operation.operatorId))
      .limit(1);

    if (!operator) {
      throw new NotFoundException(
        `Operator with ID ${operationData.operation.operatorId} not found`,
      );
    }

    // Get route information if exists
    let routeInfo: { name: string; distance?: number } | undefined = undefined;
    if (operationData.operation.routeId) {
      const [routeData] = await this.db
        .select()
        .from(schema.routes)
        .where(eq(schema.routes.id, operationData.operation.routeId))
        .limit(1);
      if (routeData) {
        routeInfo = {
          name: routeData.name,
          distance: routeData.distance ?? undefined,
        };
      }
    }

    // Prepare data for PDF generation (convert dates to strings)
    const pdfData = {
      operation: {
        ...operationData.operation,
        scheduledStartDate:
          operationData.operation.scheduledStartDate.toISOString(),
        scheduledEndDate:
          operationData.operation.scheduledEndDate?.toISOString(),
        actualStartDate: operationData.operation.actualStartDate?.toISOString(),
        actualEndDate: operationData.operation.actualEndDate?.toISOString(),
        distance: operationData.operation.distance ?? undefined,
        cargoDescription: operationData.operation.cargoDescription ?? undefined,
        cargoWeight: operationData.operation.cargoWeight ?? undefined,
        notes: operationData.operation.notes ?? undefined,
      },
      client: operationData.client
        ? {
            businessName: operationData.client.businessName,
            contactName: operationData.client.contactName ?? undefined,
            contactPhone: operationData.client.contactPhone ?? undefined,
          }
        : undefined,
      provider: operationData.provider
        ? {
            businessName: operationData.provider.businessName,
            contactName: operationData.provider.contactName ?? undefined,
            contactPhone: operationData.provider.contactPhone ?? undefined,
          }
        : undefined,
      driver: {
        firstName: operationData.driver.firstName,
        lastName: operationData.driver.lastName,
        phone: operationData.driver.phone ?? undefined,
        licenseType: operationData.driver.licenseType,
      },
      vehicle: {
        plateNumber: operationData.vehicle.plateNumber,
        brand: operationData.vehicle.brand ?? undefined,
        model: operationData.vehicle.model ?? undefined,
        vehicleType: operationData.vehicle.vehicleType,
      },
      route: routeInfo,
      operator: {
        businessName: operator.name,
      },
    };

    // Generate PDF
    return this.pdfService.generateOperationReport(pdfData, options);
  }
}
