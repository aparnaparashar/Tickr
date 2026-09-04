export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'DATA_STALE'
  | 'SYMBOL_NOT_SUPPORTED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code: ErrorCode = 'INTERNAL_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static unauthorized(message = 'Authentication required', details?: unknown): AppError {
    return new AppError(message, 401, 'AUTH_REQUIRED', details);
  }

  static forbidden(message = 'Access forbidden', details?: unknown): AppError {
    return new AppError(message, 403, 'FORBIDDEN', details);
  }

  static notFound(message = 'Resource not found', details?: unknown): AppError {
    return new AppError(message, 404, 'NOT_FOUND', details);
  }

  static badRequest(message = 'Validation failed', details?: unknown): AppError {
    return new AppError(message, 400, 'VALIDATION_ERROR', details);
  }

  static conflict(message = 'Resource conflict', details?: unknown): AppError {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static rateLimited(message = 'Too many requests. Please try again later.', details?: unknown): AppError {
    return new AppError(message, 429, 'RATE_LIMITED', details);
  }

  static providerRateLimited(message = 'Market data provider quota reached', details?: unknown): AppError {
    return new AppError(message, 429, 'PROVIDER_RATE_LIMITED', details);
  }

  static providerUnavailable(message = 'Market data provider is temporarily unavailable', details?: unknown): AppError {
    return new AppError(message, 503, 'PROVIDER_UNAVAILABLE', details);
  }

  static internal(message = 'Internal server error', details?: unknown): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR', details);
  }
}
