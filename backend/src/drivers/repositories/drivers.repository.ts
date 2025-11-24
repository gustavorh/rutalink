import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, or, sql, SQL, desc } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { Driver, NewDriver } from '../../database/schema';
import { QueryBuilder } from '../../common/query-builder/query-builder';
import {
  PaginationFactory,
  PaginatedResponse,
} from '../../common/pagination/pagination.factory';

/**
 * Drivers Repository
 *
 * Handles all data access operations for drivers.
 * Extends BaseRepository for common CRUD operations.
 */
@Injectable()
export class DriversRepository extends BaseRepository<Driver> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.drivers);
  }

  /**
   * Find driver by ID and operator (for tenant isolation)
   */
  async findByIdAndOperator(
    id: number,
    operatorId: number,
  ): Promise<Driver | null> {
    const [driver] = await this.db
      .select()
      .from(schema.drivers)
      .where(
        and(
          eq(schema.drivers.id, id),
          eq(schema.drivers.operatorId, operatorId),
        ),
      )
      .limit(1);
    return (driver as Driver) || null;
  }

  /**
   * Find driver by RUT and operator
   */
  async findByRutAndOperator(
    rut: string,
    operatorId: number,
  ): Promise<Driver | null> {
    const [driver] = await this.db
      .select()
      .from(schema.drivers)
      .where(
        and(
          eq(schema.drivers.rut, rut),
          eq(schema.drivers.operatorId, operatorId),
        ),
      )
      .limit(1);
    return (driver as Driver) || null;
  }

  /**
   * Check if RUT exists for operator
   */
  async existsByRut(rut: string, operatorId: number): Promise<boolean> {
    const driver = await this.findByRutAndOperator(rut, operatorId);
    return driver !== null;
  }

  /**
   * Get paginated list of drivers with filters
   */
  async findPaginated(params: {
    operatorId?: number;
    search?: string;
    status?: boolean;
    isExternal?: boolean;
    licenseType?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Driver>> {
    const { page = 1, limit = 10 } = PaginationFactory.normalizePagination({
      page: params.page,
      limit: params.limit,
    });
    const offset = PaginationFactory.calculateOffset(page, limit);

    // Build WHERE clause using QueryBuilder
    const whereClause = new QueryBuilder()
      .addEquals(schema.drivers.operatorId, params.operatorId)
      .addEquals(schema.drivers.status, params.status)
      .addEquals(schema.drivers.isExternal, params.isExternal)
      .addEquals(schema.drivers.licenseType, params.licenseType)
      .addSearch(
        [
          schema.drivers.firstName,
          schema.drivers.lastName,
          schema.drivers.rut,
          schema.drivers.email,
        ],
        params.search,
      )
      .build();

    // Execute queries in parallel for better performance
    const [drivers, totalCount] = await Promise.all([
      this.db
        .select()
        .from(schema.drivers)
        .where(whereClause)
        .orderBy(desc(schema.drivers.createdAt))
        .limit(limit)
        .offset(offset),
      this.countByWhere(whereClause),
    ]);

    return PaginationFactory.create(
      drivers as Driver[],
      totalCount,
      page,
      limit,
    );
  }

  /**
   * Check if driver has active or scheduled operations
   */
  async hasActiveOperations(driverId: number): Promise<boolean> {
    const [operation] = await this.db
      .select()
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.driverId, driverId),
          or(
            eq(schema.operations.status, 'scheduled'),
            eq(schema.operations.status, 'in-progress'),
          ),
        ),
      )
      .limit(1);
    return operation !== null;
  }

  /**
   * Find operator by ID
   */
  async findOperatorById(id: number) {
    const [operator] = await this.db
      .select()
      .from(schema.operators)
      .where(eq(schema.operators.id, id))
      .limit(1);
    return operator || null;
  }

  /**
   * Create driver and return the created driver
   */
  async createDriver(driverData: NewDriver, userId: number): Promise<Driver> {
    const [insertedDriver] = await this.db
      .insert(schema.drivers)
      .values({
        ...driverData,
        createdBy: userId,
        updatedBy: userId,
      })
      .$returningId();

    const createdDriver = await this.findById(insertedDriver.id);
    if (!createdDriver) {
      throw new Error('Failed to retrieve created driver');
    }
    return createdDriver;
  }

  /**
   * Update driver and return the updated driver
   */
  async updateDriver(
    id: number,
    driverData: Partial<Driver>,
    userId: number,
  ): Promise<Driver> {
    await this.db
      .update(schema.drivers)
      .set({
        ...driverData,
        updatedBy: userId,
      })
      .where(eq(schema.drivers.id, id));

    const updatedDriver = await this.findById(id);
    if (!updatedDriver) {
      throw new Error('Failed to retrieve updated driver');
    }
    return updatedDriver;
  }

  /**
   * Count records with custom WHERE clause
   */
  private async countByWhere(whereClause?: SQL): Promise<number> {
    const query = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.drivers);

    if (whereClause) {
      query.where(whereClause);
    }

    const [result] = await query;
    return Number(result.count);
  }
}
