import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, like, or, desc, sql, gte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../database/database.module';
import * as schema from '../database/schema';
import {
  CreateProviderDto,
  UpdateProviderDto,
  ProviderQueryDto,
} from './dto/provider.dto';

@Injectable()
export class ProvidersService {
  constructor(
    @Inject(DATABASE)
    private db: MySql2Database<typeof schema>,
  ) {}

  // ============================================================================
  // PROVIDERS CRUD
  // ============================================================================

  async createProvider(createProviderDto: CreateProviderDto, userId: number) {
    // Verificar que el operador existe
    const operator = await this.db
      .select()
      .from(schema.operators)
      .where(eq(schema.operators.id, createProviderDto.operatorId))
      .limit(1);

    if (operator.length === 0) {
      throw new NotFoundException(
        `Operator with ID ${createProviderDto.operatorId} not found`,
      );
    }

    // Verificar que el taxId no esté duplicado en el mismo operador (si se proporciona)
    if (createProviderDto.taxId) {
      const existingProvider = await this.db
        .select()
        .from(schema.providers)
        .where(
          and(
            eq(schema.providers.operatorId, createProviderDto.operatorId),
            eq(schema.providers.taxId, createProviderDto.taxId),
          ),
        )
        .limit(1);

      if (existingProvider.length > 0) {
        throw new ConflictException(
          `Provider with tax ID ${createProviderDto.taxId} already exists for this operator`,
        );
      }
    }

    const [newProvider] = await this.db.insert(schema.providers).values({
      ...createProviderDto,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.getProviderById(newProvider.insertId);
  }

  async getProviders(query: ProviderQueryDto) {
    const {
      operatorId,
      search,
      status,
      businessType,
      minRating,
      page = 1,
      limit = 10,
    } = query;

    const conditions: SQL[] = [];

    if (operatorId) {
      conditions.push(eq(schema.providers.operatorId, operatorId));
    }

    if (search) {
      const searchCondition = or(
        like(schema.providers.businessName, `%${search}%`),
        like(schema.providers.taxId, `%${search}%`),
        like(schema.providers.contactName, `%${search}%`),
        like(schema.providers.contactEmail, `%${search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (status !== undefined) {
      conditions.push(eq(schema.providers.status, status));
    }

    if (businessType) {
      conditions.push(eq(schema.providers.businessType, businessType));
    }

    if (minRating) {
      conditions.push(gte(schema.providers.rating, minRating));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (page - 1) * limit;

    const [providers, totalCount] = await Promise.all([
      this.db
        .select()
        .from(schema.providers)
        .where(whereClause)
        .orderBy(desc(schema.providers.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.providers)
        .where(whereClause),
    ]);

    return {
      data: providers,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0].count),
        totalPages: Math.ceil(Number(totalCount[0].count) / limit),
      },
    };
  }

  async getProviderById(id: number) {
    const [provider] = await this.db
      .select()
      .from(schema.providers)
      .where(eq(schema.providers.id, id))
      .limit(1);

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    return provider;
  }

  async updateProvider(
    id: number,
    updateProviderDto: UpdateProviderDto,
    userId: number,
  ) {
    await this.getProviderById(id);

    // Si se actualiza el taxId, verificar que no exista otro con el mismo
    if (updateProviderDto.taxId) {
      const provider = await this.getProviderById(id);

      const existing = await this.db
        .select()
        .from(schema.providers)
        .where(
          and(
            eq(schema.providers.operatorId, provider.operatorId),
            eq(schema.providers.taxId, updateProviderDto.taxId),
            sql`${schema.providers.id} != ${id}`,
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(
          `Another provider with tax ID ${updateProviderDto.taxId} already exists for this operator`,
        );
      }
    }

    await this.db
      .update(schema.providers)
      .set({
        ...updateProviderDto,
        updatedBy: userId,
      })
      .where(eq(schema.providers.id, id));

    return this.getProviderById(id);
  }

  async deleteProvider(id: number) {
    await this.getProviderById(id);

    // Verificar que no tenga operaciones asociadas
    const associatedOperations = await this.db
      .select()
      .from(schema.operations)
      .where(eq(schema.operations.providerId, id))
      .limit(1);

    if (associatedOperations.length > 0) {
      throw new BadRequestException(
        'Cannot delete provider with associated operations',
      );
    }

    await this.db.delete(schema.providers).where(eq(schema.providers.id, id));

    return { message: 'Provider deleted successfully' };
  }

  // ============================================================================
  // PROVIDER STATISTICS
  // ============================================================================

  async getProviderStatistics(id: number) {
    await this.getProviderById(id);

    const [stats] = await this.db
      .select({
        totalOperations: sql<number>`count(*)`,
        completedOperations: sql<number>`sum(case when ${schema.operations.status} = 'completed' then 1 else 0 end)`,
        inProgressOperations: sql<number>`sum(case when ${schema.operations.status} = 'in-progress' then 1 else 0 end)`,
        scheduledOperations: sql<number>`sum(case when ${schema.operations.status} = 'scheduled' then 1 else 0 end)`,
        cancelledOperations: sql<number>`sum(case when ${schema.operations.status} = 'cancelled' then 1 else 0 end)`,
      })
      .from(schema.operations)
      .where(eq(schema.operations.providerId, id));

    return stats;
  }

  async getProviderOperations(
    id: number,
    page: number = 1,
    limit: number = 10,
  ) {
    await this.getProviderById(id);

    const offset = (page - 1) * limit;

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
        .where(eq(schema.operations.providerId, id))
        .orderBy(desc(schema.operations.scheduledStartDate))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.operations)
        .where(eq(schema.operations.providerId, id)),
    ]);

    return {
      data: operations,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0].count),
        totalPages: Math.ceil(Number(totalCount[0].count) / limit),
      },
    };
  }
}
