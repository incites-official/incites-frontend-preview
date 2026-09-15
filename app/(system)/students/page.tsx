import { AuthGuard } from "@/components/auth/AuthGuard";
import { StudentGrowthManagement } from "@/components/students/StudentGrowthManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "학생 성장 관리" };
export default function StudentsPage() { return <AuthGuard roles={["ADMIN", "OPERATOR"]}><StudentGrowthManagement /></AuthGuard>; }
