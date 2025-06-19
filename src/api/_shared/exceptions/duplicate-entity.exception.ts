import { DomainException } from './base.exception';
import { ErrorCodes } from '../constants/app.constants';

export class DuplicateEntityException extends DomainException {
  readonly code = ErrorCodes.APP_ALREADY_EXISTS;
  readonly statusCode = 409;

  constructor(entityName: string, identifier: string | number, context?: Record<string, any>) {
    super(
      `${entityName} with identifier '${identifier}' already exists`,
      { entityName, identifier, ...context }
    );
  }
}