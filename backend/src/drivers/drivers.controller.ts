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
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import {
  CreateDriverDto,
  UpdateDriverDto,
  DriverQueryDto,
  CreateDriverDocumentDto,
  UpdateDriverDocumentDto,
} from './dto/driver.dto';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('drivers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
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
    return this.driversService.createDriver(createDriverDto, req.user.id);
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
    return this.driversService.updateDriver(id, updateDriverDto, req.user.id);
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
      req.user.id,
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
      req.user.id,
    );
  }

  @Delete('documents/:documentId')
  @RequirePermission('drivers', 'delete')
  async deleteDriverDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
  ) {
    return this.driversService.deleteDriverDocument(documentId);
  }
}
