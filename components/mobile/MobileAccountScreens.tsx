"use client";

import { Icon } from "@/components/Icon";
import { showToast } from "@/components/feedback/Toast";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  apiErrorMessage,
  deactivateCurrentUser,
  getCurrentUserProfileImage,
  getNotificationSetting,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateCurrentUserPassword,
  updateCurrentUserProfile,
  updateCurrentUserProfileImage,
  updateNotificationSetting,
  type NotificationSetting,
  type UserNotification,
} from "@/lib/incites-api";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useState } from "react";

type MobileRole = "student" | "parent";
type NotificationSettingKey = "observationEnabled" | "growthEnabled" | "serviceEnabled";
type NotificationFilter = "all" | "read" | "unread";

const defaultNotificationSetting: NotificationSetting = {
  observationEnabled: true,
  growthEnabled: true,
  serviceEnabled: true,
  updatedAt: "",
};

function roleLabel(role: MobileRole) {
  return role === "student" ? "학생" : "학부모";
}

function useCurrentProfileImage(hasProfileImage: boolean | undefined, version: string | null | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    if (!hasProfileImage) {
      return () => { active = false; };
    }

    void getCurrentUserProfileImage()
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      })
      .catch(() => {
        if (active) setImageUrl(null);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [hasProfileImage, version]);

  return imageUrl;
}

function ProfileAvatar({ editable = false, saving = false, onSelect }: {
  editable?: boolean;
  saving?: boolean;
  onSelect?: (file: File) => void;
}) {
  const { user } = useAuth();
  const inputId = useId();
  const imageUrl = useCurrentProfileImage(user?.hasProfileImage, user?.profileImageUpdatedAt);
  const initial = (user?.name ?? "사용자").trim().slice(0, 1) || "?";

  return (
    <span className={`mobile-profile-image ${imageUrl ? "has-image" : ""}`}>
      {imageUrl ? <Image src={imageUrl} alt="" width={80} height={80} unoptimized /> : <span aria-hidden="true">{initial}</span>}
      {editable && (
        <label className="mobile-profile-image-edit" htmlFor={inputId} aria-label="프로필 이미지 변경">
          {saving ? <span className="button-spinner" /> : <Icon name="edit" />}
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={saving}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onSelect?.(file);
              event.target.value = "";
            }}
          />
        </label>
      )}
    </span>
  );
}

export function MyScreen({ role }: { role: MobileRole }) {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<NotificationSetting>(defaultNotificationSetting);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSetting, setSavingSetting] = useState<NotificationSettingKey | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    let active = true;
    void getNotificationSetting()
      .then((setting) => { if (active) setSettings(setting); })
      .catch((reason) => {
        if (active) showToast(apiErrorMessage(reason, "알림 설정을 불러오지 못했습니다."), { tone: "error" });
      })
      .finally(() => { if (active) setSettingsLoading(false); });
    return () => { active = false; };
  }, []);

  async function changeSetting(key: NotificationSettingKey, enabled: boolean) {
    const previous = settings;
    const next = { ...settings, [key]: enabled };
    setSettings(next);
    setSavingSetting(key);
    try {
      const saved = await updateNotificationSetting({
        observationEnabled: next.observationEnabled,
        growthEnabled: next.growthEnabled,
        serviceEnabled: next.serviceEnabled,
      });
      setSettings(saved);
    } catch (reason) {
      setSettings(previous);
      showToast(apiErrorMessage(reason, "알림 설정을 변경하지 못했습니다."), { tone: "error" });
    } finally {
      setSavingSetting(null);
    }
  }

  async function withdraw() {
    setWithdrawing(true);
    try {
      await deactivateCurrentUser();
      await logout();
    } catch (reason) {
      showToast(apiErrorMessage(reason, "회원탈퇴를 처리하지 못했습니다."), { tone: "error" });
      setWithdrawing(false);
    }
  }

  const serviceNotice = (label: string) => showToast(`${label} 페이지는 준비 중입니다.`);

  return (
    <div className="mobile-screen my-screen">
      <Link className="mobile-my-profile-card" href={`/${role}/my/profile`}>
        <ProfileAvatar />
        <span className="mobile-my-profile-copy">
          <strong>{user?.name ?? "사용자"}<em>{roleLabel(role)}</em></strong>
          <small>{user?.email ?? "이메일 미등록"}</small>
        </span>
        <Icon name="chevron-right" />
      </Link>

      <section className="mobile-my-section" aria-busy={settingsLoading}>
        <h2>알림 설정</h2>
        <div className="mobile-my-list mobile-notification-settings">
          {([
            ["observationEnabled", "관찰 기록 알림"],
            ["growthEnabled", "성장 리포트 알림"],
            ["serviceEnabled", "서비스 알림"],
          ] as const).map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <input
                type="checkbox"
                checked={settings[key]}
                disabled={settingsLoading || savingSetting !== null}
                onChange={(event) => void changeSetting(key, event.target.checked)}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="mobile-my-section">
        <h2>서비스 정보</h2>
        <div className="mobile-my-list">
          {(["공지사항", "이용약관", "개인정보 처리방침", "고객센터"] as const).map((label) => (
            <button type="button" key={label} onClick={() => serviceNotice(label)}>
              <span>{label}</span><Icon name="chevron-right" />
            </button>
          ))}
        </div>
      </section>

      <div className="mobile-my-list mobile-account-actions">
        <button type="button" onClick={() => void logout()}><span>로그아웃</span><Icon name="chevron-right" /></button>
        <button type="button" className="danger" onClick={() => setWithdrawOpen(true)}><span>회원탈퇴</span><Icon name="chevron-right" /></button>
      </div>

      {withdrawOpen && (
        <div className="mobile-dialog-backdrop" role="presentation">
          <section className="mobile-dialog mobile-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="withdraw-title">
            <Icon name="warning" />
            <h2 id="withdraw-title">회원탈퇴</h2>
            <p>계정 이용이 즉시 중지되고 다시 로그인할 수 없습니다. 성장 기록과 리포트는 운영 정책에 따라 보존됩니다.</p>
            <div>
              <button type="button" disabled={withdrawing} onClick={() => setWithdrawOpen(false)}>취소</button>
              <button type="button" disabled={withdrawing} onClick={() => void withdraw()}>{withdrawing ? "처리 중..." : "탈퇴하기"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export function ProfileSettingsScreen({ role }: { role: MobileRole }) {
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [editing, setEditing] = useState<"name" | "email" | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageSaving, setImageSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function saveProfile(field: "name" | "email") {
    if (editing !== field) {
      setEditing(field);
      return;
    }
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const updated = await updateCurrentUserProfile({ name: name.trim(), email: email.trim() });
      setName(updated.name);
      setEmail(updated.email);
      await refreshUser();
      setEditing(null);
      showToast(`${field === "name" ? "이름" : "이메일"}을 변경했습니다.`, { tone: "success" });
    } catch (reason) {
      showToast(apiErrorMessage(reason, "프로필 정보를 변경하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function saveProfileImage(file: File) {
    setImageSaving(true);
    try {
      await updateCurrentUserProfileImage(file);
      await refreshUser();
      showToast("프로필 이미지를 변경했습니다.", { tone: "success" });
    } catch (reason) {
      showToast(apiErrorMessage(reason, "프로필 이미지를 변경하지 못했습니다."), { tone: "error" });
    } finally {
      setImageSaving(false);
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("새 비밀번호와 확인 값이 일치하지 않습니다.", { tone: "error" });
      return;
    }
    setSaving(true);
    try {
      await updateCurrentUserPassword({ currentPassword, newPassword });
      setPasswordOpen(false);
      await logout();
    } catch (reason) {
      showToast(apiErrorMessage(reason, "비밀번호를 변경하지 못했습니다."), { tone: "error" });
      setSaving(false);
    }
  }

  function openPassword() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordOpen(true);
  }

  return (
    <div className="mobile-profile-settings-screen">
      <header className="mobile-standalone-header">
        <Link href={`/${role}/my`} aria-label="마이페이지로 돌아가기"><Icon name="arrow-left" /></Link>
        <h1>프로필 설정</h1>
      </header>

      <section className="mobile-profile-hero">
        <ProfileAvatar editable saving={imageSaving} onSelect={(file) => void saveProfileImage(file)} />
        <strong>{user?.name ?? "사용자"}</strong>
        <span>{roleLabel(role)}</span>
      </section>

      <section className="mobile-profile-fields">
        <div className="mobile-profile-field">
          <header><strong>이름</strong><button type="button" disabled={saving} onClick={() => void saveProfile("name")}><Icon name={editing === "name" ? "check" : "edit"} />{editing === "name" ? "저장" : "편집"}</button></header>
          <input value={name} maxLength={100} readOnly={editing !== "name"} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="mobile-profile-field">
          <header><strong>이메일</strong><button type="button" disabled={saving} onClick={() => void saveProfile("email")}><Icon name={editing === "email" ? "check" : "edit"} />{editing === "email" ? "저장" : "편집"}</button></header>
          <input type="email" value={email} maxLength={255} readOnly={editing !== "email"} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className="mobile-profile-field">
          <header><strong>비밀번호</strong><button type="button" onClick={openPassword}><Icon name="edit" />편집</button></header>
          <button type="button" className="mobile-password-field" onClick={openPassword}><span>••••••••</span><Icon name="eye-off" /></button>
        </div>
      </section>

      {passwordOpen && (
        <div className="mobile-dialog-backdrop" role="presentation">
          <form className="mobile-dialog mobile-account-dialog" onSubmit={(event) => void savePassword(event)}>
            <button type="button" className="close" onClick={() => setPasswordOpen(false)} aria-label="닫기"><Icon name="close" /></button>
            <Icon name="key" /><h2>비밀번호 변경</h2><p>변경 후 모든 기기에서 로그아웃됩니다.</p>
            <label>현재 비밀번호<input type="password" value={currentPassword} autoComplete="current-password" onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
            <label>새 비밀번호<input type="password" value={newPassword} minLength={10} maxLength={72} autoComplete="new-password" onChange={(event) => setNewPassword(event.target.value)} placeholder="영문·숫자·특수문자 포함 10자 이상" required /></label>
            <label>새 비밀번호 확인<input type="password" value={confirmPassword} minLength={10} maxLength={72} autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
            <button type="submit" disabled={saving || !currentPassword || newPassword.length < 10 || !confirmPassword}>{saving ? "변경 중..." : "비밀번호 변경"}</button>
          </form>
        </div>
      )}
    </div>
  );
}

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

function safeMobileTarget(path: string, role: MobileRole) {
  const roleRoot = `/${role}`;
  return path === roleRoot || path.startsWith(`${roleRoot}/`) || path.startsWith(`${roleRoot}?`)
    ? path
    : roleRoot;
}

export function NotificationScreen({ role }: { role: MobileRole }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getNotifications()
      .then((items) => { if (active) setNotifications(items); })
      .catch((reason) => {
        if (active) showToast(apiErrorMessage(reason, "알림을 불러오지 못했습니다."), { tone: "error" });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const filtered = notifications.filter((item) => filter === "all" || (filter === "read" ? Boolean(item.readAt) : !item.readAt));

  async function readAll() {
    if (!unreadCount) return;
    setSaving(true);
    try {
      const result = await markAllNotificationsRead();
      const readAt = result.readAt ?? new Date().toISOString();
      setNotifications((current) => current.map((item) => item.readAt ? item : { ...item, readAt }));
    } catch (reason) {
      showToast(apiErrorMessage(reason, "알림을 모두 읽음 처리하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function openNotification(item: UserNotification) {
    setSaving(true);
    try {
      if (!item.readAt) {
        const updated = await markNotificationRead(item.id);
        setNotifications((current) => current.map((notification) => notification.id === updated.id ? updated : notification));
      }
      router.push(safeMobileTarget(item.targetPath, role));
    } catch (reason) {
      showToast(apiErrorMessage(reason, "알림을 처리하지 못했습니다."), { tone: "error" });
      setSaving(false);
    }
  }

  return (
    <div className="mobile-alert-screen">
      <header className="mobile-alert-header">
        <button type="button" className="mobile-alert-back" aria-label="이전 화면으로 이동" onClick={() => router.push(`/${role}`)}><Icon name="arrow-left" /></button>
        <h1>알림</h1>
      </header>
      <div className="mobile-alert-toolbar">
        <div role="tablist" aria-label="알림 필터">
          {([['all', '전체'], ['read', '읽음'], ['unread', '안 읽음']] as const).map(([value, label]) => (
            <button type="button" role="tab" aria-selected={filter === value} className={filter === value ? "active" : ""} key={value} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>
        <button type="button" className="mobile-read-all" disabled={!unreadCount || saving} onClick={() => void readAll()}>전체 읽음</button>
      </div>

      <section className="mobile-alert-list" aria-busy={loading} aria-live="polite">
        {loading ? (
          <div className="mobile-alert-state"><span className="spinner" /><span>알림을 불러오고 있습니다.</span></div>
        ) : filtered.length ? filtered.map((item) => (
          <button type="button" className={`mobile-alert-card ${item.readAt ? "read" : "unread"}`} disabled={saving} key={item.id} onClick={() => void openNotification(item)}>
            <span className="mobile-alert-avatar" aria-hidden="true">{item.title.trim().slice(0, 1) || "?"}</span>
            <span className="mobile-alert-copy">
              <strong>{item.title}</strong>
              <span>{item.message}</span>
            </span>
            <time dateTime={item.createdAt}>{relativeTime(item.createdAt)}</time>
          </button>
        )) : (
          <div className="mobile-alert-state"><Icon name="bell" /><strong>{filter === "all" ? "도착한 알림이 없습니다." : `${filter === "read" ? "읽은" : "읽지 않은"} 알림이 없습니다.`}</strong></div>
        )}
      </section>
    </div>
  );
}
