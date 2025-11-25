import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto, UpdateRouteDto, RouteQueryDto } from './dto/route.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('routes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  // ==========================================================================
  // GET /routes - Listar todas las rutas del operador
  // ==========================================================================
  @Get()
  @RequirePermission('routes', 'read')
  async getRoutes(
    @Request() req: RequestWithUser,
    @Query() query: RouteQueryDto,
  ) {
    return this.routesService.getRoutes(req.user.operatorId, query);
  }

  // ==========================================================================
  // GET /routes/:id - Obtener una ruta por ID
  // ==========================================================================
  @Get(':id')
  @RequirePermission('routes', 'read')
  async getRouteById(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.routesService.getRouteById(req.user.operatorId, id);
  }

  // ==========================================================================
  // POST /routes - Crear una nueva ruta
  // ==========================================================================
  @Post()
  @RequirePermission('routes', 'create')
  async createRoute(
    @Request() req: RequestWithUser,
    @Body() createRouteDto: CreateRouteDto,
  ) {
    return this.routesService.createRoute(
      req.user.operatorId,
      req.user.id,
      createRouteDto,
    );
  }

  // ==========================================================================
  // PUT /routes/:id - Actualizar una ruta
  // ==========================================================================
  @Put(':id')
  @RequirePermission('routes', 'update')
  async updateRoute(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRouteDto: UpdateRouteDto,
  ) {
    return this.routesService.updateRoute(
      req.user.operatorId,
      req.user.id,
      id,
      updateRouteDto,
    );
  }

  // ==========================================================================
  // DELETE /routes/:id - Eliminar una ruta
  // ==========================================================================
  @Delete(':id')
  @RequirePermission('routes', 'delete')
  async deleteRoute(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.routesService.deleteRoute(req.user.operatorId, id);
  }

  // ==========================================================================
  // GET /routes/:id/statistics - Obtener estadísticas de una ruta
  // ==========================================================================
  @Get(':id/statistics')
  @RequirePermission('routes', 'read')
  async getRouteStatistics(
    @Request() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.routesService.getRouteStatistics(req.user.operatorId, id);
  }
}
