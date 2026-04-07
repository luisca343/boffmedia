// Error domains for organizing errors by subsystem
export const ERROR_DOMAINS = {
  AUTH: 'AUTH',
  API: 'API',
  DB: 'DB',
  MC: 'MC',
  UI: 'UI',
  INT: 'INT',
} as const;

// Error severity levels
export const ERROR_SEVERITIES = {
  ERROR: 'E',
  WARNING: 'W',
  INFO: 'I',
} as const;

export type ErrorDomain = typeof ERROR_DOMAINS[keyof typeof ERROR_DOMAINS];
export type ErrorSeverity = typeof ERROR_SEVERITIES[keyof typeof ERROR_SEVERITIES];

// Generate formatted error code string
export function generateErrorCode(
  domain: ErrorDomain,
  severity: ErrorSeverity,
  code: number
): string {
  return `SR-${domain}-${severity}-${code.toString().padStart(3, '0')}`;
}

// Interface for error definitions
interface ErrorDefinition {
  domain: ErrorDomain;
  severity: ErrorSeverity;
  code: number;
  message: string;
}

// Define all application error codes
export const ROTOM_ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: { 
    domain: ERROR_DOMAINS.AUTH, 
    severity: ERROR_SEVERITIES.ERROR, 
    code: 1,
    message: "Usuario no autorizado" 
  },
  SESSION_EXPIRED: { 
    domain: ERROR_DOMAINS.AUTH, 
    severity: ERROR_SEVERITIES.WARNING, 
    code: 2,
    message: "Sesión expirada" 
  },
  
  // Integration errors
  SMARTROTOM_NOT_LINKED: { 
    domain: ERROR_DOMAINS.INT, 
    severity: ERROR_SEVERITIES.ERROR, 
    code: 1,
    message: "Usuario de SmartRotom no vinculado. Accede a Minecraft antes de usar la web." 
  },
  BOFFMEDIA_NOT_LINKED: { 
    domain: ERROR_DOMAINS.INT, 
    severity: ERROR_SEVERITIES.ERROR, 
    code: 2,
    message: "Usuario de BoffMedia no vinculado" 
  },
  
  // Minecraft specific errors
  MINECRAFT_CONNECTION_FAILED: { 
    domain: ERROR_DOMAINS.MC, 
    severity: ERROR_SEVERITIES.ERROR, 
    code: 1,
    message: "Fallo en la conexión con Minecraft" 
  },
  
  // API errors
  API_UNAVAILABLE: {
    domain: ERROR_DOMAINS.API,
    severity: ERROR_SEVERITIES.ERROR,
    code: 1,
    message: "API no disponible"
  },
  
  // Database errors
  DATA_NOT_FOUND: {
    domain: ERROR_DOMAINS.DB,
    severity: ERROR_SEVERITIES.ERROR,
    code: 1,
    message: "Datos no encontrados"
  },
  
  // API Error Codes for Apps module
  APPS_NOT_FOUND: {
    domain: ERROR_DOMAINS.API,
    severity: ERROR_SEVERITIES.ERROR,
    code: 10,
    message: "No se encontraron aplicaciones"
  },
  
  APPS_USER_NOT_FOUND: {
    domain: ERROR_DOMAINS.API, 
    severity: ERROR_SEVERITIES.ERROR,
    code: 11,
    message: "No se encontró el usuario para gestionar apps"
  },
  
  APPS_FAILED_TO_ADD: {
    domain: ERROR_DOMAINS.API,
    severity: ERROR_SEVERITIES.ERROR,
    code: 12,
    message: "Error al añadir la aplicación al usuario"
  },
  
  APPS_FAILED_TO_REMOVE: {
    domain: ERROR_DOMAINS.API,
    severity: ERROR_SEVERITIES.ERROR,
    code: 13,
    message: "Error al eliminar la aplicación del usuario"
  },
  
  APPS_FAILED_TO_ORDER: {
    domain: ERROR_DOMAINS.API,
    severity: ERROR_SEVERITIES.ERROR,
    code: 14,
    message: "Error al ordenar las aplicaciones"
  }
} as const;

type ErrorCodeVerification<T> = {
  [K in keyof T]: {
    domain: ErrorDomain;
    severity: ErrorSeverity;
    code: number;
    message: string;
  }
};

// This type assertion ensures all error codes follow the correct structure
// It will fail compilation if any error definition doesn't match our interface
export const _typeCheck: ErrorCodeVerification<typeof ROTOM_ERROR_CODES> = ROTOM_ERROR_CODES;

export type RotomErrorCodeKey = keyof typeof ROTOM_ERROR_CODES;

export function getFormattedErrorCode(errorKey: RotomErrorCodeKey): string {
  const errorDef = ROTOM_ERROR_CODES[errorKey];
  return generateErrorCode(errorDef.domain, errorDef.severity, errorDef.code);
}

export const ROTOM_ERROR_DOCS: Partial<Record<RotomErrorCodeKey, {
  possibleCauses: string[];
  solutions: string[];
  internal: boolean;
  supportLink?: string;
}>> = {
  SMARTROTOM_NOT_LINKED: {
    possibleCauses: [
      "No has iniciado sesión en Minecraft",
      "Los datos de sesión de Minecraft no son válidos"
    ],
    solutions: [
      "Inicia sesión en Minecraft primero",
      "Reinicia el cliente de Minecraft",
      "Contacta con soporte si el problema persiste"
    ],
    internal: false,
    supportLink: "https://support.smartrotom.com/errors/INT-E-001"
  },
  BOFFMEDIA_NOT_LINKED: {
    possibleCauses: [
      "No has vinculado tu cuenta de BoffMedia",
      "La conexión con BoffMedia ha fallado"
    ],
    solutions: [
      "Vincula tu cuenta de BoffMedia en la configuración",
      "Cierra sesión y vuelve a iniciarla"
    ],
    internal: false,
    supportLink: "https://support.smartrotom.com/errors/INT-E-002"
  },
  MINECRAFT_CONNECTION_FAILED: {
    possibleCauses: [
      "El cliente de Minecraft no está en ejecución",
      "Problemas de conexión a la red"
    ],
    solutions: [
      "Asegúrate de que Minecraft está abierto",
      "Verifica tu conexión a Internet",
      "Reinicia el juego"
    ],
    internal: false,
    supportLink: "https://support.smartrotom.com/errors/MC-E-001"
  },
  APPS_NOT_FOUND: {
    possibleCauses: [
      "No hay aplicaciones disponibles en el sistema",
      "Error de conexión con la base de datos"
    ],
    solutions: [
      "Contacta con el administrador del sistema",
      "Intenta actualizar la página"
    ],
    internal: false,
    supportLink: "https://support.smartrotom.com/errors/API-E-010"
  },
  APPS_USER_NOT_FOUND: {
    possibleCauses: [
      "El usuario seleccionado no existe",
      "El usuario ha sido eliminado recientemente"
    ],
    solutions: [
      "Selecciona otro usuario",
      "Verifica que el usuario existe en el sistema"
    ],
    internal: false,
    supportLink: "https://support.smartrotom.com/errors/API-E-011"
  }
};

export function logErrorToMonitoring(errorKey: RotomErrorCodeKey, context?: Record<string, any>) {
  const errorCode = getFormattedErrorCode(errorKey);
  const errorDef = ROTOM_ERROR_CODES[errorKey];
  
  console.error(`[${errorCode}] ${errorDef.message}`, context);
  
  /*
  Sentry.captureException(new Error(errorDef.message), {
    tags: {
      errorCode,
      domain: errorDef.domain,
      severity: errorDef.severity
    },
    extra: context
  });
  */
}