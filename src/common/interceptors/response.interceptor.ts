import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ResponseInterceptor.name);

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Get action name from metadata or generate from method name
    const action = this.reflector.get<string>('action', handler) || 
                   this.generateActionName(handler.name);

    // Log request
    this.logRequest(action, request.body, request.params, request.query);

    return next.handle().pipe(
      map((data) => {
        this.logSuccess(action, data);
        return this.createSuccessResponse(this.getSuccessMessage(action), data);
      }),
      catchError((error) => {
        this.handleError(action, error, { 
          body: request.body, 
          params: request.params 
        });
        return throwError(() => error);
      }),
    );
  }

  private logRequest(action: string, body: any, params: any, query: any) {
    // Implement your logging logic
  }

  private logSuccess(action: string, data: any) {
    // Implement your success logging
  }

  private createSuccessResponse(message: string, data: any) {
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message,
      data,
    };
  }

  private handleError(action: string, error: any, context?: any) {
    this.logger.error(`Failed to ${action}:`, error.message);
    throw error; // Re-throw to maintain error flow
  }

  private generateActionName(methodName: string): string {
    // Convert camelCase to readable action names
    return methodName.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  }

  private getSuccessMessage(action: string): string {
    const actionMap = {
      'get events': 'Events retrieved successfully',
      'get event': 'Event retrieved successfully',
      'create event': 'Event created successfully',
      // Add more mappings as needed
    };
    return actionMap[action] || `${action} completed successfully`;
  }
}