import { ParentHomeScreen } from "@/components/mobile/MobileScreens";
import { Suspense } from "react";

export default function ParentHomePage() {
  return <Suspense fallback={null}><ParentHomeScreen /></Suspense>;
}
