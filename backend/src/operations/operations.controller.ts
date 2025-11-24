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
  Res,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { OperationsService, BatchUploadResult } from './operations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import {
  CreateOperationDto,
  UpdateOperationDto,
  OperationQueryDto,
  AssignDriverToVehicleDto,
  UnassignDriverFromVehicleDto,
  GenerateReportDto,
  BatchUploadOperationsDto,
  OperationExcelRowDto,
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

  // ============================================================================
  // OPERATION BATCH UPLOAD ENDPOINTS
  // ============================================================================

  @Get('excel-template')
  @RequirePermission('operations', 'read')
  async downloadExcelTemplate(@Res() res: Response) {
    const buffer = await this.operationsService.generateExcelTemplate();
    const filename = `plantilla-operaciones-${new Date().toISOString().split('T')[0]}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.status(HttpStatus.OK).send(buffer);
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

  @Post('batch-upload/parse')
  @RequirePermission('operations', 'create')
  @UseInterceptors(FileInterceptor('file'))
  async parseExcelFile(@UploadedFile() file?: Express.Multer.File): Promise<{
    success: boolean;
    totalRows: number;
    validRows: number;
    errors: any[];
    data: any[];
  }> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (
      !file.mimetype.includes('spreadsheet') &&
      !file.mimetype.includes('excel')
    ) {
      throw new BadRequestException(
        'El archivo debe ser un archivo Excel (.xlsx)',
      );
    }

    const result = await this.operationsService.processExcelFile(file.buffer);

    return {
      success: result.errors.length === 0,
      totalRows: result.data.length,
      validRows: result.data.length - result.errors.length,
      errors: result.errors,
      data: result.data,
    };
  }

  @Post('batch-upload')
  @RequirePermission('operations', 'create')
  async batchUploadOperations(
    @Body() batchUploadDto: BatchUploadOperationsDto,
    @Request() req: RequestWithUser,
  ): Promise<BatchUploadResult> {
    return await this.operationsService.batchUploadOperations(
      batchUploadDto,
      req.user.userId,
    );
  }

  @Post('batch-upload/file')
  @RequirePermission('operations', 'create')
  @UseInterceptors(FileInterceptor('file'))
  async batchUploadOperationsFromFile(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('operatorId', ParseIntPipe) operatorId: number,
    @Request() req: RequestWithUser,
  ): Promise<BatchUploadResult> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (
      !file.mimetype.includes('spreadsheet') &&
      !file.mimetype.includes('excel')
    ) {
      throw new BadRequestException(
        'El archivo debe ser un archivo Excel (.xlsx)',
      );
    }

    // Parse the Excel file
    const parseResult = await this.operationsService.processExcelFile(
      file.buffer,
    );

    if (parseResult.errors.length > 0) {
      return {
        success: false,
        message: 'El archivo contiene errores de validación',
        totalRows: parseResult.data.length,
        successCount: 0,
        errorCount: parseResult.errors.length,
        errors: parseResult.errors,
        duplicates: [],
        createdOperations: [],
      };
    }

    // Process the batch upload
    const batchUploadDto: BatchUploadOperationsDto = {
      operatorId,
      operations: parseResult.data as OperationExcelRowDto[],
    };

    return await this.operationsService.batchUploadOperations(
      batchUploadDto,
      req.user.userId,
    );
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

  // ============================================================================
  // PDF REPORT GENERATION ENDPOINT
  // ============================================================================

  @Post(':id/generate-report')
  @RequirePermission('operations', 'read')
  async generateOperationReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() options: GenerateReportDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.operationsService.generateOperationReport(
      id,
      options,
    );

    const operation = await this.operationsService.getOperationById(id);
    const filename = `operacion-${operation.operation.operationNumber}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.status(HttpStatus.OK).send(pdfBuffer);
  }
}
