"use client";

import { formatStudentAge } from "@/lib/student";

import { useAnimatedChartValues } from "@/components/charts/useAnimatedChartValues";
import { Icon } from "@/components/Icon";
import { CompetencySymbol } from "@/components/competencies/CompetencySymbol";
import { showToast } from "@/components/feedback/Toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { useUiRole } from "@/components/providers/UiRoleProvider";
import { SoftButton } from "@/components/soft/Soft";
import { PersonAvatar, StatusPill, WorkspaceEmpty, WorkspaceSearch, WorkspaceTabs } from "@/components/workspace/WorkspaceUi";
import {
  apiErrorMessage,
  getAssignedStudents,
  getObservation,
  getObservations,
  getStudent,
  getStudentGrowth,
  getStudents,
  getReports,
  type GrowthReportListItem,
  type ObservationDetail,
  type StudentDetail,
  type StudentGrowth,
  type TeacherAssignedStudent,
} from "@/lib/incites-api";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type StudentTab = "profile" | "observations" | "sessions" | "growth" | "reports";

const competencyLabels: Record<string, string> = {
  I: "주도성",
  N: "탐구력",
  C: "협업력",
  I2: "상상력",
  T: "사고력",
  E: "표현력",
  S: "지속력",
};

const competencyCodes = ["I", "N", "C", "I2", "T", "E", "S"];

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value)) : "기록 없음";
}

function consentLabel(status: StudentDetail["photoConsentStatus"]) {
  if (status === "CONSENTED") return "동의함";
  if (status === "DENIED") return "미동의";
  return "결정 보류";
}

function connectionLabel(status: StudentDetail["parentConnectionStatus"]) {
  if (status === "APPROVED") return "연결 완료";
  if (status === "PENDING") return "승인 대기";
  if (status === "REJECTED") return "연결 거절";
  return "미연결";
}

function StudentGrowthRadar({ values }: { values: number[] }) {
  const animatedValues = useAnimatedChartValues(values);
  const labels = competencyCodes.map((code) => `${code.replace("2", "")} ${competencyLabels[code]}`);
  const centerX = 230;
  const centerY = 180;
  const radius = 142;
  const point = (value: number, index: number, scale = 1) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / values.length;
    const distance = radius * value / 100 * scale;
    return `${centerX + Math.cos(angle) * distance},${centerY + Math.sin(angle) * distance}`;
  };
  const outerPoints = values.map((_, index) => point(100, index));
  return <div className="student-growth-radar"><svg viewBox="0 0 460 365" role="img" aria-label="학생 역량 성장 레이더 차트">{[25, 50, 75, 100].map((level) => <polygon key={level} points={values.map((_, index) => point(level, index)).join(" ")} className="radar-ring" />)}{outerPoints.map((axisPoint, index) => { const [x, y] = axisPoint.split(",").map(Number); return <line key={`axis-${labels[index]}`} x1={centerX} y1={centerY} x2={x} y2={y} className="radar-axis" />; })}<polygon points={animatedValues.map((value, index) => point(value, index)).join(" ")} className="radar-value" />{animatedValues.map((value, index) => { const [x, y] = point(value, index).split(",").map(Number); return <circle key={`point-${labels[index]}`} cx={x} cy={y} r="6.5" className="radar-point" />; })}{values.map((_, index) => { const [x, labelY] = point(100, index, 1.22).split(",").map(Number); const y = index === 0 ? labelY + 12 : labelY; return <text key={labels[index]} x={x} y={y} textAnchor="middle" dominantBaseline="middle">{labels[index]}</text>; })}</svg><span><i />관찰 기록 평균 레벨</span></div>;
}

function growthValues(observations: ObservationDetail[]) {
  return competencyCodes.map((code) => {
    const levels = observations.flatMap((observation) => observation.competencies.filter((item) => item.competencyCode === code).map((item) => Number(item.level.slice(1))));
    if (!levels.length) return 0;
    return Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length / 4 * 100);
  });
}

export function StudentGrowthManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const { role, effectiveUserId } = useUiRole();
  const isOperator = role === "GA";
  const [students, setStudents] = useState<TeacherAssignedStudent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<StudentDetail | null>(null);
  const [observations, setObservations] = useState<ObservationDetail[]>([]);
  const [growth, setGrowth] = useState<StudentGrowth | null>(null);
  const [reports, setReports] = useState<GrowthReportListItem[]>([]);
  const [activeTab, setActiveTab] = useState<StudentTab>("profile");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadStudents = useCallback(async () => {
    if (!user || !effectiveUserId) return;
    setLoading(true);
    try {
      const items = isOperator
        ? (await getAssignedStudents(effectiveUserId)).items
        : (await getStudents()).items.map((student) => ({
          id: student.id,
          studentCode: student.studentCode,
          name: student.name,
          age: student.age,
          photoConsentStatus: student.photoConsentStatus,
          parentConnectionStatus: student.parentConnectionStatus,
          observationCount: student.observationCount,
          lastObservedAt: student.lastObservedAt,
          active: student.active,
        }));
      setStudents(items);
      setSelectedId((current) => current && items.some((student) => student.id === current) ? current : items[0]?.id ?? null);
      if (!items.length) {
        setSelectedDetail(null);
        setObservations([]);
        setGrowth(null);
        setReports([]);
      }
    } catch (reason) {
      showToast(apiErrorMessage(reason, "담당 학생 목록을 불러오지 못했습니다."), { tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, isOperator, user]);

  const loadStudentData = useCallback(async (studentId: string) => {
    setDetailLoading(true);
    try {
      const [detail, observationPage, growthResult, reportPage] = await Promise.all([
        getStudent(studentId),
        getObservations({ studentId, page: 0, size: 20 }),
        getStudentGrowth(studentId),
        getReports({ studentId }),
      ]);
      const observationDetails = await Promise.all(observationPage.items.map((observation) => getObservation(observation.id)));
      setSelectedDetail(detail);
      setObservations(observationDetails);
      setGrowth(growthResult);
      setReports(reportPage.items);
    } catch (reason) {
      showToast(apiErrorMessage(reason, "학생 상세 기록을 불러오지 못했습니다."), { tone: "error" });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStudents(), 0);
    return () => window.clearTimeout(timer);
  }, [loadStudents]);

  useEffect(() => {
    if (!selectedId) return;
    const timer = window.setTimeout(() => void loadStudentData(selectedId), 0);
    return () => window.clearTimeout(timer);
  }, [loadStudentData, selectedId]);

  const selected = students.find((student) => student.id === selectedId) ?? null;
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ko-KR");
    return students.filter((student) => !query || [student.name, student.studentCode].some((value) => value.toLocaleLowerCase("ko-KR").includes(query)));
  }, [search, students]);
  const values = growth ? competencyCodes.map((code) => growth.competencies.find((item) => item.code === code)?.averageScore ?? 0) : growthValues(observations);
  const observationCoverage = useMemo(() => competencyCodes.map((code) => ({
    code,
    label: competencyLabels[code],
    count: growth?.competencies.find((item) => item.code === code)?.assessmentCount
      ?? observations.filter((observation) => observation.competencies.some((item) => item.competencyCode === code)).length,
  })), [growth, observations]);
  const tabs = [
    { id: "profile", label: "기본정보" },
    { id: "observations", label: "관찰 현황" },
    { id: "sessions", label: `회차별 기록 (${observations.length}건)` },
    { id: "growth", label: "성장 추이" },
    { id: "reports", label: "리포트" },
  ] as const;

  return <div className="student-growth-page page-stack workspace-page">
    <div className="page-heading"><div><h2>학생 성장 관리</h2><p>담당 학생의 기본정보, 회차별 관찰 로그와 역량별 평균 레벨을 확인합니다.</p></div>{isOperator && <SoftButton className="student-new-observation-button" variant="dark" onClick={() => router.push("/admin/observations/write")}><Icon name="plus" />새 관찰 기록 작성</SoftButton>}</div>
    <div className="student-management-layout">
      <aside className="soft-card student-selector-panel" aria-busy={loading}><WorkspaceSearch value={search} onChange={setSearch} placeholder="학생 검색" /><div className="student-selector-list">{loading ? <div className="workspace-empty"><span className="spinner" /><strong>학생 목록을 불러오고 있습니다.</strong></div> : filtered.length ? filtered.map((student) => <button type="button" className={student.id === selected?.id ? "active" : ""} key={student.id} onClick={() => setSelectedId(student.id)}><PersonAvatar name={student.name} size="small" /><span><strong>{student.name}</strong><small>{formatStudentAge(student.age)} ({student.studentCode})</small></span><b>{student.observationCount}건</b><time>{formatDate(student.lastObservedAt)}</time></button>) : <WorkspaceEmpty icon="users" title="담당 학생이 없습니다." description="총괄관리자에게 학생 배정을 요청해주세요." />}</div></aside>
      <section className="soft-card student-detail-panel" aria-busy={detailLoading}>
        {!selected ? <WorkspaceEmpty icon="users" title="학생을 선택할 수 없습니다." description="담당 학생이 배정되면 상세정보가 표시됩니다." /> : <>
          <header className="student-detail-heading"><PersonAvatar name={selected.name} /><div><h3>{selected.name} <StatusPill tone="blue">{selected.studentCode}</StatusPill></h3><p>{formatStudentAge(selected.age)}</p></div>{isOperator && <SoftButton className="student-start-observation-button" size="small" onClick={() => router.push(`/admin/observations/write?studentId=${encodeURIComponent(selected.id)}`)}><Icon name="plus" />관찰 기록 시작</SoftButton>}</header>
          <WorkspaceTabs tabs={tabs} active={activeTab} onChange={setActiveTab} label="학생 상세" />

          {detailLoading ? <div className="student-detail-content"><div className="workspace-empty"><span className="spinner" /><strong>학생 기록을 불러오고 있습니다.</strong></div></div> : <>
            {activeTab === "profile" && selectedDetail && <div className="student-detail-content"><dl className="student-profile-grid"><div><dt>학생 코드:</dt><dd>{selectedDetail.studentCode}</dd></div><div><dt>나이:</dt><dd>{selectedDetail.age == null ? "미등록" : `${selectedDetail.age}세`}</dd></div><div><dt>생년월일:</dt><dd>{selectedDetail.birthDate}</dd></div><div><dt>담당 강사:</dt><dd>{selectedDetail.teacherName ?? "미배정"}</dd></div><div><dt>촬영 동의 상태:</dt><dd><StatusPill tone={selectedDetail.photoConsentStatus === "CONSENTED" ? "green" : selectedDetail.photoConsentStatus === "DENIED" ? "red" : "orange"}>{consentLabel(selectedDetail.photoConsentStatus)}</StatusPill></dd></div><div><dt>자녀 연결 상태:</dt><dd><StatusPill tone={selectedDetail.parentConnectionStatus === "APPROVED" ? "green" : "orange"}>{connectionLabel(selectedDetail.parentConnectionStatus)}</StatusPill></dd></div></dl></div>}

            {activeTab === "observations" && (
              <div className="student-detail-content observation-coverage-content">
                <p className="observation-coverage-intro">INCITES 7대 영역별 관찰 기록 누적 횟수입니다. 미기록 영역 클릭 시 관찰 작성을 시작합니다.</p>
                <div className="observation-coverage-grid">
                  {observationCoverage.map((item) => {
                    const isEmpty = item.count === 0;
                    return (
                      <button
                        type="button"
                        className={`observation-coverage-item${isEmpty ? " empty" : ""}`}
                        disabled={!isEmpty || !isOperator}
                        onClick={() => router.push(`/admin/observations/write?studentId=${encodeURIComponent(selected.id)}&competency=${encodeURIComponent(item.code)}`)}
                        aria-label={`${item.label} 관찰 ${item.count}회${isEmpty && isOperator ? ", 관찰 기록 작성" : ""}`}
                        key={item.code}
                      >
                        <CompetencySymbol code={item.code} size={48} />
                        <strong>{item.label}</strong>
                        <b>{item.count}회 기록</b>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "sessions" && <div className="student-detail-content session-timeline">{observations.length ? observations.map((observation) => <article key={observation.id}><div><h4>{observation.sessionRound}회차 - {observation.topic}</h4><time>{formatDate(observation.lessonAt)}</time></div><p>{observation.comment || "관찰 코멘트가 없습니다."}</p><StatusPill tone="blue">{observation.competencies.map((item) => `${item.competencyCode} ${item.level}`).join(" · ")}</StatusPill></article>) : <WorkspaceEmpty icon="file" title="회차별 기록이 없습니다." description="관찰 기록을 저장하면 여기에 표시됩니다." />}</div>}

            {activeTab === "growth" && <div className="student-detail-content growth-content">{observations.length ? <StudentGrowthRadar values={values} /> : <WorkspaceEmpty icon="file" title="성장 추이를 계산할 수 없습니다." description="역량 평가가 포함된 관찰 기록이 필요합니다." />}</div>}

            {activeTab === "reports" && <div className="student-detail-content session-timeline">{reports.length ? reports.map((report) => <article key={report.id}><div><h4>{report.title}</h4><time>{formatDate(report.publishedAt ?? report.updatedAt)}</time></div><p>관찰 {report.observationCount}건 · {report.status === "PUBLISHED" ? "공개됨" : report.status === "REVIEWED" ? "검토 완료" : "초안"}</p></article>) : <WorkspaceEmpty icon="file" title="생성된 리포트가 없습니다." description="리포트 검토 화면에서 기간별 리포트를 생성할 수 있습니다." />}</div>}
          </>}
        </>}
      </section>
    </div>
  </div>;
}
