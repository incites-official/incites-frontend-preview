import { AdminStudentAssignment } from "@/components/admin/AdminStudentAssignment";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "담당 학생 배정" };

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminStudentAssignmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string | string[]; position?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const administratorName = firstValue(query.name) ?? "관리자";
  const administratorPosition = firstValue(query.position) ?? "";

  return (
    <AdminStudentAssignment
      administratorId={id}
      administratorName={administratorName}
      administratorPosition={administratorPosition}
    />
  );
}
