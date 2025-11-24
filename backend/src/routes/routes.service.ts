import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateRouteDto, UpdateRouteDto, RouteQueryDto } from './dto/route.dto';
import { RoutesRepository } from './repositories/routes.repository';

/**
 * Routes Service
 *
 * Handles business logic for route operations.
 * Delegates data access to RoutesRepository following the Repository Pattern.
 */
@Injectable()
export class RoutesService {
  constructor(private readonly routesRepository: RoutesRepository) {}
  // ==========================================================================
  // GET ALL ROUTES (con búsqueda y filtros)
  // ==========================================================================
  async getRoutes(operatorId: number, query: RouteQueryDto) {
    return this.routesRepository.findPaginated({
      operatorId,
      search: query.search,
      routeType: query.routeType,
      difficulty: query.difficulty,
      status: query.status,
      tollsRequired: query.tollsRequired,
      page: query.page,
      limit: query.limit,
    });
  }

  // ==========================================================================
  // GET ROUTE BY ID
  // ==========================================================================
  async getRouteById(operatorId: number, routeId: number) {
    const route = await this.routesRepository.findByIdAndOperator(
      routeId,
      operatorId,
    );

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
      if (
        await this.routesRepository.existsByCode(
          createRouteDto.code,
          operatorId,
        )
      ) {
        throw new ConflictException(
          `Ya existe una ruta con el código ${createRouteDto.code}`,
        );
      }
    }

    // Validar que no exista una ruta con el mismo nombre
    if (
      await this.routesRepository.existsByName(createRouteDto.name, operatorId)
    ) {
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
    const route = await this.routesRepository.createRoute(
      {
        operatorId,
        ...createRouteDto,
      },
      userId,
    );

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
    const existingRoute = await this.getRouteById(operatorId, routeId);

    // Si se actualiza el código, validar que no exista otro con el mismo
    if (updateRouteDto.code && updateRouteDto.code !== existingRoute.code) {
      if (
        await this.routesRepository.existsByCodeExcludingId(
          updateRouteDto.code,
          operatorId,
          routeId,
        )
      ) {
        throw new ConflictException(
          `Ya existe otra ruta con el código ${updateRouteDto.code}`,
        );
      }
    }

    // Si se actualiza el nombre, validar que no exista otro con el mismo
    if (updateRouteDto.name && updateRouteDto.name !== existingRoute.name) {
      if (
        await this.routesRepository.existsByNameExcludingId(
          updateRouteDto.name,
          operatorId,
          routeId,
        )
      ) {
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
    const updatedRoute = await this.routesRepository.updateRoute(
      routeId,
      updateRouteDto,
      userId,
      operatorId,
    );

    return updatedRoute;
  }

  // ==========================================================================
  // DELETE ROUTE
  // ==========================================================================
  async deleteRoute(operatorId: number, routeId: number) {
    // Verificar que la ruta existe
    const route = await this.getRouteById(operatorId, routeId);

    // Verificar que no esté siendo usada en operaciones
    const operationsCount = await this.routesRepository.countOperationsByRoute(
      routeId,
      operatorId,
    );

    if (operationsCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar la ruta porque está siendo usada en ${operationsCount} operación(es)`,
      );
    }

    // Eliminar ruta
    await this.routesRepository.delete(routeId);

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
    const statistics = await this.routesRepository.getRouteStatistics(
      routeId,
      operatorId,
    );

    return {
      route,
      statistics,
    };
  }
}
