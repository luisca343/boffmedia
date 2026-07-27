import { ApiErrorCode, API_ERROR_FALLBACK_ES } from './error-codes.generated';

/**
 * Builds the body for a user-facing HttpException: a stable machine `code`,
 * the machine-English `message` for logs, and the Spanish `userMessage` the
 * web renders when it does not recognise the code.
 *
 *   throw new BadRequestException(userError(ApiErrorCode.BANK_INSUFFICIENT_FUNDS, 'insufficient funds'))
 *
 * `userMessage` defaults to the catalog's Spanish text, so a throw site only
 * overrides it when the wording is genuinely context-specific.
 */
export function userError(
  code: ApiErrorCode,
  message: string,
  userMessage?: string,
): { code: ApiErrorCode; message: string; userMessage: string } {
  return {
    code,
    message,
    userMessage: userMessage ?? API_ERROR_FALLBACK_ES[code],
  };
}

export { ApiErrorCode, API_ERROR_FALLBACK_ES };
