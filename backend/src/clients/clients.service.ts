import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq, and, like, or, desc, gte, lte, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../database/database.module';
import * as schema from '../database/schema';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientQueryDto,
  ClientOperationsQueryDto,
} from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @Inject(DATABASE)
    private db: MySql2Database<typeof schema>,
  ) {}

  // ============================================================================
  // CLIENTS CRUD
  // ============================================================================

  /**
   * Crear un nuevo cliente
   */
  async createClient(createClientDto: CreateClientDto, userId: number) {
    // Verificar que el operador existe
    const operator = await this.db
      .select()
      .from(schema.operators)
      .where(eq(schema.operators.id, createClientDto.operatorId))
      .limit(1);

    if (operator.length === 0) {
      throw new NotFoundException(
        `Operator with ID ${createClientDto.operatorId} not found`,
      );
    }

    // Verificar que el nombre comercial/razón social no esté duplicado en el mismo operador
    const existingClient = await this.db
      .select()
      .from(schema.clients)
      .where(
        and(
          eq(schema.clients.operatorId, createClientDto.operatorId),
          eq(schema.clients.businessName, createClientDto.businessName),
        ),
      )
      .limit(1);

    if (existingClient.length > 0) {
      throw new ConflictException(
        `Client with business name "${createClientDto.businessName}" already exists for this operator`,
      );
    }

    // Si hay taxId, verificar que no esté duplicado
    if (createClientDto.taxId) {
      const existingTaxId = await this.db
        .select()
        .from(schema.clients)
        .where(
          and(
            eq(schema.clients.operatorId, createClientDto.operatorId),
            eq(schema.clients.taxId, createClientDto.taxId),
          ),
        )
        .limit(1);

      if (existingTaxId.length > 0) {
        throw new ConflictException(
          `Client with Tax ID ${createClientDto.taxId} already exists for this operator`,
        );
      }
    }

    const [newClient] = await this.db.insert(schema.clients).values({
      ...createClientDto,
      createdBy: userId,
      updatedBy: userId,
    });

    return this.getClientById(newClient.insertId);
  }

  /**
   * Obtener lista de clientes con filtros y paginación
   */
  async getClients(query: ClientQueryDto) {
    const {
      operatorId,
      search,
      status,
      industry,
      city,
      region,
      page = 1,
      limit = 10,
    } = query;

    const conditions: SQL[] = [];

    if (operatorId) {
      conditions.push(eq(schema.clients.operatorId, operatorId));
    }

    if (search) {
      const searchCondition = or(
        like(schema.clients.businessName, `%${search}%`),
        like(schema.clients.contactName, `%${search}%`),
        like(schema.clients.taxId, `%${search}%`),
        like(schema.clients.contactEmail, `%${search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (status !== undefined) {
      conditions.push(eq(schema.clients.status, status));
    }

    if (industry) {
      conditions.push(eq(schema.clients.industry, industry));
    }

    if (city) {
      conditions.push(eq(schema.clients.city, city));
    }

    if (region) {
      conditions.push(eq(schema.clients.region, region));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (page - 1) * limit;

    const [clients, totalCount] = await Promise.all([
      this.db
        .select()
        .from(schema.clients)
        .where(whereClause)
        .orderBy(desc(schema.clients.createdAt))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.clients)
        .where(whereClause),
    ]);

    return {
      data: clients,
      pagination: {
        page,
        limit,
        total: Number(totalCount[0].count),
        totalPages: Math.ceil(Number(totalCount[0].count) / limit),
      },
    };
  }

  /**
   * Obtener un cliente por ID
   */
  async getClientById(id: number) {
    const [client] = await this.db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, id))
      .limit(1);

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  /**
   * Actualizar un cliente
   */
  async updateClient(
    id: number,
    updateClientDto: UpdateClientDto,
    userId: number,
  ) {
    await this.getClientById(id);

    // Si se actualiza el nombre comercial, verificar que no esté duplicado
    if (updateClientDto.businessName) {
      const client = await this.getClientById(id);
      const existingClient = await this.db
        .select()
        .from(schema.clients)
        .where(
          and(
            eq(schema.clients.operatorId, client.operatorId),
            eq(schema.clients.businessName, updateClientDto.businessName),
            sql`${schema.clients.id} != ${id}`,
          ),
        )
        .limit(1);

      if (existingClient.length > 0) {
        throw new ConflictException(
          `Client with business name "${updateClientDto.businessName}" already exists`,
        );
      }
    }

    // Si se actualiza el taxId, verificar que no esté duplicado
    if (updateClientDto.taxId) {
      const client = await this.getClientById(id);
      const existingTaxId = await this.db
        .select()
        .from(schema.clients)
        .where(
          and(
            eq(schema.clients.operatorId, client.operatorId),
            eq(schema.clients.taxId, updateClientDto.taxId),
            sql`${schema.clients.id} != ${id}`,
          ),
        )
        .limit(1);

      if (existingTaxId.length > 0) {
        throw new ConflictException(
          `Client with Tax ID ${updateClientDto.taxId} already exists`,
        );
      }
    }

    await this.db
      .update(schema.clients)
      .set({
        ...updateClientDto,
        updatedBy: userId,
      })
      .where(eq(schema.clients.id, id));

    return this.getClientById(id);
  }

  /**
   * Eliminar un cliente (soft delete - cambiar status a false)
   */
  async deleteClient(id: number, userId: number) {
    await this.getClientById(id);

    // Verificar que no tenga operaciones activas o programadas
    const activeOperations = await this.db
      .select()
      .from(schema.operations)
      .where(
        and(
          eq(schema.operations.clientId, id),
          or(
            eq(schema.operations.status, 'scheduled'),
            eq(schema.operations.status, 'in-progress'),
          ),
        ),
      )
      .limit(1);

    if (activeOperations.length > 0) {
      throw new BadRequestException(
        'Cannot delete client with active or scheduled operations. Consider deactivating instead.',
      );
    }

    // Soft delete - cambiar status a false
    await this.db
      .update(schema.clients)
      .set({
        status: false,
        updatedBy: userId,
      })
      .where(eq(schema.clients.id, id));

    return { message: 'Client deactivated successfully' };
  }

  /**
   * Eliminar permanentemente un cliente
   */
  async permanentlyDeleteClient(id: number) {
    await this.getClientById(id);

    // Verificar que no tenga operaciones asociadas
    const operations = await this.db
      .select()
      .from(schema.operations)
      .where(eq(schema.operations.clientId, id))
      .limit(1);

    if (operations.length > 0) {
      throw new BadRequestException(
        'Cannot permanently delete client with associated operations',
      );
    }

    await this.db.delete(schema.clients).where(eq(schema.clients.id, id));

    return { message: 'Client permanently deleted successfully' };
  }

  // ============================================================================
  // CLIENT OPERATIONS HISTORY
  // ============================================================================

  /**
   * Obtener historial completo de operaciones de un cliente
   */
  async getClientOperations(clientId: number, query: ClientOperationsQueryDto) {
    await this.getClientById(clientId);

    const {
      status,
      operationType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;

    const conditions: SQL[] = [eq(schema.operations.clientId, clientId)];

    if (status) {
      conditions.push(eq(schema.operations.status, status));
    }

    if (operationType) {
      conditions.push(eq(schema.operations.operationType, operationType));
    }

    if (startDate) {
      conditions.push(
        gte(schema.operations.scheduledStartDate, new Date(startDate)),
      );
    }

    if (endDate) {
      conditions.push(
        lte(schema.operations.scheduledStartDate, new Date(endDate)),
      );
    }

    const whereClause = and(...conditions);
    const offset = (page - 1) * limit;

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
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.operations)
        .where(whereClause),
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

  /**
   * Obtener estadísticas de un cliente
   */
  async getClientStatistics(clientId: number) {
    await this.getClientById(clientId);

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
      ...stats,
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
   * Obtener las operaciones más recientes de un cliente
   */
  async getRecentClientOperations(clientId: number, limit: number = 5) {
    await this.getClientById(clientId);

    const operations = await this.db
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

    return operations;
  }

  // ============================================================================
  // ANALYTICS & REPORTS
  // ============================================================================

  /**
   * Obtener análisis por rubro (industry)
   */
  async getClientsByIndustry(operatorId?: number) {
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
   * Obtener clientes con más operaciones
   */
  async getTopClientsByOperations(operatorId?: number, limit: number = 10) {
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
}
