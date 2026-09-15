import { AuthGuard } from "@/components/auth/AuthGuard";
import { MobileRoleShell } from "@/components/mobile/MobileRoleShell";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard roles={["STUDENT"]}><MobileRoleShell role="student">{children}</MobileRoleShell></AuthGuard>;
}
