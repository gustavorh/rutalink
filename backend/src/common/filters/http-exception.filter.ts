import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorResponse } from '../responses/api-response';

// Static file patterns that shouldn't be logged as errors (browser auto-requests)
const SILENT_404_PATTERNS = [
  /^\/favicon\.ico$/,
  /^\/apple-touch-icon/,
  /^\/site\.webmanifest$/,
];

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<{ url?: string }>();
    const response = ctx.getResponse<Response>();

    const { status, errorResponse } = this.getErrorDetails(exception);

    // Skip logging for expected browser 404s (favicon, etc.)
    const shouldLog = !this.isSilent404(status, request.url);

    if (shouldLog) {
      this.logger.error(
        `Exception: ${JSON.stringify(errorResponse)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(errorResponse);
  }

  private isSilent404(status: number, url?: string): boolean {
    if (status !== 404 || !url) return false;
    return SILENT_404_PATTERNS.some((pattern) => pattern.test(url));
  }

  private getErrorDetails(exception: unknown): {
    status: number;
    errorResponse: ApiErrorResponse;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Handle string responses
      if (typeof exceptionResponse === 'string') {
        return {
          status,
          errorResponse: {
            success: false,
            error: {
              code: this.getErrorCode(status),
              message: exceptionResponse,
            },
            timestamp: new Date().toISOString(),
          },
        };
      }

      // Handle object responses
      const responseObj = exceptionResponse as {
        message?: string | string[];
        error?: string;
        [key: string]: unknown;
      };

      // Extract message - could be string or array
      let message: string;
      if (Array.isArray(responseObj.message)) {
        message = responseObj.message.join(', ');
      } else {
        message =
          responseObj.message || responseObj.error || 'An error occurred';
      }

      return {
        status,
        errorResponse: {
          success: false,
          error: {
            code: this.getErrorCode(status),
            message,
            details:
              Object.keys(responseObj).length > 1
                ? { ...responseObj, message: undefined, error: undefined }
                : undefined,
          },
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Handle unknown errors
    const error =
      exception instanceof Error
        ? exception.message
        : 'An unexpected error occurred';
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(`Unhandled exception: ${error}`, stack);

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorResponse: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        timestamp: new Date().toISOString(),
      },
    };
  }

  private getErrorCode(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
    };
    return codeMap[status] || 'UNKNOWN_ERROR';
  }
}
