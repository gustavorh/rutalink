import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, like, or, desc, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../database/database.module';
import * as schema from '../database/schema';
import {
  CreateDriverDto,
  UpdateDriverDto,
  DriverQueryDto,
  CreateDriverDocumentDto,
  UpdateDriverDocumentDto,
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

    const conditions: SQL[] = [];

    if (operatorId) {
      conditions.push(eq(schema.drivers.operatorId, operatorId));
    }

    if (search) {
      const searchCondition = or(
        like(schema.drivers.firstName, `%${search}%`),
        like(schema.drivers.lastName, `%${search}%`),
        like(schema.drivers.rut, `%${search}%`),
        like(schema.drivers.email, `%${search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
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
}
