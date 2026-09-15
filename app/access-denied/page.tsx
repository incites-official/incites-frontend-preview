"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { Icon } from "@/components/Icon";
import { useAuth } from "@/components/providers/AuthProvider";
import { homePathForRole } from "@/lib/navigation";
import Link from "next/link";

export default function AccessDeniedPage() {
  const { user } = useAuth();
  const homePath = user ? homePathForRole(user.role) : "/login";
  const homeLabel = user?.role === "PARENT" || user?.role === "STUDENT" ? "내 화면으로 이동" : "대시보드로 이동";

  return (
    <main className="boundary-page">
      <BrandLogo className="boundary-brand" />
      <section className="boundary-card">
        <span className="boundary-icon warning"><Icon name="warning" /></span><span className="eyebrow">ACCESS DENIED</span>
        <h1>이 페이지에 접근할 권한이 없습니다.</h1><p>현재 계정에 허용되지 않은 기능입니다. 권한이 필요하다면 시스템 관리자에게 문의해주세요.</p>
        <Link href={homePath} className="soft-button primary medium">{homeLabel}<Icon name="chevron-right" /></Link>
      </section>
    </main>
  );
}
