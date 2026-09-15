import { Icon } from "@/components/Icon";
import Link from "next/link";

export interface SidebarMenuItem {
  href: string;
  label: string;
}

export function SidebarMenuGroup({ label, items, activePath, onNavigate }: { label: string; items: SidebarMenuItem[]; activePath: string; onNavigate: () => void }) {
  const active = items.some((item) => item.href === activePath || activePath.startsWith(`${item.href}/`));
  return (
    <div className={`sidebar-menu-group ${active ? "active" : ""}`}>
      <Link href={items[0].href} className="sidebar-menu-parent" onClick={onNavigate} aria-current={active ? "page" : undefined}>
        <span>{label}</span><Icon name="chevron-right" />
      </Link>
      {active && (
        <div className="sidebar-submenu">
          {items.map((item) => <Link href={item.href} key={item.href} className={item.href === activePath ? "current" : ""} onClick={onNavigate}>{item.label}</Link>)}
        </div>
      )}
    </div>
  );
}
