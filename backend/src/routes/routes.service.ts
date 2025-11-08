import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { and, eq, or, ilike, sql, SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../database/database.module';
import * as schema from '../database/schema';
import { routes, operations } from '../database/schema';
import { CreateRouteDto, UpdateRouteDto, RouteQueryDto } from './dto/route.dto';

@Injectable()
export class RoutesService {
  constructor(
    @Inject(DATABASE) private readonly db: MySql2Database<typeof schema>,
  ) {}
  // ==========================================================================
  // GET ALL ROUTES (con búsqueda y filtros)
  // ==========================================================================
  async getRoutes(operatorId: number, query: RouteQueryDto) {
    const {
      search,
      routeType,
      difficulty,
      status,
      tollsRequired,
      page = 1,
      limit = 10,
    } = query;

    // Condiciones base
    const conditions: SQL[] = [eq(routes.operatorId, operatorId)];

    // Búsqueda por texto
    if (search) {
      const searchCondition = or(
        ilike(routes.name, `%${search}%`),
        ilike(routes.code, `%${search}%`),
        ilike(routes.origin, `%${search}%`),
        ilike(routes.destination, `%${search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Filtros
    if (routeType) {
      conditions.push(eq(routes.routeType, routeType));
    }

    if (difficulty) {
      conditions.push(eq(routes.difficulty, difficulty));
    }

    if (typeof status === 'boolean') {
      conditions.push(eq(routes.status, status));
    }

    if (typeof tollsRequired === 'boolean') {
      conditions.push(eq(routes.tollsRequired, tollsRequired));
    }

    // Consulta con paginación
    const offset = (page - 1) * limit;
    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(routes)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset)
        .orderBy(routes.name),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(routes)
        .where(and(...conditions)),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ==========================================================================
  // GET ROUTE BY ID
  // ==========================================================================
  async getRouteById(operatorId: number, routeId: number) {
    const [route] = await this.db
      .select()
      .from(routes)
      .where(and(eq(routes.id, routeId), eq(routes.operatorId, operatorId)))
      .limit(1);

    if (!route) {
      throw new NotFoundException(`Ruta con ID ${routeId} no encontrada`);
    }

    return route;
  }

  // ==========================================================================
  // CREATE ROUTE
  // ==========================================================================
  async createRoute(
    operatorId: number,
    userId: number,
    createRouteDto: CreateRouteDto,
  ) {
    // Validar que no exista otra ruta con el mismo código (si se proporciona)
    if (createRouteDto.code) {
      const [existingRoute] = await this.db
        .select()
        .from(routes)
        .where(
          and(
            eq(routes.operatorId, operatorId),
            eq(routes.code, createRouteDto.code),
          ),
        )
        .limit(1);

      if (existingRoute) {
        throw new ConflictException(
          `Ya existe una ruta con el código ${createRouteDto.code}`,
        );
      }
    }

    // Validar que no exista una ruta con el mismo nombre
    const [existingByName] = await this.db
      .select()
      .from(routes)
      .where(
        and(
          eq(routes.operatorId, operatorId),
          eq(routes.name, createRouteDto.name),
        ),
      )
      .limit(1);

    if (existingByName) {
      throw new ConflictException(
        `Ya existe una ruta con el nombre ${createRouteDto.name}`,
      );
    }

    // Validaciones de negocio
    if (createRouteDto.distance !== undefined && createRouteDto.distance <= 0) {
      throw new BadRequestException('La distancia debe ser mayor a 0');
    }

    if (
      createRouteDto.estimatedDuration !== undefined &&
      createRouteDto.estimatedDuration <= 0
    ) {
      throw new BadRequestException('La duración estimada debe ser mayor a 0');
    }

    if (
      createRouteDto.estimatedTollCost !== undefined &&
      createRouteDto.estimatedTollCost < 0
    ) {
      throw new BadRequestException(
        'El costo estimado de peajes no puede ser negativo',
      );
    }

    // Crear ruta
    const [route] = await this.db
      .insert(routes)
      .values({
        operatorId,
        ...createRouteDto,
        createdBy: userId,
        updatedBy: userId,
      })
      .$returningId();

    return this.getRouteById(operatorId, route.id);
  }

  // ==========================================================================
  // UPDATE ROUTE
  // ==========================================================================
  async updateRoute(
    operatorId: number,
    userId: number,
    routeId: number,
    updateRouteDto: UpdateRouteDto,
  ) {
    // Verificar que la ruta existe
    await this.getRouteById(operatorId, routeId);

    // Si se actualiza el código, validar que no exista otro con el mismo
    if (updateRouteDto.code) {
      const [existingRoute] = await this.db
        .select()
        .from(routes)
        .where(
          and(
            eq(routes.operatorId, operatorId),
            eq(routes.code, updateRouteDto.code),
            sql`${routes.id} != ${routeId}`,
          ),
        )
        .limit(1);

      if (existingRoute) {
        throw new ConflictException(
          `Ya existe otra ruta con el código ${updateRouteDto.code}`,
        );
      }
    }

    // Si se actualiza el nombre, validar que no exista otro con el mismo
    if (updateRouteDto.name) {
      const [existingByName] = await this.db
        .select()
        .from(routes)
        .where(
          and(
            eq(routes.operatorId, operatorId),
            eq(routes.name, updateRouteDto.name),
            sql`${routes.id} != ${routeId}`,
          ),
        )
        .limit(1);

      if (existingByName) {
        throw new ConflictException(
          `Ya existe otra ruta con el nombre ${updateRouteDto.name}`,
        );
      }
    }

    // Validaciones de negocio
    if (updateRouteDto.distance !== undefined && updateRouteDto.distance <= 0) {
      throw new BadRequestException('La distancia debe ser mayor a 0');
    }

    if (
      updateRouteDto.estimatedDuration !== undefined &&
      updateRouteDto.estimatedDuration <= 0
    ) {
      throw new BadRequestException('La duración estimada debe ser mayor a 0');
    }

    if (
      updateRouteDto.estimatedTollCost !== undefined &&
      updateRouteDto.estimatedTollCost < 0
    ) {
      throw new BadRequestException(
        'El costo estimado de peajes no puede ser negativo',
      );
    }

    // Actualizar ruta
    await this.db
      .update(routes)
      .set({
        ...updateRouteDto,
        updatedBy: userId,
      })
      .where(and(eq(routes.id, routeId), eq(routes.operatorId, operatorId)));

    return this.getRouteById(operatorId, routeId);
  }

  // ==========================================================================
  // DELETE ROUTE
  // ==========================================================================
  async deleteRoute(operatorId: number, routeId: number) {
    // Verificar que la ruta existe
    const route = await this.getRouteById(operatorId, routeId);

    // Verificar que no esté siendo usada en operaciones
    const [operationsUsingRoute] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(operations)
      .where(
        and(
          eq(operations.routeId, routeId),
          eq(operations.operatorId, operatorId),
        ),
      );

    const count = Number(operationsUsingRoute?.count || 0);
    if (count > 0) {
      throw new BadRequestException(
        `No se puede eliminar la ruta porque está siendo usada en ${count} operación(es)`,
      );
    }

    // Eliminar ruta
    await this.db
      .delete(routes)
      .where(and(eq(routes.id, routeId), eq(routes.operatorId, operatorId)));

    return {
      message: 'Ruta eliminada correctamente',
      route,
    };
  }

  // ==========================================================================
  // GET ROUTE STATISTICS
  // ==========================================================================
  async getRouteStatistics(operatorId: number, routeId: number) {
    // Verificar que la ruta existe
    const route = await this.getRouteById(operatorId, routeId);

    // Obtener estadísticas de operaciones asociadas
    const [stats] = await this.db
      .select({
        totalOperations: sql<number>`count(*)`,
        completedOperations: sql<number>`sum(case when ${operations.status} = 'completed' then 1 else 0 end)`,
        scheduledOperations: sql<number>`sum(case when ${operations.status} = 'scheduled' then 1 else 0 end)`,
        inProgressOperations: sql<number>`sum(case when ${operations.status} = 'in-progress' then 1 else 0 end)`,
        cancelledOperations: sql<number>`sum(case when ${operations.status} = 'cancelled' then 1 else 0 end)`,
      })
      .from(operations)
      .where(
        and(
          eq(operations.routeId, routeId),
          eq(operations.operatorId, operatorId),
        ),
      );

    return {
      route,
      statistics: {
        totalOperations: Number(stats?.totalOperations || 0),
        completedOperations: Number(stats?.completedOperations || 0),
        scheduledOperations: Number(stats?.scheduledOperations || 0),
        inProgressOperations: Number(stats?.inProgressOperations || 0),
        cancelledOperations: Number(stats?.cancelledOperations || 0),
      },
    };
  }
}
