import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SKIP_ENVELOPE_METADATA_KEY } from '@/common/decorators/skip-envelope.decorator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skipEnvelope = this.reflector.getAllAndOverride<boolean>(
      SKIP_ENVELOPE_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipEnvelope) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();

    // Get action name from ApiOperation
    const { action } = this.extractSwaggerMetadata(handler);

    // Log request
    this.logRequest(action, request.body, request.params, request.query);

    return next.handle().pipe(
      map((data) => {
        // Pass streamed / manually-sent (@Res()) responses through untouched
        if (data instanceof StreamableFile || response?.headersSent) {
          return data;
        }

        this.logSuccess(action, data);
        return this.createSuccessResponse(data, response?.statusCode);
      }),
      catchError((error) => {
        this.handleError(action, error, {
          body: request.body,
          params: request.params,
        });
        return throwError(() => error);
      }),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private extractSwaggerMetadata(handler: Function) {
    // Get ApiOperation metadata
    const apiOperation = this.reflector.get('swagger/apiOperation', handler);

    // Use summary as action (for logging only — the envelope carries no
    // machine-generated message; user-facing text is the client's job)
    const action =
      apiOperation?.summary || this.generateActionName(handler.name);

    return { action };
  }

  private logRequest(action: string, body: any, params: any, query: any) {
    // Log with different levels based on content sensitivity
    if (this.hasSensitiveData(body)) {
      this.logger.log(
        `[REQUEST] ${action} - Request received (body hidden for security)`,
      );
    } else {
      this.logger.log(`[REQUEST] ${action}`, {
        body: body || 'empty',
        params: params || 'none',
        query: query || 'none',
      });
    }
  }

  private logSuccess(action: string, data: any) {
    // Log success with data size info instead of full data for performance
    const dataInfo = this.getDataInfo(data);
    this.logger.log(`[SUCCESS] ${action} - ${dataInfo}`);
  }

  private logError(action: string, error: any, context?: any) {
    // Try to extract detailed response from common Nest exceptions (e.g., BadRequestException)
    let responseDetails: any = null;
    try {
      if (error && typeof error.getResponse === 'function') {
        responseDetails = error.getResponse();
      } else if (error && error.response) {
        responseDetails = error.response;
      }
    } catch (_e) {
      // ignore extraction errors
    }

    const detailsForLog =
      (responseDetails && (responseDetails.message || responseDetails)) ||
      error.message ||
      error;

    // Primary error log (include stack if available)
    this.logger.error(
      `[ERROR] Failed to ${action}: ${typeof detailsForLog === 'string' ? detailsForLog : JSON.stringify(detailsForLog)}`,
      error?.stack,
    );

    // Log extracted response details at debug level so we can see validation arrays/objects
    if (responseDetails) {
      this.logger.debug(`[ERROR RESPONSE] ${action}`, responseDetails);
    }

    // Log context separately if available
    if (context) {
      this.logger.debug(`[ERROR CONTEXT] ${action}`, context);
    }
  }

  private createSuccessResponse(data: any, statusCode?: number) {
    return {
      success: true,
      statusCode: statusCode ?? HttpStatus.OK,
      data,
    };
  }

  private handleError(action: string, error: any, context?: any) {
    this.logError(action, error, context);
    throw error;
  }

  private generateActionName(methodName: string): string {
    return methodName
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .trim();
  }

  // Field-name match (not substring-of-the-whole-body, which hid any payload
  // containing "queryKey", "monkey", etc. from the request logs)
  private static readonly SENSITIVE_KEYS = new Set([
    'password',
    'token',
    'accesstoken',
    'refreshtoken',
    'secret',
    'key',
    'apikey',
    'privatekey',
    'credentials',
    'authorization',
  ]);

  private hasSensitiveData(body: any, depth = 0): boolean {
    if (depth > 4 || !body || typeof body !== 'object') return false;

    if (Array.isArray(body)) {
      return body.some((item) => this.hasSensitiveData(item, depth + 1));
    }

    return Object.entries(body).some(
      ([key, value]) =>
        ResponseInterceptor.SENSITIVE_KEYS.has(
          key.toLowerCase().replace(/[_-]/g, ''),
        ) || this.hasSensitiveData(value, depth + 1),
    );
  }

  private getDataInfo(data: any): string {
    if (data === null || data === undefined) return 'No data';
    if (Array.isArray(data)) return `Array with ${data.length} items`;
    if (typeof data === 'object')
      return `Object with ${Object.keys(data).length} properties`;
    if (typeof data === 'string') return `String (${data.length} chars)`;
    return `${typeof data} value`;
  }
}
