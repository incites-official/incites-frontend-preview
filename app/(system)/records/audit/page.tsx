import { AuthGuard } from "@/components/auth/AuthGuard";
import { RecordControl } from "@/components/records/RecordControl";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "관찰 기록 감사" };
export default function RecordAuditPage() { return <AuthGuard roles={["ADMIN"]}><RecordControl initialTab="audit" /></AuthGuard>; }
