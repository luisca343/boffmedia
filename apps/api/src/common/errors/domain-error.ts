import { ApiErrorCode, API_ERROR_FALLBACK_ES } from './error-codes.generated';

/**
 * Base class for domain errors. Represents a business logic error, decoupled from HTTP.
 * GlobalExceptionFilter converts these to HTTP responses using the error code,
 * producing the same body shape as every other error the API returns.
 */
export abstract class DomainError extends Error {
  abstract readonly code: ApiErrorCode;
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }

  /**
   * User-facing message. Defaults to the Spanish text from the error catalog.
   */
  userMessage(): string {
    return API_ERROR_FALLBACK_ES[this.code];
  }
}

/**
 * User input is invalid or missing required fields.
 * HTTP 400 Bad Request.
 */
export class ValidationError extends DomainError {
  readonly statusCode = 400;

  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/**
 * A resource already exists with the requested identifier.
 * HTTP 409 Conflict.
 */
export class ConflictError extends DomainError {
  readonly statusCode = 409;

  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/**
 * A requested resource does not exist.
 * HTTP 404 Not Found.
 */
export class NotFoundError extends DomainError {
  readonly statusCode = 404;

  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/**
 * The user is not authenticated, or credentials are invalid.
 * HTTP 401 Unauthorized.
 */
export class UnauthorizedError extends DomainError {
  readonly statusCode = 401;

  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

/**
 * The user is authenticated but not permitted to perform the action.
 * HTTP 403 Forbidden.
 */
export class ForbiddenError extends DomainError {
  readonly statusCode = 403;

  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}
