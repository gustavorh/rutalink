import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, or, desc, sql, SQL, ilike } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { Vehicle } from '../../database/schema';
import { QueryBuilder } from '../../common/query-builder/query-builder';
import {
  PaginationFactory,
  PaginatedResponse,
} from '../../common/pagination/pagination.factory';

/**
 * Vehicles Repository
 *
 * Handles all data access operations for vehicles.
 * Extends BaseRepository for common CRUD operations.
 */
@Injectable()
export class VehiclesRepository extends BaseRepository<Vehicle> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.vehicles);
  }

  /**
   * Find vehicle by plate number and operator
   */
  async findByPlateNumber(
    operatorId: number,
    plateNumber: string,
  ): Promise<Vehicle | null> {
    const [vehicle] = await this.db
      .select()
      .from(schema.vehicles)
      .where(
        and(
          eq(schema.vehicles.operatorId, operatorId),
          eq(schema.vehicles.plateNumber, plateNumber),
        ),
      )
      .limit(1);
    return vehicle || null;
  }

  /**
   * Find vehicle by ID and operator
   */
  async findByIdAndOperator(
    id: number,
    operatorId: number,
  ): Promise<Vehicle | null> {
    const [vehicle] = await this.db
      .select()
      .from(schema.vehicles)
      .where(
        and(
          eq(schema.vehicles.id, id),
          eq(schema.vehicles.operatorId, operatorId),
        ),
      )
      .limit(1);
    return vehicle || null;
  }

  /**
   * Check if plate number exists for operator (excluding current vehicle)
   */
  async existsByPlateNumberExcludingId(
    operatorId: number,
    plateNumber: string,
    excludeId: number,
  ): Promise<boolean> {
    const [vehicle] = await this.db
      .select()
      .from(schema.vehicles)
      .where(
        and(
          eq(schema.vehicles.operatorId, operatorId),
          eq(schema.vehicles.plateNumber, plateNumber),
          sql`${schema.vehicles.id} != ${excludeId}`,
        ),
      )
      .limit(1);
    return vehicle !== null;
  }

  /**
   * Get paginated list of vehicles with filters
   */
  async findPaginated(
    operatorId: number,
    search?: string,
    vehicleType?: string,
    status?: boolean,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<Vehicle>> {
    // Build WHERE clause using QueryBuilder
    const conditions: SQL[] = [eq(schema.vehicles.operatorId, operatorId)];

    if (search) {
      const searchConditions = [ilike(schema.vehicles.plateNumber, `%${search}%`)];
      if (schema.vehicles.brand) {
        searchConditions.push(ilike(schema.vehicles.brand, `%${search}%`));
      }
      if (schema.vehicles.model) {
        searchConditions.push(ilike(schema.vehicles.model, `%${search}%`));
      }
      if (searchConditions.length > 0) {
        const searchOr = or(...searchConditions);
        if (searchOr) {
          conditions.push(searchOr);
        }
      }
    }

    if (vehicleType) {
      conditions.push(eq(schema.vehicles.vehicleType, vehicleType));
    }

    if (status !== undefined) {
      conditions.push(eq(schema.vehicles.status, status));
    }

    const whereClause = and(...conditions);
    const offset = PaginationFactory.calculateOffset(page, limit);

    // Execute query with pagination
    const [vehicles, totalCount] = await Promise.all([
      this.db
        .select()
        .from(schema.vehicles)
        .where(whereClause)
        .orderBy(desc(schema.vehicles.createdAt))
        .limit(limit)
        .offset(offset),
      this.countByWhere(whereClause),
    ]);

    return PaginationFactory.create(vehicles, totalCount, page, limit);
  }

  /**
   * Get current driver assignment for a vehicle
   */
  async getCurrentDriverAssignment(vehicleId: number) {
    const [assignment] = await this.db
      .select()
      .from(schema.driverVehicles)
      .where(
        and(
          eq(schema.driverVehicles.vehicleId, vehicleId),
          eq(schema.driverVehicles.isActive, true),
        ),
      )
      .limit(1);
    return assignment || null;
  }

  /**
   * Count records with custom WHERE clause
   */
  private async countByWhere(whereClause?: SQL): Promise<number> {
    const query = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.vehicles);

    if (whereClause) {
      query.where(whereClause);
    }

    const [result] = await query;
    return Number(result.count);
  }
}

