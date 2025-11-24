import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, sql, SQL } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { Client } from '../../database/schema';
import { QueryBuilder } from '../../common/query-builder/query-builder';
import {
  PaginationFactory,
  PaginatedResponse,
} from '../../common/pagination/pagination.factory';

/**
 * Clients Repository
 *
 * Handles all data access operations for clients.
 * Extends BaseRepository for common CRUD operations.
 */
@Injectable()
export class ClientsRepository extends BaseRepository<Client> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.clients);
  }

  /**
   * Find a client by business name within an operator
   */
  async findByBusinessName(
    operatorId: number,
    businessName: string,
  ): Promise<Client | null> {
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
   * Find a client by tax ID within an operator
   */
  async findByTaxId(operatorId: number, taxId: string): Promise<Client | null> {
    const [client] = await this.db
      .select()
      .from(schema.clients)
      .where(
        and(
          eq(schema.clients.operatorId, operatorId),
          eq(schema.clients.taxId, taxId),
        ),
      )
      .limit(1);
    return client || null;
  }

  /**
   * Get paginated list of clients with filters
   */
  async findPaginated(
    operatorId?: number,
    search?: string,
    status?: boolean,
    industry?: string,
    city?: string,
    region?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<Client>> {
    // Build WHERE clause using QueryBuilder
    const whereClause = new QueryBuilder()
      .addEquals(schema.clients.operatorId, operatorId)
      .addEquals(schema.clients.status, status)
      .addEquals(schema.clients.industry, industry)
      .addEquals(schema.clients.city, city)
      .addEquals(schema.clients.region, region)
      .addSearch(
        [
          schema.clients.businessName,
          schema.clients.contactName,
          schema.clients.taxId,
          schema.clients.contactEmail,
        ],
        search,
      )
      .build();

    // Calculate offset
    const offset = PaginationFactory.calculateOffset(page, limit);

    // Execute query with pagination
    const [clients, totalCount] = await Promise.all([
      this.db
        .select()
        .from(schema.clients)
        .where(whereClause)
        .orderBy(desc(schema.clients.createdAt))
        .limit(limit)
        .offset(offset),
      this.countByWhere(whereClause),
    ]);

    // Return paginated response
    return PaginationFactory.create(clients, totalCount, page, limit);
  }

  /**
   * Get all active clients for an operator
   */
  async findActiveByOperatorId(operatorId: number): Promise<Client[]> {
    return this.db
      .select()
      .from(schema.clients)
      .where(
        and(
          eq(schema.clients.operatorId, operatorId),
          eq(schema.clients.status, true),
        ),
      )
      .orderBy(schema.clients.businessName);
  }

  /**
   * Count clients by industry for an operator
   */
  async countByIndustry(
    operatorId: number,
  ): Promise<Array<{ industry: string; count: number }>> {
    const results = await this.db
      .select({
        industry: schema.clients.industry,
        count: sql<number>`count(*)`,
      })
      .from(schema.clients)
      .where(eq(schema.clients.operatorId, operatorId))
      .groupBy(schema.clients.industry);

    return results.map((r) => ({
      industry: r.industry || 'Unknown',
      count: Number(r.count),
    }));
  }

  /**
   * Get clients by industry with active clients count
   */
  async getClientsByIndustryStats(
    operatorId?: number,
  ): Promise<
    Array<{ industry: string; totalClients: number; activeClients: number }>
  > {
    const conditions: SQL[] = [];

    if (operatorId) {
      conditions.push(eq(schema.clients.operatorId, operatorId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const industryStats = await this.db
      .select({
        industry: schema.clients.industry,
        totalClients: sql<number>`count(*)`,
        activeClients: sql<number>`sum(case when ${schema.clients.status} = true then 1 else 0 end)`,
      })
      .from(schema.clients)
      .where(whereClause)
      .groupBy(schema.clients.industry);

    return industryStats.map((stat) => ({
      industry: stat.industry || 'No especificado',
      totalClients: Number(stat.totalClients),
      activeClients: Number(stat.activeClients),
    }));
  }

  /**
   * Count clients by region for an operator
   */
  async countByRegion(
    operatorId: number,
  ): Promise<Array<{ region: string; count: number }>> {
    const results = await this.db
      .select({
        region: schema.clients.region,
        count: sql<number>`count(*)`,
      })
      .from(schema.clients)
      .where(eq(schema.clients.operatorId, operatorId))
      .groupBy(schema.clients.region);

    return results.map((r) => ({
      region: r.region || 'Unknown',
      count: Number(r.count),
    }));
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
   * Count records with custom WHERE clause
   */
  private async countByWhere(whereClause?: SQL): Promise<number> {
    const query = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.clients);

    if (whereClause) {
      query.where(whereClause);
    }

    const [result] = await query;
    return Number(result.count);
  }
}
