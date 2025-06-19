import { DomainException } from './base.exception';
import { ErrorCodes } from '../constants/app.constants';

export class EntityNotFoundException extends DomainException {
  readonly code = ErrorCodes.APP_NOT_FOUND;
  readonly statusCode = 404;

  constructor(entityName: string, identifier: string | number, context?: Record<string, any>) {
    super(
      `${entityName} with identifier '${identifier}' not found`,
      { entityName, identifier, ...context }
    );
  }
}