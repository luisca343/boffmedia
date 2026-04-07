export class AuthError extends Error {
    constructor(message: string, public code: string) {
      super(message);
      this.name = 'AuthError';
    }
  }
  
  export const AUTH_ERROR_CODES = {
    MISSING_CREDENTIALS: 'auth/missing-credentials',
    INVALID_CREDENTIALS: 'auth/invalid-credentials',
    USER_NOT_FOUND: 'auth/user-not-found',
    // Add more error codes as needed
  };
  
  export function handleAuthError(error: unknown): AuthError {
    if (error instanceof AuthError) {
      return error;
    }
    if (error instanceof Error) {
      return new AuthError(error.message, 'auth/unknown');
    }
    return new AuthError('An unknown error occurred', 'auth/unknown');
  }
  
  