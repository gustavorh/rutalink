import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateClientDto,
  UpdateClientDto,
  ClientQueryDto,
  ClientOperationsQueryDto,
} from './dto/client.dto';
import { ClientsRepository } from './repositories/clients.repository';
import { OperationsRepository } from '../operations/repositories/operations.repository';

@Injectable()
export class ClientsService {
  constructor(
    private clientsRepository: ClientsRepository,
    private operationsRepository: OperationsRepository,
  ) {}

  // ============================================================================
  // CLIENTS CRUD
  // ============================================================================

  /**
   * Crear un nuevo cliente
   */
  async createClient(createClientDto: CreateClientDto, userId: number) {
    // Verificar que el operador existe
    const operator = await this.clientsRepository.findOperatorById(
      createClientDto.operatorId,
    );

    if (!operator) {
      throw new NotFoundException(
        `Operator with ID ${createClientDto.operatorId} not found`,
      );
    }

    // Verificar que el nombre comercial/razón social no esté duplicado en el mismo operador
    const existingClient = await this.clientsRepository.findByBusinessName(
      createClientDto.operatorId,
      createClientDto.businessName,
    );

    if (existingClient) {
      throw new ConflictException(
        `Client with business name "${createClientDto.businessName}" already exists for this operator`,
      );
    }

    // Si hay taxId, verificar que no esté duplicado
    if (createClientDto.taxId) {
      const existingTaxId = await this.clientsRepository.findByTaxId(
        createClientDto.operatorId,
        createClientDto.taxId,
      );

      if (existingTaxId) {
        throw new ConflictException(
          `Client with Tax ID ${createClientDto.taxId} already exists for this operator`,
        );
      }
    }

    // Create client using repository
    const clientId = await this.clientsRepository.create(
      createClientDto,
      userId,
    );

    return this.getClientById(clientId);
  }

  /**
   * Obtener lista de clientes con filtros y paginación
   */
  async getClients(query: ClientQueryDto) {
    const {
      operatorId,
      search,
      status,
      industry,
      city,
      region,
      page = 1,
      limit = 10,
    } = query;

    // Use repository's findPaginated method with QueryBuilder
    return this.clientsRepository.findPaginated(
      operatorId,
      search,
      status,
      industry,
      city,
      region,
      page,
      limit,
    );
  }

  /**
   * Obtener un cliente por ID
   */
  async getClientById(id: number) {
    const client = await this.clientsRepository.findById(id);

    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return client;
  }

  /**
   * Actualizar un cliente
   */
  async updateClient(
    id: number,
    updateClientDto: UpdateClientDto,
    userId: number,
  ) {
    const client = await this.getClientById(id);

    // Si se actualiza el nombre comercial, verificar que no esté duplicado
    if (updateClientDto.businessName) {
      const existingClient = await this.clientsRepository.findByBusinessName(
        client.operatorId,
        updateClientDto.businessName,
      );

      if (existingClient && existingClient.id !== id) {
        throw new ConflictException(
          `Client with business name "${updateClientDto.businessName}" already exists`,
        );
      }
    }

    // Si se actualiza el taxId, verificar que no esté duplicado
    if (updateClientDto.taxId) {
      const existingTaxId = await this.clientsRepository.findByTaxId(
        client.operatorId,
        updateClientDto.taxId,
      );

      if (existingTaxId && existingTaxId.id !== id) {
        throw new ConflictException(
          `Client with Tax ID ${updateClientDto.taxId} already exists`,
        );
      }
    }

    // Update using repository
    await this.clientsRepository.update(id, updateClientDto, userId);

    return this.getClientById(id);
  }

  /**
   * Eliminar un cliente (soft delete - cambiar status a false)
   */
  async deleteClient(id: number, userId: number) {
    await this.getClientById(id);

    // Verificar que no tenga operaciones activas o programadas
    const hasActiveOperations =
      await this.operationsRepository.hasActiveOperations(id);

    if (hasActiveOperations) {
      throw new BadRequestException(
        'Cannot delete client with active or scheduled operations. Consider deactivating instead.',
      );
    }

    // Soft delete - cambiar status a false using repository
    await this.clientsRepository.update(
      id,
      { status: false } as Partial<{ status: boolean }>,
      userId,
    );

    return { message: 'Client deactivated successfully' };
  }

  /**
   * Eliminar permanentemente un cliente
   */
  async permanentlyDeleteClient(id: number) {
    await this.getClientById(id);

    // Verificar que no tenga operaciones asociadas
    const hasOperations = await this.operationsRepository.hasAnyOperations(id);

    if (hasOperations) {
      throw new BadRequestException(
        'Cannot permanently delete client with associated operations',
      );
    }

    // Delete using repository
    await this.clientsRepository.delete(id);

    return { message: 'Client permanently deleted successfully' };
  }

  // ============================================================================
  // CLIENT OPERATIONS HISTORY
  // ============================================================================

  /**
   * Obtener historial completo de operaciones de un cliente
   */
  async getClientOperations(clientId: number, query: ClientOperationsQueryDto) {
    await this.getClientById(clientId);

    const {
      status,
      operationType,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = query;

    // Use repository method
    return this.operationsRepository.findPaginatedByClient(
      clientId,
      status,
      operationType,
      startDate,
      endDate,
      page,
      limit,
    );
  }

  /**
   * Obtener estadísticas de un cliente
   */
  async getClientStatistics(clientId: number) {
    await this.getClientById(clientId);

    return this.operationsRepository.getClientStatistics(clientId);
  }

  /**
   * Obtener las operaciones más recientes de un cliente
   */
  async getRecentClientOperations(clientId: number, limit: number = 5) {
    await this.getClientById(clientId);

    return this.operationsRepository.findRecentByClient(clientId, limit);
  }

  // ============================================================================
  // ANALYTICS & REPORTS
  // ============================================================================

  /**
   * Obtener análisis por rubro (industry)
   */
  async getClientsByIndustry(operatorId?: number) {
    return this.clientsRepository.getClientsByIndustryStats(operatorId);
  }

  /**
   * Obtener clientes con más operaciones
   */
  async getTopClientsByOperations(operatorId?: number, limit: number = 10) {
    return this.operationsRepository.findTopClientsByOperations(
      operatorId,
      limit,
    );
  }
}
