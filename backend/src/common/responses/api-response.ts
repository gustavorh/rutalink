import { PaginationMeta } from '../pagination/pagination.factory';

/**
 * Standard API success response structure
 */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

/**
 * Paginated API response structure
 */
export interface PaginatedApiResponse<T> {
  success: true;
  data: {
    items: T[];
    pagination: PaginationMeta;
  };
  message?: string;
  timestamp: string;
}

/**
 * Response Builder
 * Provides static methods to create standardized API responses
 */
export class ResponseBuilder {
  /**
   * Create a successful response
   */
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    items: T[],
    pagination: PaginationMeta,
    message?: string,
  ): PaginatedApiResponse<T> {
    return {
      success: true,
      data: {
        items,
        pagination,
      },
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create an error response
   */
  static error(
    code: string,
    message: string,
    details?: unknown,
  ): ApiErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
