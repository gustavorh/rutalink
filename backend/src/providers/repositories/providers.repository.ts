import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql, SQL, desc } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { Provider, NewProvider } from '../../database/schema';
import { QueryBuilder } from '../../common/query-builder/query-builder';
import {
  PaginationFactory,
  PaginatedResponse,
} from '../../common/pagination/pagination.factory';

/**
 * Provider operations with relations
 */
export interface ProviderOperationWithRelations {
  operation: typeof schema.operations.$inferSelect;
  client: typeof schema.clients.$inferSelect | null;
  driver: typeof schema.drivers.$inferSelect | null;
  vehicle: typeof schema.vehicles.$inferSelect | null;
}

/**
 * Providers Repository
 *
 * Handles all data access operations for providers.
 * Extends BaseRepository for common CRUD operations.
 */
@Injectable()
export class ProvidersRepository extends BaseRepository<Provider> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.providers);
  }

  /**
   * Find provider by ID and operator (for tenant isolation)
   */
  async findByIdAndOperator(
    id: number,
    operatorId: number,
  ): Promise<Provider | null> {
    const [provider] = await this.db
      .select()
      .from(schema.providers)
      .where(
        and(
          eq(schema.providers.id, id),
          eq(schema.providers.operatorId, operatorId),
        ),
      )
      .limit(1);
    return (provider as Provider) || null;
  }

  /**
   * Find provider by tax ID and operator
   */
  async findByTaxIdAndOperator(
    taxId: string,
    operatorId: number,
  ): Promise<Provider | null> {
    const [provider] = await this.db
      .select()
      .from(schema.providers)
      .where(
        and(
          eq(schema.providers.taxId, taxId),
          eq(schema.providers.operatorId, operatorId),
        ),
      )
      .limit(1);
    return (provider as Provider) || null;
  }

  /**
   * Check if tax ID exists for operator (excluding current provider)
   */
  async existsByTaxIdExcludingId(
    taxId: string,
    operatorId: number,
    excludeId: number,
  ): Promise<boolean> {
    const [provider] = await this.db
      .select()
      .from(schema.providers)
      .where(
        and(
          eq(schema.providers.taxId, taxId),
          eq(schema.providers.operatorId, operatorId),
          sql`${schema.providers.id} != ${excludeId}`,
        ),
      )
      .limit(1);
    return provider !== null;
  }

  /**
   * Check if tax ID exists for operator
   */
  async existsByTaxId(taxId: string, operatorId: number): Promise<boolean> {
    const provider = await this.findByTaxIdAndOperator(taxId, operatorId);
    return provider !== null;
  }

  /**
   * Get paginated list of providers with filters
   */
  async findPaginated(params: {
    operatorId?: number;
    search?: string;
    status?: boolean;
    businessType?: string;
    minRating?: number;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Provider>> {
    const { page = 1, limit = 10 } = PaginationFactory.normalizePagination({
      page: params.page,
      limit: params.limit,
    });
    const offset = PaginationFactory.calculateOffset(page, limit);

    // Build WHERE clause using QueryBuilder
    const queryBuilder = new QueryBuilder()
      .addEquals(schema.providers.operatorId, params.operatorId)
      .addEquals(schema.providers.status, params.status)
      .addEquals(schema.providers.businessType, params.businessType)
      .addSearch(
        [
          schema.providers.businessName,
          schema.providers.taxId,
          schema.providers.contactName,
          schema.providers.contactEmail,
        ],
        params.search,
      );

    // Add minRating condition if provided
    if (params.minRating !== undefined) {
      queryBuilder.addGreaterThanOrEqual(
        schema.providers.rating,
        params.minRating,
      );
    }

    const whereClause = queryBuilder.build();

    // Execute queries in parallel for better performance
    const [providers, totalCount] = await Promise.all([
      this.db
        .select()
        .from(schema.providers)
        .where(whereClause)
        .orderBy(desc(schema.providers.createdAt))
        .limit(limit)
        .offset(offset),
      this.countByWhere(whereClause),
    ]);

    return PaginationFactory.create(
      providers as Provider[],
      totalCount,
      page,
      limit,
    );
  }

  /**
   * Count operations using a provider
   */
  async countOperationsByProvider(providerId: number): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.operations)
      .where(eq(schema.operations.providerId, providerId));
    return Number(result?.count || 0);
  }

  /**
   * Get provider statistics (operations count by status)
   */
  async getProviderStatistics(providerId: number) {
    const [stats] = await this.db
      .select({
        totalOperations: sql<number>`count(*)`,
        completedOperations: sql<number>`sum(case when ${schema.operations.status} = 'completed' then 1 else 0 end)`,
        inProgressOperations: sql<number>`sum(case when ${schema.operations.status} = 'in-progress' then 1 else 0 end)`,
        scheduledOperations: sql<number>`sum(case when ${schema.operations.status} = 'scheduled' then 1 else 0 end)`,
        cancelledOperations: sql<number>`sum(case when ${schema.operations.status} = 'cancelled' then 1 else 0 end)`,
      })
      .from(schema.operations)
      .where(eq(schema.operations.providerId, providerId));

    return {
      totalOperations: Number(stats?.totalOperations || 0),
      completedOperations: Number(stats?.completedOperations || 0),
      inProgressOperations: Number(stats?.inProgressOperations || 0),
      scheduledOperations: Number(stats?.scheduledOperations || 0),
      cancelledOperations: Number(stats?.cancelledOperations || 0),
    };
  }

  /**
   * Get paginated provider operations with relations
   */
  async findProviderOperationsPaginated(
    providerId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<ProviderOperationWithRelations>> {
    const { page: normalizedPage, limit: normalizedLimit } =
      PaginationFactory.normalizePagination({ page, limit });
    const offset = PaginationFactory.calculateOffset(
      normalizedPage,
      normalizedLimit,
    );

    // Execute queries in parallel for better performance
    const [operations, totalCount] = await Promise.all([
      this.db
        .select({
          operation: schema.operations,
          client: schema.clients,
          driver: schema.drivers,
          vehicle: schema.vehicles,
        })
        .from(schema.operations)
        .leftJoin(
          schema.clients,
          eq(schema.operations.clientId, schema.clients.id),
        )
        .leftJoin(
          schema.drivers,
          eq(schema.operations.driverId, schema.drivers.id),
        )
        .leftJoin(
          schema.vehicles,
          eq(schema.operations.vehicleId, schema.vehicles.id),
        )
        .where(eq(schema.operations.providerId, providerId))
        .orderBy(desc(schema.operations.scheduledStartDate))
        .limit(normalizedLimit)
        .offset(offset),
      this.countOperationsByProvider(providerId),
    ]);

    return PaginationFactory.create(
      operations as ProviderOperationWithRelations[],
      totalCount,
      normalizedPage,
      normalizedLimit,
    );
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
   * Create provider and return the created provider
   */
  async createProvider(
    providerData: NewProvider,
    userId: number,
  ): Promise<Provider> {
    const [insertedProvider] = await this.db
      .insert(schema.providers)
      .values({
        ...providerData,
        createdBy: userId,
        updatedBy: userId,
      })
      .$returningId();

    const createdProvider = await this.findById(insertedProvider.id);
    if (!createdProvider) {
      throw new Error('Failed to retrieve created provider');
    }
    return createdProvider;
  }

  /**
   * Update provider and return the updated provider
   */
  async updateProvider(
    id: number,
    providerData: Partial<Provider>,
    userId: number,
  ): Promise<Provider> {
    await this.db
      .update(schema.providers)
      .set({
        ...providerData,
        updatedBy: userId,
      })
      .where(eq(schema.providers.id, id));

    const updatedProvider = await this.findById(id);
    if (!updatedProvider) {
      throw new Error('Failed to retrieve updated provider');
    }
    return updatedProvider;
  }

  /**
   * Count records with custom WHERE clause
   */
  private async countByWhere(whereClause?: SQL): Promise<number> {
    const query = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.providers);

    if (whereClause) {
      query.where(whereClause);
    }

    const [result] = await query;
    return Number(result.count);
  }
}
