export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR"
  | "AI_EXTRACTION_ERROR"
  | "CSRF_ERROR";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 400,
    code: ErrorCode = "BAD_REQUEST",
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
  }

  static unauthorized(msg = "Authentication required"): AppError {
    return new AppError(msg, 401, "UNAUTHORIZED");
  }

  static forbidden(msg = "Permission denied"): AppError {
    return new AppError(msg, 403, "FORBIDDEN");
  }

  static notFound(msg = "Resource not found"): AppError {
    return new AppError(msg, 404, "NOT_FOUND");
  }

  static validation(msg = "Validation failed", details?: Record<string, unknown>): AppError {
    return new AppError(msg, 422, "VALIDATION_ERROR", details);
  }

  static conflict(msg = "Resource state conflict"): AppError {
    return new AppError(msg, 409, "CONFLICT");
  }

  static rateLimited(msg = "Rate limit exceeded"): AppError {
    return new AppError(msg, 429, "RATE_LIMITED");
  }

  static internal(msg = "Internal server error"): AppError {
    return new AppError(msg, 500, "INTERNAL_ERROR");
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}
