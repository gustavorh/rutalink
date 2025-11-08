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
import { OperationsService } from './operations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import {
  CreateOperationDto,
  UpdateOperationDto,
  OperationQueryDto,
  AssignDriverToVehicleDto,
  UnassignDriverFromVehicleDto,
} from './dto/operation.dto';

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

@Controller('operations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OperationsController {
  constructor(private readonly operationsService: OperationsService) {}

  // ============================================================================
  // OPERATIONS ENDPOINTS
  // ============================================================================

  @Post()
  @RequirePermission('operations', 'create')
  async createOperation(
    @Body() createOperationDto: CreateOperationDto,
    @Request() req: RequestWithUser,
  ) {
    return this.operationsService.createOperation(
      createOperationDto,
      req.user.userId,
    );
  }

  @Get()
  @RequirePermission('operations', 'read')
  async getOperations(@Query() query: OperationQueryDto) {
    return this.operationsService.getOperations(query);
  }

  @Get(':id')
  @RequirePermission('operations', 'read')
  async getOperationById(@Param('id', ParseIntPipe) id: number) {
    return this.operationsService.getOperationById(id);
  }

  @Put(':id')
  @RequirePermission('operations', 'update')
  async updateOperation(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOperationDto: UpdateOperationDto,
    @Request() req: RequestWithUser,
  ) {
    return this.operationsService.updateOperation(
      id,
      updateOperationDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @RequirePermission('operations', 'delete')
  async deleteOperation(@Param('id', ParseIntPipe) id: number) {
    return this.operationsService.deleteOperation(id);
  }

  // ============================================================================
  // DRIVER-VEHICLE ASSIGNMENTS ENDPOINTS
  // ============================================================================

  @Post('assignments')
  @RequirePermission('operations', 'create')
  async assignDriverToVehicle(
    @Body() assignDto: AssignDriverToVehicleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.operationsService.assignDriverToVehicle(
      assignDto,
      req.user.userId,
    );
  }

  @Put('assignments/:assignmentId/unassign')
  @RequirePermission('operations', 'update')
  async unassignDriverFromVehicle(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() unassignDto: UnassignDriverFromVehicleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.operationsService.unassignDriverFromVehicle(
      assignmentId,
      unassignDto,
      req.user.userId,
    );
  }

  @Get('assignments/driver/:driverId')
  @RequirePermission('operations', 'read')
  async getDriverVehicleAssignments(
    @Param('driverId', ParseIntPipe) driverId: number,
  ) {
    return this.operationsService.getDriverVehicleAssignments(driverId);
  }

  @Get('assignments/driver/:driverId/active')
  @RequirePermission('operations', 'read')
  async getActiveDriverVehicleAssignment(
    @Param('driverId', ParseIntPipe) driverId: number,
  ) {
    return this.operationsService.getActiveDriverVehicleAssignment(driverId);
  }

  // ============================================================================
  // DRIVER HISTORY & STATISTICS ENDPOINTS
  // ============================================================================

  @Get('driver/:driverId/history')
  @RequirePermission('operations', 'read')
  async getDriverOperationHistory(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Query() query: OperationQueryDto,
  ) {
    return this.operationsService.getDriverOperationHistory(driverId, query);
  }

  @Get('driver/:driverId/statistics')
  @RequirePermission('operations', 'read')
  async getDriverStatistics(@Param('driverId', ParseIntPipe) driverId: number) {
    return this.operationsService.getDriverStatistics(driverId);
  }
}
