"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { homePathForRole } from "@/lib/navigation";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initialized) router.replace(user ? homePathForRole(user.role) : "/login");
  }, [initialized, router, user]);

  return (
    <div className="route-loading" role="status">
      <span className="spinner" />
      <p>INCITES를 시작하고 있습니다.</p>
    </div>
  );
}
