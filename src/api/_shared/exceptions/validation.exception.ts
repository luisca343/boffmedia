import { DomainException } from './base.exception';
import { ErrorCodes } from '../constants/app.constants';

export class ValidationException extends DomainException {
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly code: string = ErrorCodes.VALIDATION_ERROR,
    context?: Record<string, any>
  ) {
    super(message, context);
  }
}