"use client";

import { Icon } from "@/components/Icon";
import type { ReactNode } from "react";

export interface WorkspaceTab<T extends string> {
  id: T;
  label: string;
  count?: number;
}

export function WorkspaceTabs<T extends string>({ tabs, active, onChange, label = "화면 탭" }: { tabs: readonly WorkspaceTab<T>[]; active: T; onChange: (tab: T) => void; label?: string }) {
  return (
    <div className="workspace-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab) => <button type="button" role="tab" aria-selected={active === tab.id} className={active === tab.id ? "active" : ""} key={tab.id} onClick={() => onChange(tab.id)}>{tab.label}{tab.count != null && <span>{tab.count}</span>}</button>)}
    </div>
  );
}

export function WorkspaceSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="workspace-search"><Icon name="search" /><span className="sr-only">검색</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

export function PersonAvatar({
  name,
  size = "medium",
}: {
  name: string;
  size?: "small" | "medium" | "large";
}) {
  return <span className={`person-avatar ${size}`} aria-hidden="true">{name.trim().slice(0, 1) || "?"}</span>;
}

export function StatusPill({ tone = "neutral", children }: { tone?: "blue" | "green" | "red" | "orange" | "neutral"; children: ReactNode }) {
  return <span className={`workspace-status ${tone}`}>{children}</span>;
}

export function WorkspaceEmpty({ icon = "users", title, description, action }: { icon?: "users" | "file" | "growth"; title: string; description: string; action?: ReactNode }) {
  return <div className="workspace-empty"><Icon name={icon} /><strong>{title}</strong><span>{description}</span>{action}</div>;
}
