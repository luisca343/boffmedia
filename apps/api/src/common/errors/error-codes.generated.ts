// GENERATED FILE — DO NOT EDIT.
// Source: apps/api/src/common/errors/catalog.json
// Regenerate: pnpm generate:error-codes

/** Stable, machine-readable codes for errors that surface to a user. */
export const ApiErrorCode = {
  ACTOR_NOT_SELF: 'ACTOR_NOT_SELF',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  BANK_ACCOUNT_NOT_OWNED: 'BANK_ACCOUNT_NOT_OWNED',
  BANK_AMOUNT_NOT_POSITIVE: 'BANK_AMOUNT_NOT_POSITIVE',
  BANK_BALANCE_ADJUST_FAILED: 'BANK_BALANCE_ADJUST_FAILED',
  BANK_INSUFFICIENT_FUNDS: 'BANK_INSUFFICIENT_FUNDS',
  BANK_INSUFFICIENT_FUNDS_PURCHASE: 'BANK_INSUFFICIENT_FUNDS_PURCHASE',
  BANK_NEGATIVE_BALANCE: 'BANK_NEGATIVE_BALANCE',
  BANK_SAME_ACCOUNT: 'BANK_SAME_ACCOUNT',
  BANK_SOURCE_ACCOUNT_NOT_FOUND: 'BANK_SOURCE_ACCOUNT_NOT_FOUND',
  BANK_TARGET_ACCOUNT_NOT_FOUND: 'BANK_TARGET_ACCOUNT_NOT_FOUND',
  BANK_TRANSFER_FAILED: 'BANK_TRANSFER_FAILED',
  CHAT_CALL_NO_PARTICIPANTS: 'CHAT_CALL_NO_PARTICIPANTS',
  CHAT_GROUP_NO_ACCESS: 'CHAT_GROUP_NO_ACCESS',
  CHAT_MESSAGE_NOT_DELETABLE: 'CHAT_MESSAGE_NOT_DELETABLE',
  CHAT_MESSAGE_NOT_EDITABLE: 'CHAT_MESSAGE_NOT_EDITABLE',
  CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
  CHAT_NOT_MEMBER: 'CHAT_NOT_MEMBER',
  TOURNAMENT_CHECKIN_CLOSED: 'TOURNAMENT_CHECKIN_CLOSED',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/** Spanish fallback text shipped as `userMessage` alongside each code. */
export const API_ERROR_FALLBACK_ES: Record<ApiErrorCode, string> = {
  ACTOR_NOT_SELF: 'No puedes actuar en nombre de otro jugador.',
  AUTH_INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos.',
  BANK_ACCOUNT_NOT_OWNED:
    'No puedes transferir desde una cuenta que no es tuya.',
  BANK_AMOUNT_NOT_POSITIVE: 'El importe debe ser mayor que cero.',
  BANK_BALANCE_ADJUST_FAILED: 'No se pudo ajustar el saldo.',
  BANK_INSUFFICIENT_FUNDS: 'Saldo insuficiente.',
  BANK_INSUFFICIENT_FUNDS_PURCHASE: 'Saldo insuficiente para la compra.',
  BANK_NEGATIVE_BALANCE: 'El saldo no puede ser negativo.',
  BANK_SAME_ACCOUNT: 'No puedes transferir a la misma cuenta.',
  BANK_SOURCE_ACCOUNT_NOT_FOUND: 'La cuenta de origen no existe.',
  BANK_TARGET_ACCOUNT_NOT_FOUND: 'La cuenta de destino no existe.',
  BANK_TRANSFER_FAILED: 'No se pudo completar la transferencia.',
  CHAT_CALL_NO_PARTICIPANTS: 'No hay nadie más en el chat para llamar.',
  CHAT_GROUP_NO_ACCESS: 'No tienes acceso a este grupo.',
  CHAT_MESSAGE_NOT_DELETABLE: 'No puedes eliminar este mensaje.',
  CHAT_MESSAGE_NOT_EDITABLE: 'No puedes editar este mensaje.',
  CHAT_NOT_FOUND: 'No se encontró el chat.',
  CHAT_NOT_MEMBER: 'No formas parte de este chat.',
  TOURNAMENT_CHECKIN_CLOSED: 'El check-in no está abierto.',
};
