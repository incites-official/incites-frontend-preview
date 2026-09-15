"use client";

import { BrandLogo } from "@/components/BrandLogo";
import { showToast } from "@/components/feedback/Toast";
import { Icon } from "@/components/Icon";
import growthNavIcon from "@/common/icon/growth.svg";
import homeNavIcon from "@/common/icon/home.svg";
import profileNavIcon from "@/common/icon/Icon.svg";
import kidsNavIcon from "@/common/icon/kids.svg";
import reportNavIcon from "@/common/icon/report.svg";
import { apiErrorMessage, getNotifications } from "@/lib/incites-api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type MobileRole = "student" | "parent";

const navigation = {
  student: [
    { href: "/student", label: "홈", icon: homeNavIcon },
    { href: "/student/growth", label: "성장", icon: growthNavIcon },
    { href: "/student/report", label: "리포트", icon: reportNavIcon },
    { href: "/student/my", label: "MY", icon: profileNavIcon },
  ],
  parent: [
    { href: "/parent", label: "홈", icon: homeNavIcon },
    { href: "/parent/children", label: "자녀", icon: kidsNavIcon },
    { href: "/parent/growth", label: "성장", icon: growthNavIcon },
    { href: "/parent/report", label: "리포트", icon: reportNavIcon },
    { href: "/parent/my", label: "MY", icon: profileNavIcon },
  ],
};

export function MobileRoleShell({ role, children }: { role: MobileRole; children: React.ReactNode }) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const isMyRoot = pathname === `/${role}/my`;
  const isStandalone = pathname === `/${role}/notifications` || pathname === `/${role}/my/profile`;

  useEffect(() => {
    if (isStandalone) return;
    let active = true;
    void getNotifications()
      .then((items) => {
        if (!active) return;
        setUnreadCount(items.filter((item) => !item.readAt).length);
      })
      .catch((reason) => {
        if (active) showToast(apiErrorMessage(reason, "알림을 불러오지 못했습니다."), { tone: "error" });
      })
    return () => { active = false; };
  }, [isStandalone, pathname]);

  return (
    <div className="mobile-role-stage">
      <section className="mobile-role-app">
        {!isStandalone && (
          isMyRoot ? (
            <header className="mobile-role-header mobile-title-header"><h1>마이페이지</h1></header>
          ) : (
            <header className="mobile-role-header">
              <BrandLogo />
              <Link className="mobile-bell" href={`/${role}/notifications`} aria-label={`알림 확인${unreadCount ? `, 읽지 않은 알림 ${unreadCount}개` : ""}`}>
                <Icon name="bell" />
                {unreadCount > 0 && <i aria-hidden="true" />}
              </Link>
            </header>
          )
        )}
        <main className={`mobile-role-main ${isStandalone ? "standalone" : ""}`}>{children}</main>
        {!isStandalone && <nav className={`mobile-bottom-nav ${role}`} aria-label={`${role === "student" ? "학생" : "학부모"} 메뉴`}>
          {navigation[role].map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
                <span
                  className="mobile-bottom-nav-icon"
                  style={{
                    WebkitMaskImage: `url("${item.icon.src}")`,
                    maskImage: `url("${item.icon.src}")`,
                  }}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>}
      </section>
    </div>
  );
}
