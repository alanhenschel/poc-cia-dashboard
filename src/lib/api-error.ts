import type { ApiErrorCode, ApiErrorEnvelope } from "@/types";

/**
 * Transport-agnostic API error carrying the RFC "Standard error" envelope plus the HTTP status.
 * Lives OUTSIDE `services/mock` on purpose: both the mock backend and a future `fetch`-based facade
 * throw and catch this same class, so swapping in the real backend (deleting `services/mock`) does
 * not touch error handling in the UI, hooks, or query client.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** The exact JSON body a real cia-backend would return. */
  toEnvelope(): ApiErrorEnvelope {
    return { error: { code: this.code, message: this.message, details: this.details } };
  }

  static forbidden(resource: string, id: string): ApiError {
    return new ApiError(403, "forbidden", "Only the resource owner can perform this action.", {
      resource,
      id,
    });
  }

  static notFound(resource: string, id: string): ApiError {
    return new ApiError(404, "not_found", `${resource} not found.`, { resource, id });
  }

  static unprocessable(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(422, "unprocessable", message, details);
  }

  static transient(): ApiError {
    return new ApiError(500, "internal", "The service is temporarily unavailable. Please retry.");
  }
}
