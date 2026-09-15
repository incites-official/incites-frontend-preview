"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import type { Role } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children, roles, loginPath = "/login" }: { children: React.ReactNode; roles?: Role[]; loginPath?: string }) {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const permitted = Boolean(user && (!roles || roles.includes(user.role)));

  useEffect(() => {
    if (!initialized) return;
    if (!user) router.replace(loginPath);
    else if (roles && !roles.includes(user.role)) router.replace("/access-denied");
  }, [initialized, loginPath, roles, router, user]);

  if (!initialized || !permitted) {
    return (
      <div className="route-loading" role="status" aria-live="polite">
        <span className="spinner" />
        <p>접속 정보를 확인하고 있습니다.</p>
      </div>
    );
  }
  return <>{children}</>;
}
