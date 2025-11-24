import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql, SQL, count, desc } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { QueryBuilder } from '../../common/query-builder/query-builder';
import {
  PaginationFactory,
  PaginatedResponse,
} from '../../common/pagination/pagination.factory';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { Role, Grant, NewRoleGrant } from '../../database/schema';

export interface RoleWithOperator {
  id: number;
  name: string;
  operatorId: number;
  createdAt: Date;
  updatedAt: Date;
  operator: {
    id: number;
    name: string;
  } | null;
}

export interface RoleWithPermissions extends RoleWithOperator {
  permissions: string[];
}

export interface RoleFilter {
  operatorId?: number;
  search?: string;
}

@Injectable()
export class RolesRepository extends BaseRepository<Role> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.roles);
  }

  async findByIdWithOperator(
    id: number,
    operatorId?: number,
  ): Promise<RoleWithOperator | null> {
    const conditions = operatorId
      ? and(eq(schema.roles.id, id), eq(schema.roles.operatorId, operatorId))
      : eq(schema.roles.id, id);

    const [role] = await this.db
      .select({
        id: schema.roles.id,
        name: schema.roles.name,
        operatorId: schema.roles.operatorId,
        createdAt: schema.roles.createdAt,
        updatedAt: schema.roles.updatedAt,
        operator: {
          id: schema.operators.id,
          name: schema.operators.name,
        },
      })
      .from(schema.roles)
      .leftJoin(
        schema.operators,
        eq(schema.roles.operatorId, schema.operators.id),
      )
      .where(conditions)
      .limit(1);

    if (!role) {
      return null;
    }

    return {
      ...role,
      operator: role.operator?.id ? role.operator : null,
    };
  }

  async findPaginatedWithOperator(
    filter: RoleFilter = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<RoleWithOperator>> {
    const whereClause = new QueryBuilder()
      .addEquals(schema.roles.operatorId, filter.operatorId)
      .addSearch([schema.roles.name], filter.search)
      .build();

    const offset = PaginationFactory.calculateOffset(page, limit);

    const [data, totalCount] = await Promise.all([
      this.db
        .select({
          id: schema.roles.id,
          name: schema.roles.name,
          operatorId: schema.roles.operatorId,
          createdAt: schema.roles.createdAt,
          updatedAt: schema.roles.updatedAt,
          operator: {
            id: schema.operators.id,
            name: schema.operators.name,
          },
        })
        .from(schema.roles)
        .leftJoin(
          schema.operators,
          eq(schema.roles.operatorId, schema.operators.id),
        )
        .where(whereClause)
        .orderBy(desc(schema.roles.createdAt))
        .limit(limit)
        .offset(offset),
      this.countByWhere(whereClause),
    ]);

    const mappedData = data.map((item) => ({
      ...item,
      operator: item.operator?.id ? item.operator : null,
    }));

    return PaginationFactory.create(mappedData, totalCount, page, limit);
  }

  async findByNameAndOperator(
    name: string,
    operatorId: number,
  ): Promise<Role | null> {
    const [role] = await this.db
      .select()
      .from(schema.roles)
      .where(
        and(
          eq(schema.roles.name, name),
          eq(schema.roles.operatorId, operatorId),
        ),
      )
      .limit(1);

    return role || null;
  }

  async findByNameAndOperatorExcludingId(
    name: string,
    operatorId: number,
    excludeId: number,
  ): Promise<Role | null> {
    const [role] = await this.db
      .select()
      .from(schema.roles)
      .where(
        and(
          eq(schema.roles.name, name),
          eq(schema.roles.operatorId, operatorId),
          sql`${schema.roles.id} != ${excludeId}`,
        ),
      )
      .limit(1);

    return role || null;
  }

  async getUserCountByRoleId(roleId: number): Promise<number> {
    const [{ userCount }] = await this.db
      .select({ userCount: count() })
      .from(schema.users)
      .where(eq(schema.users.roleId, roleId));

    return Number(userCount);
  }

  async getActiveUserCountByRoleId(roleId: number): Promise<number> {
    const [{ activeCount }] = await this.db
      .select({ activeCount: count() })
      .from(schema.users)
      .where(
        and(eq(schema.users.roleId, roleId), eq(schema.users.status, true)),
      );

    return Number(activeCount);
  }

  async getRolePermissions(roleId: number): Promise<string[]> {
    const rolePermissions = await this.db
      .select({
        resource: schema.grants.resource,
        action: schema.grants.action,
      })
      .from(schema.roleGrants)
      .leftJoin(schema.grants, eq(schema.roleGrants.grantId, schema.grants.id))
      .where(eq(schema.roleGrants.roleId, roleId));

    return rolePermissions.map((p) => `${p.resource}.${p.action}`);
  }

  async deleteRolePermissions(roleId: number): Promise<void> {
    await this.db
      .delete(schema.roleGrants)
      .where(eq(schema.roleGrants.roleId, roleId));
  }

  async createRolePermissions(
    roleId: number,
    grantIds: number[],
  ): Promise<void> {
    if (grantIds.length === 0) {
      return;
    }

    const roleGrantsValues: NewRoleGrant[] = grantIds.map((grantId) => ({
      roleId,
      grantId,
    }));

    await this.db.insert(schema.roleGrants).values(roleGrantsValues);
  }

  async findGrantByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<Grant | null> {
    const [grant] = await this.db
      .select()
      .from(schema.grants)
      .where(
        and(
          eq(schema.grants.resource, resource),
          eq(schema.grants.action, action),
        ),
      )
      .limit(1);

    return grant || null;
  }

  async createGrant(resource: string, action: string): Promise<number> {
    const [result] = await this.db
      .insert(schema.grants)
      .values({ resource, action });
    return result.insertId;
  }

  async findGrantsByResourceAndAction(
    permissions: Array<{ resource: string; action: string }>,
  ): Promise<Grant[]> {
    if (permissions.length === 0) {
      return [];
    }

    const grants: Grant[] = [];
    for (const { resource, action } of permissions) {
      let grant = await this.findGrantByResourceAndAction(resource, action);
      if (!grant) {
        await this.createGrant(resource, action);
        grant = await this.findGrantByResourceAndAction(resource, action);
      }
      if (grant) {
        grants.push(grant);
      }
    }

    return grants;
  }

  async createRoleWithId(data: {
    name: string;
    operatorId: number;
  }): Promise<number> {
    const [result] = await this.db.insert(schema.roles).values(data);
    return result.insertId;
  }

  async updateRoleName(id: number, name: string): Promise<void> {
    await this.db
      .update(schema.roles)
      .set({ name })
      .where(eq(schema.roles.id, id));
  }

  private async countByWhere(whereClause?: SQL): Promise<number> {
    const query = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.roles);

    if (whereClause) {
      query.where(whereClause);
    }

    const [result] = await query;
    return Number(result.count);
  }
}
