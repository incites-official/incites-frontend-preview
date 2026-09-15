import { AuthGuard } from "@/components/auth/AuthGuard";
import { MemberManagement } from "@/components/members/MemberManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "학생 및 보호자 관리" };
export default function StudentMemberManagementPage() { return <AuthGuard roles={["ADMIN"]}><MemberManagement initialTab="students" /></AuthGuard>; }
