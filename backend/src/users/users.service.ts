import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE } from '../database/database.module';
import { users, operators, roles, NewUser } from '../database/schema';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE) private db: MySql2Database) {}

  /**
   * Find all users with their operator and role information
   * Optionally filter by operatorId for tenant isolation
   */
  async findAll(operatorId?: number) {
    const query = this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        operatorId: users.operatorId,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        operator: {
          id: operators.id,
          name: operators.name,
          super: operators.super,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(users)
      .leftJoin(operators, eq(users.operatorId, operators.id))
      .leftJoin(roles, eq(users.roleId, roles.id));

    if (operatorId) {
      return query.where(eq(users.operatorId, operatorId));
    }

    return query;
  }

  /**
   * Find user by ID with operator and role information
   */
  async findById(id: number, operatorId?: number) {
    const conditions = operatorId
      ? and(eq(users.id, id), eq(users.operatorId, operatorId))
      : eq(users.id, id);

    const [user] = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        operatorId: users.operatorId,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        operator: {
          id: operators.id,
          name: operators.name,
          super: operators.super,
          status: operators.status,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(users)
      .leftJoin(operators, eq(users.operatorId, operators.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(conditions);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        operatorId: users.operatorId,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        operator: {
          id: operators.id,
          name: operators.name,
          super: operators.super,
          status: operators.status,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(users)
      .leftJoin(operators, eq(users.operatorId, operators.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, email));

    return user;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        firstName: users.firstName,
        lastName: users.lastName,
        operatorId: users.operatorId,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        operator: {
          id: operators.id,
          name: operators.name,
          super: operators.super,
          status: operators.status,
        },
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(users)
      .leftJoin(operators, eq(users.operatorId, operators.id))
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.username, username));

    return user;
  }

  /**
   * Create a new user with operator and role validation
   */
  async create(newUser: NewUser) {
    // Validate operator exists and is active
    const [operator] = await this.db
      .select()
      .from(operators)
      .where(eq(operators.id, newUser.operatorId));

    if (!operator) {
      throw new BadRequestException(
        `Operator with ID ${newUser.operatorId} not found`,
      );
    }

    if (!operator.status) {
      throw new BadRequestException(
        `Operator with ID ${newUser.operatorId} is inactive`,
      );
    }

    // Validate role exists and belongs to the operator
    const [role] = await this.db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.id, newUser.roleId),
          eq(roles.operatorId, newUser.operatorId),
        ),
      );

    if (!role) {
      throw new BadRequestException(
        `Role with ID ${newUser.roleId} not found for operator ${newUser.operatorId}`,
      );
    }

    const [insertedUser] = await this.db
      .insert(users)
      .values(newUser)
      .$returningId();

    return this.findById(insertedUser.id);
  }

  /**
   * Update user with tenant isolation
   */
  async update(id: number, userData: Partial<NewUser>, operatorId?: number) {
    // Check if user exists and belongs to operator (if provided)
    const existingUser = await this.findById(id, operatorId);

    // If roleId is being updated, validate it belongs to the user's operator
    if (userData.roleId) {
      const [role] = await this.db
        .select()
        .from(roles)
        .where(
          and(
            eq(roles.id, userData.roleId),
            eq(roles.operatorId, existingUser.operatorId),
          ),
        );

      if (!role) {
        throw new BadRequestException(
          `Role with ID ${userData.roleId} not found for operator ${existingUser.operatorId}`,
        );
      }
    }

    // Prevent changing operatorId (users can't switch operators)
    if (
      userData.operatorId &&
      userData.operatorId !== existingUser.operatorId
    ) {
      throw new ForbiddenException('Cannot change user operator');
    }

    const conditions = operatorId
      ? and(eq(users.id, id), eq(users.operatorId, operatorId))
      : eq(users.id, id);

    await this.db.update(users).set(userData).where(conditions);

    return this.findById(id, operatorId);
  }

  /**
   * Delete user with tenant isolation
   */
  async delete(id: number, operatorId?: number): Promise<void> {
    // Check if user exists and belongs to operator
    await this.findById(id, operatorId);

    const conditions = operatorId
      ? and(eq(users.id, id), eq(users.operatorId, operatorId))
      : eq(users.id, id);

    await this.db.delete(users).where(conditions);
  }

  /**
   * Update user's last activity timestamp
   */
  async updateLastActivity(userId: number): Promise<void> {
    await this.db
      .update(users)
      .set({ lastActivityAt: new Date() })
      .where(eq(users.id, userId));
  }
}
