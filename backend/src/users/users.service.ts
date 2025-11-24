import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { NewUser } from '../database/schema';
import { UsersRepository } from './repositories/users.repository';

/**
 * Users Service
 *
 * Handles business logic for user operations.
 * Delegates data access to UsersRepository following the Repository Pattern.
 * Follows SOLID principles by separating business logic from data access.
 */
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Find all users with their operator and role information
   * Optionally filter by operatorId for tenant isolation
   */
  async findAll(params: {
    operatorId?: number;
    search?: string;
    roleId?: number;
    status?: boolean;
    page?: number;
    limit?: number;
  }) {
    return this.usersRepository.findPaginatedWithRelations(params);
  }

  /**
   * Find user by ID with operator and role information
   */
  async findById(id: number, operatorId?: number) {
    const user = await this.usersRepository.findByIdWithRelations(
      id,
      operatorId,
    );

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return this.usersRepository.findByEmailWithRelations(email);
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string) {
    return this.usersRepository.findByUsernameWithRelations(username);
  }

  /**
   * Create a new user with operator and role validation
   */
  async create(newUser: NewUser, userId: number = 0) {
    // Validate operator exists and is active
    const operator = await this.usersRepository.findOperatorById(
      newUser.operatorId,
    );

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
    const role = await this.usersRepository.findRoleByIdAndOperator(
      newUser.roleId,
      newUser.operatorId,
    );

    if (!role) {
      throw new BadRequestException(
        `Role with ID ${newUser.roleId} not found for operator ${newUser.operatorId}`,
      );
    }

    // Check if username already exists
    if (await this.usersRepository.existsByUsername(newUser.username)) {
      throw new BadRequestException(
        `Username "${newUser.username}" already exists`,
      );
    }

    // Check if email already exists
    if (await this.usersRepository.existsByEmail(newUser.email)) {
      throw new BadRequestException(`Email "${newUser.email}" already exists`);
    }

    return this.usersRepository.createWithRelations(newUser, userId);
  }

  /**
   * Update user with tenant isolation
   */
  async update(
    id: number,
    userData: Partial<NewUser>,
    operatorId?: number,
    userId: number = 0,
  ) {
    // Check if user exists and belongs to operator (if provided)
    const existingUser = await this.findById(id, operatorId);

    // If roleId is being updated, validate it belongs to the user's operator
    if (userData.roleId) {
      const role = await this.usersRepository.findRoleByIdAndOperator(
        userData.roleId,
        existingUser.operatorId,
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

    // Check for username conflicts if username is being updated
    if (userData.username && userData.username !== existingUser.username) {
      if (
        await this.usersRepository.existsByUsernameExcludingId(
          userData.username,
          id,
        )
      ) {
        throw new BadRequestException(
          `Username "${userData.username}" already exists`,
        );
      }
    }

    // Check for email conflicts if email is being updated
    if (userData.email && userData.email !== existingUser.email) {
      if (
        await this.usersRepository.existsByEmailExcludingId(userData.email, id)
      ) {
        throw new BadRequestException(
          `Email "${userData.email}" already exists`,
        );
      }
    }

    return this.usersRepository.updateWithRelations(
      id,
      userData,
      userId,
      operatorId,
    );
  }

  /**
   * Delete user with tenant isolation
   */
  async delete(id: number, operatorId?: number): Promise<void> {
    // Check if user exists and belongs to operator
    await this.findById(id, operatorId);

    // Use repository's delete method
    if (operatorId) {
      // Verify user belongs to operator before deleting
      const user = await this.usersRepository.findByIdAndOperator(
        id,
        operatorId,
      );
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
    }

    await this.usersRepository.delete(id);
  }

  /**
   * Update user's last activity timestamp
   */
  async updateLastActivity(userId: number): Promise<void> {
    await this.usersRepository.updateLastActivity(userId);
  }
}
