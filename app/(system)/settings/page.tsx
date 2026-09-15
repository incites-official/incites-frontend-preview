import { AuthGuard } from "@/components/auth/AuthGuard";
import { SystemSettings } from "@/components/settings/SystemSettings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "시스템 설정" };
export default function SettingsPage() { return <AuthGuard roles={["ADMIN"]}><SystemSettings /></AuthGuard>; }
