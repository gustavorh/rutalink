import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateOperationDto,
  UpdateOperationDto,
  OperationQueryDto,
  AssignDriverToVehicleDto,
  UnassignDriverFromVehicleDto,
  GenerateReportDto,
  BatchUploadOperationsDto,
  OperationExcelRowDto,
} from './dto/operation.dto';
import { PdfService } from './pdf.service';
import { ExcelService, ValidationError } from './excel.service';
import { OperationsRepository } from './repositories/operations.repository';
import { DriverVehiclesRepository } from './repositories/driver-vehicles.repository';

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
    private pdfService: PdfService,
    private excelService: ExcelService,
    private operationsRepository: OperationsRepository,
    private driverVehiclesRepository: DriverVehiclesRepository,
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
      this.operationsRepository.findOperatorById(createOperationDto.operatorId),
      this.operationsRepository.findDriverById(createOperationDto.driverId),
      this.operationsRepository.findVehicleById(createOperationDto.vehicleId),
    ]);

    if (!operator) {
      throw new NotFoundException(
        `Operator with ID ${createOperationDto.operatorId} not found`,
      );
    }

    if (!driver) {
      throw new NotFoundException(
        `Driver with ID ${createOperationDto.driverId} not found`,
      );
    }

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with ID ${createOperationDto.vehicleId} not found`,
      );
    }

    // Verificar que el número de operación no esté duplicado
    const existingOperation =
      await this.operationsRepository.findByOperationNumber(
        createOperationDto.operatorId,
        createOperationDto.operationNumber,
      );

    if (existingOperation) {
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

    // Asignar el vehículo al chofer para el tracking de disponibilidad
    await this.assignDriverToVehicle(
      {
        driverId: createOperationDto.driverId,
        vehicleId: createOperationDto.vehicleId,
        notes: `Auto-assigned for operation ${createOperationDto.operationNumber}`,
      },
      userId,
    );

    // Create operation using repository

    const operationId = await this.operationsRepository.createOperation(
      createOperationDto as any,
      userId,
    );

    return this.getOperationById(operationId);
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

    // Use repository's findPaginated method
    return this.operationsRepository.findPaginated(
      operatorId,
      clientId,
      providerId,
      driverId,
      vehicleId,
      status,
      operationType,
      startDate,
      endDate,
      page,
      limit,
    );
  }

  async getOperationById(id: number) {
    const operation = await this.operationsRepository.findByIdWithRelations(id);

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
        this.operationsRepository.findDriverById(updateOperationDto.driverId),
        this.operationsRepository.findVehicleById(updateOperationDto.vehicleId),
      ]);

      if (!driver) {
        throw new NotFoundException(
          `Driver with ID ${updateOperationDto.driverId} not found`,
        );
      }

      if (!vehicle) {
        throw new NotFoundException(
          `Vehicle with ID ${updateOperationDto.vehicleId} not found`,
        );
      }

      // Verificar que pertenecen al mismo operador que la operación
      if (
        driver.operatorId !== operation.operation.operatorId ||
        vehicle.operatorId !== operation.operation.operatorId
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
        this.operationsRepository.findDriverById(driverId),
        this.operationsRepository.findVehicleById(vehicleId),
      ]);

      if (!driver) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
      }

      // Verificar que pertenecen al mismo operador
      if (
        driver.operatorId !== operation.operation.operatorId ||
        vehicle.operatorId !== operation.operation.operatorId
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

    // Update operation using repository

    await this.operationsRepository.updateOperation(
      id,
      updateOperationDto as any,
      userId,
    );

    return this.getOperationById(id);
  }

  async deleteOperation(id: number) {
    const operation = await this.getOperationById(id);

    // Solo permitir eliminar operaciones que no están en progreso
    if (operation.operation.status === 'in-progress') {
      throw new BadRequestException('Cannot delete operation in progress');
    }

    // Delete operation using repository
    await this.operationsRepository.delete(id);

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
    const [driver, vehicle] = await Promise.all([
      this.operationsRepository.findDriverById(driverId),
      this.operationsRepository.findVehicleById(vehicleId),
    ]);

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
    await this.driverVehiclesRepository.deactivateActiveAssignments(
      driverId,
      userId,
    );

    // Crear nueva asignación
    const assignmentId = await this.driverVehiclesRepository.createAssignment(
      driverId,
      vehicleId,
      notes,
      userId,
    );

    return this.getDriverVehicleAssignmentById(assignmentId);
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

    await this.driverVehiclesRepository.unassignById(
      assignmentId,
      unassignDto.notes,
      userId,
    );

    return this.getDriverVehicleAssignmentById(assignmentId);
  }

  async getDriverVehicleAssignments(driverId: number) {
    // Verificar que el driver existe
    const driver = await this.operationsRepository.findDriverById(driverId);

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    return this.driverVehiclesRepository.findByDriverId(driverId);
  }

  async getActiveDriverVehicleAssignment(driverId: number) {
    // Verificar que el driver existe
    const driver = await this.operationsRepository.findDriverById(driverId);

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    return this.driverVehiclesRepository.findActiveByDriverId(driverId);
  }

  async getDriverVehicleAssignmentById(id: number) {
    const assignment = await this.driverVehiclesRepository.findById(id);

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
    const driver = await this.operationsRepository.findDriverById(driverId);

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
    const driver = await this.operationsRepository.findDriverById(driverId);

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    return this.operationsRepository.getDriverStatistics(driverId);
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
    const operator =
      await this.operationsRepository.findOperatorById(operatorId);

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
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Error desconocido al procesar la fila';
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          field: 'general',
          message: errorMessage,
          value: null,
        });
      }
    }

    result.success = result.errorCount === 0;

    return result;
  }

  private async processOperationRow(
    operatorId: number,
    rowData: OperationExcelRowDto,
    rowNumber: number,
    userId: number,
    result: BatchUploadResult,
  ): Promise<void> {
    const opNumber = rowData.operationNumber;
    const driverRutValue = rowData.driverRut;
    const vehiclePlate = rowData.vehiclePlateNumber;

    // Check for duplicate operation number
    const existingOperation =
      await this.operationsRepository.findByOperationNumber(
        operatorId,
        opNumber,
      );

    if (existingOperation) {
      result.errorCount++;
      result.duplicates.push(opNumber);
      result.errors.push({
        row: rowNumber,
        field: 'operationNumber',
        message: `El número de operación ${opNumber} ya existe`,
        value: opNumber,
      });
      return;
    }

    // Find driver by RUT
    const driver = await this.operationsRepository.findDriverByRut(
      operatorId,
      driverRutValue,
    );

    if (!driver) {
      result.errorCount++;
      result.errors.push({
        row: rowNumber,
        field: 'driverRut',
        message: `No se encontró un chofer con RUT ${driverRutValue}`,
        value: driverRutValue,
      });
      return;
    }

    if (!driver.status) {
      result.errorCount++;
      result.errors.push({
        row: rowNumber,
        field: 'driverRut',
        message: `El chofer con RUT ${driverRutValue} está inactivo`,
        value: driverRutValue,
      });
      return;
    }

    // Find vehicle by plate number
    const vehicle = await this.operationsRepository.findVehicleByPlateNumber(
      operatorId,
      vehiclePlate,
    );

    if (!vehicle) {
      result.errorCount++;
      result.errors.push({
        row: rowNumber,
        field: 'vehiclePlateNumber',
        message: `No se encontró un vehículo con patente ${vehiclePlate}`,
        value: vehiclePlate,
      });
      return;
    }

    if (!vehicle.status) {
      result.errorCount++;
      result.errors.push({
        row: rowNumber,
        field: 'vehiclePlateNumber',
        message: `El vehículo con patente ${vehiclePlate} está inactivo`,
        value: vehiclePlate,
      });
      return;
    }

    // Find client if specified
    let clientId: number | undefined = undefined;
    const clientNameValue = rowData.clientName;
    if (clientNameValue) {
      const client = await this.operationsRepository.findClientByBusinessName(
        operatorId,
        clientNameValue,
      );

      if (!client) {
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          field: 'clientName',
          message: `No se encontró un cliente con el nombre ${clientNameValue}`,
          value: clientNameValue,
        });
        return;
      }

      clientId = client.id;
    }

    // Find provider if specified
    let providerId: number | undefined = undefined;
    const providerNameValue = rowData.providerName;
    if (providerNameValue) {
      const provider =
        await this.operationsRepository.findProviderByBusinessName(
          operatorId,
          providerNameValue,
        );

      if (!provider) {
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          field: 'providerName',
          message: `No se encontró un proveedor con el nombre ${providerNameValue}`,
          value: providerNameValue,
        });
        return;
      }

      providerId = provider.id;
    }

    // Find route if specified
    let routeId: number | undefined = undefined;
    const routeNameValue = rowData.routeName;
    if (routeNameValue) {
      const route = await this.operationsRepository.findRouteByName(
        operatorId,
        routeNameValue,
      );

      if (!route) {
        result.errorCount++;
        result.errors.push({
          row: rowNumber,
          field: 'routeName',
          message: `No se encontró un tramo/ruta con el nombre ${routeNameValue}`,
          value: routeNameValue,
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
      operationNumber: opNumber,
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
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      result.errorCount++;
      result.errors.push({
        row: rowNumber,
        field: 'general',
        message: `Error al crear la operación: ${errorMessage}`,
        value: null,
      });
    }
  }

  async generateExcelTemplate(operatorId: number): Promise<Buffer> {
    return this.excelService.generateOperationsTemplate(operatorId);
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
    const operator = await this.operationsRepository.findOperatorById(
      operationData.operation.operatorId,
    );

    if (!operator) {
      throw new NotFoundException(
        `Operator with ID ${operationData.operation.operatorId} not found`,
      );
    }

    // Get route information if exists
    let routeInfo: { name: string; distance?: number } | undefined = undefined;
    if (operationData.operation.routeId) {
      const routeData = await this.operationsRepository.findRouteById(
        operationData.operation.routeId,
      );
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
