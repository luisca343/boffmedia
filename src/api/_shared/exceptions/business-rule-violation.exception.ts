import { DomainException } from './base.exception';

export class BusinessRuleViolationException extends DomainException {
  readonly statusCode = 422;

  constructor(
    rule: string, 
    public readonly code: string,
    context?: Record<string, any>
  ) {
    super(
      `Business rule violation: ${rule}`,
      { rule, ...context }
    );
  }
}