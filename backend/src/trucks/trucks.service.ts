import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { and, eq, ilike, or, sql, desc, asc, lt, isNull } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../database/database.module';
import {
  vehicles,
  vehicleDocuments,
  driverVehicles,
  operations,
  Vehicle,
  VehicleDocument,
} from '../database/schema';
import {
  CreateTruckDto,
  UpdateTruckDto,
  CreateVehicleDocumentDto,
  UpdateVehicleDocumentDto,
  TruckQueryDto,
  TruckResponseDto,
  VehicleDocumentResponseDto,
  OperationalStatus,
} from './dto/truck.dto';

@Injectable()
export class TrucksService {
  constructor(@Inject(DATABASE) private readonly db: MySql2Database<any>) {}

  // ============================================================================
  // CRUD OPERATIONS - TRUCKS
  // ============================================================================

  /**
   * Crear un nuevo camión
   */
  async create(
    operatorId: number,
    createTruckDto: CreateTruckDto,
    userId: number,
  ): Promise<TruckResponseDto> {
    // Verificar si ya existe un vehículo con la misma patente para este operador
    const existingVehicle = await this.db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.operatorId, operatorId),
          eq(vehicles.plateNumber, createTruckDto.plateNumber),
        ),
      )
      .limit(1);

    if (existingVehicle.length > 0) {
      throw new ConflictException(
        `Ya existe un camión con la patente ${createTruckDto.plateNumber}`,
      );
    }

    const [newVehicle] = await this.db
      .insert(vehicles)
      .values({
        operatorId,
        plateNumber: createTruckDto.plateNumber,
        brand: createTruckDto.brand,
        model: createTruckDto.model,
        year: createTruckDto.year,
        vehicleType: createTruckDto.vehicleType,
        capacity: createTruckDto.capacity,
        capacityUnit: createTruckDto.capacityUnit,
        vin: createTruckDto.vin,
        color: createTruckDto.color,
        status: createTruckDto.status ?? true,
        notes: createTruckDto.notes,
        createdBy: userId,
        updatedBy: userId,
      })
      .$returningId();

    return this.findOne(operatorId, newVehicle.id, true);
  }

  /**
   * Obtener todos los camiones con filtros y paginación
   */
  async findAll(
    operatorId: number,
    query: TruckQueryDto,
  ): Promise<{
    data: TruckResponseDto[];
    total: number;
    page: number;
    limit: number;
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

    const offset = (page - 1) * limit;

    // Construir condiciones
    const conditions = [eq(vehicles.operatorId, operatorId)];

    if (search) {
      const searchConditions = [ilike(vehicles.plateNumber, `%${search}%`)];
      if (vehicles.brand) {
        searchConditions.push(ilike(vehicles.brand, `%${search}%`));
      }
      if (vehicles.model) {
        searchConditions.push(ilike(vehicles.model, `%${search}%`));
      }
      if (searchConditions.length > 0) {
        const searchOr = or(...searchConditions);
        if (searchOr) {
          conditions.push(searchOr);
        }
      }
    }

    if (vehicleType) {
      conditions.push(eq(vehicles.vehicleType, vehicleType));
    }

    if (status !== undefined) {
      conditions.push(eq(vehicles.status, status));
    }

    // Obtener total
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(and(...conditions));

    // Obtener vehículos
    const vehicleList = await this.db
      .select()
      .from(vehicles)
      .where(and(...conditions))
      .orderBy(desc(vehicles.createdAt))
      .limit(limit)
      .offset(offset);

    // Enriquecer con información adicional
    const enrichedVehicles = await Promise.all(
      vehicleList.map((vehicle) =>
        this.enrichVehicleData(vehicle, includeDocuments, includeStats),
      ),
    );

    return {
      data: enrichedVehicles,
      total: Number(count),
      page,
      limit,
    };
  }

  /**
   * Obtener un camión por ID
   */
  async findOne(
    operatorId: number,
    id: number,
    includeRelations: boolean = false,
  ): Promise<TruckResponseDto> {
    const [vehicle] = await this.db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, id), eq(vehicles.operatorId, operatorId)))
      .limit(1);

    if (!vehicle) {
      throw new NotFoundException(`Camión con ID ${id} no encontrado`);
    }

    return this.enrichVehicleData(vehicle, includeRelations, includeRelations);
  }

  /**
   * Actualizar un camión
   */
  async update(
    operatorId: number,
    id: number,
    updateTruckDto: UpdateTruckDto,
    userId: number,
  ): Promise<TruckResponseDto> {
    await this.findOne(operatorId, id);

    // Si se actualiza la patente, verificar que no exista otra con el mismo número
    if (updateTruckDto.plateNumber) {
      const existing = await this.db
        .select()
        .from(vehicles)
        .where(
          and(
            eq(vehicles.operatorId, operatorId),
            eq(vehicles.plateNumber, updateTruckDto.plateNumber),
            sql`${vehicles.id} != ${id}`,
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(
          `Ya existe otro camión con la patente ${updateTruckDto.plateNumber}`,
        );
      }
    }

    await this.db
      .update(vehicles)
      .set({
        ...updateTruckDto,
        updatedBy: userId,
      })
      .where(and(eq(vehicles.id, id), eq(vehicles.operatorId, operatorId)));

    return this.findOne(operatorId, id, true);
  }

  /**
   * Eliminar un camión
   */
  async remove(operatorId: number, id: number): Promise<void> {
    await this.findOne(operatorId, id);

    // Verificar si tiene operaciones activas
    const activeOperations = await this.db
      .select()
      .from(operations)
      .where(
        and(
          eq(operations.vehicleId, id),
          or(
            eq(operations.status, 'scheduled'),
            eq(operations.status, 'in-progress'),
          ),
        ),
      )
      .limit(1);

    if (activeOperations.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar el camión porque tiene operaciones activas',
      );
    }

    await this.db
      .delete(vehicles)
      .where(and(eq(vehicles.id, id), eq(vehicles.operatorId, operatorId)));
  }

  // ============================================================================
  // DOCUMENT OPERATIONS
  // ============================================================================

  /**
   * Agregar documento a un camión
   */
  async addDocument(
    operatorId: number,
    createDocumentDto: CreateVehicleDocumentDto,
    userId: number,
  ): Promise<VehicleDocumentResponseDto> {
    // Verificar que el vehículo existe y pertenece al operador
    await this.findOne(operatorId, createDocumentDto.vehicleId);

    const [newDocument] = await this.db
      .insert(vehicleDocuments)
      .values({
        ...createDocumentDto,
        issueDate: createDocumentDto.issueDate
          ? new Date(createDocumentDto.issueDate)
          : null,
        expirationDate: createDocumentDto.expirationDate
          ? new Date(createDocumentDto.expirationDate)
          : null,
        createdBy: userId,
        updatedBy: userId,
      })
      .$returningId();

    return this.findDocument(newDocument.id);
  }

  /**
   * Obtener documentos de un camión
   */
  async getDocuments(
    operatorId: number,
    vehicleId: number,
  ): Promise<VehicleDocumentResponseDto[]> {
    await this.findOne(operatorId, vehicleId);

    const docs = await this.db
      .select()
      .from(vehicleDocuments)
      .where(eq(vehicleDocuments.vehicleId, vehicleId))
      .orderBy(desc(vehicleDocuments.expirationDate));

    return docs.map((doc) => this.enrichDocumentData(doc));
  }

  /**
   * Obtener un documento por ID
   */
  async findDocument(id: number): Promise<VehicleDocumentResponseDto> {
    const [document] = await this.db
      .select()
      .from(vehicleDocuments)
      .where(eq(vehicleDocuments.id, id))
      .limit(1);

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

    await this.db
      .update(vehicleDocuments)
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
      .where(eq(vehicleDocuments.id, documentId));

    return this.findDocument(documentId);
  }

  /**
   * Eliminar documento
   */
  async removeDocument(operatorId: number, documentId: number): Promise<void> {
    const document = await this.findDocument(documentId);
    await this.findOne(operatorId, document.vehicleId);

    await this.db
      .delete(vehicleDocuments)
      .where(eq(vehicleDocuments.id, documentId));
  }

  /**
   * Obtener documentos próximos a vencer
   */
  async getExpiringDocuments(
    operatorId: number,
    days: number = 30,
  ): Promise<VehicleDocumentResponseDto[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const docs = await this.db
      .select({
        document: vehicleDocuments,
        vehicle: vehicles,
      })
      .from(vehicleDocuments)
      .innerJoin(vehicles, eq(vehicleDocuments.vehicleId, vehicles.id))
      .where(
        and(
          eq(vehicles.operatorId, operatorId),
          lt(vehicleDocuments.expirationDate, futureDate),
          sql`${vehicleDocuments.expirationDate} >= CURDATE()`,
        ),
      )
      .orderBy(asc(vehicleDocuments.expirationDate));

    return docs.map((row) => this.enrichDocumentData(row.document));
  }

  // ============================================================================
  // OPERATIONAL STATUS
  // ============================================================================

  /**
   * Obtener estado operativo de un camión
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
    const activeOps = await this.db
      .select()
      .from(operations)
      .where(
        and(
          eq(operations.vehicleId, vehicleId),
          eq(operations.status, 'in-progress'),
        ),
      )
      .limit(1);

    if (activeOps.length > 0) {
      return OperationalStatus.RESERVED;
    }

    // Verificar documentos vencidos
    const expiredDocs = await this.db
      .select()
      .from(vehicleDocuments)
      .where(
        and(
          eq(vehicleDocuments.vehicleId, vehicleId),
          lt(vehicleDocuments.expirationDate, new Date()),
        ),
      )
      .limit(1);

    if (expiredDocs.length > 0) {
      return OperationalStatus.OUT_OF_SERVICE;
    }

    return OperationalStatus.ACTIVE;
  }

  /**
   * Obtener historial de operaciones de un camión
   */
  async getOperationHistory(
    operatorId: number,
    vehicleId: number,
    limit: number = 10,
  ) {
    await this.findOne(operatorId, vehicleId);

    return this.db
      .select()
      .from(operations)
      .where(
        and(
          eq(operations.vehicleId, vehicleId),
          eq(operations.operatorId, operatorId),
        ),
      )
      .orderBy(desc(operations.scheduledStartDate))
      .limit(limit);
  }

  /**
   * Obtener próximas operaciones de un camión
   */
  async getUpcomingOperations(operatorId: number, vehicleId: number) {
    await this.findOne(operatorId, vehicleId);

    return this.db
      .select()
      .from(operations)
      .where(
        and(
          eq(operations.vehicleId, vehicleId),
          eq(operations.operatorId, operatorId),
          or(
            eq(operations.status, 'scheduled'),
            eq(operations.status, 'in-progress'),
          ),
        ),
      )
      .orderBy(asc(operations.scheduledStartDate));
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
  ): Promise<TruckResponseDto> {
    const response: TruckResponseDto = {
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
      const docs = await this.db
        .select()
        .from(vehicleDocuments)
        .where(eq(vehicleDocuments.vehicleId, vehicle.id));

      response.documents = docs.map((doc) => this.enrichDocumentData(doc));
    }

    // Incluir estadísticas
    if (includeStats) {
      const [stats] = await this.db
        .select({
          total: sql<number>`COUNT(*)`,
        })
        .from(operations)
        .where(eq(operations.vehicleId, vehicle.id));

      const [upcoming] = await this.db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(operations)
        .where(
          and(
            eq(operations.vehicleId, vehicle.id),
            or(
              eq(operations.status, 'scheduled'),
              eq(operations.status, 'in-progress'),
            ),
          ),
        );

      response.totalOperations = Number(stats?.total || 0);
      response.upcomingOperations = Number(upcoming?.count || 0);

      // Última operación
      const [lastOp] = await this.db
        .select()
        .from(operations)
        .where(eq(operations.vehicleId, vehicle.id))
        .orderBy(desc(operations.actualEndDate))
        .limit(1);

      if (lastOp && lastOp.actualEndDate) {
        response.lastOperationDate = lastOp.actualEndDate;
      }

      // Estado operativo
      response.operationalStatus = await this.getOperationalStatus(
        vehicle.operatorId,
        vehicle.id,
      );
    }

    // Conductor actual
    const [currentAssignment] = await this.db
      .select()
      .from(driverVehicles)
      .where(
        and(
          eq(driverVehicles.vehicleId, vehicle.id),
          eq(driverVehicles.isActive, true),
          isNull(driverVehicles.unassignedAt),
        ),
      )
      .limit(1);

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
