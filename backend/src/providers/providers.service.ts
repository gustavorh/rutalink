import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateProviderDto,
  UpdateProviderDto,
  ProviderQueryDto,
} from './dto/provider.dto';
import { ProvidersRepository } from './repositories/providers.repository';

/**
 * Providers Service
 *
 * Handles business logic for provider operations.
 * Delegates data access to ProvidersRepository following the Repository Pattern.
 */
@Injectable()
export class ProvidersService {
  constructor(private readonly providersRepository: ProvidersRepository) {}

  // ============================================================================
  // PROVIDERS CRUD
  // ============================================================================

  async createProvider(createProviderDto: CreateProviderDto, userId: number) {
    // Verificar que el operador existe
    const operator = await this.providersRepository.findOperatorById(
      createProviderDto.operatorId,
    );

    if (!operator) {
      throw new NotFoundException(
        `Operator with ID ${createProviderDto.operatorId} not found`,
      );
    }

    // Verificar que el taxId no esté duplicado en el mismo operador (si se proporciona)
    if (createProviderDto.taxId) {
      if (
        await this.providersRepository.existsByTaxId(
          createProviderDto.taxId,
          createProviderDto.operatorId,
        )
      ) {
        throw new ConflictException(
          `Provider with tax ID ${createProviderDto.taxId} already exists for this operator`,
        );
      }
    }

    const newProvider = await this.providersRepository.createProvider(
      createProviderDto,
      userId,
    );

    return this.getProviderById(newProvider.id);
  }

  async getProviders(query: ProviderQueryDto) {
    return this.providersRepository.findPaginated({
      operatorId: query.operatorId,
      search: query.search,
      status: query.status,
      businessType: query.businessType,
      minRating: query.minRating,
      page: query.page,
      limit: query.limit,
    });
  }

  async getProviderById(id: number) {
    const provider = await this.providersRepository.findById(id);

    if (!provider) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    return provider;
  }

  async updateProvider(
    id: number,
    updateProviderDto: UpdateProviderDto,
    userId: number,
  ) {
    const existingProvider = await this.getProviderById(id);

    // Si se actualiza el taxId, verificar que no exista otro con el mismo
    if (
      updateProviderDto.taxId &&
      updateProviderDto.taxId !== existingProvider.taxId
    ) {
      if (
        await this.providersRepository.existsByTaxIdExcludingId(
          updateProviderDto.taxId,
          existingProvider.operatorId,
          id,
        )
      ) {
        throw new ConflictException(
          `Another provider with tax ID ${updateProviderDto.taxId} already exists for this operator`,
        );
      }
    }

    return this.providersRepository.updateProvider(
      id,
      updateProviderDto,
      userId,
    );
  }

  async deleteProvider(id: number) {
    await this.getProviderById(id);

    // Verificar que no tenga operaciones asociadas
    const operationsCount =
      await this.providersRepository.countOperationsByProvider(id);

    if (operationsCount > 0) {
      throw new BadRequestException(
        'Cannot delete provider with associated operations',
      );
    }

    await this.providersRepository.delete(id);

    return { message: 'Provider deleted successfully' };
  }

  // ============================================================================
  // PROVIDER STATISTICS
  // ============================================================================

  async getProviderStatistics(id: number) {
    await this.getProviderById(id);

    return this.providersRepository.getProviderStatistics(id);
  }

  async getProviderOperations(
    id: number,
    page: number = 1,
    limit: number = 10,
  ) {
    await this.getProviderById(id);

    return this.providersRepository.findProviderOperationsPaginated(
      id,
      page,
      limit,
    );
  }
}
