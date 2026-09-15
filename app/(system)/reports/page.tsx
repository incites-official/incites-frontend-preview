import { AuthGuard } from "@/components/auth/AuthGuard";
import { ReportReview } from "@/components/reports/ReportReview";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI 성장 리포트 검토" };
export default function ReportsPage() { return <AuthGuard roles={["ADMIN", "OPERATOR"]}><ReportReview /></AuthGuard>; }
