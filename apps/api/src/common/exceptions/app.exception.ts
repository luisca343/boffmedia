import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(
    public readonly errorCode: string,
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super({ errorCode, message }, statusCode);
  }
}

export class NotFoundException extends AppException {
  constructor(resource: string, id?: string | number) {
    super(
      'NOT_FOUND',
      id !== undefined
        ? `${resource} with id ${String(id)} not found`
        : `${resource} not found`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ConflictException extends AppException {
  constructor(message: string) {
    super('CONFLICT', message, HttpStatus.CONFLICT);
  }
}

export class ForbiddenException extends AppException {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, HttpStatus.FORBIDDEN);
  }
}

export class UnauthorizedException extends AppException {
  constructor(message = 'Authentication required') {
    super('UNAUTHORIZED', message, HttpStatus.UNAUTHORIZED);
  }
}

export class ValidationException extends AppException {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, HttpStatus.BAD_REQUEST);
  }
}

export class InsufficientFundsException extends AppException {
  constructor(requested: number, available: number) {
    super(
      'INSUFFICIENT_FUNDS',
      `Cannot transfer ${requested} — balance is ${available}`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class CapacityExceededException extends AppException {
  constructor(resource: string) {
    super(
      'CAPACITY_EXCEEDED',
      `${resource} is at maximum capacity`,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
