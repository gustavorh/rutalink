import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, asc, sql, SQL } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { Operation } from '../../database/schema';
import { QueryBuilder } from '../../common/query-builder/query-builder';
import {
  PaginationFactory,
  PaginatedResponse,
} from '../../common/pagination/pagination.factory';

/**
 * Operations Repository
 *
 * Handles all data access operations for operations.
 * Extends BaseRepository for common CRUD operations.
 */
@Injectable()
export class OperationsRepository extends BaseRepository<Operation> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.operations);
  }

  /**
   * Find operation by operation number and operator
   */
  async findByOperationNumber(
    operatorId: number,
    operationNumber: string,
  ): Promise<Operation | null> {
    const [operation] = await this.db
      .select()
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.operatorId, operatorId),
          eq(schema.operations.operationNumber, operationNumber),
        ),
      )
      .limit(1);
    return operation || null;
  }

  /**
   * Get operation by ID with related data (joins)
   */
  async findByIdWithRelations(id: number) {
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

    return operation;
  }

  /**
   * Get paginated list of operations with filters
   */
  async findPaginated(
    operatorId?: number,
    clientId?: number,
    providerId?: number,
    driverId?: number,
    vehicleId?: number,
    status?: string,
    operationType?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<any>> {
    // Build WHERE clause using QueryBuilder
    const whereClause = new QueryBuilder()
      .addEquals(schema.operations.operatorId, operatorId)
      .addEquals(schema.operations.clientId, clientId)
      .addEquals(schema.operations.providerId, providerId)
      .addEquals(schema.operations.driverId, driverId)
      .addEquals(schema.operations.vehicleId, vehicleId)
      .addEquals(schema.operations.status, status)
      .addEquals(schema.operations.operationType, operationType)
      .addDateRange(
        schema.operations.scheduledStartDate,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      )
      .build();

    const offset = PaginationFactory.calculateOffset(page, limit);

    // Execute query with pagination
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
      this.countByWhere(whereClause),
    ]);

    return PaginationFactory.create(operations, totalCount, page, limit);
  }

  /**
   * Get driver statistics
   */
  async getDriverStatistics(driverId: number) {
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

  /**
   * Create operation with proper date handling
   */
  async createOperation(
    data: Partial<Operation>,
    userId: number,
  ): Promise<number> {
    const insertData: any = {
      operatorId: data.operatorId!,
      driverId: data.driverId!,
      vehicleId: data.vehicleId!,
      operationNumber: data.operationNumber!,
      operationType: data.operationType!,
      origin: data.origin!,
      destination: data.destination!,
      scheduledStartDate: data.scheduledStartDate
        ? new Date(data.scheduledStartDate as any)
        : undefined,
      scheduledEndDate: data.scheduledEndDate
        ? new Date(data.scheduledEndDate as any)
        : null,
      actualStartDate: data.actualStartDate
        ? new Date(data.actualStartDate as any)
        : null,
      actualEndDate: data.actualEndDate
        ? new Date(data.actualEndDate as any)
        : null,
      clientId: data.clientId ?? null,
      providerId: data.providerId ?? null,
      routeId: data.routeId ?? null,
      distance: data.distance ?? null,
      status: data.status ?? 'scheduled',
      cargoDescription: data.cargoDescription ?? null,
      cargoWeight: data.cargoWeight ?? null,
      notes: data.notes ?? null,
      createdBy: userId,
      updatedBy: userId,
    };

    const [result] = await this.db.insert(schema.operations).values(insertData);
    return result.insertId;
  }

  /**
   * Update operation with proper date handling
   */
  async updateOperation(
    id: number,
    data: Partial<Operation>,
    userId: number,
  ): Promise<void> {
    const updateData: any = {
      ...data,
      updatedBy: userId,
    };

    // Handle date conversions
    if (data.scheduledStartDate) {
      updateData.scheduledStartDate = new Date(data.scheduledStartDate as any);
    }
    if (data.scheduledEndDate !== undefined) {
      updateData.scheduledEndDate = data.scheduledEndDate
        ? new Date(data.scheduledEndDate as any)
        : null;
    }
    if (data.actualStartDate !== undefined) {
      updateData.actualStartDate = data.actualStartDate
        ? new Date(data.actualStartDate as any)
        : null;
    }
    if (data.actualEndDate !== undefined) {
      updateData.actualEndDate = data.actualEndDate
        ? new Date(data.actualEndDate as any)
        : null;
    }

    await this.db
      .update(schema.operations)
      .set(updateData)
      .where(eq(schema.operations.id, id));
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
   * Find driver by ID
   */
  async findDriverById(id: number) {
    const [driver] = await this.db
      .select()
      .from(schema.drivers)
      .where(eq(schema.drivers.id, id))
      .limit(1);
    return driver || null;
  }

  /**
   * Find driver by RUT and operator
   */
  async findDriverByRut(operatorId: number, rut: string) {
    const [driver] = await this.db
      .select()
      .from(schema.drivers)
      .where(
        and(
          eq(schema.drivers.operatorId, operatorId),
          eq(schema.drivers.rut, rut),
        ),
      )
      .limit(1);
    return driver || null;
  }

  /**
   * Find vehicle by ID
   */
  async findVehicleById(id: number) {
    const [vehicle] = await this.db
      .select()
      .from(schema.vehicles)
      .where(eq(schema.vehicles.id, id))
      .limit(1);
    return vehicle || null;
  }

  /**
   * Find vehicle by plate number and operator
   */
  async findVehicleByPlateNumber(operatorId: number, plateNumber: string) {
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
   * Find client by ID
   */
  async findClientById(id: number) {
    const [client] = await this.db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, id))
      .limit(1);
    return client || null;
  }

  /**
   * Find client by business name and operator
   */
  async findClientByBusinessName(operatorId: number, businessName: string) {
    const [client] = await this.db
      .select()
      .from(schema.clients)
      .where(
        and(
          eq(schema.clients.operatorId, operatorId),
          eq(schema.clients.businessName, businessName),
        ),
      )
      .limit(1);
    return client || null;
  }

  /**
   * Find provider by ID
   */
  async findProviderById(id: number) {
    const [provider] = await this.db
      .select()
      .from(schema.providers)
      .where(eq(schema.providers.id, id))
      .limit(1);
    return provider || null;
  }

  /**
   * Find provider by business name and operator
   */
  async findProviderByBusinessName(operatorId: number, businessName: string) {
    const [provider] = await this.db
      .select()
      .from(schema.providers)
      .where(
        and(
          eq(schema.providers.operatorId, operatorId),
          eq(schema.providers.businessName, businessName),
        ),
      )
      .limit(1);
    return provider || null;
  }

  /**
   * Find route by ID
   */
  async findRouteById(id: number) {
    const [route] = await this.db
      .select()
      .from(schema.routes)
      .where(eq(schema.routes.id, id))
      .limit(1);
    return route || null;
  }

  /**
   * Find route by name and operator
   */
  async findRouteByName(operatorId: number, name: string) {
    const [route] = await this.db
      .select()
      .from(schema.routes)
      .where(
        and(
          eq(schema.routes.operatorId, operatorId),
          eq(schema.routes.name, name),
        ),
      )
      .limit(1);
    return route || null;
  }

  /**
   * Check if operation exists by operation number
   */
  async existsByOperationNumber(
    operatorId: number,
    operationNumber: string,
  ): Promise<boolean> {
    const operation = await this.findByOperationNumber(
      operatorId,
      operationNumber,
    );
    return operation !== null;
  }

  /**
   * Check if client has active or scheduled operations
   */
  async hasActiveOperations(clientId: number): Promise<boolean> {
    const [operation] = await this.db
      .select()
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.clientId, clientId),
          sql`${schema.operations.status} = 'scheduled' OR ${schema.operations.status} = 'in-progress'`,
        ),
      )
      .limit(1);
    return operation !== null;
  }

  /**
   * Check if client has any operations
   */
  async hasAnyOperations(clientId: number): Promise<boolean> {
    const [operation] = await this.db
      .select()
      .from(schema.operations)
      .where(eq(schema.operations.clientId, clientId))
      .limit(1);
    return operation !== null;
  }

  /**
   * Get paginated operations for a client with filters
   */
  async findPaginatedByClient(
    clientId: number,
    status?: string,
    operationType?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<any>> {
    // Build WHERE clause using QueryBuilder
    const whereClause = new QueryBuilder()
      .addEquals(schema.operations.clientId, clientId)
      .addEquals(schema.operations.status, status)
      .addEquals(schema.operations.operationType, operationType)
      .addDateRange(
        schema.operations.scheduledStartDate,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      )
      .build();

    const offset = PaginationFactory.calculateOffset(page, limit);

    // Execute query with pagination
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
      this.countByWhere(whereClause),
    ]);

    return PaginationFactory.create(operations, totalCount, page, limit);
  }

  /**
   * Get client statistics
   */
  async getClientStatistics(clientId: number) {
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
      .where(eq(schema.operations.clientId, clientId));

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

  /**
   * Get recent operations for a client
   */
  async findRecentByClient(
    clientId: number,
    limit: number = 5,
  ): Promise<any[]> {
    return this.db
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
      .where(eq(schema.operations.clientId, clientId))
      .orderBy(desc(schema.operations.createdAt))
      .limit(limit);
  }

  /**
   * Get top clients by operations count
   */
  async findTopClientsByOperations(
    operatorId?: number,
    limit: number = 10,
  ): Promise<any[]> {
    const conditions: SQL[] = [];

    if (operatorId) {
      conditions.push(eq(schema.clients.operatorId, operatorId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const topClients = await this.db
      .select({
        client: schema.clients,
        totalOperations: sql<number>`count(${schema.operations.id})`,
        completedOperations: sql<number>`sum(case when ${schema.operations.status} = 'completed' then 1 else 0 end)`,
      })
      .from(schema.clients)
      .leftJoin(
        schema.operations,
        eq(schema.clients.id, schema.operations.clientId),
      )
      .where(whereClause)
      .groupBy(schema.clients.id)
      .orderBy(desc(sql<number>`count(${schema.operations.id})`))
      .limit(limit);

    return topClients.map((item) => ({
      ...item.client,
      totalOperations: Number(item.totalOperations),
      completedOperations: Number(item.completedOperations),
    }));
  }

  /**
   * Check if vehicle has active or scheduled operations
   */
  async hasActiveOperationsForVehicle(vehicleId: number): Promise<boolean> {
    const [operation] = await this.db
      .select()
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.vehicleId, vehicleId),
          sql`${schema.operations.status} = 'scheduled' OR ${schema.operations.status} = 'in-progress'`,
        ),
      )
      .limit(1);
    return operation !== null;
  }

  /**
   * Check if vehicle has in-progress operations
   */
  async hasInProgressOperationsForVehicle(vehicleId: number): Promise<boolean> {
    const [operation] = await this.db
      .select()
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.vehicleId, vehicleId),
          eq(schema.operations.status, 'in-progress'),
        ),
      )
      .limit(1);
    return operation !== null;
  }

  /**
   * Get operation history for a vehicle
   */
  async findHistoryByVehicle(
    operatorId: number,
    vehicleId: number,
    limit: number = 10,
  ): Promise<Operation[]> {
    return this.db
      .select()
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.vehicleId, vehicleId),
          eq(schema.operations.operatorId, operatorId),
        ),
      )
      .orderBy(desc(schema.operations.scheduledStartDate))
      .limit(limit);
  }

  /**
   * Get upcoming operations for a vehicle
   */
  async findUpcomingByVehicle(
    operatorId: number,
    vehicleId: number,
  ): Promise<Operation[]> {
    return this.db
      .select()
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.vehicleId, vehicleId),
          eq(schema.operations.operatorId, operatorId),
          sql`${schema.operations.status} = 'scheduled' OR ${schema.operations.status} = 'in-progress'`,
        ),
      )
      .orderBy(asc(schema.operations.scheduledStartDate));
  }

  /**
   * Get vehicle statistics
   */
  async getVehicleStatistics(vehicleId: number) {
    const [stats] = await this.db
      .select({
        totalOperations: sql<number>`count(*)`,
      })
      .from(schema.operations)
      .where(eq(schema.operations.vehicleId, vehicleId));

    const [upcoming] = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.vehicleId, vehicleId),
          sql`${schema.operations.status} = 'scheduled' OR ${schema.operations.status} = 'in-progress'`,
        ),
      );

    const [lastOp] = await this.db
      .select()
      .from(schema.operations)
      .where(eq(schema.operations.vehicleId, vehicleId))
      .orderBy(desc(schema.operations.actualEndDate))
      .limit(1);

    return {
      totalOperations: Number(stats?.totalOperations || 0),
      upcomingOperations: Number(upcoming?.count || 0),
      lastOperationDate: lastOp?.actualEndDate || null,
    };
  }

  /**
   * Count records with custom WHERE clause
   */
  private async countByWhere(whereClause?: SQL): Promise<number> {
    const query = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.operations);

    if (whereClause) {
      query.where(whereClause);
    }

    const [result] = await query;
    return Number(result.count);
  }
}
