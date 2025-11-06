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
import { TrucksService } from './trucks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import {
  CreateTruckDto,
  UpdateTruckDto,
  CreateVehicleDocumentDto,
  UpdateVehicleDocumentDto,
  TruckQueryDto,
} from './dto/truck.dto';

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

@Controller('trucks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TrucksController {
  constructor(private readonly trucksService: TrucksService) {}

  // ============================================================================
  // TRUCKS CRUD ENDPOINTS
  // ============================================================================

  /**
   * POST /trucks
   * Crear un nuevo camión
   */
  @Post()
  @RequirePermission('trucks', 'create')
  async create(
    @Body() createTruckDto: CreateTruckDto,
    @Request() req: RequestWithUser,
  ) {
    return this.trucksService.create(
      req.user.operatorId,
      createTruckDto,
      req.user.userId,
    );
  }

  /**
   * GET /trucks
   * Obtener todos los camiones con filtros y paginación
   */
  @Get()
  @RequirePermission('trucks', 'read')
  async findAll(
    @Query() query: TruckQueryDto,
    @Request() req: RequestWithUser,
  ) {
    return this.trucksService.findAll(req.user.operatorId, query);
  }

  /**
   * GET /trucks/:id
   * Obtener un camión por ID
   */
  @Get(':id')
  @RequirePermission('trucks', 'read')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeRelations') includeRelations: string,
    @Request() req: RequestWithUser,
  ) {
    const include = includeRelations === 'true';
    return this.trucksService.findOne(req.user.operatorId, id, include);
  }

  /**
   * PUT /trucks/:id
   * Actualizar un camión
   */
  @Put(':id')
  @RequirePermission('trucks', 'update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTruckDto: UpdateTruckDto,
    @Request() req: RequestWithUser,
  ) {
    return this.trucksService.update(
      req.user.operatorId,
      id,
      updateTruckDto,
      req.user.userId,
    );
  }

  /**
   * DELETE /trucks/:id
   * Eliminar un camión
   */
  @Delete(':id')
  @RequirePermission('trucks', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    await this.trucksService.remove(req.user.operatorId, id);
  }

  // ============================================================================
  // DOCUMENT ENDPOINTS
  // ============================================================================

  /**
   * POST /trucks/documents
   * Agregar un documento a un camión
   */
  @Post('documents')
  @RequirePermission('trucks', 'update')
  async addDocument(
    @Body() createDocumentDto: CreateVehicleDocumentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.trucksService.addDocument(
      req.user.operatorId,
      createDocumentDto,
      req.user.userId,
    );
  }

  /**
   * GET /trucks/:id/documents
   * Obtener todos los documentos de un camión
   */
  @Get(':id/documents')
  @RequirePermission('trucks', 'read')
  async getDocuments(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.trucksService.getDocuments(req.user.operatorId, id);
  }

  /**
   * PUT /trucks/documents/:documentId
   * Actualizar un documento
   */
  @Put('documents/:documentId')
  @RequirePermission('trucks', 'update')
  async updateDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body() updateDocumentDto: UpdateVehicleDocumentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.trucksService.updateDocument(
      req.user.operatorId,
      documentId,
      updateDocumentDto,
      req.user.userId,
    );
  }

  /**
   * DELETE /trucks/documents/:documentId
   * Eliminar un documento
   */
  @Delete('documents/:documentId')
  @RequirePermission('trucks', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Request() req: RequestWithUser,
  ) {
    await this.trucksService.removeDocument(req.user.operatorId, documentId);
  }

  /**
   * GET /trucks/documents/expiring
   * Obtener documentos próximos a vencer
   */
  @Get('documents/expiring')
  @RequirePermission('trucks', 'read')
  async getExpiringDocuments(
    @Query('days', ParseIntPipe) days: number = 30,
    @Request() req: RequestWithUser,
  ) {
    return this.trucksService.getExpiringDocuments(req.user.operatorId, days);
  }

  // ============================================================================
  // OPERATIONAL STATUS ENDPOINTS
  // ============================================================================

  /**
   * GET /trucks/:id/operational-status
   * Obtener estado operativo de un camión
   */
  @Get(':id/operational-status')
  @RequirePermission('trucks', 'read')
  async getOperationalStatus(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    const status = await this.trucksService.getOperationalStatus(
      req.user.operatorId,
      id,
    );
    return { vehicleId: id, operationalStatus: status };
  }

  // ============================================================================
  // OPERATIONS HISTORY ENDPOINTS
  // ============================================================================

  /**
   * GET /trucks/:id/operations/history
   * Obtener historial de operaciones de un camión
   */
  @Get(':id/operations/history')
  @RequirePermission('trucks', 'read')
  async getOperationHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Request() req: RequestWithUser,
  ) {
    return this.trucksService.getOperationHistory(
      req.user.operatorId,
      id,
      limit,
    );
  }

  /**
   * GET /trucks/:id/operations/upcoming
   * Obtener próximas operaciones de un camión
   */
  @Get(':id/operations/upcoming')
  @RequirePermission('trucks', 'read')
  async getUpcomingOperations(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.trucksService.getUpcomingOperations(req.user.operatorId, id);
  }

  // ============================================================================
  // STATISTICS ENDPOINTS
  // ============================================================================

  /**
   * GET /trucks/stats/overview
   * Obtener estadísticas generales de la flota
   */
  @Get('stats/overview')
  @RequirePermission('trucks', 'read')
  getFleetOverview(@Request() req: RequestWithUser) {
    // Este método se puede implementar más adelante
    return {
      message: 'Fleet overview statistics endpoint',
      operatorId: req.user.operatorId,
    };
  }
}
