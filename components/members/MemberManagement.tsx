"use client";

import { Icon } from "@/components/Icon";
import { StudentImportModal } from "@/components/members/StudentImportModal";
import importStyles from "@/components/members/StudentImportModal.module.css";
import { showToast } from "@/components/feedback/Toast";
import { SoftButton, SoftDropdown, SoftInput, SoftModal } from "@/components/soft/Soft";
import { PersonAvatar, StatusPill, WorkspaceEmpty, WorkspaceSearch, WorkspaceTabs } from "@/components/workspace/WorkspaceUi";
import {
  apiErrorMessage,
  approveGuardianConnection,
  deactivateStudent,
  getActiveTeachers,
  getGuardianConnections,
  getPhotoConsentHistory,
  getStudents,
  rejectGuardianConnection,
  updatePhotoConsent,
  updateStudent,
  type GuardianConnectionListItem,
  type PhotoConsentStatus,
  type StudentListItem,
  type StudentPhotoConsentHistoryItem,
} from "@/lib/incites-api";
import type { UserListItem } from "@/lib/types";
import { formatStudentAge } from "@/lib/student";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type MemberTab = "students" | "connections" | "consents";
type AgreementMode = "history" | "consent";

interface StudentFormState {
  studentCode: string;
  name: string;
  birthDate: string;
  age: string;
  teacherId: string;
  active: boolean;
}

const tabs = [
  { id: "students", label: "전체 학생 목록" },
  { id: "connections", label: "보호자 연결 승인 대기" },
  { id: "consents", label: "촬영 동의 관리" },
] as const;

const consentOptions = [
  { value: "CONSENTED", label: "동의" },
  { value: "DENIED", label: "미동의(사진통제)", selectedLabel: "미동의" },
  { value: "PENDING", label: "보류" },
];

const emptyStudentForm: StudentFormState = {
  studentCode: "",
  name: "",
  birthDate: "",
  age: "",
  teacherId: "",
  active: true,
};

function consentLabel(status: PhotoConsentStatus) {
  if (status === "CONSENTED") return "동의";
  if (status === "DENIED") return "미동의";
  return "보류";
}

function formatDate(value: string | null, includeTime = false) {
  if (!value) return "기록 없음";
  if (!includeTime) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(new Date(value));
}

export function MemberManagement({ initialTab }: { initialTab: "students" | "connections" }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MemberTab>(initialTab);
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [studentPage, setStudentPage] = useState(0);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentTotalPages, setStudentTotalPages] = useState(0);
  const loadSequence = useRef(0);
  const [connections, setConnections] = useState<GuardianConnectionListItem[]>([]);
  const [approvedConnections, setApprovedConnections] = useState<GuardianConnectionListItem[]>([]);
  const [teachers, setTeachers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentListItem | null>(null);
  const [studentForm, setStudentForm] = useState<StudentFormState>(emptyStudentForm);
  const [deactivateTarget, setDeactivateTarget] = useState<StudentListItem | null>(null);
  const [connectionTarget, setConnectionTarget] = useState<GuardianConnectionListItem | null>(null);
  const [agreementStudent, setAgreementStudent] = useState<StudentListItem | null>(null);
  const [agreementMode, setAgreementMode] = useState<AgreementMode>("history");
  const [consentHistory, setConsentHistory] = useState<StudentPhotoConsentHistoryItem[]>([]);

  const loadData = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    try {
      if (activeTab === "connections") {
        const response = await getGuardianConnections();
        if (sequence === loadSequence.current) setConnections(response.items);
        return;
      }

      const [studentResult, teacherResult, approvedConnectionResult] = await Promise.allSettled([
        getStudents(activeTab === "students" ? { query: search.trim(), page: studentPage, size: 20 } : {}),
        getActiveTeachers(),
        getGuardianConnections({ status: "APPROVED" }),
      ]);
      if (sequence !== loadSequence.current) return;
      const failures: string[] = [];
      if (studentResult.status === "fulfilled") {
        setStudents(studentResult.value.items);
        setStudentTotal(studentResult.value.total);
        setStudentTotalPages(studentResult.value.totalPages);
        if (activeTab === "students" && studentPage > 0 && studentPage >= studentResult.value.totalPages) {
          setStudentPage(Math.max(0, studentResult.value.totalPages - 1));
        }
      }
      else failures.push(`학생 목록: ${apiErrorMessage(studentResult.reason, "정보를 불러오지 못했습니다.")}`);
      if (teacherResult.status === "fulfilled") setTeachers(teacherResult.value);
      else failures.push(`담당 강사 목록: ${apiErrorMessage(teacherResult.reason, "정보를 불러오지 못했습니다.")}`);
      if (approvedConnectionResult.status === "fulfilled") setApprovedConnections(approvedConnectionResult.value.items);
      else failures.push(`보호자 연결 정보: ${apiErrorMessage(approvedConnectionResult.reason, "정보를 불러오지 못했습니다.")}`);
      if (failures.length) showToast(failures.join("\n"), { tone: "error", duration: 6000 });
    } catch (reason) {
      showToast(`보호자 연결 요청: ${apiErrorMessage(reason, "정보를 불러오지 못했습니다.")}`, { tone: "error" });
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [activeTab, search, studentPage]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 200);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const filteredStudents = students;
  const approvedGuardianByStudent = useMemo(() => new Map(
    approvedConnections.map((connection) => [connection.studentId, connection.parentName]),
  ), [approvedConnections]);

  function changeTab(tab: MemberTab) {
    setActiveTab(tab);
    if (tab === "students") router.replace("/admin/members/students");
    if (tab === "connections") router.replace("/admin/members/guardians");
  }

  function openEditStudent(student: StudentListItem) {
    setEditingStudent(student);
    setStudentForm({
      studentCode: student.studentCode,
      name: student.name,
      birthDate: student.birthDate,
      age: student.age == null ? "" : String(student.age),
      teacherId: student.teacherId ?? "",
      active: student.active,
    });
    setStudentFormOpen(true);
  }

  function updateStudentForm<K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) {
    setStudentForm((current) => ({ ...current, [key]: value }));
  }

  async function submitStudent(event: FormEvent) {
    event.preventDefault();
    if (!editingStudent) return;
    setSaving(true);
    try {
      await updateStudent(editingStudent.id, {
        name: studentForm.name,
        birthDate: studentForm.birthDate,
        age: studentForm.age === "" ? null : Number(studentForm.age),
        teacherId: studentForm.teacherId,
        active: studentForm.active,
      });
      showToast(`${studentForm.name} 학생 정보를 수정했습니다.`, { tone: "success" });
      setStudentFormOpen(false);
      await loadData();
    } catch (reason) {
      showToast(apiErrorMessage(reason, "학생 정보를 저장하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    setSaving(true);
    try {
      await deactivateStudent(deactivateTarget.id);
      showToast(`${deactivateTarget.name} 학생을 사용 중지했습니다.`, { tone: "success" });
      setDeactivateTarget(null);
      setStudentFormOpen(false);
      await loadData();
    } catch (reason) {
      showToast(apiErrorMessage(reason, "학생을 사용 중지하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function decideConnection(action: "approve" | "reject") {
    if (!connectionTarget) return;
    setSaving(true);
    try {
      if (action === "approve") await approveGuardianConnection(connectionTarget.id);
      else await rejectGuardianConnection(connectionTarget.id);
      setConnections((current) => current.filter((item) => item.id !== connectionTarget.id));
      showToast(`${connectionTarget.parentName} 보호자의 연결 요청을 ${action === "approve" ? "승인" : "거절"}했습니다.`, { tone: "success" });
      setConnectionTarget(null);
    } catch (reason) {
      showToast(apiErrorMessage(reason, "보호자 연결 요청을 처리하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function changeConsent(student: StudentListItem, status: PhotoConsentStatus) {
    if (status === student.photoConsentStatus) return;
    if (status === "CONSENTED") {
      void openAgreement(student, "consent");
      return;
    }

    setSaving(true);
    try {
      await updatePhotoConsent(student.id, status);
      const changedStudent = { ...student, photoConsentStatus: status, updatedAt: new Date().toISOString() };
      setStudents((current) => current.map((item) => item.id === student.id ? changedStudent : item));
      showToast(`${student.name} 학생의 촬영 동의 상태를 변경했습니다.`, { tone: "success" });
    } catch (reason) {
      showToast(apiErrorMessage(reason, "촬영 동의 상태를 변경하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  function closeAgreement() {
    setAgreementStudent(null);
    setAgreementMode("history");
    setConsentHistory([]);
  }

  async function openAgreement(student: StudentListItem, mode: AgreementMode = "history") {
    setAgreementMode(mode);
    setAgreementStudent(student);
    setConsentHistory([]);
    try {
      setConsentHistory(await getPhotoConsentHistory(student.id));
    } catch (reason) {
      showToast(apiErrorMessage(reason, "촬영 동의 변경 이력을 불러오지 못했습니다."), { tone: "error" });
    }
  }

  async function confirmAgreement() {
    if (!agreementStudent) return;
    if (agreementMode === "history") {
      closeAgreement();
      return;
    }

    setSaving(true);
    try {
      await updatePhotoConsent(agreementStudent.id, "CONSENTED");
      const changedStudent = { ...agreementStudent, photoConsentStatus: "CONSENTED" as const, updatedAt: new Date().toISOString() };
      setStudents((current) => current.map((item) => item.id === agreementStudent.id ? changedStudent : item));
      showToast(`${agreementStudent.name} 학생의 촬영 동의 상태를 변경했습니다.`, { tone: "success" });
      closeAgreement();
    } catch (reason) {
      showToast(apiErrorMessage(reason, "촬영 동의 상태를 변경하지 못했습니다."), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  const teacherOptions = [
    { value: "", label: "미배정" },
    ...teachers.map((teacher) => ({ value: teacher.id, label: `${teacher.name}${teacher.position ? ` · ${teacher.position}` : ""}` })),
  ];

  return (
    <div className="member-page page-stack workspace-page">
      <div className="page-heading">
        <div><h2>학생 및 보호자 연결관리</h2><p>원생 데이터 마스터 관리, 보호자 연결 승인, 수업 사진 촬영 동의서 수집 현황을 통합 통제합니다.</p></div>
      </div>

      <section className="soft-card workspace-card member-workspace-card" aria-busy={loading}>
        <WorkspaceTabs tabs={tabs} active={activeTab} onChange={changeTab} label="사용자 관리" />

        {activeTab === "students" && <div className="workspace-tab-panel">
          <div className="workspace-toolbar"><WorkspaceSearch value={search} onChange={(value) => { setSearch(value); setStudentPage(0); }} placeholder="학생명, 코드 검색" /><div className="member-toolbar-actions"><span>총 {studentTotal}명</span><SoftButton className="member-bulk-button" variant="dark" onClick={() => setImportOpen(true)}><Icon name="file" />엑셀 일괄 등록</SoftButton></div></div>
          <div className="workspace-table-scroll"><table className="workspace-table member-table" style={{ minWidth: 1280 }}><thead><tr>{["학생 정보", "인증 코드", "나이", "생년월일", "담당교사", "보호자 연결", "촬영 동의", "누적 기록", "최근 관찰일"].map((label, index) => <th key={label} scope="col" style={{ width: `${[14, 13, 6, 11, 9, 14, 12, 9, 12][index]}%` }}>{label}</th>)}</tr></thead><tbody>
            {loading ? <tr className="workspace-empty-table-row"><td colSpan={9}><div className="workspace-empty"><span className="spinner" /><strong>학생 목록을 불러오고 있습니다.</strong></div></td></tr> : filteredStudents.length ? filteredStudents.map((student) => <tr key={student.id}>
              <td><button className="person-cell member-student-edit" type="button" onClick={() => openEditStudent(student)} aria-label={`${student.name} 정보 수정`}><PersonAvatar name={student.name} size="small" /><span><strong>{student.name}</strong><small>{formatStudentAge(student.age)}</small></span></button></td>
              <td><strong className="link-text">{student.studentCode}</strong></td>
              <td>{formatStudentAge(student.age)}</td>
              <td>{formatDate(student.birthDate)}</td>
              <td>{student.teacherName ?? "미배정"}</td>
              <td>{student.parentConnectionStatus === "APPROVED" ? <span className="member-connection-status complete"><Icon name="check" />연결 완료{approvedGuardianByStudent.get(student.id) ? ` (${approvedGuardianByStudent.get(student.id)})` : ""}</span> : <span className={`member-connection-status ${student.parentConnectionStatus === "PENDING" ? "pending" : "unconnected"}`}>{student.parentConnectionStatus === "PENDING" ? "승인 대기" : "미연결"}</span>}</td>
              <td><StatusPill tone={student.photoConsentStatus === "CONSENTED" ? "blue" : student.photoConsentStatus === "DENIED" ? "red" : "neutral"}>{student.photoConsentStatus === "DENIED" ? "미동의 (사진 차단)" : consentLabel(student.photoConsentStatus)}</StatusPill></td>
              <td><strong>{student.observationCount}건</strong></td>
              <td>{formatDate(student.lastObservedAt)}</td>
            </tr>) : <tr className="workspace-empty-table-row"><td colSpan={9}><WorkspaceEmpty icon="users" title={search ? "조건에 맞는 학생이 없습니다." : "등록된 학생이 없습니다."} description={search ? "검색어를 변경하거나 전체 목록을 확인해주세요." : "학생을 신규 등록하면 이곳에서 관리할 수 있습니다."} /></td></tr>}
          </tbody></table></div>
          <div className={importStyles.pagination} style={{ marginTop: 16 }}>
            <span>페이지당 20명</span><div>
              <SoftButton variant="secondary" size="small" disabled={loading || studentPage === 0} onClick={() => setStudentPage((page) => page - 1)} aria-label="학생 목록 이전 페이지"><Icon name="chevron-left" /></SoftButton>
              <span>{studentPage + 1} / {Math.max(1, studentTotalPages)}</span>
              <SoftButton variant="secondary" size="small" disabled={loading || studentPage + 1 >= studentTotalPages} onClick={() => setStudentPage((page) => page + 1)} aria-label="학생 목록 다음 페이지"><Icon name="chevron-right" /></SoftButton>
            </div>
          </div>
        </div>}

        {activeTab === "connections" && <div className="workspace-tab-panel">
          <div className="section-copy"><h3>보호자 자녀 연결 처리</h3><p>학생 코드로 신청한 보호자 계정을 확인한 뒤 승인하거나 거절합니다.</p></div>
          <div className="connection-grid">{loading ? <div className="connection-empty"><span className="spinner" /><strong>연결 요청을 불러오고 있습니다.</strong></div> : connections.length ? connections.map((connection) => <article key={connection.id}><div><span>신청자: <strong>{connection.parentName}</strong></span><small>대상: <b>{connection.studentName} · {connection.studentCode}</b></small><time>신청 시각: {formatDate(connection.requestedAt, true)}</time></div><SoftButton size="small" onClick={() => setConnectionTarget(connection)}>요청 검토</SoftButton></article>) : <div className="connection-empty"><Icon name="check" /><strong>처리할 연결 신청이 없습니다.</strong></div>}</div>
        </div>}

        {activeTab === "consents" && <div className="workspace-tab-panel">
          <div className="section-copy"><h3>수업 사진 촬영 및 활용 동의 통제</h3><p>미동의 학생은 향후 사진 업로드 API에서도 서버 권한 검증을 거쳐 차단됩니다.</p></div>
          <div className="consent-grid">{loading ? <div className="connection-empty"><span className="spinner" /><strong>촬영 동의 현황을 불러오고 있습니다.</strong></div> : students.length ? students.map((student) => <article key={student.id}>
            <button className="consent-student-summary" type="button" onClick={() => void openAgreement(student)} aria-label={`${student.name} 촬영 동의 이력 보기`}>
              <PersonAvatar name={student.name} />
              <span><strong>{student.name}</strong><small>{formatStudentAge(student.age)}</small></span>
            </button>
            <SoftDropdown
              className={`consent-status-select ${student.photoConsentStatus === "CONSENTED" ? "consented" : student.photoConsentStatus === "DENIED" ? "danger" : "pending"}`}
              label={`${student.name} 촬영 동의 상태`}
              value={student.photoConsentStatus}
              options={consentOptions}
              menuPlacement="auto"
              onChange={(value) => void changeConsent(student, value as PhotoConsentStatus)}
              hideLabel
            />
          </article>) : <WorkspaceEmpty icon="users" title="촬영 동의를 관리할 학생이 없습니다." description="학생을 등록하면 촬영 동의 상태를 관리할 수 있습니다." />}</div>
        </div>}
      </section>

      {importOpen && <StudentImportModal onClose={() => setImportOpen(false)} onImported={loadData} />}

      <SoftModal open={Boolean(connectionTarget)} title="보호자 연결 요청 검토" description="승인하면 보호자 계정에서 연결된 자녀 정보를 확인할 수 있습니다." onClose={() => !saving && setConnectionTarget(null)} footer={<><SoftButton variant="danger" disabled={saving} onClick={() => void decideConnection("reject")}>연결 거절</SoftButton><SoftButton disabled={saving} onClick={() => void decideConnection("approve")}>연결 승인</SoftButton></>}>
        <div className="approval-summary"><Icon name="link" /><p><strong>{connectionTarget?.parentName}</strong> 보호자가 <strong>{connectionTarget?.studentName}</strong> 학생과의 연결을 요청했습니다.</p></div>
      </SoftModal>

      <SoftModal className="admin-modal" open={studentFormOpen} title="학생 정보 수정" description="학생 기본정보와 담당 강사를 입력해주세요." onClose={() => !saving && setStudentFormOpen(false)} footer={<>{editingStudent && <SoftButton variant="danger" type="button" disabled={saving} onClick={() => setDeactivateTarget(editingStudent)}>사용 중지</SoftButton>}<SoftButton variant="secondary" type="button" disabled={saving} onClick={() => setStudentFormOpen(false)}>취소</SoftButton><SoftButton type="submit" form="student-form" disabled={saving || !studentForm.name || !studentForm.birthDate}>{saving ? "저장 중..." : "저장"}</SoftButton></>}>
        <form id="student-form" className="user-form" onSubmit={submitStudent}>
          <div className="form-grid">
            <SoftInput label="학생 코드 *" value={studentForm.studentCode} onChange={(event) => updateStudentForm("studentCode", event.target.value)} placeholder="STU-2026-001" disabled={Boolean(editingStudent)} required />
            <SoftInput label="학생 이름 *" value={studentForm.name} onChange={(event) => updateStudentForm("name", event.target.value)} required />
            <SoftInput label="생년월일 *" type="date" value={studentForm.birthDate} onChange={(event) => updateStudentForm("birthDate", event.target.value)} required />
            <SoftInput label="나이" type="number" min={0} max={150} step={1} value={studentForm.age} onChange={(event) => updateStudentForm("age", event.target.value)} placeholder="나이 입력" />
            <SoftDropdown label="담당 강사" value={studentForm.teacherId} options={teacherOptions} onChange={(value) => updateStudentForm("teacherId", value)} />
          </div>
          {editingStudent && <label className="switch-field"><span><strong>학생 사용</strong><small>중지된 학생은 담당 학생 및 수업 목록에서 제외됩니다.</small></span><input type="checkbox" checked={studentForm.active} onChange={(event) => updateStudentForm("active", event.target.checked)} /><i /></label>}
        </form>
      </SoftModal>

      <SoftModal open={Boolean(deactivateTarget)} title="학생 사용 중지" description="학생 기록은 보존되고 신규 수업 및 관찰 대상에서 제외됩니다." onClose={() => !saving && setDeactivateTarget(null)} footer={<><SoftButton variant="secondary" disabled={saving} onClick={() => setDeactivateTarget(null)}>취소</SoftButton><SoftButton variant="danger" disabled={saving} onClick={() => void confirmDeactivate()}>사용 중지</SoftButton></>}>
        <div className="approval-summary"><Icon name="warning" /><p><strong>{deactivateTarget?.name}</strong> 학생을 사용 중지하시겠습니까?</p></div>
      </SoftModal>

      <SoftModal open={Boolean(agreementStudent)} className="agreement-modal" title={<>초상권 활용 및 사진 촬영 동의서 <span className="agreement-student-badge">{agreementStudent?.name}</span></>} onClose={() => !saving && closeAgreement()}>
        <div className="agreement-copy"><strong>제 1조 (수집 및 활용 목적)</strong><p>본 기관은 교육 과정 내 학생의 관찰 기록 및 학부모 성장 리포트 작성을 위한 목적에 한하여 수업 활동 사진을 수집, 활용합니다.</p><strong>제 2조 (동의 철회 및 제약 사항)</strong><p>학부모는 언제든지 동의를 철회할 수 있으며, 철회 시 시스템상 사진 업로드 기능이 자동 차단됩니다.</p></div>
        <div className="agreement-modal-actions"><span>업데이트일: {formatDate(consentHistory[0]?.changedAt ?? agreementStudent?.updatedAt ?? null)}</span><SoftButton variant="dark" disabled={saving} onClick={() => void confirmAgreement()}>{saving ? "변경 중..." : "확인"}</SoftButton></div>
      </SoftModal>
    </div>
  );
}
