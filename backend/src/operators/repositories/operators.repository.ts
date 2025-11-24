import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql, SQL, desc } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { Operator, NewOperator } from '../../database/schema';
import { QueryBuilder } from '../../common/query-builder/query-builder';
import {
  PaginationFactory,
  PaginatedResponse,
} from '../../common/pagination/pagination.factory';

/**
 * Operators Repository
 *
 * Handles all data access operations for operators.
 * Extends BaseRepository for common CRUD operations.
 */
@Injectable()
export class OperatorsRepository extends BaseRepository<Operator> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.operators);
  }

  /**
   * Find operator by RUT
   */
  async findByRut(rut: string): Promise<Operator | null> {
    const [operator] = await this.db
      .select()
      .from(schema.operators)
      .where(eq(schema.operators.rut, rut))
      .limit(1);
    return (operator as Operator) || null;
  }

  /**
   * Check if RUT exists (excluding current operator)
   */
  async existsByRutExcludingId(
    rut: string,
    excludeId: number,
  ): Promise<boolean> {
    const [operator] = await this.db
      .select()
      .from(schema.operators)
      .where(
        and(
          eq(schema.operators.rut, rut),
          sql`${schema.operators.id} != ${excludeId}`,
        ),
      )
      .limit(1);
    return operator !== null;
  }

  /**
   * Check if RUT exists
   */
  async existsByRut(rut: string): Promise<boolean> {
    const operator = await this.findByRut(rut);
    return operator !== null;
  }

  /**
   * Get paginated list of operators with filters
   */
  async findPaginated(params: {
    search?: string;
    status?: boolean;
    super?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Operator>> {
    const { page = 1, limit = 10 } = PaginationFactory.normalizePagination({
      page: params.page,
      limit: params.limit,
    });
    const offset = PaginationFactory.calculateOffset(page, limit);

    // Build WHERE clause using QueryBuilder
    const whereClause = new QueryBuilder()
      .addEquals(schema.operators.status, params.status)
      .addEquals(schema.operators.super, params.super)
      .addSearch([schema.operators.name, schema.operators.rut], params.search)
      .build();

    // Execute queries in parallel for better performance
    const [operators, totalCount] = await Promise.all([
      this.db
        .select()
        .from(schema.operators)
        .where(whereClause)
        .orderBy(desc(schema.operators.createdAt))
        .limit(limit)
        .offset(offset),
      this.countByWhere(whereClause),
    ]);

    return PaginationFactory.create(
      operators as Operator[],
      totalCount,
      page,
      limit,
    );
  }

  /**
   * Count active users for an operator
   */
  async countActiveUsers(operatorId: number): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users)
      .where(
        and(
          eq(schema.users.operatorId, operatorId),
          eq(schema.users.status, true),
        ),
      );
    return Number(result?.count || 0);
  }

  /**
   * Get operator statistics
   */
  async getOperatorStatistics(operatorId: number) {
    // Get user statistics
    const [usersStats] = await this.db
      .select({
        totalUsers: sql<number>`count(*)`,
        activeUsers: sql<number>`SUM(CASE WHEN ${schema.users.status} = true THEN 1 ELSE 0 END)`,
      })
      .from(schema.users)
      .where(eq(schema.users.operatorId, operatorId));

    // Get roles count
    const [rolesStats] = await this.db
      .select({ totalRoles: sql<number>`count(*)` })
      .from(schema.roles)
      .where(eq(schema.roles.operatorId, operatorId));

    // Get clients count
    const [clientsStats] = await this.db
      .select({ totalClients: sql<number>`count(*)` })
      .from(schema.clients)
      .where(eq(schema.clients.operatorId, operatorId));

    // Get operations count
    const [operationsStats] = await this.db
      .select({ totalOperations: sql<number>`count(*)` })
      .from(schema.operations)
      .where(eq(schema.operations.operatorId, operatorId));

    return {
      totalUsers: Number(usersStats?.totalUsers || 0),
      activeUsers: Number(usersStats?.activeUsers || 0),
      totalRoles: Number(rolesStats?.totalRoles || 0),
      totalClients: Number(clientsStats?.totalClients || 0),
      totalOperations: Number(operationsStats?.totalOperations || 0),
    };
  }

  /**
   * Create operator and return the created operator
   */
  async createOperator(
    operatorData: NewOperator,
    userId: number,
  ): Promise<Operator> {
    const [insertedOperator] = await this.db
      .insert(schema.operators)
      .values({
        ...operatorData,
        createdBy: userId,
        updatedBy: userId,
      })
      .$returningId();

    const createdOperator = await this.findById(insertedOperator.id);
    if (!createdOperator) {
      throw new Error('Failed to retrieve created operator');
    }
    return createdOperator;
  }

  /**
   * Update operator and return the updated operator
   */
  async updateOperator(
    id: number,
    operatorData: Partial<Operator>,
    userId: number,
  ): Promise<Operator> {
    await this.db
      .update(schema.operators)
      .set({
        ...operatorData,
        updatedBy: userId,
      })
      .where(eq(schema.operators.id, id));

    const updatedOperator = await this.findById(id);
    if (!updatedOperator) {
      throw new Error('Failed to retrieve updated operator');
    }
    return updatedOperator;
  }

  /**
   * Soft delete operator by setting status to false
   */
  async softDelete(id: number): Promise<void> {
    await this.db
      .update(schema.operators)
      .set({ status: false })
      .where(eq(schema.operators.id, id));
  }

  /**
   * Count records with custom WHERE clause
   */
  private async countByWhere(whereClause?: SQL): Promise<number> {
    const query = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.operators);

    if (whereClause) {
      query.where(whereClause);
    }

    const [result] = await query;
    return Number(result.count);
  }
}
