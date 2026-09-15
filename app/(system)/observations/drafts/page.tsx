import { AuthGuard } from "@/components/auth/AuthGuard";
import { ObservationWorkspace } from "@/components/observations/ObservationWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "관찰 기록 임시저장함" };
export default function ObservationDraftsPage() { return <AuthGuard roles={["OPERATOR"]}><ObservationWorkspace initialView="drafts" /></AuthGuard>; }
