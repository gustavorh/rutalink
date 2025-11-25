import { ApiError } from "./client-api";

/**
 * Backend error response format from GlobalExceptionFilter
 */
interface BackendErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      statusCode?: number;
      [key: string]: unknown;
    };
  };
  timestamp: string;
}

/**
 * Extract error message from various error formats
 */
export function extractErrorMessage(error: unknown): string {
  // Handle ApiError from client-api
  if (error instanceof ApiError) {
    // Check if the error data matches backend error format
    if (error.data && typeof error.data === "object") {
      const errorData = error.data as Partial<BackendErrorResponse>;

      // Backend error format: { success: false, error: { code, message, details } }
      if (errorData.error && typeof errorData.error === "object") {
        const backendError = errorData.error as BackendErrorResponse["error"];
        if (backendError.message && typeof backendError.message === "string") {
          return backendError.message;
        }
      }

      // Fallback: check for message property directly (for other error formats)
      if ("message" in errorData && typeof errorData.message === "string") {
        return errorData.message;
      }
    }

    // Use the ApiError message (which might already contain the backend message)
    // Check if it's not just a generic HTTP error message
    if (error.message && !error.message.startsWith("HTTP ")) {
      return error.message;
    }

    // If it's a generic HTTP error, try to get a better message from data
    if (error.message) {
      return error.message;
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Default fallback
  return "Ha ocurrido un error inesperado";
}

/**
 * Get error code from backend error response
 */
export function extractErrorCode(error: unknown): string | undefined {
  if (
    error instanceof ApiError &&
    error.data &&
    typeof error.data === "object"
  ) {
    const errorData = error.data as Partial<BackendErrorResponse>;
    if (errorData.error && typeof errorData.error === "object") {
      const backendError = errorData.error as BackendErrorResponse["error"];
      return backendError.code;
    }
  }
  return undefined;
}
