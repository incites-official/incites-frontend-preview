import { AuthGuard } from "@/components/auth/AuthGuard";
import { MemberManagement } from "@/components/members/MemberManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "보호자 연결 관리" };
export default function GuardianManagementPage() { return <AuthGuard roles={["ADMIN"]}><MemberManagement initialTab="connections" /></AuthGuard>; }
