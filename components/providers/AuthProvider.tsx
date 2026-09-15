"use client";

import { ApiError, apiFetch, clearAccessToken, getAccessToken, getAuthSyncKey, sessionEndedPath, storeAccessToken } from "@/lib/api";
import type { SessionEndReason } from "@/lib/api";
import type { Role, TokenResponse, UserProfile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

interface AuthContextValue {
  user: UserProfile | null;
  initialized: boolean;
  login: (email: string, password: string, allowedRoles?: Role[]) => Promise<UserProfile>;
  logout: (reason?: "logout" | "idle") => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const LAST_ACTIVITY_KEY = "incites_last_activity";
const IDLE_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES ?? 30) * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();
  const lastRecordedActivity = useRef(0);
  const logoutStarted = useRef(false);

  const refreshUser = useCallback(async () => {
    const profile = await apiFetch<UserProfile>("/api/auth/me");
    setUser(profile);
  }, []);

  const login = useCallback(async (email: string, password: string, allowedRoles?: Role[]) => {
    const result = await apiFetch<TokenResponse>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      { retryAuthentication: false, redirectForbidden: false },
    );
    if (allowedRoles && !allowedRoles.includes(result.user.role)) {
      try {
        await apiFetch<void>(
          "/api/auth/logout",
          { method: "POST", headers: { Authorization: `Bearer ${result.accessToken}` } },
          { retryAuthentication: false, redirectUnauthorized: false, redirectForbidden: false },
        );
      } catch {
        // 로그인 화면 영역이 다른 경우에도 로컬 인증 정보는 저장하지 않는다.
      }
      throw new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "이메일 또는 비밀번호가 올바르지 않습니다.",
      );
    }
    storeAccessToken(result.accessToken);
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    logoutStarted.current = false;
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(
    async (reason: "logout" | "idle" = "logout") => {
      if (logoutStarted.current) return;
      logoutStarted.current = true;
      try {
        if (getAccessToken()) {
          await apiFetch<void>(
            "/api/auth/logout",
            { method: "POST" },
            { retryAuthentication: true, redirectUnauthorized: false, redirectForbidden: false },
          );
        }
      } catch {
        // 서버 세션 만료 상태에서도 클라이언트 정리와 안내 화면 이동은 보장한다.
      } finally {
        clearAccessToken(reason);
        window.localStorage.removeItem(LAST_ACTIVITY_KEY);
        setUser(null);
        router.replace(sessionEndedPath(reason));
      }
    },
    [router],
  );

  useEffect(() => {
    let active = true;
    async function initialize() {
      if (!getAccessToken()) {
        if (active) setInitialized(true);
        return;
      }
      try {
        const profile = await apiFetch<UserProfile>("/api/auth/me");
        if (active) setUser(profile);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setInitialized(true);
      }
    }
    void initialize();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function syncAuthentication(event: StorageEvent) {
      if (event.key !== getAuthSyncKey()) return;
      let message: { type?: string; reason?: unknown } = {};
      try {
        message = event.newValue ? (JSON.parse(event.newValue) as { type?: string; reason?: unknown }) : {};
      } catch {
        message = {};
      }
      if (message.type === "session-ended" || message.type === "logout") {
        const supportedReasons: SessionEndReason[] = ["expired", "idle", "logout"];
        const reason = supportedReasons.includes(message.reason as SessionEndReason) ? message.reason as SessionEndReason : "logout";
        logoutStarted.current = true;
        window.localStorage.removeItem(LAST_ACTIVITY_KEY);
        setUser(null);
        router.replace(sessionEndedPath(reason));
      } else if (message.type === "token") {
        logoutStarted.current = false;
        void refreshUser();
      }
    }
    window.addEventListener("storage", syncAuthentication);
    return () => window.removeEventListener("storage", syncAuthentication);
  }, [refreshUser, router]);

  useEffect(() => {
    if (!user || !Number.isFinite(IDLE_TIMEOUT_MS) || IDLE_TIMEOUT_MS <= 0) return;

    const recordActivity = () => {
      const now = Date.now();
      if (now - lastRecordedActivity.current < 15_000) return;
      lastRecordedActivity.current = now;
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    };
    if (!window.localStorage.getItem(LAST_ACTIVITY_KEY)) recordActivity();

    const checkIdle = () => {
      const lastActivity = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY));
      if (Number.isFinite(lastActivity) && lastActivity > 0 && Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        void logout("idle");
      }
    };
    const checkIdleWhenVisible = () => {
      if (document.visibilityState === "visible") checkIdle();
    };

    const activityEvents: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    window.addEventListener("focus", checkIdle);
    window.addEventListener("pageshow", checkIdle);
    document.addEventListener("visibilitychange", checkIdleWhenVisible);
    checkIdle();
    const timer = window.setInterval(checkIdle, 15_000);

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      window.removeEventListener("focus", checkIdle);
      window.removeEventListener("pageshow", checkIdle);
      document.removeEventListener("visibilitychange", checkIdleWhenVisible);
      window.clearInterval(timer);
    };
  }, [logout, user]);

  const value = useMemo(
    () => ({ user, initialized, login, logout, refreshUser }),
    [user, initialized, login, logout, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
