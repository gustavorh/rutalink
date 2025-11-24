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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

interface RequestWithUser extends Request {
  user: {
    id: number;
    username: string;
    email: string;
    operatorId: number;
    roleId: number;
    isSuper: boolean;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission('users', 'read')
  async findAll(
    @Request() req: RequestWithUser,
    @Query('search') search?: string,
    @Query('roleId') roleId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Non-super users can only see users from their own operator
    const operatorId = req.user.isSuper ? undefined : req.user.operatorId;

    return this.usersService.findAll({
      operatorId,
      search,
      roleId: roleId ? parseInt(roleId, 10) : undefined,
      status: status !== undefined ? status === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermission('users', 'read')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    // Non-super users can only view users from their own operator
    const operatorId = req.user.isSuper ? undefined : req.user.operatorId;
    return this.usersService.findById(id, operatorId);
  }

  @Post()
  @RequirePermission('users', 'create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req: RequestWithUser,
  ) {
    // Non-super users can only create users in their own operator
    if (!req.user.isSuper && createUserDto.operatorId !== req.user.operatorId) {
      throw new ForbiddenException('Cannot create users for other operators');
    }
    return this.usersService.create(createUserDto, req.user.id);
  }

  @Put(':id')
  @RequirePermission('users', 'update')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: RequestWithUser,
  ) {
    // Non-super users can only update users from their own operator
    const operatorId = req.user.isSuper ? undefined : req.user.operatorId;
    return this.usersService.update(id, updateUserDto, operatorId, req.user.id);
  }

  @Delete(':id')
  @RequirePermission('users', 'delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    // Non-super users can only delete users from their own operator
    const operatorId = req.user.isSuper ? undefined : req.user.operatorId;
    await this.usersService.delete(id, operatorId);
  }
}
