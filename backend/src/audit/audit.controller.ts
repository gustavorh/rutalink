import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { AuditService } from './audit.service';
import { AuditLogFilter } from './repositories/audit.repository';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermission('audit', 'read')
  async findAll(
    @Query('userId') userId?: string,
    @Query('operatorId') operatorId?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filter: AuditLogFilter = {
      userId: userId ? parseInt(userId, 10) : undefined,
      operatorId: operatorId ? parseInt(operatorId, 10) : undefined,
      action,
      resource,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    };

    return this.auditService.findAll(filter);
  }

  @Get('user/:userId')
  @RequirePermission('audit', 'read')
  async getUserActivity(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.auditService.getUserActivity(userId, limitNum);
  }

  @Get(':id')
  @RequirePermission('audit', 'read')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditService.findById(id);
  }
}
