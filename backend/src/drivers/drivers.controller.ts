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
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import {
  CreateDriverDto,
  UpdateDriverDto,
  DriverQueryDto,
  CreateDriverDocumentDto,
  UpdateDriverDocumentDto,
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleQueryDto,
  AssignDriverToVehicleDto,
  UnassignDriverFromVehicleDto,
  CreateOperationDto,
  UpdateOperationDto,
  OperationQueryDto,
} from './dto/driver.dto';

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

@Controller('drivers')
@UseGuards(JwtAuthGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  // ============================================================================
  // DRIVERS ENDPOINTS
  // ============================================================================

  @Post()
  @RequirePermission('drivers', 'create')
  async createDriver(
    @Body() createDriverDto: CreateDriverDto,
    @Request() req: RequestWithUser,
  ) {
    return this.driversService.createDriver(createDriverDto, req.user.userId);
  }

  @Get()
  @RequirePermission('drivers', 'read')
  async getDrivers(@Query() query: DriverQueryDto) {
    return this.driversService.getDrivers(query);
  }

  @Get(':id')
  @RequirePermission('drivers', 'read')
  async getDriverById(@Param('id', ParseIntPipe) id: number) {
    return this.driversService.getDriverById(id);
  }

  @Put(':id')
  @RequirePermission('drivers', 'update')
  async updateDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDriverDto: UpdateDriverDto,
    @Request() req: RequestWithUser,
  ) {
    return this.driversService.updateDriver(
      id,
      updateDriverDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @RequirePermission('drivers', 'delete')
  async deleteDriver(@Param('id', ParseIntPipe) id: number) {
    return this.driversService.deleteDriver(id);
  }

  // ============================================================================
  // DRIVER DOCUMENTS ENDPOINTS
  // ============================================================================

  @Post(':id/documents')
  @RequirePermission('drivers', 'update')
  async createDriverDocument(
    @Param('id', ParseIntPipe) driverId: number,
    @Body() createDocumentDto: CreateDriverDocumentDto,
    @Request() req: RequestWithUser,
  ) {
    // Ensure driverId in URL matches driverId in body
    createDocumentDto.driverId = driverId;
    return this.driversService.createDriverDocument(
      createDocumentDto,
      req.user.userId,
    );
  }

  @Get(':id/documents')
  @RequirePermission('drivers', 'read')
  async getDriverDocuments(@Param('id', ParseIntPipe) driverId: number) {
    return this.driversService.getDriverDocuments(driverId);
  }

  @Get('documents/:documentId')
  @RequirePermission('drivers', 'read')
  async getDriverDocumentById(
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    return this.driversService.getDriverDocumentById(documentId);
  }

  @Put('documents/:documentId')
  @RequirePermission('drivers', 'update')
  async updateDriverDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Body() updateDocumentDto: UpdateDriverDocumentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.driversService.updateDriverDocument(
      documentId,
      updateDocumentDto,
      req.user.userId,
    );
  }

  @Delete('documents/:documentId')
  @RequirePermission('drivers', 'delete')
  async deleteDriverDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    return this.driversService.deleteDriverDocument(documentId);
  }

  // ============================================================================
  // DRIVER ASSIGNMENTS ENDPOINTS
  // ============================================================================

  @Post(':id/assign-vehicle')
  @RequirePermission('drivers', 'update')
  async assignDriverToVehicle(
    @Param('id', ParseIntPipe) driverId: number,
    @Body() assignDto: AssignDriverToVehicleDto,
    @Request() req: RequestWithUser,
  ) {
    // Ensure driverId in URL matches driverId in body
    assignDto.driverId = driverId;
    return this.driversService.assignDriverToVehicle(
      assignDto,
      req.user.userId,
    );
  }

  @Put('assignments/:assignmentId/unassign')
  @RequirePermission('drivers', 'update')
  async unassignDriverFromVehicle(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() unassignDto: UnassignDriverFromVehicleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.driversService.unassignDriverFromVehicle(
      assignmentId,
      unassignDto,
      req.user.userId,
    );
  }

  @Get(':id/assignments')
  @RequirePermission('drivers', 'read')
  async getDriverVehicleAssignments(
    @Param('id', ParseIntPipe) driverId: number,
  ) {
    return this.driversService.getDriverVehicleAssignments(driverId);
  }

  @Get(':id/active-assignment')
  @RequirePermission('drivers', 'read')
  async getActiveDriverVehicleAssignment(
    @Param('id', ParseIntPipe) driverId: number,
  ) {
    return this.driversService.getActiveDriverVehicleAssignment(driverId);
  }

  // ============================================================================
  // DRIVER HISTORY & STATISTICS ENDPOINTS
  // ============================================================================

  @Get(':id/operations')
  @RequirePermission('drivers', 'read')
  async getDriverOperationHistory(
    @Param('id', ParseIntPipe) driverId: number,
    @Query() query: OperationQueryDto,
  ) {
    return this.driversService.getDriverOperationHistory(driverId, query);
  }

  @Get(':id/statistics')
  @RequirePermission('drivers', 'read')
  async getDriverStatistics(@Param('id', ParseIntPipe) driverId: number) {
    return this.driversService.getDriverStatistics(driverId);
  }

  // ============================================================================
  // VEHICLES ENDPOINTS
  // ============================================================================

  @Post('vehicles')
  @RequirePermission('vehicles', 'create')
  async createVehicle(
    @Body() createVehicleDto: CreateVehicleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.driversService.createVehicle(createVehicleDto, req.user.userId);
  }

  @Get('vehicles')
  @RequirePermission('vehicles', 'read')
  async getVehicles(@Query() query: VehicleQueryDto) {
    return this.driversService.getVehicles(query);
  }

  @Get('vehicles/:id')
  @RequirePermission('vehicles', 'read')
  async getVehicleById(@Param('id', ParseIntPipe) id: number) {
    return this.driversService.getVehicleById(id);
  }

  @Put('vehicles/:id')
  @RequirePermission('vehicles', 'update')
  async updateVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.driversService.updateVehicle(
      id,
      updateVehicleDto,
      req.user.userId,
    );
  }

  @Delete('vehicles/:id')
  @RequirePermission('vehicles', 'delete')
  async deleteVehicle(@Param('id', ParseIntPipe) id: number) {
    return this.driversService.deleteVehicle(id);
  }

  // ============================================================================
  // OPERATIONS ENDPOINTS
  // ============================================================================

  @Post('operations')
  @RequirePermission('operations', 'create')
  async createOperation(
    @Body() createOperationDto: CreateOperationDto,
    @Request() req: RequestWithUser,
  ) {
    return this.driversService.createOperation(
      createOperationDto,
      req.user.userId,
    );
  }

  @Get('operations')
  @RequirePermission('operations', 'read')
  async getOperations(@Query() query: OperationQueryDto) {
    return this.driversService.getOperations(query);
  }

  @Get('operations/:id')
  @RequirePermission('operations', 'read')
  async getOperationById(@Param('id', ParseIntPipe) id: number) {
    return this.driversService.getOperationById(id);
  }

  @Put('operations/:id')
  @RequirePermission('operations', 'update')
  async updateOperation(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOperationDto: UpdateOperationDto,
    @Request() req: RequestWithUser,
  ) {
    return this.driversService.updateOperation(
      id,
      updateOperationDto,
      req.user.userId,
    );
  }

  @Delete('operations/:id')
  @RequirePermission('operations', 'delete')
  async deleteOperation(@Param('id', ParseIntPipe) id: number) {
    return this.driversService.deleteOperation(id);
  }
}
