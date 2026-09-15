"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminAccountList } from "@/components/admin/AdminAccountList";
import { RolePermissionMatrix } from "@/components/admin/RolePermissionMatrix";
import { showToast } from "@/components/feedback/Toast";
import { Icon } from "@/components/Icon";
import { InlineMessage, SoftButton, SoftDropdown, SoftInput, SoftModal } from "@/components/soft/Soft";
import { apiFetch, ApiError } from "@/lib/api";
import type { PageResponse, Role, RoleOption, UserListItem } from "@/lib/types";
import { FormEvent, useCallback, useEffect, useState } from "react";

interface UserFormState {
  password: string;
  name: string;
  email: string;
  company: string;
  department: string;
  position: string;
  role: Role;
  active: boolean;
}

type ValidatedUserField = "name" | "email" | "password";
type UserFormErrors = Partial<Record<ValidatedUserField, string>>;

const emptyForm: UserFormState = {
  password: "", name: "", email: "", company: "", department: "", position: "", role: "ADMIN", active: true,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const defaultRoleOptions: RoleOption[] = [
  { value: "ADMIN", label: "총괄관리자 (SA)" },
  { value: "OPERATOR", label: "일반관리자 (GA)" },
];

function validateUserForm(form: UserFormState, editing: boolean): UserFormErrors {
  const errors: UserFormErrors = {};

  if (!form.name.trim()) errors.name = "관리자 이름을 입력해 주세요.";

  if (!form.email.trim()) errors.email = "이메일 주소를 입력해 주세요.";
  else if (!emailPattern.test(form.email.trim())) errors.email = "올바른 이메일 주소 형식으로 입력해 주세요.";

  if (!editing) {
    if (!form.password) errors.password = "초기 비밀번호를 입력해 주세요.";
    else if (form.password.length < 10) errors.password = "초기 비밀번호는 10자 이상 입력해 주세요.";
  }

  return errors;
}

export function UserManagement({ initialCreate = false }: { initialCreate?: boolean }) {
  const [pageData, setPageData] = useState<PageResponse<UserListItem> | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(initialCreate);
  const [editing, setEditing] = useState<UserListItem | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [touchedFields, setTouchedFields] = useState<Partial<Record<ValidatedUserField, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<UserListItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: "20" });
      if (query) params.set("query", query);
      params.set("roles", roleFilter === "ALL" ? "ADMIN,OPERATOR" : roleFilter);
      const [users, roleOptions] = await Promise.all([
        apiFetch<PageResponse<UserListItem>>(`/api/users?${params.toString()}`),
        apiFetch<RoleOption[]>("/api/users/roles"),
      ]);
      setPageData((current) => {
        if (page === 0 || !current) return users;
        const merged = [...current.items, ...users.items];
        return { ...users, items: merged.filter((user, index) => merged.findIndex((item) => item.id === user.id) === index) };
      });
      setRoles(roleOptions);
    } catch (requestError) {
      showToast(requestError instanceof ApiError ? requestError.message : "사용자 목록을 불러오지 못했습니다.", { tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, query, roleFilter]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadUsers(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadUsers]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setTouchedFields({});
    setFormOpen(true);
  }

  function openEdit(user: UserListItem) {
    setEditing(user);
    setForm({
      password: "",
      name: user.name,
      email: user.email,
      company: user.company ?? "",
      department: user.department ?? "",
      position: user.position ?? "",
      role: user.role,
      active: user.active,
    });
    setTouchedFields({});
    setFormOpen(true);
  }

  function updateForm<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function touchField(field: ValidatedUserField) {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  }

  async function submitUser(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validateUserForm(form, Boolean(editing));
    if (Object.keys(validationErrors).length) {
      setTouchedFields({ name: true, email: true, password: true });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiFetch<UserListItem>(`/api/users/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: form.name, email: form.email, company: form.company, department: form.department,
            position: form.position, role: form.role, active: form.active,
          }),
        });
        setNotice("사용자 정보가 수정되었습니다.");
      } else {
        await apiFetch<UserListItem>("/api/users", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setNotice("새 사용자가 등록되었습니다.");
      }
      setFormOpen(false);
      await loadUsers();
    } catch (requestError) {
      showToast(requestError instanceof ApiError ? requestError.message : "사용자 정보를 저장하지 못했습니다.", { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    if (!passwordTarget) return;
    setSaving(true);
    try {
      await apiFetch<void>(`/api/users/${passwordTarget.id}/password`, {
        method: "PUT",
        body: JSON.stringify({ newPassword }),
      });
      setPasswordTarget(null);
      setNewPassword("");
      setNotice("비밀번호가 변경되어 해당 사용자의 기존 세션이 종료되었습니다.");
    } catch (requestError) {
      showToast(requestError instanceof ApiError ? requestError.message : "비밀번호를 변경하지 못했습니다.", { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function deactivateUser() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await apiFetch<void>(`/api/users/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      setNotice("사용자 계정이 사용 중지되었습니다.");
      await loadUsers();
    } catch (requestError) {
      showToast(requestError instanceof ApiError ? requestError.message : "사용자를 삭제하지 못했습니다.", { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(0);
    setQuery(searchText.trim());
  }

  const visibleUsers = pageData?.items ?? [];
  const hasMore = Boolean(pageData && pageData.page + 1 < pageData.totalPages);
  const formErrors = validateUserForm(form, Boolean(editing));
  const isFormValid = Object.keys(formErrors).length === 0;
  const selectableRoles = (roles.length ? roles : defaultRoleOptions).filter((role) => role.value === "ADMIN" || role.value === "OPERATOR").map((role) => ({
    value: role.value,
    label: role.value === "ADMIN" ? "총괄관리자 (SA)" : role.value === "OPERATOR" ? "일반관리자 / 강사 (GA)" : role.label,
  }));

  function loadMoreUsers() {
    if (!loading && pageData && pageData.page + 1 < pageData.totalPages) setPage(pageData.page + 1);
  }

  function changeRoleFilter(value: "ALL" | Role) {
    setPage(0);
    setRoleFilter(value);
  }

  return (
    <AuthGuard roles={["ADMIN"]}>
      <div className="users-page page-stack">
        <div className="page-heading admin-page-heading">
          <div><h2>관리자 관리</h2><p>센터 내 총괄관리자 및 일반관리자, 교사 계정을 등록하고 서버 권한 정책을 확인합니다.</p></div>
          <SoftButton className="admin-create-button" variant="dark" type="button" onClick={openCreate}><Icon name="plus" />신규 관리자 등록</SoftButton>
        </div>

        {notice && <InlineMessage tone="success"><Icon name="check" />{notice}<button type="button" onClick={() => setNotice(null)}>닫기</button></InlineMessage>}

        <div className="admin-management-grid">
          <AdminAccountList users={visibleUsers} total={pageData?.total ?? null} loading={loading} searchText={searchText} roleFilter={roleFilter} roleOptions={roles} hasMore={hasMore} onSearchTextChange={setSearchText} onSearch={submitSearch} onRoleFilterChange={changeRoleFilter} onLoadMore={loadMoreUsers} onEdit={openEdit} onChangePassword={(user) => { setPasswordTarget(user); setNewPassword(""); }} onDeactivate={setDeleteTarget} />
          <RolePermissionMatrix roles={roles} />
        </div>

        <SoftModal className="admin-modal admin-account-modal" open={formOpen} title={editing ? "관리자 정보 수정" : "신규 관리자 계정 발급"} onClose={() => !saving && setFormOpen(false)} footer={<><SoftButton variant="secondary" type="button" onClick={() => setFormOpen(false)} disabled={saving}>취소</SoftButton><SoftButton type="submit" form="user-form" disabled={saving || !isFormValid}>{saving ? "저장 중..." : editing ? "정보 저장" : "계정 발급"}</SoftButton></>}>
          <form id="user-form" className={`user-form ${editing ? "editing" : "creating"}`} onSubmit={submitUser} noValidate>
            <div className="form-grid">
              <SoftInput label="관리자 이름 *" placeholder="예: 최유성" value={form.name} onChange={(event) => updateForm("name", event.target.value)} onBlur={() => touchField("name")} error={touchedFields.name ? formErrors.name : undefined} required />
              <SoftInput label="로그인 이메일 *" placeholder="admin@incites.edu" type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} onBlur={() => touchField("email")} error={touchedFields.email ? formErrors.email : undefined} autoComplete="username" required />
              <SoftDropdown className="admin-modal-role" label="권한 선택 *" value={form.role} options={selectableRoles} onChange={(value) => updateForm("role", value as Role)} />
              <SoftInput label="담당 범위 / 학급" placeholder="예: 창의 융합 B반" value={form.department} onChange={(event) => updateForm("department", event.target.value)} />
              {editing && <><SoftInput label="회사" value={form.company} onChange={(event) => updateForm("company", event.target.value)} /><SoftInput label="직급" value={form.position} onChange={(event) => updateForm("position", event.target.value)} /></>}
              {!editing && <div className="admin-account-credentials"><SoftInput label="초기 비밀번호 *" type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} onBlur={() => touchField("password")} error={touchedFields.password ? formErrors.password : undefined} minLength={10} autoComplete="new-password" required /></div>}
            </div>
            {editing && <label className="switch-field"><span><strong>계정 사용</strong><small>중지하면 해당 사용자의 세션이 즉시 종료됩니다.</small></span><input type="checkbox" checked={form.active} onChange={(event) => updateForm("active", event.target.checked)} /><i /></label>}
            {!editing && <p className="admin-issuance-note"><Icon name="info" />입력한 이메일이 로그인 아이디로 사용되며, 계정 생성 후 초기 로그인 안내 메일이 발송됩니다.</p>}
          </form>
        </SoftModal>

        <SoftModal className="admin-modal admin-compact-modal" open={Boolean(passwordTarget)} title="비밀번호 변경" description={`${passwordTarget?.name ?? "사용자"}의 새 비밀번호를 설정합니다.`} onClose={() => !saving && setPasswordTarget(null)} footer={<><SoftButton variant="secondary" onClick={() => setPasswordTarget(null)} disabled={saving}>취소</SoftButton><SoftButton type="submit" form="password-form" disabled={saving}>변경</SoftButton></>}>
          <form id="password-form" onSubmit={changePassword}><SoftInput label="새 비밀번호" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={10} autoComplete="new-password" required /><p className="form-help">변경 즉시 기존 로그인 세션이 종료됩니다.</p></form>
        </SoftModal>

        <SoftModal className="admin-modal admin-compact-modal" open={Boolean(deleteTarget)} title="사용자 계정 중지" description="이 작업은 사용자 접근 권한에 즉시 반영됩니다." onClose={() => !saving && setDeleteTarget(null)} footer={<><SoftButton variant="secondary" onClick={() => setDeleteTarget(null)} disabled={saving}>취소</SoftButton><SoftButton variant="danger" onClick={() => void deactivateUser()} disabled={saving}>사용 중지</SoftButton></>}>
          <div className="confirm-copy"><span className="confirm-icon"><Icon name="warning" /></span><p><strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) 계정을 사용 중지하시겠습니까?<br />현재 로그인되어 있다면 세션도 함께 종료됩니다.</p></div>
        </SoftModal>
      </div>
    </AuthGuard>
  );
}
