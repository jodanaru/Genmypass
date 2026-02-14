/**
 * ADR-016: Clasificación de errores de APIs para mensajes por tipo y retry manual.
 * Reintentable: red, 5xx, 429. No reintentable: 4xx (401 = sesión expirada, etc.).
 */

export type ApiErrorType =
  | "network"
  | "service_unavailable"
  | "too_many_requests"
  | "session_expired"
  | "forbidden"
  | "not_found"
  | "bad_request"
  | "unknown";

export interface ApiErrorClassification {
  type: ApiErrorType;
  retryable: boolean;
}

/** Error con status HTTP (Drive, Dropbox, OAuth proxy). */
export interface ErrorWithStatus extends Error {
  status?: number;
}

/** Error lanzado cuando el proxy OAuth devuelve !ok; frontend usa status para classifyApiError. */
export class OAuthProxyError extends Error implements ErrorWithStatus {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "OAuthProxyError";
  }
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError && err.message?.toLowerCase().includes("fetch")) return true;
  if (err instanceof Error) {
    const msg = err.message?.toLowerCase() ?? "";
    return msg.includes("failed to fetch") || msg.includes("network") || msg.includes("load failed");
  }
  return false;
}

function getStatus(err: unknown): number | undefined {
  if (typeof err === "object" && err !== null && "status" in err) {
    const s = (err as { status: unknown }).status;
    if (typeof s === "number") return s;
  }
  return undefined;
}

/**
 * Clasifica un error de API en tipo y si tiene sentido ofrecer "Reintentar".
 * Usar status cuando exista (DriveApiError, DropboxApiError, OAuthProxyError).
 */
export function classifyApiError(err: unknown, status?: number): ApiErrorClassification {
  const s = status ?? getStatus(err);

  if (s !== undefined) {
    if (s === 401) return { type: "session_expired", retryable: false };
    if (s === 403) return { type: "forbidden", retryable: false };
    if (s === 404) return { type: "not_found", retryable: false };
    if (s === 429) return { type: "too_many_requests", retryable: true };
    if (s >= 500) return { type: "service_unavailable", retryable: true };
    if (s >= 400) return { type: "bad_request", retryable: false };
  }

  if (isNetworkError(err)) return { type: "network", retryable: true };

  return { type: "unknown", retryable: false };
}

/** Clave i18n para el mensaje según tipo (errors.api.<type>). */
export function getApiErrorMessageKey(type: ApiErrorType): string {
  const keyMap: Record<ApiErrorType, string> = {
    network: "errors.api.network",
    service_unavailable: "errors.api.serviceUnavailable",
    too_many_requests: "errors.api.tooManyRequests",
    session_expired: "errors.api.sessionExpired",
    forbidden: "errors.api.forbidden",
    not_found: "errors.api.notFound",
    bad_request: "errors.api.badRequest",
    unknown: "errors.api.unknown",
  };
  return keyMap[type];
}
