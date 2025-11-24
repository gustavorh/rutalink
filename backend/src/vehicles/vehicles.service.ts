import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  CreateVehicleDocumentDto,
  UpdateVehicleDocumentDto,
  VehicleQueryDto,
  VehicleResponseDto,
  VehicleDocumentResponseDto,
  OperationalStatus,
} from './dto/vehicle.dto';
import { VehiclesRepository } from './repositories/vehicles.repository';
import { VehicleDocumentsRepository } from './repositories/vehicle-documents.repository';
import { OperationsRepository } from '../operations/repositories/operations.repository';
import { Vehicle, VehicleDocument } from '../database/schema';

@Injectable()
export class VehiclesService {
  constructor(
    private vehiclesRepository: VehiclesRepository,
    private vehicleDocumentsRepository: VehicleDocumentsRepository,
    private operationsRepository: OperationsRepository,
  ) {}

  // ============================================================================
  // CRUD OPERATIONS - VEHICLES
  // ============================================================================

  /**
   * Crear un nuevo vehículo
   */
  async create(
    operatorId: number,
    createTruckDto: CreateVehicleDto,
    userId: number,
  ): Promise<VehicleResponseDto> {
    // Verificar si ya existe un vehículo con la misma patente para este operador
    const existingVehicle = await this.vehiclesRepository.findByPlateNumber(
      operatorId,
      createTruckDto.plateNumber,
    );

    if (existingVehicle) {
      throw new ConflictException(
        `Ya existe un vehículo con la patente ${createTruckDto.plateNumber}`,
      );
    }

    // Create vehicle using repository
    const vehicleId = await this.vehiclesRepository.create(
      {
        ...createTruckDto,
        operatorId,
        status: createTruckDto.status ?? true,
      },
      userId,
    );

    return this.findOne(operatorId, vehicleId, true);
  }

  /**
   * Obtener todos los vehículos con filtros y paginación
   */
  async findAll(
    operatorId: number,
    query: VehicleQueryDto,
  ): Promise<{
    data: VehicleResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      vehicleType,
      status,
      includeDocuments,
      includeStats,
    } = query;

    // Use repository's findPaginated method
    const paginatedResult = await this.vehiclesRepository.findPaginated(
      operatorId,
      search,
      vehicleType,
      status,
      page,
      limit,
    );

    // Enriquecer con información adicional
    const enrichedVehicles = await Promise.all(
      paginatedResult.data.map((vehicle) =>
        this.enrichVehicleData(vehicle, includeDocuments, includeStats),
      ),
    );

    return {
      data: enrichedVehicles,
      pagination: paginatedResult.pagination,
    };
  }

  /**
   * Obtener un vehículo por ID
   */
  async findOne(
    operatorId: number,
    id: number,
    includeRelations: boolean = false,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.vehiclesRepository.findByIdAndOperator(
      id,
      operatorId,
    );

    if (!vehicle) {
      throw new NotFoundException(`Camión con ID ${id} no encontrado`);
    }

    return this.enrichVehicleData(vehicle, includeRelations, includeRelations);
  }

  /**
   * Actualizar un vehículo
   */
  async update(
    operatorId: number,
    id: number,
    updateTruckDto: UpdateVehicleDto,
    userId: number,
  ): Promise<VehicleResponseDto> {
    await this.findOne(operatorId, id);

    // Si se actualiza la patente, verificar que no exista otra con el mismo número
    if (updateTruckDto.plateNumber) {
      const exists =
        await this.vehiclesRepository.existsByPlateNumberExcludingId(
          operatorId,
          updateTruckDto.plateNumber,
          id,
        );

      if (exists) {
        throw new ConflictException(
          `Ya existe otro vehículo con la patente ${updateTruckDto.plateNumber}`,
        );
      }
    }

    // Update using repository
    await this.vehiclesRepository.update(id, updateTruckDto, userId);

    return this.findOne(operatorId, id, true);
  }

  /**
   * Eliminar un vehículo
   */
  async remove(operatorId: number, id: number): Promise<void> {
    await this.findOne(operatorId, id);

    // Verificar si tiene operaciones activas
    const hasActiveOperations =
      await this.operationsRepository.hasActiveOperationsForVehicle(id);

    if (hasActiveOperations) {
      throw new BadRequestException(
        'No se puede eliminar el vehículo porque tiene operaciones activas',
      );
    }

    // Delete using repository
    await this.vehiclesRepository.delete(id);
  }

  // ============================================================================
  // DOCUMENT OPERATIONS
  // ============================================================================

  /**
   * Agregar documento a un vehículo
   */
  async addDocument(
    operatorId: number,
    createDocumentDto: CreateVehicleDocumentDto,
    userId: number,
  ): Promise<VehicleDocumentResponseDto> {
    // Verificar que el vehículo existe y pertenece al operador
    await this.findOne(operatorId, createDocumentDto.vehicleId);

    // Create document using repository
    const documentId = await this.vehicleDocumentsRepository.createDocument(
      createDocumentDto,
      userId,
    );

    return this.findDocument(documentId);
  }

  /**
   * Obtener documentos de un vehículo
   */
  async getDocuments(
    operatorId: number,
    vehicleId: number,
  ): Promise<VehicleDocumentResponseDto[]> {
    await this.findOne(operatorId, vehicleId);

    const docs =
      await this.vehicleDocumentsRepository.findByVehicleId(vehicleId);

    return docs.map((doc) => this.enrichDocumentData(doc));
  }

  /**
   * Obtener un documento por ID
   */
  async findDocument(id: number): Promise<VehicleDocumentResponseDto> {
    const document = await this.vehicleDocumentsRepository.findById(id);

    if (!document) {
      throw new NotFoundException(`Documento con ID ${id} no encontrado`);
    }

    return this.enrichDocumentData(document);
  }

  /**
   * Actualizar documento
   */
  async updateDocument(
    operatorId: number,
    documentId: number,
    updateDocumentDto: UpdateVehicleDocumentDto,
    userId: number,
  ): Promise<VehicleDocumentResponseDto> {
    const document = await this.findDocument(documentId);

    // Verificar que el vehículo pertenece al operador
    await this.findOne(operatorId, document.vehicleId);

    // Update using repository
    await this.vehicleDocumentsRepository.updateDocument(
      documentId,
      updateDocumentDto,
      userId,
    );

    return this.findDocument(documentId);
  }

  /**
   * Eliminar documento
   */
  async removeDocument(operatorId: number, documentId: number): Promise<void> {
    const document = await this.findDocument(documentId);
    await this.findOne(operatorId, document.vehicleId);

    // Delete using repository
    await this.vehicleDocumentsRepository.delete(documentId);
  }

  /**
   * Obtener documentos próximos a vencer
   */
  async getExpiringDocuments(
    operatorId: number,
    days: number = 30,
  ): Promise<VehicleDocumentResponseDto[]> {
    const docs = await this.vehicleDocumentsRepository.findExpiringDocuments(
      operatorId,
      days,
    );

    return docs.map((row) => this.enrichDocumentData(row.document));
  }

  // ============================================================================
  // OPERATIONAL STATUS
  // ============================================================================

  /**
   * Obtener estado operativo de un vehículo
   */
  async getOperationalStatus(
    operatorId: number,
    vehicleId: number,
  ): Promise<OperationalStatus> {
    const vehicle = await this.findOne(operatorId, vehicleId);

    if (!vehicle.status) {
      return OperationalStatus.OUT_OF_SERVICE;
    }

    // Verificar si tiene operaciones activas
    const hasInProgressOps =
      await this.operationsRepository.hasInProgressOperationsForVehicle(
        vehicleId,
      );

    if (hasInProgressOps) {
      return OperationalStatus.RESERVED;
    }

    // Verificar documentos vencidos
    const hasExpiredDocs =
      await this.vehicleDocumentsRepository.hasExpiredDocuments(vehicleId);

    if (hasExpiredDocs) {
      return OperationalStatus.OUT_OF_SERVICE;
    }

    return OperationalStatus.ACTIVE;
  }

  /**
   * Obtener historial de operaciones de un vehículo
   */
  async getOperationHistory(
    operatorId: number,
    vehicleId: number,
    limit: number = 10,
  ) {
    await this.findOne(operatorId, vehicleId);

    return this.operationsRepository.findHistoryByVehicle(
      operatorId,
      vehicleId,
      limit,
    );
  }

  /**
   * Obtener próximas operaciones de un vehículo
   */
  async getUpcomingOperations(operatorId: number, vehicleId: number) {
    await this.findOne(operatorId, vehicleId);

    return this.operationsRepository.findUpcomingByVehicle(
      operatorId,
      vehicleId,
    );
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Enriquecer datos del vehículo con información relacionada
   */
  private async enrichVehicleData(
    vehicle: Vehicle,
    includeDocuments: boolean = false,
    includeStats: boolean = false,
  ): Promise<VehicleResponseDto> {
    const response: VehicleResponseDto = {
      id: vehicle.id,
      operatorId: vehicle.operatorId,
      plateNumber: vehicle.plateNumber,
      brand: vehicle.brand ?? undefined,
      model: vehicle.model ?? undefined,
      year: vehicle.year ?? undefined,
      vehicleType: vehicle.vehicleType,
      capacity: vehicle.capacity ?? undefined,
      capacityUnit: vehicle.capacityUnit ?? undefined,
      vin: vehicle.vin ?? undefined,
      color: vehicle.color ?? undefined,
      status: vehicle.status,
      notes: vehicle.notes ?? undefined,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
      createdBy: vehicle.createdBy ?? undefined,
      updatedBy: vehicle.updatedBy ?? undefined,
    };

    // Incluir documentos
    if (includeDocuments) {
      const docs = await this.vehicleDocumentsRepository.findByVehicleId(
        vehicle.id,
      );

      response.documents = docs.map((doc) => this.enrichDocumentData(doc));
    }

    // Incluir estadísticas
    if (includeStats) {
      const stats = await this.operationsRepository.getVehicleStatistics(
        vehicle.id,
      );

      response.totalOperations = stats.totalOperations;
      response.upcomingOperations = stats.upcomingOperations;
      response.lastOperationDate = stats.lastOperationDate || undefined;

      // Estado operativo
      response.operationalStatus = await this.getOperationalStatus(
        vehicle.operatorId,
        vehicle.id,
      );
    }

    // Conductor actual
    const currentAssignment =
      await this.vehiclesRepository.getCurrentDriverAssignment(vehicle.id);

    if (currentAssignment) {
      // Aquí se podría hacer join con drivers para obtener el nombre
      // Por ahora solo retornamos el ID
      response.currentDriver = {
        id: currentAssignment.driverId,
        firstName: '',
        lastName: '',
      };
    }

    return response;
  }

  /**
   * Enriquecer datos del documento con campos calculados
   */
  private enrichDocumentData(
    document: VehicleDocument,
  ): VehicleDocumentResponseDto {
    const response: VehicleDocumentResponseDto = {
      id: document.id,
      vehicleId: document.vehicleId,
      documentType: document.documentType,
      documentName: document.documentName,
      fileName: document.fileName ?? undefined,
      filePath: document.filePath ?? undefined,
      fileSize: document.fileSize ?? undefined,
      mimeType: document.mimeType ?? undefined,
      issueDate: document.issueDate ?? undefined,
      expirationDate: document.expirationDate ?? undefined,
      insuranceCompany: document.insuranceCompany ?? undefined,
      policyNumber: document.policyNumber ?? undefined,
      coverageAmount: document.coverageAmount ?? undefined,
      notes: document.notes ?? undefined,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      createdBy: document.createdBy ?? undefined,
      updatedBy: document.updatedBy ?? undefined,
    };

    // Calcular si está vencido y días hasta vencimiento
    if (document.expirationDate) {
      const now = new Date();
      const expiration = new Date(document.expirationDate);

      response.isExpired = expiration < now;

      const diffTime = expiration.getTime() - now.getTime();
      response.daysUntilExpiration = Math.ceil(
        diffTime / (1000 * 60 * 60 * 24),
      );
    }

    return response;
  }
}
