import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RolesRepository } from './repositories/roles.repository';
import { OperatorsRepository } from '../operators/repositories/operators.repository';
import type { NewRole } from '../database/schema';

@Injectable()
export class RolesService {
  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly operatorsRepository: OperatorsRepository,
  ) {}

  async findAll(params: {
    operatorId?: number;
    search?: string;
    status?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;

    const result = await this.rolesRepository.findPaginatedWithOperator(
      {
        operatorId: params.operatorId,
        search: params.search,
      },
      page,
      limit,
    );

    const enrichedData = await Promise.all(
      result.data.map(async (role) => {
        const permissions = await this.rolesRepository.getRolePermissions(
          role.id,
        );
        const userCount = await this.rolesRepository.getUserCountByRoleId(
          role.id,
        );
        const activeCount =
          await this.rolesRepository.getActiveUserCountByRoleId(role.id);

        const isSystemRole =
          role.name === 'Admin' || role.name === 'SuperAdmin';

        return {
          ...role,
          permissions,
          isSystemRole,
          status: activeCount > 0 || userCount === 0,
          userCount,
        };
      }),
    );

    return {
      data: enrichedData,
      pagination: result.pagination,
    };
  }

  async findById(id: number, operatorId?: number) {
    const role = await this.rolesRepository.findByIdWithOperator(
      id,
      operatorId,
    );

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    const permissions = await this.rolesRepository.getRolePermissions(role.id);

    return {
      ...role,
      permissions,
    };
  }

  async create(roleData: NewRole & { permissions?: string[] }) {
    const operator = await this.operatorsRepository.findById(
      roleData.operatorId,
    );

    if (!operator) {
      throw new BadRequestException(
        `Operator with ID ${roleData.operatorId} not found`,
      );
    }

    if (!operator.status) {
      throw new BadRequestException(
        `Operator with ID ${roleData.operatorId} is inactive`,
      );
    }

    const existingRole = await this.rolesRepository.findByNameAndOperator(
      roleData.name,
      roleData.operatorId,
    );

    if (existingRole) {
      throw new BadRequestException(
        `Role with name "${roleData.name}" already exists for this operator`,
      );
    }

    const roleId = await this.rolesRepository.createRoleWithId({
      name: roleData.name,
      operatorId: roleData.operatorId,
    });

    if (roleData.permissions && roleData.permissions.length > 0) {
      await this.updateRolePermissions(roleId, roleData.permissions);
    }

    return this.findById(roleId);
  }

  async update(
    id: number,
    roleData: Partial<NewRole> & { permissions?: string[] },
    operatorId?: number,
  ) {
    const existingRole = await this.findById(id, operatorId);

    if (roleData.name) {
      const conflictingRole =
        await this.rolesRepository.findByNameAndOperatorExcludingId(
          roleData.name,
          existingRole.operatorId,
          id,
        );

      if (conflictingRole) {
        throw new BadRequestException(
          `Role with name "${roleData.name}" already exists for this operator`,
        );
      }

      await this.rolesRepository.updateRoleName(id, roleData.name);
    }

    if (roleData.permissions !== undefined) {
      await this.updateRolePermissions(id, roleData.permissions);
    }

    return this.findById(id, operatorId);
  }

  async delete(id: number, operatorId?: number): Promise<void> {
    await this.findById(id, operatorId);

    const userCount = await this.rolesRepository.getUserCountByRoleId(id);

    if (userCount > 0) {
      throw new BadRequestException(
        `Cannot delete role with ${userCount} assigned users. Please reassign users first.`,
      );
    }

    await this.rolesRepository.deleteRolePermissions(id);
    await this.rolesRepository.delete(id);
  }

  private async updateRolePermissions(
    roleId: number,
    permissions: string[],
  ): Promise<void> {
    await this.rolesRepository.deleteRolePermissions(roleId);

    if (permissions.length === 0) {
      return;
    }

    const parsedPermissions = permissions.map((permission) => {
      const [resource, action] = permission.split('.');
      if (!resource || !action) {
        throw new BadRequestException(
          `Invalid permission format: ${permission}. Expected "resource.action"`,
        );
      }
      return { resource, action };
    });

    const grants =
      await this.rolesRepository.findGrantsByResourceAndAction(
        parsedPermissions,
      );

    if (grants.length > 0) {
      const grantIds = grants.map((grant) => grant.id);
      await this.rolesRepository.createRolePermissions(roleId, grantIds);
    }
  }
}
