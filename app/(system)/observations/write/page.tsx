import { AuthGuard } from "@/components/auth/AuthGuard";
import { ObservationWorkspace } from "@/components/observations/ObservationWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "관찰 기록 작성" };
export default function ObservationWritePage() { return <AuthGuard roles={["OPERATOR"]}><ObservationWorkspace initialView="write" /></AuthGuard>; }
