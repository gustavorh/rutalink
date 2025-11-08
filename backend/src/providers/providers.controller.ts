import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import {
  CreateProviderDto,
  UpdateProviderDto,
  ProviderQueryDto,
} from './dto/provider.dto';

interface RequestWithUser extends Request {
  user: {
    userId: number;
    username: string;
    email: string;
    operatorId: number;
    roleId: number;
    isSuper: boolean;
  };
}

@Controller('providers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // ============================================================================
  // PROVIDERS ENDPOINTS
  // ============================================================================

  /**
   * POST /providers
   * Crear un nuevo proveedor
   */
  @Post()
  @RequirePermission('providers', 'create')
  async createProvider(
    @Body() createProviderDto: CreateProviderDto,
    @Request() req: RequestWithUser,
  ) {
    return this.providersService.createProvider(
      createProviderDto,
      req.user.userId,
    );
  }

  /**
   * GET /providers
   * Obtener todos los proveedores con filtros y paginación
   */
  @Get()
  @RequirePermission('providers', 'read')
  async getProviders(@Query() query: ProviderQueryDto) {
    return this.providersService.getProviders(query);
  }

  /**
   * GET /providers/:id
   * Obtener un proveedor por ID
   */
  @Get(':id')
  @RequirePermission('providers', 'read')
  async getProviderById(@Param('id', ParseIntPipe) id: number) {
    return this.providersService.getProviderById(id);
  }

  /**
   * PUT /providers/:id
   * Actualizar un proveedor
   */
  @Put(':id')
  @RequirePermission('providers', 'update')
  async updateProvider(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProviderDto: UpdateProviderDto,
    @Request() req: RequestWithUser,
  ) {
    return this.providersService.updateProvider(
      id,
      updateProviderDto,
      req.user.userId,
    );
  }

  /**
   * DELETE /providers/:id
   * Eliminar un proveedor
   */
  @Delete(':id')
  @RequirePermission('providers', 'delete')
  async deleteProvider(@Param('id', ParseIntPipe) id: number) {
    return this.providersService.deleteProvider(id);
  }

  // ============================================================================
  // PROVIDER STATISTICS & OPERATIONS
  // ============================================================================

  /**
   * GET /providers/:id/statistics
   * Obtener estadísticas de un proveedor
   */
  @Get(':id/statistics')
  @RequirePermission('providers', 'read')
  async getProviderStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.providersService.getProviderStatistics(id);
  }

  /**
   * GET /providers/:id/operations
   * Obtener operaciones asociadas a un proveedor
   */
  @Get(':id/operations')
  @RequirePermission('providers', 'read')
  async getProviderOperations(
    @Param('id', ParseIntPipe) id: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.providersService.getProviderOperations(id, page, limit);
  }
}
