import { Icon } from "@/components/Icon";
import type { RoleOption } from "@/lib/types";

const defaultRoles: RoleOption[] = [
  { value: "ADMIN", label: "총괄관리자 (SA)" },
  { value: "OPERATOR", label: "일반관리자 (GA)" },
];

const permissionRules = [
  { id: "01", label: "로그인 및 세션 인증", allowed: ["ADMIN", "OPERATOR"] },
  { id: "02", label: "운영 대시보드 조회", allowed: ["ADMIN"] },
  { id: "03", label: "관리자 계정 및 역할 관리", allowed: ["ADMIN"] },
  { id: "04", label: "학생·보호자 연결 관리", allowed: ["ADMIN"] },
  { id: "05", label: "담당 학생 목록 조회", allowed: ["ADMIN", "OPERATOR"] },
  { id: "06", label: "관찰 기록 작성 및 임시저장", allowed: ["ADMIN", "OPERATOR"] },
  { id: "07", label: "성장 리포트 검토", allowed: ["ADMIN", "OPERATOR"] },
  { id: "08", label: "전체 기록 감사 및 공개 통제", allowed: ["ADMIN"] },
] as const;

export function RolePermissionMatrix({ roles }: { roles: RoleOption[] }) {
  const displayedRoles = (roles.length ? roles : defaultRoles).filter((role) => role.value === "ADMIN" || role.value === "OPERATOR");
  return (
    <section className="soft-card permission-matrix-card">
      <div className="admin-card-heading permission-heading"><div><h3>기능별 권한 매트릭스</h3><p>서버 접근 정책 기준 · 읽기 전용</p></div></div>
      <div className="permission-table-scroll">
        <table className="permission-table">
          <thead><tr><th>ID</th><th>기능명</th>{displayedRoles.map((role) => <th key={role.value}>{role.value === "ADMIN" ? "총괄 (SA)" : role.value === "OPERATOR" ? "교사 (GA)" : role.label}</th>)}</tr></thead>
          <tbody>{permissionRules.map((permission) => <tr key={permission.id}><td>{permission.id}</td><td>{permission.label}</td>{displayedRoles.map((role) => { const allowed = (permission.allowed as readonly string[]).includes(role.value); return <td key={role.value}><span className={`permission-check ${allowed ? "allowed" : ""}`} role="img" aria-label={`${role.label} ${allowed ? "허용" : "허용 안 됨"}`}>{allowed && <Icon name="check" />}</span></td>; })}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
