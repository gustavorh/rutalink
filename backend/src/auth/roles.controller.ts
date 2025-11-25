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
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermission('roles', 'read')
  async findAll(
    @Request() req: RequestWithUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Non-super users can only see roles from their own operator
    const operatorId = req.user.isSuper ? undefined : req.user.operatorId;

    return this.rolesService.findAll({
      operatorId,
      search,
      status: status !== undefined ? status === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermission('roles', 'read')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    // Non-super users can only view roles from their own operator
    const operatorId = req.user.isSuper ? undefined : req.user.operatorId;
    return this.rolesService.findById(id, operatorId);
  }

  @Post()
  @RequirePermission('roles', 'create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createRoleDto: CreateRoleDto,
    @Request() req: RequestWithUser,
  ) {
    // Non-super users can only create roles for their own operator
    if (!req.user.isSuper && createRoleDto.operatorId !== req.user.operatorId) {
      throw new ForbiddenException('Cannot create roles for other operators');
    }

    return this.rolesService.create(createRoleDto);
  }

  @Put(':id')
  @RequirePermission('roles', 'update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @Request() req: RequestWithUser,
  ) {
    // Non-super users can only update roles from their own operator
    const operatorId = req.user.isSuper ? undefined : req.user.operatorId;
    return this.rolesService.update(id, updateRoleDto, operatorId);
  }

  @Delete(':id')
  @RequirePermission('roles', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    // Non-super users can only delete roles from their own operator
    const operatorId = req.user.isSuper ? undefined : req.user.operatorId;
    await this.rolesService.delete(id, operatorId);
  }
}
