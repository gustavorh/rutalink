import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateDriverDto,
  UpdateDriverDto,
  DriverQueryDto,
  CreateDriverDocumentDto,
  UpdateDriverDocumentDto,
} from './dto/driver.dto';
import { DriversRepository } from './repositories/drivers.repository';
import { DriverDocumentsRepository } from './repositories/driver-documents.repository';

/**
 * Drivers Service
 *
 * Handles business logic for driver operations.
 * Delegates data access to DriversRepository and DriverDocumentsRepository following the Repository Pattern.
 */
@Injectable()
export class DriversService {
  constructor(
    private readonly driversRepository: DriversRepository,
    private readonly driverDocumentsRepository: DriverDocumentsRepository,
  ) {}

  // ============================================================================
  // DRIVERS CRUD
  // ============================================================================

  async createDriver(createDriverDto: CreateDriverDto, userId: number) {
    // Verificar que el operador existe
    const operator = await this.driversRepository.findOperatorById(
      createDriverDto.operatorId,
    );

    if (!operator) {
      throw new NotFoundException(
        `Operator with ID ${createDriverDto.operatorId} not found`,
      );
    }

    // Verificar que el RUT no esté duplicado en el mismo operador
    if (
      await this.driversRepository.existsByRut(
        createDriverDto.rut,
        createDriverDto.operatorId,
      )
    ) {
      throw new ConflictException(
        `Driver with RUT ${createDriverDto.rut} already exists for this operator`,
      );
    }

    const newDriver = await this.driversRepository.createDriver(
      {
        ...createDriverDto,
        licenseExpirationDate: new Date(createDriverDto.licenseExpirationDate),
        dateOfBirth: createDriverDto.dateOfBirth
          ? new Date(createDriverDto.dateOfBirth)
          : undefined,
      },
      userId,
    );

    return this.getDriverById(newDriver.id);
  }

  async getDrivers(query: DriverQueryDto) {
    return this.driversRepository.findPaginated({
      operatorId: query.operatorId,
      search: query.search,
      status: query.status,
      isExternal: query.isExternal,
      licenseType: query.licenseType,
      page: query.page,
      limit: query.limit,
    });
  }

  async getDriverById(id: number) {
    const driver = await this.driversRepository.findById(id);

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

    return this.driversRepository.updateDriver(
      id,
      {
        ...updateDriverDto,
        licenseExpirationDate: updateDriverDto.licenseExpirationDate
          ? new Date(updateDriverDto.licenseExpirationDate)
          : undefined,
        dateOfBirth: updateDriverDto.dateOfBirth
          ? new Date(updateDriverDto.dateOfBirth)
          : undefined,
      },
      userId,
    );
  }

  async deleteDriver(id: number) {
    await this.getDriverById(id);

    // Verificar que no tenga operaciones activas
    if (await this.driversRepository.hasActiveOperations(id)) {
      throw new BadRequestException(
        'Cannot delete driver with active or scheduled operations',
      );
    }

    await this.driversRepository.delete(id);

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

    return this.driverDocumentsRepository.createDriverDocument(
      {
        ...createDocumentDto,
        issueDate: createDocumentDto.issueDate
          ? new Date(createDocumentDto.issueDate)
          : undefined,
        expirationDate: createDocumentDto.expirationDate
          ? new Date(createDocumentDto.expirationDate)
          : undefined,
      },
      userId,
    );
  }

  async getDriverDocuments(driverId: number) {
    await this.getDriverById(driverId);

    return this.driverDocumentsRepository.findByDriverId(driverId);
  }

  async getDriverDocumentById(id: number) {
    const document = await this.driverDocumentsRepository.findById(id);

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

    return this.driverDocumentsRepository.updateDriverDocument(
      id,
      {
        ...updateDocumentDto,
        issueDate: updateDocumentDto.issueDate
          ? new Date(updateDocumentDto.issueDate)
          : undefined,
        expirationDate: updateDocumentDto.expirationDate
          ? new Date(updateDocumentDto.expirationDate)
          : undefined,
      },
      userId,
    );
  }

  async deleteDriverDocument(id: number) {
    await this.getDriverDocumentById(id);

    await this.driverDocumentsRepository.delete(id);

    return { message: 'Driver document deleted successfully' };
  }
}
