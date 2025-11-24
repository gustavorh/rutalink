import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { NewOperator } from '../database/schema';
import { OperatorsRepository } from './repositories/operators.repository';

/**
 * Operators Service
 *
 * Handles business logic for operator operations.
 * Delegates data access to OperatorsRepository following the Repository Pattern.
 */
@Injectable()
export class OperatorsService {
  constructor(private readonly operatorsRepository: OperatorsRepository) {}

  /**
   * Find all operators with filtering and pagination
   */
  async findAll(params: {
    search?: string;
    status?: boolean;
    super?: boolean;
    page?: number;
    limit?: number;
  }) {
    return this.operatorsRepository.findPaginated(params);
  }

  /**
   * Find operator by ID
   */
  async findById(id: number) {
    const operator = await this.operatorsRepository.findById(id);

    if (!operator) {
      throw new NotFoundException(`Operator with ID ${id} not found`);
    }

    return operator;
  }

  /**
   * Create a new operator
   */
  async create(operatorData: NewOperator, userId: number = 0) {
    // Check if RUT already exists (if provided)
    if (operatorData.rut) {
      if (await this.operatorsRepository.existsByRut(operatorData.rut)) {
        throw new BadRequestException(
          `Operator with RUT ${operatorData.rut} already exists`,
        );
      }
    }

    return this.operatorsRepository.createOperator(operatorData, userId);
  }

  /**
   * Update operator
   */
  async update(
    id: number,
    operatorData: Partial<NewOperator>,
    userId: number = 0,
  ) {
    const existingOperator = await this.findById(id);

    // If updating RUT, check for duplicates
    if (operatorData.rut && operatorData.rut !== existingOperator.rut) {
      if (
        await this.operatorsRepository.existsByRutExcludingId(
          operatorData.rut,
          id,
        )
      ) {
        throw new BadRequestException(
          `Operator with RUT ${operatorData.rut} already exists`,
        );
      }
    }

    return this.operatorsRepository.updateOperator(id, operatorData, userId);
  }

  /**
   * Delete operator (soft delete by setting status to false)
   */
  async delete(id: number): Promise<void> {
    // Check if operator exists
    await this.findById(id);

    // Check if operator has active users
    const activeUsersCount =
      await this.operatorsRepository.countActiveUsers(id);

    if (activeUsersCount > 0) {
      throw new BadRequestException(
        `Cannot delete operator with ${activeUsersCount} active users. Please deactivate users first.`,
      );
    }

    // Soft delete by setting status to false
    await this.operatorsRepository.softDelete(id);
  }

  /**
   * Get operator statistics
   */
  async getStatistics(id: number) {
    // Verify operator exists
    await this.findById(id);

    return this.operatorsRepository.getOperatorStatistics(id);
  }
}
