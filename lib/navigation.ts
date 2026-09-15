import type { Role } from "@/lib/types";

export function homePathForRole(role: Role) {
  if (role === "STUDENT") return "/student";
  if (role === "PARENT") return "/parent";
  return "/admin/dashboard";
}
