import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sql, SQL, desc } from 'drizzle-orm';
import { BaseRepository } from '../../common/repositories/base.repository';
import { DATABASE } from '../../database/database.module';
import * as schema from '../../database/schema';
import { User, NewUser } from '../../database/schema';
import { QueryBuilder } from '../../common/query-builder/query-builder';
import {
  PaginationFactory,
  PaginatedResponse,
} from '../../common/pagination/pagination.factory';

/**
 * User with relations (operator and role)
 */
export interface UserWithRelations {
  id: number;
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  status: boolean;
  lastActivityAt: Date | null;
  operatorId: number;
  roleId: number;
  createdAt: Date;
  updatedAt: Date;
  operator?: {
    id: number;
    name: string;
    super?: boolean;
    status?: boolean;
  };
  role?: {
    id: number;
    name: string;
  };
}

/**
 * Users Repository
 *
 * Handles all data access operations for users.
 * Extends BaseRepository for common CRUD operations.
 */
@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(@Inject(DATABASE) db: MySql2Database<typeof schema>) {
    super(db, schema.users);
  }

  /**
   * Find user by ID with operator and role information
   */
  async findByIdWithRelations(
    id: number,
    operatorId?: number,
  ): Promise<UserWithRelations | null> {
    const conditions = operatorId
      ? and(eq(schema.users.id, id), eq(schema.users.operatorId, operatorId))
      : eq(schema.users.id, id);

    const [user] = await this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        email: schema.users.email,
        password: schema.users.password,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        operatorId: schema.users.operatorId,
        roleId: schema.users.roleId,
        status: schema.users.status,
        lastActivityAt: schema.users.lastActivityAt,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
        operator: {
          id: schema.operators.id,
          name: schema.operators.name,
          super: schema.operators.super,
          status: schema.operators.status,
        },
        role: {
          id: schema.roles.id,
          name: schema.roles.name,
        },
      })
      .from(schema.users)
      .leftJoin(
        schema.operators,
        eq(schema.users.operatorId, schema.operators.id),
      )
      .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(conditions)
      .limit(1);

    return (user as UserWithRelations) || null;
  }

  /**
   * Find user by email with relations
   */
  async findByEmailWithRelations(
    email: string,
  ): Promise<UserWithRelations | null> {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        email: schema.users.email,
        password: schema.users.password,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        operatorId: schema.users.operatorId,
        roleId: schema.users.roleId,
        status: schema.users.status,
        lastActivityAt: schema.users.lastActivityAt,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
        operator: {
          id: schema.operators.id,
          name: schema.operators.name,
          super: schema.operators.super,
          status: schema.operators.status,
        },
        role: {
          id: schema.roles.id,
          name: schema.roles.name,
        },
      })
      .from(schema.users)
      .leftJoin(
        schema.operators,
        eq(schema.users.operatorId, schema.operators.id),
      )
      .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(eq(schema.users.email, email))
      .limit(1);

    return (user as UserWithRelations) || null;
  }

  /**
   * Find user by username with relations
   */
  async findByUsernameWithRelations(
    username: string,
  ): Promise<UserWithRelations | null> {
    const [user] = await this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        email: schema.users.email,
        password: schema.users.password,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        operatorId: schema.users.operatorId,
        roleId: schema.users.roleId,
        status: schema.users.status,
        lastActivityAt: schema.users.lastActivityAt,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
        operator: {
          id: schema.operators.id,
          name: schema.operators.name,
          super: schema.operators.super,
          status: schema.operators.status,
        },
        role: {
          id: schema.roles.id,
          name: schema.roles.name,
        },
      })
      .from(schema.users)
      .leftJoin(
        schema.operators,
        eq(schema.users.operatorId, schema.operators.id),
      )
      .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
      .where(eq(schema.users.username, username))
      .limit(1);

    return (user as UserWithRelations) || null;
  }

  /**
   * Find user by email (without relations, for simple checks)
   */
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return (user as User) || null;
  }

  /**
   * Find user by username (without relations, for simple checks)
   */
  async findByUsername(username: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);
    return (user as User) || null;
  }

  /**
   * Find user by ID and operator (for tenant isolation)
   */
  async findByIdAndOperator(
    id: number,
    operatorId: number,
  ): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(
        and(eq(schema.users.id, id), eq(schema.users.operatorId, operatorId)),
      )
      .limit(1);
    return (user as User) || null;
  }

  /**
   * Check if username exists (excluding a specific user ID for updates)
   */
  async existsByUsernameExcludingId(
    username: string,
    excludeId: number,
  ): Promise<boolean> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.username, username),
          sql`${schema.users.id} != ${excludeId}`,
        ),
      )
      .limit(1);
    return user !== null;
  }

  /**
   * Check if email exists (excluding a specific user ID for updates)
   */
  async existsByEmailExcludingId(
    email: string,
    excludeId: number,
  ): Promise<boolean> {
    const [user] = await this.db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.email, email),
          sql`${schema.users.id} != ${excludeId}`,
        ),
      )
      .limit(1);
    return user !== null;
  }

  /**
   * Check if username exists
   */
  async existsByUsername(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return user !== null;
  }

  /**
   * Check if email exists
   */
  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  /**
   * Get paginated list of users with filters and relations
   */
  async findPaginatedWithRelations(params: {
    operatorId?: number;
    search?: string;
    roleId?: number;
    status?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<UserWithRelations>> {
    const { page = 1, limit = 10 } = PaginationFactory.normalizePagination({
      page: params.page,
      limit: params.limit,
    });
    const offset = PaginationFactory.calculateOffset(page, limit);

    // Build WHERE clause using QueryBuilder
    const whereClause = new QueryBuilder()
      .addEquals(schema.users.operatorId, params.operatorId)
      .addEquals(schema.users.roleId, params.roleId)
      .addEquals(schema.users.status, params.status)
      .addSearch(
        [
          schema.users.username,
          schema.users.email,
          schema.users.firstName,
          schema.users.lastName,
        ],
        params.search,
      )
      .build();

    // Execute queries in parallel for better performance
    const [users, totalCount] = await Promise.all([
      this.db
        .select({
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          status: schema.users.status,
          lastActivityAt: schema.users.lastActivityAt,
          operatorId: schema.users.operatorId,
          roleId: schema.users.roleId,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt,
          operator: {
            id: schema.operators.id,
            name: schema.operators.name,
          },
          role: {
            id: schema.roles.id,
            name: schema.roles.name,
          },
        })
        .from(schema.users)
        .leftJoin(
          schema.operators,
          eq(schema.users.operatorId, schema.operators.id),
        )
        .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
        .where(whereClause)
        .orderBy(desc(schema.users.createdAt))
        .limit(limit)
        .offset(offset),
      this.countByWhere(whereClause),
    ]);

    return PaginationFactory.create(
      users as UserWithRelations[],
      totalCount,
      page,
      limit,
    );
  }

  /**
   * Update user's last activity timestamp
   */
  async updateLastActivity(userId: number): Promise<void> {
    await this.db
      .update(schema.users)
      .set({ lastActivityAt: new Date() })
      .where(eq(schema.users.id, userId));
  }

  /**
   * Find operator by ID
   */
  async findOperatorById(id: number) {
    const [operator] = await this.db
      .select()
      .from(schema.operators)
      .where(eq(schema.operators.id, id))
      .limit(1);
    return operator || null;
  }

  /**
   * Find role by ID and operator (for validation)
   */
  async findRoleByIdAndOperator(roleId: number, operatorId: number) {
    const [role] = await this.db
      .select()
      .from(schema.roles)
      .where(
        and(
          eq(schema.roles.id, roleId),
          eq(schema.roles.operatorId, operatorId),
        ),
      )
      .limit(1);
    return role || null;
  }

  /**
   * Create user and return the created user with relations
   */
  async createWithRelations(
    userData: NewUser,
    userId: number,
  ): Promise<UserWithRelations> {
    const [insertedUser] = await this.db
      .insert(schema.users)
      .values({
        ...userData,
        createdBy: userId,
        updatedBy: userId,
      })
      .$returningId();

    const createdUser = await this.findByIdWithRelations(insertedUser.id);
    if (!createdUser) {
      throw new Error('Failed to retrieve created user');
    }
    return createdUser;
  }

  /**
   * Update user and return the updated user with relations
   */
  async updateWithRelations(
    id: number,
    userData: Partial<User>,
    userId: number,
    operatorId?: number,
  ): Promise<UserWithRelations> {
    const conditions = operatorId
      ? and(eq(schema.users.id, id), eq(schema.users.operatorId, operatorId))
      : eq(schema.users.id, id);

    await this.db
      .update(schema.users)
      .set({
        ...userData,
        updatedBy: userId,
      })
      .where(conditions);

    const updatedUser = await this.findByIdWithRelations(id, operatorId);
    if (!updatedUser) {
      throw new Error('Failed to retrieve updated user');
    }
    return updatedUser;
  }

  /**
   * Count records with custom WHERE clause
   */
  private async countByWhere(whereClause?: SQL): Promise<number> {
    const query = this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users);

    if (whereClause) {
      query.where(whereClause);
    }

    const [result] = await query;
    return Number(result.count);
  }
}
