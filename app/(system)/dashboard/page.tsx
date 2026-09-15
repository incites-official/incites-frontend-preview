import { DashboardView } from "@/components/dashboard/DashboardView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "대시보드" };

export default function DashboardPage() {
  return <DashboardView />;
}
