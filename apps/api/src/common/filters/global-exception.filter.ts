import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}

function isDuplicateEntryError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as Record<string, unknown>;
  // MySQL2 native error
  if (e['code'] === 'ER_DUP_ENTRY') return true;
  // Fallback: message-based check (covers TypeORM/Drizzle wrappers)
  if (
    typeof e['message'] === 'string' &&
    e['message'].includes('Duplicate entry')
  )
    return true;
  return false;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const body = this.resolveErrorBody(exception, request);

    if (body.statusCode >= 500) {
      this.logger.error(
        {
          err:
            exception instanceof Error
              ? { message: exception.message, stack: exception.stack }
              : exception,
          path: request.url,
          method: request.method,
        },
        'Unhandled exception',
      );
    }

    response.status(body.statusCode).json(body);
  }

  private resolveErrorBody(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    const timestamp = new Date().toISOString();
    const path = request.url;

    if (isDuplicateEntryError(exception)) {
      return {
        statusCode: 409,
        error: 'CONFLICT',
        message: 'Duplicate entry',
        timestamp,
        path,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();

      let errorCode = 'HTTP_EXCEPTION';
      let message = exception.message;

      if (typeof raw === 'object' && raw !== null) {
        const body = raw as Record<string, unknown>;
        if (typeof body['errorCode'] === 'string')
          errorCode = body['errorCode'];
        // ValidationPipe returns { message: string[] } — join into a single string
        if (Array.isArray(body['message'])) {
          message = (body['message'] as string[]).join('; ');
        } else if (typeof body['message'] === 'string') {
          message = body['message'];
        }
      } else if (typeof raw === 'string') {
        message = raw;
      }

      return { statusCode: status, error: errorCode, message, timestamp, path };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp,
      path,
    };
  }
}
