import { ReportScreen } from "@/components/mobile/MobileScreens";
import { Suspense } from "react";

export default function StudentReportPage() {
  return <Suspense fallback={null}><ReportScreen role="student" /></Suspense>;
}
