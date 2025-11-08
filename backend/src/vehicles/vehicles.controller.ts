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
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  CreateVehicleDocumentDto,
  UpdateVehicleDocumentDto,
  VehicleQueryDto,
} from './dto/vehicle.dto';

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

@Controller('vehicles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  // ============================================================================
  // TRUCKS CRUD ENDPOINTS
  // ============================================================================

  /**
   * POST /vehicles
   * Crear un nuevo vehículo
   */
  @Post()
  @RequirePermission('vehicles', 'create')
  async create(
    @Body() createTruckDto: CreateVehicleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.vehiclesService.create(
      req.user.operatorId,
      createTruckDto,
      req.user.userId,
    );
  }

  /**
   * GET /vehicles
   * Obtener todos los vehículos con filtros y paginación
   */
  @Get()
  @RequirePermission('vehicles', 'read')
  async findAll(
    @Query() query: VehicleQueryDto,
    @Request() req: RequestWithUser,
  ) {
    return this.vehiclesService.findAll(req.user.operatorId, query);
  }

  /**
   * GET /vehicles/:id
   * Obtener un vehículo por ID
   */
  @Get(':id')
  @RequirePermission('vehicles', 'read')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeRelations') includeRelations: string,
    @Request() req: RequestWithUser,
  ) {
    const include = includeRelations === 'true';
    return this.vehiclesService.findOne(req.user.operatorId, id, include);
  }

  /**
   * PUT /vehicles/:id
   * Actualizar un vehículo
   */
  @Put(':id')
  @RequirePermission('vehicles', 'update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTruckDto: UpdateVehicleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.vehiclesService.update(
      req.user.operatorId,
      id,
      updateTruckDto,
      req.user.userId,
    );
  }

  /**
   * DELETE /vehicles/:id
   * Eliminar un vehículo
   */
  @Delete(':id')
  @RequirePermission('vehicles', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    await this.vehiclesService.remove(req.user.operatorId, id);
  }

  // ============================================================================
  // DOCUMENT ENDPOINTS
  // ============================================================================

  /**
   * POST /vehicles/documents
   * Agregar un documento a un vehículo
   */
  @Post('documents')
  @RequirePermission('vehicles', 'update')
  async addDocument(
    @Body() createDocumentDto: CreateVehicleDocumentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.vehiclesService.addDocument(
      req.user.operatorId,
      createDocumentDto,
      req.user.userId,
    );
  }

  /**
   * GET /vehicles/:id/documents
   * Obtener todos los documentos de un vehículo
   */
  @Get(':id/documents')
  @RequirePermission('vehicles', 'read')
  async getDocuments(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.vehiclesService.getDocuments(req.user.operatorId, id);
  }

  /**
   * PUT /vehicles/documents/:documentId
   * Actualizar un documento
   */
  @Put('documents/:documentId')
  @RequirePermission('vehicles', 'update')
  async updateDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body() updateDocumentDto: UpdateVehicleDocumentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.vehiclesService.updateDocument(
      req.user.operatorId,
      documentId,
      updateDocumentDto,
      req.user.userId,
    );
  }

  /**
   * DELETE /vehicles/documents/:documentId
   * Eliminar un documento
   */
  @Delete('documents/:documentId')
  @RequirePermission('vehicles', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Request() req: RequestWithUser,
  ) {
    await this.vehiclesService.removeDocument(req.user.operatorId, documentId);
  }

  /**
   * GET /vehicles/documents/expiring
   * Obtener documentos próximos a vencer
   */
  @Get('documents/expiring')
  @RequirePermission('vehicles', 'read')
  async getExpiringDocuments(
    @Query('days', ParseIntPipe) days: number = 30,
    @Request() req: RequestWithUser,
  ) {
    return this.vehiclesService.getExpiringDocuments(req.user.operatorId, days);
  }

  // ============================================================================
  // OPERATIONAL STATUS ENDPOINTS
  // ============================================================================

  /**
   * GET /vehicles/:id/operational-status
   * Obtener estado operativo de un vehículo
   */
  @Get(':id/operational-status')
  @RequirePermission('vehicles', 'read')
  async getOperationalStatus(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    const status = await this.vehiclesService.getOperationalStatus(
      req.user.operatorId,
      id,
    );
    return { vehicleId: id, operationalStatus: status };
  }

  // ============================================================================
  // OPERATIONS HISTORY ENDPOINTS
  // ============================================================================

  /**
   * GET /vehicles/:id/operations/history
   * Obtener historial de operaciones de un vehículo
   */
  @Get(':id/operations/history')
  @RequirePermission('vehicles', 'read')
  async getOperationHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Request() req: RequestWithUser,
  ) {
    return this.vehiclesService.getOperationHistory(
      req.user.operatorId,
      id,
      limit,
    );
  }

  /**
   * GET /vehicles/:id/operations/upcoming
   * Obtener próximas operaciones de un vehículo
   */
  @Get(':id/operations/upcoming')
  @RequirePermission('vehicles', 'read')
  async getUpcomingOperations(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.vehiclesService.getUpcomingOperations(req.user.operatorId, id);
  }

  // ============================================================================
  // STATISTICS ENDPOINTS
  // ============================================================================

  /**
   * GET /vehicles/stats/overview
   * Obtener estadísticas generales de la flota
   */
  @Get('stats/overview')
  @RequirePermission('vehicles', 'read')
  getFleetOverview(@Request() req: RequestWithUser) {
    // Este método se puede implementar más adelante
    return {
      message: 'Fleet overview statistics endpoint',
      operatorId: req.user.operatorId,
    };
  }
}
