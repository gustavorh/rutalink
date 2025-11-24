import { Injectable } from '@nestjs/common';
import {
  AuditRepository,
  AuditLogFilter,
  AuditLogWithRelations,
} from './repositories/audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async findAll(
    filter: AuditLogFilter & { page?: number; limit?: number } = {},
  ): Promise<{
    data: AuditLogWithRelations[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 50;

    const { userId, operatorId, action, resource, startDate, endDate } = filter;

    const result = await this.auditRepository.findPaginatedWithRelations(
      {
        userId,
        operatorId,
        action,
        resource,
        startDate,
        endDate,
      },
      page,
      limit,
    );

    return {
      data: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      limit: result.pagination.limit,
    };
  }

  async findById(id: number): Promise<AuditLogWithRelations | null> {
    return this.auditRepository.findByIdWithRelations(id);
  }

  async getUserActivity(
    userId: number,
    limit = 20,
  ): Promise<AuditLogWithRelations[]> {
    return this.auditRepository.findByUserIdWithRelations(userId, limit);
  }
}
