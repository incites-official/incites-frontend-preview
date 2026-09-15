import type { ApiErrorBody, TokenResponse } from "@/lib/types";
import { DemoApiError, handleDemoDownload, handleDemoRequest } from "@/lib/demo-api";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
const ACCESS_TOKEN_KEY = "incites_access_token";
const AUTH_SYNC_KEY = "incites_auth_sync";

let reissuePromise: Promise<TokenResponse> | null = null;
let boundaryRedirectInProgress = false;

export type SessionEndReason = "expired" | "idle" | "logout";
export type LoginAudience = "admin" | "mobile";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly body?: ApiErrorBody,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function storeAccessToken(token: string, notify = true) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  if (notify) {
    window.localStorage.setItem(AUTH_SYNC_KEY, JSON.stringify({ type: "token", at: Date.now() }));
  }
  window.dispatchEvent(new CustomEvent("incites:auth-updated"));
}

export function clearAccessToken(reason: SessionEndReason = "logout", notify = true) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  if (notify) {
    window.localStorage.setItem(AUTH_SYNC_KEY, JSON.stringify({ type: "session-ended", reason, at: Date.now() }));
  }
  window.dispatchEvent(new CustomEvent("incites:auth-updated"));
}

export function getAuthSyncKey() {
  return AUTH_SYNC_KEY;
}

function currentLoginAudience(): LoginAudience {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) return "admin";
  return "mobile";
}

export function sessionEndedPath(reason: SessionEndReason, audience: LoginAudience = currentLoginAudience()) {
  return `/session-ended?reason=${reason}&audience=${audience}`;
}

function replaceBoundary(path: string) {
  if (typeof window === "undefined" || boundaryRedirectInProgress) return;
  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (currentPath === path) return;
  boundaryRedirectInProgress = true;
  window.location.replace(path);
}

function moveToSessionBoundary() {
  const reason: SessionEndReason = "expired";
  clearAccessToken(reason);
  replaceBoundary(sessionEndedPath(reason));
}

function moveToAccessDenied() {
  replaceBoundary("/access-denied");
}

async function readError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody = {};
  try {
    body = (await response.json()) as ApiErrorBody;
  } catch {
    // JSON 응답이 아닌 네트워크/프록시 오류도 동일한 계약으로 변환한다.
  }
  return new ApiError(
    response.status,
    body.code ?? `HTTP_${response.status}`,
    body.message ?? "요청을 처리하지 못했습니다.",
    body,
  );
}

interface ApiResponseEnvelope<T> {
  success: boolean;
  data?: T;
}

async function readSuccess<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiResponseEnvelope<T> | T;
  if (body && typeof body === "object" && "success" in body) {
    return (body as ApiResponseEnvelope<T>).data as T;
  }
  return body as T;
}

async function reissue(): Promise<TokenResponse> {
  if (!reissuePromise) {
    reissuePromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/api/auth/reissue`, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw await readError(response);
      const token = await readSuccess<TokenResponse>(response);
      storeAccessToken(token.accessToken);
      return token;
    })().finally(() => {
      reissuePromise = null;
    });
  }
  return reissuePromise;
}

interface ApiFetchOptions {
  retryAuthentication?: boolean;
  redirectUnauthorized?: boolean;
  redirectForbidden?: boolean;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<T> {
  if (DEMO_MODE) {
    try {
      return await handleDemoRequest<T>(path, init, getAccessToken());
    } catch (reason) {
      if (reason instanceof DemoApiError) throw new ApiError(reason.status, reason.code, reason.message);
      throw reason;
    }
  }
  const retryAuthentication = options.retryAuthentication ?? true;
  const redirectUnauthorized = options.redirectUnauthorized ?? true;
  const redirectForbidden = options.redirectForbidden ?? true;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  const multipartBody = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !multipartBody && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const accessToken = getAccessToken();
  if (accessToken && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "서버에 연결할 수 없습니다. 네트워크와 서버 상태를 확인해주세요.");
  }

  if (response.status === 401) {
    const error = await readError(response);
    const isAuthEndpoint = path === "/api/auth/login" || path === "/api/auth/reissue";
    if (!retryAuthentication || isAuthEndpoint) {
      if (redirectUnauthorized && !isAuthEndpoint) moveToSessionBoundary();
      throw error;
    }
    let next: TokenResponse;
    try {
      next = await reissue();
    } catch (reissueError) {
      if (redirectUnauthorized) moveToSessionBoundary();
      throw reissueError;
    }

    const retryHeaders = new Headers(init.headers);
    retryHeaders.set("Accept", "application/json");
    if (init.body && !multipartBody && !retryHeaders.has("Content-Type")) retryHeaders.set("Content-Type", "application/json");
    retryHeaders.set("Authorization", `Bearer ${next.accessToken}`);
    let retried: Response;
    try {
      retried = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: retryHeaders,
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      throw new ApiError(0, "NETWORK_ERROR", "서버에 연결할 수 없습니다. 네트워크와 서버 상태를 확인해주세요.");
    }
    if (!retried.ok) {
      const retryError = await readError(retried);
      if (retried.status === 401 && redirectUnauthorized) moveToSessionBoundary();
      if (retried.status === 403 && redirectForbidden) moveToAccessDenied();
      throw retryError;
    }
    if (retried.status === 204) return undefined as T;
    return readSuccess<T>(retried);
  }

  if (response.status === 403 && redirectForbidden) {
    moveToAccessDenied();
    throw await readError(response);
  }
  if (!response.ok) throw await readError(response);
  if (response.status === 204) return undefined as T;
  return readSuccess<T>(response);
}

export async function apiDownload(path: string): Promise<Blob> {
  if (DEMO_MODE) return handleDemoDownload(path);
  const request = async (token: string | null) => {
    const headers = new Headers({ Accept: "application/octet-stream" });
    if (token) headers.set("Authorization", `Bearer ${token}`);
    try {
      return await fetch(`${API_BASE_URL}${path}`, { headers, credentials: "include", cache: "no-store" });
    } catch {
      throw new ApiError(0, "NETWORK_ERROR", "서버에 연결할 수 없습니다. 네트워크와 서버 상태를 확인해주세요.");
    }
  };

  let response = await request(getAccessToken());
  if (response.status === 401) {
    try {
      const next = await reissue();
      response = await request(next.accessToken);
    } catch (reason) {
      moveToSessionBoundary();
      throw reason;
    }
  }
  if (response.status === 403) {
    moveToAccessDenied();
    throw await readError(response);
  }
  if (!response.ok) throw await readError(response);
  return response.blob();
}
