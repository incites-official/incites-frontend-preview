"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { Icon } from "@/components/Icon";
import { SidebarMenuGroup } from "@/components/layout/SidebarMenuGroup";
import { AdminNotificationMenu } from "@/components/notifications/AdminNotificationMenu";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUiRole } from "@/components/providers/UiRoleProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { role } = useUiRole();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const sidebarRole = role === "SA" ? "총괄관리자 (SA)" : "일반관리자 (GA)";
  const navigation = role === "SA" ? [
    { label: "대시보드", items: [{ href: "/admin/dashboard", label: "운영 대시보드" }] },
    { label: "관리자 관리", items: [{ href: "/admin/users", label: "관리자 목록" }] },
    { label: "사용자 관리", items: [{ href: "/admin/members/guardians", label: "학부모 목록" }, { href: "/admin/members/students", label: "학생 목록" }] },
    { label: "기록 관리", items: [{ href: "/admin/records/audit", label: "관찰 기록" }, { href: "/admin/records/reports", label: "리포트 관리" }] },
    { label: "설정", items: [{ href: "/admin/settings", label: "시스템 설정" }] },
  ] : [
    { label: "대시보드", items: [{ href: "/admin/dashboard", label: "선생님 대시보드" }] },
    { label: "담당 학생 목록", items: [{ href: "/admin/students", label: "학생 성장 관리" }] },
    { label: "관찰 기록", items: [{ href: "/admin/observations/write", label: "관찰 기록 작성" }, { href: "/admin/observations/drafts", label: "임시저장함" }] },
    { label: "기록 관리", items: [{ href: "/admin/reports", label: "리포트 검토" }] },
  ];

  useEffect(() => {
    function closeMenus(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <button className="icon-button mobile-menu" type="button" onClick={() => setSidebarOpen(true)} aria-label="메뉴 열기"><Icon name="menu" /></button>
          <Link className="topbar-home-link" href="/admin/dashboard" aria-label="대시보드로 이동"><BrandLogo /></Link>
          <div id="report-student-context" className="report-student-context" />
        </div>
        <div className="topbar-actions">
          <AdminNotificationMenu />
          <div className="account" ref={accountRef}>
            <button type="button" className="account-trigger" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen}>
              <span className="avatar">{user?.name.slice(0, 1)}</span>
              <span className="account-copy"><strong>{user?.name}</strong><small>{sidebarRole}</small></span>
              <Icon name="chevron-right" />
            </button>
            {accountOpen && (
              <div className="account-menu">
                <div><strong>{user?.email}</strong><span>로그인 이메일</span></div>
                <button type="button" onClick={() => void logout()}><Icon name="logout" />로그아웃</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="app-body">
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-profile">
            <span className="sidebar-profile-icon"><Icon name="admin" /></span>
            <div><strong>{sidebarRole}</strong></div>
            <button className="icon-button sidebar-close" type="button" onClick={() => setSidebarOpen(false)} aria-label="메뉴 닫기"><Icon name="close" /></button>
          </div>
          <nav className="sidebar-nav" aria-label="주 메뉴">
            {navigation.map((group) => <SidebarMenuGroup key={group.label} label={group.label} items={group.items} activePath={pathname} onNavigate={() => setSidebarOpen(false)} />)}
          </nav>
        </aside>
        {sidebarOpen && <button className="sidebar-scrim" aria-label="메뉴 닫기" onClick={() => setSidebarOpen(false)} />}
        <div className="app-area">
          <main className="page-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
