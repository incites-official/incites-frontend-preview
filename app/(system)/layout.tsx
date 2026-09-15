import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { UiRoleProvider } from "@/components/providers/UiRoleProvider";

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard roles={["ADMIN", "OPERATOR"]} loginPath="/admin/login">
      <UiRoleProvider>
        <AppShell>{children}</AppShell>
      </UiRoleProvider>
    </AuthGuard>
  );
}
