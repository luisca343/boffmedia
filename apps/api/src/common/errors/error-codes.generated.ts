// GENERATED FILE — DO NOT EDIT.
// Source: apps/api/src/common/errors/catalog.json
// Regenerate: pnpm generate:error-codes

/** Stable, machine-readable codes for errors that surface to a user. */
export const ApiErrorCode = {
  ACTOR_NOT_SELF: 'ACTOR_NOT_SELF',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
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
  CHAT_MEMBERSHIP_FIXED: 'CHAT_MEMBERSHIP_FIXED',
  CHAT_MESSAGE_NOT_DELETABLE: 'CHAT_MESSAGE_NOT_DELETABLE',
  CHAT_MESSAGE_NOT_EDITABLE: 'CHAT_MESSAGE_NOT_EDITABLE',
  CHAT_NOT_FOUND: 'CHAT_NOT_FOUND',
  CHAT_NOT_MEMBER: 'CHAT_NOT_MEMBER',
  EVENT_DELETE_BLOCKED_BY_TOURNAMENT: 'EVENT_DELETE_BLOCKED_BY_TOURNAMENT',
  EVENT_LIFECYCLE_FORWARD_ONLY: 'EVENT_LIFECYCLE_FORWARD_ONLY',
  EVENT_REOPEN_BLOCKED_BY_RANDOMIZER: 'EVENT_REOPEN_BLOCKED_BY_RANDOMIZER',
  MATCH_AMENDMENT_CONFLICT: 'MATCH_AMENDMENT_CONFLICT',
  MATCH_SETTLED_CONCURRENTLY: 'MATCH_SETTLED_CONCURRENTLY',
  SERVICE_DATABASE_UNAVAILABLE: 'SERVICE_DATABASE_UNAVAILABLE',
  TAXI_INSUFFICIENT_FUNDS: 'TAXI_INSUFFICIENT_FUNDS',
  TAXI_IN_DUNGEON_RUN: 'TAXI_IN_DUNGEON_RUN',
  TAXI_PLAYER_OFFLINE: 'TAXI_PLAYER_OFFLINE',
  TAXI_SERVER_BUSY: 'TAXI_SERVER_BUSY',
  TAXI_STOP_NOT_FOUND: 'TAXI_STOP_NOT_FOUND',
  TAXI_UNSAFE_ARRIVAL: 'TAXI_UNSAFE_ARRIVAL',
  TOURNAMENT_CHECKIN_CLOSED: 'TOURNAMENT_CHECKIN_CLOSED',
  TOURNAMENT_EVENT_MEMBERSHIP_REQUIRED: 'TOURNAMENT_EVENT_MEMBERSHIP_REQUIRED',
  TOURNAMENT_PARTICIPANT_IN_BRACKET: 'TOURNAMENT_PARTICIPANT_IN_BRACKET',
  TOURNAMENT_PROPOSAL_ALREADY_EXISTS: 'TOURNAMENT_PROPOSAL_ALREADY_EXISTS',
  TOURNAMENT_PROPOSAL_AUTO_VERIFIED: 'TOURNAMENT_PROPOSAL_AUTO_VERIFIED',
  TOURNAMENT_PROPOSAL_INVALIDATED: 'TOURNAMENT_PROPOSAL_INVALIDATED',
  TOURNAMENT_PROPOSAL_SETTLED_CONCURRENTLY:
    'TOURNAMENT_PROPOSAL_SETTLED_CONCURRENTLY',
  TOURNAMENT_REOPEN_BLOCKED_BY_COMPLETED_EVENT:
    'TOURNAMENT_REOPEN_BLOCKED_BY_COMPLETED_EVENT',
  TOURNAMENT_TEAMSHEET_LOCKED: 'TOURNAMENT_TEAMSHEET_LOCKED',
  TOURNAMENT_TEAMSHEET_REQUIRED: 'TOURNAMENT_TEAMSHEET_REQUIRED',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/** Spanish fallback text shipped as `userMessage` alongside each code. */
export const API_ERROR_FALLBACK_ES: Record<ApiErrorCode, string> = {
  ACTOR_NOT_SELF: 'No puedes actuar en nombre de otro jugador.',
  AUTH_EMAIL_NOT_VERIFIED:
    'Verifica tu correo antes de continuar. Te hemos enviado un enlace al registrarte.',
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
  CHAT_MEMBERSHIP_FIXED:
    'La lista de miembros de este chat no se puede modificar.',
  CHAT_MESSAGE_NOT_DELETABLE: 'No puedes eliminar este mensaje.',
  CHAT_MESSAGE_NOT_EDITABLE: 'No puedes editar este mensaje.',
  CHAT_NOT_FOUND: 'No se encontró el chat.',
  CHAT_NOT_MEMBER: 'No formas parte de este chat.',
  EVENT_DELETE_BLOCKED_BY_TOURNAMENT:
    'No se puede eliminar este evento: tiene un torneo anexo. Elimina o desvincula el torneo primero.',
  EVENT_LIFECYCLE_FORWARD_ONLY:
    'El ciclo de vida del evento solo avanza. Marca «reabrir» si de verdad quieres retrocederlo.',
  EVENT_REOPEN_BLOCKED_BY_RANDOMIZER:
    'No se puede reabrir: el evento tiene un randomizer que ya no es borrador. Ciérralo o elimínalo antes.',
  MATCH_AMENDMENT_CONFLICT:
    'La partida fue corregida por otro administrador. Vuelve a cargarla antes de corregirla de nuevo.',
  MATCH_SETTLED_CONCURRENTLY:
    'La partida se resolvió mientras enviabas el resultado. Vuelve a cargarla antes de corregirla.',
  SERVICE_DATABASE_UNAVAILABLE:
    'El servicio no está disponible ahora mismo. Vuelve a intentarlo en unos minutos.',
  TAXI_INSUFFICIENT_FUNDS: 'No tienes saldo suficiente para este viaje.',
  TAXI_IN_DUNGEON_RUN: 'No puedes coger un taxi durante una mazmorra.',
  TAXI_PLAYER_OFFLINE: 'Tienes que estar conectado al servidor para viajar.',
  TAXI_SERVER_BUSY:
    'El servidor no ha respondido a tiempo. No se te ha cobrado nada.',
  TAXI_STOP_NOT_FOUND: 'Esa parada de taxi ya no existe.',
  TAXI_UNSAFE_ARRIVAL: 'No hay un sitio seguro donde dejarte en esa parada.',
  TOURNAMENT_CHECKIN_CLOSED: 'El check-in no está abierto.',
  TOURNAMENT_EVENT_MEMBERSHIP_REQUIRED:
    'Este torneo pertenece a un evento: únete al evento antes de inscribirte.',
  TOURNAMENT_PARTICIPANT_IN_BRACKET:
    'Ese participante ya está en el cuadro. Cambia su estado a retirado o descalificado en vez de borrarlo.',
  TOURNAMENT_PROPOSAL_ALREADY_EXISTS:
    'Ya hay un resultado propuesto para esta partida.',
  TOURNAMENT_PROPOSAL_AUTO_VERIFIED:
    'La propuesta ya se auto-verificó — pide a un juez que la corrija.',
  TOURNAMENT_PROPOSAL_INVALIDATED:
    'La propuesta quedó invalidada por un cambio en la partida.',
  TOURNAMENT_PROPOSAL_SETTLED_CONCURRENTLY:
    'La propuesta ya se resolvió mientras enviabas la disputa.',
  TOURNAMENT_REOPEN_BLOCKED_BY_COMPLETED_EVENT:
    'No se puede cambiar un torneo cuyo evento padre ya ha finalizado.',
  TOURNAMENT_TEAMSHEET_LOCKED:
    'Las listas de equipo están bloqueadas: el torneo ya ha empezado.',
  TOURNAMENT_TEAMSHEET_REQUIRED:
    'Envía tu lista de equipo antes de hacer check-in.',
};
