"use client";

import { showToast } from "@/components/feedback/Toast";
import { Icon } from "@/components/Icon";
import {
  apiErrorMessage,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotification,
} from "@/lib/incites-api";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function relativeTime(value: string) {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (elapsedMinutes < 1) return "방금";
  if (elapsedMinutes < 60) return `${elapsedMinutes}분`;
  const hours = Math.floor(elapsedMinutes / 60);
  if (hours < 24) return `${hours}시간`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일`;
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(value));
}

function safeTarget(path: string) {
  return path.startsWith("/") && !path.startsWith("//") ? path : "/admin/dashboard";
}

export function AdminNotificationMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async (notifyFailure = false) => {
    setLoading(true);
    try {
      setNotifications(await getNotifications());
      setFailed(false);
    } catch (reason) {
      setFailed(true);
      if (notifyFailure) showToast(apiErrorMessage(reason, "알림을 불러오지 못했습니다."), { tone: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getNotifications()
      .then((items) => {
        if (!active) return;
        setNotifications(items);
        setFailed(false);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [pathname]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  const unreadCount = notifications.filter((item) => !item.readAt).length;

  async function readAll() {
    if (!unreadCount || saving) return;
    setSaving("all");
    try {
      const result = await markAllNotificationsRead();
      const readAt = result.readAt ?? new Date().toISOString();
      setNotifications((current) => current.map((item) => item.readAt ? item : { ...item, readAt }));
    } catch (reason) {
      showToast(apiErrorMessage(reason, "알림을 모두 읽음 처리하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(null);
    }
  }

  async function openNotification(item: UserNotification) {
    if (saving) return;
    setSaving(item.id);
    try {
      if (!item.readAt) {
        const updated = await markNotificationRead(item.id);
        setNotifications((current) => current.map((notification) => notification.id === updated.id ? updated : notification));
      }
      setOpen(false);
      router.push(safeTarget(item.targetPath));
    } catch (reason) {
      showToast(apiErrorMessage(reason, "알림을 처리하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="admin-notification-center" ref={rootRef}>
      <button
        type="button"
        className={`topbar-notification ${open ? "active" : ""}`}
        aria-label={`알림 확인${unreadCount ? `, 읽지 않은 알림 ${unreadCount}개` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="admin-notification-menu"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && failed) void load(true);
        }}
      >
        <Icon name="bell" />
        {unreadCount > 0 && <i aria-hidden="true" />}
      </button>

      {open && (
        <section id="admin-notification-menu" className="admin-notification-menu" role="dialog" aria-label="알림 목록">
          <header>
            <h2>알림</h2>
            <button type="button" disabled={!unreadCount || saving !== null} onClick={() => void readAll()}>전체 읽기</button>
          </header>
          <div className="admin-notification-list" aria-busy={loading} aria-live="polite">
            {loading ? (
              <div className="admin-notification-state"><span className="spinner" /><span>알림을 불러오고 있습니다.</span></div>
            ) : failed ? (
              <div className="admin-notification-state error"><Icon name="alert-circle" /><span>알림을 불러오지 못했습니다.</span><button type="button" onClick={() => void load(true)}>다시 시도</button></div>
            ) : notifications.length ? notifications.map((item) => (
              <button
                type="button"
                className={`admin-notification-item ${item.readAt ? "read" : "unread"}`}
                disabled={saving !== null}
                key={item.id}
                onClick={() => void openNotification(item)}
              >
                <span className="admin-notification-avatar" aria-hidden="true">{item.title.trim().slice(0, 1) || "?"}</span>
                <span className="admin-notification-copy">
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                </span>
                <time dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time>
              </button>
            )) : (
              <div className="admin-notification-state"><Icon name="bell" /><span>도착한 알림이 없습니다.</span></div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
