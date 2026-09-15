import { AuthGuard } from "@/components/auth/AuthGuard";
import { MobileRoleShell } from "@/components/mobile/MobileRoleShell";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard roles={["PARENT"]}><MobileRoleShell role="parent">{children}</MobileRoleShell></AuthGuard>;
}
