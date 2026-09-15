import { AuthGuard } from "@/components/auth/AuthGuard";
import { RecordControl } from "@/components/records/RecordControl";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "리포트 통제" };
export default function ReportControlPage() { return <AuthGuard roles={["ADMIN"]}><RecordControl initialTab="reports" /></AuthGuard>; }
