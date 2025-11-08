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
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientQueryDto,
  ClientOperationsQueryDto,
} from './dto/client.dto';

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

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ============================================================================
  // CLIENTS CRUD ENDPOINTS
  // ============================================================================

  /**
   * Crear un nuevo cliente
   * POST /clients
   */
  @Post()
  @RequirePermission('clients', 'create')
  async createClient(
    @Body() createClientDto: CreateClientDto,
    @Request() req: RequestWithUser,
  ) {
    return this.clientsService.createClient(createClientDto, req.user.userId);
  }

  /**
   * Obtener lista de clientes con filtros
   * GET /clients
   */
  @Get()
  @RequirePermission('clients', 'read')
  async getClients(@Query() query: ClientQueryDto) {
    return this.clientsService.getClients(query);
  }

  /**
   * Obtener un cliente por ID
   * GET /clients/:id
   */
  @Get(':id')
  @RequirePermission('clients', 'read')
  async getClientById(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.getClientById(id);
  }

  /**
   * Actualizar un cliente
   * PUT /clients/:id
   */
  @Put(':id')
  @RequirePermission('clients', 'update')
  async updateClient(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
    @Request() req: RequestWithUser,
  ) {
    return this.clientsService.updateClient(
      id,
      updateClientDto,
      req.user.userId,
    );
  }

  /**
   * Desactivar un cliente (soft delete)
   * DELETE /clients/:id
   */
  @Delete(':id')
  @RequirePermission('clients', 'delete')
  async deleteClient(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.clientsService.deleteClient(id, req.user.userId);
  }

  /**
   * Eliminar permanentemente un cliente
   * DELETE /clients/:id/permanent
   */
  @Delete(':id/permanent')
  @RequirePermission('clients', 'delete')
  async permanentlyDeleteClient(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.permanentlyDeleteClient(id);
  }

  // ============================================================================
  // CLIENT OPERATIONS & HISTORY ENDPOINTS
  // ============================================================================

  /**
   * Obtener historial de operaciones de un cliente
   * GET /clients/:id/operations
   */
  @Get(':id/operations')
  @RequirePermission('clients', 'read')
  async getClientOperations(
    @Param('id', ParseIntPipe) clientId: number,
    @Query() query: ClientOperationsQueryDto,
  ) {
    return this.clientsService.getClientOperations(clientId, query);
  }

  /**
   * Obtener estadísticas de un cliente
   * GET /clients/:id/statistics
   */
  @Get(':id/statistics')
  @RequirePermission('clients', 'read')
  async getClientStatistics(@Param('id', ParseIntPipe) clientId: number) {
    return this.clientsService.getClientStatistics(clientId);
  }

  /**
   * Obtener operaciones recientes de un cliente
   * GET /clients/:id/recent-operations
   */
  @Get(':id/recent-operations')
  @RequirePermission('clients', 'read')
  async getRecentClientOperations(
    @Param('id', ParseIntPipe) clientId: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return this.clientsService.getRecentClientOperations(clientId, limit || 5);
  }

  // ============================================================================
  // ANALYTICS & REPORTS ENDPOINTS
  // ============================================================================

  /**
   * Obtener análisis de clientes por rubro/industria
   * GET /clients/analytics/by-industry
   */
  @Get('analytics/by-industry')
  @RequirePermission('clients', 'read')
  async getClientsByIndustry(
    @Query('operatorId', ParseIntPipe) operatorId?: number,
  ) {
    return this.clientsService.getClientsByIndustry(operatorId);
  }

  /**
   * Obtener clientes con más operaciones
   * GET /clients/analytics/top-clients
   */
  @Get('analytics/top-clients')
  @RequirePermission('clients', 'read')
  async getTopClientsByOperations(
    @Query('operatorId', ParseIntPipe) operatorId?: number,
    @Query('limit', ParseIntPipe) limit?: number,
  ) {
    return this.clientsService.getTopClientsByOperations(
      operatorId,
      limit || 10,
    );
  }
}
