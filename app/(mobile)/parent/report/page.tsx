import { ReportScreen } from "@/components/mobile/MobileScreens";
import { Suspense } from "react";

export default function ParentReportPage() {
  return <Suspense fallback={null}><ReportScreen role="parent" /></Suspense>;
}
