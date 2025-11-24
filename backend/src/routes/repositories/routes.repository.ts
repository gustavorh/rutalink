import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql, SQL } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { Route, NewRoute } from '../../database/schema';
import { QueryBuilder } from '../../common/query-builder/query-builder';
import {
  PaginationFactory,
  PaginatedResponse,
} from '../../common/pagination/pagination.factory';

/**
 * Routes Repository
 *
 * Handles all data access operations for routes.
 * Extends BaseRepository for common CRUD operations.
 */
@Injectable()
export class RoutesRepository extends BaseRepository<Route> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.routes);
  }

  /**
   * Find route by ID and operator (for tenant isolation)
   */
  async findByIdAndOperator(
    id: number,
    operatorId: number,
  ): Promise<Route | null> {
    const [route] = await this.db
      .select()
      .from(schema.routes)
      .where(
        and(eq(schema.routes.id, id), eq(schema.routes.operatorId, operatorId)),
      )
      .limit(1);
    return (route as Route) || null;
  }

  /**
   * Find route by code and operator
   */
  async findByCodeAndOperator(
    code: string,
    operatorId: number,
  ): Promise<Route | null> {
    const [route] = await this.db
      .select()
      .from(schema.routes)
      .where(
        and(
          eq(schema.routes.code, code),
          eq(schema.routes.operatorId, operatorId),
        ),
      )
      .limit(1);
    return (route as Route) || null;
  }

  /**
   * Find route by name and operator
   */
  async findByNameAndOperator(
    name: string,
    operatorId: number,
  ): Promise<Route | null> {
    const [route] = await this.db
      .select()
      .from(schema.routes)
      .where(
        and(
          eq(schema.routes.name, name),
          eq(schema.routes.operatorId, operatorId),
        ),
      )
      .limit(1);
    return (route as Route) || null;
  }

  /**
   * Check if route code exists for operator (excluding current route)
   */
  async existsByCodeExcludingId(
    code: string,
    operatorId: number,
    excludeId: number,
  ): Promise<boolean> {
    const [route] = await this.db
      .select()
      .from(schema.routes)
      .where(
        and(
          eq(schema.routes.code, code),
          eq(schema.routes.operatorId, operatorId),
          sql`${schema.routes.id} != ${excludeId}`,
        ),
      )
      .limit(1);
    return route !== null;
  }

  /**
   * Check if route name exists for operator (excluding current route)
   */
  async existsByNameExcludingId(
    name: string,
    operatorId: number,
    excludeId: number,
  ): Promise<boolean> {
    const [route] = await this.db
      .select()
      .from(schema.routes)
      .where(
        and(
          eq(schema.routes.name, name),
          eq(schema.routes.operatorId, operatorId),
          sql`${schema.routes.id} != ${excludeId}`,
        ),
      )
      .limit(1);
    return route !== null;
  }

  /**
   * Check if route code exists for operator
   */
  async existsByCode(code: string, operatorId: number): Promise<boolean> {
    const route = await this.findByCodeAndOperator(code, operatorId);
    return route !== null;
  }

  /**
   * Check if route name exists for operator
   */
  async existsByName(name: string, operatorId: number): Promise<boolean> {
    const route = await this.findByNameAndOperator(name, operatorId);
    return route !== null;
  }

  /**
   * Get paginated list of routes with filters
   */
  async findPaginated(params: {
    operatorId: number;
    search?: string;
    routeType?: string;
    difficulty?: string;
    status?: boolean;
    tollsRequired?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Route>> {
    const { page = 1, limit = 10 } = PaginationFactory.normalizePagination({
      page: params.page,
      limit: params.limit,
    });
    const offset = PaginationFactory.calculateOffset(page, limit);

    // Build WHERE clause using QueryBuilder
    const whereClause = new QueryBuilder()
      .addEquals(schema.routes.operatorId, params.operatorId)
      .addEquals(schema.routes.routeType, params.routeType)
      .addEquals(schema.routes.difficulty, params.difficulty)
      .addEquals(schema.routes.status, params.status)
      .addEquals(schema.routes.tollsRequired, params.tollsRequired)
      .addSearch(
        [
          schema.routes.name,
          schema.routes.code,
          schema.routes.origin,
          schema.routes.destination,
        ],
        params.search,
      )
      .build();

    // Execute queries in parallel for better performance
    const [routes, totalCount] = await Promise.all([
      this.db
        .select()
        .from(schema.routes)
        .where(whereClause)
        .orderBy(schema.routes.name)
        .limit(limit)
        .offset(offset),
      this.countByWhere(whereClause),
    ]);

    return PaginationFactory.create(routes as Route[], totalCount, page, limit);
  }

  /**
   * Count operations using a route
   */
  async countOperationsByRoute(
    routeId: number,
    operatorId: number,
  ): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.routeId, routeId),
          eq(schema.operations.operatorId, operatorId),
        ),
      );
    return Number(result?.count || 0);
  }

  /**
   * Get route statistics (operations count by status)
   */
  async getRouteStatistics(routeId: number, operatorId: number) {
    const [stats] = await this.db
      .select({
        totalOperations: sql<number>`count(*)`,
        completedOperations: sql<number>`sum(case when ${schema.operations.status} = 'completed' then 1 else 0 end)`,
        scheduledOperations: sql<number>`sum(case when ${schema.operations.status} = 'scheduled' then 1 else 0 end)`,
        inProgressOperations: sql<number>`sum(case when ${schema.operations.status} = 'in-progress' then 1 else 0 end)`,
        cancelledOperations: sql<number>`sum(case when ${schema.operations.status} = 'cancelled' then 1 else 0 end)`,
      })
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.routeId, routeId),
          eq(schema.operations.operatorId, operatorId),
        ),
      );

    return {
      totalOperations: Number(stats?.totalOperations || 0),
      completedOperations: Number(stats?.completedOperations || 0),
      scheduledOperations: Number(stats?.scheduledOperations || 0),
      inProgressOperations: Number(stats?.inProgressOperations || 0),
      cancelledOperations: Number(stats?.cancelledOperations || 0),
    };
  }

  /**
   * Create route and return the created route
   */
  async createRoute(routeData: NewRoute, userId: number): Promise<Route> {
    const [insertedRoute] = await this.db
      .insert(schema.routes)
      .values({
        ...routeData,
        createdBy: userId,
        updatedBy: userId,
      })
      .$returningId();

    const createdRoute = await this.findById(insertedRoute.id);
    if (!createdRoute) {
      throw new Error('Failed to retrieve created route');
    }
    return createdRoute;
  }

  /**
   * Update route and return the updated route
   */
  async updateRoute(
    id: number,
    routeData: Partial<Route>,
    userId: number,
    operatorId: number,
  ): Promise<Route> {
    await this.db
      .update(schema.routes)
      .set({
        ...routeData,
        updatedBy: userId,
      })
      .where(
        and(eq(schema.routes.id, id), eq(schema.routes.operatorId, operatorId)),
      );

    const updatedRoute = await this.findByIdAndOperator(id, operatorId);
    if (!updatedRoute) {
      throw new Error('Failed to retrieve updated route');
    }
    return updatedRoute;
  }

  /**
   * Count records with custom WHERE clause
   */
  private async countByWhere(whereClause?: SQL): Promise<number> {
    const query = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.routes);

    if (whereClause) {
      query.where(whereClause);
    }

    const [result] = await query;
    return Number(result.count);
  }
}
