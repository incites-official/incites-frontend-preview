import { UserManagement } from "@/components/users/UserManagement";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "관리자 관리" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string | string[] }>;
}) {
  const create = (await searchParams).create;
  return <UserManagement initialCreate={(Array.isArray(create) ? create[0] : create) === "1"} />;
}
