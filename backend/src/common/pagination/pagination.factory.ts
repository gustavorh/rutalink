/**
 * Pagination Types and Factory
 *
 * Standardizes pagination responses across the application.
 * Eliminates code duplication in pagination logic.
 */

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Standard paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Factory for creating paginated responses
 *
 * @example
 * const response = PaginationFactory.create(
 *   clients,
 *   totalCount,
 *   page,
 *   limit
 * );
 */
export class PaginationFactory {
  /**
   * Default page size if not specified
   */
  static readonly DEFAULT_LIMIT = 10;

  /**
   * Maximum allowed page size (prevents performance issues)
   */
  static readonly MAX_LIMIT = 100;

  /**
   * Create a paginated response
   *
   * @param data Array of data items for the current page
   * @param total Total number of items across all pages
   * @param page Current page number (1-indexed)
   * @param limit Number of items per page
   * @returns Paginated response with data and metadata
   */
  static create<T>(
    data: T[],
    total: number,
    page: number = 1,
    limit: number = this.DEFAULT_LIMIT,
  ): PaginatedResponse<T> {
    // Ensure page is at least 1
    const validPage = Math.max(1, page);

    // Ensure limit is within bounds
    const validLimit = Math.min(Math.max(1, limit), this.MAX_LIMIT);

    // Calculate total pages
    const totalPages = Math.ceil(total / validLimit);

    return {
      data,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: totalPages || 0,
      },
    };
  }

  /**
   * Calculate offset for SQL queries
   *
   * @param page Current page number (1-indexed)
   * @param limit Number of items per page
   * @returns Offset for SQL LIMIT clause
   */
  static calculateOffset(
    page: number = 1,
    limit: number = this.DEFAULT_LIMIT,
  ): number {
    const validPage = Math.max(1, page);
    const validLimit = Math.max(1, limit);
    return (validPage - 1) * validLimit;
  }

  /**
   * Normalize pagination parameters
   * Applies defaults and validates values
   *
   * @param params Pagination parameters from request
   * @returns Normalized pagination parameters
   */
  static normalizePagination(
    params: PaginationParams,
  ): Required<PaginationParams> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(
      Math.max(1, params.limit || this.DEFAULT_LIMIT),
      this.MAX_LIMIT,
    );

    return { page, limit };
  }

  /**
   * Create an empty paginated response (useful for empty results)
   */
  static createEmpty<T>(): PaginatedResponse<T> {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: this.DEFAULT_LIMIT,
        total: 0,
        totalPages: 0,
      },
    };
  }
}
