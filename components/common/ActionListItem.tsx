import { Icon } from "@/components/Icon";
import Link from "next/link";
import type { ReactNode } from "react";

export type ActionListItemTone = "neutral" | "blue" | "green" | "orange" | "red";

export function ActionListItem({
  href,
  title,
  description,
  tone = "neutral",
}: {
  href: string;
  title: ReactNode;
  description: ReactNode;
  tone?: ActionListItemTone;
}) {
  return (
    <Link className={`action-list-item ${tone}`} href={href}>
      <span className="action-list-item-title"><i />{title}</span>
      <small>{description}</small>
      <Icon name="arrow-up-right" />
    </Link>
  );
}
