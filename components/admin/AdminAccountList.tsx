import { Icon } from "@/components/Icon";
import { SoftBadge, SoftDropdown } from "@/components/soft/Soft";
import type { Role, RoleOption, UserListItem } from "@/lib/types";
import Link from "next/link";
import { type FormEvent, useEffect, useRef } from "react";

export function AdminAccountList({
  users,
  total,
  loading,
  searchText,
  roleFilter,
  roleOptions,
  hasMore,
  onSearchTextChange,
  onSearch,
  onRoleFilterChange,
  onLoadMore,
  onEdit,
  onChangePassword,
  onDeactivate,
}: {
  users: UserListItem[];
  total: number | null;
  loading: boolean;
  searchText: string;
  roleFilter: "ALL" | Role;
  roleOptions: RoleOption[];
  hasMore: boolean;
  onSearchTextChange: (value: string) => void;
  onSearch: (event: FormEvent) => void;
  onRoleFilterChange: (value: "ALL" | Role) => void;
  onLoadMore: () => void;
  onEdit: (user: UserListItem) => void;
  onChangePassword: (user: UserListItem) => void;
  onDeactivate: (user: UserListItem) => void;
}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    const list = sentinel?.parentElement;
    if (!sentinel || !list || !hasMore || loading) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onLoadMore();
    }, { root: list, rootMargin: "64px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <section className="soft-card admin-account-card">
      <div className="admin-card-heading"><h3>관리자 계정 목록</h3><span>총 <strong>{total?.toLocaleString("ko-KR") ?? "—"}</strong>명</span></div>
      <form className="admin-account-filters" onSubmit={onSearch}>
        <label className="admin-account-search"><Icon name="search" /><span className="sr-only">관리자 검색</span><input value={searchText} onChange={(event) => onSearchTextChange(event.target.value)} placeholder="이름, 이메일 검색" /></label>
        <SoftDropdown
          className="admin-role-filter"
          label="권한 필터"
          hideLabel
          value={roleFilter}
          options={[{ value: "ALL", label: "전체 권한" }, ...roleOptions.filter((role) => role.value === "ADMIN" || role.value === "OPERATOR").map((role) => ({ value: role.value, label: role.value === "ADMIN" ? "총괄 (SA)" : "일반/교사 (GA)" }))]}
          onChange={(value) => onRoleFilterChange(value as "ALL" | Role)}
        />
      </form>

      <div className="admin-account-list" aria-busy={loading} onScroll={(event) => {
        const list = event.currentTarget;
        if (hasMore && !loading && list.scrollHeight - list.scrollTop - list.clientHeight < 64) onLoadMore();
      }}>
        {loading && !total ? Array.from({ length: 3 }).map((_, index) => <div className="admin-account-skeleton" key={index}><i /><span /></div>) : users.length ? users.map((user) => (
          <article className="admin-account-item" key={user.id}>
            <span className="admin-list-avatar">{user.name.slice(0, 1)}</span>
            <div className="admin-account-copy"><div>{user.role === "OPERATOR" ? <Link className="admin-name-link" href={`/admin/users/${encodeURIComponent(user.id)}?name=${encodeURIComponent(user.name)}&position=${encodeURIComponent(user.position ?? "")}`}>{user.name}{user.position && <em> {user.position}</em>}</Link> : <strong>{user.name}{user.position && <em> {user.position}</em>}</strong>}<SoftBadge tone="info">{user.role === "ADMIN" ? "SA" : user.role === "OPERATOR" ? "GA" : user.roleLabel}</SoftBadge></div><span>{user.email}</span></div>
            <div className="admin-account-side"><strong className={user.active ? "active" : "inactive"}>{user.active ? "활성" : "중지"}</strong><time dateTime={user.createdAt}>{new Date(user.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })}</time><div className="admin-account-actions"><button type="button" onClick={() => onEdit(user)} aria-label={`${user.name} 정보 수정`} title="정보 수정"><Icon name="edit" /></button><button type="button" onClick={() => onChangePassword(user)} aria-label={`${user.name} 비밀번호 변경`} title="비밀번호 변경"><Icon name="key" /></button><button className="danger" type="button" onClick={() => onDeactivate(user)} disabled={!user.active} aria-label={`${user.name} 사용 중지`} title="사용 중지"><Icon name="trash" /></button></div></div>
          </article>
        )) : <div className="admin-account-empty"><Icon name="users" /><strong>조건에 맞는 계정이 없습니다.</strong><span>검색어나 권한 필터를 변경해주세요.</span></div>}
        <div className="admin-account-load-sentinel" ref={loadMoreRef} aria-hidden={!loading}>{loading && users.length > 0 && <div className="admin-account-load-more" role="status"><span className="spinner" />계정을 더 불러오는 중입니다.</div>}</div>
      </div>
    </section>
  );
}
