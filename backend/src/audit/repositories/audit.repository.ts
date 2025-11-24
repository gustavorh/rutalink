import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { desc, eq, sql, SQL } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { QueryBuilder } from '../../common/query-builder/query-builder';
import {
  PaginationFactory,
  PaginatedResponse,
} from '../../common/pagination/pagination.factory';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { AuditLog } from '../../database/schema';

export interface AuditLogWithRelations {
  id: number;
  userId: number;
  operatorId: number;
  action: string;
  resource: string | null;
  resourceId: number | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  } | null;
  operator: {
    id: number;
    name: string;
  } | null;
}

export interface AuditLogFilter {
  userId?: number;
  operatorId?: number;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditRepository extends BaseRepository<AuditLog> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.auditLog);
  }

  async findByIdWithRelations(
    id: number,
  ): Promise<AuditLogWithRelations | null> {
    const [result] = await this.db
      .select({
        id: schema.auditLog.id,
        userId: schema.auditLog.userId,
        operatorId: schema.auditLog.operatorId,
        action: schema.auditLog.action,
        resource: schema.auditLog.resource,
        resourceId: schema.auditLog.resourceId,
        details: schema.auditLog.details,
        ipAddress: schema.auditLog.ipAddress,
        userAgent: schema.auditLog.userAgent,
        createdAt: schema.auditLog.createdAt,
        user: {
          id: schema.users.id,
          username: schema.users.username,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
        },
        operator: {
          id: schema.operators.id,
          name: schema.operators.name,
        },
      })
      .from(schema.auditLog)
      .leftJoin(schema.users, eq(schema.auditLog.userId, schema.users.id))
      .leftJoin(
        schema.operators,
        eq(schema.auditLog.operatorId, schema.operators.id),
      )
      .where(eq(schema.auditLog.id, id))
      .limit(1);

    if (!result) {
      return null;
    }

    return {
      ...result,
      user: result.user?.id ? result.user : null,
      operator: result.operator?.id ? result.operator : null,
    };
  }

  async findPaginatedWithRelations(
    filter: AuditLogFilter = {},
    page: number = 1,
    limit: number = 50,
  ): Promise<PaginatedResponse<AuditLogWithRelations>> {
    const whereClause = new QueryBuilder()
      .addEquals(schema.auditLog.userId, filter.userId)
      .addEquals(schema.auditLog.operatorId, filter.operatorId)
      .addEquals(schema.auditLog.resource, filter.resource)
      .addSearch([schema.auditLog.action], filter.action)
      .addDateRange(schema.auditLog.createdAt, filter.startDate, filter.endDate)
      .build();

    const offset = PaginationFactory.calculateOffset(page, limit);

    const [data, totalCount] = await Promise.all([
      this.db
        .select({
          id: schema.auditLog.id,
          userId: schema.auditLog.userId,
          operatorId: schema.auditLog.operatorId,
          action: schema.auditLog.action,
          resource: schema.auditLog.resource,
          resourceId: schema.auditLog.resourceId,
          details: schema.auditLog.details,
          ipAddress: schema.auditLog.ipAddress,
          userAgent: schema.auditLog.userAgent,
          createdAt: schema.auditLog.createdAt,
          user: {
            id: schema.users.id,
            username: schema.users.username,
            firstName: schema.users.firstName,
            lastName: schema.users.lastName,
          },
          operator: {
            id: schema.operators.id,
            name: schema.operators.name,
          },
        })
        .from(schema.auditLog)
        .leftJoin(schema.users, eq(schema.auditLog.userId, schema.users.id))
        .leftJoin(
          schema.operators,
          eq(schema.auditLog.operatorId, schema.operators.id),
        )
        .where(whereClause)
        .orderBy(desc(schema.auditLog.createdAt))
        .limit(limit)
        .offset(offset),
      this.countByWhere(whereClause),
    ]);

    const mappedData = data.map((item) => ({
      ...item,
      user: item.user?.id ? item.user : null,
      operator: item.operator?.id ? item.operator : null,
    }));

    return PaginationFactory.create(mappedData, totalCount, page, limit);
  }

  async findByUserIdWithRelations(
    userId: number,
    limit: number = 20,
  ): Promise<AuditLogWithRelations[]> {
    const data = await this.db
      .select({
        id: schema.auditLog.id,
        userId: schema.auditLog.userId,
        operatorId: schema.auditLog.operatorId,
        action: schema.auditLog.action,
        resource: schema.auditLog.resource,
        resourceId: schema.auditLog.resourceId,
        details: schema.auditLog.details,
        ipAddress: schema.auditLog.ipAddress,
        userAgent: schema.auditLog.userAgent,
        createdAt: schema.auditLog.createdAt,
        user: {
          id: schema.users.id,
          username: schema.users.username,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
        },
        operator: {
          id: schema.operators.id,
          name: schema.operators.name,
        },
      })
      .from(schema.auditLog)
      .leftJoin(schema.users, eq(schema.auditLog.userId, schema.users.id))
      .leftJoin(
        schema.operators,
        eq(schema.auditLog.operatorId, schema.operators.id),
      )
      .where(eq(schema.auditLog.userId, userId))
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(limit);

    return data.map((item) => ({
      ...item,
      user: item.user?.id ? item.user : null,
      operator: item.operator?.id ? item.operator : null,
    }));
  }

  private async countByWhere(whereClause?: SQL): Promise<number> {
    const query = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.auditLog);

    if (whereClause) {
      query.where(whereClause);
    }

    const [result] = await query;
    return Number(result.count);
  }
}
