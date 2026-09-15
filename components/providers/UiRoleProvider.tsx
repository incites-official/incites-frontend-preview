"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { createContext, useContext, useMemo } from "react";

type AdminRole = "SA" | "GA";

interface UiRoleContextValue {
  role: AdminRole;
  effectiveUserId: string | null;
}

const UiRoleContext = createContext<UiRoleContextValue | null>(null);

export function UiRoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const role: AdminRole = user?.role === "ADMIN" ? "SA" : "GA";
  const value = useMemo(() => ({ role, effectiveUserId: user?.id ?? null }), [role, user?.id]);

  return <UiRoleContext.Provider value={value}>{children}</UiRoleContext.Provider>;
}

export function useUiRole() {
  const context = useContext(UiRoleContext);
  if (!context) throw new Error("useUiRole must be used inside UiRoleProvider");
  return context;
}
