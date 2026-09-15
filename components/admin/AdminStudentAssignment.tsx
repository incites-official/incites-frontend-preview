"use client";

import { formatStudentAge } from "@/lib/student";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { showToast } from "@/components/feedback/Toast";
import { Icon } from "@/components/Icon";
import { SoftButton, SoftModal } from "@/components/soft/Soft";
import { PersonAvatar, StatusPill } from "@/components/workspace/WorkspaceUi";
import { apiErrorMessage, assignStudents, getStudents, getUser, type StudentListItem } from "@/lib/incites-api";
import styles from "./StudentAssignmentView.module.css";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type StudentView = "cards" | "table";

async function loadAllStudents() {
  const firstPage = await getStudents({ page: 0, size: 100 });
  if (firstPage.totalPages <= 1) return firstPage.items;
  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) => getStudents({ page: index + 1, size: 100 })),
  );
  return [...firstPage.items, ...remainingPages.flatMap((page) => page.items)];
}

function ViewSwitch({ value, onChange }: { value: StudentView; onChange: (view: StudentView) => void }) {
  return <div className={styles.viewSwitch} role="group" aria-label="학생 보기 방식">
    <button type="button" aria-pressed={value === "cards"} onClick={() => onChange("cards")}><Icon name="dashboard" />카드 보기</button>
    <button type="button" aria-pressed={value === "table"} onClick={() => onChange("table")}><Icon name="menu" />테이블 보기</button>
  </div>;
}

function StudentAssignmentTable({ students, assignedIds, selectedIds, onToggle, onToggleAll, disabled = false, confirmation = false }: {
  students: StudentListItem[];
  assignedIds: Set<string>;
  selectedIds: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: () => void;
  disabled?: boolean;
  confirmation?: boolean;
}) {
  const selectable = students.filter((student) => !assignedIds.has(student.id));
  const selectedCount = selectable.filter((student) => selectedIds.has(student.id)).length;
  return <div className={`workspace-table-scroll ${styles.tableContainer} ${confirmation ? styles.confirmationTable : ""}`}>
    <table className={`workspace-table member-table ${styles.table}`} aria-label={confirmation ? "배정할 학생 목록" : "학생 배정 목록"}>
      <thead><tr>
        {!confirmation && <th scope="col" className={styles.selectionColumn}><input type="checkbox" aria-label="검색 결과의 배정 가능한 학생 모두 선택" disabled={disabled || !selectable.length} checked={selectable.length > 0 && selectedCount === selectable.length} ref={(element) => { if (element) element.indeterminate = selectedCount > 0 && selectedCount < selectable.length; }} onChange={onToggleAll} /></th>}
        <th scope="col" className={styles.studentColumn}>학생 정보</th><th scope="col" className={styles.codeColumn}>인증 코드</th><th scope="col" className={styles.ageColumn}>나이</th><th scope="col" className={styles.dateColumn}>생년월일</th><th scope="col">현재 담당교사</th>{!confirmation && <th scope="col">배정 상태</th>}
      </tr></thead>
      <tbody>{students.map((student) => {
        const assigned = assignedIds.has(student.id);
        const selected = selectedIds.has(student.id);
        return <tr key={student.id} data-assigned={assigned} data-selected={!confirmation && selected} data-selectable={!confirmation && !assigned && !disabled} onClick={() => { if (!confirmation && !assigned && !disabled) onToggle?.(student.id); }}>
          {!confirmation && <td className={styles.selectionColumn}><input type="checkbox" aria-label={`${student.name} 학생 선택${assigned ? " (배정 완료)" : ""}`} checked={assigned || selected} disabled={disabled || assigned} onClick={(event) => event.stopPropagation()} onChange={() => onToggle?.(student.id)} /></td>}
          <td><div className={styles.studentInfo}><PersonAvatar name={student.name} size="small" /><strong>{student.name}</strong></div></td><td><strong className="link-text">{student.studentCode}</strong></td><td>{formatStudentAge(student.age)}</td><td>{student.birthDate}</td><td>{student.teacherName ?? "미배정"}</td>
          {!confirmation && <td><StatusPill tone={assigned ? "blue" : selected ? "green" : "neutral"}>{assigned ? "배정 완료" : selected ? "선택됨" : student.teacherId ? "재배정 가능" : "미배정"}</StatusPill></td>}
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)) : "기록 없음";
}

export function AdminStudentAssignment({
  administratorId,
  administratorName,
  administratorPosition,
}: {
  administratorId: string;
  administratorName: string;
  administratorPosition: string;
}) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<StudentView>("cards");
  const [administrator, setAdministrator] = useState({ name: administratorName, position: administratorPosition });
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const [studentItems, user] = await Promise.all([
        loadAllStudents(),
        getUser(administratorId),
      ]);
      setStudents(studentItems);
      setAssignedIds(new Set(studentItems.filter((student) => student.teacherId === administratorId).map((student) => student.id)));
      setAdministrator({ name: user.name, position: user.position ?? "" });
    } catch (reason) {
      showToast(apiErrorMessage(reason, "학생 배정 정보를 불러오지 못했습니다."), { tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [administratorId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAssignments(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAssignments]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ko-KR");
    if (!query) return students;
    return students.filter((student) =>
      [student.name, student.studentCode, formatStudentAge(student.age)].some((value) =>
        value.toLocaleLowerCase("ko-KR").includes(query),
      ),
    );
  }, [search, students]);

  const selectedStudents = useMemo(
    () => students.filter((student) => selectedIds.has(student.id)),
    [selectedIds, students],
  );

  function toggleStudent(studentId: string) {
    if (saving || assignedIds.has(studentId)) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function toggleAllVisibleStudents() {
    if (saving) return;
    const selectableIds = filteredStudents.filter((student) => !assignedIds.has(student.id)).map((student) => student.id);
    setSelectedIds((current) => {
      const next = new Set(current);
      const allSelected = selectableIds.every((id) => current.has(id));
      selectableIds.forEach((id) => { if (allSelected) next.delete(id); else next.add(id); });
      return next;
    });
  }

  async function confirmAssignment() {
    const assignmentCount = selectedStudents.length;
    if (!assignmentCount || saving) return;
    setSaving(true);
    try {
      const result = await assignStudents(administratorId, [...selectedIds]);
      setAssignedIds((current) => new Set([...current, ...selectedIds]));
      setStudents((current) => current.map((student) => selectedIds.has(student.id) ? { ...student, teacherId: administratorId, teacherName: result.teacherName } : student));
      setSelectedIds(new Set());
      setConfirmationOpen(false);
      showToast(`${result.teacherName} 강사에게 학생 ${result.changedCount}명을 배정했습니다.`);
    } catch (reason) {
      showToast(apiErrorMessage(reason, "담당 학생을 배정하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGuard roles={["ADMIN"]}>
      <div className="student-assignment-page page-stack">
        <div className="page-heading admin-page-heading">
          <div>
            <h2>관리자 관리</h2>
            <p>센터 내 총괄관리자 및 일반관리자, 교사 계정을 등록하고 기능별 권한 매트릭스를 관리합니다.</p>
          </div>
          <Link className="soft-button dark medium admin-create-button" href="/admin/users?create=1">
            <Icon name="plus" />신규 관리자 등록
          </Link>
        </div>

        <section className="soft-card student-assignment-card" aria-busy={loading}>
          <div className="student-assignment-heading">
            <h3>{administrator.name}{administrator.position && <span> {administrator.position}</span>}</h3>
            <span>총 <strong>{students.length.toLocaleString("ko-KR")}</strong>명</span>
          </div>

          <div className={`student-assignment-toolbar ${styles.toolbar}`}>
            <label className="student-assignment-search">
              <Icon name="search" />
              <span className="sr-only">학생 검색</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="이름, 인증 코드, 나이 검색"
              />
            </label>
            <div className={styles.actions}><ViewSwitch value={view} onChange={setView} /><SoftButton
              className="student-assignment-add"
              type="button"
              disabled={loading || saving || !selectedIds.size}
              onClick={() => setConfirmationOpen(true)}
            >
              학생 추가{selectedIds.size ? ` (${selectedIds.size})` : ""}
            </SoftButton></div>
          </div>

          {loading ? (
            <div className="student-assignment-empty"><span className="spinner" /><strong>학생 배정 정보를 불러오고 있습니다.</strong></div>
          ) : filteredStudents.length ? view === "table" ? (
            <StudentAssignmentTable students={filteredStudents} assignedIds={assignedIds} selectedIds={selectedIds} onToggle={toggleStudent} onToggleAll={toggleAllVisibleStudents} disabled={saving} />
          ) : (
            <div className="student-assignment-grid" aria-label="전체 학생 목록">
              {filteredStudents.map((student) => {
                const assigned = assignedIds.has(student.id);
                const selected = selectedIds.has(student.id);
                return (
                  <button
                    className={`student-assignment-item${assigned ? " assigned" : ""}${selected ? " selected" : ""}`}
                    type="button"
                    key={student.id}
                    aria-pressed={selected}
                    aria-disabled={assigned}
                    aria-label={`${student.name}, ${formatStudentAge(student.age)}, 누적 관찰 ${student.observationCount}건${assigned ? ", 배정 완료" : selected ? ", 배정 대상으로 선택됨" : ""}`}
                    onClick={() => toggleStudent(student.id)}
                  >
                    <span className="student-assignment-avatar" aria-hidden="true">{student.name.slice(0, 1)}</span>
                    <span className="student-assignment-copy">
                      <strong>{student.name}</strong>
                      <small>{formatStudentAge(student.age)} ({student.studentCode})</small>
                    </span>
                    <span className="student-assignment-meta">
                      <strong>{student.observationCount}건</strong>
                      <time>{formatDate(student.lastObservedAt)}</time>
                    </span>
                    {selected && <span className="student-selection-check" aria-hidden="true"><Icon name="check" /></span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="student-assignment-empty">
              <Icon name="search" />
              <strong>검색 결과가 없습니다.</strong>
              <span>학생 이름, 인증 코드 또는 나이를 다시 확인해주세요.</span>
            </div>
          )}
        </section>

        <SoftModal
          className={`student-assignment-modal ${view === "table" ? styles.tableModal : ""}`}
          open={confirmationOpen}
          title="담당 학생 배정"
          description={`${administrator.name} 관리자에게 배정할 학생을 확인해주세요.`}
          onClose={() => !saving && setConfirmationOpen(false)}
          footer={(
            <>
              <SoftButton variant="secondary" type="button" disabled={saving} onClick={() => setConfirmationOpen(false)}>취소</SoftButton>
              <SoftButton type="button" disabled={saving} onClick={() => void confirmAssignment()}>{saving ? "배정 중..." : "배정 확인"}</SoftButton>
            </>
          )}
        >
          <div className="student-assignment-confirmation">
            <div className="assignment-confirmation-summary">
              <span><Icon name="users" /></span>
              <p><strong>{selectedStudents.length}명</strong>의 학생을 담당 학생으로 배정합니다.</p>
            </div>
            <div className={styles.confirmationToolbar}><ViewSwitch value={view} onChange={setView} /></div>
            {view === "table" ? <StudentAssignmentTable students={selectedStudents} assignedIds={assignedIds} selectedIds={selectedIds} confirmation /> : <div className="assignment-confirmation-list">
              {selectedStudents.map((student) => (
                <div key={student.id}>
                  <span>{student.name.slice(0, 1)}</span>
                  <p><strong>{student.name}</strong><small>{formatStudentAge(student.age)} · {student.studentCode}</small></p>
                  <b>{student.observationCount}건</b>
                </div>
              ))}
            </div>}
          </div>
        </SoftModal>
      </div>
    </AuthGuard>
  );
}
