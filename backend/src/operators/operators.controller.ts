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
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto, UpdateOperatorDto } from './dto/operator.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('operators')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Get()
  @RequirePermission('operators', 'read')
  async findAll(
    @Request() req: RequestWithUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('super') superParam?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Only super operators can see all operators
    // Regular operators can only see their own operator
    if (!req.user.isSuper) {
      const operator = await this.operatorsService.findById(
        req.user.operatorId,
      );
      return {
        data: [operator],
        pagination: {
          page: 1,
          limit: 1,
          total: 1,
          totalPages: 1,
        },
      };
    }

    return this.operatorsService.findAll({
      search,
      status: status !== undefined ? status === 'true' : undefined,
      super: superParam !== undefined ? superParam === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermission('operators', 'read')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    // Non-super users can only view their own operator
    if (!req.user.isSuper && id !== req.user.operatorId) {
      throw new ForbiddenException('Cannot view other operators');
    }

    return this.operatorsService.findById(id);
  }

  @Get(':id/statistics')
  @RequirePermission('operators', 'read')
  async getStatistics(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    // Non-super users can only view their own operator statistics
    if (!req.user.isSuper && id !== req.user.operatorId) {
      throw new ForbiddenException(
        'Cannot view statistics for other operators',
      );
    }

    return this.operatorsService.getStatistics(id);
  }

  @Post()
  @RequirePermission('operators', 'create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createOperatorDto: CreateOperatorDto,
    @Request() req: RequestWithUser,
  ) {
    // Only super operators can create new operators
    if (!req.user.isSuper) {
      throw new ForbiddenException(
        'Only super operators can create new operators',
      );
    }

    // Convert expiration string to Date if provided, otherwise set to null
    const operatorData = {
      ...createOperatorDto,
      expiration:
        createOperatorDto.expiration && createOperatorDto.expiration !== ''
          ? new Date(createOperatorDto.expiration)
          : null,
    };

    return this.operatorsService.create(operatorData, req.user.id);
  }

  @Put(':id')
  @RequirePermission('operators', 'update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOperatorDto: UpdateOperatorDto,
    @Request() req: RequestWithUser,
  ) {
    // Super operators can update any operator
    // Regular operators can only update their own operator
    if (!req.user.isSuper && id !== req.user.operatorId) {
      throw new ForbiddenException('Cannot update other operators');
    }

    // Regular operators cannot change the 'super' flag
    if (!req.user.isSuper && updateOperatorDto.super !== undefined) {
      throw new ForbiddenException('Cannot modify super operator status');
    }

    // Convert expiration string to Date if provided, otherwise set to null
    const operatorData = {
      ...updateOperatorDto,
      expiration:
        updateOperatorDto.expiration && updateOperatorDto.expiration !== ''
          ? new Date(updateOperatorDto.expiration)
          : null,
    };

    return this.operatorsService.update(id, operatorData, req.user.id);
  }

  @Delete(':id')
  @RequirePermission('operators', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    // Only super operators can delete operators
    if (!req.user.isSuper) {
      throw new ForbiddenException('Only super operators can delete operators');
    }

    // Cannot delete own operator
    if (id === req.user.operatorId) {
      throw new ForbiddenException('Cannot delete your own operator');
    }

    await this.operatorsService.delete(id);
  }
}
